import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUserListings, getAllListings } from "@/lib/api";
import { Loader2, CheckCircle2, Circle, ArrowRight, Zap, Database, Mic2, Plus } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { Button } from "@/components/ui/button";

export default function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listingCount, setListingCount] = useState<number | null>(null);
  const [integrations, setIntegrations] = useState<any>({});
  const [chosenCRM, setChosenCRM] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
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

      // Sync integrations and voice count
      const unsubUser = onSnapshot(doc(db, "users", user.id), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setIntegrations(data?.integrations || {});
          setUserData(data);
          
          // Check for chosen CRM
          const activeCRM = Object.entries(data?.integrations || {}).find(([_, v]) => v === true)?.[0];
          setChosenCRM(activeCRM || null);
        }
      });

      return () => unsubUser();
    } else if (user === null) {
      setListingCount(0);
    }
  }, [user]);
  
  const onboardingSteps = [
    { 
      id: "listings", 
      title: "Upload First Listing", 
      description: "Import a property URL to create your first AI tour.",
      completed: (listingCount || 0) > 0,
      link: "/app/listings"
    },
    { 
      id: "voices", 
      title: "Voice Setup", 
      description: "Select a default voice for your tours in Voice Lab.",
      completed: !!userData?.defaultVoiceId,
      link: "/app/voicelab"
    },
    { 
      id: "crm", 
      title: chosenCRM ? `Connected to ${chosenCRM}` : "Connect CRM", 
      description: "Sync leads automatically to your selected CRM account.",
      completed: !!chosenCRM,
      link: "/app/crm"
    }
  ];

  const completedSteps = onboardingSteps.filter(s => s.completed).length;
  const isComplete = completedSteps === onboardingSteps.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {firstName}. Here's what's happening with your tours.</p>
        </div>
        {!isComplete && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-2 flex items-center gap-3">
             <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Zap className="h-4 w-4 text-blue-600" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Onboarding Progress</p>
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-24 bg-blue-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${(completedSteps / onboardingSteps.length) * 100}%` }} />
                   </div>
                   <span className="text-[10px] font-bold text-blue-800">{completedSteps}/{onboardingSteps.length}</span>
                </div>
             </div>
          </div>
        )}
      </div>

      {!isComplete && (
        <Card className="border-blue-200 shadow-lg shadow-blue-50 overflow-hidden bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500 fill-amber-500" /> Complete Your Onboarding
            </CardTitle>
            <CardDescription className="font-medium">Setup these core features to unlock the full potential of VertexAgent.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4 mt-2">
              {onboardingSteps.map((step) => (
                <div 
                  key={step.id}
                  onClick={() => navigate(step.link)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                    step.completed 
                      ? 'bg-green-50/50 border-green-100 opacity-80' 
                      : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                     <div className={`p-2 rounded-lg ${step.completed ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 shadow-sm'}`}>
                        {step.id === 'listings' ? <Plus className="h-4 w-4" /> : 
                         step.id === 'voices' ? <Mic2 className="h-4 w-4" /> : 
                         <Database className="h-4 w-4" />}
                     </div>
                     {step.completed ? (
                       <CheckCircle2 className="h-5 w-5 text-green-500" />
                     ) : (
                       <Circle className="h-5 w-5 text-slate-200 group-hover:text-blue-400" />
                     )}
                  </div>
                  <h3 className={`font-bold text-sm ${step.completed ? 'text-green-800' : 'text-slate-900'}`}>{step.title}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">{step.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
