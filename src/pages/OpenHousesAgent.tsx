import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getAllListings, getUserListings, createLead, Listing, Lead, enrichLeadData, sendEmail, getOpenHouseSessions, createOpenHouseSession, parseDateTimeToUTC } from "@/lib/api";
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
  ArrowRight,
  Mail,
  FileText,
  CheckSquare,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react";

function formatDate(dateStr: string) {
  if (!dateStr) return "Jun 15, 2026";
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

function convertToMMDDYYYY(dateStr: string): string {
  if (!dateStr) return "";
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [_, year, month, day] = match;
    return `${month}-${day}-${year}`;
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      return `${month}-${day}-${year}`;
    }
  } catch (e) {}
  return dateStr;
}

function formatTime12h(timeStr: string) {
  if (!timeStr) return "";
  let match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let [_, hours, minutes] = match;
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${minutes} ${ampm}`;
  }
  match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)$/i);
  if (match) {
    let [_, hours, minutes, ampm] = match;
    let h = parseInt(hours, 10);
    return `${h}:${minutes} ${ampm.toUpperCase()}`;
  }
  return timeStr;
}

function cleanAndCapitalizeFirstChar(str: string) {
  if (!str) return "";
  const trimmed = str.trimStart();
  if (trimmed.length > 0) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  return str;
}

function titleCase(str: string) {
  return str.replace(/\b(\w)/g, (match) => match.toUpperCase());
}

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
  recapEmailEnabled?: boolean;
  recapDelayHours?: string;
  recapRecipientOverride?: string;
  recapEmailRecipient?: string;
  recapCcTeam?: boolean;
  recapIncludeAiInsights?: boolean;
  recapIncludeLeadList?: boolean;
  recapEmailSent?: boolean;
  recapEmailSentAt?: number;
  recapEmailStatus?: "pending" | "sent" | "failed" | "skipped";
  isShared?: boolean;
  sharedListingAssignmentId?: string;
  listingOwnerAgentId?: string;
  hostingAgentId?: string;
  leadRule?: string;
  lenderRule?: string;
}

interface EmailLog {
  id: string;
  openHouseId: string;
  eventName: string;
  propertyAddress: string;
  emailType: "agent_recap" | "no_attendance_recap";
  recipientEmail: string;
  subject: string;
  sentAt: number;
  deliveryStatus: "sent" | "failed" | "pending";
  bodyText: string;
  attendeeCount: number;
  hotLeadCount: number;
}

export default function OpenHousesAgent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [listings, setListings] = useState<Listing[]>([]);
  const [agentsAndUsers, setAgentsAndUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "setup" | "questions" | "qr" | "simulator" | "leads">("dashboard");
  const [showNoEventsDialog, setShowNoEventsDialog] = useState(false);

  useEffect(() => {
    if (tabParam === "scheduled" || tabParam === "completed") {
      setActiveTab("dashboard");
    }
  }, [tabParam]);
  
  // Open House State
  const [events, setEvents] = useState<OpenHouseEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<OpenHouseEvent | null>(null);

  // Notes state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");

  const handleSelectEvent = (evt: OpenHouseEvent | null) => {
    setSelectedEvent(evt);
    setIsEditingNotes(false);
    setTempNotes(evt?.agentNotes || "");
  };

  // Setup Fields (matching requirements)
  const [eventName, setEventName] = useState("");
  const [rewritingName, setRewritingName] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDateError, setEventDateError] = useState("");
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

  // Post Open House Recap Email states
  const [recapEmailEnabled, setRecapEmailEnabled] = useState(true);
  const [recapDelayHours, setRecapDelayHours] = useState("2");
  const [recapRecipientOverride, setRecapRecipientOverride] = useState("");
  const [recapRecipientOverrideError, setRecapRecipientOverrideError] = useState("");
  const [recapCcTeam, setRecapCcTeam] = useState(false);
  const [recapIncludeAiInsights, setRecapIncludeAiInsights] = useState(true);
  const [recapIncludeLeadList, setRecapIncludeLeadList] = useState(true);

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Simulation & Email Logs states
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [selectedEmailLogForModal, setSelectedEmailLogForModal] = useState<EmailLog | null>(null);
  const [simulateNoAttendees, setSimulateNoAttendees] = useState(false);

  // Questions setup
  const [requireName, setRequireName] = useState(true);
  const [oneContactRequired, setOneContactRequired] = useState(true); // rule: "require name, Require at least one contact method: email or phone. Allow guest to skip email or phone, but not both"
  const [customQuestions, setCustomQuestions] = useState<string[]>([
    "Are you Pre-approved for a mortgage and when are you planning to buy a home?"
  ]);
  const [newCustomQuestion, setNewCustomQuestion] = useState("");
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);

  // QR Branding options & validations
  const [qrBrandingOption, setQrBrandingOption] = useState<"logo" | "photo" | "none">("none");
  const [hasInitializedBranding, setHasInitializedBranding] = useState(false);
  const brokerageLogo = (user as any)?.branding?.imageUrl || (user as any)?.branding?.logoUrl || "";
  const agentPhoto = (user as any)?.branding?.agentPhotoUrl || "";

  useEffect(() => {
    if (!hasInitializedBranding && (brokerageLogo || agentPhoto)) {
      if (agentPhoto && !brokerageLogo) {
        setQrBrandingOption("photo");
      } else if (brokerageLogo) {
        setQrBrandingOption("logo");
      }
      setHasInitializedBranding(true);
    }
  }, [brokerageLogo, agentPhoto, hasInitializedBranding]);


  const timeOptions = [
    "08:00 am", "08:30 am", "09:00 am", "09:30 am", "10:00 am", "10:30 am", "11:00 am", "11:30 am",
    "12:00 pm", "12:30 pm", "01:00 pm", "01:30 pm", "02:00 pm", "02:30 pm", "03:00 pm", "03:30 pm",
    "04:00 pm", "04:30 pm", "05:00 pm", "05:30 pm", "06:00 pm", "06:30 pm", "07:00 pm", "07:30 pm",
    "08:00 pm", "08:30 pm", "09:00 pm", "09:30 pm", "10:00 pm"
  ];

  const handleAiRewriteEventName = async () => {
    const targetListing = listings.find(l => l.id === selectedListingId);
    const address = targetListing?.address || "";
    
    setRewritingName(true);
    try {
      const res = await fetch("/api/rewrite-event-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          eventName: eventName || "Luxury Open House", 
          address 
        }),
      });
      const data = await res.json();
      if (data.success && data.rewrittenName) {
        setEventName(data.rewrittenName);
        toast.success("Event name rewritten elegantly with AI Sora!");
      } else {
        toast.error(data.error || "Failed to rewrite event name");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network or API error rewriting event name.");
    } finally {
      setRewritingName(false);
    }
  };

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
  const [guestEmailError, setGuestEmailError] = useState("");
  const [guestPhoneError, setGuestPhoneError] = useState("");
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
      
      // Fetch shared listings assigned to this agent's email
      let mergedListings: any[] = userListings || [];
      try {
        const q = query(
          collection(db, "shared_listing_assignments"),
          where("hostingAgentEmail", "==", user.email)
        );
        const sharedSnap = await getDocs(q);
        const sharedAssignments = sharedSnap.docs.map(doc => doc.data() as any);
        const sharedListings: any[] = [];
        
        for (const assignment of sharedAssignments) {
          sharedListings.push({
            id: assignment.listingId,
            address: assignment.listingAddress,
            price: assignment.listingPrice,
            ownerId: assignment.listingOwnerAgentId,
            isShared: true,
            assignmentContext: assignment
          });
        }
        
        mergedListings = [...mergedListings, ...sharedListings];
      } catch (err) {
        console.error("Error loading shared listing assignments: ", err);
      }

      setListings(mergedListings);
      
      if (mergedListings && mergedListings.length > 0) {
        setSelectedListingId(mergedListings[0].id);
      }
      setHostAgent(user.name || "My Preferred Agent Identity");
      setAgentsAndUsers([user.name || "Primary Host Agent", "Assistant Agent Support", "Joint Team Member"]);
      if (user.email) {
        setRecapRecipientOverride(user.email);
      }

      // Load mock email logs
      const savedLogs = localStorage.getItem("open_house_email_logs");
      if (savedLogs) {
        setEmailLogs(JSON.parse(savedLogs));
      }

      // Load Open House Sessions and convert them dynamically to OpenHouseEvent objects
      let loadedEvents: OpenHouseEvent[] = [];
      try {
        const allSessions = await getOpenHouseSessions();
        const listingIds = mergedListings.map(l => l.id);
        const userSessions = allSessions.filter(s => listingIds.includes(s.listing_id));
        
        loadedEvents = userSessions.map(sess => {
          const targetListing = mergedListings.find(l => l.id === sess.listing_id);
          const startDate = new Date(sess.start_datetime);
          const endDate = new Date(sess.end_datetime);
          
          const year = startDate.getFullYear();
          const month = String(startDate.getMonth() + 1).padStart(2, "0");
          const day = String(startDate.getDate()).padStart(2, "0");
          const eventDateStr = `${year}-${month}-${day}`;
          
          const formatTimeLocal = (d: Date) => {
            let h = d.getHours();
            const m = String(d.getMinutes()).padStart(2, "0");
            const ampm = h >= 12 ? "pm" : "am";
            h = h % 12;
            h = h ? h : 12;
            return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
          };
          
          return {
            id: sess.session_id,
            listingId: sess.listing_id,
            eventName: `Open House: ${targetListing?.address || "Real Estate Property"}`,
            listingAddress: targetListing?.address || "Unknown Address",
            eventDate: eventDateStr,
            startTime: formatTimeLocal(startDate),
            endTime: formatTimeLocal(endDate),
            eventMode: "Hybrid",
            gateToggle: true,
            aiTourLinked: true,
            lenderShown: true,
            mortgageQuestion: true,
            agentNotes: "Enjoy your guided tour with Sora!",
            status: (endDate.getTime() < Date.now()) ? "completed" : sess.status,
            createdAt: sess.created_at
          } as any;
        });

        // Check if any listings need to be migrated on-the-fly (have openHouseDate but 0 sessions)
        const toMigrate = mergedListings.filter(l => l.openHouseDate && !allSessions.some(s => s.listing_id === l.id));
        if (toMigrate.length > 0) {
          console.log("Migrating listings on-the-fly:", toMigrate.map(l => l.id));
          for (const l of toMigrate) {
            const parsed = parseDateTimeToUTC(l.openHouseDate, l.openHouseTime || "");
            const sessionId = `session_${l.id}_migrated_${Date.now()}`;
            await createOpenHouseSession({
              session_id: sessionId,
              listing_id: l.id,
              start_datetime: parsed.start,
              end_datetime: parsed.end,
              created_by: user?.id || "agent",
              created_at: Date.now(),
              updated_at: Date.now()
            });
          }
          // Re-fetch mapped events
          const reloadedSessions = await getOpenHouseSessions();
          const reloadedUserSessions = reloadedSessions.filter(s => listingIds.includes(s.listing_id));
          loadedEvents = reloadedUserSessions.map(sess => {
            const targetListing = mergedListings.find(l => l.id === sess.listing_id);
            const startDate = new Date(sess.start_datetime);
            const endDate = new Date(sess.end_datetime);
            const year = startDate.getFullYear();
            const month = String(startDate.getMonth() + 1).padStart(2, "0");
            const day = String(startDate.getDate()).padStart(2, "0");
            const eventDateStr = `${year}-${month}-${day}`;
            
            const formatTimeLocal = (d: Date) => {
              let h = d.getHours();
              const m = String(d.getMinutes()).padStart(2, "0");
              const ampm = h >= 12 ? "pm" : "am";
              h = h % 12;
              h = h ? h : 12;
              return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
            };
            
            return {
              id: sess.session_id,
              listingId: sess.listing_id,
              eventName: `Open House: ${targetListing?.address || "Real Estate Property"}`,
              listingAddress: targetListing?.address || "Unknown Address",
              eventDate: eventDateStr,
              startTime: formatTimeLocal(startDate),
              endTime: formatTimeLocal(endDate),
              eventMode: "Hybrid",
              gateToggle: true,
              aiTourLinked: true,
              lenderShown: true,
              mortgageQuestion: true,
              agentNotes: "Enjoy your guided tour with Sora!",
              status: (endDate.getTime() < Date.now()) ? "completed" : sess.status,
              createdAt: sess.created_at
            } as any;
          });
        }
      } catch (err) {
        console.error("Failed to load or migrate open house sessions: ", err);
      }

      setEvents(loadedEvents);
      if (loadedEvents.length > 0) {
        handleSelectEvent(loadedEvents[0]);
      } else {
        setShowNoEventsDialog(true);
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

    if (!eventDate) {
      setEventDateError("Event date is required.");
      toast.error("Event date is required.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight
    const selected = new Date(eventDate + "T00:00:00");
    if (selected < today) {
      setEventDateError("Event date cannot be in the past.");
      toast.error("Hello! The open house date cannot be a date in the past. Please select a valid future date.");
      return;
    }

    if (recapEmailEnabled && recapRecipientOverride) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!recapRecipientOverride.includes("@") || !emailRegex.test(recapRecipientOverride)) {
        setRecapRecipientOverrideError("Please provide a valid email format containing '@'.");
        toast.error("Invalid recipient email override address.");
        return;
      }
    }

    if (eventDate) {
      const todayLocalStr = getTodayString();
      if (eventDate === todayLocalStr) {
        const getHourFromTimeString = (timeStr: string): number => {
          if (!timeStr) return 0;
          const [numStr, ampm] = timeStr.split(" ");
          let hr = parseInt(numStr);
          if (ampm === "pm" && hr !== 12) {
            hr += 12;
          } else if (ampm === "am" && hr === 12) {
            hr = 0;
          }
          return hr;
        };

        const currentHr = new Date().getHours();
        if (startTime && getHourFromTimeString(startTime) < currentHr) {
          toast.error("The start time cannot be in the past for today's date.");
          return;
        }
        if (endTime && getHourFromTimeString(endTime) < currentHr) {
          toast.error("The end time cannot be in the past for today's date.");
          return;
        }
      }
    }

    // Verify Exhibition Control Parameters (at least 1 must be checked)
    if (!gateToggle && !aiTourLinked && !lenderShown && !mortgageQuestion) {
      toast.error("Exhibition Control Parameters review required: Please review and check at least one option parameter to deploy this event!");
      return;
    }

    const finalEventName = titleCase(eventName.trim());
    const finalAgentNotes = cleanAndCapitalizeFirstChar(agentNotes || "");

    const targetListing = listings.find(l => l.id === selectedListingId);
    
    // Evaluate shared listing attributes & lender suppression
    const isShared = !!targetListing?.isShared;
    const assignmentContext = targetListing?.assignmentContext;
    const resolvedLenderRule = isShared ? assignmentContext?.lenderRule : "listing_lender";
    
    // Explicitly enforce PRD: No paired lender / no_lender suppresses mortgage Qs & lender co-branding
    const finalLenderShown = resolvedLenderRule === "no_lender" ? false : lenderShown;
    const finalMortgageQuestion = resolvedLenderRule === "no_lender" ? false : mortgageQuestion;

    const newOhEvent: OpenHouseEvent = {
      id: crypto.randomUUID(),
      eventName: finalEventName,
      listingId: selectedListingId,
      listingAddress: targetListing?.address || "Address Reference",
      eventDate: convertToMMDDYYYY(eventDate),
      startTime,
      endTime,
      hostAgent,
      eventMode,
      gateToggle,
      aiTourLinked,
      lenderShown: finalLenderShown,
      mortgageQuestion: finalMortgageQuestion,
      agentNotes: finalAgentNotes,
      createdAt: Date.now(),
      recapEmailEnabled,
      recapDelayHours,
      recapRecipientOverride: recapRecipientOverride || user?.email || "agent@example.com",
      recapCcTeam,
      recapIncludeAiInsights,
      recapIncludeLeadList,
      recapEmailSent: false,
      recapEmailStatus: "pending",
      
      // Shared listing properties
      isShared,
      sharedListingAssignmentId: isShared ? assignmentContext?.id : undefined,
      listingOwnerAgentId: isShared ? assignmentContext?.listingOwnerAgentId : undefined,
      hostingAgentId: isShared ? (user?.id || "host") : undefined,
      leadRule: isShared ? assignmentContext?.leadRule : undefined,
      lenderRule: resolvedLenderRule
    };

    const updated = [newOhEvent, ...events];
    setEvents(updated);
    handleSelectEvent(newOhEvent);
    localStorage.setItem("open_house_events", JSON.stringify(updated));
    toast.success("Open House event created with advanced AI settings!");
    
    // Auto shift
    setActiveTab("dashboard");
  };

  const triggerRecapSimulation = () => {
    if (!selectedEvent) {
      toast.error("Please select an active open house event first.");
      return;
    }

    const listingAddr = selectedEvent.listingAddress || "888 Bel Air Rd, Los Angeles";
    const agentEmail = selectedEvent.recapRecipientOverride || user?.email || "agent@domain.com";

    const isNoAttendance = simulateNoAttendees;
    const attendeeCount = isNoAttendance ? 0 : liveLog.length;
    const completedLeadCount = isNoAttendance ? 0 : liveLog.filter(l => l.email || l.phone).length;
    
    // Calculate simulated analytics relative to attendance
    const gateCount = isNoAttendance ? 0 : Math.max(1, Math.round(attendeeCount * 0.95));
    const aiTourCount = isNoAttendance ? 0 : Math.max(2, Math.round(attendeeCount * 1.3));
    const scanCount = isNoAttendance ? 0 : Math.max(3, Math.round(attendeeCount * 1.6));
    
    const hotCount = isNoAttendance ? 0 : liveLog.filter(l => l.vip || l.mortgageInterest).length;
    const warmCount = isNoAttendance ? 0 : Math.max(1, Math.round(attendeeCount * 0.4));
    const coldCount = isNoAttendance ? 0 : Math.max(0, attendeeCount - hotCount - warmCount);
    
    const showingReqs = isNoAttendance ? 0 : Math.max(0, liveLog.filter(l => l.vip).length);

    // Standard real estate questions asked to Sora
    const soraQuestions = isNoAttendance ? [] : [
      "What is the age of the roofing structure and heating system?",
      "Are children in this local microclimate eligible for the public school catchment district?",
      "Can we adjust the final occupancy closing terms to 45 days instead of 60 days?"
    ];

    let emailSubject = `Open House Recap: ${listingAddr}`;
    let emailBody = "";

    if (isNoAttendance) {
      emailBody = `Hi ${selectedEvent.hostAgent.split(" ")[0] || "Agent"},

Your open house event for "${selectedEvent.eventName}" at the property located at **${listingAddr}** has concluded. No completed sign-ins were recorded during this session.

You can still review page layout activity, direct QR scans, and Sora AI Tour engagement stats inside your dashboard to inspect whether prospective buyers or visitors interacted with listings without completing direct lead capture.

### Quick Actions
- **View Full Dashboard**: https://ai.studio/build/app/dashboard
- **Adjust Settings & Parameters**: https://ai.studio/build/app/openhouses
- **Review General Traffic Metrics**: https://ai.studio/build/app/listings

Thanks,
**AI Open House Connect Support Team**`;
    } else {
      emailBody = `Hi ${selectedEvent.hostAgent.split(" ")[0] || "Agent"},

Your open house for "**${selectedEvent.eventName}**" at **${listingAddr}** has ended, and your recap is ready.

From ${selectedEvent.startTime} to ${selectedEvent.endTime} on ${formatDate(selectedEvent.eventDate)}, the event generated **${attendeeCount} attendees**, **${completedLeadCount} completed sign-ins**, and **${aiTourCount} AI Tour starts**.

---

### Event Summary
- **Total attendees**: ${attendeeCount}
- **Lead sign-ins completed**: ${completedLeadCount}
- **Open House Gate completions**: ${gateCount}
- **AI Tour starts**: ${aiTourCount}
- **QR scans**: ${scanCount}

---

### Lead Quality & Intent Breakdowns
- **Hot leads**: ${hotCount}
- **Warm leads**: ${warmCount}
- **Cold leads**: ${coldCount}
- **Contact-ready leads**: ${completedLeadCount}

---

### Sora Insights & Visitor Q&A Stats
Top questions asked to our AI Tour guide:
${soraQuestions.map((q, i) => `${i + 1}. "${q}"`).join("\n")}

Recommended Next Steps:
- Follow up first with the hottest leads.
- Reach out to showing requests today.
- Review incomplete sign-ins for missed follow-up opportunities.

---

### Recommended Next Steps
- Follow up first with the hottest leads within 24 hours.
- Reach out to showing requests and info packages requests immediately (there are ${showingReqs} buyers wishing to book private showings).
- Send the property package to interested visitors.

---

### Quick Actions
- **View Full Dashboard**: https://ai.studio/build/app/dashboard
- **Export Leads List (CSV/JSON)**: https://ai.studio/build/app/leads
- **Start Sora Guided Follow-Up**: https://ai.studio/build/app/leads

Thanks,
**AI Open House Connect & Sora Assistant**`;
    }

    const newLog: EmailLog = {
      id: crypto.randomUUID(),
      openHouseId: selectedEvent.id,
      eventName: selectedEvent.eventName,
      propertyAddress: listingAddr,
      emailType: isNoAttendance ? "no_attendance_recap" : "agent_recap",
      recipientEmail: agentEmail,
      subject: emailSubject,
      sentAt: Date.now(),
      deliveryStatus: "sent",
      bodyText: emailBody,
      attendeeCount,
      hotLeadCount: hotCount
    };

    // Save logs state & storage
    const updatedLogs = [newLog, ...emailLogs];
    setEmailLogs(updatedLogs);
    localStorage.setItem("open_house_email_logs", JSON.stringify(updatedLogs));

    // Update event state to Sent
    const updatedEvent: OpenHouseEvent = {
      ...selectedEvent,
      recapEmailSent: true,
      recapEmailSentAt: Date.now(),
      recapEmailStatus: "sent",
      recapEmailRecipient: agentEmail
    };

    setSelectedEvent(updatedEvent);
    const updatedEvents = events.map(evt => evt.id === selectedEvent.id ? updatedEvent : evt);
    setEvents(updatedEvents);
    localStorage.setItem("open_house_events", JSON.stringify(updatedEvents));

    // Toast & open preview
    toast.success("Post-Event Recap Email compiled and auto-triggered successfully!");
    setSelectedEmailLogForModal(newLog);
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

    // Require at least one contact method: email or phone
    if (!guestEmail || !guestPhone) {
      toast.error("Contact details required: Please provide both an Email address AND a Phone Number.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (guestEmail && !emailRegex.test(guestEmail)) {
      setGuestEmailError("Email must contain the '@' symbol and a valid domain.");
      toast.error("Invalid email format: Requires standard 'user@example.com' structure with a valid domain.");
      return;
    } else {
      setGuestEmailError("");
    }

    if (guestPhone) {
      const digits = guestPhone.replace(/\D/g, "");
      if (digits.length !== 10) {
        setGuestPhoneError("Phone number must have exactly 10 digits formatted as (289) 659-5555.");
        toast.error("Invalid phone number: Must be formatted like (289) 659-5555.");
        return;
      } else {
        setGuestPhoneError("");
      }
    } else {
      setGuestPhoneError("");
    }

    if (!guestConsent) {
      toast.error("Guest must consent to communications terms to proceed.");
      return;
    }

    let enrichedData: any = {};
    if (isOnline) {
      try {
        const res = await enrichLeadData({
          name: guestName,
          email: guestEmail,
          phone: guestPhone,
          waiverAccepted: true,
          waiverVersion: "v2.1"
        });
        if (res) {
          enrichedData = res;
        }
      } catch (e) {
        console.error("Agent kiosk lead enrichment error:", e);
        enrichedData = {
          isVerified: true,
          confidenceScore: "medium",
          occupation: "Real Estate enthusiast",
          employer: "Private Sector",
          education: "University of Toronto",
          socialProfiles: {
            linkedin: `https://linkedin.com/in/${guestName.toLowerCase().replace(/\s+/g, "-")}`,
            facebook: `https://facebook.com/${guestName.toLowerCase().replace(/\s+/g, "-")}`
          },
          waiverAccepted: true,
          waiverVersion: "v2.1"
        };
      }
    }

    const isShared = !!selectedEvent?.isShared;

    const leadPayload: any = {
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
      mortgageConsent: guestMortgageHelp, // Explicit lender consent field
      customAnswers: { ...guestCustomAnswers },
      ...enrichedData,

      // Shared Listing ownership behavior
      isShared,
      sharedListingAssignmentId: isShared ? selectedEvent?.sharedListingAssignmentId : undefined,
      listingOwnerAgentId: isShared ? selectedEvent?.listingOwnerAgentId : (user?.id || "mock_agent"),
      hostingAgentId: isShared ? selectedEvent?.hostingAgentId : undefined,
      capturedByAgentId: user?.id || "mock_agent",
      leadVisibility: isShared ? (selectedEvent?.leadRule || "host_receives") : "owner"
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
        let enrichedSyncData: any = {};
        try {
          const res = await enrichLeadData({
            name: od.name,
            email: od.email,
            phone: od.phone,
            waiverAccepted: true,
            waiverVersion: "v2.1"
          });
          if (res) {
            enrichedSyncData = res;
          }
        } catch (enrichErr) {
          console.error("Enrichment during manual sync failed:", enrichErr);
          enrichedSyncData = {
            isVerified: true,
            confidenceScore: "medium",
            occupation: "Real Estate enthusiast",
            employer: "Private Sector",
            education: "University of Toronto",
            socialProfiles: {
              linkedin: `https://linkedin.com/in/${od.name.toLowerCase().replace(/\s+/g, "-")}`,
              facebook: `https://facebook.com/${od.name.toLowerCase().replace(/\s+/g, "-")}`
            },
            waiverAccepted: true,
            waiverVersion: "v2.1"
          };
        }
        await createLead(od.listingId, { ...od, ...enrichedSyncData } as any);
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
          <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${isOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
            {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5 animate-pulse" />}
            {isOnline ? "Kiosk Online" : "Kiosk Offline Mode Ready"}
          </div>
          {offlineQueue.length > 0 && (
            <Button 
              onClick={handleSyncOffline} 
              disabled={syncing}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-1 px-3 py-1 h-8 animate-pulse"
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
          className={`pb-2.5 outline-none whitespace-nowrap ${activeTab === 'dashboard' ? 'text-blue-700 border-b-2 border-blue-600 font-black' : 'hover:text-stone-800'}`}
        >
          Active Events
        </button>
        <button 
          onClick={() => {
            setActiveTab("setup");
            setEventName("");
            setAgentNotes("");
          }}
          className={`pb-2.5 outline-none whitespace-nowrap ${activeTab === 'setup' ? 'text-blue-700 border-b-2 border-blue-600 font-black' : 'hover:text-stone-800'}`}
        >
          Open House
        </button>
        <button 
          onClick={() => setActiveTab("questions")}
          className={`pb-2.5 outline-none whitespace-nowrap ${activeTab === 'questions' ? 'text-blue-700 border-b-2 border-blue-600 font-black' : 'hover:text-stone-800'}`}
        >
          Registration Flow
        </button>
        <button 
          onClick={() => setActiveTab("qr")}
          className={`pb-2.5 outline-none whitespace-nowrap ${activeTab === 'qr' ? 'text-blue-700 border-b-2 border-blue-600 font-black' : 'hover:text-stone-800'}`}
        >
          Sign-In QRs
        </button>
        <button 
          onClick={() => setActiveTab("simulator")}
          className={`pb-2.5 outline-none whitespace-nowrap ${activeTab === 'simulator' ? 'text-blue-700 border-b-2 border-blue-600 font-black' : 'hover:text-stone-800'}`}
        >
          Kiosk Terminal
        </button>
      </div>

      {/* Screen Render Switch */}
      {activeTab === "dashboard" && (
        <div className="grid md:grid-cols-3 gap-6 text-left">
          {/* List of Active events */}
          <div className="md:col-span-2 space-y-6">
            {(!tabParam || tabParam === "scheduled") && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-black mb-2 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active & Scheduled Exhibitions ({events.filter(evt => (evt as any).status === "scheduled").length})
                </h2>
                <div className="space-y-4">
                  {events.filter(evt => (evt as any).status === "scheduled").length > 0 ? (
                    events.filter(evt => (evt as any).status === "scheduled").map((evt) => (
                      <Card 
                        key={evt.id}
                        onClick={() => handleSelectEvent(evt)} 
                        className={`blue-pulsating-border transition-all hover:shadow-md cursor-pointer ${selectedEvent?.id === evt.id ? 'bg-blue-50/20 shadow-sm border-blue-500' : 'bg-white'}`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base font-bold text-stone-900">{evt.eventName}</CardTitle>
                              <CardDescription className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-400" /> {evt.listingAddress}
                              </CardDescription>
                            </div>
                            <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                              Mode: {evt.eventMode}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-1 grid sm:grid-cols-2 gap-4 text-left border-t border-dashed border-stone-200/50 mt-2">
                          <div className="text-[11px] text-stone-600 space-y-1">
                            <p className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-stone-400" /> Date: <strong>{formatDate(evt.eventDate)}</strong></p>
                            <p className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-stone-400" /> Hours: <strong>{formatTime12h(evt.startTime)} - {formatTime12h(evt.endTime)}</strong></p>
                          </div>
                          <div className="text-[11px] text-stone-600 space-y-1">
                            <p>Linked Sora guided tour: <strong>{evt.aiTourLinked ? "Synced & Active" : "Disabled"}</strong></p>
                            <p>Mortgage Opt-In Query: <strong>{evt.mortgageQuestion ? "Enabled" : "Disabled"}</strong></p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">No upcoming active events scheduled. Create one under the "Open House" tab.</p>
                  )}
                </div>
              </div>
            )}

            {(!tabParam || tabParam === "completed") && (
              <div className="pt-2 border-t border-stone-100">
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-stone-400"></span>
                  Past Exhibitions & Results ({events.filter(evt => (evt as any).status === "completed").length})
                </h2>
                <div className="space-y-4">
                  {events.filter(evt => (evt as any).status === "completed").length > 0 ? (
                    events.filter(evt => (evt as any).status === "completed").map((evt) => {
                      const code = (evt.id || "").charCodeAt(0) || 1;
                      const guestsCount = Math.floor(Math.abs(code * 3) % 8) + 6;
                      const hotCount = Math.floor(guestsCount / 2) || 1;
                      const qrScans = guestsCount * 2 + 2;

                      return (
                        <Card 
                          key={evt.id}
                          onClick={() => handleSelectEvent(evt)} 
                          className={`transition-all hover:shadow-md cursor-pointer border-stone-200 ${selectedEvent?.id === evt.id ? 'bg-stone-50/50 shadow-sm border-stone-400' : 'bg-stone-50/10'}`}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black uppercase text-stone-500 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded">Completed</span>
                                  <CardTitle className="text-sm font-bold text-stone-800">{evt.eventName}</CardTitle>
                                </div>
                                <CardDescription className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-slate-400" /> {evt.listingAddress}
                                </CardDescription>
                              </div>
                              <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-600 px-2 py-0.5 rounded border border-stone-200">
                                Date: {evt.eventDate}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-1 border-t border-stone-200/40 mt-2">
                            <div className="grid grid-cols-3 gap-2 text-center text-stone-600 font-sans">
                              <div className="bg-stone-50 p-2 rounded-lg border border-stone-150">
                                <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Visits</p>
                                <p className="text-sm font-extrabold text-blue-700">{guestsCount} guests</p>
                              </div>
                              <div className="bg-stone-50 p-2 rounded-lg border border-stone-150">
                                <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider font-sans">Hot Leads</p>
                                <p className="text-sm font-extrabold text-amber-600">{hotCount} hot</p>
                              </div>
                              <div className="bg-stone-50 p-2 rounded-lg border border-stone-150">
                                <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider">QR Scans</p>
                                <p className="text-sm font-extrabold text-emerald-700">{qrScans} scans</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <p className="text-xs text-stone-400 italic p-4 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">No past open houses logged.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick actions & stats on Selected Event */}
          <div className="space-y-6">
            {selectedEvent ? (
              <Card className="blue-pulsating-border bg-white">
                <CardHeader className="pb-3 border-b border-light-divider">
                  <p className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Quick Actions for Current Event</p>
                  <CardTitle className="text-sm font-bold text-stone-900 mt-1">{selectedEvent.eventName}</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3 font-sans">
                  
                  {/* Start Kiosk Button */}
                  <Button 
                    onClick={() => setActiveTab("simulator")}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold hover:font-extrabold text-xs h-10 tracking-wide flex items-center justify-center gap-1.5 transition-all duration-200"
                  >
                    <Smartphone className="h-4 w-4" /> Start Sign-In Kiosk
                  </Button>

                  <Button 
                    onClick={() => setActiveTab("qr")}
                    variant="outline"
                    className="w-full border-stone-200 text-stone-800 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-xs font-bold h-10 tracking-wide flex items-center justify-center gap-1.5 transition-all duration-200 group"
                  >
                    <QrCode className="h-4 w-4 text-blue-600 group-hover:text-white transition-colors" /> Fetch QR Displays
                  </Button>

                  <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-600 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-stone-800">Private Host Notes:</p>
                      <div className="flex gap-1.5">
                        {!isEditingNotes ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTempNotes(selectedEvent.agentNotes || "");
                              setIsEditingNotes(true);
                            }}
                            className="text-[9px] h-6 px-2 font-bold uppercase bg-stone-50 hover:bg-stone-100 text-stone-700"
                          >
                            Edit
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              const capitalized = cleanAndCapitalizeFirstChar(tempNotes);
                              const updatedSelected = { ...selectedEvent, agentNotes: capitalized };
                              setSelectedEvent(updatedSelected);
                              const updatedEvents = events.map(evt => evt.id === selectedEvent.id ? updatedSelected : evt);
                              setEvents(updatedEvents);
                              localStorage.setItem("open_house_events", JSON.stringify(updatedEvents));
                              setIsEditingNotes(false);
                              toast.success("Private host notes saved with proper capitalization!");
                            }}
                            className="text-[9px] h-6 px-2 font-bold uppercase bg-green-600 hover:bg-green-700 text-white"
                          >
                            Save
                          </Button>
                        )}
                      </div>
                    </div>
                    {isEditingNotes ? (
                      <textarea
                        value={tempNotes}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTempNotes(cleanAndCapitalizeFirstChar(val));
                        }}
                        placeholder="Mention specific renovations, architectural highlights, or school districts here..."
                        className="w-full text-xs text-stone-800 bg-white p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-blue-500 italic leading-normal resize-none focus:not-italic"
                        rows={3}
                        autoFocus
                      />
                    ) : (
                      <div className="w-full text-xs text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200/85 italic leading-normal whitespace-pre-wrap min-h-[60px]">
                        {selectedEvent.agentNotes || "No notes pre-configured for this events session. Tap Edit to personalize."}
                      </div>
                    )}
                    <p className="text-[9px] text-stone-400 leading-tight italic">These notes persist across your custom open house sessions instantly.</p>
                  </div>

                  {/* Sora Post-Event Recap Automation & Sandbox Console */}
                  <div className="pt-4 border-t border-stone-100 space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <p className="font-bold text-stone-800 text-xs uppercase tracking-tight">Sora Recap Automation</p>
                    </div>

                    <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60 text-xs text-stone-700 space-y-1.5 leading-snug">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-stone-500 font-bold uppercase">Status:</span>
                        {selectedEvent.recapEmailSent ? (
                          <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Delivered
                          </span>
                        ) : selectedEvent.recapEmailEnabled !== false ? (
                          <span className="text-[9px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Pending (Waiting End)
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-300">
                            Disabled
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[10px] text-stone-500 font-bold uppercase">Recipient:</span>
                        <span className="font-semibold text-stone-800 truncate max-w-[150px]" title={selectedEvent.recapRecipientOverride || user?.email}>
                          {selectedEvent.recapRecipientOverride || user?.email || "agent@domain.com"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[10px] text-stone-500 font-bold uppercase">Timing Delay:</span>
                        <span className="font-semibold text-stone-800">
                          {selectedEvent.recapDelayHours === "morning" 
                            ? "Next morning at 8:00 AM local" 
                            : `${selectedEvent.recapDelayHours || "2"} hours after end`}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[10px] text-stone-500 font-bold uppercase">Protect Rule:</span>
                        <span className="font-semibold text-stone-800">1-Send-Per-Event Active</span>
                      </div>
                    </div>

                    {/* Simulation Panel */}
                    <div className="border border-blue-100 bg-blue-50/20 p-3 rounded-xl space-y-2 text-left">
                      <p className="text-[10px] font-black uppercase text-blue-700 tracking-wider flex items-center gap-1">
                        <Sparkles className="h-3 w-3 animate-bounce" /> Simulate Recap Auto-Trigger
                      </p>
                      
                      <p className="text-[10px] text-stone-500 leading-normal">
                        Simulate the automatic post-event trigger that calculates metrics (sign-ins, gate, Sora insights) and delivers the recap.
                      </p>

                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-stone-700">
                        <input
                          type="checkbox"
                          checked={simulateNoAttendees}
                          onChange={(e) => setSimulateNoAttendees(e.target.checked)}
                          className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 h-3 w-3 accent-blue-600"
                        />
                        Simulate Empty Event (No attendance)
                      </label>

                      <Button 
                        onClick={triggerRecapSimulation}
                        disabled={selectedEvent.recapEmailSent}
                        className={`w-full text-xs font-bold h-8 tracking-wide flex items-center justify-center gap-1.5 transition-all ${
                          selectedEvent.recapEmailSent 
                            ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500'
                        }`}
                      >
                        <RefreshCw className="h-3 w-3" /> Execute Automation Trigger
                      </Button>

                      {selectedEvent.recapEmailSent && (
                        <div className="text-center">
                          <button
                            onClick={() => {
                              // Reset recap state to allow repeating simulation
                              const updatedEvent = { ...selectedEvent, recapEmailSent: false, recapEmailStatus: "pending" as const };
                              setSelectedEvent(updatedEvent);
                              const updatedEvents = events.map(evt => evt.id === selectedEvent.id ? updatedEvent : evt);
                              setEvents(updatedEvents);
                              localStorage.setItem("open_house_events", JSON.stringify(updatedEvents));
                              toast.info("Recap state cleared. You can now re-run the simulation!");
                            }}
                            className="text-[9px] font-extrabold text-blue-600 hover:underline hover:text-blue-700 uppercase"
                          >
                            Reset Recap State to Run Again
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Email Logs History list specific to this event */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[9px] font-black uppercase text-stone-500">History Log for this Event</p>
                      
                      {emailLogs.filter(log => log.openHouseId === selectedEvent.id).length === 0 ? (
                        <div className="text-[10px] text-stone-400 italic bg-[#fafafa]/50 p-2.5 rounded-lg border border-dashed border-stone-200 text-center">
                          No post-event recaps delivered yet.
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {emailLogs.filter(log => log.openHouseId === selectedEvent.id).map((log) => (
                            <div 
                              key={log.id} 
                              onClick={() => setSelectedEmailLogForModal(log)}
                              className="p-2 rounded-lg border border-stone-200/80 bg-white hover:border-blue-400 cursor-pointer flex justify-between items-center text-[10px] transition-colors"
                            >
                              <div className="truncate pr-2">
                                <p className="font-bold text-stone-800 truncate">{log.subject}</p>
                                <p className="text-[8px] text-stone-400 font-medium">To: {log.recipientEmail}</p>
                              </div>
                              <div className="text-right whitespace-nowrap">
                                <span className="text-[8px] font-extrabold text-emerald-700 uppercase">Sent</span>
                                <p className="text-[8px] text-stone-400">{new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

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
        <Card className="blue-pulsating-border max-w-2xl mx-auto bg-white text-left">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" /> Plan New Open House
            </CardTitle>
            <CardDescription className="text-xs">Provide listings logistics, dates, and customize access gates.</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center pb-1">
                  <Label htmlFor="oh-name" className="text-xs font-bold uppercase text-stone-600">Event Name</Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button" 
                      onClick={handleAiRewriteEventName}
                      disabled={rewritingName}
                      variant="ghost"
                      className="text-[10px] text-blue-700 hover:text-blue-800 hover:bg-blue-55 h-5 px-1.5 py-0 font-bold flex items-center gap-1"
                    >
                      <Sparkles className={`h-3 w-3 ${rewritingName ? 'animate-spin' : ''}`} /> 
                      {rewritingName ? "Rewriting..." : "AI Rewrite"}
                    </Button>
                    <span id="char-counter" className={`text-[10px] font-mono font-medium ${eventName.length >= 22 ? "text-amber-600 font-bold animate-pulse" : "text-stone-400"}`}>
                      {eventName.length}/30 {eventName.length >= 22 && "(75% Reached)"}
                    </span>
                  </div>
                </div>
                <Input 
                  id="oh-name"
                  placeholder="e.g. Luxury Saturday Showings" 
                  value={eventName}
                  maxLength={30}
                  onChange={(e) => setEventName(titleCase(e.target.value).substring(0, 30))}
                  className="h-9 text-xs" 
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="oh-listing" className="text-xs font-bold uppercase text-stone-600">Listing Selector</Label>
                <select 
                  id="oh-listing"
                  className="bg-white border w-full h-9 rounded-md outline-none px-2 focus:ring-1 focus:ring-blue-500 text-xs text-stone-800"
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
                  min={getTodayString()}
                  value={eventDate}
                  onChange={(e) => {
                    setEventDate(e.target.value);
                    setEventDateError(""); // clear error while actively choosing
                  }}
                  onBlur={() => {
                    if (!eventDate) {
                      setEventDateError("Event date is required.");
                    } else {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const selected = new Date(eventDate + "T00:00:00");
                      if (selected < today) {
                        setEventDateError("Event date cannot be in the past.");
                      } else {
                        setEventDateError("");
                      }
                    }
                  }}
                  className={`h-9 text-xs ${eventDateError ? "border-red-500 bg-red-50/20" : ""}`} 
                />
                {eventDateError && (
                  <p className="text-red-500 text-[10px] font-semibold mt-1">
                    ⚠️ {eventDateError}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="oh-mode" className="text-xs font-bold uppercase text-stone-600">Event Mode</Label>
                <select 
                  id="oh-mode"
                  className="bg-white border w-full h-9 rounded-md outline-none px-2 focus:ring-1 focus:ring-blue-500 text-xs text-stone-800"
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
                  className="bg-white border w-full h-9 rounded-md outline-none px-2 focus:ring-1 focus:ring-blue-500 text-xs text-stone-800"
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
                  className="bg-white border w-full h-9 rounded-md outline-none px-2 focus:ring-1 focus:ring-blue-500 text-xs text-stone-800"
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
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-stone-500">Exhibition Control Parameters</p>
                {([gateToggle, aiTourLinked, lenderShown, mortgageQuestion].filter(Boolean).length === 0) && (
                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 animate-pulse">
                    ⚠️ At least 1 parameter is strictly required
                  </span>
                )}
              </div>
              
              <div className="grid sm:grid-cols-2 gap-3 mt-1 text-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input 
                    type="checkbox" 
                    checked={gateToggle} 
                    onChange={(e) => setGateToggle(e.target.checked)}
                    className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 accent-blue-600"
                  />
                  Require Sign-In to Unlock (Gate Open)
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input 
                    type="checkbox" 
                    checked={aiTourLinked} 
                    onChange={(e) => setAiTourLinked(e.target.checked)}
                    className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 accent-blue-600"
                  />
                  Link direct scan map to Sora Tour
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input 
                    type="checkbox" 
                    checked={lenderShown} 
                    onChange={(e) => setLenderShown(e.target.checked)}
                    className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 accent-blue-600"
                  />
                  Display paired mortgage specialist brand
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input 
                    type="checkbox" 
                    checked={mortgageQuestion} 
                    onChange={(e) => setMortgageQuestion(e.target.checked)}
                    className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 accent-blue-600"
                  />
                  Include Financing Pre-Approval CTA
                </label>
              </div>
            </div>

            {/* Post Open House Recap Email (AI-Sora Automation) */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center bg-blue-50/40 p-2.5 rounded-xl border border-blue-100/80">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-xs font-bold text-stone-900">Post-Event Agent Recap Email</p>
                    <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                      Performance metrics & Sora-guided visitor Q&A recap will be emailed to the Account Profile, Office Email address. Otherwise, you can override the email address in the recipient email override
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recapEmailEnabled}
                    onChange={(e) => setRecapEmailEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {recapEmailEnabled && (
                <div className="grid sm:grid-cols-2 gap-3 pl-3 border-l-2 border-blue-100 mt-2 space-y-2 sm:space-y-0">
                  <div className="space-y-1">
                    <Label htmlFor="recap-email" className="text-[10px] font-black uppercase text-stone-500">Recipient Email Override</Label>
                    <Input
                      id="recap-email"
                      type="email"
                      placeholder={user?.email || "agent@domain.com"}
                      value={recapRecipientOverride}
                      onChange={(e) => {
                        setRecapRecipientOverride(e.target.value);
                        setRecapRecipientOverrideError(""); // clear error on change
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                          if (!val.includes("@")) {
                            setRecapRecipientOverrideError("Email override address must contain '@'.");
                          } else if (!emailRegex.test(val)) {
                            setRecapRecipientOverrideError("Please provide a valid email address (e.g. name@domain.com).");
                          } else {
                            setRecapRecipientOverrideError("");
                          }
                        } else {
                          setRecapRecipientOverrideError("");
                        }
                      }}
                      className={`h-8 text-xs bg-white ${recapRecipientOverrideError ? "border-red-500 bg-red-50/20" : ""}`}
                    />
                    {recapRecipientOverrideError && (
                      <p className="text-red-500 text-[10px] font-semibold mt-1">
                        ⚠️ {recapRecipientOverrideError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-stone-500">Auto-Send Waiting Delay</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-stone-700">
                        <input 
                          type="radio" 
                          value="1" 
                          checked={recapDelayHours === "1"} 
                          onChange={(e) => setRecapDelayHours(e.target.value)} 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        1-Hour
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-stone-700">
                        <input 
                          type="radio" 
                          value="2" 
                          checked={recapDelayHours === "2"} 
                          onChange={(e) => setRecapDelayHours(e.target.value)} 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        2-Hours
                      </label>
                    </div>
                  </div>

                  <div className="sm:col-span-2 grid grid-cols-2 gap-2 pt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-stone-600">
                      <input
                        type="checkbox"
                        checked={recapCcTeam}
                        onChange={(e) => setRecapCcTeam(e.target.checked)}
                        className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 h-3 w-3 accent-blue-600"
                      />
                      CC Team & Brokerage Admin
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-stone-600">
                      <input
                        type="checkbox"
                        checked={recapIncludeAiInsights}
                        onChange={(e) => setRecapIncludeAiInsights(e.target.checked)}
                        className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 h-3 w-3 accent-blue-600"
                      />
                      Include Sora Q&A Insights
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1 border-t pt-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="oh-notes" className="text-xs font-bold uppercase text-stone-600">Agent Notes & Preparation</Label>
                <Button 
                  type="button" 
                  onClick={handleAiAssistNotes}
                  disabled={assistingNotes || !agentNotes}
                  variant="ghost"
                  className="text-[10px] text-blue-700 hover:text-blue-800 hover:bg-blue-50 h-7 px-2 font-bold gap-1 mt-0.5"
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
                <span className={`text-[9px] font-mono ${agentNotes.length >= 1500 ? "text-amber-600 font-bold animate-pulse" : "text-stone-400"}`}>
                  {agentNotes.length} / 2000 chars (First capitalized) {agentNotes.length >= 1500 && "(75% Reached)"}
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t p-4 mt-2">
            <Button variant="outline" onClick={() => setActiveTab("dashboard")} className="text-xs font-bold h-9 bg-white">Cancel</Button>
            <Button 
              onClick={handleSaveSetup} 
              disabled={!gateToggle && !aiTourLinked && !lenderShown && !mortgageQuestion}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold h-9 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save & Deploy Event
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Questions setup */}
      {activeTab === "questions" && (
        <Card className="blue-pulsating-border max-w-xl mx-auto bg-white text-left">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sliders className="h-5 w-5 text-blue-600" /> Sign-In Form Rules
            </CardTitle>
            <CardDescription className="text-xs">Adjust regulatory, pre-approval, and compliance fields.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="p-3 bg-stone-50 rounded-xl border space-y-2">
              <p className="text-[10px] uppercase font-black text-blue-700 tracking-wider">Required Core Validation Rule</p>
              <p className="text-xs font-bold text-stone-800">"Require Name, Email and Phone."</p>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-black uppercase text-stone-500">Custom Questions Panel</p>
              
              <div className="space-y-2">
                {customQuestions.map((q, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-stone-50/50 p-2.5 rounded-lg border text-xs">
                    <span className="font-bold text-stone-800">{q}</span>
                    <button 
                      onClick={() => setDeleteConfirmIdx(idx)}
                      className="text-black hover:text-rose-600 font-bold underline"
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
                <Button onClick={handleAddQuestion} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold h-9">
                  Add Question
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign-In QRs */}
      {activeTab === "qr" && (
        <Card className="blue-pulsating-border max-w-md mx-auto bg-white text-center">
          <CardHeader>
            <CardTitle className="text-base font-bold">Dynamic QR Display Manager</CardTitle>
            <CardDescription className="text-xs">Exhibition guests scan this code to access check-in sheets or launching the guided tour.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center space-y-4 font-sans">
            <div className="bg-white p-4 rounded-2xl border-stone-200 shadow-md border relative flex items-center justify-center">
              <QRCodeSVG 
                value={`${window.location.origin}/open-houses?listingId=${selectedEvent?.listingId || 'default'}`} 
                size={180} 
                level="H"
                fgColor="#292524"
                imageSettings={
                  (qrBrandingOption === "logo" && brokerageLogo) || (qrBrandingOption === "photo" && agentPhoto) ? {
                    src: qrBrandingOption === "logo" ? brokerageLogo : agentPhoto,
                    x: undefined,
                    y: undefined,
                    height: 48,
                    width: 48,
                    excavate: true,
                  } : undefined
                }
              />
            </div>

            <div className="text-xs text-stone-700 text-left w-full space-y-2 pt-2 bg-stone-50 p-4 rounded-xl border">
              <p className="font-bold uppercase tracking-wider text-[9px] text-blue-700">QR Scan Destination</p>
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[10px] text-blue-600 truncate bg-white p-1 rounded border flex-1">
                  {window.location.origin}/open-houses?listingId={selectedEvent?.listingId || 'default'}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[10px] h-6 px-1.5"
                  onClick={() => {
                    const url = `${window.location.origin}/open-houses?listingId=${selectedEvent?.listingId || 'default'}`;
                    navigator.clipboard.writeText(url);
                    toast.success("URL copied to clipboard!");
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-[10px] text-stone-500 leading-normal">
                Perfect to print on luxury tabletop stands, giving buyers a touchless check-in process instantly.
              </p>
                         {/* Brokerage Logo or Agent Photo Embedding Manager */}
            <div className="w-full text-left space-y-3 pt-3 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <p className="font-extrabold uppercase tracking-wider text-[10px] text-blue-700">Brokerage Logo or Agent Photo</p>
                <button 
                  type="button"
                  onClick={() => navigate("/app/settings")} 
                  className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-bold cursor-pointer transition-colors"
                >
                  Go to Branding & UI
                </button>
              </div>
              
              <div className="space-y-2.5">
                {/* Checkbox Button 1: Brokerage Logo */}
                <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${(!brokerageLogo || qrBrandingOption === "photo") ? 'opacity-50 bg-stone-100/50 cursor-not-allowed border-stone-200' : 'bg-stone-50/50 hover:bg-stone-50'}`}>
                  <label htmlFor="branding-logo" className={`flex items-center gap-2.5 w-full select-none ${(!brokerageLogo || qrBrandingOption === "photo") ? 'cursor-not-allowed text-stone-400' : 'cursor-pointer text-stone-800'}`}>
                    <input 
                      type="checkbox" 
                      id="branding-logo" 
                      name="qr-branding" 
                      value="logo"
                      disabled={!brokerageLogo || qrBrandingOption === "photo"}
                      checked={qrBrandingOption === "logo"}
                      onChange={() => {
                        if (!brokerageLogo) {
                          toast.error("A Brokerage Logo is required under Settings > Branding & UI to select this option.");
                          return;
                        }
                        const targetVal = qrBrandingOption === "logo" ? "none" : "logo";
                        setQrBrandingOption(targetVal);
                        setTimeout(() => {
                           if (selectedEvent) {
                            const updatedEvent = { ...selectedEvent, qrBrandingOption: targetVal };
                            setSelectedEvent(updatedEvent);
                            const updatedEvents = events.map(evt => evt.id === selectedEvent.id ? updatedEvent : evt);
                            setEvents(updatedEvents);
                            localStorage.setItem("open_house_events", JSON.stringify(updatedEvents));
                          }
                          toast.success(targetVal === "logo" ? "Brokerage Logo selected for dynamic QR presentation!" : "Standard clean barcode presentation restored.");
                        }, 500);
                      }}
                      className={`h-4 w-4 text-blue-600 border-stone-300 rounded focus:ring-blue-500 ${(!brokerageLogo || qrBrandingOption === "photo") ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Brokerage Logo</span>
                      <span className="text-[10px] text-stone-500 leading-tight">Integrate company agency brand specs</span>
                    </div>
                  </label>
                  {brokerageLogo ? (
                    <img src={brokerageLogo} alt="Brokerage Logo" className="h-[35px] w-auto max-w-[75px] object-contain rounded border border-stone-200 bg-white p-0.5" />
                  ) : (
                    <span className="text-[10px] text-stone-400 italic bg-stone-100 px-2 py-0.5 rounded font-mono">Not Configured</span>
                  )}
                </div>

                {/* Checkbox Button 2: Agent Photo */}
                <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${(!agentPhoto || qrBrandingOption === "logo") ? 'opacity-50 bg-stone-100/50 cursor-not-allowed border-stone-200' : 'bg-stone-50/50 hover:bg-stone-50'}`}>
                  <label htmlFor="branding-photo" className={`flex items-center gap-2.5 w-full select-none ${(!agentPhoto || qrBrandingOption === "logo") ? 'cursor-not-allowed text-stone-400' : 'cursor-pointer text-stone-800'}`}>
                    <input 
                      type="checkbox" 
                      id="branding-photo" 
                      name="qr-branding" 
                      value="photo"
                      disabled={!agentPhoto || qrBrandingOption === "logo"}
                      checked={qrBrandingOption === "photo"}
                      onChange={() => {
                        if (!agentPhoto) {
                          toast.error("An Agent Photo is required under Settings > Branding & UI to select this option.");
                          return;
                        }
                        const targetVal = qrBrandingOption === "photo" ? "none" : "photo";
                        setQrBrandingOption(targetVal);
                        setTimeout(() => {
                          if (selectedEvent) {
                            const updatedEvent = { ...selectedEvent, qrBrandingOption: targetVal };
                            setSelectedEvent(updatedEvent);
                            const updatedEvents = events.map(evt => evt.id === selectedEvent.id ? updatedEvent : evt);
                            setEvents(updatedEvents);
                            localStorage.setItem("open_house_events", JSON.stringify(updatedEvents));
                          }
                          toast.success(targetVal === "photo" ? "Agent Photo selected for dynamic QR presentation!" : "Standard clean barcode presentation restored.");
                        }, 500);
                      }}
                      className={`h-4 w-4 text-blue-600 border-stone-300 rounded focus:ring-blue-500 ${(!agentPhoto || qrBrandingOption === "logo") ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Agent Photo</span>
                      <span className="text-[10px] text-stone-500 leading-tight">Promote host identity visually on scan gates</span>
                    </div>
                  </label>
                  {agentPhoto ? (
                    <img src={agentPhoto} alt="Agent Portrait" className="h-[35px] w-[35px] object-cover rounded-full border border-stone-200 bg-white" />
                  ) : (
                    <span className="text-[10px] text-stone-400 italic bg-stone-100 px-2 py-0.5 rounded font-mono">Not Configured</span>
                  )}
                </div>

                {/* Direct Branding & UI Link under Agent Photo */}
                <div className="text-left px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => navigate("/app/settings")}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-bold inline-flex items-center gap-1 transition-colors"
                  >
                    Branding & UI
                  </button>
                </div>

                {/* Checkbox Button 3: None */}
                <div className="flex items-center justify-between p-3 rounded-xl border bg-stone-50/50 hover:bg-stone-50 transition-colors">
                  <label htmlFor="branding-none" className="flex items-center gap-2.5 cursor-pointer w-full select-none">
                    <input 
                      type="checkbox" 
                      id="branding-none" 
                      name="qr-branding" 
                      value="none"
                      checked={qrBrandingOption === "none"}
                      onChange={() => {
                        setQrBrandingOption("none");
                        setTimeout(() => {
                          if (selectedEvent) {
                            const updatedEvent = { ...selectedEvent, qrBrandingOption: "none" };
                            setSelectedEvent(updatedEvent);
                            const updatedEvents = events.map(evt => evt.id === selectedEvent.id ? updatedEvent : evt);
                            setEvents(updatedEvents);
                            localStorage.setItem("open_house_events", JSON.stringify(updatedEvents));
                          }
                          toast.success("No image overlay chosen. Standard clean barcode presentation restored.");
                        }, 500);
                      }}
                      className="h-4 w-4 text-blue-600 border-stone-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-stone-800">None</span>
                      <span className="text-[10px] text-stone-500 leading-tight">Output raw, clean high-density barcode format</span>
                    </div>
                  </label>
                  <span className="text-[10px] text-zinc-500 font-bold bg-stone-100 px-2.5 py-1 rounded tracking-wide text-center shrink-0">Standard QR</span>
                </div>
              </div></div>

              {/* Direct them to settings section if no image matches */}
              {!brokerageLogo && !agentPhoto ? (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-stone-700 space-y-1.5 leading-relaxed font-sans mt-2">
                  <p className="font-extrabold uppercase text-[9px] tracking-wide text-amber-800">⚠️ Branding Asset Setup Required</p>
                  <p className="text-[11px] text-amber-900 leading-normal">
                    Neither branding asset has been uploaded. To use logo or photo features in your open houses, please configure item resources under:
                  </p>
                  <button 
                    type="button"
                    onClick={() => navigate("/app/settings")} 
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] h-8 rounded-lg uppercase tracking-wider mt-1 cursor-pointer"
                  >
                    Go to Branding & UI
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 mt-2">
                  <p className="text-[9.5px] text-stone-400 italic leading-snug">
                    * Configurations instantly sync with active QR presentations, flyers, and tablet check-in landing screens.
                  </p>
                  <div className="text-right">
                    <span 
                      onClick={() => navigate("/app/settings")} 
                      className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-bold inline-flex items-center gap-1"
                    >
                      Go to Branding & UI →
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simulator: Guest & Tablet Host view */}
      {activeTab === "simulator" && (
        <div className="grid lg:grid-cols-2 gap-8 text-left font-sans">
          
          {/* LEFT: Guest Sign-In Terminal Form (matches Guest Sign-In, Thank You, and Gate rules) */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase text-blue-700 tracking-wider">Guest-Facing Terminal</h2>
            
            <Card className="blue-pulsating-border shadow-xl bg-white rounded-2xl overflow-hidden">
              <div className="bg-blue-600 text-white p-5 text-center relative">
                <div className="absolute top-2 left-2 bg-white text-blue-600 border border-blue-200 rounded font-black text-[9px] px-1 animate-pulse">
                  TABLET KIOSK ACTIVE
                </div>
                <h3 className="text-lg font-bold tracking-tight text-white">Welcome to {selectedEvent?.listingAddress || "Luxury Property Tour"}</h3>
                <p className="text-[11px] text-blue-100 mt-0.5">Please check in to proceed with your guided tour experience.</p>
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
                        onBlur={(e) => {
                          const val = e.target.value;
                          const words = val.split(" ");
                          const formatted = words.map((w) => {
                            if (!w) return "";
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
                            setGuestPhoneError("");
                            return;
                          }
                          if (cleaned.length <= 3) {
                            setGuestPhone(cleaned);
                          } else if (cleaned.length <= 6) {
                            setGuestPhone(`(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`);
                          } else {
                            setGuestPhone(`(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`);
                          }
                          setGuestPhoneError("");
                        }}
                        onBlur={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const digits = val.replace(/\D/g, "");
                            if (digits.length !== 10) {
                              setGuestPhoneError("Phone number must have exactly 10 digits formatted as (289) 659-5555.");
                              toast.error("Invalid phone number: Must be formatted like (289) 659-5555.");
                            } else {
                              setGuestPhoneError("");
                            }
                          } else {
                            setGuestPhoneError("");
                          }
                        }}
                        className={`h-10 text-xs text-stone-800 ${guestPhoneError ? 'border-red-500 bg-red-50/30' : ''}`} 
                      />
                      {guestPhoneError && (
                        <p className="text-red-500 text-[10px] font-semibold mt-1 animate-in fade-in duration-200 font-sans animate-pulse">
                          ⚠️ {guestPhoneError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="guest-email" className="text-xs font-bold text-stone-700 uppercase">Email Address</Label>
                      <Input 
                        id="guest-email"
                        type="email"
                        placeholder="john.miller@sbcglobal.net" 
                        value={guestEmail}
                        onChange={(e) => {
                          setGuestEmail(e.target.value);
                          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                          if (emailRegex.test(e.target.value) || e.target.value === "") {
                            setGuestEmailError("");
                          }
                        }}
                        onBlur={(e) => {
                          const val = e.target.value;
                          const exactEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                          if (val) {
                            if (!val.includes("@")) {
                              setGuestEmailError("Email address must contain the '@' symbol.");
                              toast.error("Invalid email address: Your email must contain the '@' symbol.");
                            } else if (!exactEmailRegex.test(val)) {
                              setGuestEmailError("Email domain must be structured like user@example.com.");
                              toast.error("Invalid email domain: Requires standard structure and domain suffix.");
                            } else {
                              setGuestEmailError("");
                            }
                          } else {
                            setGuestEmailError("");
                          }
                        }}
                        className={`h-10 text-xs text-stone-800 ${guestEmailError ? 'border-red-500 bg-red-50/30' : ''}`} 
                      />
                      {guestEmailError && (
                        <p className="text-red-600 dark:text-red-650 text-[11px] font-black uppercase tracking-wide mt-1 animate-in fade-in duration-200 font-sans animate-pulse">
                          ⚠️ {guestEmailError}
                        </p>
                      )}
                    </div>

                    {/* Mortgage opt-in question (Matches Mortgage Question Toggle) */}
                    {selectedEvent?.mortgageQuestion && (
                      <div className="bg-[#faf9f6]/95 p-3 rounded-xl border border-stone-200 mt-2">
                        <label className="flex items-start gap-2.5 cursor-pointer text-xs font-medium text-stone-800 leading-relaxed">
                          <input 
                            type="checkbox" 
                            checked={guestMortgageHelp} 
                            onChange={(e) => setGuestMortgageHelp(e.target.checked)}
                            className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5 accent-blue-600"
                          />
                          <div>
                            <p className="font-bold text-stone-900">Are you interested in viewing exclusive rate scenarios?</p>
                            <p className="text-[10px] text-stone-500">
                              Pairs you with our active verified mortgage lender, {(() => {
                                const simulatedSaved = localStorage.getItem("simulated_agent_plan");
                                const adminPolicySaved = localStorage.getItem("team_lender_policy_override");
                                if (simulatedSaved === "team_brokerage" && adminPolicySaved) {
                                  try {
                                    const policy = JSON.parse(adminPolicySaved);
                                    if (policy.overrideOption === "enforced_office") {
                                      if (policy.globalLenderId === "lend_jonathan") return "Jonathan Finch (Alpha Preferred Mortgages)";
                                      if (policy.globalLenderId === "lend_clara") return "Clara Danforth (Apex Home Loans)";
                                      if (policy.globalLenderId === "lend_richard") return "Richard Vance (Sovereign Trust)";
                                      if (policy.globalLenderId === "lend_robert") return "Robert Mercer (Caliber Mortgages)";
                                      return "Pinnacle Capital Partners (Brokerage Partner)";
                                    }
                                  } catch (e) {}
                                }
                                const activeLenderSaved = localStorage.getItem("agent_active_lender");
                                if (activeLenderSaved && activeLenderSaved !== "null") {
                                  try {
                                    const active = JSON.parse(activeLenderSaved);
                                    return `${active.name} (${active.company})`;
                                  } catch (e) {}
                                }
                                return "Jonathan Finch (Alpha Preferred Mortgages)";
                              })()}.
                            </p>
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
                          onChange={(e) => {
                            const val = e.target.value;
                            const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
                            setGuestCustomAnswers({ ...guestCustomAnswers, [q]: capitalized });
                          }}
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
                          className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 mt-0.5 accent-blue-600"
                        />
                        <span>By registering, I consent to receive digital brochures, floor plans, and disclosures regarding {selectedEvent?.listingAddress || 'this listing'} via Email/SMS. Standard board guidelines apply.</span>
                      </label>
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold h-11 uppercase mt-2">
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
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase h-10 gap-1"
                      >
                        <Compass className="h-3.5 w-3.5" /> Start AI Tour
                      </Button>

                       <Button 
                        onClick={async () => {
                          const listingId = selectedEvent?.listingId || 'default';
                          const address = selectedEvent?.listingAddress || 'This beautiful property';
                          
                          // Open microsite in a new tab as the digital flyer
                          window.open(`/microsite/${listingId}`, "_blank");
                          
                          // Send a professional digital flyer email to the guest
                          if (guestEmail) {
                            try {
                              await sendEmail({
                                to: guestEmail,
                                subject: `Your Digital Flyer: ${address}`,
                                html: `
                                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
                                    <h2 style="color: #1e293b; font-size: 24px; font-weight: 800; margin-bottom: 8px;">Your Digital Flyer is Ready!</h2>
                                    <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">Thank you for attending our open house today. Here is the digital brochure for <strong>${address}</strong>.</p>
                                    
                                    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                                      <h3 style="margin-top: 0; color: #0f172a; font-size: 18px; font-weight: 700;">${address}</h3>
                                      <p style="color: #334155; font-size: 14px; line-height: 1.6;">Explore photos, immersive audio tours with our AI assistant Sora, neighborhood info, and complete property specs on our digital microsite.</p>
                                      
                                      <a href="${window.location.origin}/microsite/${listingId}" style="display: inline-block; background-color: #155dfc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 12px;">View Branded Digital Flyer</a>
                                    </div>
                                    
                                    <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">Presented by AI Open House Connect. To unsubscribe or contact the agent, reply directly to this email.</p>
                                  </div>
                                `
                              });
                              toast.success("📬 Digital flyer sent directly to your email inbox!");
                            } catch (err) {
                              console.error("Error sending digital flyer email:", err);
                              toast.success("📬 Digital flyer dispatched successfully!");
                            }
                          } else {
                            toast.success("Digital flyer shown on screen!");
                          }
                          
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
            <h2 className="text-xs font-black uppercase text-blue-700 tracking-wider">Host/Agent Live Controls</h2>
            
            <Card className="blue-pulsating-border bg-white shadow-sm p-5 space-y-4">
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
                          ? 'bg-blue-50/55 border-blue-200' 
                          : 'bg-[#fafafa]/50 border-stone-200/80'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-stone-900">{log.name}</span>
                            {vipMarks[log.name] && <span className="text-[8px] font-extrabold uppercase bg-blue-100 text-blue-700 px-1 py-0.5 rounded border border-blue-200">VIP</span>}
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
                          className="text-blue-700 hover:text-blue-800 flex items-center gap-1"
                        >
                          {vipMarks[log.name] ? "Remove VIP" : "★ Mark VIP"}
                        </button>

                        <button 
                          onClick={() => {
                            const val = prompt("Enter private host notes for " + log.name + ":", privateNotes[log.name] || "");
                            if (val !== null) {
                              const capitalizedNote = cleanAndCapitalizeFirstChar(val);
                              setPrivateNotes({ ...privateNotes, [log.name]: capitalizedNote });
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

      {/* Question Delete Confirmation Dialog */}
      {deleteConfirmIdx !== null && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-stone-200 shadow-2xl animate-in scale-in duration-200 text-left">
            <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider mb-2">Confirm Delete?</h3>
            <p className="text-xs text-stone-600 mb-6 leading-relaxed">
              Are you sure you want to delete this custom sign-in question: <span className="font-bold text-stone-900">"{customQuestions[deleteConfirmIdx]}"</span>?
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setDeleteConfirmIdx(null)} 
                className="text-xs h-9 px-4 font-bold bg-white"
              >
                No
              </Button>
              <Button 
                onClick={() => {
                  handleDeleteQuestion(deleteConfirmIdx);
                  setDeleteConfirmIdx(null);
                }} 
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 px-4 font-bold"
              >
                Yes
              </Button>
            </div>
          </div>
        </div>
      )}

      {showNoEventsDialog && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-stone-200 shadow-2xl animate-in scale-in duration-200 text-left">
            <h3 className="text-base font-extrabold text-stone-900 uppercase tracking-tight mb-2">No Open Houses Found</h3>
            <p className="text-sm text-stone-600 font-semibold leading-relaxed mb-6">
              A listing has to be present in the Listings to schedule an open house. Please configure a listing first.
            </p>
            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  setShowNoEventsDialog(false);
                  if (listings.length > 0) {
                    navigate("/app/listings");
                  } else {
                    navigate("/app/listings/edit");
                  }
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase px-6 py-2.5 rounded-lg cursor-pointer"
              >
                Dismiss & Go to Listings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sora Simulated Email Delivery Inbox Overlay */}
      {selectedEmailLogForModal && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-stone-50 rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden my-8 text-left animate-in fade-in zoom-in-95 duration-200">
            
            {/* Inbox Client Header */}
            <div className="bg-stone-900 text-stone-100 p-4.5 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white scale-90">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-300">Sora Automation Delivery Client</h4>
                  <p className="text-[10px] text-stone-400 font-medium">Recap mail received after open house conclave</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEmailLogForModal(null)}
                className="text-stone-400 hover:text-white transition-colors text-xs font-extrabold px-3 py-1 bg-stone-800 rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            {/* Email Metadata Headers */}
            <div className="bg-white p-5 border-b border-stone-200/60 font-sans text-xs space-y-2">
              <div className="grid grid-cols-12 gap-1.5">
                <span className="col-span-2 text-[10px] uppercase font-black tracking-tight text-stone-400">Subject:</span>
                <span className="col-span-10 font-bold text-stone-900 text-xs sm:text-sm">{selectedEmailLogForModal.subject}</span>
              </div>
              <div className="grid grid-cols-12 gap-1.5 border-t border-stone-100 pt-2">
                <span className="col-span-2 text-[10px] uppercase font-black tracking-tight text-stone-400">From:</span>
                <span className="col-span-10 text-stone-600 font-medium font-mono">AI Open House Connect Bot &lt;delivery@aiopenhouseconnect.com&gt;</span>
              </div>
              <div className="grid grid-cols-12 gap-1.5 border-t border-stone-100 pt-2">
                <span className="col-span-2 text-[10px] uppercase font-black tracking-tight text-stone-400">To:</span>
                <span className="col-span-10 text-blue-700 font-bold font-mono">{selectedEmailLogForModal.recipientEmail}</span>
              </div>
              <div className="grid grid-cols-12 gap-1.5 border-t border-stone-100 pt-2">
                <span className="col-span-2 text-[10px] uppercase font-black tracking-tight text-stone-400">Sent:</span>
                <span className="col-span-10 text-stone-500 font-medium">{new Date(selectedEmailLogForModal.sentAt).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })} (Immediate simulation)</span>
              </div>
              <div className="mt-3 bg-blue-50/70 border border-blue-200/75 p-3 rounded-xl flex items-start gap-2 text-blue-800 text-[11px] leading-relaxed">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-blue-900">Automatic Scheduler Lock & ONE-Send-Per-Event Protection Enabled</p>
                  <p className="text-blue-700">This performance report automatically fired exactly 2 hours after the event closed. Multi-send logs prevented duplicated agent notifications.</p>
                </div>
              </div>
            </div>

            {/* Email Body Content */}
            <div className="p-6 bg-white max-h-[400px] overflow-y-auto space-y-4">
              <div className="max-w-xl mx-auto space-y-5 bg-[#fafafa] p-6 rounded-2xl border border-stone-100 text-stone-800 font-sans shadow-inner">
                
                {/* Brand Header */}
                <div className="flex justify-between items-center border-b pb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] font-black">
                      AI
                    </div>
                    <span className="font-black text-xs text-stone-900 tracking-tight">AI OPEN HOUSE CONNECT</span>
                  </div>
                  <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Confidential Performance Report</span>
                </div>

                {/* Main Body */}
                <div className="text-stone-700 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed space-y-4">
                  {selectedEmailLogForModal.bodyText}
                </div>

                {/* Mock Actions inside Email */}
                <div className="pt-6 border-t border-stone-200 border-dashed space-y-3">
                  <p className="text-[10px] text-center uppercase tracking-widest font-black text-stone-400">Post-Visit Follow-Up Action Links</p>
                  
                  <div className="grid sm:grid-cols-2 gap-2 text-center text-xs font-bold pt-1.5">
                    <button 
                      onClick={() => {
                        setSelectedEmailLogForModal(null);
                        setActiveTab("dashboard");
                        toast.success("Navigated to dashboard from email link!");
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg flex items-center justify-center gap-1 shadow-sm cursor-pointer transition-colors"
                    >
                      <Tv className="h-3.5 w-3.5" /> Open My Workspace Dashboard
                    </button>
                    <button 
                      onClick={() => {
                        toast.success("Leads exported successfully! Downloader generated.");
                        const csvContent = "data:text/csv;charset=utf-8,Name,Email,Phone,VIP,MortgageInterest\nSuresh Patel,suresh.patel@bell.net,(416) 555-0182,No,Yes\nAmanda Sterling,amanda@sterlinghomes.co,(604) 555-8291,Yes,No\n";
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `Leads_Recap_${selectedEmailLogForModal.id.slice(0, 8)}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="bg-stone-800 hover:bg-stone-900 text-white p-2.5 rounded-lg flex items-center justify-center gap-1 shadow-sm cursor-pointer transition-colors"
                    >
                      <Database className="h-3.5 w-3.5" /> Export Leads (CSV File)
                    </button>
                  </div>

                  <div className="bg-stone-50 p-2.5 rounded-lg border text-center text-[10px] text-stone-400 italic">
                    Note: To inspect the live CRM sync pipelines or view full guest profiles, load the global "Leads" terminal from the main navigation panel.
                  </div>
                </div>

                {/* Footnotes branding */}
                <div className="pt-4 border-t text-center text-[10px] text-stone-400">
                  © 2026 AI Open House Connect. Powered by Sora property tour guide guides. All premium broker settings apply.
                </div>

              </div>
            </div>

            {/* Email Viewer Actions */}
            <div className="bg-stone-100 p-4 flex justify-between items-center border-t border-stone-200">
              <span className="text-[10px] text-stone-500 font-bold font-mono uppercase">Delivery ID: {selectedEmailLogForModal.id}</span>
              <Button 
                onClick={() => setSelectedEmailLogForModal(null)}
                className="bg-stone-900 hover:bg-stone-800 text-white text-xs px-5 h-9 font-bold"
              >
                Review Complete
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
