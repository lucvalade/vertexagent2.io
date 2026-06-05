import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Eye, Server, RefreshCw } from "lucide-react";

export default function PrivacyPolicy() {
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
            <span className="text-blue-600 text-xs font-black uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full inline-block">Legal Center</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 uppercase italic">
              Privacy <span className="text-blue-600">Policy</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              Last Updated: May 25, 2026. This Privacy Policy details how VertexAgent.io ("we", "us", "our") collects, uses, protects, and discloses personal data for real estate tours.
            </p>
          </div>

          {/* Quick Pillars */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Security First</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We store and transmit all data over industry-standard encrypted channels and monitor accesses closely.
              </p>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="h-10 w-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Limited Use</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We collect lead information solely to match prospective buyers with verified listing agents' workflows.
              </p>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Your Rights</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                You retain complete access, modification, and deletion rights of any personally identifiable info on our systems.
              </p>
            </div>
          </div>

          {/* Detailed Content */}
          <div className="prose prose-slate max-w-none space-y-8 text-sm md:text-base leading-relaxed text-slate-600">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">1. Information We Collect</h2>
              <p>
                To provide AI-driven talking virtual real estate tours, we collect elements when listing agents, brokerages, and prospective buyers interact with our ecosystem:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Data:</strong> Includes name, email address, password, custom voice configurations, licensing numbers, profile photos, and billing files.</li>
                <li><strong>Tour & Listing Information:</strong> Property addresses, listing URLs, images, documentation, custom property highlights, and AI-generated tour scripts.</li>
                <li><strong>Lead & Conversational Records:</strong> Names, verified phone numbers, emails, chat transcripts, voice messages, interaction logs, and intent scores analyzed by Gemini Real Estate Core models.</li>
                <li><strong>Technical Diagnostics:</strong> IP addresses, browser types, geo-location hints, device orientations, and usage timestamps on Port 3000 sessions.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">2. How We Use Information</h2>
              <p>
                We put collected data into operational use through VertexAgent.io features:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Instantly creating and managing digital talking open houses and spatial 3D tour landing pages.</li>
                <li>Translating buyer questions fluently into 90+ supported languages automatically.</li>
                <li>Qualifying and formatting lead cards sent to premium dashboard holders under explicit user consent options.</li>
                <li>Generating and maintaining audit-ready system logs of agent/admin configuration mutations and email emissions.</li>
                <li>Optimizing application latency, HMR controls, and background model responses.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">3. Lead Consent Options & CASL Coordination</h2>
              <p>
                We do not engage in cold spamming or unsolicited mass contacts. In accordance with Canada's Anti-Spam Legislation (CASL) and FTC standards, prospective buyers are explicitly prompted for consensus ("opt-in") via the Lead Gate interface before being connected to their selected listing agent. Transcripts find secure shelter in Firestore database modules.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">4. Third-Party Integrations & Cloud Partners</h2>
              <p>
                VertexAgent.io operates utilizing trusted top-tier infrastructure platforms. Personal telemetry and media assets map to specific service pipelines:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Google Cloud & Firebase:</strong> For reliable Firestore persistence, user verification handshakes, and AI text/voice generation pipelines.</li>
                <li><strong>Hostinger CDN:</strong> Providing accelerated static file caches and Progressive Web App asset packaging.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">5. Security, Hosting & Retention</h2>
              <p>
                All databases are guarded behind robust firestore.rules security parameters. Lead records are stored securely, honoring the custom retention policies defined under authenticated broker setups. When a merchant deletes their profile or request logs, those files are permanently unlinked and scrubbed.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">6. Updates to This Policy</h2>
              <div className="p-4 bg-slate-100 rounded-2xl flex gap-3 text-slate-600">
                <RefreshCw className="h-5 w-5 text-blue-600 shrink-0" />
                <p className="text-xs">
                  We reserve the right to periodically alter this policy in response to changing legal frameworks or product modifications. Continued utilization of this applet serves as automated consent to any subsequent policies.
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
