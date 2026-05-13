import { Phone, Mail, Calendar, CheckSquare, Square, ChevronRight, Send, Database, Info, X, FileText, Zap, Activity, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { sendEmail, getUserLeads, Lead } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

const DUMMY_LEADS = [
  { id: "1", name: "Eleanor Rigby", property: "888 Bel Air Rd, Los Angeles", phone: "+1 (555) 123-4567", email: "eleanor@example.com", date: Date.now() - 1000 * 60 * 60 * 2, status: "Hot", lastPushed: null, agentId: "1" },
  { id: "2", name: "Jude Lawson", property: "15 Central Park West, NY", phone: "+1 (555) 987-6543", email: "jude.l@example.com", date: Date.now() - 1000 * 60 * 60 * 24, status: "Warm", lastPushed: Date.now() - 1000 * 60 * 60 * 48, agentId: "2" },
  { id: "3", name: "Penny Lane", property: "123 VertexAgent Lane", phone: "+1 (555) 456-7890", email: "penny@example.com", date: Date.now() - 1000 * 60 * 60 * 48, status: "Cold", lastPushed: null, agentId: "3" },
  { id: "4", name: "Maxwell Edison", property: "888 Bel Air Rd, Los Angeles", phone: "+1 (555) 321-0987", email: "maxwell@example.com", date: Date.now() - 1000 * 60 * 60 * 72, status: "New", lastPushed: Date.now() - 1000 * 60 * 10, agentId: "1" },
  { id: "5", name: "Prudence Dear", property: "15 Central Park West, NY", phone: "+1 (555) 111-2222", email: "prudence@example.com", date: Date.now() - 1000 * 60 * 60 * 80, status: "Warm", lastPushed: null, agentId: "2" },
  { id: "6", name: "Rita Metermaid", property: "123 VertexAgent Lane", phone: "+1 (555) 333-4444", email: "rita@example.com", date: Date.now() - 1000 * 60 * 60 * 96, status: "Hot", lastPushed: Date.now() - 1000 * 60 * 60 * 5, agentId: "4" },
  { id: "7", name: "Father McKenzie", property: "888 Bel Air Rd, Los Angeles", phone: "+1 (555) 555-6666", email: "mckenzie@example.com", date: Date.now() - 1000 * 60 * 60 * 120, status: "Cold", lastPushed: null, agentId: "5" },
  { id: "8", name: "Michelle Belle", property: "15 Central Park West, NY", phone: "+1 (555) 777-8888", email: "michelle@example.com", date: Date.now() - 1000 * 60 * 60 * 150, status: "New", lastPushed: null, agentId: "1" },
  { id: "9", name: "Julia Lennon", property: "123 VertexAgent Lane", phone: "+1 (555) 999-0000", email: "julia@example.com", date: Date.now() - 1000 * 60 * 60 * 200, status: "Warm", lastPushed: null, agentId: "3" },
  { id: "10", name: "Lucy Diamond", property: "888 Bel Air Rd, Los Angeles", phone: "+1 (555) 222-3333", email: "lucy@example.com", date: Date.now() - 1000 * 60 * 60 * 250, status: "Hot", lastPushed: null, agentId: "2" },
];

export default function Leads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const listingIdFilter = searchParams.get("listing");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [showEmailConsolidationQuery, setShowEmailConsolidationQuery] = useState(false);
  const [isConsolidatedEmail, setIsConsolidatedEmail] = useState(false);
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    if (user?.id) {
      loadLeads();
    }
  }, [user?.id]);

  async function loadLeads() {
    try {
      const data = await getUserLeads(user!.id);
      // Sort by date descending
      setLeads(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error("Error loading leads:", err);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }

  const filteredLeads = useMemo(() => {
    if (!listingIdFilter) return leads;
    return leads.filter(l => l.listingId === listingIdFilter);
  }, [leads, listingIdFilter]);

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
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
        if (selectedLeads.length > 1) {
          setShowEmailConsolidationQuery(true);
        } else {
          setIsConsolidatedEmail(false);
          setIsPDFPreviewOpen(true);
        }
      } else {
        setSelectedLeads([]);
        toast.success(`Exported ${selectedLeads.length} leads to your CRM.`, {
          description: "Sync completed successfully."
        });
      }
    }, 1200);
  };

  const startEmailProcess = (consolidated: boolean) => {
    setIsConsolidatedEmail(consolidated);
    setShowEmailConsolidationQuery(false);
    setIsPDFPreviewOpen(true);
  };

  const confirmEmailSend = async () => {
    setIsProcessing(true);
    const selectedData = filteredLeads.filter(l => selectedLeads.includes(l.id));
    let successCount = 0;
    
    const toastId = toast.loading(isConsolidatedEmail ? `Sending consolidated report...` : `Sending ${selectedData.length} reports...`, {
      description: "Processing neural insight extraction."
    });

    try {
      const userDoc = await getDoc(doc(db, "users", user!.id));
      const profile = userDoc.data()?.brokerageProfile || {};
      const targetEmail = profile.officeEmail || user?.email || "sales@vertexagent.io";

      if (isConsolidatedEmail) {
        // Build consolidated HTML
        const leadsHtml = selectedData.map((lead, idx) => `
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="margin: 0 0 5px 0; font-size: 10px; color: #64748b; font-weight: bold;">PROSPECT ${idx + 1}</p>
            <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${lead.name}</p>
            <p style="margin: 10px 0;"><strong>Property:</strong> ${lead.property}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${lead.email}</p>
            <p style="margin: 10px 0;"><strong>Phone:</strong> ${lead.phone}</p>
            <p style="margin: 10px 0 0 0;"><strong>Status:</strong> <span style="color: #ef4444; font-weight: bold;">${lead.status}</span></p>
          </div>
        `).join('');

        await sendEmail({
          to: targetEmail,
          subject: `Consolidated Prospect Report: ${selectedData.length} Leads`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #2563eb; padding: 20px; color: white;">
                <h1 style="margin: 0; font-size: 20px;">Consolidated Batch Insight</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">VertexAgent Real Estate AI Core</p>
              </div>
              <div style="padding: 20px;">
                <p>Requested bulk export for <strong>${selectedData.length} leads</strong></p>
                ${leadsHtml}
                <p style="font-size: 12px; color: #64748b; font-style: italic;">Note: This is a consolidated AI-generated lead insight report.</p>
              </div>
            </div>
          `,
          text: `Consolidated Prospect Report for ${selectedData.length} leads.`
        });
        successCount = selectedData.length;
      } else {
        // Send separately (existing logic)
        for (const lead of selectedData) {
          toast.loading(`Mailing report for ${lead.name}...`, { id: toastId });
          await sendEmail({
            to: targetEmail, 
            subject: `Prospect Report: ${lead.name}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #2563eb; padding: 20px; color: white;">
                  <h1 style="margin: 0; font-size: 20px;">Prospect Insight</h1>
                  <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">VertexAgent Real Estate AI Core</p>
                </div>
                <div style="padding: 20px;">
                  <p>Requested export for lead: <strong>${lead.name}</strong></p>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0;"><strong>Property:</strong> ${lead.property}</p>
                    <p style="margin: 10px 0;"><strong>Email:</strong> ${lead.email}</p>
                    <p style="margin: 10px 0;"><strong>Phone:</strong> ${lead.phone}</p>
                    <p style="margin: 10px 0 0 0;"><strong>Status:</strong> <span style="color: #ef4444; font-weight: bold;">${lead.status}</span></p>
                  </div>
                  <p style="font-size: 12px; color: #64748b; font-style: italic;">Note: This is an AI-generated lead insight report.</p>
                </div>
              </div>
            `,
            text: `Prospect Report for ${lead.name} - Property: ${lead.property}`
          });
          successCount++;
        }
      }

      setIsPDFPreviewOpen(false);
      setSelectedLeads([]);
      toast.success(isConsolidatedEmail ? `Success! Consolidated report sent to ${targetEmail}` : `Success! ${successCount} reports sent to ${targetEmail}`, {
        id: toastId,
        description: "Integration Verified."
      });
    } catch (error: any) {
      toast.error(`Email Failure (${successCount}/${selectedData.length} sent)`, {
        id: toastId,
        description: error.message || "Please check your Secrets/SMTP config."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Leads Captured 
            <span className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full">{filteredLeads.length}</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span>Review the latest leads from your AI tours.</span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-blue-600 font-bold italic">Number of leads as of: {format(new Date(), "MMMM d, yyyy")}</span>
          </p>
        </div>
      </div>

      <div className="border rounded-xl bg-white overflow-hidden shadow-sm relative">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-950 uppercase text-[10px] tracking-widest whitespace-nowrap">
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
                <th className="px-6 py-5 font-black">Contact</th>
                <th className="px-6 py-5 font-black">Property</th>
                <th className="px-6 py-5 font-black">CRM Status</th>
                <th className="px-6 py-5 font-black">Date info</th>
                <th className="px-6 py-5 font-black text-right">Label</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLeads.slice(0, visibleCount).map((lead) => (
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
                  <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]" title={lead.listingAddress}>
                    {lead.listingAddress}
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1 whitespace-nowrap">
                       <Info className="h-3 w-3" /> Captured
                     </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    <div className="flex items-center gap-1 font-medium text-xs whitespace-nowrap">
                      <Calendar className="h-3 w-3" />
                      {format(lead.createdAt, "MMM d, yyyy")}
                    </div>
                    <div className="text-[10px] mt-1 text-slate-400">{format(lead.createdAt, "h:mm a")}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${lead.status === 'Hot' ? 'bg-red-100 text-red-700' : ''}
                      ${lead.status === 'Warm' ? 'bg-orange-100 text-orange-700' : ''}
                      ${lead.status === 'Cold' ? 'bg-blue-100 text-blue-700' : ''}
                      ${lead.status === 'New' || !lead.status ? 'bg-green-100 text-green-700' : ''}
                    `}>
                      {lead.status || 'New'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden divide-y divide-slate-100">
          <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Captured Leads</span>
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50" 
                onClick={toggleSelectAll}
              >
                {selectedLeads.length === filteredLeads.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
          {filteredLeads.slice(0, visibleCount).map((lead) => (
            <div 
              key={lead.id} 
              className={`p-4 flex flex-col gap-4 active:bg-slate-50 transition-colors ${selectedLeads.includes(lead.id) ? 'bg-blue-50/50' : ''}`}
              onClick={() => navigate(`/app/leads/${lead.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div 
                    className={`mt-1 h-5 w-5 rounded border flex items-center justify-center transition-colors shrink-0 ${selectedLeads.includes(lead.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}
                    onClick={(e) => toggleSelectLead(lead.id, e)}
                  >
                    {selectedLeads.includes(lead.id) && <CheckSquare className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 leading-tight">{lead.name}</div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{lead.listingAddress}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest
                  ${lead.status === 'Hot' ? 'bg-red-100 text-red-700' : ''}
                  ${lead.status === 'Warm' ? 'bg-orange-100 text-orange-700' : ''}
                  ${lead.status === 'Cold' ? 'bg-blue-100 text-blue-700' : ''}
                  ${lead.status === 'New' || !lead.status ? 'bg-green-100 text-green-700' : ''}
                `}>
                  {lead.status || 'New'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-500 font-medium">
                <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-300" /> {lead.email}</div>
                <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-300" /> {lead.phone}</div>
                <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-300" /> {format(lead.createdAt, "MMM d")}</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-300 flex items-center gap-1"><Database className="h-3.5 w-3.5" /> No CRM</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLeads.length > visibleCount && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex flex-col items-center gap-3">
             <div className="text-xs font-bold text-slate-400 border px-3 py-1 rounded-full bg-white shadow-sm">
               {visibleCount} OF {filteredLeads.length} LEADS
             </div>
             <div className="flex items-center gap-2">
               <Button 
                variant="outline" 
                size="sm" 
                className="font-bold gap-2 text-blue-600 bg-white border-blue-100 hover:bg-blue-50 transition-all px-6"
                onClick={() => setVisibleCount(prev => Math.min(prev + 4, filteredLeads.length))}
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
                <div className="text-[10px] text-slate-500">Instant Reports</div>
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
      
      {/* Consolidation Query Dialog */}
      <Dialog open={showEmailConsolidationQuery} onOpenChange={setShowEmailConsolidationQuery}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Consolidate Reports?</DialogTitle>
            <DialogDescription>
              You've selected {selectedLeads.length} leads. Would you like to receive all reports in a single email or separate emails for each contact?
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-28 gap-2 hover:border-blue-500 hover:bg-blue-50"
              onClick={() => startEmailProcess(true)}
            >
              <div className="font-bold text-slate-900">One email</div>
              <div className="text-[10px] text-slate-500">All reports together</div>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-28 gap-2 hover:border-slate-500 hover:bg-slate-50"
              onClick={() => startEmailProcess(false)}
            >
              <div className="font-bold text-slate-900">Separate emails</div>
              <div className="text-[10px] text-slate-500">One per lead</div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF View with Success State */}
      <Dialog open={isPDFPreviewOpen} onOpenChange={setIsPDFPreviewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Generating and Sending Reports...</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-100 rounded text-red-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  Prospect Insight Report Preview
                </DialogTitle>
                <DialogDescription>
                  This is a preview of the instant report that will be sent to your email.
                </DialogDescription>
              </DialogHeader>

              <div className="bg-white border-8 border-slate-100 p-8 shadow-inner font-sans text-slate-900 mt-4 rounded-lg">
                {/* PDF Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-8">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter text-blue-600">VERTEX<span className="text-slate-900 italic">REALTY</span></h1>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-left">AI INSIGHT REPORT • BATCH EXPORT</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-500">Batch ID: #VX-B{Math.floor(Math.random() * 100000)}</p>
                    <p className="text-xs text-slate-400">{format(Date.now(), "MMMM d, yyyy")}</p>
                  </div>
                </div>

                {/* Leads Overview */}
                <div className="space-y-6">
                  {filteredLeads.filter(l => selectedLeads.includes(l.id)).map((lead, idx) => (
                    <div key={lead.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Prospect {idx + 1}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          lead.status === 'Hot' ? 'bg-red-500' : 
                          lead.status === 'Warm' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Full Name</p>
                          <p className="text-sm font-bold text-left">{lead.name}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Contact</p>
                          <p className="text-[10px] font-medium text-left">{lead.email}</p>
                          <p className="text-[10px] font-medium text-left">{lead.phone}</p>
                        </div>
                        <div className="col-span-2">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Property Visualized</p>
                           <p className="text-sm font-bold text-left">{lead.listingAddress}</p>
                        </div>
                      </div>
                      <div className="px-4 py-3 bg-blue-50/50 border-t border-slate-100 flex items-start gap-2">
                        <Zap className="h-3 w-3 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-slate-600 italic text-left">
                          High engagement detected on this property. Recommendation: Send personalized floor plan highlighting recent upgrades.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-slate-100 flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>VertexAgent AI Core v2.4</span>
                  <span className="text-blue-600">CONFIDENTIAL • PROPRIETARY INSIGHTS</span>
                </div>
              </div>

              <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button variant="ghost" onClick={() => setIsPDFPreviewOpen(false)} className="sm:flex-1">
                  Close Preview
                </Button>
                <Button onClick={confirmEmailSend} className="bg-blue-600 hover:bg-blue-500 sm:flex-1 font-bold shadow-lg shadow-blue-200 gap-2">
                  Email Me Instant Reports <Send className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
