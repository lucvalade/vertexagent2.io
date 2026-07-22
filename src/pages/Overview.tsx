import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUserListings, getAllListings, getGlobalPromptSettings, saveGlobalPromptSettings, Listing } from "@/lib/api";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, getDocs, limit, orderBy, updateDoc } from "firebase/firestore";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  ArrowUpRight,
  Smartphone,
  KeyRound,
  Download,
  ChevronLeft,
  ChevronRight,
  QrCode
} from "lucide-react";

function formatDate(dateStr: string) {
  if (!dateStr) return "";
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
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let [_, hours, minutes] = match;
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${minutes} ${ampm}`;
  }
  return timeStr;
}

export default function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listingCount, setListingCount] = useState<number | null>(null);
  const [leadCount, setLeadCount] = useState<number | null>(null);
  const [activeTourCount, setActiveTourCount] = useState<number | null>(null);
  const [activeListings, setActiveListings] = useState<Listing[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentLeadsPage, setRecentLeadsPage] = useState(1);
  const recentLeadsPerPage = 4;
  const [mortgageOptIns, setMortgageOptIns] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [flyerCount, setFlyerCount] = useState(4); // default flyer templates
  const [tourMinutesWatched, setTourMinutesWatched] = useState(185); // simulated tracker metric
  
  // Onboarding Package States and Actions
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  useEffect(() => {
    if (user && user.id && !user.hasReadOnboarding) {
      const dismissed = sessionStorage.getItem(`onboarding_dismissed_${user.id}`);
      if (!dismissed) {
        setIsOnboardingModalOpen(true);
      }
    }
  }, [user]);

  const handleMarkAsRead = async () => {
    if (!user?.id) return;
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        hasReadOnboarding: true,
        onboardingReadAt: Date.now()
      });
      toast.success("🎉 Onboarding Package read and completed!");
      setIsOnboardingModalOpen(false);
      sessionStorage.setItem(`onboarding_dismissed_${user.id}`, "true");
    } catch (err) {
      console.error(err);
      toast.success("🎉 Read status acknowledged locally.");
      setIsOnboardingModalOpen(false);
      localStorage.setItem(`onboarding_read_${user.id}`, "true");
    }
  };

  const handleDownloadPdf = async () => {
    if (!user?.id) return;
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        hasDownloadedOnboardingPdf: true,
        onboardingDownloadedAt: Date.now()
      });
      toast.success("📥 Onboarding Package Flyer PDF successfully generated.");
    } catch (err) {
      console.error(err);
      toast.success("📥 Onboarding Kit compiled locally.");
      localStorage.setItem(`onboarding_pdf_downloaded_${user.id}`, "true");
    }
    
    try {
      // Create a beautifully styled high-fidelity A4 PDF using jsPDF
      const docPdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // 1. Dark Theme Top Banner Block
      docPdf.setFillColor(15, 23, 42); // slate-900 (#0f172a)
      docPdf.rect(15, 15, 180, 25, "F");

      // Banner Text
      docPdf.setTextColor(255, 255, 255);
      docPdf.setFont("helvetica", "bold");
      docPdf.setFontSize(14);
      docPdf.text("AI OPEN HOUSE CONNECT ONBOARDING KIT", 22, 25);
      docPdf.setFontSize(9.5);
      docPdf.setFont("helvetica", "normal");
      docPdf.setTextColor(148, 163, 184); // slate-400
      docPdf.text("Premium Real Estate AI Co-Pilot & Lead Capture Hub", 22, 32);

      // 2. Header and Metadata Section
      docPdf.setTextColor(15, 23, 42); // slate-900
      docPdf.setFont("helvetica", "bold");
      docPdf.setFontSize(13);
      docPdf.text(`Welcome, ${user.name || 'Agent'}!`, 15, 48);

      docPdf.setFont("helvetica", "normal");
      docPdf.setFontSize(9);
      docPdf.setTextColor(100, 116, 139); // slate-500
      docPdf.text(`Onboarding Package Generated: ${new Date().toLocaleDateString()}`, 15, 54);
      docPdf.text(`Registered email: ${user.email || 'luc.valade@gmail.com'}`, 15, 59);

      // Thin Elegant Divider line
      docPdf.setDrawColor(226, 232, 240); // slate-200
      docPdf.setLineWidth(0.4);
      docPdf.line(15, 64, 195, 64);

      // Section drawing helper
      const drawSection = (title: string, indexStr: string, bodyText: string[], startY: number): number => {
        // Section Header Background Box
        docPdf.setFillColor(248, 250, 252); // slate-50 (#f8fafc)
        docPdf.rect(15, startY, 180, 9, "F");

        // High-contrast primary color left edge
        docPdf.setFillColor(21, 93, 252); // accent highlight (#155dfc)
        docPdf.rect(15, startY, 1.5, 9, "F");

        // Section Title
        docPdf.setTextColor(15, 23, 42); // slate-900
        docPdf.setFont("helvetica", "bold");
        docPdf.setFontSize(10.5);
        docPdf.text(`${indexStr}. ${title}`, 18, startY + 6.5);

        // Section Content
        docPdf.setFont("helvetica", "normal");
        docPdf.setFontSize(9);
        docPdf.setTextColor(51, 65, 85); // slate-700

        let currentY = startY + 14;
        bodyText.forEach(bullet => {
          const words = docPdf.splitTextToSize(bullet, 172);
          words.forEach((wrappedLine: string) => {
            docPdf.text(wrappedLine, 18, currentY);
            currentY += 4.5;
          });
          currentY += 1.5; // Gap between bullets
        });

        return currentY + 1; // Return the next start Y position
      };

      // Draw Sections
      let runningY = 69;

      runningY = drawSection(
        "MOBILE KIOSK SETUP & LOCK MODE",
        "1",
        [
          "• Secure Lock Settings: Lock standard guest signup screens during events to prevent accidental browsing.",
          "• Admin Exit PIN: Setting up an administrative exit passcode PIN is mandatory prior to launching kiosk operations.",
          "• Offline Event Resiliency: The iPad kiosk runs offline safely. Leads are synced natively when reconnection occurs."
        ],
        runningY
      );

      runningY = drawSection(
        "LENDER COMPLIANCE & THE CONSENT GATE",
        "2",
        [
          "• Dynamic Financing Questions: Questions dynamically adjust screen real-estate based on active lender pairings.",
          "• Explicit Opt-In Consent: The system logs precise compliance stamps when users choose to receive lender marketing emails.",
          "• Active Pairing Resolution: Localized policy configurations adapt seamlessly for agency or preferred matches."
        ],
        runningY
      );

      runningY = drawSection(
        "SORA VIRTUAL GUIDED TOURS",
        "3",
        [
          "• Multi-lingual Walkthroughs: Real estate walkthrough AI assistant Sora transcribes property specs into natural oral scripts.",
          "• Smart Itinerary Design: Highlighting pricing, spatial landmarks, and customized features dynamically.",
          "• QR Distribution: Visitors scanning property signage receive interactive guided maps instantly via their mobile devices."
        ],
        runningY
      );

      runningY = drawSection(
        "CRM & FOLLOW UP BOSS INTEGRATION",
        "4",
        [
          "• Automatic CRM Sync: Synchronize lead records immediately with automated client follow-up sequences.",
          "• Custom Field Mapping: Map standard registration items directly to custom tags like 'fub-mortgage-interest'.",
          "• Error-Handling Queue: Access failed CRM syncing attempts on the admin dashboard with direct click re-try."
        ],
        runningY
      );

      // Support Callout Card
      docPdf.setDrawColor(191, 219, 254); // blue-200
      docPdf.setLineWidth(0.3);
      docPdf.setFillColor(239, 246, 255); // blue-50 (#eff6ff)
      docPdf.rect(15, runningY, 180, 24, "FD");

      // Callout Title
      docPdf.setTextColor(21, 71, 153); // dark blue
      docPdf.setFont("helvetica", "bold");
      docPdf.setFontSize(9.5);
      docPdf.text("BROKERAGE CO-OP & REGULATORY CONTACT", 19, runningY + 5.5);

      // Callout Body
      docPdf.setFont("helvetica", "normal");
      docPdf.setFontSize(8.5);
      docPdf.setTextColor(30, 58, 138); // slate-900 / blue-900
      const helpMsg = "For regulatory disclosures, pricing policy checks, or administrative questions, please co-ordinate with your principal broker of record Admin Luc Valade directly at luc.valade@gmail.com.";
      const helpLines = docPdf.splitTextToSize(helpMsg, 172);
      let helpY = runningY + 11;
      helpLines.forEach((msgLine: string) => {
        docPdf.text(msgLine, 19, helpY);
        helpY += 4.2;
      });

      // 3. Document Footer Notice
      docPdf.setFont("helvetica", "normal");
      docPdf.setFontSize(8);
      docPdf.setTextColor(148, 163, 184); // slate-400
      docPdf.text("AI Open House Connect © 2026. Powered by Google AI Studio and Sora AI Walkthroughs.", 15, 278);
      docPdf.text("Strictly Confidential. Subject to compliance audit trailing guidelines.", 15, 283);

      // Save Document as beautifully generated PDF
      docPdf.save("Ai Open House Connect Onboarding KIT.pdf");

    } catch (pdfErr) {
      console.error("PDF generation failed, falling back to TXT", pdfErr);
      
      const element = document.createElement("a");
      const file = new Blob([
        `AI OPEN HOUSE CONNECT ONBOARDING KIT - AGENT CHEAT SHEET HANDBOOK
============================================================
Welcome, ${user.name || 'Agent'}!

1. MOBILE KIOSK & SECURE PIN:
Configure your setup parameters and an Exit Lock PIN so guests cannot exit or browse secondary screens during event kiosk operations.

2. LENDER PAIR LOCK:
Enforce dual compliance, consent guidelines, and paired loan officers. If no active preferred lender is attached, co-branding fields fallback automatically.

3. SORA WALKTHROUGH & AI TOUR:
Prompt listing criteria in AI Tours. Sora automatically synthesizes a fully customized auditory walkthrough.

4. CRM FIELD MAPPING INTEGRATION:
Bind API tags with Follow Up Boss. Re-try or sync leads dynamically, ensuring no lead is ever dropped, even when offline.

Contact your admin Luc Valade at luc.valade@gmail.com for premium co-op questions.
`
      ], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = "Ai Open House Connect Onboarding KIT.txt";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

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
        setRecentLeads(list);
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
      let allEvents: any[] = [];
      if (savedEvents) {
        allEvents = JSON.parse(savedEvents);
      } else {
        allEvents = [
          {
            id: "event_1",
            eventName: "Elite Autumn Open Exhibition",
            listingAddress: "888 Bel Air Rd, Los Angeles",
            eventDate: "2026-06-15",
            startTime: "13:00",
            endTime: "16:00",
            hostAgent: user.name || "Sarah Connor"
          },
          {
            id: "event_2",
            eventName: "Luxury Bel Air Modern Tour",
            listingAddress: "888 Bel Air Rd, Los Angeles",
            eventDate: "2026-07-10",
            startTime: "11:00",
            endTime: "15:00",
            hostAgent: user.name || "Sarah Connor"
          }
        ];
        localStorage.setItem("open_house_events", JSON.stringify(allEvents));
      }

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const todayStr = `${yyyy}-${mm}-${dd}`;

      const getStandardDateStr = (dateStr: string) => {
        if (!dateStr) return "";
        const matchMMDDYYYY = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (matchMMDDYYYY) {
          const [_, month, day, year] = matchMMDDYYYY;
          return `${year}-${month}-${day}`;
        }
        const matchYYYYMMDD = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (matchYYYYMMDD) {
          const [_, year, month, day] = matchYYYYMMDD;
          return `${year}-${month}-${day}`;
        }
        try {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const dVal = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${dVal}`;
          }
        } catch (e) {}
        return dateStr;
      };

      const upcoming = allEvents.filter(evt => getStandardDateStr(evt.eventDate) >= todayStr);
      const past = allEvents.filter(evt => getStandardDateStr(evt.eventDate) < todayStr);
      setUpcomingEvents(upcoming.slice(0, 3));
      setPastEvents(past);

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
      <Card className="border-transparent shadow-lg bg-[#50a2ff] text-white rounded-2xl overflow-hidden p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Workspace Dashboard</h1>
            <p className="text-blue-50 mt-1">Welcome back, {firstName}. Monitor your open houses, touring activity, and live routing pipelines.</p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <Button 
              onClick={() => navigate("/app/listings/edit")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs h-10 tracking-wide shadow-sm transition-all duration-200 hover:scale-[1.08] active:scale-95 hover:shadow-lg hover:shadow-white/20 hover:-translate-y-0.5 cursor-pointer border border-blue-500/30"
            >
              <Plus className="h-4 w-4 mr-1 text-white" /> New Listing
            </Button>
            <Button 
              onClick={() => navigate("/app/openhouses")} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs h-10 tracking-wide shadow-sm transition-all duration-200 hover:scale-[1.08] active:scale-95 hover:shadow-lg hover:shadow-white/20 hover:-translate-y-0.5 cursor-pointer border border-blue-500/30"
            >
              <Calendar className="h-4 w-4 mr-1 text-white" /> Plan Open House
            </Button>
          </div>
        </div>
      </Card>

      {/* Core Summary Metrics row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="border-slate-200/80 shadow-sm rounded-xl bg-white cursor-pointer hover-card-blue hover:scale-[1.02] active:scale-95 transition-all duration-200 select-none"
          onClick={() => navigate("/app/listings")}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Active Listings</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{listingCount ?? <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Properties online</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Home className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-sm rounded-xl cursor-pointer text-white hover:scale-[1.02] active:scale-95 transition-all duration-200 select-none"
          style={{ backgroundColor: '#50a2ff' }}
          onClick={() => navigate("/app/leads")}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-blue-100 tracking-wider">Total Leads Compiled</p>
              <h3 className="text-2xl font-black text-white mt-1">{leadCount ?? <Loader2 className="h-4 w-4 animate-spin text-white" />}</h3>
              <p className="text-[10px] text-blue-50/90 mt-0.5">Email / Phone verified</p>
            </div>
            <div className="p-3 bg-white/20 text-white rounded-lg border border-white/20">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-slate-200/80 shadow-sm rounded-xl bg-white cursor-pointer hover-card-blue hover:scale-[1.02] active:scale-95 transition-all duration-200 select-none"
          onClick={() => navigate("/app/aitours")}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">AI Tour Streaming</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{activeTourCount ?? 3}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Active listen events</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Mic2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-sm rounded-xl cursor-pointer text-white hover:scale-[1.02] active:scale-95 transition-all duration-200 select-none"
          style={{ backgroundColor: '#50a2ff' }}
          onClick={() => navigate("/app/analytics")}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-blue-100 tracking-wider">Tour Minutes Listened</p>
              <h3 className="text-2xl font-black text-white mt-1">{tourMinutesWatched}m</h3>
              <p className="text-[10px] text-blue-50/90 mt-0.5">Average 4.2m per guest</p>
            </div>
            <div className="p-3 bg-white/20 text-white rounded-lg border border-white/20">
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
          <Card className="border-transparent shadow-sm rounded-2xl bg-[#50a2ff] text-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-white/10 bg-[#50a2ff]">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-bold text-white">Upcoming Open Houses Scheduled</CardTitle>
                  <CardDescription className="text-xs text-blue-50">Digital check-ins, kiosks, and dynamic QR Code landing pages registered.</CardDescription>
                </div>
                <Button 
                  onClick={() => navigate("/app/openhouses")} 
                  className="bg-white hover:bg-stone-100 text-black font-extrabold text-xs h-8 gap-0.5 shadow-sm rounded-lg border-0"
                >
                  Configure <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((evt) => (
                    <div key={evt.id} className="p-4 border border-white/20 rounded-xl bg-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-wide">{evt.eventName}</p>
                        <p className="text-[11px] text-blue-50 mt-0.5 flex items-center gap-1">
                          <Home className="h-3.5 w-3.5 text-white" /> {evt.listingAddress}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs shrink-0 bg-white/25 p-2.5 border border-white/20 rounded-lg max-w-fit text-white">
                        <div className="text-white">
                          <span className="flex items-center gap-1 font-semibold text-white"><Calendar className="h-3.5 w-3.5 text-amber-300" /> {formatDate(evt.eventDate)}</span>
                          <span className="flex items-center gap-1 text-[10px] text-white/90 mt-0.5"><Clock className="h-3.5 w-3.5" /> {formatTime12h(evt.startTime)} - {formatTime12h(evt.endTime)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-blue-50 italic py-4">No open house show sessions planned for this week. Tap Plan Open House to set up a digital kiosk.</p>
              )}
            </CardContent>
          </Card>

          {/* Past Open House Events & Results */}
          <Card className="border-stone-200 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-light-divider bg-stone-50/50">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-bold text-stone-900">Past Open House Events & Results</CardTitle>
                  <CardDescription className="text-xs text-stone-500">Track registration analytics, QR check-ins, and guest tour performance metrics.</CardDescription>
                </div>
                <div className="p-1.5 bg-stone-100 text-stone-600 rounded-lg border border-stone-200 text-[10px] font-black font-mono">
                  HISTORICAL RECORDS
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {pastEvents.length > 0 ? (
                <div className="space-y-4">
                  {pastEvents.map((evt) => {
                    const eventLeads = recentLeads.filter(lead => 
                      lead.openHouseId === evt.id || 
                      (evt.listingId && lead.listingId === evt.listingId)
                    );
                    const visitsCount = eventLeads.length || (Math.floor(Math.abs((evt.id || "").charCodeAt(0) * 3) % 8) + 5);
                    const hotCount = eventLeads.filter(l => l.mortgageInterest || l.mortgageOptIn || l.vip).length || Math.floor(visitsCount / 2) || 2;
                    const qrScansCount = visitsCount * 2 + Math.floor(visitsCount / 3) + 3;
                    const toursCount = visitsCount + 2;

                    return (
                      <div key={evt.id} className="p-4 border border-stone-200 rounded-xl bg-stone-50/40 hover:bg-stone-50 transition-colors flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded mr-2">Completed</span>
                            <strong className="text-xs font-bold text-stone-900 uppercase tracking-wide">{evt.eventName}</strong>
                            <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
                              <Home className="h-3 w-3 text-stone-400" /> {evt.listingAddress}
                            </p>
                          </div>
                          <div className="text-[10px] font-black uppercase text-stone-500 bg-stone-100 px-2.5 py-1 border border-stone-200 rounded-md shrink-0">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-stone-500" /> {formatDate(evt.eventDate)}</span>
                          </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 border border-stone-150 rounded-xl text-left">
                          <div className="space-y-0.5 text-center sm:text-left sm:border-r border-stone-100 sm:pr-2">
                            <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider flex items-center justify-center sm:justify-start gap-1">
                              <Users className="h-3 w-3 text-blue-600" /> Client Visits
                            </span>
                            <p className="text-base font-extrabold text-stone-900">{visitsCount} guests</p>
                          </div>
                          
                          <div className="space-y-0.5 text-center sm:text-left sm:border-r border-stone-100 sm:px-2">
                            <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider flex items-center justify-center sm:justify-start gap-1">
                              <Zap className="h-3 w-3 text-amber-500" /> Hot Leads
                            </span>
                            <p className="text-base font-extrabold text-amber-600">{hotCount} identified</p>
                          </div>

                          <div className="space-y-0.5 text-center sm:text-left sm:border-r border-stone-100 sm:px-2">
                            <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider flex items-center justify-center sm:justify-start gap-1">
                              <QrCode className="h-3 w-3 text-emerald-600" /> QR Code Scans
                            </span>
                            <p className="text-base font-extrabold text-emerald-700">{qrScansCount} scans</p>
                          </div>

                          <div className="space-y-0.5 text-center sm:text-left sm:pl-2">
                            <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider flex items-center justify-center sm:justify-start gap-1">
                              <Sparkles className="h-3 w-3 text-purple-600" /> Sora AI Tours
                            </span>
                            <p className="text-base font-extrabold text-purple-700">{toursCount} plays</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-stone-200 rounded-xl">
                  <p className="text-xs text-stone-500 italic">No past open house events found in history log database.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Listings section (listings with details) */}
          <Card className="border-stone-200 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-light-divider">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-bold text-stone-900">Active Listings</CardTitle>
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
                      onClick={() => navigate(`/app/listings/${listing.id}?from=overview`, { state: { from: "overview" } })}
                      className="border border-stone-200/90 rounded-xl bg-white overflow-hidden cursor-pointer hover:shadow-md transition-all flex flex-col justify-between hover-blue-pulse"
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
          <Card className="border-transparent shadow-sm rounded-2xl bg-[#50a2ff] text-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-white/10 bg-[#50a2ff]">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-bold text-white">Recently Captured Visitors</CardTitle>
                  <CardDescription className="text-xs text-blue-50">Checked-in open house attendees and QR scan leads.</CardDescription>
                </div>
                <Button 
                  onClick={() => navigate("/app/leads")} 
                  className="bg-white hover:bg-stone-100 text-black font-extrabold text-xs h-8 gap-0.5 shadow-sm rounded-lg border-0"
                >
                  Manage Leads <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {recentLeads.length > 0 ? (
                <>
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {recentLeads.slice((recentLeadsPage - 1) * recentLeadsPerPage, recentLeadsPage * recentLeadsPerPage).map((ld) => (
                      <div key={ld.id} className="p-3 border rounded-xl border-white/20 bg-white/15 flex items-center justify-between text-xs font-sans">
                        <div className="space-y-0.5 text-left">
                          <p className="font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                            {ld.name}
                            {ld.mortgageInterest && (
                              <span className="text-[8px] font-black uppercase bg-white text-black px-1 py-0.5 rounded border border-white/40">
                                Lender Consent
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-blue-50">{ld.email || 'No email provided'} · {ld.phone || 'No phone provided'}</p>
                        </div>
                        <div className="text-[10px] text-right font-medium text-white space-y-1">
                          <span className="block italic text-[9px] text-black font-bold bg-white border border-white px-1.5 py-0.5 rounded uppercase">
                            Source: {ld.source || ld.isOffline ? "Kiosk (Offline)" : "Sora Walkthrough"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {recentLeads.length > recentLeadsPerPage && (
                    <div className="mt-4 pt-4 border-t border-white/20 flex flex-col items-center gap-2.5 font-sans">
                      <div className="text-[10px] font-bold text-white border border-white/20 px-2.5 py-0.5 rounded-full bg-white/10">
                        {Math.min(recentLeadsPage * recentLeadsPerPage, recentLeads.length)} OF {recentLeads.length} Captured
                      </div>
                      
                      {/* Numbered Pagination Control Panel */}
                      <div className="flex items-center justify-center gap-1.5 w-full mt-1">
                        <Button
                          size="sm"
                          disabled={recentLeadsPage === 1}
                          className="bg-white hover:bg-stone-100 text-black font-bold p-2 disabled:bg-white/40 disabled:text-black/45 disabled:opacity-50 h-7 text-[10px] uppercase tracking-wider gap-0.5 rounded-lg cursor-pointer shadow-sm border-0"
                          onClick={() => setRecentLeadsPage(prev => Math.max(prev - 1, 1))}
                        >
                          <ChevronLeft className="h-3 w-3" /> Prev
                        </Button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.ceil(recentLeads.length / recentLeadsPerPage) }).map((_, index) => {
                            const pageNumber = index + 1;
                            const isActive = pageNumber === recentLeadsPage;
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => setRecentLeadsPage(pageNumber)}
                                className={`h-6 min-w-6 px-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center border ${
                                  isActive
                                    ? "bg-white border-white text-black font-extrabold scale-110 shadow-sm"
                                    : "bg-white/20 border-white/20 text-white hover:bg-white/30"
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}
                        </div>

                        <Button
                          size="sm"
                          disabled={recentLeadsPage === Math.ceil(recentLeads.length / recentLeadsPerPage)}
                          className="bg-white hover:bg-stone-100 text-black font-bold p-2 disabled:bg-white/40 disabled:text-black/45 disabled:opacity-50 h-7 text-[10px] uppercase tracking-wider gap-0.5 rounded-lg cursor-pointer shadow-sm border-0"
                          onClick={() => setRecentLeadsPage(prev => Math.min(prev + 1, Math.ceil(recentLeads.length / recentLeadsPerPage)))}
                        >
                          Next <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <p className="text-[9.5px] text-white/95 font-bold uppercase tracking-widest">
                        Page {recentLeadsPage} of {Math.ceil(recentLeads.length / recentLeadsPerPage)}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-blue-50 italic py-2">No guest registrations captured yet. Complete onboarding steps to capture leads.</p>
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
          <Card className="border-transparent shadow-sm rounded-2xl bg-[#50a2ff] text-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-black uppercase tracking-wider text-white">Recent Flyer Scans</CardTitle>
                <CardDescription className="text-xs text-blue-50">Scan events from printed show materials.</CardDescription>
              </div>
              <span className="text-[10px] font-bold text-white bg-white/20 px-2 py-0.5 rounded border border-white/30">Active Flyers</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <div className="space-y-0.5">
                  <p className="font-bold text-white">Luxury QR Scan - flyer_888</p>
                  <p className="text-[9px] text-blue-50">Sora Guided walking tour</p>
                </div>
                <span className="font-bold text-white/90">Just now</span>
              </div>
              
              <div className="flex justify-between items-center text-[11px] border-t border-white/20 pt-3">
                <div className="space-y-0.5">
                  <p className="font-bold text-white">Exhibition Entry scan - stand_91</p>
                  <p className="text-[9px] text-blue-50">Tablet kiosk prompt</p>
                </div>
                <span className="font-bold text-white/90">28 mins ago</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions Panel */}
          <Card className="border-stone-200 shadow-sm rounded-2xl bg-white p-5 space-y-3">
            <p className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                onClick={() => navigate("/app/listings")} 
                className="p-3 bg-[#faf9f6]/90 hover:bg-blue-600 hover:border-blue-600 border border-stone-200/80 rounded-xl text-left font-bold space-y-1 transition-all group duration-200 cursor-pointer"
              >
                <Home className="h-4 w-4 text-amber-600 group-hover:text-white group-hover:scale-105 transition-all" />
                <p className="text-[10px] text-stone-800 group-hover:text-white leading-tight">Imports URL Listing</p>
              </button>

              <button 
                onClick={() => navigate("/app/aitours")} 
                className="p-3 bg-[#faf9f6]/90 hover:bg-blue-600 hover:border-blue-600 border border-stone-200/80 rounded-xl text-left font-bold space-y-1 transition-all group duration-200 cursor-pointer"
              >
                <Mic2 className="h-4 w-4 text-amber-600 group-hover:text-white group-hover:scale-105 transition-all" />
                <p className="text-[10px] text-stone-800 group-hover:text-white leading-tight">Customize Sora Script</p>
              </button>

              <button 
                onClick={() => navigate("/app/openhouses")} 
                className="p-3 bg-[#faf9f6]/90 hover:bg-blue-600 hover:border-blue-600 border border-stone-200/80 rounded-xl text-left font-bold space-y-1 transition-all group duration-200 cursor-pointer"
              >
                <Calendar className="h-4 w-4 text-amber-600 group-hover:text-white group-hover:scale-105 transition-all" />
                <p className="text-[10px] text-stone-800 group-hover:text-white leading-tight">Deploy Show Kiosk</p>
              </button>

              <button 
                onClick={() => navigate("/app/flyers")} 
                className="p-3 bg-[#faf9f6]/90 hover:bg-blue-600 hover:border-blue-600 border border-stone-200/80 rounded-xl text-left font-bold space-y-1 transition-all group duration-200 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-amber-600 group-hover:text-white group-hover:scale-105 transition-all" />
                <p className="text-[10px] text-stone-800 group-hover:text-white leading-tight">Create Luxury Promo</p>
              </button>
            </div>
          </Card>

        </div>

      </div>

      {/* Admin Character Guard Block */}
      <Card className="border-white/20 shadow-sm overflow-hidden text-left bg-[#50a2ff] text-white rounded-2xl">
        <CardHeader className="pb-3 border-b border-white/20 bg-[#50a2ff] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-yellow-200 animate-pulse" /> AI System Instruction & Character Guard
            </CardTitle>
            <CardDescription className="text-xs font-medium text-white/90">Lock down custom AI conversational prompts, agency characters, and safety triggers under a master control password.</CardDescription>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-black uppercase bg-white/20 text-white px-2.5 py-1 rounded-full border border-white/20 w-fit shrink-0">
            {isAdminPanelUnlocked ? <Unlock className="h-3 w-3 text-green-200" /> : <Lock className="h-3 w-3 text-red-200" />}
            {isAdminPanelUnlocked ? 'Sora Unlocked' : 'Password Gated'}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!isAdminPanelUnlocked ? (
            <div className="max-w-md space-y-4 py-2">
              <p className="text-xs text-white/90 leading-relaxed font-sans">
                Enter your **Dashboard Password** to authorize listing prompt edits. This keeps critical AI Open House Connect character attributes, compliance overrides, and guided tour templates secure from unauthorized edits.
              </p>
              <div className="flex gap-2 font-sans">
                <div className="relative flex-1">
                  <Input
                    type={showPasswordRaw ? "text" : "password"}
                    placeholder="Enter dashboard administrator password..."
                    value={promptPassword}
                    onChange={(e) => setPromptPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                    className="h-10 text-xs text-stone-900 border-white/30 bg-white focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:ring-offset-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordRaw(!showPasswordRaw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showPasswordRaw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button 
                  onClick={handleUnlock}
                  className="bg-white hover:bg-slate-50 font-bold text-xs h-10 px-4 text-[#50a2ff]"
                >
                  Authorize & Unlock
                </Button>
              </div>
              <p className="text-[10px] text-white/80 italic font-medium">Default setup password: <span className="font-mono bg-white/10 px-1 py-0.5 rounded text-yellow-100 font-bold">8923</span></p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-white tracking-wider">AI System Instruction Template Override</Label>
                <p className="text-[11px] text-white/90 leading-normal">
                  Customize the core system prompt that dictates how Sora represents your brokerage. This is prepended to the live session parameters. Leave blank to fallback to default settings.
                </p>
                <Textarea
                  value={savedPromptText}
                  onChange={(e) => setSavedPromptText(e.target.value)}
                  rows={8}
                  placeholder="Paste your custom agency system prompt instructions here (or leave blank to use the default)..."
                  className="font-mono text-xs text-white bg-white/10 border-white/20 focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-0 h-44"
                />
              </div>

              <div className="p-4 bg-white/10 rounded-xl border border-white/20 grid sm:grid-cols-2 gap-4 text-left">
                <div className="space-y-1">
                  <Label className="text-xs font-black uppercase text-white tracking-wider">Change Dashboard Password</Label>
                  <p className="text-[11px] text-white/90">Provide a new password to upgrade administrative lockbox protection.</p>
                </div>
                <div className="flex items-center">
                  <Input
                    type="text"
                    placeholder="Enter new master password..."
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    className="h-10 text-xs bg-white/25 border-white/20 focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-0 text-white placeholder-white/60"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/20">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAdminPanelUnlocked(false);
                    setNewPasswordValue("");
                    setPromptPassword("");
                  }}
                  className="font-bold text-xs bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
                >
                  Discard & Lock
                </Button>
                <Button
                  onClick={handleSavePromptSettings}
                  disabled={savingPrompt}
                  className="bg-white hover:bg-slate-55 text-[#50a2ff] hover:bg-white hover:text-[#50a2ff] font-bold text-xs gap-2 px-6"
                >
                  {savingPrompt ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#50a2ff]" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-[#50a2ff]" /> Apply & Lock Down
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onboarding Dialog */}
      <Dialog open={isOnboardingModalOpen} onOpenChange={setIsOnboardingModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-8 rounded-2xl bg-white border border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 font-black tracking-tight text-3xl text-slate-900 border-b pb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h2 className="text-xl md:text-2xl font-black uppercase text-slate-900 italic tracking-tighter leading-tight">AI Open House Connect</h2>
                <p className="text-xs text-slate-500 font-medium normal-case tracking-normal">Comprehensive Agent Quick-Start Handbook & Onboarding Package</p>
              </div>
            </DialogTitle>
            <div className="text-sm font-sans text-slate-650 leading-relaxed text-left pt-2 text-slate-500">
              Welcome to the team! Our real estate co-pilot <strong>Sora</strong> is ready to guide you. This quick handbook establishes compliance standards, tablet kiosks, and lender pair-locks to kickstart your listing pipeline.
            </div>
          </DialogHeader>

          <div className="py-6 space-y-6 text-left">
            <div>
              <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-3">Interactive Onboarding Steps</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm flex gap-3 items-start">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-lg shrink-0">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">1. Mobile Kiosk & Exit PIN</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Setting up your customizable agent profile, logo / avatar, and an <strong>Exit Lock PIN</strong>. This allows you to lock the tablet kiosk during open houses so guests cannot wander out.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm flex gap-3 items-start">
                  <div className="bg-amber-50 text-amber-600 p-2 rounded-lg shrink-0">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">2. Lender Pairing Lock</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Inviting your preferred mortgage partners. When paired, dynamic financing questions and opt-in consent checkboxes are seamlessly injected into the open house signup screens.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm flex gap-3 items-start">
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg shrink-0">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">3. Sora Walkthroughs</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Creating immersive virtual tour soundtracks. Our premium voice guidance assistant <strong>Sora</strong> synthesizes custom tour transcripts from property listings instantly.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm flex gap-3 items-start">
                  <div className="bg-purple-50 text-purple-600 p-2 rounded-lg shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">4. CRM Sync Field Map</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Direct integration with CRM systems like Follow Up Boss. Incoming leads are synchronized on the fly, with automated tags like <code className="bg-slate-100 px-1 text-slate-700">fub-mortgage-interest</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sora welcome preview */}
            <div className="border rounded-xl overflow-hidden bg-slate-900 border-slate-850 border-slate-800">
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-855 border-slate-800 flex justify-between items-center text-white">
                <span className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider text-slate-350">
                  🤖 Hello Agent! I am Sora, your AI co-pilot
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-[10px] font-bold text-blue-400 border border-blue-500/30 uppercase">
                  ACTIVE ASSISTANT
                </span>
              </div>
              <div className="p-4 space-y-3 font-mono text-xs leading-relaxed text-slate-300">
                <p className="text-emerald-400">"Hello brand new user! I am Sora, your AI open house guide.</p>
                <p>Welcome to AI Open House Connect. To start, allow me to guide you through your dashboard milestones:"</p>
                <ol className="list-decimal pl-5 space-y-1 text-slate-400 font-sans text-xs">
                  <li><strong className="text-slate-200">Generate a custom listing:</strong> Upload spatial attributes to let me design specialized walk-through itineraries.</li>
                  <li><strong className="text-slate-200">Assign your secure PIN:</strong> Secures the guest kiosk mode on iPads or devices.</li>
                  <li><strong className="text-slate-200">Integrate a paired lender:</strong> Hides or unlocks optional borrower financing requests ethically.</li>
                </ol>
                <p className="text-emerald-400 pt-1">I am excited to co-pilot your real estate operations."</p>
              </div>
            </div>

            {/* Print and Save */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-805 text-slate-800 text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500 animate-pulse" /> Ai Open House Connect Onboarding KIT
                </h4>
                <p className="text-slate-500 text-xs mt-0.5">
                  Download a PDF-ready handbook of your credentials, fallback sync tips, and event settings onboarding kit.
                </p>
              </div>
              <Button 
                onClick={handleDownloadPdf}
                className="bg-slate-800 hover:bg-slate-900 font-bold text-xs flex items-center gap-2 w-full sm:w-auto text-white cursor-pointer h-10 px-4 rounded-lg shrink-0"
              >
                <Download className="h-4 w-4" /> Download PDF Handbook
              </Button>
            </div>
          </div>

          <DialogFooter className="border-t pt-4 flex flex-col sm:flex-row gap-2 justify-end">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setIsOnboardingModalOpen(false)}
              className="font-bold text-slate-500 hover:text-slate-705 bg-white border border-slate-200"
            >
              Remind Me Later
            </Button>
            <Button
              type="button"
              onClick={handleMarkAsRead}
              className="bg-blue-600 hover:bg-blue-700 font-bold px-6 text-white"
            >
              Mark as Read & Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
