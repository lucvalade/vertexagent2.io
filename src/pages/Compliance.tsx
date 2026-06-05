import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldAlert, BookOpen, CheckCircle, Fingerprint } from "lucide-react";

export default function Compliance() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
        <div 
          className="flex items-center gap-2 font-bold text-xl tracking-tight cursor-pointer" 
          onClick={() => navigate("/")}
        >
          <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white text-lg font-black">
            V
          </div>
          <span className="text-slate-900">VertexAgent.io</span>
        </div>
        <Button variant="ghost" onClick={() => navigate("/")} className="font-medium text-sm text-slate-600 hover:text-slate-900">
          Back to Home
        </Button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-20">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="space-y-4 text-center md:text-left border-b border-slate-200 pb-8">
            <span className="text-blue-600 text-xs font-black uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full inline-block">Real Estate Standards</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 uppercase italic">
              Platform <span className="text-blue-600">Compliance</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              We engineer VertexAgent.io to comply with local regulatory real estate frameworks, privacy consent mandates, and voice synthesis authorization policies.
            </p>
          </div>

          {/* Quick Pillars */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">CASL Consent</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Integrated opt-in gates for communication, ensuring all captured leads consent to email and SMS outreach.
              </p>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">RECO & Boards</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Strict adherence to Ontario and multi-state listing disclosure and agent representation criteria.
              </p>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                <Fingerprint className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Voice Approvals</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Verification protocols to run voice clones only with written consent or certified live-script readings.
              </p>
            </div>
          </div>

          {/* Detailed Content */}
          <div className="prose prose-slate max-w-none space-y-8 text-sm md:text-base leading-relaxed text-slate-600">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">1. Canada's Anti-Spam Legislation (CASL) and CAN-SPAM</h2>
              <p>
                VertexAgent.io provides automated follow-ups for real estate listings. Every time a buyer interacts with the AI voice or chat tour and bypasses the Lead Gate:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>They must click-confirm their agreement to be contacted by the verified listing agent.</li>
                <li>The system captures the precise date, time, and session parameters of the opt-in to supply audit trails.</li>
                <li>All automated agent emails contain explicit, direct unsubscribe buttons.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">2. Brokerage & Agent Disclosures (RECO, REA, TREB)</h2>
              <p>
                To maintain standard board compliance and prevent false listing representation, we mandate:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Clear Metadata Identifiers:</strong> Tour cards display the listing brokerage's legal name and the agent's registration details at the base of every immersive page layout.</li>
                <li><strong>Honest AI Labeling:</strong> Distinct status lines notify buyers that they are speaking with an "AI Assistant developed by VertexAgent.io on behalf of the listing team."</li>
                <li><strong>Audit Trails:</strong> Agents retain chronological access logs of system actions within their administrative console, ideal for compliance reviews.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">3. Voice Licensing & Synthesizer Safety Regulations</h2>
              <p>
                Our Voice Lab enables high-quality neural speech synthesis. To ensure ethically aligned deployment:
              </p>
              <p>
                We do not allow cloning public actors or unauthorized individuals. Agents must submit standard authorization consents before using custom cloned assets, or use our premium baseline pre-recorded voice vectors which undergo continuous optimization.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">4. Comprehensive Security Controls</h2>
              <p>
                Data security remains at the core of legal compliance. VertexAgent.io manages databases using firestore.rules mapping to avoid unauthenticated reads, while server proxy routes hide sensitive API keys and secrets from front-end dev inspect frames.
              </p>
              <div className="mt-4 p-4 bg-emerald-50 rounded-2xl flex gap-3 text-emerald-850 border border-emerald-100">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <p className="text-xs font-semibold">
                  VertexAgent.io is fully compliant with modern data protection standards, secure credential parameters, and regulatory real estate governance formats.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-200 bg-white">
        &copy; {new Date().getFullYear()} <a href="https://www.VertexAgent.io" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-slate-600">VertexAgent.io</a>. All rights reserved.
      </footer>
    </div>
  );
}
