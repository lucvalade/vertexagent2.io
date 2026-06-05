import React, { useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Building, 
  ShieldCheck, 
  Layers, 
  Users, 
  Globe, 
  FileText, 
  CheckCircle2,
  Lock,
  Compass,
  Briefcase
} from "lucide-react";

export default function BrokeragesPage() {
  const [activeBrand, setActiveBrand] = useState<"vertex" | "lux" | "remax">("vertex");

  const brandPolicies = {
    vertex: {
      name: "Vertex Prestige Real Estate",
      color: "#2563eb",
      terms: "© 2026 Vertex Corp. All transactions subject to pre-registration and local state board guidelines. MLS status verified.",
      disclaimer: "Vertex Prestige enforces equal housing opportunities and strictly holds state-wide dual-agency transparency regulations."
    },
    lux: {
      name: "Aether & Horizon Luxury Global",
      color: "#b45309",
      terms: "© Horizontal Luxury International. Private listing agreements remain confidential under Horizon's brokerage criteria.",
      disclaimer: "Horizon Group holds pre-arranged privacy contracts on behalf of high-net-worth sellers. Pre-qualification documents are required prior to entry."
    },
    remax: {
      name: "Pinnacle Residential Realty",
      color: "#ef4444",
      terms: "© Pinnacle Franchise System. Indepedently owned and operated branches. MLS verified data provided directly.",
      disclaimer: "Pinnacle Group complies with regional board laws, requiring registered guest logs matching safety, disclosure & showing follow-up guidelines."
    }
  };

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-slate-50 via-white to-slate-100 min-h-screen text-slate-850 pb-24 text-left font-sans">
        
        {/* HERO */}
        <section className="relative py-20 px-6 overflow-hidden border-b border-slate-200">
          <div className="absolute inset-0 bg-grid-slate-900/[0.03] bg-[size:20px_20px]"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full filter blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 relative z-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase">
                <Building className="h-3 w-3" /> Solutions for Enterprise Brokerages
              </div>
              
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Cascading Branding. <br />
                <span className="text-blue-600">Locked Compliance.</span>
              </h1>
              
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Standardize listing setups, disclosures, flyer templates, and lead routing parameters across thousands of agents from a single, centralized broker dashboard.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <a href="#compliance-demo" className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-center">
                  Try Cascading Brand Emulator
                </a>
                <a href="#teams-features" className="px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-sm transition-all text-center">
                  Enterprise Features
                </a>
              </div>
            </div>

            {/* Visual representation card */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-6">
              <div className="flex justify-between items-center text-xs text-slate-400 font-mono pb-2 border-b">
                <span>Enterprise Cascade Model</span>
                <span className="text-blue-600 font-bold uppercase tracking-wider">Brokerage Admin Portal</span>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 relative">
                  <div className="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 border-amber-500/30">LOCKED</div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-blue-600" /> 1. Grand Broker Settings
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Uploaded brand logos, exact palette codes, and regulatory disclosures cascade directly to individual agent accounts.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 relative">
                  <div className="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-800 border-emerald-500/30">AUTO</div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-blue-600" /> 2. Agent Level Customizations
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Agents insert personal photos, call indicators, and social profiles. Core styles remain beautifully compliant automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CASCADING BRAND EMULATOR */}
        <section id="compliance-demo" className="py-20 px-6 border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto space-y-12">
            
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Hierarchy Simulation Engine</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-950">
                Interactive Brand Cascade Simulator
              </h2>
              <p className="text-slate-500 text-sm">
                Click a franchise profile below to see how our layout, active color schemes, compliance, and terms cascade instantaneously.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-5 space-y-4">
                <h3 className="font-extrabold text-sm text-slate-500 uppercase tracking-widest font-mono">Select Active Franchise Profile:</h3>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => setActiveBrand("vertex")}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center ${activeBrand === "vertex" ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">01. Vertex Prestige Real Estate</h4>
                      <p className="text-[11px] text-slate-500 mt-1">Sleek, high-contrast, modern local agency style.</p>
                    </div>
                    {activeBrand === "vertex" && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                  </button>

                  <button 
                    onClick={() => setActiveBrand("lux")}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center ${activeBrand === "lux" ? "border-amber-700 bg-amber-50/20 shadow-sm" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">02. Aether & Horizon Luxury Global</h4>
                      <p className="text-[11px] text-slate-500 mt-1">Elegant, gold/stone palettes optimized for premium estates.</p>
                    </div>
                    {activeBrand === "lux" && <CheckCircle2 className="h-4 w-4 text-amber-700" />}
                  </button>

                  <button 
                    onClick={() => setActiveBrand("remax")}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center ${activeBrand === "remax" ? "border-red-500 bg-red-50/30 shadow-sm" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">03. Pinnacle Residential Realty</h4>
                      <p className="text-[11px] text-slate-500 mt-1">Bold, prominent red details designed for franchise offices.</p>
                    </div>
                    {activeBrand === "remax" && <CheckCircle2 className="h-4 w-4 text-red-500" />}
                  </button>
                </div>
              </div>

              {/* Right: Actual visual cascade preview */}
              <div className="lg:col-span-7 bg-slate-950 text-white rounded-[32px] p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 text-left">
                
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-xs font-mono">
                  <span>LIVE FLYER INHERITANCE VIEW</span>
                  <span style={{ color: brandPolicies[activeBrand].color }} className="font-bold uppercase">BRAND DETECTED</span>
                </div>

                <div className="space-y-4">
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div style={{ backgroundColor: brandPolicies[activeBrand].color }} className="h-4 w-4 rounded"></div>
                        <h4 className="text-xs font-bold text-slate-100">{brandPolicies[activeBrand].name}</h4>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">COMPLIANT</span>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl space-y-2 border border-slate-850">
                      <p className="text-[11px] text-slate-400 font-mono tracking-wide">ACTIVE SIGN-IN LEGAL DISCLOSURES:</p>
                      <p className="text-xs text-slate-300 leading-relaxed font-normal">
                        {brandPolicies[activeBrand].disclaimer}
                      </p>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-normal font-mono border-t border-slate-800 pt-3">
                      {brandPolicies[activeBrand].terms}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400 text-center italic">
                    "When any associated agent launches a listing, these legal footers, licensing notices, and brand colors lock automatically."
                  </p>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ENTERPRISE FEATURES */}
        <section id="teams-features" className="py-20 px-6 max-w-7xl mx-auto space-y-16">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-black uppercase text-blue-600 border-l-4 border-blue-600 pl-3">Administrative Control</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Structured Hierarchy & Team Guardrails</h2>
            <p className="text-slate-600 leading-relaxed">
              Scale your real-estate processes while maintaining bulletproof compliance safeguards overall.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            <div className="bg-white hover:bg-blue-600 p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3 transition-all duration-300 group cursor-default">
              <div className="h-10 w-10 bg-blue-50 group-hover:bg-blue-500 text-blue-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-white text-sm transition-colors duration-300">Team Hierarchy View</h3>
              <p className="text-xs text-slate-500 group-hover:text-blue-100 leading-normal transition-colors duration-300">
                Compare analytics, scans, conversations, visitor sign-ins, and marketing efficacy metrics across counties, offices, and teams.
              </p>
            </div>

            <div className="bg-white hover:bg-blue-600 p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3 transition-all duration-300 group cursor-default">
              <div className="h-10 w-10 bg-indigo-50 group-hover:bg-indigo-500 text-indigo-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-white text-sm transition-colors duration-300">Regulatory Disclosures Safeguards</h3>
              <p className="text-xs text-slate-500 group-hover:text-blue-100 leading-normal transition-colors duration-300">
                Avoid regulatory licensing violations. Lock state-specific disclosures and dual-agency consents in individual entry forms automatically.
              </p>
            </div>

            <div className="bg-white hover:bg-blue-600 p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3 transition-all duration-300 group cursor-default">
              <div className="h-10 w-10 bg-emerald-50 group-hover:bg-emerald-500 text-emerald-600 group-hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-white text-sm transition-colors duration-300">Custom Domains & Branding</h3>
              <p className="text-xs text-slate-500 group-hover:text-blue-100 leading-normal transition-colors duration-300">
                Provide custom premium Sub-URLs and microsites matching your agency lookup directly, complete with compliance headers and safe cookies.
              </p>
            </div>

          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
