import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Users,
  Zap,
  Mic,
  TrendingUp,
  Building,
  Search,
  Filter,
  Download,
  CheckCircle2,
  PhoneCall,
  Mail,
  Calendar,
  Share2,
  ChevronRight,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Layers,
  UserCheck,
  FileSpreadsheet
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie
} from "recharts";

interface AgentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  brokerage: string;
  tier: string;
  crmConnected: boolean;
  crmType: string;
  pairedLender: string;
  totalListings: number;
  totalLeads: number;
  activeTours: number;
  conversionRate: number;
}

const MOCK_AGENTS: AgentProfile[] = [
  {
    id: "agent-001",
    name: "Danielle Vance",
    email: "danielle@vertexagent.com",
    phone: "(555) 234-5678",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    brokerage: "Vertex Agent Group",
    tier: "Elite",
    crmConnected: true,
    crmType: "Follow Up Boss",
    pairedLender: "Aether Mortgage Solutions (Marcus Sterling)",
    totalListings: 6,
    totalLeads: 184,
    activeTours: 5,
    conversionRate: 38.5
  },
  {
    id: "agent-002",
    name: "Marcus Sterling",
    email: "marcus@aetherhorizon.com",
    phone: "(555) 876-5432",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    brokerage: "Aether & Horizon Luxury Global",
    tier: "Enterprise",
    crmConnected: true,
    crmType: "Salesforce",
    pairedLender: "Horizon Capital Lenders",
    totalListings: 9,
    totalLeads: 312,
    activeTours: 8,
    conversionRate: 42.1
  },
  {
    id: "agent-003",
    name: "Sarah Jenkins",
    email: "sjenkins@pinnaclerealty.org",
    phone: "(555) 456-7890",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    brokerage: "Pinnacle Residential Realty",
    tier: "Pro",
    crmConnected: true,
    crmType: "HubSpot",
    pairedLender: "Pinnacle Home Loans",
    totalListings: 4,
    totalLeads: 96,
    activeTours: 3,
    conversionRate: 29.4
  },
  {
    id: "agent-004",
    name: "Robert Chen",
    email: "r.chen@centurypremier.com",
    phone: "(555) 345-6789",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    brokerage: "Century Premier Realty",
    tier: "Starter",
    crmConnected: false,
    crmType: "None",
    pairedLender: "Unassigned",
    totalListings: 2,
    totalLeads: 42,
    activeTours: 1,
    conversionRate: 21.0
  }
];

const MONTHLY_LEAD_DATA = [
  { month: "Jan", leads: 42, tours: 120, conversion: 22 },
  { month: "Feb", leads: 58, tours: 165, conversion: 28 },
  { month: "Mar", leads: 74, tours: 210, conversion: 31 },
  { month: "Apr", leads: 89, tours: 280, conversion: 35 },
  { month: "May", leads: 112, tours: 340, conversion: 37 },
  { month: "Jun", leads: 145, tours: 420, conversion: 39 },
  { month: "Jul", leads: 184, tours: 510, conversion: 41 },
  { month: "Aug", leads: 210, tours: 590, conversion: 43 }
];

const SOURCE_DISTRIBUTION = [
  { name: "Kiosk Check-in", value: 45, color: "#2563eb" },
  { name: "QR Code Entry", value: 28, color: "#7c3aed" },
  { name: "AI Voice Tour", value: 18, color: "#059669" },
  { name: "Microsite Inquiry", value: 9, color: "#d97706" }
];

const AGENT_LISTINGS_MOCK = [
  {
    id: "lst-101",
    title: "742 Evergreen Terrace",
    price: "$1,250,000",
    leadsCaptured: 64,
    tourListens: 280,
    mortgageConsent: 42,
    status: "Active Open House",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop&q=80"
  },
  {
    id: "lst-102",
    title: "1840 Ocean Avenue, Apt 4B",
    price: "$2,890,000",
    leadsCaptured: 48,
    tourListens: 195,
    mortgageConsent: 31,
    status: "Active Open House",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&auto=format&fit=crop&q=80"
  },
  {
    id: "lst-103",
    title: "512 Pinecrest Boulevard",
    price: "$875,000",
    leadsCaptured: 38,
    tourListens: 140,
    mortgageConsent: 22,
    status: "Active Tour",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&auto=format&fit=crop&q=80"
  },
  {
    id: "lst-104",
    title: "920 Highland Estates Court",
    price: "$3,450,000",
    leadsCaptured: 34,
    tourListens: 110,
    mortgageConsent: 19,
    status: "Scheduled Open House",
    image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=400&auto=format&fit=crop&q=80"
  }
];

const RECENT_ACTIVITY = [
  {
    id: "act-1",
    time: "4 mins ago",
    type: "lead",
    title: "New Kiosk Lead Captured",
    detail: "Sarah Miller signed in at 742 Evergreen Terrace (Mortgage Consent: Yes)",
    badge: "Kiosk",
    color: "bg-blue-100 text-blue-800"
  },
  {
    id: "act-2",
    time: "18 mins ago",
    type: "tour",
    title: "Sora AI Voice Tour Played",
    detail: "Visitor listened to Master Suite narration on 1840 Ocean Avenue (2m 45s duration)",
    badge: "AI Tour",
    color: "bg-purple-100 text-purple-800"
  },
  {
    id: "act-3",
    time: "42 mins ago",
    type: "crm",
    title: "Follow Up Boss Synced",
    detail: "Lead #184 automatically created in FUB with tags [open-house, mortgage-interest]",
    badge: "CRM Sync",
    color: "bg-emerald-100 text-emerald-800"
  },
  {
    id: "act-4",
    time: "1 hour ago",
    type: "lender",
    title: "Lender Handoff Triggered",
    detail: "Routed consented buyer to Marcus Sterling (Aether Mortgage Solutions)",
    badge: "Lender Pair",
    color: "bg-amber-100 text-amber-800"
  }
];

export default function Agent360() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentProfile[]>(MOCK_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "ytd">("30d");

  // Determine if the viewer has super admin privileges
  const isSuperAdmin = user?.role === "ADMIN" && (user?.email === "luc.valade@gmail.com" || user?.accountType === "platform_admin");
  const userBrokerage = user?.brokerage || (user as any)?.brokerageName || "Apex Realty Group";

  // Filter agents by brokerage if not super admin, or allow scoped view
  const scopedAgents = agents.filter((a) => {
    if (isSuperAdmin) return true;
    return a.brokerage.toLowerCase() === userBrokerage.toLowerCase() || a.email.toLowerCase() === user?.email?.toLowerCase();
  });

  const selectedAgent = scopedAgents.find((a) => a.id === selectedAgentId);

  // Filtered agents for selector dropdown / search
  const filteredAgents = scopedAgents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.brokerage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Metrics calculation
  const totalLeads = selectedAgent
    ? selectedAgent.totalLeads
    : scopedAgents.reduce((acc, a) => acc + a.totalLeads, 0);

  const activeTours = selectedAgent
    ? selectedAgent.activeTours
    : scopedAgents.reduce((acc, a) => acc + a.activeTours, 0);

  const avgConversion = selectedAgent
    ? selectedAgent.conversionRate
    : scopedAgents.length > 0 
      ? (scopedAgents.reduce((acc, a) => acc + a.conversionRate, 0) / scopedAgents.length).toFixed(1)
      : "0.0";

  const totalListings = selectedAgent
    ? selectedAgent.totalListings
    : scopedAgents.reduce((acc, a) => acc + a.totalListings, 0);

  const handleExportReport = () => {
    const exportTarget = selectedAgent ? [selectedAgent] : filteredAgents;
    if (exportTarget.length === 0) {
      toast.error("No agent records available to export.");
      return;
    }

    const headers = [
      "Agent ID",
      "Agent Name",
      "Email",
      "Phone",
      "Brokerage",
      "Tier",
      "CRM System",
      "CRM Status",
      "Paired Lender",
      "Total Listings",
      "Total Leads",
      "Active AI Tours",
      "Conversion Rate (%)"
    ];

    const csvRows = [
      headers.join(","),
      ...exportTarget.map(a => [
        `"${a.id}"`,
        `"${(a.name || '').replace(/"/g, '""')}"`,
        `"${a.email || ''}"`,
        `"${a.phone || ''}"`,
        `"${(a.brokerage || '').replace(/"/g, '""')}"`,
        `"${a.tier || 'Agent Pro'}"`,
        `"${a.crmType || 'Follow Up Boss'}"`,
        `"${a.crmConnected ? 'Connected' : 'Pending'}"`,
        `"${(a.pairedLender || '').replace(/"/g, '""')}"`,
        a.totalListings || 0,
        a.totalLeads || 0,
        a.activeTours || 0,
        a.conversionRate || 0
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `Agent_360_Summary_${selectedAgent ? selectedAgent.name.replace(/\s+/g, '_') : 'Brokerage_Agents'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`✨ Exported 360 Summary (${exportTarget.length} agents) to ${filename}`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header & Page Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Agent 360 Dashboard</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive CRM aggregation of agent lead volume, Sora AI voice tours, and conversion metrics.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setTimeRange("7d")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                timeRange === "7d" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange("30d")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                timeRange === "30d" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange("90d")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                timeRange === "90d" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              90 Days
            </button>
            <button
              onClick={() => setTimeRange("ytd")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                timeRange === "ytd" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              YTD
            </button>
          </div>

          <Button
            onClick={handleExportReport}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs gap-2 px-3.5 py-2 rounded-xl shadow-sm cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export 360 Summary</span>
          </Button>
        </div>
      </div>

      {/* Agent Filter & Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              Select Agent:
            </span>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[240px]"
            >
              <option value="all">🌟 All Agents (Aggregate Overview)</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.brokerage}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Real-Time CRM Sync Active
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 text-xs font-bold">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              Sora AI Enabled
            </span>
          </div>
        </div>

        {/* Selected Agent Header Banner (if specific agent selected) */}
        {selectedAgent && (
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={selectedAgent.avatar}
                alt={selectedAgent.name}
                className="h-14 w-14 rounded-2xl object-cover border-2 border-blue-500 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">{selectedAgent.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 border border-blue-200">
                    {selectedAgent.tier} Plan
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>{selectedAgent.brokerage}</span>
                  <span>•</span>
                  <span>{selectedAgent.email}</span>
                  <span>•</span>
                  <span>{selectedAgent.phone}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs border-l border-slate-200 pl-6">
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[10px]">CRM Target</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {selectedAgent.crmType}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Paired Lender</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">
                  {selectedAgent.pairedLender}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Active Listings</span>
                <span className="font-black text-blue-600 text-sm">{selectedAgent.totalListings}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AGENT 360 CORE METRIC CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Lead Volume */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Lead Volume</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{totalLeads.toLocaleString()}</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +24.8%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Captured across open houses & AI tours</p>
          </div>
          <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="bg-slate-50 p-1.5 rounded-lg">
              <span className="text-slate-400 block">Kiosk</span>
              <strong className="font-bold text-slate-800">{Math.round(totalLeads * 0.45)}</strong>
            </div>
            <div className="bg-slate-50 p-1.5 rounded-lg">
              <span className="text-slate-400 block">QR Entry</span>
              <strong className="font-bold text-slate-800">{Math.round(totalLeads * 0.35)}</strong>
            </div>
            <div className="bg-slate-50 p-1.5 rounded-lg">
              <span className="text-slate-400 block">AI Tour</span>
              <strong className="font-bold text-slate-800">{Math.round(totalLeads * 0.2)}</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Active Sora AI Voice Tours */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Voice Tours</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Mic className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{activeTours}</span>
              <span className="text-xs font-bold text-purple-600">Active Published</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Sora guided tour sessions</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold">Total Listens:</span>
            <strong className="font-bold text-purple-600">{(activeTours * 142).toLocaleString()} sessions</strong>
          </div>
        </div>

        {/* Card 3: Total Conversion Metrics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Conversion</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{avgConversion}%</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +3.2% vs avg
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Visitor to verified lead ratio</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold">Mortgage Opt-In:</span>
            <strong className="font-bold text-emerald-600">68.4% consented</strong>
          </div>
        </div>

        {/* Card 4: Open House & Sync Health */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sync & Kiosk SLA</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">4.2 min</span>
              <span className="text-xs font-bold text-amber-600">Avg SLA Speed</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Time from sign-in to CRM sync</p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold">Offline Buffer:</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              100% Synced
            </span>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Monthly Lead Volume & Tour Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span>Lead Volume & AI Tour Engagement Trend</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly progression of captured leads vs Sora AI tour audio sessions.
              </p>
            </div>
            <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Steady Growth
            </span>
          </div>

          <div className="h-72 w-full min-w-0 relative pt-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <AreaChart data={MONTHLY_LEAD_DATA}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px"
                  }}
                />
                <Area type="monotone" dataKey="leads" name="Leads Captured" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                <Area type="monotone" dataKey="tours" name="Tour Listens" stroke="#7c3aed" strokeWidth={2} fillOpacity={1} fill="url(#colorTours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Lead Channel Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-purple-600" />
              <span>Lead Source Channel Share</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Distribution of lead capture touchpoints.</p>
          </div>

          <div className="h-48 w-full min-w-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
              <PieChart>
                <Pie
                  data={SOURCE_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {SOURCE_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3">
            {SOURCE_DISTRIBUTION.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-bold text-slate-700">{item.name}</span>
                </div>
                <span className="font-extrabold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ACTIVE LISTINGS PERFORMANCE GRID FOR AGENT */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              <span>Top Agent Listings &amp; Open House Performance</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live lead capture and tour analytics per property listing with dedicated Mini Cards.
            </p>
          </div>

          <button
            onClick={() => navigate(`/app/admin/agent-listings${selectedAgentId !== 'all' ? `?agentId=${selectedAgentId}` : ''}`)}
            className="text-xs font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
          >
            <span>View All Listings ({totalListings}) →</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {AGENT_LISTINGS_MOCK.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/app/admin/agent-listings?listingId=${item.id}`)}
              className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all space-y-3 p-3 group cursor-pointer"
            >
              <div className="relative h-32 rounded-lg overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute top-2 left-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-sm">
                  {item.status}
                </span>
                <span className="absolute bottom-2 right-2 text-xs font-black px-2 py-0.5 rounded-md bg-blue-600 text-white shadow">
                  {item.price}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{item.title}</h3>
              </div>

              {/* MINI CARDS: LEADS, LISTENS, MORTGAGE */}
              <div className="grid grid-cols-3 gap-1 text-center text-[10px] pt-1 border-t border-slate-200/80">
                <div 
                  onClick={(e) => { e.stopPropagation(); navigate(`/app/leads?listingId=${item.id}`); }}
                  className="bg-white hover:bg-blue-50 p-1.5 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer"
                  title="Click to view captured leads"
                >
                  <span className="text-slate-400 block text-[9px] font-bold">Leads</span>
                  <strong className="font-black text-blue-600 block text-xs">{item.leadsCaptured}</strong>
                </div>
                <div 
                  onClick={(e) => { e.stopPropagation(); navigate(`/app/listings/${item.id}`); }}
                  className="bg-white hover:bg-purple-50 p-1.5 rounded-lg border border-slate-100 hover:border-purple-200 transition-colors cursor-pointer"
                  title="Click to view Sora voice tour"
                >
                  <span className="text-slate-400 block text-[9px] font-bold">Listens</span>
                  <strong className="font-black text-purple-600 block text-xs">{item.tourListens}</strong>
                </div>
                <div 
                  onClick={(e) => { e.stopPropagation(); navigate(`/app/lenders`); }}
                  className="bg-white hover:bg-emerald-50 p-1.5 rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors cursor-pointer"
                  title="Click to view Mortgage financing opt-ins"
                >
                  <span className="text-slate-400 block text-[9px] font-bold">Mortgage</span>
                  <strong className="font-black text-emerald-600 block text-xs">{item.mortgageConsent}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT REAL-TIME ACTIVITY FEED */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            <span>Agent Activity Stream & System Audit Log</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time feed of lead check-ins, AI voice tours, and downstream CRM syncs.
          </p>
        </div>

        <div className="space-y-3">
          {RECENT_ACTIVITY.map((act) => (
            <div
              key={act.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4 hover:bg-slate-100/60 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs mt-0.5">
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{act.title}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${act.color}`}>
                      {act.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{act.detail}</p>
                </div>
              </div>

              <span className="text-[11px] font-mono font-bold text-slate-400 whitespace-nowrap">
                {act.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
