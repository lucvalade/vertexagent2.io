import { useAuth } from "@/hooks/useAuth";
import { getUserListings, getAllListings, deleteListingOp, Listing, createListing, updateListing, getAgent } from "@/lib/api";
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  MapPin, 
  Bed, 
  Bath, 
  Trash2, 
  Edit, 
  ExternalLink, 
  QrCode, 
  Sparkles,
  Eye,
  MoreVertical,
  Layout,
  Calendar,
  ChevronDown,
  Copy as CopyIcon,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import SharedListingModal from "@/components/SharedListingModal";

import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

function formatDate(dateStr: string) {
  if (!dateStr) return "Jun 15, 2026";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Try MM-DD-YYYY
  const matchMMDDYYYY = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (matchMMDDYYYY) {
    const [_, month, day, year] = matchMMDDYYYY;
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${parseInt(day, 10)}, ${year}`;
    }
  }

  // Try YYYY-MM-DD
  const matchYYYYMMDD = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchYYYYMMDD) {
    const [_, year, month, day] = matchYYYYMMDD;
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${parseInt(day, 10)}, ${year}`;
    }
  }

  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
  } catch (e) {}
  return dateStr;
}

function formatTime12h(timeStr: string) {
  if (!timeStr) return "";
  let match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let [_, hours, minutes] = match;
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${minutes} ${ampm}`;
  }
  match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)$/i);
  if (match) {
    let [_, hours, minutes, ampm] = match;
    let h = parseInt(hours, 10);
    return `${h}:${minutes} ${ampm.toUpperCase()}`;
  }
  return timeStr;
}

export function cleanAddress(address: string, id?: string) {
  if (!address) return '';
  let clean = address;
  if (id) {
    const idEscaped = id.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(idEscaped, 'gi');
    clean = clean.replace(regex, '');
  }
  clean = clean.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '');
  clean = clean.replace(/^\s*[\(\[\]\)\-\/\|:]\s*|\s*[\(\[\]\)\-\/\|:]\s*$/g, '').trim();
  clean = clean.replace(/\s*[\(\[\]\)\-\/\|:]\s*/g, ' ').trim();
  clean = clean.replace(/\s+/g, ' ');
  return clean || address;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [qrListing, setQrListing] = useState<Listing | null>(null);
  const [qrForeground, setQrForeground] = useState("#2563eb");
  const [qrBgColor, setQrBgColor] = useState("#ffffff");
  const [qrBrandingOption, setQrBrandingOption] = useState<"logo" | "photo" | "none">("none");
  const [showNoImageConfirm, setShowNoImageConfirm] = useState(false);
  const [agentBranding, setAgentBranding] = useState<any>(null);

  useEffect(() => {
    if (qrListing) {
      setQrBrandingOption(qrListing.qrBrandingOption || "none");
    }
  }, [qrListing]);

  useEffect(() => {
    if (qrListing) {
      const brokerageLogo = agentBranding?.imageUrl || agentBranding?.logoUrl || "";
      const agentPhoto = agentBranding?.agentPhotoUrl || "";
      if (!brokerageLogo && !agentPhoto) {
        toast.error("⚠️ Neither a Company Logo nor an Agent Photo was found in your settings. Redirecting to Branding & UI setup...");
        setQrListing(null);
        navigate("/app/settings");
      }
    }
  }, [qrListing, agentBranding, navigate]);
  const [openHouseEvents, setOpenHouseEvents] = useState<any[]>([]);
  const [shareListing, setShareListing] = useState<Listing | null>(null);
  const [sharedModalListing, setSharedModalListing] = useState<Listing | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteAddress, setDeleteAddress] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(3);
  const [layoutCols, setLayoutCols] = useState<2 | 3>(3);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");

  async function handleDuplicateListing(listing: Listing) {
    const toastId = toast.loading("Duplicating property listing asset...");
    try {
      const duplicated: Listing = {
        ...listing,
        id: crypto.randomUUID(),
        address: `${listing.address} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await createListing(duplicated);
      toast.success("Property listing duplicated successfully!", { id: toastId });
      loadListings();
    } catch (err: any) {
      toast.error(`Duplication failed: ${err.message}`, { id: toastId });
    }
  }

  useEffect(() => {
    if (user) {
      loadListings();
      loadAgentBranding();
    }
    loadOpenHouses();
  }, [user]);

  function loadOpenHouses() {
    try {
      const stored = localStorage.getItem("open_house_events");
      if (stored) {
        setOpenHouseEvents(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadAgentBranding() {
    if (!user?.id) return;
    try {
      const data = await getAgent(user.id);
      if (data?.branding) {
        setAgentBranding(data.branding);
      }
    } catch (err) {
      console.error("Failed to load agent branding:", err);
    }
  }

  useEffect(() => {
    if (location.state?.showAll && listings.length > 0) {
      setVisibleCount(listings.length);
    }
  }, [location.state, listings.length]);

  async function loadListings() {
    setLoading(true);
    try {
      if (!user) return;
      const isAdmin = (user as any).role === 'ADMIN';
      const data = isAdmin ? await getAllListings() : await getUserListings(user.id);
      setListings(data || []);
    } catch (err) {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedHighEndListings() {
    if (!user) return;
    setSeeding(true);
    try {
      const listing1: Listing = {
        id: crypto.randomUUID(),
        ownerId: user.id,
        address: "888 Bel Air Rd",
        city: "Los Angeles",
        province: "CA",
        postalCode: "90077",
        country: "US",
        originatingSystemName: "TheMLS",
        price: 28500000,
        beds: 7,
        baths: 11,
        description: "An architectural masterpiece in Bel Air. This extraordinary estate offers unparalleled ocean and city views. Features include a zero-edge infinity pool, a 20-seat home theater, a wine cellar holding 2,000 bottles, and a state-of-the-art wellness spa with a sauna and massage room. The modern minimalist design blends seamlessly with luxurious finishes throughout.",
        images: [
          "https://picsum.photos/seed/belairestate/1200/800",
          "https://picsum.photos/seed/belairliving/1200/800",
          "https://picsum.photos/seed/belairbed/1200/800"
        ],
        talkingPoints: ["Infinity pool with LA city views", "20-seat home theater", "Wellness spa and sauna", "2000-bottle wine cellar"],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const listing2: Listing = {
        id: crypto.randomUUID(),
        ownerId: user.id,
        address: "15 Central Park West, Penthouse 40",
        city: "New York",
        province: "NY",
        postalCode: "10023",
        country: "US",
        originatingSystemName: "OneKey MLS",
        price: 45000000,
        beds: 5,
        baths: 6,
        description: "A sky-high sanctuary overlooking Central Park. This full-floor penthouse features 14-foot ceilings, floor-to-ceiling windows, and a private wraparound terrace. The chef's kitchen features imported Italian marble and top-of-the-line Gaggenau appliances. Smart-home integration throughout allows seamless control of lighting, climate, and security. The building offers white-glove service including a private dining room, health club, and 75-foot pool.",
        images: [
          "https://picsum.photos/seed/nycpenthouse/1200/800",
          "https://picsum.photos/seed/nycliving/1200/800",
          "https://picsum.photos/seed/nycbed/1200/800"
        ],
        talkingPoints: ["Unobstructed Central Park views", "Private wraparound terrace", "Floor-to-ceiling windows", "Imported Italian marble kitchen"],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await createListing(listing1);
      await createListing(listing2);
      toast.success("High-end sample listings seeded successfully!");
      loadListings();
    } catch (err) {
      toast.error("Failed to seed listings");
      console.error(err);
    } finally {
      setSeeding(false);
    }
  }

  async function trackShareActivity(listingId: string, type: 'QR' | 'SOCIAL') {
    if (!user) return;
    try {
      const logData = {
        type: "SHARE_ACTIVITY",
        listingId,
        shareType: type,
        agentId: user.id,
        agentEmail: user.email,
        timestamp: Date.now(),
        clientTime: new Date().toISOString()
      };
      // Log to system_logs
      await addDoc(collection(db, "system_logs"), {
        type: "SHARE_CLICK",
        message: `${type} Link Generated for Listing ${listingId} by ${user.email}`,
        timestamp: serverTimestamp(),
        details: logData
      });
      console.log(`Tracked ${type} share for ${listingId}`);
    } catch (err) {
      console.error("Failed to track share activity:", err);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteListingOp(deleteId);
      
      // Clean up local open house events
      try {
        const saved = localStorage.getItem("open_house_events");
        if (saved) {
          const events = JSON.parse(saved);
          const filtered = events.filter((evt: any) => evt.listingId !== deleteId);
          localStorage.setItem("open_house_events", JSON.stringify(filtered));
          setOpenHouseEvents(filtered);
        }
      } catch (e) {
        console.error(e);
      }

      toast.success("Listing deleted");
      setListings(prev => prev.filter(l => l.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      toast.error("Failed to delete listing");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Your Listings</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <Skeleton key={'skeleton-' + i} className="h-64 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Listings</h1>
          <p className="text-slate-500 mt-1">Manage and create AI-powered listing tours.</p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="outline" size="sm" className="h-9 gap-2 font-bold bg-white border-slate-200 shadow-sm transition-all hover:bg-slate-50">
                  <span className="text-slate-500 font-normal">Sort:</span>
                  <span className="capitalize">{sortOrder}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-40 p-1 rounded-xl shadow-lg border-slate-200">
                <DropdownMenuItem 
                  onClick={() => setSortOrder("latest")} 
                  className={`flex items-center justify-between cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-bold ${sortOrder === "latest" ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  Latest
                  {sortOrder === "latest" && <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortOrder("oldest")} 
                  className={`flex items-center justify-between cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-bold ${sortOrder === "oldest" ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  Oldest
                  {sortOrder === "oldest" && <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="outline" size="sm" className="h-9 gap-2 font-bold bg-white border-slate-200 shadow-sm transition-all hover:bg-slate-50">
                  <Layout className="h-4 w-4 text-blue-600" />
                  <span>{layoutCols} Columns</span>
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem 
                  onClick={() => setLayoutCols(2)} 
                  className={`flex items-center justify-between cursor-pointer ${layoutCols === 2 ? "bg-blue-50 text-blue-700 font-bold" : ""}`}
                >
                  2 Columns
                  {layoutCols === 2 && <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLayoutCols(3)} 
                  className={`flex items-center justify-between cursor-pointer ${layoutCols === 3 ? "bg-blue-50 text-blue-700 font-bold" : ""}`}
                >
                  3 Columns
                  {layoutCols === 3 && <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/app/listings/edit")} className="gap-2 bg-[#155dfc] hover:bg-[#155dfc]/90 text-white shadow-md shadow-blue-200 transition-all">
              <Plus className="h-4 w-4" /> New Listing
            </Button>
          </div>
        </div>
      </div>

      {listings.length === 0 ? (
        <Card className="flex flex-col items-center justify-center h-64 text-center p-6 border-dashed">
          <div className="rounded-full bg-slate-100 p-3 mb-4">
            <Plus className="h-6 w-6 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium">No listings yet</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4 max-w-sm">
            Create your first property listing to generate an interactive AI talking tour.
          </p>
          <Button onClick={() => navigate("/app/listings/edit")}>Create Listing</Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by property address or MLS number..."
                className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setAppliedQuery(searchQuery);
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setAppliedQuery(searchQuery)}
                className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all"
              >
                Search
              </Button>
              {appliedQuery && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setAppliedQuery("");
                  }}
                  className="h-10 px-3 bg-white border-slate-200 text-slate-500 rounded-xl text-xs sm:text-sm hover:bg-slate-50 shadow-sm"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {(() => {
            const uniqueRaw = Array.from(new Map(listings.map(l => [l.id, l])).values());
            const filtered = uniqueRaw.filter(listing => {
              if (!appliedQuery) return true;
              const query = appliedQuery.toLowerCase();
              const addressMatch = (listing.address || "").toLowerCase().includes(query);
              const mlsMatch = (listing.mlsNumber || "").toLowerCase().includes(query);
              return addressMatch || mlsMatch;
            });

            if (filtered.length === 0) {
              return (
                <Card className="flex flex-col items-center justify-center h-64 text-center p-6 border-dashed">
                  <MapPin className="h-8 w-8 text-slate-400 mb-2" />
                  <h3 className="text-lg font-medium">No matches found</h3>
                  <p className="text-sm text-slate-500 mt-1 mb-4 max-w-sm">
                    We couldn't find any listings matching "{appliedQuery}". Try checking for typos or clear the search.
                  </p>
                  <Button onClick={() => { setSearchQuery(""); setAppliedQuery(""); }}>Clear Search</Button>
                </Card>
              );
            }

            const sorted = [...filtered].sort((a, b) => {
              const timeA = a.createdAt || 0;
              const timeB = b.createdAt || 0;
              return sortOrder === "latest" ? timeB - timeA : timeA - timeB;
            });

            return (
              <div className="space-y-8">
                <div className={`grid gap-6 sm:grid-cols-2 ${layoutCols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2 max-w-5xl'}`}>
                  {sorted.slice(0, visibleCount).map(listing => (
                    <Card key={'listing-' + listing.id} className="overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300 border border-slate-200 hover-blue-pulse">
                      <div 
                        className="h-48 bg-slate-100 relative cursor-pointer overflow-hidden"
                        onClick={() => navigate(`/app/listings/${listing.id}`)}
                      >
                        {listing.images && listing.images.length > 0 ? (
                          <img 
                            src={typeof listing.images[0] === 'string' ? listing.images[0] : listing.images[0].url} 
                            alt={cleanAddress(listing.address, listing.id)} 
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://picsum.photos/seed/${listing.id}/600/400`;
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">No Image</div>
                        )}
                      </div>
                      <CardHeader className="pb-2 cursor-pointer relative" onClick={() => navigate(`/app/listings/${listing.id}`)}>
                        <div className="flex justify-between items-start gap-4">
                          <CardTitle className="text-lg line-clamp-1 group-hover:text-blue-600 transition-colors flex-1">
                            {cleanAddress(listing.address, listing.id)}{listing.city ? `, ${listing.city}` : ''}{listing.province ? `, ${listing.province}` : ''}
                          </CardTitle>
                          <div onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                            <DropdownMenu>
                              <DropdownMenuTrigger render={
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-black hover:text-slate-950 transition-colors -mt-1 -mr-1" type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                                  <MoreVertical className="h-4 w-4 stroke-[3.5] text-black" strokeWidth={3.5} />
                                </Button>
                              } />
                              <DropdownMenuContent align="end" className="w-52 p-2 rounded-xl shadow-xl border-slate-200" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/app/listings/${listing.id}`); }} className="rounded-lg font-bold gap-2 text-xs">
                                  <Eye className="h-4 w-4 text-blue-600" /> View Tour
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/app/listings/edit/${listing.id}`); }} className="rounded-lg font-bold gap-2 text-xs">
                                  <Edit className="h-4 w-4 text-blue-600" /> Edit Listing
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/app/openhouses`); }} className="rounded-lg font-bold gap-2 text-xs">
                                  <Calendar className="h-4 w-4 text-blue-600" /> Create Open House
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicateListing(listing); }} className="rounded-lg font-bold gap-2 text-xs">
                                  <CopyIcon className="h-4 w-4 text-blue-600" /> Duplicate Listing
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSharedModalListing(listing); }} className="rounded-lg font-bold gap-2 text-xs">
                                  <Users className="h-4 w-4 text-blue-600" /> Shared Listing
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setQrListing(listing);
                                  trackShareActivity(listing.id, 'QR');
                                }} className="rounded-lg font-bold gap-2 text-xs">
                                  <QrCode className="h-4 w-4 text-blue-600" /> Get QR Code
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setShareListing(listing);
                                  trackShareActivity(listing.id, 'SOCIAL');
                                }} className="rounded-lg font-bold gap-2 text-xs">
                                  <ExternalLink className="h-4 w-4 text-blue-600" /> Get Tour URL
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/app/flyers');
                                }} className="rounded-lg font-bold gap-2 text-xs">
                                  <Layout className="h-4 w-4 text-blue-600" /> Print Flyer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem 
                                  className="rounded-lg font-bold gap-2 text-red-600 focus:text-red-700 focus:bg-red-50 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteId(listing.id);
                                    setDeleteAddress(listing.address);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" /> Delete Listing
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <span className="font-bold text-slate-900 border px-2 py-0.5 rounded-lg text-sm bg-blue-50 border-blue-100 shadow-sm text-blue-700">
                            {listing.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(listing.price) : 'Price Unlisted'}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 pb-4 cursor-pointer" onClick={() => navigate(`/app/listings/${listing.id}`)}>
                          <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                             {listing.beds !== undefined && listing.beds !== null && (
                               <span className="flex items-center gap-1.5"><Bed className="h-4 w-4 text-slate-400"/> {listing.beds} Beds</span>
                             )}
                             {listing.baths !== undefined && listing.baths !== null && (
                               <span className="flex items-center gap-1.5"><Bath className="h-4 w-4 text-slate-400"/> {listing.baths} Baths</span>
                             )}
                          </div>
                          {(() => {
                            const matchEvent = openHouseEvents.find(evt => {
                              if (evt.listingId !== listing.id) return false;
                              if (!evt.eventDate) return false;
                              
                              // Get local today's date string in YYYY-MM-DD
                              const today = new Date();
                              const year = today.getFullYear();
                              const month = String(today.getMonth() + 1).padStart(2, '0');
                              const day = String(today.getDate()).padStart(2, '0');
                              const todayStr = `${year}-${month}-${day}`;
                              
                              // Standardize event date to YYYY-MM-DD if it is formatted as MM/DD/YYYY
                              let dateStr = evt.eventDate;
                              if (dateStr.includes("/")) {
                                const parts = dateStr.split("/");
                                if (parts.length === 3) {
                                  const mm = parts[0].padStart(2, '0');
                                  const dd = parts[1].padStart(2, '0');
                                  const yyyy = parts[2];
                                  dateStr = `${yyyy}-${mm}-${dd}`;
                                }
                              }
                              
                              return dateStr >= todayStr;
                            });
                            if (matchEvent) {
                              return (
                                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1 text-[11px] text-blue-700 bg-blue-50/60 p-2 rounded-lg border border-blue-100/70">
                                  <div className="flex items-center gap-1 font-bold text-blue-800">
                                    <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    Scheduled Open House
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-0.5 text-stone-700 font-medium overflow-hidden text-ellipsis">
                                    <span>Date: <strong className="text-black font-semibold">{formatDate(matchEvent.eventDate)}</strong></span>
                                    <span className="hidden sm:inline text-slate-300">|</span>
                                    <span>Time: <strong className="text-black font-semibold">{formatTime12h(matchEvent.startTime)} - {formatTime12h(matchEvent.endTime)}</strong></span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                      </CardContent>
                      <CardFooter className="bg-slate-50 border-t py-2.5 px-4 flex items-center justify-between gap-2 overflow-hidden">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 h-8 min-w-0 bg-white hover:bg-[#155dfc] hover:text-white hover:border-[#155dfc] shadow-sm transition-all group/tour text-[11px] font-bold px-2" 
                          onClick={() => window.open(`/tour/${listing.id}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1.5 text-slate-400 group-hover/tour:text-white transition-colors shrink-0" /> <span className="truncate">Ai Tour</span>
                        </Button>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button 
                            size="sm"
                            variant="ghost" 
                            className="h-8 px-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1.5 text-[11px] font-bold" 
                            onClick={() => navigate(`/app/listings/edit/${listing.id}`)}
                          >
                            <Edit className="h-3 w-3" /> <span>Edit</span>
                          </Button>
                          
                          <Button 
                            size="sm"
                            variant="ghost" 
                            className="h-8 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 text-[11px] font-bold" 
                            onClick={() => {
                              setDeleteId(listing.id);
                              setDeleteAddress(listing.address);
                            }}
                          >
                            <Trash2 className="h-3 w-3" /> <span>Delete</span>
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>

                {filtered.length > visibleCount && (
                  <div className="flex flex-col items-center gap-4 py-8 border-t border-slate-100">
                    <div className="text-sm font-medium text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full">
                      {visibleCount} of {filtered.length} Listings
                    </div>
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 3)}
                      className="text-blue-600 hover:text-blue-700 font-bold text-lg flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      Show More Listings
                    </button>
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Next Listings</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      <Dialog open={!!qrListing} onOpenChange={(open) => !open && setQrListing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Dynamic QR Code Settings</DialogTitle>
            <DialogDescription>
              Configure routing destination, choose custom styling options, or export high-resolution code for listing materials.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            {/* Visual Preview column */}
            <div className="flex flex-col items-center justify-center bg-slate-50 border rounded-2xl p-4 space-y-4">
              <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-100">
                {qrListing && (
                  <QRCodeSVG 
                    id="qr-code-svg"
                    value={`${window.location.origin}${qrListing.qrDestination === 'sign-in' ? `/open-houses/${qrListing.id}` : qrListing.qrDestination === 'microsite' ? `/microsite/${qrListing.id}` : qrListing.qrDestination === 'presentation' ? `/tour/${qrListing.id}?presentation=true` : `/tour/${qrListing.id}`}`} 
                    size={180}
                    level="H"
                    includeMargin
                    fgColor={qrForeground}
                    bgColor={qrBgColor}
                    {...((qrBrandingOption === "logo" || qrBrandingOption === "photo") ? {
                      imageSettings: {
                        src: qrBrandingOption === "photo" ? (agentBranding?.agentPhotoUrl || "") : (agentBranding?.imageUrl || agentBranding?.logoUrl || "https://aiopenhouseconnect.com/favicon.ico"),
                        x: undefined,
                        y: undefined,
                        height: 28,
                        width: 28,
                        excavate: true,
                      }
                    } : {})}
                  />
                )}
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-800 line-clamp-1">
                  {qrListing ? cleanAddress(qrListing.address, qrListing.id) : ''}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  {qrListing?.city}, {qrListing?.province}
                </span>
              </div>
            </div>

            {/* Controls parameters column */}
            <div className="space-y-4 text-left">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1.5">QR Destination Routing</label>
                <select 
                  className="w-full text-xs p-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={qrListing?.qrDestination || "tour"}
                  onChange={(e) => {
                    const dest = e.target.value as "sign-in" | "microsite" | "tour" | "presentation";
                    if (qrListing) {
                      const updated = { ...qrListing, qrDestination: dest };
                      setQrListing(updated);
                      setListings(prev => prev.map(l => l.id === qrListing.id ? updated : l));
                      updateListing(qrListing.id, { qrDestination: dest })
                        .then(() => toast.success("Dynamic redirect updated instantly!"))
                        .catch(() => toast.error("Could not sync destination."));
                    }
                  }}
                >
                  <option value="tour">AI Virtual Tour guide</option>
                  <option value="presentation">Featured Presentation (AI Tour)</option>
                  <option value="sign-in">Digital Open House Sign-In Form</option>
                  <option value="microsite">Branded Listing Microsite page</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1 font-sans">Brand Styling Palette</label>
                <div className="text-[10px] text-slate-500 mb-2 font-medium">Click to Select your Foreground or Background colors</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-1">Foreground</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <button className="flex items-center gap-1.5 p-1 px-2 hover:bg-slate-50 rounded border border-slate-200 transition-all outline-none cursor-pointer w-full justify-between bg-white text-left h-8">
                          <div className="flex items-center gap-1.5">
                            <div 
                              className="h-3.5 w-3.5 rounded-full shadow-inner border border-black/10" 
                              style={{ backgroundColor: qrForeground }}
                            />
                            <span className="font-mono text-[10px] text-slate-500 tracking-wider uppercase font-semibold">{qrForeground}</span>
                          </div>
                          <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
                        </button>
                      } />
                      <DropdownMenuContent align="start" className="w-44 p-2 bg-white rounded-lg shadow-md border border-slate-200">
                        <div className="grid grid-cols-4 gap-1.5 mb-2">
                          {["#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#7c3aed", "#db2777", "#000000", "#1e293b", "#475569", "#0984e3", "#2d3436", "#6c5ce7"].map(c => (
                            <button 
                              key={'fg-'+c}
                              className="h-5 w-5 rounded border border-slate-200 shadow-sm hover:scale-110 transition-transform cursor-pointer"
                              style={{ backgroundColor: c }}
                              onClick={() => setQrForeground(c)}
                              title={c}
                            />
                          ))}
                        </div>
                        <DropdownMenuSeparator className="my-1" />
                        <label className="flex items-center gap-1.5 cursor-pointer p-1 rounded hover:bg-slate-50 text-[10px] font-bold">
                          <input 
                            type="color" 
                            value={qrForeground} 
                            onChange={(e) => setQrForeground(e.target.value)} 
                            className="w-4 h-4 rounded cursor-pointer p-0"
                          />
                          <span>Custom Color</span>
                        </label>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-1">Background</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <button className="flex items-center gap-1.5 p-1 px-2 hover:bg-slate-50 rounded border border-slate-200 transition-all outline-none cursor-pointer w-full justify-between bg-white text-left h-8">
                          <div className="flex items-center gap-1.5">
                            <div 
                              className="h-3.5 w-3.5 rounded-full shadow-inner border border-black/10" 
                              style={{ backgroundColor: qrBgColor }}
                            />
                            <span className="font-mono text-[10px] text-slate-500 tracking-wider uppercase font-semibold">{qrBgColor}</span>
                          </div>
                          <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
                        </button>
                      } />
                      <DropdownMenuContent align="start" className="w-44 p-2 bg-white rounded-lg shadow-md border border-slate-200">
                        <div className="grid grid-cols-4 gap-1.5 mb-2">
                          {["#ffffff", "#f8fafc", "#f1f5f9", "#e2e8f0", "#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#dff9fb", "#f6e58d", "#ffbe76", "#ff7979"].map(c => (
                            <button 
                              key={'bg-'+c}
                              className="h-5 w-5 rounded border border-slate-200 shadow-sm hover:scale-110 transition-transform cursor-pointer"
                              style={{ backgroundColor: c }}
                              onClick={() => setQrBgColor(c)}
                              title={c}
                            />
                          ))}
                        </div>
                        <DropdownMenuSeparator className="my-1" />
                        <label className="flex items-center gap-1.5 cursor-pointer p-1 rounded hover:bg-slate-50 text-[10px] font-bold">
                          <input 
                            type="color" 
                            value={qrBgColor} 
                            onChange={(e) => setQrBgColor(e.target.value)} 
                            className="w-4 h-4 rounded cursor-pointer p-0"
                          />
                          <span>Custom Color</span>
                        </label>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
 
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1 font-sans">QR Logo Embedding</label>
                
                {/* Option 1: Company Logo */}
                <div className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${(!agentBranding?.imageUrl && !agentBranding?.logoUrl) ? 'opacity-60 bg-slate-50 cursor-not-allowed border-slate-100' : 'bg-white hover:bg-slate-50/50 border-slate-200'}`}>
                  <label htmlFor="qr-branding-logo" className="flex items-center gap-2.5 cursor-pointer w-full select-none">
                    <input 
                      type="radio" 
                      id="qr-branding-logo" 
                      name="qr-branding-choice" 
                      value="logo"
                      checked={qrBrandingOption === "logo"}
                      onChange={() => {
                        const hasLogo = agentBranding?.imageUrl || agentBranding?.logoUrl;
                        if (!hasLogo) {
                          toast.error("A Brokerage Logo is required under Settings > Branding & UI to select this option.");
                          return;
                        }
                        setQrBrandingOption("logo");
                        toast.success("Brokerage Logo overlay selected!");
                      }}
                      className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800">Embed Company Logo</span>
                      <span className="text-[10px] text-slate-500 leading-tight">Center brokerage emblem overlay inside the QR</span>
                    </div>
                  </label>
                  {(agentBranding?.imageUrl || agentBranding?.logoUrl) ? (
                    <img src={agentBranding?.imageUrl || agentBranding?.logoUrl} alt="Brokerage Logo" className="h-6 w-auto max-w-[50px] object-contain rounded border p-0.5 bg-white border-slate-200" />
                  ) : (
                    <span className="text-[9px] text-slate-400 italic bg-stone-100 px-1.5 py-0.5 rounded font-mono">Not Configured</span>
                  )}
                </div>

                {/* Option 2: Agent Photo */}
                <div className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${(!agentBranding?.agentPhotoUrl) ? 'opacity-60 bg-slate-50 cursor-not-allowed border-slate-100' : 'bg-white hover:bg-slate-50/50 border-slate-200'}`}>
                  <label htmlFor="qr-branding-photo" className="flex items-center gap-2.5 cursor-pointer w-full select-none">
                    <input 
                      type="radio" 
                      id="qr-branding-photo" 
                      name="qr-branding-choice" 
                      value="photo"
                      checked={qrBrandingOption === "photo"}
                      onChange={() => {
                        if (!agentBranding?.agentPhotoUrl) {
                          toast.error("An Agent Photo is required under Settings > Branding & UI to select this option.");
                          return;
                        }
                        setQrBrandingOption("photo");
                        toast.success("Agent Photo overlay selected!");
                      }}
                      className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800">Embed Agent Photo</span>
                      <span className="text-[10px] text-slate-500 leading-tight">Center agent circular portrait headshot inside the QR</span>
                    </div>
                  </label>
                  {agentBranding?.agentPhotoUrl ? (
                    <img src={agentBranding.agentPhotoUrl} alt="Agent Portrait" className="h-6 w-6 object-cover rounded-full border bg-white border-slate-200" />
                  ) : (
                    <span className="text-[9px] text-slate-400 italic bg-stone-100 px-1.5 py-0.5 rounded font-mono">Not Configured</span>
                  )}
                </div>

                {/* Option 3: None */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border bg-white hover:bg-slate-50/50 border-slate-200 transition-colors">
                  <label htmlFor="qr-branding-none" className="flex items-center gap-2.5 cursor-pointer w-full select-none">
                    <input 
                      type="radio" 
                      id="qr-branding-none" 
                      name="qr-branding-choice" 
                      value="none"
                      checked={qrBrandingOption === "none"}
                      onChange={() => {
                        setQrBrandingOption("none");
                        toast.info("No logo chosen. Rendered as standard clean high-res QR.");
                      }}
                      className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800">No Image Embedding</span>
                      <span className="text-[10px] text-slate-500 leading-tight">Outputs clean, classic high-density barcode format</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 w-full p-4 border-t border-slate-100">
            <Button 
              className="w-full text-xs h-10 font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-1.5"
              onClick={async () => {
                if (qrBrandingOption === "none") {
                  setShowNoImageConfirm(true);
                } else {
                  if (qrListing) {
                    try {
                      await updateListing(qrListing.id, { qrBrandingOption });
                      const updated: Listing = { ...qrListing, qrBrandingOption };
                      setListings(prev => prev.map(l => l.id === qrListing.id ? updated : l));
                      toast.success("✨ Dynamic QR Code Settings saved successfully!");
                      setQrListing(null);
                    } catch (err) {
                      toast.error("Failed to save QR branding settings.");
                    }
                  }
                }
              }}
            >
              Save QR Settings
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button 
                className="flex-1 text-xs py-2 h-10 font-bold" 
                variant="outline" 
                onClick={() => {
                  if (!qrListing) return;
                  const destPath = qrListing.qrDestination === 'sign-in' ? `/open-houses/${qrListing.id}` : qrListing.qrDestination === 'microsite' ? `/microsite/${qrListing.id}` : qrListing.qrDestination === 'presentation' ? `/tour/${qrListing.id}?presentation=true` : `/tour/${qrListing.id}`;
                  navigator.clipboard.writeText(`${window.location.origin}${destPath}`);
                  toast.success("Destination link copied to clipboard!");
                }}
              >
                Copy Link URL
              </Button>
              <Button 
                className="flex-1 text-xs py-2 h-10 font-bold bg-blue-600 hover:bg-blue-700 text-white" 
                onClick={() => {
                  const svg = document.getElementById("qr-code-svg");
                  if (!svg) return;
                  try {
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement("canvas");
                    canvas.width = 1000;
                    canvas.height = 1000;
                    const ctx = canvas.getContext("2d");
                    const img = new Image();
                    img.onload = () => {
                      if (ctx) {
                        ctx.fillStyle = qrBgColor;
                        ctx.fillRect(0, 0, 1000, 1000);
                        ctx.drawImage(img, 100, 100, 800, 800);
                        const url = canvas.toDataURL("image/png");
                        const a = document.createElement("a");
                        a.download = `QR-${qrListing?.mlsNumber || "listing"}.png`;
                        a.href = url;
                        a.click();
                        toast.success("High-res printable PNG downloaded successfully!");
                      }
                    };
                    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                  } catch (e) {
                    toast.error("Download failed. Copy URL to generate externally.");
                  }
                }}
              >
                Export Printable PNG
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!shareListing} onOpenChange={(open) => !open && setShareListing(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
          <div className="bg-white p-8 space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-black tracking-tighter uppercase italic text-slate-900">Share Property Tour</h2>
              <p className="text-sm text-slate-500 font-medium px-4">
                Share the link on your Social Media platforms to allow buyers to take the AI-powered tour.
              </p>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-inner border border-slate-100 bg-slate-50">
              {shareListing?.images && shareListing.images.length > 0 ? (
                <img 
                  src={typeof shareListing.images[0] === 'string' ? shareListing.images[0] : shareListing.images[0].url} 
                  alt={shareListing.address}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://picsum.photos/seed/${shareListing.id}/600/400`;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 italic">No Image Available</div>
              )}
            </div>

            <div className="text-center">
              <p className="text-lg font-black text-slate-900 tracking-tight">
                {shareListing ? cleanAddress(shareListing.address, shareListing.id) : ''}
              </p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                {shareListing?.city}{shareListing?.province ? `, ${shareListing.province}` : ''}
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button 
                className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-200"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/tour/${shareListing?.id}`);
                  toast.success("Social media link copied!");
                }}
              >
                Copy Link
              </Button>
              <Button 
                variant="ghost" 
                className="h-14 rounded-2xl font-bold text-slate-500 hover:text-slate-900"
                onClick={() => setShareListing(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Do you really want to delete this?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the listing for <span className="font-bold text-base text-slate-900">{deleteAddress}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }} 
              className="bg-red-600 hover:bg-red-700 font-bold"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showNoImageConfirm} onOpenChange={setShowNoImageConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to save with no image?</AlertDialogTitle>
            <AlertDialogDescription>
              You have not chosen to <span className="font-semibold text-slate-900">Embed Company Logo</span> or <span className="font-semibold text-slate-900">Embed Agent Photo</span>. This means your dynamic QR code will render with no emblem in the center.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowNoImageConfirm(false)}>
              Go Back & Select
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                setShowNoImageConfirm(false);
                if (qrListing) {
                  try {
                    await updateListing(qrListing.id, { qrBrandingOption: "none" });
                    const updated: Listing = { ...qrListing, qrBrandingOption: "none" };
                    setListings(prev => prev.map(l => l.id === qrListing.id ? updated : l));
                    toast.success("✨ Dynamic QR Code Settings saved with no image successfully!");
                    setQrListing(null);
                  } catch (err) {
                    toast.error("Failed to save QR branding settings.");
                  }
                }
              }} 
              className="bg-blue-600 hover:bg-blue-700 font-bold text-white"
            >
              Yes, Save with No Image
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SharedListingModal 
        isOpen={!!sharedModalListing} 
        onClose={() => setSharedModalListing(null)} 
        listing={sharedModalListing}
      />
    </div>
  );
}
