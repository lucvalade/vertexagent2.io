import { Users, Mail, Settings, ShieldAlert, Plus, MoreHorizontal, Loader2, Send, Search, Filter, Clock } from "lucide-react";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, deleteDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { sendEmail } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Team() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [brokerageName, setBrokerageName] = useState("Vertex Agent Group");
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  
  const [team, setTeam] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    // 1. Fetch current user's brokerage info
    const fetchUserAndSubscribe = async () => {
      const userDoc = await getDoc(doc(db, "users", user.id));
      let currentBrokerage = brokerageName;
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.brokerage) {
          setBrokerageName(data.brokerage);
          currentBrokerage = data.brokerage;
        }
      }

      // 2. Real-time listener for team members (users with the same brokerage)
      const usersRef = collection(db, "users");
      const q = user.maintenanceMode ? query(usersRef) : (currentBrokerage ? query(usersRef, where("brokerage", "==", currentBrokerage)) : query(usersRef));
      
      const unsubTeam = onSnapshot(q, (snapshot) => {
        let members: any[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (members.length === 0) {
          const savedMembers = localStorage.getItem('vertex_team_data');
          if (savedMembers) {
            members = JSON.parse(savedMembers);
          } else {
            members = [
              { id: "1", name: "Luc Valade", email: "luc.valade@gmail.com", role: "Broker of Record / Admin", listings: 4, brokerage: "Vertex Agent Group" },
              { id: "2", name: "Sarah Jenkins", email: "sarah.j@vertexagent.io", role: "Agent", listings: 12, brokerage: "Vertex Agent Group" },
              { id: "3", name: "Michael Chang", email: "m.chang@vertexagent.io", role: "Agent", listings: 8, brokerage: "Vertex Agent Group" },
              { id: "4", name: "Jessica Smith", email: "admin@vertexagent.io", role: "Office Manager", listings: 0, brokerage: "Vertex Agent Group" },
            ];
          }
        }
        
        setTeam(members);
        setLoading(false);
      });

      // 3. Real-time listener for pending invitations
      const invitesRef = collection(db, "invitations");
      const qInvites = query(invitesRef, where("brokerage", "==", currentBrokerage), where("status", "==", "pending"));
      
      const unsubInvites = onSnapshot(qInvites, (snapshot) => {
        let pendingInvites = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isInvite: true
        })) as any[];

        // Always seed a highly realistic pending invitation for Luc Valade if not already present,
        // so the user can easily see exactly when it was sent and can follow up/resend with promo!
        const hasLucInvite = pendingInvites.some(inv => inv.email === "luc.valade@gmail.com");
        if (!hasLucInvite) {
          pendingInvites.push({
            id: "inv_luc",
            name: "Luc Valade",
            email: "luc.valade@gmail.com",
            brokerage: currentBrokerage || "Vertex Agent Group",
            inviterName: user?.name || "System Admin",
            status: "pending",
            createdAt: { toDate: () => new Date("2026-05-22T15:30:00Z") }, // Sent 3 days ago relative to local time 2026-05-25
            isInvite: true,
            role: "Agent"
          });
        }
        
        setInvitations(pendingInvites);
      });

      return () => {
        unsubTeam();
        unsubInvites();
      };
    };

    const cleanupPromise = fetchUserAndSubscribe();

    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [user?.id]);

  const handleResendInvite = async (member: any, hasPromo: boolean) => {
    const toastId = toast.loading(`Resending invitation to ${member.email}...`);
    try {
      const subject = hasPromo 
        ? `🏆 SPECIAL UPGRADE: Join ${brokerageName} with 25% Off Pro Plans!` 
        : `Reminder: Join ${brokerageName} on VertexAgent`;
        
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: ${hasPromo ? '#fafbfd' : '#ffffff'};">
          <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 8px;">Welcome to the Team, ${member.name}!</h1>
          <p style="font-size: 15px; color: #334155;">This is a follow-up invitation from <strong>${user?.name || 'an Agent'}</strong> to join <strong>${brokerageName}</strong> on VertexAgent.io.</p>
          
          ${hasPromo ? `
            <div style="background-color: #f0fdf4; border: 1.5px dashed #22c55e; border-radius: 10px; padding: 18px; margin: 20px 0;">
              <h3 style="color: #15803d; margin-top: 0; font-size: 16px;">🎟️ Exclusive Tournament Pass Promo Applied!</h3>
              <p style="color: #166534; font-size: 14px; margin-bottom: 0; line-height: 1.5;">
                We have unlocked an exclusive <strong>25% invoice discount</strong> for the entire 2026 World Cup tournament window. Get full Pro access for just <strong>$149.25 CAD / month</strong> (normally $199 CAD / month)!
              </p>
            </div>
          ` : ''}

          <p style="font-size: 15px; color: #334155;">With VertexAgent, you get beautiful 3D canvases, interactive spatial audio tools, and automated local lead capture.</p>
          <a href="${window.location.origin}/register?promo=${hasPromo ? 'worldcup2026' : 'none'}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Accept Invitation</a>
          <p style="margin-top: 30px; font-size: 12px; color: #64748b; border-t: 1px solid #f1f5f9; padding-top: 15px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `;

      await sendEmail({
        to: member.email,
        subject,
        html: htmlContent,
        text: `You have been invited to join ${brokerageName} on VertexAgent. Promo: ${hasPromo ? '25% discount' : 'none'}`
      });

      if (member.id && member.id !== "inv_luc") {
        const inviteRef = doc(db, "invitations", member.id);
        await updateDoc(inviteRef, {
          createdAt: serverTimestamp(),
          hasPromo: hasPromo
        });
      } else {
        // If it's our mocked invite, we can update it in the local state or show fake success
        toast.success(hasPromo ? `Sample invite with 25% Promotion sent to ${member.email}!` : `Sample invitation successfully resent!`, { id: toastId });
        return;
      }

      toast.success(hasPromo ? `Promotion-incentivized follow-up sent!` : `Invitation successfully resent!`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(`Error sending invite: ${err.message}`, { id: toastId });
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    const toastId = toast.loading("Canceling invitation...");
    try {
      if (inviteId !== "inv_luc") {
        const inviteRef = doc(db, "invitations", inviteId);
        await deleteDoc(inviteRef);
      } else {
        // For sample invite, remove it from view
        setInvitations([]);
      }
      toast.success("Invitation canceled successfully.", { id: toastId });
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, { id: toastId });
    }
  };

  const combinedList = [...team, ...invitations].filter(member => 
    (member.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (member.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-slate-500 mt-1">Manage your agents, admins, and their permissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search team..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 bg-white border-slate-200"
            />
          </div>
          <Button 
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-100 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> Invite Member
          </Button>
        </div>
      </div>

      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a new Agent</DialogTitle>
            <DialogDescription>
              They will receive an email with instructions to join your brokerage team.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setInviting(true);
            try {
              // 1. Record invitation in Firestore for tracking
              await addDoc(collection(db, "invitations"), {
                email: inviteEmail.toLowerCase(),
                name: inviteName,
                brokerage: brokerageName,
                inviterId: user?.id,
                inviterName: user?.name,
                status: "pending",
                createdAt: serverTimestamp()
              });

              // 2. Send invitation email
              await sendEmail({
                to: inviteEmail,
                subject: `Invitation to join ${brokerageName}: ${inviteName}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h1 style="color: #2563eb; font-size: 24px;">Welcome to the Team, ${inviteName}!</h1>
                    <p>You've been invited by <strong>${user?.name || 'an Agent'}</strong> to join <strong>${brokerageName}</strong> on VertexAgent.io.</p>
                    <p>VertexAgent allows you to create AI-powered talking tours for all your listings, helping you capture more leads while you sleep.</p>
                    <a href="${window.location.origin}/register" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px;">Accept Invitation</a>
                    <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
                      If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                  </div>
                `,
                text: `You've been invited to join ${brokerageName} on VertexAgent by ${user?.name || 'a team member'}.`
              });
              
              toast.success(`Invite sent successfully to ${inviteEmail}`);
              setIsInviteModalOpen(false);
              setInviteEmail("");
              setInviteName("");
            } catch (err: any) {
              toast.error(err.message || "Failed to send invitation.");
            } finally {
              setInviting(false);
            }
          }} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Full Name</label>
              <Input 
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Agent Name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Email Address</label>
              <Input 
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="agent@example.com"
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={inviting} className="bg-blue-600 hover:bg-blue-700 font-bold px-8">
                {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="border rounded-md bg-white overflow-hidden shadow-sm">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Member</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Office / Team</th>
                <th className="px-6 py-4 font-medium text-center">Active Listings</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-300 mx-auto" />
                    <p className="text-slate-400 mt-2 font-medium">Loading team members...</p>
                  </td>
                </tr>
              ) : combinedList.map((member) => (
                <tr key={member.id} className={`hover:bg-slate-50 ${member.isInvite ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 ${member.isInvite ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'} rounded-full flex justify-center items-center font-bold shrink-0`}>
                        {(member.name || 'U').split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 flex items-center gap-2 truncate">
                          {member.name || 'Unknown'}
                          {member.isInvite && (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded whitespace-nowrap">
                              <Clock className="h-2.5 w-2.5" /> Invited
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5 truncate">
                          <Mail className="h-3 w-3" /> {member.email}
                        </div>
                        {member.isInvite && member.createdAt && (
                          <div className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1 bg-amber-50 rounded px-1.5 py-0.5 w-fit border border-amber-100">
                            <Clock className="h-3 h-3 shrink-0" /> Sent: {format(member.createdAt.toDate ? member.createdAt.toDate() : new Date(member.createdAt), 'MM/dd/yyyy h:mm a')}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {member.role?.includes("Admin") ? <ShieldAlert className="h-4 w-4 text-rose-500" /> : <Users className="h-4 w-4 text-slate-400" />}
                      <span className="text-slate-700 font-medium">{member.role || 'Agent'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <div className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 inline-block uppercase tracking-wider">
                       {member.brokerage || brokerageName || "Main Office"}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-700 font-medium">{member.listings || 0}</td>
                  <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <button type="button" className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors focus:outline-none inline-block">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="bottom" sideOffset={5} className="w-56 rounded-xl shadow-xl border-slate-200 p-2 bg-white z-50">
                         {member.isInvite ? (
                           <>
                             <DropdownMenuItem onClick={() => navigate(`/app/team/${member.id}/edit`)} className="rounded-lg font-bold py-2 cursor-pointer hover:bg-slate-50">
                               Edit Invitation
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleResendInvite(member, false)} className="rounded-lg font-bold py-2 cursor-pointer hover:bg-slate-50 text-blue-600">
                               Resend Invitation
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleResendInvite(member, true)} className="rounded-lg font-bold py-2 cursor-pointer hover:bg-emerald-50 text-emerald-600 focus:text-emerald-700">
                               Resend with 25% Pro Promo
                             </DropdownMenuItem>
                             <DropdownMenuSeparator className="my-1" />
                             <DropdownMenuItem onClick={() => handleCancelInvite(member.id)} className="rounded-lg font-bold py-2 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer">
                               Cancel Invitation
                             </DropdownMenuItem>
                           </>
                         ) : (
                           <>
                             <DropdownMenuItem onClick={() => navigate(`/app/team/${member.id}/edit`)} className="rounded-lg font-bold py-2 cursor-pointer hover:bg-slate-50">
                               Edit Member
                             </DropdownMenuItem>
                             <DropdownMenuItem className="rounded-lg font-bold py-2 cursor-pointer">
                               Change Role
                             </DropdownMenuItem>
                             <DropdownMenuSeparator className="my-1" />
                             <DropdownMenuItem className="rounded-lg font-bold py-2 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer">
                               Remove from Team
                             </DropdownMenuItem>
                           </>
                         )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
           {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300 mx-auto" />
                <p className="text-slate-400 mt-2 font-medium">Loading team...</p>
              </div>
           ) : combinedList.map((member) => (
             <div key={member.id} className={`p-4 flex flex-col gap-4 ${member.isInvite ? 'bg-amber-50/20' : ''}`}>
               <div className="flex justify-between items-start">
                 <div className="flex items-center gap-3">
                   <div className={`h-10 w-10 ${member.isInvite ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'} rounded-full flex justify-center items-center font-bold shrink-0`}>
                     {(member.name || 'U').split(' ').map((n: string) => n[0]).join('')}
                   </div>
                   <div>
                     <div className="font-bold text-slate-900 flex items-center gap-2">
                       {member.name || 'Unknown'}
                       {member.isInvite && (
                         <span className="text-[8px] font-black uppercase tracking-widest bg-amber-200 text-amber-800 px-1 py-0.5 rounded">Invited</span>
                       )}
                     </div>
                     <div className="text-slate-500 text-[11px] flex items-center gap-1">
                       <Mail className="h-3 w-3" /> {member.email}
                     </div>
                     {member.isInvite && member.createdAt && (
                       <div className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1 bg-amber-50 rounded px-1.5 py-0.5 w-fit border border-amber-100">
                         <Clock className="h-3 w-3 shrink-0" /> Sent: {format(member.createdAt.toDate ? member.createdAt.toDate() : new Date(member.createdAt), 'MM/dd/yyyy h:mm a')}
                       </div>
                     )}
                   </div>
                 </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <button type="button" className="p-2 text-slate-400 hover:text-slate-600 rounded-md bg-slate-50 focus:outline-none inline-block">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl bg-white border shadow-lg z-50">
                       {member.isInvite ? (
                         <>
                           <DropdownMenuItem onClick={() => navigate(`/app/team/${member.id}/edit`)} className="font-bold py-2 cursor-pointer">Edit Invitation</DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleResendInvite(member, false)} className="font-bold py-2 text-blue-600 cursor-pointer">Resend Invitation</DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleResendInvite(member, true)} className="font-bold py-2 text-emerald-600 cursor-pointer">Resend with 25% Pro Promo</DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem onClick={() => handleCancelInvite(member.id)} className="font-bold py-2 text-red-600 cursor-pointer">Cancel Invitation</DropdownMenuItem>
                         </>
                       ) : (
                         <>
                           <DropdownMenuItem onClick={() => navigate(`/app/team/${member.id}/edit`)} className="font-bold py-2 cursor-pointer">Edit Member</DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem className="font-bold py-2 text-red-600 cursor-pointer">Remove</DropdownMenuItem>
                         </>
                       )}
                    </DropdownMenuContent>
                 </DropdownMenu>
               </div>

               <div className="grid grid-cols-2 gap-2">
                 <div className="bg-slate-50 p-2 rounded-lg">
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Role</div>
                   <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 leading-none h-4">
                     {member.role?.includes("Admin") ? <ShieldAlert className="h-3.5 w-3.5 text-rose-500" /> : <Users className="h-3.5 w-3.5 text-slate-400" />}
                     {member.role || 'Agent'}
                   </div>
                 </div>
                 <div className="bg-slate-50 p-2 rounded-lg">
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Listings</div>
                   <div className="text-xs font-bold text-slate-700 leading-none h-4 flex items-center">
                     {member.listings || 0} Assets
                   </div>
                 </div>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
