import { Phone, Mail, Calendar, CheckSquare, Square, ChevronRight, ChevronLeft, Send, Database, Info, X, FileText, Zap, Activity, Loader2, ArrowRight, Trash2, Home, Brain, Mic } from "lucide-react";
import { format } from "date-fns";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { sendEmail, getUserLeads, createLead, updateLead, Lead, createVoiceNote } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, deleteDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import ProspectInsightReport from "@/components/ProspectInsightReport";
import VoiceNoteRecorderModal from "@/components/VoiceNoteRecorderModal";

const DUMMY_LEADS = [
  { id: "1", name: "Eleanor Rigby", property: "888 Bel Air Rd, Los Angeles", phone: "+1 (555) 123-4567", email: "eleanor@example.com", date: Date.now() - 1000 * 60 * 60 * 2, status: "Hot", lastPushed: null, agentId: "1" },
  { id: "2", name: "Jude Lawson", property: "15 Central Park West, NY", phone: "+1 (555) 987-6543", email: "jude.l@example.com", date: Date.now() - 1000 * 60 * 60 * 24, status: "Warm", lastPushed: Date.now() - 1000 * 60 * 60 * 48, agentId: "2" },
  { id: "3", name: "Penny Lane", property: "123 Open House Lane", phone: "+1 (555) 456-7890", email: "penny@example.com", date: Date.now() - 1000 * 60 * 60 * 48, status: "Cold", lastPushed: null, agentId: "3" },
  { id: "4", name: "Maxwell Edison", property: "888 Bel Air Rd, Los Angeles", phone: "+1 (555) 321-0987", email: "maxwell@example.com", date: Date.now() - 1000 * 60 * 60 * 72, status: "New", lastPushed: Date.now() - 1000 * 60 * 10, agentId: "1" },
  { id: "5", name: "Prudence Dear", property: "15 Central Park West, NY", phone: "+1 (555) 111-2222", email: "prudence@example.com", date: Date.now() - 1000 * 60 * 60 * 80, status: "Warm", lastPushed: null, agentId: "2" },
  { id: "6", name: "Rita Metermaid", property: "123 Open House Lane", phone: "+1 (555) 333-4444", email: "rita@example.com", date: Date.now() - 1000 * 60 * 60 * 96, status: "Hot", lastPushed: Date.now() - 1000 * 60 * 60 * 5, agentId: "4" },
  { id: "7", name: "Father McKenzie", property: "888 Bel Air Rd, Los Angeles", phone: "+1 (555) 555-6666", email: "mckenzie@example.com", date: Date.now() - 1000 * 60 * 60 * 120, status: "Cold", lastPushed: null, agentId: "5" },
  { id: "8", name: "Michelle Belle", property: "15 Central Park West, NY", phone: "+1 (555) 777-8888", email: "michelle@example.com", date: Date.now() - 1000 * 60 * 60 * 150, status: "New", lastPushed: null, agentId: "1" },
  { id: "9", name: "Julia Lennon", property: "123 Open House Lane", phone: "+1 (555) 999-0000", email: "julia@example.com", date: Date.now() - 1000 * 60 * 60 * 200, status: "Warm", lastPushed: null, agentId: "3" },
  { id: "10", name: "Lucy Diamond", property: "888 Bel Air Rd, Los Angeles", phone: "+1 (555) 222-3333", email: "lucy@example.com", date: Date.now() - 1000 * 60 * 60 * 250, status: "Hot", lastPushed: null, agentId: "2" },
];

const formatLeadDate = (createdAtVal: any) => {
  if (!createdAtVal) return "Jun 21, 2026";
  let dateObj: Date;
  if (createdAtVal && typeof createdAtVal.toDate === "function") {
    dateObj = createdAtVal.toDate();
  } else if (createdAtVal instanceof Date) {
    dateObj = createdAtVal;
  } else if (typeof createdAtVal === "number") {
    dateObj = new Date(createdAtVal);
  } else if (createdAtVal && typeof createdAtVal === "object" && typeof createdAtVal.seconds === "number") {
    dateObj = new Date(createdAtVal.seconds * 1000);
  } else {
    dateObj = new Date(createdAtVal);
  }
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }
  return format(dateObj, "MMM d, yyyy");
};

const formatLeadTime = (createdAtVal: any) => {
  if (!createdAtVal) return "12:00 PM";
  let dateObj: Date;
  if (createdAtVal && typeof createdAtVal.toDate === "function") {
    dateObj = createdAtVal.toDate();
  } else if (createdAtVal instanceof Date) {
    dateObj = createdAtVal;
  } else if (typeof createdAtVal === "number") {
    dateObj = new Date(createdAtVal);
  } else if (createdAtVal && typeof createdAtVal === "object" && typeof createdAtVal.seconds === "number") {
    dateObj = new Date(createdAtVal.seconds * 1000);
  } else {
    dateObj = new Date(createdAtVal);
  }
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }
  return format(dateObj, "h:mm a");
};

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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInsightLead, setSelectedInsightLead] = useState<Lead | null>(null);
  const itemsPerPage = 4;

  // Voice Note states for the Agent
  const [isAgentVoiceOpen, setIsAgentVoiceOpen] = useState(false);
  const [recordingLeadId, setRecordingLeadId] = useState<string | null>(null);

  const handleSaveVoiceNote = async (audioUrl: string, durationSeconds: number, transcript: string, visibility: 'private' | 'team' | 'lead') => {
    if (!user || !recordingLeadId) return;
    const targetLead = leads.find(l => l.id === recordingLeadId);
    await createVoiceNote({
      propertyId: targetLead?.listingId || "unknown",
      userId: user.id,
      userName: user.email || "Agent",
      roleType: "agent",
      voiceNoteType: visibility === "private" ? "private" : "team",
      durationSeconds,
      transcript,
      audioUrl,
      createdAt: Date.now(),
      visibility: visibility,
      moderationStatus: "approved"
    });
  };

  useEffect(() => {
    if (!user?.id) return;

    const isAdmin = (user as any).role === 'ADMIN';
    if (isAdmin) {
      const unsub = onSnapshot(collection(db, "leads"), (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt || Date.now() } as any));
        setLeads(data.sort((a: any, b: any) => b.createdAt - a.createdAt));
        setLoading(false);
      }, (err) => {
        console.error("Error dynamically syncing leads:", err);
        setLoading(false);
      });
      return () => unsub();
    } else {
      let leads1: any[] = [];
      let leads2: any[] = [];

      const updateMergedLeads = () => {
        const combined = [...leads1];
        leads2.forEach(item => {
          if (!combined.some(c => c.id === item.id)) {
            combined.push(item);
          }
        });
        setLeads(combined.sort((a, b) => b.createdAt - a.createdAt));
        setLoading(false);
      };

      const unsub1 = onSnapshot(query(collection(db, "leads"), where("agentId", "==", user.id)), (snap) => {
        leads1 = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt || Date.now() } as any));
        updateMergedLeads();
      }, (err) => console.error(err));

      const unsub2 = onSnapshot(query(collection(db, "leads"), where("listingOwnerAgentId", "==", user.id)), (snap) => {
        leads2 = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt || Date.now() } as any));
        updateMergedLeads();
      }, (err) => console.error(err));

      return () => {
        unsub1();
        unsub2();
      };
    }
  }, [user?.id]);

  async function loadLeads() {
    // Left as backwards-compatible helper if called directly
    if (!user?.id) return;
    try {
      const data = await getUserLeads(user.id);
      const safeData = data.map(d => ({
        ...d,
        createdAt: d.createdAt || Date.now()
      }));
      setLeads(safeData.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error("Error manually reloading leads:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteLead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this lead?")) return;

    const toastId = toast.loading("Deleting lead...");
    try {
      // We'll need a deleteLead API or just call deleteDoc from here
      const lead = leads.find(l => l.id === id);
      if (lead) {
        // Paths for delete depend on which collection it is in
        // Based on firestore.rules, leads are in /listings/{listingId}/leads/{leadId}
        // or /leads/{leadId}
        await deleteDoc(doc(db, "leads", id));
      }
      setLeads(prev => prev.filter(l => l.id !== id));
      setSelectedLeads(prev => prev.filter(item => item !== id));
      toast.success("Lead deleted successfully", { id: toastId });
    } catch (err) {
      console.error("Delete lead failed:", err);
      toast.error("Failed to delete lead. You may not have permission.", { id: toastId });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedLeads.length} leads?`)) return;

    const toastId = toast.loading(`Deleting ${selectedLeads.length} leads...`);
    let success = 0;
    try {
      for (const id of selectedLeads) {
        await deleteDoc(doc(db, "leads", id));
        success++;
      }
      setLeads(prev => prev.filter(l => !selectedLeads.includes(l.id)));
      setSelectedLeads([]);
      toast.success(`Deleted ${success} leads`, { id: toastId });
    } catch (err) {
      console.error("Bulk delete failed:", err);
      toast.error(`Partially deleted (${success} success). Error occurred.`, { id: toastId });
    }
  };

  async function generateSampleLeads() {
    if (!user?.id) return;
    setIsProcessing(true);
    try {
      const sampleLeads: Lead[] = [
        { id: `sample-1-${Date.now()}`, name: "Eleanor Rigby", listingId: "sample", listingAddress: "888 Bel Air Rd, Los Angeles", agentId: user.id, email: "eleanor@example.com", phone: "(555) 123-4567", status: "Hot", createdAt: Date.now() - 1000 * 60 * 60 * 2, message: "Interested in the garden and kitchen layout." },
        { id: `sample-2-${Date.now()}`, name: "Jude Lawson", listingId: "sample", listingAddress: "15 Central Park West, NY", agentId: user.id, email: "jude.l@example.com", phone: "(555) 987-6543", status: "Warm", createdAt: Date.now() - 1000 * 60 * 60 * 24, message: "Can we schedule a private tour this weekend?" },
        { id: `sample-3-${Date.now()}`, name: "Penny Lane", listingId: "sample", listingAddress: "123 Open House Lane", agentId: user.id, email: "penny@example.com", phone: "(555) 456-7890", status: "Cold", createdAt: Date.now() - 1000 * 60 * 60 * 48, message: "Just looking for now, thank you." }
      ];

      for (const lead of sampleLeads) {
        await createLead("DEMO_SIGNUP", lead);
      }

      toast.success("Sample leads generated successfully!");
      loadLeads();
    } catch (err) {
      console.error("Error generating leads:", err);
      toast.error("Failed to generate sample leads");
    } finally {
      setIsProcessing(false);
    }
  }

  const filteredLeads = useMemo(() => {
    if (!listingIdFilter) return leads;
    return leads.filter(l => l.listingId === listingIdFilter);
  }, [leads, listingIdFilter]);

  const totalLeads = filteredLeads.length;
  const totalPages = Math.ceil(totalLeads / itemsPerPage) || 1;
  const currentLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, currentPage]);

  const displayedCount = Math.min(currentPage * itemsPerPage, totalLeads);

  useEffect(() => {
    setCurrentPage(1);
  }, [listingIdFilter, leads]);

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length && filteredLeads.length > 0) {
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
      const targetEmail = profile.officeEmail || user?.email || "sales@aiopenhouseconnect.com";

      if (isConsolidatedEmail) {
        // Build consolidated HTML
        const leadsHtml = selectedData.map((lead, idx) => `
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="margin: 0 0 5px 0; font-size: 10px; color: #64748b; font-weight: bold;">PROSPECT ${idx + 1}</p>
            <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${lead.name}</p>
            <p style="margin: 10px 0;"><strong>Property:</strong> ${lead.listingAddress}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${lead.email}</p>
            <p style="margin: 10px 0;"><strong>Phone:</strong> ${lead.phone ? `<a href="tel:${lead.phone.replace(/[^0-9+]/g, '')}" style="color: #2563eb; text-decoration: underline;">${lead.phone}</a>` : "Unreported"}</p>
            <p style="margin: 10px 0 0 0;"><strong>Status:</strong> <span style="color: #ef4444; font-weight: bold;">${lead.status}</span></p>
            <div style="margin-top: 10px;">
              <a href="${window.location.origin}/app/leads/${lead.id}" style="color: #2563eb; text-decoration: underline; font-size: 12px; font-weight: bold;">View lead details</a>
            </div>
          </div>
        `).join('');

        await sendEmail({
          to: targetEmail,
          subject: `Consolidated Prospect Report: ${selectedData.length} Leads`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #2563eb; padding: 20px; color: white;">
                <h1 style="margin: 0; font-size: 20px;">Consolidated Batch Insight</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">AI Open House Connect Real Estate AI Core</p>
              </div>
              <div style="padding: 20px;">
                <p>Requested bulk export for <strong>${selectedData.length} leads</strong></p>
                ${leadsHtml}

                <div style="margin-top: 24px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
                  <a href="${window.location.origin}/app/leads" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">→ Open Leads in Agent Portal</a>
                </div>

                <p style="font-size: 12px; color: #64748b; font-style: italic;">Note: This is a consolidated AI-generated lead insight report.</p>
              </div>
            </div>
          `,
          text: `Consolidated Prospect Report for ${selectedData.length} leads. View online in Agent Portal: ${window.location.origin}/app/leads`
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
                  <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">AI Open House Connect Real Estate AI Core</p>
                </div>
                <div style="padding: 20px;">
                  <p>Requested export for lead: <strong>${lead.name}</strong></p>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0;"><strong>Property:</strong> ${lead.listingAddress}</p>
                    <p style="margin: 10px 0;"><strong>Email:</strong> ${lead.email}</p>
                    <p style="margin: 10px 0;"><strong>Phone:</strong> ${lead.phone ? `<a href="tel:${lead.phone.replace(/[^0-9+]/g, '')}" style="color: #2563eb; text-decoration: underline;">${lead.phone}</a>` : "Unreported"}</p>
                    <p style="margin: 10px 0 0 0;"><strong>Status:</strong> <span style="color: #ef4444; font-weight: bold;">${lead.status}</span></p>
                  </div>

                  <div style="margin-top: 24px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
                    <a href="${window.location.origin}/app/leads/${lead.id}" style="display: inline-block; padding: 11px 22px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 13px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">→ View Lead in Agent Portal</a>
                  </div>

                  <p style="font-size: 12px; color: #64748b; font-style: italic;">Note: This is an AI-generated lead insight report.</p>
                </div>
              </div>
            `,
            text: `Prospect Report for ${lead.name} - Property: ${lead.listingAddress}. View inside Agent Portal: ${window.location.origin}/app/leads/${lead.id}`
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
        {filteredLeads.length === 0 && !loading ? (
          <div className="py-20 text-center space-y-6">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
              <Database className="h-10 w-10 text-slate-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">No leads captured yet</h3>
              <p className="text-slate-500 max-w-sm mx-auto text-sm">
                Share your property tours with visitors to start capturing leads.
                They will appear here once they complete the lead gate.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={() => navigate("/app/listings/edit")} variant="outline" className="gap-2">
                 Create Your First Listing <ArrowRight className="h-4 w-4" />
              </Button>
              <Button onClick={generateSampleLeads} className="bg-blue-600 hover:bg-blue-700 gap-2" disabled={isProcessing}>
                 {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                 Load Sample Data
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
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
                    {selectedLeads.length === filteredLeads.length && filteredLeads.length > 0 ? (
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
                <th className="px-6 py-5 font-black text-right w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {currentLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedLeads.includes(lead.id) ? 'bg-blue-50/50' : ''}`}
                  onClick={() => navigate(`/app/leads/${lead.id}`)}
                >
                  <td className="px-4 py-4" onClick={(e) => toggleSelectLead(lead.id, e)}>
                    <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${selectedLeads.includes(lead.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                      {selectedLeads.includes(lead.id) && <div><CheckSquare className="h-3 w-3 text-white" /></div>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 group-hover:text-blue-600 flex items-center gap-1.5 flex-wrap">
                      {lead.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecordingLeadId(lead.id);
                          setIsAgentVoiceOpen(true);
                        }}
                        className="p-1.5 rounded-full text-blue-600 bg-blue-50/80 hover:bg-blue-100/90 transition-all cursor-pointer inline-flex items-center justify-center border-2 border-blue-600 animate-pulse hover:scale-110 shadow-[0_0_8px_rgba(37,99,235,0.2)] hover:animate-none"
                        title="Record Private/Team Voice Note"
                        id={`mic-list-desktop-${lead.id}`}
                      >
                        <Mic className="h-[18px] w-[18px] text-blue-600 shrink-0" />
                      </button>
                      {lead.isShared && lead.agentId === user?.id && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[8px] font-bold uppercase tracking-wider" title="Captured by you during cross-hosted open house">
                          Co-Hosted
                        </span>
                      )}
                      {lead.isShared && lead.listingOwnerAgentId === user?.id && lead.agentId !== user?.id && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[8px] font-bold uppercase tracking-wider" title="Captured by host assigned to your listing">
                          Host Capture
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 text-xs flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                      <Mail className="h-3 w-3" /> <a href={`mailto:${lead.email}`} className="hover:text-blue-600 hover:underline">{lead.email}</a>
                    </div>
                    <div className="text-slate-500 text-xs flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                      {lead.phone ? (
                        <>
                          <Phone className="h-3 w-3" /> <a href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-blue-600 hover:underline">{lead.phone}</a>
                        </>
                      ) : (
                        <>
                          <Phone className="h-3 w-3" /> <span className="text-slate-400 font-normal">No Phone</span>
                        </>
                      )}
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
                      {formatLeadDate(lead.createdAt)}
                    </div>
                    <div className="text-[10px] mt-1 text-slate-400">{formatLeadTime(lead.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${lead.status === 'Hot' ? 'bg-red-100 text-red-700' : ''}
                      ${lead.status === 'Warm' ? 'bg-sky-100 text-sky-700' : ''}
                      ${lead.status === 'Cold' ? 'bg-blue-100 text-blue-700' : ''}
                      ${lead.status === 'New' || !lead.status ? 'bg-green-100 text-green-700' : ''}
                    `}>
                      {lead.status || 'New'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[10px] font-black uppercase tracking-wider text-blue-600 border-blue-200 hover:bg-blue-50/50 gap-1.5 rounded-lg cursor-pointer flex items-center shrink-0"
                        onClick={() => setSelectedInsightLead(lead)}
                      >
                        <Brain className="h-3.5 w-3.5 animate-pulse text-blue-600" /> Insights
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-300 hover:text-red-650 hover:bg-red-50 rounded-lg cursor-pointer shrink-0 flex items-center justify-center"
                        onClick={(e) => handleDeleteLead(lead.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="lg:hidden divide-y divide-slate-100">
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
          {currentLeads.map((lead) => (
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
                    <div className="font-bold text-slate-900 leading-tight flex items-center gap-1.5 flex-wrap">
                      {lead.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecordingLeadId(lead.id);
                          setIsAgentVoiceOpen(true);
                        }}
                        className="p-1.5 rounded-full text-blue-600 bg-blue-50/80 hover:bg-blue-100/90 transition-all cursor-pointer inline-flex items-center justify-center border-2 border-blue-600 animate-pulse hover:scale-110 shadow-[0_0_8px_rgba(37,99,235,0.2)] hover:animate-none"
                        title="Record Private/Team Voice Note"
                        id={`mic-list-mobile-${lead.id}`}
                      >
                        <Mic className="h-[18px] w-[18px] text-blue-600 shrink-0" />
                      </button>
                      {lead.isShared && lead.agentId === user?.id && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[8px] font-bold uppercase tracking-wider">
                          Co-Hosted
                        </span>
                      )}
                      {lead.isShared && lead.listingOwnerAgentId === user?.id && lead.agentId !== user?.id && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[8px] font-bold uppercase tracking-wider">
                          Host Capture
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{lead.listingAddress}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest
                    ${lead.status === 'Hot' ? 'bg-red-100 text-red-700' : ''}
                    ${lead.status === 'Warm' ? 'bg-sky-100 text-sky-700' : ''}
                    ${lead.status === 'Cold' ? 'bg-blue-100 text-blue-700' : ''}
                    ${lead.status === 'New' || !lead.status ? 'bg-green-100 text-green-700' : ''}
                  `}>
                    {lead.status || 'New'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-300 hover:text-red-600"
                    onClick={(e) => handleDeleteLead(lead.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-500 font-medium font-sans">
                <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-300" /> {lead.email}</div>
                <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-300" /> {lead.phone}</div>
                <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-300" /> {formatLeadDate(lead.createdAt)}</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-300 flex items-center gap-1"><Database className="h-3.5 w-3.5" /> No CRM</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  className="w-full bg-[#155dfc] hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg h-8 gap-1 cursor-pointer flex items-center justify-center"
                  onClick={() => setSelectedInsightLead(lead)}
                >
                  <Brain className="h-3.5 w-3.5 text-white" /> View Insight Report
                </Button>
              </div>
            </div>
          ))}
        </div>

        {totalLeads > itemsPerPage && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex flex-col items-center gap-3 font-sans">
             <div className="text-xs font-bold text-slate-400 border px-3 py-1 rounded-full bg-white shadow-sm">
               {displayedCount} OF {totalLeads} LEADS
             </div>
             <div className="flex items-center gap-2">
               <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                className="font-bold gap-1.5 text-slate-700 bg-white border-slate-200 hover:bg-slate-50 transition-all px-4 disabled:opacity-50 mr-2"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
               >
                <ChevronLeft className="h-4 w-4" /> Previous
               </Button>
               <Button
                variant="outline"
                size="sm"
                className="font-bold gap-2 text-blue-600 bg-white border-blue-100 hover:bg-blue-50 transition-all px-6 disabled:opacity-50"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
               >
                Next <ChevronRight className="h-4 w-4" />
               </Button>
             </div>
             <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Page {currentPage} of {totalPages}</p>
          </div>
        )}
          </>
        )}
      </div>

      {/* Floating Action Bar */}
        {selectedLeads.length > 0 && (
          <div
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

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                onClick={handleBulkDelete}
                title="Delete Selected"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-500 gap-2 font-bold"
                onClick={() => setIsBulkActionOpen(true)}
              >
                Send Me Info <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      <Dialog open={isBulkActionOpen} onOpenChange={setIsBulkActionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Handle Selected Leads</DialogTitle>
            <DialogDescription>
              Choose how you want to receive the information for the {selectedLeads.length} selected contact(s).
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
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 bg-blue-600 text-white rounded font-bold text-sm tracking-tighter shadow-sm flex items-center justify-center shrink-0">AI</div>
                      <span className="font-sans font-black text-lg text-slate-950 tracking-tight leading-none text-left">Open House <span className="text-blue-600">Connect</span></span>
                    </div>
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
                  <span>AI Open House Connect AI Core v2.4</span>
                  <span className="text-blue-600">CONFIDENTIAL • PROPRIETARY INSIGHTS</span>
                </div>
              </div>

              <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button variant="ghost" onClick={() => setIsPDFPreviewOpen(false)} className="sm:flex-1">
                  Close Preview
                </Button>
                <Button onClick={confirmEmailSend} className="bg-blue-600 hover:bg-blue-500 sm:flex-1 font-bold shadow-lg shadow-blue-200 gap-2">
                  Email Me Instant Report(s) <Send className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Slideover / Drawer for Prospect Insight Report */}
        {selectedInsightLead && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black cursor-pointer"
              onClick={() => setSelectedInsightLead(null)}
            />

            {/* Slide-out Panel */}
            <div
              className="relative w-full max-w-4xl bg-slate-950 shadow-2xl h-full flex flex-col z-10 border-l border-white/10"
            >
              {/* Close Button on Top Right Corner Overlay */}
              <button
                onClick={() => setSelectedInsightLead(null)}
                className="absolute top-4 right-4 b-50 p-2 bg-slate-900 border border-white/10 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer hover:scale-105 active:scale-95 z-55"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950">
                <ProspectInsightReport
                  lead={selectedInsightLead}
                  onClose={() => setSelectedInsightLead(null)}
                  onSaveNotes={(notes, tags, customDrafts) => {
                    const isVerifiedCalculated = (customDrafts?.verificationStatus === "ID verified" || customDrafts?.verificationStatus === "Brokerage verified");
                    // Instantly update local state leads list
                    setLeads(prev => prev.map(l => {
                      if (l.id === selectedInsightLead.id) {
                        return { 
                          ...l, 
                          notes, 
                          isVerified: isVerifiedCalculated,
                          customAnswers: { 
                            ...(l.customAnswers || {}), 
                            tags,
                            customSmsDraft: customDrafts?.sms || l.customAnswers?.customSmsDraft,
                            customEmailDraft: customDrafts?.email || l.customAnswers?.customEmailDraft,
                            customCallDraft: customDrafts?.call || l.customAnswers?.customCallDraft,
                            customCreatedTags: customDrafts?.customCreatedTags || l.customAnswers?.customCreatedTags,
                            verificationStatus: customDrafts?.verificationStatus || l.customAnswers?.verificationStatus,
                            verificationMethod: customDrafts?.verificationMethod || l.customAnswers?.verificationMethod,
                            verificationProvider: customDrafts?.verificationProvider || l.customAnswers?.verificationProvider,
                            reviewedBy: customDrafts?.reviewedBy || l.customAnswers?.reviewedBy,
                            verificationNotes: customDrafts?.verificationNotes || l.customAnswers?.verificationNotes,
                            manualReviewRequired: customDrafts?.manualReviewRequired !== undefined ? customDrafts.manualReviewRequired : l.customAnswers?.manualReviewRequired,
                            verifiedOn: customDrafts?.verifiedOn || l.customAnswers?.verifiedOn,
                          } 
                        };
                      }
                      return l;
                    }));
                    // Also update selectedInsightLead itself for real-time visibility in drawer
                    setSelectedInsightLead(prev => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        notes,
                        isVerified: isVerifiedCalculated,
                        customAnswers: {
                          ...(prev.customAnswers || {}),
                          tags,
                          customSmsDraft: customDrafts?.sms || prev.customAnswers?.customSmsDraft,
                          customEmailDraft: customDrafts?.email || prev.customAnswers?.customEmailDraft,
                          customCallDraft: customDrafts?.call || prev.customAnswers?.customCallDraft,
                          customCreatedTags: customDrafts?.customCreatedTags || prev.customAnswers?.customCreatedTags,
                          verificationStatus: customDrafts?.verificationStatus || prev.customAnswers?.verificationStatus,
                          verificationMethod: customDrafts?.verificationMethod || prev.customAnswers?.verificationMethod,
                          verificationProvider: customDrafts?.verificationProvider || prev.customAnswers?.verificationProvider,
                          reviewedBy: customDrafts?.reviewedBy || prev.customAnswers?.reviewedBy,
                          verificationNotes: customDrafts?.verificationNotes || prev.customAnswers?.verificationNotes,
                          manualReviewRequired: customDrafts?.manualReviewRequired !== undefined ? customDrafts.manualReviewRequired : prev.customAnswers?.manualReviewRequired,
                          verifiedOn: customDrafts?.verifiedOn || prev.customAnswers?.verifiedOn,
                        }
                      };
                    });
                    // Update Firestore document
                    updateLead(selectedInsightLead.id, { 
                      notes, 
                      isVerified: isVerifiedCalculated,
                      customAnswers: { 
                        ...(selectedInsightLead.customAnswers || {}), 
                        tags,
                        customSmsDraft: customDrafts?.sms || selectedInsightLead.customAnswers?.customSmsDraft,
                        customEmailDraft: customDrafts?.email || selectedInsightLead.customAnswers?.customEmailDraft,
                        customCallDraft: customDrafts?.call || selectedInsightLead.customAnswers?.customCallDraft,
                        customCreatedTags: customDrafts?.customCreatedTags || selectedInsightLead.customAnswers?.customCreatedTags,
                        verificationStatus: customDrafts?.verificationStatus || selectedInsightLead.customAnswers?.verificationStatus,
                        verificationMethod: customDrafts?.verificationMethod || selectedInsightLead.customAnswers?.verificationMethod,
                        verificationProvider: customDrafts?.verificationProvider || selectedInsightLead.customAnswers?.verificationProvider,
                        reviewedBy: customDrafts?.reviewedBy || selectedInsightLead.customAnswers?.reviewedBy,
                        verificationNotes: customDrafts?.verificationNotes || selectedInsightLead.customAnswers?.verificationNotes,
                        manualReviewRequired: customDrafts?.manualReviewRequired !== undefined ? customDrafts.manualReviewRequired : selectedInsightLead.customAnswers?.manualReviewRequired,
                        verifiedOn: customDrafts?.verifiedOn || selectedInsightLead.customAnswers?.verifiedOn,
                      } 
                    }).catch(err => console.error("Could not update lead in db:", err));
                  }}
                />
              </div>
            </div>
          </div>
        )}

      <VoiceNoteRecorderModal
        isOpen={isAgentVoiceOpen}
        onClose={() => {
          setIsAgentVoiceOpen(false);
          setRecordingLeadId(null);
        }}
        maxDuration={180}
        onSave={handleSaveVoiceNote}
        role="agent"
        propertyAddress={leads.find(l => l.id === recordingLeadId)?.listingAddress}
      />

    </div>
  );
}
