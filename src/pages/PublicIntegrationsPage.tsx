import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Database, 
  Send, 
  Link2, 
  Layers, 
  Network, 
  RefreshCw, 
  Code,
  CheckCircle2,
  Loader2
} from "lucide-react";

export default function PublicIntegrationsPage() {
  const [searchParams] = useSearchParams();
  const crmParam = searchParams.get("crm");
  const initialCrm = (crmParam === "hubspot" || crmParam === "fub" || crmParam === "generic") ? crmParam : "hubspot";
  const [selectedCrm, setSelectedCrm] = useState<"hubspot" | "fub" | "generic">(initialCrm);

  useEffect(() => {
    if (crmParam === "hubspot" || crmParam === "fub" || crmParam === "generic") {
      setSelectedCrm(crmParam);
    }
  }, [crmParam]);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const payloadSamples = {
    hubspot: {
      endpoint: "https://api.hubapi.com/crm/v3/objects/contacts",
      headers: {
        "Authorization": "Bearer hspa_xxxxxxxxxxxxxxxx",
        "Content-Type": "application/json"
      },
      json: {
        properties: {
          firstname: "Sarah",
          lastname: "Connor",
          email: "sarah.c@gmail.com",
          phone: "+14158882940",
          lead_source: "AI Open House Connect Open House Sign-In",
          brokerage_compliance_consent: "True",
          listing_address_visited: "888 Bel Air Road",
          showing_timeline_interest: "Immediate (1-3 months)",
          agent_notes_transcript: "Visitor browsed master pavilion, asked about local zoning..."
        }
      }
    },
    fub: {
      endpoint: "https://api.followupboss.com/v1/people",
      headers: {
        "Authorization": "Basic Zm9sbG93X3VwX2Jvc3Nfa2V5...",
        "Content-Type": "application/json"
      },
      json: {
        person: {
          firstName: "Sarah",
          lastName: "Connor",
          emails: [{ value: "sarah.c@gmail.com", type: "home", primary: true }],
          phones: [{ value: "+14158882940", type: "mobile", primary: true }],
          source: "AI Open House Connect",
          tags: ["Open House guest", "High Score Lead", "Bel Air Listing"],
          background: "Speech transcript: requested disclosure documents and requested contact info."
        }
      }
    },
    generic: {
      endpoint: "https://hooks.zapier.com/hooks/catch/128392/ox9a21",
      headers: {
        "Content-Type": "application/json"
      },
      json: {
        event_type: "open_house_signup",
        timestamp: "2026-05-26T19:22:15Z",
        listing: {
          address: "888 Bel Air Road",
          mls_number: "20526767",
          listing_agent: "Cassandra Vance",
          brokerage: "AI Open House Prestige"
        },
        visitor: {
          full_name: "Sarah Connor",
          email_address: "sarah.c@gmail.com",
          phone_number: "+14158882940",
          compliance_approval: true
        }
      }
    }
  };

  const triggerMockPayload = () => {
    setIsSending(true);
    setSendSuccess(false);

    setTimeout(() => {
      setIsSending(false);
      setSendSuccess(true);
    }, 1500);
  };

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-slate-50 via-white to-slate-100 min-h-screen text-slate-800 pb-24 text-left font-sans">
        
        {/* HERO */}
        <section className="relative py-20 px-6 overflow-hidden border-b border-slate-200">
          <div className="absolute inset-0 bg-grid-slate-900/[0.03] bg-[size:20px_20px]"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full filter blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto space-y-6 text-center max-w-3xl mx-auto z-10 relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase mx-auto">
              <Network className="h-3 w-3" /> Dedicated CRM Sync Pipelines
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Instant CRM Sync Engines <br />
              <span className="text-blue-600">No Manual Export Required</span>
            </h1>
            
            <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Connect leading architectural platforms—HubSpot, Follow Up Boss, LionDesk, Zapier, and raw JSON webhooks—to dispatch client open-house records, conversations, and hot-lead scores instantly.
            </p>
          </div>
        </section>

        {/* PAYLOAD SIMULATOR SECTION */}
        <section className="py-20 px-6 border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-stretch">
            
            {/* Left Box: options */}
            <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Integrations Controller Module</span>
                <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Interactive Target Connect Simulator</h2>
                <p className="text-slate-500 text-sm">
                  Click a target CRM adapter to check how the structured buyer sign-in JSON payloads are packed and dispatched during active events.
                </p>

                <div className="space-y-3 pt-2">
                  <button 
                    onClick={() => { setSelectedCrm("hubspot"); setSendSuccess(false); }}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center ${selectedCrm === "hubspot" ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">01. HubSpot API Adapter</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Contact properties alignment mappings, custom consent attributes.</p>
                    </div>
                    {selectedCrm === "hubspot" && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                  </button>

                  <button 
                    onClick={() => { setSelectedCrm("fub"); setSendSuccess(false); }}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center ${selectedCrm === "fub" ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">02. Follow Up Boss Adapter</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Person array alignment, historic notes tracking, custom labels.</p>
                    </div>
                    {selectedCrm === "fub" && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                  </button>

                  <button 
                    onClick={() => { setSelectedCrm("generic"); setSendSuccess(false); }}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center ${selectedCrm === "generic" ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">03. Zapier Webhook Trigger</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Direct raw POST payload, perfect for customized cascading automation scenarios.</p>
                    </div>
                    {selectedCrm === "generic" && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                  </button>
                </div>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 shadow-inner">
                <Button 
                  onClick={triggerMockPayload}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-xl flex gap-1.5"
                  disabled={isSending}
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Simulate Live Sync Delivery
                </Button>

                {sendSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-2 animate-in slide-in-from-top-2 duration-200 text-left">
                    <span className="text-emerald-600">✓</span>
                    <div>
                      <h5 className="text-[11px] font-bold text-emerald-800 uppercase font-mono">201 CREATED (SUCCESS)</h5>
                      <p className="text-[10px] text-emerald-600 mt-0.5 leading-normal">Payload exported secure. Client file Sarah Connor successfully recorded in target crm in 40ms.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Box: JSON Editor display */}
            <div className="lg:col-span-7 bg-slate-950 text-white rounded-[32px] p-6 sm:p-8 border border-slate-800 shadow-2xl flex flex-col justify-between relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full filter blur-3xl -mr-20 -mt-20"></div>
              
              <div className="space-y-4 relative z-10 flex-1 flex flex-col">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 text-xs font-mono">
                  <div className="flex gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <span>JSON Payload Editor Panel</span>
                  <span className="text-blue-400 font-bold uppercase tracking-wider">{selectedCrm.toUpperCase()} API</span>
                </div>

                <div className="space-y-2 text-xs font-mono text-slate-400 flex-1">
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span>RequestMethod:</span>
                    <span className="text-emerald-400 font-bold">POST</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span>DestinationEndpoint:</span>
                    <span className="text-slate-300 truncate max-w-xs sm:max-w-md">{payloadSamples[selectedCrm].endpoint}</span>
                  </div>
                  
                  <div className="space-y-1.5 pt-2">
                    <span>Payload Data String:</span>
                    <pre className="bg-slate-900 border border-slate-850 p-4 rounded-xl text-[11px] text-slate-200 overflow-x-auto font-mono max-h-[300px]">
                      {JSON.stringify(payloadSamples[selectedCrm].json, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>Compression: gzip</span>
                  <span>Payload size: ~1.2kb</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ECOSYSTEM ACCELERATORS */}
        <section className="py-20 px-6 max-w-7xl mx-auto space-y-16">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 border-l-4 border-blue-600 pl-3">Ecosystem Integrations</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Complete Sync Integrations Suite</h2>
            <p className="text-slate-600 leading-relaxed">
              Automate communication and track engagement patterns beautifully with zero manually loaded Excel exports.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white border rounded-3xl space-y-3">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Database className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900">CRM Auto-Export</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Dispatched directly to HubSpot CRM and Follow Up Boss contacts list. Map notes, showing timelines, transcripts, and scores easily.
              </p>
            </div>

            <div className="p-6 bg-white border rounded-3xl space-y-3">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Code className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900">Custom Webhooks POST API</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Setup custom URL targets and receive raw JSON payloads instantly. Perfect for in-house enterprise applications and specialized analytics suites.
              </p>
            </div>

            <div className="p-6 bg-white border rounded-3xl space-y-3">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900">Zapier & Make Scenarios</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Trigger complex workflow automation scenarios based on buyer open-house registration, voice chats, or disclosure requests.
              </p>
            </div>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
