import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAllListings, getUserListings, createLead, Listing, Lead } from "@/lib/api";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, doc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { 
  Sparkles, 
  Plus, 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  QrCode, 
  Eye, 
  Sliders, 
  Smartphone, 
  HelpCircle, 
  TrendingUp, 
  Database, 
  Tv, 
  Users, 
  Volume2, 
  UserPlus, 
  FileCheck2,
  Lock,
  Wifi,
  WifiOff,
  RefreshCw,
  MoreVertical,
  ClipboardList,
  Compass,
  ArrowRight
} from "lucide-react";

interface OpenHouseEvent {
  id: string;
  eventName: string;
  listingId: string;
  listingAddress: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  hostAgent: string;
  eventMode: "Tablet" | "QR" | "Hybrid";
  gateToggle: boolean;
  aiTourLinked: boolean;
  lenderShown: boolean;
  mortgageQuestion: boolean;
  agentNotes: string;
  createdAt: number;
}

export default function OpenHousesAgent() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [agentsAndUsers, setAgentsAndUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "setup" | "questions" | "qr" | "simulator" | "leads">("dashboard");
  
  // Open House State
  const [events, setEvents] = useState<OpenHouseEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<OpenHouseEvent | null>(null);

  // Setup Fields (matching requirements)
  const [eventName, setEventName] = useState("");
  const [selectedListingId, setSelectedListingId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("01:00 pm");
  const [endTime, setEndTime] = useState("04:00 pm");
  const [hostAgent, setHostAgent] = useState("");
  const [eventMode, setEventMode] = useState<"Tablet" | "QR" | "Hybrid">("Hybrid");
  const [gateToggle, setGateToggle] = useState(true);
  const [aiTourLinked, setAiTourLinked] = useState(true);
  const [lenderShown, setLenderShown] = useState(true);
  const [mortgageQuestion, setMortgageQuestion] = useState(true);
  const [agentNotes, setAgentNotes] = useState("");
  const [assistingNotes, setAssistingNotes] = useState(false);

  // Questions setup
  const [requireName, setRequireName] = useState(true);
  const [oneContactRequired, setOneContactRequired] = useState(true); // rule: "require name, Require at least one contact method: email or phone. Allow guest to skip email or phone, but not both"
  const [customQuestions, setCustomQuestions] = useState<string[]>([
    "Are you pre-approved for a mortgage and when are you planning to buy a home?"
  ]);
  const [newCustomQuestion, setNewCustomQuestion] = useState("");

  const timeOptions = [
    "08:00 am", "08:30 am", "09:00 am", "09:30 am", "10:00 am", "10:30 am", "11:00 am", "11:30 am",
    "12:00 pm", "12:30 pm", "01:00 pm", "01:30 pm", "02:00 pm", "02:30 pm", "03:00 pm", "03:30 pm",
    "04:00 pm", "04:30 pm", "05:00 pm", "05:30 pm", "06:00 pm", "06:30 pm", "07:00 pm", "07:30 pm",
    "08:00 pm", "08:30 pm", "09:00 pm", "09:30 pm", "10:00 pm"
  ];

  const handleAiAssistNotes = async () => {
    if (!agentNotes) {
      toast.error("Please enter some brief notes first for Sora to optimize!");
      return;
    }
    setAssistingNotes(true);
    try {
      const res = await fetch("/api/assist-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: agentNotes }),
      });
      const data = await res.json();
      if (data.success && data.rewrittenNotes) {
        setAgentNotes(data.rewrittenNotes);
        toast.success("Engagement notes optimized and capitalized by Sora AI!");
      } else {
        toast.error(data.error || "Failed to assist with notes.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error trying to contact Sora notes helper.");
    } finally {
      setAssistingNotes(false);
    }
  };

  // Visitor Kiosk / Live Mode Simulation State
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestMortgageHelp, setGuestMortgageHelp] = useState(false);
  const [guestCustomAnswers, setGuestCustomAnswers] = useState<Record<string, string>>({});
  const [guestConsent, setGuestConsent] = useState(true);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  // Live host-side variables
  const [vipMarks, setVipMarks] = useState<Record<string, boolean>>({});
  const [privateNotes, setPrivateNotes] = useState<Record<string, string>>({});
  const [liveLog, setLiveLog] = useState<any[]>([
    { name: "Suresh Patel", email: "suresh.patel@bell.net", phone: "(416) 555-0182", time: "Just now", vip: false, mortgageInterest: true },
    { name: "Amanda Sterling", email: "amanda@sterlinghomes.co", phone: "(604) 555-8291", time: "18 mins ago", vip: true, mortgageInterest: false }
  ]);
  const [pauseSignIn, setPauseSignIn] = useState(false);

  // Connectivity & Offline Stack (Matches Required offline-first event capture)
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Network connection restored! Tap 'Sync Queue' to offload buffered data.");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Network connection lost. Offline buffer captures registrations safely.");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  async function loadInitialData() {
    setLoading(true);
    try {
      if (!user) return;
      const isAdmin = (user as any).role === 'ADMIN';
      const userListings = isAdmin ? await getAllListings() : await getUserListings(user.id);
      setListings(userListings || []);
      
      if (userListings && userListings.length > 0) {
        setSelectedListingId(userListings[0].id);
      }
      setHostAgent(user.name || "My Preferred Agent Identity");
      setAgentsAndUsers([user.name || "Primary Host Agent", "Assistant Agent Support", "Joint Team Member"]);

      // Seed mock Open House events
      const savedEvents = localStorage.getItem("open_house_events");
      if (savedEvents) {
        const parsed = JSON.parse(savedEvents);
        setEvents(parsed);
        if (parsed.length > 0) setSelectedEvent(parsed[0]);
      } else {
        const initialEvents: OpenHouseEvent[] = [
          {
            id: "event_1",
            eventName: "Elite Autumn Open Exhibition",
            listingId: userListings[0]?.id || "listing_1",
            listingAddress: userListings[0]?.address || "888 Bel Air Rd, Los Angeles",
            eventDate: "2026-06-15",
            startTime: "13:00",
            endTime: "16:00",
            hostAgent: user.name || "Sarah Connor",
            eventMode: "Hybrid",
            gateToggle: true,
            aiTourLinked: true,
            lenderShown: true,
            mortgageQuestion: true,
            agentNotes: "Perfect timing given market pricing index drop. Focus on highlighting original hand-carved millwork.",
            createdAt: Date.now()
          }
        ];
        setEvents(initialEvents);
        setSelectedEvent(initialEvents[0]);
        localStorage.setItem("open_house_events", JSON.stringify(initialEvents));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load initial context.");
    } finally {
      setLoading(false);
    }
  }

  const handleSaveSetup = () => {
    if (!eventName) {
      toast.error("Please provide an Event Name");
      return;
    }
    const targetListing = listings.find(l => l.id === selectedListingId);
    const newOhEvent: OpenHouseEvent = {
      id: crypto.randomUUID(),
      eventName,
      listingId: selectedListingId,
      listingAddress: targetListing?.address || "Address Reference",
      eventDate,
      startTime,
      endTime,
      hostAgent,
      eventMode,
      gateToggle,
      aiTourLinked,
      lenderShown,
      mortgageQuestion,
      agentNotes,
      createdAt: Date.now()
    };

    const updated = [newOhEvent, ...events];
    setEvents(updated);
    setSelectedEvent(newOhEvent);
    localStorage.setItem("open_house_events", JSON.stringify(updated));
    toast.success("Open House event created with advanced AI settings!");
    
    // Auto shift
    setActiveTab("dashboard");
  };

  const handleAddQuestion = () => {
    if (!newCustomQuestion) return;
    let formatted = newCustomQuestion.trim();
    if (formatted.length > 0) {
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    setCustomQuestions([...customQuestions, formatted]);
    setNewCustomQuestion("");
    toast.info("Custom registration question added successfully.");
  };

  const handleDeleteQuestion = (idx: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== idx));
  };

  // Submit Sign-In simulator (with offline check)
  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName) {
      toast.error("A Full Name is strictly required.");
      return;
    }

    // Require at least one contact method: Email or Phone
    if (!guestEmail && !guestPhone) {
      toast.error("Contact details required: Please provide either an Email or a Phone Number to register.");
      return;
    }

    if (guestEmail && !guestEmail.includes("@")) {
      toast.error("Invalid email address: Your email must contain the '@' symbol.");
      return;
    }

    if (!guestConsent) {
      toast.error("Guest must consent to communications terms to proceed.");
      return;
    }

    const leadPayload: Partial<Lead> & { customAnswers: any; isOffline: boolean; mortgageInterest: boolean } = {
      id: crypto.randomUUID(),
      name: guestName,
      email: guestEmail || "no_email@provided.com",
      phone: guestPhone || "No Phone Provided",
      listingId: selectedEvent?.listingId || "default_listing",
      listingAddress: selectedEvent?.listingAddress || "Active Open House Address",
      agentId: user?.id || "mock_agent",
      status: "New",
      createdAt: Date.now(),
      isOffline: !isOnline,
      mortgageInterest: guestMortgageHelp,
      customAnswers: { ...guestCustomAnswers }
    };

    if (!isOnline) {
      // Offline buffering
      const updatedQueue = [...offlineQueue, leadPayload];
      setOfflineQueue(updatedQueue);
      localStorage.setItem("vertex_offline_oh_kiosk", JSON.stringify(updatedQueue));
      toast.warning("Saved Offline! Check-in cached safely in local storage database queue.");
      
      // Update Live list
      setLiveLog([{ name: guestName, email: guestEmail, phone: guestPhone, time: "Buffered (Offline)", vip: false, mortgageInterest: guestMortgageHelp }, ...liveLog]);
    } else {
      // Live routing through standard API
      try {
        await createLead(selectedEvent?.listingId || "DEMO_SIGNUP", leadPayload as any);
        toast.success(`Welcome registered! Lead synced to agent dashboard databases.`);
        
        // Update live list
        setLiveLog([{ name: guestName, email: guestEmail, phone: guestPhone, time: "Just now", vip: false, mortgageInterest: guestMortgageHelp }, ...liveLog]);
      } catch (err) {
        console.error("Fire-off failed, putting in backup queue", err);
        const updatedQueue = [...offlineQueue, leadPayload];
        setOfflineQueue(updatedQueue);
        localStorage.setItem("vertex_offline_oh_kiosk", JSON.stringify(updatedQueue));
      }
    }

    setCheckoutComplete(true);
  };

  const handleSyncOffline = async () => {
    if (offlineQueue.length === 0) {
      toast.info("No buffered registrations in queue.");
      return;
    }
    setSyncing(true);
    try {
      for (const od of offlineQueue) {
        await createLead(od.listingId, od as any);
      }
      setOfflineQueue([]);
      localStorage.removeItem("vertex_offline_oh_kiosk");
      toast.success("Synchronized all cached offline registrations directly into Firestore!");
    } catch (e) {
      toast.error("Auto sync met transient connectivity blocks. Retrying shortly.");
    } finally {
      setSyncing(false);
    }
  };

  const handleResetKiosk = () => {
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setGuestMortgageHelp(false);
    setGuestCustomAnswers({});
    setCheckoutComplete(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 font-sans">Open House Planner</h1>
          <p className="text-slate-500 mt-1">Deploy digital guest registration sheets, customize compliance gates, and sync with live AI Tours.</p>
        </div>
        
        <div className="flex items-center gap-1.5 self-start md:self-center">
          <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${isOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5 animate-pulse" />}
            {isOnline ? "Kiosk Online" : "Kiosk Offline Mode Ready"}
          </div>
          {offlineQueue.length > 0 && (
            <Button 
              onClick={handleSyncOffline} 
              disabled={syncing}
              className="bg-amber-600 hover:bg-amber-500 text-xs font-bold gap-1 px-3 py-1 h-8 animate-pulse"
            >
              <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
              Sync Queue ({offlineQueue.length})
            </Button>
          )}
        </div>
      </div>

      {/* Primary Subpages Navigation Tabs */}
      <div className="flex border-b text-slate-500 text-xs font-bold uppercase tracking-wider overflow-x-auto gap-4 md:gap-6">
        <button 
          onClick={() => setActiveTab("dashboard")}
          className={`pb-2.5 outline-none whitespace-nowrap ${activeTab === 'dashboard' ? 'text-amber-700 border-b-2 border-amber-600 font-black' : 'hover:text-stone-800'}`}
        >
          Active Events
        </button>
        <button 
          onClick={() => {
            setActiveTab("setup");
            setEventName("");
            setAgentNotes("");
          }}
          className={`pb-2.5 outline-none whitespace-nowrap ${activeTab === 'setup' ? 'text-amber-700 border-b-2 border-amber-600 font-black' : 'hover:text-stone-800'}`}
        >
          Event Planner
        </button>
        <button 
          onClick={() => setActiveTab("questions")}
          className={`pb-2.5 outline-none whitespace-nowrap ${activeTab === 'questions' ? 'text-amber-700 border-b-2 border-amber-600 font-black' : 'hover:text-stone-800'}`}
        >
          Registration Flow
        </button>
        <button 
          onClick={() => setActiveTab("qr")}
          className={`pb-2.5 outline-none whitespace-nowrap ${activeTab === 'qr' ? 'text-amber-700 border-b-2 border-amber-600 font-black' : 'hover:text-stone-800'}`}
        >
          Sign-In QRs
        </button>
        <button 
          onClick={() => setActiveTab("simulator")}
          className={`pb-2.5 outline-none whitespace-nowrap ${activeTab === 'simulator' ? 'text-amber-700 border-b-2 border-amber-600 font-black' : 'hover:text-stone-800'}`}
        >
          Kiosk Terminal
        </button>
      </div>

      {/* Screen Render Switch */}
      {activeTab === "dashboard" && (
        <div className="grid md:grid-cols-3 gap-6 text-left">
          {/* List of Active events */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-stone-500 mb-2">Registered Exhibitions ({events.length})</h2>
            
            <div className="space-y-4">
              {events.map((evt) => (
                <Card 
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)} 
                  className={`border transition-all hover:shadow-md cursor-pointer ${selectedEvent?.id === evt.id ? 'border-amber-500 bg-[#faf9f6]/40 shadow-sm' : 'border-stone-200 BG-white'}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-bold text-stone-900">{evt.eventName}</CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" /> {evt.listingAddress}
                        </CardDescription>
                      </div>
                      <span className="text-[10px] font-black uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                        Mode: {evt.eventMode}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 grid sm:grid-cols-2 gap-4 text-left border-t border-dashed border-stone-200/50 mt-2">
                    <div className="text-[11px] text-stone-600 space-y-1">
                      <p className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-stone-400" /> Date: <strong>{evt.eventDate || "June 15, 2026"}</strong></p>
                      <p className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-stone-400" /> Hours: <strong>{evt.startTime} - {evt.endTime}</strong></p>
                    </div>
                    <div className="text-[11px] text-stone-600 space-y-1">
                      <p>Linked Sora guided tour: <strong>{evt.aiTourLinked ? "Synced & Active" : "Disabled"}</strong></p>
                      <p>Mortgage Opt-In Query: <strong>{evt.mortgageQuestion ? "Enabled" : "Disabled"}</strong></p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick actions & stats on Selected Event */}
          <div className="space-y-6">
            {selectedEvent ? (
              <Card className="border-stone-200 bg-white">
                <CardHeader className="pb-3 border-b border-light-divider">
                  <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Quick Actions for Current Event</p>
                  <CardTitle className="text-sm font-bold text-stone-900 mt-1">{selectedEvent.eventName}</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3 font-sans">
                  
                  {/* Start Kiosk Button */}
                  <Button 
                    onClick={() => setActiveTab("simulator")}
                    className="w-full bg-amber-600 hover:bg-amber-500 font-bold text-xs h-10 tracking-wide flex items-center justify-center gap-1.5"
                  >
                    <Smartphone className="h-4 w-4" /> Start Sign-In Kiosk
                  </Button>

                  <Button 
                    onClick={() => setActiveTab("qr")}
                    variant="outline"
                    className="w-full border-stone-200 text-stone-800 hover:bg-stone-50 text-xs font-bold h-10 tracking-wide flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="h-4 w-4 text-amber-600" /> Fetch QR Displays
                  </Button>

                  <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-600 space-y-2">
                    <p className="font-bold text-stone-800">Private Host Notes:</p>
                    <p className="italic leading-normal bg-stone-50 p-2.5 rounded-lg border">
                      {selectedEvent.agentNotes || "No notes pre-configured for this events session."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <p className="text-xs text-slate-400 mt-8 italic text-center">Select an event to load quick parameters.</p>
            )}
          </div>
        </div>
      )}

      {/* Screen Setup: Create event */}
      {activeTab === "setup" && (
        <Card className="max-w-2xl mx-auto border-stone-200 bg-white text-left">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-600" /> Plan New Open House
            </CardTitle>
            <CardDescription className="text-xs">Provide listings logistics, dates, and customize access gates.</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="oh-name" className="text-xs font-bold uppercase text-stone-600">Event Name</Label>
                <Input 
                  id="oh-name"
                  placeholder="e.g. Luxury Saturday Showings" 
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="h-9 text-xs" 
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="oh-listing" className="text-xs font-bold uppercase text-stone-600">Listing Selector</Label>
                <select 
                  id="oh-listing"
                  className="bg-white border w-full h-9 rounded-md outline-none px-2 focus:ring-1 focus:ring-amber-500 text-xs text-stone-800"
                  value={selectedListingId}
                  onChange={(e) => setSelectedListingId(e.target.value)}
                >
                  {listings.map(l => (
                    <option key={l.id} value={l.id}>{l.address} ({l.city})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="oh-date" className="text-xs font-bold uppercase text-stone-600">Event Date</Label>
                <Input 
                  id="oh-date"
                  type="date" 
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="h-9 text-xs" 
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="oh-mode" className="text-xs font-bold uppercase text-stone-600">Event Mode</Label>
                <select 
                  id="oh-mode"
                  className="bg-white border w-full h-9 rounded-md outline-none px-2 focus:ring-1 focus:ring-amber-500 text-xs text-stone-800"
                  value={eventMode}
                  onChange={(e) => setEventMode(e.target.value as any)}
                >
                  <option value="Tablet">Tablet Kiosk (Manual registration)</option>
                  <option value="QR">Touchless QR (Scan phone check-in)</option>
                  <option value="Hybrid">Hybrid (Both flows active)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="oh-start" className="text-xs font-bold uppercase text-stone-600">Start Time</Label>
                <select 
                  id="oh-start"
                  className="bg-white border w-full h-9 rounded-md outline-none px-2 focus:ring-1 focus:ring-amber-500 text-xs text-stone-800"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                >
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="oh-end" className="text-xs font-bold uppercase text-stone-600">End Time</Label>
                <select 
                  id="oh-end"
                  className="bg-white border w-full h-9 rounded-md outline-none px-2 focus:ring-1 focus:ring-amber-500 text-xs text-stone-800"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                >
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkbox configs matches Setup toggles */}
            <div className="border-t pt-4 space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-stone-500">Exhibition Control Parameters</p>
              
              <div className="grid sm:grid-cols-2 gap-3 mt-1 text-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input 
                    type="checkbox" 
                    checked={gateToggle} 
                    onChange={(e) => setGateToggle(e.target.checked)}
                    className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 accent-amber-600"
                  />
                  Require Sign-In to Unlock (Gate Open)
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input 
                    type="checkbox" 
                    checked={aiTourLinked} 
                    onChange={(e) => setAiTourLinked(e.target.checked)}
                    className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 accent-amber-600"
                  />
                  Link direct scan map to Sora Tour
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input 
                    type="checkbox" 
                    checked={lenderShown} 
                    onChange={(e) => setLenderShown(e.target.checked)}
                    className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 accent-amber-600"
                  />
                  Display paired mortgage specialist brand
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input 
                    type="checkbox" 
                    checked={mortgageQuestion} 
                    onChange={(e) => setMortgageQuestion(e.target.checked)}
                    className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 accent-amber-600"
                  />
                  Include Financing Pre-Approval CTA
                </label>
              </div>
            </div>

            <div className="space-y-1 border-t pt-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="oh-notes" className="text-xs font-bold uppercase text-stone-600">Agent Notes & Preparation</Label>
                <Button 
                  type="button" 
                  onClick={handleAiAssistNotes}
                  disabled={assistingNotes || !agentNotes}
                  variant="ghost"
                  className="text-[10px] text-amber-700 hover:text-amber-800 hover:bg-amber-50 h-7 px-2 font-bold gap-1 mt-0.5"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${assistingNotes ? 'animate-spin' : ''}`} /> 
                  {assistingNotes ? "Optimizing..." : "AI Assist"}
                </Button>
              </div>
              <Textarea 
                id="oh-notes"
                placeholder="Mention specific renovations, architectural highlights, or school districts here..." 
                value={agentNotes}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val.length > 0) {
                    val = val.charAt(0).toUpperCase() + val.slice(1);
                  }
                  if (val.length <= 2000) {
                    setAgentNotes(val);
                  }
                }}
                maxLength={2000}
                rows={3}
                className="text-xs text-stone-800" 
              />
              <div className="flex justify-end">
                <span className="text-[9px] text-stone-400 font-mono">
                  {agentNotes.length} / 2000 chars (First capitalized)
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t p-4 mt-2">
            <Button variant="outline" onClick={() => setActiveTab("dashboard")} className="text-xs font-bold h-9 bg-white">Cancel</Button>
            <Button onClick={handleSaveSetup} className="bg-amber-600 hover:bg-amber-500 text-xs font-bold h-9">Save & Deploy Event</Button>
          </CardFooter>
        </Card>
      )}

      {/* Questions setup */}
      {activeTab === "questions" && (
        <Card className="max-w-xl mx-auto border-stone-200 bg-white text-left">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sliders className="h-5 w-5 text-amber-600" /> Sign-In Form Rules
            </CardTitle>
            <CardDescription className="text-xs">Adjust regulatory, pre-approval, and compliance fields.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="p-3 bg-stone-50 rounded-xl border space-y-2">
              <p className="text-[10px] uppercase font-black text-amber-700 tracking-wider">Required Core Validation Rule</p>
              <p className="text-xs font-bold text-stone-800">"Require Name, Require at least one contact method: Email or Phone. Allow guest to skip Email or Phone, but not both"</p>
              <p className="text-[11px] text-stone-500 leading-normal">
                This low-friction check guarantees you get contact credentials while keeping sign-in conversions exceptionally high on mobile.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-black uppercase text-stone-500">Custom Questions Panel</p>
              
              <div className="space-y-2">
                {customQuestions.map((q, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-stone-50/50 p-2.5 rounded-lg border text-xs">
                    <span className="font-bold text-stone-800">{q}</span>
                    <button 
                      onClick={() => handleDeleteQuestion(idx)}
                      className="text-rose-500 hover:text-rose-600 font-bold"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 flex gap-2">
                <Input 
                  placeholder="e.g. Do you currently own or rent?" 
                  value={newCustomQuestion}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val.length > 0) {
                      val = val.charAt(0).toUpperCase() + val.slice(1);
                    }
                    setNewCustomQuestion(val);
                  }}
                  className="h-9 text-xs" 
                />
                <Button onClick={handleAddQuestion} className="bg-amber-600 hover:bg-amber-500 text-xs font-bold h-9">
                  Add Question
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign-In QRs */}
      {activeTab === "qr" && (
        <Card className="max-w-md mx-auto border-stone-200 bg-white text-center">
          <CardHeader>
            <CardTitle className="text-base font-bold">Dynamic QR Display Manager</CardTitle>
            <CardDescription className="text-xs">Exhibition guests scan this code to access check-in sheets or launching the guided tour.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center space-y-4 font-sans">
            <div className="bg-white p-4 rounded-2xl border-stone-200 shadow-md border">
              <QRCodeSVG 
                value={`${window.location.origin}/open-houses?listingId=${selectedEvent?.listingId || 'default'}`} 
                size={180} 
                level="H"
                fgColor="#292524"
              />
            </div>

            <div className="text-xs text-stone-700 text-left w-full space-y-2 pt-2 bg-stone-50 p-4 rounded-xl border">
              <p className="font-bold uppercase tracking-wider text-[9px] text-amber-700">QR Scan Destination</p>
              <p className="font-mono text-[10px] text-blue-600 truncate bg-white p-1 rounded border">
                {window.location.origin}/open-houses?listingId={selectedEvent?.listingId || 'default'}
              </p>
              <p className="text-[10px] text-stone-500 leading-normal">
                Perfect to print on luxury tabletop stands, giving buyers a touchless check-in process instantly.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simulator: Guest & Tablet Host view */}
      {activeTab === "simulator" && (
        <div className="grid lg:grid-cols-2 gap-8 text-left font-sans">
          
          {/* LEFT: Guest Sign-In Terminal Form (matches Guest Sign-In, Thank You, and Gate rules) */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase text-amber-700 tracking-wider">Guest-Facing Terminal</h2>
            
            <Card className="border-stone-300 shadow-xl bg-white rounded-2xl overflow-hidden">
              <div className="bg-stone-900 text-white p-5 text-center relative">
                <div className="absolute top-2 left-2 bg-amber-500 text-stone-900 border border-amber-300 rounded font-black text-[9px] px-1 animate-pulse">
                  TABLET KIOSK ACTIVE
                </div>
                <h3 className="text-lg font-bold tracking-tight">Welcome to {selectedEvent?.listingAddress || "Luxury Property Tour"}</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">Please check in to proceed with your guided tour experience.</p>
              </div>

              <CardContent className="p-6">
                {pauseSignIn ? (
                  <div className="text-center py-10 space-y-4 animate-in fade-in duration-300">
                    <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                      <Lock className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-stone-900">Sign-In Temporarily Paused</h4>
                      <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                        Your host has temporarily paused registrations. Please speak with the agent or try again in a brief moment!
                      </p>
                    </div>
                  </div>
                ) : !checkoutComplete ? (
                  <form onSubmit={handleGuestSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="guest-name" className="text-xs font-bold text-stone-700 uppercase">Full Name <span className="text-rose-500">*</span></Label>
                      <Input 
                        id="guest-name"
                        placeholder="John Miller" 
                        value={guestName}
                        onChange={(e) => {
                          const val = e.target.value;
                          const words = val.split(" ");
                          const formatted = words.map((w, idx) => {
                            if (w === "" && idx === words.length - 1) return "";
                            return w.charAt(0).toUpperCase() + w.slice(1);
                          }).join(" ");
                          setGuestName(formatted);
                        }}
                        className="h-10 text-xs text-stone-800" 
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="guest-phone" className="text-xs font-bold text-stone-700 uppercase">Phone Number</Label>
                        <span className="text-[10px] text-slate-400">One contact is required</span>
                      </div>
                      <Input 
                        id="guest-phone"
                        type="tel"
                        placeholder="(415) 888-2940" 
                        value={guestPhone}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const cleaned = raw.replace(/[^\d]/g, "");
                          if (cleaned.length === 0) {
                            setGuestPhone("");
                            return;
                          }
                          if (cleaned.length <= 3) {
                            setGuestPhone(cleaned);
                          } else if (cleaned.length <= 6) {
                            setGuestPhone(`(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`);
                          } else {
                            setGuestPhone(`(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`);
                          }
                        }}
                        className="h-10 text-xs text-stone-800" 
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="guest-email" className="text-xs font-bold text-stone-700 uppercase">Email Address</Label>
                      <Input 
                        id="guest-email"
                        type="email"
                        placeholder="john.miller@sbcglobal.net" 
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="h-10 text-xs text-stone-800" 
                      />
                    </div>

                    {/* Mortgage opt-in question (Matches Mortgage Question Toggle) */}
                    {selectedEvent?.mortgageQuestion && (
                      <div className="bg-[#faf9f6] p-3 rounded-xl border border-stone-200 mt-2">
                        <label className="flex items-start gap-2.5 cursor-pointer text-xs font-medium text-stone-800 leading-relaxed">
                          <input 
                            type="checkbox" 
                            checked={guestMortgageHelp} 
                            onChange={(e) => setGuestMortgageHelp(e.target.checked)}
                            className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-4 w-4 mt-0.5 accent-amber-600"
                          />
                          <div>
                            <p className="font-bold text-stone-900">Are you interested in viewing exclusive rate scenarios?</p>
                            <p className="text-[10px] text-stone-500">Pairs you with our active verified mortgage lender, [Preferred Lending Partner].</p>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Custom questions if configured */}
                    {customQuestions.map((q, idx) => (
                      <div key={idx} className="space-y-1">
                        <Label className="text-xs font-bold text-stone-700 uppercase">{q}</Label>
                        <Input 
                          placeholder="Please provide your reply..." 
                          value={guestCustomAnswers[q] || ""}
                          onChange={(e) => setGuestCustomAnswers({ ...guestCustomAnswers, [q]: e.target.value })}
                          className="h-9 text-xs" 
                        />
                      </div>
                    ))}

                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer text-[10px] text-stone-500 leading-normal">
                        <input 
                          type="checkbox" 
                          checked={guestConsent} 
                          onChange={(e) => setGuestConsent(e.target.checked)}
                          className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 mt-0.5 accent-amber-600"
                        />
                        <span>By registering, I consent to receive digital brochures, floor plans, and disclosures regarding {selectedEvent?.listingAddress || 'this listing'} via Email/SMS. Standard board guidelines apply.</span>
                      </label>
                    </div>

                    <Button type="submit" className="w-full bg-stone-900 hover:bg-stone-850 text-xs font-extrabold h-11 uppercase mt-2">
                      Authorize & Check In
                    </Button>
                  </form>
                ) : (
                  /* Thank You Screen (Matches Required Thank-you screen features) */
                  <div className="text-center py-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold text-stone-900">Registration Complete, {guestName}!</h4>
                      <p className="text-xs text-stone-500 leading-relaxed">
                        A smartphone link featuring full agency disclosures and downloadable brochures is traveling to your inbox now.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                      <Button 
                        onClick={() => {
                          toast.success("Guided audio initiated with AI Assistant Sora!");
                          window.open(`/tour/${selectedEvent?.listingId || 'default'}`);
                        }}
                        className="bg-amber-600 hover:bg-amber-500 font-bold text-[10px] uppercase h-10 gap-1"
                      >
                        <Compass className="h-3.5 w-3.5" /> Start AI Tour
                      </Button>

                      <Button 
                        onClick={() => {
                          toast.success("Printed flyer brochure requested.");
                          handleResetKiosk();
                        }}
                        variant="outline"
                        className="border-stone-200 hover:bg-stone-50 text-[10px] uppercase h-10 font-bold"
                      >
                        View Digital Flyer
                      </Button>

                      <Button 
                        onClick={() => {
                          toast.success("Showing booking requested! The agent will touch base shortly.");
                          handleResetKiosk();
                        }}
                        variant="outline"
                        className="col-span-2 border-stone-200 text-blue-600 hover:bg-slate-50 text-[10px] uppercase h-10 font-bold"
                      >
                        Book a Showing
                      </Button>
                    </div>

                    <div className="pt-4 border-t">
                      <button 
                        onClick={handleResetKiosk}
                        className="text-stone-400 hover:text-stone-800 text-[10px] font-black uppercase tracking-wider"
                      >
                        Restart Terminal
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Agent Live Monitor Controls (Matches Live Event Mode features) */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase text-amber-700 tracking-wider">Host/Agent Live Controls</h2>
            
            <Card className="border-stone-200 bg-white shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="text-xs font-bold text-stone-900">Exhibition Leaderboard</p>
                  <p className="text-[10px] text-stone-500">Monitor guest check-ins, tag VIPs, and review pre-approvals.</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">Live Host Monitor</span>
                </div>
              </div>

              {/* Action grid (Matches Live Event Mode controls) */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Button 
                  onClick={() => {
                    setPauseSignIn(!pauseSignIn);
                    toast.info(pauseSignIn ? "Sign-in sheets resumed." : "Kiosk entries temporarily paused.");
                  }}
                  variant="outline"
                  className={`border text-[10px] uppercase font-bold h-9 w-full ${pauseSignIn ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' : 'bg-white hover:bg-stone-50'}`}
                >
                  {pauseSignIn ? "Resume Sheets" : "Pause Sign-In"}
                </Button>

                <Button 
                  onClick={() => {
                    handleResetKiosk();
                    toast.info("Terminal refreshed to blank state.");
                  }}
                  variant="outline"
                  className="border bg-white text-[10px] uppercase font-bold h-9 hover:bg-stone-50 w-full"
                >
                  Restart Flow
                </Button>
              </div>

              {/* Checkin List (with VIP toggling, Mortgage opt-in view, private notes) */}
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-black uppercase text-stone-500">Live Visitor Feed</p>
                
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {liveLog.map((log, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                        vipMarks[log.name] 
                          ? 'bg-amber-50/55 border-amber-200' 
                          : 'bg-[#fafafa]/50 border-stone-200/80'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-stone-900">{log.name}</span>
                            {vipMarks[log.name] && <span className="text-[8px] font-extrabold uppercase bg-amber-200 text-stone-900 px-1 py-0.5 rounded border border-amber-300">VIP</span>}
                            {log.mortgageInterest && <span className="text-[8px] font-extrabold uppercase bg-sky-100 text-sky-800 px-1 py-0.5 rounded border border-sky-200">Financing help</span>}
                          </div>
                          <p className="text-[10px] text-stone-500 mt-0.5">{log.email} · {log.phone}</p>
                        </div>
                        <span className="text-[9px] text-stone-400 font-medium">{log.time}</span>
                      </div>

                      <div className="flex gap-2 text-[10px] font-bold uppercase transition-colors pt-1 border-t border-stone-100/40">
                        <button 
                          onClick={() => {
                            setVipMarks({ ...vipMarks, [log.name]: !vipMarks[log.name] });
                            toast.success(vipMarks[log.name] ? "Guest un-marked as VIP" : "Guest marked as VIP!");
                          }}
                          className="text-amber-700 hover:text-amber-800 flex items-center gap-1"
                        >
                          {vipMarks[log.name] ? "Remove VIP" : "★ Mark VIP"}
                        </button>

                        <button 
                          onClick={() => {
                            const val = prompt("Enter private host notes for " + log.name + ":", privateNotes[log.name] || "");
                            if (val !== null) {
                              setPrivateNotes({ ...privateNotes, [log.name]: val });
                              toast.info("Private note updated");
                            }
                          }}
                          className="text-stone-500 hover:text-stone-600 flex items-center gap-1"
                        >
                          ✎ {privateNotes[log.name] ? "Edit Host Note" : "Add Host Note"}
                        </button>
                      </div>

                      {privateNotes[log.name] && (
                        <p className="text-[10px] bg-stone-100/60 p-2 border border-stone-200 rounded text-stone-600 italic">
                          <strong>Host Comment:</strong> "{privateNotes[log.name]}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

        </div>
      )}

    </div>
  );
}
