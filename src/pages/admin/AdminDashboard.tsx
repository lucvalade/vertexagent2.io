import React, { useState } from 'react';
import { Users, Home, TrendingUp, AlertCircle, Shield, CheckCircle2, ChevronRight, Activity, FileText, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  // Load notifications from localStorage
  const savedNotifications = JSON.parse(localStorage.getItem('system_notifications') || '[]');
  
  const baseLogs = [
    { id: 1, event: 'New agent registered', user: 'Sarah Jenkins', time: '12 mins ago', icon: Users, details: 'Full agent onboarded to Main Office. 12 month contract signed.', severity: 'low' },
    { id: 2, event: 'Compliance document approved', user: 'System', time: '1 hour ago', icon: Shield, details: '888 Bel Air Rd disclosure documents verified through AI filter.', severity: 'medium' },
    { id: 3, event: 'Large traffic surge detected', user: 'Listing: 123 Maple St', time: '3 hours ago', icon: TrendingUp, details: 'Unexpected 400% increase in tour traffic. Origin: TikTok viral share.', severity: 'high' },
    { id: 4, event: 'New lead generated (Primary)', user: 'Agent: Luc Valade', time: '5 hours ago', icon: Users, details: 'High-intent lead captured for property #7892. PDF attachment sent.', severity: 'low' },
  ];

  // Map system notifications to log format
  const dynamicLogs = savedNotifications.map((n: any) => ({
    id: n.id,
    event: n.message,
    user: n.actor,
    time: n.time,
    icon: Activity,
    details: `Automated alert: ${n.message} by ${n.actor}. Source: Admin Notification System.`,
    severity: n.message.includes('downgrade') ? 'high' : 'medium'
  }));

  const logs = [...dynamicLogs, ...baseLogs].slice(0, 5);

  const stats = [
    { label: 'Active Agents', value: '24', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', path: '/app/admin/users', hover: 'hover:border-blue-300 hover:shadow-blue-50' },
    { label: 'Total Listings', value: '142', icon: Home, iconAlt: true, color: 'text-purple-600', bg: 'bg-purple-50', path: '/app/admin/listings', hover: 'hover:border-purple-300 hover:shadow-purple-50' },
    { label: 'Total Leads', value: '1,284', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', path: '/app/leads', hover: 'hover:border-green-300 hover:shadow-green-50' },
    { label: 'Pending Compliance', value: '5', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', path: '/app/compliance', hover: 'hover:border-amber-300 hover:shadow-amber-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center text-left">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 italic">ADMIN COMMAND CENTER</h1>
          <p className="text-slate-500 font-medium">Real-time governance and performance surveillance.</p>
        </div>
        <div className="flex gap-2">
           <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100 shadow-sm animate-pulse">
            <CheckCircle2 className="h-3.5 w-3.5" /> Core Systems Online
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => navigate(stat.path)}
            className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all duration-500 cursor-pointer group hover:bg-blue-600 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-200/50`}
          >
            <div className={`p-3 w-12 h-12 rounded-xl ${stat.bg} ${stat.color} mb-4 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-white/20 group-hover:text-white shadow-inner`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 group-hover:text-blue-100 transition-colors">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black tracking-tighter text-slate-900 italic group-hover:text-white transition-colors">{stat.value}</p>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-white transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Recent System Activity</h3>
              </div>
              <button 
                onClick={() => setIsLogsModalOpen(true)}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
              >
                View Audit Trail
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  onClick={() => setSelectedLog(log)}
                  className="px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-5">
                    <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-white border border-transparent group-hover:border-slate-200 transition-all">
                      <log.icon className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{log.event}</p>
                      <p className="text-xs text-slate-500 font-medium">Actor: {log.user}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{log.time}</span>
                    <p className="text-[8px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest mt-1">Details {"\u2192"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-6 text-white shadow-lg shadow-red-200/50">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5" />
              <h3 className="font-bold">Security Alerts</h3>
            </div>
            <p className="text-red-100 text-sm mb-4">No critical vulnerabilities or unauthorized access attempts detected in the last 24h.</p>
            <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors border border-white/20">
              Run Security Audit
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Brokerage Quota</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Agent Seats</span>
                  <span className="font-bold text-slate-900">24 / 50</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '48%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Total Storage</span>
                  <span className="font-bold text-slate-900">12.4GB / 50GB</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 font-black tracking-tighter text-2xl italic">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                {selectedLog?.icon && React.createElement(selectedLog.icon, { className: "h-5 w-5" })}
              </div>
              Event Report #{selectedLog?.id}
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-xs">
              System Audit Detail • {selectedLog?.time}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6 text-left">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Event Description</p>
              <p className="text-sm font-bold text-slate-900 leading-relaxed">{selectedLog?.details}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Actor</p>
                <p className="text-xs font-bold text-slate-700 italic">{selectedLog?.user}</p>
              </div>
              <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Security Level</p>
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${
                    selectedLog?.severity === 'high' ? 'bg-red-500' : 
                    selectedLog?.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <p className="text-xs font-bold text-slate-700 capitalize">{selectedLog?.severity}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
              <FileText className="h-10 w-10 text-slate-200 mb-2" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Extended Log Data</p>
              <p className="text-[10px] text-slate-300 italic">No additional metadata attached to this event ID.</p>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setSelectedLog(null)} className="flex-1 font-bold">Close</Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-500 font-bold gap-2">
              <Download className="h-4 w-4" /> Export JSON
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isLogsModalOpen} onOpenChange={setIsLogsModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 font-black tracking-tighter text-2xl italic">
              <Activity className="h-6 w-6 text-blue-600" /> SYSTEM AUDIT TRAIL
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-xs">
              Complete historical log of all brokerage movements
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-900 rounded-2xl p-6 font-mono text-[11px] text-green-400 overflow-x-auto my-6 text-left shadow-2xl">
            <div className="space-y-1 mb-4 opacity-50">
              <p>[SYSTEM] Initializing stream...</p>
              <p>[AUTH] Admin luc@vertexrealty.ca session validated.</p>
              <p>[DB] Connecting to vertex_core_shard_01... OK</p>
            </div>
            
            <div className="space-y-4">
              {[...logs, ...logs, ...logs].map((log, idx) => (
                <div key={idx} className="flex gap-4 border-l border-green-900/30 pl-4 py-1 hover:bg-white/5 cursor-pointer transition-colors" onClick={() => {
                  setSelectedLog(log);
                  setIsLogsModalOpen(false);
                }}>
                  <span className="text-green-700 shrink-0">[{format(new Date(Date.now() - idx * 3600000), 'HH:mm:ss')}]</span>
                  <span className="text-blue-300 shrink-0 uppercase tracking-tighter font-black">EVT_{log.id}</span>
                  <span className="text-slate-200">User: <span className="text-amber-200">{log.user}</span> executed <span className="text-green-200">{log.event}</span></span>
                </div>
              ))}
            </div>
          </div>

          <Button variant="outline" onClick={() => setIsLogsModalOpen(false)} className="w-full font-bold">
            Close Audit Trail
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
