import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Mic, Globe, BarChart3, Search, Loader2, Menu, X, Bell } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, loginWithGoogle, logout } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createLead, sendEmail } from "@/lib/api";

export default function PublicSite() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isInterstitialOpen, setIsInterstitialOpen] = useState(true);

  // Dynamic Pricing Data
  const [pricingTitle, setPricingTitle] = useState("Simple, flexible pricing");
  const [pricingDescription, setPricingDescription] = useState("Pricing models designed to maximize your revenue while minimizing friction, matching the seasonal nature of real estate.");
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    // Check for clean param or dismissed state
    const isClean = searchParams.get("clean") === "true";
    const dismissed = localStorage.getItem("interstitial_dismissed");
    
    if (isClean || dismissed) {
      setIsInterstitialOpen(false);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadGlobalSettings() {
      try {
        const settingsSnap = await getDoc(doc(db, "settings", "global"));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          if (data.pricingTitle) setPricingTitle(data.pricingTitle);
          if (data.pricingDescription) setPricingDescription(data.pricingDescription);
          if (data.plans) setPlans(data.plans);
        }
      } catch (err) {
        console.error("Failed to load pricing strategy:", err);
      }
    }
    loadGlobalSettings();
  }, []);

  useEffect(() => {
    // Only redirect if specifically coming to login/register routes while logged in
    // But allowing viewing of the landing page itself while logged in is standard
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
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => navigate("/app")}>Dashboard</Button>
                  <Button variant="outline" onClick={async () => { await logout(); navigate("/"); }}>Logout</Button>
                </div>
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
                        <>
                          <Button onClick={() => { navigate("/app"); setMobileMenuOpen(false); }} className="w-full">Dashboard</Button>
                          <Button variant="outline" onClick={async () => { await logout(); setMobileMenuOpen(false); navigate("/"); }} className="w-full">Logout</Button>
                        </>
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
        <section className="py-24 md:py-32 px-6 max-w-7xl mx-auto text-center space-y-8 text-left md:text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-slate-900 max-w-4xl mx-auto leading-tight">
            Turn every listing into a <span className="text-blue-600">Ai talking open house.</span>
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
                { icon: Home, title: "Room-Aware Sync", desc: "Interactive display that automatically synchronizes photos and floor plans with the AI's spoken tour." },
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

            <div className="max-w-4xl mx-auto bg-slate-800 border border-slate-700 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="space-y-6 flex-1">
                <div className="space-y-2">
                  <span className="text-blue-500 text-[10px] font-bold uppercase tracking-widest">Enterprise Feature</span>
                  <h3 className="text-3xl font-bold">Automate your agent onboarding</h3>
                </div>
                <div className="space-y-4 text-slate-300 leading-relaxed">
                  <p>
                    With our V1 brokerage portal, agents instantly inherit your brokerage's branding, CRM mappings, and compliance rules.
                  </p>
                  <p className="text-sm border-l-2 border-blue-600 pl-4 italic text-slate-400">
                    "You control what goes out—they focus on closing the deal."
                  </p>
                  <p className="text-sm">
                    Eliminate the friction of manual setup. When an agent joins your team on VertexAgent, they are ready to launch their first talking tour in seconds, with everything pre-configured to your standards.
                  </p>
                </div>
              </div>
              <Button size="lg" className="shrink-0 bg-blue-600 hover:bg-blue-700 h-14 px-8 text-lg font-bold shadow-xl shadow-blue-900/20" onClick={() => navigate("/contact")}>
                Book a Brokerage Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 bg-white px-6">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{pricingTitle}</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {pricingDescription}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.length > 0 ? (
                plans.map((plan, idx) => (
                  <div 
                    key={plan.id} 
                    className={`p-8 rounded-3xl border ${idx === 1 ? 'border-2 border-blue-600 bg-blue-50/50 shadow-md relative transform md:-translate-y-4' : 'border-slate-200 bg-white shadow-sm'} flex flex-col hover:shadow-md transition-shadow`}
                  >
                    {idx === 1 && (
                      <div className="absolute top-0 right-8 -translate-y-1/2">
                        <span className="bg-blue-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">Recommended</span>
                      </div>
                    )}
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                      <p className="text-slate-500 mt-2 text-sm">
                        {plan.id === 'agent' ? 'Best for top producers.' : plan.id === 'pro' ? 'Best for growing teams.' : 'Enterprise scaling.'}
                      </p>
                    </div>
                    <div className="mb-6">
                      <span className="text-4xl font-extrabold tracking-tight">${plan.price}</span>
                      <span className="text-slate-500 font-medium"> / {plan.id === 'agent' ? 'unit' : 'month'}</span>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                      <li className="flex gap-3 text-sm text-slate-700 font-bold">
                        <div className={`mt-1 h-4 w-4 shrink-0 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${idx === 1 ? 'bg-blue-600' : 'bg-slate-400'}`}>✓</div>
                        {plan.listings === -1 ? 'Unlimited listings' : `Up to ${plan.listings} active listings`}
                      </li>
                      {plan.features.map((feature: string, fidx: number) => (
                        <li key={fidx} className="flex gap-3 text-sm text-slate-700">
                          <div className={`mt-1 h-4 w-4 shrink-0 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${idx === 1 ? 'bg-blue-600' : 'bg-slate-400'}`}>✓</div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button variant={idx === 1 ? "default" : "outline"} className={`w-full ${idx === 1 ? 'bg-blue-600 hover:bg-blue-700' : ''}`} onClick={() => navigate("/register")}>
                      Get Started
                    </Button>
                  </div>
                ))
              ) : (
                <>
                  {/* Fallback to old hardcoded plans if none in db */}
                  <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col hover:shadow-md transition-shadow lg:opacity-50">
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold">Pay-Per-Listing</h3>
                      <p className="text-slate-500 mt-2 text-sm">Best for individual agents or those with low volume.</p>
                    </div>
                    <div className="mb-6">
                      <span className="text-4xl font-extrabold tracking-tight">$49</span>
                      <span className="text-slate-500 font-medium"> / listing</span>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => navigate("/contact")}>Contact Team</Button>
                  </div>
                  {/* Add more fallbacks if needed, but the DB should have the data */}
                </>
              )}
            </div>
            
            {/* Outcome-based callout */}
            <div className="max-w-4xl mx-auto mt-12 bg-slate-900 rounded-2xl p-8 text-center text-white">
              <h3 className="text-xl font-bold mb-2">Lead-Gen Focused? Try the "Outcome-Based" Model.</h3>
              <p className="text-slate-300 mb-6 max-w-2xl mx-auto text-sm">
                Focusing on high-intent buyers? Pay exactly $5-$10 per "Qualified Lead" instead of a flat service fee. 
                A lead is only counted when a user bypasses the Lead Gate with a verified phone/email.
              </p>
              <Button variant="secondary" onClick={() => navigate("/contact")}>Contact Sales</Button>
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
              <li><Link to="/" className="hover:text-white transition-colors">About Us</Link></li>
              <li><a href="#brokerages" className="hover:text-white transition-colors">Brokerages</a></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
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
      <Interstitial open={isInterstitialOpen} onOpenChange={setIsInterstitialOpen} />
    </div>
  );
}

interface Referral {
  email: string;
  type: 'Real Estate Agent' | 'Broker / Brokerage Owner';
}

function Interstitial({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({ name: "", phone: "", email: "" });
  const [referrals, setReferrals] = useState<Referral[]>([{ email: "", type: "Real Estate Agent" }]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddReferral = () => {
    setReferrals([...referrals, { email: "", type: "Real Estate Agent" }]);
  };

  const handleReferralChange = (index: number, field: keyof Referral, value: string) => {
    const newReferrals = [...referrals];
    newReferrals[index] = { ...newReferrals[index], [field]: value } as Referral;
    setReferrals(newReferrals);
  };

  const validateName = (val: string) => {
    if (!val.trim()) return "Full name is required";
    const parts = val.trim().split(/\s+/);
    if (parts.length < 2) return "First & Last Name required";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nameError = validateName(name);
    const emailError = !email.includes("@") ? "Invalid Email Pattern (e.g. rickjones@gmail.com)" : "";
    const phoneError = phone.replace(/\D/g, '').length < 10 ? "10-digit phone required" : "";

    if (nameError || emailError || phoneError) {
      setErrors({ name: nameError, email: emailError, phone: phoneError });
      toast.error("Please fix the errors in the form.");
      return;
    }

    const invalidReferrals = referrals.filter(r => r.email.trim() !== "" && !r.email.includes("@"));
    if (invalidReferrals.length > 0) {
      toast.error("One or more colleague emails are invalid (missing '@').");
      return;
    }
    
    console.log("Submit form triggered", { name, email, phone, referralsCount: referrals.length });
    const toastId = toast.loading("Submitting to notification list...");
    setSubmitting(true);
    try {
      // Save to Firebase collection launch_notifications
      const colPath = "launch_notifications";
      const validReferrals = referrals.filter(r => r.email && r.email.trim() !== "");
      
      await addDoc(collection(db, colPath), {
        fullName: name,
        phone,
        email,
        referrals: validReferrals,
        createdAt: serverTimestamp(),
        source: "Public Landing Interstitial"
      });

      // Log Simulated Emails for Referrals
      for (const ref of validReferrals) {
        await addDoc(collection(db, "system_logs"), {
          type: "EMAIL_SIM",
          message: `Referral Invited: ${ref.email}`,
          timestamp: serverTimestamp(),
          details: {
            recipient: ref.email,
            template: "REFERRAL_INVITATION",
            body: `Hi! ${name} thought you might be interested in VertexAgent.io, an AI-powered assistant for ${ref.type === 'Real Estate Agent' ? 'agents' : 'brokerages'}. Join the waitlist at https://vertexagent.io`,
            metadata: { sender: email, senderName: name }
          }
        });
      }
      
      // Log Lead Admin Email Notification
      await addDoc(collection(db, "system_logs"), {
        type: "EMAIL_SIM",
        message: `New Lead Notification Sent to Admin`,
        timestamp: serverTimestamp(),
        details: {
          recipient: "admin@vertexagent.io",
          template: "ADMIN_NEW_LEAD",
          body: `A new signup has been received: ${name} (${email})`,
          metadata: { name, email, phone }
        }
      });

      toast.success("Thank you! You have been added to the launch notification list.", { id: toastId });
      localStorage.setItem("interstitial_dismissed", "true");
      onOpenChange(false);
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Failed to submit. Please check your connection and try again.", { id: toastId });
      handleFirestoreError(err, OperationType.CREATE, "launch_notifications");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[5px] bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500 overflow-y-auto">
      <div className="bg-white/50 backdrop-blur-md border border-white/30 rounded-3xl shadow-2xl shadow-blue-900/20 max-w-2xl w-full mb-8 p-8 md:p-12 relative animate-in zoom-in slide-in-from-bottom-8 duration-700">
        <button 
          onClick={() => {
            localStorage.setItem("interstitial_dismissed", "true");
            onOpenChange(false);
          }}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors p-2"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-600 text-white rounded-2xl mb-2 font-black text-3xl italic shadow-lg shadow-blue-200">V</div>
            <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter text-slate-900 uppercase">VertexAgent.io</h2>
            <div className="space-y-4 text-slate-800 leading-relaxed text-sm md:text-base text-left font-medium">
              <p>
                Meet VertexAgent.io — the AI-powered Open House and Listing Assistant built for Real Estate Agents and Brokerages.
                Share your property with a QR code or social-media link, let buyers ask questions in real time through voice or chat, and turn every listing conversation into a stronger lead opportunity with multilingual AI support in 90+ languages.
              </p>
              <p>
                From voice cloning with a 60-second script to click-to-call options, PDF sharing, MMS and email follow-up, conversation summaries, and tracking across forms, messages, and client activity, VertexAgent.io is being developed to help you present listings more effectively and follow up more intelligently.
              </p>
              <p>
                Join our notification list for updates and early announcements, and feel free to refer a fellow agent or broker who may also want early access.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 pt-6 border-t border-slate-200/50">
             <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-[5px] pl-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</Label>
                    {errors.name && <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">{errors.name}</span>}
                  </div>
                  <Input 
                    value={name}
                    className={`bg-white/60 border-white/50 h-12 rounded-xl ${errors.name ? 'border-red-400/50' : ''}`}
                    onChange={(e) => {
                      // Autocapitalize first letter of each word
                      const val = e.target.value.replace(/(^\w|\s\w)/g, c => c.toUpperCase());
                      setName(val);
                      if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                    }}
                    onBlur={() => {
                      const err = validateName(name);
                      setErrors(prev => ({ ...prev, name: err }));
                    }}
                    placeholder="Jane Doe"
                    required
                  />
                </div>
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-[5px] pl-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone</Label>
                    {errors.phone && <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">{errors.phone}</span>}
                  </div>
                  <Input 
                    type="tel"
                    value={phone}
                    className={`bg-white/60 border-white/50 h-12 rounded-xl ${errors.phone ? 'border-red-400/50' : ''}`}
                    onChange={(e) => {
                      const x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
                      if (x) {
                        setPhone(!x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : ''));
                      }
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
                    }}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
             </div>
             
             <div className="space-y-2 text-left">
               <div className="flex items-center gap-[5px] pl-1">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</Label>
                 {errors.email && <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">{errors.email}</span>}
               </div>
               <Input 
                 type="email"
                 value={email}
                 className={`bg-white/60 border-white/50 h-12 rounded-xl ${errors.email ? 'border-red-400/50' : ''}`}
                 onChange={(e) => {
                   setEmail(e.target.value);
                   if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                 }}
                 onBlur={() => {
                   if (email && !email.includes('@')) {
                     setErrors(prev => ({ ...prev, email: "Invalid Email Pattern (e.g. rickjones@gmail.com)" }));
                   }
                 }}
                 required
                 placeholder="jane@example.com"
               />
             </div>

             <div className="space-y-4 pt-6 border-t border-slate-200/50">
               <h3 className="font-black text-slate-900 border-l-4 border-blue-600 pl-3 uppercase tracking-tighter text-sm italic">Refer a fellow Agent or Broker</h3>
               
               {referrals.map((ref, idx) => (
                 <div key={idx} className="p-5 bg-white/40 rounded-2xl space-y-4 border border-white/50 shadow-sm relative animate-in slide-in-from-top-2 duration-300">
                   <div className="space-y-2 text-left">
                    <div className="flex items-center gap-[5px] pl-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Colleague email address</Label>
                      {ref.email && !ref.email.includes('@') && (
                        <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">Invalid Email Pattern (e.g. rickjones@gmail.com)</span>
                      )}
                    </div>
                     <Input 
                        value={ref.email}
                        className={`bg-white/80 border-white/50 h-11 rounded-xl ${ref.email && !ref.email.includes('@') ? 'border-red-400/50' : ''}`}
                        onChange={(e) => handleReferralChange(idx, 'email', e.target.value)}
                        placeholder="colleague@example.com"
                     />
                   </div>
                   <div className="space-y-2 text-left">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Who are you referring?</Label>
                     <div className="flex flex-col sm:flex-row gap-4">
                        <label className="flex items-center gap-3 text-xs font-bold cursor-pointer bg-white/50 px-4 py-2.5 rounded-lg border border-white/50 hover:bg-white/80 transition-colors">
                          <input 
                            type="radio" 
                            name={`type-${idx}`} 
                            checked={ref.type === 'Real Estate Agent'}
                            onChange={() => handleReferralChange(idx, 'type', 'Real Estate Agent')}
                            className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                          />
                          Real Estate Agent
                        </label>
                        <label className="flex items-center gap-3 text-xs font-bold cursor-pointer bg-white/50 px-4 py-2.5 rounded-lg border border-white/50 hover:bg-white/80 transition-colors">
                          <input 
                            type="radio" 
                            name={`type-${idx}`}
                            checked={ref.type === 'Broker / Brokerage Owner'}
                            onChange={() => handleReferralChange(idx, 'type', 'Broker / Brokerage Owner')}
                            className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                          />
                          Broker / Brokerage Owner
                        </label>
                     </div>
                   </div>
                 </div>
               ))}

               <button 
                 type="button"
                 onClick={handleAddReferral}
                 className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1.5 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors w-fit"
               >
                 + Add More Colleague email addresses
               </button>
             </div>

             <Button 
               type="submit"
               disabled={submitting}
               className="w-full h-16 text-lg font-black bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 rounded-2xl uppercase tracking-widest italic"
             >
               {submitting ? <Loader2 className="animate-spin mr-2" /> : null}
               Submit Notifications
             </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
