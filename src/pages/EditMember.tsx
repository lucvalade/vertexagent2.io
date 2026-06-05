import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, User, Mail, Building2, ExternalLink, Shield, Key, Database, Globe, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditMember() {
  const { memberId } = useParams();
  const navigate = useNavigate();

  const DUMMY_AGENTS = [
    { id: "1", name: "Luc Valade", email: "luc.valade@gmail.com", role: "Broker of Record / Admin", listings: 4, office: "Vertex Agent Group" },
    { id: "2", name: "Sarah Jenkins", email: "sarah.j@vertexagent.io", role: "Agent", listings: 12, office: "Vertex Agent Group" },
    { id: "3", name: "Michael Chang", email: "m.chang@vertexagent.io", role: "Agent", listings: 8, office: "Vertex Agent Group" },
    { id: "4", name: "Jessica Smith", email: "admin@vertexagent.io", role: "Office Manager", listings: 0, office: "Vertex Agent Group" },
    { id: "inv_luc", name: "Luc Valade", email: "luc.valade@gmail.com", role: "Agent", listings: 0, office: "Vertex Agent Group" }
  ];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    office: "Main Office",
    role: "Agent (Standard)"
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadMemberDetail() {
      if (!memberId) return;

      // 1. Try checking the "users" collection in case it is a real Firestore user
      try {
        const userRef = doc(db, "users", memberId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const uData = userSnap.data();
          setFormData({
            name: uData.name || "",
            email: uData.email || "",
            office: uData.brokerage || "Main Office",
            role: uData.role || "Agent"
          });
          return;
        }
      } catch (err) {
        console.error("Error fetching Firestore user details:", err);
      }

      // 2. Try checking the "invitations" collection in case it is a pending invite in Firestore
      try {
        const inviteRef = doc(db, "invitations", memberId);
        const inviteSnap = await getDoc(inviteRef);
        if (inviteSnap.exists()) {
          const iData = inviteSnap.data();
          setFormData({
            name: iData.name || "",
            email: iData.email || "",
            office: iData.brokerage || "Main Office",
            role: iData.role || "Agent"
          });
          return;
        }
      } catch (err) {
        console.error("Error fetching Firestore invite details:", err);
      }

      // 3. Check localStorage vertex_team_data
      const savedMembers = localStorage.getItem('vertex_team_data');
      let foundMember = null;
      
      if (savedMembers) {
        const team = JSON.parse(savedMembers);
        foundMember = team.find((m: any) => m.id === memberId || m.name.toLowerCase().replace(' ', '-') === memberId);
      }
      
      // 4. Fallback to synced dummy data
      if (!foundMember) {
        foundMember = DUMMY_AGENTS.find(m => m.id === memberId || m.name.toLowerCase().replace(' ', '-') === memberId);
      }

      if (foundMember) {
        setFormData({
          name: foundMember.name,
          email: foundMember.email,
          office: (foundMember as any).office || (foundMember as any).brokerage || "Main Office",
          role: (foundMember as any).role || "Agent"
        });
      }
    }

    loadMemberDetail();
  }, [memberId]);

  const validateField = (field: string, value: string) => {
    let error = "";
    if (field === "name") {
      if (!value.trim()) error = "Full name is required";
    } else if (field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) error = "Email address is required";
      else if (!emailRegex.test(value)) error = "Please enter a valid email address";
    }
    return error;
  };

  const capitalizeName = (name: string) => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error as user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleBlur = (field: string, value: string) => {
    const error = validateField(field, value);
    if (!error && field === "name") {
      setFormData(prev => ({ ...prev, name: capitalizeName(value) }));
    }
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSave = async () => {
    const nameErr = validateField("name", formData.name);
    const emailErr = validateField("email", formData.email);

    if (nameErr || emailErr) {
      setErrors({ name: nameErr, email: emailErr });
      toast.error("Please fix the validation errors before saving");
      return;
    }

    setIsSaving(true);
    
    // Persist to Firestore if it's a real user, otherwise fallback to localStorage
    try {
      const userRef = doc(db, "users", memberId!);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          name: formData.name,
          email: formData.email,
          brokerage: formData.office,
          role: formData.role
        });
      } else {
        // Check if it's an invitation we are updating in Firestore
        const inviteRef = doc(db, "invitations", memberId!);
        const inviteSnap = await getDoc(inviteRef);
        if (inviteSnap.exists()) {
          await updateDoc(inviteRef, {
            name: formData.name,
            email: formData.email,
            brokerage: formData.office,
            role: formData.role
          });
        } else {
          // Persist to localStorage to simulate a database update for dummy/offline members
          const savedMembers = localStorage.getItem('vertex_team_data');
          let team = savedMembers ? JSON.parse(savedMembers) : [
            { id: "1", name: "Luc Valade", email: "luc.valade@gmail.com", role: "Broker of Record / Admin", active: true, listings: 4 },
            { id: "2", name: "Sarah Jenkins", email: "sarah.j@vertexagent.io", role: "Agent", active: true, listings: 12 },
            { id: "3", name: "Michael Chang", email: "m.chang@vertexagent.io", role: "Agent", active: true, listings: 8 },
            { id: "4", name: "Jessica Smith", email: "admin@vertexagent.io", role: "Office Manager", active: true, listings: 0 },
          ];

          const memberIdx = team.findIndex((m: any) => m.id === memberId);
          const updatedMember = {
            id: memberId,
            ...formData,
            active: true,
            listings: memberIdx >= 0 ? team[memberIdx].listings : 0
          };

          if (memberIdx >= 0) {
            team[memberIdx] = updatedMember;
          } else {
            team.push(updatedMember);
          }

          localStorage.setItem('vertex_team_data', JSON.stringify(team));
        }
      }
      
      setTimeout(() => {
        setIsSaving(false);
        toast.success("Member details saved successfully", {
          description: `Account for ${formData.name} was updated.`
        });
        navigate("/app/team");
      }, 800);
    } catch (err) {
      setIsSaving(false);
      toast.error("Failed to save changes");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Member</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Update agent details and permissions.</p>
          </div>
        </div>
      </div>

      <div className="bg-white border text-left border-slate-200 rounded-xl p-8 shadow-sm space-y-8">
        <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
          <div className="h-20 w-20 bg-blue-100 text-blue-700 rounded-2xl flex justify-center items-center font-black text-3xl shadow-inner italic">
            {formData.name.charAt(0)}
          </div>
          <div>
            <button className="text-blue-600 text-sm font-bold hover:underline">Upload Photo</button>
            <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">JPG, GIF or PNG. 1MB max.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User className="h-3 w-3" /> Full Name
            </Label>
            <Input 
              type="text" 
              className={`h-11 font-bold ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              value={formData.name}
              onChange={e => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
              }}
              onBlur={e => handleBlur("name", e.target.value)}
            />
            {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Mail className="h-3 w-3" /> Email Address
            </Label>
            <Input 
              type="email" 
              className={`h-11 font-bold ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              value={formData.email}
              onChange={e => {
                setFormData(prev => ({ ...prev, email: e.target.value }));
                if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
              }}
              onBlur={e => handleBlur("email", e.target.value)}
            />
            {errors.email && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">{errors.email}</p>}
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Building2 className="h-3 w-3" /> Office / Team
            </Label>
            <select 
              className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
              value={formData.office}
              onChange={e => setFormData(prev => ({ ...prev, office: e.target.value }))}
            >
              <option>Main Office</option>
              <option>Downtown Team</option>
              <option>Luxury Division</option>
            </select>
            <p className="text-[9px] text-slate-400 font-medium">Verify the correct branch for lead routing.</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Shield className="h-3 w-3" /> Role & Permissions
            </Label>
            <select 
              className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
              value={formData.role}
              onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
            >
              <option>Agent (Standard)</option>
              <option>Office Manager</option>
              <option>Brokerage Admin</option>
            </select>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 bg-slate-50/50 -mx-8 px-8 pb-8 rounded-b-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-black text-xs text-slate-900 uppercase tracking-widest mb-1.5">Agent Specific Integrations</h3>
              <p className="text-sm text-slate-500 leading-snug">Allows this agent to use their own personal CRM, Zillow, or Webhook keys instead of organization defaults.</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsIntegrationsOpen(true)}
              className="shrink-0 bg-white border-blue-100 text-blue-600 hover:bg-blue-50 font-bold gap-2"
            >
              Manage Integrations <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-center pointer-events-none">
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 p-2 rounded-2xl shadow-2xl flex items-center gap-2 max-w-sm w-full pointer-events-auto ring-1 ring-black/5 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex gap-2 w-full">
            <Button 
              type="button" 
              variant="ghost" 
              className="flex-1 font-bold text-slate-500 h-10 rounded-xl"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button 
              disabled={isSaving} 
              className="flex-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 font-bold h-10 rounded-xl text-white"
              onClick={handleSave}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isIntegrationsOpen} onOpenChange={setIsIntegrationsOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black tracking-tighter text-2xl">
              <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                <Key className="h-5 w-5" />
              </div>
              Agent Integrations
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500 italic">
              Override brokerage settings for <span className="font-bold text-slate-900">{formData.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6 text-left">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  <span className="font-black text-xs uppercase tracking-widest">Personal CRM Sync</span>
                </div>
                <div className="h-2 w-10 bg-green-500 rounded-full" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">HubSpot / Salesforce API Key</Label>
                <div className="relative">
                  <Input type="password" value="********-****-****-****-************" readOnly className="pr-10 font-mono text-xs bg-slate-50" />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 text-[10px] font-bold hover:underline">REPLACE</button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <span className="font-black text-xs uppercase tracking-widest">Zillow Tech Connect</span>
                </div>
                <div className="h-2 w-10 bg-slate-200 rounded-full" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Partner ID / Email</Label>
                <Input placeholder="Enter Zillow agent email..." className="h-10 text-sm font-bold" />
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-[10px] font-bold text-amber-800 uppercase leading-snug">
                <Shield className="h-3 w-3 inline mr-2" /> 
                Security Note: These keys are encrypted at rest. Brokerage admins can see that keys are configured but cannot view the raw values.
              </p>
            </div>
          </div>

          <DialogFooter className="border-t pt-6">
            <Button variant="ghost" onClick={() => setIsIntegrationsOpen(false)} className="font-bold">Cancel</Button>
            <Button onClick={() => {
              setIsIntegrationsOpen(false);
              toast.success("Agent integrations saved");
            }} className="bg-blue-600 hover:bg-blue-500 px-8 font-bold">
              Save Integration Sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

