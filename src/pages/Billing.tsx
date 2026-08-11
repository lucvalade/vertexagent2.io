import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { 
  CreditCard, 
  CheckCircle, 
  Package, 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  Layers, 
  Sparkles, 
  Building, 
  Lock, 
  User, 
  CheckCircle2, 
  HelpCircle,
  HelpCircle as InfoIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

const BillingModal = ({ title, children, onConfirm, confirmText, confirmVariant = "primary", onClose, isProcessing }: any) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
  >
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-left"
    >
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
          <X className="h-5 w-5 text-slate-400" />
        </button>
      </div>
      <div className="p-6">
        {children}
      </div>
      <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
        <button 
          disabled={isProcessing}
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button 
          disabled={isProcessing}
          onClick={onConfirm}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-sm cursor-pointer ${
            confirmVariant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          } disabled:opacity-50`}
        >
          {isProcessing ? "Processing..." : confirmText}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

export default function Billing() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const planParam = searchParams.get("plan");

  const [activeModal, setActiveModal] = useState<"upgrade" | "payment" | "cancel" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardData, setCardData] = useState({ number: "", expiry: "", cvc: "" });
  const [selectedPlanId, setSelectedPlanId] = useState("team_pro");
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const planDetails: Record<string, { title: string; price: string; features: string[] }> = {
    free: {
      title: "Solo Agent Starter",
      price: "Free",
      features: [
        "Support SLA: Level 1 Standard (< 24 hrs response)",
        "1 Active Listing",
        "Kiosk Sign-In Mode with PIN Lock",
        "15 Gemini Mins/mo (3-min session max)",
        "Basic Sora AI Assistant (3-5 turns)",
        "English language only",
        "1 Linked Lender limit",
        "50 visitor sessions / month",
        "7-day data storage retention"
      ]
    },
    starter: {
      title: "Starter Agent",
      price: "$14/month",
      features: [
        "Support SLA: Level 2 Priority (< 4 hrs response)",
        "1 Active Listing",
        "CRM Syncing Integration (FUB, etc.)",
        "30 Gemini Mins/mo (5-min session max)",
        "Basic Sora AI Assistant (5-10 turns)",
        "Solo data local captures",
        "Standard client profiles"
      ]
    },
    pro: {
      title: "Pro Agent",
      price: "$29/month",
      features: [
        "Support SLA: Level 2 Priority (< 4 hrs response)",
        "Up to 25 Active Listings",
        "300 Gemini Mins/mo (15-min session max)",
        "All 70 Multilingual AI Languages",
        "Advanced Sora (unlimited Q&A + memory)",
        "Full Custom Branding & Media Manifest",
        "Automated Follow-Up and email drafts",
        "Buyer Intent Analytics dashboard",
        "Full CRM integrations with custom mapping",
        "500 visitor sessions / month"
      ]
    },
    team: {
      title: "Team Pro",
      price: "From $149/month",
      features: [
        "Support SLA: Level 2 Priority (< 4 hrs response)",
        "1,500 Gemini Live API Voice Mins/mo (30-min session max)",
        "Team-level listings visibility & roster settings",
        "Enforce team lender block-policies globally",
        "Shared lead distribution & notifications",
        "Team-routing logic configurations"
      ]
    },
    brokerage: {
      title: "Brokerage Office",
      price: "From $399/month",
      features: [
        "Support SLA: Level 3 VIP Concierge (< 30 mins live response)",
        "Unlimited Gemini Live API Voice Mins/mo",
        "Unlimited office-wide listing rules & logs",
        "Custom branded portal domain & overrides",
        "Multi-avatar & brokerage-wide template sync",
        "Office default lenders & team policy overrides"
      ]
    },
    lender: {
      title: "Sponsoring Lender Plan",
      price: "$20 to $100/month",
      features: [
        "Support SLA: Partner Priority Support (< 2 hrs response)",
        "Active B2B partnership seat subscriptions",
        "Direct client routing queues upon explicit opt-in",
        "Co-branding on open house kiosks",
        "Receive shared files & lead notifications"
      ]
    }
  };

  useEffect(() => {
    if (planParam) {
      if (["agent_free", "agent_starter", "team_starter", "team_pro", "team_elite", "lender_pro"].includes(planParam)) {
        setSelectedPlanId(planParam);
        setActiveModal("upgrade");
        // Clear param so it only triggers once
        setSearchParams({}, { replace: true });
      }
    }
  }, [planParam, setSearchParams]);

  // Local storage logs helper for simulation feedback
  const logAction = (msg: string, isDowngrade = false) => {
    const savedLogs = localStorage.getItem('system_notifications') || '[]';
    const logs = JSON.parse(savedLogs);
    logs.unshift({
      id: Date.now(),
      type: 'BILLING_CHANGE',
      message: msg,
      actor: user?.name || 'Authorized Session',
      time: 'Just now'
    });
    localStorage.setItem('system_notifications', JSON.stringify(logs));
  };

  const handleUpdateSubscription = async (accountType: string, status: string, plan: string) => {
    if (!user?.id) {
      toast.error("You must be logged in to update subscriptions");
      return;
    }
    setIsProcessing(true);
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        accountType,
        subscriptionStatus: status,
        subscriptionPlan: plan,
        updatedAt: Date.now()
      });

      toast.success("Role & Plan Updated", {
        description: `Successfully switched to "${accountType.toUpperCase()}" with plan "${plan.toUpperCase()}" (${status}).`
      });
      logAction(`Simulated account update: ${accountType} - ${plan} (${status})`);
    } catch (e: any) {
      console.error(e);
      toast.error("Firestore update failed: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgradePlan = async () => {
    if (!user?.id) return;
    setIsProcessing(true);
    try {
      let targetType: "agent" | "team_admin" | "brokerage_admin" | "lender" = "agent";
      let targetPlan = "free";

      if (selectedPlanId === "agent_free") {
        targetType = "agent";
        targetPlan = "free";
      } else if (selectedPlanId === "agent_starter" || selectedPlanId === "team_starter") {
        targetType = "agent";
        targetPlan = "starter";
      } else if (selectedPlanId === "team_pro" || selectedPlanId === "agent_pro") {
        targetType = "agent";
        targetPlan = "pro";
      } else if (selectedPlanId === "team_elite") {
        targetType = "brokerage_admin";
        targetPlan = "brokerage";
      } else if (selectedPlanId === "lender_pro") {
        targetType = "lender";
        targetPlan = "pro";
      }

      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        accountType: targetType,
        subscriptionStatus: "active",
        subscriptionPlan: targetPlan,
        updatedAt: Date.now()
      });

      toast.success("Tier upgrade successful!", {
        description: `Your account is now configured as a ${targetType.toUpperCase()} with the "${targetPlan.toUpperCase()}" package.`
      });
      logAction(`Upgraded tier to: ${targetType} - ${targetPlan}`);
      setActiveModal(null);
    } catch (e: any) {
      toast.error("Error upgrading: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.id) return;
    setIsProcessing(true);
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        subscriptionStatus: "canceled",
        updatedAt: Date.now()
      });

      toast.success("Subscription canceled", {
        description: "Your team account rules have been immediately suspended."
      });
      logAction("Canceled premium subscription");
      setActiveModal(null);
    } catch (e: any) {
      toast.error("Error canceling: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Human readable roles
  const getRoleLabel = (type?: string) => {
    switch (type) {
      case "agent": return "Solo Agent";
      case "team_admin": return "Team Admin";
      case "brokerage_admin": return "Brokerage Admin";
      case "lender": return "Lending Partner";
      case "compliance_admin": return "Compliance Officer";
      case "platform_admin": return "Platform Admin";
      default: return "Solo Agent";
    }
  };

  const currentRole = user?.accountType || "agent";
  const currentStatus = user?.subscriptionStatus || "active";
  const currentPlan = user?.subscriptionPlan || "free";

  return (
    <div className="space-y-8 text-left max-w-6xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Billing & Monetization</h1>
          <p className="text-slate-500 mt-1">Simulate transitions between freemium agents, paid team structures, and subscribed lenders.</p>
        </div>
      </div>

      {/* SPECIAL SANDBOX MODE PANEL */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-100 rounded-2xl p-6 shadow-md shadow-blue-100/50">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="font-extrabold text-blue-900 text-sm uppercase tracking-wide">Interactive B2B SaaS Simulation Deck</h2>
        </div>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          As a developer testing <strong>AI Open House Connect</strong>, you can use the simulation deck below to instantly toggle your account rules. This writes directly to your active Firebase document, updating sidebar locks, warning alerts, and co-branding parameters instantly.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* STEP 1: Account Roles */}
          <div className="bg-white border border-slate-150 rounded-xl p-4 space-y-3 relative">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-blue-500" /> 1. Account Roles & Subtypes
            </h3>
            <div className="grid gap-2">
              <button 
                onClick={() => handleUpdateSubscription("agent", currentStatus, "free")}
                onMouseEnter={() => setHoveredPlan("free")}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`w-full py-2 px-3 text-xs text-left rounded-lg font-bold flex items-center justify-between border transition-all ${
                  currentRole === 'agent' && currentPlan === 'free'
                    ? 'bg-blue-500 text-white border-blue-600 shadow-sm' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>Solo Agent (Free)</span>
                {currentRole === 'agent' && currentPlan === 'free' && <CheckCircle className="h-3.5 w-3.5" />}
              </button>

              <button 
                onClick={() => handleUpdateSubscription("agent", currentStatus, "starter")}
                onMouseEnter={() => setHoveredPlan("starter")}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`w-full py-2 px-3 text-xs text-left rounded-lg font-bold flex items-center justify-between border transition-all ${
                  currentRole === 'agent' && currentPlan === 'starter'
                    ? 'bg-blue-500 text-white border-blue-600 shadow-sm' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>Starter Agent ($14/mo)</span>
                {currentRole === 'agent' && currentPlan === 'starter' && <CheckCircle className="h-3.5 w-3.5" />}
              </button>

              <button 
                onClick={() => handleUpdateSubscription("agent", currentStatus, "pro")}
                onMouseEnter={() => setHoveredPlan("pro")}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`w-full py-2 px-3 text-xs text-left rounded-lg font-bold flex items-center justify-between border transition-all ${
                  currentRole === 'agent' && currentPlan === 'pro'
                    ? 'bg-blue-500 text-white border-blue-600 shadow-sm' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>Pro Agent ($29/mo)</span>
                {currentRole === 'agent' && currentPlan === 'pro' && <CheckCircle className="h-3.5 w-3.5" />}
              </button>

              <button 
                onClick={() => handleUpdateSubscription("team_admin", currentStatus, "pro")}
                onMouseEnter={() => setHoveredPlan("team")}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`w-full py-2 px-3 text-xs text-left rounded-lg font-bold flex items-center justify-between border transition-all ${
                  currentRole === 'team_admin' 
                    ? 'bg-blue-500 text-white border-blue-600 shadow-sm' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>Team Admin (Paid)</span>
                {currentRole === 'team_admin' && <CheckCircle className="h-3.5 w-3.5" />}
              </button>

              <button 
                onClick={() => handleUpdateSubscription("brokerage_admin", currentStatus, "elite")}
                onMouseEnter={() => setHoveredPlan("brokerage")}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`w-full py-2 px-3 text-xs text-left rounded-lg font-bold flex items-center justify-between border transition-all ${
                  currentRole === 'brokerage_admin' 
                    ? 'bg-blue-500 text-white border-blue-600 shadow-sm' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>Brokerage Admin</span>
                {currentRole === 'brokerage_admin' && <CheckCircle className="h-3.5 w-3.5" />}
              </button>

              <button 
                onClick={() => handleUpdateSubscription("lender", currentStatus, "pro")}
                onMouseEnter={() => setHoveredPlan("lender")}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`w-full py-2 px-3 text-xs text-left rounded-lg font-bold flex items-center justify-between border transition-all ${
                  currentRole === 'lender' 
                    ? 'bg-blue-500 text-white border-blue-600 shadow-sm' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>Sponsoring Lender (Pro)</span>
                {currentRole === 'lender' && <CheckCircle className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* HOVER TOOLTIP POPUP */}
            {hoveredPlan && planDetails[hoveredPlan] && (
              <div className="absolute z-30 left-0 right-0 top-full mt-2 p-4 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 pointer-events-none">
                <div className="flex justify-between items-center border-b border-slate-700 pb-1.5">
                  <span className="font-bold text-sm text-blue-400">{planDetails[hoveredPlan].title}</span>
                  <span className="font-extrabold text-xs text-emerald-400">{planDetails[hoveredPlan].price}</span>
                </div>
                <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-300">
                  {planDetails[hoveredPlan].features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* STEP 2: Subscription Status */}
          <div className="bg-white border border-slate-150 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 text-indigo-500 animate-spin-slow" /> 2. Subscription Status
            </h3>
            <div className="grid gap-2">
              <button 
                onClick={() => handleUpdateSubscription(currentRole, "active", currentPlan)}
                className={`w-full py-2 px-3 text-xs text-left rounded-lg font-bold flex items-center justify-between border transition-all ${
                  currentStatus === 'active' 
                    ? 'bg-indigo-500 text-white border-indigo-600 shadow-sm' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>Active Status (Default)</span>
                {currentStatus === 'active' && <CheckCircle className="h-3.5 w-3.5" />}
              </button>

              <button 
                onClick={() => handleUpdateSubscription(currentRole, "past_due", currentPlan)}
                className={`w-full py-2 px-3 text-xs text-left rounded-lg font-bold flex items-center justify-between border transition-all ${
                  currentStatus === 'past_due' 
                    ? 'bg-indigo-500 text-white border-indigo-600 shadow-sm' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>Past Due / Suspension</span>
                {currentStatus === 'past_due' && <CheckCircle className="h-3.5 w-3.5" />}
              </button>

              <button 
                onClick={() => handleUpdateSubscription(currentRole, "canceled", currentPlan)}
                className={`w-full py-2 px-3 text-xs text-left rounded-lg font-bold flex items-center justify-between border transition-all ${
                  currentStatus === 'canceled' 
                    ? 'bg-indigo-500 text-white border-indigo-600 shadow-sm' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>Canceled Status</span>
                {currentStatus === 'canceled' && <CheckCircle className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* STEP 3: Active Rule Diagnostics */}
          <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Active Gating Rules Check
              </h3>
              <div className="text-xs text-slate-600 space-y-2 mt-1">
                <p>
                  <strong>Role:</strong> <span className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded">{getRoleLabel(currentRole)}</span>
                </p>
                <p>
                  <strong>Package Plan:</strong> <span className="text-blue-600 font-extrabold uppercase">{currentPlan === "free" ? "Solo Agent" : currentPlan}</span>
                </p>
                <p>
                  <strong>State Code:</strong>{" "}
                  <span className={`font-bold uppercase ${currentStatus === 'active' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {currentStatus}
                  </span>
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 mt-3">
              <p className="text-[10px] text-slate-500 italic leading-snug">
                {currentRole === 'agent' && currentPlan === 'free' && "✅ Core walkthroughs, sign-ins, and standard CRM mapping are fully bypassed from limits in Solo Agent."}
                {currentRole === 'agent' && currentPlan === 'starter' && "✅ Starter Plan activated. Automated CRM integration is unlocked with full custom tag and field mapping."}
                {currentRole === 'agent' && currentPlan === 'pro' && "💎 Pro Agent Plan activated. Immersive 24-language AI tours with custom knowledge bases are unlocked."}
                {currentRole === 'team_admin' && currentStatus === 'active' && "💎 Brokerage controls are ACTIVE. Automatic co-hosted listings are enabled."}
                {currentRole === 'team_admin' && (currentStatus === 'past_due' || currentStatus === 'canceled') && "⛔ Brokerage rule limits apply: co-branded shared listings deactivated, team overrides reverted."}
                {currentRole === 'lender' && "🏦 Mortgage tracking partner is designated. Setup sponsorship status details on Lenders Page."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ORIGINAL BILLING STATS GRID */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-left relative overflow-hidden">
            {currentStatus !== 'active' && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse" />
            )}
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Active Account: {getRoleLabel(currentRole)}</h2>
                <p className="text-slate-500 text-sm mt-1">
                  {currentPlan === 'free' ? "Free Solo Plan ($0/mo)" : 
                   currentPlan === 'starter' ? "Starter Plan: Automated CRM Integration ($14/mo)" :
                   currentPlan === 'pro' && currentRole === 'agent' ? "Pro Plan: Advanced Conversational AI ($29/mo)" :
                   currentPlan === 'pro' && currentRole === 'lender' ? "Sponsoring Lender Plan ($20/mo)" :
                   currentPlan === 'pro' ? "Team Pro Plan ($149/mo)" :
                   (currentPlan === 'elite' || currentPlan === 'brokerage') ? "Brokerage Plan ($399/mo)" : 
                   `Premium Package: ${currentPlan.toUpperCase()}`}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                currentStatus === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200 animate-bounce'
              }`}>
                {currentStatus.toUpperCase()}
              </span>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4 border-t border-b border-slate-100 py-6 my-6">
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">Included Features Check</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle className="h-4 w-4 text-emerald-500" /> Unlimited Lead Capture Kiosks
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <CheckCircle className="h-4 w-4 text-emerald-500" /> Multilingual Sora Guides
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <CheckCircle className="h-4 w-4 text-emerald-500" /> Direct Follow Up Boss Integrations
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-905 text-xs uppercase tracking-wide">Org Level Gating</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    {currentRole === 'agent' ? (
                      <Lock className="h-4 w-4 text-amber-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-indigo-500" />
                    )} 
                    Shared Listing Cross-Hosting {currentRole === 'agent' ? '(Team Admin only)' : '(Unlocked)'}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    {currentRole === 'agent' ? (
                      <Lock className="h-4 w-4 text-amber-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-indigo-500" />
                    )} 
                    Centralized Office Overrides
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setActiveModal("upgrade")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-100 cursor-pointer"
              >
                Change or Upgrade Plan
              </button>
              {currentPlan !== 'free' && (
                <button 
                  onClick={() => setActiveModal("cancel")}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-left">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-slate-500" /> Secondary Payment Method
            </h2>
            <div className="flex items-center justify-between border rounded-xl p-4 border-slate-150">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <CreditCard className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm">Visa ending in 4242</div>
                  <div className="text-xs text-slate-500">Expires 12/28 • Active B2B Gateway</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setCardData({ number: "", expiry: "", cvc: "" });
                  setActiveModal("payment");
                }}
                className="text-blue-600 text-xs font-black uppercase hover:underline cursor-pointer border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-1 border border-slate-200 rounded-2xl bg-white p-6 shadow-sm text-left space-y-6">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Package className="h-5 w-5 text-slate-500" /> CRM Gating Indicators
          </h2>

          <div className="space-y-5 text-xs">
            <div>
              <div className="flex justify-between font-bold mb-1.5 uppercase text-slate-500 tracking-wider">
                <span>Active Listings Range</span>
                <span className="text-slate-900">3 / {currentRole === 'agent' ? 'Unlimited' : 'Unlimited'}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-bold mb-1.5 uppercase text-slate-500 tracking-wider">
                <span>Direct CRM Handsoff</span>
                <span className="text-slate-900">32 leads forwarded</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 text-[11px] text-blue-800 leading-relaxed">
              <span className="font-extrabold uppercase">Sora Guidance:</span> Solo Agents enjoy 100% free CRM push, 1 associated preferred lender, and robust local caching for open houses.
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED SaaS TIER TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Layers className="h-6 w-6 text-blue-600" /> B2B SaaS Tiers Directory
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          {/* TIER 1: Solo Free */}
          <div className="border border-slate-150 rounded-2xl p-5 space-y-4 hover:border-slate-350 transition-colors flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Captures Leads</span>
                <h3 className="font-extrabold text-lg text-slate-900">Solo</h3>
                <p className="font-extrabold text-blue-600 text-xl font-mono">Free</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed min-h-[64px]">Ditch the paper sheets. Run unlimited, offline-capable open house sign-ins and organize your client contacts within a clean local workspace.</p>
              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> 1 active property listing</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Unlimited basic sign-ins</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> <span className="font-extrabold text-black">15 Gemini Mins/mo (3-min session max)</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Secure offline buffer with sync</div>
                <div className="flex items-center gap-2 font-bold text-slate-800"><ShieldCheck className="h-4 w-4 text-blue-500 shrink-0" /> Level 1 Standard Support (&lt;24h)</div>
              </div>
            </div>
          </div>

          {/* TIER 2: Starter */}
          <div className="border border-slate-150 rounded-2xl p-5 space-y-4 hover:border-slate-350 transition-colors flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-500">Connects Them</span>
                <h3 className="font-extrabold text-lg text-slate-900">Starter</h3>
                <p className="font-extrabold text-blue-600 text-xl font-mono">$14 / mo</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed min-h-[64px]">Keep your database updated automatically. Syncs every captured lead directly to your Follow Up Boss or kvCORE CRM with zero manual effort.</p>
              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Everything in Solo included</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> <span className="font-extrabold text-black">30 Gemini Mins/mo (5-min session max)</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Automated CRM synchronization</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> FUB custom tag & field mapping</div>
                <div className="flex items-center gap-2 font-bold text-slate-800"><ShieldCheck className="h-4 w-4 text-blue-500 shrink-0" /> Level 2 Priority Support (&lt;4h)</div>
              </div>
            </div>
          </div>

          {/* TIER 3: Pro */}
          <div className="border border-blue-200 bg-blue-50/10 rounded-2xl p-5 space-y-4 relative flex flex-col justify-between">
            <span className="absolute top-4 right-4 bg-blue-100 text-blue-700 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full tracking-wide">Closes Them</span>
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-blue-600">Most Popular</span>
                <h3 className="font-extrabold text-lg text-slate-900">Pro</h3>
                <p className="font-extrabold text-blue-600 text-xl font-mono">$29 / mo</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed min-h-[64px]">Turn listings into immersive interactive experiences. Engages buyers in 24 languages, guided by custom knowledge bases and advanced voice tours.</p>
              <div className="border-t border-slate-150 pt-3 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /> Everything in Starter included</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /> <span className="font-extrabold text-blue-800">300 Gemini Mins/mo (15-min session max)</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /> Full 24-language translation</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /> Advanced Conversational Sora</div>
                <div className="flex items-center gap-2 font-bold text-blue-900"><ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" /> Level 2 Priority Support (&lt;4h)</div>
              </div>
            </div>
          </div>

          {/* TIER 4: Brokerage */}
          <div className="border border-slate-800 bg-slate-900 text-white rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-300">Scales Them</span>
                <h3 className="font-extrabold text-lg text-white">Broker</h3>
                <p className="font-extrabold text-amber-400 text-xl font-mono">$299 / mo</p>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed min-h-[64px]">Empower your entire brokerage. Enforce brand templates, manage team-wide assignments, configure custom domains, and route shared listing leads.</p>
              <div className="border-t border-slate-800 pt-3 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" /> <span className="font-extrabold text-white">Unlimited Gemini Mins</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" /> Centralized team & admin controls</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" /> Brokerage-wide white-labeling</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" /> Custom domain configuration</div>
                <div className="flex items-center gap-2 font-bold text-amber-300"><ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" /> Level 3 VIP Concierge (&lt;30m SLA)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 mt-4 text-center">
        * Pricing plans may change with 30 days notice via the website, email or SMS.
      </p>

      <AnimatePresence>
        {activeModal === "upgrade" && (
          <BillingModal 
            title="Configure or Upgrade" 
            confirmText="Activate Package" 
            onClose={() => setActiveModal(null)}
            isProcessing={isProcessing}
            onConfirm={handleUpgradePlan}
          >
            <div className="space-y-4 text-left">
              <p className="text-xs text-slate-600">Select the desired portfolio tier below to assign parameters to your session account document.</p>
              
              <div className="space-y-2">
                <label className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer ${
                  selectedPlanId === "agent_free" ? "border-blue-600 bg-blue-50/20" : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="pricing_select" 
                      value="agent_free"
                      checked={selectedPlanId === "agent_free"}
                      onChange={() => setSelectedPlanId("agent_free")}
                      className="cursor-pointer"
                    />
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">Solo Plan</div>
                      <div className="text-slate-500 text-[10px] uppercase font-bold">1 listing, offline kiosk sign-ins</div>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-slate-900">$0 / mo</span>
                </label>

                <label className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer ${
                  selectedPlanId === "agent_starter" || selectedPlanId === "team_starter" ? "border-blue-600 bg-blue-50/20" : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="pricing_select" 
                      value="agent_starter"
                      checked={selectedPlanId === "agent_starter" || selectedPlanId === "team_starter"}
                      onChange={() => setSelectedPlanId("agent_starter")}
                      className="cursor-pointer"
                    />
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">Starter Plan</div>
                      <div className="text-slate-500 text-[10px] uppercase font-bold">Automatic CRM synchronization</div>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-slate-900">$14 / mo</span>
                </label>

                <label className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer ${
                  selectedPlanId === "team_pro" || selectedPlanId === "agent_pro" ? "border-blue-600 bg-blue-50/20" : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="pricing_select" 
                      value="team_pro"
                      checked={selectedPlanId === "team_pro" || selectedPlanId === "agent_pro"}
                      onChange={() => setSelectedPlanId("team_pro")}
                      className="cursor-pointer"
                    />
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">Pro Plan</div>
                      <div className="text-slate-500 text-[10px] uppercase font-bold">24 languages, conversational Sora AI</div>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-slate-900">$29 / mo</span>
                </label>

                <label className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer ${
                  selectedPlanId === "team_elite" ? "border-blue-600 bg-blue-50/20" : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="pricing_select" 
                      value="team_elite"
                      checked={selectedPlanId === "team_elite"}
                      onChange={() => setSelectedPlanId("team_elite")}
                      className="cursor-pointer"
                    />
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">Broker Plan</div>
                      <div className="text-slate-500 text-[10px] uppercase font-bold">Team management, custom domains</div>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-slate-900">$299 / mo</span>
                </label>

                <label className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer ${
                  selectedPlanId === "lender_pro" ? "border-blue-600 bg-blue-50/20" : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="pricing_select" 
                      value="lender_pro"
                      checked={selectedPlanId === "lender_pro"}
                      onChange={() => setSelectedPlanId("lender_pro")}
                      className="cursor-pointer"
                    />
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">Lender Sponsors</div>
                      <div className="text-slate-500 text-[10px] uppercase font-bold">External API sync & Priority Placement</div>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-slate-900">$20 / mo</span>
                </label>
              </div>
            </div>
          </BillingModal>
        )}

        {activeModal === "payment" && (
          <BillingModal 
            title="Update Payment Method" 
            confirmText="Save Card" 
            onClose={() => setActiveModal(null)}
            isProcessing={isProcessing}
            onConfirm={() => {
              if (cardData.number.length !== 12) {
                toast.error("Credit card must be exactly 12 digits");
                return;
              }
              
              const cleanedExpiry = cardData.expiry.replace(/\s+/g, '');
              
              // 1. Format Check: The input must match the exact pattern of two digits, a forward slash, and two digits (MM/YY).
              const formatRegex = /^\d{2}\/\d{2}$/;
              if (!formatRegex.test(cleanedExpiry)) {
                toast.error("Please enter a valid, unexpired date (MM/YY).");
                return;
              }

              const parts = cleanedExpiry.split('/');
              const month = parseInt(parts[0], 10);
              const year = parseInt(parts[1], 10);

              const now = new Date();
              const currentFullYear = now.getFullYear();
              const currentTwoDigitYear = currentFullYear % 100;
              const currentMonth = now.getMonth() + 1; // 1-12

              // 2. Month (MM) Check: The first two digits must be between 01 and 12.
              if (month < 1 || month > 12) {
                toast.error("Please enter a valid, unexpired date (MM/YY).");
                return;
              }

              // 3. Year (YY) Check: The last two digits must be greater than or equal to the current two-digit year.
              if (year < currentTwoDigitYear) {
                toast.error("Please enter a valid, unexpired date (MM/YY).");
                return;
              }

              // 4. Expiration Check (Crucial): If the entered year (YY) is exactly equal to the current year, the entered month (MM) must be greater than or equal to the current month.
              if (year === currentTwoDigitYear && month < currentMonth) {
                toast.error("Please enter a valid, unexpired date (MM/YY).");
                return;
              }

              if (cardData.cvc.length !== 3) {
                toast.error("CVC must be exactly 3 digits");
                return;
              }
              toast.success("Card validated and updated successfully.");
              setActiveModal(null);
            }}>
            <div className="space-y-4 text-left">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 mb-4">
                <div className="h-4 w-4 bg-blue-600 rounded-full animate-pulse" />
                <p className="text-xs font-semibold text-slate-600 italic">Interim Payment Provider (Simulation Only)</p>
              </div>
              <div className="space-y-3 font-sans">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Card Number (Exactly 12 Digits)</label>
                  <input 
                    type="text" 
                    placeholder="XXXX XXXX XXXX" 
                    maxLength={14}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none" 
                    value={cardData.number.replace(/(\d{4})(?=\d)/g, '$1 ')}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                      setCardData(prev => ({ ...prev, number: val }));
                    }}
                    onBlur={() => {
                      if (cardData.number && cardData.number.length !== 12) {
                        toast.error("Credit card must be exactly 12 digits");
                      }
                    }}
                  />
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">Requirement: 12 numeric digits.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Expiry (MM/YY)</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY" 
                      maxLength={5}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:outline-none" 
                      value={cardData.expiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^\d]/g, '');
                        if (val.length > 2) {
                          val = val.slice(0, 2) + '/' + val.slice(2, 4);
                        }
                        setCardData(prev => ({ ...prev, expiry: val }));
                      }}
                      onBlur={() => {
                        if (!cardData.expiry) return;
                        const cleanedExpiry = cardData.expiry.replace(/\s+/g, '');
                        
                        // 1. Format Check: The input must match the exact pattern of two digits, a forward slash, and two digits (MM/YY).
                        const formatRegex = /^\d{2}\/\d{2}$/;
                        if (!formatRegex.test(cleanedExpiry)) {
                          toast.error("Please enter a valid, unexpired date (MM/YY).");
                          return;
                        }

                        const parts = cleanedExpiry.split('/');
                        const month = parseInt(parts[0], 10);
                        const year = parseInt(parts[1], 10);

                        const now = new Date();
                        const currentFullYear = now.getFullYear();
                        const currentTwoDigitYear = currentFullYear % 100;
                        const currentMonth = now.getMonth() + 1; // 1-12

                        // 2. Month (MM) Check: The first two digits must be between 01 and 12.
                        if (month < 1 || month > 12) {
                          toast.error("Please enter a valid, unexpired date (MM/YY).");
                          return;
                        }

                        // 3. Year (YY) Check: The last two digits must be greater than or equal to the current two-digit year.
                        if (year < currentTwoDigitYear) {
                          toast.error("Please enter a valid, unexpired date (MM/YY).");
                          return;
                        }

                        // 4. Expiration Check (Crucial): If the entered year (YY) is exactly equal to the current year, the entered month (MM) must be greater than or equal to the current month.
                        if (year === currentTwoDigitYear && month < currentMonth) {
                          toast.error("Please enter a valid, unexpired date (MM/YY).");
                          return;
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">CVC (3 Digits)</label>
                    <input 
                      type="text" 
                      placeholder="123" 
                      maxLength={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-slate-900 focus:outline-none" 
                      value={cardData.cvc}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                        setCardData(prev => ({ ...prev, cvc: val }));
                      }}
                      onBlur={() => {
                        if (cardData.cvc && cardData.cvc.length !== 3) {
                          toast.error("CVC must be exactly 3 digits");
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </BillingModal>
        )}

        {activeModal === "cancel" && (
          <BillingModal 
            title="Cancel Subscription" 
            confirmText="Confirm Cancellation" 
            confirmVariant="danger" 
            onClose={() => setActiveModal(null)}
            isProcessing={isProcessing}
            onConfirm={handleCancelSubscription}
          >
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 flex items-center justify-center rounded-full text-red-600 mb-2 animate-bounce">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <p className="text-sm text-slate-600">
                Are you sure? You will cancel your premium subscription, reverting your account to the <strong>Solo Agent Free</strong> tier.
              </p>
              <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-[11px] text-red-800 font-medium">
                Warning: Team routing policy warnings and customized co-branding and overrides will be immediately locked first.
              </div>
            </div>
          </BillingModal>
        )}
      </AnimatePresence>
    </div>
  );
}
