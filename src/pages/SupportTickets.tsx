import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { 
  LifeBuoy, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  User, 
  Send, 
  ShieldAlert, 
  Tag, 
  ArrowLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  X,
  FileText,
  Mail,
  HelpCircle,
  BarChart2,
  Zap,
  Check,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";

export interface TicketReply {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "agent" | "admin" | "support";
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: "sora_voice" | "kiosk_signin" | "billing" | "integrations" | "general";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  description: string;
  listingId?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  replies: TicketReply[];
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  sora_voice: { label: "Sora Voice & AI", color: "bg-purple-100 text-purple-700 border-purple-200" },
  kiosk_signin: { label: "Kiosk & Sign-In", color: "bg-blue-100 text-blue-700 border-blue-200" },
  billing: { label: "Billing & Plans", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  integrations: { label: "CRM & Integrations", color: "bg-amber-100 text-amber-700 border-amber-200" },
  general: { label: "General Support", color: "bg-slate-100 text-slate-700 border-slate-200" },
};

const PRIORITY_BADGES: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-slate-100 text-slate-600 border-slate-200" },
  medium: { label: "Medium", color: "bg-blue-50 text-blue-600 border-blue-200" },
  high: { label: "High", color: "bg-amber-50 text-amber-700 border-amber-200" },
  urgent: { label: "Urgent", color: "bg-red-50 text-red-700 border-red-200 font-bold" },
};

const STATUS_BADGES: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: "Open", color: "bg-blue-50 text-blue-700 border-blue-200", icon: AlertCircle },
  in_progress: { label: "In Progress", color: "bg-amber-50 text-amber-800 border-amber-200", icon: Clock },
  resolved: { label: "Resolved", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  closed: { label: "Closed", color: "bg-slate-100 text-slate-600 border-slate-200", icon: X },
};

const SEED_TICKETS: SupportTicket[] = [
  {
    id: "seed-101",
    ticketNumber: "TICK-4092",
    userId: "agent-1",
    userName: "Michael St. Jean",
    userEmail: "michael@stjeanrealty.com",
    subject: "Follow Up Boss CRM field mapping error for custom question response",
    category: "integrations",
    priority: "high",
    status: "in_progress",
    description: "When an attendee answers 'Looking to buy in 30 days' on the open house tablet, the custom tag gets synced to FUB as '30_days' instead of the mapped label 'Buying Window'. Can you verify our field mapping rules?",
    createdAt: "2026-07-29T14:22:00Z",
    updatedAt: "2026-07-29T16:05:00Z",
    assignedTo: "Support Tech Lead",
    replies: [
      {
        id: "rep-1",
        senderId: "admin-1",
        senderName: "AI Open House Care Team",
        senderRole: "support",
        message: "Hi Michael, thank you for reaching out! We are updating the FUB field mapper to respect your custom label aliases. I have placed this ticket in 'In Progress' and expect a patch live shortly.",
        createdAt: "2026-07-29T16:05:00Z"
      }
    ]
  },
  {
    id: "seed-102",
    ticketNumber: "TICK-3981",
    userId: "agent-2",
    userName: "Sarah Jenkins",
    userEmail: "sarah.jenkins@gmail.com",
    subject: "Request custom welcome audio in Spanish for 1482 Beverly Hills tour",
    category: "sora_voice",
    priority: "medium",
    status: "resolved",
    description: "We are hosting an international open house this Saturday and would like Sora to pronounce 'Villa Bellissima' with proper Spanish phonetic cadence during the opening narration.",
    createdAt: "2026-07-28T09:15:00Z",
    updatedAt: "2026-07-28T11:40:00Z",
    assignedTo: "Voice Engineering Team",
    replies: [
      {
        id: "rep-2",
        senderId: "admin-1",
        senderName: "Sora Voice Team",
        senderRole: "admin",
        message: "Hi Sarah! We generated and cached the Spanish welcome narration with phonetic overrides. You can test it live directly in the Voice Lab tab now!",
        createdAt: "2026-07-28T11:40:00Z"
      }
    ]
  },
  {
    id: "seed-103",
    ticketNumber: "TICK-3820",
    userId: "agent-3",
    userName: "David Vance",
    userEmail: "david.vance@techfirm.co",
    subject: "Tablet Kiosk Exit PIN lock reset assistance",
    category: "kiosk_signin",
    priority: "urgent",
    status: "open",
    description: "Our assistant forgot the Exit PIN configured for the tablet kiosk during today's open house. Need immediate admin override or instructions to reset the 4-digit PIN.",
    createdAt: "2026-07-30T10:00:00Z",
    updatedAt: "2026-07-30T10:00:00Z",
    assignedTo: "Unassigned",
    replies: []
  }
];

export default function SupportTickets() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = user?.role === "ADMIN" || user?.email === "luc.valade@gmail.com";

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewScope, setViewScope] = useState<"my" | "all">(isAdmin ? "all" : "my");

  // Create Ticket Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState<SupportTicket["category"]>("general");
  const [newPriority, setNewPriority] = useState<SupportTicket["priority"]>("medium");
  const [newDescription, setNewDescription] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newListingId, setNewListingId] = useState("");

  // Reply State
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Load Tickets from Firestore
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const fetchTickets = async () => {
      setLoading(true);
      try {
        const colRef = collection(db, "support_tickets");
        const q = query(colRef, orderBy("createdAt", "desc"));

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (snapshot.empty) {
              // Seed initial fallback tickets if collection is empty
              setTickets(SEED_TICKETS);
            } else {
              const loaded: SupportTicket[] = [];
              snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                loaded.push({
                  id: docSnap.id,
                  ticketNumber: data.ticketNumber || `TICK-${docSnap.id.slice(0, 5).toUpperCase()}`,
                  userId: data.userId || "",
                  userName: data.userName || "Unknown User",
                  userEmail: data.userEmail || "",
                  subject: data.subject || "No Subject",
                  category: data.category || "general",
                  priority: data.priority || "medium",
                  status: data.status || "open",
                  description: data.description || "",
                  listingId: data.listingId,
                  phone: data.phone,
                  createdAt: data.createdAt || new Date().toISOString(),
                  updatedAt: data.updatedAt || new Date().toISOString(),
                  assignedTo: data.assignedTo || "Unassigned",
                  replies: data.replies || []
                });
              });
              setTickets(loaded);
            }
            setLoading(false);
          },
          (err) => {
            console.warn("Support tickets snapshot fallback:", err);
            handleFirestoreError(err, OperationType.LIST, "support_tickets");
            setTickets(SEED_TICKETS);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Failed to setup tickets listener:", err);
        setTickets(SEED_TICKETS);
        setLoading(false);
      }
    };

    fetchTickets();
    return () => unsubscribe();
  }, []);

  // Check query params for auto-open ticket or prefill
  useEffect(() => {
    const ticketIdParam = searchParams.get("ticketId");
    if (ticketIdParam && tickets.length > 0) {
      const found = tickets.find((t) => t.id === ticketIdParam || t.ticketNumber === ticketIdParam);
      if (found) {
        setSelectedTicket(found);
      }
    }
  }, [searchParams, tickets]);

  // Handle Create Ticket Submit
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) {
      toast.error("Please provide both a subject and a description.");
      return;
    }

    setSubmitting(true);
    const newNum = `TICK-${Math.floor(1000 + Math.random() * 9000)}`;
    const ticketObj: Omit<SupportTicket, "id"> = {
      ticketNumber: newNum,
      userId: user?.id || "guest-user",
      userName: user?.name || user?.email?.split("@")[0] || "Agent User",
      userEmail: user?.email || "agent@example.com",
      subject: newSubject.trim(),
      category: newCategory,
      priority: newPriority,
      status: "open",
      description: newDescription.trim(),
      phone: newPhone.trim(),
      listingId: newListingId.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedTo: "Support Queue",
      replies: []
    };

    try {
      const docRef = await addDoc(collection(db, "support_tickets"), ticketObj);
      toast.success(`Ticket ${newNum} created successfully! Our team will respond shortly.`);

      // Send email copy to testing recipient
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: "richardvalade6156@gmail.com",
            subject: `[Support Ticket ${newNum}] ${newSubject.trim()}`,
            text: `New Support Ticket Created:\nTicket #: ${newNum}\nUser: ${ticketObj.userName} (${ticketObj.userEmail})\nPhone: ${newPhone || "N/A"}\nListing ID: ${newListingId || "N/A"}\nCategory: ${newCategory}\nPriority: ${newPriority}\nSubject: ${newSubject.trim()}\n\nDescription:\n${newDescription.trim()}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #2563eb; margin-top: 0;">New Support Ticket (${newNum})</h2>
                <p><strong>Submitted By:</strong> ${ticketObj.userName} (${ticketObj.userEmail})</p>
                ${newPhone ? `<p><strong>Phone:</strong> ${newPhone}</p>` : ''}
                ${newListingId ? `<p><strong>Listing ID:</strong> ${newListingId}</p>` : ''}
                <p><strong>Category:</strong> ${newCategory.toUpperCase()} | <strong>Priority:</strong> ${newPriority.toUpperCase()}</p>
                <p><strong>Subject:</strong> ${newSubject.trim()}</p>
                <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 16px 0;" />
                <p style="white-space: pre-wrap; background-color: #f8fafc; padding: 12px; border-radius: 8px;">${newDescription.trim()}</p>
                <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 16px 0;" />
                <p style="font-size: 12px; color: #64748b;">This support ticket has been recorded in the AI Open House Connect Support Tickets Dashboard.</p>
              </div>
            `
          })
        });
      } catch (eErr) {
        console.warn("Failed to dispatch ticket email copy:", eErr);
      }
      
      // Also reset form
      setNewSubject("");
      setNewDescription("");
      setNewPhone("");
      setNewListingId("");
      setIsCreateOpen(false);

      // Set selected ticket view
      const fullCreated: SupportTicket = { id: docRef.id, ...ticketObj };
      setSelectedTicket(fullCreated);
    } catch (err: any) {
      console.error("Error creating ticket:", err);
      // Local fallback insert
      const fallbackId = `ticket-local-${Date.now()}`;
      const fullCreated: SupportTicket = { id: fallbackId, ...ticketObj };
      setTickets(prev => [fullCreated, ...prev]);
      toast.success(`Ticket ${newNum} logged! Saved to local queue.`);
      setIsCreateOpen(false);
      setSelectedTicket(fullCreated);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Status / Priority Change (Admin or Owner)
  const handleUpdateTicketStatus = async (ticketId: string, newStatus: SupportTicket["status"]) => {
    try {
      const docRef = doc(db, "support_tickets", ticketId);
      await updateDoc(docRef, { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Ticket status updated to '${STATUS_BADGES[newStatus].label}'`);
    } catch (err) {
      console.warn("Status update fallback:", err);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t));
      toast.success(`Ticket status updated to '${STATUS_BADGES[newStatus].label}'`);
    }

    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleUpdateTicketPriority = async (ticketId: string, newPriority: SupportTicket["priority"]) => {
    try {
      const docRef = doc(db, "support_tickets", ticketId);
      await updateDoc(docRef, { 
        priority: newPriority,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Priority set to '${PRIORITY_BADGES[newPriority].label}'`);
    } catch (err) {
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, priority: newPriority, updatedAt: new Date().toISOString() } : t));
      toast.success(`Priority set to '${PRIORITY_BADGES[newPriority].label}'`);
    }

    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, priority: newPriority } : null);
    }
  };

  // Post Reply to Ticket Thread
  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    setSendingReply(true);
    const newReply: TicketReply = {
      id: `rep-${Date.now()}`,
      senderId: user?.id || "user-id",
      senderName: user?.name || (isAdmin ? "AI Support Specialist" : "Agent"),
      senderRole: isAdmin ? "support" : "agent",
      message: replyMessage.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedReplies = [...(selectedTicket.replies || []), newReply];
    const updatedStatus = isAdmin && selectedTicket.status === "open" ? "in_progress" : selectedTicket.status;

    try {
      if (!selectedTicket.id.startsWith("seed-")) {
        const docRef = doc(db, "support_tickets", selectedTicket.id);
        await updateDoc(docRef, {
          replies: updatedReplies,
          status: updatedStatus,
          updatedAt: new Date().toISOString()
        });
      }
      
      const updatedObj = {
        ...selectedTicket,
        replies: updatedReplies,
        status: updatedStatus,
        updatedAt: new Date().toISOString()
      };

      setSelectedTicket(updatedObj);
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedObj : t));
      setReplyMessage("");
      toast.success("Reply posted to ticket conversation.");
    } catch (err) {
      console.error("Failed to post reply:", err);
      toast.error("Failed to post reply. Please try again.");
    } finally {
      setSendingReply(false);
    }
  };

  // Filter Logic
  const filteredTickets = tickets.filter((ticket) => {
    // User Scope
    if (viewScope === "my" && user) {
      const isMine = ticket.userId === user.id || ticket.userEmail.toLowerCase() === user.email?.toLowerCase();
      if (!isMine) return false;
    }

    // Status Filter
    if (statusFilter !== "all") {
      if (statusFilter === "open") {
        if (ticket.status !== "open" && ticket.status !== "in_progress") return false;
      } else if (statusFilter === "resolved") {
        if (ticket.status !== "resolved" && ticket.status !== "closed") return false;
      } else if (ticket.status !== statusFilter) {
        return false;
      }
    }

    // Priority Filter
    if (priorityFilter !== "all") {
      if (priorityFilter === "urgent" || priorityFilter === "high") {
        if (ticket.priority !== "urgent" && ticket.priority !== "high") return false;
      } else if (ticket.priority !== priorityFilter) {
        return false;
      }
    }

    // Category Filter
    if (categoryFilter !== "all" && ticket.category !== categoryFilter) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = ticket.ticketNumber.toLowerCase().includes(q);
      const matchSubject = ticket.subject.toLowerCase().includes(q);
      const matchDesc = ticket.description.toLowerCase().includes(q);
      const matchName = ticket.userName.toLowerCase().includes(q);
      const matchEmail = ticket.userEmail.toLowerCase().includes(q);
      if (!matchNum && !matchSubject && !matchDesc && !matchName && !matchEmail) {
        return false;
      }
    }

    return true;
  });

  // Calculate High Level Metrics
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === "open" || t.status === "in_progress").length;
  const urgentCount = tickets.filter(t => t.priority === "urgent" || t.priority === "high").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 md:px-4 pb-16">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 md:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-bold uppercase tracking-wider">
            <LifeBuoy className="h-3.5 w-3.5" />
            <span>Client Success & Support Hub</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Support <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Tickets Dashboard</span>
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Track inquiries, submit technical requests for Sora AI tours, tablet sign-in kiosks, CRM field mapping, or contact dedicated platform engineers 24/7.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Ticket</span>
          </Button>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => {
            setStatusFilter("all");
            setPriorityFilter("all");
            toast.info("Showing all recorded support tickets");
          }}
          className={`p-5 bg-white border text-left rounded-2xl shadow-sm space-y-1 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
            statusFilter === "all" && priorityFilter === "all"
              ? "ring-2 ring-blue-600 border-blue-500 bg-blue-50/20"
              : "border-slate-200/80 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-extrabold uppercase tracking-wider">Total Tickets</span>
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
          <p className="text-[11px] text-slate-400">Click to view all tickets →</p>
        </button>

        <button
          onClick={() => {
            setStatusFilter("open");
            setPriorityFilter("all");
            toast.info("Filtered to Active & Open tickets");
          }}
          className={`p-5 bg-white border text-left rounded-2xl shadow-sm space-y-1 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
            statusFilter === "open"
              ? "ring-2 ring-amber-500 border-amber-500 bg-amber-50/20"
              : "border-slate-200/80 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-extrabold uppercase tracking-wider">Active / Open</span>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{openCount}</div>
          <p className="text-[11px] text-slate-400">Click to view active tickets →</p>
        </button>

        <button
          onClick={() => {
            setPriorityFilter("urgent");
            setStatusFilter("all");
            toast.info("Filtered to High & Urgent priority tickets");
          }}
          className={`p-5 bg-white border text-left rounded-2xl shadow-sm space-y-1 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
            priorityFilter === "urgent" || priorityFilter === "high"
              ? "ring-2 ring-red-500 border-red-500 bg-red-50/20"
              : "border-slate-200/80 hover:border-red-300"
          }`}
        >
          <div className="flex items-center justify-between text-red-600">
            <span className="text-xs font-extrabold uppercase tracking-wider">High / Urgent</span>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600">{urgentCount}</div>
          <p className="text-[11px] text-slate-400">Click to view urgent tickets →</p>
        </button>

        <button
          onClick={() => {
            setStatusFilter("resolved");
            setPriorityFilter("all");
            toast.info("Filtered to Resolved & Closed tickets");
          }}
          className={`p-5 bg-white border text-left rounded-2xl shadow-sm space-y-1 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
            statusFilter === "resolved"
              ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20"
              : "border-slate-200/80 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-extrabold uppercase tracking-wider">Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{resolvedCount}</div>
          <p className="text-[11px] text-slate-400">Click to view resolved tickets →</p>
        </button>
      </div>

      {/* Main Content Layout: Left Sidebar Filter + Ticket Table/Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Ticket List & Search Bar */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            
            {/* View Scope Tabs (My Tickets vs All Tickets for Admin) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setViewScope("my")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewScope === "my" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  My Tickets
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setViewScope("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewScope === "all" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>All Platform Tickets</span>
                  </button>
                )}
              </div>

              <span className="text-xs text-slate-400 font-medium">
                Showing <strong className="text-slate-900">{filteredTickets.length}</strong> tickets
              </span>
            </div>

            {/* Search + Filter Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
              <div className="md:col-span-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search subject or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200 rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200 rounded-xl">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 text-xs bg-slate-50 border-slate-200 rounded-xl">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="sora_voice">Sora Voice & AI</SelectItem>
                    <SelectItem value="kiosk_signin">Kiosk & Sign-In</SelectItem>
                    <SelectItem value="billing">Billing & Plans</SelectItem>
                    <SelectItem value="integrations">CRM & Integrations</SelectItem>
                    <SelectItem value="general">General Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Ticket Table / List Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                <p className="text-xs font-semibold">Loading support tickets dashboard...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <LifeBuoy className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800">No tickets found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No tickets match your search parameters. Click "Create New Ticket" to open a support inquiry.
                  </p>
                </div>
                <Button 
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Create First Ticket
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => {
                  const statusInfo = STATUS_BADGES[ticket.status] || STATUS_BADGES.open;
                  const priorityInfo = PRIORITY_BADGES[ticket.priority] || PRIORITY_BADGES.medium;
                  const categoryInfo = CATEGORY_LABELS[ticket.category] || CATEGORY_LABELS.general;
                  const StatusIcon = statusInfo.icon;
                  const isSelected = selectedTicket?.id === ticket.id;

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-4 transition-all cursor-pointer hover:bg-slate-50/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        isSelected ? "bg-blue-50/60 border-l-4 border-l-blue-600" : ""
                      }`}
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {ticket.ticketNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${categoryInfo.color}`}>
                            {categoryInfo.label}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityInfo.color}`}>
                            {priorityInfo.label} Priority
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-sm truncate hover:text-blue-600 transition-colors">
                          {ticket.subject}
                        </h4>

                        <p className="text-xs text-slate-500 line-clamp-1">
                          {ticket.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <User className="h-3 w-3" />
                            {ticket.userName} ({ticket.userEmail})
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {ticket.replies && ticket.replies.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-blue-600 font-semibold">
                                <MessageSquare className="h-3 w-3" />
                                {ticket.replies.length} {ticket.replies.length === 1 ? "reply" : "replies"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status Badge + Chevron */}
                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${statusInfo.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{statusInfo.label}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400 hidden md:block" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Interactive Ticket Conversation Detail View */}
        <div className="lg:col-span-1">
          {selectedTicket ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 space-y-5 sticky top-6">
              
              {/* Header Details */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                    {selectedTicket.ticketNumber}
                  </span>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {selectedTicket.subject}
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${CATEGORY_LABELS[selectedTicket.category]?.color}`}>
                    {CATEGORY_LABELS[selectedTicket.category]?.label}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${PRIORITY_BADGES[selectedTicket.priority]?.color}`}>
                    {PRIORITY_BADGES[selectedTicket.priority]?.label}
                  </span>
                </div>
              </div>

              {/* Status and Priority Management Controls */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ticket Management Controls
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-slate-500">Update Status</Label>
                    <Select 
                      value={selectedTicket.status} 
                      onValueChange={(val) => handleUpdateTicketStatus(selectedTicket.id, val as any)}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[10px] text-slate-500">Priority Level</Label>
                    <Select 
                      value={selectedTicket.priority} 
                      onValueChange={(val) => handleUpdateTicketPriority(selectedTicket.id, val as any)}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Submitter Info */}
              <div className="text-xs space-y-1 text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <p><strong>Submitted by:</strong> {selectedTicket.userName} ({selectedTicket.userEmail})</p>
                {selectedTicket.phone && <p><strong>Phone:</strong> {selectedTicket.phone}</p>}
                {selectedTicket.listingId && <p><strong>Listing ID:</strong> {selectedTicket.listingId}</p>}
                <p className="text-[10px] text-slate-400 mt-1">
                  Submitted {new Date(selectedTicket.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Conversation Thread */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Conversation & Log Thread
                </div>

                {/* Original Issue Message */}
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-blue-900">{selectedTicket.userName}</span>
                    <span className="text-slate-400 text-[10px]">Original Request</span>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Replies Thread */}
                {selectedTicket.replies && selectedTicket.replies.map((rep) => {
                  const isStaff = rep.senderRole === "admin" || rep.senderRole === "support";
                  return (
                    <div 
                      key={rep.id} 
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        isStaff ? "bg-slate-900 text-slate-100 border-slate-800" : "bg-white text-slate-800 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className={`font-bold ${isStaff ? "text-blue-300" : "text-slate-900"}`}>
                          {rep.senderName} {isStaff && "(Support Team)"}
                        </span>
                        <span>{new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{rep.message}</p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handlePostReply} className="space-y-2 pt-2 border-t border-slate-100">
                <Textarea
                  placeholder="Type a reply or update message..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="text-xs min-h-[70px] bg-slate-50 border-slate-200 rounded-xl"
                />
                <Button
                  type="submit"
                  disabled={sendingReply || !replyMessage.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{sendingReply ? "Posting..." : "Post Reply"}</span>
                </Button>
              </form>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 space-y-3 sticky top-6">
              <MessageSquare className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">Select a ticket to view conversation details</p>
              <p className="text-[11px] text-slate-400">
                Click any ticket from the list on the left to view response threads, update priority, or reply.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Modal: Create Ticket */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-blue-600" />
              <span>Create New Support Ticket</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Submit a support inquiry or technical issue directly to our client success engineers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Subject / Summary *</Label>
              <Input
                placeholder="e.g. Need assistance setting up Follow Up Boss tags"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                required
                className="text-xs h-9 border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Category</Label>
                <Select value={newCategory} onValueChange={(val) => setNewCategory(val as any)}>
                  <SelectTrigger className="h-9 text-xs border-slate-200 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Support</SelectItem>
                    <SelectItem value="sora_voice">Sora Voice & AI</SelectItem>
                    <SelectItem value="kiosk_signin">Kiosk & Sign-In</SelectItem>
                    <SelectItem value="billing">Billing & Plans</SelectItem>
                    <SelectItem value="integrations">CRM & Integrations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Priority Level</Label>
                <Select value={newPriority} onValueChange={(val) => setNewPriority(val as any)}>
                  <SelectTrigger className="h-9 text-xs border-slate-200 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Detailed Description *</Label>
              <Textarea
                placeholder="Explain what happened or what help you need..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                required
                className="text-xs min-h-[100px] border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Contact Phone (Optional)</Label>
                <Input
                  placeholder="(555) 000-0000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="text-xs h-9 border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600">Listing ID (Optional)</Label>
                <Input
                  placeholder="e.g. prop-101"
                  value={newListingId}
                  onChange={(e) => setNewListingId(e.target.value)}
                  className="text-xs h-9 border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs font-semibold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 rounded-xl cursor-pointer"
              >
                {submitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
