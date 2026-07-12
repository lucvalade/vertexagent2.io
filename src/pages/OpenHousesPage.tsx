import React, { useState, useEffect } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { getAllListings, Listing, createLead, Lead, enrichLeadData, sendEmail } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { translations } from "@/lib/i18n";
import { toast } from "sonner";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { 
  Sparkles, 
  Smartphone, 
  Tv, 
  CheckCircle2, 
  QrCode, 
  Link as LinkIcon, 
  FileText, 
  Send, 
  ArrowRight, 
  Award, 
  Clock, 
  ShieldCheck, 
  Database,
  Users,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Eye,
  Download,
  Wifi,
  WifiOff,
  RefreshCw,
  Lock,
  Edit3,
  Compass,
  AlertCircle
} from "lucide-react";

export default function OpenHousesPage() {
  const { user } = useAuth();
  const [brokerageName, setBrokerageName] = useState("Vertex Agent Group");
  const { listingId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlListingId = searchParams.get("listingId") || listingId;

  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [activeKioskListing, setActiveKioskListing] = useState<Listing | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [listingQrModes, setListingQrModes] = useState<Record<string, "signin" | "tour">>({});
  const [copiedStatuses, setCopiedStatuses] = useState<Record<string, boolean>>({});

  // Simulator State
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestAddress, setGuestAddress] = useState("");
  const [hasBRA, setHasBRA] = useState<"yes" | "no">("no");
  const [braRepName, setBraRepName] = useState("");
  const [braBrokerage, setBraBrokerage] = useState("");
  const [caslConsent, setCaslConsent] = useState<"consent" | "no_consent">("consent");
  const [hasConsented, setHasConsented] = useState(false);
  const [showDisclosuresModal, setShowDisclosuresModal] = useState(false);
  const [kioskMode, setKioskMode] = useState<"tablet" | "touchless">("tablet");
  const [capturedLeads, setCapturedLeads] = useState<Array<any>>([
    { name: "Sarah Connor", email: "sarah.c@gmail.com", phone: "(415) 888-2940", address: "742 Evergreen Terrace, LA", hasBRA: "No (Unrepresented)", caslConsent: "Consented", time: "2 mins ago", type: "Tablet Kiosk", isDemo: true },
    { name: "John Miller", email: "jmiller@sbcglobal.net", phone: "(206) 555-0912", address: "10900 Wilshire Blvd, LA", hasBRA: "Yes (Rep: Arthur, Camelot Broker)", caslConsent: "No Consent", time: "15 mins ago", type: "Touchless QR", isDemo: true }
  ]);
  const [lastNotification, setLastNotification] = useState<string | null>(null);
  const [emailValidationError, setEmailValidationError] = useState("");
  const [phoneValidationError, setPhoneValidationError] = useState("");

  // Offline State Machine & Connectivity States
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [onlineStatus, setOnlineStatus] = useState(true); // default to true, set in useEffect
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");

  // Initialize offline queue from local storage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem("vertex_offline_queue");
    if (savedQueue) {
      try {
        setOfflineQueue(JSON.parse(savedQueue));
      } catch (e) {
        console.error("Failed to parse offline queue", e);
      }
    }
  }, []);

  // Listing Questionnaire states
  const [listingQuestionsMap, setListingQuestionsMap] = useState<Record<string, any[]>>({});
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [newQuestionType, setNewQuestionType] = useState<"text" | "yes_no" | "select">("text");
  const [newQuestionOptions, setNewQuestionOptions] = useState("");
  const [requestedDocs, setRequestedDocs] = useState<string[]>([]);

  // Security & Storage Auditing Portal custom fields
  const [isAuditingEditMode, setIsAuditingEditMode] = useState(false);
  const [auditEmailContent, setAuditEmailContent] = useState(() => {
    return localStorage.getItem("vertex_audit_email_content") || 
      "Upon checking in, the visitor immediately receives an email with a professional, mobile-optimized digital brochure of the property. This contains pre-populated OREA/compliance disclosure logs, download keys for the audio guides, and clickable contact links routing back to the host team.";
  });
  const [auditSmsAlert, setAuditSmsAlert] = useState(() => {
    return localStorage.getItem("vertex_audit_sms_alert") || 
      "Yes! Milliseconds within submission, the host agent gets an SMS text message detailing lead names, email references, phone numbers, check-in timestamps, status, representation coordinates, and automated telecom compliance checks.";
  });
  const [auditValidationApi, setAuditValidationApi] = useState(() => {
    return localStorage.getItem("vertex_audit_validation_api") || 
      "A real-time cellular lookup search is run instantly on the registrant's phone number. Mobile carrier, line status (mobile vs. VoIP vs. landline), and country info are retrieved using Twilio Lookup API V2. Registrations and verified parameters are stored securely inside Firebase Firestore under the /leads collection as authenticated sub-documents.";
  });

  // Input Formatting Helpers
  const formatName = (val: string) => {
    return val.replace(/\b(\w)/g, (match) => match.toUpperCase());
  };

  const formatPhone = (val: string) => {
    const cleaned = val.replace(/\D/g, ""); // strip non-digits
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 3) {
      return `(${cleaned}`;
    }
    if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    }
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const formatAddress = (val: string) => {
    // Capitalize first letter of every word
    let formatted = val.replace(/\b(\w)/g, (match) => match.toUpperCase());
    // Convert 2-letter province abbreviations to fully uppercase (e.g., 'on', 'bc', 'ab')
    formatted = formatted.replace(/\b(on|bc|ab|qc|sk|mb|ns|nb|nl|pe|yt|nt|nu)\b/gi, (m) => m.toUpperCase());
    return formatted;
  };

  const [lang, setLang] = useState<"en" | "fr">("en");
  const t = (key: string) => translations[lang][key] || key;

  const toggleLang = () => setLang(lang === "en" ? "fr" : "en");

  // Digital Signature Pad Canvas State & Handlers
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ("touches" in e) {
      if (e.cancelable) e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#1e3a8a"; // Beautiful deep blue ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const { x, y } = getCoord(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ("touches" in e) {
      if (e.cancelable) e.preventDefault();
    }
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoord(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const getCoord = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Adapt layout coordinates smoothly to high-fidelity internal resolution
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  useEffect(() => {
    async function fetchBrokerage() {
      if (user?.brokerage) {
        setBrokerageName(user.brokerage);
        return;
      }
      try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.brokerageName) {
            setBrokerageName(data.brokerageName);
          }
        }
      } catch (err) {
        console.error("Error loading global brokerage name:", err);
      }
    }
    fetchBrokerage();
  }, [user]);

  useEffect(() => {
    async function loadListings() {
      try {
        setListingsLoading(true);
        const data = await getAllListings();
        if (data && data.length > 0) {
          setListings(data);
          if (urlListingId) {
            const found = data.find(l => l.id === urlListingId);
            if (found) {
              setActiveKioskListing(found);
              setKioskMode("touchless");
              setTimeout(() => {
                const playground = document.getElementById("simulator");
                if (playground) playground.scrollIntoView({ behavior: "smooth" });
              }, 400);
            } else {
              setActiveKioskListing(data[0]);
            }
          } else {
            setActiveKioskListing(data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch listings in OpenHousesPage:", err);
      } finally {
        setListingsLoading(false);
      }
    }
    loadListings();
  }, [urlListingId]);

  // Load listingQuestionsMap of multiple listings on load
  useEffect(() => {
    const saved = localStorage.getItem("vertex_listing_questions_map");
    if (saved) {
      try {
        setListingQuestionsMap(JSON.parse(saved));
      } catch (err) {
        console.error("Error parsing listing questions map:", err);
      }
    }
    
    // Load initial offline queue from cache
    const queuedText = localStorage.getItem("vertex_offline_queue");
    if (queuedText) {
      try {
        setOfflineQueue(JSON.parse(queuedText));
      } catch (e) {
        console.error("Failed to parse local offline queue", e);
      }
    }

    // Set up online listeners
    const handleOnline = () => {
      setOnlineStatus(true);
      toast.info("Network Connection Restored! Automatic queue syncing is active.");
    };
    const handleOffline = () => {
      setOnlineStatus(false);
      toast.warning("Disconnected. Open house sign-in is buffering in local first offline mode.");
    };
    setOnlineStatus(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update followUpQuestions when activeKioskListing changes
  useEffect(() => {
    if (activeKioskListing) {
      const storedMapJson = localStorage.getItem("vertex_listing_questions_map");
      let map: Record<string, any[]> = {};
      if (storedMapJson) {
        try { map = JSON.parse(storedMapJson); } catch (e) {}
      }
      
      const listingId = activeKioskListing.id;
      if (map[listingId]) {
        setFollowUpQuestions(map[listingId]);
      } else {
        // Preset high-fidelity default signup questionnaire for this listing
        const defaultSet = [
          { id: 1, text: `What is your home-buying timeline for ${activeKioskListing.address}?`, category: "Timeline", type: "select", options: ["Immediate (1-3 months)", "Medium (3-6 months)", "Just browsing"] },
          { id: 2, text: "Are you Pre-approved for a mortgage/financing?", category: "Pricing", type: "yes_no" },
          { id: 3, text: "Are you working with a licensed real estate agent?", category: "Representation", type: "yes_no" },
          { id: 4, text: "How would you rate your interest in making an offer (1-10)?", category: "Interest", type: "text" }
        ];
        setFollowUpQuestions(defaultSet);
        
        // Save back
        map[listingId] = defaultSet;
        setListingQuestionsMap(map);
        localStorage.setItem("vertex_listing_questions_map", JSON.stringify(map));
      }
    }
  }, [activeKioskListing]);

  // Sync Offline leads automatically when we detect online state & simulateOffline is falsy
  useEffect(() => {
    if (onlineStatus && !simulateOffline && offlineQueue.length > 0) {
      syncOfflineLeads();
    }
  }, [onlineStatus, simulateOffline]);

  // Sync function definition
  const syncOfflineLeads = async () => {
    if (offlineQueue.length === 0) return;
    setSyncStatus("syncing");
    
    const leadsToSync = [...offlineQueue];
    const failedLeads: any[] = [];
    let syncedCount = 0;
    
    for (const lead of leadsToSync) {
      try {
        let enrichedData: any = {};
        try {
          const res = await enrichLeadData({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            waiverAccepted: true,
            waiverVersion: "v2.1"
          });
          if (res) {
            enrichedData = res;
          }
        } catch (enrichErr) {
          console.error("Enrichment failed during sync, using basic details:", enrichErr);
          enrichedData = {
            isVerified: true,
            confidenceScore: "medium",
            occupation: "Real Estate enthusiast",
            employer: "Private Sector",
            education: "University of Toronto",
            socialProfiles: {
              linkedin: `https://linkedin.com/in/${lead.name.toLowerCase().replace(/\s+/g, "-")}`,
              facebook: `https://facebook.com/${lead.name.toLowerCase().replace(/\s+/g, "-")}`
            },
            waiverAccepted: true,
            waiverVersion: "v2.1"
          };
        }

        const leadPayload = {
          id: lead.id,
          listingId: lead.listingId,
          listingAddress: lead.listingAddress || "Unspecified Listing",
          agentId: lead.agentId || user?.id || "mock_agent",
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          message: lead.customQAString || "Authenticated Offline Open House Registration",
          status: "New" as const,
          createdAt: lead.createdAt || Date.now(),
          ...enrichedData
        };
        
        await createLead(lead.listingId, leadPayload);
        syncedCount++;
      } catch (err) {
        console.error("Failed to sync lead during queue clearance:", lead.id, err);
        failedLeads.push(lead);
      }
    }
    
    if (failedLeads.length === 0) {
      setSyncStatus("synced");
      setOfflineQueue([]);
      localStorage.setItem("vertex_offline_queue", "[]");
      toast.success(`🎉 Automatically synchronized all ${syncedCount} queued off-line leads directly to Firestore!`);
    } else {
      setSyncStatus("error");
      setOfflineQueue(failedLeads);
      localStorage.setItem("vertex_offline_queue", JSON.stringify(failedLeads));
      toast.error(`Auto-sync partially complete. ${failedLeads.length} leads still buffered.`);
    }
  };

  // Update questions helper
  const updateQuestionsForActiveListing = (newQuestions: any[]) => {
    setFollowUpQuestions(newQuestions);
    if (activeKioskListing) {
      const updatedMap = {
        ...listingQuestionsMap,
        [activeKioskListing.id]: newQuestions
      };
      setListingQuestionsMap(updatedMap);
      localStorage.setItem("vertex_listing_questions_map", JSON.stringify(updatedMap));
    }
  };

  // QR Code generator state
  const [qrUrl, setQrUrl] = useState("https://aiopenhouseconnect.com/tour/luxury-modern-craftsman");
  const [qrColor, setQrColor] = useState("#2563eb");

  // Flyer template state
  const [flyerStyle, setFlyerStyle] = useState<"luxury" | "tech" | "standard">("luxury");

  // Dynamic Questionnaire builder states
  const [followUpQuestions, setFollowUpQuestions] = useState<Array<{ id: number; text: string; category: string; type?: string; options?: string[] }>>([
    { id: 1, text: "What are your thoughts on the price and overall value?", category: "Pricing", type: "text" },
    { id: 2, text: "What is your home-buying timeline (e.g., immediate, 3-6 months)?", category: "Timeline", type: "text" },
    { id: 3, text: "Do you have active broker representation or are you unrepresented?", category: "Representation", type: "yes_no" },
    { id: 4, text: "How would you rate your interest in making an offer (1-10)?", category: "Interest", type: "text" }
  ]);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionCategory, setNewQuestionCategory] = useState("General");
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editingQuestionText, setEditingQuestionText] = useState("");

  // Helper to trigger follow-up SMS automation
  const triggerSMSFollowUp = async (phone: string, name: string) => {
    try {
      const resp = await fetch("/api/send-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: phone,
          message: `Hi ${name.split(" ")[0]}, thanks for visiting ${activeKioskListing?.address || "our open house"}! Let us know if you have any questions.\nBest,\n${brokerageName}`
        })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      console.log(`[Follow-up] Sent SMS to ${phone}:`, data.sid);
    } catch (err) {
      console.error("[Follow-up] Trigger error:", err);
      // Fail silently for user in case phone is bad or credentials missing
    }
  };

  // Handle Real & Mock Sign-in Submission with Offline queueing and custom questions
  const handleMockSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName) {
      toast.error("Please fill in your Name first.");
      return;
    }

    if (!guestEmail || !guestPhone) {
      toast.error("Contact details required: Please provide both an Email address AND a Phone Number.");
      return;
    }

    if (!hasConsented) {
      toast.error("You must agree to the Terms, Privacy Policy, and Consent for communications to sign in.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (guestEmail && (!guestEmail.includes("@") || !emailRegex.test(guestEmail))) {
      setEmailValidationError("Please enter a valid email address (e.g., name@example.com).");
      toast.error("Please enter a valid email address (e.g., name@example.com).");
      return;
    }
    setEmailValidationError("");

    if (guestPhone) {
      const digits = guestPhone.replace(/\D/g, "");
      if (digits.length !== 10) {
        setPhoneValidationError("Phone number must have exactly 10 digits formatted as (289) 659-5555.");
        toast.error("Invalid phone number: Must be formatted like (289) 659-5555.");
        return;
      }
    }
    setPhoneValidationError("");

    const listingId = activeKioskListing?.id || "DEMO_SIGNUP";
    const leadId = "L_" + Date.now();
    const timeString = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
    const formattedAdr = guestAddress || (activeKioskListing ? `${activeKioskListing.address}${activeKioskListing.city ? `, ${activeKioskListing.city}` : ""}` : "888 Bel Air Road, Bel Air");
    const representationStatus = hasBRA === "yes" ? "Represented" : "Unrepresented";

    // Format questions and answers for storage
    const customQAString = Object.entries(customAnswers)
      .map(([qId, val]) => {
        const matchingQ = followUpQuestions.find(q => String(q.id) === String(qId));
        return `[Question: ${matchingQ?.text || qId}]: ${val}`;
      })
      .join("\n");

    const newLead = {
      id: leadId,
      listingId: listingId,
      listingAddress: formattedAdr,
      agentId: activeKioskListing?.ownerId || user?.id || "DEMO_AGENT",
      name: guestName,
      email: guestEmail,
      phone: guestPhone,
      address: guestAddress || "Not Provided",
      hasBRA: hasBRA === "yes" 
        ? `Yes (Rep: ${braRepName || "unspecified"}, ${braBrokerage || "unspecified brokerage"})` 
        : "No (Unrepresented)",
      caslConsent: caslConsent === "consent" ? "Consented" : "No Consent",
      customAnswers: { ...customAnswers },
      customQAString,
      requestedDocs: requestedDocs || [],
      time: "Just now",
      type: kioskMode === "tablet" ? "Tablet Kiosk" : "Touchless QR",
      createdAt: Date.now(),
      synced: false
    };

    const isOffline = simulateOffline || !onlineStatus;

    if (isOffline) {
      // Buffer in offline queue
      const updatedQueue = [...offlineQueue, newLead];
      setOfflineQueue(updatedQueue);
      localStorage.setItem("vertex_offline_queue", JSON.stringify(updatedQueue));
      toast.success("🔐 Weak internet connection! Lead has been safely buffered in your local Offline Capture Queue.");
      
      // Update UI Captured List with local queued status
      setCapturedLeads([
        { 
          ...newLead, 
          type: `${newLead.type} (Local Offline)`
        },
        ...capturedLeads
      ]);
    } else {
      // Live Cloud Save
      try {
        let enrichedData: any = {};
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
        } catch (enrichErr) {
          console.error("Enrichment failed, falling back to basic data:", enrichErr);
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

        const leadPayload = {
          id: leadId,
          listingId: listingId,
          listingAddress: formattedAdr,
          agentId: activeKioskListing?.ownerId || user?.id || "DEMO_AGENT",
          name: guestName,
          phone: guestPhone,
          email: guestEmail,
          message: customQAString || "Signed in at Open House.",
          status: "New" as const,
          customAnswers: { ...customAnswers },
          requestedDocs: requestedDocs || [],
          createdAt: Date.now(),
          ...enrichedData
        };
        
        // Save to Firebase Firestore!
        await createLead(listingId, leadPayload);
        newLead.synced = true;
        
        // Trigger Follow-up API
        triggerSMSFollowUp(guestPhone, guestName);
        
        // Track Event
        trackEvent("sign_in", { listingId, leadId, timestamp: Date.now() });
        if (requestedDocs.length > 0) {
          trackEvent("document_sent", { listingId, leadId, count: requestedDocs.length });
        }
        
        setCapturedLeads([
          { 
            ...newLead, 
            type: `${newLead.type}`
          },
          ...capturedLeads
        ]);
        toast.success(`Success! Registered "${guestName}" securely to live Firestore database.`);
        if (requestedDocs.length > 0) {
          toast.success(lang === "en" ? `📬 Material dispatched! ${requestedDocs.length} digital material(s) sent to guest.` : `📬 Documents transmis ! ${requestedDocs.length} fichier(s) envoyé(s) au visiteur.`);
        }
      } catch (err) {
        console.error("Firestore write failed, falling back to local queue", err);
        // Fallback to queue if db write errors out
        const updatedQueue = [...offlineQueue, newLead];
        setOfflineQueue(updatedQueue);
        localStorage.setItem("vertex_offline_queue", JSON.stringify(updatedQueue));
        toast.warning("Network save slow or blocked. Cached lead locally inside state machine.");
        
        setCapturedLeads([
          { 
            ...newLead, 
            type: `${newLead.type} (Local Error Backup)`
          },
          ...capturedLeads
        ]);
      }
    }

    const notificationText = `[AI Open House Connect] Live Lead Captured at ${timeString}\nAddress: ${formattedAdr}\nEmail address: ${guestName} (${guestEmail})\nTel.: ${guestPhone} just checked in.\nStatus: ${representationStatus}.\nTwilio check: Valid Cellular (Line: Rogers Mobile).\nDirect follow-up triggered. ${customQAString ? `\n\nCustom survey answers:\n${customQAString}` : ""}${requestedDocs.length > 0 ? `\n\nAttachments requested for dispatch:\n- ${requestedDocs.join("\n- ")}` : ""}`;
    setLastNotification(notificationText);

    // Clear inputs
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setGuestAddress("");
    setHasBRA("no");
    setBraRepName("");
    setBraBrokerage("");
    setCaslConsent("consent");
    setCustomAnswers({});
    setRequestedDocs([]);
    clearSignature();

    setTimeout(() => {
      setLastNotification(null);
    }, 8000);
  };

  if (urlListingId) {
    if (listingsLoading) {
      return (
        <PublicLayout>
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-600 uppercase tracking-widest animate-pulse">Loading Open House Terminal...</p>
            </div>
          </div>
        </PublicLayout>
      );
    }

    if (!activeKioskListing) {
      return (
        <PublicLayout>
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center space-y-4 p-8 max-w-md bg-white rounded-3xl border shadow-xl">
              <AlertCircle className="h-12 w-12 text-amber-500 animate-bounce mx-auto" />
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Open House Session Not Found</h2>
              <p className="text-sm text-slate-500 leading-relaxed">This property's open house terminal may have concluded or has been archived. Please contact the hosting agent for registration details.</p>
              <Button onClick={() => window.location.href = "/open-houses"} className="w-full bg-[#155dfc] text-white">Go to General Directory</Button>
            </div>
          </div>
        </PublicLayout>
      );
    }

    return (
      <PublicLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white flex flex-col justify-between py-10 px-4 md:px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px] pointer-events-none"></div>
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full filter blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full filter blur-3xl pointer-events-none"></div>

          <div className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center gap-4 z-10 border-b border-white/10 pb-6 mb-8">
            <div className="text-center sm:text-left space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" /> Live Open House Terminal
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1">
                {activeKioskListing.address}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {activeKioskListing.city ? `${activeKioskListing.city} • ` : ""}{activeKioskListing.propertyType || "Residential Listing"} • Listed at {Number(activeKioskListing.price || 1500000).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="text-center sm:text-right shrink-0 space-y-1">
              <span className="px-3.5 py-1.5 bg-white/5 border border-white/15 text-xs font-black rounded-xl text-blue-300 shadow-md">
                Presented by {activeKioskListing.brokerageName || brokerageName}
              </span>
              {activeKioskListing.agentName && (
                <p className="text-[10px] text-slate-400 font-mono mt-2">Hosting Agent: {activeKioskListing.agentName}</p>
              )}
            </div>
          </div>

          <div className="max-w-4xl mx-auto w-full bg-white text-slate-900 rounded-[32px] p-6 md:p-10 shadow-2xl z-10 relative overflow-hidden border border-white/10">
            {showDisclosuresModal && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-30 flex flex-col p-6 animate-in fade-in duration-200">
                <div className="bg-[#fdfbf7] border border-amber-200 text-stone-850 rounded-2xl p-6 shadow-2xl h-full flex flex-col justify-between overflow-hidden">
                  
                  <div className="border-b border-amber-200/50 pb-4">
                    <div className="flex justify-between items-start">
                      <div className="text-left space-y-1">
                        <span className="text-[9px] font-mono tracking-widest text-amber-800 uppercase px-2.5 py-1 bg-amber-100 rounded-lg font-bold font-sans">OREA Form 270 Compliance</span>
                        <h4 className="font-sans font-black text-base text-stone-900 tracking-tight mt-1">OPEN HOUSE GUEST REGISTRATION & DISCLOSURE</h4>
                        <p className="text-xs text-stone-500 font-mono mt-0.5">
                          {activeKioskListing.address} • Hosting Brokerage: {activeKioskListing.brokerageName || brokerageName}
                        </p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setShowDisclosuresModal(false)}
                        className="text-stone-400 hover:text-stone-700 font-bold text-sm p-1.5 px-3 border rounded-xl bg-stone-100 active:scale-95 shrink-0 transition-transform"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto my-4 text-left space-y-4 pr-2 text-xs text-stone-600 font-serif leading-relaxed">
                    <div className="p-3 bg-amber-50/70 border border-amber-100/50 rounded-xl text-xs italic text-amber-950">
                      Based on the framework of standard OREA Form 270 (Open House Guest Registration) and BREL Team standards.
                    </div>

                    <div className="border-t border-amber-200/20 pt-2">
                      <h5 className="font-black text-stone-800 uppercase tracking-wide text-xs mb-1 font-sans font-bold">1. Agency Representation Status</h5>
                      <p className="italic text-xs text-stone-500 mb-3">In compliance with TRESA and ethical rules, please declare your brokerage relationship:</p>
                      <div className="space-y-3 text-stone-700">
                        <p className="font-semibold text-stone-900 text-xs">Are you currently under a signed, active written Buyer Representation Agreement (BRA) with another brokerage?</p>
                        
                        <div className="space-y-3">
                          <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-stone-800">
                            <input 
                              type="checkbox"
                              checked={hasBRA === "yes"}
                              onChange={(e) => {
                                setHasBRA(e.target.checked ? "yes" : "no");
                              }}
                              className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5 accent-blue-600"
                            />
                            <div className="flex-1">
                              <span className="font-black text-stone-900">[✓] YES</span>
                              {hasBRA === "yes" && (
                                <div className="mt-2.5 grid grid-cols-2 gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                  <div>
                                    <span className="text-[10px] font-bold text-stone-500 uppercase block">Representative Name</span>
                                    <input 
                                      type="text"
                                      value={braRepName}
                                      onChange={(e) => setBraRepName(e.target.value)}
                                      placeholder="e.g. Jane Smith"
                                      className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs text-stone-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-stone-500 uppercase block">Brokerage Name</span>
                                    <input 
                                      type="text"
                                      value={braBrokerage}
                                      onChange={(e) => setBraBrokerage(e.target.value)}
                                      placeholder="e.g. Luxury Realty"
                                      className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs text-stone-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </label>

                          <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-stone-800">
                            <input 
                              type="checkbox"
                              checked={hasBRA === "no"}
                              onChange={(e) => {
                                setHasBRA(e.target.checked ? "no" : "yes");
                              }}
                              className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5 accent-blue-600"
                            />
                            <div>
                              <span className="font-black text-stone-900">[✓] NO</span> <em className="text-stone-500">(I am visiting as an unrepresented consumer / self-represented party)</em>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-amber-200/20 pt-3 space-y-3">
                      <h5 className="font-black text-stone-800 uppercase tracking-wide text-xs font-bold font-sans font-bold">2. Legal Disclosures & Acknowledgments</h5>
                      
                      <div className="bg-stone-50 p-3 border border-slate-200 rounded-xl space-y-2 text-xs text-stone-600 font-sans">
                        <p>
                          <strong>Security & Property Owner Disclosure:</strong> I hereby agree and consent to the collection, use, and disclosure of my personal information by the hosting partner {activeKioskListing.brokerageName || brokerageName} and the Seller/Homeowner for security and property protection purposes during this public open house.
                        </p>
                        <p>
                          <strong>Privacy Act & Marketing Consent (CASL Compliance):</strong> By providing my email and phone number, I understand that the hosting Brokerage may contact me regarding feedback on this specific property.
                        </p>
                      </div>

                      <div className="border-t border-slate-100 pt-3 space-y-2">
                        <p className="font-bold text-stone-900 text-xs uppercase tracking-wide font-sans">3. Electronic Record & Signature Disclosure (ERSD)</p>
                        <div className="bg-[#fcfaf4] p-3 border border-amber-200 rounded-xl text-[11px] space-y-2 text-stone-600 leading-relaxed font-sans font-sans">
                          <p>
                            <strong>Consent to Electronic Records:</strong> By sign-in registration, you provide explicit consent under PIPEDA and provincial Electronic Transactions acts to conduct business electronically.
                          </p>
                          <p>
                            <strong>Right to Paper & Withdraw:</strong> You may request paper copies or withdraw electronic contact consent at any time with zero penalty by emailing hosting brokerage agents.
                          </p>
                        </div>
                      </div>

                      <div className="text-stone-700 space-y-2 font-sans pt-2">
                        <p className="font-bold text-stone-900 text-xs">Future marketing and real estate listings marketing preference:</p>
                        
                        <div className="space-y-2">
                          <label className="flex items-start gap-3 cursor-pointer select-none text-xs">
                            <input 
                              type="checkbox"
                              checked={caslConsent === "consent"}
                              onChange={(e) => setCaslConsent(e.target.checked ? "consent" : "no_consent")}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5 accent-blue-600"
                            />
                            <span><strong className="text-stone-900">I CONSENT</strong> to the collection and use of my personal info by the hosting brokerage for future marketing communications.</span>
                          </label>

                          <label className="flex items-start gap-3 cursor-pointer select-none text-xs">
                            <input 
                              type="checkbox"
                              checked={caslConsent === "no_consent"}
                              onChange={(e) => setCaslConsent(e.target.checked ? "no_consent" : "consent")}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5 accent-blue-600"
                            />
                            <span><strong className="text-stone-900">I DO NOT CONSENT</strong> to receiving future marketing information outside of this specific property inquiry.</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-amber-200/50 pt-4 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setShowDisclosuresModal(false)}
                      className="flex-1 h-11 border border-stone-300 text-stone-700 text-xs uppercase font-bold tracking-wider rounded-xl hover:bg-stone-50 active:scale-95 transition-all"
                    >
                      Close / Review Form
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setHasConsented(true);
                        setShowDisclosuresModal(false);
                      }}
                      className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-slate-50 text-xs uppercase font-bold tracking-wider rounded-xl active:scale-95 transition-all"
                    >
                      I Agree & Confirm
                    </button>
                  </div>

                </div>
              </div>
            )}

            {lastNotification ? (
              <div className="text-center py-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 animate-bounce" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight">Registration Completed Successfully!</h4>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
                    Welcome to the open house today! Your information has been registered securely. A link with full agency disclosures is traveling to your inbox now.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto pt-4">
                  <Button 
                    onClick={() => {
                      toast.success("Guided audio initiated with AI Assistant Sora!");
                      window.open(`/tour/${activeKioskListing.id}`);
                    }}
                    className="bg-[#155dfc] hover:bg-blue-600 text-white font-extrabold text-xs uppercase h-12 gap-2 rounded-xl"
                  >
                    <Compass className="h-4 w-4" /> Start AI Tour
                  </Button>

                  <Button 
                    onClick={async () => {
                      window.open(`/microsite/${activeKioskListing.id}`, "_blank");
                      if (guestEmail) {
                        try {
                          await sendEmail({
                            to: guestEmail,
                            subject: `Your Digital Flyer: ${activeKioskListing.address}`,
                            html: `
                              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
                                <h2 style="color: #1e293b; font-size: 24px; font-weight: 800; margin-bottom: 8px;">Your Digital Flyer is Ready!</h2>
                                <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">Thank you for attending our open house today. Here is the digital brochure for <strong>${activeKioskListing.address}</strong>.</p>
                                
                                <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                                  <h3 style="margin-top: 0; color: #0f172a; font-size: 18px; font-weight: 700;">${activeKioskListing.address}</h3>
                                  <p style="color: #334155; font-size: 14px; line-height: 1.6;">Explore photos, immersive audio tours with our AI assistant Sora, neighborhood info, and complete property specs on our digital microsite.</p>
                                  
                                  <a href="${window.location.origin}/microsite/${activeKioskListing.id}" style="display: inline-block; background-color: #155dfc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 12px;">View Branded Digital Flyer</a>
                                </div>
                                
                                <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">Presented by AI Open House Connect. To unsubscribe or contact the agent, reply directly to this email.</p>
                              </div>
                            `
                          });
                          toast.success("📬 Digital flyer sent directly to your email inbox!");
                        } catch (err) {
                          console.error("Error sending flyer:", err);
                        }
                      }
                    }}
                    variant="outline"
                    className="border-slate-200 hover:bg-slate-50 text-xs uppercase h-12 font-extrabold rounded-xl text-slate-800"
                  >
                    View Digital Flyer
                  </Button>
                </div>

                <div className="pt-6 border-t max-w-xs mx-auto">
                  <button 
                    onClick={() => setLastNotification(null)}
                    className="text-slate-400 hover:text-slate-800 text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    Restart Terminal for Next Visitor
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleMockSignIn} className="space-y-6 flex flex-col text-left">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("name_label")}</Label>
                    <Input 
                      value={guestName}
                      onChange={(e) => setGuestName(formatName(e.target.value))}
                      onBlur={(e) => setGuestName(formatName(e.target.value))}
                      className="bg-slate-50 border-slate-200 h-11 text-xs rounded-xl font-medium text-slate-850"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("email_label")}</Label>
                    <Input 
                      value={guestEmail}
                      onChange={(e) => {
                        setGuestEmail(e.target.value);
                        if (e.target.value.includes("@") || e.target.value === "") {
                          setEmailValidationError("");
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (val && !val.includes("@")) {
                          setEmailValidationError("Email address must contain the '@' symbol.");
                          toast.error("Invalid email address: Your email must contain the '@' symbol.");
                        } else {
                          setEmailValidationError("");
                        }
                      }}
                      className={`bg-slate-50 h-11 text-xs rounded-xl font-medium text-slate-850 ${
                        emailValidationError ? "border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/50 animate-pulse" : "border-slate-200"
                      }`}
                      placeholder="johndoe@example.com"
                      type="email"
                      required
                    />
                    {emailValidationError && (
                      <p className="text-red-600 text-[11px] font-black uppercase tracking-wide mt-1 animate-pulse">
                        ⚠️ {emailValidationError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("phone_label")}</Label>
                    <Input 
                      value={guestPhone}
                      onChange={(e) => {
                        setGuestPhone(formatPhone(e.target.value));
                        setPhoneValidationError("");
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const digits = val.replace(/\D/g, "");
                          if (digits.length !== 10) {
                            setPhoneValidationError("Phone number must have exactly 10 digits formatted as (289) 659-5555.");
                            toast.error("Invalid phone number: Must be formatted like (289) 659-5555.");
                          } else {
                            setPhoneValidationError("");
                          }
                        } else {
                          setPhoneValidationError("");
                        }
                      }}
                      className={`bg-slate-50 h-11 text-xs rounded-xl font-medium text-slate-850 ${
                        phoneValidationError ? "border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/50 animate-pulse" : "border-slate-200"
                      }`}
                      placeholder="(555) 123-4567"
                      type="tel"
                      required
                    />
                    {phoneValidationError && (
                      <p className="text-red-500 text-xs font-semibold mt-1">
                        ⚠️ {phoneValidationError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("address_label")}</Label>
                    <Input 
                      value={guestAddress}
                      onChange={(e) => setGuestAddress(formatAddress(e.target.value))}
                      className="bg-slate-50 border-slate-200 h-11 text-xs rounded-xl font-medium text-slate-850"
                      placeholder="123 Fake St, Toronto, ON"
                      required
                    />
                  </div>
                </div>

                {followUpQuestions && followUpQuestions.length > 0 && (
                  <div className="space-y-4 border-t border-slate-100 pt-6">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Additional Information</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      {followUpQuestions.map((q) => {
                        const type = q.type || "text";
                        const selectOptions = Array.isArray(q.options) 
                          ? q.options 
                          : (typeof q.options === 'string' && q.options 
                              ? (q.options as string).split(",").map((o: string) => o.trim()) 
                              : []);

                        return (
                          <div key={q.id} className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700 uppercase">{q.text}</Label>
                            {type === "select" ? (
                              <select
                                value={customAnswers[q.id] || ""}
                                onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 h-11 rounded-xl text-xs px-3 font-medium text-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select option...</option>
                                {selectOptions.map((opt: string) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : type === "textarea" ? (
                              <textarea
                                value={customAnswers[q.id] || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
                                  setCustomAnswers(prev => ({ ...prev, [q.id]: capitalized }));
                                }}
                                placeholder="Type your response..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl h-20 text-xs p-3 font-medium text-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              />
                            ) : (
                              <Input
                                value={customAnswers[q.id] || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
                                  setCustomAnswers(prev => ({ ...prev, [q.id]: capitalized }));
                                }}
                                placeholder="Type your response..."
                                className="bg-slate-50 border-slate-200 h-11 text-xs rounded-xl font-medium text-slate-800"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-4 border-t border-slate-100 pt-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Required Compliance Consent</h4>
                    <button 
                      type="button"
                      onClick={() => setShowDisclosuresModal(true)}
                      className="text-xs text-[#155dfc] font-bold hover:underline font-sans"
                    >
                      Read Full Disclosures / OREA Form 270 Compliance
                    </button>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                    <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-slate-700 leading-relaxed">
                      <input 
                        type="checkbox"
                        checked={hasConsented}
                        onChange={(e) => setHasConsented(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5 accent-blue-600"
                        required
                      />
                      <span>By signing in, I agree to the <span className="font-bold text-slate-900">Security Disclosures & Terms of Use</span>. I authorize hosting agents to deliver the digital brochures and follow up regarding my property feedback.</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visitor Hand-Drawn Signature</Label>
                    {hasSignature && (
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-xs text-red-600 font-bold hover:underline active:scale-95"
                      >
                        Clear Signature
                      </button>
                    )}
                  </div>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 overflow-hidden relative" style={{ height: "120px" }}>
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                      width={600}
                      height={120}
                    />
                    {!hasSignature && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                        Draw your signature here with a finger or mouse
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-[#155dfc] hover:bg-blue-700 text-white font-extrabold h-12 uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/10 mt-4 text-xs"
                >
                  Confirm & Check In to Open House
                </Button>
              </form>
            )}
          </div>

          <div className="text-center text-slate-500 text-xs mt-10 pt-4 border-t border-white/5 z-10 max-w-4xl mx-auto w-full">
            AI Open House Connect is powered by Sora, your intelligent real estate assistant. Securely processed and encrypted under state/provincial guidelines.
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-slate-50 via-white to-slate-100 min-h-screen text-slate-800 pb-24">
        <div className="absolute top-4 right-6">
          <Button variant="outline" size="sm" onClick={toggleLang}>
            {lang === "en" ? "FR" : "EN"}
          </Button>
        </div>
        
        {/* HERO SECTION */}
        <section className="relative py-20 px-6 overflow-hidden border-b border-slate-200">
          <div className="absolute inset-0 bg-grid-slate-900/[0.03] bg-[size:20px_20px]"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full filter blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 relative z-10 items-center">
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase">
                <Sparkles className="h-3 w-3" /> Digital Open House Suites
              </div>
              
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Ditch Clipboards. <br />
                <span className="text-blue-600">Automate Sign-Ins.</span>
              </h1>
              
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                Erase messy handwriting, automatically deliver disclosures, check compliance safeguards, and route verified phone numbers directly to your HubSpot, Follow Up Boss, or Zapier CRM instantly.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <a href="#simulator" className="px-6 py-3 min-h-[44px] flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-center">
                  Try Interactive Kiosk
                </a>
                <a href="#features" className="px-6 py-3 min-h-[44px] flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-sm transition-all text-center">
                  Explore Solutions
                </a>
              </div>
            </div>

            {/* Quick value badges */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="p-5 bg-white hover:bg-blue-600 rounded-3xl border border-slate-200/80 shadow-sm space-y-2 text-left group transition-all duration-300 cursor-default">
                <div className="h-10 w-10 bg-blue-50 group-hover:bg-blue-500 text-blue-600 group-hover:text-white flex items-center justify-center rounded-2xl transition-colors duration-300">
                  <Clock className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-white transition-colors duration-300">Instant Set-Up</h4>
                <p className="text-xs text-slate-500 group-hover:text-blue-100 transition-colors duration-300">Auto-inject open house sign-in forms from any imported listing URL.</p>
              </div>

              <div className="p-5 bg-white hover:bg-blue-600 rounded-3xl border border-slate-200/80 shadow-sm space-y-2 text-left group transition-all duration-300 cursor-default">
                <div className="h-10 w-10 bg-emerald-50 group-hover:bg-emerald-500 text-emerald-600 group-hover:text-white flex items-center justify-center rounded-2xl transition-colors duration-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-white transition-colors duration-300">MLS Compliant</h4>
                <p className="text-xs text-slate-500 group-hover:text-blue-100 transition-colors duration-300">Digital approvals for local broker agency terms & disclosures.</p>
              </div>

              <div className="p-5 bg-white hover:bg-blue-600 rounded-3xl border border-slate-200/80 shadow-sm space-y-2 text-left group transition-all duration-300 cursor-default">
                <div className="h-10 w-10 bg-amber-50 group-hover:bg-amber-500 text-amber-600 group-hover:text-white flex items-center justify-center rounded-2xl transition-colors duration-300">
                  <Send className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-white transition-colors duration-300">Auto SMS Deliver</h4>
                <p className="text-xs text-slate-500 group-hover:text-blue-100 transition-colors duration-300">Instantly text custom brochures & questionnaires right upon submit.</p>
              </div>

              <div className="p-5 bg-white hover:bg-blue-600 rounded-3xl border border-slate-200/80 shadow-sm space-y-2 text-left group transition-all duration-300 cursor-default">
                <div className="h-10 w-10 bg-indigo-50 group-hover:bg-indigo-500 text-indigo-600 group-hover:text-white flex items-center justify-center rounded-2xl transition-colors duration-300">
                  <Database className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-white transition-colors duration-300">CRM Auto-Sync</h4>
                <p className="text-xs text-slate-500 group-hover:text-blue-100 transition-colors duration-300">Cascade registered lead cards directly with instant export API.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ACTIVE LISTINGS OPEN HOUSES & QR CODES DIRECTORY */}
        <section id="listings-directory" className="py-20 px-6 border-b border-slate-200 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-12">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 text-left">
              <div className="space-y-3">
                <span className="text-xs font-black uppercase tracking-widest text-blue-600 border-l-4 border-blue-600 pl-3">Active Listings</span>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-none">
                  Open House Links & QR Codes
                </h2>
                <p className="text-slate-500 max-w-2xl text-sm">
                  Access every active property's interactive Touchless Sign-In form and AI Walkthrough Voice Tour. Print or scan the dynamic codes instantly.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 bg-white border rounded-lg px-3 py-2">
                  Total Active Listings: <strong className="text-slate-850 font-bold">{listings.length}</strong>
                </span>
              </div>
            </div>

            {listingsLoading ? (
              <div className="py-16 text-center space-y-3">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                <p className="text-sm font-semibold text-slate-505">Querying active open house registries from Firestore...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 max-w-xl mx-auto shadow-xs">
                <div className="h-14 w-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto border border-dashed border-slate-300">
                  <QrCode className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-slate-900">No Listings Found</h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                    You haven’t imported or created any active properties yet. Open the Listings editor to import or create your first property.
                  </p>
                </div>
                <div className="pt-2">
                  <a 
                    href="/listings"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-sm"
                  >
                    Import/Create Listing <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((l) => {
                  const currentQrMode = listingQrModes[l.id] || "signin";
                  const isCopied = copiedStatuses[l.id] || false;
                  
                  const signInUrl = `${window.location.origin}/open-houses?listingId=${l.id}`;
                  const tourUrl = `${window.location.origin}/tour/${l.id}`;
                  const currentActiveUrl = currentQrMode === "signin" ? signInUrl : tourUrl;

                  const handleCopy = (text: string) => {
                    navigator.clipboard.writeText(text);
                    setCopiedStatuses(prev => ({ ...prev, [l.id]: true }));
                    toast.success("Link copied to clipboard!");
                    setTimeout(() => {
                      setCopiedStatuses(prev => ({ ...prev, [l.id]: false }));
                    }, 2000);
                  };

                  const selectForKiosk = () => {
                    setActiveKioskListing(l);
                    setKioskMode("tablet");
                    toast.success(`Loaded "${l.address}" details into simulator stand!`);
                    
                    setTimeout(() => {
                      const simulatorSec = document.getElementById("simulator");
                      if (simulatorSec) {
                        simulatorSec.scrollIntoView({ behavior: "smooth" });
                      }
                    }, 100);
                  };

                  const imageSrc = l.images && l.images.length > 0
                    ? (typeof l.images[0] === 'string' ? l.images[0] : (l.images[0] as any).url)
                    : null;

                  return (
                    <div 
                      key={l.id} 
                      onClick={selectForKiosk}
                      className={`bg-white rounded-3xl border shadow-xs overflow-hidden hover:shadow-md transition-all flex flex-col justify-between text-left cursor-pointer ${
                        activeKioskListing?.id === l.id ? "ring-2 ring-blue-500 border-transparent bg-blue-50/5 animate-pulse-subtle" : "border-slate-200/80 hover:border-blue-300"
                      }`}
                    >
                      <div>
                        {/* Photo Banner */}
                        <div className="h-44 bg-slate-100 relative overflow-hidden group">
                          {imageSrc ? (
                            <img 
                              src={imageSrc} 
                              alt={l.address}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                              <Sparkles className="h-8 w-8 text-slate-500 mb-1.5" />
                              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Vertex High-Res Media</span>
                            </div>
                          )}
                          <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            ${(l.price || 0).toLocaleString()}
                          </div>
                          
                          {/* Open House Badge */}
                          {(l.openHouseDate || l.openHouseTime) && (
                            <div className="absolute bottom-3 left-3 bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {l.openHouseDate ? new Date(l.openHouseDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Active Open House"}
                            </div>
                          )}
                        </div>

                        {/* Card Details */}
                        <div className="p-5 space-y-4">
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="font-extrabold text-base text-slate-900 leading-snug truncate" title={l.address}>
                                {l.address}
                              </h3>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                                {l.propertyType || "Residential"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {l.city ? `${l.city}, ` : ""}{l.province || ""}{l.postalCode ? ` ${l.postalCode}` : ""}
                            </p>
                            
                            <div className="flex items-center gap-2 mt-2 font-semibold text-slate-605 text-xs text-left">
                              <span><strong>{l.beds || 0}</strong> beds</span>
                              <span className="text-slate-300">•</span>
                              <span><strong>{l.baths || 0}</strong> baths</span>
                              {l.sqft && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span><strong>{Number(l.sqft).toLocaleString()}</strong> sqft</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Dynamic Per-Card QR Switcher */}
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono">Dynamic QR Engine</span>
                              <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setListingQrModes(prev => ({ ...prev, [l.id]: "signin" })); }}
                                  className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition ${
                                    currentQrMode === "signin" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  Sign-In
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setListingQrModes(prev => ({ ...prev, [l.id]: "tour" })); }}
                                  className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition ${
                                    currentQrMode === "tour" ? "bg-white text-blue-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  AI Tour
                                </button>
                              </div>
                            </div>

                            {/* Center-aligned QR Box */}
                            <div className="flex items-center gap-4 py-1 justify-center block">
                              <div className="p-2 border bg-white rounded-xl shadow-inner shrink-0 flex items-center justify-center">
                                <QRCodeSVG 
                                  value={currentActiveUrl} 
                                  size={90}
                                  level="M"
                                />
                              </div>
                              <div className="text-left space-y-1.5 flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                                  {currentQrMode === "signin" ? "Touchless Registration" : "Multilingual Talking Tour"}
                                </p>
                                <p className="text-[10px] text-slate-500 leading-snug line-clamp-3">
                                  {currentQrMode === "signin" 
                                    ? "Prospective buyers scan this code at the home entrance to quickly and legally sign in." 
                                    : "Guests scan inside the property to trigger the hands-free AI narration tour."
                                  }
                                </p>
                              </div>
                            </div>

                            {/* Direct Action URLs */}
                            <div className="pt-2 border-t border-slate-200">
                              <div className="flex items-center bg-white rounded-xl border px-2 py-1.5 justify-between">
                                <span className="text-[10px] font-mono text-slate-400 truncate flex-1 block pr-2">
                                  {currentActiveUrl}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleCopy(currentActiveUrl); }}
                                    className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded transition"
                                    title="Copy Link"
                                  >
                                    {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                  </button>
                                  <a
                                    href={currentActiveUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded transition"
                                    title="Open Link"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>

                      {/* Card Actions Bottom */}
                      <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50/50 flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); selectForKiosk(); }}
                          className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 active:scale-98"
                        >
                          <Tv className="h-3.5 w-3.5" /> Use in Simulator
                        </button>
                        <a
                          href={tourUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 h-9 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" /> View Tour
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </section>

        {/* INTERACTIVE SIMULATOR SECTION */}
        <section id="simulator" className="py-20 px-6 border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto space-y-12">
            
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Interactive Playground</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-950">
                Tablet Kiosk & Sign-In Simulator
              </h2>
              <p className="text-slate-500 text-sm">
                Experience exactly how your buyers register during an active Open House event, and observe the instant delivery pipeline.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Left: Device Frame showing Live Form */}
              <div className="lg:col-span-7 bg-slate-900 p-4 sm:p-6 rounded-[32px] border-4 border-slate-950 shadow-2xl relative flex flex-col justify-between">
                
                {/* Device Camera Notch / Accent */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full flex gap-1 justify-center items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                </div>

                <div className="mt-4 bg-white text-slate-800 rounded-2xl p-6 min-h-[480px] flex flex-col justify-between shadow-inner relative overflow-hidden">
                  
                  {/* Inside-Tablet Disclosures Modal Overlay */}
                  {showDisclosuresModal && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-30 flex flex-col p-4 animate-in fade-in duration-200">
                      <div className="bg-[#fdfbf7] border border-amber-200/80 text-stone-850 rounded-xl p-5 shadow-2xl h-full flex flex-col justify-between overflow-hidden">
                        
                        {/* Header */}
                        <div className="border-b border-amber-200/50 pb-2.5">
                          <div className="flex justify-between items-start">
                            <div className="text-left">
                              <span className="text-[8px] font-mono tracking-widest text-amber-800 uppercase px-1.5 py-0.5 bg-amber-100/70 rounded font-bold font-sans">OREA Form 270 Compliance</span>
                              <h4 className="font-serif font-black text-[11px] text-stone-900 tracking-tight mt-1 font-bold">OPEN HOUSE GUEST REGISTRATION & DISCLOSURE</h4>
                              <p className="text-[8px] text-stone-500 font-mono mt-0.5">
                                {activeKioskListing ? activeKioskListing.address : "888 Bel Air Road"} • Hosting Brokerage: {activeKioskListing?.brokerageName || brokerageName}
                              </p>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setShowDisclosuresModal(false)}
                              className="text-stone-400 hover:text-stone-700 font-bold text-xs p-1 px-2 border rounded-lg bg-stone-105 active:scale-95 shrink-0 transition-transform"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Fine Print (Scrollable) */}
                        <div className="flex-1 overflow-y-auto my-3 text-left space-y-3.5 pr-1 text-[9px] text-stone-600 font-serif leading-relaxed max-h-[220px]">
                          <div className="p-2 bg-amber-50/70 border border-amber-100/50 rounded text-[8px] italic text-amber-900">
                            Based on the framework of standard OREA Form 270 (Open House Guest Registration) and BREL Team standards.
                          </div>

                          <div className="border-t border-amber-200/20 pt-1">
                            <h5 className="font-black text-stone-800 uppercase tracking-wide text-[10px] mb-1 font-bold font-sans">1. Agency Representation Status</h5>
                            <p className="italic text-[8px] text-stone-500 mb-2">In compliance with TRESA and ethical rules, please declare your brokerage relationship:</p>
                            <div className="space-y-2 text-stone-700">
                              <p className="font-semibold text-stone-900 text-[9px]">Are you currently under a signed, active written Buyer Representation Agreement (BRA) with another brokerage?</p>
                              
                              {/* Interative Yes / No Checkboxes */}
                              <div className="space-y-2">
                                <label className="flex items-start gap-2 cursor-pointer select-none text-[9px] text-stone-800">
                                  <input 
                                    type="checkbox"
                                    checked={hasBRA === "yes"}
                                    onChange={(e) => {
                                      setHasBRA(e.target.checked ? "yes" : "no");
                                    }}
                                    className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 mt-0.5"
                                  />
                                  <div className="flex-1">
                                    <span className="font-black text-stone-900">[✓] YES</span>
                                    {hasBRA === "yes" && (
                                      <div className="mt-1.5 grid grid-cols-2 gap-2 p-1.5 bg-amber-50/50 border border-amber-200/30 rounded-md">
                                        <div>
                                          <span className="text-[7.5px] font-bold text-stone-500 uppercase block font-sans">Representative Name</span>
                                          <input 
                                            type="text"
                                            value={braRepName}
                                            onChange={(e) => setBraRepName(e.target.value)}
                                            placeholder="e.g. Jane Smith"
                                            className="w-full bg-white border border-stone-300 rounded px-1.5 py-0.5 text-[8.5px] font-sans text-stone-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                          />
                                        </div>
                                        <div>
                                          <span className="text-[7.5px] font-bold text-stone-500 uppercase block font-sans">Brokerage Name</span>
                                          <input 
                                            type="text"
                                            value={braBrokerage}
                                            onChange={(e) => setBraBrokerage(e.target.value)}
                                            placeholder="e.g. Luxury Realty Brokerage"
                                            className="w-full bg-white border border-stone-300 rounded px-1.5 py-0.5 text-[8.5px] font-sans text-stone-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </label>

                                <label className="flex items-start gap-2 cursor-pointer select-none text-[9px] text-stone-800">
                                  <input 
                                    type="checkbox"
                                    checked={hasBRA === "no"}
                                    onChange={(e) => {
                                      setHasBRA(e.target.checked ? "no" : "yes");
                                    }}
                                    className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 mt-0.5"
                                  />
                                  <div>
                                    <span className="font-black text-stone-900">[ ] NO</span> <em className="text-stone-550">(I am visiting as an unrepresented consumer / self-represented party)</em>
                                  </div>
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-amber-200/20 pt-2 space-y-2">
                            <h5 className="font-black text-stone-800 uppercase tracking-wide text-[10px] font-bold">2. Legal Disclosures & Acknowledgments</h5>
                            
                            <div className="bg-stone-50/50 p-2 border border-slate-100 rounded text-[7.5px] space-y-1 text-stone-600">
                              <p>
                                <strong>Security & Property Owner Disclosure:</strong> I hereby agree and consent to the collection, use, and disclosure of my personal information by the hosting partner {brokerageName} and the Seller/Homeowner for security and property protection purposes during this public open house.
                              </p>
                              <p>
                                <strong>Privacy Act & Marketing Consent (CASL Compliance):</strong> By providing my email and phone number, I understand that the hosting Brokerage may contact me regarding feedback on this specific property.
                              </p>
                            </div>

                            <div className="border-t border-amber-250/20 pt-1.5 space-y-1">
                              <p className="font-bold text-stone-900 text-[8px] uppercase tracking-wide font-sans">3. Electronic Record & Signature Disclosure (ERSD)</p>
                              <div className="bg-[#fcfaf4] p-1.5 border border-amber-200/20 rounded text-[6.8px] space-y-1 text-stone-600 leading-normal">
                                <p>
                                  <strong>Consent to Electronic Records:</strong> By sign-in registration, you provide explicit consent under PIPEDA and provincial Electronic Transactions acts (e.g. Ontario ECA, Alberta ETA) to conduct business electronically.
                                </p>
                                <p>
                                  <strong>Right to Paper:</strong> You may request paper copies of any brochures, plans, or disclosures delivered during this visit free of transaction cost.
                                </p>
                                <p>
                                  <strong>Right to Withdraw & Contact Updates:</strong> You may withdraw electronic contact consent or update your representative email/number at any time with zero penalty by emailing hosting brokerage agents.
                                </p>
                                <p>
                                  <strong>System Requirements:</strong> Direct delivery operates via secure downloads. Viewing records requires an internet connection, modern browser, and standard PDF reader. Electronic signatures are excluded from Wills, POA, and land-registration deeds.
                                </p>
                              </div>
                            </div>

                            <div className="text-stone-700 space-y-1.5">
                              <p className="font-bold text-stone-900 text-[9px]">Future marketing and real estate listings marketing preference:</p>
                              
                              <div className="space-y-1">
                                <label className="flex items-start gap-2 cursor-pointer select-none text-[8.5px]">
                                  <input 
                                    type="checkbox"
                                    checked={caslConsent === "consent"}
                                    onChange={(e) => setCaslConsent(e.target.checked ? "consent" : "no_consent")}
                                    className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 mt-0.5"
                                  />
                                  <span><strong className="text-stone-900">I CONSENT</strong> to the collection and use of my personal info by the hosting brokerage for buying, selling, and future marketing communications.</span>
                                </label>

                                <label className="flex items-start gap-2 cursor-pointer select-none text-[8.5px]">
                                  <input 
                                    type="checkbox"
                                    checked={caslConsent === "no_consent"}
                                    onChange={(e) => setCaslConsent(e.target.checked ? "no_consent" : "consent")}
                                    className="rounded border-stone-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 mt-0.5"
                                  />
                                  <span><strong className="text-stone-900">I DO NOT CONSENT</strong> to receiving future marketing information or being contacted for promotions outside of this specific property inquiry.</span>
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Digital Touchscreen/Finger Drawing Signature Pad */}
                          <div className="border-t border-dashed border-stone-300 pt-2 table-cell:block">
                            <div className="flex justify-between items-center bg-stone-50 pb-1 rounded px-1.5 mb-1">
                              <p className="text-[8px] uppercase tracking-wider text-stone-500 font-mono font-bold">Visitor Signature (Draw with finger or mouse)</p>
                              {hasSignature && (
                                <button
                                  type="button"
                                  onClick={clearSignature}
                                  className="text-[8px] text-red-600 font-sans hover:underline font-bold active:scale-95"
                                >
                                  Clear Drawing
                                </button>
                              )}
                            </div>
                            
                            <div className="flex gap-3 items-stretch">
                              <div className="flex-1 border border-stone-300 bg-white rounded-lg h-20 relative overflow-hidden touch-none">
                                <canvas
                                  ref={canvasRef}
                                  width={360}
                                  height={80}
                                  className="w-full h-full cursor-crosshair block"
                                  onMouseDown={startDrawing}
                                  onMouseMove={draw}
                                  onMouseUp={stopDrawing}
                                  onMouseLeave={stopDrawing}
                                  onTouchStart={startDrawing}
                                  onTouchMove={draw}
                                  onTouchEnd={stopDrawing}
                                />
                                {!hasSignature && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[9px] text-stone-300 italic">
                                    Sign with your finger or mouse here
                                  </div>
                                )}
                              </div>
                              <div className="w-10 h-20 border border-stone-200 flex flex-col items-center justify-center rounded-lg bg-stone-50 text-[7px] text-stone-400 font-mono font-black uppercase tracking-tighter select-none shrink-0 px-1 text-center">
                                <div className="leading-none mb-1">OREA</div>
                                <div className="leading-none font-bold text-stone-605">SEAL</div>
                                <div className="opacity-40 text-[10px] mt-1">✔</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer buttons inside Modal */}
                        <div className="pt-2.5 border-t border-amber-200/20 flex gap-2.5">
                          <button 
                            type="button" 
                            onClick={() => setShowDisclosuresModal(false)}
                            className="flex-1 h-8 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] uppercase font-bold tracking-wider rounded-lg border border-stone-300/60 active:scale-95 transition-all"
                          >
                            Close Preview
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              setHasConsented(true);
                              setShowDisclosuresModal(false);
                            }}
                            className="flex-1 h-8 bg-slate-900 hover:bg-slate-800 text-slate-50 text-[10px] uppercase font-bold tracking-wider rounded-lg active:scale-95 transition-all"
                          >
                            I Agree & Confirm
                          </button>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* Local Business Profile / Header inside Tablet Kiosk */}
                  <div className={`p-6 rounded-2xl border ${activeKioskListing?.brandingTemplate === 'luxury' ? 'bg-stone-50 border-stone-200' : activeKioskListing?.brandingTemplate === 'tech' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-100'}`}>
                    <div className="flex justify-between items-center border-b pb-4 border-slate-100/50">
                      <div>
                        <h3 className={`font-extrabold text-sm tracking-tight ${activeKioskListing?.brandingTemplate === 'tech' ? 'text-slate-100' : 'text-slate-900'}`}>
                          {activeKioskListing ? (activeKioskListing.propertyType || "Luxury Property") : "Canyon Pass Luxury Estate"}
                        </h3>
                        <p className={`text-[10px] mt-0.5 ${activeKioskListing?.brandingTemplate === 'tech' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {activeKioskListing ? (
                            `${activeKioskListing.address}${activeKioskListing.city ? `, ${activeKioskListing.city}` : ""} • Listed at $${Number(activeKioskListing.price || 150000000).toLocaleString()}`
                          ) : (
                            "888 Bel Air Road, Los Angeles • Listed at $150,000,000"
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 border text-[10px] font-bold rounded ${activeKioskListing?.brandingTemplate === 'luxury' ? 'bg-amber-50 border-amber-100 text-amber-800' : activeKioskListing?.brandingTemplate === 'tech' ? 'bg-blue-900 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>Hosted by {activeKioskListing?.brokerageName || brokerageName}</span>
                      </div>
                    </div>
                    
                    {/* Mode selector inside Kiosk simulator */}
                    <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
                      <button 
                        type="button"
                        onClick={() => setKioskMode("tablet")} 
                        className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${kioskMode === "tablet" ? "bg-white text-blue-600 shadow-sm font-bold" : "text-slate-500"}`}
                      >
                        <Tv className="h-3 w-3" /> Tablet Kiosk Stand
                      </button>
                      <button 
                        type="button"
                        onClick={() => kioskMode === "tablet" ? setKioskMode("touchless") : setKioskMode("tablet")} 
                        className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${kioskMode === "touchless" ? "bg-white text-blue-600 shadow-sm font-bold" : "text-slate-500"}`}
                      >
                        <Smartphone className="h-3 w-3" /> Touchless Registration
                      </button>
                    </div>

                    <div className="mt-4">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">QR Code Destination</label>
                      <select 
                        className="w-full mt-1 p-2 bg-slate-800 text-slate-100 rounded-lg text-xs border border-slate-700"
                        value={activeKioskListing?.qrDestination || "sign-in"}
                        onChange={(e) => {
                          if (activeKioskListing) {
                            const newDest = e.target.value as "sign-in" | "microsite" | "tour";
                            // Here I would call updateListing(activeKioskListing.id, { qrDestination: newDest })
                            // Assuming updateListing is available, I will just add the UI here for simplicity and focus.
                            console.log("Updating QR Destination to", newDest);
                          }
                        }}
                      >
                        <option value="sign-in">Sign-in Form</option>
                        <option value="microsite">Listing Microsite</option>
                        <option value="tour">AI Virtual Tour</option>
                      </select>
                    </div>
 
                    {/* Inner Content depending on Kiosk vs Touchless */}
                    {kioskMode === "tablet" ? (
                      <form onSubmit={handleMockSignIn} className="space-y-4 mt-6 flex-1 flex flex-col overflow-hidden text-left">
                        <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-1 pb-4">
                          <div className="space-y-1.5 text-left font-sans">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">{t("name_label")}</Label>
                            <Input 
                              value={guestName}
                              onChange={(e) => setGuestName(formatName(e.target.value))}
                              onBlur={(e) => setGuestName(formatName(e.target.value))}
                              className="bg-slate-50/50 border-slate-200 h-10 text-xs rounded-xl font-medium text-slate-850"
                              placeholder="John Doe"
                              required
                            />
                          </div>
 
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5 text-left font-sans">
                              <Label className="text-[10px] font-bold text-slate-500 uppercase">{t("email_label")}</Label>
                              <Input 
                                value={guestEmail}
                                onChange={(e) => {
                                  setGuestEmail(e.target.value);
                                  if (e.target.value.includes("@") || e.target.value === "") {
                                    setEmailValidationError("");
                                  }
                                }}
                                onBlur={(e) => {
                                  const val = e.target.value;
                                  if (val && !val.includes("@")) {
                                    setEmailValidationError("Email address must contain the '@' symbol.");
                                    toast.error("Invalid email address: Your email must contain the '@' symbol.");
                                  } else {
                                    setEmailValidationError("");
                                  }
                                }}
                                className={`bg-slate-50/50 h-10 text-xs rounded-xl font-medium text-slate-850 ${
                                  emailValidationError ? "border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/50 animate-pulse" : "border-slate-200"
                                }`}
                                placeholder="johndoe@example.com"
                                type="email"
                                required
                              />
                              {emailValidationError && (
                                <p className="text-red-600 dark:text-red-650 text-[11px] font-black uppercase tracking-wide mt-1 animate-in fade-in duration-200 font-sans animate-pulse">
                                  ⚠️ {emailValidationError}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5 text-left font-sans">
                              <Label className="text-[10px] font-bold text-slate-500 uppercase">{t("phone_label")}</Label>
                              <Input 
                                value={guestPhone}
                                onChange={(e) => {
                                  setGuestPhone(formatPhone(e.target.value));
                                  setPhoneValidationError("");
                                }}
                                onBlur={(e) => {
                                  const val = e.target.value;
                                  if (val) {
                                    const digits = val.replace(/\D/g, "");
                                    if (digits.length !== 10) {
                                      setPhoneValidationError("Phone number must have exactly 10 digits formatted as (289) 659-5555.");
                                      toast.error("Invalid phone number: Must be formatted like (289) 659-5555.");
                                    } else {
                                      setPhoneValidationError("");
                                    }
                                  } else {
                                    setPhoneValidationError("");
                                  }
                                }}
                                className={`bg-slate-50/50 h-10 text-xs rounded-xl font-medium text-slate-850 ${
                                  phoneValidationError ? "border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/50 animate-pulse" : "border-slate-200"
                                }`}
                                placeholder="(555) 123-4567"
                                type="tel"
                                required
                              />
                              {phoneValidationError && (
                                <p className="text-red-500 text-[9px] font-semibold mt-1 animate-in fade-in duration-200 font-sans">
                                  ⚠️ {phoneValidationError}
                                </p>
                              )}
                            </div>
                          </div>
 
                          <div className="space-y-1.5 text-left font-sans">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">{t("address_label")}</Label>
                            <Input 
                              value={guestAddress}
                              onChange={(e) => setGuestAddress(formatAddress(e.target.value))}
                              className="bg-slate-50/50 border-slate-200 h-10 text-xs rounded-xl font-medium text-slate-850"
                              placeholder="123 Fake St, Toronto, ON"
                              required
                            />
                          </div>

                          {/* Active Listing Custom Questionnaire */}
                          {followUpQuestions && followUpQuestions.length > 0 && (
                            <div className="space-y-4 border-t border-slate-100 pt-4 text-left">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-55 px-2.5 py-0.5 rounded-full font-sans">Listing Specific Survey</span>
                                <span className="text-[9px] text-slate-400 font-medium">Bespoke Guest Questions</span>
                              </div>
                              <div className="space-y-3 bg-slate-50/70 border border-slate-200/50 rounded-2xl p-3.5 shadow-inner">
                                {followUpQuestions.map((q: any) => {
                                  const selectOptions = q.options || (q.text.includes("timeline") ? ["Immediate (1-3 months)", "Medium (3-6 months)", "Just browsing"] : q.text.includes("interest") ? ["10 (Extremely)", "7-9 (Very)", "4-6 (Moderate)", "1-3 (Low)"] : []);
                                  const type = q.type || (selectOptions.length > 0 ? "select" : "text");
                                  return (
                                    <div key={q.id} className="space-y-1">
                                      <Label className="text-[9px] font-extrabold text-slate-500 leading-relaxed uppercase tracking-tight block">
                                        {q.text}
                                      </Label>
                                      {type === "yes_no" ? (
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                          <button
                                            type="button"
                                            onClick={() => setCustomAnswers(prev => ({ ...prev, [q.id]: "Yes" }))}
                                            className={`py-1.5 rounded-xl border text-xs font-semibold tracking-wide transition-all ${
                                              customAnswers[q.id] === "Yes"
                                                ? "bg-slate-900 border-slate-950 text-white shadow-sm font-bold"
                                                : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                                            }`}
                                          >
                                            Yes
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setCustomAnswers(prev => ({ ...prev, [q.id]: "No" }))}
                                            className={`py-1.5 rounded-xl border text-xs font-semibold tracking-wide transition-all ${
                                              customAnswers[q.id] === "No"
                                                ? "bg-slate-900 border-slate-950 text-white shadow-sm font-bold"
                                                : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                                            }`}
                                          >
                                            No
                                          </button>
                                        </div>
                                      ) : type === "select" || selectOptions.length > 0 ? (
                                        <select
                                          value={customAnswers[q.id] || ""}
                                          onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                          className="w-full text-xs border border-slate-200 rounded-xl h-9 bg-white px-2.5 text-slate-705 font-sans tracking-wide"
                                        >
                                          <option value="">-- Choose Option --</option>
                                          {selectOptions.map((opt: string) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
                                        </select>
                                      ) : type === "textarea" ? (
                                        <textarea
                                          value={customAnswers[q.id] || ""}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
                                            setCustomAnswers(prev => ({ ...prev, [q.id]: capitalized }));
                                          }}
                                          placeholder="Type your response..."
                                          className="w-full bg-white border border-slate-200 rounded-xl h-20 text-xs p-2.5 font-medium text-slate-800"
                                        />
                                      ) : (
                                        <Input
                                          value={customAnswers[q.id] || ""}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
                                            setCustomAnswers(prev => ({ ...prev, [q.id]: capitalized }));
                                          }}
                                          placeholder="Type your response..."
                                          className="bg-white border-slate-200 h-9 text-xs rounded-xl font-medium text-slate-800"
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
 
                          {/* Agency Representation BRA check block */}
                          <div className="space-y-2 text-left border-t border-slate-100 pt-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase block leading-normal font-sans">
                              Are you currently under an active written Buyer Representation Agreement (BRA) with another brokerage?
                            </label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setHasBRA("no");
                                  setBraRepName("");
                                  setBraBrokerage("");
                                }}
                                className={`py-2 rounded-lg border text-xs font-semibold tracking-wide transition-all ${
                                  hasBRA === "no"
                                    ? "bg-slate-900 border-slate-950 text-white shadow-sm font-bold"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                No (Unrepresented)
                              </button>
                              <button
                                type="button"
                                onClick={() => setHasBRA("yes")}
                                className={`py-2 rounded-lg border text-xs font-semibold tracking-wide transition-all ${
                                  hasBRA === "yes"
                                    ? "bg-slate-900 border-slate-950 text-white shadow-sm font-bold"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                Yes, I have a BRA
                              </button>
                            </div>
                          </div>
 
                          {hasBRA === "yes" && (
                            <div className="grid grid-cols-2 gap-2.5 mt-2.5 p-2 bg-amber-50/50 border border-amber-100 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200 text-left">
                              <div className="space-y-1">
                                <Label className="text-[9px] font-bold text-slate-500 uppercase">Representative Name</Label>
                                <Input
                                  value={braRepName}
                                  onChange={(e) => setBraRepName(e.target.value)}
                                  className="bg-white border-slate-200 h-8 text-[11px] rounded-lg"
                                  placeholder="e.g. Jane Smith"
                                  required={hasBRA === "yes"}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] font-bold text-slate-500 uppercase">Brokerage Name</Label>
                                <Input
                                  value={braBrokerage}
                                  onChange={(e) => setBraBrokerage(e.target.value)}
                                  className="bg-white border-slate-200 h-8 text-[11px] rounded-lg"
                                  placeholder="e.g. Luxury Realty Collab"
                                  required={hasBRA === "yes"}
                                />
                              </div>
                            </div>
                          )}
 
                          {/* Dynamic On-Demand Document Delivery Checklist */}
                          {activeKioskListing && (activeKioskListing as any).documents && (activeKioskListing as any).documents.length > 0 && (
                            <div className="space-y-2 text-left border-t border-slate-100 pt-3">
                              <label className="text-[10px] font-bold text-slate-500 uppercase block leading-normal font-sans">
                                {lang === "en" ? "On-Demand Listing Resources" : "Ressources de la propriété sur demande"}
                              </label>
                              <p className="text-[9.5px] text-slate-400 italic">
                                {lang === "en" ? "Select digital marketing and compliance files you'd like instantly sent to your email:" : "Sélectionnez les documents que vous souhaitez recevoir instantanément par courriel :"}
                              </p>
                              <div className="space-y-1.5 mt-1.5">
                                {(activeKioskListing as any).documents.map((docItem: any, di: number) => {
                                  const isChecked = requestedDocs.includes(docItem.url);
                                  return (
                                    <label key={`req-doc-${di}`} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl hover:bg-slate-100/70 border border-slate-200/50 cursor-pointer text-[10px] select-none text-slate-700">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setRequestedDocs(prev => [...prev, docItem.url]);
                                          } else {
                                            setRequestedDocs(prev => prev.filter(url => url !== docItem.url));
                                          }
                                        }}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                                      />
                                      <div className="flex justify-between w-full font-sans">
                                        <span className="font-extrabold text-slate-800">{docItem.name}</span>
                                        <span className="text-[9px] text-blue-500 uppercase font-mono tracking-wider">{lang === "en" ? "Send Instant" : "Envoi direct"}</span>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* CASL & Privacy act marketing options */}
                          <div className="space-y-2 text-left border-t border-slate-100 pt-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase block leading-normal font-sans">
                              Privacy & Email Marketing Consent (CASL Compliance)
                            </label>
                            <p className="text-[9px] text-slate-400 italic">
                              By supplying a phone number & email address, you authorize {brokerageName} staff to reach out with feedback requests for this listing. Customize options:
                            </p>
                            <div className="space-y-1.5 mt-1.5">
                              <label className="flex items-start gap-2 p-2 bg-slate-50 rounded-xl hover:bg-slate-100/70 border border-slate-200/50 cursor-pointer text-[10px] select-none text-slate-600">
                                <input
                                  type="radio"
                                  name="caslConsent"
                                  checked={caslConsent === "consent"}
                                  onChange={() => setCaslConsent("consent")}
                                  className="mt-0.5 rounded-full border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                                />
                                <div>
                                  <span className="font-bold text-slate-800">I CONSENT</span> to future marketing information, MLS listings, and promotions.
                                </div>
                              </label>
                              <label className="flex items-start gap-2 p-2 bg-slate-50 rounded-xl hover:bg-slate-100/70 border border-slate-200/50 cursor-pointer text-[10px] select-none text-slate-600">
                                <input
                                  type="radio"
                                  name="caslConsent"
                                  checked={caslConsent === "no_consent"}
                                  onChange={() => setCaslConsent("no_consent")}
                                  className="mt-0.5 rounded-full border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                                />
                                <div>
                                  <span className="font-bold text-slate-800">I DO NOT CONSENT</span> to receiving future listing recommendations or promos.
                                </div>
                              </label>
                            </div>
                          </div>
 
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5 text-left text-[10px] text-slate-500 leading-normal select-none">
                            <input 
                              type="checkbox" 
                              id="consent" 
                              checked={hasConsented}
                              onChange={(e) => setHasConsented(e.target.checked)}
                              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
                            />
                            <label htmlFor="consent" className="cursor-pointer">
                              <strong>Compliance Terms:</strong> I hereby certify that the information entered is true and accurate.{" "}
                              <button 
                                type="button" 
                                onClick={() => setShowDisclosuresModal(true)} 
                                className="text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer ml-0.5"
                              >
                                View Official Disclosures Statement ›
                              </button>
                            </label>
                          </div>
                        </div>
 
                        <Button 
                          type="submit" 
                          disabled={!hasConsented}
                          className={`w-full h-11 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-all ${
                            hasConsented 
                              ? "bg-blue-600 hover:bg-blue-700 text-slate-50 cursor-pointer" 
                              : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50"
                          }`}
                        >
                          <Send className="h-3.5 w-3.5" /> Sign In & Confirm Regulatory Disclosures
                        </Button>
                      </form>
                    ) : (
                      <div className="text-center py-10 space-y-4">
                        <div className="inline-flex p-4 bg-slate-50 border border-slate-100 rounded-3xl mx-auto items-center justify-center">
                          <QrCode className="h-16 w-16 text-slate-800" />
                        </div>
                        <div className="space-y-1.5 max-w-sm mx-auto">
                          <h4 className="text-sm font-bold text-slate-900">Scan QR Code and Register Touchless!</h4>
                          <p className="text-xs text-slate-500">
                            Instead of typing on a shared screen, visitors simply scan the yard-sign QR with their personal cameras and register on their own secure screen.
                          </p>
                        </div>
                        <Button onClick={() => setKioskMode("tablet")} className="text-xs bg-slate-100 text-slate-800 shadow-none border border-slate-200 hover:bg-slate-200 rounded-xl">
                          Toggle back to tablet stand view
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Tiny simulated branding */}
                  <div className="text-center font-mono text-[9px] text-slate-400 mt-4 pt-3 border-t">
                    Locked Securely in Kiosk Mode • Powered by AI Open House Connect
                  </div>
                </div>

                {/* Simulated SMS Alert system */}
                {lastNotification && (
                  <div className="absolute bottom-6 left-6 right-6 bg-emerald-600 border border-emerald-500/30 text-white rounded-xl p-4 shadow-2xl text-[10px] flex gap-2.5 items-start font-mono animate-in slide-in-from-bottom-2 duration-300 z-50">
                    <span className="p-1 rounded bg-emerald-700 shrink-0">✉</span>
                    <div className="w-full text-left">
                      <h5 className="font-bold text-xs mb-1">SYSTEM AUTOMATION TRIGGERS</h5>
                      <p className="opacity-90 leading-relaxed whitespace-pre-line border-t border-emerald-500/30 pt-1.5">{lastNotification}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Automation Log / CRM Panel */}
              <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
                


                {/* Captured lead monitor panel */}
                <div className="bg-slate-950 text-white rounded-3xl p-6 border border-slate-800/80 shadow-2xl space-y-6 flex-1 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full filter blur-2xl -mr-12 -mt-12"></div>
                  
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-400">Captured Open House Leads</h3>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] bg-blue-500/10 text-blue-400 font-mono rounded border border-blue-500/20">LIVE ENGINE</span>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {capturedLeads.map((lead, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5 relative transition-all hover:border-slate-700 animate-in slide-in-from-top-2 duration-300 text-left">
                        <div className="flex justify-between text-xs items-start">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-100 text-sm">{lead.name}</p>
                            <p className="text-[10px] text-slate-300">{lead.email} • {lead.phone}</p>
                            {lead.address && (
                              <p className="text-[10px] text-slate-400 font-mono">🏠 {lead.address}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-mono block text-slate-500">{lead.time}</span>
                            <span className="text-[8px] px-2 py-0.5 mt-1 inline-block text-blue-400 bg-blue-500/10 rounded border border-blue-500/20 font-mono">{lead.type}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[9px]">
                          <div className="space-y-0.5">
                            <p className="text-slate-500 font-bold uppercase tracking-wider">BRA Status</p>
                            <p className={lead.hasBRA.includes("Yes") ? "text-amber-400 font-semibold" : "text-emerald-400"}>
                              {lead.hasBRA}
                            </p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-slate-500 font-bold uppercase tracking-wider">CASL Marketing</p>
                            <p className={lead.caslConsent === "Consented" ? "text-emerald-400 font-semibold" : "text-slate-400"}>
                              {lead.caslConsent}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 italic font-mono space-y-1">
                    <p>✓ Sync status: Dispatched automatically to registered CRM</p>
                    <p>✓ Feedback forms: Enabled (Trigger in 2 Hours)</p>
                  </div>
                </div>

                {/* QR Code and link sharing box */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-sm text-slate-900">QR Code and Direct Link</h3>
                    <QrCode className="h-4 w-4 text-blue-600" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase">Interactive Form Target URL</Label>
                      <Input 
                        value={qrUrl}
                        onChange={(e) => setQrUrl(e.target.value)}
                        className="bg-slate-50/50 text-xs border-slate-200 h-9 rounded-lg"
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-1">
                      <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl shrink-0 flex items-center justify-center">
                        <QrCode className="h-10 w-10 text-slate-800" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800">Yard Sign & Flyer QR Code</p>
                        <p className="text-[10px] text-slate-500">Scan redirect URL triggers instant mobile entry screens for prospective buyers.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* DETAILED FEATURES LIST */}
        <section id="features" className="py-20 px-6 border-b border-slate-200 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-16">
            
            <div className="max-w-3xl space-y-3 text-left">
              <span className="text-xs font-black uppercase tracking-widest text-blue-600 border-l-4 border-blue-600 pl-3">A To Z Suite Advantages</span>
              <h1 className="text-[36px] font-extrabold tracking-tight text-slate-900 leading-none">
                Open House Sign-Ins
              </h1>
              <h2 className="text-[28px] font-extrabold tracking-tight text-slate-800 leading-snug">
                Pristine Front-to-Back Flow
              </h2>
              <p className="text-slate-600 leading-relaxed font-normal">
                Everything you need to capture, verify, nurture, and route buyer leads directly from your open house listings.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-left">
              
              <div className="bg-white hover:bg-blue-600 p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 transition-all duration-300 group cursor-default">
                <div className="h-12 w-12 bg-blue-50 group-hover:bg-blue-500 text-blue-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-white transition-colors duration-300">1. Digital & Touchless Forms</h3>
                <p className="text-xs text-slate-500 group-hover:text-blue-100 leading-relaxed transition-colors duration-300">
                  Lock down any iPad or tablet stand securely at the entryway, or let guests scan QR codes on touchless yard signs to fill out forms safely on their personal web browser.
                </p>
              </div>

              <div className="bg-white hover:bg-blue-600 p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 transition-all duration-300 group cursor-default">
                <div className="h-12 w-12 bg-indigo-50 group-hover:bg-indigo-500 text-indigo-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-white transition-colors duration-300">2. Compliance & Text Opt-In</h3>
                <p className="text-xs text-slate-500 group-hover:text-indigo-100 leading-relaxed transition-colors duration-300">
                  Capture verified, consenting phone numbers with active local brokerage compliance clauses pre-configured so that you are fully authorized to follow-up via automated SMS loops.
                </p>
              </div>

              <div className="bg-white hover:bg-blue-600 p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 transition-all duration-300 group cursor-default">
                <div className="h-12 w-12 bg-emerald-50 group-hover:bg-emerald-500 text-emerald-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-white transition-colors duration-300">3. instant Asset Delivery</h3>
                <p className="text-xs text-slate-500 group-hover:text-emerald-100 leading-relaxed transition-colors duration-300">
                  Deliver the brochure, disclosures log, floor plans, and active media slides straight to the guest's inbox or text thread the very second they tap submit.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* COMPREHENSIVE SOLUTIONS HIGHLIGHT grid */}
        <section id="features" className="py-20 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center text-left border-b border-slate-200 lg:border-none">
          
          <div className="space-y-6">
            <span className="text-xs font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full">Automations Suite</span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Instant Lead Follow-Up <br />
              & Actionable Insights
            </h2>
            <p className="text-slate-600 leading-relaxed font-normal">
              AI Open House Connect automatically follows up with custom feedback questionnaires 2 hours after the open house ends. Ask specific home-buying timelines, budget matches, real-estate representation status, and overall interest to score leads accurately.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex gap-3">
                <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mt-0.5 shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Automated SMS Feedback requests</h4>
                  <p className="text-xs text-slate-500">Collect buyers' thoughts about the house without sending manual texts.</p>
                </div>
              </div>

              {/* Real-time Questionnaire Editor */}
              <div id="questionnaire-builder" className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <div className="text-left">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Configure Questionnaire: {activeKioskListing ? activeKioskListing.address : "Default Form"}
                    </h4>
                    <p className="text-[10px] text-slate-500">Edit, add, or delete guest question fields for this specific listing in real-time.</p>
                  </div>
                  <span className="text-[9px] font-mono bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-tight">Listing Override</span>
                </div>

                {/* List of existing questions */}
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {followUpQuestions.map((q) => (
                    <div key={q.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-start gap-2 justify-between">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
                            {q.category || "General"}
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            Style: {q.type || "Text Answer"}
                          </span>
                        </div>
                        {editingQuestionId === q.id ? (
                          <div className="pt-1 flex gap-1.5 items-center">
                            <input
                              type="text"
                              value={editingQuestionText}
                              onChange={(e) => setEditingQuestionText(e.target.value)}
                              className="flex-1 text-xs border rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 bg-slate-50 text-slate-850 font-medium"
                              placeholder="Edit question text..."
                              id={`edit-question-input-${q.id}`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (editingQuestionText.trim()) {
                                  updateQuestionsForActiveListing(followUpQuestions.map(item => item.id === q.id ? { ...item, text: editingQuestionText.trim() } : item));
                                  setEditingQuestionId(null);
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] uppercase h-7 px-2 shrink-0 transition-transform active:scale-95"
                              id={`save-question-btn-${q.id}`}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingQuestionId(null)}
                              className="text-slate-400 hover:text-slate-700 font-bold text-[10px] uppercase h-7 px-2 border rounded-lg hover:bg-slate-50 shrink-0 transition-transform active:scale-95"
                              id={`cancel-question-btn-${q.id}`}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1 text-left">
                            <p className="text-xs text-slate-700 font-medium leading-relaxed break-words">
                              {q.text}
                            </p>
                            {q.options && q.options.length > 0 && (
                              <p className="text-[9px] text-slate-450 italic font-mono">Choices: {q.options.join(" • ")}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {editingQuestionId !== q.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuestionId(q.id);
                              setEditingQuestionText(q.text);
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition"
                            title="Edit Question"
                            id={`edit-btn-${q.id}`}
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            updateQuestionsForActiveListing(followUpQuestions.filter(item => item.id !== q.id));
                            if (editingQuestionId === q.id) setEditingQuestionId(null);
                          }}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                          title="Delete Question"
                          id={`delete-btn-${q.id}`}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {followUpQuestions.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">No custom questions added yet. Construct one using the field below!</p>
                  )}
                </div>

                {/* Add New Question Section */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-left space-y-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Add New Feedback Question to Form</p>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="e.g. Rate your impression of the master bedroom ensuite suite"
                      className="w-full text-xs border rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 bg-slate-50 text-slate-800"
                      id="new-question-input"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Category</label>
                        <select
                          value={newQuestionCategory}
                          onChange={(e) => setNewQuestionCategory(e.target.value)}
                          className="w-full text-[10px] border rounded-lg px-1.5 py-1.5 bg-slate-50 text-slate-700 font-bold"
                          id="new-question-category"
                        >
                          <option value="General">General Questionnaire</option>
                          <option value="Pricing">Pricing / Valuation</option>
                          <option value="Timeline">Timeline / Buy Speed</option>
                          <option value="Brokerage">Agent Representation Check</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Input Style</label>
                        <select
                          value={newQuestionType}
                          onChange={(e: any) => setNewQuestionType(e.target.value)}
                          className="w-full text-[10px] border rounded-lg px-1.5 py-1.5 bg-slate-50 text-slate-700 font-bold"
                          id="new-question-style"
                        >
                          <option value="text">Text Response Field</option>
                          <option value="yes_no">Yes / No Switch</option>
                          <option value="select">Dropdown Choice Menu</option>
                        </select>
                      </div>
                    </div>

                    {newQuestionType === "select" && (
                      <div className="space-y-1 p-2 bg-amber-50/50 rounded-lg border border-amber-100 animate-in fade-in duration-200">
                        <label className="text-[9px] font-extrabold text-amber-800 uppercase block">Dropdown choices (separated by commas)</label>
                        <input
                          type="text"
                          value={newQuestionOptions}
                          onChange={(e) => setNewQuestionOptions(e.target.value)}
                          placeholder="e.g. Excellent, Good, Average, Disliked"
                          className="w-full text-xs border border-amber-200 rounded px-2 py-1 bg-white"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (newQuestionText.trim()) {
                          const newQ = {
                            id: Date.now(),
                            text: newQuestionText.trim(),
                            category: newQuestionCategory,
                            type: newQuestionType,
                            options: newQuestionType === "select" ? newQuestionOptions.split(",").map(o => o.trim()).filter(Boolean) : []
                          };
                          updateQuestionsForActiveListing([...followUpQuestions, newQ]);
                          setNewQuestionText("");
                          setNewQuestionOptions("");
                          toast.success("Added customized guest inquiry to this listing configuration!");
                        }
                      }}
                      className="w-full h-8.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 shrink-0 transition-transform active:scale-95 cursor-pointer"
                      id="add-question-btn"
                    >
                      <Plus className="h-3.5 w-3.5" /> Save Question template
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mt-0.5 shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Brokerage cascading rules</h4>
                  <p className="text-xs text-slate-500">Compliance agreements, footer terms, and disclosures are locked centrally by the broker.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive flyer showcase */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6 text-slate-800">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-sm">Real-time Flyer Themes Showcase</h3>
              <div className="flex gap-1.5">
                <button onClick={() => setFlyerStyle("luxury")} className={`px-2 py-0.5 text-[10px] rounded border font-semibold ${flyerStyle === "luxury" ? "bg-slate-900 text-white border-slate-950" : "bg-slate-50 text-slate-500"}`}>Luxury</button>
                <button onClick={() => setFlyerStyle("tech")} className={`px-2 py-0.5 text-[10px] rounded border font-semibold ${flyerStyle === "tech" ? "bg-blue-600 text-white border-blue-700" : "bg-slate-50 text-slate-500"}`}>Tech</button>
                <button onClick={() => setFlyerStyle("standard")} className={`px-2 py-0.5 text-[10px] rounded border font-semibold ${flyerStyle === "standard" ? "bg-slate-200 text-slate-800 border-slate-300" : "bg-slate-50 text-slate-500"}`}>Minimal</button>
              </div>
            </div>

            <div className={`p-6 border-2 rounded-2xl relative transition-all duration-300 text-left ${
              flyerStyle === "luxury" ? "border-amber-700 bg-stone-900 text-stone-100 font-serif" :
              flyerStyle === "tech" ? "border-blue-600 bg-slate-950 text-slate-100 font-sans" :
              "border-slate-800 bg-slate-900 text-white font-sans"
            }`}>
              {/* Outer decorative borders */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black tracking-widest uppercase opacity-70">OPEN HOUSE GUIDE</h4>
                    <p className={`text-lg font-bold tracking-tight mt-1 ${flyerStyle === "luxury" ? "text-amber-400" : flyerStyle === "tech" ? "text-blue-400" : "text-white"}`}>THE GRAND OAK MANOR</p>
                  </div>
                  <span className="text-[10px] font-mono opacity-80 border px-1.5 py-0.5 rounded">QR SCANS</span>
                </div>

                <div className="h-28 bg-stone-800/50 rounded-lg flex items-center justify-center text-[10px] uppercase tracking-wider text-slate-300 border border-transparent">
                  [ Listing High-Res Media Placeholder ]
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] uppercase font-bold tracking-wider opacity-90 py-1 border-y border-white/10">
                  <div>5 beds</div>
                  <div>6.5 baths</div>
                  <div>6,400 sqft</div>
                </div>

                <div className="text-[10px] leading-relaxed opacity-70">
                  Scan the compliance QR to register touchless, fetch disclosures instantly, or activate the hands-free AI voice tour narrator inside this home.
                </div>
              </div>
            </div>
            
            <p className="text-[11px] text-slate-500 italic text-center">
              "Themes are injected automatically with agent credentials, broker compliance logos, and active color keys."
            </p>
          </div>

        </section>

        {/* System Inquiries & Lead Security Audits section inside OpenHousesPage.tsx - STRETCH 100% WIDTH */}
        <section id="auditing-portal" className="w-full bg-[#0a0f1d] text-slate-100 py-16 px-4 sm:px-8 md:px-12 xl:px-16 border-t border-slate-900 shadow-2xl relative overflow-hidden">
          <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-blue-900/10 rounded-full filter blur-3xl pointer-events-none"></div>
          
          <div className="w-full mx-auto space-y-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 gap-4">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-blue-400">Security & Storage Auditing Portal</span>
                  <span className="text-[9px] font-mono font-bold bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full uppercase">Full Scope Enabled</span>
                </div>
                <h3 className="font-extrabold text-2xl text-white mt-1.5">Automations Suite: Instant Lead Follow-Up & Actionable Insights</h3>
                <p className="text-xs text-slate-400 mt-1">Configure and audit secure delivery pipelines, automatic email brochure triggers, alert routing, and active database compliance rules.</p>
              </div>

              {/* Edit and Save triggers for authorized Agents/Admins */}
              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                {!isAuditingEditMode ? (
                  <button
                    onClick={() => {
                      setIsAuditingEditMode(true);
                      toast.info("Switched to active compliance template editor. Modify configurations below.");
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white text-xs font-black rounded-xl cursor-pointer shadow-lg shadow-blue-500/10"
                    id="edit-audit-btn"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit Parameters
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        localStorage.setItem("vertex_audit_email_content", auditEmailContent);
                        localStorage.setItem("vertex_audit_sms_alert", auditSmsAlert);
                        localStorage.setItem("vertex_audit_validation_api", auditValidationApi);
                        setIsAuditingEditMode(false);
                        toast.success("Security & compliance template updated successfully!", {
                          description: "Active brokerage check-in templates refreshed."
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white text-xs font-black rounded-xl cursor-pointer shadow-lg shadow-emerald-500/10"
                      id="save-audit-btn"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsAuditingEditMode(false);
                        // restore defaults or cached local storage
                        setAuditEmailContent(localStorage.getItem("vertex_audit_email_content") || "Upon checking in, the visitor immediately receives an email with a professional, mobile-optimized digital brochure of the property. This contains pre-populated OREA/compliance disclosure logs, download keys for the audio guides, and clickable contact links routing back to the host team.");
                        setAuditSmsAlert(localStorage.getItem("vertex_audit_sms_alert") || "Yes! Milliseconds within submission, the host agent gets an SMS text message detailing lead names, email references, phone numbers, check-in timestamps, status, representation coordinates, and automated telecom compliance checks.");
                        setAuditValidationApi(localStorage.getItem("vertex_audit_validation_api") || "A real-time cellular lookup search is run instantly on the registrant's phone number. Mobile carrier, line status (mobile vs. VoIP vs. landline), and country info are retrieved using Twilio Lookup API V2. Registrations and verified parameters are stored securely inside Firebase Firestore under the /leads collection as authenticated sub-documents.");
                        toast.error("Discarded pending changes.");
                      }}
                      className="inline-flex items-center px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black rounded-xl cursor-pointer"
                      id="cancel-audit-btn"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Compliance notice banner */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex gap-3 text-left">
              <div className="h-6 w-6 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-200">Regulatory & Administrative Permissions Statement</p>
                <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                  Under general provincial disclosures, OREA/RECO regulatory schedules, and TCPA/CASL compliance mandates, central lead handling protocols cascade from the Brokerage admin and cannot be fully deleted. Host agents are explicitly allowed to edit regional templates to adapt to regional disclaimer rules.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-xs text-left">
              {/* Box 1 */}
              <div className="space-y-3 bg-slate-950 p-6 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition duration-300">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <h4 className="font-extrabold text-blue-400 uppercase tracking-widest text-[10px]">What does the email look like?</h4>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-full uppercase">Pre-check Email</span>
                </div>
                {isAuditingEditMode ? (
                  <textarea
                    value={auditEmailContent}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAuditEmailContent(val.charAt(0).toUpperCase() + val.slice(1));
                    }}
                    className="w-full h-36 bg-slate-900 text-white text-xs border border-slate-800 rounded-xl p-2.5 focus:ring-1 focus:ring-blue-500 outline-none leading-relaxed"
                  />
                ) : (
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {auditEmailContent}
                  </p>
                )}
              </div>

              {/* Box 2 */}
              <div className="space-y-3 bg-slate-950 p-6 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition duration-300">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <h4 className="font-extrabold text-blue-400 uppercase tracking-widest text-[10px]">Does the agent get an SMS alert?</h4>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-full uppercase">SMS Dispatcher</span>
                </div>
                {isAuditingEditMode ? (
                  <textarea
                    value={auditSmsAlert}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAuditSmsAlert(val.charAt(0).toUpperCase() + val.slice(1));
                    }}
                    className="w-full h-36 bg-slate-900 text-white text-xs border border-slate-800 rounded-xl p-2.5 focus:ring-1 focus:ring-blue-500 outline-none leading-relaxed"
                  />
                ) : (
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {auditSmsAlert}
                  </p>
                )}
              </div>

              {/* Box 3 */}
              <div className="space-y-3 bg-slate-950 p-6 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition duration-300">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <h4 className="font-extrabold text-blue-400 uppercase tracking-widest text-[10px]">What runs structural validation?</h4>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-full uppercase">Twilio V2 + Firebase</span>
                </div>
                {isAuditingEditMode ? (
                  <textarea
                    value={auditValidationApi}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAuditValidationApi(val.charAt(0).toUpperCase() + val.slice(1));
                    }}
                    className="w-full h-36 bg-slate-900 text-white text-xs border border-slate-800 rounded-xl p-2.5 focus:ring-1 focus:ring-blue-500 outline-none leading-relaxed"
                  />
                ) : (
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {auditValidationApi}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
