import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import PublicLayout from "@/components/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  User, 
  Users, 
  Coins, 
  CheckCircle2, 
  BookOpen, 
  HelpCircle,
  FileText,
  Key,
  ShieldCheck,
  Check,
  Smartphone,
  Layers,
  ArrowRight,
  Building
} from "lucide-react";

export default function HelpPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleParam = searchParams.get("role") || "agent";
  const [activeTab, setActiveTab] = useState<string>("agent");

  useEffect(() => {
    if (roleParam && ["agent", "team", "lender", "brokerage", "broker"].includes(roleParam)) {
      setActiveTab(roleParam === "broker" ? "brokerage" : roleParam);
    }
  }, [roleParam]);

  const handleTabChange = (role: string) => {
    setActiveTab(role);
    setSearchParams({ role });
  };

  const helpSections = {
    agent: {
      title: "Agent Help Center",
      badge: "Core Workflow Manual",
      subtitle: "How to set up listings, run tablet kiosks, and track client leads",
      description: "Step-by-step documentation for solo agents looking to elevate open house engagement and capture verified leads with Sora AI.",
      faqs: [
        {
          q: "How do I import a real estate listing?",
          a: "Navigate to Your Listings in the dashboard, click 'Add Listing', and enter an MLS number or paste a listing URL from a major real estate site. The system uses Gemini vision to extract descriptions, bedrooms, bathrooms, and auto-tag photos into core manifest buckets like kitchen, living, or backyard."
        },
        {
          q: "How do I activate the attendee-facing kiosk lock mode?",
          a: "Go to your event page and click 'Launch Kiosk'. This opens a full-screen, locked sign-in flow that is safe for buyers to use. It prevents buyers from accessing other parts of your app. To exit kiosk mode, click the lock icon in the corner and enter your agent-configured security PIN."
        },
        {
          q: "How does the offline sign-in buffer work?",
          a: "If the property has poor internet, you can sign visitors in completely offline. The kiosk will save leads in the browser local cache and display a status line: 'Local Cache Sync Pending: N leads'. As soon as the browser reconnects to internet, the queue automatically syncs to Firestore without any data loss."
        },
        {
          q: "Can I connect my CRM for automatic lead synchronization?",
          a: "Yes. Navigate to the Integrations page to connect Follow Up Boss or other CRMs. You can use our interactive field mapper to choose where fields like name, email, phone, and tags like 'fub-mortgage-interest' flow."
        }
      ]
    },
    team: {
      title: "Team Lead Help Center",
      badge: "Scale & Administration",
      subtitle: "Managing team assets, cross-hosting permissions, and overrides",
      description: "Learn how to manage listings, direct team routing policies, and coordinate cross-hosted listings between roster agents.",
      faqs: [
        {
          q: "What is a Shared Listing assignment?",
          a: "If an agent is hosting an open house on behalf of another team member, you can delegate hosting rights without transferring listing ownership. This is accessible from the Listing ellipsis menu. Simply select the hosting agent, assign date ranges, and specify permission limits."
        },
        {
          q: "How do team routing override policies work?",
          a: "Team Leads can define global lender override policies. When a team block policy is set to 'Enforce', individual listing-level allocations are overridden by the team-wide preferred lender, ensuring uniform partnership compliance."
        },
        {
          q: "How are leads distributed during cross-hosting?",
          a: "Leads captured at a cross-hosted open house automatically record both the Listing Owner Agent ID and the Hosting Agent ID. Depending on your Team Lead delegation parameters, leads can be assigned directly to the host, routed to a team pool, or co-shared."
        },
        {
          q: "How do I invite teammates to my organization?",
          a: "Navigate to the Team tab, click 'Invite Teammate', and paste email addresses (one per line, up to 10 at a time) or copy the custom self-serve team invite link to distribute via chat or email."
        }
      ]
    },
    lender: {
      title: "Lender Partner Help Center",
      badge: "B2B Subscriptions & Compliance",
      subtitle: "Configuring pairings, subscription seats, and legal consent rules",
      description: "A complete guide for mortgage professionals and staff on receiving exclusive, consent-cleared consumer leads from partnered real estate agents.",
      faqs: [
        {
          q: "What is the Consent Gate?",
          a: "To comply with Canadian PIPEDA and RESPA guidelines, mortgage financing questions are strictly opt-in. A visitor must explicitly check 'Yes, I would like information on mortgage options' for their profile to route to a lender. If they decline or if there is no paired lender, mortgage questions are hidden entirely from the kiosk."
        },
        {
          q: "How do I pair with real estate agents?",
          a: "Under the Lenders page, invite active agents by entering their emails, or accept incoming requests. Each paired agent uses one seat on your active B2B subscription tier."
        },
        {
          q: "Where do my lead notifications go?",
          a: "As soon as a buyer gives mortgage consent, the system records it in the explicit consent audit logs, triggers a text/email alert to you, and updates your lender workspace queue in real-time."
        },
        {
          q: "How do I configure co-branding parameters?",
          a: "Upload your business logo, professional headshot, contact phone, and mandatory licensing details (like NMLS/FSRA) in your Profile settings. These will auto-populate onto partnered agent open house welcome screens and printed unbranded property flyers."
        }
      ]
    },
    brokerage: {
      title: "Broker of Record / Office Help Center",
      badge: "Office Administration & Policies",
      subtitle: "Custom subdomains, brand deployment, roster management, and office policies",
      description: "A complete guide for Brokerage Administrators and Owners on setting up office identities, auto-provisioning agent accounts, cascading shared themes, and setting system-wide compliance overrides.",
      faqs: [
        {
          q: "How do I configure our custom brokerage branding and subdomains?",
          a: "Navigate to your office settings page or the Brokerage onboarding wizard to upload your high-resolution transparent logo, brand accent colors, and office background themes. These branding parameters will automatically cascade to all listings hosted by your agents. You can also specify a custom office subdomain (e.g., [name].vertexagent.io) to host all listings under your corporate identity."
        },
        {
          q: "What are the options for importing and inviting our agents?",
          a: "We support three seamless options to onboard your roster in under 2 minutes: 1) uploading a CSV or pasting a list of agent emails to send direct invitations, 2) sharing a secure, self-serve office sign-up link in your internal communication channels, or 3) enabling automated Google Workspace provisioning for anyone signing in with your company's domain."
        },
        {
          q: "How do office-wide defaults cascade to new agents?",
          a: "In the Brokerage Settings dashboard, you can define default configurations including the default language (English or French), default CRM system (Follow Up Boss, kvCORE, etc.), and lead routing mechanisms (Listing Agent, Round-Robin, or Office Admin). Newly joined agents instantly inherit these configurations, meaning zero onboarding friction for individual roster agents."
        },
        {
          q: "Can the brokerage enforce global lender pairing and compliance rules?",
          a: "Yes. Brokerage Admins have ultimate resolution precedence. Under global policy settings, you can configure broker-level rules that enforce the office's default preferred paired lender, restrict team-level overrides, and view complete consent and audit logs across all listings associated with your firm."
        }
      ]
    }
  };

  const activeHelp = helpSections[activeTab as keyof typeof helpSections] || helpSections.agent;

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-800 pb-24 text-left min-h-screen font-sans">
        
        {/* HERO */}
        <div className="relative py-16 px-6 border-b border-slate-200 overflow-hidden bg-slate-900 text-white">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto text-center relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="h-3.5 w-3.5" /> Platform Support Hub
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              How can we help you today?
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              Find detailed configuration answers, workflow blueprints, and troubleshooting manuals tailored for every role on the platform.
            </p>
          </div>
        </div>

        {/* TABS CONTROLLER */}
        <div className="max-w-7xl mx-auto px-6 pt-10">
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 border-b border-slate-200 pb-3">
            <button
              onClick={() => handleTabChange("agent")}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 border cursor-pointer ${
                activeTab === "agent"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Agents Guide</span>
            </button>
            
            <button
              onClick={() => handleTabChange("team")}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 border cursor-pointer ${
                activeTab === "team"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Team Leads Guide</span>
            </button>
            
            <button
              onClick={() => handleTabChange("lender")}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 border cursor-pointer ${
                activeTab === "lender"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Coins className="h-4 w-4" />
              <span>Lenders Guide</span>
            </button>

            <button
              onClick={() => handleTabChange("brokerage")}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 border cursor-pointer ${
                activeTab === "brokerage"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Building className="h-4 w-4" />
              <span>Brokers Guide</span>
            </button>
          </div>
        </div>

        {/* HELP DETAILS DISPLAY */}
        <div className="max-w-7xl mx-auto px-6 pt-10">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            
            {/* Left FAQ accordion section */}
            <div className="lg:col-span-8 space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 font-bold uppercase px-2.5 py-1 rounded-full">
                    {activeHelp.badge}
                  </span>
                </div>
                <h2 className="text-3xl font-black text-slate-900">{activeHelp.title}</h2>
                <p className="text-base text-blue-600 font-bold">{activeHelp.subtitle}</p>
                <p className="text-slate-500 text-sm">{activeHelp.description}</p>
              </div>

              {/* FAQs Container */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" /> Frequently Asked Questions
                </h3>
                
                <div className="grid gap-4">
                  {activeHelp.faqs.map((faq, idx) => (
                    <Card key={idx} className="border-slate-200/80 shadow-sm overflow-hidden">
                      <CardContent className="p-6 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <span className="h-5 w-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">Q</span>
                          <h4 className="font-extrabold text-slate-900 text-sm md:text-base">{faq.q}</h4>
                        </div>
                        <div className="flex items-start gap-2.5 pl-7 border-l-2 border-slate-100">
                          <p className="text-slate-600 text-xs md:text-sm leading-relaxed">{faq.a}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Direct links to sign up */}
              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <h4 className="font-bold text-slate-900 text-sm">Ready to apply these workflows?</h4>
                  <p className="text-xs text-slate-500">Sign up or launch your pre-populated open house dashboard in seconds.</p>
                </div>
                <Link to="/register" className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shrink-0">
                  <span>Get Started Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right Quick Checklist */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-6 md:p-8 shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full filter blur-2xl -z-10"></div>
                
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-400" /> Compliance Checklists
                </h3>

                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5 text-blue-400">
                      <Check className="h-3.5 w-3.5 font-bold" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">PIPEDA & Law 25 Rules</p>
                      <p className="text-[10.5px] text-slate-400 mt-0.5 leading-normal">Explicit consent fields must be acknowledged before lead dispatching occurs.</p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5 text-blue-400">
                      <Check className="h-3.5 w-3.5 font-bold" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">RECO Unbranded Standard</p>
                      <p className="text-[10.5px] text-slate-400 mt-0.5 leading-normal">Ensures virtual tours do not display active listing brokerage branding in Ontario.</p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5 text-blue-400">
                      <Check className="h-3.5 w-3.5 font-bold" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Secure Exit PIN lock</p>
                      <p className="text-[10.5px] text-slate-400 mt-0.5 leading-normal">Requires security PIN authentication to terminate locked consumer sign-in screens.</p>
                    </div>
                  </li>
                </ul>

                <div className="pt-4 border-t border-slate-800 text-center">
                  <Link to="/compliance" className="text-[10px] text-blue-400 hover:underline font-bold">
                    View Complete Audit & Compliance Documentation
                  </Link>
                </div>
              </div>

              {/* Need direct assistance card */}
              <Card className="border-slate-200">
                <CardContent className="p-6 space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-sm">Need Direct Help?</h4>
                  <p className="text-xs text-slate-500 leading-normal">Our dedicated real estate account specialists are standing by 24/7 to help you configure listings, rosters, or partner credentials.</p>
                  <Link to="/contact" className="text-xs text-blue-600 font-bold hover:underline block">
                    Contact Dedicated Support →
                  </Link>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>

      </div>
    </PublicLayout>
  );
}
