import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { createListing, getListing, updateListing, Listing, deleteListingOp, ListingImage, getOpenHouseSessions, createOpenHouseSession, deleteOpenHouseSession, OpenHouseSession, parseDateTimeToUTC } from "@/lib/api";
import { Loader2, Plus, X, Trash2, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, MoreHorizontal, Pencil, Save, Image as ImageIcon, Sparkles, CheckCircle2, Mic2, Download, Play, Square, Upload, Volume2, Search, ExternalLink, Share2, Share, HelpCircle, Copy, Calendar, Clock, Tv } from "lucide-react";
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
  { name: "Chime (Lofty)", url: "https://lofty.com" },
  { name: "Cloze", url: "https://www.cloze.com" },
  { name: "Contactually", url: "https://www.contactually.com" },
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
        lowerName !== "created at"
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

const formatToParagraphs = (text: string): string => {
  if (!text) return "";
  
  // Split text by existing double newlines to respect current intentional paragraph breaks
  const inputParagraphs = text.split(/\n\s*\n/);
  const finalParagraphs: string[] = [];
  
  inputParagraphs.forEach((para) => {
    const cleanPara = para.replace(/\n+/g, " ").trim();
    if (!cleanPara) return;
    
    // Split sentences inside this paragraph
    const sentences: string[] = cleanPara.match(/[^.!?]+[.!?]+(?:\s+|$)/g) || [];
    
    if (sentences.length === 0) {
      finalParagraphs.push(cleanPara);
      return;
    }
    
    const matchedLength = sentences.reduce((acc, s) => acc + s.length, 0);
    if (matchedLength < cleanPara.length) {
      const leftover = cleanPara.slice(matchedLength).trim();
      if (leftover) {
        sentences.push(leftover);
      }
    }

    let currentGroup: string[] = [];
    sentences.forEach((sentence, idx) => {
      currentGroup.push(sentence.trim());
      if (currentGroup.length === 3 || idx === sentences.length - 1) {
        finalParagraphs.push(currentGroup.join(" "));
        currentGroup = [];
      }
    });
  });
  
  return finalParagraphs.join("\n\n");
};

interface Voice {
  id: string;
  name: string;
  type: string;
  isDefault?: boolean;
}

const INITIAL_VOICES: Voice[] = [
  { id: "2", name: "Professional Female Synthetic (Sora)", type: "Synthetic", isDefault: true },
  { id: "5", name: "Executive British (Female) Synthetic", type: "Synthetic", isDefault: false },
  { id: "7", name: "Dynamic Storyteller (British Female) Synthetic", type: "Synthetic", isDefault: false },
  { id: "3", name: "Warm Energetic Male Synthetic (Puck)", type: "Synthetic", isDefault: false },
  { id: "6", name: "Calm Reassuring Male Synthetic (Charon)", type: "Synthetic", isDefault: false },
  { id: "8", name: "Deep Narrator Synthetic (Fenrir)", type: "Synthetic", isDefault: false },
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

  const [currentStep, setCurrentStep] = useState(() => {
    const stepParam = searchParams.get("step");
    if (stepParam) {
      const parsed = parseInt(stepParam, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 8) {
        return parsed;
      }
    }
    return isEdit ? 2 : 1;
  });
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
  const [postalPlaceholder, setPostalPlaceholder] = useState("90001");
  const [price, setPrice] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [useSqftRange, setUseSqftRange] = useState(false);
  const [sqftMin, setSqftMin] = useState("");
  const [sqftMax, setSqftMax] = useState("");
  const [mlsNumber, setMlsNumber] = useState("");

  const handleSetSqftAndRange = (value: string) => {
    setSqft(value);
    if (value.includes("-")) {
      const parts = value.split("-").map(p => p.trim());
      setUseSqftRange(true);
      setSqftMin(parts[0] || "");
      setSqftMax(parts[1] || "");
    } else {
      setUseSqftRange(false);
      setSqftMin("");
      setSqftMax("");
    }
  };

  const moveTalkingPoint = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === talkingPoints.length - 1) return;
    const newPoints = [...talkingPoints];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newPoints[index];
    newPoints[index] = newPoints[targetIndex];
    newPoints[targetIndex] = temp;
    setTalkingPoints(newPoints);
  };
  const [originatingSystemName, setOriginatingSystemName] = useState("");
  const [country, setCountry] = useState("US");
  const [mlsCountry, setMlsCountry] = useState("US");
  const [brokerageName, setBrokerageName] = useState("");
  const [brokerageLogo, setBrokerageLogo] = useState("");
  const [agentName, setAgentName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ListingImage[]>([]);
  const [newImage, setNewImage] = useState("");
  
  // Custom Welcome Audios State
  const [welcomeEn, setWelcomeEn] = useState("");
  const [welcomeFr, setWelcomeFr] = useState("");

  // Custom Welcome Overrides and Translation workflow States (Removed/Commented out for Settings iFrame migration)
  /*
  const [customWelcomeEn, setCustomWelcomeEn] = useState("");
  const [customWelcomeFr, setCustomWelcomeFr] = useState("");
  const [customWelcomeEs, setCustomWelcomeEs] = useState("");
  const [customWelcomeStatuses, setCustomWelcomeStatuses] = useState<Record<string, string>>({
    en: "none",
    fr: "none",
    es: "none"
  });
  const [savingWelcome, setSavingWelcome] = useState(false);
  const [isRewritingWelcome, setIsRewritingWelcome] = useState(false);

  const handleAiRewriteWelcome = async () => {
    const textToRewrite = customWelcomeEn.trim() || description.trim();
    if (!textToRewrite) {
      toast.error("Please enter a description or some welcome text first.");
      return;
    }

    setIsRewritingWelcome(true);
    try {
      const res = await fetch("/api/shorten-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToRewrite }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.shortenedText) {
          const cleanText = result.shortenedText.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
          const words = cleanText.split(" ");
          let cappedText = cleanText;
          if (words.length > 40) {
            cappedText = words.slice(0, 40).join(" ") + "...";
          }
          setCustomWelcomeEn(cappedText);
          toast.success("Welcome message rewritten and capped to 40 words!");
        } else {
          toast.error("Failed to rewrite. AI did not return valid text.");
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to contact AI rewrite service.");
      }
    } catch (err) {
      console.error("AI Rewrite error:", err);
      toast.error("Error during AI rewrite.");
    } finally {
      setIsRewritingWelcome(false);
    }
  };

  const [savingWelcomeOverride, setSavingWelcomeOverride] = useState(false);

  const handleSaveWelcomeOverride = async () => {
    const targetPropId = isEdit ? listingId! : activeListingId;
    setSavingWelcomeOverride(true);
    try {
      const welcomeSaveRes = await fetch("/api/welcome-messages/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: targetPropId,
          welcomeMessage: customWelcomeEn,
          userId: user?.id
        })
      });
      if (welcomeSaveRes.ok) {
        const welcomeSaveData = await welcomeSaveRes.json();
        if (welcomeSaveData.success) {
          if (customWelcomeEn.trim() === "") {
            setCustomWelcomeEn("");
            setCustomWelcomeFr("");
            setCustomWelcomeEs("");
            setCustomWelcomeStatuses({ en: "none", fr: "none", es: "none" });
            toast.success("Sora Welcome Message Override reverted to default!");
          } else {
            // Refresh custom translations state
            if (welcomeSaveData.translations) {
              setCustomWelcomeEn(welcomeSaveData.translations.en || "");
              setCustomWelcomeFr(welcomeSaveData.translations.fr || "");
              setCustomWelcomeEs(welcomeSaveData.translations.es || "");
              setCustomWelcomeStatuses({
                en: "complete",
                fr: welcomeSaveData.translations.fr ? "complete" : "failed",
                es: welcomeSaveData.translations.es ? "complete" : "failed"
              });
            }
            toast.success("Sora Welcome Message Override and translations saved successfully!");
          }
        } else {
          toast.error(welcomeSaveData.error || "Failed to save welcome message override.");
        }
      } else {
        toast.error("Failed to contact backend translation service.");
      }
    } catch (err) {
      console.error("Error saving welcome message override:", err);
      toast.error("Error saving welcome message override.");
    } finally {
      setSavingWelcomeOverride(false);
    }
  };
  */

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
        // Social share is optional/pre-configured
        return true;
      case 7:
        // Optional integrations
        return true;
      case 8:
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
      displayMessage = "Professional Female Synthetic: 'Hello there, thank you for visiting. I can walk you through the listing details or explain the smart integrations.'";
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
  const [documentToDelete, setDocumentToDelete] = useState<{ index: number; name: string } | null>(null);
  const [newDocName, setNewDocName] = useState("");
  const [newDocUrl, setNewDocUrl] = useState("");
  const [pendingPdfName, setPendingPdfName] = useState("");
  const [openHouseDate, setOpenHouseDate] = useState("");
  const [sessions, setSessions] = useState<OpenHouseSession[]>([]);
  const [openHouseDateFormat, setOpenHouseDateFormat] = useState("Standard");
  const [openHouseStartTime, setOpenHouseStartTime] = useState("");
  const [openHouseEndTime, setOpenHouseEndTime] = useState("");
  const [enforcePhoneGate, setEnforcePhoneGate] = useState(true);
  const [enforceOptInConsent, setEnforceOptInConsent] = useState(true);
  const [socialShareEnabled, setSocialShareEnabled] = useState(true);
  const [socialShareFacebook, setSocialShareFacebook] = useState(true);
  const [socialShareInstagram, setSocialShareInstagram] = useState(true);
  const [socialShareWhatsapp, setSocialShareWhatsapp] = useState(true);
  const [socialShareTextMessage, setSocialShareTextMessage] = useState(true);
  const [socialShareEmail, setSocialShareEmail] = useState(true);
  const [socialShareCopyLink, setSocialShareCopyLink] = useState(true);
  const [qrBrandingOption, setQrBrandingOption] = useState<"logo" | "photo" | "none">("none");
  const agentPhoto = (user as any)?.branding?.agentPhotoUrl || "";
  const [tourDescriptors, setTourDescriptors] = useState<string[]>(new Array(16).fill(""));

  // Automatically sync image labels into tourDescriptors slots (Slot 1, Slot 2, etc.) in real-time
  useEffect(() => {
    if (images && images.length > 0) {
      setTourDescriptors(prev => {
        const next = [...prev];
        let changed = false;
        for (let i = 0; i < 16; i++) {
          if (i < images.length) {
            let name = images[i].name || "";
            name = name.replace(/\.[^/.]+$/, ""); // Strip extensions
            name = name.split(/[_\-\s]+/)
              .filter(Boolean)
              .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(" ");
            const val = name.slice(0, 30);
            if (next[i] !== val) {
              next[i] = val;
              changed = true;
            }
          } else {
            if (next[i] !== "") {
              next[i] = "";
              changed = true;
            }
          }
        }
        return changed ? next : prev;
      });
    } else {
      // If there are no images, make sure descriptors are cleared
      setTourDescriptors(prev => {
        const isAllEmpty = prev.every(v => v === "");
        if (!isAllEmpty) {
          return new Array(16).fill("");
        }
        return prev;
      });
    }
  }, [images]);

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
  const [crmPage, setCrmPage] = useState(0);
  const [selectedCrmFromDropdown, setSelectedCrmFromDropdown] = useState<CRMItem | null>(null);
  const [isCrmDropdownOpen, setIsCrmDropdownOpen] = useState(false);
  const [isCrmModalOpen, setIsCrmModalOpen] = useState(false);
  const crmDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchCRMSpreadsheet() {
      try {
        const response = await fetch("/api/crm-sheet");
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

  const getHourFromTimeString = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [numStr, ampm] = timeStr.split(" ");
    let hr = parseInt(numStr);
    if (ampm === "PM" && hr !== 12) {
      hr += 12;
    } else if (ampm === "AM" && hr === 12) {
      hr = 0;
    }
    return hr;
  };

  const getFirstDayOfCurrentMonth = (): string => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  };

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

  const formatOpenHouseDate = (dateString: string, format: string): string => {
    if (!dateString) return "Select Date";
    try {
      const parts = dateString.split('-');
      if (parts.length !== 3) return dateString;
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      
      if (format === 'MM-DD-YYYY') {
        return `${month}-${day}-${year}`;
      } else if (format === 'DD-MM-YYYY') {
        return `${day}-${month}-${year}`;
      } else if (format === 'YYYY-MM-DD') {
        return `${year}-${month}-${day}`;
      } else {
        // Standard text format: July 5, 2026
        const dateObj = new Date(`${dateString}T00:00:00`);
        return dateObj.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch (e) {
      return dateString;
    }
  };

  const getOpenHousePastError = (): string => {
    if (!openHouseDate) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(openHouseDate + "T00:00:00");
    if (selected < today) {
      return "Error: Selected open house date is in the past";
    }
    
    const todayLocalStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (openHouseDate === todayLocalStr) {
      const currentHr = new Date().getHours();
      if (openHouseStartTime && getHourFromTimeString(openHouseStartTime) < currentHr) {
        return `Error: Start time (${openHouseStartTime}) is in the past for today`;
      }
      if (openHouseEndTime && getHourFromTimeString(openHouseEndTime) < currentHr) {
        return `Error: End time (${openHouseEndTime}) is in the past for today`;
      }
    }
    return "";
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
    }
    if (user?.id) {
       fetchUserBranding();
    }
  }, [listingId, isEdit, user?.id]);

  async function fetchUserBranding() {
     const savedCrmName = localStorage.getItem("user_selected_crm");
     const savedCrmUrl = localStorage.getItem("user_selected_crm_url");
     if (savedCrmName) {
       setSelectedCrmFromDropdown({ name: savedCrmName, url: savedCrmUrl || "https://www.google.com" });
       setCrmSearchQuery(savedCrmName);
     }

     try {
       const userDoc = await getDoc(doc(db, "users", user!.id));
       const userData = userDoc.data();
       if (userData?.branding) {
         setBrokerageLogo(userData.branding.imageUrl || userData.branding.logoUrl || "");
       }
       if (userData?.selectedCRM) {
         setSelectedCrmFromDropdown({ name: userData.selectedCRM, url: userData.selectedCRMUrl || "https://www.google.com" });
         setCrmSearchQuery(userData.selectedCRM);
         localStorage.setItem("user_selected_crm", userData.selectedCRM);
         if (userData.selectedCRMUrl) {
           localStorage.setItem("user_selected_crm_url", userData.selectedCRMUrl);
         }
       }
     } catch (err) {
       console.error("Error fetching user branding:", err);
     }
  }

  const handleAttachCrmToProfile = async (crmName: string, crmUrl: string) => {
    if (!user?.id) {
      toast.error("Please log in to save integration preferences.");
      return;
    }
    try {
      localStorage.setItem("user_selected_crm", crmName);
      localStorage.setItem("user_selected_crm_url", crmUrl);

      const userRef = doc(db, "users", user.id);
      const userSnap = await getDoc(userRef);
      
      const payload = {
        selectedCRM: crmName,
        selectedCRMUrl: crmUrl,
        updatedAt: Date.now()
      };

      if (userSnap.exists()) {
        await updateDoc(userRef, payload);
      } else {
        await setDoc(userRef, {
          id: user.id,
          email: user.email || "",
          name: user.name || "Agent",
          role: user.role || "AGENT",
          createdAt: Date.now(),
          ...payload
        });
      }
      setSelectedCrmFromDropdown({ name: crmName, url: crmUrl });
      setCrmSearchQuery(crmName);
      toast.success(`Connected ${crmName} to your profile integration pipeline!`);
    } catch (error) {
      console.error("Failed to attach CRM to profile:", error);
      setSelectedCrmFromDropdown({ name: crmName, url: crmUrl });
      setCrmSearchQuery(crmName);
      toast.success(`Connected ${crmName} to profile integration pipeline (local sync)!`);
    }
  };

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
        
        if (fetchedPostalCode && fetchedPostalCode !== "NONE") {
          setPostalCode(fetchedPostalCode);
          setPostalPlaceholder(fetchedPostalCode);
        } else {
          setPostalCode("");
          setPostalPlaceholder("NONE");
        }
        
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
        handleSetSqftAndRange(data.sqft?.toString() || "");
        setMlsNumber(data.mlsNumber || "");
        setMlsCountry(data.mlsNumber && /^[A-Z]/i.test(data.mlsNumber) ? "CA" : (data.country || "US"));
        setOriginatingSystemName(data.originatingSystemName || "");
        setCountry(data.country || "US");
        setBrokerageName(data.brokerageName || "");
        if (data.brokerageLogo && !data.brokerageLogo.startsWith('blob:')) {
          setBrokerageLogo(data.brokerageLogo);
        } else {
          setBrokerageLogo("");
        }
        setAgentName(data.agentName || "");
        setDescription(formatToParagraphs(data.description || ""));
        
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
        setVoiceName(data.voiceName && data.voiceId !== "none" ? data.voiceName : "Professional Female Synthetic");
        setTalkingPoints(data.talkingPoints || []);
        
        // Load tour descriptors, ensuring we have exactly 16 slots
        const loadedDescriptors = data.tourDescriptors || [];
        const descriptorsArray = new Array(16).fill("");
        loadedDescriptors.forEach((val: string, idx: number) => {
          if (idx < 16) descriptorsArray[idx] = val;
        });
        setTourDescriptors(descriptorsArray);
        setOpenHouseDate(data.openHouseDate || "");
        setOpenHouseDateFormat(data.openHouseDateFormat || "Standard");
        if (data.openHouseTime) {
          const [start, end] = data.openHouseTime.split(" - ");
          setOpenHouseStartTime(start || "");
          setOpenHouseEndTime(end || "");
        } else {
          setOpenHouseStartTime("");
          setOpenHouseEndTime("");
        }

        // Fetch or migrate open house sessions
        try {
          let sessionsList = await getOpenHouseSessions(id);
          if (sessionsList.length === 0 && data.openHouseDate) {
            const parsed = parseDateTimeToUTC(data.openHouseDate, data.openHouseTime || "");
            const sessionId = `session_${id}_migrated_${Date.now()}`;
            const newSession = await createOpenHouseSession({
              session_id: sessionId,
              listing_id: id,
              start_datetime: parsed.start,
              end_datetime: parsed.end,
              created_by: data.ownerId || user?.id || "unknown",
              created_at: Date.now(),
              updated_at: Date.now()
            });
            sessionsList = [newSession];
            console.log("On-the-fly migrated single open house date to multi-session:", newSession);
          }
          setSessions(sessionsList);
        } catch (err) {
          console.error("Failed to load or migrate open house sessions:", err);
        }

        setWebhookUrl(data.webhookUrl || "");
        setDocuments(data.documents || []);
        setWelcomeEn(data.welcome_en || "");
        setWelcomeFr(data.welcome_fr || "");
        setEnforcePhoneGate(data.enforcePhoneGate !== undefined ? !!data.enforcePhoneGate : true);
        setEnforceOptInConsent(data.enforceOptInConsent !== undefined ? !!data.enforceOptInConsent : true);
        setSocialShareEnabled((data as any).socialShareEnabled !== undefined ? !!(data as any).socialShareEnabled : true);
        if ((data as any).socialShareOptions) {
          setSocialShareFacebook((data as any).socialShareOptions.facebook !== undefined ? !!(data as any).socialShareOptions.facebook : true);
          setSocialShareInstagram((data as any).socialShareOptions.instagram !== undefined ? !!(data as any).socialShareOptions.instagram : true);
          setSocialShareWhatsapp((data as any).socialShareOptions.whatsapp !== undefined ? !!(data as any).socialShareOptions.whatsapp : true);
          setSocialShareTextMessage((data as any).socialShareOptions.textMessage !== undefined ? !!(data as any).socialShareOptions.textMessage : true);
          setSocialShareEmail((data as any).socialShareOptions.email !== undefined ? !!(data as any).socialShareOptions.email : true);
          setSocialShareCopyLink((data as any).socialShareOptions.copyLink !== undefined ? !!(data as any).socialShareOptions.copyLink : true);
        } else {
          setSocialShareFacebook(true);
          setSocialShareInstagram(true);
          setSocialShareWhatsapp(true);
          setSocialShareTextMessage(true);
          setSocialShareEmail(true);
          setSocialShareCopyLink(true);
        }
        setQrBrandingOption((data as any).qrBrandingOption || "none");

        // Fetch custom welcome overrides if any (Removed/Commented out for Settings iFrame migration)
        /*
        try {
          const welcomeRes = await fetch(`/api/welcome-messages/property/${id}`);
          if (welcomeRes.ok) {
            const welcomeData = await welcomeRes.json();
            if (welcomeData.success && welcomeData.welcomeMessages) {
              const messages = welcomeData.welcomeMessages;
              let customEn = messages.en?.text_value || "";
              if (!customEn && data.description) {
                const cleanDesc = data.description.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
                const words = cleanDesc.split(" ");
                if (words.length > 40) {
                  customEn = words.slice(0, 40).join(" ") + "...";
                } else {
                  customEn = cleanDesc;
                }
              }
              setCustomWelcomeEn(customEn);
              setCustomWelcomeFr(messages.fr?.text_value || "");
              setCustomWelcomeEs(messages.es?.text_value || "");
              setCustomWelcomeStatuses({
                en: messages.en?.translation_status || "none",
                fr: messages.fr?.translation_status || "none",
                es: messages.es?.translation_status || "none"
              });
            } else if (data.description) {
              const cleanDesc = data.description.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
              const words = cleanDesc.split(" ");
              const customEn = words.length > 40 ? (words.slice(0, 40).join(" ") + "...") : cleanDesc;
              setCustomWelcomeEn(customEn);
            }
          } else if (data.description) {
            const cleanDesc = data.description.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
            const words = cleanDesc.split(" ");
            const customEn = words.length > 40 ? (words.slice(0, 40).join(" ") + "...") : cleanDesc;
            setCustomWelcomeEn(customEn);
          }
        } catch (err) {
          console.warn("Failed to load custom welcome message overrides:", err);
          if (data.description) {
            const cleanDesc = data.description.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
            const words = cleanDesc.split(" ");
            const customEn = words.length > 40 ? (words.slice(0, 40).join(" ") + "...") : cleanDesc;
            setCustomWelcomeEn(customEn);
          }
        }
        */
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
            // Default to "Professional Female Synthetic" (id: "2")
            setVoiceId("2");
            setVoiceName("Professional Female Synthetic");
          }
        } catch (err) {
          console.error("Error fetching default voice:", err);
        }
      };
      fetchDefaults();
    }
  }, [isEdit, user?.id]);

  const [isIngesting, setIsIngesting] = useState(false);
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!isIngesting) {
      setDisplayedText("");
      return;
    }
    const fullText = "AI Open House Connect";
    let currentIndex = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        currentIndex = 0;
        setDisplayedText("");
      }
    }, 150);
    return () => clearInterval(interval);
  }, [isIngesting]);

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
    setIsIngesting(true);
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
        
        if (data.originatingSystemName) setOriginatingSystemName(data.originatingSystemName);
        if (data.country) {
          setCountry(data.country);
          setMlsCountry(data.mlsNumber && /^[A-Z]/i.test(data.mlsNumber) ? "CA" : data.country);
        }
        if (data.agentName) setAgentName(data.agentName);

        // Try to parse address components as fallback ONLY if they are still missing
        let parsedZip = "";
        if (ingestedAddress && (!ingestedCity || !ingestedProvince || !ingestedPostalCode)) {
          const parts = ingestedAddress.split(',').map(p => p.trim());
          if (parts.length >= 3) {
            if (!ingestedCity && !city) setCity(parts[1]);
            const lastPart = parts[parts.length - 1];
            const stateZipMatch = lastPart.match(/^([A-Z]{2})\s+(.*)$/i);
            if (stateZipMatch) {
              if (!ingestedProvince && !province) setProvince(stateZipMatch[1]);
              if (!ingestedPostalCode && !postalCode) parsedZip = stateZipMatch[2];
            } else if (parts.length === 4) {
               if (!ingestedProvince && !province) setProvince(parts[2]);
               if (!ingestedPostalCode && !postalCode) parsedZip = parts[3];
            }
          }
        }

        const finalPostalCode = ingestedPostalCode || parsedZip;
        if (finalPostalCode) {
          setPostalCode(finalPostalCode);
          setPostalPlaceholder(finalPostalCode);
        } else {
          setPostalCode("");
          setPostalPlaceholder("NONE");
        }
        
        if (data.price) setPrice(data.price.toString());
        if (data.beds) setBeds(data.beds.toString());
        if (data.baths) setBaths(data.baths.toString());
        if (data.sqft) handleSetSqftAndRange(data.sqft.toString());
        if (data.mlsNumber) setMlsNumber(data.mlsNumber);
        if (data.brokerageName) setBrokerageName(data.brokerageName);
        if (data.agentName) setAgentName(data.agentName);
        if (data.description) {
          const formattedDesc = formatToParagraphs(data.description);
          setDescription(formattedDesc);
          
          const paragraphs = formattedDesc.split("\n\n").map(p => p.trim()).filter(p => p !== "");
          const firstPara = paragraphs[0] || formattedDesc.split("\n").map(p => p.trim()).filter(p => p !== "")[0] || formattedDesc || "";
          
          /*
          if (firstPara) {
            setCustomWelcomeEn(firstPara);
            
            // Trigger automatic translation & save of this welcome message override
            const targetPropId = isEdit ? listingId! : activeListingId;
            try {
              const welcomeSaveRes = await fetch("/api/welcome-messages/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  propertyId: targetPropId,
                  welcomeMessage: firstPara,
                  userId: user?.id
                })
              });
              if (welcomeSaveRes.ok) {
                const welcomeSaveData = await welcomeSaveRes.json();
                if (welcomeSaveData.success && welcomeSaveData.translations) {
                  setCustomWelcomeEn(welcomeSaveData.translations.en || firstPara);
                  setCustomWelcomeFr(welcomeSaveData.translations.fr || "");
                  setCustomWelcomeEs(welcomeSaveData.translations.es || "");
                  setCustomWelcomeStatuses({
                    en: "complete",
                    fr: welcomeSaveData.translations.fr ? "complete" : "failed",
                    es: welcomeSaveData.translations.es ? "complete" : "failed"
                  });
                }
              }
            } catch (err) {
              console.error("Error auto-saving welcome message during ingest:", err);
            }
          }
          */
        }
        
        if (data.images && data.images.length > 0) {
          const normalized = data.images.slice(0, 30).map((img, idx) => {
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

        // Extract and normalize Open House Date and Times from ingested data
        if (data.openHouseDate) {
          setOpenHouseDate(data.openHouseDate);
          toast.success(`Found Open House Date: ${data.openHouseDate}`);
        }
        if (data.openHouseStartTime) {
          const normalizeExtractedTime = (timeStr: string): string => {
            if (!timeStr) return "";
            let clean = timeStr.trim().toUpperCase();
            if (/^\d{1,2}(:\d{2})?$/.test(clean)) {
              const hr = parseInt(clean.split(':')[0]);
              if (hr >= 12) {
                return (hr === 12 ? 12 : hr - 12) + " PM";
              } else {
                return (hr === 0 ? 12 : hr) + " AM";
              }
            }
            const match = clean.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/);
            if (match) {
              const hr = parseInt(match[1]);
              const ampm = match[3];
              return `${hr} ${ampm}`;
            }
            return timeStr;
          };
          const normStart = normalizeExtractedTime(data.openHouseStartTime);
          if (times.includes(normStart)) {
            setOpenHouseStartTime(normStart);
          }
          if (data.openHouseEndTime) {
            const normEnd = normalizeExtractedTime(data.openHouseEndTime);
            if (times.includes(normEnd)) {
              setOpenHouseEndTime(normEnd);
            }
          }
        }

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
      setIsIngesting(false);
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

  const autoFillDescriptorsFromImages = (imgsList = images) => {
    const updated = [...tourDescriptors];
    for (let i = 0; i < 16; i++) {
      if (i < imgsList.length) {
        let name = imgsList[i].name || "";
        name = name.replace(/\.[^/.]+$/, "");
        name = name.split(/[_\-\s]+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        updated[i] = name.slice(0, 30);
      } else {
        updated[i] = "";
      }
    }
    setTourDescriptors(updated);
    toast.success("Descriptors auto-filled from photo labels!");
  };

  const moveImageInListing = async (index: number, direction: 'left' | 'right' | 'up' | 'down') => {
    const updated = [...images];
    let targetIndex = index;
    if (direction === 'left') {
      targetIndex = index - 1;
    } else if (direction === 'right') {
      targetIndex = index + 1;
    } else if (direction === 'up') {
      targetIndex = index - 2; // grid is 2 cols
    } else if (direction === 'down') {
      targetIndex = index + 2;
    }

    if (targetIndex >= 0 && targetIndex < updated.length) {
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      setImages(updated);

      if (isEdit && listingId) {
        const tid = toast.loading("Saving new image layout order...");
        try {
          await updateListing(listingId, { images: updated });
          toast.dismiss(tid);
          toast.success(`Image moved ${direction} successfully and auto-saved!`);
        } catch (err) {
          toast.dismiss(tid);
          toast.error("Failed to auto-save image order.");
        }
      } else {
        toast.success(`Image moved ${direction} in drafts`);
      }
    } else {
      toast.warning(`Cannot move image ${direction} from this position.`);
    }
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

  async function handleSave(e?: React.FormEvent, nextStepOverride?: number): Promise<boolean> {
    if (e) e.preventDefault();
    if (!address) {
      toast.error("Address is required");
      return false;
    }

    // Validations
    const numericPrice = price ? parseInt(price) : 0;
    if (price && (isNaN(numericPrice) || numericPrice <= 0)) {
      toast.error("Price must be a positive number");
      return false;
    }

    if (useSqftRange) {
      if (!sqftMin || !sqftMax) {
        toast.error("Please enter both minimum and maximum square feet");
        return false;
      }
      const minNum = parseInt(sqftMin);
      const maxNum = parseInt(sqftMax);
      if (isNaN(minNum) || isNaN(maxNum) || minNum >= 50000 || maxNum >= 50000) {
        toast.error("Square feet must be realistic numbers (less than 50,000)");
        return false;
      }
      if (minNum > maxNum) {
        toast.error("Minimum square feet cannot be greater than maximum square feet");
        return false;
      }
    } else {
      const numericSqft = sqft ? parseInt(sqft) : 0;
      if (sqft && (isNaN(numericSqft) || numericSqft >= 50000)) {
        toast.error("Square feet must be a realistic number (less than 50,000)");
        return false;
      }
    }

    if (mlsNumber) {
      if (mlsCountry === "US") {
        if (!/^\d{8}$/.test(mlsNumber)) {
          toast.error("Invalid USA MLS Number format. Must be exactly 8 digits (purely numeric, e.g. 12345678).");
          return false;
        }
      } else {
        if (!/^[A-Z]\d{8}$/i.test(mlsNumber)) {
          toast.error("Invalid Canadian MLS Number format. Must be a single letter followed by 8 digits (e.g. X12345678).");
          return false;
        }
      }
    }

    let formattedPostalCode = postalCode.trim();
    if (formattedPostalCode === "") {
      if (postalPlaceholder === "NONE") {
        formattedPostalCode = "NONE";
      } else {
        toast.error("Zip/Postal Code is missing. Please provide a valid entry.");
        return false;
      }
    }

    if (formattedPostalCode !== "NONE") {
      if (country === 'CA') {
        formattedPostalCode = formattedPostalCode.toUpperCase();
        // Auto-format: Add space if missing (A1A1A1 -> A1A 1A1)
        if (formattedPostalCode.length === 6 && !formattedPostalCode.includes(' ')) {
          formattedPostalCode = formattedPostalCode.slice(0, 3) + ' ' + formattedPostalCode.slice(3);
        }
        
        const caRegex = /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ ]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
        if (formattedPostalCode && !caRegex.test(formattedPostalCode)) {
          toast.error("Invalid Canadian Postal Code (Format: A1A 1A1). Note: D, F, I, O, Q, U are not used.");
          return false;
        }
      } else {
        const usRegex = /^\d{5}(-\d{4})?$/;
        if (formattedPostalCode && !usRegex.test(formattedPostalCode)) {
          toast.error("Invalid US Zip Code (Format: 12345 or 12345-6789)");
          return false;
        }
      }
    }
    
    setSaving(true);
    try {
      const formattedDescription = formatToParagraphs(description);
      setDescription(formattedDescription);

      let finalSqft: any = null;
      if (useSqftRange) {
        finalSqft = `${sqftMin} - ${sqftMax}`;
      } else {
        finalSqft = sqft ? parseInt(sqft) : null;
      }

      const payload: Partial<Listing> = {
        address: address || "",
        city: city || "",
        province: province || "",
        postalCode: formattedPostalCode || "",
        price: price ? parseInt(price) : null,
        beds: beds ? parseInt(beds) : null,
        baths: baths ? parseInt(baths) : null,
        sqft: finalSqft,
        mlsNumber: mlsNumber.toUpperCase() || "",
        mlsCountry: mlsCountry || "US",
        originatingSystemName: originatingSystemName || "",
        country: country || "US",
        brokerageName: brokerageName || "",
        brokerageLogo: brokerageLogo || "",
        agentName: agentName || "",
        description: formattedDescription || "",
        images: images || [],
        talkingPoints: talkingPoints || [],
        tourDescriptors: tourDescriptors.filter(d => d.trim() !== ""),
        webhookUrl: webhookUrl || "",
        documents: documents || [],
        voiceId: voiceId || "",
        voiceName: voiceName || "",
        welcome_en: welcomeEn || "Hi, I'm Sora, your AI property assistant. This tour shows how I connect listings, answer client questions, book showings, and run your open house gate and lead sign-in. Tap each step to follow along.",
        welcome_fr: welcomeFr || "Bonjour, je suis Sora, votre assistante immobilière IA. Cette visite guidée vous montre comment je mets en relation les annonces, réponds aux questions des clients, planifie les visites et gère l'accueil des visiteurs lors des journées portes ouvertes et l'inscription des prospects. Touchez chaque étape pour suivre le tutoriel.",
        openHouseDate: openHouseDate || "",
        openHouseDateFormat: openHouseDateFormat || "Standard",
        openHouseTime: (openHouseStartTime && openHouseEndTime) ? `${openHouseStartTime} - ${openHouseEndTime}` : "",
        enforcePhoneGate: !!enforcePhoneGate,
        enforceOptInConsent: !!enforceOptInConsent,
        qrBrandingOption: qrBrandingOption || "none",
        socialShareEnabled: !!socialShareEnabled,
        socialShareOptions: {
          facebook: !!socialShareFacebook,
          instagram: !!socialShareInstagram,
          whatsapp: !!socialShareWhatsapp,
          textMessage: !!socialShareTextMessage,
          email: !!socialShareEmail,
          copyLink: !!socialShareCopyLink,
        },
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
          status: "Active",
          ...payload
        } as Listing;
        
        await createListing(fullPayload);
        
        toast.success("Listing created");
        const targetStep = nextStepOverride || currentStep;
        navigate(`/app/listings/edit/${newId}?step=${targetStep}`);
      }

      // Trigger saving the custom welcome overrides (Removed/Commented out for Settings iFrame migration)
      /*
      const targetPropId = isEdit ? listingId! : activeListingId;
      try {
        const welcomeSaveRes = await fetch("/api/welcome-messages/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: targetPropId,
            welcomeMessage: customWelcomeEn,
            userId: user?.id
          })
        });
        if (welcomeSaveRes.ok) {
          const welcomeSaveData = await welcomeSaveRes.json();
          if (welcomeSaveData.success) {
            if (customWelcomeEn.trim() === "") {
              setCustomWelcomeEn("");
              setCustomWelcomeFr("");
              setCustomWelcomeEs("");
              setCustomWelcomeStatuses({ en: "none", fr: "none", es: "none" });
            } else {
              // Refresh custom translations state
              if (welcomeSaveData.translations) {
                setCustomWelcomeEn(welcomeSaveData.translations.en || "");
                setCustomWelcomeFr(welcomeSaveData.translations.fr || "");
                setCustomWelcomeEs(welcomeSaveData.translations.es || "");
                setCustomWelcomeStatuses({
                  en: "complete",
                  fr: welcomeSaveData.translations.fr ? "complete" : "failed",
                  es: welcomeSaveData.translations.es ? "complete" : "failed"
                });
              }
            }
          }
        }
      } catch (welcomeErr) {
        console.error("Welcome save error:", welcomeErr);
      }
      */

      // Synchronize to shared LocalStorage `"open_house_events"`
      try {
        let localEvents: any[] = [];
        const saved = localStorage.getItem("open_house_events");
        if (saved) {
          localEvents = JSON.parse(saved);
        }
        
        const targetListingId = isEdit ? listingId! : activeListingId;
        const existingIndex = localEvents.findIndex((evt: any) => evt.listingId === targetListingId);
        
        if (openHouseDate) {
          const matchedEvent = existingIndex > -1 ? localEvents[existingIndex] : null;
          const eventPayload = {
            id: matchedEvent?.id || `event_${targetListingId}_${Date.now()}`,
            eventName: matchedEvent?.eventName || `${address} Open House`,
            listingId: targetListingId,
            listingAddress: address,
            eventDate: openHouseDate,
            startTime: openHouseStartTime || "09:00 AM",
            endTime: openHouseEndTime || "12:00 PM",
            hostAgent: agentName || user?.name || "Agent",
            eventMode: matchedEvent?.eventMode || "Hybrid",
            gateToggle: !!enforcePhoneGate || !!enforceOptInConsent,
            qrBrandingOption: qrBrandingOption || "none",
            aiTourLinked: matchedEvent?.aiTourLinked !== undefined ? matchedEvent.aiTourLinked : true,
            lenderShown: matchedEvent?.lenderShown !== undefined ? matchedEvent.lenderShown : true,
            mortgageQuestion: matchedEvent?.mortgageQuestion !== undefined ? matchedEvent.mortgageQuestion : true,
            agentNotes: matchedEvent?.agentNotes || "Synchronized from Listing settings.",
            createdAt: matchedEvent?.createdAt || Date.now()
          };
          
          if (existingIndex > -1) {
            localEvents[existingIndex] = eventPayload;
          } else {
            localEvents.unshift(eventPayload);
          }
        } else {
          // If openHouseDate was cleared, remove the event
          if (existingIndex > -1) {
            localEvents.splice(existingIndex, 1);
          }
        }
        localStorage.setItem("open_house_events", JSON.stringify(localEvents));
      } catch (e) {
        console.error("Failed to sync open_house_events in local storage", e);
      }
      return true;
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
      return false;
    } finally {
      setSaving(false);
    }
  }

  const updateListingPrimaryFromSessions = async (sessionList: OpenHouseSession[]) => {
    const nowStr = new Date().toISOString();
    const scheduled = sessionList.filter(s => s.end_datetime > nowStr);
    
    scheduled.sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
    
    let targetSession = scheduled[0];
    if (!targetSession && sessionList.length > 0) {
      const sortedAll = [...sessionList].sort((a, b) => b.start_datetime.localeCompare(a.start_datetime));
      targetSession = sortedAll[0];
    }
    
    const targetListingId = isEdit ? listingId! : activeListingId;
    
    if (targetSession) {
      const startDate = new Date(targetSession.start_datetime);
      const endDate = new Date(targetSession.end_datetime);
      
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, "0");
      const day = String(startDate.getDate()).padStart(2, "0");
      const dateLocalStr = `${year}-${month}-${day}`;
      
      const formatTimeLocal = (d: Date) => {
        let h = d.getHours();
        const m = String(d.getMinutes()).padStart(2, "0");
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12;
        h = h ? h : 12;
        return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
      };
      
      const timeRangeStr = `${formatTimeLocal(startDate)} - ${formatTimeLocal(endDate)}`;
      
      try {
        const listingDoc = await getDoc(doc(db, "listings", targetListingId));
        if (listingDoc.exists()) {
          await updateListing(targetListingId, {
            openHouseDate: dateLocalStr,
            openHouseTime: timeRangeStr
          });
        } else {
          await setDoc(doc(db, "listings", targetListingId), {
            id: targetListingId,
            ownerId: user?.id || "unknown",
            openHouseDate: dateLocalStr,
            openHouseTime: timeRangeStr,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }, { merge: true });
        }
      } catch (err) {
        console.error("Failed to update listing on session update:", err);
      }
      setOpenHouseDate(dateLocalStr);
    } else {
      try {
        const listingDoc = await getDoc(doc(db, "listings", targetListingId));
        if (listingDoc.exists()) {
          await updateListing(targetListingId, {
            openHouseDate: "",
            openHouseTime: ""
          });
        } else {
          await setDoc(doc(db, "listings", targetListingId), {
            id: targetListingId,
            openHouseDate: "",
            openHouseTime: ""
          }, { merge: true });
        }
      } catch (err) {
        console.error("Failed to clear listing open house dates:", err);
      }
      setOpenHouseDate("");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteOpenHouseSession(sessionId);
      const updated = sessions.filter(s => s.session_id !== sessionId);
      setSessions(updated);
      toast.success("Open house session removed");
      await updateListingPrimaryFromSessions(updated);
    } catch (err) {
      console.error("Failed to delete session", err);
      toast.error("Failed to delete session");
    }
  };

  const handleAddSession = async () => {
    if (!openHouseDate) {
      toast.error("Please select a date first");
      return;
    }
    if (!openHouseStartTime || !openHouseEndTime) {
      toast.error("Please select start and end hours");
      return;
    }
    
    // Validate if date is unreasonably far in the past or future (safeguard for typos)
    const parsedDate = new Date(openHouseDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const minExpectedDate = new Date("2020-01-01T00:00:00");
    const maxExpectedDate = new Date();
    maxExpectedDate.setFullYear(today.getFullYear() + 10);
    maxExpectedDate.setHours(23, 59, 59, 999);
    
    if (isNaN(parsedDate.getTime()) || parsedDate < minExpectedDate || parsedDate > maxExpectedDate) {
      toast.error(`Please enter a valid date. [${openHouseDate}] appears to be outside the expected range.`);
      return;
    }
    
    const parsed = parseDateTimeToUTC(openHouseDate, `${openHouseStartTime} - ${openHouseEndTime}`);
    if (parsed.start >= parsed.end) {
      toast.error("Start time must be before end time");
      return;
    }
    
    const targetListingId = isEdit ? listingId! : activeListingId;
    const sessionId = `session_${targetListingId}_${Date.now()}`;
    const newSession: Omit<OpenHouseSession, "status"> = {
      session_id: sessionId,
      listing_id: targetListingId,
      start_datetime: parsed.start,
      end_datetime: parsed.end,
      created_by: user?.id || "agent",
      created_at: Date.now(),
      updated_at: Date.now()
    };
    
    try {
      const saved = await createOpenHouseSession(newSession);
      const updatedSessions = [...sessions, saved];
      setSessions(updatedSessions);
      toast.success("Open house session added successfully!");
      
      // Clear inputs
      setOpenHouseDate("");
      setOpenHouseStartTime("");
      setOpenHouseEndTime("");
      
      await updateListingPrimaryFromSessions(updatedSessions);
    } catch (err: any) {
      console.error("Failed to add session (Internal Error Log):", err);
      let details = "Please verify your input or check permissions.";
      try {
        if (err?.message) {
          const parsedErr = JSON.parse(err.message);
          if (parsedErr && parsedErr.error) {
            details = parsedErr.error;
          }
        }
      } catch (e) {
        if (err?.message) {
          details = err.message;
        }
      }
      toast.error(`Failed to add session: ${details}`);
    }
  };

  async function handleDelete() {
    try {
      await deleteListingOp(listingId!);
      
      // Clean up local open house events
      try {
        const saved = localStorage.getItem("open_house_events");
        if (saved) {
          const events = JSON.parse(saved);
          const filtered = events.filter((evt: any) => evt.listingId !== listingId);
          localStorage.setItem("open_house_events", JSON.stringify(filtered));
        }
      } catch (e) {
        console.error(e);
      }

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
      {isIngesting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center z-50">
          <div className="bg-white/95 border border-slate-200 p-8 rounded-2xl shadow-2xl flex flex-col items-center justify-center max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 h-16 w-16 rounded-full bg-blue-100 animate-ping opacity-75"></div>
              <div className="relative h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                <Sparkles className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Sora AI is Ingesting</h3>
              <p className="text-sm text-slate-500">Structuring parameters, normalizing fields, and generating welcome audio...</p>
            </div>
            <div className="bg-slate-50/50 px-6 py-4 rounded-xl border border-slate-100 w-full flex items-center justify-center min-h-[4rem]">
              <span className="font-mono text-xl font-extrabold text-[#155dfc] tracking-wider after:content-['|'] after:animate-pulse after:ml-0.5 after:text-blue-500">
                {displayedText}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              <span>Connected to Firecrawl Ingestion Pipeline</span>
            </div>
          </div>
        </div>
      )}
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
            {isEdit && listingId && (
              <div className="text-xs text-slate-900 font-mono mt-1 flex items-center gap-1">
                Listing ID: {listingId}
                <button 
                  onClick={() => navigator.clipboard.writeText(listingId)}
                  className="hover:text-slate-600 transition-colors"
                  title="Copy ID"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            )}
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
          <span>STEP {currentStep} OF 8</span>
          <span className="text-blue-600 font-mono">
            {currentStep === 1 && "Choose Setup Mode"}
            {currentStep === 2 && "Review Extracted Listing Data"}
            {currentStep === 3 && "Label Room & View Assets"}
            {currentStep === 4 && "Configure AI Voice & Behavior"}
            {currentStep === 5 && "Configure Guest Sign-In & Flyers"}
            {currentStep === 6 && "Social Share Setup"}
            {currentStep === 7 && "Branding, Integrity & CRMs"}
            {currentStep === 8 && "Interactive Preview & Publish Live"}
          </span>
        </div>
        <div className="grid grid-cols-8 gap-1.5 sm:gap-2 h-2.5 rounded-full overflow-hidden bg-slate-100">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
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
        <div className="hidden sm:grid grid-cols-8 gap-2 text-[10px] uppercase font-black tracking-widest mt-3 text-center">
          {[
            { id: 1, label: "Setup Method" },
            { id: 2, label: "Basic Info" },
            { id: 3, label: "Assets & Labels" },
            { id: 4, label: "AI Voices" },
            { id: 5, label: "Sign-In + Open House" },
            { id: 6, label: "Social Share" },
            { id: 7, label: "CRMs & APIs" },
            { id: 8, label: "Live Preview" }
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
                Save & Continue
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-4">
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
                  <Input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder={postalPlaceholder} />
                </div>
                <div className="space-y-2 col-span-1">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brokerage Name</Label>
                  <Input value={brokerageName} onChange={e => setBrokerageName(e.target.value)} placeholder="Century 21, Sotheby's, etc." />
                </div>
                <div className="space-y-2">
                  <Label>Agent Attribution Name</Label>
                  <Input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Jane Doe" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Left side: Price, Beds & Baths */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Price ($)</Label>
                    <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="850000" />
                  </div>
                  
                  {/* Beds and Baths sharing a row - condensed to 50% width combined */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Beds</Label>
                      <Input type="number" value={beds} onChange={e => setBeds(e.target.value)} placeholder="3" />
                    </div>
                    <div className="space-y-2">
                      <Label>Baths</Label>
                      <Input type="number" value={baths} onChange={e => setBaths(e.target.value)} placeholder="2.5" />
                    </div>
                  </div>
                </div>

                {/* Right side: Sq Ft configuration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-1">
                    <Label className="font-semibold text-slate-800">Square Footage</Label>
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="checkbox" 
                        id="useSqftRange"
                        checked={useSqftRange}
                        onChange={e => setUseSqftRange(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[#155dfc] focus:ring-[#155dfc] cursor-pointer"
                      />
                      <label htmlFor="useSqftRange" className="text-xs font-medium text-slate-600 select-none cursor-pointer">
                        Use Range (e.g. 1500 - 2000)
                      </label>
                    </div>
                  </div>

                  {!useSqftRange ? (
                    <div className="space-y-2">
                      <Label>Sq Ft</Label>
                      <Input 
                        type="text" 
                        value={sqft} 
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, "");
                          if (val.length <= 4) {
                            setSqft(val);
                          }
                        }} 
                        placeholder="2400" 
                      />
                      <p className="text-[10px] text-slate-400">Enter up to 4 numbers</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Square Feet Range</Label>
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <div className="space-y-1">
                          <Input 
                            type="text" 
                            value={sqftMin} 
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (val.length <= 4) {
                                setSqftMin(val);
                              }
                            }} 
                            placeholder="1700" 
                          />
                          <p className="text-[10px] text-slate-400">Min (up to 4 numbers)</p>
                        </div>
                        <div className="space-y-1">
                          <Input 
                            type="text" 
                            value={sqftMax} 
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (val.length <= 4) {
                                setSqftMax(val);
                              }
                            }} 
                            placeholder="2000" 
                          />
                          <p className="text-[10px] text-slate-400">Max (up to 4 numbers)</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 text-left">
                  <Label>MLS® Format Country</Label>
                  <select 
                    value={mlsCountry} 
                    onChange={e => {
                      setMlsCountry(e.target.value);
                      setMlsNumber("");
                    }}
                    className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                  >
                    <option value="US">USA Format (Purely Numeric)</option>
                    <option value="CA">Canada Format (Letter + Digits)</option>
                  </select>
                </div>
                <div className="space-y-2 text-left">
                  <Label>MLS® Number</Label>
                  <Input 
                    value={mlsNumber} 
                    onChange={e => {
                      const val = e.target.value;
                      if (mlsCountry === "US") {
                        const filtered = val.replace(/\D/g, "").slice(0, 8);
                        setMlsNumber(filtered);
                      } else {
                        const upperVal = val.toUpperCase();
                        if (upperVal.length === 0) {
                          setMlsNumber("");
                        } else {
                          const firstChar = upperVal[0];
                          const restChars = upperVal.slice(1).replace(/\D/g, "").slice(0, 8);
                          if (/[A-Z]/i.test(firstChar)) {
                            setMlsNumber(firstChar + restChars);
                          } else {
                            setMlsNumber(restChars);
                          }
                        }
                      }
                    }} 
                    placeholder={mlsCountry === "US" ? "e.g. 12345678" : "e.g. X12345678"} 
                    maxLength={mlsCountry === "US" ? 8 : 9}
                  />
                  <p className="text-[10px] text-slate-400">
                    {mlsCountry === "US" 
                      ? "USA: Purely numeric (8 digits)" 
                      : "Canada: Single letter followed by 8 digits"}
                  </p>
                </div>
                <div className="space-y-2 text-left">
                  <Label>MLS Board / Originating System</Label>
                  <Input value={originatingSystemName} onChange={e => setOriginatingSystemName(e.target.value)} placeholder="e.g. CRISNet" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex justify-between items-center">
                  <span>Description</span>
                  <span className="text-[10px] font-mono font-medium text-slate-400">Formatted as max 3 sentences per paragraph</span>
                </Label>
                <Textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  onBlur={() => setDescription(formatToParagraphs(description))} 
                  rows={6} 
                  placeholder="Luxury property info..." 
                  className="font-sans leading-relaxed"
                />
              </div>

              {/* SORA WELCOME MESSAGE OVERRIDES REMOVED FOR SETTINGS iFRAME MIGRATION */}


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
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {talkingPoints.map((pt, i) => (
                    <div 
                      key={'point-' + pt + i} 
                      className="group flex justify-between items-center text-sm text-slate-700 bg-slate-50 hover:bg-slate-100/80 p-3 border border-slate-200 rounded-lg transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-medium truncate text-slate-800" title={pt}>{pt}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => moveTalkingPoint(i, 'up')}
                          className="h-7 w-7 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                          disabled={i === 0}
                          title="Move Up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => moveTalkingPoint(i, 'down')}
                          className="h-7 w-7 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                          disabled={i === talkingPoints.length - 1}
                          title="Move Down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <div className="h-4 w-[1px] bg-slate-200 mx-0.5" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setTalkingPoints(talkingPoints.filter((_, idx) => idx !== i))}
                          className="h-7 w-7 rounded-md hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors"
                          title="Remove Highlight"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {talkingPoints.length === 0 && (
                    <div className="text-center py-6 border border-dashed rounded-lg text-slate-400 text-xs">
                      No highlights added yet. Add key selling features above to build your tour talking points.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                <Button 
                  type="button" 
                  onClick={async () => { 
                    const success = await handleSave(undefined, 3); 
                    if (success) {
                      setCurrentStep(3); 
                      navigate(`/app/listings/edit/${listingId || activeListingId}?step=3`);
                    }
                  }} 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save & Continue
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
                <div className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 p-3 rounded-xl font-medium mt-2 animate-in fade-in duration-150 relative">
                  ℹ️ <strong>NOTICE:</strong> The first image in the top-left row is the designated header image for the print-ready marketing flyer.
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
                      
                      {/* Interactive re-order controller overlays on top-left */}
                      <div className="absolute top-2 left-2 flex gap-1 bg-black/60 backdrop-blur-xs p-1 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => moveImageInListing(i, 'left')}
                          className="h-6 w-6 rounded-full bg-white/20 hover:bg-white text-white hover:text-black p-0 cursor-pointer"
                          disabled={i === 0}
                          title="Move Left"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => moveImageInListing(i, 'right')}
                          className="h-6 w-6 rounded-full bg-white/20 hover:bg-white text-white hover:text-black p-0 cursor-pointer"
                          disabled={i === images.length - 1}
                          title="Move Right"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => moveImageInListing(i, 'up')}
                          className="h-6 w-6 rounded-full bg-white/20 hover:bg-white text-white hover:text-black p-0 cursor-pointer"
                          disabled={i < 2}
                          title="Move Up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => moveImageInListing(i, 'down')}
                          className="h-6 w-6 rounded-full bg-white/20 hover:bg-white text-white hover:text-black p-0 cursor-pointer"
                          disabled={i >= images.length - 2}
                          title="Move Down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>

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
                  <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                    Media Room-Labeler/Assets
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Automated
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    This section automatically maps physical asset and property features from photo labels to guide interactive virtual tours.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/40 p-3 rounded-xl border border-blue-100">
                  <div>
                    <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                      Tour Feature Descriptors (16 total slots)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      These slots are fully automated and synchronized in real-time to match your Listing Media Room-Labeler/Labels above.
                    </p>
                  </div>
                  <div className="text-[10px] font-bold text-blue-600 bg-white border border-blue-200 px-2.5 py-1 rounded-lg shadow-xs shrink-0 select-none flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    Synced with Labels
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {tourDescriptors.map((desc, idx) => (
                    <div key={'descriptor-' + idx} className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 font-bold">Slot {idx+1}</span>
                      <Input 
                        value={desc} 
                        readOnly
                        placeholder={`Empty Slot`}
                        className="h-9 text-xs bg-slate-50 border-slate-150 text-slate-500 font-medium select-none focus:ring-0 focus:border-slate-150 cursor-not-allowed"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>Back</Button>
                <Button 
                  type="button" 
                  onClick={async () => { 
                    const success = await handleSave(undefined, 4); 
                    if (success) {
                      setCurrentStep(4); 
                      navigate(`/app/listings/edit/${listingId || activeListingId}?step=4`);
                    }
                  }} 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save & Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: CONFIGURE OLIVIA/SORA AND TOUR MODES */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-800">AI Voice Assistant Character For The AI Tour</CardTitle>
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

              <div className="flex justify-between pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>Back</Button>
                <Button 
                  type="button" 
                  onClick={async () => { 
                    const success = await handleSave(undefined, 5); 
                    if (success) {
                      setCurrentStep(5); 
                      navigate(`/app/listings/edit/${listingId || activeListingId}?step=5`);
                    }
                  }} 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save & Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 5: GUEST SIGN-IN AND AUTOMATIONS */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full">
                <CardTitle className="text-slate-800">Open House Gate & Lead Sign-In Settings</CardTitle>
                {getOpenHousePastError() && (
                  <span className="text-blue-600 font-extrabold text-xs sm:text-sm animate-pulse tracking-wide bg-blue-50/70 border border-blue-100 rounded-lg px-2.5 py-1">
                    {getOpenHousePastError()}
                  </span>
                )}
              </div>
              <CardDescription>Setup automatic tablet kiosk registration at entry and text/email follow-ups.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
                <p className="font-extrabold uppercase tracking-wider text-[11px] text-blue-700 block">Open House Sessions Manager</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Session Creation Form */}
                  <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-left">
                    <h4 className="text-sm font-extrabold text-slate-800">Add Open House Session</h4>
                    <div className="space-y-2">
                      <Label>Session Date</Label>
                      <Input
                        type="date"
                        className="h-10 text-sm font-medium border border-slate-200 focus-visible:ring-blue-500 bg-white"
                        value={openHouseDate}
                        min={getFirstDayOfCurrentMonth()}
                        onChange={e => {
                          const nextDate = e.target.value;
                          if (nextDate) {
                            const firstDayStr = getFirstDayOfCurrentMonth();
                            const selected = new Date(nextDate + "T00:00:00");
                            const firstDay = new Date(firstDayStr + "T00:00:00");
                            if (selected < firstDay) {
                              toast.error("The open house date cannot go to previous months.");
                              setOpenHouseDate("");
                              return;
                            }
                          }
                          setOpenHouseDate(nextDate);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Session Hours</Label>
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

                    <Button 
                      type="button" 
                      onClick={handleAddSession} 
                      className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" /> Add Session
                    </Button>
                  </div>

                  {/* Right Column: Sessions List */}
                  <div className="space-y-4 text-left">
                    <h4 className="text-sm font-extrabold text-slate-800">Scheduled & Completed Sessions ({sessions.length})</h4>
                    
                    {sessions.length === 0 ? (
                      <div className="border border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-white text-slate-400">
                        <Calendar className="h-8 w-8 mb-2 stroke-1" />
                        <span className="text-xs font-semibold">No sessions scheduled for this listing.</span>
                        <span className="text-[10px] text-slate-400 mt-1">Use the form to define one or more sessions.</span>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                        {sessions.map((sess) => {
                          const startD = new Date(sess.start_datetime);
                          const endD = new Date(sess.end_datetime);
                          
                          // Format start date beautifully
                          const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                          const dateString = `${months[startD.getMonth()]} ${startD.getDate()}, ${startD.getFullYear()}`;
                          
                          // Format times
                          const formatTimeStr = (d: Date) => {
                            let h = d.getHours();
                            const m = String(d.getMinutes()).padStart(2, "0");
                            const ampm = h >= 12 ? "PM" : "AM";
                            h = h % 12;
                            h = h ? h : 12;
                            return `${h}:${m} ${ampm}`;
                          };
                          const timeString = `${formatTimeStr(startD)} - ${formatTimeStr(endD)}`;
                          const isScheduled = sess.status === "scheduled";
                          
                          const targetListingId = isEdit ? listingId! : activeListingId;
                          return (
                            <div key={sess.session_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-sm gap-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                                  {dateString}
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    isScheduled 
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                      : "bg-stone-100 text-stone-600 border border-stone-200"
                                  }`}>
                                    {sess.status}
                                  </span>
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-slate-400" /> {timeString}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                <a 
                                  href={`/open-houses/${targetListingId}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="h-8 px-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-[10px] font-extrabold text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-all"
                                  title="Launch Attendee Sign-In Kiosk"
                                >
                                  <Tv className="h-3 w-3 text-blue-500" /> Kiosk
                                </a>

                                <a 
                                  href={`/tour/${targetListingId}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="h-8 px-2.5 rounded-lg border border-slate-200 hover:border-violet-400 hover:bg-violet-50 text-[10px] font-extrabold text-slate-600 hover:text-violet-600 flex items-center gap-1 transition-all"
                                  title="Launch Sora Guided Tour"
                                >
                                  <Sparkles className="h-3 w-3 text-violet-500" /> Sora Tour
                                </a>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteSession(sess.session_id)}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 w-8 rounded-lg"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Brokerage Logo or Agent Photo Embedding Manager */}
              <div className="space-y-3 pt-4 border-t text-left">
                <p className="font-extrabold uppercase tracking-wider text-[10px] text-blue-700 block">Brokerage Logo or Agent Photo</p>
                <div className="space-y-2.5">
                  {/* Radio Button 1: Brokerage Logo */}
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 hover:bg-slate-100/50 transition-colors">
                    <label htmlFor="branding-logo-listing" className="flex items-center gap-2.5 cursor-pointer w-full select-none">
                      <input 
                        type="radio" 
                        id="branding-logo-listing" 
                        name="qr-branding-listing" 
                        value="logo"
                        checked={qrBrandingOption === "logo"}
                        onChange={() => {
                          if (!brokerageLogo) {
                            toast.error("A Brokerage Logo is required under Settings > Branding & UI to select this option.");
                            return;
                          }
                          setQrBrandingOption("logo");
                          toast.success("Brokerage Logo selected for dynamic presentations!");
                        }}
                        className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">Brokerage Logo</span>
                        <span className="text-[10px] text-slate-500 leading-tight">Integrate company agency brand specs</span>
                      </div>
                    </label>
                    {brokerageLogo ? (
                      <img src={brokerageLogo} alt="Brokerage Logo" className="h-[35px] w-auto max-w-[75px] object-contain rounded border border-slate-200 bg-white p-0.5" />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic bg-stone-100 px-2 py-0.5 rounded font-mono">Not Configured</span>
                    )}
                  </div>

                  {/* Radio Button 2: Agent Photo */}
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 hover:bg-slate-100/50 transition-colors">
                    <label htmlFor="branding-photo-listing" className="flex items-center gap-2.5 cursor-pointer w-full select-none">
                      <input 
                        type="radio" 
                        id="branding-photo-listing" 
                        name="qr-branding-listing" 
                        value="photo"
                        checked={qrBrandingOption === "photo"}
                        onChange={() => {
                          if (!agentPhoto) {
                            toast.error("An Agent Photo is required under Settings > Branding & UI to select this option.");
                            return;
                          }
                          setQrBrandingOption("photo");
                          toast.success("Agent Photo selected for dynamic presentations!");
                        }}
                        className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">Agent Photo</span>
                        <span className="text-[10px] text-slate-500 leading-tight">Promote host identity visually on scan gates</span>
                      </div>
                    </label>
                    {agentPhoto ? (
                      <img src={agentPhoto} alt="Agent Portrait" className="h-[35px] w-[35px] object-cover rounded-full border border-slate-200 bg-white" />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic bg-stone-100 px-2 py-0.5 rounded font-mono">Not Configured</span>
                    )}
                  </div>

                  {/* Radio Button 3: None */}
                  <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 hover:bg-slate-100/50 transition-colors">
                    <label htmlFor="branding-none-listing" className="flex items-center gap-2.5 cursor-pointer w-full select-none">
                      <input 
                        type="radio" 
                        id="branding-none-listing" 
                        name="qr-branding-listing" 
                        value="none"
                        checked={qrBrandingOption === "none"}
                        onChange={() => {
                          setQrBrandingOption("none");
                          toast.success("No image overlay chosen. Standard clean barcode presentation restored.");
                        }}
                        className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">None</span>
                        <span className="text-[10px] text-slate-500 leading-tight">Output raw, clean high-density barcode format</span>
                      </div>
                    </label>
                    <span className="text-[10px] text-zinc-500 font-bold bg-slate-100 px-2.5 py-1 rounded tracking-wide text-center shrink-0">Standard QR</span>
                  </div>
                </div>

                {!brokerageLogo && !agentPhoto ? (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-slate-700 space-y-1.5 leading-relaxed font-sans mt-2">
                    <p className="font-extrabold uppercase text-[9px] tracking-wide text-amber-800">⚠️ Branding Asset Setup Required</p>
                    <p className="text-[11px] text-amber-900 leading-normal">
                      Neither branding asset has been uploaded. To use logo or photo features in your open houses, please configure item resources under {"Settings > Branding & UI"}.
                    </p>
                  </div>
                ) : (
                  <p className="text-[9.5px]/snug text-slate-500 italic mt-1 font-sans">
                    * Configurations instantly sync with active QR presentations, flyers, and tablet check-in landing screens.
                  </p>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-bold text-sm text-slate-800">Touchless Sign-In & Kiosk Security Gates</h4>
                
                <p className="text-[11px] text-amber-700 font-medium bg-amber-50/70 border border-amber-200 rounded-xl p-3">
                  ⚠️ <strong>Security & Compliance Mandate:</strong> At least one of the protection parameters below must remain enabled. This matches operational standard guidelines ensuring secure kiosk sign-in authenticity and verified follow-up delivery.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 border rounded-xl flex items-start gap-2.5">
                    <input 
                      type="checkbox" 
                      checked={enforcePhoneGate} 
                      onChange={e => setEnforcePhoneGate(e.target.checked)} 
                      id="gate-phone" 
                      className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" 
                    />
                    <div>
                      <label htmlFor="gate-phone" className="text-xs font-bold text-slate-800 block cursor-pointer">Enforce Phone Gate Verification</label>
                      <p className="text-[10px] text-slate-500 mt-0.5">Captures high intent checked prospects via text code authentication</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-xl flex items-start gap-2.5">
                    <input 
                      type="checkbox" 
                      checked={enforceOptInConsent} 
                      onChange={e => setEnforceOptInConsent(e.target.checked)} 
                      id="gate-consent" 
                      className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" 
                    />
                    <div>
                      <label htmlFor="gate-consent" className="text-xs font-bold text-slate-800 block cursor-pointer">Enforce Opt-In Followup Consent</label>
                      <p className="text-[10px] text-slate-500 mt-0.5">Guarantees TCPA compliance for followups</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(4)}>Back</Button>
                <Button type="button" onClick={async () => { 
                  // Extra validation step on submit to block progression
                  if (openHouseDate) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selected = new Date(openHouseDate + "T00:00:00");
                    if (selected < today) {
                      toast.error("The open house date cannot be in the past.");
                      return;
                    }
                    const todayLocalStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    if (openHouseDate === todayLocalStr) {
                      const currentHr = new Date().getHours();
                      if (openHouseStartTime && getHourFromTimeString(openHouseStartTime) < currentHr) {
                        toast.error("The start time cannot be in the past for today's date.");
                        return;
                      }
                      if (openHouseEndTime && getHourFromTimeString(openHouseEndTime) < currentHr) {
                        toast.error("The end time cannot be in the past for today's date.");
                        return;
                      }
                    }
                  }
                  
                  // Gating validation
                  if (!enforcePhoneGate && !enforceOptInConsent) {
                    toast.error("Security Mandate Error: You must select at least one security gate (Phone Verification or Opt-In Followup Consent) to proceed.");
                    return;
                  }

                  const success = await handleSave(undefined, 6); 
                  if (success) {
                    setCurrentStep(6); 
                    navigate(`/app/listings/edit/${listingId || activeListingId}?step=6`);
                  }
                }} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save & Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 6: SOCIAL SHARE */}
        {currentStep === 6 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2 font-bold">
                <Share2 className="h-5 w-5 text-blue-600" />
                Social Share Configuration
              </CardTitle>
              <CardDescription>
                Choose which social share destinations appear for visitors interacting with this listing and its AI Tour.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-3 text-left">
                <input
                  type="checkbox"
                  id="enable-social-sharing"
                  checked={socialShareEnabled}
                  onChange={(e) => setSocialShareEnabled(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="space-y-1">
                  <label htmlFor="enable-social-sharing" className="text-sm font-bold text-slate-800 cursor-pointer block select-none">
                    Turn On Social Sharing Suite
                  </label>
                  <p className="text-xs text-slate-500 leading-normal font-medium">
                    When active, a polished sharing bubble appears on client-side AI Tours and listing microsites, prompting visitors to share the property with friends and family.
                  </p>
                </div>
              </div>

              {socialShareEnabled && (
                <div className="space-y-4 pt-2 animate-fade-in text-left">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Active Social Platforms</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Facebook */}
                    <div className="p-4 rounded-xl border bg-slate-50/50 hover:bg-slate-50 transition-all flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="share-platform-facebook"
                        checked={socialShareFacebook}
                        onChange={(e) => setSocialShareFacebook(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div>
                        <label htmlFor="share-platform-facebook" className="text-xs font-bold text-slate-800 block cursor-pointer select-none">
                          Facebook Feed & Groups
                        </label>
                        <p className="text-[10px] text-slate-500 mt-0.5">Permits direct posting of listing links</p>
                      </div>
                    </div>

                    {/* Instagram */}
                    <div className="p-4 rounded-xl border bg-slate-50/50 hover:bg-slate-50 transition-all flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="share-platform-instagram"
                        checked={socialShareInstagram}
                        onChange={(e) => setSocialShareInstagram(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div>
                        <label htmlFor="share-platform-instagram" className="text-xs font-bold text-slate-800 block cursor-pointer select-none">
                          Instagram Profile Guidance
                        </label>
                        <p className="text-[10px] text-slate-500 mt-0.5">Promotes bio-linking or Direct Messages</p>
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="p-4 rounded-xl border bg-slate-50/50 hover:bg-slate-50 transition-all flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="share-platform-whatsapp"
                        checked={socialShareWhatsapp}
                        onChange={(e) => setSocialShareWhatsapp(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div>
                        <label htmlFor="share-platform-whatsapp" className="text-xs font-bold text-slate-800 block cursor-pointer select-none">
                          WhatsApp Chat
                        </label>
                        <p className="text-[10px] text-slate-500 mt-0.5">Direct chat message share with photo pre-render</p>
                      </div>
                    </div>

                    {/* Text Message */}
                    <div className="p-4 rounded-xl border bg-slate-50/50 hover:bg-slate-50 transition-all flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="share-platform-text"
                        checked={socialShareTextMessage}
                        onChange={(e) => setSocialShareTextMessage(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div>
                        <label htmlFor="share-platform-text" className="text-xs font-bold text-slate-800 block cursor-pointer select-none">
                          SMS Text Message
                        </label>
                        <p className="text-[10px] text-slate-500 mt-0.5">Launches native texting on mobile devices</p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="p-4 rounded-xl border bg-slate-50/50 hover:bg-slate-50 transition-all flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="share-platform-email"
                        checked={socialShareEmail}
                        onChange={(e) => setSocialShareEmail(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div>
                        <label htmlFor="share-platform-email" className="text-xs font-bold text-slate-800 block cursor-pointer select-none">
                          Email Clients
                        </label>
                        <p className="text-[10px] text-slate-500 mt-0.5">Pre-fills subject and body with listing URL</p>
                      </div>
                    </div>

                    {/* Copy Link */}
                    <div className="p-4 rounded-xl border bg-slate-50/50 hover:bg-slate-50 transition-all flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="share-platform-copy"
                        checked={socialShareCopyLink}
                        onChange={(e) => setSocialShareCopyLink(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div>
                        <label htmlFor="share-platform-copy" className="text-xs font-bold text-slate-800 block cursor-pointer select-none">
                          Copy Direct Link
                        </label>
                        <p className="text-[10px] text-slate-500 mt-0.5">Copies clean listing URL to clipboard instantly</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6 border-t font-bold">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(5)}>Back</Button>
                <Button 
                  type="button" 
                  onClick={async () => {
                    const success = await handleSave(undefined, 7);
                    if (success) {
                      setCurrentStep(7);
                      navigate(`/app/listings/edit/${listingId || activeListingId}?step=7`);
                    }
                  }} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  Save & Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 7: BRANDING AND INTEGRATIONS */}
        {currentStep === 7 && (
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
                    {documents.map((docItem, idx) => {
                      const isBase64 = docItem.url.startsWith("data:application/pdf") || docItem.url.length > 500;
                      return (
                        <div key={`doc-${idx}`} className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-xl text-xs">
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="font-extrabold text-slate-800 truncate">{docItem.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono truncate">
                              {isBase64 ? "📄 Uploaded PDF Document (Base64)" : docItem.url}
                            </span>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center justify-center rounded-lg cursor-pointer"
                            onClick={() => setDocumentToDelete({ index: idx, name: docItem.name })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 border border-dashed rounded-xl bg-slate-50/50">
                    <p className="text-xs text-slate-400 italic">No document files attached to this listing yet.</p>
                  </div>
                )}

                {/* Delete Document Confirmation Modal Overlay */}
                {documentToDelete !== null && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                    <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 text-center space-y-4 animate-scale-up">
                      <div className="flex justify-center">
                        <div className="p-3 bg-red-50 text-red-650 rounded-full">
                          <Trash2 className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                      <div className="space-y-1.5 text-center">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Confirm Deletion</h4>
                        <p className="text-xs text-slate-600 font-medium">
                          Would you like to delete <span className="font-bold text-slate-900">({documentToDelete.name})</span>?
                        </p>
                      </div>
                      <div className="flex gap-3 justify-center pt-2">
                        <Button
                          type="button"
                          onClick={() => {
                            const index = documentToDelete.index;
                            setDocuments(prev => prev.filter((_, i) => i !== index));
                            setDocumentToDelete(null);
                            toast.success("Document removed successfully.");
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 px-5 rounded-xl cursor-pointer min-w-[80px]"
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDocumentToDelete(null)}
                          className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs h-9 px-5 rounded-xl cursor-pointer min-w-[80px]"
                        >
                          No
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Document Name input */}
                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="pdf-doc-name" className="text-xs font-bold text-slate-700 block">
                        Document Name
                      </Label>
                      <Input 
                        id="pdf-doc-name"
                        placeholder="e.g. HOA Disclosures, Property brochure" 
                        value={newDocName} 
                        onChange={e => setNewDocName(e.target.value)} 
                        className="bg-white text-xs h-9"
                      />
                    </div>

                    {/* Upload PDF action */}
                    <div className="space-y-1.5 text-left">
                      <Label className="text-xs font-bold text-slate-700 block">
                        Upload your PDF
                      </Label>
                      
                      <div className="flex flex-col gap-2">
                        {newDocUrl ? (
                          <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-250 p-2 rounded-xl text-xs gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-emerald-600 font-bold shrink-0">✓ PDF Loaded:</span>
                              <span className="font-semibold text-slate-800 truncate font-mono text-[11px]">{pendingPdfName || "document.pdf"}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-7 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg shrink-0 cursor-pointer"
                              onClick={() => {
                                setNewDocUrl("");
                                setPendingPdfName("");
                                toast.success("Cleared uploaded PDF.");
                              }}
                            >
                              Clear
                            </Button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center border border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-xl p-3.5 cursor-pointer text-center text-slate-500 hover:text-blue-600 transition-all select-none bg-white">
                            <Upload className="h-4 w-4 mr-2 text-slate-400 group-hover:text-blue-600" />
                            <span className="text-xs font-semibold">Select PDF file</span>
                            <span className="text-[10px] text-slate-400 ml-1.5">(Strictly .pdf only)</span>
                            <input 
                              type="file" 
                              accept="application/pdf" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                // Strict file type and extension validation
                                const isPdfExtension = file.name.slice(-4).toLowerCase() === ".pdf";
                                const isPdfType = file.type === "application/pdf";

                                if (!isPdfExtension || !isPdfType) {
                                  toast.error("Extension Mandate: Only files with a .pdf extension are permitted for document attachments.");
                                  e.target.value = ""; // reset input
                                  return;
                                }

                                const reader = new FileReader();
                                reader.onload = () => {
                                  setNewDocUrl(reader.result as string);
                                  setPendingPdfName(file.name);
                                  toast.success(`Loaded PDF: ${file.name}`);
                                };
                                reader.onerror = () => {
                                  toast.error("Failed to read the selected PDF file.");
                                };
                                reader.readAsDataURL(file);
                              }} 
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add Document Action Button */}
                  <div className="flex justify-end pt-2 border-t border-slate-200/60">
                    <Button 
                      type="button" 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-xl flex items-center justify-center cursor-pointer gap-1.5"
                      onClick={() => {
                        if (!newDocName.trim()) {
                          toast.error("Please enter a Document Name first.");
                          return;
                        }
                        if (!newDocUrl) {
                          toast.error("Please select and upload a valid PDF file first.");
                          return;
                        }
                        setDocuments(prev => [...prev, { name: newDocName.trim(), url: newDocUrl }]);
                        setNewDocName("");
                        setNewDocUrl("");
                        setPendingPdfName("");
                        toast.success("Document attached successfully!");
                      }}
                    >
                      Attach Document File
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t bg-slate-50/50 -mx-6 -mb-6 p-6">
                <h4 className="font-bold text-sm text-slate-800">Supported CRM Platforms (Real-Time Sync Ready)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-center">
                  {["HubSpot", "Follow Up Boss", "Salesforce", "Wise Agent", "LionDesk", "kvCORE"].map(crm => {
                    const url = crmLinks[crm] || "https://www.google.com";
                    const isConnected = selectedCrmFromDropdown?.name.toLowerCase() === crm.toLowerCase();
                    return (
                      <button 
                        key={'crm-' + crm} 
                        type="button"
                        onClick={async () => {
                          await handleAttachCrmToProfile(crm, url);
                          window.open(url, "_blank", "noopener,noreferrer");
                        }}
                        className={`transition-all text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm border focus:ring-2 focus:ring-blue-100 cursor-pointer ${
                          isConnected 
                            ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 font-extrabold" 
                            : "bg-white border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600 hover:shadow"
                        }`}
                        title={`Connect ${crm} to profile and open`}
                      >
                        <span>{crm}</span>
                        {isConnected ? (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        ) : (
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Searchable Dropdown Trigger below */}
                <div className="space-y-2 pt-4 border-t border-slate-200 relative">
                  <Label className="text-xs font-bold text-slate-700 block">Search Additional CRM Catalog</Label>
                  <p className="text-[10px] text-slate-400 -mt-1">Displays CRM names and links directly to registration or integration setup URLs mapped from spreadsheet source.</p>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <Input 
                      type="text" 
                      placeholder="Click to search 45+ CRM platforms in interactive popup..." 
                      value={crmSearchQuery}
                      readOnly
                      onClick={() => setIsCrmModalOpen(true)}
                      onFocus={() => setIsCrmModalOpen(true)}
                      className="pl-9 pr-8 bg-white border border-slate-200 h-9 text-xs cursor-pointer focus:ring-2 focus:ring-blue-100"
                    />
                    {crmSearchQuery && (
                      <button 
                        type="button" 
                        onClick={(e) => { 
                          e.stopPropagation();
                          setCrmSearchQuery(""); 
                          setCrmPage(0); 
                          setSelectedCrmFromDropdown(null); 
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 z-10"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Searchable Modal Overlay Popup */}
                  {isCrmModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-scale-up overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                          <div className="space-y-0.5 text-left">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                              <Search className="h-4 w-4 text-blue-600" /> Search CRM Platform Catalog
                            </h3>
                            <p className="text-[10px] text-slate-500 font-medium">Select a CRM integration from our verified 45+ real estate providers catalog</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCrmModalOpen(false);
                              setCrmPage(0);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                            title="Close search window"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Modal Search Input container */}
                        <div className="p-4 bg-white border-b border-slate-100 text-left">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <Input 
                              type="text" 
                              placeholder="Type platform name (e.g. HubSpot, wise, chime...)" 
                              value={crmSearchQuery}
                              onChange={e => {
                                setCrmSearchQuery(e.target.value);
                                setCrmPage(0);
                              }}
                              autoFocus
                              className="pl-9 pr-8 bg-slate-50/50 border-slate-200 h-10 text-xs focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                            />
                            {crmSearchQuery && (
                              <button 
                                type="button" 
                                onClick={() => { setCrmSearchQuery(""); setCrmPage(0); }}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Modal Content - Paginated Results */}
                        <div className="flex-1 overflow-y-auto p-2 bg-slate-50/20 text-left divide-y divide-slate-100">
                          {(() => {
                            const filteredCrms = crmList.filter(item => 
                              item.name.toLowerCase().includes(crmSearchQuery.toLowerCase())
                            );
                            const pageSize = 20;
                            const totalResults = filteredCrms.length;
                            const totalPages = Math.ceil(totalResults / pageSize);
                            const startIndex = crmPage * pageSize;
                            const paginatedCrms = filteredCrms.slice(startIndex, startIndex + pageSize);
                            const hasNextPage = crmPage < totalPages - 1;
                            const hasPrevPage = crmPage > 0;

                            if (filteredCrms.length === 0) {
                              return (
                                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                                  <Search className="h-6 w-6 text-slate-300 stroke-[1.5]" />
                                  <p className="text-xs font-semibold text-slate-700">No matching CRM providers found</p>
                                  <p className="text-[10px] text-slate-500">Try typing a different name or clear filters</p>
                                </div>
                              );
                            }

                            return (
                              <>
                                <div className="space-y-1 p-2">
                                  {paginatedCrms.map(item => (
                                    <div 
                                      key={'modal-crm-' + item.name}
                                      onClick={async () => {
                                        await handleAttachCrmToProfile(item.name, item.url);
                                        setIsCrmModalOpen(false);
                                        window.open(item.url, '_blank', 'noopener,noreferrer');
                                      }}
                                      className="p-3 text-xs bg-white rounded-xl border border-slate-105 hover:border-blue-200 hover:shadow-xs text-slate-700 hover:bg-blue-50/30 cursor-pointer flex justify-between items-center transition-all group"
                                    >
                                      <div className="flex flex-col gap-0.5">
                                        <span className="font-bold text-slate-800 text-[13px]">{item.name}</span>
                                        <span className="text-[10px] text-slate-400 leading-tight block truncate max-w-[280px] sm:max-w-md">{item.url}</span>
                                      </div>
                                      <span className="text-[10px] text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white px-2.5 py-1 rounded-full flex items-center gap-1 font-bold transition-all">
                                        Select & Link <ArrowRight className="h-3 w-3" />
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Pagination Indicators and Next/Previous Action Links */}
                                {(hasPrevPage || hasNextPage) && (
                                  <div className="p-3 bg-slate-55 text-xs flex items-center justify-between border-t border-slate-100 sticky bottom-0 z-10 rounded-b-xl select-none">
                                    <span className="text-[10px] text-slate-500 font-medium font-mono">
                                      Showing {startIndex + 1}–{Math.min(startIndex + pageSize, totalResults)} of {totalResults} matching
                                    </span>
                                    <div className="flex gap-4">
                                      {hasPrevPage && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setCrmPage(prev => Math.max(0, prev - 1));
                                          }}
                                          className="text-blue-600 hover:text-blue-800 font-bold text-xs select-none cursor-pointer hover:underline"
                                        >
                                          Previous
                                        </button>
                                      )}
                                      {hasNextPage && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setCrmPage(prev => prev + 1);
                                          }}
                                          className="text-blue-600 hover:text-blue-800 font-bold text-xs select-none cursor-pointer hover:underline"
                                        >
                                          Next
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        
                        {/* Footer warning */}
                        <div className="p-3 bg-slate-50 text-[10px] text-slate-400 text-center border-t border-slate-100 font-medium">
                          Connecting redirects to registration to secure webhook credential sync.
                        </div>
                      </div>
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
                <Button type="button" variant="outline" onClick={() => setCurrentStep(6)}>Back</Button>
                <Button 
                  type="button" 
                  onClick={async () => { 
                    const success = await handleSave(undefined, 8); 
                    if (success) {
                      setCurrentStep(8); 
                      navigate(`/app/listings/edit/${listingId || activeListingId}?step=8`);
                    }
                  }} 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save & Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
 
        {/* STEP 8: PREVIEW AND PUBLISH */}
        {currentStep === 8 && (
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
                <Button type="button" variant="outline" onClick={() => setCurrentStep(7)}>Back</Button>
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
            <span>Progress: {Math.round(([1, 2, 3, 4, 5, 6, 7, 8].filter(s => isStepCompleted(s)).length / 8) * 100)}% Complete</span>
            <span className="font-mono">AI Open House Ingestion v2.1</span>
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
