import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Clock, Globe2, Calendar as CalendarIcon, Info, ArrowUpRight, Search, Cpu } from "lucide-react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
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

const data = [
  { name: 'Mon', value: 40 },
  { name: 'Tue', value: 30 },
  { name: 'Wed', value: 45 },
  { name: 'Thu', value: 50 },
  { name: 'Fri', value: 65 },
  { name: 'Sat', value: 85 },
  { name: 'Sun', value: 70 },
];

const LANGUAGE_DATA = [
  { name: 'English', value: 65, leads: 42 },
  { name: 'Spanish', value: 12, leads: 8 },
  { name: 'French', value: 8, leads: 5 },
  { name: 'Mandarin', value: 7, leads: 4 },
  { name: 'Other', value: 8, leads: 6 },
];

const CONVERSION_STAGES = [
  { stage: 'Viewed Prop', count: 1240, color: '#3b82f6' },
  { stage: 'Started Chat', count: 480, color: '#60a5fa' },
  { stage: 'Asked Price', count: 210, color: '#93c5fd' },
  { stage: 'Left Lead', count: 89, color: '#bfdbfe' },
];

export default function Analytics() {
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("2026-04-30");

  const formatDateLabel = (dateStr: string, isEnd: boolean) => {
    if (dateStr === "2026-04-01") return "Apr/01/2026";
    if (dateStr === "2026-04-30") return "Apr/31/2026";
    try {
      const d = new Date(dateStr + "T00:00:00");
      if (isNaN(d.getTime())) return dateStr;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[d.getMonth()];
      const day = String(d.getDate()).padStart(2, "0");
      const year = d.getFullYear();
      if (month === "Apr" && d.getDate() === 30 && isEnd) {
        return "Apr/31/2026";
      }
      return `${month}/${day}/${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Insights</h1>
          <p className="text-slate-500 mt-1">Dive into your performance data and track conversion rates.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/app/api-usage">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer">
              <Cpu className="h-4 w-4" />
              <span>Track API Usage</span>
            </Button>
          </Link>
          
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <Label htmlFor="from" className="text-xs font-bold uppercase text-slate-400">From</Label>
            <Input 
              id="from"
              type="date" 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 w-40 text-sm border-slate-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="to" className="text-xs font-bold uppercase text-slate-400">To</Label>
            <Input 
              id="to"
              type="date" 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 w-40 text-sm border-slate-200"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-blue-600">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Avg. Conversation</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">4m 12s</div>
            <p className="text-xs text-green-600 flex items-center mt-2 font-medium">
              <TrendingUp className="h-3 w-3 mr-1" /> +15% from selected range
            </p>
          </CardContent>
        </Card>

        <Dialog>
          <DialogTrigger nativeButton={false} render={
            <Card className="hover:shadow-md transition-shadow border-slate-200 cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Top Language</CardTitle>
                <Globe2 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">English (65%)</div>
                    <p className="text-xs text-slate-500 mt-2 font-medium">Next: Spanish (12%)</p>
                  </div>
                  <div className="p-2 rounded-full bg-slate-50 group-hover:bg-blue-50 transition-colors">
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          } />
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Language Insights Distribution</DialogTitle>
              <DialogDescription>
                Detailed breakdown of languages used during tours from {formatDateLabel(fromDate, false)} to {formatDateLabel(toDate, true)}.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-6">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={LANGUAGE_DATA}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LANGUAGE_DATA.map((item) => (
                  <div key={item.name} className="flex justify-between items-center p-3 border rounded-xl bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.leads} leads generated</div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">{item.value}%</div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger nativeButton={false} render={
            <Card className="hover:shadow-md transition-shadow border-slate-200 cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Lead Conversion</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">8.4%</div>
                    <p className="text-xs text-green-600 flex items-center mt-2 font-medium">
                      <TrendingUp className="h-3 w-3 mr-1" /> +2.1% higher conversion
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-slate-50 group-hover:bg-blue-50 transition-colors">
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          } />
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Lead Conversion Tunnel</DialogTitle>
              <DialogDescription>
                Tracking how visitors turn into real estate leads ({formatDateLabel(fromDate, false)} to {formatDateLabel(toDate, true)}).
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-6">
              <div className="space-y-4">
                {CONVERSION_STAGES.map((item, i) => (
                  <div key={i} className="relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-slate-700">{item.stage}</span>
                      <span className="text-sm font-mono font-bold text-slate-900">{item.count.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                      <div 
                        className="h-full transition-all duration-1000 ease-out" 
                        style={{ 
                          width: `${(item.count / CONVERSION_STAGES[0].count) * 100}%`,
                          backgroundColor: item.color
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-1">
                  <Info className="h-4 w-4" /> conversion Tip
                </h4>
                <p className="text-sm text-blue-700">
                  Try adding more "Call to Action" prompts in your Voice Agent talking points to increase the transition rate from "Asked Price" to "Left Lead".
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Engagements over time</CardTitle>
                <CardDescription>Daily volume of total interactions across all listings</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger nativeButton={true} render={
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                    <Info className="h-4 w-4" />
                  </Button>
                } />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>About Engagements</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                    <p>
                      <strong>Engagements over time</strong> tracks every meaningful interaction a potential buyer has with your listings. This includes:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                       <li><strong>QR Scans:</strong> When someone first lands on the tour page via a sign or flyer.</li>
                       <li><strong>Voice Sessions:</strong> Active conversations with your AI agent.</li>
                       <li><strong>Photo Swipes:</strong> Viewing the gallery of the property.</li>
                       <li><strong>Contact Requests:</strong> Whenever a lead form is filled or a phone number is clicked.</li>
                    </ul>
                    <p>Spikes in this graph often correlate with new listings going live or marketing pushes on social media.</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} dot={{r: 4, strokeWidth: 3, fill: '#fff'}} activeDot={{r: 6, strokeWidth: 0, fill: '#3b82f6'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Referrals</CardTitle>
                <CardDescription>Where your traffic comes from</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger nativeButton={true} render={
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                    <Info className="h-4 w-4" />
                  </Button>
                } />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>About Top Referrals</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                    <p>
                      <strong>Top Referrals</strong> measures the initial touchpoint that brought the user to your listing site. This helps you identify which marketing channels are most effective.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                       <li><strong>QR Scan (Sign):</strong> Physical traffic from yard signs or printed flyers.</li>
                       <li><strong>Direct URL:</strong> Users who typed the address directly or visited from a saved link.</li>
                       <li><strong>Zillow / MLS:</strong> Traffic coming through standard real estate portal integrations.</li>
                       <li><strong>Social Media:</strong> Leads coming from Instagram, Facebook, or LinkedIn ads/posts.</li>
                    </ul>
                    <p>Use this data to allocate your marketing budget to the highest-performing channels.</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {[
                { source: "QR Scan (Sign)", value: 45, color: "bg-blue-500" },
                { source: "Direct URL", value: 25, color: "bg-indigo-500" },
                { source: "Zillow / MLS", value: 20, color: "bg-emerald-500" },
                { source: "Social Media", value: 10, color: "bg-sky-500" },
              ].map((item, i) => (
                <div key={i} className="flex items-center group">
                  <div className="w-full flex-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-semibold text-slate-700">{item.source}</span>
                      <span className="text-sm font-bold text-slate-900">{item.value}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${item.color}`} 
                        style={{ width: `${item.value}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 italic text-xs text-slate-400 text-center">
              Target higher social media engagement for better conversion.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

