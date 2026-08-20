import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart3, TrendingUp, Users, Clock, Globe2, Calendar as CalendarIcon, Info, ArrowUpRight, 
  Search, Cpu, Shield, Filter, CheckCircle2, Layers, Download, Sparkles, Home, Building2, UserCheck, Zap, ArrowRight
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
  DialogTrigger,
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

const LANGUAGE_DATA = [
  { name: 'English', value: 65, leads: 42 },
  { name: 'Spanish', value: 12, leads: 8 },
  { name: 'French', value: 8, leads: 5 },
  { name: 'Mandarin', value: 7, leads: 4 },
  { name: 'Other', value: 8, leads: 6 },
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

export default function Analytics() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminMode = location.pathname.startsWith('/app/admin') || user?.role === 'ADMIN';

  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2026-04-30");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [attendanceView, setAttendanceView] = useState<"stacked" | "total">("stacked");

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
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight italic uppercase text-slate-900">
              {isAdminMode ? "Platform Telemetry & Analytics" : "Analytics & Insights"}
            </h1>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              isAdminMode 
                ? "bg-rose-50 text-rose-700 border-rose-200" 
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
              {isAdminMode ? "Admin Scope" : "Client Scope"}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            {isAdminMode 
              ? "Brokerage-wide intelligence: Track lead conversion rates and open house attendance across all offices."
              : "Track your property lead conversion rates, open house check-in trends, and buyer tour behavior over time."}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
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

      {/* RECHARTS CHART 1: Lead Conversion Rates Over Time */}
      <Card className="border-slate-200 shadow-xs bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-black uppercase italic tracking-tight text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" /> Lead Conversion Rate Over Time
                </CardTitle>
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
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#10b981', fontSize: 12, fontWeight: 700 }} unit="%" domain={[0, 15]} />
                <Tooltip content={<CustomConversionTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '15px', fontSize: '12px', fontWeight: 600 }}
                  formatter={(value) => <span className="text-slate-700">{value}</span>}
                />
                
                <Area yAxisId="left" type="monotone" dataKey="visitors" name="Property Visitors" fill="url(#visitorGradient)" stroke="#3b82f6" strokeWidth={2} />
                <Area yAxisId="left" type="monotone" dataKey="leads" name="Captured Leads" fill="url(#leadGradient)" stroke="#10b981" strokeWidth={2.5} />
                <Line yAxisId="right" type="monotone" dataKey="conversionRate" name="Conversion Rate (%)" stroke="#059669" strokeWidth={3.5} dot={{ r: 5, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
              <span className="font-bold text-blue-900 block mb-0.5">Visitors to Leads Ratio</span>
              <span className="text-blue-700 font-medium">1 in every 9.4 visitors submits a verified lead profile.</span>
            </div>
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
              <span className="font-bold text-emerald-900 block mb-0.5">Peak Conversion Interval</span>
              <span className="text-emerald-700 font-medium">Saturdays and Sundays yield a 10.6% peak conversion.</span>
            </div>
            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl">
              <span className="font-bold text-purple-900 block mb-0.5">Paired Lender Opt-in Rate</span>
              <span className="text-purple-700 font-medium">60.8% of captured leads opt-in to financing consultations.</span>
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
      <div className="grid gap-4 md:grid-cols-2">
        {/* Language Distribution */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Multilingual Sora Buyer Demographics</CardTitle>
              <CardDescription className="text-xs text-slate-500">Languages spoken during live AI tour voice sessions</CardDescription>
            </div>
            <Globe2 className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="h-[200px] w-full min-w-0 relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
                <BarChart data={LANGUAGE_DATA}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val: any) => [`${val}% of visitors`, 'Share']} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {LANGUAGE_DATA.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#2563eb" : index === 1 ? "#3b82f6" : "#60a5fa"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {LANGUAGE_DATA.map((item) => (
                <div key={item.name} className="flex justify-between items-center p-2.5 border rounded-lg bg-slate-50">
                  <span className="font-bold text-slate-800">{item.name}</span>
                  <span className="font-black text-blue-600">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lead Conversion Funnel */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Lead Conversion Funnel</CardTitle>
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
    </div>
  );
}
