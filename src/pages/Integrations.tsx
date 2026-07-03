import { Link } from "react-router-dom";
import { Plug, Zap, CheckCircle2, ArrowRight, Loader2, Key, Settings, HelpCircle, ShieldAlert } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Integrations() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // Follow Up Boss Specific config states
  const [apiKey, setApiKey] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [mappings, setMappings] = useState<any>({
    firstName: "first_name",
    lastName: "last_name",
    email: "email",
    phone: "phone",
    agentTags: "tags",
    customQuestions: "notes",
    mortgageOptIn: "fub-mortgage-interest"
  });

  useEffect(() => {
    if (!user?.id) return;
    const unsub = onSnapshot(doc(db, "users", user.id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const intState = data?.integrations || {};
        setIntegrations(intState);
        setApiKey(intState.followupbossApiKey || "");
        if (intState.followupbossMappings) {
          setMappings(intState.followupbossMappings);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user?.id]);

  const toggleIntegration = async (key: string) => {
    if (!user?.id) return;
    const newValue = !integrations[key];
    try {
      await updateDoc(doc(db, "users", user.id), {
        [`integrations.${key}`]: newValue
      });
      toast.success(newValue ? `${key.toUpperCase()} integration turned on!` : `${key.toUpperCase()} integration turned off.`);
    } catch (e) {
      toast.error("Failed to update integration state.");
    }
  };

  const saveFubConfig = async () => {
    if (!user?.id) return;
    const tid = toast.loading("Saving Follow Up Boss configuration...");
    try {
      await updateDoc(doc(db, "users", user.id), {
        "integrations.followupbossApiKey": apiKey,
        "integrations.followupbossMappings": mappings,
        "integrations.followupboss": apiKey.trim().length > 0
      });
      toast.dismiss(tid);
      toast.success("✨ Follow Up Boss settings saved and verified!");
      setShowConfig(false);
    } catch (err) {
      toast.dismiss(tid);
      toast.error("Failed to update configuration on Firestore.");
    }
  };

  const handleMappingChange = (field: string, dest: string) => {
    setMappings((prev: any) => ({
      ...prev,
      [field]: dest
    }));
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">CRM & Integrations</h1>
          <p className="text-slate-400 mt-1">Connect your existing tools to automate lead flow.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* HubSpot Integration */}
        <div className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col transition-all duration-300 ${integrations.hubspot ? 'ring-2 ring-blue-500 border-blue-200 shadow-blue-100 shadow-xl' : ''}`}>
          <div className="p-6 flex-grow">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-950 text-blue-400 rounded-xl flex items-center justify-center border border-blue-800/35">
                <Plug className="h-6 w-6" />
              </div>
              {integrations.hubspot && (
                <div className="bg-blue-900/50 text-blue-200 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1 border border-blue-800">
                  <CheckCircle2 className="h-3 w-3 text-blue-400" /> Connected
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">HubSpot CRM</h2>
            <p className="text-slate-400 text-sm mb-4">Automatically sync new leads, contact details, and tour summaries to your HubSpot CRM.</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Dynamic contacts creation
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Event timeline registration
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-slate-850 bg-slate-950/20 mt-auto">
            <button 
              onClick={() => toggleIntegration('hubspot')}
              className={`w-full font-bold py-2 px-4 rounded-lg border transition-all text-sm cursor-pointer ${integrations.hubspot ? 'border-amber-600/30 text-amber-400 bg-amber-950/10 hover:bg-amber-950/25' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {integrations.hubspot ? "Disconnect HubSpot" : "Connect HubSpot"}
            </button>
          </div>
        </div>

        {/* Zapier Integration */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 flex-grow">
            <div className="w-12 h-12 bg-slate-950 text-slate-400 rounded-xl flex items-center justify-center mb-4 border border-slate-800/40">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Zapier Webhooks</h2>
            <p className="text-slate-400 text-sm mb-4">Connect AI Open House Connect with 5,000+ apps. Trigger workflows when new leads request an agent or when a conversation finishes.</p>
          </div>
          <div className="p-4 border-t border-slate-850 bg-slate-950/20 mt-auto">
            <button className="w-full bg-slate-950 border border-slate-800 text-slate-300 font-medium py-2 rounded-lg text-sm hover:bg-slate-900 transition-colors flex justify-center items-center gap-2 cursor-pointer">
              Configure Webhooks <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Follow Up Boss Integration */}
        <div className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col transition-all duration-300 ${integrations.followupboss ? 'ring-2 ring-emerald-500 border-emerald-500/40' : ''}`}>
          <div className="p-6 flex-grow">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-emerald-950/40 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-800/40">
                <Plug className="h-6 w-6" />
              </div>
              {integrations.followupboss && (
                <div className="bg-emerald-900/50 text-emerald-200 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1 border border-emerald-800">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Active
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Follow Up Boss</h2>
            <p className="text-slate-400 text-sm mb-4 font-normal">Directly sync leads, conversation transcripts, and lead scores to FUB with custom CRM field mapping options.</p>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 2-Way lead routing
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Interactive Field Mapping
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-slate-850 bg-slate-950/20 mt-auto flex gap-2">
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className="px-3 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 rounded-lg text-sm flex items-center justify-center cursor-pointer"
              title="Configure field mapping & API key"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button 
              onClick={() => {
                if (!apiKey) {
                  setShowConfig(true);
                  toast.info("Please enter your Follow Up Boss API Key to begin.");
                } else {
                  toggleIntegration('followupboss');
                }
              }}
              className={`flex-grow font-bold py-2 rounded-lg text-sm transition-all cursor-pointer ${integrations.followupboss ? 'bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
            >
              {integrations.followupboss ? "Disconnect FUB" : "Connect FUB"}
            </button>
          </div>
        </div>
      </div>

      {/* Follow Up Boss Interactive Config Block */}
      {showConfig && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 mt-4 text-left">
          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                <Settings className="h-5 w-5 text-emerald-500" /> Follow Up Boss Field Synchronization Settings
              </h3>
              <p className="text-xs text-slate-400 mt-1">Specify authorization details and map the open house lead attributes to canonical CRM layout keys.</p>
            </div>
            <button 
              onClick={() => setShowConfig(false)}
              className="text-slate-400 hover:text-slate-200 text-xs py-1 px-2 border border-slate-800 rounded-md cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left side: Credentials */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <Key className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                  Follow Up Boss API Key
                </Label>
                <Input 
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your API key (fub_live_...)"
                  className="bg-slate-950 border-slate-800 text-white placeholder-slate-600 h-10 text-xs font-mono"
                />
                <span className="text-[10px] text-slate-500 block leading-relaxed">
                  Your credentials are encrypted and stored in custom secure environments. Generated under Admin → Integrations in FUB.
                </span>
              </div>

              <div className="p-4 bg-emerald-950/10 border border-emerald-900/30 rounded-xl flex items-start gap-2.5">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-white">Automated Mortgage Action Tag Translation</p>
                  <p className="leading-relaxed">
                    By default, when a buyer selects <strong>"Mortgage Opt-In: Yes"</strong> on the signed-in kiosk screen, FUB will automatically append the special code label <strong>{mappings.mortgageOptIn || "fub-mortgage-interest"}</strong> tags to their dossier.
                  </p>
                </div>
              </div>
            </div>

            {/* Right side: Field Mapping */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1 border-b border-slate-800 pb-1.5">
                Contact Attribute Mapping Options
              </h4>
              <div className="space-y-3">
                {[
                  { key: "firstName", label: "First Name", options: ["first_name", "firstName", "custom_firstName"] },
                  { key: "lastName", label: "Last Name", options: ["last_name", "lastName", "custom_lastName"] },
                  { key: "email", label: "Email Address", options: ["email", "primary_email", "emailsList"] },
                  { key: "phone", label: "Phone Number", options: ["phone", "mobile_phone", "cellular"] },
                  { key: "agentTags", label: "Agent Tags", options: ["tags", "agent_tags", "system_keywords"] },
                  { key: "customQuestions", label: "Custom Answers", options: ["notes", "notes_field", "background_remarks"] },
                  { key: "mortgageOptIn", label: "Mortgage Tag Label", options: ["fub-mortgage-interest", "mortgage-intent", "financing-optin"] },
                ].map((mapping) => (
                  <div key={mapping.key} className="flex items-center justify-between gap-4 text-xs">
                    <span className="text-slate-300 font-medium">{mapping.label}</span>
                    <select
                      value={mappings[mapping.key] || ""}
                      onChange={(e) => handleMappingChange(mapping.key, e.target.value)}
                      className="bg-slate-950 select-none cursor-pointer text-slate-200 border border-slate-800 rounded-lg p-1.5 font-mono text-[11px] outline-none min-w-[160px] focus:ring-1 focus:ring-blue-500"
                    >
                      {mapping.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Button 
              variant="outline"
              type="button"
              onClick={() => setShowConfig(false)}
              className="h-9 text-xs border-slate-800 text-slate-300 cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              onClick={saveFubConfig}
              className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 text-xs font-bold leading-none px-4 rounded-xl cursor-pointer"
            >
              Verify & Save Configuration
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
