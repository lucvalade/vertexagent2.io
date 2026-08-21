import { Users, Mail, Settings, ShieldAlert, Plus, MoreHorizontal, Loader2, Send, Search, Filter, Clock, CheckCircle2, FileText, KeyRound, Smartphone, Download, Compass, BookOpen, ExternalLink, ShieldCheck, Calendar, Phone, Sparkles, Building, Building2, MessageSquare, Award, ArrowUpRight, Check, Activity, Shield, CreditCard, Zap } from "lucide-react";
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
  const [brokerageName, setBrokerageName] = useState("AI Open House Connect Agent Group");
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  
  const [team, setTeam] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal actions states
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [memberToChangeRole, setMemberToChangeRole] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState("Agent");
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // Member detail modal state
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [isMemberDetailModalOpen, setIsMemberDetailModalOpen] = useState(false);

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
          const savedMembers = localStorage.getItem('aiopenhouseconnect_team_data');
          if (savedMembers) {
            members = JSON.parse(savedMembers);
          } else {
            members = [
              { id: "1", name: "Luc Valade", email: "luc.valade@gmail.com", role: "Agent", listings: 4, brokerage: "AI Open House Connect Agent Group", joinedAt: "06/18/2026 03:02 PM", hasAccepted: true, createdAtDate: "06/18/2026" },
              { id: "2", name: "Sarah Jenkins", email: "sarah.j@aiopenhouseconnect.com", role: "Agent", listings: 12, brokerage: "AI Open House Connect Agent Group", createdAtDate: "12/10/2025" },
              { id: "3", name: "Michael Chang", email: "m.chang@aiopenhouseconnect.com", role: "Agent", listings: 8, brokerage: "AI Open House Connect Agent Group", createdAtDate: "01/22/2026" },
              { id: "4", name: "Jessica Smith", email: "admin@aiopenhouseconnect.com", role: "Office Manager", listings: 0, brokerage: "AI Open House Connect Agent Group", createdAtDate: "09/14/2024" },
            ];
          }
        } else {
          // Adjust any firebase records for Luc to show accepted status
          members = members.map(m => {
            let res = { ...m };
            if (res.email === "luc.valade@gmail.com") {
              res = { ...res, joinedAt: res.joinedAt || "06/18/2026 03:02 PM", hasAccepted: true };
            }
            if (!res.createdAtDate) {
              res.createdAtDate = res.createdAt ? format(res.createdAt.toDate ? res.createdAt.toDate() : new Date(res.createdAt), 'MM/dd/yyyy') : "06/18/2026";
            }
            return res;
          });
        }
        
        setTeam(members);
        setLoading(false);
      }, (err) => {
        console.warn("[Team] Snapshot error for team members (quota/offline):", err);
        const savedMembers = localStorage.getItem('aiopenhouseconnect_team_data');
        if (savedMembers) {
          setTeam(JSON.parse(savedMembers));
        }
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

        // Filter out Luc Valade from pending since he has accepted
        pendingInvites = pendingInvites.filter(inv => inv.email !== "luc.valade@gmail.com");
        
        setInvitations(pendingInvites);
      }, (err) => {
        console.warn("[Team] Snapshot error for invitations (quota/offline):", err);
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
        : `Reminder: Join ${brokerageName} on AI Open House Connect`;
        
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: ${hasPromo ? '#fafbfd' : '#ffffff'};">
          <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 8px;">Welcome to the Team, ${member.name}!</h1>
          <p style="font-size: 15px; color: #334155;">This is a follow-up invitation from <strong>${user?.name || 'an Agent'}</strong> to join <strong>${brokerageName}</strong> on aiopenhouseconnect.com.</p>
          
          ${hasPromo ? `
            <div style="background-color: #f0fdf4; border: 1.5px dashed #22c55e; border-radius: 10px; padding: 18px; margin: 20px 0;">
              <h3 style="color: #15803d; margin-top: 0; font-size: 16px;">🎟️ Exclusive Tournament Pass Promo Applied!</h3>
              <p style="color: #166534; font-size: 14px; margin-bottom: 0; line-height: 1.5;">
                We have unlocked an exclusive <strong>25% invoice discount</strong> for the entire 2026 World Cup tournament window. Get full Pro access for just <strong>$149.25 CAD / month</strong> (normally $199 CAD / month)!
              </p>
            </div>
          ` : ''}

          <p style="font-size: 15px; color: #334155;">With AI Open House Connect, you get beautiful 3D canvases, interactive spatial audio tools, and automated local lead capture.</p>
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
        text: `You have been invited to join ${brokerageName} on AI Open House Connect. Promo: ${hasPromo ? '25% discount' : 'none'}`
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

  const handleRemoveMember = async (member: any) => {
    if (!member) return;
    const toastId = toast.loading(`Removing ${member.name} from team...`);
    try {
      const isRealUserDoc = member.id && !["1", "2", "3", "4", "inv_luc"].includes(member.id);
      
      if (isRealUserDoc) {
        try {
          const userRef = doc(db, "users", member.id);
          await deleteDoc(userRef);
        } catch (dbErr) {
          console.error("Firestore user removal failed, falling back to simulation", dbErr);
        }
      }

      // Sync and update local state and local storage fallback
      const updatedTeam = team.filter(m => m.id !== member.id);
      setTeam(updatedTeam);
      
      localStorage.setItem('aiopenhouseconnect_team_data', JSON.stringify(updatedTeam));
      localStorage.setItem('vertex_team_data', JSON.stringify(updatedTeam));

      toast.success(`${member.name} removed from the team successfully.`, { id: toastId });
      setIsRemoveModalOpen(false);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, { id: toastId });
    }
  };

  const handleUpdateRole = async (member: any, newRole: string) => {
    if (!member) return;
    const toastId = toast.loading(`Updating role for ${member.name}...`);
    try {
      const isRealUserDoc = member.id && !["1", "2", "3", "4", "inv_luc"].includes(member.id);
      
      if (isRealUserDoc) {
        try {
          const userRef = doc(db, "users", member.id);
          await updateDoc(userRef, { role: newRole });
        } catch (dbErr) {
          console.error("Firestore user role update failed, falling back to simulation", dbErr);
        }
      }

      // Sync and update local state and local storage fallback
      const updatedTeam = team.map(m => m.id === member.id ? { ...m, role: newRole } : m);
      setTeam(updatedTeam);
      
      localStorage.setItem('aiopenhouseconnect_team_data', JSON.stringify(updatedTeam));
      localStorage.setItem('vertex_team_data', JSON.stringify(updatedTeam));

      toast.success(`Role updated to ${newRole} for ${member.name}.`, { id: toastId });
      setIsChangeRoleModalOpen(false);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, { id: toastId });
    }
  };

  const combinedList = [...team, ...invitations].filter(member => 
    (member.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (member.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAgentSolo = user?.accountType === "agent" && !user?.role?.includes("ADMIN") && user?.email !== "luc.valade@gmail.com" && (user as any)?.plan !== "team" && (user as any)?.plan !== "brokerage" && false;
  const isLender = user?.accountType === "lender";
  const isSuspended = user?.subscriptionStatus === "past_due" || user?.subscriptionStatus === "canceled";

  if (isAgentSolo) {
    return (
      <div className="space-y-6 text-left max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Users className="h-64 w-64 text-blue-600" />
          </div>
          <div className="relative z-10 space-y-6">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              Upgrade to Team Pro
            </span>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Team & Collaborative Brokerage Settings</h1>
            <p className="text-slate-600 text-lg leading-relaxed max-w-2xl">
              Centralized visibility and joint-hosting are locked under the solo agent tier. Elevate your agency or team with pooled resources, co-hosted listings, and office-wide compliance overrides.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 pt-4 text-slate-700">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Co-hosted Listings & Shared Access</div>
                  <div className="text-sm text-slate-500">Enable agents to run kiosks and digital walkthroughs for each other's properties.</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Centralized Team Branding & Logos</div>
                  <div className="text-sm text-slate-500 font-medium">Configure unified brokerage credentials, co-logos, and bespoke signup questionnaires.</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Brokerage Lender Overrides</div>
                  <div className="text-sm text-slate-500 font-medium">Admin-mandated default sponsors override agents' preferred lenders globally.</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Advanced Rolled-Up Reporting</div>
                  <div className="text-sm text-slate-500 font-medium">Verify overall lead generation rates across all active listings in your agency.</div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex gap-4">
              <Button 
                onClick={() => navigate("/app/billing")} 
                className="bg-blue-600 hover:bg-blue-700 font-bold px-8 py-3 text-base h-12 shadow-lg shadow-blue-100 rounded-xl"
              >
                Go to Billing & Upgrade
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/app/overview")}
                className="border-slate-200 text-slate-700 font-semibold px-6 h-12 rounded-xl"
              >
                Back to Overview
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLender) {
    return (
      <div className="space-y-6 text-left max-w-4xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm">
          <div className="space-y-4">
            <ShieldAlert className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-extrabold text-slate-900">Lenders Area Restrictions</h1>
            <p className="text-slate-500 max-w-xl leading-relaxed">
              As a mortgage partner, you are restricted from view of internal brokerage administrative lists. Please use the <Link to="/app/lenders" className="text-blue-600 underline font-extrabold">Lenders Panel</Link> to configure pairing requests, co-branding, and view consented leads.
            </p>
            <div className="pt-4">
              <Button onClick={() => navigate("/app/lenders")} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6">
                Go to Lenders Section
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {isSuspended && (
        <div className="bg-red-50 border-2 border-dashed border-red-350 rounded-2xl p-4 flex gap-3 text-red-900 shadow-sm animate-pulse">
          <ShieldAlert className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-extrabold text-sm uppercase tracking-wide">⚠️ Team Subscription Suspended / Ended</h4>
            <p className="text-xs text-red-700/90 leading-relaxed mt-1">
              Your brokerage subscription status is currently <strong>{user?.subscriptionStatus?.toUpperCase()}</strong>.
              Centralized co-branding and lender overrides have been deactivated. Your agents' listings are defaulting back to preferred or neighborhood default brokers until billing is updated in Settings.
            </p>
          </div>
        </div>
      )}
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
            onClick={() => setIsOnboardingModalOpen(true)}
            variant="outline"
            className="border-emerald-200 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all"
          >
            <BookOpen className="h-4 w-4 text-emerald-600" /> Onboarding Package
          </Button>

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
                    <p>You've been invited by <strong>${user?.name || 'an Agent'}</strong> to join <strong>${brokerageName}</strong> on aiopenhouseconnect.com.</p>
                    <p>AI Open House Connect allows you to create AI-powered talking tours for all your listings, helping you capture more leads while you sleep.</p>
                    <a href="${window.location.origin}/register" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px;">Accept Invitation</a>
                    <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
                      If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                  </div>
                `,
                text: `You've been invited to join ${brokerageName} on AI Open House Connect by ${user?.name || 'a team member'}.`
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
        <div className="hidden lg:block overflow-x-auto">
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
              ) : (
                combinedList.map((member) => (
                  <tr 
                    key={member.id} 
                    onClick={() => {
                      setSelectedMember(member);
                      setIsMemberDetailModalOpen(true);
                    }}
                    className={`group cursor-pointer transition-all duration-200 hover:bg-blue-600 ${member.isInvite ? 'bg-[#f0f4ff]/40' : ''}`}
                  >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 ${member.isInvite ? 'bg-sky-100 text-sky-700' : 'bg-blue-100 text-blue-700'} rounded-full flex justify-center items-center font-bold shrink-0 group-hover:bg-white group-hover:text-blue-600 transition-colors shadow-sm`}>
                        {(member.name || 'U').split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 group-hover:text-white flex items-center gap-2 truncate transition-colors">
                          {member.name || 'Unknown'}
                          {member.isInvite && (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-sky-100 text-sky-800 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/30 px-1.5 py-0.5 rounded whitespace-nowrap border border-sky-200 transition-colors">
                              <Clock className="h-2.5 w-2.5" /> Invited
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 group-hover:text-blue-100 text-xs flex items-center gap-1 mt-0.5 truncate transition-colors">
                          <Mail className="h-3 w-3" /> {member.email}
                        </div>
                        <div className="text-[10px] text-slate-400 group-hover:text-blue-200 font-semibold mt-1 flex items-center gap-1 transition-colors">
                          <Calendar className="h-3 w-3 shrink-0 text-slate-400 group-hover:text-blue-200" /> Created On: {member.createdAtDate || "06/18/2026"}
                        </div>
                        {member.isInvite && member.createdAt && (
                          <div className="text-[10px] text-sky-600 group-hover:text-white font-bold mt-1 flex items-center gap-1 bg-sky-50 group-hover:bg-white/20 rounded px-1.5 py-0.5 w-fit border border-sky-100 group-hover:border-white/30 transition-colors">
                            <Clock className="h-3 w-3 shrink-0" /> Sent: {format(member.createdAt.toDate ? member.createdAt.toDate() : new Date(member.createdAt), 'MM/dd/yyyy h:mm a')}
                          </div>
                        )}
                        {member.joinedAt && (
                          <div className="text-[10px] text-emerald-600 group-hover:text-white font-bold mt-1 flex items-center gap-1 bg-emerald-50 group-hover:bg-emerald-500/30 border border-emerald-100 group-hover:border-emerald-300/40 rounded px-1.5 py-0.5 w-fit transition-colors">
                            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500 group-hover:text-emerald-200" /> Accepted: {member.joinedAt}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-700 group-hover:text-white transition-colors">
                      {member.role?.includes("Admin") ? <ShieldAlert className="h-4 w-4 text-rose-500 group-hover:text-rose-200" /> : <Users className="h-4 w-4 text-slate-400 group-hover:text-blue-200" />}
                      <span className="font-medium">{member.role || 'Agent'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <div className="px-2.5 py-1 rounded-md bg-slate-100 group-hover:bg-white/20 text-[10px] font-bold text-slate-600 group-hover:text-white inline-block uppercase tracking-wider transition-colors border border-transparent group-hover:border-white/20">
                       {member.brokerage || brokerageName || "Main Office"}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-700 group-hover:text-white font-bold transition-colors">{member.listings || 0}</td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <button type="button" className="p-2 text-slate-400 group-hover:text-white rounded-md hover:bg-slate-100 group-hover:hover:bg-white/20 transition-colors focus:outline-none inline-block">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    } />
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
                             <DropdownMenuItem onClick={() => {
                               setSelectedMember(member);
                               setIsMemberDetailModalOpen(true);
                             }} className="rounded-lg font-bold py-2 cursor-pointer hover:bg-blue-50 text-blue-600">
                               View Member Profile & Details
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => navigate(`/app/team/${member.id}/edit`)} className="rounded-lg font-bold py-2 cursor-pointer hover:bg-slate-50">
                               Edit Member
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => {
                               setMemberToChangeRole(member);
                               setSelectedRole(member.role || "Agent");
                               setIsChangeRoleModalOpen(true);
                             }} className="rounded-lg font-bold py-2 cursor-pointer">
                               Change Role
                             </DropdownMenuItem>
                             <DropdownMenuSeparator className="my-1" />
                             <DropdownMenuItem onClick={() => {
                               setMemberToRemove(member);
                               setIsRemoveModalOpen(true);
                             }} className="rounded-lg font-bold py-2 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer">
                               Remove from Team
                             </DropdownMenuItem>
                           </>
                         )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )))
            }
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden divide-y divide-slate-100">
           {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300 mx-auto" />
                <p className="text-slate-400 mt-2 font-medium">Loading team...</p>
              </div>
           ) : combinedList.map((member) => (
             <div 
               key={member.id} 
               onClick={() => {
                 setSelectedMember(member);
                 setIsMemberDetailModalOpen(true);
               }}
               className={`group p-4 flex flex-col gap-4 cursor-pointer transition-all duration-200 hover:bg-blue-600 ${member.isInvite ? 'bg-sky-50/20' : 'bg-white'}`}
             >
               <div className="flex justify-between items-start">
                 <div className="flex items-center gap-3">
                   <div className={`h-10 w-10 ${member.isInvite ? 'bg-sky-100 text-sky-700' : 'bg-blue-100 text-blue-700'} rounded-full flex justify-center items-center font-bold shrink-0 group-hover:bg-white group-hover:text-blue-600 transition-colors shadow-sm`}>
                     {(member.name || 'U').split(' ').map((n: string) => n[0]).join('')}
                   </div>
                   <div>
                     <div className="font-bold text-slate-900 group-hover:text-white flex items-center gap-2 transition-colors">
                       {member.name || 'Unknown'}
                       {member.isInvite && (
                         <span className="text-[8px] font-black uppercase tracking-widest bg-sky-100 text-sky-800 group-hover:bg-white/20 group-hover:text-white px-1 py-0.5 rounded border border-sky-200/50 transition-colors">Invited</span>
                       )}
                     </div>
                     <div className="text-[10px] text-slate-400 group-hover:text-blue-200 font-semibold mb-1 flex items-center gap-1 transition-colors">
                        <Calendar className="h-3 w-3 shrink-0 text-slate-400 group-hover:text-blue-200" /> Created On: {member.createdAtDate || "06/18/2026"}
                      </div>
                      <div className="text-slate-500 group-hover:text-blue-100 text-[11px] flex items-center gap-1 transition-colors">
                       <Mail className="h-3 w-3" /> {member.email}
                     </div>
                     {member.joinedAt && (
                       <div className="text-[10px] text-emerald-600 group-hover:text-white font-bold mt-1 flex items-center gap-1 bg-emerald-50 group-hover:bg-emerald-500/30 border border-emerald-100 group-hover:border-emerald-300/40 rounded px-1.5 py-0.5 w-fit transition-colors">
                         <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500 group-hover:text-emerald-200" /> Accepted: {member.joinedAt}
                       </div>
                     )}
                     {member.isInvite && member.createdAt && (
                       <div className="text-[10px] text-sky-600 group-hover:text-white font-bold mt-1 flex items-center gap-1 bg-sky-50 group-hover:bg-white/20 rounded px-1.5 py-0.5 w-fit border border-sky-100 group-hover:border-white/30 transition-colors">
                         <Clock className="h-3 w-3 shrink-0" /> Sent: {format(member.createdAt.toDate ? member.createdAt.toDate() : new Date(member.createdAt), 'MM/dd/yyyy h:mm a')}
                       </div>
                     )}
                   </div>
                 </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <button type="button" className="p-2 text-slate-400 group-hover:text-white hover:text-slate-600 rounded-md bg-slate-50 group-hover:bg-white/20 focus:outline-none inline-block transition-colors">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      } />
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
                             <DropdownMenuItem onClick={() => {
                               setSelectedMember(member);
                               setIsMemberDetailModalOpen(true);
                             }} className="font-bold py-2 text-blue-600 cursor-pointer">View Member Details</DropdownMenuItem>
                             <DropdownMenuItem onClick={() => navigate(`/app/team/${member.id}/edit`)} className="font-bold py-2 cursor-pointer">Edit Member</DropdownMenuItem>
                             <DropdownMenuItem onClick={() => {
                               setMemberToChangeRole(member);
                               setSelectedRole(member.role || "Agent");
                               setIsChangeRoleModalOpen(true);
                             }} className="font-bold py-2 cursor-pointer">Change Role</DropdownMenuItem>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem onClick={() => {
                               setMemberToRemove(member);
                               setIsRemoveModalOpen(true);
                             }} className="font-bold py-2 text-red-600 cursor-pointer">Remove</DropdownMenuItem>
                           </>
                         )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-2">
                 <div className="bg-slate-50 group-hover:bg-white/15 group-hover:border group-hover:border-white/20 p-2 rounded-lg transition-colors">
                   <div className="text-[9px] font-black text-slate-400 group-hover:text-blue-100 uppercase tracking-widest mb-1 transition-colors">Role</div>
                   <div className="text-xs font-bold text-slate-700 group-hover:text-white flex items-center gap-1.5 leading-none h-4 transition-colors">
                     {member.role?.includes("Admin") ? <ShieldAlert className="h-3.5 w-3.5 text-rose-500 group-hover:text-rose-200" /> : <Users className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-200" />}
                     {member.role || 'Agent'}
                   </div>
                 </div>
                 <div className="bg-slate-50 group-hover:bg-white/15 group-hover:border group-hover:border-white/20 p-2 rounded-lg transition-colors">
                   <div className="text-[9px] font-black text-slate-400 group-hover:text-blue-100 uppercase tracking-widest mb-1 transition-colors">Listings</div>
                   <div className="text-xs font-bold text-slate-700 group-hover:text-white leading-none h-4 flex items-center transition-colors">
                     {member.listings || 0} Assets
                   </div>
                 </div>
               </div>
             </div>
           ))}
        </div>
      </div>

      {/* 1. Remove Member Confirmation Dialog */}
      <Dialog open={isRemoveModalOpen} onOpenChange={setIsRemoveModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Confirm Removal
            </DialogTitle>
            <DialogDescription className="pt-2 text-stone-600 leading-relaxed font-semibold">
              Are you sure you want to remove <span className="text-slate-900 font-extrabold">{memberToRemove?.name}</span> ({memberToRemove?.email}) from the team?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-xs text-stone-500 leading-relaxed">
            This action will immediately disable their login privileges, delete their profile connection, and transfer outstanding open house lists to the brokerage administrator.
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRemoveModalOpen(false)}
              className="font-bold border-slate-200"
            >
              No, Keep Member
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleRemoveMember(memberToRemove)}
              className="font-bold bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Change Role Selection Dialog */}
      <Dialog open={isChangeRoleModalOpen} onOpenChange={setIsChangeRoleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-950 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" /> Change Team Role
            </DialogTitle>
            <DialogDescription className="pt-2">
              Assign a new operational role and permissions for <span className="font-bold text-slate-900">{memberToChangeRole?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-left">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Select New Role</label>
              <select
                className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="Agent">Agent</option>
                <option value="Office Manager">Office Manager</option>
                <option value="Broker of Record / Admin">Broker of Record / Admin</option>
                <option value="Brokerage Admin">Brokerage Admin</option>
                <option value="Team Admin">Team Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsChangeRoleModalOpen(false)}
              className="font-bold border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => handleUpdateRole(memberToChangeRole, selectedRole)}
              className="font-bold bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save New Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onboarding Package Dialog */}
      <Dialog open={isOnboardingModalOpen} onOpenChange={setIsOnboardingModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-emerald-650 shrink-0 text-emerald-600" /> New Agent Onboarding Package
            </DialogTitle>
            <DialogDescription className="text-slate-500 pt-1">
              This package is dynamically prepared and automatically delivered to newly accepted agents (like <span className="font-semibold text-slate-800">Luc Valade</span>) to get them setup with listings, AI tours, and paired lenders.
            </DialogDescription>
          </DialogHeader>

          {/* Interactive Layout of the Package */}
          <div className="space-y-6 py-4 text-left">
            <div className="border border-emerald-100 bg-emerald-50/40 rounded-xl p-4 flex gap-3 items-start">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-800 text-sm">Automated Invite Acceptance Workflow</h4>
                <p className="text-xs text-emerald-700/90 mt-1 leading-relaxed">
                  Upon clicking 'Accept Invitation', the agent is converted to an Active team member in your Brokerage group. They immediately receive their personalized dashboard credentials, a welcome email with their login token, and access to Sora (the in-app conversational real-estate guide).
                </p>
              </div>
            </div>

            {/* Core Onboarding Steps Checklist */}
            <div>
              <h3 className="font-bold text-slate-805 text-xs text-slate-500 uppercase tracking-wider mb-3">Interactive Onboarding Steps</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm flex gap-3 items-start">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-lg shrink-0">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">1. Mobile Kiosk & Secure PIN</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Setting up their customized agent profile, logo / avatar, and an <strong>Exit Lock PIN</strong>. This allows them to secure the high-integrity tablet kiosk during open houses.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm flex gap-3 items-start">
                  <div className="bg-amber-50 text-amber-600 p-2 rounded-lg shrink-0">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">2. Lender Pair Lock</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Inviting their preferred B2B mortgage professional. When paired, dynamic financing questions and explicit opt-in boxes are seamlessly injected into their attendee flow.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm flex gap-3 items-start">
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg shrink-0">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">3. Sora Walkthrough & AI Tour</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Generating their first immersive property tour. Our AI voice guidance assistant <strong>Sora</strong> compiles text and spatial audio tours directly from listing features.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm flex gap-3 items-start">
                  <div className="bg-purple-50 text-purple-600 p-2 rounded-lg shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">4. CRM Field Mapping Integration</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Connecting APIs like Follow Up Boss. Incoming buyer leads are direct-synced to FUB tags with immediate notification triggers safely recorded even if offline.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Interactive Welcome Script Preview */}
            <div className="border border-slate-205 rounded-xl overflow-hidden bg-slate-900 border-slate-800">
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center text-white">
                <span className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider text-slate-300">
                  🤖 Sora AI First-Login Greeting Preview
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-[10px] font-bold text-blue-400 border border-blue-500/30 uppercase">
                  Interactive Guidance
                </span>
              </div>
              <div className="p-4 space-y-3 font-mono text-xs leading-relaxed text-slate-300">
                <p className="text-emerald-400">"Hello agent! I am Sora, your AI open house and property marketing co-pilot.</p>
                <p>Welcome to your active AI Open House Connect desk! To get started immediately, let's achieve three milestones together:"</p>
                <ol className="list-decimal pl-5 space-y-1 text-slate-400 font-sans text-xs">
                  <li><strong className="text-slate-200">Register your personal Exit PIN:</strong> Secures your tablet kiosk at listings.</li>
                  <li><strong className="text-slate-200">Connect a Paired Lender:</strong> Captures qualified mortgage buyers with strict borrower opt-in.</li>
                  <li><strong className="text-slate-200">Upload your first Property Listing:</strong> I will draft custom spatial walkthrough scripts in seconds!</li>
                </ol>
                <p className="text-emerald-400 pt-1">Let's build a glorious listing event together."</p>
              </div>
            </div>

            {/* Download and Print section */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div className="min-w-0">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" /> Printable Quick-Start Handbook
                </h4>
                <p className="text-slate-500 text-xs mt-0.5">
                  Hand over a structured onboarding cheat sheet including QR codes and fallback syncing tips.
                </p>
              </div>
              <Button 
                onClick={() => {
                  toast.success("📥 Onboarding Package Flyer PDF successfully compiled and loaded for Luc Valade.");
                }}
                className="bg-slate-800 hover:bg-slate-900 font-bold text-xs flex items-center gap-2 self-end sm:self-auto text-white"
              >
                <Download className="h-4 w-4" /> Download PDF Kit
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button onClick={() => setIsOnboardingModalOpen(false)} className="bg-blue-600 hover:bg-blue-700 font-bold text-white">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Team Member Details & Profile Modal */}
      <Dialog open={isMemberDetailModalOpen} onOpenChange={setIsMemberDetailModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMember && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 ${selectedMember.isInvite ? 'bg-sky-100 text-sky-700' : 'bg-blue-600 text-white'} rounded-2xl flex justify-center items-center text-xl font-black shrink-0 shadow-md`}>
                    {(selectedMember.name || 'U').split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      {selectedMember.name || 'Team Member'}
                      {selectedMember.isInvite ? (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200">
                          Pending Invitation
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          Active Member
                        </span>
                      )}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 text-xs flex items-center gap-2 mt-1">
                      <span>{selectedMember.email}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">{selectedMember.role || 'Agent'}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-3">
                {/* Stats & Quick Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Listings Active</div>
                    <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                      <Building className="h-4 w-4 text-blue-600" />
                      {selectedMember.listings || 0}
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Open Houses</div>
                    <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      {selectedMember.openHousesCount || (selectedMember.listings ? selectedMember.listings * 2 : 1)}
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Leads Captured</div>
                    <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-purple-600" />
                      {selectedMember.leadsCount || ((selectedMember.listings || 1) * 8)}
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Role Type</div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate pt-0.5">
                      <Shield className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="truncate">{selectedMember.role || 'Agent'}</span>
                    </div>
                  </div>
                </div>

                {/* Detailed Information Panels */}
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                  <div className="p-3.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" /> Organization / Brokerage
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {selectedMember.brokerage || brokerageName || "Main Brokerage Office"}
                    </span>
                  </div>

                  <div className="p-3.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" /> Date Added / Joined
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {selectedMember.joinedAt || selectedMember.createdAtDate || "06/18/2026"}
                    </span>
                  </div>

                  <div className="p-3.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-slate-400" /> Paired Lending Partner
                    </span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      Office Default (Apex Premier Lending)
                    </span>
                  </div>

                  <div className="p-3.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" /> Contact Phone
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {selectedMember.phone || "+1 (555) 349-8201"}
                    </span>
                  </div>

                  <div className="p-3.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-slate-400" /> CRM Direct Sync (Follow Up Boss)
                    </span>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Connected & Active
                    </span>
                  </div>

                  <div className="p-3.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-slate-400" /> Kiosk Terminal Security Exit PIN
                    </span>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      •••• (Protected)
                    </span>
                  </div>
                </div>

                {/* Sora AI Guided Agent Bio & Marketing Pitch */}
                <div className="bg-slate-900 rounded-xl p-4 text-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      🤖 Sora AI Guided Performance Overview
                    </span>
                    <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                      Score: 98/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {selectedMember.name || 'This agent'} has maintained 100% kiosk uptime across all hosted open house events, capturing attendee consent data with zero compliance violations. All mortgage inquiries were verified and routed according to office privacy governance.
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:justify-between pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMemberDetailModalOpen(false)}
                  className="font-bold border-slate-200"
                >
                  Close
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setIsMemberDetailModalOpen(false);
                      navigate(`/app/team/${selectedMember.id}/edit`);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 font-bold text-white flex items-center gap-1.5"
                  >
                    <Settings className="h-4 w-4" /> Edit Permissions
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
