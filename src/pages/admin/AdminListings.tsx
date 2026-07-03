import React, { useState, useEffect } from 'react';
import { Search, Filter, Home, User, ExternalLink, AlertTriangle, CheckCircle, MoreVertical, Eye, Trash2, Edit, X, Calendar, Loader2, Volume2, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminListings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [shareListing, setShareListing] = useState<any>(null);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStatus, setEditStatus] = useState("Active");
  const [welcomeEn, setWelcomeEn] = useState("");
  const [welcomeFr, setWelcomeFr] = useState("");
  const [showComplianceOnly, setShowComplianceOnly] = useState(false);

  useEffect(() => {
    if (location.state?.showCompliance) {
      setShowComplianceOnly(true);
      setIsComplianceInfoOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllListings(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "listings");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Automated Fix: Ensure all listings have a voice assigned (Calm Narrator as default)
    const fixVoices = async () => {
      const untracked = allListings.filter(l => !l.voiceId || l.voiceId === "none");
      if (untracked.length > 0) {
        console.log(`Fixing voices for ${untracked.length} listings...`);
        for (const l of untracked) {
          try {
            await updateDoc(doc(db, "listings", l.id), {
              voiceId: "2",
              voiceName: "Professional Female Synthetic",
              updatedAt: Date.now()
            });
          } catch (err) {
            console.error(`Failed to fix voice for ${l.id}`, err);
          }
        }
      }
    };
    if (allListings.length > 0) {
      fixVoices();
    }
  }, [allListings.length]);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isComplianceInfoOpen, setIsComplianceInfoOpen] = useState(false);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedListings = allListings
    .filter(l => 
      (l.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
       (l.agentName && l.agentName.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (!startDate || (l.createdAt && new Date(l.createdAt).toISOString() >= startDate)) &&
      (!endDate || (l.createdAt && new Date(l.createdAt).toISOString() <= endDate)) &&
      (!showComplianceOnly || l.flag === true)
    )
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      const valA = (a as any)[key];
      const valB = (b as any)[key];
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleFlagStatus = async (id: string, currentlyFlagged: boolean) => {
    try {
      await updateDoc(doc(db, "listings", id), { flag: !currentlyFlagged });
      toast.success(currentlyFlagged ? "Flag removed from listing" : "Listing flagged for review");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const toggleListingStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Draft' : 'Active';
    try {
      await updateDoc(doc(db, "listings", id), {
        status: newStatus,
        updatedAt: Date.now()
      });
      toast.success(`Listing status set to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to toggle listing status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this listing?")) return;
    try {
      await deleteDoc(doc(db, "listings", id));
      toast.success("Listing deleted successfully");
    } catch (err) {
      toast.error("Failed to delete listing");
    }
  };

  const handleQuickEdit = (listing: any) => {
    setSelectedListing(listing);
    setEditPrice(listing.price?.toString() || "");
    setEditStatus(listing.status || "Active");
    setWelcomeEn(listing.welcome_en || "");
    setWelcomeFr(listing.welcome_fr || "");
    setIsQuickEditOpen(true);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>, lang: "en" | "fr") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/") && !file.name.endsWith(".mp3")) {
      toast.error("Please upload a valid .mp3 audio file.");
      return;
    }

    if (file.size > 800 * 1024) {
      toast.error("File exceeds limit. Keep welcome audio files under 800KB (approx. 1 minute) to optimize loading speed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      if (lang === "en") {
        setWelcomeEn(base64String);
        toast.success("English Welcome Audio uploaded. Click Save Changes to persist!");
      } else {
        setWelcomeFr(base64String);
        toast.success("French Welcome Audio uploaded. Click Save Changes to persist!");
      }
    };
    reader.readAsDataURL(file);
  };

  const trackShareActivity = async (listingId: string, type: 'QR' | 'SOCIAL') => {
    try {
      await addDoc(collection(db, "system_logs"), {
        type: "SHARE_CLICK",
        message: `${type} Link Generated for Listing ${listingId} by Admin`,
        timestamp: serverTimestamp(),
        details: {
          listingId,
          shareType: type,
          agentId: "ADMIN",
          timestamp: Date.now()
        }
      });
    } catch (err) {
      console.error("Failed to track share activity:", err);
    }
  };

  const handleSaveQuickEdit = async () => {
    if (!selectedListing) return;
    try {
      await updateDoc(doc(db, "listings", selectedListing.id), {
        price: parseFloat(editPrice) || editPrice,
        status: editStatus,
        welcome_en: welcomeEn || "",
        welcome_fr: welcomeFr || "",
        updatedAt: Date.now()
      });
      toast.success("Listing updated successfully");
      setIsQuickEditOpen(false);
    } catch (err) {
      toast.error("Update failed");
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
    <div className="space-y-6">
      <div className="text-left">
        <h1 className="text-3xl font-black tracking-tighter text-slate-900 italic uppercase">Brokerage Inventory</h1>
        <p className="text-slate-500 font-medium">Global oversight of all property assets and agent compliance.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-left">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by address, agent, or MLS..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Start Date:</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input 
                    type="date"
                    className="pl-9 pr-14 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  {startDate && (
                    <button 
                      onClick={() => setStartDate("")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[8px] font-black tracking-widest hover:bg-slate-300 transition-all shadow-sm"
                    >
                      CLEAR
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">End Date:</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input 
                    type="date"
                    className="pl-9 pr-14 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  {endDate && (
                    <button 
                      onClick={() => setEndDate("")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[8px] font-black tracking-widest hover:bg-slate-300 transition-all shadow-sm"
                    >
                      CLEAR
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                setShowComplianceOnly(true);
                setIsComplianceInfoOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors h-[34px]"
            >
              <AlertTriangle className="h-3.5 w-3.5 animate-pulse" /> Compliance Holds ({allListings.filter(l => l.flag).length})
            </button>
          </div>
        </div>

        {showComplianceOnly && (
          <div className="mx-6 my-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-red-900 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-red-100 rounded-lg text-red-600">
                <AlertTriangle className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Compliance Mode Active</p>
                <p className="text-[11px] text-red-700 font-medium">Showing only the {filteredAndSortedListings.length} listing(s) currently flagged for review.</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowComplianceOnly(false)}
              className="h-8 text-[10px] uppercase tracking-widest border-red-300 bg-white text-red-700 hover:bg-red-100 font-extrabold shadow-sm shrink-0"
            >
              View All Listings
            </Button>
          </div>
        )}

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th 
                  className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-slate-600"
                  onClick={() => handleSort('address')}
                >
                  Property {sortConfig?.key === 'address' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-slate-600 font-black decoration-blue-500 underline-offset-4"
                  onClick={() => handleSort('agent')}
                >
                  Listing Agent <span className="text-blue-600">{sortConfig?.key === 'agent' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pricing</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Engagement</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedListings.map((listing, i) => (
                <motion.tr 
                  key={listing.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 group-hover:bg-white transition-colors">
                        <Home className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-none mb-1.5">{listing.address}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{listing.city}</p>
                      </div>
                      {listing.flag && (
                        <div className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[8px] font-black tracking-wider animate-pulse border border-red-200">
                          COMPLIANCE HOLD
                        </div>
                      )}
                    </div>
                  </td>
                   <td className="px-6 py-5">
                    <div className="flex items-center gap-2.5">
                       <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center italic text-[10px] font-black text-slate-500">
                        {(listing.agentName || "U A").split(' ').map((n: string) => n[0]).join('')}
                       </div>
                       <span className="text-xs font-bold text-slate-700">{listing.agentName || "Unknown Agent"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-black text-slate-900 italic">
                    {typeof listing.price === 'number' ? `$${listing.price.toLocaleString()}` : (listing.price || "N/A")}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900">{listing.leadsCount || 0}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Verified Leads</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleListingStatus(listing.id, listing.status)}
                        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        style={{ backgroundColor: listing.status === 'Active' ? '#22c55e' : '#ef4444' }}
                        title="Click to toggle listing status between Active (ON) and Draft (OFF)"
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            listing.status === 'Active' ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        listing.status === 'Active' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {listing.status === 'Active' ? 'ACTIVE' : `DRAFT`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-900">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 shadow-xl border-slate-200">
                          <DropdownMenuItem onClick={() => navigate(`/app/listings/${listing.id}`)} className="rounded-lg font-bold gap-2">
                            <Eye className="h-4 w-4 text-blue-600" /> View Listing
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setShareListing(listing);
                            trackShareActivity(listing.id, 'SOCIAL');
                          }} className="rounded-lg font-bold gap-2">
                            <ExternalLink className="h-4 w-4 text-blue-600" /> Get Tour URL
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleQuickEdit(listing)} className="rounded-lg font-bold gap-2">
                            <Edit className="h-4 w-4 text-blue-600" /> Edit & Save
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem onClick={() => handleFlagStatus(listing.id, listing.flag)} className="rounded-lg font-bold gap-2">
                            <AlertTriangle className={`h-4 w-4 ${listing.flag ? 'text-green-600' : 'text-amber-600'}`} /> 
                            {listing.flag ? 'Clear Flag' : 'Flag Listing'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem onClick={() => handleDelete(listing.id)} className="rounded-lg font-bold text-red-600 focus:text-red-700 focus:bg-red-50 gap-2">
                            <Trash2 className="h-4 w-4" /> Force Takedown
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filteredAndSortedListings.map((listing) => (
            <div key={listing.id} className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                    <Home className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 leading-none mb-1">{listing.address}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{listing.city}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  } />
                  <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-200 p-2">
                    <DropdownMenuItem onClick={() => navigate(`/app/listings/${listing.id}`)} className="font-bold gap-2">
                      <Eye className="h-4 w-4 text-blue-600" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFlagStatus(listing.id, listing.flag)} className="font-bold gap-2">
                      <AlertTriangle className={`h-4 w-4 ${listing.flag ? 'text-green-600' : 'text-amber-600'}`} /> Flag
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-wrap gap-3 items-center text-[10px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 w-full justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleListingStatus(listing.id, listing.status)}
                    className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    style={{ backgroundColor: listing.status === 'Active' ? '#22c55e' : '#ef4444' }}
                    title="Toggle Listing Status"
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        listing.status === 'Active' ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`text-[9px] font-black uppercase tracking-wider ${
                    listing.status === 'Active' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {listing.status === 'Active' ? 'ACTIVE' : `DRAFT`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-bold">
                  {typeof listing.price === 'number' ? `$${listing.price.toLocaleString()}` : (listing.price || "N/A")}
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-bold">
                  {listing.leadsCount || 0} Leads
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-500 font-bold">
                  By {listing.agentName || "Agent"}
                </div>
              </div>
              {listing.flag && (
                <div className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-[10px] font-black tracking-widest animate-pulse border border-red-100 text-center uppercase">
                  COMPLIANCE HOLD ACTIVE
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Quick Edit Dialog */}
      <Dialog open={isQuickEditOpen} onOpenChange={setIsQuickEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black text-2xl italic tracking-tighter uppercase">Quick Edit Property</DialogTitle>
            <DialogDescription className="font-bold text-slate-400">{selectedListing?.address}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asking Price</Label>
              <Input 
                value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
                placeholder="1249000"
                className="font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Listing Status</Label>
              <select 
                value={editStatus}
                onChange={e => setEditStatus(e.target.value)}
                className="w-full h-10 border rounded-lg px-3 text-sm font-bold bg-white"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Sold">Sold</option>
                <option value="Off-Market">Off-Market</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-1.5">
                <Volume2 className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">Sora Welcome Audio (.MP3 Upload)</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Upload pre-recorded welcome messages (.mp3) for English and French. These will play when visitors tap "Start Welcome Tour" in the virtual listing page, bypassing any auto-play blockages.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* English Welcome */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-600">English MP3</span>
                    {welcomeEn ? (
                      <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">Uploaded</span>
                    ) : (
                      <span className="text-[8px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-full">Default</span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center justify-center border border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-lg p-2 cursor-pointer text-center text-slate-500 hover:text-blue-600 transition-all">
                      <Upload className="h-3 w-3 mr-1" />
                      <span className="text-[9px] font-semibold">Choose English</span>
                      <input 
                        type="file" 
                        accept="audio/mp3, audio/*" 
                        className="hidden" 
                        onChange={(e) => handleAudioUpload(e, "en")} 
                      />
                    </label>
                    
                    {welcomeEn && (
                      <div className="flex items-center justify-between bg-white p-1 rounded border border-slate-150 text-[10px] gap-1">
                        <audio src={welcomeEn} controls className="h-5 max-w-[90px]" />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 text-red-500 hover:text-red-700 shrink-0"
                          onClick={() => { setWelcomeEn(""); toast.success("Removed English welcome audio."); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* French Welcome */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-600">French MP3</span>
                    {welcomeFr ? (
                      <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">Uploaded</span>
                    ) : (
                      <span className="text-[8px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-full">Default</span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center justify-center border border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-lg p-2 cursor-pointer text-center text-slate-500 hover:text-blue-600 transition-all">
                      <Upload className="h-3 w-3 mr-1" />
                      <span className="text-[9px] font-semibold">Choose French</span>
                      <input 
                        type="file" 
                        accept="audio/mp3, audio/*" 
                        className="hidden" 
                        onChange={(e) => handleAudioUpload(e, "fr")} 
                      />
                    </label>
                    
                    {welcomeFr && (
                      <div className="flex items-center justify-between bg-white p-1 rounded border border-slate-150 text-[10px] gap-1">
                        <audio src={welcomeFr} controls className="h-5 max-w-[90px]" />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 text-red-500 hover:text-red-700 shrink-0"
                          onClick={() => { setWelcomeFr(""); toast.success("Removed French welcome audio."); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsQuickEditOpen(false)} className="font-bold">Cancel</Button>
            <Button onClick={handleSaveQuickEdit} className="bg-blue-600 text-white font-bold px-8">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
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
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 italic">No Image Available</div>
              )}
            </div>

            <div className="text-center">
              <p className="text-lg font-black text-slate-900 tracking-tight">
                {shareListing?.address}
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

      {/* Compliance Info Dialog */}
      <Dialog open={isComplianceInfoOpen} onOpenChange={setIsComplianceInfoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black tracking-tighter text-2xl uppercase italic">
              <AlertTriangle className="h-6 w-6 text-amber-600" /> Compliance Hold
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-500">
              What it is and how to fix it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-left">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h4 className="font-black text-xs uppercase tracking-widest text-slate-900 mb-2">Definition</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                A <span className="text-amber-700 font-bold">Compliance Hold</span> is triggered when an AI-powered tour is generated but is missing required brokerage disclosures, state-mandated legal text, or an authenticated agent license number.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="font-black text-xs uppercase tracking-widest text-blue-900 mb-2">How to Fix</h4>
              <ul className="text-sm text-blue-700 space-y-2 list-disc pl-4 font-medium">
                <li>Go to <span className="font-bold">Edit Listing</span> and ensure the Brokerage Name and Agent License fields are filled.</li>
                <li>Verify that the AI Talking Points don't violate fair housing guidelines.</li>
                <li>Once corrected, use the <span className="font-bold">"Clear Flag"</span> option in the listing menu to lift the hold.</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsComplianceInfoOpen(false)} className="bg-slate-900 text-white font-bold px-8">Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
