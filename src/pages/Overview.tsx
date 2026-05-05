import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUserListings, getAllListings } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function Overview() {
  const { user } = useAuth();
  const [listingCount, setListingCount] = useState<number | null>(null);
  const firstName = user?.name?.split(" ")[0] || "there";

  useEffect(() => {
    if (user?.id) {
      const isAdmin = (user as any).role === 'ADMIN';
      const fetchPromise = isAdmin ? getAllListings() : getUserListings(user.id);
      
      fetchPromise.then(listings => {
        setListingCount(listings ? listings.length : 0);
      }).catch(err => {
        console.error("Failed to fetch listings for overview", err);
        setListingCount(0);
      });
    } else if (user === null) {
      // User is explicitly logged out or session ended
      setListingCount(0);
    }
  }, [user]);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-slate-500 mt-1">Welcome back, {firstName}. Here's what's happening with your tours.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/app/listings" state={{ showAll: true }} className="block outline-none">
          <Card className="h-full hover:bg-blue-600 hover:text-white transition-colors group cursor-pointer border-slate-200 hover:border-blue-600 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-white text-slate-600">Total Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {listingCount === null ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  listingCount
                )}
              </div>
              <p className="text-xs text-slate-500 group-hover:text-blue-100 italic">Manage your properties</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/app/analytics" className="block outline-none">
          <Card className="h-full hover:bg-blue-600 hover:text-white transition-colors group cursor-pointer border-slate-200 hover:border-blue-600 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-white text-slate-600">QR Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,240</div>
              <p className="text-xs text-slate-500 group-hover:text-blue-100">+18% from last month</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/conversations" className="block outline-none">
          <Card className="h-full hover:bg-blue-600 hover:text-white transition-colors group cursor-pointer border-slate-200 hover:border-blue-600 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-white text-slate-600">Active Tours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">342</div>
              <p className="text-xs text-slate-500 group-hover:text-blue-100">+7% from last month</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/leads" className="block outline-none">
          <Card className="h-full hover:bg-blue-600 hover:text-white transition-colors group cursor-pointer border-slate-200 hover:border-blue-600 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-white text-slate-600">Leads Captured</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-slate-500 group-hover:text-blue-100">+24% from last month</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
