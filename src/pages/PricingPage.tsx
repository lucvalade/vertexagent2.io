import React, { useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  CheckCircle2, 
  Coins, 
  ArrowRight, 
  ShieldCheck, 
  HelpCircle, 
  Users2, 
  Building2, 
  Landmark, 
  Check, 
  X,
  Sparkles,
  ChevronDown,
  Mail,
  Phone
} from "lucide-react";

export default function PricingPage() {
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePlanSelection = (plan: "free" | "starter" | "pro" | "brokerage" | "lender") => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_signup_plan", plan);
    }
    if (user) {
      let planParam = "agent_free";
      if (plan === "starter") planParam = "team_starter";
      if (plan === "pro") planParam = "team_pro";
      if (plan === "brokerage") planParam = "team_elite";
      if (plan === "lender") planParam = "lender_pro";
      navigate(`/app/billing?plan=${planParam}`);
    } else {
      navigate(`/register?plan=${plan}`);
    }
  };
  
  // Lead collection state for sales demo with the requested strict custom validation behaviors
  const [emailValue, setEmailValue] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [nameValue, setNameValue] = useState("");

  const handleEmailBlur = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailValue) {
      setEmailError("Email address is required.");
    } else if (!emailValue.includes("@")) {
      setEmailError("Invalid email address: The '@' symbol is required.");
    } else if (!emailRegex.test(emailValue)) {
      setEmailError("Email address must contain a valid domain (e.g., user@example.com).");
    } else {
      setEmailError("");
    }
  };

  const handlePhoneBlur = () => {
    // Expected format: (XXX) XXX-XXXX
    const phoneRegex = /^\(\d{3}\)\s\d{3}-\d{4}$/;
    if (!phoneValue) {
      setPhoneError("Phone number is required.");
    } else if (!phoneRegex.test(phoneValue)) {
      setPhoneError("Phone number must be formatted exactly like: (289) 659-5555");
    } else {
      setPhoneError("");
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers.length > 0 ? `(${numbers}` : "";
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneValue(formatted);
    if (phoneError) setPhoneError("");
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameValue) {
      toast.error("Please enter your name.");
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailValue || !emailRegex.test(emailValue)) {
      setEmailError("Valid domain-based structure (user@example.com) is required.");
      toast.error("Please correct the email validation error.");
      return;
    }
    const phoneRegex = /^\(\d{3}\)\s\d{3}-\d{4}$/;
    if (!phoneValue || !phoneRegex.test(phoneValue)) {
      setPhoneError("Phone must be (289) 659-5555 format");
      toast.error("Please correct the phone number validation error.");
      return;
    }

    toast.success("Demo Requested Successfully!", {
      description: `We've scheduled your custom tour. Confirmation sent to ${emailValue} on Jun 9, 2026 at 3:45 PM.`
    });
    // Reset form
    setNameValue("");
    setEmailValue("");
    setPhoneValue("");
  };

  interface FeatureComparisonRow {
    feature: string;
    solo: string;
    starter: string;
    pro: string;
    broker: string;
  }

  const comparisonData: FeatureComparisonRow[] = [
    {
      feature: "Guest sign-in",
      solo: "Unlimited",
      starter: "Unlimited",
      pro: "Unlimited",
      broker: "Unlimited"
    },
    {
      feature: "CRM integration",
      solo: "—",
      starter: "Included",
      pro: "Included",
      broker: "Included"
    },
    {
      feature: "Sora AI voice help",
      solo: "Basic EN-only",
      starter: "Basic EN-only",
      pro: "Advanced (24 languages)",
      broker: "Advanced (24 languages)"
    },
    {
      feature: "Branding customizations",
      solo: "Basic",
      starter: "Basic",
      pro: "Full Personal Branding",
      broker: "White-label + custom domain"
    },
    {
      feature: "Intent analytics",
      solo: "—",
      starter: "—",
      pro: "Included",
      broker: "Included"
    },
    {
      feature: "Team management",
      solo: "—",
      starter: "—",
      pro: "—",
      broker: "Included"
    }
  ];

  const pricingCards = [
    {
      id: "free",
      name: "Solo",
      benefitHeader: "Smarter Guest Sign-In",
      price: "Free",
      period: "forever",
      cta: "Start Free",
      color: "border-stone-200 bg-white text-stone-900 shadow-sm hover:shadow-md",
      isPopular: false,
      badgeText: "BASIC PLAN",
      description: "Ditch the paper sheets. Run unlimited, offline-capable open house sign-ins and organize your client contacts within a clean local workspace.",
      features: [
        "Unlimited open house sign-ins",
        "Secure local buffer (works offline)",
        "Basic English-only Sora assistant",
        "Built-in visitor contact lists",
        "Lender pairing option"
      ]
    },
    {
      id: "starter",
      name: "Starter",
      benefitHeader: "Automated CRM Integration",
      price: "$14",
      period: "month",
      cta: "Add CRM Sync",
      color: "border-stone-200 bg-white text-stone-900 shadow-sm hover:shadow-md",
      isPopular: false,
      badgeText: "CONNECTED WORKFLOW",
      description: "Keep your database updated. Automatically syncs every captured lead directly to your Follow Up Boss or kvCORE CRM with no manual effort.",
      features: [
        "Includes everything in Solo",
        "Automated CRM synchronization",
        "FUB custom tag & field mapping",
        "kvCORE API integration",
        "Real-time contact status updates"
      ]
    },
    {
      id: "pro",
      name: "Pro",
      benefitHeader: "Advanced Conversational AI",
      price: "$29",
      period: "month",
      cta: "Go Pro",
      color: "border-blue-600 bg-white ring-4 ring-blue-50 relative",
      isPopular: true,
      badgeText: "MOST POPULAR",
      description: "Turn listings into immersive interactive experiences. Engages buyers in 24 languages, guided by custom knowledge bases and advanced voice tours.",
      features: [
        "Includes everything in Starter",
        "Full 24-language translation",
        "Interactive conversational Sora guide",
        "Personal & brokerage branding uploads",
        "Detailed buyer intent scoring"
      ]
    },
    {
      id: "brokerage",
      name: "Broker",
      benefitHeader: "Full White-Label & Governance",
      price: "$249",
      period: "month",
      cta: "Talk to Sales",
      color: "border-slate-900 bg-slate-900 text-white shadow-xl relative",
      isPopular: false,
      badgeText: "ENTERPRISE",
      description: "Empower your entire brokerage. Enforce brand templates, manage team-wide assignments, configure custom domains, and route shared listing leads.",
      features: [
        "Includes everything in Pro",
        "Brokerage-wide white-labeling",
        "Centralized team and admin controls",
        "Custom domain configuration",
        "Shared listing override rules",
        "Priority onboarding support"
      ]
    }
  ];

  return (
    <PublicLayout>
      <div id="pricing-page" className="bg-stone-50 min-h-screen text-stone-900 pb-32 text-left font-sans">
        
        {/* 1. HERO SECTION */}
        <section className="relative pt-24 pb-20 px-6 border-b border-[#0d1633] bg-gradient-to-b from-[#101b42] to-[#155dfc] text-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
          
          <div className="max-w-4xl mx-auto space-y-6 text-center relative z-10">
            <span className="text-[10px] font-mono tracking-wider bg-white/10 hover:bg-white/15 px-3 py-1 rounded-full uppercase text-blue-200 border border-white/10">
              Pricing
            </span>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold py-0.5 border border-amber-400/30">
              <Sparkles className="h-3.5 w-3.5" /> Free for solo agents
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none font-serif">
              Simple pricing for modern open houses
            </h1>
            
            <p className="text-sm md:text-lg text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Start free, upgrade when you need more AI, and scale across teams, brokerages, and lender partnerships. AI Open House Connect combines digital sign-in, Sora-powered visitor guidance, shared listing workflows, and optional lender pairing in one platform.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <Button 
                onClick={() => handlePlanSelection("free")}
                className="w-full sm:w-auto bg-amber-400 text-stone-950 font-black hover:bg-amber-300 h-12 px-8 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20"
              >
                Get started free <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  const formElement = document.getElementById("demo-form");
                  if (formElement) {
                    formElement.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 h-12 px-8 rounded-xl text-xs uppercase tracking-wider font-extrabold"
              >
                Talk to sales
              </Button>
            </div>
            
            <p className="text-[11px] text-blue-200/80 font-medium italic pt-2">
              No paper sign-in sheets. No complicated setup. Just smarter open houses from day one.
            </p>
          </div>
        </section>

        {/* 2. INTRO STRIP Section */}
        <section className="py-12 border-b border-stone-200 bg-white px-6">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              Built for how real agents work
            </h2>
            <p className="text-sm md:text-base text-stone-600 leading-relaxed max-w-3xl mx-auto">
              Solo agents need a fast, no-cost starting point. Teams need shared visibility. Brokerages need control. Lenders need clear, opt-in partnership workflows. These plans are built to match those roles.
            </p>
            <div className="inline-block bg-stone-50 border border-stone-200 rounded-full px-4 py-1.5 text-xs text-stone-500 font-medium">
              <span className="text-blue-600 font-bold">★ Trust note:</span> Competitive with the solo-agent market, with more room to grow as your workflow gets more advanced.
            </div>
          </div>
        </section>

        {/* 3. PRICING CARDS */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
            {pricingCards.map((card) => {
              const isBroker = card.id === "brokerage";
              return (
                <div 
                  key={card.id} 
                  className={`flex flex-col justify-between p-8 rounded-3xl border transition-all hover:shadow-lg relative overflow-hidden ${
                    card.isPopular 
                      ? "border-2 border-blue-600 bg-[#fbffff] text-stone-900 shadow-xl ring-4 ring-blue-50 lg:scale-105 z-10" 
                      : isBroker 
                        ? "border-slate-800 bg-slate-900 text-white shadow-xl" 
                        : "border-stone-200 bg-white text-stone-900 shadow-sm"
                  }`}
                >
                  {card.isPopular && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">
                      {card.badgeText}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className={`inline-block text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase ${
                        card.isPopular 
                          ? "bg-blue-100 text-blue-700" 
                          : isBroker 
                            ? "bg-slate-800 text-amber-300" 
                            : "bg-stone-100 text-stone-600"
                      }`}>
                        {card.badgeText}
                      </span>
                      <h3 className="text-xl font-bold font-serif flex items-center gap-1.5">
                        {card.name} {card.isPopular && <Sparkles className="h-4 w-4 text-amber-500" />}
                      </h3>
                      <h4 className={`text-xs font-bold leading-snug tracking-tight ${
                        isBroker ? "text-amber-300" : card.isPopular ? "text-blue-600" : "text-stone-800"
                      }`}>
                        {card.benefitHeader}
                      </h4>
                      <p className={`text-xs leading-relaxed min-h-[80px] ${isBroker ? "text-slate-300" : "text-stone-500"}`}>
                        {card.description}
                      </p>
                    </div>

                    <div className={`py-2 border-y flex items-baseline gap-1 ${isBroker ? "border-slate-800" : "border-stone-100"}`}>
                      <span className="text-4xl font-extrabold font-mono">{card.price}</span>
                      {card.period && (
                        <span className={`text-xs font-bold ${isBroker ? "text-slate-400" : "text-stone-500"}`}>/{card.period}</span>
                      )}
                    </div>

                    <div className="space-y-4">
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${isBroker ? "text-slate-400" : "text-stone-400"}`}>
                        What’s included:
                      </p>
                      <ul className="space-y-3 text-xs">
                        {card.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${
                              card.isPopular 
                                ? "text-blue-600" 
                                : isBroker 
                                  ? "text-amber-400" 
                                  : "text-emerald-500"
                            }`} />
                            <span className={isBroker ? "text-slate-300" : "text-stone-600"}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-8 space-y-3">
                    <Button 
                      onClick={() => {
                        if (isBroker) {
                          const formElement = document.getElementById("demo-form");
                          if (formElement) {
                            formElement.scrollIntoView({ behavior: "smooth" });
                          }
                        } else {
                          handlePlanSelection(card.id as any);
                        }
                      }}
                      className={`w-full h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        isBroker 
                          ? "bg-white hover:bg-stone-100 text-slate-950" 
                          : card.isPopular 
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200" 
                            : "bg-stone-900 hover:bg-stone-800 text-white"
                      }`}
                    >
                      {card.cta}
                    </Button>
                    <p className={`text-[10px] text-center font-bold ${isBroker ? "text-slate-400" : card.isPopular ? "text-blue-600" : "text-stone-400"}`}>
                      {card.id === "free" ? "Perfect for individual agents" : card.id === "starter" ? "Automate CRM workflows" : card.id === "pro" ? "Best for high-volume agents" : "Custom rollout and priority support"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. FEATURE COMPARISON */}
        <section className="py-16 px-6 max-w-6xl mx-auto border-t border-stone-200 bg-white rounded-3xl shadow-sm">
          <div className="text-center mb-10 space-y-2">
            <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              What changes as you grow
            </span>
            <h2 className="text-3xl font-bold font-serif text-stone-900 tracking-tight">What changes as you grow</h2>
            <p className="text-sm text-stone-500 max-w-xl mx-auto">
              Start with the basics, then add more AI, collaboration, and control as your business expands.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-900 text-white font-bold uppercase text-[9px] tracking-wider divide-x divide-stone-800">
                  <th className="p-4 font-bold">Feature</th>
                  <th className="p-4 font-bold">Solo</th>
                  <th className="p-4 font-bold">Starter</th>
                  <th className="p-4 font-bold">Pro</th>
                  <th className="p-4 font-bold">Broker</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-medium text-stone-700">
                {comparisonData.map((row) => (
                  <tr key={row.feature} className="hover:bg-stone-50/70 transition-colors divide-x divide-stone-100">
                    <td className="p-4 font-bold text-stone-950 whitespace-nowrap">{row.feature}</td>
                    <td className="p-4 text-stone-600">{row.solo}</td>
                    <td className="p-4 text-stone-600">{row.starter}</td>
                    <td className="p-4 text-stone-600 font-medium">{row.pro}</td>
                    <td className="p-4 font-bold text-stone-900">{row.broker}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. LENDER PARTNER CALLOUT (Separate Block below) */}
        <section className="py-16 px-6 max-w-5xl mx-auto mt-16 bg-white border border-emerald-200 rounded-3xl shadow-md overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-green-600"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-mono tracking-widest bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1 rounded-full uppercase font-black">
                  For mortgage partners
                </span>
                <h2 className="text-3xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
                  Lender Partner plans start at $20/month
                </h2>
              </div>

              <p className="text-sm text-stone-600 leading-relaxed">
                Lender access is separate from agent pricing because lenders are paid partners in the platform, with their own subscription, pairing, and opt-in lead routing rules. This keeps visitor mortgage help optional while giving agents and offices better control over who is active on a listing or event.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ul className="space-y-3 text-xs text-stone-600">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Pair with active agents.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Receive borrower-interest opportunities when visitors opt in.</span>
                  </li>
                </ul>
                <ul className="space-y-3 text-xs text-stone-600">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Stay visible only when actively assigned.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Expand with volume pricing.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-emerald-500 to-[#0e482f] p-8 rounded-2xl text-white space-y-6 flex flex-col justify-between h-full min-h-[240px]">
              <div className="space-y-2">
                <span className="text-[9px] tracking-wider uppercase font-mono text-emerald-100">B2B LO Partner Program</span>
                <p className="text-2xl font-mono font-black">$20<span className="text-xs font-sans opacity-85">/month</span></p>
                <p className="text-xs text-emerald-50 opacity-90 leading-relaxed">
                  Compliant co-marketing partnerships with instant secure routing of consented homebuyer candidates.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => handlePlanSelection("lender")}
                  className="w-full h-11 bg-white hover:bg-emerald-50 text-emerald-950 font-black uppercase text-xs tracking-wider rounded-xl shadow-md"
                >
                  Become a lender partner
                </Button>
                
                <div className="text-center">
                  <button 
                    onClick={() => {
                      const formElement = document.getElementById("demo-form");
                      if (formElement) formElement.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-emerald-100 hover:text-white hover:underline text-[11px] font-semibold"
                  >
                    Questions? Talk to sales
                  </button>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* DEMO LEAD FORM WITH FORCED VALIDATION RULES */}
        <section id="demo-form" className="max-w-xl mx-auto mt-20 p-8 bg-white border border-stone-200 rounded-3xl shadow-sm text-xs space-y-6">
          <div className="text-center space-y-1">
            <Sparkles className="h-5 w-5 text-amber-500 mx-auto" />
            <h4 className="text-lg font-black text-stone-900 uppercase">Request an Enterprise Demo</h4>
            <p className="text-stone-500">Scheduled on Jun 19, 2026. Custom onboarding tailored to your office compliance rules.</p>
          </div>

          <form onSubmit={handleDemoSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-stone-400 tracking-wider mb-1">Your Full Name</label>
              <input 
                type="text" 
                required
                value={nameValue}
                onChange={(e) => {
                  const val = e.target.value;
                  const words = val.split(" ");
                  const formatted = words.map((w) => {
                    return w.charAt(0).toUpperCase() + w.slice(1);
                  }).join(" ");
                  setNameValue(formatted);
                }}
                placeholder="Agent Jane Doe" 
                className="w-full h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-stone-800 font-medium" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-stone-400 tracking-wider mb-1">Email Address</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={emailValue}
                  onChange={(e) => {
                    setEmailValue(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  onBlur={handleEmailBlur}
                  placeholder="jane.doe@brokerage.com" 
                  className={`w-full h-10 pl-9 pr-3 bg-stone-50 border ${emailError ? "border-red-500 focus:ring-red-500" : "border-stone-200 focus:ring-blue-500"} rounded-xl focus:outline-none focus:ring-2 text-stone-800 font-medium`} 
                />
                <Mail className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
              </div>
              {emailError && (
                <p className="text-red-600 text-[10px] font-bold mt-1 animate-pulse">{emailError}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-stone-400 tracking-wider mb-1">Phone Number</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={phoneValue}
                  onChange={handlePhoneChange}
                  onBlur={handlePhoneBlur}
                  placeholder="(289) 659-5555" 
                  className={`w-full h-10 pl-9 pr-3 bg-stone-50 border ${phoneError ? "border-red-500 focus:ring-red-500" : "border-stone-200 focus:ring-blue-500"} rounded-xl focus:outline-none focus:ring-2 text-stone-800 font-medium`} 
                />
                <Phone className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
              </div>
              {phoneError && (
                <p className="text-red-600 text-[10px] font-bold mt-1 animate-pulse">{phoneError}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-100 mt-4 text-xs tracking-wider uppercase"
            >
              Request Custom Consultation
            </Button>
          </form>
        </section>

        {/* 6. FAQ (ALIGNED TO UPDATED STRATEGY) */}
        <section className="py-16 px-6 max-w-4xl mx-auto font-sans leading-relaxed border-t border-stone-200/50 mt-20">
          <h3 className="text-2xl font-bold font-serif text-stone-900 text-center mb-8 tracking-tight">Questions, answered</h3>
          <div className="space-y-4">
            {[
              {
                q: "Is Solo Agent really free?",
                a: "Yes. Keeping Solo free makes the platform more competitive with Curb Hero’s free solo-agent positioning and lowers the barrier to trying the product."
              },
              {
                q: "Why is the lender plan separate?",
                a: "Because lenders are a paid partner layer in the platform, not just a contact field inside an agent account. They follow their own subscription, pairing, and routing rules."
              },
              {
                q: "How many lenders can be active at one time?",
                a: "One active lender should be shown or routed for a given agent, listing, or open house, even if other lender relationships are stored in the system."
              },
              {
                q: "Can teams and brokerages control lender assignments?",
                a: "Yes. Team and brokerage override logic is already part of the product structure, which is why those plans include more advanced control features."
              },
              {
                q: "Do visitors have to request mortgage help?",
                a: "No. Mortgage help should remain optional and only route leads when the visitor explicitly opts in."
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => setActiveFAQ(activeFAQ === idx ? null : idx)}
                  className="w-full p-5 text-left font-bold text-stone-800 flex items-center justify-between text-xs hover:bg-stone-50/50 transition-all focus:outline-none"
                >
                  <span className="font-semibold pr-4">{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-stone-500 shrink-0 transition-transform duration-200 ${activeFAQ === idx ? 'rotate-180' : ''}`} />
                </button>
                {activeFAQ === idx && (
                  <div className="p-5 pt-0 border-t border-stone-50 text-[11px] text-stone-600 font-medium leading-relaxed bg-stone-50/20 font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 7. FINAL CTA */}
        <section className="py-16 px-6 max-w-4xl mx-auto text-center space-y-6 mt-16 bg-[#155dfc] text-white rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
          
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl font-bold font-serif tracking-tight">Start free. Upgrade when you need more.</h2>
            <p className="text-sm text-blue-100 leading-relaxed max-w-2xl mx-auto">
              AI Open House Connect is built to make your first open house easier and your hundredth one easier to manage. Start with a solo workflow, then add more AI, collaboration, and control as your business grows.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <Button 
                onClick={() => handlePlanSelection("free")}
                className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-stone-950 font-black h-11 px-8 rounded-xl text-xs uppercase tracking-wider shadow-lg"
              >
                Get started free <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  const formElement = document.getElementById("demo-form");
                  if (formElement) {
                    formElement.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 h-11 px-8 rounded-xl text-xs uppercase tracking-wider font-extrabold"
              >
                Talk to sales
              </Button>
            </div>

            <p className="text-[10px] text-blue-200/80 font-medium pt-2">
              Need a brokerage or lender rollout? Contact us for volume pricing and onboarding.
            </p>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
