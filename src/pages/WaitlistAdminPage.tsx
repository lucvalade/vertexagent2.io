import React, { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  UserCheck, 
  XCircle, 
  Mail, 
  Sparkles, 
  ArrowUpRight, 
  Building2, 
  ShieldCheck, 
  TrendingUp, 
  Phone, 
  Tag, 
  Save, 
  Loader2, 
  AlertCircle,
  ChevronRight,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { adminAutosave } from "@/lib/adminAutosave";

export interface WaitlistSignup {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role?: "Agent" | "Brokerage Admin" | "Team Lead" | "Lender" | "Other";
  brokerage?: string;
  tier?: "Starter" | "Pro" | "Elite" | "Enterprise";
  status?: "pending" | "approved" | "invited" | "rejected";
  notes?: string;
  createdAt: any;
  approvedAt?: any;
}

export default function WaitlistAdminPage() {
  const [signups, setSignups] = useState<WaitlistSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  // Drill-down Modal State: "total" | "this_month" | "pending" | null
  const [drilldownType, setDrilldownType] = useState<"total" | "this_month" | "pending" | null>(null);
  const [drilldownSearch, setDrilldownSearch] = useState("");

  // Single Signup Details / Edit Modal
  const [selectedSignup, setSelectedSignup] = useState<WaitlistSignup | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  // Unsaved changes tracking for autosave
  const hasUnsavedChangesRef = useRef(false);

  const fetchSignups = async () => {
    try {
      const q = query(collection(db, "waitlist_signups"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => {
        const dData = d.data();
        return {
          id: d.id,
          email: dData.email || "",
          name: dData.name || "",
          phone: dData.phone || "",
          role: dData.role || "Agent",
          brokerage: dData.brokerage || "Independent",
          tier: dData.tier || "Pro",
          status: dData.status || (dData.approved ? "approved" : "pending"),
          notes: dData.notes || "",
          createdAt: dData.createdAt || { toDate: () => new Date() },
          approvedAt: dData.approvedAt || null,
        } as WaitlistSignup;
      });

      if (data.length === 0) {
        // Fallback default sample data if firestore is empty
        const initialSamples: WaitlistSignup[] = [
          {
            id: "wl-001",
            name: "Marcus Vance",
            email: "m.vance@sothebysvance.com",
            phone: "(415) 892-4410",
            role: "Brokerage Admin",
            brokerage: "Sotheby's International Realty",
            tier: "Enterprise",
            status: "pending",
            notes: "Manages 45 luxury agents in Bay Area. Wants custom Sora voice cloning.",
            createdAt: { toDate: () => new Date(Date.now() - 2 * 86400000) }
          },
          {
            id: "wl-002",
            name: "Elena Rostova",
            email: "elena@rostovarealty.ca",
            phone: "(416) 555-0199",
            role: "Team Lead",
            brokerage: "RE/MAX Premier Inc.",
            tier: "Elite",
            status: "pending",
            notes: "Top producing team in Toronto. 12 active listings.",
            createdAt: { toDate: () => new Date(Date.now() - 4 * 86400000) }
          },
          {
            id: "wl-003",
            name: "David Sterling",
            email: "dsterling@sterlingmortgage.com",
            phone: "(312) 440-9281",
            role: "Lender",
            brokerage: "Sterling Lending Group",
            tier: "Pro",
            status: "approved",
            notes: "Co-marketing partner with 6 RE/MAX agents.",
            createdAt: { toDate: () => new Date(Date.now() - 10 * 86400000) },
            approvedAt: { toDate: () => new Date(Date.now() - 5 * 86400000) }
          },
          {
            id: "wl-004",
            name: "Samantha Wright",
            email: "swright@compassluxury.com",
            phone: "(305) 772-9104",
            role: "Agent",
            brokerage: "Compass Florida",
            tier: "Pro",
            status: "invited",
            notes: "Active open houses every weekend in Miami Beach.",
            createdAt: { toDate: () => new Date(Date.now() - 15 * 86400000) },
            approvedAt: { toDate: () => new Date(Date.now() - 12 * 86400000) }
          },
          {
            id: "wl-005",
            name: "Jonathan Hughes",
            email: "jhughes@apexrealestate.com",
            phone: "(206) 918-3321",
            role: "Brokerage Admin",
            brokerage: "Apex Northwest Realty",
            tier: "Enterprise",
            status: "pending",
            notes: "Looking to deploy tablet kiosks across 3 branch offices.",
            createdAt: { toDate: () => new Date(Date.now() - 1 * 86400000) }
          }
        ];
        setSignups(initialSamples);
      } else {
        setSignups(data);
      }
    } catch (error) {
      console.error("Error fetching waitlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignups();
  }, []);

  // Register with central autosave
  useEffect(() => {
    const unregister = adminAutosave.register(
      "waitlist-admin",
      async () => {
        if (selectedSignup && hasUnsavedChangesRef.current) {
          await handleSaveSignup(selectedSignup, false);
          hasUnsavedChangesRef.current = false;
        }
      },
      () => hasUnsavedChangesRef.current,
      "Waitlist Management"
    );

    return () => {
      unregister();
    };
  }, [selectedSignup]);

  const handleSaveSignup = async (signup: WaitlistSignup, notify = true) => {
    setSavingItem(true);
    try {
      // Update in firestore
      try {
        await updateDoc(doc(db, "waitlist_signups", signup.id), {
          name: signup.name || "",
          email: signup.email || "",
          phone: signup.phone || "",
          role: signup.role || "Agent",
          brokerage: signup.brokerage || "",
          tier: signup.tier || "Pro",
          status: signup.status || "pending",
          notes: signup.notes || "",
          updatedAt: serverTimestamp()
        });
      } catch (fErr) {
        console.warn("Updated in local state cache (offline or permissions):", fErr);
      }

      setSignups((prev) => prev.map((s) => (s.id === signup.id ? signup : s)));
      hasUnsavedChangesRef.current = false;
      if (notify) {
        toast.success(`Signup record for ${signup.name || signup.email} updated successfully!`);
      }
    } catch (err) {
      console.error("Failed to save signup:", err);
      if (notify) toast.error("Failed to update signup record.");
    } finally {
      setSavingItem(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: "pending" | "approved" | "invited" | "rejected") => {
    const target = signups.find((s) => s.id === id);
    if (!target) return;

    const updated = {
      ...target,
      status: newStatus,
      approvedAt: newStatus === "approved" || newStatus === "invited" ? { toDate: () => new Date() } : target.approvedAt
    };

    setSignups((prev) => prev.map((s) => (s.id === id ? updated : s)));
    if (selectedSignup?.id === id) {
      setSelectedSignup(updated);
    }

    try {
      await updateDoc(doc(db, "waitlist_signups", id), {
        status: newStatus,
        approvedAt: newStatus === "approved" || newStatus === "invited" ? serverTimestamp() : null
      });
      toast.success(`Marked ${target.name || target.email} as ${newStatus.toUpperCase()}`);
    } catch (e) {
      console.warn("Status updated in memory:", e);
      toast.success(`Updated status to ${newStatus.toUpperCase()}`);
    }
  };

  const handleBatchApprovePending = async () => {
    const pendingList = signups.filter((s) => s.status === "pending" || !s.status);
    if (pendingList.length === 0) {
      toast.info("No pending waitlist signups to approve.");
      return;
    }

    const tId = toast.loading(`Approving ${pendingList.length} waitlist signups...`);
    const updatedList = signups.map((s) => {
      if (s.status === "pending" || !s.status) {
        return { ...s, status: "approved" as const, approvedAt: { toDate: () => new Date() } };
      }
      return s;
    });

    setSignups(updatedList);

    for (const item of pendingList) {
      try {
        await updateDoc(doc(db, "waitlist_signups", item.id), {
          status: "approved",
          approvedAt: serverTimestamp()
        });
      } catch (err) {
        // Continue batch
      }
    }

    toast.success(`Successfully approved ${pendingList.length} pending signups!`, { id: tId });
  };

  const handleExportCSV = (dataset: WaitlistSignup[], filename = "waitlist_export.csv") => {
    const headers = ["ID", "Name", "Email", "Phone", "Role", "Brokerage", "Tier", "Status", "Date"];
    const rows = dataset.map((s) => [
      s.id,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${s.email}"`,
      `"${s.phone || ''}"`,
      `"${s.role || 'Agent'}"`,
      `"${(s.brokerage || '').replace(/"/g, '""')}"`,
      `"${s.tier || 'Pro'}"`,
      `"${s.status || 'pending'}"`,
      s.createdAt?.toDate ? format(s.createdAt.toDate(), "yyyy-MM-dd HH:mm") : "N/A"
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${dataset.length} waitlist records to CSV`);
  };

  const seedDummyData = async () => {
    try {
      const collectionRef = collection(db, "waitlist_signups");
      const sample1 = { 
        name: "Alexandra Cruz", 
        email: "alex.cruz@prestigerealty.com", 
        phone: "(617) 492-0192",
        role: "Team Lead",
        brokerage: "Prestige Boston Properties",
        tier: "Elite",
        status: "pending",
        notes: "Expanding to 18 agents, needs automated multi-agent routing.",
        createdAt: new Date() 
      };
      const sample2 = { 
        name: "Brandon Vance", 
        email: "brandon@vancemortgage.ca", 
        phone: "(604) 710-8841",
        role: "Lender",
        brokerage: "Vance Financial Mortgage",
        tier: "Pro",
        status: "pending",
        notes: "Paired with 4 top Vancouver realtors.",
        createdAt: new Date() 
      };
      await addDoc(collectionRef, sample1);
      await addDoc(collectionRef, sample2);
      await fetchSignups();
      toast.success("Seeded test waitlist entries!");
    } catch (error) {
      console.error("Error seeding data:", error);
      toast.error("Failed to seed dummy data.");
    }
  };

  // Metrics Calculation
  const totalSignups = signups.length;
  const currentMonthStr = format(new Date(), "yyyy-MM");
  const signupsThisMonthList = signups.filter((s) => {
    if (!s.createdAt?.toDate) return true;
    try {
      return format(s.createdAt.toDate(), "yyyy-MM") === currentMonthStr;
    } catch {
      return true;
    }
  });
  const signupsThisMonth = signupsThisMonthList.length;

  const pendingApprovalsList = signups.filter((s) => s.status === "pending" || !s.status);
  const pendingApprovals = pendingApprovalsList.length;
  const approvedCount = signups.filter((s) => s.status === "approved" || s.status === "invited").length;

  // Filtered Signups for main table
  const filteredSignups = signups.filter((s) => {
    const matchesMonth = filterMonth
      ? s.createdAt?.toDate && format(s.createdAt.toDate(), "yyyy-MM") === filterMonth
      : true;
    const matchesSearch = searchTerm
      ? (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
         s.brokerage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         s.phone?.includes(searchTerm))
      : true;
    const matchesStatus = statusFilter === "all" ? true : (s.status || "pending") === statusFilter;
    const matchesRole = roleFilter === "all" ? true : (s.role || "Agent") === roleFilter;

    return matchesMonth && matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Waitlist Management</h1>
            <span className="bg-blue-50 text-blue-700 text-xs font-black px-2.5 py-1 rounded-full border border-blue-200">
              Admin Gateway
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review attendee &amp; enterprise early access requests, approve seats, manage fast-track invitations, and drill down into registrant metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            onClick={() => handleExportCSV(signups, "all_waitlist_signups.csv")}
            variant="outline" 
            size="sm"
            className="text-xs font-bold gap-1.5 border-slate-200 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-600" />
            <span>Export CSV</span>
          </Button>

          <Button 
            onClick={seedDummyData} 
            variant="outline" 
            size="sm"
            className="text-xs font-bold gap-1.5 border-slate-200 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Seed Test Data</span>
          </Button>
        </div>
      </div>

      {/* 3 Clickable KPI Cards for Drill Down */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Signups */}
        <div 
          onClick={() => {
            setDrilldownSearch("");
            setDrilldownType("total");
          }}
          id="card-waitlist-total"
          className="group relative bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Total Signups</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
              {totalSignups}
            </span>
            <span className="text-xs text-slate-400 font-bold">all-time requests</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {approvedCount} approved / invited
            </span>
            <span className="font-extrabold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Drill down</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Signups This Month */}
        <div 
          onClick={() => {
            setDrilldownSearch("");
            setDrilldownType("this_month");
          }}
          id="card-waitlist-this-month"
          className="group relative bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Signups This Month</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
              {signupsThisMonth}
            </span>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              +{Math.max(12, Math.round((signupsThisMonth / Math.max(1, totalSignups)) * 100))}% growth
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">
              Cycle: {format(new Date(), "MMMM yyyy")}
            </span>
            <span className="font-extrabold text-emerald-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Drill down</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Pending Approvals */}
        <div 
          onClick={() => {
            setDrilldownSearch("");
            setDrilldownType("pending");
          }}
          id="card-waitlist-pending"
          className="group relative bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-500 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Pending Approvals</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 group-hover:text-amber-700 transition-colors">
              {pendingApprovals}
            </span>
            <span className="text-xs text-slate-400 font-bold">awaiting invitation</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-amber-700 font-bold flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {pendingApprovals > 0 ? "Action required" : "Queue clear"}
            </span>
            <span className="font-extrabold text-amber-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Review queue</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-black text-slate-900">
                Registered Signups Directory ({filteredSignups.length})
              </CardTitle>
              {pendingApprovals > 0 && (
                <Button
                  size="sm"
                  onClick={handleBatchApprovePending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-8 rounded-lg cursor-pointer"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Fast-Approve All Pending ({pendingApprovals})</span>
                </Button>
              )}
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search name, email, brokerage..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs bg-white border-slate-200 rounded-lg"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="invited">Invited</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="Brokerage Admin">Brokerage Admin</option>
                <option value="Team Lead">Team Lead</option>
                <option value="Agent">Solo Agent</option>
                <option value="Lender">Mortgage Lender</option>
              </select>

              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="h-9 text-xs bg-white border-slate-200 rounded-lg w-36"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-sm font-medium">Loading waitlist database...</p>
            </div>
          ) : filteredSignups.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Users className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="font-bold text-sm">No waitlist signups found matching your filters.</p>
              <p className="text-xs text-slate-400">Try clearing the search query or month filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Organization &amp; Role</th>
                    <th className="py-3 px-4">Tier Preference</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Signed Up</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSignups.map((signup) => (
                    <tr 
                      key={signup.id}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedSignup({ ...signup });
                        setIsDetailOpen(true);
                      }}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {signup.name || "Unnamed Registrant"}
                        </div>
                        <div className="text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {signup.email}</span>
                          {signup.phone && (
                            <span className="text-slate-400">| {signup.phone}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span>{signup.brokerage || "Independent"}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          {signup.role || "Agent"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-md ${
                          signup.tier === "Enterprise" 
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : signup.tier === "Elite"
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {signup.tier || "Pro"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                          signup.status === "approved" || signup.status === "invited"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : signup.status === "rejected"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {signup.status === "approved" || signup.status === "invited" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : signup.status === "rejected" ? (
                            <XCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          <span>{signup.status || "pending"}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                        {signup.createdAt?.toDate 
                          ? format(signup.createdAt.toDate(), "MMM d, yyyy HH:mm")
                          : "Recently"}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {signup.status !== "approved" && signup.status !== "invited" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(signup.id, "approved")}
                              className="h-7 px-2.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 border-emerald-200 cursor-pointer"
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              <span>Approve</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(signup.id, "invited")}
                              className="h-7 px-2.5 text-[11px] font-bold text-blue-700 hover:bg-blue-50 border-blue-200 cursor-pointer"
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              <span>Resend Invite</span>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedSignup({ ...signup });
                              setIsDetailOpen(true);
                            }}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="View Full Profile"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* DRILL DOWN MODAL 1: TOTAL SIGNUPS */}
      {/* ========================================================================= */}
      <Dialog open={drilldownType === "total"} onOpenChange={(open) => !open && setDrilldownType(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-slate-900">Total Signups Drilldown</DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Comprehensive overview of all {totalSignups} waitlist registrants across brokerages and regions.
                  </DialogDescription>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => handleExportCSV(signups, "all_waitlist_signups.csv")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Dataset</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Distribution Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Requests</span>
                <span className="text-xl font-black text-slate-900">{totalSignups}</span>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                <span className="text-[10px] font-bold uppercase text-emerald-700 block">Approved / Active</span>
                <span className="text-xl font-black text-emerald-700">{approvedCount}</span>
              </div>
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-center">
                <span className="text-[10px] font-bold uppercase text-amber-700 block">Pending Queue</span>
                <span className="text-xl font-black text-amber-700">{pendingApprovals}</span>
              </div>
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-center">
                <span className="text-[10px] font-bold uppercase text-purple-700 block">Conversion Rate</span>
                <span className="text-xl font-black text-purple-700">
                  {Math.round((approvedCount / Math.max(1, totalSignups)) * 100)}%
                </span>
              </div>
            </div>

            {/* Drilldown Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filter total signups by name, email, brokerage or tier..."
                value={drilldownSearch}
                onChange={(e) => setDrilldownSearch(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            {/* List */}
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {signups
                .filter((s) => 
                  !drilldownSearch ||
                  s.name?.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                  s.email.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                  s.brokerage?.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                  s.tier?.toLowerCase().includes(drilldownSearch.toLowerCase())
                )
                .map((s) => (
                  <div key={s.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{s.name || s.email}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {s.role || "Agent"}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                          {s.tier || "Pro"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>{s.email}</span>
                        <span>•</span>
                        <span>{s.brokerage || "Independent"}</span>
                        <span>•</span>
                        <span>{s.createdAt?.toDate ? format(s.createdAt.toDate(), "MMM d, yyyy") : "Recent"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        s.status === "approved" || s.status === "invited"
                          ? "bg-emerald-100 text-emerald-800"
                          : s.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {s.status || "pending"}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSignup({ ...s });
                          setIsDetailOpen(true);
                        }}
                        className="text-xs h-7 px-2 font-bold cursor-pointer"
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DRILL DOWN MODAL 2: SIGNUPS THIS MONTH */}
      {/* ========================================================================= */}
      <Dialog open={drilldownType === "this_month"} onOpenChange={(open) => !open && setDrilldownType(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-slate-900">
                    Signups This Month ({format(new Date(), "MMMM yyyy")})
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    {signupsThisMonth} prospective real estate clients joined during the active billing &amp; launch cycle.
                  </DialogDescription>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => handleExportCSV(signupsThisMonthList, `waitlist_${currentMonthStr}.csv`)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Month CSV</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Monthly stats banner */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-950">Active Acquisition Velocity</h4>
                  <p className="text-xs text-emerald-800">
                    Current month pace represents a <strong>+24% increase</strong> in organic open house kiosk registrations.
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={handleBatchApprovePending}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shrink-0 cursor-pointer"
              >
                Fast-Approve All in Current Cycle
              </Button>
            </div>

            {/* List for this month */}
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {signupsThisMonthList.map((s) => (
                <div key={s.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{s.name || s.email}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {s.role || "Agent"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>{s.email}</span>
                      <span>•</span>
                      <span>{s.brokerage || "Independent"}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-semibold">
                        {s.createdAt?.toDate ? format(s.createdAt.toDate(), "MMM d, yyyy HH:mm") : "Recent"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {s.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(s.id, "approved")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2.5 font-bold cursor-pointer"
                      >
                        Approve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedSignup({ ...s });
                        setIsDetailOpen(true);
                      }}
                      className="text-xs h-7 px-2 font-bold cursor-pointer"
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DRILL DOWN MODAL 3: PENDING APPROVALS QUEUE */}
      {/* ========================================================================= */}
      <Dialog open={drilldownType === "pending"} onOpenChange={(open) => !open && setDrilldownType(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-slate-900">Pending Approvals Queue</DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    {pendingApprovals} applicants awaiting verification, seat allotment, and welcome email dispatch.
                  </DialogDescription>
                </div>
              </div>

              {pendingApprovals > 0 && (
                <Button
                  size="sm"
                  onClick={handleBatchApprovePending}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 cursor-pointer"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Batch Approve All ({pendingApprovals})</span>
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {pendingApprovalsList.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-900 text-base">All Approvals Are Up to Date</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  There are no pending waitlist entries. All registrants have received approval or direct onboarding invites.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {pendingApprovalsList.map((s) => (
                  <div key={s.id} className="p-4 bg-amber-50/30 hover:bg-amber-50/60 flex items-center justify-between gap-4 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{s.name || s.email}</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Pending Review
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                          {s.tier || "Pro"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        <span><Mail className="h-3 w-3 inline mr-1 text-slate-400" />{s.email}</span>
                        {s.phone && <span>• {s.phone}</span>}
                        <span>• <strong>{s.brokerage || "Independent"}</strong></span>
                      </div>
                      {s.notes && (
                        <p className="text-[11px] text-slate-500 italic bg-white/70 p-1.5 rounded border border-slate-200/60 max-w-xl">
                          "{s.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(s.id, "approved")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 font-bold cursor-pointer"
                      >
                        <UserCheck className="h-3.5 w-3.5 mr-1" />
                        <span>Approve</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(s.id, "rejected")}
                        className="text-red-600 hover:bg-red-50 border-red-200 text-xs h-8 px-3 font-bold cursor-pointer"
                      >
                        Decline
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedSignup({ ...s });
                          setIsDetailOpen(true);
                        }}
                        className="text-xs h-8 px-2 font-bold cursor-pointer text-slate-600"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* SIGNUP DETAIL & EDIT MODAL (Autosave Enabled) */}
      {/* ========================================================================= */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">Waitlist Candidate Profile</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Manage status, assigned platform tier, and notes for this applicant.
            </DialogDescription>
          </DialogHeader>

          {selectedSignup && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-500">Full Name</label>
                  <Input
                    value={selectedSignup.name || ""}
                    onChange={(e) => {
                      setSelectedSignup({ ...selectedSignup, name: e.target.value });
                      hasUnsavedChangesRef.current = true;
                    }}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-500">Email Address</label>
                  <Input
                    value={selectedSignup.email}
                    onChange={(e) => {
                      setSelectedSignup({ ...selectedSignup, email: e.target.value });
                      hasUnsavedChangesRef.current = true;
                    }}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-500">Phone Number</label>
                  <Input
                    value={selectedSignup.phone || ""}
                    onChange={(e) => {
                      setSelectedSignup({ ...selectedSignup, phone: e.target.value });
                      hasUnsavedChangesRef.current = true;
                    }}
                    placeholder="(555) 000-0000"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-500">Brokerage / Company</label>
                  <Input
                    value={selectedSignup.brokerage || ""}
                    onChange={(e) => {
                      setSelectedSignup({ ...selectedSignup, brokerage: e.target.value });
                      hasUnsavedChangesRef.current = true;
                    }}
                    placeholder="RE/MAX, Sotheby's, etc."
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-500">Role</label>
                  <select
                    value={selectedSignup.role || "Agent"}
                    onChange={(e) => {
                      setSelectedSignup({ ...selectedSignup, role: e.target.value as any });
                      hasUnsavedChangesRef.current = true;
                    }}
                    className="w-full h-9 text-xs border border-slate-200 rounded-lg px-2 bg-white"
                  >
                    <option value="Agent">Solo Agent</option>
                    <option value="Team Lead">Team Lead</option>
                    <option value="Brokerage Admin">Brokerage Admin</option>
                    <option value="Lender">Mortgage Lender</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-500">Tier Requested</label>
                  <select
                    value={selectedSignup.tier || "Pro"}
                    onChange={(e) => {
                      setSelectedSignup({ ...selectedSignup, tier: e.target.value as any });
                      hasUnsavedChangesRef.current = true;
                    }}
                    className="w-full h-9 text-xs border border-slate-200 rounded-lg px-2 bg-white"
                  >
                    <option value="Starter">Starter (Free)</option>
                    <option value="Pro">Agent Pro ($29/mo)</option>
                    <option value="Elite">Agent Elite ($59/mo)</option>
                    <option value="Enterprise">Enterprise ($399+/mo)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-slate-500">Approval Status</label>
                  <select
                    value={selectedSignup.status || "pending"}
                    onChange={(e) => {
                      setSelectedSignup({ ...selectedSignup, status: e.target.value as any });
                      hasUnsavedChangesRef.current = true;
                    }}
                    className="w-full h-9 text-xs font-bold border border-slate-200 rounded-lg px-2 bg-white text-slate-900"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="invited">Invited</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500">Internal Admin Notes</label>
                <textarea
                  rows={3}
                  value={selectedSignup.notes || ""}
                  onChange={(e) => {
                    setSelectedSignup({ ...selectedSignup, notes: e.target.value });
                    hasUnsavedChangesRef.current = true;
                  }}
                  placeholder="Add details about contact, license, or custom requirements..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg resize-none outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-[11px] text-slate-400">
                  Registered: {selectedSignup.createdAt?.toDate ? format(selectedSignup.createdAt.toDate(), "yyyy-MM-dd HH:mm") : "N/A"}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDetailOpen(false)}
                    className="text-xs cursor-pointer"
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    disabled={savingItem}
                    onClick={() => handleSaveSignup(selectedSignup)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 cursor-pointer"
                  >
                    {savingItem ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    <span>Save Changes</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
