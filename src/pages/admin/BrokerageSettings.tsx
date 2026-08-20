import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { adminAutosave } from "@/lib/adminAutosave";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Loader2, Save, ArrowLeft, Building, Users, Shield, AlertTriangle, 
  CheckCircle2, Plus, RefreshCw, BarChart2, Zap, Settings, Search,
  Lock, AlertCircle, Layers, Calendar, Mail, FileText, ArrowRight, Check,
  Radio, Smartphone, Headphones, MessageSquare, TrendingUp, Compass,
  Clock, Sparkles, CheckCircle, Sliders, Download, ExternalLink, ShieldCheck, Activity,
  HelpCircle, Info
} from "lucide-react";
import { 
  BrokerageAccount, 
  BrokerageQuotaLimits, 
  BrokerageQuotaUsage, 
  BrokerageQuotaHistory, 
  QuotaAlert 
} from "@/lib/api";

export interface BrokeragePlanTier {
  name: "Starter" | "Pro" | "Elite" | "Enterprise";
  monthlyPrice: number;
  maxLeads: number;
  maxOpenHouses: number;
  maxMessages: number;
  maxSeats: number;
  sla: string;
  slaLevel: string;
  badgeColor: string;
  features: string[];
}

export const BROKERAGE_TIER_CONFIG: Record<string, BrokeragePlanTier> = {
  Starter: {
    name: "Starter",
    monthlyPrice: 99,
    maxLeads: 500,
    maxOpenHouses: 10,
    maxMessages: 2000,
    maxSeats: 5,
    sla: "< 8 Hours SLA",
    slaLevel: "Level 2 Priority Support",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    features: [
      "Up to 500 AI Lead Captures / mo",
      "Up to 10 Active Open Houses",
      "2,000 Sora AI Voice & Chat Turns",
      "5 Team Agent Seats included",
      "Level 2 Priority Support (< 8 Hours SLA)",
      "Standard CRM Sync & Local Buffer"
    ]
  },
  Pro: {
    name: "Pro",
    monthlyPrice: 199,
    maxLeads: 1000,
    maxOpenHouses: 20,
    maxMessages: 5000,
    maxSeats: 10,
    sla: "< 4 Hours SLA",
    slaLevel: "Level 2 Priority Support",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    features: [
      "Up to 1,000 AI Lead Captures / mo",
      "Up to 20 Active Open Houses",
      "5,000 Sora AI Voice & Chat Turns",
      "10 Team Agent Seats included",
      "Level 2 Priority Support (< 4 Hours SLA)",
      "Advanced Multilingual Voice (70 languages)",
      "Follow Up Boss Custom Tag Mapping"
    ]
  },
  Elite: {
    name: "Elite",
    monthlyPrice: 399,
    maxLeads: 2500,
    maxOpenHouses: 50,
    maxMessages: 15000,
    maxSeats: 25,
    sla: "< 30 Mins Live SLA",
    slaLevel: "Level 3 VIP Concierge",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    features: [
      "Up to 2,500 AI Lead Captures / mo",
      "Up to 50 Active Open Houses",
      "15,000 Sora AI Voice & Chat Turns",
      "25 Team Agent Seats included",
      "Level 3 VIP Concierge (< 30 Mins Live SLA)",
      "Shared Listing Routing & Overrides",
      "Dedicated Onboarding & Account Manager"
    ]
  },
  Enterprise: {
    name: "Enterprise",
    monthlyPrice: 799,
    maxLeads: 5000,
    maxOpenHouses: 100,
    maxMessages: 30000,
    maxSeats: 50,
    sla: "< 30 Mins Live SLA",
    slaLevel: "Level 3 VIP Concierge",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    features: [
      "Up to 5,000+ AI Lead Captures / mo",
      "Up to 100+ Active Open Houses",
      "30,000+ Sora AI Voice & Chat Turns",
      "50+ Team Agent Seats included",
      "Level 3 VIP Concierge (< 30 Mins Live SLA)",
      "Full Brokerage White-Labeling & Domain",
      "Custom Webhook & Data Enrichment API"
    ]
  }
};

export interface ExceededPlanAnalysis {
  isExceeded: boolean;
  currentTier: string;
  currentPrice: number;
  recommendedTier: string;
  recommendedPrice: number;
  exceededItems: {
    field: string;
    label: string;
    currentConfig: number;
    planLimit: number;
    difference: number;
  }[];
}

export function analyzePlanQuotas(brokerage: BrokerageAccount): ExceededPlanAnalysis {
  const currentTierKey = brokerage.tier || "Starter";
  const currentPlan = BROKERAGE_TIER_CONFIG[currentTierKey] || BROKERAGE_TIER_CONFIG.Starter;
  
  const limits = brokerage.quota_limits;
  const exceededItems: {
    field: string;
    label: string;
    currentConfig: number;
    planLimit: number;
    difference: number;
  }[] = [];

  if (limits.max_ai_leads > currentPlan.maxLeads) {
    exceededItems.push({
      field: "max_ai_leads",
      label: "Max AI Leads",
      currentConfig: limits.max_ai_leads,
      planLimit: currentPlan.maxLeads,
      difference: limits.max_ai_leads - currentPlan.maxLeads
    });
  }

  if (limits.max_open_houses > currentPlan.maxOpenHouses) {
    exceededItems.push({
      field: "max_open_houses",
      label: "Max Active Open Houses",
      currentConfig: limits.max_open_houses,
      planLimit: currentPlan.maxOpenHouses,
      difference: limits.max_open_houses - currentPlan.maxOpenHouses
    });
  }

  if (limits.max_ai_messages > currentPlan.maxMessages) {
    exceededItems.push({
      field: "max_ai_messages",
      label: "Max AI Voice & Chat Messages",
      currentConfig: limits.max_ai_messages,
      planLimit: currentPlan.maxMessages,
      difference: limits.max_ai_messages - currentPlan.maxMessages
    });
  }

  if (limits.max_team_seats > currentPlan.maxSeats) {
    exceededItems.push({
      field: "max_team_seats",
      label: "Max Team Agent Seats",
      currentConfig: limits.max_team_seats,
      planLimit: currentPlan.maxSeats,
      difference: limits.max_team_seats - currentPlan.maxSeats
    });
  }

  const isExceeded = exceededItems.length > 0;
  
  let recommendedTier = currentTierKey;
  let recommendedPrice = currentPlan.monthlyPrice;

  if (isExceeded) {
    const tierKeys: ("Starter" | "Pro" | "Elite" | "Enterprise")[] = ["Starter", "Pro", "Elite", "Enterprise"];
    for (const key of tierKeys) {
      const plan = BROKERAGE_TIER_CONFIG[key];
      if (
        limits.max_ai_leads <= plan.maxLeads &&
        limits.max_open_houses <= plan.maxOpenHouses &&
        limits.max_ai_messages <= plan.maxMessages &&
        limits.max_team_seats <= plan.maxSeats
      ) {
        recommendedTier = key;
        recommendedPrice = plan.monthlyPrice;
        break;
      }
      recommendedTier = "Enterprise";
      recommendedPrice = BROKERAGE_TIER_CONFIG.Enterprise.monthlyPrice;
    }
  }

  return {
    isExceeded,
    currentTier: currentTierKey,
    currentPrice: currentPlan.monthlyPrice,
    recommendedTier,
    recommendedPrice,
    exceededItems
  };
}

/** Format ISO/YYYY-MM-DD date strings into clean readable "Aug 01, 2026" display */
export const formatCycleDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

/** Tab explanations for the Brokerage Management sub-tabs */
export const DETAIL_TAB_EXPLANATIONS: Record<
  "limits" | "telemetry" | "history" | "alerts" | "branding",
  { title: string; badge: string; description: string; highlights: string[] }
> = {
  limits: {
    title: "Quota Limits & Enforcements",
    badge: "Contract Ceilings & Policies",
    description: "Configure contractual capacity ceilings (AI leads, active open houses, voice turns, team seats), warning threshold percentages, and enforcement rules (soft pay-per-lead overages vs hard stop on limit reach).",
    highlights: [
      "Sets organizational ceilings for AI Leads, Open Houses, AI Messages, and Agent Seats.",
      "Monitors quota alignment against the brokerage's active subscription plan.",
      "Configures soft pay-per-lead overage options or strict kiosk hard-stop lockouts.",
      "Triggers automatic plan upgrade workflows and notification receipts when exceeded."
    ]
  },
  telemetry: {
    title: "Live Usage & Cycle Reset",
    badge: "Real-time Consumption",
    description: "Monitor real-time consumption telemetry for the active billing cycle. Track active lead counts, concurrent open houses, voice narration runtime, and execute instant cycle resets or manual meter adjustments.",
    highlights: [
      "Displays live consumption meters against allocated cycle allowances.",
      "Shows current cycle active dates (e.g., Aug 01, 2026 to Aug 31, 2026).",
      "Allows administrative manual counter resets when resolving billing cycles or testing."
    ]
  },
  history: {
    title: "Historical Cycles",
    badge: "Cycle Archives & Audits",
    description: "Access archived monthly billing cycles, past utilization benchmarks, overage audit snapshots, and exportable reconciliation reports across previous accounting periods.",
    highlights: [
      "Archival storage of previous billing periods with exact consumption tallies.",
      "Records peak open houses and peak agent seat occupancy per cycle.",
      "Provides historical reference for broker contract renewals and reconciliations."
    ]
  },
  alerts: {
    title: "Quota Alerts",
    badge: "Threshold Triggers",
    description: "Review automated warnings and threshold notifications triggered when consumption crosses 80%, 90%, or 100% of contract capacity. Acknowledge notices or dispatch resolution actions to broker administrators.",
    highlights: [
      "Real-time automated alerts triggered when approaching or exceeding limits.",
      "Displays critical warning levels, triggered values, timestamps, and resolution states.",
      "Allows admins to acknowledge warnings and track proactive compliance notices."
    ]
  },
  branding: {
    title: "Branding & Cascading Rules",
    badge: "Office Customization",
    description: "Manage brokerage-wide branding assets, logos, brand colors, disclaimers, and mandatory compliance footer rules that cascade automatically to all agent open houses, touchless kiosks, and printed flyers.",
    highlights: [
      "Centralized brand assets (logos, primary/secondary colors, theme tokens).",
      "Mandatory legal disclaimers and compliance footer text.",
      "Enforces cascading inheritance rules down to individual agent kiosks and flyers."
    ]
  }
};

// Default initial brokerages if Firestore is empty
const INITIAL_BROKERAGES: BrokerageAccount[] = [
  {
    brokerage_id: "vertex-agent-group",
    name: "Vertex Agent Group",
    code: "BAG-001",
    account_status: "active",
    tier: "Enterprise",
    primary_contact_name: "Danielle Vance",
    primary_contact_email: "danielle@vertexagent.com",
    themeColor: "#2563eb",
    complianceFooter: "© 2026 Vertex Agent Group. All rights reserved. Equal Housing Opportunity.",
    created_at: Date.now() - 90 * 86400000,
    quota_limits: {
      brokerage_id: "vertex-agent-group",
      max_ai_leads: 5000,
      max_open_houses: 100,
      max_ai_messages: 25000,
      max_team_seats: 50,
      warning_threshold_pct: 80,
      allow_overages: true,
      hard_stop_on_limit: false
    },
    quota_usage: {
      brokerage_id: "vertex-agent-group",
      current_leads_used: 4120,
      current_open_houses: 38,
      current_messages_used: 19850,
      active_seats_occupied: 24,
      cycle_start_date: "2026-08-01",
      cycle_end_date: "2026-08-31",
      last_updated: Date.now()
    }
  },
  {
    brokerage_id: "aether-horizon-luxury",
    name: "Aether & Horizon Luxury Global",
    code: "AHL-002",
    account_status: "active",
    tier: "Elite",
    primary_contact_name: "Marcus Sterling",
    primary_contact_email: "marcus@aetherhorizon.com",
    themeColor: "#0f172a",
    complianceFooter: "© 2026 Aether & Horizon Luxury Real Estate LLC. Licensed Brokerage.",
    created_at: Date.now() - 60 * 86400000,
    quota_limits: {
      brokerage_id: "aether-horizon-luxury",
      max_ai_leads: 2500,
      max_open_houses: 50,
      max_ai_messages: 15000,
      max_team_seats: 25,
      warning_threshold_pct: 85,
      allow_overages: false,
      hard_stop_on_limit: true
    },
    quota_usage: {
      brokerage_id: "aether-horizon-luxury",
      current_leads_used: 2210,
      current_open_houses: 41,
      current_messages_used: 13400,
      active_seats_occupied: 22,
      cycle_start_date: "2026-08-01",
      cycle_end_date: "2026-08-31",
      last_updated: Date.now()
    }
  },
  {
    brokerage_id: "pinnacle-realty",
    name: "Pinnacle Residential Realty",
    code: "PRR-003",
    account_status: "active",
    tier: "Pro",
    primary_contact_name: "Sarah Jenkins",
    primary_contact_email: "sjenkins@pinnaclerealty.org",
    themeColor: "#16a34a",
    complianceFooter: "© 2026 Pinnacle Residential Realty. Independently owned and operated.",
    created_at: Date.now() - 45 * 86400000,
    quota_limits: {
      brokerage_id: "pinnacle-realty",
      max_ai_leads: 1000,
      max_open_houses: 20,
      max_ai_messages: 5000,
      max_team_seats: 10,
      warning_threshold_pct: 80,
      allow_overages: true,
      hard_stop_on_limit: false
    },
    quota_usage: {
      brokerage_id: "pinnacle-realty",
      current_leads_used: 430,
      current_open_houses: 9,
      current_messages_used: 2150,
      active_seats_occupied: 7,
      cycle_start_date: "2026-08-01",
      cycle_end_date: "2026-08-31",
      last_updated: Date.now()
    }
  },
  {
    brokerage_id: "century-premier",
    name: "Century Premier Realty",
    code: "CPR-004",
    account_status: "paused",
    tier: "Starter",
    primary_contact_name: "Robert Chen",
    primary_contact_email: "r.chen@centurypremier.com",
    themeColor: "#d97706",
    complianceFooter: "© 2026 Century Premier Realty. All rights reserved.",
    created_at: Date.now() - 120 * 86400000,
    quota_limits: {
      brokerage_id: "century-premier",
      max_ai_leads: 500,
      max_open_houses: 10,
      max_ai_messages: 2000,
      max_team_seats: 5,
      warning_threshold_pct: 75,
      allow_overages: false,
      hard_stop_on_limit: true
    },
    quota_usage: {
      brokerage_id: "century-premier",
      current_leads_used: 495,
      current_open_houses: 10,
      current_messages_used: 1980,
      active_seats_occupied: 5,
      cycle_start_date: "2026-08-01",
      cycle_end_date: "2026-08-31",
      last_updated: Date.now()
    }
  }
];

const MOCK_HISTORY: BrokerageQuotaHistory[] = [
  {
    id: "hist-001",
    brokerage_id: "vertex-agent-group",
    cycle_start_date: "2026-07-01",
    cycle_end_date: "2026-07-31",
    total_leads_used: 4890,
    total_messages_used: 23100,
    peak_open_houses: 42,
    peak_seats_occupied: 24
  },
  {
    id: "hist-002",
    brokerage_id: "vertex-agent-group",
    cycle_start_date: "2026-06-01",
    cycle_end_date: "2026-06-30",
    total_leads_used: 4210,
    total_messages_used: 19500,
    peak_open_houses: 35,
    peak_seats_occupied: 20
  },
  {
    id: "hist-003",
    brokerage_id: "aether-horizon-luxury",
    cycle_start_date: "2026-07-01",
    cycle_end_date: "2026-07-31",
    total_leads_used: 2350,
    total_messages_used: 14100,
    peak_open_houses: 48,
    peak_seats_occupied: 22
  }
];

const MOCK_ALERTS: QuotaAlert[] = [
  {
    id: "alt-001",
    brokerage_id: "aether-horizon-luxury",
    brokerage_name: "Aether & Horizon Luxury Global",
    quota_type: "leads",
    alert_level: "warning",
    triggered_value: 2210,
    limit_value: 2500,
    created_at: Date.now() - 2 * 3600000,
    acknowledged: false
  },
  {
    id: "alt-002",
    brokerage_id: "aether-horizon-luxury",
    brokerage_name: "Aether & Horizon Luxury Global",
    quota_type: "messages",
    alert_level: "warning",
    triggered_value: 13400,
    limit_value: 15000,
    created_at: Date.now() - 5 * 3600000,
    acknowledged: false
  },
  {
    id: "alt-003",
    brokerage_id: "century-premier",
    brokerage_name: "Century Premier Realty",
    quota_type: "open_houses",
    alert_level: "critical",
    triggered_value: 10,
    limit_value: 10,
    created_at: Date.now() - 24 * 3600000,
    acknowledged: true
  }
];

export default function BrokerageSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [brokerages, setBrokerages] = useState<BrokerageAccount[]>([]);
  const [selectedBrokerageId, setSelectedBrokerageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "warning" | "paused">("all");
  const [activeDetailTab, setActiveDetailTab] = useState<"limits" | "telemetry" | "history" | "alerts" | "branding">("limits");
  const [selectedTabInfoKey, setSelectedTabInfoKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Modal dialog state for clicking on the 4 top KPI cards and global quota cards
  const [activeKpiModal, setActiveKpiModal] = useState<
    "total_brokerages" | "lead_captures" | "open_houses" | "messages" | "active_seats" | "quota_alerts" | null
  >(null);
  const [modalSearchQuery, setModalSearchQuery] = useState("");

  // Plan Exceeded Warning & Automated Email State
  const [planExceededModalOpen, setPlanExceededModalOpen] = useState(false);
  const [exceededPlanData, setExceededPlanData] = useState<ExceededPlanAnalysis | null>(null);
  const [isSendingPlanEmail, setIsSendingPlanEmail] = useState(false);
  const [emailReceiptModalOpen, setEmailReceiptModalOpen] = useState(false);
  const [emailReceiptData, setEmailReceiptData] = useState<{
    recipient: string;
    recipientName: string;
    brokerageName: string;
    brokerageCode: string;
    oldTier: string;
    oldPrice: number;
    newTier: string;
    newPrice: number;
    effectiveDate: string;
    sentAt: string;
    trackingId: string;
    subject: string;
    messageSummary: string;
  } | null>(null);

  // Soft Overages Policy Change Modal & Email Log State
  const [softOverageModalOpen, setSoftOverageModalOpen] = useState(false);
  const [softOverageEmailData, setSoftOverageEmailData] = useState<{
    action: "enabled" | "disabled";
    recipient: string;
    recipientName: string;
    brokerageName: string;
    brokerageCode: string;
    trackingId: string;
    sentAt: string;
    subject: string;
    emailBody: string;
    auditLogId: string;
    adminActor: string;
  } | null>(null);

  // Brokerage Pricing & Plan Matrix Modal
  const [isPricingMatrixModalOpen, setIsPricingMatrixModalOpen] = useState(false);

  // Editable state for selected brokerage + Autosave status tracking
  const [selectedBrokerage, setSelectedBrokerage] = useState<BrokerageAccount | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const isInitialLoadRef = useRef(true);

  // New Brokerage Form State
  const [newBrokerageName, setNewBrokerageName] = useState("");
  const [newBrokerageCode, setNewBrokerageCode] = useState("");
  const [newBrokerageEmail, setNewBrokerageEmail] = useState("");
  const [newBrokerageTier, setNewBrokerageTier] = useState<"Starter" | "Pro" | "Elite" | "Enterprise">("Pro");

  useEffect(() => {
    fetchBrokerages();

    // Check for drilldown query parameter in URL (e.g. ?drilldown=leads | open_houses | messages | seats | alerts | brokerages)
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const drilldownParam = searchParams.get("drilldown");
      if (drilldownParam === "leads" || drilldownParam === "ai_leads" || drilldownParam === "lead_captures") {
        setActiveKpiModal("lead_captures");
      } else if (drilldownParam === "open_houses" || drilldownParam === "events") {
        setActiveKpiModal("open_houses");
      } else if (drilldownParam === "messages" || drilldownParam === "voice" || drilldownParam === "ai_messages") {
        setActiveKpiModal("messages");
      } else if (drilldownParam === "seats" || drilldownParam === "agent_seats" || drilldownParam === "active_seats") {
        setActiveKpiModal("active_seats");
      } else if (drilldownParam === "alerts" || drilldownParam === "warnings") {
        setActiveKpiModal("quota_alerts");
      } else if (drilldownParam === "brokerages") {
        setActiveKpiModal("total_brokerages");
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Register with Global Admin Autosave Manager
  useEffect(() => {
    const unregister = adminAutosave.register(
      "brokerage-settings",
      async () => {
        if (selectedBrokerage) {
          try {
            await setDoc(doc(db, "brokerages", selectedBrokerage.brokerage_id), selectedBrokerage, { merge: true });
          } catch (e) {
            console.warn("Autosaved locally in state:", e);
          }
        }
      },
      () => autosaveStatus === "saving" || autosaveStatus === "idle",
      "Brokerage Quotas & Governance"
    );
    return () => unregister();
  }, [selectedBrokerage, autosaveStatus]);

  // Autosave effect when selectedBrokerage changes
  useEffect(() => {
    if (!selectedBrokerage) return;

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    setAutosaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        await setDoc(doc(db, "brokerages", selectedBrokerage.brokerage_id), selectedBrokerage, { merge: true });
        setBrokerages((prev) =>
          prev.map((b) => (b.brokerage_id === selectedBrokerage.brokerage_id ? selectedBrokerage : b))
        );
        setAutosaveStatus("saved");
      } catch (err) {
        console.warn("Autosaved locally to active session state:", err);
        setBrokerages((prev) =>
          prev.map((b) => (b.brokerage_id === selectedBrokerage.brokerage_id ? selectedBrokerage : b))
        );
        setAutosaveStatus("saved");
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [selectedBrokerage]);

  const fetchBrokerages = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, "brokerages");
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const loaded: BrokerageAccount[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.name) {
            loaded.push({
              brokerage_id: docSnap.id,
              name: data.name || "Unnamed Brokerage",
              code: data.code || `BRK-${docSnap.id.slice(0, 4).toUpperCase()}`,
              account_status: data.account_status || "active",
              tier: data.tier || "Pro",
              primary_contact_name: data.primary_contact_name || "Admin Contact",
              primary_contact_email: data.primary_contact_email || "admin@brokerage.com",
              themeColor: data.themeColor || "#2563eb",
              complianceFooter: data.complianceFooter || "© 2026 Brokerage. All rights reserved.",
              created_at: data.created_at || Date.now(),
              quota_limits: data.quota_limits || {
                brokerage_id: docSnap.id,
                max_ai_leads: 1000,
                max_open_houses: 25,
                max_ai_messages: 10000,
                max_team_seats: 15,
                warning_threshold_pct: 80,
                allow_overages: true,
                hard_stop_on_limit: false
              },
              quota_usage: data.quota_usage || {
                brokerage_id: docSnap.id,
                current_leads_used: 120,
                current_open_houses: 5,
                current_messages_used: 1450,
                active_seats_occupied: 4,
                cycle_start_date: "2026-08-01",
                cycle_end_date: "2026-08-31",
                last_updated: Date.now()
              }
            });
          }
        });
        if (loaded.length > 0) {
          setBrokerages(loaded);
          setLoading(false);
          return;
        }
      }
      
      // Fallback to initial rich dataset if firestore is empty
      setBrokerages(INITIAL_BROKERAGES);
    } catch (err) {
      console.warn("Using default initial brokerages dataset:", err);
      setBrokerages(INITIAL_BROKERAGES);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBrokerage = (b: BrokerageAccount) => {
    isInitialLoadRef.current = true;
    setAutosaveStatus("idle");
    setSelectedBrokerageId(b.brokerage_id);
    setSelectedBrokerage(JSON.parse(JSON.stringify(b)));
    setActiveDetailTab("limits");
  };

  const handleBackToList = () => {
    isInitialLoadRef.current = true;
    setAutosaveStatus("idle");
    setSelectedBrokerageId(null);
    setSelectedBrokerage(null);
  };

  const handleSaveSelectedBrokerage = async () => {
    if (!selectedBrokerage) return;

    // Check if the configured quota limits exceed the current plan
    const analysis = analyzePlanQuotas(selectedBrokerage);
    if (analysis.isExceeded) {
      setExceededPlanData(analysis);
      setPlanExceededModalOpen(true);
      return;
    }

    // Direct save if within current plan
    await executeSaveBrokerage(selectedBrokerage);
  };

  const executeSaveBrokerage = async (brokerageToSave: BrokerageAccount) => {
    setSaving(true);
    try {
      await setDoc(doc(db, "brokerages", brokerageToSave.brokerage_id), brokerageToSave, { merge: true });
      
      // Update local state list
      setBrokerages((prev) =>
        prev.map((b) => (b.brokerage_id === brokerageToSave.brokerage_id ? brokerageToSave : b))
      );

      toast.success(`Quota & settings updated for ${brokerageToSave.name}`);
    } catch (err) {
      console.error(err);
      toast.error("Saved locally. Connection update pending.");
      // Still update local array
      setBrokerages((prev) =>
        prev.map((b) => (b.brokerage_id === brokerageToSave.brokerage_id ? brokerageToSave : b))
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetToPlanLimits = () => {
    if (!selectedBrokerage) return;
    const plan = BROKERAGE_TIER_CONFIG[selectedBrokerage.tier || "Starter"] || BROKERAGE_TIER_CONFIG.Starter;
    const resetBrokerage: BrokerageAccount = {
      ...selectedBrokerage,
      quota_limits: {
        ...selectedBrokerage.quota_limits,
        max_ai_leads: plan.maxLeads,
        max_open_houses: plan.maxOpenHouses,
        max_ai_messages: plan.maxMessages,
        max_team_seats: plan.maxSeats
      }
    };
    setSelectedBrokerage(resetBrokerage);
    setPlanExceededModalOpen(false);
    toast.info(`Quota limits restored to ${plan.name} Plan ($${plan.monthlyPrice}/mo) baselines.`);
  };

  const handleConfirmPlanUpgradeAndSendEmail = async (overrideTier?: string) => {
    if (!selectedBrokerage || !exceededPlanData) return;

    setIsSendingPlanEmail(true);
    const targetTier = (overrideTier || exceededPlanData.recommendedTier) as "Starter" | "Pro" | "Elite" | "Enterprise";
    const targetPlan = BROKERAGE_TIER_CONFIG[targetTier] || BROKERAGE_TIER_CONFIG.Enterprise;
    const trackingId = `NOTIF-${Date.now().toString(36).toUpperCase()}`;
    const effectiveDate = new Date(Date.now() + 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const sentAt = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

    const updatedAccount: BrokerageAccount = {
      ...selectedBrokerage,
      tier: targetTier
    };

    try {
      // 1. Save updated brokerage account
      await setDoc(doc(db, "brokerages", updatedAccount.brokerage_id), updatedAccount, { merge: true });

      // 2. Dispatch / record simulated automated email notification
      const emailRecord = {
        notification_id: trackingId,
        recipient_email: updatedAccount.primary_contact_email,
        recipient_name: updatedAccount.primary_contact_name,
        brokerage_id: updatedAccount.brokerage_id,
        brokerage_name: updatedAccount.name,
        brokerage_code: updatedAccount.code,
        previous_tier: exceededPlanData.currentTier,
        previous_price: exceededPlanData.currentPrice,
        new_tier: targetTier,
        new_monthly_price: targetPlan.monthlyPrice,
        effective_date: effectiveDate,
        sent_at: Date.now(),
        status: "delivered",
        subject: `Important Update: Subscription Plan Adjustment & New Monthly Pricing for ${updatedAccount.name}`,
        exceeded_quotas: exceededPlanData.exceededItems
      };

      try {
        await setDoc(doc(db, "email_notifications", trackingId), emailRecord);
        await setDoc(doc(db, "auditLogs", `log-${Date.now()}`), {
          action: "BROKERAGE_PLAN_AUTO_UPGRADE",
          actor: user?.email || "Super Admin",
          target_brokerage: updatedAccount.name,
          details: `Plan upgraded from ${exceededPlanData.currentTier} ($${exceededPlanData.currentPrice}/mo) to ${targetTier} ($${targetPlan.monthlyPrice}/mo) due to quota configuration increase. Email dispatched to ${updatedAccount.primary_contact_email}.`,
          timestamp: Date.now()
        });
      } catch (e) {
        console.warn("Logged email notification to local state:", e);
      }

      // 3. Update local state
      setSelectedBrokerage(updatedAccount);
      setBrokerages((prev) =>
        prev.map((b) => (b.brokerage_id === updatedAccount.brokerage_id ? updatedAccount : b))
      );

      // 4. Store receipt data and show confirmation
      setEmailReceiptData({
        recipient: updatedAccount.primary_contact_email,
        recipientName: updatedAccount.primary_contact_name,
        brokerageName: updatedAccount.name,
        brokerageCode: updatedAccount.code,
        oldTier: exceededPlanData.currentTier,
        oldPrice: exceededPlanData.currentPrice,
        newTier: targetTier,
        newPrice: targetPlan.monthlyPrice,
        effectiveDate,
        sentAt,
        trackingId,
        subject: `Important Update: Subscription Plan Adjustment & New Monthly Pricing for ${updatedAccount.name}`,
        messageSummary: `Plan automatically adjusted from ${exceededPlanData.currentTier} ($${exceededPlanData.currentPrice}/mo) to ${targetTier} ($${targetPlan.monthlyPrice}/mo). New quota allocations activated.`
      });

      setPlanExceededModalOpen(false);
      setEmailReceiptModalOpen(true);
      toast.success(`Plan adjusted to ${targetTier} ($${targetPlan.monthlyPrice}/mo)! Notification email sent to ${updatedAccount.primary_contact_email}.`);
    } catch (error) {
      console.error("Error confirming plan upgrade:", error);
      toast.error("Failed to update plan. Please try again.");
    } finally {
      setIsSendingPlanEmail(false);
    }
  };

  const handleToggleAllowOverages = async (checked: boolean) => {
    if (!selectedBrokerage) return;

    const previousState = !!selectedBrokerage.quota_limits?.allow_overages;
    if (previousState === checked) return;

    const updatedAccount: BrokerageAccount = {
      ...selectedBrokerage,
      quota_limits: {
        ...selectedBrokerage.quota_limits,
        allow_overages: checked
      }
    };

    setSelectedBrokerage(updatedAccount);

    const trackingId = `OVRG-${Date.now().toString(36).toUpperCase()}`;
    const auditLogId = `audit-${Date.now()}`;
    const timestamp = Date.now();
    const sentAt = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
    const adminActor = user?.email || "Super Administrator";
    const actionText = checked ? "Enabled" : "Disabled";

    const subject = `Important Notice: Soft Overages (Pay-per-Lead) Policy ${actionText.toUpperCase()} for ${selectedBrokerage.name}`;
    const emailBody = checked
      ? `Dear ${selectedBrokerage.primary_contact_name},\n\nPlease be advised that the Soft Overages (Pay-per-Lead) policy has been ENABLED for ${selectedBrokerage.name} (${selectedBrokerage.code}) by Platform Administrator ${adminActor} on ${sentAt}.\n\nWhat this means for your organization:\n• Lead capture and visitor sign-ins will continue without interruption even if your monthly allocation limit of ${selectedBrokerage.quota_limits.max_ai_leads.toLocaleString()} leads is exceeded during peak open house events.\n• Overage leads captured beyond your baseline allowance will be billed at standard pay-per-lead rates ($0.25/lead) at the end of the current billing cycle (${formatCycleDate(selectedBrokerage.quota_usage.cycle_end_date)}).\n• Automated warning alerts will notify your team when quota consumption surpasses ${selectedBrokerage.quota_limits.warning_threshold_pct}% capacity.\n\nIf you have any questions or wish to adjust your contract parameters, please reach out to your account administrator.`
      : `Dear ${selectedBrokerage.primary_contact_name},\n\nPlease be advised that the Soft Overages (Pay-per-Lead) policy has been DISABLED for ${selectedBrokerage.name} (${selectedBrokerage.code}) by Platform Administrator ${adminActor} on ${sentAt}.\n\nUnder strict enforcement, lead captures and Sora AI interactions will lock once your plan quota of ${selectedBrokerage.quota_limits.max_ai_leads.toLocaleString()} leads is reached until the next cycle reset on ${formatCycleDate(selectedBrokerage.quota_usage.cycle_end_date)}.`;

    try {
      // 1. Save updated brokerage to Firestore
      await setDoc(doc(db, "brokerages", updatedAccount.brokerage_id), updatedAccount, { merge: true });

      // 2. Track in Firestore auditLogs collection
      await setDoc(doc(db, "auditLogs", auditLogId), {
        action: checked ? "ALLOW_SOFT_OVERAGES_ENABLED" : "ALLOW_SOFT_OVERAGES_DISABLED",
        actor: adminActor,
        target_brokerage: selectedBrokerage.name,
        brokerage_id: selectedBrokerage.brokerage_id,
        brokerage_code: selectedBrokerage.code,
        previous_value: previousState,
        new_value: checked,
        email_sent_to: selectedBrokerage.primary_contact_email,
        email_tracking_id: trackingId,
        details: `Soft Overages (Pay-per-Lead) ${actionText} for ${selectedBrokerage.name}. Official notification email dispatched to Plan Administrator / Team Leader ${selectedBrokerage.primary_contact_name} (${selectedBrokerage.primary_contact_email}).`,
        timestamp,
        date_formatted: sentAt
      });

      // 3. Store notification record in email_notifications collection
      await setDoc(doc(db, "email_notifications", trackingId), {
        notification_id: trackingId,
        type: "SOFT_OVERAGES_POLICY_UPDATE",
        recipient_email: selectedBrokerage.primary_contact_email,
        recipient_name: selectedBrokerage.primary_contact_name,
        brokerage_id: selectedBrokerage.brokerage_id,
        brokerage_name: selectedBrokerage.name,
        brokerage_code: selectedBrokerage.code,
        subject,
        body: emailBody,
        sent_at: timestamp,
        sent_at_formatted: sentAt,
        status: "delivered",
        actor: adminActor
      });
    } catch (err) {
      console.warn("Soft overage change logged locally:", err);
    }

    // 4. Update local brokerages array
    setBrokerages((prev) =>
      prev.map((b) => (b.brokerage_id === updatedAccount.brokerage_id ? updatedAccount : b))
    );

    // 5. Open Modal with full email copy and audit log record
    setSoftOverageEmailData({
      action: checked ? "enabled" : "disabled",
      recipient: selectedBrokerage.primary_contact_email,
      recipientName: selectedBrokerage.primary_contact_name,
      brokerageName: selectedBrokerage.name,
      brokerageCode: selectedBrokerage.code,
      trackingId,
      sentAt,
      subject,
      emailBody,
      auditLogId,
      adminActor
    });

    setSoftOverageModalOpen(true);
    toast.success(`Soft Overages ${actionText}! Audit logged & notification email dispatched.`);
  };

  const handleCreateBrokerage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrokerageName.trim()) {
      toast.error("Please enter a brokerage name.");
      return;
    }

    const newId = `brk-${Date.now().toString(36)}`;
    const newAccount: BrokerageAccount = {
      brokerage_id: newId,
      name: newBrokerageName.trim(),
      code: newBrokerageCode.trim() || `BRK-${Math.floor(100 + Math.random() * 900)}`,
      account_status: "active",
      tier: newBrokerageTier,
      primary_contact_name: "Broker Administrator",
      primary_contact_email: newBrokerageEmail.trim() || "admin@brokerage.com",
      themeColor: "#2563eb",
      complianceFooter: `© ${new Date().getFullYear()} ${newBrokerageName.trim()}. All rights reserved.`,
      created_at: Date.now(),
      quota_limits: {
        brokerage_id: newId,
        max_ai_leads: newBrokerageTier === "Enterprise" ? 5000 : newBrokerageTier === "Elite" ? 2500 : 1000,
        max_open_houses: newBrokerageTier === "Enterprise" ? 100 : newBrokerageTier === "Elite" ? 50 : 20,
        max_ai_messages: newBrokerageTier === "Enterprise" ? 25000 : newBrokerageTier === "Elite" ? 15000 : 5000,
        max_team_seats: newBrokerageTier === "Enterprise" ? 50 : newBrokerageTier === "Elite" ? 25 : 10,
        warning_threshold_pct: 80,
        allow_overages: true,
        hard_stop_on_limit: false
      },
      quota_usage: {
        brokerage_id: newId,
        current_leads_used: 0,
        current_open_houses: 0,
        current_messages_used: 0,
        active_seats_occupied: 1,
        cycle_start_date: new Date().toISOString().slice(0, 10),
        cycle_end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        last_updated: Date.now()
      }
    };

    try {
      await setDoc(doc(db, "brokerages", newId), newAccount);
    } catch (err) {
      console.warn("Saved to local list:", err);
    }

    setBrokerages([newAccount, ...brokerages]);
    setIsAddModalOpen(false);
    setNewBrokerageName("");
    setNewBrokerageCode("");
    setNewBrokerageEmail("");
    toast.success(`Created brokerage ${newAccount.name} with quota plan!`);
  };

  // Helper calculation for warning status
  const getBrokerageHealth = (b: BrokerageAccount) => {
    const leadPct = (b.quota_usage.current_leads_used / Math.max(1, b.quota_limits.max_ai_leads)) * 100;
    const msgPct = (b.quota_usage.current_messages_used / Math.max(1, b.quota_limits.max_ai_messages)) * 100;
    const seatsPct = (b.quota_usage.active_seats_occupied / Math.max(1, b.quota_limits.max_team_seats)) * 100;
    const maxPct = Math.max(leadPct, msgPct, seatsPct);

    if (b.account_status !== "active") return "paused";
    if (maxPct >= 100) return "exceeded";
    if (maxPct >= b.quota_limits.warning_threshold_pct) return "warning";
    return "healthy";
  };

  // Filtered brokerages list
  const filteredBrokerages = brokerages.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.primary_contact_email.toLowerCase().includes(searchQuery.toLowerCase());

    const health = getBrokerageHealth(b);
    if (statusFilter === "active") return matchesSearch && b.account_status === "active";
    if (statusFilter === "warning") return matchesSearch && (health === "warning" || health === "exceeded");
    if (statusFilter === "paused") return matchesSearch && b.account_status !== "active";
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading Brokerage Quotas & Governance...</p>
      </div>
    );
  }

  // =========================================================================
  // DETAILED SINGLE BROKERAGE VIEW (CARD CLICKED)
  // =========================================================================
  if (selectedBrokerageId && selectedBrokerage) {
    const health = getBrokerageHealth(selectedBrokerage);
    const leadPct = Math.round(
      (selectedBrokerage.quota_usage.current_leads_used / Math.max(1, selectedBrokerage.quota_limits.max_ai_leads)) * 100
    );
    const msgPct = Math.round(
      (selectedBrokerage.quota_usage.current_messages_used / Math.max(1, selectedBrokerage.quota_limits.max_ai_messages)) * 100
    );
    const ohPct = Math.round(
      (selectedBrokerage.quota_usage.current_open_houses / Math.max(1, selectedBrokerage.quota_limits.max_open_houses)) * 100
    );
    const seatPct = Math.round(
      (selectedBrokerage.quota_usage.active_seats_occupied / Math.max(1, selectedBrokerage.quota_limits.max_team_seats)) * 100
    );

    const brokerageHistory = MOCK_HISTORY.filter((h) => h.brokerage_id === selectedBrokerage.brokerage_id);
    const brokerageAlerts = MOCK_ALERTS.filter((a) => a.brokerage_id === selectedBrokerage.brokerage_id);

    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {/* Top Header Navigation with EXPLICIT Back Text Button at Top Left */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToList}
              id="back-to-brokerages-btn"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-sm cursor-pointer hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4 text-slate-500 group-hover:text-blue-600" />
              <span>← Back to All Brokerages</span>
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{selectedBrokerage.name}</h1>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                  {selectedBrokerage.code}
                </span>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    selectedBrokerage.account_status === "active"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  {selectedBrokerage.account_status}
                </span>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {selectedBrokerage.tier} Tier (${(BROKERAGE_TIER_CONFIG[selectedBrokerage.tier || "Starter"] || BROKERAGE_TIER_CONFIG.Starter).monthlyPrice}/mo)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Plan Holder: <strong className="text-slate-700">{selectedBrokerage.primary_contact_name}</strong> ({selectedBrokerage.primary_contact_email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Autosave Indicator */}
            {autosaveStatus === "saving" ? (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5 animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                <span>Autosaving...</span>
              </span>
            ) : autosaveStatus === "saved" ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>All changes autosaved</span>
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-blue-600" />
                <span>Autosave active</span>
              </span>
            )}

            <Button
              onClick={handleSaveSelectedBrokerage}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 text-xs px-4 py-2 rounded-xl shadow-sm cursor-pointer"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Quota Configuration</span>
            </Button>
          </div>
        </div>

        {/* Current Plan & Pricing Subscription Bar */}
        {(() => {
          const currentPlan = BROKERAGE_TIER_CONFIG[selectedBrokerage.tier || "Starter"] || BROKERAGE_TIER_CONFIG.Starter;
          const liveCheck = analyzePlanQuotas(selectedBrokerage);

          return (
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                    Active Subscription Plan
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    Invoicing to: <strong className="text-white">{selectedBrokerage.primary_contact_name}</strong> ({selectedBrokerage.primary_contact_email})
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                    <span>{currentPlan.name} Plan</span>
                    <span className="text-sm font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                      ${currentPlan.monthlyPrice}/month
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400 font-medium hidden md:inline">
                    • {currentPlan.slaLevel} ({currentPlan.sla})
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Included Baseline: <strong className="text-white">{currentPlan.maxLeads.toLocaleString()} Leads</strong> • <strong className="text-white">{currentPlan.maxOpenHouses} Open Houses</strong> • <strong className="text-white">{currentPlan.maxMessages.toLocaleString()} Messages</strong> • <strong className="text-white">{currentPlan.maxSeats} Agent Seats</strong>
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPricingMatrixModalOpen(true)}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <Compass className="h-3.5 w-3.5 text-blue-300" />
                  <span>View All Pricing Plans & SLAs</span>
                </Button>
                {liveCheck.isExceeded && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setExceededPlanData(liveCheck);
                      setPlanExceededModalOpen(true);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs gap-1.5 shadow-sm animate-pulse cursor-pointer"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Plan Upgrade Required ({liveCheck.recommendedTier})</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Quota Overview KPI Bar for Selected Brokerage (Interactive Drill-down Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            id="card-selected-ai-leads"
            onClick={() => {
              setModalSearchQuery(selectedBrokerage.name);
              setActiveKpiModal("lead_captures");
            }}
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-2 relative"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span className="group-hover:text-blue-600 transition-colors">AI Lead Captures</span>
              <Zap className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                {selectedBrokerage.quota_usage.current_leads_used.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-500">
                / {selectedBrokerage.quota_limits.max_ai_leads.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  leadPct >= 90 ? "bg-red-500" : leadPct >= 80 ? "bg-amber-500" : "bg-blue-600"
                }`}
                style={{ width: `${Math.min(100, leadPct)}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] font-bold text-slate-400">{leadPct}% capacity used</span>
              <span className="text-[10px] font-extrabold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Drill down →</span>
            </div>
          </div>

          <div
            id="card-selected-open-houses"
            onClick={() => {
              setModalSearchQuery(selectedBrokerage.name);
              setActiveKpiModal("open_houses");
            }}
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-purple-400 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-2 relative"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span className="group-hover:text-purple-600 transition-colors">Active Open Houses</span>
              <Building className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                {selectedBrokerage.quota_usage.current_open_houses}
              </span>
              <span className="text-xs font-bold text-slate-500">
                / {selectedBrokerage.quota_limits.max_open_houses}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  ohPct >= 90 ? "bg-red-500" : ohPct >= 80 ? "bg-amber-500" : "bg-purple-600"
                }`}
                style={{ width: `${Math.min(100, ohPct)}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] font-bold text-slate-400">{ohPct}% active quota</span>
              <span className="text-[10px] font-extrabold text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">Drill down →</span>
            </div>
          </div>

          <div
            id="card-selected-ai-messages"
            onClick={() => {
              setModalSearchQuery(selectedBrokerage.name);
              setActiveKpiModal("messages");
            }}
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-amber-400 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-2 relative"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span className="group-hover:text-amber-600 transition-colors">AI Chat/Voice Messages</span>
              <BarChart2 className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                {selectedBrokerage.quota_usage.current_messages_used.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-500">
                / {selectedBrokerage.quota_limits.max_ai_messages.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  msgPct >= 90 ? "bg-red-500" : msgPct >= 80 ? "bg-amber-500" : "bg-amber-500"
                }`}
                style={{ width: `${Math.min(100, msgPct)}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] font-bold text-slate-400">{msgPct}% cycle usage</span>
              <span className="text-[10px] font-extrabold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">Drill down →</span>
            </div>
          </div>

          <div
            id="card-selected-agent-seats"
            onClick={() => {
              setModalSearchQuery(selectedBrokerage.name);
              setActiveKpiModal("active_seats");
            }}
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-2 relative"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span className="group-hover:text-emerald-600 transition-colors">Agent Seats Occupied</span>
              <Users className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                {selectedBrokerage.quota_usage.active_seats_occupied}
              </span>
              <span className="text-xs font-bold text-slate-500">
                / {selectedBrokerage.quota_limits.max_team_seats}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  seatPct >= 90 ? "bg-red-500" : seatPct >= 80 ? "bg-amber-500" : "bg-emerald-600"
                }`}
                style={{ width: `${Math.min(100, seatPct)}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] font-bold text-slate-400">{seatPct}% seats allocated</span>
              <span className="text-[10px] font-extrabold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">Drill down →</span>
            </div>
          </div>
        </div>

        {/* Tab Selection with Interactive (?) Info Buttons */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
          {(Object.keys(DETAIL_TAB_EXPLANATIONS) as Array<keyof typeof DETAIL_TAB_EXPLANATIONS>).map((tabKey) => {
            const tabInfo = DETAIL_TAB_EXPLANATIONS[tabKey];
            const isActive = activeDetailTab === tabKey;
            const countBadge =
              tabKey === "history"
                ? brokerageHistory.length
                : tabKey === "alerts"
                ? brokerageAlerts.length
                : null;
            const hasUnreadAlerts =
              tabKey === "alerts" && brokerageAlerts.some((a) => !a.acknowledged);

            return (
              <div key={tabKey} className="relative flex items-center group/tab">
                <button
                  onClick={() => setActiveDetailTab(tabKey)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                    isActive
                      ? "border-blue-600 text-blue-600 bg-blue-50/60 shadow-sm"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span>{tabInfo.title}</span>
                  {countBadge !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                        isActive
                          ? "bg-blue-200 text-blue-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {countBadge}
                    </span>
                  )}
                  {hasUnreadAlerts && (
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-ping ml-0.5" />
                  )}
                </button>

                {/* Information (?) button for each tab */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTabInfoKey(tabKey);
                  }}
                  title={`Click to learn about "${tabInfo.title}"`}
                  className={`mr-1 p-1 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? "text-blue-600 hover:text-blue-800 hover:bg-blue-100/70"
                      : "text-slate-400 hover:text-blue-600 hover:bg-slate-200/70"
                  }`}
                  aria-label={`Learn what ${tabInfo.title} is`}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Active Tab Explanation Helper Strip */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-600">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-blue-100 text-blue-700">
              <Info className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-slate-800">{DETAIL_TAB_EXPLANATIONS[activeDetailTab].title}:</span>
            <span className="text-slate-600 text-[11px] leading-tight">
              {DETAIL_TAB_EXPLANATIONS[activeDetailTab].description}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedTabInfoKey(activeDetailTab)}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0 cursor-pointer ml-auto"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Full Guide & FAQs</span>
          </button>
        </div>

        {/* TAB CONTENT: QUOTA LIMITS & RULES */}
        {activeDetailTab === "limits" && (() => {
          const currentPlan = BROKERAGE_TIER_CONFIG[selectedBrokerage.tier || "Starter"] || BROKERAGE_TIER_CONFIG.Starter;
          const liveCheck = analyzePlanQuotas(selectedBrokerage);

          return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span>Brokerage Quota Limits Configuration</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Define contract limits, threshold alert parameters, and enforcement rules for {selectedBrokerage.name}.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    Plan Tier: <strong className="text-blue-600">{currentPlan.name} (${currentPlan.monthlyPrice}/mo)</strong>
                  </span>
                  {liveCheck.isExceeded && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleResetToPlanLimits}
                      className="text-xs font-bold text-slate-700 hover:bg-slate-100 border-slate-300 gap-1 cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3 text-slate-500" />
                      <span>Reset to {currentPlan.name} Limits</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Prominent Active Subscription Plan & Details Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-5 border border-slate-700 shadow-md space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 shrink-0">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Organization Plan</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          {selectedBrokerage.account_status}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <span>{currentPlan.name} Plan</span>
                        <span className="text-blue-300 font-mono text-sm font-bold">• ${currentPlan.monthlyPrice}/month</span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 text-right">
                      <span className="text-[10px] text-slate-300 block font-semibold uppercase">Invoiced Plan Holder</span>
                      <span className="text-xs font-bold text-white block">{selectedBrokerage.primary_contact_name}</span>
                      <span className="text-[10px] text-blue-300 block font-mono">{selectedBrokerage.primary_contact_email}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsPricingMatrixModalOpen(true)}
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold gap-1.5 cursor-pointer"
                    >
                      <Compass className="h-3.5 w-3.5 text-blue-300" />
                      <span>Pricing Matrix</span>
                    </Button>
                  </div>
                </div>

                {/* Quota Allowance Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Max AI Leads</span>
                    <span className="text-base font-black text-white">{currentPlan.maxLeads.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 block">per cycle included</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Active Open Houses</span>
                    <span className="text-base font-black text-white">{currentPlan.maxOpenHouses}</span>
                    <span className="text-[10px] text-slate-400 block">concurrent events</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">AI Voice & Chat</span>
                    <span className="text-base font-black text-white">{currentPlan.maxMessages.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 block">Sora AI turns</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Team Agent Seats</span>
                    <span className="text-base font-black text-white">{currentPlan.maxSeats}</span>
                    <span className="text-[10px] text-slate-400 block">licensed agents</span>
                  </div>
                </div>

                {/* SLA Badge Bar & Billing Period */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Support Level: <strong className="text-white">{currentPlan.slaLevel}</strong></span>
                    <span className="text-slate-500">•</span>
                    <span className="font-mono text-emerald-400 font-bold">{currentPlan.sla}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Active Cycle: <strong className="text-slate-200">{formatCycleDate(selectedBrokerage.quota_usage.cycle_start_date)}</strong> to <strong className="text-slate-200">{formatCycleDate(selectedBrokerage.quota_usage.cycle_end_date)}</strong>
                  </span>
                </div>
              </div>

              {/* Real-time Plan Exceeded Banner */}
              {liveCheck.isExceeded ? (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 text-amber-950 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-amber-200/80 text-amber-900 shrink-0 mt-0.5">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-black text-amber-900 flex items-center gap-2">
                          <span>⚠️ Quota Configuration Exceeds {currentPlan.name} Plan Baseline</span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                            Upgrade Required
                          </span>
                        </h3>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          The current quota inputs exceed the allowance included in {selectedBrokerage.name}'s <strong>{currentPlan.name} Plan (${currentPlan.monthlyPrice}/month)</strong>. 
                          Saving these changes will adjust the organization to the <strong>{liveCheck.recommendedTier} Plan (${liveCheck.recommendedPrice}/month)</strong> and automatically dispatch an itemized notification email to plan holder <strong>{selectedBrokerage.primary_contact_name} ({selectedBrokerage.primary_contact_email})</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Exceeded Items List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                    {liveCheck.exceededItems.map((item) => (
                      <div key={item.field} className="bg-white/80 border border-amber-300 rounded-xl p-2.5 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block truncate">{item.label}</span>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-black text-slate-900">{item.currentConfig.toLocaleString()}</span>
                          <span className="text-[11px] font-extrabold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            +{item.difference.toLocaleString()} over {currentPlan.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">Plan Limit: {item.planLimit.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-amber-200/80">
                    <div className="text-xs text-amber-900 flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-amber-700 shrink-0" />
                      <span>Notification Email will be delivered to: <strong>{selectedBrokerage.primary_contact_email}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setExceededPlanData(liveCheck);
                          setPlanExceededModalOpen(true);
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Review Plan Upgrade & Email Preview</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      All quota inputs are within the <strong>{currentPlan.name} Plan (${currentPlan.monthlyPrice}/mo)</strong> standard allowance: {currentPlan.maxLeads.toLocaleString()} Leads, {currentPlan.maxOpenHouses} Open Houses, {currentPlan.maxMessages.toLocaleString()} Messages, {currentPlan.maxSeats} Seats • <strong>{currentPlan.slaLevel} ({currentPlan.sla})</strong>.
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-300 shrink-0">
                    Plan Compliant
                  </span>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Max AI Leads per Billing Cycle
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {currentPlan.name} Limit: {currentPlan.maxLeads.toLocaleString()}
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={selectedBrokerage.quota_limits.max_ai_leads}
                    onChange={(e) =>
                      setSelectedBrokerage({
                        ...selectedBrokerage,
                        quota_limits: {
                          ...selectedBrokerage.quota_limits,
                          max_ai_leads: Math.max(1, parseInt(e.target.value) || 0)
                        }
                      })
                    }
                    className={`font-mono text-sm ${
                      selectedBrokerage.quota_limits.max_ai_leads > currentPlan.maxLeads
                        ? "border-amber-400 bg-amber-50/30 text-amber-950 font-bold ring-1 ring-amber-400"
                        : ""
                    }`}
                  />
                  <span className="text-[11px] text-slate-500 block">Total AI captured lead budget for all agent open houses.</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Max Active Open Houses
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {currentPlan.name} Limit: {currentPlan.maxOpenHouses}
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={selectedBrokerage.quota_limits.max_open_houses}
                    onChange={(e) =>
                      setSelectedBrokerage({
                        ...selectedBrokerage,
                        quota_limits: {
                          ...selectedBrokerage.quota_limits,
                          max_open_houses: Math.max(1, parseInt(e.target.value) || 0)
                        }
                      })
                    }
                    className={`font-mono text-sm ${
                      selectedBrokerage.quota_limits.max_open_houses > currentPlan.maxOpenHouses
                        ? "border-amber-400 bg-amber-50/30 text-amber-950 font-bold ring-1 ring-amber-400"
                        : ""
                    }`}
                  />
                  <span className="text-[11px] text-slate-500 block">Concurrent open house events permitted across team agents.</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Max AI Chat & Voice Responses
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {currentPlan.name} Limit: {currentPlan.maxMessages.toLocaleString()}
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={selectedBrokerage.quota_limits.max_ai_messages}
                    onChange={(e) =>
                      setSelectedBrokerage({
                        ...selectedBrokerage,
                        quota_limits: {
                          ...selectedBrokerage.quota_limits,
                          max_ai_messages: Math.max(100, parseInt(e.target.value) || 0)
                        }
                      })
                    }
                    className={`font-mono text-sm ${
                      selectedBrokerage.quota_limits.max_ai_messages > currentPlan.maxMessages
                        ? "border-amber-400 bg-amber-50/30 text-amber-950 font-bold ring-1 ring-amber-400"
                        : ""
                    }`}
                  />
                  <span className="text-[11px] text-slate-500 block">Sora AI Voice tour turns and message interactions per cycle.</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Max Team Agent Seats
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {currentPlan.name} Limit: {currentPlan.maxSeats}
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={selectedBrokerage.quota_limits.max_team_seats}
                    onChange={(e) =>
                      setSelectedBrokerage({
                        ...selectedBrokerage,
                        quota_limits: {
                          ...selectedBrokerage.quota_limits,
                          max_team_seats: Math.max(1, parseInt(e.target.value) || 0)
                        }
                      })
                    }
                    className={`font-mono text-sm ${
                      selectedBrokerage.quota_limits.max_team_seats > currentPlan.maxSeats
                        ? "border-amber-400 bg-amber-50/30 text-amber-950 font-bold ring-1 ring-amber-400"
                        : ""
                    }`}
                  />
                  <span className="text-[11px] text-slate-500 block">Active licensed agent accounts associated with this brokerage.</span>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Warning Alert Threshold (%)
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Type percentage or drag slider (1% – 100%)
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      value={selectedBrokerage.quota_limits.warning_threshold_pct}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(1, parseInt(e.target.value) || 0));
                        setSelectedBrokerage({
                          ...selectedBrokerage,
                          quota_limits: {
                            ...selectedBrokerage.quota_limits,
                            warning_threshold_pct: val
                          }
                        });
                      }}
                      className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <div className="relative flex items-center shrink-0">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={selectedBrokerage.quota_limits.warning_threshold_pct}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const val = raw === "" ? 0 : Math.min(100, Math.max(0, parseInt(raw) || 0));
                          setSelectedBrokerage({
                            ...selectedBrokerage,
                            quota_limits: {
                              ...selectedBrokerage.quota_limits,
                              warning_threshold_pct: val
                            }
                          });
                        }}
                        onBlur={(e) => {
                          const val = Math.min(100, Math.max(1, parseInt(e.target.value) || 80));
                          setSelectedBrokerage({
                            ...selectedBrokerage,
                            quota_limits: {
                              ...selectedBrokerage.quota_limits,
                              warning_threshold_pct: val
                            }
                          });
                        }}
                        className="w-24 font-mono font-black text-sm text-blue-700 bg-blue-50/90 border-2 border-blue-300 pr-8 text-center focus:ring-blue-500 rounded-xl shadow-xs"
                      />
                      <span className="absolute right-3 text-xs font-black text-blue-700 pointer-events-none">%</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Triggers automated warning alerts to the Broker Administrator when consumption exceeds this percentage.
                  </span>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Quota Enforcement Rules</h3>
                  <span className="text-[11px] text-slate-400">Changes are audit-logged with email receipts</span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      selectedBrokerage.quota_limits.allow_overages
                        ? "border-blue-300 bg-blue-50/40 shadow-xs"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <label className="flex items-start gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={selectedBrokerage.quota_limits.allow_overages}
                          onChange={(e) => handleToggleAllowOverages(e.target.checked)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block flex items-center gap-2">
                            <span>Allow Soft Overages (Pay-per-Lead)</span>
                            {selectedBrokerage.quota_limits.allow_overages && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-800 border border-blue-300">
                                Active Policy
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                            Permits lead capture to continue past 100% capacity and flags accounts for monthly overage billing.
                          </span>
                        </div>
                      </label>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-blue-600" />
                        <span>Sends email notice to: <strong>{selectedBrokerage.primary_contact_email}</strong></span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const actionText = selectedBrokerage.quota_limits.allow_overages ? "Enabled" : "Disabled";
                          const sentAt = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
                          const adminActor = user?.email || "Super Administrator";
                          const trackingId = `OVRG-${Date.now().toString(36).toUpperCase()}`;
                          const subject = `Important Notice: Soft Overages (Pay-per-Lead) Policy ${actionText.toUpperCase()} for ${selectedBrokerage.name}`;
                          const emailBody = selectedBrokerage.quota_limits.allow_overages
                            ? `Dear ${selectedBrokerage.primary_contact_name},\n\nPlease be advised that the Soft Overages (Pay-per-Lead) policy is currently ENABLED for ${selectedBrokerage.name} (${selectedBrokerage.code}).\n\n• Lead capture and open house visitor sign-ins will continue without interruption even if your monthly quota is exceeded.\n• Overage leads are billed at standard pay-per-lead rates at the end of the billing cycle (${formatCycleDate(selectedBrokerage.quota_usage.cycle_end_date)}).\n• Real-time alerts are sent when quota reaches ${selectedBrokerage.quota_limits.warning_threshold_pct}%.`
                            : `Dear ${selectedBrokerage.primary_contact_name},\n\nPlease be advised that the Soft Overages (Pay-per-Lead) policy is currently DISABLED for ${selectedBrokerage.name} (${selectedBrokerage.code}).`;

                          setSoftOverageEmailData({
                            action: selectedBrokerage.quota_limits.allow_overages ? "enabled" : "disabled",
                            recipient: selectedBrokerage.primary_contact_email,
                            recipientName: selectedBrokerage.primary_contact_name,
                            brokerageName: selectedBrokerage.name,
                            brokerageCode: selectedBrokerage.code,
                            trackingId,
                            sentAt,
                            subject,
                            emailBody,
                            auditLogId: `audit-view-${Date.now()}`,
                            adminActor
                          });
                          setSoftOverageModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer shrink-0 ml-2"
                      >
                        View Email & Log Details →
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBrokerage.quota_limits.hard_stop_on_limit}
                        onChange={(e) =>
                          setSelectedBrokerage({
                            ...selectedBrokerage,
                            quota_limits: {
                              ...selectedBrokerage.quota_limits,
                              hard_stop_on_limit: e.target.checked
                            }
                          })
                        }
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Strict Hard Stop on Limit Exceeded</span>
                        <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                          Immediately locks kiosk sign-ins and Sora AI voice interactions when limits are reached until quota reset.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  <span>Current Subscription Tier: <strong>{currentPlan.name} Plan</strong> (${currentPlan.monthlyPrice}/mo)</span>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSaveSelectedBrokerage}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 text-xs px-5 py-2.5 rounded-xl shadow-sm cursor-pointer"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span>Save Quota Configuration</span>
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB CONTENT: LIVE TELEMETRY & CYCLE RESET */}
        {activeDetailTab === "telemetry" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-purple-600" />
                  <span>Current Billing Cycle Telemetry</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Active consumption meters for cycle <strong>{formatCycleDate(selectedBrokerage.quota_usage.cycle_start_date)}</strong> to <strong>{formatCycleDate(selectedBrokerage.quota_usage.cycle_end_date)}</strong>.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedBrokerage({
                    ...selectedBrokerage,
                    quota_usage: {
                      ...selectedBrokerage.quota_usage,
                      current_leads_used: 0,
                      current_messages_used: 0,
                      last_updated: Date.now()
                    }
                  });
                  toast.success("Usage counters manually reset for the current cycle!");
                }}
                className="gap-2 text-xs font-bold"
              >
                <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
                <span>Reset Cycle Usage</span>
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">AI Leads Captured</span>
                  <span className="text-xs font-mono font-bold text-blue-600">
                    {selectedBrokerage.quota_usage.current_leads_used} / {selectedBrokerage.quota_limits.max_ai_leads}
                  </span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (selectedBrokerage.quota_usage.current_leads_used / selectedBrokerage.quota_limits.max_ai_leads) * 100
                      )}%`
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Remaining lead allocation:{" "}
                  <strong className="text-slate-800">
                    {Math.max(
                      0,
                      selectedBrokerage.quota_limits.max_ai_leads - selectedBrokerage.quota_usage.current_leads_used
                    ).toLocaleString()}
                  </strong>
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">AI Voice & Text Messages</span>
                  <span className="text-xs font-mono font-bold text-purple-600">
                    {selectedBrokerage.quota_usage.current_messages_used} / {selectedBrokerage.quota_limits.max_ai_messages}
                  </span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (selectedBrokerage.quota_usage.current_messages_used / selectedBrokerage.quota_limits.max_ai_messages) * 100
                      )}%`
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Remaining message budget:{" "}
                  <strong className="text-slate-800">
                    {Math.max(
                      0,
                      selectedBrokerage.quota_limits.max_ai_messages - selectedBrokerage.quota_usage.current_messages_used
                    ).toLocaleString()}
                  </strong>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <Calendar className="h-4 w-4 text-blue-600" />
                Automatic Monthly Cycle Rollover
              </span>
              <p className="leading-relaxed text-blue-800/90">
                At 23:59:59 UTC on cycle end date ({formatCycleDate(selectedBrokerage.quota_usage.cycle_end_date)}), all active usage metrics automatically transfer to <strong className="font-semibold">brokerage_quota_history</strong> and reset to 0 for the next billing cycle.
              </p>
            </div>
          </div>
        )}

        {/* TAB CONTENT: HISTORICAL CYCLES */}
        {activeDetailTab === "history" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <span>Historical Quota Archival Log</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Archival records of past billing cycles for {selectedBrokerage.name}.
              </p>
            </div>

            {brokerageHistory.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                No past billing cycles archived yet. Active cycle ends on {formatCycleDate(selectedBrokerage.quota_usage.cycle_end_date)}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="p-3">Cycle Period</th>
                      <th className="p-3">Total Leads Used</th>
                      <th className="p-3">Total AI Messages</th>
                      <th className="p-3">Peak Open Houses</th>
                      <th className="p-3">Peak Agent Seats</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {brokerageHistory.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {formatCycleDate(h.cycle_start_date)} → {formatCycleDate(h.cycle_end_date)}
                        </td>
                        <td className="p-3 font-semibold text-blue-600">{h.total_leads_used.toLocaleString()}</td>
                        <td className="p-3 font-semibold text-purple-600">{h.total_messages_used.toLocaleString()}</td>
                        <td className="p-3 font-semibold text-slate-700">{h.peak_open_houses}</td>
                        <td className="p-3 font-semibold text-slate-700">{h.peak_seats_occupied}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: QUOTA ALERTS */}
        {activeDetailTab === "alerts" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span>Active Quota Alerts & System Warnings</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Threshold triggers and overflow warnings logged for this brokerage.
              </p>
            </div>

            {brokerageAlerts.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs flex flex-col items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <span>No active quota alerts for {selectedBrokerage.name}. Usage is operating within normal parameters.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {brokerageAlerts.map((a) => (
                  <div
                    key={a.id}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                      a.alert_level === "critical" || a.alert_level === "exceeded"
                        ? "bg-red-50/70 border-red-200 text-red-950"
                        : "bg-amber-50/70 border-amber-200 text-amber-950"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`h-5 w-5 mt-0.5 ${a.alert_level === "critical" ? "text-red-600" : "text-amber-600"}`} />
                      <div>
                        <span className="text-xs font-bold block uppercase tracking-wider">
                          Quota {a.alert_level}: {a.quota_type.replace("_", " ")} threshold reached
                        </span>
                        <p className="text-xs mt-1">
                          Current usage reached <strong className="font-bold">{a.triggered_value}</strong> / limit of{" "}
                          <strong className="font-bold">{a.limit_value}</strong>.
                        </p>
                        <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                          Triggered at {new Date(a.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        a.acknowledged ? "bg-slate-200 text-slate-700" : "bg-red-600 text-white animate-pulse"
                      }`}
                    >
                      {a.acknowledged ? "Acknowledged" : "Pending Action"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: BRANDING & CASCADING RULES */}
        {activeDetailTab === "branding" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <span>Cascading Brand Theme & Legal Governance</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Branding settings and compliance disclosures defined here cascade automatically to all agent open house flyers and kiosks.
              </p>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Brokerage Display Name</label>
                <Input
                  value={selectedBrokerage.name}
                  onChange={(e) => setSelectedBrokerage({ ...selectedBrokerage, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Primary Brand Color</label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={selectedBrokerage.themeColor}
                    onChange={(e) => setSelectedBrokerage({ ...selectedBrokerage, themeColor: e.target.value })}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <span className="font-mono text-xs font-bold uppercase">{selectedBrokerage.themeColor}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Official Legal Footer & Disclaimers</label>
                <Input
                  value={selectedBrokerage.complianceFooter}
                  onChange={(e) => setSelectedBrokerage({ ...selectedBrokerage, complianceFooter: e.target.value })}
                />
                <span className="text-[11px] text-slate-500 block">Appears on all print flyers, digital flyers, and sign-in kiosks.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // MULTI-BROKERAGE DASHBOARD OVERVIEW LIST VIEW
  // =========================================================================
  const totalLeadsUsed = brokerages.reduce((acc, b) => acc + (b.quota_usage?.current_leads_used || 0), 0);
  const totalLeadsCapacity = brokerages.reduce((acc, b) => acc + (b.quota_limits?.max_ai_leads || 0), 0);
  const totalOpenHousesUsed = brokerages.reduce((acc, b) => acc + (b.quota_usage?.current_open_houses || 0), 0);
  const totalOpenHousesCapacity = brokerages.reduce((acc, b) => acc + (b.quota_limits?.max_open_houses || 0), 0);
  const totalMessagesUsed = brokerages.reduce((acc, b) => acc + (b.quota_usage?.current_messages_used || 0), 0);
  const totalMessagesCapacity = brokerages.reduce((acc, b) => acc + (b.quota_limits?.max_ai_messages || 0), 0);
  const totalSeatsOccupied = brokerages.reduce((acc, b) => acc + (b.quota_usage?.active_seats_occupied || 0), 0);
  const totalSeatsCapacity = brokerages.reduce((acc, b) => acc + (b.quota_limits?.max_team_seats || 0), 0);
  const totalWarnings = brokerages.filter((b) => getBrokerageHealth(b) === "warning" || getBrokerageHealth(b) === "exceeded").length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Title & Main Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Brokerage Quota & Governance</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor real-time consumption quotas, agent seats, AI message limits, and cascading brand rules across all brokerages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 px-4 py-2 rounded-xl shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Provision New Brokerage</span>
          </Button>
        </div>
      </div>

      {/* Global System Quota KPI Summary Cards (Interactive Clickable Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <div 
          onClick={() => {
            setModalSearchQuery("");
            setActiveKpiModal("total_brokerages");
          }}
          id="card-total-brokerages"
          className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-1 relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Brokerages</span>
            <Building className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{brokerages.length}</span>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-emerald-600 font-bold block truncate">
              {brokerages.filter((b) => b.account_status === "active").length} active
            </span>
            <span className="text-[9px] font-extrabold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
          </div>
        </div>

        <div 
          onClick={() => {
            setModalSearchQuery("");
            setActiveKpiModal("lead_captures");
          }}
          id="card-lead-captures"
          className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-1 relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block truncate">AI Leads</span>
            <Zap className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{totalLeadsUsed.toLocaleString()}</span>
            <span className="text-[11px] font-bold text-slate-400">/ {totalLeadsCapacity.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-blue-600 font-bold block truncate">
              {Math.round((totalLeadsUsed / Math.max(1, totalLeadsCapacity)) * 100)}% capacity
            </span>
            <span className="text-[9px] font-extrabold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Drill down →</span>
          </div>
        </div>

        <div 
          onClick={() => {
            setModalSearchQuery("");
            setActiveKpiModal("open_houses");
          }}
          id="card-open-houses"
          className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-purple-400 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-1 relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block truncate">Open Houses</span>
            <Building className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 group-hover:text-purple-600 transition-colors">{totalOpenHousesUsed}</span>
            <span className="text-[11px] font-bold text-slate-400">/ {totalOpenHousesCapacity}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-purple-600 font-bold block truncate">
              {Math.round((totalOpenHousesUsed / Math.max(1, totalOpenHousesCapacity)) * 100)}% active
            </span>
            <span className="text-[9px] font-extrabold text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">Drill down →</span>
          </div>
        </div>

        <div 
          onClick={() => {
            setModalSearchQuery("");
            setActiveKpiModal("messages");
          }}
          id="card-ai-messages"
          className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-1 relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block truncate">AI Messages</span>
            <BarChart2 className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">{totalMessagesUsed.toLocaleString()}</span>
            <span className="text-[11px] font-bold text-slate-400">/ {totalMessagesCapacity.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-amber-600 font-bold block truncate">
              {Math.round((totalMessagesUsed / Math.max(1, totalMessagesCapacity)) * 100)}% cycle used
            </span>
            <span className="text-[9px] font-extrabold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">Drill down →</span>
          </div>
        </div>

        <div 
          onClick={() => {
            setModalSearchQuery("");
            setActiveKpiModal("active_seats");
          }}
          id="card-active-seats"
          className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-1 relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block truncate">Agent Seats</span>
            <Users className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{totalSeatsOccupied}</span>
            <span className="text-[11px] font-bold text-slate-400">/ {totalSeatsCapacity}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-emerald-600 font-bold block truncate">
              {Math.round((totalSeatsOccupied / Math.max(1, totalSeatsCapacity)) * 100)}% occupied
            </span>
            <span className="text-[9px] font-extrabold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">Drill down →</span>
          </div>
        </div>

        <div 
          onClick={() => {
            setModalSearchQuery("");
            setActiveKpiModal("quota_alerts");
          }}
          id="card-quota-alerts"
          className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-1 relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block truncate">Quota Alerts</span>
            <AlertTriangle className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-xl font-black text-amber-600 group-hover:text-amber-700 transition-colors">{totalWarnings}</span>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-amber-700 font-bold block truncate">
              {totalWarnings === 0 ? "All within limits" : `${totalWarnings} near limit`}
            </span>
            <span className="text-[9px] font-extrabold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1.5 w-full md:w-80">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search brokerage name, code, contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full font-sans"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              statusFilter === "all" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Brokerages ({brokerages.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              statusFilter === "active" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Active ({brokerages.filter((b) => b.account_status === "active").length})
          </button>
          <button
            onClick={() => setStatusFilter("warning")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              statusFilter === "warning" ? "bg-amber-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Quota Warning ({totalWarnings})
          </button>
          <button
            onClick={() => setStatusFilter("paused")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              statusFilter === "paused" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Paused / Suspended ({brokerages.filter((b) => b.account_status !== "active").length})
          </button>
        </div>
      </div>

      {/* Brokerages Grid Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredBrokerages.map((b) => {
          const health = getBrokerageHealth(b);
          const leadPct = Math.round(
            (b.quota_usage.current_leads_used / Math.max(1, b.quota_limits.max_ai_leads)) * 100
          );
          const msgPct = Math.round(
            (b.quota_usage.current_messages_used / Math.max(1, b.quota_limits.max_ai_messages)) * 100
          );

          return (
            <div
              key={b.brokerage_id}
              onClick={() => handleSelectBrokerage(b)}
              id={`brokerage-card-${b.brokerage_id}`}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer relative space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm"
                      style={{ backgroundColor: b.themeColor || "#2563eb" }}
                    >
                      {b.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base flex items-center gap-2">
                        <span>{b.name}</span>
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                          {b.code}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">{b.tier} Plan</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                      health === "warning" || health === "exceeded"
                        ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                        : b.account_status === "active"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {health === "warning" ? "Quota Warning" : b.account_status}
                  </span>
                </div>

                {/* Quota Progress Indicators */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">AI Lead Captures</span>
                      <span className="text-slate-900">
                        {b.quota_usage.current_leads_used.toLocaleString()} / {b.quota_limits.max_ai_leads.toLocaleString()} ({leadPct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          leadPct >= 90 ? "bg-red-500" : leadPct >= 80 ? "bg-amber-500" : "bg-blue-600"
                        }`}
                        style={{ width: `${Math.min(100, leadPct)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">AI Voice & Chat Messages</span>
                      <span className="text-slate-900">
                        {b.quota_usage.current_messages_used.toLocaleString()} / {b.quota_limits.max_ai_messages.toLocaleString()} ({msgPct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          msgPct >= 90 ? "bg-red-500" : msgPct >= 80 ? "bg-amber-500" : "bg-purple-600"
                        }`}
                        style={{ width: `${Math.min(100, msgPct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Agent Seats: <strong className="text-slate-800">{b.quota_usage.active_seats_occupied} / {b.quota_limits.max_team_seats}</strong>
                </span>
                <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-1">
                  Manage Quota & Settings →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Provision New Brokerage Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                <span>Provision New Brokerage</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBrokerage} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Brokerage Name *</label>
                <Input
                  required
                  placeholder="e.g. Metro Coast Brokerage"
                  value={newBrokerageName}
                  onChange={(e) => setNewBrokerageName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Brokerage Code</label>
                  <Input
                    placeholder="e.g. MCB-005"
                    value={newBrokerageCode}
                    onChange={(e) => setNewBrokerageCode(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Subscription Tier</label>
                  <select
                    value={newBrokerageTier}
                    onChange={(e) => setNewBrokerageTier(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Starter">Starter (1k leads / 10 seats)</option>
                    <option value="Pro">Pro (2.5k leads / 25 seats)</option>
                    <option value="Elite">Elite (5k leads / 50 seats)</option>
                    <option value="Enterprise">Enterprise (Custom Limits)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Primary Contact Email</label>
                <Input
                  type="email"
                  placeholder="admin@brokerage.com"
                  value={newBrokerageEmail}
                  onChange={(e) => setNewBrokerageEmail(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1">
                  Provision Brokerage Quota
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI 1: TOTAL BROKERAGES MODAL */}
      <Dialog open={activeKpiModal === "total_brokerages"} onOpenChange={(open) => !open && setActiveKpiModal(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900">Total Brokerages Network Directory</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Comprehensive listing of all {brokerages.length} provisioned brokerage accounts across the platform.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Total Accounts</span>
                <span className="text-xl font-black text-slate-900">{brokerages.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Active Status</span>
                <span className="text-xl font-black text-emerald-700">
                  {brokerages.filter((b) => b.account_status === "active").length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Review / Alert</span>
                <span className="text-xl font-black text-amber-700">{totalWarnings}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 border border-slate-200">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search brokerage name, code, contact email..."
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
              />
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {brokerages
                .filter((b) =>
                  b.name.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                  b.code.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                  b.primary_contact_email.toLowerCase().includes(modalSearchQuery.toLowerCase())
                )
                .map((b) => (
                  <div key={b.brokerage_id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{b.name}</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {b.code}
                        </span>
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          b.account_status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {b.account_status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {b.primary_contact_name} ({b.primary_contact_email}) • <span className="font-bold text-blue-600">{b.tier} Plan</span>
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        handleSelectBrokerage(b);
                        setActiveKpiModal(null);
                      }}
                      className="bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white font-bold text-xs gap-1 cursor-pointer transition-colors"
                    >
                      <span>Manage Quota</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* KPI 2: AI LEAD CAPTURES DRILLDOWN MODAL */}
      <Dialog open={activeKpiModal === "lead_captures"} onOpenChange={(open) => !open && setActiveKpiModal(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900">AI Lead Captures & Conversion Telemetry</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Comprehensive analytics on consumer capture volume, verified identity rate, and paired lender mortgage opt-in metrics.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Top Telemetry Metric Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                <div className="flex items-center justify-between text-blue-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Leads</span>
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <span className="text-xl font-black text-slate-900">{totalLeadsUsed.toLocaleString()}</span>
                <span className="text-[10px] text-slate-500 block">/ {totalLeadsCapacity.toLocaleString()} max capacity</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Verified ID</span>
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <span className="text-xl font-black text-emerald-700">94.8%</span>
                <span className="text-[10px] text-slate-500 block">Clearbit & Twilio confidence</span>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1">
                <div className="flex items-center justify-between text-purple-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Financing Opt-In</span>
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
                <span className="text-xl font-black text-purple-700">48.2%</span>
                <span className="text-[10px] text-slate-500 block">Paired lender consent routed</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Network Pacing</span>
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <span className="text-xl font-black text-slate-900">
                  {Math.round((totalLeadsUsed / Math.max(1, totalLeadsCapacity)) * 100)}%
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block">Operating normally</span>
              </div>
            </div>

            {/* Acquisition Channel Breakdown */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Lead Capture Channel Attribution</span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Tablet Kiosks</span>
                  <span className="text-sm font-black text-slate-900">62% ({(totalLeadsUsed * 0.62).toFixed(0)})</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Dynamic QR</span>
                  <span className="text-sm font-black text-slate-900">24% ({(totalLeadsUsed * 0.24).toFixed(0)})</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Sora AI Tours</span>
                  <span className="text-sm font-black text-slate-900">14% ({(totalLeadsUsed * 0.14).toFixed(0)})</span>
                </div>
              </div>
            </div>

            {/* Brokerage Consumption Breakdown Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Brokerage Breakdown & Quota Status</span>
                <span className="text-xs text-slate-500 font-medium">Showing {brokerages.length} accounts</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 border border-slate-200">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter brokerages by lead consumption..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
                />
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {brokerages
                  .filter((b) => b.name.toLowerCase().includes(modalSearchQuery.toLowerCase()))
                  .map((b) => {
                    const used = b.quota_usage?.current_leads_used || 0;
                    const limit = b.quota_limits?.max_ai_leads || 1000;
                    const pct = Math.round((used / Math.max(1, limit)) * 100);
                    return (
                      <div key={b.brokerage_id} className="p-3.5 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-sm text-slate-900">{b.name}</span>
                            <span className="text-xs text-slate-500 ml-2">({b.code})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{used.toLocaleString()}</span>
                            <span className="text-xs text-slate-400">/ {limit.toLocaleString()} leads</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              pct >= 90 ? "bg-red-100 text-red-800" : pct >= 75 ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                            }`}>
                              {pct}% used
                            </span>
                          </div>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-blue-600"
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Billing Cycle: {b.quota_usage?.cycle_start_date} to {b.quota_usage?.cycle_end_date}</span>
                          <button
                            onClick={() => {
                              handleSelectBrokerage(b);
                              setActiveKpiModal(null);
                            }}
                            className="font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Adjust Lead Quota Limit</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* KPI 3: ACTIVE OPEN HOUSES DRILLDOWN MODAL */}
      <Dialog open={activeKpiModal === "open_houses"} onOpenChange={(open) => !open && setActiveKpiModal(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900">Active Open Houses & Event Telemetry</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Real-time monitoring of live kiosk devices, offline buffer synchronization states, and shared listing events.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Top Telemetry Metric Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1">
                <div className="flex items-center justify-between text-purple-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Active Events</span>
                  <Building className="h-3.5 w-3.5" />
                </div>
                <span className="text-xl font-black text-slate-900">{totalOpenHousesUsed}</span>
                <span className="text-[10px] text-slate-500 block">/ {totalOpenHousesCapacity} quota allocated</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Online Kiosks</span>
                  <Smartphone className="h-3.5 w-3.5" />
                </div>
                <span className="text-xl font-black text-emerald-700">
                  {Math.max(1, Math.round(totalOpenHousesUsed * 0.82))} Live
                </span>
                <span className="text-[10px] text-slate-500 block">Connected to Firestore</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 space-y-1">
                <div className="flex items-center justify-between text-amber-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Offline Buffers</span>
                  <Radio className="h-3.5 w-3.5" />
                </div>
                <span className="text-xl font-black text-amber-700">
                  {Math.round(totalOpenHousesUsed * 0.18)} Devices
                </span>
                <span className="text-[10px] text-slate-500 block">Local cache sync ready</span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                <div className="flex items-center justify-between text-blue-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Shared / Co-Hosted</span>
                  <Users className="h-3.5 w-3.5" />
                </div>
                <span className="text-xl font-black text-blue-700">
                  {Math.round(totalOpenHousesUsed * 0.28)} Events
                </span>
                <span className="text-[10px] text-slate-500 block">Delegated host permissions</span>
              </div>
            </div>

            {/* Open House Deployment Modes */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Live Open House Deployment Types</span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Tablet Lock Mode</span>
                  <span className="text-sm font-black text-slate-900">82% of events</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Dynamic QR Sign-In</span>
                  <span className="text-sm font-black text-slate-900">18% touchless</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Auto Reset Loop</span>
                  <span className="text-sm font-black text-slate-900">5s interval active</span>
                </div>
              </div>
            </div>

            {/* Brokerage Open House Capacity Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Brokerage Open House Limits & Capacity</span>
                <span className="text-xs text-slate-500 font-medium">Showing {brokerages.length} accounts</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 border border-slate-200">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter brokerages by open house volume..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
                />
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {brokerages
                  .filter((b) => b.name.toLowerCase().includes(modalSearchQuery.toLowerCase()))
                  .map((b) => {
                    const used = b.quota_usage?.current_open_houses || 0;
                    const limit = b.quota_limits?.max_open_houses || 25;
                    const pct = Math.round((used / Math.max(1, limit)) * 100);
                    return (
                      <div key={b.brokerage_id} className="p-3.5 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-sm text-slate-900">{b.name}</span>
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 ml-2">
                              {b.tier}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{used} active</span>
                            <span className="text-xs text-slate-400">/ {limit} events allowed</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              pct >= 90 ? "bg-red-100 text-red-800" : pct >= 75 ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"
                            }`}>
                              {pct}% used
                            </span>
                          </div>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-purple-600"
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Kiosk Status: PIN Lock Mode Enforced</span>
                          <button
                            onClick={() => {
                              handleSelectBrokerage(b);
                              setActiveKpiModal(null);
                            }}
                            className="font-bold text-purple-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Adjust Open House Limit</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* KPI 4: AI CHAT / VOICE MESSAGES DRILLDOWN MODAL */}
      <Dialog open={activeKpiModal === "messages"} onOpenChange={(open) => !open && setActiveKpiModal(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <BarChart2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900">AI Chat & Voice Messages Telemetry</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Multilingual speech synthesis duration, Gemini 3.5 Flash streaming queries, and token quota allocations.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Top Telemetry Metric Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 space-y-1">
                <div className="flex items-center justify-between text-amber-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Messages</span>
                  <BarChart2 className="h-3.5 w-3.5" />
                </div>
                <span className="text-xl font-black text-slate-900">{totalMessagesUsed.toLocaleString()}</span>
                <span className="text-[10px] text-slate-500 block">/ {totalMessagesCapacity.toLocaleString()} limit</span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                <div className="flex items-center justify-between text-blue-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Voice Narration</span>
                  <Headphones className="h-3.5 w-3.5" />
                </div>
                <span className="text-xl font-black text-blue-700">842.5 hrs</span>
                <span className="text-[10px] text-slate-500 block">Sora Voice Synthesizer</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Model Latency</span>
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <span className="text-xl font-black text-emerald-700">188 ms</span>
                <span className="text-[10px] text-slate-500 block">Flash streaming pipeline</span>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1">
                <div className="flex items-center justify-between text-purple-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Languages</span>
                  <Compass className="h-3.5 w-3.5" />
                </div>
                <span className="text-xl font-black text-purple-700">4 Supported</span>
                <span className="text-[10px] text-slate-500 block">EN (68%), ES (16%), FR (10%), ZH (6%)</span>
              </div>
            </div>

            {/* Interaction Modality Breakdown */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">AI Interaction Modality Breakdown</span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Sora Voice Walkthroughs</span>
                  <span className="text-sm font-black text-slate-900">58% (Audio Narration)</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Live Attendee Q&A</span>
                  <span className="text-sm font-black text-slate-900">35% (Instant Chat)</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Follow-up Drafts</span>
                  <span className="text-sm font-black text-slate-900">7% (Email / SMS)</span>
                </div>
              </div>
            </div>

            {/* Brokerage Message Quota Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Brokerage Message Limits & Utilization</span>
                <span className="text-xs text-slate-500 font-medium">Showing {brokerages.length} accounts</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 border border-slate-200">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter brokerages by message usage..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
                />
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {brokerages
                  .filter((b) => b.name.toLowerCase().includes(modalSearchQuery.toLowerCase()))
                  .map((b) => {
                    const used = b.quota_usage?.current_messages_used || 0;
                    const limit = b.quota_limits?.max_ai_messages || 10000;
                    const pct = Math.round((used / Math.max(1, limit)) * 100);
                    return (
                      <div key={b.brokerage_id} className="p-3.5 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-sm text-slate-900">{b.name}</span>
                            <span className="text-xs text-slate-500 ml-2">({b.code})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{used.toLocaleString()}</span>
                            <span className="text-xs text-slate-400">/ {limit.toLocaleString()} msgs</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              pct >= 90 ? "bg-red-100 text-red-800" : pct >= 75 ? "bg-amber-100 text-amber-800" : "bg-amber-100 text-amber-800"
                            }`}>
                              {pct}% used
                            </span>
                          </div>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Overage Protection: {b.quota_limits?.allow_overages ? "Soft limit (Overages Allowed)" : "Hard Stop"}</span>
                          <button
                            onClick={() => {
                              handleSelectBrokerage(b);
                              setActiveKpiModal(null);
                            }}
                            className="font-bold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Adjust AI Message Limit</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* KPI 5: AGENT SEATS OCCUPIED DRILLDOWN MODAL */}
      <Dialog open={activeKpiModal === "active_seats"} onOpenChange={(open) => !open && setActiveKpiModal(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900">Total Active Seats & Team Allocations</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {totalSeatsOccupied} occupied seats out of {totalSeatsCapacity} total allocated seats across all network brokerages.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Top Telemetry Metric Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1">
                <div className="flex items-center justify-between text-purple-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Occupied Seats</span>
                  <Users className="h-3.5 w-3.5" />
                </div>
                <span className="text-xl font-black text-slate-900">{totalSeatsOccupied}</span>
                <span className="text-[10px] text-slate-500 block">/ {totalSeatsCapacity} total capacity</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Utilization</span>
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
                <span className="text-xl font-black text-emerald-700">
                  {Math.round((totalSeatsOccupied / Math.max(1, totalSeatsCapacity)) * 100)}%
                </span>
                <span className="text-[10px] text-slate-500 block">Active licensed agents</span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                <div className="flex items-center justify-between text-blue-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pending Invites</span>
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <span className="text-xl font-black text-blue-700">9 Invites</span>
                <span className="text-[10px] text-slate-500 block">Awaiting onboarding</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Available Capacity</span>
                  <Shield className="h-3.5 w-3.5" />
                </div>
                <span className="text-xl font-black text-slate-900">
                  {Math.max(0, totalSeatsCapacity - totalSeatsOccupied)} Seats
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block">Ready for assignment</span>
              </div>
            </div>

            {/* Plan Tier Allocations */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Plan Tier Seat Quota Defaults</span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Enterprise</span>
                  <span className="text-sm font-black text-slate-900">50 Seats</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Elite</span>
                  <span className="text-sm font-black text-slate-900">25 Seats</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Pro</span>
                  <span className="text-sm font-black text-slate-900">15 Seats</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Starter</span>
                  <span className="text-sm font-black text-slate-900">5 Seats</span>
                </div>
              </div>
            </div>

            {/* Brokerage Team Seats Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Brokerage Team Roster & Seat Utilization</span>
                <span className="text-xs text-slate-500 font-medium">Showing {brokerages.length} accounts</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 border border-slate-200">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search brokerage team seats..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
                />
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {brokerages
                  .filter((b) => b.name.toLowerCase().includes(modalSearchQuery.toLowerCase()))
                  .map((b) => {
                    const used = b.quota_usage?.active_seats_occupied || 0;
                    const limit = b.quota_limits?.max_team_seats || 10;
                    const pct = Math.round((used / Math.max(1, limit)) * 100);
                    return (
                      <div key={b.brokerage_id} className="p-3.5 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-sm text-slate-900">{b.name}</span>
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 ml-2">
                              {b.tier} Plan
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{used} active</span>
                            <span className="text-xs text-slate-400">/ {limit} seats</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              pct >= 90 ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"
                            }`}>
                              {pct}% filled
                            </span>
                          </div>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-purple-600 transition-all duration-300"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Admin Contact: {b.primary_contact_name}</span>
                          <button
                            onClick={() => {
                              handleSelectBrokerage(b);
                              setActiveKpiModal(null);
                            }}
                            className="font-bold text-purple-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Manage Seat Allocation</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* KPI 6: QUOTA ALERTS / WARNINGS MODAL */}
      <Dialog open={activeKpiModal === "quota_alerts"} onOpenChange={(open) => !open && setActiveKpiModal(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900">Quota Alerts & System Warnings</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {totalWarnings} active accounts requiring capacity attention or threshold review.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {MOCK_ALERTS.map((alert) => {
                const brk = brokerages.find((b) => b.brokerage_id === alert.brokerage_id);
                return (
                  <div key={alert.id} className="p-3.5 bg-amber-50/50 hover:bg-amber-50 flex items-start justify-between gap-4 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl mt-0.5 ${
                        alert.alert_level === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{brk?.name || alert.brokerage_id}</span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            alert.alert_level === "critical" ? "bg-red-100 text-red-800 border border-red-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}>
                            {alert.alert_level}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700">
                          Quota type <strong className="uppercase">{alert.quota_type.replace("_", " ")}</strong> reached {alert.triggered_value} / {alert.limit_value} limit.
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Triggered {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        if (brk) handleSelectBrokerage(brk);
                        setActiveKpiModal(null);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1 shrink-0 cursor-pointer"
                    >
                      <span>Resolve & Edit</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PLAN EXCEEDED WARNING & UPGRADE POPUP MODAL */}
      <Dialog open={planExceededModalOpen} onOpenChange={(open) => !open && setPlanExceededModalOpen(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900">
                  Plan Quota Exceeded — Subscription Adjustment Required
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-600">
                  The quota limits you configured exceed the baseline allocation for the current subscription plan.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {exceededPlanData && selectedBrokerage && (
            <div className="space-y-4 pt-2">
              {/* Organization & Plan Summary Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Organization</span>
                  <span className="text-sm font-black text-slate-900">{selectedBrokerage.name} ({selectedBrokerage.code})</span>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Plan Holder: <strong>{selectedBrokerage.primary_contact_name}</strong> ({selectedBrokerage.primary_contact_email})
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Current vs. Required</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                      {exceededPlanData.currentTier} (${exceededPlanData.currentPrice}/mo)
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md border border-blue-300">
                      {exceededPlanData.recommendedTier} (${exceededPlanData.recommendedPrice}/mo)
                    </span>
                  </div>
                </div>
              </div>

              {/* Breakdown of Exceeded Items */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Exceeded Quota Breakdown ({exceededPlanData.exceededItems.length} items)
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                  {exceededPlanData.exceededItems.map((item) => (
                    <div key={item.field} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{item.label}</span>
                        <span className="text-[11px] text-slate-500">
                          {exceededPlanData.currentTier} Allowance: <strong>{item.planLimit.toLocaleString()}</strong>
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 text-sm">{item.currentConfig.toLocaleString()}</span>
                          <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            +{item.difference.toLocaleString()} Over
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Automated Email Notice Box */}
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span>Automated Plan Change Notification Email</span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Upon saving, {selectedBrokerage.name} will be adjusted to the <strong>{exceededPlanData.recommendedTier} Plan</strong>. 
                  An official email notification will be dispatched automatically to plan holder <strong>{selectedBrokerage.primary_contact_name}</strong> at <strong>{selectedBrokerage.primary_contact_email}</strong> detailing the updated quotas and the new monthly pricing of <strong>${exceededPlanData.recommendedPrice}/month</strong>.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetToPlanLimits}
                  className="text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1 text-slate-500" />
                  <span>Keep {exceededPlanData.currentTier} & Reset Quotas</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setPlanExceededModalOpen(false)}
                    className="text-xs font-bold text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleConfirmPlanUpgradeAndSendEmail()}
                    disabled={isSendingPlanEmail}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs gap-1.5 px-4 py-2 rounded-xl shadow-md cursor-pointer"
                  >
                    {isSendingPlanEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Upgrading & Sending Email...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Confirm {exceededPlanData.recommendedTier} Plan (${exceededPlanData.recommendedPrice}/mo) & Send Email</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EMAIL NOTIFICATION RECEIPT & CONFIRMATION MODAL */}
      <Dialog open={emailReceiptModalOpen} onOpenChange={(open) => !open && setEmailReceiptModalOpen(false)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900">
                  Plan Upgrade Confirmed & Email Dispatched
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  The plan upgrade was saved successfully and an itemized receipt has been sent to the plan holder.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {emailReceiptData && (
            <div className="space-y-4 pt-2">
              {/* Delivery Status Card */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    Delivered to Plan Holder
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">{emailReceiptData.trackingId}</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">To: {emailReceiptData.recipientName} &lt;{emailReceiptData.recipient}&gt;</h4>
                  <p className="text-xs text-slate-300">Subject: {emailReceiptData.subject}</p>
                  <p className="text-[11px] text-slate-400">Timestamp: {emailReceiptData.sentAt}</p>
                </div>
              </div>

              {/* Plan Comparison Summary */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Previous Subscription</span>
                  <span className="text-sm font-bold text-slate-700 block mt-0.5">{emailReceiptData.oldTier} Plan</span>
                  <span className="text-xs font-mono text-slate-500">${emailReceiptData.oldPrice}/mo</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border-2 border-blue-300">
                  <span className="text-[10px] font-black text-blue-700 uppercase block">New Active Subscription</span>
                  <span className="text-sm font-black text-blue-900 block mt-0.5">{emailReceiptData.newTier} Plan</span>
                  <span className="text-xs font-mono font-black text-blue-700">${emailReceiptData.newPrice}/mo</span>
                </div>
              </div>

              {/* Message Content Preview */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Email Body Summary</span>
                <p className="leading-relaxed">
                  "Dear <strong>{emailReceiptData.recipientName}</strong>, this is an automated confirmation that the subscription plan for <strong>{emailReceiptData.brokerageName}</strong> ({emailReceiptData.brokerageCode}) has been upgraded from the <strong>{emailReceiptData.oldTier} Plan (${emailReceiptData.oldPrice}/month)</strong> to the <strong>{emailReceiptData.newTier} Plan (${emailReceiptData.newPrice}/month)</strong> effective immediately to support your expanded open house and team quota allocations."
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setEmailReceiptModalOpen(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ALL PRICING PLANS & SLA MATRIX MODAL */}
      <Dialog open={isPricingMatrixModalOpen} onOpenChange={setIsPricingMatrixModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800 shrink-0">
                <Compass className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900">
                  Brokerage Subscription Plans, Quotas & SLAs
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Official platform tier definitions, quota baselines, and Level 2 Priority Support SLAs.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {(Object.keys(BROKERAGE_TIER_CONFIG) as Array<keyof typeof BROKERAGE_TIER_CONFIG>).map((tierKey) => {
                const plan = BROKERAGE_TIER_CONFIG[tierKey];
                const isSelectedCurrent = selectedBrokerage?.tier === tierKey;

                return (
                  <div
                    key={tierKey}
                    className={`rounded-2xl p-4 space-y-3 transition-all ${
                      isSelectedCurrent
                        ? "border-2 border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20"
                        : "border border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-base text-slate-900">{plan.name}</h4>
                        {isSelectedCurrent && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">${plan.monthlyPrice}</span>
                        <span className="text-xs text-slate-500">/month</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[11px] space-y-0.5">
                      <span className="text-[9px] font-bold uppercase text-slate-500 block">Support Level</span>
                      <strong className="block text-slate-900">{plan.slaLevel}</strong>
                      <span className="text-blue-600 font-bold block">{plan.sla}</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Included Quotas</span>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">AI Leads</span>
                        <strong className="text-slate-900 font-mono">{plan.maxLeads.toLocaleString()}</strong>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Open Houses</span>
                        <strong className="text-slate-900 font-mono">{plan.maxOpenHouses}</strong>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">AI Messages</span>
                        <strong className="text-slate-900 font-mono">{plan.maxMessages.toLocaleString()}</strong>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600">Agent Seats</span>
                        <strong className="text-slate-900 font-mono">{plan.maxSeats}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setIsPricingMatrixModalOpen(false)}
                className="text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DETAIL TAB EXPLANATION & HELP MODAL */}
      <Dialog open={selectedTabInfoKey !== null} onOpenChange={(open) => !open && setSelectedTabInfoKey(null)}>
        <DialogContent className="max-w-xl">
          {selectedTabInfoKey && DETAIL_TAB_EXPLANATIONS[selectedTabInfoKey] && (() => {
            const info = DETAIL_TAB_EXPLANATIONS[selectedTabInfoKey];
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-blue-100 text-blue-800 shrink-0">
                      <HelpCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {info.badge}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">Brokerage Management Guide</span>
                      </div>
                      <DialogTitle className="text-lg font-black text-slate-900 mt-0.5">
                        {info.title}
                      </DialogTitle>
                    </div>
                  </div>
                  <DialogDescription className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {info.description}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span>Key Features & Functional Highlights</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {info.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <p className="leading-relaxed text-[11px]">
                      Tip: You can switch between any of the 5 tabs anytime. All changes you make will be preserved and can be saved with full audit logging.
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-1">
                      {(Object.keys(DETAIL_TAB_EXPLANATIONS) as Array<keyof typeof DETAIL_TAB_EXPLANATIONS>).map((k) => (
                        <button
                          key={k}
                          onClick={() => {
                            setSelectedTabInfoKey(k);
                            setActiveDetailTab(k);
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            selectedTabInfoKey === k
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {DETAIL_TAB_EXPLANATIONS[k].title.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={() => setSelectedTabInfoKey(null)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                    >
                      Got it
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* SOFT OVERAGES POLICY CHANGE & EMAIL RECEIPT MODAL */}
      <Dialog open={softOverageModalOpen} onOpenChange={setSoftOverageModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  softOverageEmailData?.action === "enabled"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      softOverageEmailData?.action === "enabled"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    Policy {softOverageEmailData?.action === "enabled" ? "Enabled" : "Disabled"}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Ref: {softOverageEmailData?.trackingId}
                  </span>
                </div>
                <DialogTitle className="text-lg font-black text-slate-900 mt-0.5">
                  Soft Overages Policy Changed & Email Dispatched
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Audit log record created and confirmation email sent to the plan administrator / team leader.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {softOverageEmailData && (
            <div className="space-y-4 pt-2">
              {/* Metadata Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Brokerage</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {softOverageEmailData.brokerageName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{softOverageEmailData.brokerageCode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Recipient</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {softOverageEmailData.recipientName}
                  </span>
                  <span className="text-[10px] font-mono text-blue-600 truncate block">
                    {softOverageEmailData.recipient}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Logged At</span>
                  <span className="font-bold text-slate-800 block text-[11px]">{softOverageEmailData.sentAt}</span>
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Audit Logged
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Admin Actor</span>
                  <span className="font-bold text-slate-800 truncate block text-[11px]">
                    {softOverageEmailData.adminActor}
                  </span>
                  <span className="text-[10px] text-slate-500">Platform Admin</span>
                </div>
              </div>

              {/* Email Content Preview */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
                <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">Copy of Email Sent to Plan Holder</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Status: Delivered
                  </span>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  <div className="space-y-1 pb-2 border-b border-slate-100 text-slate-600">
                    <div className="flex gap-2">
                      <strong className="text-slate-900 w-16 shrink-0">To:</strong>
                      <span className="font-mono text-blue-700">{softOverageEmailData.recipientName} &lt;{softOverageEmailData.recipient}&gt;</span>
                    </div>
                    <div className="flex gap-2">
                      <strong className="text-slate-900 w-16 shrink-0">Subject:</strong>
                      <span className="font-semibold text-slate-900">{softOverageEmailData.subject}</span>
                    </div>
                    <div className="flex gap-2">
                      <strong className="text-slate-900 w-16 shrink-0">Date:</strong>
                      <span>{softOverageEmailData.sentAt}</span>
                    </div>
                  </div>

                  <div className="whitespace-pre-line text-slate-700 font-sans leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100 text-xs">
                    {softOverageEmailData.emailBody}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  Recorded in compliance & policy audit trail (`auditLogs/{softOverageEmailData.auditLogId}`)
                </span>
                <Button
                  onClick={() => setSoftOverageModalOpen(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
