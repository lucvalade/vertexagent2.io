import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building,
  Users,
  Mic,
  ShieldCheck,
  Search,
  Filter,
  ArrowLeft,
  Eye,
  ExternalLink,
  QrCode,
  Edit,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Share2,
  CheckCircle2,
  Clock,
  MapPin,
  Bed,
  Bath,
  ArrowUpDown,
  FileSpreadsheet,
  Zap,
  Phone,
  Mail,
  UserCheck,
  Volume2,
  Home
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ListingPerformanceItem {
  id: string;
  title: string;
  address: string;
  city: string;
  province?: string;
  price: string;
  priceNum: number;
  beds: number;
  baths: number;
  sqft?: number;
  status: "Active Open House" | "Active Tour" | "Scheduled Open House" | "Expired" | "Under Contract";
  image: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  brokerage: string;
  pairedLender: string;
  leadsCaptured: number;
  tourListens: number;
  mortgageConsent: number;
  conversionRate: number;
  lastEventDate?: string;
}

const DEFAULT_PERFORMANCE_LISTINGS: ListingPerformanceItem[] = [
  {
    id: "lst-101",
    title: "742 Evergreen Terrace",
    address: "742 Evergreen Terrace",
    city: "Springfield",
    province: "OR",
    price: "$1,250,000",
    priceNum: 1250000,
    beds: 4,
    baths: 3.5,
    sqft: 3200,
    status: "Active Open House",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80",
    agentId: "agent-001",
    agentName: "Danielle Vance",
    agentAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    brokerage: "Vertex Agent Group",
    pairedLender: "Aether Mortgage Solutions (Marcus Sterling)",
    leadsCaptured: 64,
    tourListens: 280,
    mortgageConsent: 42,
    conversionRate: 41.2,
    lastEventDate: "Aug 16, 2026"
  },
  {
    id: "lst-102",
    title: "1840 Ocean Avenue, Apt 4B",
    address: "1840 Ocean Avenue, Apt 4B",
    city: "Santa Monica",
    province: "CA",
    price: "$2,890,000",
    priceNum: 2890000,
    beds: 3,
    baths: 3,
    sqft: 2450,
    status: "Active Open House",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format&fit=crop&q=80",
    agentId: "agent-002",
    agentName: "Marcus Sterling",
    agentAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    brokerage: "Aether & Horizon Luxury Global",
    pairedLender: "Horizon Capital Lenders",
    leadsCaptured: 48,
    tourListens: 195,
    mortgageConsent: 31,
    conversionRate: 44.6,
    lastEventDate: "Aug 15, 2026"
  },
  {
    id: "lst-103",
    title: "512 Pinecrest Boulevard",
    address: "512 Pinecrest Boulevard",
    city: "Denver",
    province: "CO",
    price: "$875,000",
    priceNum: 875000,
    beds: 3,
    baths: 2,
    sqft: 1950,
    status: "Active Tour",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&auto=format&fit=crop&q=80",
    agentId: "agent-003",
    agentName: "Sarah Jenkins",
    agentAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    brokerage: "Pinnacle Residential Realty",
    pairedLender: "Pinnacle Home Loans",
    leadsCaptured: 38,
    tourListens: 140,
    mortgageConsent: 22,
    conversionRate: 35.8,
    lastEventDate: "Aug 12, 2026"
  },
  {
    id: "lst-104",
    title: "920 Highland Estates Court",
    address: "920 Highland Estates Court",
    city: "Scottsdale",
    province: "AZ",
    price: "$3,450,000",
    priceNum: 3450000,
    beds: 5,
    baths: 5.5,
    sqft: 4800,
    status: "Scheduled Open House",
    image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=600&auto=format&fit=crop&q=80",
    agentId: "agent-001",
    agentName: "Danielle Vance",
    agentAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    brokerage: "Vertex Agent Group",
    pairedLender: "Aether Mortgage Solutions (Marcus Sterling)",
    leadsCaptured: 34,
    tourListens: 110,
    mortgageConsent: 19,
    conversionRate: 39.4,
    lastEventDate: "Aug 22, 2026"
  },
  {
    id: "lst-105",
    title: "310 Bellevue Heights",
    address: "310 Bellevue Heights",
    city: "Seattle",
    province: "WA",
    price: "$1,620,000",
    priceNum: 1620000,
    beds: 4,
    baths: 3,
    sqft: 2850,
    status: "Active Open House",
    image: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=600&auto=format&fit=crop&q=80",
    agentId: "agent-004",
    agentName: "Robert Chen",
    agentAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    brokerage: "Century Premier Realty",
    pairedLender: "Pacific Mortgage Group",
    leadsCaptured: 29,
    tourListens: 88,
    mortgageConsent: 14,
    conversionRate: 32.5,
    lastEventDate: "Aug 14, 2026"
  },
  {
    id: "lst-106",
    title: "1445 Sunset Plaza Drive",
    address: "1445 Sunset Plaza Drive",
    city: "Los Angeles",
    province: "CA",
    price: "$4,150,000",
    priceNum: 4150000,
    beds: 4,
    baths: 4.5,
    sqft: 4100,
    status: "Active Tour",
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&auto=format&fit=crop&q=80",
    agentId: "agent-002",
    agentName: "Marcus Sterling",
    agentAvatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    brokerage: "Aether & Horizon Luxury Global",
    pairedLender: "Horizon Capital Lenders",
    leadsCaptured: 56,
    tourListens: 310,
    mortgageConsent: 37,
    conversionRate: 46.8,
    lastEventDate: "Aug 16, 2026"
  }
];

export default function AgentListingsPerformance() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialAgentId = searchParams.get("agentId") || "all";
  const initialListingId = searchParams.get("listingId") || "";

  const [listings, setListings] = useState<ListingPerformanceItem[]>(DEFAULT_PERFORMANCE_LISTINGS);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(initialAgentId);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"leads" | "listens" | "mortgage" | "price" | "latest">("leads");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selectedDetailListing, setSelectedDetailListing] = useState<ListingPerformanceItem | null>(null);

  // Sync state if searchParams change
  useEffect(() => {
    const agentParam = searchParams.get("agentId");
    if (agentParam) {
      setSelectedAgentId(agentParam);
    }
    const listingParam = searchParams.get("listingId");
    if (listingParam) {
      const match = listings.find(l => l.id === listingParam);
      if (match) {
        setSelectedDetailListing(match);
      }
    }
  }, [searchParams]);

  // Load Firestore listings and merge with performance tracking
  useEffect(() => {
    async function loadDbListings() {
      try {
        const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const dbItems: ListingPerformanceItem[] = snapshot.docs.map((docSnap, index) => {
            const data = docSnap.data();
            const fallbackItem = DEFAULT_PERFORMANCE_LISTINGS[index % DEFAULT_PERFORMANCE_LISTINGS.length];
            return {
              id: docSnap.id,
              title: data.address || data.title || fallbackItem.title,
              address: data.address || fallbackItem.address,
              city: data.city || fallbackItem.city,
              province: data.province || fallbackItem.province,
              price: data.price ? `$${Number(data.price).toLocaleString()}` : fallbackItem.price,
              priceNum: data.price ? Number(data.price) : fallbackItem.priceNum,
              beds: data.beds !== undefined ? Number(data.beds) : fallbackItem.beds,
              baths: data.baths !== undefined ? Number(data.baths) : fallbackItem.baths,
              sqft: data.sqft ? Number(data.sqft) : fallbackItem.sqft,
              status: (data.status === "Active" ? "Active Open House" : (data.status || fallbackItem.status)) as any,
              image: data.images?.[0]?.url || (typeof data.images?.[0] === "string" ? data.images[0] : fallbackItem.image),
              agentId: data.agentId || fallbackItem.agentId,
              agentName: data.agentName || fallbackItem.agentName,
              agentAvatar: data.agentAvatar || fallbackItem.agentAvatar,
              brokerage: data.brokerage || fallbackItem.brokerage,
              pairedLender: data.pairedLender || fallbackItem.pairedLender,
              leadsCaptured: data.leadsCount !== undefined ? data.leadsCount : fallbackItem.leadsCaptured,
              tourListens: data.tourListens !== undefined ? data.tourListens : fallbackItem.tourListens,
              mortgageConsent: data.mortgageCount !== undefined ? data.mortgageCount : fallbackItem.mortgageConsent,
              conversionRate: data.conversionRate !== undefined ? data.conversionRate : fallbackItem.conversionRate,
              lastEventDate: data.openHouseDate || fallbackItem.lastEventDate
            };
          });

          // Combine db items with default items if db has fewer items
          if (dbItems.length >= 3) {
            setListings(dbItems);
          } else {
            const merged = [...dbItems, ...DEFAULT_PERFORMANCE_LISTINGS.filter(d => !dbItems.some(i => i.id === d.id))];
            setListings(merged);
          }
        }
      } catch (err) {
        console.log("Using default listings performance dataset");
      }
    }

    loadDbListings();
  }, []);

  // Filtered and Sorted Listings
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      // Agent filter
      if (selectedAgentId !== "all" && item.agentId !== selectedAgentId && !item.agentName.toLowerCase().includes(selectedAgentId.toLowerCase())) {
        return false;
      }
      // Status filter
      if (selectedStatus !== "all" && item.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchAddress = item.address.toLowerCase().includes(q);
        const matchCity = item.city.toLowerCase().includes(q);
        const matchAgent = item.agentName.toLowerCase().includes(q);
        const matchLender = item.pairedLender.toLowerCase().includes(q);
        if (!matchTitle && !matchAddress && !matchCity && !matchAgent && !matchLender) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "leads") return b.leadsCaptured - a.leadsCaptured;
      if (sortBy === "listens") return b.tourListens - a.tourListens;
      if (sortBy === "mortgage") return b.mortgageConsent - a.mortgageConsent;
      if (sortBy === "price") return b.priceNum - a.priceNum;
      return 0;
    });
  }, [listings, selectedAgentId, selectedStatus, searchQuery, sortBy]);

  // Aggregate Metrics
  const totalListingsCount = filteredListings.length;
  const totalLeadsCaptured = filteredListings.reduce((sum, item) => sum + item.leadsCaptured, 0);
  const totalTourListens = filteredListings.reduce((sum, item) => sum + item.tourListens, 0);
  const totalMortgageConsent = filteredListings.reduce((sum, item) => sum + item.mortgageConsent, 0);
  const avgConversionRate = totalLeadsCaptured > 0 
    ? ((totalMortgageConsent / totalLeadsCaptured) * 100).toFixed(1) 
    : "0.0";

  // Unique Agent list for filter dropdown
  const uniqueAgents = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    listings.forEach((l) => {
      map.set(l.agentId, { id: l.agentId, name: l.agentName });
    });
    return Array.from(map.values());
  }, [listings]);

  const handleExportCsv = () => {
    const headers = ["Listing Title", "Address", "City", "Price", "Agent", "Brokerage", "Status", "Leads Captured", "Tour Listens", "Mortgage Consents", "Conversion Rate %", "Paired Lender"];
    const rows = filteredListings.map(l => [
      `"${l.title}"`,
      `"${l.address}"`,
      `"${l.city}"`,
      `"${l.price}"`,
      `"${l.agentName}"`,
      `"${l.brokerage}"`,
      `"${l.status}"`,
      l.leadsCaptured,
      l.tourListens,
      l.mortgageConsent,
      l.conversionRate,
      `"${l.pairedLender}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Agent_Listings_Performance_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Listings performance CSV report exported!");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <Link to="/app/admin/agent-360" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Agent 360</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-extrabold">Top Agent Listings &amp; Open House Performance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Building className="h-7 w-7 text-blue-600" />
            <span>Top Agent Listings &amp; Open House Performance</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Live analytics per property listing tracking <strong className="text-blue-600 font-bold">Captured Leads</strong>, <strong className="text-purple-600 font-bold">Sora AI Voice Listens</strong>, and <strong className="text-emerald-600 font-bold">Mortgage Financing Consents</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-9 gap-1.5 font-bold text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={() => navigate("/app/listings/edit")}
            className="h-9 gap-1.5 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>+ Create Listing</span>
          </Button>
        </div>
      </div>

      {/* TOP AGGREGATE KPI MINI CARDS BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Listings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Monitored Listings</span>
            <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{totalListingsCount}</span>
            <span className="text-xs text-slate-400 font-semibold ml-2">properties</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            <span>{filteredListings.filter(l => l.status.includes("Active")).length} Active Open Houses</span>
          </div>
        </div>

        {/* Card 2: Total Leads Captured */}
        <div 
          onClick={() => navigate("/app/leads")}
          className="bg-white rounded-2xl border border-blue-100 p-4 shadow-xs relative overflow-hidden hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800">Total Leads Captured</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-600">{totalLeadsCaptured}</span>
            <span className="text-xs text-blue-400 font-semibold ml-2">attendees</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-blue-700">
            <span>Avg {(totalLeadsCaptured / (totalListingsCount || 1)).toFixed(1)} per listing</span>
            <span className="group-hover:translate-x-0.5 transition-transform text-blue-600">View Leads →</span>
          </div>
        </div>

        {/* Card 3: Total Tour Listens */}
        <div 
          onClick={() => navigate("/app/aitours")}
          className="bg-white rounded-2xl border border-purple-100 p-4 shadow-xs relative overflow-hidden hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800">Sora AI Tour Listens</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <Volume2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-600">{totalTourListens}</span>
            <span className="text-xs text-purple-400 font-semibold ml-2">audio sessions</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-purple-700">
            <span>Voice chapter walkthroughs</span>
            <span className="group-hover:translate-x-0.5 transition-transform text-purple-600">Explore Tours →</span>
          </div>
        </div>

        {/* Card 4: Mortgage Opt-In Consents */}
        <div 
          onClick={() => navigate("/app/lenders")}
          className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-xs relative overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Mortgage Consents</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{totalMortgageConsent}</span>
            <span className="text-xs text-emerald-500 font-semibold ml-2">opted in ({avgConversionRate}%)</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-emerald-700">
            <span>Routed to paired lenders</span>
            <span className="group-hover:translate-x-0.5 transition-transform text-emerald-600">Lender Queue →</span>
          </div>
        </div>
      </div>

      {/* FILTER & CONTROL BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by listing address, MLS #, city, or agent name..."
              className="pl-9 bg-slate-50/70 border-slate-200 text-xs font-medium h-9.5 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Controls: Agent Filter, Status Filter, Sort, View Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Agent Select */}
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="h-9.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Agents ({listings.length} listings)</option>
              {uniqueAgents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name}
                </option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Active Open House">Active Open House</option>
              <option value="Active Tour">Active Tour</option>
              <option value="Scheduled Open House">Scheduled</option>
              <option value="Expired">Expired</option>
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="leads">Sort: Most Leads Captured</option>
              <option value="listens">Sort: Most Tour Listens</option>
              <option value="mortgage">Sort: Most Mortgage Consents</option>
              <option value="price">Sort: Highest Price</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === "cards"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Cards View
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Table View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LISTINGS DISPLAY */}
      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <Building className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No matching property listings found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or agent selection to see active performance records.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedAgentId("all");
              setSelectedStatus("all");
            }}
            className="text-xs font-bold cursor-pointer"
          >
            Reset Filters
          </Button>
        </div>
      ) : viewMode === "cards" ? (
        /* CARDS GRID VIEW WITH DEDICATED MINI CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              {/* Card Image Area */}
              <div 
                className="relative h-48 overflow-hidden bg-slate-100 cursor-pointer"
                onClick={() => setSelectedDetailListing(item)}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.id}/600/400`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                {/* Status Badge */}
                <span className="absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-900/85 text-white backdrop-blur-md border border-white/20 shadow-xs">
                  {item.status}
                </span>

                {/* Price Tag */}
                <span className="absolute bottom-3 right-3 text-sm font-black px-3 py-1 rounded-lg bg-blue-600 text-white shadow-md">
                  {item.price}
                </span>

                {/* Agent Attribution Pill */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-lg text-white text-[11px] font-bold border border-white/10">
                  <img
                    src={item.agentAvatar}
                    alt={item.agentName}
                    className="h-4 w-4 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";
                    }}
                  />
                  <span className="truncate max-w-[130px]">{item.agentName}</span>
                </div>
              </div>

              {/* Title & Address */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 
                      onClick={() => setSelectedDetailListing(item)}
                      className="text-sm font-extrabold text-slate-900 line-clamp-1 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>{item.city}{item.province ? `, ${item.province}` : ""}</span>
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-600 font-medium mt-2 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-bold text-slate-700">
                      <Bed className="h-3.5 w-3.5 text-slate-400" /> {item.beds} Beds
                    </span>
                    <span className="flex items-center gap-1 font-bold text-slate-700">
                      <Bath className="h-3.5 w-3.5 text-slate-400" /> {item.baths} Baths
                    </span>
                    {item.sqft && (
                      <span className="text-slate-500 font-medium">
                        {item.sqft.toLocaleString()} sqft
                      </span>
                    )}
                  </div>
                </div>

                {/* THE 3 PROMINENT MINI CARDS: LEADS, LISTENS, MORTGAGE */}
                <div className="space-y-1.5 pt-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Performance Metrics</span>
                    <span className="text-emerald-600 font-bold">{item.conversionRate}% Financing Conv.</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Mini Card 1: Leads */}
                    <div
                      onClick={() => navigate(`/app/leads?listingId=${item.id}`)}
                      className="bg-blue-50/80 hover:bg-blue-100 border border-blue-100 hover:border-blue-300 p-2 rounded-xl text-center transition-all cursor-pointer group/lead relative"
                      title="Click to inspect captured leads"
                    >
                      <span className="text-[10px] font-extrabold text-blue-700 flex items-center justify-center gap-1">
                        <Users className="h-3 w-3 text-blue-600" />
                        <span>Leads</span>
                      </span>
                      <strong className="block text-base font-black text-blue-900 mt-0.5">
                        {item.leadsCaptured}
                      </strong>
                      <span className="text-[9px] font-bold text-blue-600/90 block">Captured</span>
                    </div>

                    {/* Mini Card 2: Listens */}
                    <div
                      onClick={() => navigate(`/app/listings/${item.id}`)}
                      className="bg-purple-50/80 hover:bg-purple-100 border border-purple-100 hover:border-purple-300 p-2 rounded-xl text-center transition-all cursor-pointer group/tour relative"
                      title="Click to view Sora AI Voice Tour"
                    >
                      <span className="text-[10px] font-extrabold text-purple-700 flex items-center justify-center gap-1">
                        <Mic className="h-3 w-3 text-purple-600" />
                        <span>Listens</span>
                      </span>
                      <strong className="block text-base font-black text-purple-900 mt-0.5">
                        {item.tourListens}
                      </strong>
                      <span className="text-[9px] font-bold text-purple-600/90 block">Sora Audio</span>
                    </div>

                    {/* Mini Card 3: Mortgage */}
                    <div
                      onClick={() => navigate(`/app/lenders`)}
                      className="bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-300 p-2 rounded-xl text-center transition-all cursor-pointer group/mortgage relative"
                      title="Click to view Paired Lender routing"
                    >
                      <span className="text-[10px] font-extrabold text-emerald-700 flex items-center justify-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        <span>Mortgage</span>
                      </span>
                      <strong className="block text-base font-black text-emerald-900 mt-0.5">
                        {item.mortgageConsent}
                      </strong>
                      <span className="text-[9px] font-bold text-emerald-600/90 block">Opted In</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/app/listings/${item.id}`)}
                    className="h-8 text-[11px] font-bold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border-slate-200 px-2 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1 text-blue-600" /> Tour
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/app/openhouses`)}
                    className="h-8 text-[11px] font-bold bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border-slate-200 px-2 cursor-pointer"
                  >
                    <Home className="h-3.5 w-3.5 mr-1 text-purple-600" /> Kiosk
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDetailListing(item)}
                    className="h-8 text-[11px] font-bold bg-slate-50 hover:bg-slate-100 border-slate-200 px-2 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-600" /> Insights
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW WITH INTERACTIVE LEAD/LISTEN/MORTGAGE METRICS */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Property &amp; Address</th>
                  <th className="py-3.5 px-4">Agent / Brokerage</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center text-blue-700">Leads</th>
                  <th className="py-3.5 px-4 text-center text-purple-700">Listens</th>
                  <th className="py-3.5 px-4 text-center text-emerald-700">Mortgage</th>
                  <th className="py-3.5 px-4">Paired Lender</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredListings.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setSelectedDetailListing(item)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-10 w-12 rounded-lg object-cover border border-slate-200 shadow-2xs"
                        />
                        <div>
                          <strong className="text-slate-900 font-bold block line-clamp-1">{item.title}</strong>
                          <span className="text-[11px] text-slate-400">{item.city}, {item.province}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={item.agentAvatar}
                          alt={item.agentName}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                        <div>
                          <strong className="text-slate-900 font-bold block">{item.agentName}</strong>
                          <span className="text-[10px] text-slate-400">{item.brokerage}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-black text-slate-900">
                      {item.price}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        {item.status}
                      </span>
                    </td>

                    {/* Leads Column */}
                    <td className="py-3.5 px-4 text-center">
                      <span 
                        onClick={(e) => { e.stopPropagation(); navigate(`/app/leads?listingId=${item.id}`); }}
                        className="inline-flex items-center justify-center font-black text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {item.leadsCaptured}
                      </span>
                    </td>

                    {/* Listens Column */}
                    <td className="py-3.5 px-4 text-center">
                      <span 
                        onClick={(e) => { e.stopPropagation(); navigate(`/app/listings/${item.id}`); }}
                        className="inline-flex items-center justify-center font-black text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        {item.tourListens}
                      </span>
                    </td>

                    {/* Mortgage Column */}
                    <td className="py-3.5 px-4 text-center">
                      <span 
                        onClick={(e) => { e.stopPropagation(); navigate(`/app/lenders`); }}
                        className="inline-flex items-center justify-center font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        {item.mortgageConsent}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-[160px] truncate">
                      {item.pairedLender}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`/app/listings/${item.id}`)}
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          title="View Tour"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`/app/listings/edit/${item.id}`)}
                          className="h-8 w-8 text-slate-600 hover:bg-slate-100"
                          title="Edit Listing"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL FOR PROPERTY LISTING INSIGHTS */}
      {selectedDetailListing && (
        <Dialog open={!!selectedDetailListing} onOpenChange={(open) => !open && setSelectedDetailListing(null)}>
          <DialogContent className="max-w-2xl bg-white p-6 rounded-2xl">
            <DialogHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {selectedDetailListing.status}
                </span>
                <span className="text-xs font-black text-blue-600">{selectedDetailListing.price}</span>
              </div>
              <DialogTitle className="text-lg font-black text-slate-900">
                {selectedDetailListing.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {selectedDetailListing.address}, {selectedDetailListing.city}, {selectedDetailListing.province} &bull; Represented by <strong className="text-slate-800 font-bold">{selectedDetailListing.agentName}</strong> ({selectedDetailListing.brokerage})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="relative h-44 rounded-xl overflow-hidden">
                <img
                  src={selectedDetailListing.image}
                  alt={selectedDetailListing.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 3 Prominent Modal Metrics */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl">
                  <span className="text-xs font-bold text-blue-700 block">Total Leads Captured</span>
                  <strong className="text-2xl font-black text-blue-900">{selectedDetailListing.leadsCaptured}</strong>
                  <span className="text-[10px] text-blue-600 block mt-0.5">Kiosk &amp; QR Entries</span>
                </div>

                <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl">
                  <span className="text-xs font-bold text-purple-700 block">Sora Voice Listens</span>
                  <strong className="text-2xl font-black text-purple-900">{selectedDetailListing.tourListens}</strong>
                  <span className="text-[10px] text-purple-600 block mt-0.5">Walkthrough Audio</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                  <span className="text-xs font-bold text-emerald-700 block">Mortgage Consents</span>
                  <strong className="text-2xl font-black text-emerald-900">{selectedDetailListing.mortgageConsent}</strong>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">{selectedDetailListing.conversionRate}% Opt-in Rate</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Paired Mortgage Specialist:</span>
                  <strong className="font-bold text-slate-800">{selectedDetailListing.pairedLender}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Last Open House Event:</span>
                  <strong className="font-bold text-slate-800">{selectedDetailListing.lastEventDate || "Recently Active"}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">CRM Sync Route:</span>
                  <strong className="font-bold text-emerald-700">Follow Up Boss (Tagged #fub-mortgage-interest)</strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDetailListing(null)}
                  className="text-xs font-bold cursor-pointer"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedDetailListing(null);
                    navigate(`/app/leads?listingId=${selectedDetailListing.id}`);
                  }}
                  className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  View All Captured Leads ({selectedDetailListing.leadsCaptured}) →
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
