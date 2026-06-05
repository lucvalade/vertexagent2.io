import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Listing, getListing, deleteListingOp } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Bed, 
  Bath, 
  MapPin, 
  Square, 
  Trash2, 
  Edit, 
  ExternalLink, 
  ChevronLeft,
  Calendar,
  FileText
} from "lucide-react";
import { toast } from "sonner";
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

export default function ListingDetails() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (listingId) {
      loadListing();
    }
  }, [listingId]);

  async function loadListing() {
    setLoading(true);
    try {
      const data = await getListing(listingId!);
      if (data) {
        setListing(data);
      } else {
        toast.error("Listing not found");
        navigate("/app/listings");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load listing details");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteListingOp(listingId!);
      toast.success("Listing deleted successfully");
      navigate("/app/listings");
    } catch (err) {
      toast.error("Failed to delete listing");
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading listing details...</div>;
  }

  if (!listing) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link 
          to="/app/listings" 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium group"
        >
          <div className="p-1 h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200">
            <ChevronLeft className="h-4 w-4" />
          </div>
          View Listings
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`/tour/${listing.id}`, "_blank")}>
            <ExternalLink className="h-4 w-4 mr-2" /> Live Tour
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-none shadow-md">
            <div className="aspect-video bg-slate-100 relative">
              {listing.images && listing.images.length > 0 ? (
                <img 
                  src={typeof listing.images[0] === 'string' ? listing.images[0] : listing.images[0].url} 
                  alt={listing.address} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://placehold.co/1200x800?text=Listing+Image+Not+Found";
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">No Image Available</div>
              )}
            </div>
            <CardHeader className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">{listing.address}</h1>
                  <p className="text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" /> {listing.city}, {listing.province} {listing.postalCode}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {listing.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(listing.price) : 'Price Unlisted'}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">MLS® {listing.mlsNumber || 'N/A'}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-4 sm:gap-8 py-4 border-y border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Bed className="h-5 w-5" /></div>
                  <div>
                    <div className="font-bold">{listing.beds || '—'}</div>
                    <div className="text-xs text-slate-500">Beds</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Bath className="h-5 w-5" /></div>
                  <div>
                    <div className="font-bold">{listing.baths || '—'}</div>
                    <div className="text-xs text-slate-500">Baths</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Square className="h-5 w-5" /></div>
                  <div>
                    <div className="font-bold">{listing.sqft ? `${listing.sqft.toLocaleString()} ft²` : '—'}</div>
                    <div className="text-xs text-slate-500">Living Area</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Description
                </h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </div>

              {listing.talkingPoints && listing.talkingPoints.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold text-slate-900">Key Features</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {listing.talkingPoints.map((point, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <Card className="shadow-md border-none sticky top-6">
            <CardHeader>
              <CardTitle>Listing Actions</CardTitle>
              <CardDescription>Manage this property listing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start h-11 text-base" 
                onClick={() => navigate(`/app/listings/edit/${listing.id}`)}
              >
                <Edit className="h-4 w-4 mr-2" /> Edit Listing
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger render={
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start h-11 text-base bg-red-50 text-red-600 hover:bg-red-100 border-none"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Listing
                  </Button>
                } />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Do you really want to delete this?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the listing for {listing.address}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Yes</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <hr className="my-4 border-slate-100" />
              
              <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2 font-medium">
                    <Calendar className="h-4 w-4" /> Created
                  </span>
                  <span className="text-slate-900 font-semibold">{new Date(listing.createdAt).toLocaleDateString()}</span>
                </div>
                {listing.mlsNumber && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">MLS Number</span>
                    <span className="text-slate-900 font-bold">{listing.mlsNumber}</span>
                  </div>
                )}
                {listing.originatingSystemName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">MLS Board</span>
                    <span className="text-slate-900 font-bold">{listing.originatingSystemName} ({listing.country})</span>
                  </div>
                )}
                {(listing.agentName || listing.brokerageName) && (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Listed By</div>
                    <div className="text-sm font-semibold text-slate-700 leading-snug">
                      {listing.agentName && <span>{listing.agentName}{listing.brokerageName ? ", " : ""}</span>}
                      {listing.brokerageName && <span>{listing.brokerageName}</span>}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
