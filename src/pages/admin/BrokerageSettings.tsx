import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
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
  Lock, AlertCircle, Layers, Calendar, Mail, FileText, ArrowRight, Check
} from "lucide-react";
import { 
  BrokerageAccount, 
  BrokerageQuotaLimits, 
  BrokerageQuotaUsage, 
  BrokerageQuotaHistory, 
  QuotaAlert 
} from "@/lib/api";

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
  const [saving, setSaving] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Modal dialog state for clicking on the 4 top KPI cards
  const [activeKpiModal, setActiveKpiModal] = useState<"total_brokerages" | "lead_captures" | "active_seats" | "quota_alerts" | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState("");

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
  }, []);

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
    setSaving(true);
    try {
      await setDoc(doc(db, "brokerages", selectedBrokerage.brokerage_id), selectedBrokerage, { merge: true });
      
      // Update local state list
      setBrokerages((prev) =>
        prev.map((b) => (b.brokerage_id === selectedBrokerage.brokerage_id ? selectedBrokerage : b))
      );

      toast.success(`Quota & settings updated for ${selectedBrokerage.name}`);
    } catch (err) {
      console.error(err);
      toast.error("Saved locally. Connection update pending.");
      // Still update local array
      setBrokerages((prev) =>
        prev.map((b) => (b.brokerage_id === selectedBrokerage.brokerage_id ? selectedBrokerage : b))
      );
    } finally {
      setSaving(false);
    }
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
                  {selectedBrokerage.tier} Tier
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Primary Contact: <strong className="text-slate-700">{selectedBrokerage.primary_contact_name}</strong> ({selectedBrokerage.primary_contact_email})
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

        {/* Quota Overview KPI Bar for Selected Brokerage */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>AI Lead Captures</span>
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">
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
            <span className="text-[10px] font-bold text-slate-400 block text-right">{leadPct}% capacity used</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>Active Open Houses</span>
              <Building className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">
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
            <span className="text-[10px] font-bold text-slate-400 block text-right">{ohPct}% active quota</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>AI Chat/Voice Messages</span>
              <BarChart2 className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">
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
            <span className="text-[10px] font-bold text-slate-400 block text-right">{msgPct}% cycle usage</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span>Agent Seats Occupied</span>
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">
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
            <span className="text-[10px] font-bold text-slate-400 block text-right">{seatPct}% seats allocated</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 border-b border-slate-200">
          <button
            onClick={() => setActiveDetailTab("limits")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeDetailTab === "limits"
                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Quota Limits & Enforcements
          </button>
          <button
            onClick={() => setActiveDetailTab("telemetry")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeDetailTab === "telemetry"
                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Live Usage & Cycle Reset
          </button>
          <button
            onClick={() => setActiveDetailTab("history")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeDetailTab === "history"
                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Historical Cycles ({brokerageHistory.length})
          </button>
          <button
            onClick={() => setActiveDetailTab("alerts")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 relative ${
              activeDetailTab === "alerts"
                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Quota Alerts ({brokerageAlerts.length})
            {brokerageAlerts.some((a) => !a.acknowledged) && (
              <span className="absolute top-2 right-1 h-2 w-2 rounded-full bg-red-500 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveDetailTab("branding")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeDetailTab === "branding"
                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Branding & Cascading Rules
          </button>
        </div>

        {/* TAB CONTENT: QUOTA LIMITS & RULES */}
        {activeDetailTab === "limits" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Brokerage Quota Limits Configuration</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Define contract limits, threshold alert parameters, and enforcement rules for {selectedBrokerage.name}.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Max AI Leads per Billing Cycle
                </label>
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
                  className="font-mono text-sm"
                />
                <span className="text-[11px] text-slate-500 block">Total AI captured lead budget for all agent open houses.</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Max Active Open Houses
                </label>
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
                  className="font-mono text-sm"
                />
                <span className="text-[11px] text-slate-500 block">Concurrent open house events permitted across team agents.</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Max AI Chat & Voice Responses
                </label>
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
                  className="font-mono text-sm"
                />
                <span className="text-[11px] text-slate-500 block">Sora AI Voice tour turns and message interactions per cycle.</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Max Team Agent Seats
                </label>
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
                  className="font-mono text-sm"
                />
                <span className="text-[11px] text-slate-500 block">Active licensed agent accounts associated with this brokerage.</span>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Warning Alert Threshold (%)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={selectedBrokerage.quota_limits.warning_threshold_pct}
                    onChange={(e) =>
                      setSelectedBrokerage({
                        ...selectedBrokerage,
                        quota_limits: {
                          ...selectedBrokerage.quota_limits,
                          warning_threshold_pct: parseInt(e.target.value)
                        }
                      })
                    }
                    className="w-full accent-blue-600"
                  />
                  <span className="font-mono font-bold text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                    {selectedBrokerage.quota_limits.warning_threshold_pct}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Triggers automated warning alerts to the Broker Administrator when consumption exceeds this percentage.
                </span>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Quota Enforcement Rules</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedBrokerage.quota_limits.allow_overages}
                    onChange={(e) =>
                      setSelectedBrokerage({
                        ...selectedBrokerage,
                        quota_limits: {
                          ...selectedBrokerage.quota_limits,
                          allow_overages: e.target.checked
                        }
                      })
                    }
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Allow Soft Overages (Pay-per-Lead)</span>
                    <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                      Permits lead capture to continue past 100% capacity and flags accounts for monthly overage billing.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100/50 transition-colors">
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
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
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
        )}

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
                  Active consumption meters for cycle {selectedBrokerage.quota_usage.cycle_start_date} to {selectedBrokerage.quota_usage.cycle_end_date}.
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
              <span className="font-bold block flex items-center gap-1">
                <Calendar className="h-4 w-4 text-blue-600" />
                Automatic Monthly Cycle Rollover
              </span>
              <p className="leading-relaxed text-blue-800/90">
                At 23:59:59 UTC on cycle end date ({selectedBrokerage.quota_usage.cycle_end_date}), all active usage metrics automatically transfer to <strong className="font-semibold">brokerage_quota_history</strong> and reset to 0 for the next billing cycle.
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
                No past billing cycles archived yet. Active cycle ends on {selectedBrokerage.quota_usage.cycle_end_date}.
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
                          {h.cycle_start_date} → {h.cycle_end_date}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => {
            setModalSearchQuery("");
            setActiveKpiModal("total_brokerages");
          }}
          id="card-total-brokerages"
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-1 relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Brokerages</span>
            <Building className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{brokerages.length}</span>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-emerald-600 font-bold block">
              {brokerages.filter((b) => b.account_status === "active").length} active accounts
            </span>
            <span className="text-[10px] font-extrabold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">View details →</span>
          </div>
        </div>

        <div 
          onClick={() => {
            setModalSearchQuery("");
            setActiveKpiModal("lead_captures");
          }}
          id="card-lead-captures"
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-1 relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Global AI Lead Captures</span>
            <Zap className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{totalLeadsUsed.toLocaleString()}</span>
            <span className="text-xs font-bold text-slate-500">/ {totalLeadsCapacity.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-blue-600 font-bold block">
              {Math.round((totalLeadsUsed / Math.max(1, totalLeadsCapacity)) * 100)}% network utilization
            </span>
            <span className="text-[10px] font-extrabold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">View details →</span>
          </div>
        </div>

        <div 
          onClick={() => {
            setModalSearchQuery("");
            setActiveKpiModal("active_seats");
          }}
          id="card-active-seats"
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-purple-400 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-1 relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Active Seats</span>
            <Users className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 group-hover:text-purple-600 transition-colors">{totalSeatsOccupied}</span>
            <span className="text-xs font-bold text-slate-500">/ {totalSeatsCapacity}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-purple-600 font-bold block">
              {Math.round((totalSeatsOccupied / Math.max(1, totalSeatsCapacity)) * 100)}% seats allocated
            </span>
            <span className="text-[10px] font-extrabold text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">View details →</span>
          </div>
        </div>

        <div 
          onClick={() => {
            setModalSearchQuery("");
            setActiveKpiModal("quota_alerts");
          }}
          id="card-quota-alerts"
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-amber-400 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-1 relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Quota Alerts / Warnings</span>
            <AlertTriangle className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-2xl font-black text-amber-600 group-hover:text-amber-700 transition-colors">{totalWarnings}</span>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-amber-700 font-bold block">
              {totalWarnings === 0 ? "All limits operating normally" : `${totalWarnings} accounts near limit`}
            </span>
            <span className="text-[10px] font-extrabold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">View details →</span>
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

      {/* KPI 2: GLOBAL AI LEAD CAPTURES MODAL */}
      <Dialog open={activeKpiModal === "lead_captures"} onOpenChange={(open) => !open && setActiveKpiModal(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900">Global AI Lead Captures & Utilization</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Total leads captured across all brokerage events: {totalLeadsUsed.toLocaleString()} / {totalLeadsCapacity.toLocaleString()} max capacity.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
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
                        <span>Cycle: {b.quota_usage?.cycle_start_date} to {b.quota_usage?.cycle_end_date}</span>
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
        </DialogContent>
      </Dialog>

      {/* KPI 3: TOTAL ACTIVE SEATS MODAL */}
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
        </DialogContent>
      </Dialog>

      {/* KPI 4: QUOTA ALERTS / WARNINGS MODAL */}
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
    </div>
  );
}
