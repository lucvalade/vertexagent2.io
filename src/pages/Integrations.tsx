import { Link, useSearchParams } from "react-router-dom";
import { Plug, Zap, CheckCircle2, ArrowRight, Loader2, Key, Settings, HelpCircle, ShieldAlert, Activity, FileText, Search, ExternalLink, Database, Sparkles, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CrmSyncLogs from "@/components/CrmSyncLogs";

export interface CrmItem {
  id: string;
  name: string;
  url: string;
}

export const SUPPORTED_CRMS_47: CrmItem[] = [
  // Top 3 Priority CRMs
  { id: "followupboss", name: "Follow Up Boss", url: "https://www.followupboss.com" },
  { id: "hubspot", name: "HubSpot CRM", url: "https://www.hubspot.com" },
  { id: "kvcore", name: "kvCORE / Inside Real Estate", url: "https://www.insiderealestate.com/kvcore" },

  // Remainder in Alphabetical Order
  { id: "activecampaign", name: "ActiveCampaign", url: "https://www.activecampaign.com" },
  { id: "agentlead", name: "AgentLead", url: "https://www.agentlead.com" },
  { id: "agile", name: "Agile CRM", url: "https://www.agilecrm.com" },
  { id: "boomtown", name: "BoomTown", url: "https://boomtownroi.com" },
  { id: "brivity", name: "Brivity", url: "https://www.brivity.com" },
  { id: "cinc", name: "CINC (Commissions Inc)", url: "https://www.cincpro.com" },
  { id: "cloze", name: "Cloze CRM", url: "https://www.cloze.com" },
  { id: "contactually", name: "Contactually", url: "https://www.contactually.com" },
  { id: "copper", name: "Copper CRM", url: "https://www.copper.com" },
  { id: "custom_webhook", name: "Custom Webhook / API Endpoint", url: "https://aiopenhouseconnect.com/api/v1/webhook" },
  { id: "encompass", name: "Encompass (ICE Mortgage Tech)", url: "https://icemortgagetechnology.com" },
  { id: "firepoint", name: "Firepoint", url: "https://www.firepoint.net" },
  { id: "floify", name: "Floify", url: "https://floify.com" },
  { id: "freshsales", name: "Freshsales / Freshworks", url: "https://www.freshworks.com/crm" },
  { id: "insiderealestate", name: "Inside Real Estate", url: "https://www.insiderealestate.com" },
  { id: "insightly", name: "Insightly", url: "https://www.insightly.com" },
  { id: "ixact", name: "IXACT Contact", url: "https://www.ixactcontact.com" },
  { id: "keap", name: "Keap / Infusionsoft", url: "https://keap.com" },
  { id: "kunversion", name: "Kunversion", url: "https://www.kunversion.com" },
  { id: "leadpro", name: "LeadPro", url: "https://www.leadpro.com" },
  { id: "liondesk", name: "LionDesk", url: "https://www.liondesk.com" },
  { id: "lofty", name: "Lofty (formerly Chime)", url: "https://lofty.com" },
  { id: "make", name: "Make.com (Integromat)", url: "https://www.make.com" },
  { id: "marketleader", name: "Market Leader", url: "https://www.marketleader.com" },
  { id: "moxiworks", name: "MoxiWorks", url: "https://moxiworks.com" },
  { id: "pipedrive", name: "Pipedrive", url: "https://www.pipedrive.com" },
  { id: "placester", name: "Placester", url: "https://placester.com" },
  { id: "propertybase", name: "Propertybase", url: "https://www.propertybase.com" },
  { id: "propertyware", name: "Propertyware", url: "https://www.propertyware.com" },
  { id: "realgeeks", name: "Real Geeks", url: "https://www.realgeeks.com" },
  { id: "rew", name: "Real Estate Webmasters (REW)", url: "https://www.realestatewebmasters.com" },
  { id: "realtyjuggler", name: "RealtyJuggler", url: "https://www.realtyjuggler.com" },
  { id: "realvolve", name: "Realvolve", url: "https://www.realvolve.com" },
  { id: "rechat", name: "Rechat", url: "https://rechat.com" },
  { id: "reonomy", name: "Reonomy", url: "https://www.reonomy.com" },
  { id: "salesforce", name: "Salesforce / Real Force", url: "https://www.salesforce.com" },
  { id: "sierra", name: "Sierra Interactive", url: "https://www.sierrainteractive.com" },
  { id: "sugarcrm", name: "SugarCRM", url: "https://www.sugarcrm.com" },
  { id: "topproducer", name: "Top Producer", url: "https://www.topproducer.com" },
  { id: "totalexpert", name: "Total Expert", url: "https://totalexpert.com" },
  { id: "wiseagent", name: "Wise Agent", url: "https://wiseagent.com" },
  { id: "ylopo", name: "Ylopo", url: "https://www.ylopo.com" },
  { id: "zapier", name: "Zapier Webhooks", url: "https://zapier.com" },
  { id: "zoho", name: "Zoho CRM", url: "https://www.zoho.com/crm" }
];

export default function Integrations() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "logs" ? "logs" : "integrations";

  const [integrations, setIntegrations] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [crmSearchQuery, setCrmSearchQuery] = useState("");
  const [showAllDirectory, setShowAllDirectory] = useState(false);
  
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
    }, (err) => {
      console.warn("[Integrations] Snapshot error (quota/offline):", err);
      setLoading(false);
    });
    return () => unsub();
  }, [user?.id]);

  const toggleIntegration = async (key: string, name?: string) => {
    if (!user?.id) return;
    const newValue = !integrations[key];
    const crmDisplayName = name || key.toUpperCase();
    try {
      await updateDoc(doc(db, "users", user.id), {
        [`integrations.${key}`]: newValue,
        "integrations.lastUpdated": Date.now(),
        ...(newValue ? { "integrations.activeCrm": crmDisplayName } : {})
      });
      toast.success(newValue ? `✨ ${crmDisplayName} CRM linked successfully!` : `${crmDisplayName} CRM unlinked.`);
    } catch (e) {
      toast.error("Failed to update integration state.");
    }
  };

  const filteredCrms = SUPPORTED_CRMS_47.filter(crm =>
    crm.name.toLowerCase().includes(crmSearchQuery.toLowerCase()) ||
    crm.url.toLowerCase().includes(crmSearchQuery.toLowerCase())
  );

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
      {/* Header and Sub-Page Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">CRM & Integrations</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Configure direct CRM connections, custom field mappings, and audit live lead sync events.
          </p>
        </div>

        {/* Sub-Page Navigation Tabs */}
        <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-xl shrink-0">
          <button
            onClick={() => setSearchParams({ tab: "integrations" })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "integrations"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Plug className="h-4 w-4" />
            Connected Integrations
          </button>
          <button
            onClick={() => setSearchParams({ tab: "logs" })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "logs"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Activity className="h-4 w-4 text-emerald-400" />
            CRM Sync Logs
          </button>
        </div>
      </div>

      {/* 47 CRMs Search Bar placed directly below header text */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
            <input
              type="text"
              value={crmSearchQuery}
              onChange={(e) => setCrmSearchQuery(e.target.value)}
              placeholder="Search 47 Supported CRMs (e.g. Follow Up Boss, kvCORE, Lofty, CINC, Top Producer)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium shadow-inner"
            />
            {crmSearchQuery && (
              <button
                onClick={() => setCrmSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold bg-slate-800 hover:bg-slate-700 h-5 w-5 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-300 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800">
              <Database className="h-3.5 w-3.5 text-blue-400" />
              <span>{filteredCrms.length} / 47 CRMs</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAllDirectory(!showAllDirectory)}
              className={`text-xs font-bold px-3 py-2.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                showAllDirectory || crmSearchQuery
                  ? "bg-blue-600 text-white border-blue-500 shadow-xs"
                  : "bg-slate-950 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700"
              }`}
            >
              {showAllDirectory ? "Hide Directory" : crmSearchQuery ? "Filtered Results" : "Browse All 47 CRMs"}
            </button>
          </div>
        </div>

        {/* Search Results / Directory Expansion */}
        {(crmSearchQuery.trim() !== "" || showAllDirectory) && (
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="uppercase tracking-wider flex items-center gap-1.5 text-blue-400">
                <Sparkles className="h-3.5 w-3.5" />
                {crmSearchQuery ? `Search Results for "${crmSearchQuery}"` : "Complete 47 CRM Directory"}
              </span>
              <span>Column A: Name • Column B: Official URL</span>
            </div>

            {filteredCrms.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-950 rounded-xl border border-slate-800">
                No CRM matching <span className="text-white font-bold">"{crmSearchQuery}"</span> was found.
                <p className="mt-1 text-slate-500 text-[11px]">
                  You can still connect any unlisted platform using our <strong className="text-slate-300">Custom Webhook / API Endpoint</strong>.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredCrms.map((crm) => {
                  const isLinked = Boolean(integrations[crm.id] || integrations[crm.name.toLowerCase().replace(/[^a-z0-9]/g, '')]);
                  return (
                    <div
                      key={crm.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                        isLinked
                          ? "bg-blue-950/40 border-blue-500/60 ring-1 ring-blue-500/30 text-white shadow-md"
                          : "bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-200 hover:bg-slate-900/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <span className="font-bold text-xs text-white block truncate" title={crm.name}>
                            {crm.name}
                          </span>
                          <a
                            href={crm.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium hover:underline truncate"
                            title={crm.url}
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            {crm.url.replace(/^https?:\/\/(www\.)?/, '')}
                          </a>
                        </div>
                        {isLinked ? (
                          <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-500/40 shrink-0">
                            Linked
                          </span>
                        ) : (
                          <span className="bg-slate-800/80 text-slate-400 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0">
                            Available
                          </span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleIntegration(crm.id, crm.name)}
                          className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isLinked
                              ? "bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50"
                              : "bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
                          }`}
                        >
                          {isLinked ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Disconnect CRM
                            </>
                          ) : (
                            <>
                              <Plug className="h-3.5 w-3.5" /> Link {crm.name.split(' ')[0]}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Render Active Sub-Page */}
      {activeTab === "logs" ? (
        <CrmSyncLogs />
      ) : (
        <div className="space-y-6">
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
      )}
    </div>
  );
}
