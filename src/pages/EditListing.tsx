import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { createListing, getListing, updateListing, Listing, deleteListingOp, ListingImage } from "@/lib/api";
import { Loader2, Plus, X, Trash2, ArrowLeft, ArrowRight, MoreHorizontal, Pencil, Save, Image as ImageIcon, Sparkles, CheckCircle2, Mic2, Download, Play, Square, Upload, Volume2, Search, ExternalLink } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, doc, getDoc, updateDoc, setDoc, where, deleteDoc } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";
import { QRCodeSVG } from "qrcode.react";

interface CRMItem {
  name: string;
  url: string;
}

const FALLBACK_CRMS: CRMItem[] = [
  { name: "HubSpot", url: "https://www.hubspot.com" },
  { name: "Follow Up Boss", url: "https://www.followupboss.com" },
  { name: "Salesforce", url: "https://www.salesforce.com" },
  { name: "Wise Agent", url: "https://wiseagent.com" },
  { name: "LionDesk", url: "https://www.liondesk.com" },
  { name: "kvCORE", url: "https://www.kvcore.com" },
  { name: "ActiveCampaign", url: "https://www.activecampaign.com" },
  { name: "Agile CRM", url: "https://www.agilecrm.com" },
  { name: "BoomTown", url: "https://boomtownroi.com" },
  { name: "Brivity", url: "https://www.brivity.com" },
  { name: "Copper", url: "https://www.copper.com" },
  { name: "EZ Coordinator", url: "https://ezcoordinator.com" },
  { name: "IXACT Contact", url: "https://www.ixactcontact.com" },
  { name: "Keap", url: "https://keap.com" },
  { name: "Mailchimp", url: "https://mailchimp.com" },
  { name: "Market Leader", url: "https://www.marketleader.com" },
  { name: "Pipedrive", url: "https://www.pipedrive.com" },
  { name: "Propertybase", url: "https://www.propertybase.com" },
  { name: "Real Geeks", url: "https://www.realgeeks.com" },
  { name: "RealtyJuggler", url: "https://www.realtyjuggler.com" },
  { name: "Sierra Interactive", url: "https://www.sierrainteractive.com" },
  { name: "Top Producer", url: "https://www.topproducer.com" },
  { name: "Zoho CRM", url: "https://www.zoho.com/crm/" }
];

function parseCSV(csvText: string): CRMItem[] {
  const lines = csvText.split(/\r?\n/);
  const result: CRMItem[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    let parts: string[] = [];
    let insideQuote = false;
    let currentPart = "";
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        parts.push(currentPart.trim());
        currentPart = "";
      } else {
        currentPart += char;
      }
    }
    parts.push(currentPart.trim());
    if (parts.length >= 2) {
      const name = parts[0].replace(/^"|"$/g, '').trim();
      const url = parts[1].replace(/^"|"$/g, '').trim();
      const lowerName = name.toLowerCase();
      if (
        name && 
        url && 
        lowerName !== "name" && 
        lowerName !== "column a" && 
        lowerName !== "created at" &&
        !lowerName.includes("chime") &&
        !lowerName.includes("cloze") &&
        !lowerName.includes("contactually")
      ) {
        result.push({ name, url });
      }
    }
  }
  return result;
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface Voice {
  id: string;
  name: string;
  type: string;
  isDefault?: boolean;
}

const INITIAL_VOICES: Voice[] = [
  { id: "2", name: "Professional Female", type: "Synthetic", isDefault: true },
  { id: "5", name: "Executive British (Female)", type: "Synthetic", isDefault: false },
  { id: "7", name: "Dynamic Storyteller (British Female)", type: "Synthetic", isDefault: false },
  { id: "3", name: "Warm Energetic Male", type: "Synthetic", isDefault: false },
  { id: "6", name: "Calm Reassuring Male", type: "Synthetic", isDefault: false },
  { id: "8", name: "Deep Narrator", type: "Synthetic", isDefault: false },
];

async function ensureUserVoices(userId: string): Promise<Voice[]> {
  const voicesRef = collection(db, "users", userId, "voices");
  
  // Clean up Sarah's Clone (id: "1") from database if it exists
  try {
    await deleteDoc(doc(voicesRef, "1"));
  } catch (err) {
    console.error("Clean old Sarah voice error:", err);
  }

  const voicesSnap = await getDocs(query(voicesRef));
  if (voicesSnap.empty) {
    const list: Voice[] = [];
    for (const v of INITIAL_VOICES) {
      await setDoc(doc(voicesRef, v.id), v);
      list.push(v);
    }
    return list;
  }
  
  const existList = voicesSnap.docs
    .filter(doc => doc.id !== "1")
    .map(doc => {
      const d = doc.data() as any;
      if (d.name && d.name.includes(" (Default)")) {
        d.name = d.name.replace(" (Default)", "");
      }
      return { id: doc.id, ...d } as Voice;
    });

  // Synchronize name definitions and add missing voices
  const syncedList: Voice[] = [];
  for (const ini of INITIAL_VOICES) {
    const current = existList.find(e => e.id === ini.id);
    if (!current) {
      await setDoc(doc(voicesRef, ini.id), ini);
      syncedList.push(ini);
    } else {
      if (current.name !== ini.name) {
        await updateDoc(doc(voicesRef, ini.id), { name: ini.name });
        current.name = ini.name;
      }
      syncedList.push(current);
    }
  }

  // Delete obsolete voices from database
  for (const exp of existList) {
    if (!INITIAL_VOICES.some(ini => ini.id === exp.id)) {
      try {
        await deleteDoc(doc(voicesRef, exp.id));
      } catch (err) {
        console.error("Clean old obsolete voice error:", err);
      }
    }
  }

  return syncedList;
}

export default function EditListing() {
  const { user } = useAuth();
  const { listingId } = useParams();
  const [activeListingId] = useState(() => listingId || crypto.randomUUID());
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isEdit = Boolean(listingId);
  const isImportParam = searchParams.get("import") === "true";

  const [currentStep, setCurrentStep] = useState(isEdit ? 2 : 1);
  const [setupMethod, setSetupMethod] = useState<"import" | "manual" | null>(
    isEdit ? "manual" : (isImportParam ? "import" : null)
  );

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [urlIngest, setUrlIngest] = useState("");
  
  // Form State
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [price, setPrice] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [mlsNumber, setMlsNumber] = useState("");
  const [originatingSystemName, setOriginatingSystemName] = useState("");
  const [country, setCountry] = useState("US");
  const [brokerageName, setBrokerageName] = useState("");
  const [brokerageLogo, setBrokerageLogo] = useState("");
  const [agentName, setAgentName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ListingImage[]>([]);
  const [newImage, setNewImage] = useState("");
  
  // Custom Welcome Audios State
  const [welcomeEn, setWelcomeEn] = useState("");
  const [welcomeFr, setWelcomeFr] = useState("");

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>, lang: "en" | "fr") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/") && !file.name.endsWith(".mp3")) {
      toast.error("Please upload a valid .mp3 audio file.");
      return;
    }

    if (file.size > 800 * 1024) {
      toast.error("File exceeds limit. Keep welcome audio files under 800KB (approx. 1 minute) to optimize loading speed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      if (lang === "en") {
        setWelcomeEn(base64String);
        toast.success("English Welcome Audio uploaded. Click Save to persist!");
      } else {
        setWelcomeFr(base64String);
        toast.success("French Welcome Audio uploaded. Click Save to persist!");
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read audio file.");
    };
    reader.readAsDataURL(file);
  };
  
  // Voice State
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [voiceId, setVoiceId] = useState("");
  const [voiceName, setVoiceName] = useState("");

  const [firstEntry, setFirstEntry] = useState(true);

  useEffect(() => {
    const handleInteraction = () => {
      setFirstEntry(false);
    };
    window.addEventListener("mousedown", handleInteraction, { passive: true });
    window.addEventListener("keydown", handleInteraction, { passive: true });
    return () => {
      window.removeEventListener("mousedown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  const isStepCompleted = (stepNum: number): boolean => {
    if (firstEntry) return false;
    switch (stepNum) {
      case 1:
        return setupMethod !== null;
      case 2:
        return (
          address.trim() !== "" &&
          city.trim() !== "" &&
          province.trim() !== "" &&
          price.trim() !== "" &&
          beds.trim() !== "" &&
          baths.trim() !== ""
        );
      case 3:
        return images.length > 0;
      case 4:
        return voiceId !== "" && voiceId !== "none";
      case 5:
        // Guest Sign-In can have openHouseDate or default gate types; since isEdit or preset is active, it can be complete.
        // Returning true since all inputs on this step are optional.
        return true;
      case 6:
        // Optional integrations
        return true;
      case 7:
        return setupMethod !== null && address.trim() !== "" && price.trim() !== "" && images.length > 0;
      default:
        return false;
    }
  };

  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const playingAudioSourcesRef = useRef<any[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const stopAndClearAudio = () => {
    playingAudioSourcesRef.current.forEach(src => {
      try { src.stop(); } catch(e) {}
    });
    playingAudioSourcesRef.current = [];
    setPlayingVoiceId(null);
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  };

  useEffect(() => {
    return () => {
      playingAudioSourcesRef.current.forEach(src => {
        try { src.stop(); } catch(e) {}
      });
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
    };
  }, []);

  const playVoiceDemo = (id: string, name: string) => {
    stopAndClearAudio();
    setPlayingVoiceId(id);

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    let displayMessage = "";
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes("sarah")) { // Sarah's Clone
      displayMessage = "Sarah: 'Welcome to this gorgeous Malibu property! Let's explore the custom ocean-view terrace first...'";
    } else if (nameLower.includes("professional female")) {
      displayMessage = "Professional Female: 'Hello there, thank you for visiting. I can walk you through the listing details or explain the smart integrations.'";
    } else if (nameLower.includes("warm") || nameLower.includes("friendly")) {
      displayMessage = "Warm Male: 'Hey, welcome. Come on in and make yourself at home. Let me know if you want details on the kitchen or master suite.'";
    } else if (nameLower.includes("luc")) { // Luc's Clone
      displayMessage = "Luc: 'Welcome to our featured estate representation. I am here to help guide your walkthrough and answer any regulatory contract questions.'";
    } else if (nameLower.includes("executive british") || (nameLower.includes("british") && nameLower.includes("female") && !nameLower.includes("storyteller"))) {
      displayMessage = "Executive Female: 'Good day. We are currently viewing this exquisite high-end listing. I shall narrate each highlight for your pleasure...'";
    } else if (nameLower.includes("midwest")) {
      displayMessage = "Midwest voice: 'Hi, welcome to the open house. Take a look around. I can point out the key features like the garage and laundry layout.'";
    } else if (nameLower.includes("storyteller")) {
      displayMessage = "Dynamic Storyteller: 'Wow! This home is an absolute showstopper. Let's dive into the fascinating history and high-end design of this property!'";
    } else if (nameLower.includes("calm")) {
      displayMessage = "Calm Narrator: 'Take a deep breath and settle in. This residence offers quiet elegance. Let's begin our journey in the living space...'";
    } else {
      displayMessage = `${name}: 'Hello! I am speaking in a custom-tailored synthetic AI character profile.'`;
    }

    toast.info("Synthesized Voice Intro Playing", {
      description: displayMessage,
      duration: 7000,
    });

    // Speak using browser's native text to speech (SpeechSynthesis API)
    if (window.speechSynthesis) {
      try {
        const quoteStartIndex = displayMessage.indexOf("'");
        const quoteEndIndex = displayMessage.lastIndexOf("'");
        const cleanSpeechText = quoteStartIndex !== -1 && quoteEndIndex !== -1
          ? displayMessage.substring(quoteStartIndex + 1, quoteEndIndex)
          : displayMessage;

        const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
        
        // Find best local voice match
        const speechVoices = window.speechSynthesis.getVoices();
        if (speechVoices && speechVoices.length > 0) {
          let bestVoice = null;
          const isFemaleVoice = nameLower.includes("female") || nameLower.includes("sarah") || nameLower.includes("storyteller");
          const isMaleVoice = nameLower.includes("male") || nameLower.includes("luc") || nameLower.includes("narrator") || nameLower.includes("midwest");
          const isBritishVoice = nameLower.includes("british");

          if (isFemaleVoice) {
            if (isBritishVoice) {
              // Try British Female specific matching
              bestVoice = speechVoices.find(v => v.lang.toLowerCase().startsWith("en-gb") && 
                (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("hazel") || v.name.toLowerCase().includes("susan") || v.name.toLowerCase().includes("samantha") || !v.name.toLowerCase().includes("george"))
              );
            }
            if (!bestVoice) {
              // Standard Female voices list
              bestVoice = speechVoices.find(v => v.lang.toLowerCase().startsWith("en") && 
                (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("samantha") || v.name.toLowerCase().includes("sara") || v.name.toLowerCase().includes("hazel") || v.name.toLowerCase().includes("karen") || v.name.toLowerCase().includes("victoria") || v.name.toLowerCase().includes("google us english female"))
              );
            }
            if (!bestVoice) {
              // Any female matching voice name
              bestVoice = speechVoices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("samantha") || v.name.toLowerCase().includes("sara") || v.name.toLowerCase().includes("hazel"));
            }
          } else if (isMaleVoice) {
            if (!bestVoice) {
              // Try English Male voices specifically
              bestVoice = speechVoices.find(v => v.lang.toLowerCase().startsWith("en") && 
                (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("microsoft david") || v.name.toLowerCase().includes("google us english male") || v.name.toLowerCase().includes("mark") || v.name.toLowerCase().includes("daniel") || v.name.toLowerCase().includes("george"))
              );
            }
            if (!bestVoice) {
              // Any male voice name
              bestVoice = speechVoices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("george") || v.name.toLowerCase().includes("mark"));
            }
          }

          // Ultimate fallback (any english voice)
          if (!bestVoice) {
            bestVoice = speechVoices.find(v => v.lang.toLowerCase().startsWith("en"));
          }

          if (bestVoice) {
            utterance.voice = bestVoice;
          }
        }

        // Adjust parameters to feel warmth and less robotic
        utterance.rate = nameLower.includes("calm") ? 0.82 : nameLower.includes("storyteller") ? 1.05 : nameLower.includes("warm") ? 0.90 : 0.95;
        utterance.pitch = nameLower.includes("luc") ? 0.85 : nameLower.includes("british") ? 1.05 : nameLower.includes("warm") ? 0.95 : 1.0;
        
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("SpeechSynthesis error:", err);
      }
    }

    // Play a single, gorgeous warm ambient harmonic swell to indicate audio triggers (no repetitive robotic click loops)
    const swellGain = ctx.createGain();
    swellGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    swellGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.3);
    swellGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
    swellGain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = "sine";
    osc2.type = "sine";
    
    // Smooth dual harmonic carrier frequencies (Warm E-Major triad feel)
    const baseSwellFreq = nameLower.includes("male") || nameLower.includes("luc") || nameLower.includes("narrator") ? 130.81 : 196.00; // C3 vs G3
    osc1.frequency.setValueAtTime(baseSwellFreq, ctx.currentTime);
    osc2.frequency.setValueAtTime(baseSwellFreq * 1.5, ctx.currentTime); // Perfect fifth for high-end professional chord swell

    osc1.connect(swellGain);
    osc2.connect(swellGain);

    try {
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 1.8);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 1.8);
    } catch (e) {}

    const stopWrapper = {
      stop: () => {
        try {
          swellGain.gain.setValueAtTime(swellGain.gain.value, ctx.currentTime);
          swellGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
        } catch (e) {}
      }
    };
    playingAudioSourcesRef.current.push(stopWrapper);

    // Auto clean up after 7 seconds
    const autoStopTimer = setTimeout(() => {
      setPlayingVoiceId(null);
    }, 7000);

    const timerWrapper = {
      stop: () => clearTimeout(autoStopTimer)
    };
    playingAudioSourcesRef.current.push(timerWrapper);
  };

  // Image Rename State
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [editingImageName, setEditingImageName] = useState("");
  const [imageToDeleteIndex, setImageToDeleteIndex] = useState<number | null>(null);

  const [talkingPoints, setTalkingPoints] = useState<string[]>([]);
  const [newPoint, setNewPoint] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [documents, setDocuments] = useState<{ name: string; url: string }[]>([]);
  const [newDocName, setNewDocName] = useState("");
  const [newDocUrl, setNewDocUrl] = useState("");
  const [openHouseDate, setOpenHouseDate] = useState("");
  const [openHouseStartTime, setOpenHouseStartTime] = useState("");
  const [openHouseEndTime, setOpenHouseEndTime] = useState("");
  const [tourDescriptors, setTourDescriptors] = useState<string[]>(new Array(16).fill(""));

  // CRM integration States
  const [crmLinks, setCrmLinks] = useState<Record<string, string>>({
    "HubSpot": "https://www.hubspot.com",
    "Follow Up Boss": "https://www.followupboss.com",
    "Salesforce": "https://www.salesforce.com",
    "Wise Agent": "https://wiseagent.com",
    "LionDesk": "https://www.liondesk.com",
    "kvCORE": "https://www.kvcore.com"
  });

  const [crmList, setCrmList] = useState<CRMItem[]>(FALLBACK_CRMS);
  const [crmSearchQuery, setCrmSearchQuery] = useState("");
  const [selectedCrmFromDropdown, setSelectedCrmFromDropdown] = useState<CRMItem | null>(null);
  const [isCrmDropdownOpen, setIsCrmDropdownOpen] = useState(false);
  const crmDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchCRMSpreadsheet() {
      try {
        const response = await fetch("https://docs.google.com/spreadsheets/d/1m7tvG7sehev6E3WhrUSooNYJ0rz23RLbbVOzHpD5eFg/export?format=csv");
        if (response.ok) {
          const csvText = await response.text();
          const parsed = parseCSV(csvText);
          if (parsed.length > 0) {
            setCrmList(parsed);
            
            // Sync current link maps if any names match
            setCrmLinks(prev => {
              const next = { ...prev };
              parsed.forEach(item => {
                const matchingKey = Object.keys(next).find(
                  k => k.toLowerCase() === item.name.toLowerCase()
                );
                if (matchingKey) {
                  next[matchingKey] = item.url;
                }
              });
              return next;
            });
          }
        }
      } catch (err) {
        console.warn("Spreadsheet restricted or unauthenticated. Intelligently using local verified database.", err);
      }
    }
    fetchCRMSpreadsheet();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (crmDropdownRef.current && !crmDropdownRef.current.contains(event.target as Node)) {
        setIsCrmDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const times = [
    "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM"
  ];

  const getFormattedDateHint = (dateString: string) => {
    if (!dateString) return "Sun, May 17th, 2026";
    try {
      const d = new Date(dateString + 'T00:00:00');
      return d.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }).replace(/(\d+)/, (day, offset, str) => {
        // Only replace the day number (the one before the year or at the end of the date part)
        // Check if this digit is followed by a comma or space then year
        const n = parseInt(day);
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      });
    } catch (e) {
      return "Sun, May 17th, 2026";
    }
  };

  // Voice Warning Check
  useEffect(() => {
    if (!loading && user && !user.defaultVoiceId) {
      toast.warning("No default AI voice set", {
        description: "Set a default voice in the Voice Lab to automatically assign it to your tours.",
        action: {
          label: "Go to Voice Lab",
          onClick: () => navigate("/app/voicelab")
        },
        duration: 10000,
      });
    }
  }, [loading, user?.defaultVoiceId]);

  useEffect(() => {
    if (isEdit && listingId) {
      loadData(listingId);
    } else if (user?.id) {
       fetchUserBranding();
    }
  }, [listingId, isEdit, user?.id]);

  async function fetchUserBranding() {
     try {
       const userDoc = await getDoc(doc(db, "users", user!.id));
       const userData = userDoc.data();
       if (userData?.branding) {
         setBrokerageLogo(userData.branding.imageUrl || userData.branding.logoUrl || "");
       }
     } catch (err) {
       console.error("Error fetching user branding:", err);
     }
  }

  const handleVoiceSelect = async (vId: string, vName: string) => {
    setVoiceId(vId);
    setVoiceName(vName);
    
    if (user?.id) {
      try {
        // Propagate to User Profile
        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, { defaultVoiceId: vId === 'none' ? null : vId });
        
        // Propagate to Voice collection isDefault flags (optimized)
        const voicesRef = collection(db, "users", user.id, "voices");
        const q = query(voicesRef, where("isDefault", "==", true));
        const currentDefaults = await getDocs(q);
        
        for (const d of currentDefaults.docs) {
          if (d.id !== vId) {
            await updateDoc(d.ref, { isDefault: false });
          }
        }
        
        if (vId !== 'none') {
          await updateDoc(doc(db, "users", user.id, "voices", vId), { isDefault: true });
        }
        
        if (vId === 'none') {
           toast.info("System default voice removed.");
        } else {
           toast.success(`"${vName}" set as system default for all new listings.`);
        }
      } catch (err) {
        console.error("Error setting default voice:", err);
      }
    }
  };

  async function loadData(id: string) {
    try {
      // Load voices first to ensure we can match names
      if (user?.id) {
        const voicesData = await ensureUserVoices(user.id);
        setAvailableVoices(voicesData);
      }

      const data = await getListing(id);
      if (data) {
        const isAdmin = (user as any)?.role === 'ADMIN';
        if (data.ownerId !== user?.id && !isAdmin) {
          toast.error("Unauthorized");
          navigate("/app/listings");
          return;
        }
        const fetchedAddress = data.address || "";
        const fetchedCity = data.city || "";
        const fetchedProvince = data.province || "";
        const fetchedPostalCode = data.postalCode || "";

        setAddress(fetchedAddress);
        setCity(fetchedCity);
        setProvince(fetchedProvince);
        setPostalCode(fetchedPostalCode);
        
        // Try to parse address components ONLY if they are truly missing
        if (fetchedAddress && (!fetchedCity || !fetchedProvince || !fetchedPostalCode)) {
          const parts = fetchedAddress.split(',').map(p => p.trim());
          if (parts.length >= 3) {
            if (!fetchedCity) setCity(parts[1]);
            
            const lastPart = parts[parts.length - 1];
            const stateZipMatch = lastPart.match(/^([A-Z]{2})\s+(.*)$/i);
            
            if (stateZipMatch) {
              if (!fetchedProvince) setProvince(stateZipMatch[1]);
              if (!fetchedPostalCode) setPostalCode(stateZipMatch[2]);
            } else if (parts.length === 4) {
               if (!fetchedProvince) setProvince(parts[2]);
               if (!fetchedPostalCode) setPostalCode(parts[3]);
            }
          }
        }
        
        setPrice(data.price?.toString() || "");
        setBeds(data.beds?.toString() || "");
        setBaths(data.baths?.toString() || "");
        setSqft(data.sqft?.toString() || "");
        setMlsNumber(data.mlsNumber || "");
        setOriginatingSystemName(data.originatingSystemName || "");
        setCountry(data.country || "US");
        setBrokerageName(data.brokerageName || "");
        if (data.brokerageLogo && !data.brokerageLogo.startsWith('blob:')) {
          setBrokerageLogo(data.brokerageLogo);
        } else {
          setBrokerageLogo("");
        }
        setAgentName(data.agentName || "");
        setDescription(data.description || "");
        
        // Normalize images
        const normalizedImages: ListingImage[] = (data.images || []).map(img => {
          if (typeof img === 'string') {
            const fileName = img.split('/').pop()?.split('?')[0] || "image.jpg";
            return { url: img, name: fileName };
          }
          return img;
        });
        setImages(normalizedImages);
        
        setVoiceId(data.voiceId && data.voiceId !== "none" ? data.voiceId : "2");
        setVoiceName(data.voiceName && data.voiceId !== "none" ? data.voiceName : "Professional Female");
        setTalkingPoints(data.talkingPoints || []);
        
        // Load tour descriptors, ensuring we have exactly 16 slots
        const loadedDescriptors = data.tourDescriptors || [];
        const descriptorsArray = new Array(16).fill("");
        loadedDescriptors.forEach((val: string, idx: number) => {
          if (idx < 16) descriptorsArray[idx] = val;
        });
        setTourDescriptors(descriptorsArray);
        setOpenHouseDate(data.openHouseDate || "");
        if (data.openHouseTime) {
          const [start, end] = data.openHouseTime.split(" - ");
          setOpenHouseStartTime(start || "");
          setOpenHouseEndTime(end || "");
        } else {
          setOpenHouseStartTime("");
          setOpenHouseEndTime("");
        }

        setWebhookUrl(data.webhookUrl || "");
        setDocuments(data.documents || []);
        setWelcomeEn(data.welcome_en || "");
        setWelcomeFr(data.welcome_fr || "");
      }
    } catch (err) {
      toast.error("Failed to load listing");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isEdit && user?.id) {
      const fetchDefaults = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.id));
          const userData = userDoc.data();
          
          const voicesData = await ensureUserVoices(user.id);
          setAvailableVoices(voicesData);

          // Use system default if available
          const defaultVoice = voicesData.find(v => v.id === userData?.defaultVoiceId || v.isDefault);
          if (defaultVoice) {
            setVoiceId(defaultVoice.id);
            setVoiceName(defaultVoice.name);
          } else {
            // Default to "Professional Female" (id: "2")
            setVoiceId("2");
            setVoiceName("Professional Female");
          }
        } catch (err) {
          console.error("Error fetching default voice:", err);
        }
      };
      fetchDefaults();
    }
  }, [isEdit, user?.id]);

  async function handleIngest() {
    if (!urlIngest) {
      toast.error("Please enter a property URL first");
      return;
    }
    
    try {
      const url = new URL(urlIngest);
      if (!url.hostname) throw new Error();
    } catch (e) {
      toast.error("Please enter a valid URL (e.g. https://zillow.com/...)");
      return;
    }

    toast.info("Ingesting URL... This may take a minute.");
    setLoading(true);
    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlIngest })
      });
      
      const resData = await response.json();
      
      // Even if response is not ok, we might have partial data in resData.data
      const data = resData.data;

      if (data) {
        const ingestedAddress = data.address || "";
        if (ingestedAddress) setAddress(ingestedAddress);
        
        const ingestedCity = data.city || "";
        const ingestedProvince = data.province || "";
        const ingestedPostalCode = data.postalCode || "";

        if (ingestedCity) setCity(ingestedCity);
        if (ingestedProvince) setProvince(ingestedProvince);
        if (ingestedPostalCode) setPostalCode(ingestedPostalCode);
        
        if (data.originatingSystemName) setOriginatingSystemName(data.originatingSystemName);
        if (data.country) setCountry(data.country);
        if (data.agentName) setAgentName(data.agentName);

        // Try to parse address components as fallback ONLY if they are still missing
        if (ingestedAddress && (!ingestedCity || !ingestedProvince || !ingestedPostalCode)) {
          const parts = ingestedAddress.split(',').map(p => p.trim());
          if (parts.length >= 3) {
            if (!ingestedCity && !city) setCity(parts[1]);
            const lastPart = parts[parts.length - 1];
            const stateZipMatch = lastPart.match(/^([A-Z]{2})\s+(.*)$/i);
            if (stateZipMatch) {
              if (!ingestedProvince && !province) setProvince(stateZipMatch[1]);
              if (!ingestedPostalCode && !postalCode) setPostalCode(stateZipMatch[2]);
            } else if (parts.length === 4) {
               if (!ingestedProvince && !province) setProvince(parts[2]);
               if (!ingestedPostalCode && !postalCode) setPostalCode(parts[3]);
            }
          }
        }
        
        if (data.price) setPrice(data.price.toString());
        if (data.beds) setBeds(data.beds.toString());
        if (data.baths) setBaths(data.baths.toString());
        if (data.sqft) setSqft(data.sqft.toString());
        if (data.mlsNumber) setMlsNumber(data.mlsNumber);
        if (data.brokerageName) setBrokerageName(data.brokerageName);
        if (data.agentName) setAgentName(data.agentName);
        if (data.description) setDescription(data.description);
        
        if (data.images && data.images.length > 0) {
          const normalized = data.images.map((img, idx) => {
            if (typeof img === 'string') {
              return { url: img, name: `Photo ${idx + 1} (Name Me)` };
            }
            // If it's an object with a boring name, make it a placeholder
            if (img.name && (img.name.length > 25 || img.name.includes('image') || /^[a-f0-9-]{36}$/.test(img.name))) {
               return { ...img, name: `Photo ${idx + 1} (Name Me)` };
            }
            return img;
          });
          setImages(normalized);
        }
        
        // Use keyFeatures if talkingPoints are missing
        const points = data.talkingPoints || data.keyFeatures || [];
        if (points.length > 0) setTalkingPoints(points);

        if (data.importStatus === "partial") {
          toast.warning("Partial import complete. Please review missing fields.");
          setCurrentStep(2);
        } else if (data.importStatus === "failed") {
          toast.error("We could not fully read this page. Source URL has been saved.");
        } else {
          toast.success("Successfully ingested listing data!");
          setCurrentStep(2);
        }
      }

      if (!response.ok) {
        throw new Error(resData.error || "Failed to ingest");
      }
    } catch (err: any) {
      console.error(err);
      // We don't want to show raw stack traces, just the clear error message from server
      toast.error(err.message || "Failed to ingest listing");
    } finally {
      setLoading(false);
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handleAddImage = () => {
    try {
      if (newImage) {
        const url = new URL(newImage);
        const fileName = url.pathname.split('/').pop()?.split('?')[0] || "property-image.jpg";
        setImages([...images, { url: newImage, name: fileName }]);
        setNewImage("");
        toast.success("Image added");
      }
    } catch (e) {
      toast.error("Invalid image URL");
    }
  };

  const handleRenameImage = (index: number) => {
    setEditingImageIndex(index);
    setEditingImageName(images[index].name);
    setIsRenameDialogOpen(true);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const saveImageName = async () => {
    if (editingImageIndex !== null && editingImageName.trim()) {
      const updated = [...images];
      updated[editingImageIndex] = { ...updated[editingImageIndex], name: editingImageName.trim() };
      setImages(updated);
      setIsRenameDialogOpen(false);
      setEditingImageIndex(null);
      
      if (isEdit && listingId) {
        try {
          await updateListing(listingId, { images: updated });
          toast.success("Image renamed and synced to assets");
        } catch (err) {
          toast.error("Renamed locally but failed to sync to assets");
        }
      } else {
        toast.success("Image renamed");
      }
    }
  };

  const handleDeleteImage = (index: number) => {
    setImageToDeleteIndex(index);
  };

  const handleConfirmDeleteImage = async () => {
    if (imageToDeleteIndex === null) return;
    const index = imageToDeleteIndex;
    const updated = images.filter((_, idx) => idx !== index);
    setImages(updated);
    
    if (isEdit && listingId) {
      try {
        await updateListing(listingId, { images: updated });
        toast.success("Image deleted and synced to listing");
      } catch (err) {
        toast.error("Removed locally but failed to sync to server");
      }
    } else {
      toast.success("Image removed");
    }
    setImageToDeleteIndex(null);
  };

  const handleDownloadImage = (img: ListingImage, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!img || !img.url) {
      toast.error("No image URL found");
      return;
    }
    try {
      const link = document.createElement("a");
      link.href = img.url;
      link.download = img.name || "download";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Download started for ${img.name}`);
    } catch (err) {
      console.error("Download failed", err);
      toast.error("Failed to trigger download");
    }
  };

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!address) {
      toast.error("Address is required");
      return;
    }

    // Validations
    const numericPrice = price ? parseInt(price) : 0;
    if (price && (isNaN(numericPrice) || numericPrice <= 0)) {
      toast.error("Price must be a positive number");
      return;
    }

    const numericSqft = sqft ? parseInt(sqft) : 0;
    if (sqft && (isNaN(numericSqft) || numericSqft >= 50000)) {
      toast.error("Square feet must be a realistic number (less than 50,000)");
      return;
    }

    if (mlsNumber && !/^[A-Z0-9-]{3,32}$/i.test(mlsNumber)) {
      toast.error("Invalid MLS Number format. Should be 3-32 alphanumeric characters.");
      return;
    }

    let formattedPostalCode = postalCode.trim();
    if (country === 'CA') {
      formattedPostalCode = formattedPostalCode.toUpperCase();
      // Auto-format: Add space if missing (A1A1A1 -> A1A 1A1)
      if (formattedPostalCode.length === 6 && !formattedPostalCode.includes(' ')) {
        formattedPostalCode = formattedPostalCode.slice(0, 3) + ' ' + formattedPostalCode.slice(3);
      }
      
      const caRegex = /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ ]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
      if (formattedPostalCode && !caRegex.test(formattedPostalCode)) {
        toast.error("Invalid Canadian Postal Code (Format: A1A 1A1). Note: D, F, I, O, Q, U are not used.");
        return;
      }
    } else {
      const usRegex = /^\d{5}(-\d{4})?$/;
      if (formattedPostalCode && !usRegex.test(formattedPostalCode)) {
        toast.error("Invalid US Zip Code (Format: 12345 or 12345-6789)");
        return;
      }
    }
    
    setSaving(true);
    try {
      const payload: Partial<Listing> = {
        address: address || "",
        city: city || "",
        province: province || "",
        postalCode: formattedPostalCode || "",
        price: price ? parseInt(price) : null,
        beds: beds ? parseInt(beds) : null,
        baths: baths ? parseInt(baths) : null,
        sqft: sqft ? parseInt(sqft) : null,
        mlsNumber: mlsNumber.toUpperCase() || "",
        originatingSystemName: originatingSystemName || "",
        country: country || "US",
        brokerageName: brokerageName || "",
        brokerageLogo: brokerageLogo || "",
        agentName: agentName || "",
        description: description || "",
        images: images || [],
        talkingPoints: talkingPoints || [],
        tourDescriptors: tourDescriptors.filter(d => d.trim() !== ""),
        webhookUrl: webhookUrl || "",
        documents: documents || [],
        voiceId: voiceId || "",
        voiceName: voiceName || "",
        welcome_en: welcomeEn || "",
        welcome_fr: welcomeFr || "",
        openHouseDate: openHouseDate || "",
        openHouseTime: (openHouseStartTime && openHouseEndTime) ? `${openHouseStartTime} - ${openHouseEndTime}` : "",
        updatedAt: Date.now()
      };

      if (isEdit) {
        await updateListing(listingId!, payload);
        toast.success("Listing updated");
      } else {
        const newId = activeListingId;
        const fullPayload = {
          id: newId,
          ownerId: user!.id,
          createdAt: Date.now(),
          ...payload
        } as Listing;
        
        await createListing(fullPayload);
        
        toast.success("Listing created");
        navigate(`/app/listings/edit/${newId}`);
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Failed to save listing";
      try {
        const errorData = JSON.parse(err.message);
        if (errorData.error) msg = `Save Error: ${errorData.error}`;
      } catch (e) {
        if (err.message) msg = `Save Error: ${err.message}`;
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteListingOp(listingId!);
      toast.success("Listing deleted");
      navigate("/app/listings");
    } catch (err) {
      toast.error("Failed to delete listing");
    }
  }

  if (loading) {
     return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 sm:px-6">
      <div className="flex flex-col gap-4">
        <Link 
          to="/app/listings" 
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> View Listings
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">{isEdit ? "Edit Listing Dashboard" : "New Listing Setup"}</h1>
            <p className="text-sm text-slate-500 mt-1">Configure your open house sign-ins, AI voice tours, and listing detail pages.</p>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-slate-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Green is completed
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Blue is to finish
              </span>
            </div>
          </div>
          {isEdit && (
             <AlertDialog>
               <AlertDialogTrigger render={
                 <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" type="button">
                   <Trash2 className="h-4 w-4 mr-2" /> Delete Listing
                 </Button>
               } />
               <AlertDialogContent>
                 <AlertDialogHeader>
                   <AlertDialogTitle>Do you really want to delete this?</AlertDialogTitle>
                   <AlertDialogDescription>
                     This action cannot be undone. This will permanently remove the listing for <span className="font-bold text-base text-slate-900">{address || "this property"}</span>.
                   </AlertDialogDescription>
                 </AlertDialogHeader>
                 <AlertDialogFooter>
                   <AlertDialogCancel>No, Keep It</AlertDialogCancel>
                   <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Yes, Delete permanently</AlertDialogAction>
                 </AlertDialogFooter>
               </AlertDialogContent>
             </AlertDialog>
          )}
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white border rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-4 px-1">
          <span>STEP {currentStep} OF 7</span>
          <span className="text-blue-600 font-mono">
            {currentStep === 1 && "Choose Setup Mode"}
            {currentStep === 2 && "Review Extracted Listing Data"}
            {currentStep === 3 && "Label Room & View Assets"}
            {currentStep === 4 && "Configure Cora Voice & Behavior"}
            {currentStep === 5 && "Configure Guest Sign-In & Flyers"}
            {currentStep === 6 && "Branding, Integrity & CRMs"}
            {currentStep === 7 && "Interactive Preview & Publish Live"}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 h-2.5 rounded-full overflow-hidden bg-slate-100">
          {[1, 2, 3, 4, 5, 6, 7].map((step) => (
            <button
              key={'step-' + step}
              type="button"
              onClick={() => {
                if (isEdit || setupMethod !== null || step === 1) {
                  setCurrentStep(step);
                }
              }}
              className={`h-full rounded-sm transition-all focus:outline-none ${
                currentStep === step 
                  ? "bg-blue-600 ring-2 ring-blue-400 ring-offset-1 z-10 scale-y-110" 
                  : isStepCompleted(step) 
                    ? "bg-emerald-500 hover:bg-emerald-600" 
                    : "bg-blue-300/80 hover:bg-blue-400"
              }`}
              title={`Jump to step ${step} (${isStepCompleted(step) ? "Completed" : "To Finish (Blue)"})`}
            />
          ))}
        </div>
        <div className="hidden sm:grid grid-cols-7 gap-2 text-[10px] uppercase font-black tracking-widest mt-3 text-center">
          {[
            { id: 1, label: "Setup Method" },
            { id: 2, label: "Basic Info" },
            { id: 3, label: "Assets & Labels" },
            { id: 4, label: "AI Voices" },
            { id: 5, label: "Sign-In" },
            { id: 6, label: "CRMs & APIs" },
            { id: 7, label: "Live Preview" }
          ].map((s) => {
            const isActive = currentStep === s.id;
            const isDone = isStepCompleted(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { if (isEdit || setupMethod !== null) setCurrentStep(s.id); }}
                className={`transition-all duration-200 focus:outline-none cursor-pointer flex flex-col items-center justify-center py-1 rounded-md px-0.5 ${
                  isActive 
                    ? "text-blue-600 font-extrabold scale-105 bg-blue-50/50" 
                    : isDone 
                      ? "text-emerald-600 font-bold hover:text-emerald-700 hover:bg-emerald-50/30" 
                      : "text-blue-500 hover:text-blue-600 hover:bg-blue-50/30 font-medium"
                }`}
              >
                <span className="flex items-center gap-1">
                  {isDone && <span className="text-[12px] text-emerald-500 font-black">✓</span>}
                  <span>{s.id}. {s.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
        {/* STEP 1: CHOOSE SETUP METHOD */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div 
                onClick={() => setSetupMethod("import")}
                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer bg-white flex flex-col justify-between h-72 hover:shadow-lg ${setupMethod === 'import' ? 'border-blue-600 ring-2 ring-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="space-y-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-700 font-bold text-xl flex items-center justify-center">⚡</div>
                  <h3 className="font-bold text-lg text-slate-800">Choose URL Ingest Setup</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Paste a public listing link (Zillow, Redfin, or brokerage url) and let Gemini scrape, retrieve, normalize and hydrate all information in 20 seconds.
                  </p>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <span className="text-[11px] font-mono uppercase bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-bold">Fastest Experience</span>
                  {setupMethod === 'import' && <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">✓</div>}
                </div>
              </div>

              <div 
                onClick={() => { setSetupMethod("manual"); setCurrentStep(2); }}
                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer bg-white flex flex-col justify-between h-72 hover:shadow-lg ${setupMethod === 'manual' ? 'border-blue-600 ring-2 ring-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="space-y-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-700 font-bold text-xl flex items-center justify-center">✎</div>
                  <h3 className="font-bold text-lg text-slate-800">Choose Manual Setup</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Key in details, upload pictures, list highlights, and configure Sora individually step-by-step from structural foundations.
                  </p>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <span className="text-[11px] font-mono uppercase bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-bold">Custom Control</span>
                  {setupMethod === 'manual' && <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">✓</div>}
                </div>
              </div>
            </div>

            {setupMethod === "import" && (
              <Card className="border-blue-200 shadow-md">
                <CardHeader className="bg-blue-50/10">
                  <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" /> Enter Property link
                  </CardTitle>
                  <CardDescription>
                    Provide Zillow, Realtor, or Broker site URL. We validate, download, and extract details automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="https://www.zillow.com/homedetails/..." 
                      value={urlIngest} 
                      onChange={e => setUrlIngest(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleIngest} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Start Auto-Import
                    </Button>
                  </div>
                  <div className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded border leading-relaxed">
                    <strong>Import pipeline accuracy facts:</strong> High confidence extraction handles beds, baths, price, descriptions, room details, and key features. Grounding falls back onto Google Search logic to secure information integrity if direct links display anti-bot blocks.
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end pt-4">
              <Button 
                type="button" 
                onClick={() => {
                  if (setupMethod === "manual" || (setupMethod === "import" && address)) {
                    setCurrentStep(2);
                  } else {
                    toast.error("Please select a setup mode and import/fill listing first.");
                  }
                }} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                Configure Manually Instead <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW IMPORTED FIELDS (BASIC DETAILS) */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-800">Review Major Property Details</CardTitle>
              <CardDescription>Confirm correct specs, price, and descriptive copy below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2 sm:col-span-4">
                  <Label>Property address *</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, Los Angeles, CA" required />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={city} onChange={e => setCity(e.target.value)} placeholder="L.A." />
                </div>
                <div className="space-y-2">
                  <Label>Province/State</Label>
                  <Input value={province} onChange={e => setProvince(e.target.value)} placeholder="CA" />
                </div>
                <div className="space-y-2">
                  <Label>Postal/Zip Code</Label>
                  <Input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="90001" />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                    value={country} 
                    onChange={e => setCountry(e.target.value)}
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brokerage Name</Label>
                  <Input value={brokerageName} onChange={e => setBrokerageName(e.target.value)} placeholder="Century 21, Sotheby's, etc." />
                </div>
                <div className="space-y-2">
                  <Label>Agent Attribution Name</Label>
                  <Input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Jane Doe" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="850000" />
                </div>
                <div className="space-y-2">
                  <Label>Beds</Label>
                  <Input type="number" value={beds} onChange={e => setBeds(e.target.value)} placeholder="3" />
                </div>
                <div className="space-y-2">
                  <Label>Baths</Label>
                  <Input type="number" value={baths} onChange={e => setBaths(e.target.value)} placeholder="2.5" />
                </div>
                <div className="space-y-2">
                  <Label>Sq Ft</Label>
                  <Input type="number" value={sqft} onChange={e => setSqft(e.target.value)} placeholder="2400" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>MLS® Number</Label>
                  <Input value={mlsNumber} onChange={e => setMlsNumber(e.target.value.toUpperCase())} placeholder="MLS-12345" />
                </div>
                <div className="space-y-2">
                  <Label>MLS Board / Originating System</Label>
                  <Input value={originatingSystemName} onChange={e => setOriginatingSystemName(e.target.value)} placeholder="e.g. CRISNet" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Luxury property info..." />
              </div>

              <div className="space-y-2 pt-2">
                <Label>Key Highlights & Talking Points</Label>
                <div className="flex gap-2 mb-2">
                  <Input 
                    value={newPoint} 
                    onChange={e => setNewPoint(e.target.value)} 
                    placeholder="e.g. Brand new premium hardwood floors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newPoint) { setTalkingPoints([...talkingPoints, newPoint]); setNewPoint(""); }
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={() => {
                    if (newPoint) { setTalkingPoints([...talkingPoints, newPoint]); setNewPoint(""); }
                  }}>Add</Button>
                </div>
                <ul className="list-disc pl-4 space-y-1">
                  {talkingPoints.map((pt, i) => (
                    <li key={'point-' + pt + i} className="flex justify-between items-center text-sm text-slate-700 bg-slate-50 p-2 border rounded-md">
                      <span>{pt}</span>
                      <button type="button" onClick={() => setTalkingPoints(talkingPoints.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                <Button type="button" onClick={async () => { await handleSave(); setCurrentStep(3); }} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save & Continue to Media & Labels
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: REVIEW AND LABEL IMAGES */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-800">Listing Media Room-Labeler/Labels</CardTitle>
              <CardDescription>
                Label photos correctly. Sora relies on room names (e.g., Kitchen, Living Room) to match dynamic audio tours accurately when guests ask questions about specifically labeled sectors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Add Image by URL</Label>
                <div className="flex gap-2">
                  <Input value={newImage} onChange={e => setNewImage(e.target.value)} placeholder="https://example.com/kitchen.jpg" />
                  <Button type="button" variant="outline" onClick={handleAddImage}>
                    Add Photo
                  </Button>
                </div>
              </div>

              {images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {images.map((img, i) => (
                    <div key={'img-' + (img.name || 'no-name') + '-' + img.url + '-' + i} className="relative rounded-2xl overflow-hidden bg-slate-100 border aspect-[4/3] group shadow-inner">
                      <img 
                        src={img.url} 
                        alt={img.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const seed = img.name ? img.name.replace(/\s+/g, '_') : `estate_${i}`;
                          target.src = `https://picsum.photos/seed/${seed}/600/400`;
                        }}
                      />
                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-95 group-hover:opacity-105 transition-all">
                        <Button 
                          type="button" 
                          size="icon" 
                          variant="secondary" 
                          className="h-8 w-8 bg-white/95 rounded-full" 
                          onClick={() => { handleRenameImage(i); }}
                        >
                          <Pencil className="h-4 w-4 text-slate-700" />
                        </Button>
                        <Button 
                          type="button" 
                          size="icon" 
                          variant="destructive" 
                          className="h-8 w-8 rounded-full" 
                          onClick={() => { handleDeleteImage(i); }}
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </Button>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm p-2 rounded-lg text-white">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold truncate">{img.name}</span>
                          <span className="text-[9px] uppercase font-black bg-blue-600 px-1.5 py-0.5 rounded leading-none shrink-0 text-white">
                            Photo Label
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                  <ImageIcon className="h-10 w-10 mb-2 opacity-30 text-blue-500" />
                  <p className="text-xs text-slate-500">No photos loaded yet. Run Ingestion or enter custom URL above.</p>
                </div>
              )}

              {/* MEDIA ROOM-LABELER/ASSETS SECTION */}
              <div className="space-y-4 pt-6 mt-6 border-t font-sans">
                <div>
                  <h3 className="font-bold text-base text-slate-800">Media Room-Labeler/Assets</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    This section holds physical asset and property features mapped from digital uploads to guide interactive virtual tours.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-700">Tour Feature Descriptors (16 total slots)</h4>
                  <p className="text-[11px] text-slate-450 mt-1">
                    In the AI Tour, About Us, provide exact tags for Sora to handle when guests express curiosity about specific elements. Ensure names align with image labels and will be displayed as such in the AI Tour, Ask Me About.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {tourDescriptors.map((desc, idx) => (
                    <div key={'descriptor-' + idx} className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 font-bold">Slot {idx+1}</span>
                      <Input 
                        value={desc} 
                        onChange={e => {
                          const updated = [...tourDescriptors];
                          updated[idx] = e.target.value.slice(0, 30);
                          setTourDescriptors(updated);
                        }}
                        placeholder={`Descriptor key`}
                        className="h-9 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>Back</Button>
                <Button type="button" onClick={async () => { await handleSave(); setCurrentStep(4); }} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save & Continue to AI Voices & Sora
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: CONFIGURE OLIVIA/SORA AND TOUR MODES */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-800">AI Voice Assistant Character</CardTitle>
              <CardDescription>Select the exact narration tone and setup interactive points representing your brokerage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableVoices.map((v) => (
                  v.id !== 'none' && (
                    <div 
                      key={'voice-' + v.id}
                      onClick={() => handleVoiceSelect(v.id, v.name)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md flex flex-col justify-between min-h-[155px] py-3.5 ${voiceId === v.id ? 'border-blue-600 bg-blue-50/25' : 'border-slate-100 bg-white'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="h-9 w-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">🎙</div>
                        {voiceId === v.id && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                      </div>
                      <div className="space-y-1 mt-2">
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{v.name}</h4>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-slate-500 tracking-wider uppercase font-black">{v.type}</p>
                          {playingVoiceId === v.id && (
                            <span className="flex gap-0.5 items-end h-2 shrink-0 pr-1">
                              <span className="w-0.5 bg-blue-600 animate-[pulse_0.6s_infinite_alternate]" style={{ height: "40%" }} />
                              <span className="w-0.5 bg-blue-600 animate-[pulse_0.8s_infinite_alternate]" style={{ height: "100%" }} />
                              <span className="w-0.5 bg-blue-600 animate-[pulse_0.5s_infinite_alternate]" style={{ height: "60%" }} />
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {playingVoiceId === v.id ? (
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="destructive" 
                            className="h-7 text-[10px] px-2.5 rounded-lg flex items-center gap-1"
                            onClick={() => stopAndClearAudio()}
                          >
                            <Square className="h-2.5 w-2.5 fill-current" />
                            Stop Demo
                          </Button>
                        ) : (
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-[10px] px-2.5 rounded-lg flex items-center gap-1 text-slate-700 bg-white hover:bg-slate-50 border-slate-200"
                            onClick={() => playVoiceDemo(v.id, v.name)}
                          >
                            <Play className="h-2.5 w-2.5 text-emerald-600 fill-emerald-600" />
                            Play Intro (7s)
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                ))}
              </div>

              {/* WELCOME AUDIO MP3 INGESTION & PLAYGROUND */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4 mt-6">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-blue-600" />
                    Sora Welcome Audio (.MP3 Upload)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload pre-recorded welcome messages (.mp3) for English and French. These will play when visitors tap "Start Welcome Tour" in the virtual listing page, bypassing any auto-play blockages.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* English Welcome */}
                  <div className="bg-white border rounded-xl p-3.5 space-y-3 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">English Welcome MP3</span>
                      {welcomeEn ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Uploaded</span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">Default Option</span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center justify-center border border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-lg p-4 cursor-pointer text-center text-slate-500 hover:text-blue-600 transition-all">
                        <Upload className="h-4 w-4 mr-2" />
                        <span className="text-xs font-semibold">Choose English .mp3</span>
                        <input 
                          type="file" 
                          accept="audio/mp3, audio/*" 
                          className="hidden" 
                          onChange={(e) => handleAudioUpload(e, "en")} 
                        />
                      </label>
                      
                      {welcomeEn && (
                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-150 text-xs gap-3">
                          <audio src={welcomeEn} controls className="h-8 max-w-[130px] sm:max-w-full" />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-500 hover:text-red-700 shrink-0"
                            onClick={() => { setWelcomeEn(""); toast.success("Removed English welcome audio."); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* French Welcome */}
                  <div className="bg-white border rounded-xl p-3.5 space-y-3 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">French Welcome MP3</span>
                      {welcomeFr ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Uploaded</span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">Default Option</span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center justify-center border border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-lg p-4 cursor-pointer text-center text-slate-500 hover:text-blue-600 transition-all">
                        <Upload className="h-4 w-4 mr-2" />
                        <span className="text-xs font-semibold">Choose French .mp3</span>
                        <input 
                          type="file" 
                          accept="audio/mp3, audio/*" 
                          className="hidden" 
                          onChange={(e) => handleAudioUpload(e, "fr")} 
                        />
                      </label>
                      
                      {welcomeFr && (
                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-150 text-xs gap-3">
                          <audio src={welcomeFr} controls className="h-8 max-w-[130px] sm:max-w-full" />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-500 hover:text-red-700 shrink-0"
                            onClick={() => { setWelcomeFr(""); toast.success("Removed French welcome audio."); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>Back</Button>
                <Button type="button" onClick={async () => { await handleSave(); setCurrentStep(5); }} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save & Continue to Sign-In Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 5: GUEST SIGN-IN AND AUTOMATIONS */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-800">Open House Gate & Lead Sign-In Settings</CardTitle>
              <CardDescription>Setup automatic tablet kiosk registration at entry and text/email follow-ups.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Open House Date</Label>
                  <Input type="date" value={openHouseDate} onChange={e => setOpenHouseDate(e.target.value)} />
                  <p className="text-[10px] text-slate-400 mt-1">Displays as {getFormattedDateHint(openHouseDate)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Open House Hours (Range)</Label>
                  <div className="flex items-center gap-2">
                    <select 
                      className="flex-1 h-10 rounded-md border border-slate-200 px-3 text-sm bg-white"
                      value={openHouseStartTime}
                      onChange={e => setOpenHouseStartTime(e.target.value)}
                    >
                      <option value="">Start</option>
                      {times.map(t => <option key={'start-' + t} value={t}>{t}</option>)}
                    </select>
                    <span>-</span>
                    <select 
                      className="flex-1 h-10 rounded-md border border-slate-200 px-3 text-sm bg-white"
                      value={openHouseEndTime}
                      onChange={e => setOpenHouseEndTime(e.target.value)}
                    >
                      <option value="">End</option>
                      {times.map(t => <option key={'end-' + t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-bold text-sm text-slate-800">Touchless Sign-In & Kiosk Security Gates</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 border rounded-xl flex items-start gap-2.5">
                    <input type="checkbox" defaultChecked id="gate-phone" className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
                    <div>
                      <label htmlFor="gate-phone" className="text-xs font-bold text-slate-800 block">Enforce Phone Gate Verification</label>
                      <p className="text-[10px] text-slate-500 mt-0.5">Captures high intent checked prospects via text code authentication</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-xl flex items-start gap-2.5">
                    <input type="checkbox" defaultChecked id="gate-consent" className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
                    <div>
                      <label htmlFor="gate-consent" className="text-xs font-bold text-slate-800 block">Enforce Opt-In Followup Consent</label>
                      <p className="text-[10px] text-slate-500 mt-0.5">Guarantees TCPA compliance for followups</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(4)}>Back</Button>
                <Button type="button" onClick={async () => { await handleSave(); setCurrentStep(6); }} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save & Continue to Integrations & Webhooks
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 6: BRANDING AND INTEGRATIONS */}
        {currentStep === 6 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-800">Connected Hub & Lead Exporters</CardTitle>
              <CardDescription>Setup target webhooks to automate lead ingestion straight to your active CRM workflows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Zapier or Lead Webhook Endpoint URL</Label>
                <Input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." />
                <p className="text-[10px] text-slate-400">Triggered instantly with name, phone, email, metadata and listing variables upon submission.</p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Document Attachments & Material Delivery</h3>
                  <p className="text-[11px] text-slate-500">Provide legal disclosures, neighborhood guides, or high-quality PDF brochures. Guests can opt-in to instantly receive these documents when they register.</p>
                </div>

                {documents.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {documents.map((docItem, idx) => (
                      <div key={`doc-${idx}`} className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-xl text-xs">
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="font-extrabold text-slate-800 truncate">{docItem.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono truncate">{docItem.url}</span>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center justify-center rounded-lg cursor-pointer"
                          onClick={() => setDocuments(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 border border-dashed rounded-xl bg-slate-50/50">
                    <p className="text-xs text-slate-400 italic">No document files attached to this listing yet.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-600 block">Document Name</Label>
                    <Input 
                      placeholder="e.g. Digital Property Booklet" 
                      value={newDocName} 
                      onChange={e => setNewDocName(e.target.value)} 
                      className="bg-white text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-600 block">URL (PDF / Drive link)</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://example.com/brochure.pdf" 
                        value={newDocUrl} 
                        onChange={e => setNewDocUrl(e.target.value)} 
                        className="bg-white text-xs h-8 flex-1"
                      />
                      <Button 
                        type="button" 
                        className="h-8 text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg flex items-center justify-center cursor-pointer"
                        onClick={() => {
                          if (!newDocName || !newDocUrl) {
                            toast.error("Please provide both document name and URL link");
                            return;
                          }
                          setDocuments(prev => [...prev, { name: newDocName, url: newDocUrl }]);
                          setNewDocName("");
                          setNewDocUrl("");
                          toast.success("Document attached to listing draft!");
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t bg-slate-50/50 -mx-6 -mb-6 p-6">
                <h4 className="font-bold text-sm text-slate-800">Supported CRM Platforms (Real-Time Sync Ready)</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {["HubSpot", "Follow Up Boss", "Salesforce", "Wise Agent", "LionDesk", "kvCORE"].map(crm => {
                    const url = crmLinks[crm] || "https://www.google.com";
                    return (
                      <a 
                        key={'crm-' + crm} 
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white border hover:border-blue-500 hover:text-blue-600 hover:shadow-md transition-all text-xs font-semibold py-2.5 rounded-lg text-slate-700 shadow-sm flex items-center justify-center gap-1 focus:ring-2 focus:ring-blue-100"
                        title={`Open ${crm} URL from spreadsheet/catalog`}
                      >
                        <span>{crm}</span>
                        <ExternalLink className="h-3 w-3 text-slate-400" />
                      </a>
                    );
                  })}
                </div>

                {/* Searchable Dropdown List below */}
                <div ref={crmDropdownRef} className="space-y-2 pt-4 border-t border-slate-200 relative">
                  <Label className="text-xs font-bold text-slate-700 block">Search Additional CRM Catalog</Label>
                  <p className="text-[10px] text-slate-400 -mt-1">Display CRM names (Column A) and link directly to registration or integration setup URLs (Column B) mapped from spreadsheet source.</p>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <Input 
                      type="text" 
                      placeholder="Type to search 25+ CRM platforms..." 
                      value={crmSearchQuery}
                      onChange={e => {
                        setCrmSearchQuery(e.target.value);
                        setIsCrmDropdownOpen(true);
                      }}
                      onFocus={() => setIsCrmDropdownOpen(true)}
                      className="pl-9 pr-8 bg-white border border-slate-200 h-9 text-xs"
                    />
                    {crmSearchQuery && (
                      <button 
                        type="button" 
                        onClick={() => { setCrmSearchQuery(""); setSelectedCrmFromDropdown(null); }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Options */}
                  {isCrmDropdownOpen && (
                    <div className="absolute z-50 mt-1 max-h-48 w-full bg-white border border-slate-200 rounded-lg shadow-xl overflow-y-auto divide-y divide-slate-100">
                      {crmList.filter(item => 
                        item.name.toLowerCase().includes(crmSearchQuery.toLowerCase())
                      ).length === 0 ? (
                        <div className="p-3 text-xs text-slate-400 text-center">No matching CRMs found</div>
                      ) : (
                        crmList.filter(item => 
                          item.name.toLowerCase().includes(crmSearchQuery.toLowerCase())
                        ).map(item => (
                          <div 
                            key={'dropdown-' + item.name}
                            onClick={() => {
                              setSelectedCrmFromDropdown(item);
                              setCrmSearchQuery(item.name);
                              setIsCrmDropdownOpen(false);
                              window.open(item.url, '_blank', 'noopener,noreferrer');
                            }}
                            className="p-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors"
                          >
                            <span className="font-semibold">{item.name}</span>
                            <span className="text-[10px] text-blue-500 flex items-center gap-0.5 font-medium">
                              Select <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Display Selected CRM Details/Link */}
                  {selectedCrmFromDropdown && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-center justify-between mt-2 animate-fade-in">
                      <div className="space-y-0.5">
                        <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Selected Provider</p>
                        <p className="text-xs font-bold text-slate-800">{selectedCrmFromDropdown.name}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[150px] sm:max-w-[200px]">{selectedCrmFromDropdown.url}</p>
                      </div>
                      <a 
                        href={selectedCrmFromDropdown.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <span>Go to {selectedCrmFromDropdown.name}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(5)}>Back</Button>
                <Button type="button" onClick={() => setCurrentStep(7)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Continue to Preview & Finish
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 7: PREVIEW AND PUBLISH */}
        {currentStep === 7 && (
          <Card className="border-emerald-200">
            <CardHeader className="bg-emerald-50/10">
              <CardTitle className="text-slate-800 text-base flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span> Preview Ready to Publish!
              </CardTitle>
              <CardDescription>You can print the flyers, generate QR codes, and trigger live publishing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="bg-slate-50 border p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-6 shadow-sm">
                <div className="h-32 w-32 bg-white flex items-center justify-center border-4 border-slate-900 rounded-xl shrink-0 p-2 shadow-inner">
                  <QRCodeSVG 
                    value={`${window.location.origin}/tour/${activeListingId}`} 
                    size={112}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <h4 className="font-bold text-lg text-slate-800">{address || "Sample Address St"}</h4>
                  <p className="text-xs text-slate-500">{beds || "0"} beds • {baths || "0"} baths • {sqft || "0"} sqft • {price ? "$"+parseFloat(price).toLocaleString() : "Contact for price"}</p>
                  <p className="font-mono text-[10px] uppercase font-black tracking-wider text-blue-600">Live Audio Tour URL Active</p>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(6)}>Back</Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 font-bold"
                >
                  {saving ? "Saving Draft..." : (isEdit ? "Update & Go Live" : "Publish Listing Live")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stepper Navigation controls at bottom when not step 1 */}
        {currentStep > 1 && (
          <div className="pt-4 flex justify-between items-center text-xs text-slate-400 bg-slate-50 -mx-4 -mb-6 p-4 rounded-b-2xl border-t">
            <span>Progress: {Math.round(([1, 2, 3, 4, 5, 6, 7].filter(s => isStepCompleted(s)).length / 7) * 100)}% Complete</span>
            <span className="font-mono">Vertex Ingestion v2.1</span>
          </div>
        )}
      </form>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Image Title</DialogTitle>
            <DialogDescription>
              Give this image a descriptive name for the AI to use during the tour.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="aspect-video rounded-lg overflow-hidden border bg-slate-100 flex items-center justify-center">
              {editingImageIndex !== null && (
                <img 
                  src={images[editingImageIndex].url} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageName" className="font-bold text-slate-700">Image Name</Label>
              <Input 
                id="imageName" 
                value={editingImageName} 
                onChange={(e) => setEditingImageName(e.target.value)} 
                placeholder="e.g. Master Bedroom, Gourmet Kitchen"
                className="h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveImageName} className="bg-blue-600 hover:bg-blue-500 font-bold px-8">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={imageToDeleteIndex !== null} onOpenChange={(open) => !open && setImageToDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Do you really want to delete this image?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-bold text-slate-900">{imageToDeleteIndex !== null ? images[imageToDeleteIndex]?.name : ""}</span> from the listing images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDeleteImage} 
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
