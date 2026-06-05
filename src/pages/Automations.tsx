import { Zap, Plus, ArrowRight, Activity, ToggleLeft, ToggleRight, MoreVertical, Pencil, Trash2, Globe, MessageSquare, Mail as MailIcon, Database, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";

export default function Automations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState<any>({});
  const [automations, setAutomations] = useState([
    { id: 1, name: "Send Lead to HubSpot", trigger: "On Lead Captured", action: "Create Contact in CRM", active: true, type: "crm" },
    { id: 2, name: "Text Listing Agent", trigger: "On Hot Lead (Urgent)", action: "Send SMS Notification", active: true, type: "sms" },
    { id: 3, name: "Email PDF Brochure", trigger: "On Email Provided", action: "Send Email Template", active: false, type: "email" },
    { id: 4, name: "Zapier generic ping", trigger: "On Any Interaction End", action: "Webhook POST", active: true, type: "webhook" },
  ]);

  useEffect(() => {
    if (!user?.id) return;
    return onSnapshot(doc(db, "users", user.id), (snap) => {
      if (snap.exists()) {
        setIntegrations(snap.data()?.integrations || {});
      }
    });
  }, [user?.id]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuto, setEditingAuto] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", trigger: "On Lead Captured", action: "" });

  const isHubSpotConnected = integrations.hubspot === true;

  const handleOpenModal = (auto?: any) => {
    if (auto) {
      setEditingAuto(auto);
      setFormData({ name: auto.name, trigger: auto.trigger, action: auto.action });
    } else {
      setEditingAuto(null);
      setFormData({ name: "", trigger: "On Lead Captured", action: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.action) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingAuto) {
      setAutomations(prev => prev.map(a => a.id === editingAuto.id ? { ...a, ...formData } : a));
      toast.success("Workflow updated");
    } else {
      const newAuto = {
        id: Date.now(),
        ...formData,
        active: true,
        type: "webhook"
      };
      setAutomations(prev => [...prev, newAuto]);
      toast.success("New workflow created");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this automation?")) {
      setAutomations(prev => prev.filter(a => a.id !== id));
      toast.success("Workflow deleted");
    }
  };

  const toggleActive = (id: number) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automations & Workflows</h1>
          <p className="text-slate-500 mt-1">Connect your AI tours to your existing CRM and communication tools.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-blue-600 text-white gap-2 font-bold shadow-lg shadow-blue-100">
          <Plus className="h-4 w-4" /> New Workflow
        </Button>
      </div>

      <div className="grid gap-4">
        {automations.map((auto) => (
          <div key={auto.id} className="border border-slate-200 bg-white rounded-xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl transition-colors ${auto.active ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>
                {auto.type === 'sms' ? <MessageSquare className="h-6 w-6" /> : 
                 auto.type === 'email' ? <MailIcon className="h-6 w-6" /> :
                 auto.type === 'crm' ? <Database className="h-6 w-6" /> :
                 <Zap className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  {auto.name}
                  {auto.active && <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600 font-bold tracking-tight uppercase">{auto.trigger}</span>
                  <ArrowRight className="h-3 w-3 text-slate-300" />
                  <span className="font-bold text-slate-800">{auto.action}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 border-r border-slate-100 pr-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 min-w-[70px]">
                  {auto.active ? <><Activity className="h-3 w-3 text-green-500" /> Active</> : <><Activity className="h-3 w-3 text-slate-300" /> Paused</>}
                </div>
                <button 
                  onClick={() => toggleActive(auto.id)}
                  className={`transition-colors h-9 w-9 rounded-full flex items-center justify-center ${auto.active ? 'text-blue-600 bg-blue-50' : 'text-slate-300 bg-slate-50'}`}
                >
                  {auto.active ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
                </button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-slate-900 hover:bg-slate-50">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                } />
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleOpenModal(auto)}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit Workflow
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setAutomations(prev => [...prev, { ...auto, id: Date.now(), name: `${auto.name} (Copy)`, active: false }]);
                    toast.success("Workflow duplicated");
                  }}>
                    <Globe className="h-4 w-4 mr-2" /> Clone Setup
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(auto.id)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Workflow
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAuto ? "Edit Workflow" : "New Automation Workflow"}</DialogTitle>
            <DialogDescription>
              Configure the trigger and action for this system automation.
            </DialogDescription>
          </DialogHeader>
            <div className="space-y-4 py-4">
              {formData.name.toLowerCase().includes("hubspot") && !isHubSpotConnected && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-900">HubSpot Not Connected</p>
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      You are editing a HubSpot workflow but HubSpot is not connected in your CRM Integrations.
                    </p>
                    <Button 
                      variant="link" 
                      className="h-auto p-0 text-[10px] text-blue-600 font-black uppercase tracking-widest flex items-center gap-1"
                      onClick={() => navigate("/app/integrations")}
                    >
                      Connect in Integrations <ExternalLink className="h-2 w-2" />
                    </Button>
                  </div>
                </div>
              )}
              {formData.name.toLowerCase().includes("hubspot") && isHubSpotConnected && (
                <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-xs font-bold text-green-900">HubSpot Connected & Verified</p>
                </div>
              )}
              <div className="space-y-2">
              <Label className="font-bold text-slate-700">Workflow Name</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Lead Export to HighLevel"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Event Trigger</Label>
              <select 
                className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                value={formData.trigger}
                onChange={e => setFormData(prev => ({ ...prev, trigger: e.target.value }))}
              >
                <option>On Lead Captured</option>
                <option>On Hot Lead (Urgent)</option>
                <option>On Tour Completed</option>
                <option>On Email Provided</option>
                <option>On Any Interaction End</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">System Action</Label>
              <Input 
                value={formData.action} 
                onChange={e => setFormData(prev => ({ ...prev, action: e.target.value }))}
                placeholder="e.g. POST to Webhook URL"
                className="h-11"
              />
              <p className="text-[10px] text-slate-400 font-medium">Use a Zapier webhook, integration ID, or API endpoint.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 font-bold px-8">
              {editingAuto ? "Save Changes" : "Create Workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
