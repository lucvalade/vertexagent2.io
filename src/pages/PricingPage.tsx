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

  const handlePlanSelection = (plan: "free" | "pro" | "team" | "lender" | "brokerage") => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_signup_plan", plan);
    }
    if (user) {
      let planParam = "agent_free";
      if (plan === "pro") planParam = "team_pro";
      if (plan === "team") planParam = "team_pro";
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
    pro: string;
    team: string;
    brokerage: string;
  }

  const comparisonData: FeatureComparisonRow[] = [
    {
      feature: "Digital sign-in",
      solo: "Included",
      pro: "Included",
      team: "Included",
      brokerage: "Included"
    },
    {
      feature: "Lead capture",
      solo: "Included",
      pro: "Included",
      team: "Included",
      brokerage: "Included"
    },
    {
      feature: "Sora AI guidance",
      solo: "Basic",
      pro: "Advanced",
      team: "Advanced",
      brokerage: "Advanced"
    },
    {
      feature: "Branding controls",
      solo: "Basic",
      pro: "Expanded",
      team: "Expanded",
      brokerage: "Expanded"
    },
    {
      feature: "Shared listings",
      solo: "—",
      pro: "—",
      team: "Included",
      brokerage: "Included"
    },
    {
      feature: "Team oversight",
      solo: "—",
      pro: "—",
      team: "Included",
      brokerage: "Included"
    },
    {
      feature: "Brokerage controls",
      solo: "—",
      pro: "—",
      team: "—",
      brokerage: "Included"
    },
    {
      feature: "Lender pairing",
      solo: "1 active lender",
      pro: "1 active lender",
      team: "Team override support",
      brokerage: "Brokerage override support"
    }
  ];

  const pricingCards = [
    {
      name: "Solo Agent",
      subtitle: "A simple way to run smarter open houses without paying upfront. Perfect for agents replacing paper sign-in sheets with digital lead capture and a guided visitor experience.",
      price: "Free",
      period: "forever",
      cta: "Get started free",
      color: "border-stone-200 bg-white text-stone-900 shadow-sm hover:shadow-md",
      isPopular: false,
      badgeText: "SOLO ACCESS",
      features: [
        "Unlimited basic open house sign-ins",
        "Lead capture and event setup",
        "Basic Sora-guided visitor help",
        "One active lender connection when configured"
      ]
    },
    {
      name: "Pro Agent",
      subtitle: "For active agents who want more automation, stronger branding, and a more polished guest experience. Pro is the step up when you want AI to do more than just answer basic questions.",
      price: "$29",
      period: "month",
      cta: "Start Pro",
      color: "border-blue-600 bg-white ring-4 ring-blue-50 relative",
      isPopular: true,
      badgeText: "MOST POPULAR",
      features: [
        "More advanced Sora interactions",
        "Enhanced branding and customization",
        "Higher usage limits",
        "Stronger follow-up readiness",
        "Priority access to advanced features"
      ]
    },
    {
      name: "Team",
      subtitle: "For real estate teams that share coverage, host on each other’s listings, and need team-level visibility. This plan is built around the shared listing and override logic already defined in the product.",
      price: "$99",
      period: "month",
      cta: "Start Team",
      color: "border-stone-200 bg-white text-stone-900 shadow-sm hover:shadow-md",
      isPopular: false,
      badgeText: "GROWING TEAMS",
      features: [
        "Multi-agent access",
        "Shared listing workflows",
        "Team oversight and collaboration",
        "Team-level lender override support",
        "Shared visibility into open house activity"
      ]
    },
    {
      name: "Brokerage",
      subtitle: "For brokerages that need centralized control across agents, listings, and events. This plan supports office-level standards while preserving agent-level flexibility where needed.",
      price: "Starting at $249",
      period: "month",
      cta: "Talk to sales",
      color: "border-slate-900 bg-slate-900 text-white shadow-xl relative",
      isPopular: false,
      badgeText: "OFFICE DEPLOY",
      features: [
        "Brokerage-level controls",
        "Multi-agent and multi-office management",
        "Shared listing assignment oversight",
        "Central routing and policy controls",
        "Custom onboarding and support"
      ]
    },
    {
      name: "Lender Partner",
      subtitle: "For lenders who want to partner with agents and receive mortgage-interest opportunities when visitors explicitly opt in. This stays separate from agent pricing because lender subscriptions, pairing, and routing follow their own product rules.",
      price: "Starting at $20",
      period: "month",
      cta: "Become a lender partner",
      color: "border-emerald-500 bg-white ring-4 ring-emerald-50/20 shadow-sm hover:shadow-md",
      isPopular: false,
      badgeText: "PARTNER SEAT",
      features: [
        "Lender account and subscription",
        "Pairing with agents",
        "Opt-in borrower lead routing",
        "Visibility only when actively assigned",
        "Volume pricing for expanded partnerships"
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
            
            {/* CARD 1: SOLO AGENT */}
            <div className="flex flex-col justify-between p-8 rounded-3xl border border-stone-200 bg-white text-stone-900 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="inline-block text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 uppercase">
                    Best for getting started
                  </span>
                  <h3 className="text-xl font-bold font-serif text-stone-900">Solo Agent</h3>
                  <p className="text-xs text-stone-500 leading-relaxed min-h-[64px]">
                    A simple way to run smarter open houses without upfront cost. Great for agents replacing paper sign-in sheets with digital lead capture and guided visitor support.
                  </p>
                </div>

                <div className="py-2 border-y border-stone-100 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-mono text-stone-900">Free</span>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">What’s included:</p>
                  <ul className="space-y-3 text-xs text-stone-600">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                      <span>Unlimited basic open house sign-ins.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                      <span>Lead capture and event setup.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                      <span>Basic Sora visitor assistance.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                      <span>One active lender connection when configured.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-8 space-y-3">
                <Button 
                  onClick={() => handlePlanSelection("free")}
                  className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-wider bg-stone-900 hover:bg-stone-800 text-white"
                >
                  Get started free
                </Button>
                <p className="text-[10px] text-stone-400 text-center font-medium">
                  Perfect for independent agents and first-time users.
                </p>
              </div>
            </div>

            {/* CARD 2: PRO AGENT (Visually Emphasized / Featured Card) */}
            <div className="flex flex-col justify-between p-8 rounded-3xl border-2 border-blue-600 bg-[#fbffff] text-stone-900 shadow-xl relative overflow-hidden ring-4 ring-blue-50 lg:scale-105 z-10">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">
                Most popular
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="inline-block text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 uppercase">
                    Most popular
                  </span>
                  <h3 className="text-xl font-bold font-serif text-stone-900 flex items-center gap-1.5">
                    Pro Agent <Sparkles className="h-4 w-4 text-amber-500" />
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed min-h-[64px]">
                    For active agents who want stronger branding, more AI support, and a more polished visitor experience.
                  </p>
                </div>

                <div className="py-2 border-y border-stone-100 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-mono text-stone-900">$29</span>
                  <span className="text-xs font-bold text-stone-500">/month</span>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Everything in Solo, plus:</p>
                  <ul className="space-y-3 text-xs text-stone-700">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                      <span className="font-medium">More advanced Sora interactions.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                      <span className="font-medium">Enhanced branding and customization.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                      <span className="font-medium">Higher usage limits.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                      <span className="font-medium">Better follow-up support.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                      <span className="font-medium">Priority access to advanced features.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-8 space-y-3">
                <Button 
                  onClick={() => handlePlanSelection("pro")}
                  className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                >
                  Start Pro
                </Button>
                <p className="text-[10px] text-blue-600 text-center font-bold">
                  Best for agents hosting open houses regularly.
                </p>
              </div>
            </div>

            {/* CARD 3: TEAM */}
            <div className="flex flex-col justify-between p-8 rounded-3xl border border-stone-200 bg-white text-stone-900 transition-all hover:shadow-lg relative overflow-hidden">
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="inline-block text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full bg-stone-150 text-stone-600 uppercase">
                    For growing teams
                  </span>
                  <h3 className="text-xl font-bold font-serif text-stone-900">Team</h3>
                  <p className="text-xs text-stone-500 leading-relaxed min-h-[64px]">
                    For teams that share coverage, host on each other’s listings, and need team-level oversight.
                  </p>
                </div>

                <div className="py-2 border-y border-stone-100 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-mono text-stone-900">$99</span>
                  <span className="text-xs font-bold text-stone-500">/month</span>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Everything in Pro, plus:</p>
                  <ul className="space-y-3 text-xs text-stone-600">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                      <span>Multi-agent access.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                      <span>Shared listing workflows.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                      <span>Team oversight and collaboration.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                      <span>Team-level lender override support.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                      <span>Shared visibility into open house activity.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-8 space-y-3">
                <Button 
                  onClick={() => handlePlanSelection("team")}
                  className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-wider bg-stone-900 hover:bg-stone-800 text-white"
                >
                  Start Team
                </Button>
                <p className="text-[10px] text-stone-400 text-center font-medium">
                  Built for teams managing listings together.
                </p>
              </div>
            </div>

            {/* CARD 4: BROKERAGE */}
            <div className="flex flex-col justify-between p-8 rounded-3xl border border-slate-800 bg-slate-900 text-white transition-all hover:shadow-lg relative overflow-hidden">
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="inline-block text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full bg-slate-800 text-amber-300 uppercase">
                    Custom onboarding
                  </span>
                  <h3 className="text-xl font-bold font-serif text-white">Brokerage</h3>
                  <p className="text-xs text-slate-350 leading-relaxed min-h-[64px]">
                    For brokerages that need centralized control across agents, listings, and events.
                  </p>
                </div>

                <div className="py-2 border-y border-slate-800 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold font-mono text-white">Starting at $249</span>
                  <span className="text-xs font-bold text-slate-400">/month</span>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Everything in Team, plus:</p>
                  <ul className="space-y-3 text-xs text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                      <span>Brokerage-level controls.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                      <span>Multi-agent and multi-office management.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                      <span>Shared listing assignment oversight.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                      <span>Central routing and policy controls.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                      <span>Custom onboarding and support.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-8 space-y-3">
                <Button 
                  onClick={() => {
                    const formElement = document.getElementById("demo-form");
                    if (formElement) {
                      formElement.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-wider bg-white hover:bg-stone-100 text-slate-950"
                >
                  Talk to sales
                </Button>
                <p className="text-[10px] text-slate-400 text-center font-medium">
                  Best for offices standardizing open house operations.
                </p>
              </div>
            </div>

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
                  <th className="p-4 font-bold">Pro</th>
                  <th className="p-4 font-bold">Team</th>
                  <th className="p-4 font-bold">Brokerage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-medium text-stone-700">
                {comparisonData.map((row) => (
                  <tr key={row.feature} className="hover:bg-stone-50/70 transition-colors divide-x divide-stone-100">
                    <td className="p-4 font-bold text-stone-950 whitespace-nowrap">{row.feature}</td>
                    <td className="p-4 text-stone-600">{row.solo}</td>
                    <td className="p-4 text-stone-600 font-medium">{row.pro}</td>
                    <td className="p-4 text-stone-600 font-semibold">{row.team}</td>
                    <td className="p-4 font-bold text-stone-900">{row.brokerage}</td>
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
