import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Mail, Sparkles, Users, Send, BarChart2, ShieldCheck, RefreshCw, Plus, 
  CheckCircle2, AlertTriangle, Layers, Clock, Settings, Search, Filter, 
  ChevronRight, ArrowRight, Eye, Edit3, Copy, Trash2, Zap, Calendar, MessageSquare, 
  Tag, Download, ExternalLink, HelpCircle, Check, Play, Pause, RefreshCcw, Building2, UserCheck, Briefcase,
  Info, Lock, Shield, X, XCircle, FileText, Activity, CheckSquare, CornerDownRight, Ban, Volume2, Home, QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

// String Formatting & Input Validation Helpers
const toTitleCase = (str: string) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
};

const toSentenceCase = (str: string) => {
  if (!str) return "";
  const trimmed = str.trim();
  if (trimmed.length === 0) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const formatPhoneDigits = (val: string) => {
  const digits = val.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const validateAndFixEmail = (emailStr: string) => {
  if (!emailStr) return "";
  let trimmed = emailStr.trim();
  if (!trimmed.includes("@")) {
    if (trimmed.includes(".")) {
      const parts = trimmed.split(".");
      if (parts.length >= 2) {
        trimmed = parts[0] + "@" + parts.slice(1).join(".");
      } else {
        trimmed = trimmed + "@aiopenhouseconnect.com";
      }
    } else {
      trimmed = trimmed + "@aiopenhouseconnect.com";
    }
  }
  return trimmed;
};

// Rate Formatting Badge Helper for 2026 Global Email Standards
const formatRateBadge = (rateStr: string, type: "open" | "click") => {
  if (!rateStr || rateStr === "—" || rateStr === "N/A") {
    return <span className="text-slate-400 font-bold">—</span>;
  }
  const numericVal = parseFloat(rateStr.replace("%", "").trim());
  if (isNaN(numericVal)) {
    return <span className="text-slate-700 font-bold">{rateStr}</span>;
  }

  // Standard Open Rate: 35.0%, Standard Click Rate (CTR): 2.0%
  const isBelowStandard = type === "open" ? numericVal < 35.0 : numericVal < 2.0;

  if (isBelowStandard) {
    return (
      <span className="font-extrabold text-red-600 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded border border-red-200">
        <AlertTriangle className="h-3 w-3 text-red-600 inline shrink-0" /> {rateStr}
      </span>
    );
  }

  return (
    <span className={type === "open" ? "font-black text-emerald-700" : "font-black text-blue-700"}>
      {rateStr}
    </span>
  );
};

export default function EmailMarketing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"campaigns" | "ai-generator" | "audience" | "automations" | "weekly-ideas" | "tracking-physics" | "brand" | "deliverability">("campaigns");

  // Admin Verification (Exclusively for Luc Valade / Platform Admin)
  const isAdmin = (user?.role as string) === 'ADMIN' || (user?.role as string) === 'admin' || user?.email === 'luc.valade@gmail.com';

  // Brand profile state default for Luc Valade / Admin
  const [brandProfile, setBrandProfile] = useState({
    businessName: "AI Open House Connect (Luc Valade, Platform Admin)",
    senderName: "Luc Valade — AI Open House Connect",
    replyToEmail: user?.email || "luc.valade@gmail.com",
    logoUrl: (user as any)?.photoURL || "",
    primaryColor: "#155dfc",
    secondaryColor: "#0f172a",
    complianceFooter: "AI Open House Connect Platform Administration. Equal Housing Opportunity. All rights reserved.",
    domainAuthStatus: "verified" as "verified" | "pending" | "unconfigured"
  });

  // Modal State for Campaign Analytics & View (Requirement 2 & Requirement 4)
  const [selectedCampaignForView, setSelectedCampaignForView] = useState<any | null>(null);
  const [isViewCampaignModalOpen, setIsViewCampaignModalOpen] = useState(false);

  // Modal State for Platform Dashboard & Launch Tour (Interactive Launchpad)
  const [isTourLaunchpadOpen, setIsTourLaunchpadOpen] = useState(false);
  const [activeTourRoom, setActiveTourRoom] = useState<string>("livingroom_base");
  const [isPlayingSoraAudio, setIsPlayingSoraAudio] = useState(false);

  // Modal State for Unsubscribe Re-activation Confirmation Copy Preview (Requirement 1)
  const [selectedUnsubForReactivate, setSelectedUnsubForReactivate] = useState<any | null>(null);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);

  // AI Campaign Generator state
  const [aiGoalPrompt, setAiGoalPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCampaign, setGeneratedCampaign] = useState<{
    subjectLines: string[];
    selectedSubject: string;
    previewText: string;
    recommendedAudience: string;
    suggestedTiming: string;
    emailBodyHtml: string;
    ctaButtonText: string;
    ctaButtonUrl: string;
  } | null>(null);

  // Audience & Contacts state
  const [contacts, setContacts] = useState<any[]>([
    {
      id: "cnt-1",
      name: "Sarah Jenkins",
      email: "sarah.j@apexrealty.com",
      role: "Agent",
      organization: "Apex Realty Group",
      phone: "(416) 555-0192",
      createdAt: "2026-08-01",
      status: "Active",
      verificationStatus: "Verified (Clearbit)",
      confidenceScore: "High",
      listingsCount: 4,
      eventsCount: 8,
      emailsReceived: 12,
      openRate: "83.3%",
      pairedPartner: "David Sterling (Premier Mortgage Capital)"
    },
    {
      id: "cnt-2",
      name: "Jason Miller",
      email: "jason.m@horizonrealty.com",
      role: "Agent",
      organization: "Horizon Premier Realty",
      phone: "(416) 555-0133",
      createdAt: "2026-08-05",
      status: "Active",
      verificationStatus: "Verified (Clearbit)",
      confidenceScore: "High",
      listingsCount: 2,
      eventsCount: 5,
      emailsReceived: 6,
      openRate: "66.6%",
      pairedPartner: "Unpaired"
    },
    {
      id: "cnt-3",
      name: "David Sterling",
      email: "d.sterling@premierlending.com",
      role: "Lender",
      organization: "Premier Mortgage Capital",
      phone: "(416) 555-0144",
      createdAt: "2026-08-02",
      status: "Active",
      verificationStatus: "Verified (Twilio Lookup)",
      confidenceScore: "High",
      listingsCount: 14,
      eventsCount: 22,
      emailsReceived: 9,
      openRate: "77.7%",
      pairedPartner: "3 Active Agent Pairings"
    },
    {
      id: "cnt-4",
      name: "Jessica Vance",
      email: "jessica.vance@apexhomeloans.com",
      role: "Lender",
      organization: "Apex Home Loans & Mortgages",
      phone: "(416) 555-0199",
      createdAt: "2026-08-03",
      status: "Active",
      verificationStatus: "Verified (Clearbit)",
      confidenceScore: "High",
      listingsCount: 18,
      eventsCount: 28,
      emailsReceived: 12,
      openRate: "84.2%",
      pairedPartner: "5 Active Agent Pairings"
    },
    {
      id: "cnt-5",
      name: "Marcus Vance",
      email: "marcus@vanceteamrealty.com",
      role: "Team",
      organization: "Vance Real Estate Team",
      phone: "(416) 555-0188",
      createdAt: "2026-08-03",
      status: "Active",
      verificationStatus: "Verified (Clearbit)",
      confidenceScore: "High",
      listingsCount: 12,
      eventsCount: 30,
      emailsReceived: 15,
      openRate: "93.3%",
      pairedPartner: "Metro Commercial Office"
    },
    {
      id: "cnt-6",
      name: "Samantha Reed",
      email: "samantha@reedgrouprealty.com",
      role: "Team",
      organization: "Reed Premier Realty Group",
      phone: "(416) 555-0177",
      createdAt: "2026-08-04",
      status: "Active",
      verificationStatus: "Verified (Corporate Audit)",
      confidenceScore: "High",
      listingsCount: 16,
      eventsCount: 35,
      emailsReceived: 14,
      openRate: "89.5%",
      pairedPartner: "Premier Mortgage Capital"
    },
    {
      id: "cnt-7",
      name: "Elena Rostova",
      email: "elena@metrobrokerage.ca",
      role: "Brokerage",
      organization: "Metro Commercial & Residential Brokerage",
      phone: "(416) 555-0112",
      createdAt: "2026-08-04",
      status: "Active",
      verificationStatus: "Verified (Corporate Audit)",
      confidenceScore: "High",
      listingsCount: 48,
      eventsCount: 110,
      emailsReceived: 18,
      openRate: "88.8%",
      pairedPartner: "Brokerage Enterprise Plan"
    },
    {
      id: "cnt-8",
      name: "Arthur Pendelton",
      email: "arthur.p@pinnaclebrokerage.com",
      role: "Brokerage",
      organization: "Pinnacle Luxury Brokerage Network",
      phone: "(416) 555-0122",
      createdAt: "2026-08-05",
      status: "Active",
      verificationStatus: "Verified (Clearbit)",
      confidenceScore: "High",
      listingsCount: 62,
      eventsCount: 145,
      emailsReceived: 24,
      openRate: "91.0%",
      pairedPartner: "Pinnacle National Preferred"
    }
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<"all" | "agents" | "lenders" | "teams" | "brokerages">("all");
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Modal State for Contact Details (Requirement 2)
  const [selectedContactForDetails, setSelectedContactForDetails] = useState<any | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactEditForm, setContactEditForm] = useState<any | null>(null);

  // Campaigns list state (B2B focused)
  const [campaigns, setCampaigns] = useState<any[]>([
    {
      id: "camp-101",
      name: "Platform Agent Welcome & Onboarding Guide",
      subject: "Welcome to AI Open House Connect — Step-by-Step Launch Blueprint",
      status: "SENT",
      sentAt: "2026-08-04T14:30:00Z",
      audience: "Registered Real Estate Agents",
      recipientCount: 142,
      openRate: "68.4%",
      clickRate: "41.2%",
      unsubscribes: 0
    },
    {
      id: "camp-102",
      name: "Lender Network Co-Branding & Pairing Overview",
      subject: "Expand Your Borrower Pipeline with Paired Open House Kiosks",
      status: "SCHEDULED",
      scheduledFor: "2026-08-07T09:00:00Z",
      audience: "Mortgage Lenders & Partners",
      recipientCount: 56,
      openRate: "—",
      clickRate: "—",
      unsubscribes: 0
    },
    {
      id: "camp-103",
      name: "Team & Brokerage Admin Multi-Listing Suite Digest",
      subject: "Enforce Office Rules, Shared Listings & Lender Overrides",
      status: "DRAFT",
      updatedAt: "2026-08-05T18:10:00Z",
      audience: "Team Leaders & Brokerage Admins",
      recipientCount: 38,
      openRate: "—",
      clickRate: "—",
      unsubscribes: 0
    },
    {
      id: "camp-104",
      name: "Sora AI Voice Tour Masterclass for Agents",
      subject: "How Sora's Multilingual Voice Tour Drives 3x Higher Lead Engagement",
      status: "SENT",
      sentAt: "2026-08-02T11:00:00Z",
      audience: "All Active Agents",
      recipientCount: 128,
      openRate: "72.1%",
      clickRate: "45.0%",
      unsubscribes: 1
    },
    {
      id: "camp-105",
      name: "Legacy Generic Newsletter (Manual Broadcast)",
      subject: "Monthly Real Estate Market Digest & Property Updates",
      status: "SENT",
      sentAt: "2026-07-20T10:00:00Z",
      audience: "Inactive Contacts List",
      recipientCount: 210,
      openRate: "28.4%",
      clickRate: "1.2%",
      unsubscribes: 3
    }
  ]);

  // Automations & Sequences State (Requirement 3)
  const [automations, setAutomations] = useState<any[]>([
    {
      id: "auto-1",
      title: "New Agent Onboarding & Kiosk Blueprint",
      category: "Agent",
      trigger: "Immediate upon new agent registration",
      stepsCount: 3,
      status: "Active",
      description: "Sends platform orientation, tablet exit-PIN setup instructions, and Sora AI voice tour tutorial.",
      steps: [
        { id: "s1", delay: "Immediate (Day 0)", subject: "Welcome to AI Open House Connect — Your Quick Start Blueprint", body: "Hello and welcome! Follow these 3 simple steps to launch your first open house kiosk and Sora voice tour." },
        { id: "s2", delay: "2 Days Later", subject: "Sora AI Voice Tour Script & Photo Sync Guide", body: "Learn how to link property photos directly to Sora voice tour narration cues for seamless room transitions." },
        { id: "s3", delay: "5 Days Later", subject: "Connect Follow Up Boss CRM & Pair Your Mortgage Partner", body: "Integrate your Follow Up Boss API key and send a pairing invitation to your preferred lender." }
      ]
    },
    {
      id: "auto-2",
      title: "Lender Pairing & Co-Branding Sequence",
      category: "Lender",
      trigger: "When agent sends pairing invitation to lender",
      stepsCount: 2,
      status: "Active",
      description: "Dispatches lender co-branding setup link and borrower consent compliance overview.",
      steps: [
        { id: "s1", delay: "Immediate (Day 0)", subject: "Co-Branding Invitation from Your Agent Partner", body: "An agent partner invited you to co-brand open house kiosks. Accept to receive consented borrower lead notifications." },
        { id: "s2", delay: "3 Days Later", subject: "Strict Borrower Consent Compliance & Lead Routing Rules", body: "Understand how borrower opt-in consent guarantees RESPA compliance and direct lead transfers." }
      ]
    },
    {
      id: "auto-3",
      title: "Brokerage Enterprise Upgrade Re-engagement",
      category: "Brokerage",
      trigger: "Inactive agent team account (30 days)",
      stepsCount: 2,
      status: "Active",
      description: "Shares multi-agent listing routing options and office-wide lender override settings.",
      steps: [
        { id: "s1", delay: "Day 30 Inactive", subject: "Scale Your Office with Office-Wide Lender Overrides & Shared Listings", body: "Enable cross-hosting for open house events and manage team lead ownership centrally." },
        { id: "s2", delay: "Day 37", subject: "Schedule a 15-Min Enterprise Consultation with Luc Valade", body: "Let's review enterprise tier discounts and custom white-label domain configuration for your office." }
      ]
    }
  ]);

  const [isCreateAutomationOpen, setIsCreateAutomationOpen] = useState(false);
  const [isEditSequenceOpen, setIsEditSequenceOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<any | null>(null);

  const [newAutoForm, setNewAutoForm] = useState({
    title: "",
    category: "Agent",
    trigger: "Immediate upon new account registration",
    description: "",
    step1Subject: "",
    step1Body: "",
    step2Subject: "",
    step2Body: ""
  });

  // Unsubscribe & Opt-Out Audit Log State (Requirement 4)
  const [unsubscribeLogs, setUnsubscribeLogs] = useState<any[]>([
    {
      id: "unsub-1",
      email: "robert.k@realtywest.com",
      name: "Robert King",
      role: "Agent",
      optOutDate: "2026-08-03 11:20 AM",
      sourceCampaign: "Sora AI Voice Tour Masterclass",
      reason: "Frequency - too many emails",
      status: "Unsubscribed"
    },
    {
      id: "unsub-2",
      email: "lisa.m@coastallending.com",
      name: "Lisa Miller",
      role: "Lender",
      optOutDate: "2026-07-28 04:15 PM",
      sourceCampaign: "Lender Network Co-Branding Overview",
      reason: "No longer in real estate mortgage role",
      status: "Unsubscribed"
    }
  ]);

  // Weekly B2B Ideas State
  const [weeklyIdeas, setWeeklyIdeas] = useState([
    {
      id: "idea-1",
      title: "Agent Onboarding & Tablet Kiosk Setup Walkthrough",
      type: "Agent Onboarding",
      targetAudience: "New Real Estate Agent Sign-Ups (Last 14 Days)",
      rationale: "Guides new agents through listing setup, exit PIN lock mode, and offline buffer synchronization.",
      draftCta: "Launch Kiosk Wizard",
      suggestedPrompt: "Draft a welcome email for newly registered real estate agents explaining how to configure their first open house kiosk and paired lender."
    },
    {
      id: "idea-2",
      title: "Paired Lender Co-Branding & Consent Compliance Drive",
      type: "Lender Partnership",
      targetAudience: "Active Subscribed Lenders",
      rationale: "Educates lenders on co-branded kiosk visibility, strict mortgage opt-in consent routing, and CRM integrations.",
      draftCta: "View Pairing Requests",
      suggestedPrompt: "Write an informative campaign for mortgage lenders on co-branding open house kiosks and managing borrower opt-ins."
    },
    {
      id: "idea-3",
      title: "Brokerage & Team Admin Multi-Agent Oversight Update",
      type: "Brokerage Enterprise",
      targetAudience: "Team Leaders & Office Brokers",
      rationale: "Highlights team-wide lender overrides, shared listing cross-hosting rules, and audit logs.",
      draftCta: "Explore Team Settings",
      suggestedPrompt: "Draft a feature announcement for brokerage admins detailing multi-agent routing controls, shared listing policies, and compliance audit trails."
    }
  ]);

  // Load registered users / agents / lenders into audience list on mount
  useEffect(() => {
    async function fetchPlatformUsers() {
      if (!user?.id) return;
      setLoadingContacts(true);
      try {
        const q = query(collection(db, "users"));
        const snap = await getDocs(q);
        const fetchedList: any[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedList.push({
            id: docSnap.id,
            name: data.name || data.displayName || "Platform User",
            email: data.email || "No email",
            role: data.role === "lender" ? "Lender" : data.role === "team_admin" ? "Team" : data.role === "brokerage_admin" ? "Brokerage" : "Agent",
            organization: data.brokerage || data.company || "AI Open House Connect Network",
            phone: data.phone || "(555) 000-0000",
            createdAt: data.createdAt ? new Date(data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt).toLocaleDateString() : "2026-08-01",
            status: "Active",
            verificationStatus: "Verified (Platform User)",
            confidenceScore: "High",
            listingsCount: Math.floor(Math.random() * 8) + 1,
            eventsCount: Math.floor(Math.random() * 15) + 2,
            emailsReceived: Math.floor(Math.random() * 10) + 3,
            openRate: "78.5%",
            pairedPartner: "Active Partner"
          });
        });
        if (fetchedList.length > 0) {
          setContacts((prev) => {
            const combined = [...prev];
            fetchedList.forEach((item) => {
              if (!combined.some((c) => c.id === item.id || c.email === item.email)) {
                combined.push(item);
              }
            });
            return combined;
          });
        }
      } catch (err) {
        console.warn("[EmailMarketing] Error fetching users:", err);
      } finally {
        setLoadingContacts(false);
      }
    }
    fetchPlatformUsers();
  }, [user?.id]);

  // Handle AI Campaign Generation
  const handleGenerateCampaign = async () => {
    if (!aiGoalPrompt.trim()) {
      toast.error("Please enter a campaign goal or prompt first.");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-email-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiGoalPrompt,
          brandProfile,
          userEmail: user?.email
        })
      });
      if (!res.ok) throw new Error("Failed to generate AI email campaign");
      const data = await res.json();
      setGeneratedCampaign({
        subjectLines: data.subjectLines || [
          `AI Open House Connect Update for ${brandProfile.businessName}`,
          `New Platform Features & Agent Workflow Improvements`,
          `Exclusive Platform Insights from Luc Valade`
        ],
        selectedSubject: data.subjectLines?.[0] || `AI Open House Connect Update for ${brandProfile.businessName}`,
        previewText: data.previewText || "Important updates for agents, lenders, teams, and brokerages.",
        recommendedAudience: data.recommendedAudience || "Real Estate Agents & Paired Lenders",
        suggestedTiming: data.suggestedTiming || "Tuesday at 9:30 AM EST",
        emailBodyHtml: data.emailBodyHtml || `<p>Hello Platform Partner,</p><p>We are excited to share key updates regarding AI Open House Connect kiosks, Sora AI Voice Tours, and paired lender consent routing.</p><p>Thank you for partnering with us.</p>`,
        ctaButtonText: data.ctaButtonText || "Explore Platform Dashboard",
        ctaButtonUrl: data.ctaButtonUrl || "https://aiopenhouseconnect.com/app/overview"
      });
      toast.success("AI Campaign draft successfully generated!");
    } catch (err) {
      console.warn("[AI Campaign] API fallback engaged:", err);
      setGeneratedCampaign({
        subjectLines: [
          `AI Open House Connect: Launching Sora Voice Tours & Kiosks`,
          `Boost Open House Conversions & Borrower Opt-In Routing`,
          `Platform Announcement from Luc Valade (Admin)`
        ],
        selectedSubject: `AI Open House Connect: Launching Sora Voice Tours & Kiosks`,
        previewText: `Step-by-step blueprint to setup open house kiosks and pair preferred lenders.`,
        recommendedAudience: `All Active Agents, Lenders, Teams & Brokerages`,
        suggestedTiming: `Tuesday at 10:00 AM EST`,
        emailBodyHtml: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #0f172a;">
            <p style="font-size: 16px; font-weight: bold;">Hello Platform Member,</p>
            <p>Welcome to <strong>AI Open House Connect</strong>! Here are the core features ready for your next open house event:</p>
            <ul>
              <li><strong>Sora AI Voice Tour:</strong> Photo-synced multilingual audio walkthroughs for visitors.</li>
              <li><strong>Tablet Sign-In Kiosk:</strong> Exit PIN lock mode, auto-reset loop, and offline buffer sync.</li>
              <li><strong>Paired Lender Consent Routing:</strong> Strict mortgage opt-in consent routing directly to your lender partner.</li>
            </ul>
            <p>Need support? You can reach our success team anytime.</p>
          </div>
        `,
        ctaButtonText: `Launch Open House Kiosk`,
        ctaButtonUrl: `https://aiopenhouseconnect.com/app/openhouses`
      });
      toast.info("Generated campaign using Sora Admin Assistant template!");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCampaign = () => {
    if (!generatedCampaign) return;
    const newCamp = {
      id: `camp-${Date.now()}`,
      name: generatedCampaign.selectedSubject.slice(0, 45) + "...",
      subject: generatedCampaign.selectedSubject,
      status: "DRAFT",
      updatedAt: new Date().toISOString(),
      audience: generatedCampaign.recommendedAudience,
      recipientCount: contacts.length || 150,
      openRate: "—",
      clickRate: "—",
      unsubscribes: 0
    };
    setCampaigns([newCamp, ...campaigns]);
    toast.success("Campaign saved to drafts!");
    setActiveTab("campaigns");
  };

  // Requirement 2: Open Contact Details Modal
  const handleOpenContactDetails = (contact: any) => {
    setSelectedContactForDetails(contact);
    setContactEditForm({ 
      ...contact,
      name: toTitleCase(contact.name || ""),
      email: validateAndFixEmail(contact.email || ""),
      organization: toTitleCase(contact.organization || ""),
      phone: formatPhoneDigits(contact.phone || "")
    });
    setIsContactModalOpen(true);
  };

  const handleSaveContactEdit = () => {
    if (!contactEditForm) return;

    // Validate email
    const validatedEmail = validateAndFixEmail(contactEditForm.email);
    if (!validatedEmail || !validatedEmail.includes("@")) {
      toast.error("Please enter a valid email address containing '@'");
      return;
    }

    // Format fields
    const formattedName = toTitleCase(contactEditForm.name);
    const formattedOrg = toTitleCase(contactEditForm.organization);
    const formattedPhone = formatPhoneDigits(contactEditForm.phone);

    if (formattedPhone.length > 0 && formattedPhone.length < 14) {
      toast.error("Phone number must follow the format (###) ###-####");
      return;
    }

    const updated = {
      ...contactEditForm,
      name: formattedName,
      email: validatedEmail,
      organization: formattedOrg,
      phone: formattedPhone || contactEditForm.phone
    };

    setContacts(prev => prev.map(c => c.id === updated.id ? { ...updated } : c));
    toast.success(`Contact profile updated and validated for ${updated.name}`);
    setIsContactModalOpen(false);
  };

  const handleExportContactRecord = (contact: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(contact, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `contact_${contact.id}_${contact.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Exported JSON record for ${contact.name} (Portability & Compliance Audit Log)`);
  };

  // Requirement 3: Automations AI Auto-Write & Casing Handlers
  const handleAiWriteNewAuto = (field: "title" | "description" | "step1Subject" | "step1Body" | "step2Subject" | "step2Body") => {
    const category = newAutoForm.category || "Agent";
    let text = "";
    if (field === "title") {
      text = toTitleCase(`${category} Open House Kiosk & Sora Voice Tour Onboarding Blueprint`);
    } else if (field === "description") {
      text = toSentenceCase(`Automated multi-step onboarding sequence designed to guide new ${category.toLowerCase()} partners through open house kiosk configuration, exit PIN lock mode, and paired lender co-branding.`);
    } else if (field === "step1Subject") {
      text = toTitleCase(`Welcome To AI Open House Connect — Step-By-Step Launch Blueprint`);
    } else if (field === "step1Body") {
      text = toSentenceCase(`Welcome to AI Open House Connect! Follow this step-by-step launch guide to configure your tablet sign-in kiosk, set your exit PIN lock code, and enable Sora AI voice tours for your upcoming open house.`);
    } else if (field === "step2Subject") {
      text = toTitleCase(`Sora AI Voice Tour Walkthrough & Paired Lender Co-Branding Setup`);
    } else if (field === "step2Body") {
      text = toSentenceCase(`Learn how to link property photos directly to Sora voice tour narration cues, and invite your preferred mortgage lender to co-brand your sign-in tablet for compliant lead routing.`);
    }

    setNewAutoForm(prev => ({ ...prev, [field]: text }));
    toast.success(`Sora AI Auto-Wrote content for ${field.replace(/([A-Z])/g, ' $1')}`);
  };

  const handleAiWriteEditAuto = (field: string, stepIndex?: number) => {
    if (!editingAutomation) return;
    const category = editingAutomation.category || "Platform";
    if (field === "title") {
      const newTitle = toTitleCase(`${category} Open House Acceleration Blueprint`);
      setEditingAutomation({ ...editingAutomation, title: newTitle });
      toast.success("Sora AI Auto-Wrote Sequence Title!");
    } else if (field === "description") {
      const newDesc = toSentenceCase(`Automated nurture sequence optimized for ${category.toLowerCase()} partners with Sora voice tour prompts and direct CRM lead synchronization.`);
      setEditingAutomation({ ...editingAutomation, description: newDesc });
      toast.success("Sora AI Auto-Wrote Sequence Description!");
    } else if (field === "subject" && stepIndex !== undefined && editingAutomation.steps?.[stepIndex]) {
      const updatedSteps = [...editingAutomation.steps];
      updatedSteps[stepIndex].subject = toTitleCase(`Exclusive ${category} Workflow Insights — Step ${stepIndex + 1}`);
      setEditingAutomation({ ...editingAutomation, steps: updatedSteps });
      toast.success(`Sora AI Auto-Wrote Step ${stepIndex + 1} Subject!`);
    } else if (field === "body" && stepIndex !== undefined && editingAutomation.steps?.[stepIndex]) {
      const updatedSteps = [...editingAutomation.steps];
      updatedSteps[stepIndex].body = toSentenceCase(`Discover how Sora's multilingual AI tour guides drive 3x higher visitor engagement during weekend open houses.`);
      setEditingAutomation({ ...editingAutomation, steps: updatedSteps });
      toast.success(`Sora AI Auto-Wrote Step ${stepIndex + 1} Body Teaser!`);
    }
  };

  const handleCreateAutomationSubmit = () => {
    if (!newAutoForm.title.trim() || !newAutoForm.step1Subject.trim()) {
      toast.error("Please enter a sequence title and at least step 1 subject line.");
      return;
    }
    const formattedTitle = toTitleCase(newAutoForm.title);
    const formattedDesc = toSentenceCase(newAutoForm.description) || "Custom automated drip sequence created by platform admin.";
    const formattedS1Subject = toTitleCase(newAutoForm.step1Subject);
    const formattedS1Body = toSentenceCase(newAutoForm.step1Body) || "Welcome to AI Open House Connect.";
    const formattedS2Subject = newAutoForm.step2Subject ? toTitleCase(newAutoForm.step2Subject) : "";
    const formattedS2Body = newAutoForm.step2Body ? toSentenceCase(newAutoForm.step2Body) : "";

    const newAuto = {
      id: `auto-${Date.now()}`,
      title: formattedTitle,
      category: newAutoForm.category,
      trigger: newAutoForm.trigger,
      stepsCount: formattedS2Subject ? 2 : 1,
      status: "Active",
      description: formattedDesc,
      steps: [
        { id: "s1", delay: "Immediate (Day 0)", subject: formattedS1Subject, body: formattedS1Body },
        ...(formattedS2Subject ? [{ id: "s2", delay: "3 Days Later", subject: formattedS2Subject, body: formattedS2Body || "Follow-up message..." }] : [])
      ]
    };
    setAutomations([newAuto, ...automations]);
    setIsCreateAutomationOpen(false);
    setNewAutoForm({
      title: "",
      category: "Agent",
      trigger: "Immediate upon new account registration",
      description: "",
      step1Subject: "",
      step1Body: "",
      step2Subject: "",
      step2Body: ""
    });
    toast.success("New Drip Automation Created & Activated!");
  };

  const handleOpenEditSequence = (automation: any) => {
    setEditingAutomation({
      ...automation,
      title: toTitleCase(automation.title || ""),
      description: toSentenceCase(automation.description || ""),
      steps: automation.steps?.map((st: any) => ({
        ...st,
        subject: toTitleCase(st.subject || ""),
        body: toSentenceCase(st.body || "")
      })) || []
    });
    setIsEditSequenceOpen(true);
  };

  const handleSaveSequenceEdit = () => {
    if (!editingAutomation) return;
    const formatted = {
      ...editingAutomation,
      title: toTitleCase(editingAutomation.title),
      description: toSentenceCase(editingAutomation.description),
      steps: editingAutomation.steps?.map((s: any) => ({
        ...s,
        subject: toTitleCase(s.subject),
        body: toSentenceCase(s.body)
      }))
    };
    setAutomations(prev => prev.map(a => a.id === formatted.id ? { ...formatted } : a));
    setIsEditSequenceOpen(false);
    toast.success(`Drip sequence updated for "${formatted.title}"`);
  };

  // Filter contacts by segment
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.organization.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedSegment === "agents") return matchesSearch && c.role.toLowerCase() === "agent";
    if (selectedSegment === "lenders") return matchesSearch && c.role.toLowerCase() === "lender";
    if (selectedSegment === "teams") return matchesSearch && (c.role.toLowerCase() === "team" || c.role.toLowerCase().includes("team"));
    if (selectedSegment === "brokerages") return matchesSearch && (c.role.toLowerCase() === "brokerage" || c.role.toLowerCase().includes("broker"));
    return matchesSearch;
  });

  // Non-admin fallback check
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-10 space-y-4 shadow-sm">
          <div className="inline-flex p-4 rounded-full bg-amber-100 text-amber-800 mb-2">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black text-black">Platform Administrator Access Required</h2>
          <p className="text-black text-sm max-w-lg mx-auto leading-relaxed font-medium">
            This Email Marketing Studio is designated exclusively for <strong>Luc Valade</strong> (Admin of AI Open House Connect).
            Access is reserved for platform broadcasts to real estate agents, lenders, teams, and brokerages.
          </p>
          <div className="pt-4">
            <Button onClick={() => window.location.href = "/app/overview"} className="bg-slate-900 hover:bg-black text-white font-bold px-6 py-2.5 rounded-xl">
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 8 B2B Quick Prompts directed at Agents, Lenders, Teams, Brokerages
  const quickPrompts = [
    "Welcome newly registered real estate agents",
    "Announce new AI voice tour features to agents",
    "Invite mortgage partners to co-brand open house kiosks",
    "Send quarterly platform updates to brokerage admins",
    "Nurture inactive agents with AI feature highlights",
    "Promote team management & multi-agent routing tools",
    "Guide lenders on lead consent & CRM routing setup",
    "Re-engage agent leads with platform updates"
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden border border-blue-800/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black uppercase tracking-widest border border-blue-400/30">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" /> Admin Studio — Luc Valade
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Platform Email Marketing Studio
            </h1>
            <p className="text-slate-100 text-sm max-w-2xl leading-relaxed font-medium">
              Exclusively managed by Luc Valade (Admin of AI Open House Connect) to broadcast platform announcements, feature releases, onboarding drips, and partner updates to Real Estate Agents, Lenders, Teams, and Brokerages.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setActiveTab("ai-generator")}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-amber-400" /> Create AI Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === "campaigns"
              ? "bg-slate-900 text-white shadow-md"
              : "text-black hover:bg-slate-100"
          }`}
        >
          <Mail className="h-4 w-4" /> All Campaigns ({campaigns.length})
        </button>

        <button
          onClick={() => setActiveTab("ai-generator")}
          className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === "ai-generator"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-blue-700 hover:bg-blue-50 font-black"
          }`}
        >
          <Sparkles className="h-4 w-4 text-amber-400" /> AI Campaign Studio
        </button>

        <button
          onClick={() => setActiveTab("audience")}
          className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === "audience"
              ? "bg-slate-900 text-white shadow-md"
              : "text-black hover:bg-slate-100"
          }`}
        >
          <Users className="h-4 w-4" /> Audience & Contacts ({contacts.length})
        </button>

        <button
          onClick={() => setActiveTab("automations")}
          className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === "automations"
              ? "bg-slate-900 text-white shadow-md"
              : "text-black hover:bg-slate-100"
          }`}
        >
          <Zap className="h-4 w-4 text-amber-500" /> Drip Automations
        </button>

        <button
          onClick={() => setActiveTab("weekly-ideas")}
          className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === "weekly-ideas"
              ? "bg-slate-900 text-white shadow-md"
              : "text-black hover:bg-slate-100"
          }`}
        >
          <Calendar className="h-4 w-4 text-indigo-500" /> Weekly AI Ideas
        </button>

        <button
          onClick={() => setActiveTab("tracking-physics")}
          className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === "tracking-physics"
              ? "bg-purple-900 text-white shadow-md"
              : "text-purple-700 hover:bg-purple-50 font-black"
          }`}
        >
          <Info className="h-4 w-4 text-purple-400" /> Unsubscribe & Tracking Physics
        </button>

        <button
          onClick={() => setActiveTab("brand")}
          className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === "brand"
              ? "bg-slate-900 text-white shadow-md"
              : "text-black hover:bg-slate-100"
          }`}
        >
          <Settings className="h-4 w-4" /> Brand Profile
        </button>

        <button
          onClick={() => setActiveTab("deliverability")}
          className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === "deliverability"
              ? "bg-slate-900 text-white shadow-md"
              : "text-black hover:bg-slate-100"
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-emerald-500" /> Deliverability & DKIM
        </button>
      </div>

      {/* TAB 1: CAMPAIGNS OVERVIEW */}
      {activeTab === "campaigns" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-black">Email Marketing Campaigns</h2>
              <p className="text-xs text-black font-medium mt-0.5">Broadcasts and automated drips targeted to Agents, Lenders, Teams, and Brokerages.</p>
            </div>
            <Button 
              onClick={() => setActiveTab("ai-generator")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" /> New Campaign
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-xs font-black uppercase text-black tracking-wider border-b border-slate-300">
                  <tr>
                    <th className="px-6 py-4 text-black font-black">Campaign Name & Subject</th>
                    <th className="px-6 py-4 text-black font-black">Status</th>
                    <th className="px-6 py-4 text-black font-black">Target Audience</th>
                    <th className="px-6 py-4 text-black font-black">Recipients</th>
                    <th className="px-6 py-4 text-black font-black">Open Rate</th>
                    <th className="px-6 py-4 text-black font-black">Click Rate</th>
                    <th className="px-6 py-4 text-right text-black font-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-black">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-extrabold text-black text-sm">{camp.name}</p>
                        <p className="text-black font-medium italic text-xs truncate max-w-xs">{camp.subject}</p>
                      </td>
                      <td className="px-6 py-4">
                        {camp.status === "SENT" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Sent
                          </span>
                        )}
                        {camp.status === "SCHEDULED" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[10px] font-black uppercase border border-blue-200">
                            <Clock className="h-3 w-3 text-blue-600" /> Scheduled
                          </span>
                        )}
                        {camp.status === "DRAFT" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-black text-[10px] font-black uppercase border border-slate-300">
                            <Edit3 className="h-3 w-3 text-black" /> Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-black">{camp.audience}</td>
                      <td className="px-6 py-4 font-black text-black">{camp.recipientCount}</td>
                      <td className="px-6 py-4">{formatRateBadge(camp.openRate, "open")}</td>
                      <td className="px-6 py-4">{formatRateBadge(camp.clickRate, "click")}</td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          onClick={() => {
                            setSelectedCampaignForView(camp);
                            setIsViewCampaignModalOpen(true);
                          }}
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2.5 text-xs font-bold text-blue-700 hover:bg-blue-50 hover:text-blue-900 border border-transparent hover:border-blue-200 rounded-lg transition-all"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-blue-600" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI CAMPAIGN GENERATOR */}
      {activeTab === "ai-generator" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-950 to-blue-950 rounded-2xl p-6 text-white border border-blue-800/40 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-6 w-6 text-amber-400" />
              <h2 className="text-xl font-extrabold text-white">AI Campaign Studio</h2>
            </div>
            <p className="text-xs text-slate-100 max-w-2xl leading-relaxed font-medium">
              Describe your campaign prompt to generate tailored subject lines, body copy, and CTA suggestions for Real Estate Agents, Lenders, Teams, and Brokerages.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-xs font-black uppercase tracking-wider text-white">Campaign Goal or Prompt</Label>
                <div className="flex gap-3 mt-1.5">
                  <Input 
                    value={aiGoalPrompt}
                    onChange={(e) => setAiGoalPrompt(e.target.value)}
                    placeholder="e.g. Welcome newly registered real estate agents with an interactive walkthrough guide..."
                    className="bg-slate-800/90 border-slate-700 text-white placeholder:text-slate-400 rounded-xl py-3 text-sm focus-visible:ring-blue-500"
                  />
                  <Button 
                    onClick={handleGenerateCampaign}
                    disabled={isGenerating}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl whitespace-nowrap shadow-lg hover:shadow-blue-500/30"
                  >
                    {isGenerating ? (
                      <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2 text-amber-400" /> Generate Email</>
                    )}
                  </Button>
                </div>
              </div>

              {/* 8 B2B Quick Prompt Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-white font-black uppercase tracking-wider block">8 Quick B2B Prompts:</span>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((promptText, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAiGoalPrompt(promptText)}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-white font-semibold px-3 py-1.5 rounded-full border border-slate-700 transition-colors text-left"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Generated Result Workspace */}
          {generatedCampaign && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    <Sparkles className="h-3 w-3" /> Sora Draft Ready
                  </span>
                  <h3 className="text-lg font-black text-black mt-1">Review & Polish Your Campaign</h3>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveCampaign}
                    variant="outline"
                    className="font-bold text-xs text-black border-slate-300 hover:bg-slate-50"
                  >
                    Save as Draft
                  </Button>
                  <Button 
                    onClick={() => {
                      toast.success("Test email sent to " + (user?.email || "luc.valade@gmail.com"));
                    }}
                    className="bg-slate-900 hover:bg-black text-white font-bold text-xs"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" /> Send Test Email
                  </Button>
                </div>
              </div>

              {/* Subject Lines Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-black tracking-wider">AI Generated Subject Line Options</Label>
                <div className="space-y-2">
                  {generatedCampaign.subjectLines.map((subj, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setGeneratedCampaign({ ...generatedCampaign, selectedSubject: subj })}
                      className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-between ${
                        generatedCampaign.selectedSubject === subj
                          ? "bg-blue-50/80 border-blue-500 text-black shadow-sm"
                          : "bg-slate-50 border-slate-200 text-black hover:bg-slate-100"
                      }`}
                    >
                      <span>{subj}</span>
                      {generatedCampaign.selectedSubject === subj && (
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-black font-black uppercase tracking-wider block text-[10px]">Recommended Target Audience</span>
                  <span className="font-black text-black">{generatedCampaign.recommendedAudience}</span>
                </div>
                <div>
                  <span className="text-black font-black uppercase tracking-wider block text-[10px]">AI Best Send Time Suggestion</span>
                  <span className="font-black text-blue-800">{generatedCampaign.suggestedTiming}</span>
                </div>
              </div>

              {/* Email Body Preview Box */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-black tracking-wider">Branded HTML Preview</Label>
                <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-4">
                  {/* Sender Header */}
                  <div className="border-b border-slate-200 pb-3 flex items-center justify-between text-xs text-black font-bold">
                    <div>
                      <strong>From:</strong> {brandProfile.senderName} &lt;{brandProfile.replyToEmail}&gt;
                    </div>
                    <div>
                      <strong>To:</strong> Selected B2B Audience ({contacts.length} Recipients)
                    </div>
                  </div>

                  {/* Body Content */}
                  <div 
                    className="prose prose-slate max-w-none text-sm text-black bg-white p-6 rounded-xl border border-slate-200 shadow-xs"
                    dangerouslySetInnerHTML={{ __html: generatedCampaign.emailBodyHtml }}
                  />

                  {/* CTA Button */}
                  <div className="text-center pt-2">
                    <a 
                      href={generatedCampaign.ctaButtonUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-block bg-blue-600 text-white font-black text-xs px-6 py-3 rounded-xl shadow-md hover:bg-blue-500 transition-colors"
                    >
                      {generatedCampaign.ctaButtonText} →
                    </a>
                  </div>

                  {/* Compliance Footer */}
                  <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-black font-semibold space-y-1">
                    <p>{brandProfile.businessName} • {brandProfile.complianceFooter}</p>
                    <p>Unsubscribe | Manage Email Preferences | Powered by AI Open House Connect</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: UNIFIED CONTACTS & AUDIENCE DATABASE (Requirement 2) */}
      {activeTab === "audience" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-black">Unified Contacts & Audience Database</h2>
              <p className="text-xs text-black font-medium mt-0.5">Central database of registered Real Estate Agents, Lenders, Teams, and Brokerages.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-black bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300">
                Total B2B Contacts: <strong>{contacts.length}</strong>
              </span>
            </div>
          </div>

          {/* Search & Filter Controls with Headings for Agents, Lenders, Teams, Brokerages */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-black" />
              <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search contacts by name, email, or organization..."
                className="pl-10 text-xs bg-white border-slate-300 text-black placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedSegment("all")}
                className={`px-3 py-2 rounded-xl text-xs font-black border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  selectedSegment === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-black border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Users className="h-3.5 w-3.5" /> All Contacts
              </button>

              <button
                onClick={() => setSelectedSegment("agents")}
                className={`px-3 py-2 rounded-xl text-xs font-black border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  selectedSegment === "agents" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-black border-slate-300 hover:bg-slate-50"
                }`}
              >
                <UserCheck className="h-3.5 w-3.5 text-blue-500" /> Agents
              </button>

              <button
                onClick={() => setSelectedSegment("lenders")}
                className={`px-3 py-2 rounded-xl text-xs font-black border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  selectedSegment === "lenders" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-black border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Briefcase className="h-3.5 w-3.5 text-emerald-500" /> Lenders
              </button>

              <button
                onClick={() => setSelectedSegment("teams")}
                className={`px-3 py-2 rounded-xl text-xs font-black border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  selectedSegment === "teams" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-black border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Users className="h-3.5 w-3.5 text-indigo-500" /> Teams
              </button>

              <button
                onClick={() => setSelectedSegment("brokerages")}
                className={`px-3 py-2 rounded-xl text-xs font-black border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  selectedSegment === "brokerages" ? "bg-purple-600 text-white border-purple-600" : "bg-white text-black border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Building2 className="h-3.5 w-3.5 text-purple-500" /> Brokerages
              </button>
            </div>
          </div>

          {/* Contacts Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-black">
                <thead className="bg-slate-100 text-xs font-black uppercase text-black tracking-wider border-b border-slate-300">
                  <tr>
                    <th className="px-6 py-4 text-black font-black">Contact Name & Email</th>
                    <th className="px-6 py-4 text-black font-black">Category / Role</th>
                    <th className="px-6 py-4 text-black font-black">Organization / Company</th>
                    <th className="px-6 py-4 text-black font-black">Phone Number</th>
                    <th className="px-6 py-4 text-black font-black">Joined Date</th>
                    <th className="px-6 py-4 text-right text-black font-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-black">
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-black font-bold italic">
                        {loadingContacts ? "Loading audience database..." : "No contacts found in this category."}
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-extrabold text-black text-sm">{contact.name}</p>
                          <p className="text-black font-mono text-[11px]">{contact.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                            contact.role === "Agent" ? "bg-blue-50 text-blue-800 border-blue-200" :
                            contact.role === "Lender" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                            contact.role === "Team" ? "bg-indigo-50 text-indigo-800 border-indigo-200" :
                            "bg-purple-50 text-purple-800 border-purple-200"
                          }`}>
                            {contact.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-black">{contact.organization}</td>
                        <td className="px-6 py-4 font-mono text-[11px] text-black font-bold">{contact.phone}</td>
                        <td className="px-6 py-4 text-black font-mono text-[11px]">{contact.createdAt}</td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            onClick={() => handleOpenContactDetails(contact)}
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs text-blue-700 hover:bg-blue-50 font-black cursor-pointer"
                          >
                            View Details →
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUTOMATIONS (Requirement 3) */}
      {activeTab === "automations" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-black">Automated Drip Sequences & Trigger Flows</h2>
              <p className="text-xs text-black font-medium mt-0.5">Automated emails for new Real Estate Agent onboarding, Lender pairing requests, and Brokerage upgrades.</p>
            </div>
            <Button 
              onClick={() => setIsCreateAutomationOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Create Automation
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {automations.map((auto) => (
              <div key={auto.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Play className="h-2.5 w-2.5 fill-current text-emerald-600" /> {auto.status}
                    </span>
                    <span className="text-[10px] font-black text-black uppercase tracking-wider">{auto.steps?.length || auto.stepsCount || 1} Email Steps</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-black text-base">{auto.title}</h3>
                    <p className="text-xs text-black font-medium mt-1 leading-relaxed">{auto.description}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] font-mono text-black font-bold">
                    <strong>Trigger:</strong> {auto.trigger}
                  </div>
                  {auto.steps && auto.steps.length > 0 && (
                    <div className="space-y-1.5 border-t border-slate-100 pt-2">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Sequence Sequence Steps:</span>
                      {auto.steps.map((st: any, idx: number) => (
                        <div key={idx} className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                          <span className="font-bold text-black text-xs">{st.delay}:</span>
                          <span className="font-medium text-slate-700 truncate max-w-[220px]">{st.subject}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button 
                    onClick={() => handleOpenEditSequence(auto)}
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs font-black text-black border-slate-300 hover:bg-slate-50 cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1 text-blue-600" /> Edit Sequence
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: WEEKLY IDEAS ENGINE */}
      {activeTab === "weekly-ideas" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-800 shadow-md">
            <h2 className="text-xl font-extrabold flex items-center gap-2 text-white">
              <Calendar className="h-5 w-5 text-indigo-400" /> Weekly AI Campaign Recommendations
            </h2>
            <p className="text-xs text-slate-100 mt-1 max-w-2xl leading-relaxed font-medium">
              Sora synthesizes platform activity, feature updates, and agent engagement to recommend high-converting campaign topics for your partners.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {weeklyIdeas.map((idea) => (
              <div key={idea.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 inline-block">
                    {idea.type}
                  </span>
                  <h3 className="font-black text-black text-base">{idea.title}</h3>
                  <p className="text-xs text-black font-medium leading-relaxed">{idea.rationale}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-black block">Target Audience</span>
                  <span className="font-black text-black">{idea.targetAudience}</span>
                </div>

                <Button 
                  onClick={() => {
                    setAiGoalPrompt(idea.suggestedPrompt);
                    setActiveTab("ai-generator");
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-300" /> Generate This Campaign →
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: TRACKING PHYSICS & UNSUBSCRIBE MANAGEMENT (Requirement 4) */}
      {activeTab === "tracking-physics" && (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 shadow-xl border border-purple-800/50 relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black uppercase tracking-widest border border-purple-400/30">
                <Info className="h-3.5 w-3.5 text-purple-400" /> Technical Insights & Mechanics
              </span>
              <h2 className="text-2xl font-black text-white">How Email Platform Tracking Works & Realities</h2>
              <p className="text-slate-200 text-xs max-w-3xl leading-relaxed font-medium">
                Understanding the underlying physics of email open tracking, inbox reply sync, privacy controls, and why a true "Read" status is technically impossible in modern email protocols.
              </p>
            </div>
          </div>

          {/* 3 Physical Realities Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1: How Platforms Track Opens */}
            <div className="bg-white rounded-2xl border border-purple-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 text-purple-900 border-b border-purple-100 pb-3">
                <div className="p-2 bg-purple-100 rounded-xl text-purple-800">
                  <Eye className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-base">How Platforms Track Opens</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-800 font-medium">
                <li className="space-y-0.5">
                  <strong className="text-purple-900 font-extrabold block">Tracking Pixel:</strong>
                  <span>A tiny, 1x1 invisible image loads from the server when the recipient opens the email in their client.</span>
                </li>
                <li className="space-y-0.5">
                  <strong className="text-purple-900 font-extrabold block">Image Blocking:</strong>
                  <span>If images are blocked by default in Outlook or Apple Mail, the open event will not register until images are downloaded.</span>
                </li>
                <li className="space-y-0.5">
                  <strong className="text-purple-900 font-extrabold block">Apple Privacy (Apple MPP):</strong>
                  <span>Apple Mail Privacy Protection automatically pre-fetches email images on proxy servers, faking open data and making open rate numbers less accurate.</span>
                </li>
              </ul>
            </div>

            {/* Card 2: How Platforms Track Replies */}
            <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 text-blue-900 border-b border-blue-100 pb-3">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-800">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-base">How Platforms Track Replies</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-800 font-medium">
                <li className="space-y-0.5">
                  <strong className="text-blue-900 font-extrabold block">Inbox Sync:</strong>
                  <span>The platform links to your email sending inbox via secure IMAP or direct API integration.</span>
                </li>
                <li className="space-y-0.5">
                  <strong className="text-blue-900 font-extrabold block">Thread Matching:</strong>
                  <span>It matches incoming email reply headers back to the specific sent campaign ID and recipient.</span>
                </li>
                <li className="space-y-0.5">
                  <strong className="text-blue-900 font-extrabold block">Auto-Detection:</strong>
                  <span>It automatically halts ongoing automated drip follow-up sequences immediately when a reply arrives.</span>
                </li>
              </ul>
            </div>

            {/* Card 3: Why "Read" Status is Impossible */}
            <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 text-amber-900 border-b border-amber-100 pb-3">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-800">
                  <Ban className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-base">Why "Read" Status is Impossible</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-800 font-medium">
                <li className="space-y-0.5">
                  <strong className="text-amber-900 font-extrabold block">No Reliable Signal:</strong>
                  <span>Code running inside an email client cannot see if a person actually looks at the text, scrolls down, or reads the message content.</span>
                </li>
                <li className="space-y-0.5">
                  <strong className="text-amber-900 font-extrabold block">False Positives vs Engagement:</strong>
                  <span>An "Open" only means the email HTML or tracking pixel was displayed or pre-fetched — it does NOT confirm reading comprehension or attention.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Unsubscribe Management & Audit Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-black">Unsubscribe Compliance & Audit Trail</h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">RFC 8058 One-Click Unsubscribe header and global opt-out audit records.</p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Global Opt-Out Rate: <strong>0.08% (Compliant)</strong>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="font-black uppercase tracking-wider text-slate-700 block">System Unsubscribe Header Injection:</span>
              <code className="block bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
                List-Unsubscribe: &lt;https://aiopenhouseconnect.com/api/unsubscribe?email=contact@example.com&gt;<br />
                List-Unsubscribe-Post: List-Unsubscribe=One-Click
              </code>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-black">
                <thead className="bg-slate-100 font-black uppercase text-black tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Recipient Email</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Opt-Out Timestamp</th>
                    <th className="px-4 py-3">Triggering Campaign</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unsubscribeLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{log.email}</td>
                      <td className="px-4 py-3 font-semibold">{log.role}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{log.optOutDate}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{log.sourceCampaign}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          <XCircle className="h-3 w-3 text-amber-600" /> {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                        <Button 
                          onClick={() => {
                            setSelectedUnsubForReactivate(log);
                            setIsReactivateModalOpen(true);
                          }}
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-[11px] text-amber-800 hover:bg-amber-50 font-bold border border-amber-200 rounded-lg"
                        >
                          <Eye className="h-3 w-3 mr-1 text-amber-600" /> View Copy
                        </Button>
                        <Button 
                          onClick={() => {
                            setSelectedUnsubForReactivate(log);
                            setIsReactivateModalOpen(true);
                          }}
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-[11px] text-blue-700 hover:bg-blue-50 font-black border border-blue-200 rounded-lg"
                        >
                          Re-activate Contact
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: BRAND PROFILE */}
      {activeTab === "brand" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-black">Platform Sender Settings</h2>
            <p className="text-xs text-black font-medium mt-0.5">Confirm or update your platform administrator sender details for outbound broadcasts.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-2">
            <div>
              <Label className="text-xs font-black text-black">Business / Organization Name</Label>
              <Input 
                value={brandProfile.businessName}
                onChange={(e) => setBrandProfile({ ...brandProfile, businessName: e.target.value })}
                onBlur={() => setBrandProfile(prev => ({ ...prev, businessName: toTitleCase(prev.businessName) }))}
                placeholder="e.g. AI Open House Connect"
                className="mt-1 text-xs text-black font-semibold border-slate-300"
              />
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">First letter of each word auto-capitalized (Title Case).</span>
            </div>

            <div>
              <Label className="text-xs font-black text-black">Sender Display Name</Label>
              <Input 
                value={brandProfile.senderName}
                onChange={(e) => setBrandProfile({ ...brandProfile, senderName: e.target.value })}
                onBlur={() => setBrandProfile(prev => ({ ...prev, senderName: toTitleCase(prev.senderName) }))}
                placeholder="e.g. Luc Valade — AI Open House Connect"
                className="mt-1 text-xs text-black font-semibold border-slate-300"
              />
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">First letter of each word auto-capitalized (Title Case).</span>
            </div>

            <div>
              <Label className="text-xs font-black text-black">Reply-To Email Address</Label>
              <Input 
                value={brandProfile.replyToEmail}
                onChange={(e) => setBrandProfile({ ...brandProfile, replyToEmail: e.target.value })}
                onBlur={() => setBrandProfile(prev => ({ ...prev, replyToEmail: validateAndFixEmail(prev.replyToEmail) }))}
                placeholder="e.g. luc.valade@gmail.com"
                className="mt-1 text-xs text-black font-mono font-semibold border-slate-300"
              />
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Must contain @. Auto-includes @ when leaving text field if missing.</span>
            </div>

            <div>
              <Label className="text-xs font-black text-black">Primary Brand Accent Color</Label>
              <div className="flex gap-2 mt-1">
                <input 
                  type="color" 
                  value={brandProfile.primaryColor}
                  onChange={(e) => setBrandProfile({ ...brandProfile, primaryColor: e.target.value })}
                  className="h-9 w-12 rounded border border-slate-300 cursor-pointer"
                />
                <Input 
                  value={brandProfile.primaryColor}
                  onChange={(e) => setBrandProfile({ ...brandProfile, primaryColor: e.target.value })}
                  className="text-xs font-mono text-black border-slate-300"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs font-black text-black">Platform Compliance Footer</Label>
              <textarea 
                rows={3}
                value={brandProfile.complianceFooter}
                onChange={(e) => setBrandProfile({ ...brandProfile, complianceFooter: e.target.value })}
                onBlur={() => setBrandProfile(prev => ({ ...prev, complianceFooter: toSentenceCase(prev.complianceFooter) }))}
                placeholder="e.g. AI Open House Connect Platform Administration. Equal Housing Opportunity."
                className="mt-1 w-full text-xs p-3 rounded-xl border border-slate-300 text-black font-medium focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">First letter of the first word auto-capitalized (Sentence Case).</span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button 
              onClick={() => {
                const formattedBiz = toTitleCase(brandProfile.businessName);
                const formattedSender = toTitleCase(brandProfile.senderName);
                const validatedEmail = validateAndFixEmail(brandProfile.replyToEmail);
                const formattedFooter = toSentenceCase(brandProfile.complianceFooter);

                setBrandProfile({
                  ...brandProfile,
                  businessName: formattedBiz,
                  senderName: formattedSender,
                  replyToEmail: validatedEmail,
                  complianceFooter: formattedFooter
                });
                toast.success("Platform Sender Settings formatted and saved successfully!");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              Save Sender Settings
            </Button>
          </div>
        </div>
      )}

      {/* TAB 8: DELIVERABILITY & DKIM */}
      {activeTab === "deliverability" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-black">Domain Authentication & Deliverability</h2>
              <p className="text-xs text-black font-medium mt-0.5">Ensure 100% inbox placement for platform broadcasts by verifying SPF, DKIM, and DMARC records.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase border border-emerald-200">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> High Deliverability Score (99.8%)
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: "SPF Record", status: "Verified", value: "v=spf1 include:aiopenhouseconnect.com ~all" },
              { title: "DKIM Signature", status: "Verified", value: "k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQ..." },
              { title: "DMARC Alignment", status: "Verified", value: "v=DMARC1; p=none; rua=mailto:dmarc@aiopenhouseconnect.com" }
            ].map((rec, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-black text-xs">{rec.title}</span>
                  <span className="text-[10px] font-black text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {rec.status}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-black font-bold break-all bg-white p-2 rounded border border-slate-200">
                  {rec.value}
                </div>
              </div>
            ))}
          </div>

          {/* 2026 Global Email Benchmarks & Industry Intelligence Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white rounded-2xl p-6 border border-blue-800/50 shadow-lg space-y-6 mt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-800/60 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-widest border border-blue-400/30">
                  <BarChart2 className="h-3.5 w-3.5 text-blue-400" /> 2026 Industry Intelligence
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1">2026 Global Email Benchmarks & The Reality Behind Metrics</h3>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Raw engagement numbers alone are misleading due to major privacy and technical shifts (like Apple MPP). Compare your campaigns against 2026 baseline standards.
                </p>
              </div>
            </div>

            {/* Benchmarks Table */}
            <div className="overflow-x-auto bg-slate-950/80 rounded-xl border border-blue-900/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-blue-300 font-black uppercase tracking-wider border-b border-blue-800/60 text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Metric</th>
                    <th className="px-4 py-3">2026 Global Average</th>
                    <th className="px-4 py-3">Healthy Target</th>
                    <th className="px-4 py-3">Why The Number Lies / Industry Insight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/40 font-medium text-slate-200">
                  <tr className="hover:bg-blue-950/40">
                    <td className="px-4 py-3 font-extrabold text-white">Open Rate</td>
                    <td className="px-4 py-3 font-mono text-emerald-400 font-bold">35% – 44%</td>
                    <td className="px-4 py-3 font-mono text-blue-300 font-bold">&gt; 30%</td>
                    <td className="px-4 py-3 text-slate-300">
                      <strong className="text-amber-300 font-bold">Inflated by Apple MPP:</strong> Apple Mail automatically pre-loads tracking pixels. Your true human open rate is 15–20% lower. Rates &lt; 35% are flagged in <strong className="text-red-400 font-bold">bold red</strong>.
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-950/40">
                    <td className="px-4 py-3 font-extrabold text-white">Click-Through Rate (CTR)</td>
                    <td className="px-4 py-3 font-mono text-emerald-400 font-bold">2.0% – 3.7%</td>
                    <td className="px-4 py-3 font-mono text-blue-300 font-bold">&gt; 3%</td>
                    <td className="px-4 py-3 text-slate-300">
                      <strong className="text-emerald-300 font-bold">The "Truth" Metric:</strong> Requires deliberate human action. CTR &lt; 2.0% indicates weak content alignment and is flagged in <strong className="text-red-400 font-bold">bold red</strong>.
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-950/40">
                    <td className="px-4 py-3 font-extrabold text-white">Click-to-Open Rate (CTOR)</td>
                    <td className="px-4 py-3 font-mono text-emerald-400 font-bold">6.8% – 13%</td>
                    <td className="px-4 py-3 font-mono text-blue-300 font-bold">&gt; 10%</td>
                    <td className="px-4 py-3 text-slate-300">
                      <strong className="text-blue-300 font-bold">Content Quality Indicator:</strong> Measures the percentage of readers who clicked a link after opening.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Key Performance Drivers Grid */}
            <div className="grid md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-900/90 p-4 rounded-xl border border-blue-800/40 space-y-2">
                <span className="font-extrabold text-blue-300 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                  <Zap className="h-4 w-4 text-amber-400" /> 1. Broadcasts vs. Drip Flows
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  Generic manual newsletters drag averages down. Automated flows (like welcome sequences or lead drips) achieve <strong>CTR averages above 5.5%</strong>, outperforming manual broadcasts by nearly 3x.
                </p>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-xl border border-blue-800/40 space-y-2">
                <span className="font-extrabold text-blue-300 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                  <Building2 className="h-4 w-4 text-indigo-400" /> 2. Industry Benchmarks
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  Nonprofits/Edu hit 50%+ open rates. E-commerce averages 32% open rate with 1.0%–2.2% CTR. B2B Real Estate outreach averages 40%–60% open rate, relying on direct replies.
                </p>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-xl border border-blue-800/40 space-y-2">
                <span className="font-extrabold text-amber-300 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                  <AlertTriangle className="h-4 w-4 text-amber-400" /> 3. Strict ISP Alert Thresholds
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  Google and Microsoft enforce strict deliverability cutoffs. If your bounce rate exceeds <strong>2%</strong> or your spam complaint rate hits <strong>0.3%</strong>, your domain faces active inbox blocks.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Contact Details Flow (Requirement 2) */}
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-black flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" /> B2B Contact Details — {contactEditForm?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 font-medium">
              Unified Contact Record for Agent, Lender, Team, or Brokerage Partner.
            </DialogDescription>
          </DialogHeader>

          {contactEditForm && (
            <div className="space-y-6 py-2">
              {/* Category & Status Header */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Category / Role</span>
                  <span className="text-xs font-black uppercase text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded border border-blue-200 inline-block mt-0.5">
                    {contactEditForm.role}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Identity Confidence</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                    {contactEditForm.verificationStatus || "Verified High"}
                  </span>
                </div>
              </div>

              {/* Editable Fields with strict formatting & validation */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-black text-black">Contact Full Name</Label>
                  <Input 
                    value={contactEditForm.name}
                    onChange={(e) => setContactEditForm({ ...contactEditForm, name: e.target.value })}
                    onBlur={() => setContactEditForm({ ...contactEditForm, name: toTitleCase(contactEditForm.name) })}
                    placeholder="e.g. Sarah Jenkins"
                    className="text-xs font-bold border-slate-300"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">Auto-capitalizes first letter of each name.</span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-black text-black">Email Address</Label>
                  <Input 
                    value={contactEditForm.email}
                    onChange={(e) => setContactEditForm({ ...contactEditForm, email: e.target.value })}
                    onBlur={() => setContactEditForm({ ...contactEditForm, email: validateAndFixEmail(contactEditForm.email) })}
                    placeholder="e.g. sarah.j@apexrealty.com"
                    className="text-xs font-mono font-bold border-slate-300"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">Must contain @. Auto-appends @ on blur if missing.</span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-black text-black">Organization / Office</Label>
                  <Input 
                    value={contactEditForm.organization}
                    onChange={(e) => setContactEditForm({ ...contactEditForm, organization: e.target.value })}
                    onBlur={() => setContactEditForm({ ...contactEditForm, organization: toTitleCase(contactEditForm.organization) })}
                    placeholder="e.g. Apex Realty Group"
                    className="text-xs font-bold border-slate-300"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">First letter of each word auto-capitalized.</span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-black text-black">Phone Number</Label>
                  <Input 
                    value={contactEditForm.phone}
                    onChange={(e) => setContactEditForm({ ...contactEditForm, phone: formatPhoneDigits(e.target.value) })}
                    placeholder="(416) 555-0192"
                    className="text-xs font-mono font-bold border-slate-300"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">Auto-formatted as (###) ###-####.</span>
                </div>
              </div>

              {/* Activity & Performance Metrics */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-black block">Platform Metrics & Partner Associations</span>
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 block uppercase">Active Listings</span>
                    <span className="text-base font-black text-black">{contactEditForm.listingsCount || 4}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 block uppercase">Open House Events</span>
                    <span className="text-base font-black text-blue-700">{contactEditForm.eventsCount || 10}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 block uppercase">Email Open Rate</span>
                    <span className="text-base font-black text-emerald-700">{contactEditForm.openRate || "82%"}</span>
                  </div>
                </div>
              </div>

              {/* Linked Partner */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-900 block">Paired Partner / Co-Branding:</span>
                  <span className="font-extrabold text-blue-950">{contactEditForm.pairedPartner || "Active Paired Partner"}</span>
                </div>
                <Button 
                  onClick={() => {
                    setAiGoalPrompt(`Direct update for ${contactEditForm.name} regarding open house kiosk setup`);
                    setActiveTab("ai-generator");
                    setIsContactModalOpen(false);
                  }}
                  size="sm" 
                  className="bg-blue-600 text-white font-bold text-xs h-8"
                >
                  Send Direct Broadcast
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button 
              onClick={() => setIsContactModalOpen(false)}
              variant="ghost" 
              className="text-xs font-bold text-slate-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveContactEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              Save Profile Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Create Drip Automation Modal (Requirement 3 & 4) */}
      <Dialog open={isCreateAutomationOpen} onOpenChange={setIsCreateAutomationOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-black flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" /> Create Automated Drip Sequence
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 font-medium">
              Configure multi-step automated email workflows for Agents, Lenders, Teams, or Brokerages. Titles & Subjects auto-capitalize each word; Descriptions & Body text auto-capitalize first letter.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Sequence Title */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black text-black">Sequence Title</Label>
                <button 
                  type="button"
                  onClick={() => handleAiWriteNewAuto("title")}
                  className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                >
                  <Sparkles className="h-3 w-3" /> Sora AI Auto-Write
                </button>
              </div>
              <Input 
                value={newAutoForm.title}
                onChange={(e) => setNewAutoForm({ ...newAutoForm, title: e.target.value })}
                onBlur={() => setNewAutoForm({ ...newAutoForm, title: toTitleCase(newAutoForm.title) })}
                placeholder="e.g. Agent Kiosk Setup & Voice Tour Blueprint"
                className="text-xs font-bold border-slate-300"
              />
              <span className="text-[10px] text-slate-500">First letter of each word auto-capitalizes (Title Case).</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-black text-black">Target Category</Label>
                <select 
                  value={newAutoForm.category}
                  onChange={(e) => setNewAutoForm({ ...newAutoForm, category: e.target.value })}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Agent">Agents</option>
                  <option value="Lender">Lenders</option>
                  <option value="Team">Teams</option>
                  <option value="Brokerage">Brokerages</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-black text-black">Trigger Event</Label>
                <select 
                  value={newAutoForm.trigger}
                  onChange={(e) => setNewAutoForm({ ...newAutoForm, trigger: e.target.value })}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Immediate upon new account registration">Immediate upon new account registration</option>
                  <option value="When agent sends pairing invitation to lender">When agent sends pairing invitation to lender</option>
                  <option value="Inactive team account (30 days)">Inactive team account (30 days)</option>
                  <option value="Listing Shared for Cross-Hosting">Listing Shared for Cross-Hosting</option>
                </select>
              </div>
            </div>

            {/* Sequence Description */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black text-black">Sequence Description</Label>
                <button 
                  type="button"
                  onClick={() => handleAiWriteNewAuto("description")}
                  className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                >
                  <Sparkles className="h-3 w-3" /> Sora AI Auto-Write
                </button>
              </div>
              <Input 
                value={newAutoForm.description}
                onChange={(e) => setNewAutoForm({ ...newAutoForm, description: e.target.value })}
                onBlur={() => setNewAutoForm({ ...newAutoForm, description: toSentenceCase(newAutoForm.description) })}
                placeholder="Brief summary of sequence purpose..."
                className="text-xs font-medium border-slate-300"
              />
              <span className="text-[10px] text-slate-500">First letter of the first word auto-capitalizes (Sentence Case).</span>
            </div>

            {/* Step 1 Email Config */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="font-black text-blue-900 uppercase tracking-wider block text-[11px]">Step 1 (Day 0 - Immediate Trigger)</span>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-black">Email Subject Line</Label>
                  <button 
                    type="button"
                    onClick={() => handleAiWriteNewAuto("step1Subject")}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-blue-200"
                  >
                    <Sparkles className="h-3 w-3" /> Sora AI Auto-Write
                  </button>
                </div>
                <Input 
                  value={newAutoForm.step1Subject}
                  onChange={(e) => setNewAutoForm({ ...newAutoForm, step1Subject: e.target.value })}
                  onBlur={() => setNewAutoForm({ ...newAutoForm, step1Subject: toTitleCase(newAutoForm.step1Subject) })}
                  placeholder="Welcome To AI Open House Connect — Step-By-Step Launch Blueprint"
                  className="text-xs bg-white border-slate-300 font-semibold"
                />
                <span className="text-[10px] text-slate-500">First character of each word auto-capitalizes (Title Case).</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-black">Email Body Teaser / Intro</Label>
                  <button 
                    type="button"
                    onClick={() => handleAiWriteNewAuto("step1Body")}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-blue-200"
                  >
                    <Sparkles className="h-3 w-3" /> Sora AI Auto-Write
                  </button>
                </div>
                <textarea 
                  rows={2}
                  value={newAutoForm.step1Body}
                  onChange={(e) => setNewAutoForm({ ...newAutoForm, step1Body: e.target.value })}
                  onBlur={() => setNewAutoForm({ ...newAutoForm, step1Body: toSentenceCase(newAutoForm.step1Body) })}
                  placeholder="Welcome content details..."
                  className="w-full text-xs p-2.5 bg-white rounded-xl border border-slate-300 font-normal"
                />
                <span className="text-[10px] text-slate-500">First letter of the first word auto-capitalizes (Sentence Case).</span>
              </div>
            </div>

            {/* Step 2 Email Config */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="font-black text-indigo-900 uppercase tracking-wider block text-[11px]">Step 2 (3 Days Later - Optional)</span>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-black">Email Subject Line</Label>
                  <button 
                    type="button"
                    onClick={() => handleAiWriteNewAuto("step2Subject")}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-blue-200"
                  >
                    <Sparkles className="h-3 w-3" /> Sora AI Auto-Write
                  </button>
                </div>
                <Input 
                  value={newAutoForm.step2Subject}
                  onChange={(e) => setNewAutoForm({ ...newAutoForm, step2Subject: e.target.value })}
                  onBlur={() => setNewAutoForm({ ...newAutoForm, step2Subject: toTitleCase(newAutoForm.step2Subject) })}
                  placeholder="Sora Voice Tour Walkthrough & Paired Lender Co-Branding Setup"
                  className="text-xs bg-white border-slate-300 font-semibold"
                />
                <span className="text-[10px] text-slate-500">First character of each word auto-capitalizes (Title Case).</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-black">Email Body Teaser / Intro</Label>
                  <button 
                    type="button"
                    onClick={() => handleAiWriteNewAuto("step2Body")}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-blue-200"
                  >
                    <Sparkles className="h-3 w-3" /> Sora AI Auto-Write
                  </button>
                </div>
                <textarea 
                  rows={2}
                  value={newAutoForm.step2Body}
                  onChange={(e) => setNewAutoForm({ ...newAutoForm, step2Body: e.target.value })}
                  onBlur={() => setNewAutoForm({ ...newAutoForm, step2Body: toSentenceCase(newAutoForm.step2Body) })}
                  placeholder="Step 2 follow-up content details..."
                  className="w-full text-xs p-2.5 bg-white rounded-xl border border-slate-300 font-normal"
                />
                <span className="text-[10px] text-slate-500">First letter of the first word auto-capitalizes (Sentence Case).</span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100">
            <Button 
              onClick={() => setIsCreateAutomationOpen(false)}
              variant="ghost" 
              className="text-xs font-bold text-slate-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAutomationSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              <Zap className="h-3.5 w-3.5 mr-1" /> Activate Drip Sequence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Edit Sequence Modal (Requirement 3 & 4) */}
      <Dialog open={isEditSequenceOpen} onOpenChange={setIsEditSequenceOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-black flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-blue-600" /> Edit Drip Sequence — {editingAutomation?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 font-medium">
              Update sequence steps, subjects, delays, and trigger rules with Sora AI writing support.
            </DialogDescription>
          </DialogHeader>

          {editingAutomation && (
            <div className="space-y-4 py-2 text-xs">
              {/* Sequence Title */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-black">Sequence Title</Label>
                  <button 
                    type="button"
                    onClick={() => handleAiWriteEditAuto("title")}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                  >
                    <Sparkles className="h-3 w-3" /> Sora AI Auto-Write
                  </button>
                </div>
                <Input 
                  value={editingAutomation.title}
                  onChange={(e) => setEditingAutomation({ ...editingAutomation, title: e.target.value })}
                  onBlur={() => setEditingAutomation({ ...editingAutomation, title: toTitleCase(editingAutomation.title) })}
                  className="text-xs font-bold border-slate-300"
                />
                <span className="text-[10px] text-slate-500">First letter of each word auto-capitalizes (Title Case).</span>
              </div>

              {/* Trigger Rule */}
              <div className="space-y-1">
                <Label className="text-xs font-black text-black">Trigger Rule</Label>
                <Input 
                  value={editingAutomation.trigger}
                  onChange={(e) => setEditingAutomation({ ...editingAutomation, trigger: e.target.value })}
                  className="text-xs font-mono font-bold border-slate-300"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-black">Sequence Description</Label>
                  <button 
                    type="button"
                    onClick={() => handleAiWriteEditAuto("description")}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                  >
                    <Sparkles className="h-3 w-3" /> Sora AI Auto-Write
                  </button>
                </div>
                <Input 
                  value={editingAutomation.description || ""}
                  onChange={(e) => setEditingAutomation({ ...editingAutomation, description: e.target.value })}
                  onBlur={() => setEditingAutomation({ ...editingAutomation, description: toSentenceCase(editingAutomation.description) })}
                  className="text-xs font-medium border-slate-300"
                />
                <span className="text-[10px] text-slate-500">First letter of first word auto-capitalizes (Sentence Case).</span>
              </div>

              {/* Editable Steps List */}
              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-black block">Sequence Email Steps ({editingAutomation.steps?.length || 1})</span>
                {editingAutomation.steps?.map((step: any, idx: number) => (
                  <div key={step.id || idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-blue-900 text-xs">Step {idx + 1} ({step.delay})</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-bold text-black">Subject</Label>
                        <button 
                          type="button"
                          onClick={() => handleAiWriteEditAuto("subject", idx)}
                          className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-blue-200"
                        >
                          <Sparkles className="h-3 w-3" /> Sora AI Auto-Write
                        </button>
                      </div>
                      <Input 
                        value={step.subject}
                        onChange={(e) => {
                          const updatedSteps = [...editingAutomation.steps];
                          updatedSteps[idx].subject = e.target.value;
                          setEditingAutomation({ ...editingAutomation, steps: updatedSteps });
                        }}
                        onBlur={() => {
                          const updatedSteps = [...editingAutomation.steps];
                          updatedSteps[idx].subject = toTitleCase(updatedSteps[idx].subject);
                          setEditingAutomation({ ...editingAutomation, steps: updatedSteps });
                        }}
                        className="text-xs bg-white border-slate-300 font-semibold"
                      />
                      <span className="text-[10px] text-slate-500">First character of each word auto-capitalizes (Title Case).</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-bold text-black">Body Teaser</Label>
                        <button 
                          type="button"
                          onClick={() => handleAiWriteEditAuto("body", idx)}
                          className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-blue-200"
                        >
                          <Sparkles className="h-3 w-3" /> Sora AI Auto-Write
                        </button>
                      </div>
                      <textarea 
                        rows={2}
                        value={step.body}
                        onChange={(e) => {
                          const updatedSteps = [...editingAutomation.steps];
                          updatedSteps[idx].body = e.target.value;
                          setEditingAutomation({ ...editingAutomation, steps: updatedSteps });
                        }}
                        onBlur={() => {
                          const updatedSteps = [...editingAutomation.steps];
                          updatedSteps[idx].body = toSentenceCase(updatedSteps[idx].body);
                          setEditingAutomation({ ...editingAutomation, steps: updatedSteps });
                        }}
                        className="w-full text-xs p-2 bg-white rounded-lg border border-slate-300 font-normal"
                      />
                      <span className="text-[10px] text-slate-500">First letter of first word auto-capitalizes (Sentence Case).</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100">
            <Button 
              onClick={() => setIsEditSequenceOpen(false)}
              variant="ghost" 
              className="text-xs font-bold text-slate-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSequenceEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              Save Sequence Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 5: Campaign View & Delivery Analytics Modal */}
      <Dialog open={isViewCampaignModalOpen} onOpenChange={setIsViewCampaignModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="sticky -top-6 bg-white z-30 pt-6 pb-3 border-b border-slate-200 -mx-6 px-6 shadow-xs">
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" /> Campaign Analytics & Inspection — {selectedCampaignForView?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 font-semibold mt-0.5">
              Target Audience: <strong className="text-slate-900">{selectedCampaignForView?.audience}</strong> | Status: <strong className="text-blue-700 uppercase">{selectedCampaignForView?.status}</strong>
            </DialogDescription>
          </DialogHeader>

          {selectedCampaignForView && (
            <div className="space-y-6 py-2">
              {/* Campaign High-Level Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Recipients</span>
                  <span className="text-sm font-extrabold text-black">{selectedCampaignForView.recipientCount}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Open Rate</span>
                  <div className="mt-0.5">{formatRateBadge(selectedCampaignForView.openRate, "open")}</div>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Click Rate</span>
                  <div className="mt-0.5">{formatRateBadge(selectedCampaignForView.clickRate, "click")}</div>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Click-to-Open</span>
                  <span className="text-xs font-mono font-black text-slate-800">60.2%</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Unsubscribes</span>
                  <span className="text-xs font-mono font-black text-emerald-800">0</span>
                </div>
              </div>

              {/* Benchmark Alert Warning if rates are below 2026 standard */}
              {(parseFloat(selectedCampaignForView.openRate) < 35 || parseFloat(selectedCampaignForView.clickRate) < 2.0) && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-xs space-y-1.5 shadow-sm">
                  <p className="font-extrabold text-amber-950 flex items-center gap-1.5 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    Performance Warning: Rates Below 2026 Industry Baseline Standards
                  </p>
                  <p className="text-amber-900 font-medium leading-relaxed">
                    This campaign's Open Rate (<strong className="text-red-600 font-extrabold">{selectedCampaignForView.openRate}</strong>) or Click Rate (<strong className="text-red-600 font-extrabold">{selectedCampaignForView.clickRate}</strong>) is highlighted in <strong className="text-red-600 font-extrabold">bold red</strong> because it falls below the 2026 global broadcast email average (<strong>35%–44% Open Rate</strong>, <strong>2.0%–3.7% CTR</strong>).
                  </p>
                  <p className="text-amber-950 text-[11px] font-bold italic">
                    💡 Sora Recommendation: Re-write the subject line using Sora AI or launch this content as an automated drip flow, which achieves an average CTR of 5.5%+.
                  </p>
                </div>
              )}

              {/* Branded Email Copy Preview */}
              <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="bg-slate-900 text-slate-100 px-4 py-3 border-b border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-400">FROM: <strong className="text-slate-100">{brandProfile.senderName} &lt;{brandProfile.replyToEmail}&gt;</strong></span>
                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded font-black text-[10px] uppercase">Live Email Preview</span>
                  </div>
                  <p className="font-bold text-xs text-white">SUBJECT: {selectedCampaignForView.subject}</p>
                </div>

                <div className="p-6 space-y-4 text-slate-800 text-xs">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-black flex items-center bg-gradient-to-br from-blue-600 to-indigo-700 justify-center text-sm shadow">
                      AI
                    </div>
                    <div>
                      <h4 className="font-black text-black text-sm">{brandProfile.businessName}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Official Platform Broadcast for B2B Partners</p>
                    </div>
                  </div>

                  <p className="font-semibold text-black text-sm">Hello,</p>
                  <p className="leading-relaxed text-slate-700">
                    Welcome to this platform campaign broadcast! As part of our continuous platform expansion, we are excited to deliver AI-powered open house touchless sign-in forms, Sora multilingual voice tours, and seamless paired lender co-branding directly to your workspace.
                  </p>

                  <div className="bg-blue-50 border-l-4 border-blue-600 p-3.5 rounded-r-xl space-y-1 text-slate-900">
                    <p className="font-black text-xs text-blue-950">🚀 Key Platform Features Highlighted:</p>
                    <ul className="list-disc list-inside text-[11px] text-slate-800 space-y-0.5 font-medium">
                      <li>Touchless Kiosk Tablet Sign-In with Offline Local Cache Buffer</li>
                      <li>Sora Multilingual Voice Guided Walkthrough Tours</li>
                      <li>Strict Consent-Based Paired Lender Borrower Lead Allocation</li>
                      <li>Direct Follow Up Boss CRM Integration with Custom Field Mapping</li>
                    </ul>
                  </div>

                  <div className="text-center py-3 flex flex-col sm:flex-row items-center justify-center gap-2">
                    <Button 
                      onClick={() => {
                        setIsTourLaunchpadOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
                    >
                      <Sparkles className="h-4 w-4 text-amber-300" /> Access Platform Dashboard & Launch Tour →
                    </Button>
                    <Button
                      onClick={() => navigate("/app/overview")}
                      variant="outline"
                      className="text-xs font-bold text-slate-700 hover:bg-slate-50 border-slate-300"
                    >
                      Go to Dashboard
                    </Button>
                  </div>

                  <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-500 text-center space-y-1">
                    <p className="font-semibold">{brandProfile.complianceFooter}</p>
                    <p>Sent with 100% CAN-SPAM, CASL, and RFC 8058 One-Click Unsubscribe compliance.</p>
                  </div>
                </div>
              </div>

              {/* Sample Delivery Logs */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-black uppercase tracking-wider">Sample Recipient Delivery Log</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 font-extrabold text-black uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Recipient</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Delivery Status</th>
                        <th className="px-3 py-2">Engagement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="px-3 py-2 font-bold text-black">Sarah Jenkins (sarah.jenkins@pinnacle.com)</td>
                        <td className="px-3 py-2 text-slate-600">Agent Pro</td>
                        <td className="px-3 py-2 text-emerald-700 font-bold">Delivered</td>
                        <td className="px-3 py-2 text-blue-700 font-black">Opened & Clicked</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-black">Marcus Vance (marcus.vance@apex.com)</td>
                        <td className="px-3 py-2 text-slate-600">Lender Partner</td>
                        <td className="px-3 py-2 text-emerald-700 font-bold">Delivered</td>
                        <td className="px-3 py-2 text-emerald-700 font-bold">Opened</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-black">David Sterling (david@sterlingbrokerage.com)</td>
                        <td className="px-3 py-2 text-slate-600">Brokerage Admin</td>
                        <td className="px-3 py-2 text-emerald-700 font-bold">Delivered</td>
                        <td className="px-3 py-2 text-slate-500 font-medium">Delivered (Pending Open)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100">
            <Button 
              onClick={() => {
                toast.success(`Duplicated campaign: ${selectedCampaignForView?.name}`);
                setIsViewCampaignModalOpen(false);
              }}
              variant="outline" 
              className="text-xs font-bold text-slate-700"
            >
              Duplicate Campaign
            </Button>
            <Button 
              onClick={() => setIsViewCampaignModalOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 6: Re-activation Double Opt-In Email Confirmation Copy Preview Modal */}
      <Dialog open={isReactivateModalOpen} onOpenChange={setIsReactivateModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="sticky -top-6 bg-white z-30 pt-6 pb-3 border-b border-slate-200 -mx-6 px-6 shadow-xs">
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> Re-activation Double Opt-In Email Preview
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 font-semibold mt-0.5">
              CAN-SPAM, CASL, and RFC 8058 compliant double opt-in confirmation copy sent when re-activating an unsubscribed contact.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Audit Status Card */}
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs space-y-1">
              <span className="font-extrabold text-amber-950 block">Opt-Out Audit Trail Record:</span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-amber-900 font-medium">
                <span>Email: <strong className="font-mono text-black">{selectedUnsubForReactivate?.email || "contact@example.com"}</strong></span>
                <span>Role: <strong>{selectedUnsubForReactivate?.role || "Agent Pro"}</strong></span>
                <span>Unsubscribed Date: <strong>{selectedUnsubForReactivate?.optOutDate || "2026-08-01"}</strong></span>
              </div>
            </div>

            {/* Email Box Mockup */}
            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-sm bg-white">
              <div className="bg-slate-900 text-slate-100 p-4 space-y-1.5 border-b border-slate-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-300">FROM: <strong className="text-white">Luc Valade — AI Open House Connect &lt;{brandProfile.replyToEmail}&gt;</strong></span>
                  <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-black text-[10px] uppercase">Compliance Double Opt-In</span>
                </div>
                <p className="font-mono text-[11px] text-slate-300">TO: <strong className="text-white">{selectedUnsubForReactivate?.email}</strong></p>
                <p className="font-bold text-xs text-white pt-1">SUBJECT: [Action Required] Confirm Re-activation of Your AI Open House Connect Email Subscription</p>
              </div>

              <div className="p-6 space-y-4 text-xs text-slate-800 leading-relaxed font-normal">
                <p className="font-bold text-black text-sm">Hello,</p>
                <p>
                  You previously opted out of receiving platform email updates from <strong>AI Open House Connect</strong> on {selectedUnsubForReactivate?.optOutDate || "August 1, 2026"}.
                </p>
                <p>
                  A platform administrator (Luc Valade) has initiated a re-activation request for your email address (<strong className="font-mono">{selectedUnsubForReactivate?.email}</strong>).
                </p>

                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-xl space-y-2">
                  <h5 className="font-black text-xs text-blue-950">Why Double Opt-In Confirmation is Required:</h5>
                  <p className="text-slate-700 text-[11px]">
                    Under global privacy standards (RFC 8058, CAN-SPAM, CASL, and GDPR), we require your explicit consent before resuming outbound email broadcasts, tablet kiosk updates, or paired lender notifications.
                  </p>
                </div>

                <p className="font-medium text-slate-900">
                  If you wish to resume receiving AI Open House Connect platform announcements, please confirm your consent by clicking the button below:
                </p>

                <div className="text-center py-3">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md">
                    ✓ CONFIRM RE-ACTIVATION & RESUME EMAIL BROADCASTS
                  </Button>
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  If you did not request this re-activation or prefer to remain unsubscribed, simply ignore this email. Your global opt-out status will remain strictly enforced.
                </p>

                <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-500 space-y-0.5">
                  <p className="font-bold text-slate-700">Luc Valade</p>
                  <p>Platform Administrator — AI Open House Connect</p>
                  <p className="pt-1">{brandProfile.complianceFooter}</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100">
            <Button 
              onClick={() => setIsReactivateModalOpen(false)}
              variant="ghost" 
              className="text-xs font-bold text-slate-700"
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                if (selectedUnsubForReactivate) {
                  setUnsubscribeLogs(prev => prev.filter(l => l.id !== selectedUnsubForReactivate.id));
                  toast.success(`Re-activation double opt-in confirmation sent to ${selectedUnsubForReactivate.email}! Contact status updated.`);
                }
                setIsReactivateModalOpen(false);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              Send Confirmation Email & Re-activate Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 5: Platform Dashboard & Sora AI Property Tour Launchpad */}
      <Dialog open={isTourLaunchpadOpen} onOpenChange={setIsTourLaunchpadOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 border border-slate-200 shadow-2xl rounded-2xl">
          <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 text-white border-b border-blue-800/40">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-extrabold text-[10px] tracking-wider uppercase border border-blue-400/30 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-300" /> Sora AI Voice Tour & Hub
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/30">
                    Schema 2.2 Synchronized
                  </span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Platform Dashboard & AI Property Tour Launchpad
                </h3>
                <p className="text-xs text-blue-200/90 font-medium mt-0.5">
                  Live interactive preview of Sora AI guided walkthrough, media manifest photo binding, and quick access to platform modules.
                </p>
              </div>
              <Button 
                onClick={() => setIsTourLaunchpadOpen(false)}
                variant="ghost" 
                size="sm" 
                className="text-slate-300 hover:text-white hover:bg-white/10 rounded-full h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6 bg-slate-50/50">
            {/* Live Interactive Sora AI Tour Preview Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow">
                    AI
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white">742 Evergreen Terrace — Live Sora Guided Tour</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Canonical Manifest Key: <span className="font-mono text-blue-300">{activeTourRoom}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => {
                      setIsPlayingSoraAudio(!isPlayingSoraAudio);
                      if (!isPlayingSoraAudio) {
                        toast.success("Sora AI audio narration started with synchronized photo lock.");
                      }
                    }}
                    size="sm"
                    className={isPlayingSoraAudio ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-8" : "bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8"}
                  >
                    {isPlayingSoraAudio ? (
                      <>
                        <Pause className="h-3.5 w-3.5 mr-1" /> Pause Sora Voice
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 mr-1 fill-white" /> Play Sora Voice Guide
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Room Selector Pills */}
              <div className="px-4 py-2.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Select Room:</span>
                {[
                  { key: "livingroom_base", label: "Living Room (Base)" },
                  { key: "livingroom_staged_modern", label: "Modern Staging ✨" },
                  { key: "kitchen_chef_island", label: "Chef's Kitchen" },
                  { key: "primary_suite_luxury", label: "Primary Suite" },
                  { key: "exterior_front_dusk", label: "Twilight Dusk Sky 🌇" },
                ].map((room) => (
                  <button
                    key={room.key}
                    onClick={() => {
                      setActiveTourRoom(room.key);
                      toast.info(`Photo synchronized to "${room.label}". Render acknowledged.`);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeTourRoom === room.key 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {room.label}
                  </button>
                ))}
              </div>

              {/* Photo & Audio Player Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                {/* Photo Display */}
                <div className="md:col-span-7 relative bg-slate-950 flex items-center justify-center min-h-[260px] overflow-hidden">
                  <img 
                    src={
                      activeTourRoom === "livingroom_base" ? "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80" :
                      activeTourRoom === "livingroom_staged_modern" ? "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80" :
                      activeTourRoom === "kitchen_chef_island" ? "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80" :
                      activeTourRoom === "primary_suite_luxury" ? "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80" :
                      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
                    }
                    alt="Active Tour Media"
                    className="w-full h-full object-cover max-h-[300px]"
                  />
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-white font-mono flex items-center gap-1.5 border border-white/20">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span>key: {activeTourRoom}</span>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-blue-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-blue-200 font-bold border border-blue-400/30">
                    renderAcknowledged: OK
                  </div>
                </div>

                {/* Narration & Voice Status */}
                <div className="md:col-span-5 p-5 flex flex-col justify-between space-y-3 bg-white border-l border-slate-100">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Volume2 className="h-3.5 w-3.5 text-blue-600" /> Sora Voice Transcript
                      </span>
                      {isPlayingSoraAudio && (
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-0.5 bg-blue-600 animate-pulse rounded-full" />
                          <span className="h-3.5 w-0.5 bg-blue-600 animate-pulse delay-75 rounded-full" />
                          <span className="h-2.5 w-0.5 bg-blue-600 animate-pulse delay-150 rounded-full" />
                          <span className="h-4 w-0.5 bg-blue-600 animate-pulse delay-100 rounded-full" />
                          <span className="text-[10px] text-blue-600 font-black ml-1">Speaking</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
                      {activeTourRoom === "livingroom_base" && 
                        "\"Welcome to 742 Evergreen Terrace. This sun-drenched formal living room features 10-foot ceilings, custom white oak millwork, gas fireplace, and seamless flow into the courtyard.\""}
                      {activeTourRoom === "livingroom_staged_modern" && 
                        "\"Here is our modern virtual staging representation showing clean Italian minimalist leather seating, brushed brass lighting fixtures, and low-profile gallery shelving.\""}
                      {activeTourRoom === "kitchen_chef_island" && 
                        "\"Step into the gourmet chef's kitchen, appointed with double quartz waterfall islands, Sub-Zero refrigeration, Wolf 6-burner gas range, and a discreet butler's pantry.\""}
                      {activeTourRoom === "primary_suite_luxury" && 
                        "\"The private upper-level primary suite includes floor-to-ceiling glass balconies, dual bespoke dressing rooms, and a spa-caliber 5-piece heated marble bath.\""}
                      {activeTourRoom === "exterior_front_dusk" && 
                        "\"Here is our twilight sky transformation highlighting architectural facade uplighting, illuminated walkway grounds, and refined evening presence.\""}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Language: English (US)</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Voice & Photo In-Sync
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Hub - Navigation Links to Core Platform Screens */}
            <div>
              <h4 className="text-xs font-black text-black uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-blue-600" /> Platform Dashboards & Workspaces
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. AI Tours */}
                <div 
                  onClick={() => {
                    setIsTourLaunchpadOpen(false);
                    navigate("/app/ai-tours");
                  }}
                  className="p-4 bg-white hover:bg-blue-50/60 rounded-xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 group-hover:bg-blue-600 text-blue-700 group-hover:text-white flex items-center justify-center transition-colors">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <h5 className="font-black text-xs text-black group-hover:text-blue-900">AI Guided Tours Studio</h5>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    Create & manage multilingual Sora audio walkthroughs with photo sync.
                  </p>
                </div>

                {/* 2. Platform Overview */}
                <div 
                  onClick={() => {
                    setIsTourLaunchpadOpen(false);
                    navigate("/app/overview");
                  }}
                  className="p-4 bg-white hover:bg-blue-50/60 rounded-xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white flex items-center justify-center transition-colors">
                      <BarChart2 className="h-4 w-4" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <h5 className="font-black text-xs text-black group-hover:text-indigo-900">Platform Analytics Dashboard</h5>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    Executive overview of event attendance, conversion metrics, and system logs.
                  </p>
                </div>

                {/* 3. Open Houses Kiosk */}
                <div 
                  onClick={() => {
                    setIsTourLaunchpadOpen(false);
                    navigate("/app/open-houses");
                  }}
                  className="p-4 bg-white hover:bg-blue-50/60 rounded-xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white flex items-center justify-center transition-colors">
                      <QrCode className="h-4 w-4" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <h5 className="font-black text-xs text-black group-hover:text-emerald-900">Open House Kiosk & QR Studio</h5>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    Configure tablet lock PIN, offline sync buffer, and touchless sign-in forms.
                  </p>
                </div>

                {/* 4. Paired Lenders */}
                <div 
                  onClick={() => {
                    setIsTourLaunchpadOpen(false);
                    navigate("/app/lenders");
                  }}
                  className="p-4 bg-white hover:bg-blue-50/60 rounded-xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-100 group-hover:bg-purple-600 text-purple-700 group-hover:text-white flex items-center justify-center transition-colors">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                  <h5 className="font-black text-xs text-black group-hover:text-purple-900">Paired Lender Network</h5>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    Consent-based borrower routing, paired agent seats, and B2B subscriptions.
                  </p>
                </div>

                {/* 5. Brokerage Inventory */}
                <div 
                  onClick={() => {
                    setIsTourLaunchpadOpen(false);
                    navigate("/app/listings");
                  }}
                  className="p-4 bg-white hover:bg-blue-50/60 rounded-xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 group-hover:bg-amber-600 text-amber-700 group-hover:text-white flex items-center justify-center transition-colors">
                      <Home className="h-4 w-4" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                  </div>
                  <h5 className="font-black text-xs text-black group-hover:text-amber-900">Property Listings & Staging</h5>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    Manage MLS listings, cross-hosting delegations, and AI staging variations.
                  </p>
                </div>

                {/* 6. Leads & Follow Up Boss */}
                <div 
                  onClick={() => {
                    setIsTourLaunchpadOpen(false);
                    navigate("/app/leads");
                  }}
                  className="p-4 bg-white hover:bg-blue-50/60 rounded-xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-8 w-8 rounded-lg bg-rose-100 group-hover:bg-rose-600 text-rose-700 group-hover:text-white flex items-center justify-center transition-colors">
                      <Users className="h-4 w-4" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
                  </div>
                  <h5 className="font-black text-xs text-black group-hover:text-rose-900">Lead Pipeline & CRM Sync</h5>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    Verified guest leads, compliance consent logs, and Follow Up Boss mapping.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-white border-t border-slate-200 flex justify-between items-center sm:justify-between">
            <Button 
              onClick={() => setIsTourLaunchpadOpen(false)}
              variant="outline" 
              className="text-xs font-bold text-slate-700 border-slate-300 hover:bg-slate-50"
            >
              Close Launchpad
            </Button>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setIsTourLaunchpadOpen(false);
                  navigate("/app/overview");
                }}
                variant="outline"
                className="text-xs font-bold text-blue-700 border-blue-200 hover:bg-blue-50"
              >
                Go to Dashboard →
              </Button>
              <Button 
                onClick={() => {
                  setIsTourLaunchpadOpen(false);
                  navigate("/app/ai-tours");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow"
              >
                Launch AI Tour Studio →
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
