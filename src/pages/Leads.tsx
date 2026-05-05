import { Phone, Mail, Calendar, CheckSquare, Square, ChevronRight, Send, Database, Info, X, FileText, Zap, Activity } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

const DUMMY_LEADS = [
  { id: "1", name: "Eleanor Rigby", property: "888 Bel Air Rd, Los Angeles", phone: "+1 (555) 123-4567", email: "eleanor@example.com", date: Date.now() - 1000 * 60 * 60 * 2, status: "Hot", lastPushed: null },
  { id: "2", name: "Jude Lawson", property: "15 Central Park West, NY", phone: "+1 (555) 987-6543", email: "jude.l@example.com", date: Date.now() - 1000 * 60 * 60 * 24, status: "Warm", lastPushed: Date.now() - 1000 * 60 * 60 * 48 },
  { id: "3", name: "Penny Lane", property: "123 VertexAgent Lane", phone: "+1 (555) 456-7890", email: "penny@example.com", date: Date.now() - 1000 * 60 * 60 * 48, status: "Cold", lastPushed: null },
  { id: "4", name: "Maxwell Edison", property: "888 Bel Air Rd, Los Angeles", phone: "+1 (555) 321-0987", email: "maxwell@example.com", date: Date.now() - 1000 * 60 * 60 * 72, status: "New", lastPushed: Date.now() - 1000 * 60 * 10 },
  { id: "5", name: "Prudence Dear", property: "15 Central Park West, NY", phone: "+1 (555) 111-2222", email: "prudence@example.com", date: Date.now() - 1000 * 60 * 60 * 80, status: "Warm", lastPushed: null },
  { id: "6", name: "Rita Metermaid", property: "123 VertexAgent Lane", phone: "+1 (555) 333-4444", email: "rita@example.com", date: Date.now() - 1000 * 60 * 60 * 96, status: "Hot", lastPushed: Date.now() - 1000 * 60 * 60 * 5 },
  { id: "7", name: "Father McKenzie", property: "888 Bel Air Rd, Los Angeles", phone: "+1 (555) 555-6666", email: "mckenzie@example.com", date: Date.now() - 1000 * 60 * 60 * 120, status: "Cold", lastPushed: null },
  { id: "8", name: "Michelle Belle", property: "15 Central Park West, NY", phone: "+1 (555) 777-8888", email: "michelle@example.com", date: Date.now() - 1000 * 60 * 60 * 150, status: "New", lastPushed: null },
  { id: "9", name: "Julia Lennon", property: "123 VertexAgent Lane", phone: "+1 (555) 999-0000", email: "julia@example.com", date: Date.now() - 1000 * 60 * 60 * 200, status: "Warm", lastPushed: null },
  { id: "10", name: "Lucy Diamond", property: "888 Bel Air Rd, Los Angeles", phone: "+1 (555) 222-3333", email: "lucy@example.com", date: Date.now() - 1000 * 60 * 60 * 250, status: "Hot", lastPushed: null },
];

export default function Leads() {
  const navigate = useNavigate();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
   const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);

  const toggleSelectAll = () => {
    if (selectedLeads.length === DUMMY_LEADS.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(DUMMY_LEADS.map(l => l.id));
    }
  };

  const toggleSelectLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (type: 'email' | 'crm') => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsBulkActionOpen(false);
      
      if (type === 'email') {
        setIsPDFPreviewOpen(true);
      } else {
        setSelectedLeads([]);
        toast.success(`Exported ${selectedLeads.length} leads to your CRM.`, {
          description: "Sync completed successfully."
        });
      }
    }, 1200);
  };

  const confirmEmailSend = () => {
    setIsPDFPreviewOpen(false);
    setSelectedLeads([]);
    toast.success(`Success! Detailed PDF reports for ${selectedLeads.length} leads sent to your email.`, {
      description: "You'll receive a separate email for each property lead shortly."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads Captured</h1>
          <p className="text-slate-500 mt-1">Review the latest leads from your AI tours.</p>
        </div>
      </div>

      <div className="border rounded-xl bg-white overflow-hidden shadow-sm relative">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-4 w-10">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-slate-200" 
                  onClick={toggleSelectAll}
                >
                  {selectedLeads.length === DUMMY_LEADS.length ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : selectedLeads.length > 0 ? (
                     <div className="h-4 w-4 bg-blue-100 rounded flex items-center justify-center">
                        <div className="h-0.5 w-2 bg-blue-600" />
                     </div>
                  ) : (
                    <Square className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </th>
              <th className="px-6 py-4 font-medium">Contact</th>
              <th className="px-6 py-4 font-medium">Property</th>
              <th className="px-6 py-4 font-medium">CRM Status</th>
              <th className="px-6 py-4 font-medium">Date info</th>
              <th className="px-6 py-4 font-medium text-right">Label</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {DUMMY_LEADS.slice(0, visibleCount).map((lead) => (
              <tr 
                key={lead.id} 
                className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedLeads.includes(lead.id) ? 'bg-blue-50/50' : ''}`}
                onClick={() => navigate(`/app/leads/${lead.id}`)}
              >
                <td className="px-4 py-4" onClick={(e) => toggleSelectLead(lead.id, e)}>
                  <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${selectedLeads.includes(lead.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                    {selectedLeads.includes(lead.id) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckSquare className="h-3 w-3 text-white" /></motion.div>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900 group-hover:text-blue-600">
                    {lead.name}
                  </div>
                  <div className="text-slate-500 text-xs flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                    <Mail className="h-3 w-3" /> <a href={`mailto:${lead.email}`} className="hover:text-blue-600 hover:underline">{lead.email}</a>
                  </div>
                  <div className="text-slate-500 text-xs flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                    <Phone className="h-3 w-3" /> <a href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-blue-600 hover:underline">{lead.phone}</a>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-700 font-medium">{lead.property}</td>
                <td className="px-6 py-4">
                   {lead.lastPushed ? (
                     <div className="flex flex-col gap-0.5">
                       <span className="text-[10px] uppercase font-bold text-green-600 flex items-center gap-1">
                         <Database className="h-3 w-3" /> Pushed to CRM
                       </span>
                       <span className="text-slate-400 text-[10px]">{format(lead.lastPushed, "MMM d, h:mm a")}</span>
                     </div>
                   ) : (
                     <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                       <Info className="h-3 w-3" /> Not in CRM
                     </span>
                   )}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  <div className="flex items-center gap-1 font-medium text-xs">
                    <Calendar className="h-3 w-3" />
                    {format(lead.date, "MMM d, yyyy")}
                  </div>
                  <div className="text-[10px] mt-1 text-slate-400">{format(lead.date, "h:mm a")}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${lead.status === 'Hot' ? 'bg-red-100 text-red-700' : ''}
                    ${lead.status === 'Warm' ? 'bg-orange-100 text-orange-700' : ''}
                    ${lead.status === 'Cold' ? 'bg-blue-100 text-blue-700' : ''}
                    ${lead.status === 'New' ? 'bg-green-100 text-green-700' : ''}
                  `}>
                    {lead.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {DUMMY_LEADS.length > visibleCount && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex flex-col items-center gap-3">
             <div className="text-xs font-bold text-slate-400 border px-3 py-1 rounded-full bg-white shadow-sm">
               {visibleCount} OF {DUMMY_LEADS.length} LEADS
             </div>
             <div className="flex items-center gap-2">
               <Button 
                variant="outline" 
                size="sm" 
                className="font-bold gap-2 text-blue-600 bg-white border-blue-100 hover:bg-blue-50 transition-all px-6"
                onClick={() => setVisibleCount(prev => Math.min(prev + 4, DUMMY_LEADS.length))}
               >
                 Show More Leads <ChevronRight className="h-4 w-4" />
               </Button>
             </div>
             <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Next Page</p>
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedLeads.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 z-50 border border-slate-800"
          >
            <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
              <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                {selectedLeads.length}
              </div>
              <span className="text-sm font-medium">selected</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => setSelectedLeads([])}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              className="bg-blue-600 hover:bg-blue-500 gap-2 font-bold" 
              onClick={() => setIsBulkActionOpen(true)}
            >
              Send Me Info <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={isBulkActionOpen} onOpenChange={setIsBulkActionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Handle Selected Leads</DialogTitle>
            <DialogDescription>
              Choose how you want to receive the information for the {selectedLeads.length} selected contacts.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-32 gap-3 hover:border-blue-500 hover:bg-blue-50 group"
              onClick={() => handleBulkAction('email')}
              disabled={isProcessing}
            >
              <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Send className="h-6 w-6" />
              </div>
              <div className="text-center">
                <div className="font-bold text-slate-900">Email Me</div>
                <div className="text-[10px] text-slate-500">Instant PDF reports</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-32 gap-3 hover:border-green-500 hover:bg-green-50 group"
              onClick={() => handleBulkAction('crm')}
              disabled={isProcessing}
            >
              <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                <Database className="h-6 w-6" />
              </div>
              <div className="text-center">
                <div className="font-bold text-slate-900">Push to CRM</div>
                <div className="text-[10px] text-slate-500">Sync contact records</div>
              </div>
            </Button>
          </div>
          {isProcessing && (
            <div className="flex items-center justify-center pb-4 text-xs font-medium text-slate-500 gap-2">
              <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Processing batch operation...
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPDFPreviewOpen} onOpenChange={setIsPDFPreviewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 rounded text-red-600">
                <FileText className="h-4 w-4" />
              </div>
              Prospect Insight Report (PDF Preview)
            </DialogTitle>
            <DialogDescription>
              This is a preview of the instant report that will be attached to your email.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-white border-8 border-slate-100 p-8 shadow-inner font-sans text-slate-900 mt-4 rounded-lg">
            {/* PDF Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-8">
              <div>
                <h1 className="text-2xl font-black tracking-tighter text-blue-600">VERTEX<span className="text-slate-900 italic">REALTY</span></h1>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-left">AI INSIGHT REPORT • PROPRIETARY</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500">Report ID: #VX-{Math.floor(Math.random() * 100000)}</p>
                <p className="text-xs text-slate-400">{format(Date.now(), "MMMM d, yyyy")}</p>
              </div>
            </div>

            {/* Property Summary */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 text-left">Target Property</p>
                  <p className="text-lg font-bold leading-tight underline decoration-blue-500 underline-offset-4 text-left">{DUMMY_LEADS[0].property}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter text-left">Engagement Pulse</p>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-red-500 w-[70%]" />
                    <div className="h-full bg-blue-500 w-[20%]" />
                    <div className="h-full bg-slate-200 w-[10%]" />
                  </div>
                  <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase">
                    <span>High Intent (70%)</span>
                    <span>General Info (20%)</span>
                    <span>Others (10%)</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl rotate-1 relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Zap className="h-16 w-16" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">PROSPECT SCORE</p>
                <div className="text-5xl font-black tracking-tighter mb-1">94<span className="text-xl">/100</span></div>
                <p className="text-xs font-medium opacity-90 leading-snug">This prospect spent 12 minutes in the tour and asked about the school district twice.</p>
              </div>
            </div>

            {/* Lead Details Table */}
            <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 shadow-sm text-left">
              <div className="bg-slate-900 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest">Prospect Overview</div>
              <div className="grid grid-cols-2 divide-x divide-slate-100 italic">
                <div className="p-4 border-b border-slate-100">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Full Name</p>
                   <p className="text-sm font-bold">{DUMMY_LEADS[0].name}</p>
                </div>
                <div className="p-4 border-b border-slate-100">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Sentiment</p>
                   <p className="text-sm font-bold text-red-600 uppercase tracking-tighter flex items-center gap-1">
                     <Activity className="h-3 w-3" /> Extremely High Intent
                   </p>
                </div>
                <div className="p-4">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Email Hash</p>
                   <p className="text-sm font-mono truncate">{DUMMY_LEADS[0].email}</p>
                </div>
                <div className="p-4">
                   <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Last Interaction</p>
                   <p className="text-sm font-bold">{format(DUMMY_LEADS[0].date, "MMM d, h:mm a")}</p>
                </div>
              </div>
            </div>

            {/* AI Insights Section */}
            <div className="relative border-l-4 border-blue-600 pl-6 py-2 text-left">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3">AI Strategic Suggestions</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 italic">"Prospect mentioned a 3-month relocation window."</p>
                    <p className="text-[10px] text-slate-500 mt-1">Recommendation: Follow up with local school district rankings and proximity charts to the property.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 opacity-60">
                   <div className="mt-1 h-2 w-2 rounded-full bg-slate-300" />
                   <p className="text-xs text-slate-600">Lead explored the master ensuite photos for 45+ seconds. Mention the heated towel rack was installed in 2023.</p>
                </li>
              </ul>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-slate-100 flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase tracking-widest">
              <span>VertexAgent AI Core v2.4</span>
              <span className="text-blue-600">CONFIDENTIAL • NOT FOR PUBLIC DISTRIBUTION</span>
            </div>
          </div>

          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button variant="ghost" onClick={() => setIsPDFPreviewOpen(false)} className="sm:flex-1">
              Close Preview
            </Button>
            <Button onClick={confirmEmailSend} className="bg-blue-600 hover:bg-blue-500 sm:flex-1 font-bold shadow-lg shadow-blue-200 gap-2">
              Email PDF Report <Send className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
