import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart3, TrendingUp, Users, Clock, Globe2, Calendar as CalendarIcon, Info, ArrowUpRight, 
  Search, Cpu, Shield, Filter, CheckCircle2, Layers, Download, Sparkles, Home, Building2, UserCheck, Zap, ArrowRight,
  HelpCircle, Plus, Mic2
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, AreaChart, Area, Legend, ComposedChart 
} from 'recharts';
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

// Time series data for Lead Conversion Rates over time
const LEAD_CONVERSION_TIME_DATA = [
  { date: 'Apr 01', visitors: 120, leads: 9, mortgageOptIns: 4, conversionRate: 7.5 },
  { date: 'Apr 05', visitors: 185, leads: 16, mortgageOptIns: 9, conversionRate: 8.6 },
  { date: 'Apr 10', visitors: 210, leads: 20, mortgageOptIns: 12, conversionRate: 9.5 },
  { date: 'Apr 15', visitors: 290, leads: 28, mortgageOptIns: 17, conversionRate: 9.6 },
  { date: 'Apr 20', visitors: 340, leads: 35, mortgageOptIns: 22, conversionRate: 10.3 },
  { date: 'Apr 25', visitors: 410, leads: 42, mortgageOptIns: 26, conversionRate: 10.2 },
  { date: 'Apr 30', visitors: 480, leads: 51, mortgageOptIns: 31, conversionRate: 10.6 },
];

// Time series data for Open House Attendance over time
const OPEN_HOUSE_ATTENDANCE_TIME_DATA = [
  { period: 'Week 1', preRegistered: 28, walkIns: 45, totalAttendees: 73, events: 3, avgPerEvent: 24.3, leadsCaptured: 18 },
  { period: 'Week 2', preRegistered: 34, walkIns: 52, totalAttendees: 86, events: 4, avgPerEvent: 21.5, leadsCaptured: 24 },
  { period: 'Week 3', preRegistered: 51, walkIns: 78, totalAttendees: 129, events: 5, avgPerEvent: 25.8, leadsCaptured: 36 },
  { period: 'Week 4', preRegistered: 62, walkIns: 94, totalAttendees: 156, events: 6, avgPerEvent: 26.0, leadsCaptured: 44 },
  { period: 'Week 5', preRegistered: 70, walkIns: 110, totalAttendees: 180, events: 7, avgPerEvent: 25.7, leadsCaptured: 52 },
];

// Default 5 languages
const DEFAULT_5_LANGUAGES = [
  { name: 'English', value: 65, leads: 42, color: '#2563eb' },
  { name: 'Spanish', value: 12, leads: 8, color: '#3b82f6' },
  { name: 'French', value: 8, leads: 5, color: '#60a5fa' },
  { name: 'Mandarin', value: 7, leads: 4, color: '#93c5fd' },
  { name: 'Other', value: 8, leads: 6, color: '#94a3b8' },
];

// Extended 9 languages for dynamic card expansion demo
const EXTENDED_9_LANGUAGES = [
  { name: 'English', value: 52, leads: 42, color: '#2563eb' },
  { name: 'Spanish', value: 14, leads: 11, color: '#3b82f6' },
  { name: 'French', value: 9, leads: 7, color: '#60a5fa' },
  { name: 'Mandarin', value: 8, leads: 6, color: '#93c5fd' },
  { name: 'Cantonese', value: 5, leads: 4, color: '#818cf8' },
  { name: 'Hindi', value: 4, leads: 3, color: '#a855f7' },
  { name: 'Italian', value: 3, leads: 2, color: '#ec4899' },
  { name: 'Tagalog', value: 3, leads: 2, color: '#f97316' },
  { name: 'Arabic', value: 2, leads: 1, color: '#64748b' },
];

const CONVERSION_STAGES = [
  { stage: 'Viewed Property QR/Link', count: 1240, color: '#3b82f6' },
  { stage: 'Engaged with Sora AI', count: 480, color: '#60a5fa' },
  { stage: 'Completed Kiosk Check-In', count: 210, color: '#93c5fd' },
  { stage: 'Verified Lead & Mortgage Consent', count: 89, color: '#10b981' },
];

const ADMIN_BROKERAGE_DATA = [
  { office: 'Downtown HQ', events: 14, visitors: 620, leads: 68, rate: 10.9 },
  { office: 'Westside Branch', events: 11, visitors: 490, leads: 48, rate: 9.8 },
  { office: 'Uptown Estate Group', events: 9, visitors: 380, leads: 32, rate: 8.4 },
  { office: 'Waterfront Team', events: 8, visitors: 310, leads: 29, rate: 9.3 },
];

type SectionInfoKey = 
  | 'platform-telemetry'
  | 'lead-conversion'
  | 'brokerage-leaderboard'
  | 'attendance'
  | 'funnel'
  | 'multilingual';

interface SectionInfoContent {
  title: string;
  badge: string;
  badgeBg: string;
  badgeText: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  summary: string;
  formulaOrMetric?: string;
  details: {
    heading: string;
    description: string;
  }[];
  proTip: string;
}

const SECTION_INFO_DATABASE: Record<SectionInfoKey, SectionInfoContent> = {
  'platform-telemetry': {
    title: "Platform Telemetry & Analytics",
    badge: "Executive Intelligence",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
    icon: BarChart3,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
    summary: "The master operational intelligence dashboard aggregating all visitor touchpoints, Sora AI guided tours, tablet kiosk registrations, and multi-office open house events across the platform.",
    details: [
      {
        heading: "Unified Foot-Traffic & Digital Ingestion",
        description: "Captures in-person visitor arrivals from locked tablet kiosks, print sign rider QR scans, flyer links, and digital microsites into a centralized telemetry stream."
      },
      {
        heading: "Dual Scope Governance (Client vs. Admin)",
        description: "Allows individual agents to inspect single-listing performance while granting Brokerage Admins oversight across all regional offices, team rosters, and lender pairing pipelines."
      },
      {
        heading: "Downstream CRM & Lender Routing Synchronization",
        description: "Monitors real-time delivery of verified buyer leads to paired mortgage specialists and external CRMs (such as Follow Up Boss) with full audit logging."
      }
    ],
    proTip: "Use the Date Range filters (From / To) above to evaluate multi-weekend open house campaign trends against historical benchmarks."
  },
  'lead-conversion': {
    title: "Lead Conversion Rate Over Time",
    badge: "Conversion Trajectory",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
    icon: TrendingUp,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    summary: "Tracks the historical correlation between total open house foot traffic and the volume of qualified, identity-verified leads who complete check-in and consent.",
    formulaOrMetric: "Conversion Rate (%) = (Total Verified Leads Captured ÷ Total Open House Visitors) × 100",
    details: [
      {
        heading: "Dual-Axis Area & Trend Visualizer",
        description: "The blue shaded area represents raw foot-traffic visitor volume, the green area represents verified leads, and the emerald line plots net conversion efficiency percentage."
      },
      {
        heading: "Mortgage Financing Interest Tracking",
        description: "Computes the exact subset of attendees who explicitly checked the mortgage financing assistance checkbox during kiosk sign-in."
      },
      {
        heading: "Time-Interval Granularity",
        description: "Toggle between 7-day, 30-day, and 90-day intervals to identify seasonal demand spikes and event promotion effectiveness."
      }
    ],
    proTip: "Standard unassisted open house sign-in averages 4%–7% conversion. Properties utilizing Sora AI voice tours achieve an average conversion rate of 10.6%."
  },
  'brokerage-leaderboard': {
    title: "Brokerage & Office Performance Leaderboard",
    badge: "Admin Audit View",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-800",
    icon: Shield,
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600",
    summary: "A comparative benchmarking tool for Brokerage and Team Admins to rank regional branch offices, franchise locations, and agent teams by open house lead conversion efficiency.",
    formulaOrMetric: "Office Conversion Index (%) = (Office Verified Leads ÷ Office Total Visitors) × 100",
    details: [
      {
        heading: "Cross-Branch Efficiency Ranking",
        description: "Ranks Downtown HQ, suburban branches, and specialty luxury estate groups by their net conversion percentages per open house."
      },
      {
        heading: "Event Yield & Productivity",
        description: "Analyzes total hosted events against qualified lead output to highlight top-producing teams and coaching opportunities."
      },
      {
        heading: "Compliance & Routing Health",
        description: "Ensures all offices adhere to brokerage-wide lender pairing policies and statutory RESPA compliance mandates."
      }
    ],
    proTip: "Branch managers can use this data to incentivize high-performing agents and deploy automated coaching to offices below the 8% benchmark."
  },
  'attendance': {
    title: "Open House Attendance Over Time",
    badge: "Attendance Telemetry",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
    icon: Users,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
    summary: "Analyzes weekly visitor volume across all scheduled open houses, breaking down attendee acquisition channels between pre-registered guests and walk-in tablet registrations.",
    details: [
      {
        heading: "Pre-Registered vs. Walk-In Kiosk Split",
        description: "Amber bars quantify visitors who pre-registered via flyers, social QR links, or email blasts; Blue bars represent spontaneous in-person kiosk check-ins."
      },
      {
        heading: "Average Density Line Index",
        description: "The orange trendline calculates average visitor density per scheduled open house (Total Attendees ÷ Total Events Hosted)."
      },
      {
        heading: "Stacked vs. Total Attendance Modes",
        description: "Switch seamlessly between 'Pre-Reg vs Walk-In' stacked comparison and 'Total Attendees' unified view to identify attendance patterns."
      }
    ],
    proTip: "Pre-registered attendees show a 35% higher propensity to submit full pre-qualification details and schedule second private viewings."
  },
  'funnel': {
    title: "Lead Conversion Funnel",
    badge: "Pipeline Stage Analysis",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
    icon: Layers,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    summary: "Visualizes the complete 4-stage visitor qualification journey from initial QR scan discovery to verified buyer lead with explicit mortgage lender consent.",
    details: [
      {
        heading: "Stage 1: Viewed Property QR / Link",
        description: "Top-of-funnel discovery across lawn sign riders, print flyers, social media campaigns, and listing microsites."
      },
      {
        heading: "Stage 2: Engaged with Sora AI",
        description: "Visitors who activated the interactive AI tour, asked listing questions, or engaged with multilingual voice narration."
      },
      {
        heading: "Stage 3: Completed Kiosk Check-In",
        description: "Attendees who submitted contact details on the locked tablet kiosk and completed identity validation."
      },
      {
        heading: "Stage 4: Verified Lead & Mortgage Consent",
        description: "Highest-intent leads with phone/email verification and explicit paired lender opt-in consent dispatched to agents."
      }
    ],
    proTip: "Activating voice-prompted mortgage financing during Stage 2 increases final Stage 4 verified lead conversions by up to +18%."
  },
  'multilingual': {
    title: "Multilingual Sora Buyer Demographics",
    badge: "AI Tour Demographics",
    badgeBg: "bg-indigo-100",
    badgeText: "text-indigo-800",
    icon: Globe2,
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-600",
    summary: "Real-time distribution of native languages chosen by property visitors during interactive Sora AI voice tours, providing deep demographic intelligence for hyper-localized marketing.",
    details: [
      {
        heading: "Adaptive Multilingual Voice Tours",
        description: "Sora dynamically conducts property tours in English, Spanish, French, Mandarin, Cantonese, Hindi, Tagalog, Italian, Arabic, and more."
      },
      {
        heading: "Dynamic Card Auto-Expansion",
        description: "When open house sessions encounter more than 5 distinct spoken languages, this card dynamically expands to display complete demographic distributions without truncation."
      },
      {
        heading: "Hyper-Localized Marketing Intelligence",
        description: "Enables agents and brokerages to automatically tailor neighborhood flyers, sign riders, and post-event email campaigns in high-demand buyer languages."
      }
    ],
    proTip: "Listings featuring multilingual Sora voice tours capture 2.4x more international, relocation, and first-generation homebuyer leads."
  }
};

export default function Analytics() {
  const { user } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const scopeParam = searchParams.get('scope');
  const focusParam = searchParams.get('focus');

  // If explicitly requested agent scope or not on admin path with no admin role
  const isAgentExplicit = scopeParam === 'agent';
  const isAdminMode = !isAgentExplicit && (location.pathname.startsWith('/app/admin') || (user?.role === 'ADMIN' && scopeParam !== 'agent'));

  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2026-04-30");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [attendanceView, setAttendanceView] = useState<"stacked" | "total">("stacked");

  // State for Information Modal Popup
  const [selectedInfoSection, setSelectedInfoSection] = useState<SectionInfoKey | null>(null);

  // State for Multilingual demographics (demonstrating dynamic expansion when > 5 languages)
  const [languagesList, setLanguagesList] = useState(DEFAULT_5_LANGUAGES);
  const [isExpandedLanguages, setIsExpandedLanguages] = useState(false);

  const toggleLanguageExpansion = () => {
    if (isExpandedLanguages) {
      setLanguagesList(DEFAULT_5_LANGUAGES);
      setIsExpandedLanguages(false);
    } else {
      setLanguagesList(EXTENDED_9_LANGUAGES);
      setIsExpandedLanguages(true);
    }
  };

  const handleAddSampleLanguage = () => {
    const extraLanguages = [
      { name: 'German', value: 2, leads: 1, color: '#14b8a6' },
      { name: 'Korean', value: 2, leads: 1, color: '#f59e0b' },
      { name: 'Portuguese', value: 3, leads: 2, color: '#06b6d4' },
      { name: 'Vietnamese', value: 2, leads: 1, color: '#84cc16' },
      { name: 'Japanese', value: 1, leads: 1, color: '#e11d48' },
    ];
    
    // Find next language not yet in list
    const nextLang = extraLanguages.find(l => !languagesList.some(item => item.name === l.name));
    if (nextLang) {
      setLanguagesList(prev => [...prev, nextLang]);
      setIsExpandedLanguages(true);
    }
  };

  // Reusable Info Button component
  const InfoHelpButton = ({ sectionKey, title = "Click for detailed explanation" }: { sectionKey: SectionInfoKey; title?: string }) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setSelectedInfoSection(sectionKey);
      }}
      className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-400 hover:text-blue-600 border border-slate-200/90 hover:border-blue-200 transition-all cursor-pointer shrink-0 shadow-2xs group"
      title={title}
      aria-label={title}
    >
      <HelpCircle className="h-3 w-3 text-slate-500 group-hover:text-blue-600 transition-colors" />
    </button>
  );

  const activeInfo = selectedInfoSection ? SECTION_INFO_DATABASE[selectedInfoSection] : null;

  const formatDateLabel = (dateStr: string, isEnd: boolean) => {
    if (dateStr === "2026-04-01") return "Apr/01/2026";
    if (dateStr === "2026-04-30") return "Apr/30/2026";
    try {
      const d = new Date(dateStr + "T00:00:00");
      if (isNaN(d.getTime())) return dateStr;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[d.getMonth()];
      const day = String(d.getDate()).padStart(2, "0");
      const year = d.getFullYear();
      return `${month}/${day}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Custom Tooltip for Lead Conversion Chart
  const CustomConversionTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 text-white p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 font-sans min-w-[200px]">
          <div className="font-bold text-slate-300 pb-1 border-b border-slate-800 flex justify-between items-center">
            <span>{label} Timeline</span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">{data.conversionRate}% Conv.</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1"><Users className="h-3 w-3 text-blue-400" /> Property Visitors:</span>
            <span className="font-bold text-white">{data.visitors}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1"><UserCheck className="h-3 w-3 text-emerald-400" /> Captured Leads:</span>
            <span className="font-bold text-emerald-400">{data.leads}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1"><Building2 className="h-3 w-3 text-purple-400" /> Mortgage Opt-Ins:</span>
            <span className="font-bold text-purple-300">{data.mortgageOptIns}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Open House Attendance Chart
  const CustomAttendanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 text-white p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 font-sans min-w-[210px]">
          <div className="font-bold text-slate-300 pb-1 border-b border-slate-800 flex justify-between items-center">
            <span>{label} Open Houses</span>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">{data.events} Events</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1"><Home className="h-3 w-3 text-amber-400" /> Pre-Registered:</span>
            <span className="font-bold text-amber-300">{data.preRegistered}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1"><Users className="h-3 w-3 text-blue-400" /> Kiosk Walk-Ins:</span>
            <span className="font-bold text-blue-300">{data.walkIns}</span>
          </div>
          <div className="flex justify-between items-center text-emerald-400 font-bold pt-1 border-t border-slate-800">
            <span>Total Attendees:</span>
            <span>{data.totalAttendees} ({data.avgPerEvent} avg/event)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header with Admin / Client Mode indicators */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-black tracking-tight italic uppercase text-slate-900 flex items-center gap-2">
              {isAdminMode ? "Platform Telemetry & Analytics" : "Analytics & Insights"}
            </h1>
            <InfoHelpButton 
              sectionKey="platform-telemetry" 
              title="Platform Telemetry & Analytics Information Guide" 
            />
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              isAdminMode 
                ? "bg-rose-50 text-rose-700 border-rose-200" 
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
              {isAdminMode ? "Admin Scope (Brokerage-Wide)" : `Agent Scope · ${user?.name || "Logged In Agent"}`}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            {isAdminMode 
              ? "Brokerage-wide intelligence: Track lead conversion rates and open house attendance across all offices."
              : `Tracking performance, open house attendance, and Sora voice tour listening telemetry for ${user?.name || "your account"}.`}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {user?.role === 'ADMIN' && (
            <Link to={isAdminMode ? "/app/analytics?scope=agent" : "/app/admin/analytics"}>
              <Button variant="outline" className="text-xs h-9 px-3 font-bold border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer">
                {isAdminMode ? "Switch to Personal Agent Scope" : "Switch to Brokerage Admin Scope"}
              </Button>
            </Link>
          )}
          <Link to={isAdminMode ? "/app/admin/api-usage" : "/app/api-usage"}>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
              <Cpu className="h-4 w-4" />
              <span>Track API Usage</span>
            </Button>
          </Link>
          
          <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="from" className="text-[10px] font-black uppercase text-slate-400">From</Label>
              <Input 
                id="from"
                type="date" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 w-36 text-xs border-slate-200"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Label htmlFor="to" className="text-[10px] font-black uppercase text-slate-400">To</Label>
              <Input 
                id="to"
                type="date" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 w-36 text-xs border-slate-200"
              />
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 cursor-pointer">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-md transition-all border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black italic text-slate-900">10.6%</div>
            <p className="text-xs text-emerald-600 flex items-center mt-1.5 font-bold">
              <TrendingUp className="h-3.5 w-3.5 mr-1" /> +2.1% higher than last period
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Open House Attendance</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black italic text-slate-900">624 <span className="text-xs font-normal text-slate-500">visitors</span></div>
            <p className="text-xs text-blue-600 flex items-center mt-1.5 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> 25.8 avg attendees / event
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg. Sora Voice Tour</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black italic text-slate-900">4m 12s</div>
            <p className="text-xs text-amber-600 flex items-center mt-1.5 font-bold">
              <Zap className="h-3.5 w-3.5 mr-1" /> 94% high-intent completion
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lender Consent Opt-Ins</CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black italic text-slate-900">60.8%</div>
            <p className="text-xs text-purple-600 flex items-center mt-1.5 font-bold">
              <Shield className="h-3.5 w-3.5 mr-1" /> 100% RESPA &amp; Audit Compliant
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Tour Minutes Telemetry Focus Panel */}
      {(!isAdminMode || focusParam === 'tour-minutes') && (
        <Card className={`shadow-xs text-left transition-all ${
          focusParam === 'tour-minutes' 
            ? "border-blue-500 ring-2 ring-blue-400/30 bg-blue-50/10" 
            : "border-slate-200 bg-white"
        }`}>
          <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Mic2 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg font-black uppercase italic tracking-tight text-slate-900">
                    Sora Voice Tour Minutes Listened · {user?.name || "Agent Scope"}
                  </CardTitle>
                  <span className="text-[10px] bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded shadow-2xs">
                    Agent Personal Scope
                  </span>
                </div>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Detailed voice tour listen time, attendee engagement duration, and room-by-room audio streaming stats for your listings.
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                  185 Total Agent Minutes
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Tour Minutes Listened</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">185 mins</span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Across 44 unique visitor sessions
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Avg. Session Listening Time</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">4m 12s</span>
                <span className="text-[10px] text-blue-600 font-bold block mt-0.5">94% high-intent completion rate</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Top Performing Property</span>
                <span className="text-sm font-black text-slate-900 mt-1 block truncate">888 Bel Air Rd</span>
                <span className="text-[10px] text-purple-600 font-bold block mt-0.5">92 mins listened (22 visitors)</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Property-by-Property Audio Breakdown</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition-all text-xs">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-slate-900">888 Bel Air Rd</div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">92m</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">22 attendees · 4.2m avg tour</div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition-all text-xs">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-slate-900">120 Ocean Ave</div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">58m</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">14 attendees · 4.1m avg tour</div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition-all text-xs">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-slate-900">450 Mountain View Dr</div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">35m</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">8 attendees · 4.4m avg tour</div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '38%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RECHARTS CHART 1: Lead Conversion Rates Over Time */}
      <Card className="border-slate-200 shadow-xs bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-black uppercase italic tracking-tight text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" /> Lead Conversion Rate Over Time
                </CardTitle>
                <InfoHelpButton 
                  sectionKey="lead-conversion" 
                  title="Lead Conversion Rate Over Time Information Guide" 
                />
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded border border-emerald-200">
                  Recharts Visualizer
                </span>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Tracks visitor growth, total verified leads, and conversion percentage trajectory over time.
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
              {(["7d", "30d", "90d"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    timeRange === range
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[340px] w-full min-w-0 relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <ComposedChart data={LEAD_CONVERSION_TIME_DATA} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#10b981', fontSize: 12, fontWeight: 700 }} domain={[0, 15]} unit="%" />
                <Tooltip content={<CustomConversionTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '15px', fontSize: '12px', fontWeight: 600 }}
                  formatter={(value) => <span className="text-slate-700">{value}</span>}
                />
                
                <Area yAxisId="left" type="monotone" dataKey="visitors" name="Total Open House Visitors" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#visitorGradient)" />
                <Area yAxisId="left" type="monotone" dataKey="leads" name="Verified Captured Leads" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#leadGradient)" />
                <Line yAxisId="right" type="monotone" dataKey="conversionRate" name="Conversion Rate (%)" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#059669' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-bold block text-[11px]">Total Visitors Ingested</span>
              <span className="text-lg font-black text-slate-900">480 visitors</span>
              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">+14% vs. previous 30d</span>
            </div>
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
              <span className="text-emerald-800 font-bold block text-[11px]">Verified Captured Leads</span>
              <span className="text-lg font-black text-emerald-950">51 leads</span>
              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">10.6% net capture rate</span>
            </div>
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200">
              <span className="text-purple-800 font-bold block text-[11px]">Mortgage Consent Introductions</span>
              <span className="text-lg font-black text-purple-950">31 opt-ins</span>
              <span className="text-[10px] text-purple-700 font-bold block mt-0.5">60.8% lender routing rate</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RECHARTS CHART 2: Open House Attendance Over Time */}
      <Card className="border-slate-200 shadow-xs bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-black uppercase italic tracking-tight text-slate-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" /> Open House Attendance Over Time
                </CardTitle>
                <InfoHelpButton 
                  sectionKey="attendance" 
                  title="Open House Attendance Over Time Information Guide" 
                />
                <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded border border-blue-200">
                  Weekly Trends
                </span>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Compares pre-registered visitors against walk-in tablet kiosk attendees across events.
              </CardDescription>
            </div>

            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
              <button
                onClick={() => setAttendanceView("stacked")}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  attendanceView === "stacked"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Pre-Reg vs Walk-In
              </button>
              <button
                onClick={() => setAttendanceView("total")}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  attendanceView === "total"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Total Attendees
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="h-[340px] w-full min-w-0 relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <ComposedChart data={OPEN_HOUSE_ATTENDANCE_TIME_DATA} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#f59e0b', fontSize: 12, fontWeight: 700 }} domain={[0, 40]} unit=" avg" />
                <Tooltip content={<CustomAttendanceTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '15px', fontSize: '12px', fontWeight: 600 }}
                  formatter={(value) => <span className="text-slate-700">{value}</span>}
                />

                {attendanceView === "stacked" ? (
                  <>
                    <Bar yAxisId="left" dataKey="preRegistered" name="Pre-Registered Visitors" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} barSize={36} />
                    <Bar yAxisId="left" dataKey="walkIns" name="Walk-In Kiosk Attendees" stackId="a" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={36} />
                  </>
                ) : (
                  <Bar yAxisId="left" dataKey="totalAttendees" name="Total Attendance" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={42} />
                )}

                <Line yAxisId="right" type="monotone" dataKey="avgPerEvent" name="Avg Attendees / Event" stroke="#d97706" strokeWidth={3} dot={{ r: 4, fill: '#d97706' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-500 inline-block"></span>
              <span className="font-bold text-slate-900">38.2%</span> Pre-registered prior to arrival
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-600 inline-block"></span>
              <span className="font-bold text-slate-900">61.8%</span> Kiosk sign-in on property arrival
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <Sparkles className="h-3.5 w-3.5" /> 25.8 average visitors per event
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ADMIN MODE SPECIFIC SECTION */}
      {isAdminMode && (
        <Card className="border-rose-200 bg-rose-50/20 shadow-xs text-left">
          <CardHeader className="border-b border-rose-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-rose-600" />
                  <CardTitle className="text-lg font-black uppercase italic tracking-tight text-slate-900">
                    Brokerage &amp; Office Performance Leaderboard
                  </CardTitle>
                  <InfoHelpButton 
                    sectionKey="brokerage-leaderboard" 
                    title="Brokerage & Office Performance Leaderboard Information Guide" 
                  />
                </div>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Comparative conversion efficiency across all registered offices and agent teams.
                </CardDescription>
              </div>
              <span className="text-[10px] bg-rose-600 text-white font-black uppercase px-2.5 py-1 rounded-md shadow-2xs">
                Admin Audit View
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[260px] w-full min-w-0 relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
                <BarChart data={ADMIN_BROKERAGE_DATA} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} unit="%" />
                  <YAxis type="category" dataKey="office" axisLine={false} tickLine={false} tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 700 }} width={140} />
                  <Tooltip formatter={(value: any) => [`${value}% conversion`, 'Lead Conversion Rate']} />
                  <Bar dataKey="rate" fill="#e11d48" radius={[0, 6, 6, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Secondary Row: Language Distribution & Conversion Funnel */}
      <div className="grid gap-4 md:grid-cols-2 items-start">
        {/* Language Distribution (Expands dynamically when languages > 5) */}
        <Card className="border-slate-200 shadow-xs bg-white flex flex-col transition-all duration-300">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-0 gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-slate-900">Multilingual Sora Buyer Demographics</CardTitle>
                <InfoHelpButton 
                  sectionKey="multilingual" 
                  title="Multilingual Sora Buyer Demographics Information Guide" 
                />
              </div>
              <CardDescription className="text-xs text-slate-500">
                Languages spoken during live AI tour voice sessions
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                languagesList.length > 5 
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-extrabold animate-pulse" 
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}>
                {languagesList.length} Languages {languagesList.length > 5 ? "(Expanded Card)" : ""}
              </span>
              <button
                type="button"
                onClick={toggleLanguageExpansion}
                className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Toggle between standard 5 languages and extended 9+ languages"
              >
                {isExpandedLanguages ? "Show 5 Languages" : "Test >5 Languages"}
              </button>
              <button
                type="button"
                onClick={handleAddSampleLanguage}
                className="p-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer"
                title="Add an additional language to test dynamic expansion"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-4 space-y-4 flex-1">
            {/* Dynamic Recharts Bar Chart */}
            <div className={`w-full min-w-0 relative transition-all duration-300 ${languagesList.length > 5 ? "h-[220px]" : "h-[200px]"}`}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
                <BarChart data={languagesList} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                    interval={0}
                    angle={languagesList.length > 5 ? -25 : 0}
                    textAnchor={languagesList.length > 5 ? "end" : "middle"}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val: any) => [`${val}% of visitors`, 'Share']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {languagesList.map((item, index) => (
                      <Cell key={`cell-${index}`} fill={item.color || (index === 0 ? "#2563eb" : index === 1 ? "#3b82f6" : "#60a5fa")} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Dynamic Grid Layout that Expands Cleanly for > 5 items */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-0.5">
                <span>Language Share &amp; Leads Generated</span>
                <span>{languagesList.length} Active Demographics</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {languagesList.map((item) => (
                  <div 
                    key={item.name} 
                    className="flex justify-between items-center p-2.5 border rounded-lg bg-slate-50/80 hover:bg-slate-100/90 transition-all border-slate-200/80 hover:border-slate-300"
                  >
                    <div className="flex items-center gap-1.5 truncate pr-1">
                      <span 
                        className="h-2 w-2 rounded-full shrink-0" 
                        style={{ backgroundColor: item.color || '#3b82f6' }}
                      />
                      <span className="font-bold text-slate-800 truncate">{item.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-blue-600">{item.value}%</span>
                      {item.leads !== undefined && (
                        <span className="text-[10px] text-slate-500 block">({item.leads} leads)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {languagesList.length > 5 && (
              <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center justify-between gap-2">
                <span className="font-bold flex items-center gap-1.5 text-indigo-950 text-[11px]">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  Dynamic Card Expansion Active ({languagesList.length} languages displayed)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLanguagesList(DEFAULT_5_LANGUAGES);
                    setIsExpandedLanguages(false);
                  }}
                  className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
                >
                  Reset to 5
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Conversion Funnel */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-slate-900">Lead Conversion Funnel</CardTitle>
                <InfoHelpButton 
                  sectionKey="funnel" 
                  title="Lead Conversion Funnel Information Guide" 
                />
              </div>
              <CardDescription className="text-xs text-slate-500">Step-by-step visitor progression to verified lead</CardDescription>
            </div>
            <Users className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-3">
              {CONVERSION_STAGES.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                      {item.stage}
                    </span>
                    <span className="font-mono font-bold text-slate-900">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full transition-all duration-700 ease-out rounded-full" 
                      style={{ 
                        width: `${(item.count / CONVERSION_STAGES[0].count) * 100}%`,
                        backgroundColor: item.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-950">
                <Sparkles className="h-4 w-4 text-emerald-600" /> Conversion Optimization Insight
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Adding voice-prompted mortgage questions during step 2 ("Engaged with Sora AI") increases step 4 verified lead conversions by up to +18%.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MASTER SECTION INFORMATION POPUP DIALOG */}
      <Dialog open={!!selectedInfoSection} onOpenChange={(open) => !open && setSelectedInfoSection(null)}>
        <DialogContent className="max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-0 overflow-hidden font-sans">
          {activeInfo && (
            <div>
              {/* Modal Header Banner */}
              <div className="bg-slate-900 text-white p-6 border-b border-slate-800 relative">
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-white`}>
                    <activeInfo.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${activeInfo.badgeBg} ${activeInfo.badgeText}`}>
                        {activeInfo.badge}
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold">Analytics Guide</span>
                    </div>
                    <DialogTitle className="text-xl font-black tracking-tight text-white mt-1">
                      {activeInfo.title}
                    </DialogTitle>
                  </div>
                </div>
                <p className="text-slate-300 text-xs mt-3 leading-relaxed">
                  {activeInfo.summary}
                </p>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {activeInfo.formulaOrMetric && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                      Calculation &amp; Mathematical Metric
                    </span>
                    <code className="text-xs font-mono font-bold text-slate-900 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 block">
                      {activeInfo.formulaOrMetric}
                    </code>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Key Telemetry Metrics &amp; Operational Purpose
                  </h4>
                  <div className="space-y-2.5">
                    {activeInfo.details.map((item, idx) => (
                      <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors shadow-2xs">
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0"></span>
                          {item.heading}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 pl-3.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-950">
                    <span className="font-extrabold block text-amber-900">Optimization Pro-Tip</span>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      {activeInfo.proTip}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <span className="text-[11px] text-slate-500">
                  AI Open House Connect • Analytics Telemetry
                </span>
                <Button
                  onClick={() => setSelectedInfoSection(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Got It
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
