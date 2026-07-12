import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  User, 
  Users, 
  Building, 
  Coins, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  FileCheck, 
  Bookmark, 
  PhoneCall, 
  Smartphone, 
  Send,
  Zap,
  Globe,
  Settings,
  ShieldCheck,
  Check,
  Play
} from "lucide-react";

export default function GuidesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const roleParam = searchParams.get("role") || "agent";
  const [activeTab, setActiveTab] = useState<string>("agent");

  useEffect(() => {
    if (roleParam && ["agent", "team", "broker", "lender"].includes(roleParam)) {
      setActiveTab(roleParam);
    }
  }, [roleParam]);

  const handleTabChange = (role: string) => {
    setActiveTab(role);
    setSearchParams({ role });
  };

  const rolesData = {
    agent: {
      title: "Solo Agent Playbook",
      badge: "Fast Track < 3 mins",
      subtitle: "Accelerate your open house conversions with personal AI property guidance",
      description: "Sora acts as your dedicated digital co-host, managing visitor sign-ins on tablet kiosk mode while offering instant, multi-lingual audio property walkthroughs. All buyer profiles and interests are automatically structured and synced to your favorite CRM.",
      highlights: [
        "Interactive AI voice tours for potential buyers, natively in 15 languages.",
        "Beautiful unbranded open house flyers with custom QR-entry codes.",
        "B2B preferred lender pairing with strict, consent-based routing.",
        "Follow Up Boss custom field mapping for effortless client follow-ups."
      ],
      steps: [
        {
          num: "1",
          title: "Sign In with Google",
          desc: "Set up your agent profile in under 30 seconds. Your name, email, and photo are auto-populated from Google."
        },
        {
          num: "2",
          title: "Import Your First Listing",
          desc: "Paste any Zillow, Redfin, or MLS link. Our parser pulls property specs, images, and highlights in real time."
        },
        {
          num: "3",
          title: "Select Welcome Language",
          desc: "Choose a primary language for Sora to greet visitors. Setup is immediately live with unbranded flyers."
        },
        {
          num: "4",
          title: "Launch Tablet Kiosk",
          desc: "Secure the sign-in kiosk on your tablet with an Agent PIN. Hand it to attendees as they walk through the door."
        }
      ],
      cta: "Launch Solo Onboarding",
      link: "/register?plan=free"
    },
    team: {
      title: "Team Lead Playbook",
      badge: "Team Scale < 10 mins",
      subtitle: "Unify branding, listing delegation, and lead tracking across your entire team roster",
      description: "Manage collective listing inventory, allocate active hosting rights, and enforce team-wide routing guidelines. Provide your agents with professional branding standards and high-converting tablet kiosks that elevate client experiences.",
      highlights: [
        "Listing delegation parameters: assign specific team members or use a shared pool.",
        "Team accent color presets and centralized co-branding settings.",
        "Enforce team block-policies for preferred lender allocations globally.",
        "Cross-hosting open house handshakes with auto-emails and explicit status logs."
      ],
      steps: [
        {
          num: "1",
          title: "Establish Team Identity",
          desc: "Define your team name, pick your brokerage parent, and lock in the team accent colors."
        },
        {
          num: "2",
          title: "Invite Teammates",
          desc: "Paste agent email addresses or share a secure invite link to self-onboard team members in seconds."
        },
        {
          num: "3",
          title: "Load Shared Listings",
          desc: "Import listings centrally. Define whether they reside in a shared pool or are assigned to specific agents."
        },
        {
          num: "4",
          title: "Setup Routing Policies",
          desc: "Enforce a unified preferred lender or allow individual agents to pair their own local partners."
        }
      ],
      cta: "Launch Team Onboarding",
      link: "/register?plan=team"
    },
    broker: {
      title: "Broker of Record Blueprint",
      badge: "Enterprise Setup < 5 mins",
      subtitle: "Centralized compliance, brokerage branding, and seamless multi-branch provisioning",
      description: "Enforce province-wide real estate rules (like RECO compliance in Ontario and Law 25 in Quebec). Empower every agent across multiple office branches with pre-configured templates, secure lead delivery structures, and clean unbranded tours.",
      highlights: [
        "Centralized regulatory compliance controls and detailed data audit trails.",
        "Office-wide logo cascades and white-labeled subdomain configurations.",
        "Multiple agent provisioning formats: CSV roster upload or Workspace auto-provision.",
        "Round-robin, listing agent, or office admin lead routing options."
      ],
      steps: [
        {
          num: "1",
          title: "Profile Legal Entity",
          desc: "Specify your legal name, logo, dominant branding color, and set up your brokerage subdomain."
        },
        {
          num: "2",
          title: "Confirm Local Board",
          desc: "Select provinces of operation to auto-configure MLS rules, local disclosures, and compliance settings."
        },
        {
          num: "3",
          title: "Provision Agent Roster",
          desc: "Drag-and-drop your agent CSV directory list or activate the Google Workspace auto-provision connection."
        },
        {
          num: "4",
          title: "Set Office Routing Defaults",
          desc: "Lock in fallback routing structures, primary language options, and template disclaimers."
        }
      ],
      cta: "Establish Brokerage Portal",
      link: "/register?plan=brokerage"
    },
    lender: {
      title: "Mortgage Partner Handbook",
      badge: "B2B Subscription Active",
      subtitle: "Strict consent-gated routing that generates premium, exclusive borrower opportunities",
      description: "Partner directly with active real estate agents, teams, or entire brokerages. AI Open House Connect guarantees absolute borrower compliance, routing buyer leads with explicit mortgage interest to you immediately.",
      highlights: [
        "The Consent Gate: mortgage questions only display upon explicit opt-in confirmation.",
        "Interactive co-branding on agent welcome kiosks and unbranded flyer sheets.",
        "Instant text/email borrower alerts and structured dashboard queues.",
        "Multi-agent pairing allocations based on active subscription limits."
      ],
      steps: [
        {
          num: "1",
          title: "Create Lender Profile",
          desc: "Input your name, company name, photo, and mandatory licensing details (like NMLS in US, FSRA in ON)."
        },
        {
          num: "2",
          title: "Select Subscription Plan",
          desc: "Choose your paired agent seat count. Subscriptions scale smoothly to accommodate growth."
        },
        {
          num: "3",
          title: "Invite or Accept Pairings",
          desc: "Send pairing invitations directly to agent emails or approve incoming pairing requests from your dashboard."
        },
        {
          num: "4",
          title: "Manage Incoming Leads",
          desc: "Monitor your leads queue. Only buyers who clicked 'Yes' to mortgage financing are routed, ensuring high quality."
        }
      ],
      cta: "Register as Lender",
      link: "/register?plan=lender"
    }
  };

  const activeData = rolesData[activeTab as keyof typeof rolesData] || rolesData.agent;

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-stone-50 via-white to-stone-50 text-stone-800 pb-24 text-left min-h-screen">
        
        {/* HERO TITLE */}
        <div className="relative py-16 px-6 overflow-hidden border-b border-stone-200">
          <div className="absolute inset-0 bg-grid-stone-900/[0.02] bg-[size:20px_20px]"></div>
          <div className="max-w-7xl mx-auto text-center relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0052A5]/10 text-[#0052A5] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3 animate-pulse" /> AI Open House Workflows
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-stone-900">
              Role Playbooks & Onboarding Guides
            </h1>
            <p className="text-stone-500 max-w-2xl mx-auto text-sm md:text-base">
              Select your real estate role below to view step-by-step instructions, features list, and direct links to get started immediately.
            </p>
          </div>
        </div>

        {/* ROLE TABS NAVIGATION */}
        <div className="max-w-7xl mx-auto px-6 pt-10">
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 border-b border-stone-200 pb-2">
            <button
              id="guide-tab-agent"
              onClick={() => handleTabChange("agent")}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 border cursor-pointer ${
                activeTab === "agent"
                  ? "bg-[#0052A5] text-white border-[#0052A5] shadow-md"
                  : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Solo Agent</span>
            </button>
            <button
              id="guide-tab-team"
              onClick={() => handleTabChange("team")}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 border cursor-pointer ${
                activeTab === "team"
                  ? "bg-[#0052A5] text-white border-[#0052A5] shadow-md"
                  : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Team Lead</span>
            </button>
            <button
              id="guide-tab-broker"
              onClick={() => handleTabChange("broker")}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 border cursor-pointer ${
                activeTab === "broker"
                  ? "bg-[#0052A5] text-white border-[#0052A5] shadow-md"
                  : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <Building className="h-4 w-4" />
              <span>Broker / Office</span>
            </button>
            <button
              id="guide-tab-lender"
              onClick={() => handleTabChange("lender")}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 border cursor-pointer ${
                activeTab === "lender"
                  ? "bg-[#0052A5] text-white border-[#0052A5] shadow-md"
                  : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <Coins className="h-4 w-4" />
              <span>Lender Partner</span>
            </button>
          </div>
        </div>

        {/* ACTIVE PLAYBOOK CONTENT */}
        <div className="max-w-7xl mx-auto px-6 pt-10">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            
            {/* Left overview and features */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-black text-stone-900 leading-tight">
                    {activeData.title}
                  </h2>
                  <span className="text-xs bg-[#0052A5]/10 text-[#0052A5] border border-[#0052A5]/20 font-black tracking-wider uppercase px-2.5 py-1 rounded-full">
                    {activeData.badge}
                  </span>
                </div>
                <p className="text-lg font-bold text-[#0052A5]">
                  {activeData.subtitle}
                </p>
                <p className="text-stone-600 text-sm leading-relaxed">
                  {activeData.description}
                </p>
              </div>

              {/* Core Features list */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-stone-900 tracking-tight uppercase flex items-center gap-2 border-b pb-3">
                  <CheckCircle2 className="h-5 w-5 text-[#0052A5]" /> Included Operational Capabilities
                </h3>
                <ul className="space-y-3">
                  {activeData.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                      </div>
                      <span className="text-xs md:text-sm font-medium text-stone-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action and Redirect Links */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link 
                  to={activeData.link}
                  className="inline-flex items-center justify-center px-8 h-14 bg-[#0052A5] hover:bg-[#004185] text-white font-black rounded-xl text-sm md:text-base hover:scale-105 active:scale-95 transition-all duration-200 shadow-md group"
                >
                  <span>{activeData.cta}</span>
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/demo"
                  className="inline-flex items-center justify-center px-8 h-14 bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 font-bold rounded-xl text-sm md:text-base hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  Book Specialized Walkthrough
                </Link>
              </div>
            </div>

            {/* Right step progression */}
            <div className="lg:col-span-5">
              <div className="bg-[#111827] text-white rounded-3xl border border-stone-800 p-6 md:p-8 shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#0052A5]/10 rounded-full filter blur-3xl -z-10"></div>
                
                <h3 className="text-lg font-black tracking-tight text-white border-b border-stone-800 pb-4">
                  Step-by-Step Activation Protocol
                </h3>

                <div className="space-y-6">
                  {activeData.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="h-8 w-8 rounded-full bg-[#0052A5] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
                        {step.num}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-white text-sm">{step.title}</h4>
                        <p className="text-stone-400 text-xs leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-stone-800 text-center">
                  <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                    Fully Compliant with Canadian RECO & Law 25 Regulations
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* COMPLIANCE FOOTNOTE */}
        <section className="max-w-7xl mx-auto px-6 pt-16">
          <div className="bg-stone-100 rounded-2xl border p-6 md:p-8 text-center space-y-4">
            <h3 className="font-bold text-stone-900 text-base">Canadian Compliance and Governance Standards</h3>
            <p className="text-xs text-stone-500 max-w-3xl mx-auto leading-relaxed">
              AI Open House Connect is fully synchronized with Canadian provincial regulatory requirements. 
              Our templates support Ontario Real Estate Council of Ontario (RECO) unbranded guidelines for passive listing displays, 
              as well as strict federal PIPEDA regulations and Quebec’s Law 25 compliance rules for consumer privacy. 
              Visitor registrations can be configured to prompt explicit disclosure acknowledgments automatically.
            </p>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
