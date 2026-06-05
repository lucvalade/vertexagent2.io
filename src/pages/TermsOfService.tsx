import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scale, CreditCard, AlertCircle, Sparkles } from "lucide-react";

export default function TermsOfService() {
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
              Terms Of <span className="text-blue-600">Service</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              Effective Date: May 25, 2026. Please read these terms carefully before utilizing VertexAgent.io platform features, website, or associated dashboards.
            </p>
          </div>

          {/* Quick Pillars */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">User Conduct</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Agents must upload accurate listing details and comply with licensing disclosures and local real estate boards.
              </p>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Fair Subscription</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Clear billing for Pro ($199/mo) and Elite ($499/mo) with a 25% discount lock for full Advance passes.
              </p>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="h-10 w-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">No Guarantees</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our tools generate high-intent buyer transcripts, but we do not guarantee specific target conversion ratios.
              </p>
            </div>
          </div>

          {/* Detailed Content */}
          <div className="prose prose-slate max-w-none space-y-8 text-sm md:text-base leading-relaxed text-slate-600">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">1. Acceptances of Service</h2>
              <p>
                By opening, creating, or using an account on VertexAgent.io (including all corresponding child widgets or directories hosted on Cloud Run systems), you agree to bind yourself to our platform rules. If you do not accept these criteria without modification, you are strictly prohibited from utilizing our tools.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">2. Account Registration & Credentials</h2>
              <p>
                To utilize our primary tracking features or establish a Listing Voice Tour, you must register a certified account. You guarantee that all registration data is true, valid, and accurate. You are solely responsible for maintaining robust credentials (password, session cookies) and coordinating with Firebase Auth guidelines. Any activities happening under your license are your sole responsibility.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">3. Billing Services & 25% Advance Discount Lock</h2>
              <p>
                We operate on standard transparent subscriptions (Free, Pro, and Elite tiers):
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Basic Tiers (Free):</strong> Confined to standard pins status, baseline indices, and maximum 20-meter limits.</li>
                <li><strong>Pro Subscription:</strong> $199 CAD/month for advanced targeting (up to 50 meters geofence radius) and priority AI recommendation sorting.</li>
                <li><strong>Elite Tier:</strong> $499 CAD/month for custom transit interception nodes, glowing sponsors, and up to 100+ meters custom radii.</li>
                <li><strong>The 25% Advance Discount Rule:</strong> Subscribers can elect to lock in their World Cup tournament windows or premium annual passes in advance to lock a rigid <strong>25% discount reduction</strong> on monthly invoices.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">4. Prohibited Behaviors Guidance</h2>
              <p>
                While using VertexAgent.io, you agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Create mock or fraudulent property listings that misguide public users, or upload unauthorized voice clones without active consent documentation.</li>
                <li>Reverse-engineer backend route endpoints or attempt to break firestore.rules security boundaries.</li>
                <li>Dodge geofencing limit structures or input malicious SQL/script payloads into input panels.</li>
                <li>Violate local RECO, FTC, or state/provincial brokerage display guidelines.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">5. Disclaimers of Warranties</h2>
              <p>
                VERTEXAGENT.IO, ITS AI MODELS, SYNTHESIS LAB, AND SPATIAL INTEGRATIONS ARE SUPPLIED "AS IS" AND "AS AVAILABLE." WE DISCLAIM ALL EXPLICIT OR IMPLIED WARRANTIES, INCLUDING STABILITY, TIMEFRAME ACCURACIES, MERCHANT SUCCESS, OR CONVERSATION METRIC MINIMUMS. WE DO NOT GUARANTEE SYSTEM EMISSIONS WILL ESCAPE STANDARD EMAIL INBOX SPAM FOLDERS IN 100% OF CASES.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">6. Limitation of Liability</h2>
              <p>
                TO THE GREATEST EXTENT PERMITTED BY RELEVANT LEGISLATION, IN NO CIRCUMSTANCES SHALL VERTEXAGENT.IO OR ITS CORE INFRASTRUCTURE PLATFORMS BE RESPONSIBLE FOR INDIRECT, COMPENSATORY, SPECIAL, ACCIDENTAL, OR EXEMPLARY LOSSES (INCLUDING LOST PROFITS, CREDIBILITY FAILS, DATA DESTRUCTS, OR MACHINE DOWNTIMES) RESULTING FROM PLATFORM UTILIZATION OR FAILURES.
              </p>
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
