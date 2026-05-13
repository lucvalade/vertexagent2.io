import { useAuth } from "@/hooks/useAuth";
import { getUserListings, getAllListings, deleteListingOp, Listing, createListing } from "@/lib/api";
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
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200",
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200",
          "https://images.unsplash.com/photo-1600607687931-cebf14cd0bb6?auto=format&fit=crop&q=80&w=1200"
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
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1200",
          "https://images.unsplash.com/photo-1502672260266-1c1cdeaa9cb9?auto=format&fit=crop&q=80&w=1200",
          "https://images.unsplash.com/photo-1600566753086-00f18efc2297?auto=format&fit=crop&q=80&w=1200"
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
          {[1,2,3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
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
            {listings.slice(0, visibleCount).map(listing => (
              <Card key={listing.id} className="overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300 border-slate-200">
                <div 
                  className="h-48 bg-slate-100 relative cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/app/listings/${listing.id}`)}
                >
                  {listing.images && listing.images.length > 0 ? (
                    <img 
                      src={typeof listing.images[0] === 'string' ? listing.images[0] : listing.images[0].url} 
                      alt={listing.address} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
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
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-900 transition-colors -mt-1 -mr-1">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-44 p-2 rounded-xl shadow-xl border-slate-200">
                          <DropdownMenuItem onClick={() => navigate(`/app/listings/${listing.id}`)} className="rounded-lg font-bold gap-2">
                            <Eye className="h-4 w-4 text-blue-600" /> View Tour
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/app/listings/edit/${listing.id}`)} className="rounded-lg font-bold gap-2">
                            <Edit className="h-4 w-4 text-blue-600" /> Edit Listing
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setQrListing(listing)} className="rounded-lg font-bold gap-2">
                            <QrCode className="h-4 w-4 text-blue-600" /> Get QR Code
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem 
                            className="rounded-lg font-bold gap-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                            onClick={() => {
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Property Tour</DialogTitle>
            <DialogDescription>
              Scan this QR code or share the link to allow buyers to take the AI-powered tour.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
               {qrListing && (
                 <QRCodeSVG 
                   value={`${window.location.origin}/tour/${qrListing.id}`} 
                   size={200}
                   level="H"
                   includeMargin
                 />
               )}
            </div>
            <p className="text-sm font-medium text-slate-800 text-center">
              {qrListing?.address}{qrListing?.city ? `, ${qrListing.city}` : ''}
            </p>
            <div className="flex gap-2 w-full mt-4">
               <Button className="flex-1" variant="outline" onClick={() => {
                 navigator.clipboard.writeText(`${window.location.origin}/tour/${qrListing?.id}`);
                 toast.success("Link copied to clipboard!");
               }}>Copy Link</Button>
               <Button className="flex-1" onClick={() => window.open(`/tour/${qrListing?.id}`, '_blank')}>Open Tour</Button>
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
