import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { 
  FileBox, 
  Search, 
  Loader2, 
  Shield, 
  Mail, 
  UserPlus, 
  Trash2, 
  AlertTriangle,
  History,
  Info
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SystemLog {
  id: string;
  type: 'INFO' | 'SECURITY' | 'EMAIL_SIM' | 'ACTION';
  message: string;
  details?: any;
  timestamp: any;
  userId?: string;
  userEmail?: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "system_logs"), 
      orderBy("timestamp", "desc"),
      limit(100)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemLog[];
      setLogs(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(search.toLowerCase()) ||
    log.type.toLowerCase().includes(search.toLowerCase()) ||
    log.userEmail?.toLowerCase().includes(search.toLowerCase())
  );

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'SECURITY': return <Shield className="h-4 w-4 text-red-600" />;
      case 'EMAIL_SIM': return <Mail className="h-4 w-4 text-blue-600" />;
      case 'ACTION': return <History className="h-4 w-4 text-amber-600" />;
      default: return <Info className="h-4 w-4 text-slate-400" />;
    }
  };

  const getLogBadge = (type: string) => {
    switch (type) {
      case 'SECURITY': return <Badge variant="destructive" className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0">Security</Badge>;
      case 'EMAIL_SIM': return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none text-[10px] font-black uppercase tracking-widest px-1.5 py-0">Email</Badge>;
      case 'ACTION': return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[10px] font-black uppercase tracking-widest px-1.5 py-0">Action</Badge>;
      default: return <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0">Info</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start text-left">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 italic uppercase flex items-center gap-3">
            <FileBox className="h-8 w-8 text-blue-600" />
            System Logs
          </h1>
          <p className="text-slate-500 font-medium max-w-xl">
            Audit trail for administrative actions, security events, and simulated system notifications.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input 
          placeholder="Filter logs by message, type, or user..." 
          className="pl-12 h-14 bg-white border-slate-200 rounded-2xl shadow-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Time</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Event</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs font-bold text-slate-500">
                      {log.timestamp ? format(log.timestamp.toDate(), 'HH:mm:ss') : '--:--:--'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {log.timestamp ? format(log.timestamp.toDate(), 'MM/dd/yy') : '--/--/--'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getLogIcon(log.type)}
                      {getLogBadge(log.type)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors max-w-md truncate">
                      {log.message}
                    </div>
                    {log.details && log.type === 'EMAIL_SIM' && (
                      <div className="text-[10px] text-slate-400 font-medium">
                        Recipient: {log.details.recipient} • Template: {log.details.template}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.userEmail ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-slate-100 rounded flex items-center justify-center text-[10px] font-black uppercase text-slate-400">
                          {log.userEmail.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-600">{log.userEmail}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 italic">System Agent</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                     {log.details && (
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => setSelectedLog(log)}
                       >
                         View Details
                       </Button>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredLogs.length === 0 && (
            <div className="p-12 text-center space-y-3">
              <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                <Search className="h-6 w-6 text-slate-200" />
              </div>
              <p className="text-sm text-slate-500 font-medium">No logs matched your current search filters.</p>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 font-black tracking-tighter text-2xl italic">
              {selectedLog && getLogIcon(selectedLog.type)}
              {selectedLog?.type === 'EMAIL_SIM' ? 'EMAIL TRANSMISSION LOG' : 'SYSTEM EVENT DETAILS'}
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-xs">
              Audit ID: {selectedLog?.id} • {selectedLog?.timestamp && format(selectedLog.timestamp.toDate(), 'MMM d, yyyy HH:mm:ss')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6 text-left">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Event Summary</p>
              <p className="text-sm font-bold text-slate-900 leading-relaxed">{selectedLog?.message}</p>
            </div>

            {selectedLog?.type === 'EMAIL_SIM' && selectedLog.details && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Recipient</p>
                    <p className="text-xs font-bold text-slate-700 italic">{selectedLog.details.recipient}</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Email Template</p>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{selectedLog.details.template}</p>
                  </div>
                </div>

                <div className="p-6 bg-white border-2 border-slate-100 rounded-2xl shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Mail className="h-20 w-20" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-4 border-b pb-2">Simulated Email Body</p>
                  <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap relative z-10 leading-relaxed italic">
                    {selectedLog.details.body || "No email body archived."}
                  </p>
                </div>
                
                {selectedLog.details.metadata && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Technical Metadata</p>
                    <pre className="text-[10px] text-slate-500 overflow-x-auto">
                      {JSON.stringify(selectedLog.details.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {selectedLog?.type !== 'EMAIL_SIM' && selectedLog?.details && (
              <div className="p-4 bg-slate-900 rounded-xl font-mono text-[11px] text-green-400 overflow-x-auto shadow-2xl border-4 border-slate-800">
                <p className="text-slate-500 mb-2 opacity-50 uppercase text-[9px] font-black tracking-widest tracking-tighter">// Extended JSON Metadata</p>
                {JSON.stringify(selectedLog.details, null, 2)}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-100">
            <Button variant="outline" onClick={() => setSelectedLog(null)} className="flex-1 font-bold">Dismiss Audit</Button>
            {selectedLog?.type === 'EMAIL_SIM' && (
              <Button className="flex-1 bg-blue-600 hover:bg-blue-500 font-bold gap-2">
                Resend Notice <Mail className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
