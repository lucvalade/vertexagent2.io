import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart2, 
  Cpu, 
  Zap, 
  Activity, 
  Database, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  RefreshCw, 
  Server, 
  Globe, 
  FileCode, 
  Layers, 
  TrendingUp, 
  Key,
  Info,
  Sliders,
  BellRing
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from "recharts";
import { toast } from "sonner";

interface ApiLogItem {
  id: string;
  timestamp: string;
  provider: "Gemini AI" | "Clearbit & Twilio" | "Firecrawl" | "Follow Up Boss" | "Google Maps";
  endpoint: string;
  agentName: string;
  context: string;
  unitsUsed: string;
  latencyMs: number;
  status: number;
}

const DAILY_USAGE_DATA = [
  { day: "Mon", gemini: 1420, clearbit: 380, firecrawl: 120, fub: 450, maps: 210 },
  { day: "Tue", gemini: 1850, clearbit: 410, firecrawl: 150, fub: 510, maps: 290 },
  { day: "Wed", gemini: 2100, clearbit: 520, firecrawl: 180, fub: 620, maps: 340 },
  { day: "Thu", gemini: 1980, clearbit: 490, firecrawl: 160, fub: 580, maps: 310 },
  { day: "Fri", gemini: 2450, clearbit: 680, firecrawl: 220, fub: 790, maps: 420 },
  { day: "Sat", gemini: 3100, clearbit: 920, firecrawl: 310, fub: 1100, maps: 580 },
  { day: "Sun", gemini: 2890, clearbit: 840, firecrawl: 280, fub: 980, maps: 490 }
];

const TOKEN_CONSUMPTION_DATA = [
  { day: "Mon", inputTokens: 420000, outputTokens: 180000 },
  { day: "Tue", inputTokens: 510000, outputTokens: 220000 },
  { day: "Wed", inputTokens: 680000, outputTokens: 290000 },
  { day: "Thu", inputTokens: 590000, outputTokens: 250000 },
  { day: "Fri", inputTokens: 780000, outputTokens: 340000 },
  { day: "Sat", inputTokens: 980000, outputTokens: 450000 },
  { day: "Sun", inputTokens: 890000, outputTokens: 390000 }
];

const INITIAL_API_LOGS: ApiLogItem[] = [
  {
    id: "log-1001",
    timestamp: "2026-07-30 16:42:12",
    provider: "Gemini AI",
    endpoint: "POST /api/sora-voice-tour",
    agentName: "Michael St. Jean",
    context: "1482 Beverly Hills Dr (Kitchen Tour)",
    unitsUsed: "4,820 tokens",
    latencyMs: 340,
    status: 200
  },
  {
    id: "log-1002",
    timestamp: "2026-07-30 16:38:05",
    provider: "Clearbit & Twilio",
    endpoint: "POST /api/enrich-lead",
    agentName: "Sarah Jenkins",
    context: "Lead: david.vance@techfirm.co",
    unitsUsed: "1 lookup unit",
    latencyMs: 180,
    status: 200
  },
  {
    id: "log-1003",
    timestamp: "2026-07-30 16:25:40",
    provider: "Firecrawl",
    endpoint: "POST /api/ingest-listing-url",
    agentName: "David Vance",
    context: "realtor.ca/listing/2890412",
    unitsUsed: "1 crawl unit",
    latencyMs: 820,
    status: 200
  },
  {
    id: "log-1004",
    timestamp: "2026-07-30 16:10:15",
    provider: "Follow Up Boss",
    endpoint: "POST /api/fub-event-sync",
    agentName: "Michael St. Jean",
    context: "Sync Lead #8041 -> FUB API",
    unitsUsed: "1 webhook call",
    latencyMs: 210,
    status: 200
  },
  {
    id: "log-1005",
    timestamp: "2026-07-30 15:52:00",
    provider: "Google Maps",
    endpoint: "GET /api/geocode-address",
    agentName: "System Auto-Geocode",
    context: "100 King St W, Toronto, ON",
    unitsUsed: "1 request",
    latencyMs: 110,
    status: 200
  },
  {
    id: "log-1006",
    timestamp: "2026-07-30 15:30:22",
    provider: "Gemini AI",
    endpoint: "POST /api/generate-flyer-copy",
    agentName: "Elena Rostova",
    context: "Luxury Penthouse Flyer",
    unitsUsed: "2,150 tokens",
    latencyMs: 290,
    status: 200
  },
  {
    id: "log-1007",
    timestamp: "2026-07-30 14:15:10",
    provider: "Follow Up Boss",
    endpoint: "POST /api/fub-event-sync",
    agentName: "Sarah Jenkins",
    context: "Sync Lead #8039 -> FUB API",
    unitsUsed: "1 webhook call",
    latencyMs: 1250,
    status: 429
  }
];

export default function ApiUsage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.email === "luc.valade@gmail.com";

  const [timeframe, setTimeframe] = useState("7d");
  const [providerFilter, setProviderFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [alertEnabled, setAlertEnabled] = useState(true);

  const filteredLogs = INITIAL_API_LOGS.filter((item) => {
    if (providerFilter !== "all" && item.provider !== providerFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.agentName.toLowerCase().includes(q);
      const matchContext = item.context.toLowerCase().includes(q);
      const matchEndpoint = item.endpoint.toLowerCase().includes(q);
      if (!matchName && !matchContext && !matchEndpoint) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 md:px-4 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 md:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Cpu className="h-3.5 w-3.5" />
            <span>Infrastructure & API Analytics</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            API Usage <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-300">Tracking Dashboard</span>
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Monitor real-time API request volumes, Gemini Sora token consumption, Clearbit lead verification lookups, Firecrawl listing ingestions, and Follow Up Boss CRM sync metrics.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-36 h-10 text-xs bg-white/10 text-white border-white/20 backdrop-blur-md rounded-xl font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="billing">Current Billing Cycle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <button
          onClick={() => {
            const next = providerFilter === "Gemini AI" ? "all" : "Gemini AI";
            setProviderFilter(next);
            toast.info(next === "all" ? "Showing all API logs" : "Filtered logs to Gemini AI / Sora Engine");
            document.getElementById("audit-trail")?.scrollIntoView({ behavior: "smooth" });
          }}
          className={`p-5 bg-white border text-left rounded-2xl shadow-sm space-y-2 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
            providerFilter === "Gemini AI" 
              ? "ring-2 ring-indigo-600 border-indigo-500 bg-indigo-50/20" 
              : "border-slate-200/80 hover:border-indigo-300"
          }`}
        >
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Gemini AI / Sora Engine</span>
            <Zap className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">15.8M <span className="text-xs font-medium text-slate-500">tokens</span></div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: "32%" }} />
          </div>
          <p className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>32% of 50M quota</span>
            <span className="font-bold text-indigo-600">Click to filter →</span>
          </p>
        </button>

        <button
          onClick={() => {
            const next = providerFilter === "Clearbit & Twilio" ? "all" : "Clearbit & Twilio";
            setProviderFilter(next);
            toast.info(next === "all" ? "Showing all API logs" : "Filtered logs to Lead Verification API");
            document.getElementById("audit-trail")?.scrollIntoView({ behavior: "smooth" });
          }}
          className={`p-5 bg-white border text-left rounded-2xl shadow-sm space-y-2 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
            providerFilter === "Clearbit & Twilio" 
              ? "ring-2 ring-blue-600 border-blue-500 bg-blue-50/20" 
              : "border-slate-200/80 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Lead Verification API</span>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">4,640 <span className="text-xs font-medium text-slate-500">lookups</span></div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: "46%" }} />
          </div>
          <p className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>46% of 10k quota</span>
            <span className="font-bold text-blue-600">Click to filter →</span>
          </p>
        </button>

        <button
          onClick={() => {
            const next = providerFilter === "Firecrawl" ? "all" : "Firecrawl";
            setProviderFilter(next);
            toast.info(next === "all" ? "Showing all API logs" : "Filtered logs to Firecrawl URL Ingestion");
            document.getElementById("audit-trail")?.scrollIntoView({ behavior: "smooth" });
          }}
          className={`p-5 bg-white border text-left rounded-2xl shadow-sm space-y-2 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
            providerFilter === "Firecrawl" 
              ? "ring-2 ring-amber-500 border-amber-500 bg-amber-50/20" 
              : "border-slate-200/80 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Firecrawl URL Ingestion</span>
            <Globe className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">1,420 <span className="text-xs font-medium text-slate-500">crawls</span></div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: "28%" }} />
          </div>
          <p className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>28% of 5k quota</span>
            <span className="font-bold text-amber-600">Click to filter →</span>
          </p>
        </button>

        <button
          onClick={() => {
            const next = providerFilter === "Follow Up Boss" ? "all" : "Follow Up Boss";
            setProviderFilter(next);
            toast.info(next === "all" ? "Showing all API logs" : "Filtered logs to CRM Syncs");
            document.getElementById("audit-trail")?.scrollIntoView({ behavior: "smooth" });
          }}
          className={`p-5 bg-white border text-left rounded-2xl shadow-sm space-y-2 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
            providerFilter === "Follow Up Boss" 
              ? "ring-2 ring-emerald-600 border-emerald-500 bg-emerald-50/20" 
              : "border-slate-200/80 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">CRM Syncs</span>
            <Activity className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">5,530 <span className="text-xs font-medium text-slate-500">calls</span></div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: "55%" }} />
          </div>
          <p className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>55% of 10k quota</span>
            <span className="font-bold text-emerald-600">Click to filter →</span>
          </p>
        </button>

      </div>

      {/* Visual Charts: Usage Volume & Token Consumption */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* API Requests Trend Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">API Invocations Volume by Service</h3>
              <p className="text-xs text-slate-500">Daily API call breakdown across integration partners</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
              7-Day Trend
            </span>
          </div>

          <div className="h-64 w-full min-w-0 relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
              <AreaChart data={DAILY_USAGE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGemini" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="gemini" name="Gemini AI" stroke="#6366f1" fillOpacity={1} fill="url(#colorGemini)" />
                <Area type="monotone" dataKey="fub" name="Follow Up Boss" stroke="#10b981" fillOpacity={1} fill="url(#colorFub)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Token Consumption Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Gemini Sora Token Processing</h3>
              <p className="text-xs text-slate-500">Input prompt vs candidate voice synthesis output tokens</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              Sora Engine
            </span>
          </div>

          <div className="h-64 w-full min-w-0 relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
              <BarChart data={TOKEN_CONSUMPTION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="inputTokens" name="Prompt Tokens" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outputTokens" name="Speech Output Tokens" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Quota Limits & Alert Config Cards */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-lg">API Quota Threshold & Rate Limit Alerts</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Automatically receive email notifications when your account reaches 80% or 95% of monthly API limits.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={() => {
              setAlertEnabled(!alertEnabled);
              toast.success(alertEnabled ? "API quota alerts disabled" : "API quota alerts enabled");
            }}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
              alertEnabled ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {alertEnabled ? "Alerts Active (80% / 95%)" : "Alerts Paused"}
          </Button>
        </div>
      </div>

      {/* Detailed API Request Log Table */}
      <div id="audit-trail" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Real-Time API Activity Audit Trail</h3>
            <p className="text-xs text-slate-500">Live request log containing endpoints, latencies, and status codes</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Filter agent or endpoint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs border-slate-200 rounded-xl w-48"
              />
            </div>

            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="h-9 text-xs border-slate-200 rounded-xl w-40">
                <SelectValue placeholder="All Providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="Gemini AI">Gemini AI</SelectItem>
                <SelectItem value="Clearbit & Twilio">Clearbit & Twilio</SelectItem>
                <SelectItem value="Firecrawl">Firecrawl</SelectItem>
                <SelectItem value="Follow Up Boss">Follow Up Boss</SelectItem>
                <SelectItem value="Google Maps">Google Maps</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 rounded-l-xl">Timestamp</th>
                <th className="p-3">Provider</th>
                <th className="p-3">Endpoint</th>
                <th className="p-3">Agent / Origin</th>
                <th className="p-3">Context</th>
                <th className="p-3">Tokens / Units</th>
                <th className="p-3">Latency</th>
                <th className="p-3 rounded-r-xl text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 font-mono text-slate-500">{log.timestamp}</td>
                  <td className="p-3 font-bold text-slate-900">{log.provider}</td>
                  <td className="p-3 font-mono text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100 text-[11px]">
                    {log.endpoint}
                  </td>
                  <td className="p-3 font-medium text-slate-800">{log.agentName}</td>
                  <td className="p-3 text-slate-500 max-w-xs truncate">{log.context}</td>
                  <td className="p-3 font-mono text-purple-700 font-semibold">{log.unitsUsed}</td>
                  <td className="p-3 text-slate-600 font-mono">{log.latencyMs} ms</td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      log.status === 200 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {log.status === 200 ? "200 OK" : `${log.status} Rate Limit`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
