import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  Mail, 
  Shield, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export default function InviteAgent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("AGENT");
  const [isInviting, setIsInviting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsInviting(true);
    try {
      // Simulate invitation process
      // In a real app, this would trigger a cloud function to send an email
      // and create a pending user document
      
      // 1. Create a log of the invitation
      await addDoc(collection(db, "system_logs"), {
        type: "ACTION",
        message: `Agent Invitation Sent: ${fullName} (${email})`,
        timestamp: serverTimestamp(),
        userEmail: user?.email,
        userId: user?.id,
        details: {
          recipientEmail: email,
          recipientName: fullName,
          role: role
        }
      });

      // 2. Log simulated email
      await addDoc(collection(db, "system_logs"), {
        type: "EMAIL_SIM",
        message: `Invitation Email: ${email}`,
        timestamp: serverTimestamp(),
        details: {
          recipient: email,
          template: "AGENT_INVITATION",
          subject: `You've been invited to join ${user?.email?.split('@')[1] || 'the brokerage'} on AI Open House Connect`,
          body: `Hi ${fullName},\n\n${user?.email} has invited you to join their team on AI Open House Connect.\n\nAI Open House Connect is an AI-powered assistant for modern real estate professionals.\n\nClick here to accept: https://aiopenhouseconnect.com/register?invite=${btoa(email)}`,
          metadata: { sender: user?.email, role }
        }
      });

      toast.success("Invitation sent successfully!");
      setIsSuccess(true);
      
      // After 3 seconds go back
      setTimeout(() => navigate("/app/admin/users"), 3000);
    } catch (err) {
      console.error("Invitation failed:", err);
      toast.error("Failed to send invitation. Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-500 text-center px-4">
        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">Invitation Dispatched</h1>
          <p className="text-slate-500 font-medium max-w-sm">
            {fullName} has been added to the queue. They will receive a secure registration link shortly.
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/app/admin/users")} className="font-bold gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/app/admin/users")} 
          className="text-slate-500 hover:text-slate-900 font-bold gap-2 px-0"
        >
          <ArrowLeft className="h-4 w-4" /> Personnel Directory
        </Button>
      </div>

      <div className="space-y-1 text-left">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase flex items-center gap-3">
          <UserPlus className="h-10 w-10 text-blue-600" />
          Invite Personnel
        </h1>
        <p className="text-slate-500 font-medium">Add new agents or administrators to your secure brokerage shard.</p>
      </div>

      <Card className="border-slate-200 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-8">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Invitation Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-8 space-y-6 text-left">
          <form id="invite-form" onSubmit={handleInvite} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Legal Full Name</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Enter agent name..." 
                    className="pl-10 h-12 bg-white border-slate-200 font-bold"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Professional Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="email"
                    placeholder="e.g. agent@brokerage.com" 
                    className="pl-10 h-12 bg-white border-slate-200 font-bold"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Access Role</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-12 bg-white border-slate-200 font-bold">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  <SelectItem value="AGENT" className="font-bold py-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      Standard Agent
                    </div>
                  </SelectItem>
                  <SelectItem value="ADMIN" className="font-bold py-3 text-red-600">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-600" />
                      Office Administrator
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-slate-400 font-medium italic mt-1">
                * Admins can manage all listings, compliance docs, and brokerage-wide settings.
              </p>
            </div>
          </form>
        </CardContent>
        <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-blue-700 tracking-tighter">Instant Provisioning</p>
                <p className="text-[10px] text-slate-500 font-medium max-w-[240px]">Invited agents will receive a custom onboarded link with pre-filled credentials.</p>
              </div>
           </div>
           <Button 
            form="invite-form"
            disabled={isInviting}
            className="w-full sm:w-auto h-14 px-10 bg-blue-600 hover:bg-blue-500 font-black uppercase tracking-widest shadow-xl shadow-blue-200"
           >
             {isInviting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <UserPlus className="h-5 w-5 mr-2" />}
             Send Invitation link
           </Button>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Compliance Ready", desc: "Invites include mandatory RECO/Jurisdiction disclosures." },
          { title: "Automatic Sharding", desc: "Agent data is automatically isolated to your brokerage." },
          { title: "Dashboard Ready", desc: "Provisioned agents gain instant access to AI tools." }
        ].map((feat, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm text-center space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 italic">{feat.title}</h4>
            <p className="text-[10px] text-slate-400 font-medium">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
