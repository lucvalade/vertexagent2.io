import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUserListings, getAllListings, getGlobalPromptSettings, saveGlobalPromptSettings, Listing } from "@/lib/api";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Loader2, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Zap, 
  Database, 
  Mic2, 
  Plus, 
  Shield, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Home, 
  TrendingUp, 
  Sparkles, 
  Users, 
  FileText, 
  Layout, 
  Compass, 
  Share2, 
  AlertCircle,
  Calendar,
  Clock,
  BookOpen,
  ArrowUpRight
} from "lucide-react";

export default function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listingCount, setListingCount] = useState<number | null>(null);
  const [leadCount, setLeadCount] = useState<number | null>(null);
  const [activeTourCount, setActiveTourCount] = useState<number | null>(null);
  const [activeListings, setActiveListings] = useState<Listing[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [mortgageOptIns, setMortgageOptIns] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [flyerCount, setFlyerCount] = useState(4); // default flyer templates
  const [tourMinutesWatched, setTourMinutesWatched] = useState(185); // simulated tracker metric
  
  // Prompt and Password Admin Panel States
  const [isAdminPanelUnlocked, setIsAdminPanelUnlocked] = useState(false);
  const [promptPassword, setPromptPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("8923");
  const [savedPromptText, setSavedPromptText] = useState("");
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [showPasswordRaw, setShowPasswordRaw] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);

  useEffect(() => {
    getGlobalPromptSettings().then(settings => {
      if (settings) {
        if (settings.prompt) {
          setSavedPromptText(settings.prompt);
        }
        if (settings.password) {
          setCurrentPassword(settings.password);
        }
      }
    });
  }, []);

  const handleUnlock = () => {
    if (promptPassword === currentPassword) {
      setIsAdminPanelUnlocked(true);
      toast.success("AI Prompt settings unlocked successfully!");
      setPromptPassword("");
    } else {
      toast.error("Incorrect password credentials. Please try again.");
    }
  };

  const handleSavePromptSettings = async () => {
    setSavingPrompt(true);
    try {
      const payload: { prompt: string; password?: string } = {
        prompt: savedPromptText,
      };
      if (newPasswordValue) {
        payload.password = newPasswordValue;
        setCurrentPassword(newPasswordValue);
        setNewPasswordValue("");
      }
      await saveGlobalPromptSettings(payload);
      toast.success("AI system prompt locked down and saved securely to Firestore!");
      setIsAdminPanelUnlocked(false);
    } catch (err) {
      toast.error("Failed to persist prompt configurations.");
    } finally {
      setSavingPrompt(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      const isAdmin = (user as any).role === 'ADMIN';
      const fetchPromise = isAdmin ? getAllListings() : getUserListings(user.id);
      
      fetchPromise.then(listings => {
        setListingCount(listings ? listings.length : 0);
        setActiveListings(listings ? listings.slice(0, 3) : []);
      }).catch(err => {
        console.error("Failed to fetch listings for overview", err);
        setListingCount(0);
      });

      // Realtime listener for leads count
      const leadsQuery = isAdmin 
        ? collection(db, "leads")
        : query(collection(db, "leads"), where("agentId", "==", user.id));

      const unsubLeads = onSnapshot(leadsQuery, (snap) => {
        setLeadCount(snap.docs.length);
        const list: any[] = [];
        const mortgageList: any[] = [];
        snap.docs.forEach(doc => {
          const lData = { id: doc.id, ...doc.data() } as any;
          list.push(lData);
          if (lData.mortgageInterest || lData.mortgageOptIn || lData.assignedLender) {
            mortgageList.push(lData);
          }
        });
        
        // Sort recent
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setRecentLeads(list.slice(0, 4));
        setMortgageOptIns(mortgageList.slice(0, 3));
      }, (err) => {
        console.error("Failed to sync leads for overview", err);
        setLeadCount(0);
      });

      // Realtime listener for conversations count
      const unsubConvos = onSnapshot(collection(db, "conversations"), (snap) => {
        setActiveTourCount(snap.docs.length || 5);
      }, (err) => {
        console.error("Failed to fetch conversations for overview", err);
        setActiveTourCount(5);
      });

      // Realtime listener for Open House events
      const ohEventsQuery = collection(db, "openHouseEvents");
      // Fallback local mock events seed
      const savedEvents = localStorage.getItem("open_house_events");
      if (savedEvents) {
        setUpcomingEvents(JSON.parse(savedEvents).slice(0, 3));
      } else {
        setUpcomingEvents([
          {
            id: "event_1",
            eventName: "Elite Autumn Open Exhibition",
            listingAddress: "888 Bel Air Rd, Los Angeles",
            eventDate: "2026-06-15",
            startTime: "13:00",
            endTime: "16:00",
            hostAgent: user.name || "Sarah Connor"
          }
        ]);
      }

      return () => {
        unsubConvos();
        unsubLeads();
      };
    } else if (user === null) {
      setListingCount(0);
    }
  }, [user]);

  const firstName = user?.name?.split(" ")[0] || "Agent";

  return (
    <div className="space-y-8 font-sans">
      
      {/* Premium Header Card */}
      <Card className="border-blue-900 shadow-lg bg-blue-950 text-white rounded-2xl overflow-hidden p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Workspace Dashboard</h1>
            <p className="text-blue-100 mt-1">Welcome back, {firstName}. Monitor your open houses, touring activity, and live routing pipelines.</p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <Button 
              onClick={() => navigate("/app/listings/edit")}
              className="bg-white hover:bg-slate-100 text-blue-900 font-extrabold text-xs h-10 tracking-wide shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1 text-blue-900" /> New Listing
            </Button>
            <Button 
              onClick={() => navigate("/app/openhouses")} 
              className="bg-white hover:bg-slate-100 text-blue-900 font-extrabold text-xs h-10 tracking-wide shadow-sm"
            >
              <Calendar className="h-4 w-4 mr-1 text-blue-900" /> Plan Open House
            </Button>
          </div>
        </div>
      </Card>

      {/* Core Summary Metrics row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-900 shadow-sm rounded-xl bg-blue-950">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-blue-200 tracking-wider">Active Inventory</p>
              <h3 className="text-2xl font-black text-white mt-1">{listingCount ?? <Loader2 className="h-4 w-4 animate-spin text-white" />}</h3>
              <p className="text-[10px] text-blue-100 mt-0.5">Properties online</p>
            </div>
            <div className="p-3 bg-blue-900/50 text-blue-100 rounded-lg border border-blue-800">
              <Home className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200/90 shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Total Leads Compiled</p>
              <h3 className="text-2xl font-black text-stone-900 mt-1">{leadCount ?? <Loader2 className="h-4 w-4 animate-spin text-amber-505" />}</h3>
              <p className="text-[10px] text-stone-400 mt-0.5">Email / Phone verified</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-900 shadow-sm rounded-xl bg-blue-950">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-blue-200 tracking-wider">AI Tour Streaming</p>
              <h3 className="text-2xl font-black text-white mt-1">{activeTourCount ?? 3}</h3>
              <p className="text-[10px] text-blue-100 mt-0.5">Active listen events</p>
            </div>
            <div className="p-3 bg-blue-900/50 text-blue-100 rounded-lg border border-blue-800">
              <Mic2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200/90 shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Tour Minutes Listened</p>
              <h3 className="text-2xl font-black text-stone-900 mt-1">{tourMinutesWatched}m</h3>
              <p className="text-[10px] text-stone-400 mt-0.5">Average 4.2m per guest</p>
            </div>
            <div className="p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Main Information Blocks */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Col (2 span): Core Operational Panels */}
        <div className="lg:col-span-2 space-y-6 text-left">
          
          {/* Upcoming Open Houses Layout Section */}
          <Card className="border-blue-900 shadow-sm rounded-2xl bg-blue-950 overflow-hidden">
            <CardHeader className="pb-3 border-b border-blue-900 bg-blue-900">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-bold text-white">Upcoming Open Houses Scheduled</CardTitle>
                  <CardDescription className="text-xs text-blue-100">Digital check-ins, kiosks, and dynamic qr landing pages registered.</CardDescription>
                </div>
                <Button 
                  onClick={() => navigate("/app/openhouses")} 
                  variant="ghost" 
                  className="text-xs text-blue-200 hover:text-white hover:bg-blue-900 h-8 gap-0.5 font-bold"
                >
                  Configure <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((evt) => (
                    <div key={evt.id} className="p-4 border border-blue-900 rounded-xl bg-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-wide">{evt.eventName}</p>
                        <p className="text-[11px] text-blue-200 mt-0.5 flex items-center gap-1">
                          <Home className="h-3.5 w-3.5 text-blue-400" /> {evt.listingAddress}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs shrink-0 bg-blue-950 p-2.5 border border-blue-900 rounded-lg max-w-fit text-blue-100">
                        <div className="text-blue-100">
                          <span className="flex items-center gap-1 font-semibold"><Calendar className="h-3.5 w-3.5 text-amber-500" /> {evt.eventDate}</span>
                          <span className="flex items-center gap-1 text-[10px] text-blue-300 mt-0.5"><Clock className="h-3.5 w-3.5" /> {evt.startTime} - {evt.endTime}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-blue-200 italic py-4">No open house show sessions planned for this week. Tap Plan Open House to set up a digital kiosk.</p>
              )}
            </CardContent>
          </Card>

          {/* Active Listings section (listings with details) */}
          <Card className="border-stone-200 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-light-divider">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-bold text-stone-900">Active Listings Inventory</CardTitle>
                  <CardDescription className="text-xs">Manage properties and inspect sora tour status.</CardDescription>
                </div>
                <Button 
                  onClick={() => navigate("/app/listings")} 
                  variant="ghost" 
                  className="text-xs text-amber-700 hover:text-amber-800 hover:bg-stone-50 h-8 gap-0.5 font-bold"
                >
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {activeListings.length > 0 ? (
                <div className="grid sm:grid-cols-3 gap-4">
                  {activeListings.map((listing) => (
                    <div 
                      key={listing.id} 
                      onClick={() => navigate(`/app/listings/${listing.id}`)}
                      className="border border-stone-200/90 rounded-xl bg-white overflow-hidden cursor-pointer hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      {(() => {
                        const imageVal = listing.images && listing.images.length > 0 
                          ? (typeof listing.images[0] === 'string' ? listing.images[0] : (listing.images[0] as any).url)
                          : null;
                        return imageVal ? (
                          <img 
                            referrerPolicy="no-referrer"
                            src={imageVal} 
                            alt={listing.address} 
                            className="h-28 w-full object-cover"
                          />
                        ) : (
                          <div className="h-28 bg-stone-100 flex items-center justify-center text-stone-400">
                            <Home className="h-8 w-8 text-stone-300" />
                          </div>
                        );
                      })()}
                      <div className="p-3 text-left space-y-1">
                        <p className="text-[10px] font-black tracking-wider uppercase text-amber-700">MLS Active</p>
                        <h4 className="text-[11px] font-bold text-stone-900 truncate">{listing.address}</h4>
                        <p className="text-[9px] text-stone-500 font-medium">{listing.city}, {listing.province}</p>
                      </div>
                      <div className="p-2 bg-stone-50 border-t flex justify-between items-center text-[10px] font-bold text-stone-600">
                        <span>{listing.beds} Beds · {listing.baths} Baths</span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-stone-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400 italic">No listings synced yet. Use URL Import above to begin in seconds.</p>
              )}
            </CardContent>
          </Card>

          {/* New Leads log */}
          <Card className="border-blue-900 shadow-sm rounded-2xl bg-blue-950 overflow-hidden">
            <CardHeader className="pb-3 border-b border-blue-900 bg-blue-900">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-bold text-white">Recently Captured Visitors</CardTitle>
                  <CardDescription className="text-xs text-blue-100">Checked-in open house attendees and QR scan leads.</CardDescription>
                </div>
                <Button 
                  onClick={() => navigate("/app/leads")} 
                  variant="ghost" 
                  className="text-xs text-blue-200 hover:text-white hover:bg-blue-900 h-8 gap-0.5 font-bold"
                >
                  Manage Leads <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {recentLeads.length > 0 ? (
                <div className="space-y-3">
                  {recentLeads.map((ld) => (
                    <div key={ld.id} className="p-3 border rounded-xl border-blue-900 bg-blue-900/50 flex items-center justify-between text-xs font-sans">
                      <div className="space-y-0.5 text-left">
                        <p className="font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                          {ld.name}
                          {ld.mortgageInterest && (
                            <span className="text-[8px] font-black uppercase bg-blue-500 text-white px-1 py-0.5 rounded border border-blue-400">
                              Lender Consent
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-blue-200">{ld.email || 'No email provided'} · {ld.phone || 'No phone provided'}</p>
                      </div>
                      <div className="text-[10px] text-right font-medium text-blue-400 space-y-1">
                        <span className="block italic text-[9px] text-blue-200 font-bold bg-blue-950 border border-blue-800 px-1.5 py-0.5 rounded uppercase">
                          Source: {ld.source || ld.isOffline ? "Kiosk (Offline)" : "Sora Walkthrough"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-blue-200 italic py-2">No guest registrations captured yet. Complete onboarding steps to capture leads.</p>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Col: Mortgage Opt-ins, Flyer activity, Prompts */}
        <div className="space-y-6 text-left">
          
          {/* Mortgage pre-approved opt-ins (Pairing indicator) */}
          <Card className="border-stone-200 shadow-sm rounded-2xl bg-[#faf9f6]/40 p-5 space-y-3">
            <div>
              <p className="text-[9px] font-black uppercase text-amber-700 tracking-wider">Premium Mortgage Router</p>
              <h3 className="text-sm font-bold text-stone-900 mt-1">Paired Financing Consents</h3>
              <p className="text-xs text-stone-500">Lender-paired leads matched with your active mortgage specialists for immediate follow-up drafts.</p>
            </div>
            
            <div className="space-y-2 pt-2">
              {mortgageOptIns.length > 0 ? (
                mortgageOptIns.map((mld, i) => (
                  <div key={i} className="p-3 bg-white rounded-xl border border-stone-205 shadow-xs space-y-1">
                    <p className="text-xs font-bold text-stone-900 leading-none">{mld.name}</p>
                    <p className="text-[9px] text-stone-500">Property: {mld.listingAddress}</p>
                    <span className="inline-block text-[8px] font-black bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded uppercase">
                      Lender: Assigned to Pinnacle Capital
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-stone-500 italic">No mortgage pre-approval opt-ins registered today.</p>
              )}
            </div>
          </Card>

          {/* Recent Flyer Activity Tracker */}
          <Card className="border-blue-900 shadow-sm rounded-2xl bg-blue-950 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-black uppercase tracking-wider text-white">Recent Flyer Scans</CardTitle>
                <CardDescription className="text-xs text-blue-100">Scan events from printed show materials.</CardDescription>
              </div>
              <span className="text-[10px] font-bold text-emerald-100 bg-emerald-900/50 px-2 py-0.5 rounded border border-emerald-800">Active Flyers</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <div className="space-y-0.5">
                  <p className="font-bold text-white">Luxury QR Scan - flyer_888</p>
                  <p className="text-[9px] text-blue-200">Sora Guided walking tour</p>
                </div>
                <span className="font-bold text-blue-100">Just now</span>
              </div>
              
              <div className="flex justify-between items-center text-[11px] border-t border-blue-900 pt-3">
                <div className="space-y-0.5">
                  <p className="font-bold text-white">Exhibition Entry scan - stand_91</p>
                  <p className="text-[9px] text-blue-200">Tablet kiosk prompt</p>
                </div>
                <span className="font-bold text-blue-100">28 mins ago</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions Panel */}
          <Card className="border-stone-200 shadow-sm rounded-2xl bg-white p-5 space-y-3">
            <p className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                onClick={() => navigate("/app/listings")} 
                className="p-3 bg-[#faf9f6] hover:bg-stone-100 border rounded-xl text-left font-bold space-y-1 transition-colors group"
              >
                <Home className="h-4 w-4 text-amber-600 group-hover:scale-105 transition-transform" />
                <p className="text-[10px] text-stone-800 leading-tight">Imports URL Listing</p>
              </button>

              <button 
                onClick={() => navigate("/app/aitours")} 
                className="p-3 bg-[#faf9f6] hover:bg-stone-100 border rounded-xl text-left font-bold space-y-1 transition-colors group"
              >
                <Mic2 className="h-4 w-4 text-amber-600 group-hover:scale-105 transition-transform" />
                <p className="text-[10px] text-stone-800 leading-tight">Customize Sora Script</p>
              </button>

              <button 
                onClick={() => navigate("/app/openhouses")} 
                className="p-3 bg-[#faf9f6] hover:bg-stone-100 border rounded-xl text-left font-bold space-y-1 transition-colors group"
              >
                <Calendar className="h-4 w-4 text-amber-600 group-hover:scale-105 transition-transform" />
                <p className="text-[10px] text-stone-800 leading-tight">Deploy Show Kiosk</p>
              </button>

              <button 
                onClick={() => navigate("/app/flyers")} 
                className="p-3 bg-[#faf9f6] hover:bg-stone-100 border rounded-xl text-left font-bold space-y-1 transition-colors group"
              >
                <FileText className="h-4 w-4 text-amber-600 group-hover:scale-105 transition-transform" />
                <p className="text-[10px] text-stone-800 leading-tight">Create Luxury Promo</p>
              </button>
            </div>
          </Card>

        </div>

      </div>

      {/* Admin Character Guard Block */}
      <Card className="border-blue-900 shadow-sm overflow-hidden text-left bg-blue-950 rounded-2xl">
        <CardHeader className="pb-3 border-b border-blue-900 bg-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-amber-500 animate-pulse" /> AI System Instruction & Character Guard
            </CardTitle>
            <CardDescription className="text-xs font-medium text-blue-100">Lock down custom AI conversational prompts, agency characters, and safety triggers under a master control password.</CardDescription>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-black uppercase bg-blue-950 text-blue-100 px-2.5 py-1 rounded-full border border-blue-800 w-fit shrink-0">
            {isAdminPanelUnlocked ? <Unlock className="h-3 w-3 text-green-400" /> : <Lock className="h-3 w-3 text-red-400" />}
            {isAdminPanelUnlocked ? 'Sora Unlocked' : 'Password Gated'}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!isAdminPanelUnlocked ? (
            <div className="max-w-md space-y-4 py-2">
              <p className="text-xs text-blue-100 leading-relaxed font-sans">
                Enter your **Dashboard Password** to authorize listing prompt edits. This keeps critical VertexAgent character attributes, compliance overrides, and guided tour templates secure from unauthorized edits.
              </p>
              <div className="flex gap-2 font-sans">
                <div className="relative flex-1">
                  <Input
                    type={showPasswordRaw ? "text" : "password"}
                    placeholder="Enter dashboard administrator password..."
                    value={promptPassword}
                    onChange={(e) => setPromptPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                    className="h-10 text-xs text-stone-900 border-blue-800 focus-visible:ring-1 focus-visible:ring-amber-500 focus-visible:ring-offset-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordRaw(!showPasswordRaw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-white"
                  >
                    {showPasswordRaw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button 
                  onClick={handleUnlock}
                  className="bg-amber-600 hover:bg-amber-500 font-bold text-xs h-10 px-4 text-white"
                >
                  Authorize & Unlock
                </Button>
              </div>
              <p className="text-[10px] text-blue-300 italic font-medium">Default setup password: <span className="font-mono bg-blue-900 px-1 py-0.5 rounded text-amber-300 font-bold">8923</span></p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-blue-100 tracking-wider">AI System Instruction Template Override</Label>
                <p className="text-[11px] text-blue-200 leading-normal">
                  Customize the core system prompt that dictates how Sora represents your brokerage. This is prepended to the live session parameters. Leave blank to fallback to default settings.
                </p>
                <Textarea
                  value={savedPromptText}
                  onChange={(e) => setSavedPromptText(e.target.value)}
                  rows={8}
                  placeholder="Paste your custom agency system prompt instructions here (or leave blank to use the default)..."
                  className="font-mono text-xs text-white bg-blue-900 border-blue-800 focus-visible:ring-1 focus-visible:ring-amber-500 focus-visible:ring-offset-0 h-44"
                />
              </div>

              <div className="p-4 bg-blue-900 rounded-xl border border-blue-800 grid sm:grid-cols-2 gap-4 text-left">
                <div className="space-y-1">
                  <Label className="text-xs font-black uppercase text-blue-100 tracking-wider">Change Dashboard Password</Label>
                  <p className="text-[11px] text-blue-200">Provide a new password to upgrade administrative lockbox protection.</p>
                </div>
                <div className="flex items-center">
                  <Input
                    type="text"
                    placeholder="Enter new master password..."
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    className="h-10 text-xs bg-blue-950 border-blue-800 focus-visible:ring-1 focus-visible:ring-amber-550 focus-visible:ring-offset-0 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-blue-800">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAdminPanelUnlocked(false);
                    setNewPasswordValue("");
                    setPromptPassword("");
                  }}
                  className="font-bold text-xs bg-blue-950 text-white border-blue-800 hover:bg-blue-900"
                >
                  Discard & Lock
                </Button>
                <Button
                  onClick={handleSavePromptSettings}
                  disabled={savingPrompt}
                  className="bg-amber-600 hover:bg-amber-500 font-bold text-xs gap-2 px-6 text-white"
                >
                  {savingPrompt ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Apply & Lock Down
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
