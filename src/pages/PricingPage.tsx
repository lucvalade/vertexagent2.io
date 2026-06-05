import React, { useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Coins, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

export default function PricingPage() {
  const [activeListingsCount, setActiveListingsCount] = useState(5);

  const calculateSavings = (listings: number) => {
    const leadsCaptured = listings * 18;
    const hoursSaved = listings * 6;
    const commissionsProjected = (listings * 18 * 0.05 * 18000).toLocaleString(undefined, { maximumFractionDigits: 0 });
    return { leadsCaptured, hoursSaved, commissionsProjected };
  };

  const stats = calculateSavings(activeListingsCount);

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-slate-50 via-white to-slate-100 min-h-screen text-slate-800 pb-48 text-left font-sans">
        
        {/* HERO */}
        <section className="relative py-20 px-6 overflow-hidden border-b border-slate-200">
          <div className="absolute inset-0 bg-grid-slate-900/[0.03] bg-[size:20px_20px]"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full filter blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto space-y-6 text-center max-w-3xl mx-auto z-10 relative">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase mx-auto">
              <Coins className="h-3 w-3" /> Standard & Team Licensing Plans
            </span>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Transparent Pricing <br />
              <span className="text-blue-600">Built to Scale Your Listings</span>
            </h1>
            
            <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Choose the tier that fits your sales volume. Try any of our advanced plans free for 14 days, and scale up as your volume increases.
            </p>
          </div>
        </section>

        {/* ROI CALCULATOR SECTION */}
        <section className="py-20 px-6 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left box: description & slider */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-mono">ROI Projections Engine</span>
              <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Calculate Your Value</h2>
              <p className="text-slate-500 text-sm">
                Drag the interactive slider below to match your agency's average monthly active listings. See exactly how much time is recovered and how many buyer leads are nurtured effortlessly.
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border">
                  <span className="text-xs font-bold text-slate-700 uppercase font-mono">Active Monthly Listings</span>
                  <span className="text-lg font-black text-blue-600 font-mono">{activeListingsCount} Listings</span>
                </div>

                <div className="space-y-1">
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={activeListingsCount}
                    onChange={(e) => setActiveListingsCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 border"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>1 Listing</span>
                    <span>25 Listings</span>
                    <span>50 Listings</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right box: projection results cards */}
            <div className="lg:col-span-7 grid sm:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-2 border border-slate-800 text-center relative overflow-hidden">
                <span className="text-[10px] text-slate-400 font-mono uppercase font-black">leads captured</span>
                <p className="text-3xl font-extrabold text-blue-400 font-mono pt-2">{stats.leadsCaptured}</p>
                <p className="text-[10px] text-slate-500 font-mono leading-normal pt-2">Highly-qualified digital sign-in guest profiles collected monthly</p>
              </div>

              <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-2 border border-slate-800 text-center relative overflow-hidden">
                <span className="text-[10px] text-slate-400 font-mono uppercase font-black">Recovered Hours</span>
                <p className="text-3xl font-extrabold text-emerald-400 font-mono pt-2">+{stats.hoursSaved} hrs</p>
                <p className="text-[10px] text-slate-500 font-mono leading-normal pt-2">Erase manual data logins, brochure printing, & handwriting transcription</p>
              </div>

              <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-2 border border-slate-800 text-center relative overflow-hidden">
                <span className="text-[10px] text-slate-400 font-mono uppercase font-black">pipeline return</span>
                <p className="text-3xl font-extrabold text-amber-500 font-mono pt-2">${stats.commissionsProjected}</p>
                <p className="text-[10px] text-slate-500 font-mono leading-normal pt-2">Estimated commissions conversion values matching leads</p>
              </div>
            </div>

          </div>
        </section>

        {/* PRICING PLANS */}
        <section className="py-20 px-6 max-w-7xl mx-auto space-y-16">
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            
            {/* Starter Plan */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 flex flex-col justify-between text-left">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Starter Plan</h3>
                  <p className="text-xs text-slate-500 mt-1">Perfect for single real-estate agents starting out.</p>
                </div>

                <div className="flex items-baseline gap-1 py-2">
                  <span className="text-4xl font-black text-slate-950 font-mono">$49</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>

                <ul className="space-y-3 border-t border-slate-100 pt-4 text-xs">
                  <li className="flex gap-2.5 items-start">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Up to 3 Active Listings hosted</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>AI Guided Voice Tours (Sora)</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Tablet Kiosk Open House Sign-In</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Automatic SMS & Email Brochure alerts</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Zapier Connector integration</span>
                  </li>
                </ul>
              </div>

              <Button className="w-full h-11 bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-none border border-slate-300 rounded-xl font-bold mt-6">
                Start 14-Day Free Trial
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="bg-slate-950 text-white p-8 rounded-3xl border border-blue-900 shadow-xl space-y-6 flex flex-col justify-between text-left relative overflow-hidden">
              <div className="absolute top-0 right-[-40px] bg-blue-600 text-[10px] font-black tracking-widest px-12 py-1.5 uppercase rotate-45">POPULAR</div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-white">Pro Professional</h3>
                  <p className="text-xs text-slate-400 mt-1">Ideal for expanding residential teams & top-producers.</p>
                </div>

                <div className="flex items-baseline gap-1 py-2">
                  <span className="text-4xl font-black text-white font-mono">$129</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>

                <ul className="space-y-3 border-t border-slate-800 pt-4 text-xs">
                  <li className="flex gap-2.5 items-start">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <span className="font-bold text-slate-200">UNLIMITED Active Listings</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>Gemini Pro URL Magic Extraction in 20s</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>Customizable Voice Narrations (Cora / Sora)</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>Automated Feedback Questionnaires dispatch</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>HubSpot, Follow Up Boss & LionDesk Syncs</span>
                  </li>
                </ul>
              </div>

              <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-6">
                Get Started Pro Free
              </Button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 flex flex-col justify-between text-left">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Custom Brokerage</h3>
                  <p className="text-xs text-slate-500 mt-1">Scale controls across teams, branches, and full offices.</p>
                </div>

                <div className="flex items-baseline gap-1 py-2">
                  <span className="text-3xl font-black text-slate-950 uppercase font-mono">Contact Sales</span>
                </div>

                <ul className="space-y-3 border-t border-slate-100 pt-4 text-xs">
                  <li className="flex gap-2.5 items-start">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span className="font-bold">Everything in Professional Pro</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Centralized Compliance locks for disclosure terms</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Cascading Brand Templates controls</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Regional CRM Partitioning guidelines</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Dedicated round-the-clock Account Concierge</span>
                  </li>
                </ul>
              </div>

              <Button className="w-full h-11 bg-slate-900 text-white hover:bg-slate-850 rounded-xl font-bold mt-6">
                Consult Enterprise Sales
              </Button>
            </div>

          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
