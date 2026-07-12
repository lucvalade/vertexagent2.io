import React, { useState, useEffect } from "react";
import { 
  Mail, 
  CheckCircle, 
  Clock, 
  Send, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  ChevronRight, 
  RefreshCw, 
  Plus, 
  Sliders, 
  Filter, 
  Search, 
  Save, 
  X, 
  UserCheck, 
  Layers, 
  ArrowRight,
  Eye,
  Settings,
  MailQuestion
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface EmailDraft {
  id: string;
  agentUid: string;
  sequenceStep: "day0" | "day1" | "day3" | "day7" | "day14";
  intendedSendDate: number;
  recipient: string;
  from: string;
  subject: string;
  body: string;
  status: "draft" | "approved" | "sent" | "skipped" | "failed";
  approvedBy: string | null;
  approvedAt: number | null;
  sentAt: number | null;
  providerMessageId: string | null;
  createdAt: number;
}

export default function AdminEmails() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<EmailDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [triggeringScheduler, setTriggeringScheduler] = useState(false);
  
  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Edit Modal/State
  const [editingEmail, setEditingEmail] = useState<EmailDraft | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  
  // Quick Filter Counts
  const counts = {
    all: emails.length,
    draft: emails.filter(e => e.status === "draft").length,
    sent: emails.filter(e => e.status === "sent").length,
    skipped: emails.filter(e => e.status === "skipped").length,
    failed: emails.filter(e => e.status === "failed").length,
  };

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/emails");
      const data = await res.json();
      if (data.success) {
        setEmails(data.emails);
      } else {
        toast.error(data.error || "Failed to load emails");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error communicating with SMTP backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleTriggerScheduler = async () => {
    setTriggeringScheduler(true);
    const id = toast.loading("Executing ScheduleOnboardingDrafts trigger...");
    try {
      const res = await fetch("/api/admin/onboarding-schedule-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Drafts updated successfully!", { id });
        fetchEmails();
      } else {
        toast.error(data.error || "Scheduler failed", { id });
      }
    } catch (err) {
      toast.error("API error triggering onboarding schedule drafts", { id });
    } finally {
      setTriggeringScheduler(false);
    }
  };

  const handleApprove = async (emailId: string) => {
    const id = toast.loading("Approving & dispatching via SMTP...");
    try {
      const res = await fetch(`/api/admin/emails/${emailId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: user?.email || "luc.valade@gmail.com" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Onboarding email successfully delivered to ${data.email.recipient}!`, { id });
        fetchEmails();
      } else {
        toast.error(data.error || "Approval/SMTP failure", { id });
      }
    } catch (err) {
      toast.error("SMTP delivery communication failure", { id });
    }
  };

  const handleSkip = async (emailId: string) => {
    try {
      const res = await fetch(`/api/admin/emails/${emailId}/skip`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Draft marked as skipped.");
        fetchEmails();
      } else {
        toast.error(data.error || "Failed to skip draft");
      }
    } catch (err) {
      toast.error("Error skipping draft");
    }
  };

  const startEdit = (email: EmailDraft) => {
    setEditingEmail(email);
    setEditSubject(email.subject);
    setEditBody(email.body);
  };

  const handleSaveEdit = async () => {
    if (!editingEmail) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/emails/${editingEmail.id}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: editSubject, body: editBody })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Draft content updated successfully.");
        setEditingEmail(null);
        fetchEmails();
      } else {
        toast.error(data.error || "Failed to edit draft");
      }
    } catch (err) {
      toast.error("Error editing draft");
    } finally {
      setSavingEdit(false);
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: "approve" | "skip") => {
    if (selectedIds.length === 0) {
      toast.error("No drafts selected.");
      return;
    }
    const label = action === "approve" ? "approving & sending" : "skipping";
    const id = toast.loading(`Bulk ${label} ${selectedIds.length} drafts...`);
    
    try {
      const res = await fetch("/api/admin/emails/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          emailIds: selectedIds,
          approvedBy: user?.email || "luc.valade@gmail.com"
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Successfully completed bulk ${action} action!`, { id });
        setSelectedIds([]);
        fetchEmails();
      } else {
        toast.error("Bulk action failed", { id });
      }
    } catch (err) {
      toast.error("Bulk action connection failure", { id });
    }
  };

  const toggleSelectAll = () => {
    const currentDraftIds = filteredEmails
      .filter(e => e.status === "draft")
      .map(e => e.id);
      
    if (selectedIds.length === currentDraftIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentDraftIds);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Filter & Search logic
  const filteredEmails = emails.filter(email => {
    const matchesFilter = filter === "all" ? true : email.status === filter;
    const matchesSearch = 
      email.recipient.toLowerCase().includes(search.toLowerCase()) ||
      email.subject.toLowerCase().includes(search.toLowerCase()) ||
      email.sequenceStep.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStepBadgeColor = (step: string) => {
    switch (step) {
      case "day0": return "bg-blue-50 text-blue-700 border-blue-200";
      case "day1": return "bg-teal-50 text-teal-700 border-teal-200";
      case "day3": return "bg-violet-50 text-violet-700 border-violet-200";
      case "day7": return "bg-amber-50 text-amber-700 border-amber-200";
      case "day14": return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 md:p-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full uppercase tracking-wider">Onboarding System</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Onboarding Emails (Two-Stage Approval)</h1>
          <p className="text-sm text-slate-500 font-medium">CRITICAL SAFETY RULE: No email is ever sent without explicit human approval.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEmails}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg shadow-sm transition-all"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          
          <button
            onClick={handleTriggerScheduler}
            disabled={triggeringScheduler}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all text-sm disabled:opacity-50"
          >
            <Clock className="h-4 w-4" />
            <span>{triggeringScheduler ? "Processing..." : "Trigger Draft Generator"}</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">All Sequence Emails</div>
          <div className="text-2xl font-black text-slate-950 mt-1">{counts.all}</div>
        </div>
        <div className="bg-amber-50 p-4 border border-amber-200 rounded-xl shadow-sm">
          <div className="text-amber-700 text-xs font-semibold uppercase tracking-wider">Pending Drafts</div>
          <div className="text-2xl font-black text-amber-950 mt-1 flex items-center gap-1.5">
            <span>{counts.draft}</span>
            {counts.draft > 0 && <span className="h-2.5 w-2.5 bg-amber-500 rounded-full animate-pulse" />}
          </div>
        </div>
        <div className="bg-green-50 p-4 border border-green-200 rounded-xl shadow-sm">
          <div className="text-green-700 text-xs font-semibold uppercase tracking-wider">Approved & Sent</div>
          <div className="text-2xl font-black text-green-950 mt-1">{counts.sent}</div>
        </div>
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl shadow-sm">
          <div className="text-slate-700 text-xs font-semibold uppercase tracking-wider">Skipped / Suppressed</div>
          <div className="text-2xl font-black text-slate-950 mt-1">{counts.skipped}</div>
        </div>
        <div className="bg-red-50 p-4 border border-red-200 rounded-xl shadow-sm col-span-2 md:col-span-1">
          <div className="text-red-700 text-xs font-semibold uppercase tracking-wider">Delivery Failures</div>
          <div className="text-2xl font-black text-red-950 mt-1">{counts.failed}</div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "All Items", count: counts.all },
              { id: "draft", label: "Drafts Queue", count: counts.draft },
              { id: "sent", label: "Sent / Live", count: counts.sent },
              { id: "skipped", label: "Skipped", count: counts.skipped },
              { id: "failed", label: "Failures", count: counts.failed },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setFilter(tab.id); setSelectedIds([]); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  filter === tab.id 
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search recipient, subject, step..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm transition-all bg-slate-50/50"
            />
          </div>
        </div>

        {/* Bulk Action Panel (Only visible when drafts are filtered and selected) */}
        {selectedIds.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-amber-50/50 border border-amber-200/80 rounded-lg gap-3">
            <div className="text-xs font-semibold text-amber-900">
              Selected <span className="font-bold text-amber-700">{selectedIds.length}</span> drafts to execute bulk actions.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction("skip")}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-sm cursor-pointer"
              >
                <X className="h-3.5 w-3.5 text-slate-500" />
                <span>Bulk Skip / Suppress</span>
              </button>
              <button
                onClick={() => handleBulkAction("approve")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Bulk Approve & Dispatch</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table/Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
            <p className="font-bold">Syncing email queues with Firestore...</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <MailQuestion className="h-12 w-12 mx-auto text-slate-300" />
            <h3 className="text-lg font-bold text-slate-800">No emails matched filters</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              {filter === "draft" 
                ? "No pending drafts requiring human approval. Trigger the scheduler or register new agents to create drafts!" 
                : "No email records correspond to the selected criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200">
                  {filter === "draft" && (
                    <th className="py-3 px-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredEmails.filter(e => e.status === "draft").length && filteredEmails.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Step</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Recipient</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Subject & Body Preview</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Created / Approved</th>
                  <th className="py-3 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmails.map(email => (
                  <tr key={email.id} className="hover:bg-slate-50/50 transition-colors">
                    {filter === "draft" && (
                      <td className="py-4 px-4 text-center">
                        {email.status === "draft" ? (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(email.id)}
                            onChange={() => toggleSelect(email.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        ) : null}
                      </td>
                    )}
                    
                    {/* Sequence Badge */}
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 border rounded-full text-[10px] font-black uppercase tracking-wider ${getStepBadgeColor(email.sequenceStep)}`}>
                        {email.sequenceStep}
                      </span>
                    </td>
                    
                    {/* Recipient Details */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 text-sm">{email.recipient}</div>
                      <div className="text-slate-400 font-mono text-[10px] truncate max-w-[150px]" title={email.agentUid}>
                        Agent ID: {email.agentUid.slice(0, 8)}...
                      </div>
                    </td>
                    
                    {/* Subject & Body */}
                    <td className="py-4 px-4 max-w-sm">
                      <div className="font-bold text-slate-800 text-sm truncate" title={email.subject}>
                        {email.subject}
                      </div>
                      <p className="text-slate-500 text-xs truncate mt-0.5" title={email.body}>
                        {email.body}
                      </p>
                    </td>
                    
                    {/* Dates */}
                    <td className="py-4 px-4 text-xs font-medium text-slate-500">
                      <div>Created: {new Date(email.createdAt).toLocaleDateString()}</div>
                      {email.approvedAt && (
                        <div className="text-green-600 mt-0.5">
                          Sent: {new Date(email.approvedAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    
                    {/* Status Badge */}
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full ${
                        email.status === "draft" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                        email.status === "sent" ? "bg-green-100 text-green-800 border border-green-200" :
                        email.status === "skipped" ? "bg-slate-100 text-slate-700 border border-slate-200" :
                        "bg-red-100 text-red-800 border border-red-200"
                      }`}>
                        {email.status === "draft" && <Clock className="h-3 w-3 animate-pulse" />}
                        {email.status === "sent" && <CheckCircle className="h-3 w-3" />}
                        {email.status === "skipped" && <X className="h-3 w-3" />}
                        {email.status === "failed" && <AlertTriangle className="h-3 w-3" />}
                        <span className="uppercase tracking-wide text-[10px]">{email.status}</span>
                      </span>
                    </td>
                    
                    {/* Action Panel */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {email.status === "draft" ? (
                          <>
                            <button
                              onClick={() => startEdit(email)}
                              className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-950 rounded-lg shadow-sm transition-all cursor-pointer"
                              title="Edit email content"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleSkip(email.id)}
                              className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg shadow-sm transition-all cursor-pointer"
                              title="Skip/Suppress draft"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleApprove(email.id)}
                              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                              title="Approve & Send Live"
                            >
                              <Send className="h-3 w-3" />
                              <span>Send</span>
                            </button>
                          </>
                        ) : (
                          <div className="text-[10px] font-semibold text-slate-400 italic">
                            No actions pending
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Email Modal */}
      <AnimatePresence>
        {editingEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full overflow-hidden text-left"
            >
              <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Mail className="h-4.5 w-4.5 text-blue-500" />
                  <span className="font-bold text-slate-900">Edit Onboarding Email Draft</span>
                </div>
                <button 
                  onClick={() => setEditingEmail(null)}
                  className="text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">To</label>
                  <input
                    type="text"
                    disabled
                    value={editingEmail.recipient}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-sm transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Body Text</label>
                  <textarea
                    rows={8}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="w-full border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-sm font-sans leading-relaxed transition-all"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 bg-slate-50 px-6 py-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingEmail(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>{savingEdit ? "Saving..." : "Save Draft Changes"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
