import React, { useState } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "@/components/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  Sparkles, 
  ShieldCheck, 
  Smartphone, 
  User, 
  Users, 
  Coins, 
  Building, 
  RefreshCw, 
  Mail, 
  Lock, 
  Share2, 
  Calendar, 
  ArrowRight,
  CheckCircle2,
  Clock,
  Database
} from "lucide-react";

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  agentTip?: string;
  tags: string[];
}

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-1");

  const categories = [
    { id: "all", label: "All Questions", icon: HelpCircle },
    { id: "agent_safety", label: "Solo Agent Safety", icon: ShieldCheck },
    { id: "sora_ai", label: "Sora AI & Voice Tours", icon: Sparkles },
    { id: "email_crm", label: "Email & CRM Follow-Up", icon: Mail },
    { id: "kiosk_offline", label: "Tablet Kiosk & Offline", icon: Smartphone },
    { id: "listing_reimport", label: "MLS Import & Editing", icon: RefreshCw },
    { id: "lender_consent", label: "Lender Pairing & Consent", icon: Coins },
    { id: "security_session", label: "Session Security & Roles", icon: Lock },
  ];

  const faqs: FaqItem[] = [
    {
      id: "faq-1",
      category: "agent_safety",
      question: "What are the 'CHECKIN AGENT' and 'SAVE LOGS' buttons for?",
      answer: "These controls are part of our Solo-Agent Open House Safety & Security Check-In System. While hosting an open house alone at a property, pressing 'CHECKIN AGENT' confirms that you are safe on-site and resets your safety check-in timer. If an agent fails to check in before the event window expires, the system automatically triggers an emergency protocol to ping designated emergency contacts. Clicking 'SAVE LOGS' archives timestamped location logs, host security notes, property handover status, and visitor audit trails to Firestore for brokerage compliance.",
      agentTip: "Always press 'CHECKIN AGENT' when arriving at a solo open house and before initiating guest sign-ins.",
      tags: ["safety", "checkin agent", "save logs", "emergency", "open house", "solo agent"]
    },
    {
      id: "faq-2",
      category: "email_crm",
      question: "What does the 'Send Sora Follow-Up Email' feature do?",
      answer: "When reviewing guest visitor profiles in your Open House Roster or Lead Details, clicking 'Send Sora Follow-Up Email' opens an AI-tailored composer. Sora analyzes the exact audio tour questions the visitor asked during their walkthrough (e.g. kitchen upgrades, HOA fees, master suite layout) and whether they opted into mortgage financing. Sora then generates a personalized, high-converting email draft complete with bulleted property takeaways, a second walkthrough invitation, and optional lender co-branding.",
      agentTip: "Use the '🤖 Re-Draft with Sora' button inside the email composer to generate fresh tone variations before sending.",
      tags: ["sora", "follow-up", "email", "leads", "crm", "visitor roster", "ai draft"]
    },
    {
      id: "faq-3",
      category: "listing_reimport",
      question: "How do I re-import listing data in the Edit Listing Dashboard?",
      answer: "Under Step 2 (Basic Info / Review Major Property Details) of the Edit Listing Dashboard, click the 'Re-Import Listing Data' button to the right of the header. The system will prompt you with a confirmation modal asking 'Yes, Re-Import Now' or 'No, Cancel'. Confirming re-fetches the latest MLS specifications, room counts, pricing, and property descriptions from the source URL without requiring you to re-create the listing from scratch.",
      agentTip: "Re-importing is ideal if price adjustments or updated property photos were recently posted to your MLS source.",
      tags: ["re-import", "listing", "mls", "edit listing", "property details", "ingest"]
    },
    {
      id: "faq-4",
      category: "listing_reimport",
      question: "What is the 24-Hour 'Go Live' Reminder popup?",
      answer: "If you create or ingest a property listing and leave it in draft/pending status for over 24 hours, the platform automatically presents a prominent '24-Hour Go Live Reminder' dialog upon login or when visiting your dashboard. Clicking 'Update & Go Live Now' instantly publishes the listing, activating your Sora AI voice walkthrough, generating dynamic sign-in QR codes, and opening automated CRM lead routing.",
      agentTip: "Going live takes less than 10 seconds and ensures your open house marketing assets are active before buyers arrive.",
      tags: ["go live", "24 hour reminder", "publish", "draft", "open house"]
    },
    {
      id: "faq-5",
      category: "listing_reimport",
      question: "How does the 'Rewrite with AI' Social Share generator work?",
      answer: "In Step 5 (Flyers, QR & Social) of the Edit Listing Dashboard, next to the Custom Share Title and Custom Share Description fields, you will find 'Rewrite with AI' action links. Powered by Sora AI (backed by Gemini 2.5 Flash), these buttons analyze your property features and generate engaging, social-ready titles and preview card descriptions formatted for Instagram, Facebook, and LinkedIn.",
      agentTip: "Click 'Rewrite with AI' multiple times to explore different promotional angles (luxury, urgency, family-friendly).",
      tags: ["social share", "rewrite with ai", "flyer", "social media", "preview card", "marketing"]
    },
    {
      id: "faq-6",
      category: "kiosk_offline",
      question: "How do I launch and lock the Open House Gate Sign-In Kiosk?",
      answer: "In Step 4 of the listing editor or directly from your Open House event page, click 'Launch Kiosk'. This enters full-screen attendee lock mode, displaying your property branding and digital liability waiver. Attendees can enter their contact info cleanly without accessing agent dashboard controls. To exit kiosk mode, tap the lock icon and enter your agent security PIN.",
      agentTip: "The kiosk automatically resets to the welcome screen 5 seconds after a guest submits their information.",
      tags: ["kiosk", "open house gate", "sign-in", "security pin", "lock mode", "waiver"]
    },
    {
      id: "faq-7",
      category: "kiosk_offline",
      question: "Can I collect attendee sign-ins if the open house has no Wi-Fi?",
      answer: "Yes. AI Open House Connect includes a robust Offline Event Buffer. If internet connectivity drops, the tablet kiosk continues accepting guest sign-ins locally, storing them in encrypted browser storage and displaying a status banner: 'Local Cache Sync Pending: N leads'. Once your device reconnects to Wi-Fi or cellular data, all leads automatically sync to Firestore and trigger CRM dispatch.",
      agentTip: "You never need to worry about losing visitor contacts during poor cellular reception at remote listings.",
      tags: ["offline", "wifi", "local cache", "sync pending", "kiosk", "leads"]
    },
    {
      id: "faq-8",
      category: "security_session",
      question: "Why am I prompted to re-authenticate after a long session?",
      answer: "To satisfy PIPEDA, Law 25, and RECO real estate security compliance, the platform enforces an absolute 8-Hour Session Limit as well as a 60-Minute Inactivity Timer. If your session exceeds 8 hours or remains unattended for 60 minutes in Client Mode, a secure Re-Authentication modal appears. Simply re-enter your password or security PIN to instantly restore your working session.",
      agentTip: "This protects sensitive buyer lead data and mortgage consent logs if a tablet or computer is left unattended.",
      tags: ["session timeout", "re-authenticate", "security pin", "8 hour limit", "inactivity", "compliance"]
    },
    {
      id: "faq-9",
      category: "email_crm",
      question: "How does Follow Up Boss (FUB) integration and field mapping work?",
      answer: "Navigate to the Integrations page in your agent dashboard to connect Follow Up Boss via API Key. Our interactive field mapper lets you map lead fields (Name, Email, Phone, Property Address, Custom Questions). When a visitor checks 'Yes' to mortgage assistance, the system automatically translates this into the system tag 'fub-mortgage-interest' inside Follow Up Boss.",
      agentTip: "Lead creation succeeds locally first even if an external CRM endpoint is temporarily offline, storing retries safely.",
      tags: ["follow up boss", "crm", "field mapping", "integrations", "fub-mortgage-interest", "tags"]
    },
    {
      id: "faq-10",
      category: "lender_consent",
      question: "What is the Consent Gate for lender lead routing?",
      answer: "Mortgage co-marketing compliance requires explicit consumer opt-in. During kiosk sign-in, guests see an optional checkbox: 'Would you like information on financing options?'. If checked ('Yes'), the lead profile and consent timestamp route to your paired lender. If unchecked or if no paired lender is configured, all mortgage questions and lender co-branding are hidden automatically.",
      agentTip: "Resolution precedence follows: Listing Override > Team Policy > Agent Paired Lender > Market Default > No Lender.",
      tags: ["lender", "consent gate", "mortgage", "paired lender", "compliance", "pipeda", "respa"]
    },
    {
      id: "faq-11",
      category: "sora_ai",
      question: "How does Sora AI guide buyers through property audio tours?",
      answer: "Sora is your in-app AI property assistant. During open house tours or virtual walkthroughs, Sora narrates property photos in sync with a verified visual manifest. If a buyer asks about the kitchen, Sora displays the kitchen photo before speech begins. Sora speaks 65+ languages, answers listing Q&As, and introduces financing options strictly when requested.",
      agentTip: "You can customize Sora's talking points and Q&As under Step 2 and Step 3 of the Edit Listing Dashboard.",
      tags: ["sora", "ai tour", "audio tour", "voice", "multilingual", "manifest sync"]
    },
    {
      id: "faq-12",
      category: "agent_safety",
      question: "What is Shared Listing Cross-Hosting?",
      answer: "If another agent hosts an open house for your listing, you can assign them hosting rights via the Listing ellipsis menu under 'Shared Listing Assignment'. The host gets kiosk execution rights for specified dates without taking away your listing ownership. Captured leads record both the Listing Owner Agent ID and Hosting Agent ID according to team visibility rules.",
      agentTip: "Great for team leads or co-agents cross-hosting weekend events while preserving full audit logs.",
      tags: ["shared listing", "cross-hosting", "team", "hosting agent", "listing owner", "delegation"]
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesQuery = 
      searchQuery.trim() === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-800 pb-24 text-left min-h-screen font-sans">
        
        {/* HERO HEADER */}
        <div className="relative py-16 px-6 border-b border-slate-200 overflow-hidden bg-slate-900 text-white">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl"></div>
          
          <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="h-3.5 w-3.5" /> Knowledge Base & FAQ
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              Frequently Asked Questions
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              Find instant answers regarding solo agent safety check-ins, Sora AI voice tours, follow-up emails, tablet kiosk lock mode, and CRM lead integrations.
            </p>

            {/* SEARCH BAR */}
            <div className="pt-4 max-w-2xl mx-auto">
              <div className="relative flex items-center bg-white rounded-2xl shadow-xl p-1.5 border border-slate-200">
                <Search className="h-5 w-5 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions (e.g., 'checkin agent', 'sora email', 're-import', 'kiosk PIN')..."
                  className="w-full pl-3 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1 font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CATEGORY FILTER PILLS */}
        <div className="max-w-6xl mx-auto px-6 pt-10">
          <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200 pb-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 border cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ ACCORDION LIST */}
        <div className="max-w-4xl mx-auto px-6 pt-8 space-y-4">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Showing {filteredFaqs.length} {filteredFaqs.length === 1 ? "Result" : "Results"}
            </span>
            {selectedCategory !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Reset Filter
              </button>
            )}
          </div>

          {filteredFaqs.length === 0 ? (
            <Card className="border-slate-200 bg-slate-50/50 p-8 text-center space-y-3">
              <HelpCircle className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No matching questions found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try adjusting your search query or select another category above. You can also view our full Role Guides or reach out to support.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link to="/help" className="text-xs font-bold text-blue-600 hover:underline">
                  View Help Guides →
                </Link>
                <Link to="/contact" className="text-xs font-bold text-blue-600 hover:underline">
                  Contact Support →
                </Link>
              </div>
            </Card>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <Card 
                  key={faq.id} 
                  className={`border transition-all duration-200 overflow-hidden ${
                    isOpen ? "border-blue-300 shadow-md bg-white" : "border-slate-200/80 shadow-xs hover:border-slate-300 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full text-left p-5 md:p-6 flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-start gap-3">
                      <span className="h-6 w-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0 mt-0.5 border border-blue-100">
                        Q
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-sm md:text-base leading-snug">
                        {faq.question}
                      </h3>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-200 mt-0.5 ${isOpen ? "rotate-180 text-blue-600" : ""}`} />
                  </button>

                  {isOpen && (
                    <CardContent className="px-5 md:px-6 pb-6 pt-0 space-y-4 border-t border-slate-100/80 mt-1">
                      <div className="flex items-start gap-3 pt-4">
                        <span className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs shrink-0 mt-0.5 border border-emerald-100">
                          A
                        </span>
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>

                      {faq.agentTip && (
                        <div className="ml-9 bg-blue-50/70 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
                          <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-blue-950">Pro Agent Tip: </span>
                            <span className="text-blue-900 leading-normal">{faq.agentTip}</span>
                          </div>
                        </div>
                      )}

                      <div className="ml-9 flex flex-wrap gap-1.5 pt-1">
                        {faq.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* BOTTOM HELPFUL LINKS FOOTER */}
        <div className="max-w-4xl mx-auto px-6 pt-12">
          <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full filter blur-3xl"></div>
            
            <div className="space-y-2 text-center md:text-left relative z-10">
              <h3 className="text-lg font-black text-white">Still have questions?</h3>
              <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                Explore our role-specific help guides for Agents, Team Leads, Lenders, and Brokers, or contact our 24/7 support concierge.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 relative z-10 shrink-0">
              <Link 
                to="/help" 
                className="h-11 px-5 bg-white text-slate-900 hover:bg-slate-100 font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
              >
                <span>Role Help Manuals</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                to="/contact" 
                className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
              >
                <span>Contact Concierge</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </PublicLayout>
  );
}
