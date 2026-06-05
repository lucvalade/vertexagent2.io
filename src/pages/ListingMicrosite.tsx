import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getListing, Listing } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ListingMicrosite() {
  const { listingId } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (listingId) {
      getListing(listingId).then(l => {
        setListing(l);
        trackEvent("microsite_visited", { listingId: l.id, timestamp: Date.now() });
      }).finally(() => setLoading(false));
    }
  }, [listingId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Listing not found.</p>
      </div>
    );
  }

  const themeStyles = {
    luxury: {
      bg: "bg-stone-50",
      container: "bg-white border-stone-200",
      text: "text-stone-900",
      secondaryText: "text-stone-600",
      button: "bg-stone-800 hover:bg-stone-900",
    },
    tech: {
      bg: "bg-slate-950",
      container: "bg-slate-900 border-slate-700 text-slate-100",
      text: "text-slate-100",
      secondaryText: "text-slate-400",
      button: "bg-blue-600 hover:bg-blue-700",
    },
    standard: {
      bg: "bg-slate-50",
      container: "bg-white border-slate-200",
      text: "text-slate-900",
      secondaryText: "text-slate-600",
      button: "bg-blue-600 hover:bg-blue-700",
    }
  };

  const template = listing.brandingTemplate || "standard";
  const styles = themeStyles[template];

  return (
    <div className={`min-h-screen p-6 ${styles.bg}`}>
      <div className={`max-w-4xl mx-auto rounded-xl shadow-md overflow-hidden border ${styles.container}`}>
        {listing.images && listing.images.length > 0 && (
          <img 
            src={typeof listing.images[0] === 'string' ? listing.images[0] : (listing.images[0] as any).url} 
            alt="Listing" 
            className="w-full h-64 object-cover" 
          />
        )}
        <div className="p-6">
          <h1 className={`text-3xl font-bold ${styles.text}`}>{listing.address}</h1>
          <p className={`text-xl mt-2 ${styles.secondaryText}`}>${listing.price?.toLocaleString()}</p>
          <p className={`mt-4 ${styles.secondaryText}`}>{listing.description}</p>
          <div className="mt-6">
            <Button className={styles.button} onClick={() => window.location.href = `/tour/${listing.id}`}>View AI Tour</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
