import { useAuth } from "@/hooks/useAuth";
import { getUserListings, getAllListings, deleteListingOp, Listing, createListing, updateListing } from "@/lib/api";
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
  Layout
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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

export default function Dashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [qrListing, setQrListing] = useState<Listing | null>(null);
  const [qrForeground, setQrForeground] = useState("#2563eb");
  const [qrBgColor, setQrBgColor] = useState("#ffffff");
  const [includeCenterLogo, setIncludeCenterLogo] = useState(false);
  const [shareListing, setShareListing] = useState<Listing | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteAddress, setDeleteAddress] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(3);
  const [layoutCols, setLayoutCols] = useState<2 | 3>(3);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      loadListings();
    }
  }, [user]);

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
          <div className={`grid gap-6 sm:grid-cols-2 ${layoutCols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2 max-w-5xl'}`}>
            {Array.from(new Map(listings.map(l => [l.id, l])).values()).slice(0, visibleCount).map(listing => (
              <Card key={'listing-' + listing.id} className="overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300 border-slate-200">
                <div 
                  className="h-48 bg-slate-100 relative cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/app/listings/${listing.id}`)}
                >
                  {listing.images && listing.images.length > 0 ? (
                    <img 
                      src={typeof listing.images[0] === 'string' ? listing.images[0] : listing.images[0].url} 
                      alt={listing.address} 
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
                      {listing.address}{listing.city ? `, ${listing.city}` : ''}{listing.province ? `, ${listing.province}` : ''}
                    </CardTitle>
                     <div onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-900 transition-colors -mt-1 -mr-1" type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-44 p-2 rounded-xl shadow-xl border-slate-200" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/app/listings/${listing.id}`); }} className="rounded-lg font-bold gap-2">
                            <Eye className="h-4 w-4 text-blue-600" /> View Tour
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/app/listings/edit/${listing.id}`); }} className="rounded-lg font-bold gap-2">
                            <Edit className="h-4 w-4 text-blue-600" /> Edit Listing
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setQrListing(listing);
                            trackShareActivity(listing.id, 'QR');
                          }} className="rounded-lg font-bold gap-2">
                            <QrCode className="h-4 w-4 text-blue-600" /> Get QR Code
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setShareListing(listing);
                            trackShareActivity(listing.id, 'SOCIAL');
                          }} className="rounded-lg font-bold gap-2">
                            <ExternalLink className="h-4 w-4 text-blue-600" /> Get Tour URL
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate('/app/flyers');
                          }} className="rounded-lg font-bold gap-2">
                            <Layout className="h-4 w-4 text-blue-600" /> Print Flyer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem 
                            className="rounded-lg font-bold gap-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(listing.id);
                              setDeleteAddress(listing.address);
                            }}
                          >
                            <Trash2 className="h-4 w-4" /> Delete Asset
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

          {listings.length > visibleCount && (
            <div className="flex flex-col items-center gap-4 py-8 border-t border-slate-100">
               <div className="text-sm font-medium text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full">
                 {visibleCount} of {listings.length} Listings
               </div>
               <button 
                 onClick={() => setVisibleCount(prev => prev + 3)}
                 className="text-blue-600 hover:text-blue-700 font-bold text-lg flex items-center gap-2 transition-colors"
               >
                 Show More Listings
               </button>
               <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Next Listings</span>
            </div>
          )}
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
                    value={`${window.location.origin}${qrListing.qrDestination === 'sign-in' ? `/open-houses/${qrListing.id}` : qrListing.qrDestination === 'microsite' ? `/microsite/${qrListing.id}` : `/tour/${qrListing.id}`}`} 
                    size={180}
                    level="H"
                    includeMargin
                    fgColor={qrForeground}
                    bgColor={qrBgColor}
                    {...(includeCenterLogo ? {
                      imageSettings: {
                        src: "https://vertexagent.io/favicon.ico",
                        x: undefined,
                        y: undefined,
                        height: 24,
                        width: 24,
                        excavate: true,
                      }
                    } : {})}
                  />
                )}
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-800 line-clamp-1">
                  {qrListing?.address}
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
                    const dest = e.target.value as "sign-in" | "microsite" | "tour";
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
                  <option value="sign-in">Digital Open House Sign-In Form</option>
                  <option value="microsite">Branded Listing Microsite page</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1.5 font-sans">Brand Styling Palette</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5">Foreground</label>
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="color" 
                        value={qrForeground} 
                        onChange={(e) => setQrForeground(e.target.value)} 
                        className="w-7 h-7 rounded border cursor-pointer p-0"
                      />
                      <span className="font-mono text-[10px] text-slate-500 tracking-wider uppercase">{qrForeground}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5">Background</label>
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="color" 
                        value={qrBgColor} 
                        onChange={(e) => setQrBgColor(e.target.value)} 
                        className="w-7 h-7 rounded border cursor-pointer p-0"
                      />
                      <span className="font-mono text-[10px] text-slate-500 tracking-wider uppercase">{qrBgColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input 
                  type="checkbox" 
                  id="includeLogo" 
                  checked={includeCenterLogo} 
                  onChange={(e) => setIncludeCenterLogo(e.target.checked)} 
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="includeLogo" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">Embed Vertex Brand Badge</label>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full p-4 border-t border-slate-100">
            <Button 
              className="flex-1 text-xs py-2 h-10 font-bold" 
              variant="outline" 
              onClick={() => {
                if (!qrListing) return;
                const destPath = qrListing.qrDestination === 'sign-in' ? `/open-houses/${qrListing.id}` : qrListing.qrDestination === 'microsite' ? `/microsite/${qrListing.id}` : `/tour/${qrListing.id}`;
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
    </div>
  );
}
