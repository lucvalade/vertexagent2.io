import React from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, logout } from "@/hooks/useAuth";
import { Loader2, Menu, X, ArrowRight } from "lucide-react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isFlashing, setIsFlashing] = React.useState(() => {
    try {
      const entered = sessionStorage.getItem("how_it_works_flashed");
      return !entered;
    } catch (e) {
      return true;
    }
  });

  React.useEffect(() => {
    if (isFlashing) {
      try {
        sessionStorage.setItem("how_it_works_flashed", "true");
      } catch (e) {}
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isFlashing]);

  React.useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    };

    const timeout = setTimeout(handleHashScroll, 350);
    window.addEventListener("hashchange", handleHashScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("hashchange", handleHashScroll);
    };
  }, [window.location.hash]);

  const navLinks = [
    { label: "How It Works", href: "/how-it-works" },
    {
      label: "Products",
      href: "/product",
      items: [
        { name: "AI Property Tours", desc: "Interactive smart guided media voice narrates homes", href: "/product#narrator" },
        { name: "Open House Sign-In", desc: "Tablet kiosk mode captures visitor approvals easily", href: "/open-houses" },
        { name: "Talk with Sora", desc: "Real-time voice chat answers property facts naturally", href: "/product#narrator" },
        { name: "Listen to Tour", desc: "Guided ambient audio walks you room-by-room", href: "/product#narrator" },
        { name: "Message Me", desc: "Prompt mobile chat for buyers on the move", href: "/product#features" },
        { name: "Branding & Templates", desc: "Brokerage themes cascade to individual listing flyers", href: "/brokerages#compliance-demo" },
        { name: "Automations & Analytics", desc: "Track scans, visits, conversations and hot leads automatically", href: "/product#features" }
      ]
    },
    { label: "Pricing", href: "/pricing" },
    { label: "Demo", href: "/demo" },
    {
      label: "Company",
      href: "/contact",
      items: [
        { name: "Mission & Values", desc: "Reimagining the open house to convert more leads", href: "/contact?tab=mission" },
        { name: "Contact Support", desc: "Dedicated round the clock account concierge", href: "/contact?tab=support" },
        { name: "Enterprise Solutions", desc: "Custom scale operations for franchise organizations", href: "/contact?tab=enterprise" }
      ]
    },
    {
      label: "Help",
      href: "/open-houses",
      items: [
        { name: "Open Houses", desc: "Tablet kiosk mode, touchless digital forms, and lead captures", href: "/open-houses" },
        { name: "URL Import", desc: "Ingest property records instantly from Zillow, Redfin, or MLS URLs", href: "/url-import" },
        { name: "Brokerages", desc: "Centralized compliance dashboards, regulatory guards, and settings", href: "/brokerages" },
        { name: "Integrations", desc: "Cascade real-time leads to HubSpot, Zapier, Webhooks, or Follow Up Boss", href: "/integrations" }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-slate-50 overflow-x-hidden">
      <style>{`
        @keyframes flash-black-blue {
          0%, 100% { color: #000000 !important; }
          50% { color: #2563eb !important; }
        }
        .animate-flash-black-blue {
          animation: flash-black-blue 0.8s infinite ease-in-out;
        }
      `}</style>
      {/* HEADER */}
      <header className="fixed top-3 inset-x-3 md:top-4 md:inset-x-6 max-w-7xl mx-auto h-16 bg-[#0224bb]/30 backdrop-blur-[24px] z-50 border border-white/35 rounded-2xl sm:rounded-[20px] shadow-[0_8px_32px_rgba(2,36,187,0.12),0_12px_40px_rgba(0,0,0,0.15),inset_0_1.5px_6px_rgba(255,255,255,0.65)]">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-white">
            <div className="h-8 w-8 bg-white rounded flex items-center justify-center text-[#0224bb] text-lg font-black">
              V
            </div>
            <span className="font-extrabold">VertexAgent.io</span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-6 text-sm font-bold text-white h-full">
            {navLinks.map((link) => (
              <div key={link.label} className="relative group flex items-center h-full">
                <Link 
                  to={link.href} 
                  className={`hover:text-white/80 transition-colors py-5 flex items-center gap-0.5 tracking-tight font-bold text-white ${
                    link.label === "How It Works" && isFlashing ? "animate-flash-black-blue" : ""
                  }`}
                >
                  {link.label}
                  {link.items && <span className="text-[8px] opacity-40 ml-1">▼</span>}
                </Link>
                {link.items && (
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 hidden group-hover:grid grid-cols-2 gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl min-w-[500px] z-50 text-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="col-span-2 border-b pb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      {link.label === "Products" ? "Product" : link.label} Solutions
                    </div>
                    {link.items.map((item) => (
                      <Link 
                        to={item.href || link.href} 
                        key={item.name} 
                        className="hover:bg-blue-600 group/sub p-2.5 rounded-xl transition-all block text-left"
                      >
                        <p className="text-xs font-bold text-slate-900 group-hover/sub:text-white transition-colors">{item.name}</p>
                        <p className="text-[10px] text-slate-500 group-hover/sub:text-blue-100 mt-0.5 leading-normal transition-colors">{item.desc}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : user ? (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="font-extrabold text-xs text-white hover:text-white hover:bg-white/10" onClick={() => navigate("/app")}>Dashboard</Button>
                  <Button variant="outline" className="font-extrabold text-xs text-white border-white/50 hover:bg-white/10 hover:text-white" onClick={async () => { await logout(); navigate("/"); }}>Logout</Button>
                </div>
              ) : (
                <>
                  <Button variant="ghost" className="font-extrabold text-xs text-white hover:text-white hover:bg-white/10" onClick={() => navigate("/login")}>Log In</Button>
                  <Button onClick={() => navigate("/register")} className="bg-white hover:bg-white/90 text-[#0224bb] font-extrabold text-xs">Try Free for 14 Days</Button>
                </>
              )}
            </div>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="lg:hidden p-2 text-white hover:text-blue-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 px-6 flex flex-col gap-6 lg:hidden animate-in fade-in duration-200">
          <div className="flex flex-col gap-4 text-left overflow-y-auto max-h-[70vh]">
            {navLinks.map((link) => (
              <div key={link.label} className="border-b pb-2">
                <Link 
                  to={link.href} 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-bold text-lg text-slate-800 hover:text-blue-600 ${
                    link.label === "How It Works" && isFlashing ? "animate-flash-black-blue" : ""
                  }`}
                >
                  {link.label}
                </Link>
                {link.items && (
                  <div className="pl-4 mt-2 grid grid-cols-1 gap-1.5 border-l-2 border-slate-100">
                    {link.items.map(sub => (
                      <Link 
                        to={sub.href || link.href} 
                        key={sub.name} 
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-xs text-slate-500 hover:text-slate-800 block text-left"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-auto border-t pt-6 pb-12 flex flex-col gap-3">
            {user ? (
              <>
                <Button className="w-full" onClick={() => { setMobileMenuOpen(false); navigate("/app"); }}>Dashboard</Button>
                <Button variant="outline" className="w-full" onClick={async () => { setMobileMenuOpen(false); await logout(); navigate("/"); }}>Logout</Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="w-full" onClick={() => { setMobileMenuOpen(false); navigate("/login"); }}>Log In</Button>
                <Button className="w-full bg-blue-600 text-white" onClick={() => { setMobileMenuOpen(false); navigate("/register"); }}>Try Free for 14 Days</Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 pt-24 pb-8">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-16 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-xl text-white">
              <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white text-lg">
                V
              </div>
              VertexAgent.io
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Open House sign-in, smart guided vector media narration, instant listings parsing, lead automation, brokerage compliance cascade, and conversational follow-ups.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-4">Platform Solutions</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/product" className="hover:text-white">AI Property Tours</Link></li>
              <li><Link to="/open-houses" className="hover:text-white">Kiosk Sign-In Mode</Link></li>
              <li><Link to="/url-import" className="hover:text-white">URL Magic Extraction</Link></li>
              <li><Link to="/brokerages" className="hover:text-white">Brokerage Compliance</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-4">Integrations</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/integrations" className="hover:text-white">CRM Sync Engines</Link></li>
              <li><Link to="/integrations" className="hover:text-white">Webhook Delivery API</Link></li>
              <li><Link to="/integrations" className="hover:text-white">Zapier & Make Scenarios</Link></li>
              <li><Link to="/pricing" className="hover:text-white">Subscription Licensing Plans</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-4">Legal & Regulatory</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy Safeguards</Link></li>
              <li><Link to="/terms" className="hover:text-white">Terms of Service Agreement</Link></li>
              <li><Link to="/compliance" className="hover:text-white">MLS Regulatory Disclosures</Link></li>
              <li><span className="text-slate-500">Contact: support@vertexagent.io</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 VertexAgent.io. Built with modern React and Gemini. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <Link to="/terms" className="hover:underline">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
