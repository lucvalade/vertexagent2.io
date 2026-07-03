import React from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, logout } from "@/hooks/useAuth";
import { Loader2, Menu, X, ArrowRight } from "lucide-react";
import Logo from "./Logo";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const menuToggleRef = React.useRef<HTMLButtonElement>(null);
  const navDrawerRef = React.useRef<HTMLElement>(null);

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

  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  React.useEffect(() => {
    if (mobileMenuOpen) {
      const timer = setTimeout(() => {
        const firstLink = navDrawerRef.current?.querySelector("a") as HTMLElement;
        firstLink?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [mobileMenuOpen]);

  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (!navDrawerRef.current) return;
      const focusableElements = navDrawerRef.current.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [mobileMenuOpen]);

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
    { label: "Dashboard", href: "/app" },
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

        .hamburger-btn {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 24px;
          height: 18px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          z-index: 1000;
          outline: none;
          position: relative;
        }
        .bar {
          display: block;
          width: 100%;
          height: 2px;
          background-color: #ffffff;
          border-radius: 2px;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .hamburger-btn.is-open .bar:nth-child(1) {
          transform: translateY(8px) rotate(45deg);
        }
        .hamburger-btn.is-open .bar:nth-child(2) {
          opacity: 0;
          transform: scaleX(0);
        }
        .hamburger-btn.is-open .bar:nth-child(3) {
          transform: translateY(-8px) rotate(-45deg);
        }

        .nav-drawer {
          position: fixed;
          top: 0;
          left: 0;
          height: 100%;
          width: 325px;
          max-width: 85%;
          background: #ffffff;
          box-shadow: 4px 0 24px rgba(0,0,0,0.12);
          transform: translateX(-100%);
          transition: transform 0.3s ease;
          z-index: 999;
          overflow-y: auto;
          padding: 18px 24px 24px;
        }
        .nav-drawer.is-open {
          transform: translateX(0);
        }

        .nav-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
          z-index: 998;
        }
        .nav-backdrop.is-open {
          opacity: 1;
          pointer-events: all;
        }

        @media (prefers-reduced-motion: no-preference) {
          .bar,
          .nav-drawer,
          .nav-backdrop {
            transition-duration: 0.3s;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .bar,
          .nav-drawer,
          .nav-backdrop {
            transition: none;
          }
        }
      `}</style>
      {/* HEADER */}
      <header 
        className="fixed top-0 inset-x-0 w-full rounded-none lg:top-3 lg:inset-x-4 lg:rounded-[20px] max-w-7xl lg:mx-auto h-16 z-50 border-b lg:border border-white/20 transition-all duration-300 backdrop-blur-md shadow-lg"
        style={{ backgroundColor: scrolled ? "rgba(80, 162, 255, 0.55)" : "rgba(80, 162, 255, 1)" }}
      >
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <Logo variant="white" iconClassName="h-8.5 w-8.5" />
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
                  <Button className="font-extrabold text-xs bg-blue-600 hover:bg-white text-white hover:text-blue-600 border border-blue-600 transition-colors duration-200" onClick={async () => { await logout(); navigate("/"); }}>Logout</Button>
                </div>
              ) : (
                <>
                  <Button onClick={() => navigate("/register")} className="bg-white hover:bg-white/90 text-[#162556] font-extrabold text-xs">Try Free for 14 Days</Button>
                </>
              )}
            </div>

            <div className="lg:hidden flex items-center gap-2.5">
              {/* To the left of the hamburger menu, create a link called Start Free */}
              <Link 
                to="/register" 
                className="text-[10px] font-black text-[#50a2ff] bg-white hover:bg-blue-50 active:scale-[0.85] scale-90 transition-all text-center px-2.5 py-1 rounded-lg shadow-sm whitespace-nowrap select-none uppercase tracking-wider"
              >
                Start Free
              </Link>

              {/* Custom Hamburger Button according to PDF Guide */}
              <button 
                id="menu-toggle"
                ref={menuToggleRef}
                aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
                aria-expanded={mobileMenuOpen}
                aria-controls="nav-drawer"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className={`hamburger-btn ${mobileMenuOpen ? "is-open" : ""}`}
              >
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop overlay */}
      <div 
        id="nav-backdrop"
        onClick={() => {
          setMobileMenuOpen(false);
          menuToggleRef.current?.focus();
        }}
        className={`nav-backdrop lg:hidden ${mobileMenuOpen ? "is-open" : ""}`}
        aria-hidden="true"
      />

      {/* Navigation drawer according to PDF Guide */}
      <nav 
        id="nav-drawer"
        ref={navDrawerRef}
        className={`nav-drawer lg:hidden flex flex-col ${mobileMenuOpen ? "is-open" : ""}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex flex-col h-full">
          {/* Header Card inside mobile menu */}
          <div className="rounded-xl flex items-center justify-between text-white p-4 mb-4" style={{ backgroundColor: '#50a2ff' }}>
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="hover:opacity-95 transition-opacity">
              <Logo variant="white" iconClassName="h-7.5 w-7.5" />
            </Link>
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                menuToggleRef.current?.focus();
              }} 
              className="text-white hover:text-white/80 transition-colors bg-transparent border-0 outline-none p-1 cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Structured Menu Options */}
          <div className="flex flex-col gap-1 text-left px-2 flex-grow overflow-y-auto">
            {/* Dashboard */}
            <div className="border-b border-slate-100 py-3">
              <Link 
                to="/app" 
                onClick={() => setMobileMenuOpen(false)}
                className="font-extrabold text-[#111827] text-base hover:text-blue-500 transition-colors block text-left"
              >
                Dashboard
              </Link>
            </div>

            {/* How It Works */}
            <div className="border-b border-slate-100 py-3">
              <Link 
                to="/how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className={`font-extrabold text-[#111827] text-base hover:text-blue-500 transition-colors block text-left ${
                  isFlashing ? "animate-flash-black-blue" : ""
                }`}
              >
                How It Works
              </Link>
            </div>

            {/* Products */}
            <div className="border-b border-slate-100 py-3">
              <span className="font-extrabold text-[#111827] text-base block text-left mb-2">Products</span>
              <div className="pl-4 space-y-2.5">
                <Link to="/product#narrator" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">AI Property Tours</Link>
                <Link to="/open-houses" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Open House Sign-In</Link>
                <Link to="/product#narrator" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Talk with Sora</Link>
                <Link to="/product#narrator" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Listen to Tour</Link>
                <Link to="/product#features" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Message Me</Link>
                <Link to="/brokerages#compliance-demo" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Branding & Templates</Link>
                <Link to="/product#features" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Automations & Analytics</Link>
              </div>
            </div>

            {/* Pricing */}
            <div className="border-b border-slate-100 py-3">
              <Link 
                to="/pricing" 
                onClick={() => setMobileMenuOpen(false)}
                className="font-extrabold text-[#111827] text-base hover:text-blue-500 transition-colors block text-left"
              >
                Pricing
              </Link>
            </div>

            {/* Demo */}
            <div className="border-b border-slate-100 py-3">
              <Link 
                to="/demo" 
                onClick={() => setMobileMenuOpen(false)}
                className="font-extrabold text-[#111827] text-base hover:text-blue-500 transition-colors block text-left"
              >
                Demo
              </Link>
            </div>

            {/* Company */}
            <div className="border-b border-slate-100 py-3">
              <span className="font-extrabold text-[#111827] text-base block text-left mb-2">Company</span>
              <div className="pl-4 space-y-2.5">
                <Link to="/contact?tab=mission" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Mission & Values</Link>
                <Link to="/contact?tab=support" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Contact Support</Link>
                <Link to="/contact?tab=enterprise" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Enterprise Solutions</Link>
              </div>
            </div>

            {/* Help */}
            <div className="py-3">
              <span className="font-extrabold text-[#111827] text-base block text-left mb-2">Help</span>
              <div className="pl-4 space-y-2.5">
                <Link to="/open-houses" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Open Houses</Link>
                <Link to="/url-import" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">URL Import</Link>
                <Link to="/brokerages" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Brokerages</Link>
                <Link to="/integrations" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Integrations</Link>
              </div>
            </div>
          </div>

          {/* Action Buttons at the bottom */}
          <div className="mt-auto pt-4 border-t border-slate-100 space-y-3 px-2">
            <Button 
              onClick={() => { setMobileMenuOpen(false); navigate("/app"); }}
              className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white font-extrabold h-12 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Dashboard
            </Button>
            {user ? (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    setMobileMenuOpen(false);
                    await logout();
                    navigate("/");
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold h-12 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Sign-Out
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/register");
                }}
                className="w-full bg-[#155dfc] hover:bg-blue-700 text-white font-extrabold h-12 rounded-xl text-xs sm:text-sm cursor-pointer"
              >
                <span>Try Free for 14 Days</span>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 pt-24 pb-8">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-16 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            
            {/* Column 1 - Product */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-white">Product</h4>
              <ul className="space-y-2.5">
                <li><Link to="/#product" className="hover:text-white transition-colors">Interactive Tours</Link></li>
                <li><Link to="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link to="/#features" className="hover:text-white transition-colors font-semibold text-blue-400">Feature Deck</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing Plans</Link></li>
              </ul>
            </div>

            {/* Column 2 - Company */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-white">Company</h4>
              <ul className="space-y-2.5">
                <li><Link to="/contact" className="hover:text-white transition-colors">About Team</Link></li>
                <li><a href="mailto:support@aiopenhouseconnect.com" className="hover:text-white transition-colors">Media Kit</a></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Partnerships</Link></li>
              </ul>
            </div>

            {/* Column 3 - Resources */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-white">Resources</h4>
              <ul className="space-y-2.5">
                <li><Link to="/compliance" className="hover:text-white transition-colors">Agency Disclosures</Link></li>
                <li><Link to="/open-houses" className="hover:text-white transition-colors">Open House Manual</Link></li>
                <li><Link to="/url-import" className="hover:text-white transition-colors">URL Extraction API</Link></li>
                <li><Link to="/integrations" className="hover:text-white transition-colors">CRM Field Routing</Link></li>
              </ul>
            </div>

            {/* Column 4 - Contact */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-white">Contact</h4>
              <ul className="space-y-2.5">
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Concierge</Link></li>
                <li className="text-zinc-500 font-mono text-[10px]">support@aiopenhouseconnect.com</li>
                <li className="text-zinc-500 font-mono text-[10px]">AI Open House Connect Headquarters</li>
                <li className="text-zinc-500 font-mono text-[10px]">Toronto, ON, Canada</li>
              </ul>
            </div>

          </div>

          {/* Bottom row: copyright, privacy, terms */}
          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-zinc-500">
            <span>&copy; {new Date().getFullYear()} AI Open House Connect Inc. All rights reserved.</span>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/compliance" className="hover:text-white transition-colors">RECO Regulatory Disclosure</Link>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
