import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Mic, Globe, BarChart3, Search, Loader2, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, loginWithGoogle } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

export default function PublicSite() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate("/app/overview", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const navLinks = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Brokerages", href: "#brokerages" },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 overflow-x-hidden bg-slate-50">
      <header className="fixed top-0 inset-x-0 h-16 bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white text-lg">
              V
            </div>
            VertexAgent.io
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="hover:text-blue-600 transition-colors">{link.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4">
              {user ? (
                <Button onClick={() => navigate("/app")}>Go to App</Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate("/login")}>Log In</Button>
                  <Button onClick={() => navigate("/register")}>Start Free Trial</Button>
                </>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <div className="md:hidden flex items-center gap-2">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger 
                  render={
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-6 w-6" />
                    </Button>
                  }
                />
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col gap-8 mt-8">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                      <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white text-lg">
                        V
                      </div>
                      VertexAgent.io
                    </div>
                    <nav className="flex flex-col gap-4">
                      {navLinks.map((link) => (
                        <SheetClose 
                          key={link.label}
                          render={
                            <a 
                              href={link.href} 
                              className="text-lg font-medium text-slate-600 hover:text-blue-600 transition-colors py-2"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {link.label}
                            </a>
                          }
                        />
                      ))}
                    </nav>
                    <div className="flex flex-col gap-3 pt-6 border-t">
                      {user ? (
                        <Button onClick={() => { navigate("/app"); setMobileMenuOpen(false); }} className="w-full">Go to App</Button>
                      ) : (
                        <>
                          <Button variant="outline" onClick={() => { navigate("/login"); setMobileMenuOpen(false); }} className="w-full">Log In</Button>
                          <Button onClick={() => { navigate("/register"); setMobileMenuOpen(false); }} className="w-full">Start Free Trial</Button>
                        </>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-24 md:py-32 px-6 max-w-7xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-slate-900 max-w-4xl mx-auto leading-tight">
            Turn every listing into a <span className="text-blue-600">talking open house.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            VertexAgent.io transforms static properties into live, multilingual, voice-first tours that capture and qualify leads automatically.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full" onClick={() => navigate("/register")}>
              Start for Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full" onClick={() => navigate("/tour/sample")}>
               Watch a Demo Tour
            </Button>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 bg-white px-6">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">From URL to Live Tour in Minutes</h2>
              <p className="text-lg text-slate-600">The fastest QR-to-conversation-to-lead loop in real estate.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 relative">
              <div className="space-y-4 text-center">
                <div className="h-16 w-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl border-2 border-slate-200">1</div>
                <h3 className="font-semibold text-lg">Import Listing</h3>
                <p className="text-slate-500 text-sm">Paste a URL or enter data manually to extract property details.</p>
              </div>
              <div className="space-y-4 text-center">
                <div className="h-16 w-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl border-2 border-slate-200">2</div>
                <h3 className="font-semibold text-lg">Review Content</h3>
                <p className="text-slate-500 text-sm">Review extracted data, voice settings, and upload documents.</p>
              </div>
               <div className="space-y-4 text-center">
                <div className="h-16 w-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl border-2 border-slate-200">3</div>
                <h3 className="font-semibold text-lg">Publish QR</h3>
                <p className="text-slate-500 text-sm">Print a sign rider QR code that links straight to the tour.</p>
              </div>
              <div className="space-y-4 text-center">
                <div className="h-16 w-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl border-2 border-slate-200">4</div>
                <h3 className="font-semibold text-lg">Capture Leads</h3>
                <p className="text-slate-500 text-sm">The AI answers questions, gauges interest, and collects info.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-slate-50 px-6 border-y border-slate-200">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything You Need to Sell Faster</h2>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Mic, title: "AI Talking Tour", desc: "A conversational agent that answers questions contextually based on listing details." },
                { icon: Globe, title: "Multilingual Voice", desc: "Instantly supports 100+ languages to talk to any market demographic." },
                { icon: Home, title: "Room-Aware Sync", desc: "Automatically updates visuals on the visitor's screen as the agent talks." },
                { icon: Search, title: "Lead Gate", desc: "Captures qualified leads automatically when interest levels are high." },
                { icon: BarChart3, title: "Analytics", desc: "Track scans, conversations, intent scores, and top questions asked." },
              ].map((f, i) => (
                <div key={i} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{f.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Brokerages */}
        <section id="brokerages" className="py-24 bg-slate-900 text-white px-6">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built for Brokerages</h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                VertexAgent provides enterprise-grade compliance, branding, and team management natively built for modern real estate brokerages.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { 
                  title: "RECO-Compliant Branding", 
                  desc: "Configure brokerage identity, logos, brand colors, and disclosures to ensure all agents and listings remain compliant." 
                },
                { 
                  title: "Intelligent Lead Routing", 
                  desc: "Set rules for lead capture—send directly to Hubspot, run through Zapier, or round-robin to your available agents via webhook or SMS." 
                },
                { 
                  title: "Team & Asset Defaults", 
                  desc: "Deploy predefined templates including default AI tone, room taxonomies, document attachments, and lead gate thresholds for all agents." 
                },
                { 
                  title: "Data Consent & Security", 
                  desc: "Automate CASL/privacy consents, control voice cloning approvals, and set record-retention policies for leads and chat transcripts." 
                },
              ].map((f, i) => (
                <div key={i} className="p-6 bg-slate-800 rounded-2xl border border-slate-700 space-y-4">
                  <h3 className="text-xl font-semibold text-white">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="max-w-4xl mx-auto bg-slate-800 border border-slate-700 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 flex-1">
                <h3 className="text-2xl font-bold">Automate your agent onboarding</h3>
                <p className="text-slate-300 text-sm">
                  With our V1 brokerage portal, agents instantly inherit your brokerage's branding, CRM mappings, and compliance rules. You control what goes out—they focus on closing the deal. 
                </p>
              </div>
              <Button size="lg" className="shrink-0 bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/register")}>
                Book a Brokerage Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 bg-white px-6">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Simple, flexible pricing</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Pricing models designed to maximize your revenue while minimizing friction, matching the seasonal nature of real estate.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Pay-Per-Listing */}
              <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold">Pay-Per-Listing</h3>
                  <p className="text-slate-500 mt-2 text-sm">Best for individual agents or those with low volume.</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold tracking-tight">$49-79</span>
                  <span className="text-slate-500 font-medium"> / listing</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex gap-3 text-sm text-slate-700">
                    <div className="mt-1 h-4 w-4 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">✓</div>
                    Full URL Ingest & Vision Labeling
                  </li>
                  <li className="flex gap-3 text-sm text-slate-700">
                    <div className="mt-1 h-4 w-4 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">✓</div>
                    Active "Talking Tour" for 90 days or until sold
                  </li>
                  <li className="flex gap-3 text-sm text-slate-700">
                    <div className="mt-1 h-4 w-4 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">✓</div>
                    Up to 100 limit "Conversations" (tours)
                  </li>
                  <li className="flex gap-3 text-sm text-slate-700">
                    <div className="mt-1 h-4 w-4 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">✓</div>
                    Standard lead alerts & Zero commitment
                  </li>
                  <li className="flex gap-3 text-sm text-slate-700">
                    <div className="mt-1 h-4 w-4 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">✓</div>
                    AI Inference Cost Included
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => navigate("/register")}>Start with 1 Listing</Button>
              </div>

              {/* Hybrid (Pilot) */}
              <div className="p-8 rounded-3xl border-2 border-blue-600 bg-blue-50/50 shadow-md flex flex-col relative transform md:-translate-y-4">
                <div className="absolute top-0 right-8 -translate-y-1/2">
                  <span className="bg-blue-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">Recommended</span>
                </div>
                <div className="mb-4">
                  <h3 className="text-2xl font-bold">Hybrid (Pilot)</h3>
                  <p className="text-slate-500 mt-2 text-sm">Balances your predictable income with high AI token costs.</p>
                </div>
                <div className="flex flex-col mb-6 gap-1">
                  <div>
                    <span className="text-4xl font-extrabold tracking-tight">$29</span>
                    <span className="text-slate-500 font-medium"> / month base</span>
                  </div>
                  <div className="text-sm font-medium text-blue-700">
                    + $0.15/min AI talk time &amp; $2/lead captured
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex gap-3 text-sm text-slate-700">
                    <div className="mt-1 h-4 w-4 shrink-0 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">✓</div>
                    Unlimited listings (Pay for what you use)
                  </li>
                  <li className="flex gap-3 text-sm text-slate-700">
                    <div className="mt-1 h-4 w-4 shrink-0 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">✓</div>
                    Scalable for teams of any size
                  </li>
                  <li className="flex gap-3 text-sm text-slate-700">
                    <div className="mt-1 h-4 w-4 shrink-0 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">✓</div>
                    Full Custom Branding
                  </li>
                  <li className="flex gap-3 text-sm text-slate-700">
                    <div className="mt-1 h-4 w-4 shrink-0 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">✓</div>
                    Instant lead alerts with CRM Sync
                  </li>
                </ul>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/register")}>Start Pilot</Button>
              </div>

              {/* Active Agent */}
              <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold">Active Agent</h3>
                  <p className="text-slate-500 mt-2 text-sm">Predictable monthly fee for top producers.</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold tracking-tight">$149</span>
                  <span className="text-slate-500 font-medium"> / month</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex gap-3 text-sm text-slate-700">
                    <div className="mt-1 h-4 w-4 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">✓</div>
                    Up to 5 active listings at any time
                  </li>
                  <li className="flex gap-3 text-sm text-slate-700">
                    <div className="mt-1 h-4 w-4 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">✓</div>
                    Unlimited AI conversations (tours)
                  </li>
                  <li className="flex gap-3 text-sm text-slate-700">
                    <div className="mt-1 h-4 w-4 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">✓</div>
                    Priority "Voice Cloning" (higher fidelity)
                  </li>
                  <li className="flex gap-3 text-sm text-slate-700">
                    <div className="mt-1 h-4 w-4 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">✓</div>
                    Full Custom Brokerage Branding
                  </li>
                  <li className="flex gap-3 text-sm text-slate-700">
                    <div className="mt-1 h-4 w-4 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">✓</div>
                    Priority Lead Alerts
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => navigate("/register")}>Start Subscription</Button>
                <p className="text-center text-xs text-slate-500 mt-4">Or $1,200/year (save ~30%)</p>
              </div>
            </div>
            
            {/* Outcome-based callout */}
            <div className="max-w-4xl mx-auto mt-12 bg-slate-900 rounded-2xl p-8 text-center text-white">
              <h3 className="text-xl font-bold mb-2">Lead-Gen Focused? Try the "Outcome-Based" Model.</h3>
              <p className="text-slate-300 mb-6 max-w-2xl mx-auto text-sm">
                Focusing on high-intent buyers? Pay exactly $5-$10 per "Qualified Lead" instead of a flat service fee. 
                A lead is only counted when a user bypasses the Lead Gate with a verified phone/email.
              </p>
              <Button variant="secondary" onClick={() => navigate("/register")}>Contact Sales</Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 py-16 text-slate-400 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
              <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white text-lg">
                V
              </div>
              VertexAgent.io
            </div>
            <p className="text-sm">Next-gen AI real estate tours.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Brokerages</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
