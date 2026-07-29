import React from "react";
import PublicLayout from "@/components/PublicLayout";
import { Sparkles, ArrowRight, ShieldCheck, Cpu, Database, ClipboardCheck } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function HowItWorksPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <div id="how-it-works" className="relative min-h-[80vh] flex flex-col justify-center py-20 px-6 bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden">
        {/* Background decorative blob elements */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100 rounded-full filter blur-3xl opacity-40 -z-10 animate-pulse duration-[6000ms]" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-100 rounded-full filter blur-3xl opacity-30 -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase border border-blue-100 shadow-sm"
          >
            <Sparkles className="h-3 w-3" /> Core Capabilities & Value
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[36px] md:text-[54px] font-extrabold tracking-tight text-slate-900 leading-tight"
          >
            How It <span className="text-blue-600 bg-clip-text">Works</span>
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6 text-left bg-white/70 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-100/50"
          >
            <p className="text-slate-700 text-lg md:text-xl leading-relaxed font-normal">
              AI Open House Connect is an all-in-one AI-powered real estate, digital sign-in, and spatial voice narration platform tailored for property showcases, open houses, and automated lead capture. It lets real estate professionals and brokerages deploy smart tablet kiosk modes at properties to record digital visitor registrations with bulletproof compliance, while instantly generating immersive voice-guided tours led by Sora that guide visitors fluidly through each room environment.
            </p>

            <p className="text-slate-700 text-lg md:text-xl leading-relaxed font-normal">
              By combining your direct or MLS/Zillow URL imports powered by Google Gemini and custom extraction pipes with real-time CRM synchronization engines like HubSpot or Follow Up Boss, the platform transforms static listing information into automated conversational funnels. The system handles everything from automated speech walkthroughs and instant flyer QR generation to rigorous MLS disclosure tracking and structured analytic reviews, ensuring every home show runs as a modern, high-converting digital exhibition.
            </p>
          </motion.div>

          {/* Quick specs grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4"
          >
            {/* Card 1 */}
            <div className="relative bg-slate-50 hover:bg-blue-600 border border-slate-200 hover:border-blue-700 p-6 rounded-2xl h-52 flex flex-col items-center justify-center text-center transition-all duration-300 group cursor-help shadow-sm hover:shadow-lg overflow-hidden">
              <div className="flex flex-col items-center transition-all duration-300 group-hover:-translate-y-8 group-hover:opacity-0">
                <Cpu className="h-8 w-8 text-blue-600 group-hover:text-white mb-3 transition-colors duration-300" />
                <span className="text-sm font-extrabold text-slate-800">Dynamic Voice AI</span>
              </div>
              <div className="absolute inset-0 p-4 flex flex-col items-center justify-center bg-blue-600 text-white opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <Cpu className="h-5 w-5 mb-1 text-blue-100" />
                <span className="text-xs font-black uppercase tracking-wider mb-1 text-center">Dynamic Voice AI</span>
                <p className="text-[11px] leading-relaxed font-medium text-blue-50 select-none text-left w-full px-2 mt-1">
                  This advanced engine synthesizes professional neural narrations based on property attributes to generate human-like voice walkthroughs, keeping potential buyers engaged throughout the tour.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="relative bg-slate-50 hover:bg-blue-600 border border-slate-200 hover:border-blue-700 p-6 rounded-2xl h-52 flex flex-col items-center justify-center text-center transition-all duration-300 group cursor-help shadow-sm hover:shadow-lg overflow-hidden">
              <div className="flex flex-col items-center transition-all duration-300 group-hover:-translate-y-8 group-hover:opacity-0">
                <ClipboardCheck className="h-8 w-8 text-blue-600 group-hover:text-white mb-3 transition-colors duration-300" />
                <span className="text-sm font-extrabold text-slate-800">Compliant Sign-In</span>
              </div>
              <div className="absolute inset-0 p-4 flex flex-col items-center justify-center bg-blue-600 text-white opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <ClipboardCheck className="h-5 w-5 mb-1 text-blue-100" />
                <span className="text-xs font-black uppercase tracking-wider mb-1 text-center">Compliant Sign-In</span>
                <p className="text-[11px] leading-relaxed font-medium text-blue-55 select-none text-left w-full px-2 mt-1">
                  The digital check-in modal safeguards open houses by collecting visitor consents and broker declarations, enforcing local MLS disclosure rules automatically to provide zero-liability hosting.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="relative bg-slate-50 hover:bg-blue-600 border border-slate-200 hover:border-blue-700 p-6 rounded-2xl h-52 flex flex-col items-center justify-center text-center transition-all duration-300 group cursor-help shadow-sm hover:shadow-lg overflow-hidden">
              <div className="flex flex-col items-center transition-all duration-300 group-hover:-translate-y-8 group-hover:opacity-0">
                <Database className="h-8 w-8 text-blue-600 group-hover:text-white mb-3 transition-colors duration-300" />
                <span className="text-sm font-extrabold text-slate-800">MLS & More URL Ingestion</span>
              </div>
              <div className="absolute inset-0 p-4 flex flex-col items-center justify-center bg-blue-600 text-white opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <Database className="h-5 w-5 mb-1 text-blue-100" />
                <span className="text-xs font-black uppercase tracking-wider mb-1 text-center">MLS & More URL Ingestion</span>
                <p className="text-[11px] leading-relaxed font-medium text-blue-50 select-none text-left w-full px-2 mt-1">
                  Paste any public MLS, Zillow, or Redfin link to import listing data in under twenty seconds. Our parser extracts room descriptions, price changes, and main specs with high accuracy.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="relative bg-slate-50 hover:bg-blue-600 border border-slate-200 hover:border-blue-700 p-6 rounded-2xl h-52 flex flex-col items-center justify-center text-center transition-all duration-300 group cursor-help shadow-sm hover:shadow-lg overflow-hidden">
              <div className="flex flex-col items-center transition-all duration-300 group-hover:-translate-y-8 group-hover:opacity-0">
                <ShieldCheck className="h-8 w-8 text-blue-600 group-hover:text-white mb-3 transition-colors duration-300" />
                <span className="text-sm font-extrabold text-slate-800">CRM Automatons</span>
              </div>
              <div className="absolute inset-0 p-4 flex flex-col items-center justify-center bg-blue-600 text-white opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <ShieldCheck className="h-5 w-5 mb-1 text-blue-100" />
                <span className="text-xs font-black uppercase tracking-wider mb-1 text-center">CRM Automatons</span>
                <p className="text-[11px] leading-relaxed font-medium text-blue-50 select-none text-left w-full px-2 mt-1">
                  This integration layer automatically captures registrations and syncs visitor activity with CRM pipelines, initiating Follow Up Boss or HubSpot workflows to seamlessly convert buyers.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-6 flex flex-wrap gap-4 justify-center"
          >
            <Button onClick={() => navigate("/register")} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-base px-8 py-6 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center gap-2">
              Get Started For Free <ArrowRight className="h-5 w-5" />
            </Button>
            <Button onClick={() => navigate("/demo#simulator-flow")} variant="outline" size="lg" className="border-slate-300 font-bold text-base px-8 py-6 rounded-2xl hover:bg-slate-50">
              Try Interactive Demo
            </Button>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
}
