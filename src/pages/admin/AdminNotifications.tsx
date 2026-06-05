import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Trash2, Mail, Phone, User, Users, Search, Loader2, ExternalLink, ChevronRight, X, Square, CheckSquare, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addDoc, serverTimestamp } from "firebase/firestore";

interface LaunchNotification {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  referrals: { email: string; type: string }[];
  createdAt: any;
  source: string;
}

export default function AdminNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<LaunchNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedReferrals, setSelectedReferrals] = useState<{ email: string; name: string; parentId: string }[]>([]);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("VertexAgent: Connect with us");
  const [emailBody, setEmailBody] = useState("Hi there,\n\nThanks for your interest in VertexAgent! We'd love to chat more about how our AI can help your brokerage or real estate practice.\n\nBest regards,\nThe VertexAgent Team\n\nWebsite: VertexAgent.io (https://www.vertexagent.io)\nBook a Demo: https://calendly.com/vertexagent-demo");
  const [isSending, setIsSending] = useState(false);

  const trackInteraction = async (type: string, detail: any) => {
    try {
      await addDoc(collection(db, "interactions"), {
        type,
        detail,
        timestamp: serverTimestamp(),
        userEmail: user?.email || "unknown",
        createdAt: Date.now()
      });
      await addDoc(collection(db, "system_logs"), {
        type: "INTERACTION",
        message: `Interaction tracked: ${type}`,
        timestamp: serverTimestamp(),
        userEmail: user?.email || "unknown",
        details: detail
      });
    } catch (err) {
      console.error("Failed to track interaction:", err);
    }
  };

  // Deletion confirm modal states
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "launch_notifications"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LaunchNotification[];
      setNotifications(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "launch_notifications");
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = (id: string) => {
    if (!id) {
      toast.error("Invalid notification ID");
      return;
    }
    setDeleteTargetId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmSingleDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleteConfirmOpen(false);
    const toastId = toast.loading("Removing notification...");
    try {
      await deleteDoc(doc(db, "launch_notifications", deleteTargetId));
      toast.success("Notification removed successfully", { id: toastId });
      setDeleteTargetId(null);
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to remove notification. You may not have permission.", { id: toastId });
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filtered.map(n => n.id));
      const allRefs = filtered.flatMap(n => 
        (n.referrals || []).map(r => ({ email: r.email, name: r.email, parentId: n.id }))
      );
      setSelectedReferrals(allRefs);
    } else {
      setSelectedIds([]);
      setSelectedReferrals([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      toast.error("No items selected");
      return;
    }
    setIsBulkDeleteConfirmOpen(true);
  };

  const confirmBulkDelete = async () => {
    setIsBulkDeleteConfirmOpen(false);
    const toastId = toast.loading(`Deleting ${selectedIds.length} items...`);
    let count = 0;
    try {
      for (const id of selectedIds) {
        await deleteDoc(doc(db, "launch_notifications", id));
        count++;
      }
      toast.success(`Deleted ${count} notifications`, { id: toastId });
      setSelectedIds([]);
    } catch (err) {
      toast.error("Cleanup incomplete. Some items failed to delete.", { id: toastId });
    }
  };

  const handleToggleReferralSelect = (email: string, name: string, parentId: string) => {
    setSelectedReferrals(prev => {
      const isSelected = prev.some(r => r.email === email && r.parentId === parentId);
      if (isSelected) {
        return prev.filter(r => !(r.email === email && r.parentId === parentId));
      } else {
        return [...prev, { email, name, parentId }];
      }
    });
  };

  const handleBulkContact = async () => {
    setIsSending(true);
    const totalSelected = selectedIds.length + selectedReferrals.length;
    const toastId = toast.loading(`Simulating ${totalSelected} email transmissions...`);
    
    try {
      // 1. Process Main Leads
      const selectedNotifications = notifications.filter(n => selectedIds.includes(n.id));
      for (const n of selectedNotifications) {
        await addDoc(collection(db, "system_logs"), {
          type: "EMAIL_SIM",
          message: `Direct Contact: ${n.fullName}`,
          timestamp: serverTimestamp(),
          details: {
            recipient: n.email,
            template: "DIRECT_ADMIN_CONTACT",
            subject: emailSubject,
            body: emailBody,
            metadata: { notificationId: n.id, recipientName: n.fullName }
          }
        });
      }

      // 2. Process Selected Referrals
      for (const ref of selectedReferrals) {
        await addDoc(collection(db, "system_logs"), {
          type: "EMAIL_SIM",
          message: `Referral Outreach: ${ref.name || ref.email}`,
          timestamp: serverTimestamp(),
          details: {
            recipient: ref.email,
            template: "DIRECT_ADMIN_CONTACT",
            subject: emailSubject,
            body: emailBody,
            metadata: { parentId: ref.parentId, recipientName: ref.name }
          }
        });
      }

      // Track dispatch simulation interaction
      await trackInteraction("dispatch_simulation", {
        totalTargetCount: totalSelected,
        subject: emailSubject,
        body: emailBody,
        leadsCount: selectedNotifications.length,
        referralsCount: selectedReferrals.length
      });
      
      toast.success(`Transmissions archived: ${totalSelected} emails simulated.`, { id: toastId });
      setIsContactDialogOpen(false);
      setSelectedIds([]);
      setSelectedReferrals([]);
    } catch (err) {
      toast.error("Simulation failed. Check system logs.", { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  const filtered = notifications.filter(n => {
    const matchesSearch = n.fullName.toLowerCase().includes(search.toLowerCase()) ||
                         n.email.toLowerCase().includes(search.toLowerCase());
    
    if (!n.createdAt) return matchesSearch;
    
    const date = n.createdAt.toDate();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    
    if (from && date < from) return false;
    if (to) {
      // Set 'to' to end of day
      const toEnd = new Date(to);
      toEnd.setHours(23, 59, 59, 999);
      if (date > toEnd) return false;
    }
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center text-left">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 italic uppercase">Launch Notifications FREE Plan</h1>
          <p className="text-slate-500 font-medium">Manage and review potential leads from the landing page interstitial.</p>
        </div>
        <div className="bg-blue-600 text-white rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200">
          {notifications.length} Total Signups
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Search by name or email..." 
            className="pl-12 h-14 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-blue-600"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-slate-400 ml-1">From</span>
            <Input 
              type="date" 
              value={dateFrom} 
              onChange={e => setDateFrom(e.target.value)}
              className="h-10 bg-white border-slate-200 rounded-xl text-xs w-40"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-slate-400 ml-1">To</span>
            <Input 
              type="date" 
              value={dateTo} 
              onChange={e => setDateTo(e.target.value)}
              className="h-10 bg-white border-slate-200 rounded-xl text-xs w-40"
            />
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-4 text-xs font-bold text-slate-400"
            onClick={() => { setDateFrom(""); setDateTo(""); }}
          >
            Reset
          </Button>
        </div>
        <div className="flex items-center gap-3 px-4 bg-white border border-slate-200 h-14 rounded-2xl shadow-sm">
          <Checkbox 
            id="select-all"
            checked={selectedIds.length === filtered.length && filtered.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <label htmlFor="select-all" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer select-none">
            {selectedIds.length + selectedReferrals.length > 0 ? `Selected ${selectedIds.length + selectedReferrals.length}` : 'Select All Records'}
          </label>
        </div>
      </div>

      <div className="grid gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((n, i) => (
            <motion.div 
              key={n.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-3xl border shadow-sm overflow-hidden hover:shadow-md transition-all group ${selectedIds.includes(n.id) ? 'border-blue-300 ring-4 ring-blue-50 bg-blue-50/5' : 'border-slate-200'}`}
              onClick={() => handleToggleSelect(n.id)}
            >
              <div className="p-4 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 cursor-pointer">
                <div className="flex gap-3 md:gap-6 items-start min-w-0 flex-1">
                  <div className="shrink-0 flex items-center h-10 md:h-16">
                     <Checkbox 
                      checked={selectedIds.includes(n.id)}
                      onCheckedChange={() => handleToggleSelect(n.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-6 w-6 rounded-lg data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </div>
                  <div className="h-10 w-10 md:h-16 md:w-16 bg-slate-100 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                    <User className="h-5 w-5 md:h-8 md:w-8 text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <div className="space-y-1 text-left min-w-0 flex-1">
                    <h3 className="text-base md:text-xl font-black italic tracking-tighter text-slate-900 flex flex-wrap items-center gap-2">
                      {n.fullName}
                      <span className="px-2 py-0.5 bg-slate-100 text-[8px] font-black uppercase tracking-widest text-slate-400 rounded-full border border-slate-200">
                        {n.source || "Landing Page"}
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm font-bold text-slate-500">
                      <div className="flex items-center gap-1.5 hover:text-blue-600 cursor-copy min-w-0">
                        <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{n.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 hover:text-blue-600 cursor-copy shrink-0">
                        <Phone className="h-3.5 w-3.5 shrink-0" /> {n.phone}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                        <Bell className="h-3.5 w-3.5 shrink-0" /> {n.createdAt ? format(n.createdAt.toDate(), 'MMM d, yyyy h:mm a') : 'Just now'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 shrink-0 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl" onClick={() => handleDelete(n.id)}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {n.referrals && n.referrals.length > 0 && (
                <div className="bg-slate-50/50 border-t border-slate-100 p-4 md:p-8" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Referrals Provided ({n.referrals.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {n.referrals.map((ref, idx) => {
                      const isRefSelected = selectedReferrals.some(r => r.email === ref.email && r.parentId === n.id);
                      return (
                        <div 
                          key={'ref-' + n.id + '-' + idx} 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleReferralSelect(ref.email, ref.email, n.id);
                          }}
                          className={`bg-white border rounded-xl p-4 flex items-center gap-3 shadow-sm transition-all cursor-pointer hover:border-blue-300 ${isRefSelected ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200'}`}
                        >
                          <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0 ${isRefSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                            {isRefSelected && <Check className="h-3 w-3" />}
                          </div>
                          <div className="flex flex-col gap-1 overflow-hidden">
                            <div className="text-xs font-black text-slate-900 truncate">
                              {ref.email}
                            </div>
                            <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 w-fit px-1.5 py-0.5 rounded">
                              {ref.type}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="p-20 text-center space-y-4 bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto">
              <Mail className="h-10 w-10 text-slate-200" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900">No notifications found</h3>
              <p className="text-sm text-slate-500">Wait for new agents to sign up on the landing page.</p>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {(selectedIds.length > 0 || selectedReferrals.length > 0) && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-3xl p-4 shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 px-3 border-r border-white/10">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={() => {
                  setSelectedIds([]);
                  setSelectedReferrals([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="text-sm font-black italic tracking-tighter uppercase">
                {selectedIds.length + selectedReferrals.length} TARGETS SELECTED
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <Button 
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                  onClick={handleBulkDelete}
                  title="Delete Selected Notifications"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
              <Button 
                className="bg-blue-600 hover:bg-blue-500 gap-2 font-bold px-6" 
                onClick={() => setIsContactDialogOpen(true)}
              >
                Contact Selected <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
              <Mail className="h-6 w-6 text-blue-600" />
              Direct Outreach
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">
              Simulating personal outreach to {selectedIds.length + selectedReferrals.length} target(s)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Subject</label>
              <Input 
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="font-bold border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Message Body</label>
              <textarea 
                className="w-full min-h-[150px] bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-600 leading-relaxed"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>

            <div className="pt-2 border-t border-slate-100 bg-slate-50/50 p-3 rounded-xl space-y-1.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signature Resource Links</p>
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="text-slate-400">Website:</span>
                  <a 
                    href="https://www.vertexagent.io" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={() => trackInteraction("website_link_click", { 
                      link: "https://www.vertexagent.io", 
                      context: "Direct Outreach Popup" 
                     })} 
                    className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
                  >
                    VertexAgent.io
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="text-slate-400">Book a Demo:</span>
                  <a 
                    href="https://calendly.com/vertexagent-demo" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={() => trackInteraction("book_a_demo_link_click", { 
                      link: "https://calendly.com/vertexagent-demo", 
                      context: "Direct Outreach Popup" 
                     })} 
                    className="text-emerald-600 hover:underline font-black uppercase tracking-wider inline-flex items-center gap-1"
                  >
                    BOOK a DEMO
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsContactDialogOpen(false)} disabled={isSending} className="font-bold uppercase tracking-widest text-xs">
              Cancel
            </Button>
            <Button 
              onClick={handleBulkContact} 
              disabled={isSending} 
              className="bg-blue-600 hover:bg-blue-500 font-bold px-8 shadow-lg shadow-blue-200"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Dispatch Simulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-black tracking-tighter uppercase flex items-center gap-2 text-red-600 italic">
              <Trash2 className="h-5.5 w-5.5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">
              This action is permanent and cannot be undone
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-left space-y-2">
            <p className="text-sm font-semibold text-slate-700 leading-relaxed">
              Are you sure you want to remove this notification?
            </p>
            {deleteTargetId && (
              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-xs font-bold text-slate-500">
                <p><span className="text-slate-400">Name:</span> <span className="text-slate-900 font-extrabold">{notifications.find(n => n.id === deleteTargetId)?.fullName}</span></p>
                <p><span className="text-slate-400">Email:</span> <span className="text-slate-900 font-extrabold">{notifications.find(n => n.id === deleteTargetId)?.email}</span></p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)} className="font-bold uppercase tracking-widest text-xs">
              Cancel
            </Button>
            <Button 
              onClick={confirmSingleDelete} 
              className="bg-red-600 hover:bg-red-50 text-white font-bold px-6 shadow-lg shadow-red-100"
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-black tracking-tighter uppercase flex items-center gap-2 text-red-600 italic">
              <Trash2 className="h-5.5 w-5.5" />
              Confirm Bulk Deletion
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">
              Destroy multiple database records permanently
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-left space-y-2">
            <p className="text-sm font-semibold text-slate-700 leading-relaxed">
              Are you sure you want to delete <strong className="text-red-600 font-black">{selectedIds.length}</strong> selected notifications?
            </p>
            <div className="bg-red-50/50 border border-red-100 p-3.5 rounded-xl text-xs font-semibold text-red-800 leading-normal">
              This will remove all selected agent launch signups from your admin telemetry and delete their trace in Firestore.
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="ghost" onClick={() => setIsBulkDeleteConfirmOpen(false)} className="font-bold uppercase tracking-widest text-xs">
              Cancel
            </Button>
            <Button 
              onClick={confirmBulkDelete} 
              className="bg-red-600 hover:bg-red-50 text-white font-bold px-6 shadow-lg shadow-red-100"
            >
              Delete {selectedIds.length} Records
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
