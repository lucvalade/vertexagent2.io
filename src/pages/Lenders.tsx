import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  Building2, 
  Users, 
  CreditCard, 
  Sparkles, 
  Bot, 
  Clipboard, 
  Link2, 
  CheckCircle2, 
  ShieldCheck, 
  FileCheck, 
  Share2, 
  FolderLock, 
  Download, 
  Calendar,
  Layers,
  ChevronRight,
  Database,
  ArrowUpRight,
  UserCheck,
  CheckCircle,
  HelpCircle,
  BadgeCent,
  Trash2,
  Lock,
  Info,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { collection, query, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type SubTier = "solo" | "growth" | "enterprise";

export default function Lenders() {
  const { user } = useAuth();

  const [complianceCountry, setComplianceCountry] = useState<"US" | "CA">(() => {
    return (localStorage.getItem("compliance_country") as any) || "CA";
  });

  const [canSponsorLender, setCanSponsorLender] = useState<boolean>(() => {
    return localStorage.getItem("can_sponsor_lender") !== "false";
  });

  const [geoipLoading, setGeoipLoading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("compliance_country")) {
      setComplianceCountry("CA");
      localStorage.setItem("compliance_country", "CA");
    }
  }, []);

  // Active viewing tab for testing both perspectives
  const [activeTab, setActiveTab] = useState<"agent-desk" | "lender-portal">("agent-desk");

  // Simulated Agent plan status
  const [simulatedPlan, setSimulatedPlan] = useState<"solo" | "team_brokerage">(() => {
    const saved = localStorage.getItem("simulated_agent_plan");
    return (saved as any) || "solo";
  });

  // Active paired lender
  const [activeLender, setActiveLender] = useState<{
    id: string;
    name: string;
    company: string;
    nmlsId: string;
    email: string;
    phone: string;
  } | null>(() => {
    const saved = localStorage.getItem("agent_active_lender");
    if (saved === "null") return null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return {
      id: "lend_jonathan",
      name: "Jonathan Finch",
      company: "Alpha Preferred Mortgages",
      nmlsId: "NMLS #8849201",
      email: "j.finch@alphamortgages.com",
      phone: "+1 (415) 880-9281"
    };
  });

  // Saved lenders
  const [savedLenders, setSavedLenders] = useState<Array<{
    id: string;
    name: string;
    company: string;
    nmlsId: string;
    email: string;
    phone: string;
  }>>(() => {
    const saved = localStorage.getItem("agent_saved_lenders");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: "lend_clara",
        name: "Clara Danforth",
        company: "Apex Home Loans",
        nmlsId: "NMLS #4492910",
        email: "c.danforth@apexloans.com",
        phone: "+1 (213) 554-1029"
      },
      {
        id: "lend_richard",
        name: "Richard Vance",
        company: "Sovereign Savings & Trust",
        nmlsId: "NMLS #3021948",
        email: "vance.r@sovereigntrust.co",
        phone: "+1 (617) 229-3382"
      },
      {
        id: "lend_robert",
        name: "Robert Mercer",
        company: "Caliber Mortgages",
        nmlsId: "NMLS #2293810",
        email: "mercer@calibermortgages.com",
        phone: "+1 (305) 441-9034"
      }
    ];
  });

  // Admin policy override
  const [adminPolicy, setAdminPolicy] = useState<{
    overrideOption: "listing_specific" | "enforced_office";
    globalLenderId: string;
    lockSubordinates: boolean;
  }>(() => {
    const saved = localStorage.getItem("team_lender_policy_override");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {
          overrideOption: "listing_specific",
          globalLenderId: "lend_clara",
          lockSubordinates: false
        };
      }
    }
    return {
      overrideOption: "listing_specific",
      globalLenderId: "lend_clara",
      lockSubordinates: false
    };
  });

  // Swap modal state
  const [swapLenderModal, setSwapLenderModal] = useState<{
    oldLender: typeof activeLender;
    newLender: typeof activeLender;
  } | null>(null);

  // Invite custom saved lender modal state
  const [inviteSavedModalOpen, setInviteSavedModalOpen] = useState(false);
  const [inviteSavedName, setInviteSavedName] = useState("");
  const [inviteSavedCompany, setInviteSavedCompany] = useState("");
  const [inviteSavedNmls, setInviteSavedNmls] = useState("");
  const [inviteSavedEmail, setInviteSavedEmail] = useState("");
  const [inviteSavedPhone, setInviteSavedPhone] = useState("");
  
  // Profile settings
  const [lenderName, setLenderName] = useState("Jonathan Finch");
  const [lenderCompany, setLenderCompany] = useState("Alpha Preferred Mortgages");
  const [nmlsId, setNmlsId] = useState("NMLS #8849201");
  const [licensingType, setLicensingType] = useState<"NMLS" | "FSRA">("NMLS");
  const [licensingId, setLicensingId] = useState("8849201");
  const [lenderBio, setLenderBio] = useState("With over 15 years specializing in high-net-worth jumbo loans, bridge financing, and luxury real estate acquisitions.");
  const [licenseRegion, setLicenseRegion] = useState("California & New York State");
  const [additionalRegions, setAdditionalRegions] = useState<string[]>([]);

  // Modals & Confirmations States
  const [pendingTier, setPendingTier] = useState<{ id: string; name: string; d: string; p: string } | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [pendingUnpairAgent, setPendingUnpairAgent] = useState<{ id: string; name: string } | null>(null);
  const [pendingDeleteRegionIdx, setPendingDeleteRegionIdx] = useState<number | null>(null);
  const [deleteSavedLenderConfirm, setDeleteSavedLenderConfirm] = useState<{ id: string; name: string } | null>(null);
  const [showUnpairLenderConfirm, setShowUnpairLenderConfirm] = useState(false);

  // Capitalization helper to enforce title case format
  const capitalizeWords = (str: string) => {
    return str
      .split(" ")
      .map(word => {
        if (!word) return "";
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  };

  const formatPairingDate = (date: Date) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const m = months[date.getMonth()];
    const d = date.getDate();
    const y = date.getFullYear();
    let hr = date.getHours();
    const min = String(date.getMinutes()).padStart(2, "0");
    const ampm = hr >= 12 ? "PM" : "AM";
    hr = hr % 12;
    hr = hr ? hr : 12;
    return `${m} ${d}, ${y} - ${hr}:${min} ${ampm}`;
  };

  const addRegionField = () => {
    if (additionalRegions.length < 4) {
      setAdditionalRegions([...additionalRegions, ""]);
    } else {
      toast.error("You can add a maximum of 4 more licensed jurisdictions.");
    }
  };

  const updateRegionField = (index: number, value: string) => {
    const updated = [...additionalRegions];
    updated[index] = value;
    setAdditionalRegions(updated);
  };

  const removeRegionField = (index: number) => {
    setPendingDeleteRegionIdx(index);
  };
  
  // Billing status states
  const [subscriptionTier, setSubscriptionTier] = useState<SubTier>("growth");
  const [isSubscribed, setIsSubscribed] = useState(true);
  
  // Pairing configurations
  const [pairingLink, setPairingLink] = useState("");
  const [pairedAgents, setPairedAgents] = useState([
    { id: "agent_1", name: "Sarah Jenkins", email: "sarah@jenkinsluxury.com", activeListings: 4, joinedAt: "Feb 14, 2026 - 9:30 AM" },
    { id: "agent_2", name: "Michael Vance", email: "m.vance@primebrokerages.com", activeListings: 3, joinedAt: "Mar 1, 2026 - 2:15 PM" },
    { id: "agent_3", name: "Elena Rostova", email: "elena@rostovagroup.com", activeListings: 5, joinedAt: "May 18, 2026 - 11:30 AM" }
  ]);
  const [newAgentEmail, setNewAgentEmail] = useState("");

  // Leads & webhooks
  const [webhookUrl, setWebhookUrl] = useState("https://api.preferredlender.com/v1/leads/sync");
  const [leads, setLeads] = useState([
    { id: "lead_120", name: "Marcus Brody", email: "marcus.brody@museumcorp.org", phone: "+1 (310) 902-1144", listing: "888 Bel Air Road", optInTime: "2026-06-02 11:30", verified: "Yes (TCPA Logged)", status: "Sent to Webhook" },
    { id: "lead_122", name: "Victoria Sterling", email: "sterling.v@luxuryvistas.com", phone: "+1 (212) 556-9021", listing: "740 Park Avenue", optInTime: "2026-06-02 14:15", verified: "Yes (TCPA Logged)", status: "Sent to Webhook" }
  ]);

  // Office Overrides State
  const [overridePriority, setOverridePriority] = useState<"listing" | "office" | "agent" | "default">("listing");
  const [officeEnforced, setOfficeEnforced] = useState(false);

  useEffect(() => {
    // Generate static secret pairing link securely for display mockups
    if (user) {
      setPairingLink(`${window.location.origin}/register?lender_partner=${user.id || "lend_883"}`);
    }
  }, [user]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pairingLink);
    toast.success("✨ Secret lender pairing link copied to clipboard. Share with agents to enable instant inventory pairing!");
  };

  const handleInviteAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentEmail || !newAgentEmail.includes("@")) {
      toast.error("Please enter a valid agent email address.");
      return;
    }
    
    // Create highly realistic mockup of a pending paired agent that demonstrates the request + copy routing
    const username = newAgentEmail.split("@")[0];
    const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
    const now = new Date();
    const timeStr = formatPairingDate(now);
    
    const newPendingAgent = {
      id: `pending_${Date.now()}`,
      name: `${formattedName} (Pending Invite)`,
      email: newAgentEmail,
      activeListings: 0,
      joinedAt: `${timeStr} (Pending)`
    };

    setPairedAgents(prev => [...prev, newPendingAgent]);
    
    toast.success(`✨ Invitation dispatched to ${newAgentEmail}! A copy of the dispatch confirmation has been CC'd, and the pending relationship is successfully logged on your dashboard.`);
    setNewAgentEmail("");
  };

  const handleTriggerWebhookTest = () => {
    if (!webhookUrl) {
      toast.error("Endpoint URL is required to trigger sync simulation.");
      return;
    }
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: "Contacting webhook endpoint...",
        success: "🚀 Simulated API Response code 200 OK: Secured payload delivered successfully!",
        error: "Sync test failed."
      }
    );
  };

  const handleSaveProfile = () => {
    // 1. Enforce capitals on Lender Name and Company Name
    const capitalizedName = capitalizeWords(lenderName);
    const capitalizedCompany = capitalizeWords(lenderCompany);
    setLenderName(capitalizedName);
    setLenderCompany(capitalizedCompany);

    // 2. Enforce capitals on licensed jurisdictions
    const capitalizedPrimary = capitalizeWords(licenseRegion);
    setLicenseRegion(capitalizedPrimary);

    const capitalizedAdditional = additionalRegions.map(reg => capitalizeWords(reg));
    setAdditionalRegions(capitalizedAdditional);

    // 3. Apply validation rules for chosen licensing bodies
    if (licensingType === "NMLS") {
      const isDigits = /^[0-9]+$/.test(licensingId);
      if (!isDigits || licensingId.length < 4 || licensingId.length > 12) {
        toast.error("⚠️ Invalid NMLS unique ID. USA NMLS requires between 4 and 12 digits (numbers only).");
        return;
      }
      setNmlsId(`NMLS #${licensingId}`);
    } else {
      // FSRA (CAN)
      const isValidFSRA = /^[A-Z0-9-]{1,20}$/.test(licensingId);
      if (!isValidFSRA) {
        toast.error("⚠️ Invalid FSRA ID. CAN FSRA licence allows uppercase letters, digits, and hyphens (up to 20 characters maximum).");
        return;
      }
      setNmlsId(`FSRA #${licensingId}`);
    }

    setShowSaveConfirm(true);
  };

  const confirmSaveProfile = () => {
    setShowSaveConfirm(false);
    toast.success("✨ Lender profile compliance record configured and saved successfully!");
  };

  const confirmTierChange = () => {
    if (pendingTier) {
      setSubscriptionTier(pendingTier.id as SubTier);
      setIsSubscribed(true);
      toast.success(`Switched to ${pendingTier.name} pricing tier!`);
      setPendingTier(null);
    }
  };

  const confirmUnpair = () => {
    if (pendingUnpairAgent) {
      setPairedAgents(prev => prev.filter(a => a.id !== pendingUnpairAgent.id));
      toast.success(`✨ Disconnected co-op relationship with agent ${pendingUnpairAgent.name}. Record was unpaired.`);
      setPendingUnpairAgent(null);
    }
  };

  // AI Actions Mockup matching specific Sora helper lines/prompts
  const handleAiGenBio = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: "Sora is drafting lender bio...",
        success: () => {
          setLenderBio(`Senior Mortgage Specialist at ${lenderCompany} with deep expertise in custom financing solutions. Specializing in bespoke jumbo, super-prime acquisitions, bridge funds, and asset-depletion qualifications tailored for high-volume broker teams.`);
          return "✨ Refined bio updated in premium luxury-tonality.";
        }
      }
    );
  };

  const handleAiOnboardingInvite = () => {
    const inviteMsg = `Hi [Agent Name], let's pair! I've activated my AI Open House Connect billing subscription, which enables premium co-op marketing widgets, touchless QR signage features, and direct rate calculations on your listings. Here is my secret invite link to pair instantly: ${pairingLink}`;
    navigator.clipboard.writeText(inviteMsg);
    toast.success("✨ AI Onboarding Invite message copied! Ready to paste into email or SMS.");
  };

  const handleSimulateSubscription = () => {
    setIsSubscribed(!isSubscribed);
    toast.success(isSubscribed ? "Subscription paused. Enhanced listing widgets will be hidden." : "✨ Billing reactivated! Interactive co-op modules enabled.");
  };

  const handleUpdateSimulatedPlan = (plan: "solo" | "team_brokerage") => {
    setSimulatedPlan(plan);
    localStorage.setItem("simulated_agent_plan", plan);
    toast.success(`Plan Context Updated!`, {
      description: `Simulation context is now "${plan === "solo" ? "Solo Agent" : "Team & Brokerage Package"}".`
    });
  };

  const handleUnpairActiveLender = () => {
    if (activeLender) {
      setShowUnpairLenderConfirm(true);
    }
  };

  const handleExecuteUnpairActiveLender = () => {
    if (activeLender) {
      toast.success(`✨ Unpaired lending partner ${activeLender.name} successfully.`, {
        description: "Your listings will automatically hide lender co-branding and mortgage questions until a new lender is paired."
      });
      setActiveLender(null);
      localStorage.setItem("agent_active_lender", "null");
    }
    setShowUnpairLenderConfirm(false);
  };

  const handleActivateSavedLender = (targetLender: typeof activeLender) => {
    const isEnforced = simulatedPlan === "team_brokerage" && adminPolicy.overrideOption === "enforced_office";
    if (isEnforced) {
      toast.error("Override Denied", {
        description: "Your Team/Office Admin has enforced global brokerage co-branding. You cannot switch lenders individually."
      });
      return;
    }

    if (simulatedPlan === "solo") {
      if (activeLender) {
        setSwapLenderModal({
          oldLender: activeLender,
          newLender: targetLender
        });
        return;
      }
    }

    setActiveLender(targetLender);
    localStorage.setItem("agent_active_lender", JSON.stringify(targetLender));
    toast.success(`✨ Active lender updated to ${targetLender.name}!`, {
      description: `All co-branded open house listings are now routed to ${targetLender.company}.`
    });
  };

  const handleConfirmSwap = () => {
    if (swapLenderModal && swapLenderModal.newLender) {
      const newL = swapLenderModal.newLender;
      setActiveLender(newL);
      localStorage.setItem("agent_active_lender", JSON.stringify(newL));
      toast.success(`✨ Swapped active lending partner successfully!`, {
        description: `Unpaired ${swapLenderModal.oldLender?.name} and connected ${newL.name} (${newL.company}) as your single active lender.`
      });
      setSwapLenderModal(null);
    }
  };

  const handleSaveAdminPolicy = () => {
    localStorage.setItem("team_lender_policy_override", JSON.stringify(adminPolicy));
    toast.success("🏦 Admin Policy Overrides Persisted!", {
      description: `Office co-branding rules configured: ${adminPolicy.overrideOption === "enforced_office" ? "Enforced Office Policy" : "Listing-Level Overrides Allowed"}.`
    });
  };

  const handleAddSavedLender = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteSavedName || !inviteSavedCompany) {
      toast.error("Lender name and company are required.");
      return;
    }
    const newL = {
      id: "lend_" + Date.now(),
      name: inviteSavedName,
      company: inviteSavedCompany,
      nmlsId: inviteSavedNmls || "NMLS #Pending",
      email: inviteSavedEmail || "partner@co-op.com",
      phone: inviteSavedPhone || "+1 (555) 019-2103"
    };

    const updated = [...savedLenders, newL];
    setSavedLenders(updated);
    localStorage.setItem("agent_saved_lenders", JSON.stringify(updated));
    toast.success(`✨ Saved relationship recorded: ${inviteSavedName}!`, {
      description: "You may now activate this partner when needed."
    });

    setInviteSavedName("");
    setInviteSavedCompany("");
    setInviteSavedNmls("");
    setInviteSavedEmail("");
    setInviteSavedPhone("");
    setInviteSavedModalOpen(false);
  };

  const handleDeleteSavedLender = (id: string, name: string) => {
    setDeleteSavedLenderConfirm({ id, name });
  };

  const handleExecuteDeleteSavedLender = () => {
    if (!deleteSavedLenderConfirm) return;
    const { id, name } = deleteSavedLenderConfirm;
    const updated = savedLenders.filter(l => l.id !== id);
    setSavedLenders(updated);
    localStorage.setItem("agent_saved_lenders", JSON.stringify(updated));
    toast.success(`Deleted saved relationship with ${name}.`);
    setDeleteSavedLenderConfirm(null);
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            <Building2 className="h-7 w-7 text-blue-600" />
            Lender Pairings & Overrides
          </h1>
          <p className="text-sm text-slate-500">
            Configure single active co-branded lenders, saved backup relationships, and administrative office policy overrides.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("agent-desk")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "agent-desk"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🤵 Agent & Admin Desk
          </button>
          <button
            onClick={() => setActiveTab("lender-portal")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "lender-portal"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🏦 Lender Partner Portal
          </button>
        </div>
      </div>

      {/* Compliance Sandbox Engine control bar */}
      <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> COMPLIANCE SANDBOX ENGINE
          </p>
          <p className="text-xs text-slate-500 font-medium text-left">
            Toggle dynamic jurisdiction variables to verify strict RESPA compliance (USA) vs co-marketing agent sponsorship (Canada).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-black text-slate-600">Region:</span>
            <select
              value={complianceCountry}
              onChange={(e) => {
                const val = e.target.value as "US" | "CA";
                setComplianceCountry(val);
                localStorage.setItem("compliance_country", val);
                toast.success(`Compliance engine set to ${val === "US" ? "🇺🇸 United States (RESPA)" : "🇨🇦 Canada (Flexible)"}`);
              }}
              className="bg-white border border-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 text-slate-800 cursor-pointer"
            >
              <option value="CA">🇨🇦 Canada (Flexible)</option>
              <option value="US">🇺🇸 USA (RESPA Strict)</option>
            </select>
          </div>

          {complianceCountry === "CA" && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="text-[10px] uppercase font-black text-slate-600">Sponsorship Enabled:</span>
              <button
                onClick={() => {
                  const val = !canSponsorLender;
                  setCanSponsorLender(val);
                  localStorage.setItem("can_sponsor_lender", String(val));
                  toast.success(`Agent seat sponsorship ${val ? "Enabled" : "Disabled"}`);
                }}
                className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border cursor-pointer transition-all ${
                  canSponsorLender
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {canSponsorLender ? "✅ Agent Paying" : "❌ Lender Self-Paid"}
              </button>
            </div>
          )}
        </div>
      </div>

      {activeTab === "agent-desk" && (
        <div className="space-y-8 animate-in fade-in duration-300 animate-duration-150">
          
          {/* Left Column: Plan and Policy Overrides */}
          <div className="w-full max-w-7xl mx-auto space-y-6">
            
            {/* Account Plan & Pricing Selector */}
            <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
                <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  Account Plan Context (Simulated)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Switch plan context below to verify the specific single active lender limits and office override policies.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateSimulatedPlan("solo")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      simulatedPlan === "solo"
                        ? "border-blue-600 bg-blue-50/20 text-blue-900"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    <p className="text-xs font-black uppercase">Solo Agent Plan</p>
                    <p className="text-[10px] text-slate-500 mt-1">Includes max 1 active paired lender at a time.</p>
                  </button>
                  <button
                    onClick={() => handleUpdateSimulatedPlan("team_brokerage")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      simulatedPlan === "team_brokerage"
                        ? "border-blue-600 bg-blue-50/20 text-blue-900"
                        : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    <p className="text-xs font-black uppercase">Team/Brokerage</p>
                    <p className="text-[10px] text-slate-500 mt-1">Unlocks admin lender override controls across office.</p>
                  </button>
                </div>

                <div className={`p-4 rounded-xl text-xs font-medium border ${
                  simulatedPlan === "solo" 
                    ? "bg-slate-50 text-slate-800 border-slate-200" 
                    : "bg-blue-50 text-blue-800 border-blue-100"
                }`}>
                  {simulatedPlan === "solo" ? (
                    <p className="leading-relaxed text-slate-700">
                      💡 <strong>Solo Plan Active:</strong> Only one lender can be active at an open house event. Backups are stored in Saved Convenience lists, but co-branding is restricted to the single active contract.
                    </p>
                  ) : (
                    <p className="leading-relaxed text-blue-900">
                      💡 <strong>Team/Brokerage Active:</strong> Administrative override defaults are enabled. Office admins can force a designated sponsor or relax locks for listings.
                    </p>
                  )}
                </div>

                {complianceCountry === "US" ? (
                  <div className="p-4 rounded-xl text-xs font-medium border bg-rose-50 text-rose-800 border-rose-200 text-left">
                    <p className="leading-relaxed text-rose-950 font-semibold">
                      ⚠️ <strong>RESPA Section 8 Strict Compliance:</strong> In the United States, agents are strictly prohibited from paying or sponsoring a lender's placement or seat. To remain fully compliant, <strong>co-marketing seat sponsorship is completely disabled</strong>. Lenders MUST have their own active, self-paid subscription to pair with your listings.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl text-xs font-medium border bg-emerald-50 text-emerald-800 border-emerald-200 text-left">
                    <p className="leading-relaxed text-emerald-950 font-semibold">
                      🇨🇦 <strong>Canadian Co-Marketing Compliance:</strong> In Canada, agent-sponsored co-marketing seats are allowed under current provincial guidelines. You can choose to pay for your lender's seat as a co-marketing benefit ({canSponsorLender ? "currently active" : "currently inactive"}), or have them self-pay.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Policy Override panel */}
            <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden bg-white relative">
              {simulatedPlan === "solo" && (
                <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center text-center p-6">
                  <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-650 font-bold mb-2">
                    <Lock className="h-5 w-5 text-slate-550" />
                  </div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Locked Option</h4>
                  <p className="text-[10px] text-slate-500 max-w-[240px] mt-1">
                    Upgrade to a <strong>Team or Brokerage Plan</strong> to manage compliance overrides and lock global office default sponsors.
                  </p>
                  <Link
                    to="/pricing"
                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-4 rounded-xl shadow-md inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    Upgrade to Team / Brokerage Plan
                  </Link>
                </div>
              )}
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FolderLock className="h-4 w-4 text-pink-600" />
                    Office Override Rules Policy
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Specify whether administrators enforce global co-branding or if individual listing overrides take precedence.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase font-black text-slate-600 flex items-center gap-1.5">
                      Admin Preference Override Option
                    </Label>
                  </div>
                  <select
                    value={adminPolicy.overrideOption}
                    onChange={(e) => {
                      const opt = e.target.value as any;
                      setAdminPolicy(prev => ({ ...prev, overrideOption: opt }));
                    }}
                    className="w-full h-10 px-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-xs sm:text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-550"
                  >
                    <option value="listing_specific">Allow Listing-level Override (Default)</option>
                    <option value="enforced_office">Enforce Global Office Policy Lender</option>
                  </select>
                </div>

                {/* Explanatory Policy Guide Card with (?) Icon */}
                <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-left space-y-2.5">
                  <div className="flex items-center gap-1.5 text-blue-900 text-xs font-bold">
                    <HelpCircle className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Understanding Override Policy Options:</span>
                  </div>
                  <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
                    <div className="p-2 bg-white/80 rounded-lg border border-blue-100/50">
                      <strong className="text-slate-900 font-bold block mb-0.5">
                        1. Allow Listing-level Override (Default):
                      </strong>
                      Individual listing agents maintain autonomy to assign specific lender partners to individual listings. If no listing sponsor is set, the system falls back to the agent's preferred paired lender.
                    </div>
                    <div className="p-2 bg-white/80 rounded-lg border border-blue-100/50">
                      <strong className="text-slate-900 font-bold block mb-0.5">
                        2. Enforce Global Office Policy Lender:
                      </strong>
                      Locks a single, verified brokerage-wide corporate sponsor across all team listings and open house kiosks. Individual agent overrides are suppressed to guarantee uniform corporate compliance.
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black text-slate-600">Globally Enforced Admin Lender</Label>
                  <select
                    value={adminPolicy.globalLenderId}
                    onChange={(e) => {
                      const lenderId = e.target.value;
                      setAdminPolicy(prev => ({ ...prev, globalLenderId: lenderId }));
                    }}
                    className="w-full h-10 px-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-xs sm:text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-550"
                    disabled={adminPolicy.overrideOption !== "enforced_office"}
                  >
                    <option value="lend_jonathan">Jonathan Finch (Alpha Preferred)</option>
                    <option value="lend_clara">Clara Danforth (Apex Home Loans)</option>
                    <option value="lend_richard">Richard Vance (Sovereign Trust)</option>
                    <option value="lend_robert">Robert Mercer (Caliber Mortgages)</option>
                  </select>
                </div>

                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={adminPolicy.lockSubordinates}
                    onChange={(e) => setAdminPolicy(prev => ({ ...prev, lockSubordinates: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
                  />
                  <div className="text-left leading-tight">
                    <p className="text-xs font-extrabold text-slate-800">Lock subordinates configuration</p>
                    <p className="text-[9px] text-slate-400">Lock subordinate agent configs globally.</p>
                  </div>
                </label>
              </CardContent>
              <CardFooter className="bg-slate-50/30 border-t border-slate-100 p-4 flex justify-end">
                <Button 
                  onClick={handleSaveAdminPolicy}
                  className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-black h-9 px-4 rounded-xl shadow-sm cursor-pointer"
                >
                  Save Admin Policies
                </Button>
              </CardFooter>
            </Card>

            <div className="bg-stone-50 border border-stone-200/50 p-4 rounded-2xl flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-650 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-stone-850">Precedence Scope Stack</p>
                <ol className="text-[10px] text-stone-500 list-decimal pl-4 space-y-1 leading-relaxed">
                  <li>Listing-level specific override</li>
                  <li>Team or Office override policy</li>
                  <li>Agent's Preferred active paired lender</li>
                  <li>Market default fallback (when no mappings exist)</li>
                </ol>
              </div>
            </div>

          </div>

          {/* Right Column: Active and Saved relationships */}
          <div className="w-full max-w-7xl mx-auto space-y-6">
            
            {/* Active Paired Lender Card */}
            <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-50 border-b border-rose-100/10 p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-emerald-600" />
                      Active Paired Lender Contract
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Co-branding and leads routing are active for this partner. Only ONE active lender is allowed.
                    </CardDescription>
                  </div>
                  {adminPolicy.overrideOption === "enforced_office" && simulatedPlan === "team_brokerage" ? (
                    <span className="bg-red-50 text-red-650 border border-red-100 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5">
                      <Lock className="h-3 w-3" />
                      Office Policy Enforced
                    </span>
                  ) : activeLender ? (
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide">
                      Active Sponsor
                    </span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="p-5">
                {activeLender ? (
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900">{activeLender.name}</h3>
                        <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[9px] font-bold font-mono">
                          {complianceCountry === "US" ? (
                            activeLender.nmlsId
                          ) : (
                            activeLender.nmlsId ? activeLender.nmlsId.replace(/NMLS\s*/i, "Provincial License ") : "Provincial License Verified"
                          )}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-650">{activeLender.company}</p>
                      <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1">
                        <a href={`mailto:${activeLender.email}`} className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
                          ✉️ {activeLender.email}
                        </a>
                        <a href={`tel:${activeLender.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
                          📞 {activeLender.phone}
                        </a>
                      </div>
                      <p className="text-[10px] text-blue-600 font-bold mt-1">
                        ✅ Mortgage opt-in & exclusive scenario checkers will connect to this lender.
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleUnpairActiveLender}
                      disabled={adminPolicy.overrideOption === "enforced_office" && simulatedPlan === "team_brokerage"}
                      className="text-red-550 border-red-200 hover:text-red-700 hover:bg-red-50/50 text-xs h-9 font-bold px-4 rounded-xl cursor-pointer"
                    >
                      Unpair Lender
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 p-6">
                    <p className="text-xs font-bold text-zinc-650 mb-1">No Active Lender Associated</p>
                    <p className="text-[10px] text-zinc-500 max-w-[360px] mx-auto leading-relaxed mb-4">
                      No lender co-branding and mortgage questions will appear on your tablet kiosk-mode until you connect or pair an active sponsor.
                    </p>
                    <Button
                      onClick={() => handleActivateSavedLender(savedLenders[0] || {
                        id: "lend_clara",
                        name: "Clara Danforth",
                        company: "Apex Home Loans",
                        nmlsId: "NMLS #4492910",
                        email: "c.danforth@apexloans.com",
                        phone: "+1 (213) 554-1029"
                      })}
                      className="bg-blue-600 text-white hover:bg-blue-700 text-xs px-4 h-9 font-bold rounded-xl shadow-sm cursor-pointer"
                    >
                      Connect Default (Apex Home Loans)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saved Convenience Relationships */}
            <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Database className="h-4 w-4 text-indigo-600" />
                    Saved Lending Cohorts (Convenience Backups)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Store saved relationships for quick rotation. Only ONE can be activated for routing at any given instance.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setInviteSavedModalOpen(true)}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 text-xs h-8 px-3 font-semibold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowUpRight className="h-3 w-3" />
                  Save Lender
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">
                        <th className="p-4">Contact</th>
                        <th className="p-4">Institution</th>
                        <th className="p-4">{complianceCountry === "US" ? "NMLS Code" : "Provincial License"}</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {savedLenders.map((lender) => {
                        const isActive = activeLender?.id === lender.id;
                        return (
                          <tr key={lender.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-4">
                              <div className="font-bold text-slate-900">{lender.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{lender.email}</div>
                            </td>
                            <td className="p-4">{lender.company}</td>
                            <td className="p-4">
                              <span className="font-mono font-semibold bg-stone-100 px-2 py-0.5 rounded text-[10px] text-stone-600">
                                {complianceCountry === "US" ? (
                                  lender.nmlsId
                                ) : (
                                  lender.nmlsId ? lender.nmlsId.replace(/NMLS\s*/i, "Provincial License ") : "Provincial License Verified"
                                )}
                              </span>
                            </td>
                            <td className="p-4 flex items-center justify-end gap-2.5">
                              {isActive ? (
                                <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded text-[10px] font-bold">
                                  ACTIVE
                                </span>
                              ) : (
                                <Button
                                  variant="outline"
                                  onClick={() => handleActivateSavedLender(lender)}
                                  disabled={adminPolicy.overrideOption === "enforced_office" && simulatedPlan === "team_brokerage"}
                                  className="text-xs h-8 px-2.5 font-bold hover:bg-slate-50 rounded-lg cursor-pointer text-indigo-600 border-indigo-200"
                                >
                                  Activate
                                </Button>
                              )}
                              
                              <button
                                onClick={() => handleDeleteSavedLender(lender.id, lender.name)}
                                className="text-slate-400 hover:text-red-500 mt-1 transition cursor-pointer"
                                title="Delete backup relationship"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {savedLenders.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 font-bold">
                            No backup relationships stored. Add lenders using the 'Save Lender' option above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>
      )}

      {activeTab === "lender-portal" && (
        <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left column: Profiles and pricing */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Subscription Tiers */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4" />
                Co-Op Pricing Tiers
              </CardTitle>
              <CardDescription className="text-xs">
                Select your partnership model. Lenders must be active paid members to pair.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-left">
              {[
                { id: "solo", name: "Solo Lender", d: "1 agent pairing, listing rate support", p: "$99/mo" },
                { id: "growth", name: "Growth Lender", d: "Up to 5 agents, webhook syncing, priority leads", p: "$249/mo" },
                { id: "enterprise", name: "Enterprise Branch", d: "Unlimited agent pairing, office level overrides", p: "$499/mo" },
              ].map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => {
                    if (tier.id === subscriptionTier && isSubscribed) {
                      return;
                    }
                    setPendingTier(tier);
                  }}
                  className={`p-3 border rounded-xl flex items-center justify-between transition-all w-full select-none cursor-pointer text-left ${
                    subscriptionTier === tier.id && isSubscribed
                      ? "border-blue-600 bg-blue-50/50 shadow-sm"
                      : "border-slate-200 hover:bg-slate-50/60"
                  }`}
                >
                  <div>
                    <p className="font-extrabold text-xs text-slate-950">{tier.name}</p>
                    <p className="text-[10px] text-slate-500 font-normal leading-normal">{tier.d}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 font-mono">{tier.p}</span>
                    {subscriptionTier === tier.id && isSubscribed && (
                      <p className="text-[8px] text-blue-600 font-bold uppercase mt-1">ACTIVE</p>
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Profile fields */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-black uppercase text-slate-900 tracking-wider">
                LENDER COMPLIANCE PROFILE
              </CardTitle>
              <CardDescription className="text-xs">
                Visible to paired buyers and agent flyer widgets.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4 text-left">
              <div className="space-y-1">
                <Label className="text-[10px] text-black uppercase font-extrabold tracking-wider">Lender Name</Label>
                <Input 
                  value={lenderName} 
                  onChange={(e) => setLenderName(e.target.value)} 
                  onBlur={(e) => setLenderName(capitalizeWords(e.target.value))}
                  className="h-9 text-xs text-black font-semibold rounded-xl border-slate-300 bg-white" 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-black uppercase font-extrabold tracking-wider">Company Name</Label>
                <Input 
                  value={lenderCompany} 
                  onChange={(e) => setLenderCompany(e.target.value)} 
                  onBlur={(e) => setLenderCompany(capitalizeWords(e.target.value))}
                  className="h-9 text-xs text-black font-semibold rounded-xl border-slate-300 bg-white" 
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-black uppercase font-extrabold tracking-wider">Licensing Body</Label>
                  <select
                    value={licensingType}
                    onChange={(e) => {
                      const type = e.target.value as "NMLS" | "FSRA";
                      setLicensingType(type);
                      setLicensingId(type === "NMLS" ? "8849201" : "M22000123");
                    }}
                    className="w-full h-9 px-3 bg-white border border-slate-300 text-black rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="NMLS">NMLS (USA)</option>
                    <option value="FSRA">FSRA (CAN)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-black uppercase font-extrabold tracking-wider">
                    {licensingType === "NMLS" ? "NMLS Unique ID" : "FSRA Licence ID"}
                  </Label>
                  <Input 
                    value={licensingId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (licensingType === "NMLS") {
                        const filtered = val.replace(/[^0-9]/g, "").slice(0, 12);
                        setLicensingId(filtered);
                      } else {
                        const filtered = val.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
                        setLicensingId(filtered);
                      }
                    }}
                    placeholder={licensingType === "NMLS" ? "e.g., 8849201" : "e.g., M-22000123"}
                    className="h-9 text-xs text-black font-mono font-semibold rounded-xl border-slate-300 bg-white" 
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] text-black uppercase font-extrabold tracking-wider">Lender Biography Summary</Label>
                  <button 
                    onClick={handleAiGenBio}
                    className="text-[9px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    AI Writer
                  </button>
                </div>
                <textarea 
                  value={lenderBio} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setLenderBio(val.charAt(0).toUpperCase() + val.slice(1));
                  }} 
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl leading-relaxed text-black font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 h-24"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] text-black uppercase font-extrabold tracking-wider">Licensed Jurisdictions</Label>
                  {additionalRegions.length < 4 && (
                    <button 
                      onClick={addRegionField}
                      className="text-[10.5px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      + Add Jurisdiction
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Input 
                    value={licenseRegion} 
                    onChange={(e) => setLicenseRegion(e.target.value)} 
                    onBlur={(e) => setLicenseRegion(capitalizeWords(e.target.value))}
                    className="h-9 text-xs text-black font-semibold rounded-xl border-slate-300 bg-white" 
                    placeholder="Primary Jurisdiction"
                  />
                  
                  {additionalRegions.map((region, idx) => (
                    <div key={idx} className="flex gap-2 items-center animate-in slide-in-from-top-1 duration-150">
                      <Input 
                        value={region} 
                        onChange={(e) => updateRegionField(idx, e.target.value)} 
                        onBlur={(e) => {
                          const updated = [...additionalRegions];
                          updated[idx] = capitalizeWords(region);
                          setAdditionalRegions(updated);
                        }}
                        className="h-9 text-xs text-black font-semibold rounded-xl border-slate-300 bg-white flex-1" 
                        placeholder={`Additional Jurisdiction #${idx + 1}`}
                      />
                      <button 
                        onClick={() => removeRegionField(idx)}
                        className="text-red-500 hover:text-red-600 hover:bg-slate-50 p-1.5 rounded-lg cursor-pointer transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSaveProfile} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold h-10 rounded-xl text-xs cursor-pointer mt-2">
                Save Compliance Records
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Right columns: Lead synchronisation logs + Pairing invitations */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Pairing Link / Invitations */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
              <CardTitle className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-600" />
                ACTIVE AGENT PAIRINGS
              </CardTitle>
              <CardDescription className="text-xs text-black font-semibold">
                Lenders can accept invitations from agents or share their pairing link to establish a co-op mapping instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              
              {/* Pairing Link Block */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex flex-col sm:flex-row items-center gap-4 text-left">
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-extrabold text-slate-950 uppercase tracking-wider flex items-center gap-1">
                    <Link2 className="h-3.5 w-3.5 text-blue-600" />
                    Your Secret Invite Link
                  </p>
                  <p className="text-[10px] text-black font-semibold">
                    Agents who register or login using this link are instantly assigned to your co-op panel.
                  </p>
                  <div className="text-[10.5px] bg-white border border-slate-200 font-mono px-3 py-1 text-slate-600 select-all overflow-x-auto rounded">
                    {pairingLink}
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto self-stretch sm:self-center justify-end">
                  <Button onClick={handleCopyLink} size="sm" className="bg-white hover:bg-slate-100 text-slate-800 border text-xs font-bold rounded-xl h-10 flex-1 sm:flex-none cursor-pointer">
                    Copy Link
                  </Button>
                  <Button onClick={handleAiOnboardingInvite} size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 text-xs font-bold gap-1 p-0.5 max-w-[120px] mx-auto sm:mx-0">
                    <Sparkles className="h-3 w-3" />
                    Draft Invite
                  </Button>
                </div>
              </div>

              {/* Paired Agents Grid lists */}
              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-black text-left font-mono">Paired Agents Directory</p>
                
                <div className="border rounded-2xl overflow-hidden divide-y">
                  {pairedAgents.map((agent) => (
                    <div key={agent.id} className="p-4 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                          {agent.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-900 leading-none">{agent.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1 leading-none">{agent.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-x-6 w-full sm:w-auto font-mono text-[10px]">
                        <div>
                          <span className="text-slate-400">Inventory:</span>
                          <span className="text-slate-800 font-black ml-1.5">{agent.activeListings} listings</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Paired:</span>
                          <span className="text-slate-600 ml-1.5">{agent.joinedAt}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setPendingUnpairAgent({ id: agent.id, name: agent.name });
                          }}
                          className="text-red-500 hover:text-red-600 hover:underline cursor-pointer font-sans text-[10px] font-extrabold uppercase leading-none"
                        >
                          Unpair
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct invitation input form */}
              <form onSubmit={handleInviteAgent} className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="flex-1 space-y-1 text-left">
                  <Input 
                    placeholder="Enter agent email address to launch invite..." 
                    value={newAgentEmail}
                    onChange={(e) => setNewAgentEmail(e.target.value)}
                    type="email"
                    className="h-10 text-xs sm:text-sm rounded-xl border-slate-200"
                  />
                </div>
                <Button type="submit" className="bg-slate-950 hover:bg-slate-800 text-white font-extrabold h-10 rounded-xl px-5 text-xs cursor-pointer">
                  Request Relationship Assignment
                </Button>
              </form>

            </CardContent>
          </Card>

          {/* Consent Leads Checkbox & Routing webhook sync */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
              <CardTitle className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                MORTGAGE LEAD INTEGRATION (CONSENT LOCKED)
              </CardTitle>
              <CardDescription className="text-xs text-black font-semibold">
                Curb Hero model compliance: Leads are strictly sent to lender partner database ONLY when they explicitly check interest on mortgage rate option checkbox guidelines.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              
              {/* Leads dashboard list log */}
              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-black text-left font-mono">Consenting Buyer Leads Pipeline</p>
                
                <div className="border rounded-2xl overflow-hidden divide-y divide-slate-100 font-sans">
                  {leads.map((lead) => (
                    <div key={lead.id} className="p-4 bg-white hover:bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900 leading-none">{lead.name}</span>
                          <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                            {lead.verified}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono">
                          {lead.email} • {lead.phone}
                        </p>
                        <p className="text-[10.5px] text-slate-500">
                          Captured at open house: <strong className="text-slate-700 font-semibold">{lead.listing}</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[10px] leading-none self-stretch sm:self-center justify-between sm:justify-start">
                        <div className="text-right">
                          <p className="text-slate-400">Consent Log:</p>
                          <p className="text-slate-600 mt-1 font-semibold">{lead.optInTime}</p>
                        </div>
                        <span className="px-2 py-1 text-[8.5px] font-mono leading-none font-bold bg-blue-50 text-blue-600 rounded">
                          {lead.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Webhook Sync configuration */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 text-left space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-slate-950 uppercase tracking-wider flex items-center gap-1">
                    <Database className="h-3.5 w-3.5 text-blue-600" />
                    LENDER CRM WEBHOOK INTEGRATION
                  </p>
                  <p className="text-[10.5px] text-black font-semibold">
                    Instantly sync leads with consent flags straight into TotalExpert, Floify, Encompass, or custom CRM solutions.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input 
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://yourlendingcrm.com/api/v1/webhook"
                    className="flex-1 bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
                  />
                  <Button 
                    onClick={handleTriggerWebhookTest}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold h-10 px-5 text-xs rounded-xl hover:shadow-sm cursor-pointer"
                  >
                    Send Simulation Payload
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Broker/Office Override controls */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden text-left">
            <CardHeader className="bg-slate-50/50 border-b border-sidebar p-5">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <FolderLock className="h-4 w-4 text-emerald-600" />
                Office Cascading & Routing Precedence
              </CardTitle>
              <CardDescription className="text-xs text-black font-semibold">
                Configure cascading priorities representing teams or regional brokerage rules. Correct rules fallback hierarchy and your reference level.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              
              <div className="relative pl-6 border-l-2 border-blue-500/30 space-y-4">
                
                {/* 1. Listing override */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 h-4 w-4 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-[8.5px] uppercase font-mono">1</div>
                  <h4 className="text-xs font-bold text-slate-950 leading-tight">Listing-Level Specific Override</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Agents can disable partnered lenders or swap lenders individually on a given listing, hiding or showing custom rate checkboxes.</p>
                </div>

                {/* 2. Office level */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 h-4 w-4 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-[8.5px] uppercase font-mono">2</div>
                  <h4 className="text-xs font-bold text-slate-950 leading-tight">Brokerage Office/Team Preferred Selection Override</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Broker administrators can mandate global corporate lender defaults on all listings for subordinate agents automatically.</p>
                </div>

                {/* 3. Agent level */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 h-4 w-4 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-[8.5px] uppercase font-mono">3</div>
                  <h4 className="text-xs font-bold text-slate-950 leading-tight">Agent Preferred Partner Pairing</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Active relationship mappings established through agent invitations or personal QR registers.</p>
                </div>

                {/* 4. Default */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 h-4 w-4 bg-zinc-500 text-white rounded-full flex items-center justify-center font-bold text-[8.5px] uppercase font-mono">4</div>
                  <h4 className="text-xs font-bold text-slate-950 leading-tight">Regional Marketplace Default Lender</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Dynamic system assign when no listing, team, or agent preferred preferred records exist.</p>
                </div>

              </div>

              {/* Interactivity controls */}
              <div className="pt-4 border-t grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-extrabold text-black">Your Preference Level</Label>
                  <select 
                    value={overridePriority}
                    onChange={(e) => {
                      setOverridePriority(e.target.value as any);
                      toast.info(`Updated precedence rules selection schema to ${e.target.value}`);
                    }}
                    className="w-full h-10 px-3 bg-white border border-slate-300 text-black rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="listing">Listing-level Override Enabled</option>
                    <option value="office">Team/Office Default Enforced</option>
                    <option value="agent">Agent Preferred Assigned Only</option>
                    <option value="default">System Marketplace Default Assignment</option>
                  </select>
                </div>

                <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200/50 cursor-pointer select-none self-end h-10">
                  <input
                    type="checkbox"
                    checked={officeEnforced}
                    onChange={(e) => {
                      setOfficeEnforced(e.target.checked);
                      toast.success(e.target.checked ? "Enforced office override defaults across agent panels!" : "Removed brokerage default enforcement.");
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <div className="text-left leading-tight">
                    <p className="text-xs font-extrabold text-slate-800">Enforce Office Override</p>
                    <p className="text-[9px] text-slate-400">Lock subordinate agent configs.</p>
                  </div>
                </label>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>
      )}

      {/* 4. MODALS & CONFIRMATIONS */}
      {/* A. Tier Change Confirmation Model */}
      {pendingTier && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl p-6 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              CONFIRM MEMBERSHIP CHANGE
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to switch your active Real Estate Partnership account to the <strong className="text-slate-900">{pendingTier.name}</strong> tier for <strong className="text-slate-900">{pendingTier.p}</strong>?
            </p>
            <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Plan Highlights</p>
              <p className="text-xs text-slate-700 mt-1 font-semibold">{pendingTier.d}</p>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setPendingTier(null)} 
                className="rounded-xl text-xs h-10 px-4 cursor-pointer font-bold border-slate-200 hover:bg-slate-50 text-slate-800"
              >
                No, Keep Current Plan
              </Button>
              <Button 
                onClick={confirmTierChange} 
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs h-10 px-4 font-black cursor-pointer shadow-md"
              >
                Yes, Change Tier
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* B. Save Compliance Confirmation Alert */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-100 shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircle className="h-6 w-6 animate-pulse" />
            </div>
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">
              RECORDS SAVED SUCCESSFULLY
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Your Lender Compliance Profile credentials, bio, and licensed jurisdictions have been persistently stored and logged into security audit-trail ledger.
            </p>
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={confirmSaveProfile} 
                className="bg-slate-950 hover:bg-slate-800 text-white font-extrabold px-6 h-10 rounded-xl text-xs cursor-pointer shadow-md w-full"
              >
                Got it, thank you!
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* C. Agent Unpair Confirmation */}
      {pendingUnpairAgent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl p-6 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-red-600 uppercase tracking-wider flex items-center gap-2">
              <Users className="h-5 w-5" />
              CONFIRM AGENT UNPAIRING
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to completely disconnect your co-op relationship and split marketing with agent <strong className="text-slate-900">{pendingUnpairAgent.name}</strong>?
            </p>
            <p className="text-[10px] text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100 font-medium leading-relaxed mt-4">
              ⚠️ Warning: Unpairing immediately disables synchronized mortgage lead queues and rate integrations on live kiosks for this agent.
            </p>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setPendingUnpairAgent(null)} 
                className="rounded-xl text-xs h-10 px-4 cursor-pointer font-bold border-slate-200 hover:bg-slate-50 text-slate-800"
              >
                No, Keep Relationship
              </Button>
              <Button 
                onClick={confirmUnpair} 
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs h-10 px-4 font-black cursor-pointer shadow-md"
              >
                Yes, Unpair Agent
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* D. Jurisdiction Deletion Confirmation */}
      {pendingDeleteRegionIdx !== null && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-100 shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="h-12 w-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 className="h-6 w-6 font-bold" />
            </div>
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">
              DELETE JURISDICTION?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to delete the licensed jurisdiction <strong>"{additionalRegions[pendingDeleteRegionIdx] || `Additional Jurisdiction #${pendingDeleteRegionIdx + 1}`}"</strong>?
            </p>
            
            <div className="flex items-center justify-center gap-3 mt-6 w-full">
              <Button 
                variant="outline" 
                onClick={() => setPendingDeleteRegionIdx(null)} 
                className="rounded-xl text-xs h-10 px-4 cursor-pointer font-extrabold border-slate-200 hover:bg-slate-50 text-slate-800 flex-1"
              >
                No, Keep
              </Button>
              <Button 
                onClick={() => {
                  setAdditionalRegions(additionalRegions.filter((_, i) => i !== pendingDeleteRegionIdx));
                  toast.success("✨ Jurisdiction record successfully deleted.");
                  setPendingDeleteRegionIdx(null);
                }} 
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs h-10 px-4 font-black cursor-pointer shadow-md flex-1"
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* E. Solo Agent Active Lender Swap Multi-Billing Modal */}
      {swapLenderModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl p-6 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-amber-600 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Solo Agent Single Pairing Swap
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              On your current <strong className="text-slate-900">Solo Agent Plan</strong>, you can only co-brand with **one active paired lender** at a time.
            </p>
            <div className="my-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold pl-2 border-l-2 border-red-400">
                <span className="text-slate-500">Disconnect Active:</span>
                <span className="text-red-900 font-extrabold">{swapLenderModal.oldLender?.name} ({swapLenderModal.oldLender?.company})</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold pl-2 border-l-2 border-emerald-500">
                <span className="text-slate-500">Connect New:</span>
                <span className="text-emerald-950 font-extrabold">{swapLenderModal.newLender?.name} ({swapLenderModal.newLender?.company})</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Confirming this swap will immediately unpair your previous active lender. All co-branded open house listings will automatically reflect the new rate sponsor.
            </p>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setSwapLenderModal(null)} 
                className="rounded-xl text-xs h-10 px-4 cursor-pointer font-bold border-slate-200 hover:bg-slate-50 text-slate-800"
              >
                Cancel, Keep Active
              </Button>
              <Button 
                onClick={handleConfirmSwap} 
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs h-10 px-4 font-black cursor-pointer shadow-md"
              >
                Yes, Disconnect & Swap
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Convenience Relationship Confirmation Modal */}
      {deleteSavedLenderConfirm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-100 shadow-2xl p-6 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-rose-600 uppercase tracking-wider flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Relationship?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to delete your saved convenience backup relationship with <strong className="text-slate-900">{deleteSavedLenderConfirm.name}</strong>?
            </p>
            <p className="text-[10px] text-slate-400 mt-2 leading-normal">
              This action cannot be undone. You will need to re-add their representative profile parameters manually to restore this entry.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setDeleteSavedLenderConfirm(null)} 
                className="rounded-xl text-xs h-10 px-4 cursor-pointer font-bold border-slate-200 hover:bg-slate-50 text-slate-800"
              >
                Cancel, Keep It
              </Button>
              <Button 
                onClick={handleExecuteDeleteSavedLender} 
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs h-10 px-4 font-black cursor-pointer shadow-md"
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unpair Active Lender Confirmation Modal */}
      {showUnpairLenderConfirm && activeLender && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-100 shadow-2xl p-6 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-rose-600 uppercase tracking-wider flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Unpair Active Lender?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to completely unpair <strong className="text-slate-900">{activeLender.name}</strong> as your active rate sponsor?
            </p>
            <p className="text-[10px] text-slate-400 mt-2 leading-normal">
              This will disable active lender co-branding and hide mortgage-related question sections on all live sign-in kiosks until you connect another lending partner.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowUnpairLenderConfirm(false)} 
                className="rounded-xl text-xs h-10 px-4 cursor-pointer font-bold border-slate-200 hover:bg-slate-50 text-slate-800"
              >
                Cancel, Keep Lender
              </Button>
              <Button 
                onClick={handleExecuteUnpairActiveLender} 
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs h-10 px-4 font-black cursor-pointer shadow-md"
              >
                Yes, Unpair Lender
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* F. Save Custom Convenience Backup Lender Relationship */}
      {inviteSavedModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-100 shadow-2xl p-6 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-600" />
                Add Convenience Backup Partner
              </h3>
              <button 
                onClick={() => setInviteSavedModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddSavedLender} className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Lender Representative Name</Label>
                <Input 
                  placeholder="e.g. Richard Vance" 
                  value={inviteSavedName}
                  onChange={(e) => setInviteSavedName(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Institution / Company Name</Label>
                <Input 
                  placeholder="e.g. Sovereign Savings & Trust" 
                  value={inviteSavedCompany}
                  onChange={(e) => setInviteSavedCompany(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">
                  {complianceCountry === "US" ? "NMLS ID Code (Mandatory)" : "Provincial License ID (Mandatory)"}
                </Label>
                <Input 
                  placeholder={complianceCountry === "US" ? "e.g. NMLS #3021948" : "e.g. FSRA License #5549021"} 
                  value={inviteSavedNmls}
                  onChange={(e) => setInviteSavedNmls(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Contact Email</Label>
                <Input 
                  type="email"
                  placeholder="name@institution.com" 
                  value={inviteSavedEmail}
                  onChange={(e) => setInviteSavedEmail(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-500">Representative Phone</Label>
                <Input 
                  placeholder="+1 (555) 555-5555" 
                  value={inviteSavedPhone}
                  onChange={(e) => setInviteSavedPhone(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setInviteSavedModalOpen(false)}
                  className="rounded-lg text-xs h-9 font-semibold border-slate-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 h-9 rounded-lg text-xs cursor-pointer shadow-sm"
                >
                  Record Saved Relationship
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
