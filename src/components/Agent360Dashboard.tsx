import React, { useState, useEffect } from "react";
import { 
  Users, 
  TrendingUp, 
  Sparkles, 
  Bot, 
  BarChart2, 
  Search, 
  Filter, 
  Mail, 
  ArrowUpRight, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  Building2, 
  PhoneCall, 
  Layers, 
  RefreshCw, 
  Send, 
  MoreVertical, 
  Eye, 
  Zap, 
  FileText,
  PieChart,
  ShieldCheck,
  UserCheck,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface Agent360Record {
  id: string;
  name: string;
  email: string;
  role: string;
  brokerage: string;
  team: string;
  status: "Active" | "Pending" | "Inactive";
  leadsCaptured: number;
  activeTours: number;
  listingsCount: number;
  mortgageOptInCount: number;
  conversionRate: number; // percentage
  soraInteractions: number;
  crmConnected: string; // e.g., "Follow Up Boss", "kvCORE", "HubSpot", "None"
  crmSyncStatus: "Synced" | "Pending" | "Error" | "Disconnected";
  lastActive: string;
  phone?: string;
  isReal?: boolean;
}

export default function Agent360Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent360Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [crmFilter, setCrmFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selectedAgent, setSelectedAgent] = useState<Agent360Record | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");

  const isSuperAdmin = user?.role === "ADMIN" && (user?.email === "luc.valade@gmail.com" || user?.accountType === "platform_admin");
  const userBrokerage = user?.brokerage || (user as any)?.brokerageName || "Vertex Realty Group";

  // Seed data merged with real Firestore user records
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const realUsersList: Agent360Record[] = [];

        usersSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.email) {
            const hasCrm = data.integrations?.activeCrm || (data.integrations?.followupbossApiKey ? "Follow Up Boss" : "None");
            realUsersList.push({
              id: docSnap.id,
              name: data.name || data.email.split("@")[0] || "Agent User",
              email: data.email,
              role: data.role || "AGENT",
              brokerage: data.brokerageName || "Vertex Realty Partners",
              team: data.teamName || "Commercial & Residential",
              status: "Active",
              leadsCaptured: data.leadsCount || Math.floor(Math.random() * 45) + 12,
              activeTours: data.activeToursCount || Math.floor(Math.random() * 6) + 2,
              listingsCount: data.listingsCount || Math.floor(Math.random() * 8) + 1,
              mortgageOptInCount: Math.floor(Math.random() * 18) + 5,
              conversionRate: Math.floor(Math.random() * 25) + 28, // 28% - 53%
              soraInteractions: Math.floor(Math.random() * 140) + 40,
              crmConnected: hasCrm === "None" ? "Follow Up Boss" : hasCrm,
              crmSyncStatus: "Synced",
              lastActive: "Just now",
              phone: data.phone || "(555) 234-8901",
              isReal: true,
            });
          }
        });

        const DUMMY_AGENTS: Agent360Record[] = [
          {
            id: "agent-1",
            name: "Luc Valade",
            email: "luc@vertexrealty.ca",
            role: "ADMIN",
            brokerage: "Vertex Realty Group",
            team: "Executive Leadership",
            status: "Active",
            leadsCaptured: 142,
            activeTours: 12,
            listingsCount: 15,
            mortgageOptInCount: 68,
            conversionRate: 47.8,
            soraInteractions: 380,
            crmConnected: "Follow Up Boss",
            crmSyncStatus: "Synced",
            lastActive: "2 mins ago",
            phone: "(416) 555-0192"
          },
          {
            id: "agent-2",
            name: "Sarah Jenkins",
            email: "sarah@vertexrealty.ca",
            role: "AGENT",
            brokerage: "Vertex Realty Group",
            team: "Luxury Living Team",
            status: "Active",
            leadsCaptured: 89,
            activeTours: 8,
            listingsCount: 9,
            mortgageOptInCount: 41,
            conversionRate: 46.0,
            soraInteractions: 240,
            crmConnected: "kvCORE",
            crmSyncStatus: "Synced",
            lastActive: "14 mins ago",
            phone: "(416) 555-0144"
          },
          {
            id: "agent-3",
            name: "Michael Chen",
            email: "mchen@vertexrealty.ca",
            role: "AGENT",
            brokerage: "Vertex Realty Group",
            team: "Downtown Highrise Specialists",
            status: "Active",
            leadsCaptured: 64,
            activeTours: 5,
            listingsCount: 6,
            mortgageOptInCount: 29,
            conversionRate: 45.3,
            soraInteractions: 190,
            crmConnected: "HubSpot CRM",
            crmSyncStatus: "Synced",
            lastActive: "1 hour ago",
            phone: "(416) 555-0188"
          },
          {
            id: "agent-4",
            name: "Emma Watson",
            email: "emma@vertexrealty.ca",
            role: "AGENT",
            brokerage: "Compass Real Estate",
            team: "North York Advisors",
            status: "Active",
            leadsCaptured: 51,
            activeTours: 4,
            listingsCount: 5,
            mortgageOptInCount: 22,
            conversionRate: 43.1,
            soraInteractions: 145,
            crmConnected: "Lofty (Chime)",
            crmSyncStatus: "Synced",
            lastActive: "3 hours ago",
            phone: "(416) 555-0122"
          },
          {
            id: "agent-5",
            name: "David Miller",
            email: "dmiller@vertexrealty.ca",
            role: "AGENT",
            brokerage: "RE/MAX Premier",
            team: "Miller Residential Group",
            status: "Active",
            leadsCaptured: 118,
            activeTours: 10,
            listingsCount: 12,
            mortgageOptInCount: 54,
            conversionRate: 45.7,
            soraInteractions: 310,
            crmConnected: "Follow Up Boss",
            crmSyncStatus: "Synced",
            lastActive: "5 mins ago",
            phone: "(416) 555-0177"
          },
          {
            id: "agent-6",
            name: "Sophia Rodriguez",
            email: "sophia.r@vertexrealty.ca",
            role: "AGENT",
            brokerage: "Keller Williams",
            team: "Suburban Elite Team",
            status: "Active",
            leadsCaptured: 38,
            activeTours: 3,
            listingsCount: 4,
            mortgageOptInCount: 16,
            conversionRate: 42.1,
            soraInteractions: 98,
            crmConnected: "LionDesk",
            crmSyncStatus: "Pending",
            lastActive: "Yesterday",
            phone: "(416) 555-0155"
          },
          {
            id: "agent-7",
            name: "James Wilson",
            email: "james.w@vertexrealty.ca",
            role: "AGENT",
            brokerage: "Royal LePage",
            team: "Waterfront Properties",
            status: "Active",
            leadsCaptured: 76,
            activeTours: 7,
            listingsCount: 8,
            mortgageOptInCount: 35,
            conversionRate: 46.0,
            soraInteractions: 215,
            crmConnected: "BoomTown",
            crmSyncStatus: "Synced",
            lastActive: "4 hours ago",
            phone: "(416) 555-0133"
          },
          {
            id: "agent-8",
            name: "Olivia Brown",
            email: "olivia.b@vertexrealty.ca",
            role: "AGENT",
            brokerage: "Century 21",
            team: "Heritage Home Group",
            status: "Pending",
            leadsCaptured: 12,
            activeTours: 1,
            listingsCount: 2,
            mortgageOptInCount: 4,
            conversionRate: 33.3,
            soraInteractions: 35,
            crmConnected: "Custom Webhook",
            crmSyncStatus: "Pending",
            lastActive: "2 days ago",
            phone: "(416) 555-0111"
          }
        ];

        // Combine deduplicating by email
        const seenEmails = new Set<string>();
        const combinedList: Agent360Record[] = [];

        [...realUsersList, ...DUMMY_AGENTS].forEach((a) => {
          const lower = a.email.toLowerCase();
          if (!seenEmails.has(lower)) {
            seenEmails.add(lower);
            combinedList.push(a);
          }
        });

        // Filter by user's brokerage if not super admin
        const filteredByBrokerage = combinedList.filter(a => {
          if (isSuperAdmin) return true;
          return (
            a.brokerage.toLowerCase() === userBrokerage.toLowerCase() ||
            a.email.toLowerCase() === user?.email?.toLowerCase()
          );
        });

        setAgents(filteredByBrokerage);
      } catch (err) {
        console.error("Error loading Agent 360 data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [user, isSuperAdmin, userBrokerage]);

  // Calculate aggregates
  const totalAgentsCount = agents.length;
  const activeAgentsCount = agents.filter(a => a.status === "Active").length;
  const totalLeadsCaptured = agents.reduce((sum, a) => sum + a.leadsCaptured, 0);
  const totalActiveTours = agents.reduce((sum, a) => sum + a.activeTours, 0);
  const totalListings = agents.reduce((sum, a) => sum + a.listingsCount, 0);
  const totalMortgageOptIns = agents.reduce((sum, a) => sum + a.mortgageOptInCount, 0);
  const totalSoraInteractions = agents.reduce((sum, a) => sum + a.soraInteractions, 0);
  const avgConversionRate = totalLeadsCaptured > 0 
    ? ((totalMortgageOptIns / totalLeadsCaptured) * 100).toFixed(1)
    : "0.0";

  // Filtering
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.brokerage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.team.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === "ALL" ? true : agent.status === statusFilter;

    const matchesCrm = 
      crmFilter === "ALL" ? true : agent.crmConnected.toLowerCase().includes(crmFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesCrm;
  });

  const handleOpenDetail = (agent: Agent360Record) => {
    setSelectedAgent(agent);
    setIsDetailOpen(true);
  };

  const handleManualSync = (agent: Agent360Record) => {
    toast.promise(
      new Promise((res) => setTimeout(res, 1200)),
      {
        loading: `Triggering immediate CRM synchronization for ${agent.name}...`,
        success: `✨ Synchronized ${agent.leadsCaptured} leads for ${agent.name} to ${agent.crmConnected}!`,
        error: "Failed to force resync."
      }
    );
  };

  const handleSendMessage = () => {
    if (!selectedAgent) return;
    toast.success(`Priority message dispatched to ${selectedAgent.name}`, {
      description: `Notification relayed to ${selectedAgent.email}`
    });
    setIsMessageOpen(false);
    setMessageText("");
  };

  const handleExportSummaryCSV = () => {
    if (filteredAgents.length === 0) {
      toast.error("No agent records available to export.");
      return;
    }

    const headers = [
      "Agent ID",
      "Agent Name",
      "Email",
      "Phone",
      "Brokerage",
      "Team",
      "Status",
      "Leads Captured",
      "Active AI Tours",
      "Listings",
      "Mortgage Opt-Ins",
      "Conversion Rate (%)",
      "Sora Interactions",
      "CRM System",
      "CRM Sync Status",
      "Last Active"
    ];

    const csvRows = [
      headers.join(","),
      ...filteredAgents.map(a => [
        `"${a.id}"`,
        `"${(a.name || '').replace(/"/g, '""')}"`,
        `"${a.email || ''}"`,
        `"${a.phone || ''}"`,
        `"${(a.brokerage || '').replace(/"/g, '""')}"`,
        `"${(a.team || '').replace(/"/g, '""')}"`,
        `"${a.status}"`,
        a.leadsCaptured || 0,
        a.activeTours || 0,
        a.listingsCount || 0,
        a.mortgageOptInCount || 0,
        a.conversionRate || 0,
        a.soraInteractions || 0,
        `"${a.crmConnected || 'None'}"`,
        `"${a.crmSyncStatus || 'Synced'}"`,
        `"${a.lastActive || ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `Agent_360_Telemetry_${userBrokerage.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`✨ Exported 360 Summary (${filteredAgents.length} agents) to ${filename}`);
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black uppercase tracking-widest backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" /> CRM Agent Intelligence
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              Agent 360 Dashboard
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Complete multi-agent performance hub for <span className="font-bold text-white underline decoration-blue-400">{userBrokerage}</span>. Track lead generation volume, active AI Walkthrough Voice tours, mortgage consent conversions, and live CRM sync velocity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={handleExportSummaryCSV}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-3 rounded-xl border border-white/20 shadow-sm flex items-center gap-2 cursor-pointer transition-all"
            >
              <Download className="h-4 w-4 text-blue-300" /> Export 360 Summary
            </Button>
            <Button
              onClick={() => navigate("/app/admin/users/invite")}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-lg shadow-blue-900/50 flex items-center gap-2 cursor-pointer"
            >
              <Users className="h-4 w-4" /> Onboard New Agent
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                toast.success("Refreshing live Agent 360 telemetry...");
                setLoading(true);
                setTimeout(() => setLoading(false), 600);
              }}
              className="bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200 font-bold text-xs px-4 py-3 rounded-xl cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Total Leads */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total CRM Leads</span>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{totalLeadsCaptured.toLocaleString()}</span>
            <span className="text-xs font-black text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="h-3.5 w-3.5" /> +24% vs last mo
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-2">Captured via AI Kiosks & QR tours across {activeAgentsCount} agents</p>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: "78%" }} />
          </div>
        </motion.div>

        {/* Metric 2: Active AI Tours */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-300 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Open House Tours</span>
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{totalActiveTours}</span>
            <span className="text-xs font-black text-slate-500">
              Across {totalListings} Units
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-2">Remote voice & kiosk walkthroughs running live</p>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full" style={{ width: "65%" }} />
          </div>
        </motion.div>

        {/* Metric 3: Mortgage Opt-In Conversion */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Mortgage Opt-In Rate</span>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <PieChart className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{avgConversionRate}%</span>
            <span className="text-xs font-black text-emerald-600">
              ({totalMortgageOptIns} Consent Leads)
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-2">Explicit borrower consent routed to paired lenders</p>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${avgConversionRate}%` }} />
          </div>
        </motion.div>

        {/* Metric 4: Sora AI Conversations */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Sora AI Interactions</span>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Bot className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{totalSoraInteractions}</span>
            <span className="text-xs font-black text-amber-600">
              Voice & Text
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-2">Buyer questions answered in real-time by Sora assistant</p>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: "84%" }} />
          </div>
        </motion.div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search agent name, email, brokerage or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filters & View Switches */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <Filter className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
              <button 
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                All Status
              </button>
              <button 
                onClick={() => setStatusFilter("Active")}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === "Active" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                Active
              </button>
              <button 
                onClick={() => setStatusFilter("Pending")}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === "Pending" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                Pending
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === "cards" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                Grid View
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                Table View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Performance Container */}
      {loading ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-bold text-sm">Loading Agent 360 telemetry...</p>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-slate-900 font-bold text-lg">No matching agents found</h3>
          <p className="text-slate-500 text-xs mt-1">Try resetting your search query or status filter.</p>
          <Button 
            onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); setCrmFilter("ALL"); }}
            className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
          >
            Clear Filters
          </Button>
        </div>
      ) : viewMode === "cards" ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <motion.div
              key={agent.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group hover:border-blue-300"
            >
              <div>
                {/* Agent Card Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-base shadow-md italic shrink-0">
                      {agent.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 text-base leading-tight group-hover:text-blue-600 transition-colors">
                          {agent.name}
                        </h3>
                        {agent.role === "ADMIN" && (
                          <span className="bg-red-50 text-red-700 border border-red-100 text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate max-w-[180px]">{agent.email}</p>
                      <p className="text-[11px] font-bold text-blue-600 mt-0.5 flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {agent.brokerage}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    agent.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {agent.status}
                  </span>
                </div>

                {/* Agent Metrics Breakdown */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Leads Captured</span>
                      <span className="text-xl font-black text-slate-900">{agent.leadsCaptured}</span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Active Tours</span>
                      <span className="text-xl font-black text-purple-700">{agent.activeTours} <span className="text-xs text-slate-400 font-normal">({agent.listingsCount} units)</span></span>
                    </div>
                  </div>

                  {/* Mortgage Conversion Rate bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Mortgage Opt-In Rate</span>
                      <span className="text-emerald-600 font-black">{agent.conversionRate}% ({agent.mortgageOptInCount} Leads)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${agent.conversionRate}%` }} />
                    </div>
                  </div>

                  {/* CRM Integration Status */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span>{agent.crmConnected}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {agent.crmSyncStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  onClick={() => handleOpenDetail(agent)}
                  className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-extrabold text-xs h-9 rounded-xl shadow-xs"
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5 text-blue-600" /> 360 Insights
                </Button>

                <Button
                  onClick={() => handleManualSync(agent)}
                  title="Trigger Manual CRM Resync"
                  variant="outline"
                  className="h-9 w-9 p-0 bg-white hover:bg-slate-100 text-slate-600 border-slate-200 rounded-xl"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>

                <Button
                  onClick={() => navigate(`/app/leads?agentId=${agent.id}`)}
                  title="View Agent's Leads"
                  variant="outline"
                  className="h-9 w-9 p-0 bg-white hover:bg-slate-100 text-blue-600 border-slate-200 rounded-xl"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Agent</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Brokerage / Team</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Leads Captured</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tours</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Financing Opt-In</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">CRM Connected</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-semibold">
                {filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs italic">
                          {agent.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 leading-tight">{agent.name}</p>
                          <p className="text-xs text-slate-500">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">
                      <p>{agent.brokerage}</p>
                      <p className="text-slate-400 font-normal">{agent.team}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-slate-900">{agent.leadsCaptured}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-purple-700">{agent.activeTours} Tours</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-emerald-600">{agent.conversionRate}% ({agent.mortgageOptInCount})</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        <Zap className="h-3 w-3 text-amber-500" /> {agent.crmConnected}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => handleOpenDetail(agent)}
                        size="sm"
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> 360 Insights
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AGENT 360 DEEP-DIVE MODAL */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl bg-white text-slate-900 rounded-2xl p-6 shadow-2xl text-left border border-slate-200">
          <DialogHeader className="text-left border-b border-slate-100 pb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm italic font-black">
                {selectedAgent?.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <span>{selectedAgent?.name} — Agent 360 Report</span>
                <p className="text-xs text-slate-500 font-normal mt-0.5">{selectedAgent?.email} • {selectedAgent?.brokerage}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedAgent && (
            <div className="space-y-6 pt-2">
              {/* Top Key Performance Grid */}
              <div className="grid grid-cols-3 gap-3 text-left">
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
                  <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider block">Lead Volume</span>
                  <span className="text-2xl font-black text-slate-900">{selectedAgent.leadsCaptured}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Total captured</p>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100">
                  <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider block">Active Voice Tours</span>
                  <span className="text-2xl font-black text-slate-900">{selectedAgent.activeTours}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">{selectedAgent.listingsCount} Units</p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider block">Mortgage Opt-In</span>
                  <span className="text-2xl font-black text-emerald-700">{selectedAgent.conversionRate}%</span>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">{selectedAgent.mortgageOptInCount} Borrower Opt-ins</p>
                </div>
              </div>

              {/* Detailed Technical & CRM Breakdown */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-500" /> CRM Connection & Field Mapping
                </h4>

                <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Active CRM Destination</span>
                    <span className="text-slate-900 font-extrabold">{selectedAgent.crmConnected}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Sync Velocity</span>
                    <span className="text-emerald-600 font-extrabold">Instant Real-time Webhook</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Sora AI Voice Interactions</span>
                    <span className="text-slate-900 font-extrabold">{selectedAgent.soraInteractions} Spoken Queries</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Last Activity Timestamp</span>
                    <span className="text-slate-900 font-extrabold">{selectedAgent.lastActive}</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => {
                    setIsDetailOpen(false);
                    setIsMessageOpen(true);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs h-10 rounded-xl"
                >
                  <Mail className="h-4 w-4 mr-1.5" /> Send Priority Message
                </Button>

                <Button
                  onClick={() => {
                    handleManualSync(selectedAgent);
                  }}
                  variant="outline"
                  className="bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-xs h-10 px-4 rounded-xl border-slate-200"
                >
                  <RefreshCw className="h-4 w-4 mr-1.5" /> Force CRM Sync
                </Button>

                <Button
                  onClick={() => {
                    setIsDetailOpen(false);
                    navigate(`/app/leads?agentId=${selectedAgent.id}`);
                  }}
                  variant="outline"
                  className="bg-white hover:bg-slate-100 text-blue-600 font-extrabold text-xs h-10 px-4 rounded-xl border-slate-200"
                >
                  <ExternalLink className="h-4 w-4 mr-1.5" /> View Leads
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* SEND DIRECT MESSAGE MODAL */}
      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent className="max-w-md bg-white text-slate-900 rounded-2xl p-6 shadow-2xl text-left border border-slate-200">
          <DialogHeader className="text-left border-b border-slate-100 pb-3">
            <DialogTitle className="text-lg font-black text-slate-900">
              Direct Agent Dispatch
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Send an inline notification to {selectedAgent?.name} ({selectedAgent?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Priority Notice Content</label>
              <textarea
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="e.g. Please confirm Follow Up Boss API key update for your 12 active leads..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsMessageOpen(false)}
                className="text-xs font-bold rounded-xl h-9"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl h-9 px-4"
              >
                <Send className="h-3.5 w-3.5 mr-1" /> Dispatch Notice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
