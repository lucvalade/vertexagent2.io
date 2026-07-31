import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAllListings, getUserListings, updateListing, Listing, getTourConfig, saveTourConfig, DEFAULT_WELCOME_TEXTS, isListingExpired } from "@/lib/api";

const isAudioUrl = (str?: string) => {
  if (!str) return false;
  const s = str.trim().toLowerCase();
  return (
    s.startsWith("data:audio") ||
    s.endsWith(".mp3") ||
    s.endsWith(".wav") ||
    s.endsWith(".ogg") ||
    s.endsWith(".m4a") ||
    s.includes("storage.googleapis.com") ||
    s.includes("firebasestorage.app") ||
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("/")
  );
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Sparkles, 
  MapPin, 
  Layers, 
  Plus, 
  Volume2, 
  VolumeX, 
  Globe2, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  BookmarkCheck, 
  MessageSquare, 
  ArrowRight, 
  Home, 
  Lock, 
  FileText, 
  UserCheck, 
  Megaphone,
  Loader2,
  Trash2,
  ListRestart,
  Play,
  Square,
  HelpCircle,
  X,
  Info,
  Save
} from "lucide-react";

export default function AiTours() {
  const { user } = useAuth();
  const isPro = user?.email?.toLowerCase() === "luc.valade@gmail.com" || (user as any)?.role === "admin" || (user as any)?.role === "platform_admin" || (user as any)?.plan === "pro" || (user as any)?.plan === "pro_agent" || (user as any)?.plan === "elite" || (user as any)?.plan === "team_pro";
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showWorkspaceHelp, setShowWorkspaceHelp] = useState(false);
  
  // Script / Tour variables
  const [welcomeEn, setWelcomeEn] = useState("");
  const [welcomeFr, setWelcomeFr] = useState("");
  const [talkingPoints, setTalkingPoints] = useState<string[]>([]);
  const [newPoint, setNewPoint] = useState("");
  
  // Room structure
  const [rooms, setRooms] = useState<{ id: string; name: string; script: string; order: number }[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomScript, setNewRoomScript] = useState("");

  // AI Assistant responses & Q&As
  const [qas, setQas] = useState<{ question: string; answer: string }[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  // Sequence and Popup confirmation states
  const [confirmDeleteRoomId, setConfirmDeleteRoomId] = useState<string | null>(null);
  const [confirmDeleteQaIdx, setConfirmDeleteQaIdx] = useState<number | null>(null);

  // Language Conflict Dialog states
  const [langConflictOpen, setLangConflictOpen] = useState(false);
  const [langConflictType, setLangConflictType] = useState<"rooms" | "qas" | "both">("rooms");

  // Tour properties/options
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [soraVoice, setSoraVoice] = useState("Kore");
  const [multilingualEnabled, setMultilingualEnabled] = useState(false);
  const [signInPrompt, setSignInPrompt] = useState<"none" | "start" | "midway" | "end">("start");
  const [lenderHandoff, setLenderHandoff] = useState(false);
  const [selectedLenderName, setSelectedLenderName] = useState("Pinnacle Capital Partners (Preferred)");
  
  // Custom Call to actions (CTAs)
  const [ctas, setCtas] = useState<{ label: string; action: string }[]>([
    { label: "Book Private Tour", action: "calendar" },
    { label: "Request Disclosures & Floor Plans", action: "documents" }
  ]);
  const [newCtaLabel, setNewCtaLabel] = useState("");
  const [newCtaAction, setNewCtaAction] = useState("calendar");
  const [ctaToDelete, setCtaToDelete] = useState<{ index: number; label: string } | null>(null);

  // Helper for dynamic translation of CTA and action buttons
  const getWalkthroughTranslations = (lang: string) => {
    const dictionary: Record<string, { preview: string; translateRoom: string; translateAnswer: string; stopLabel: string }> = {
      French: {
        preview: "Écouter la voix de Sora (Français)",
        translateRoom: "Traduire en Français",
        translateAnswer: "Traduire la réponse en Français",
        stopLabel: "Arrêt"
      },
      Spanish: {
        preview: "Escuchar la voz de Sora (Español)",
        translateRoom: "Traducir al Español",
        translateAnswer: "Traducir respuesta al Español",
        stopLabel: "Detener"
      },
      German: {
        preview: "Sora-Stimme anhören (Deutsch)",
        translateRoom: "Auf Deutsch übersetzen",
        translateAnswer: "Antwort auf Deutsch übersetzen",
        stopLabel: "Stopp"
      },
      Italian: {
        preview: "Ascolta la voce di Sora (Italiano)",
        translateRoom: "Traduci in Italiano",
        translateAnswer: "Traduci la risposta in Italiano",
        stopLabel: "Fermare"
      },
      Portuguese: {
        preview: "Ouvir a voz de Sora (Português)",
        translateRoom: "Traduzir para Português",
        translateAnswer: "Traduzir resposta para Português",
        stopLabel: "Parar"
      },
      Mandarin: {
        preview: "预览Sora语音 (中文)",
        translateRoom: "翻译成中文",
        translateAnswer: "将回答翻译成中文",
        stopLabel: "停止"
      },
      Japanese: {
        preview: "Soraの音声プレビュー (日本語)",
        translateRoom: "日本語に翻訳",
        translateAnswer: "回答を日本語に翻訳",
        stopLabel: "停止"
      },
      Dutch: {
        preview: "Sora-stem beluisteren (Nederlands)",
        translateRoom: "Vertaal naar het Nederlands",
        translateAnswer: "Vertaal antwoord naar het Nederlands",
        stopLabel: "Stoppen"
      },
      Russian: {
        preview: "Прослушать голос Sora (Русский)",
        translateRoom: "Перевести на русский",
        translateAnswer: "Перевести ответ на русский",
        stopLabel: "Стоп"
      },
      Arabic: {
        preview: "معاينة صوت سورا (العربية)",
        translateRoom: "ترجم إلى العربية",
        translateAnswer: "ترجم الإجابة إلى العربية",
        stopLabel: "توقف"
      },
      English: {
        preview: "Preview Sora Voice (English)",
        translateRoom: "Translate to English",
        translateAnswer: "Translate Answer to English",
        stopLabel: "Stop"
      }
    };
    return dictionary[lang] || {
      preview: `Preview Sora Voice (${lang})`,
      translateRoom: `Translate to ${lang}`,
      translateAnswer: `Translate Answer to ${lang}`,
      stopLabel: "Stop"
    };
  };

  // AI (Sora) Loading State
  const [soraGenerating, setSoraGenerating] = useState(false);

  // Flag to track if the user made explicit interactive changes to prevent automatic auto-saves
  const [userHasEdited, setUserHasEdited] = useState(false);

  // AI Multilingual States
  const [targetLang, setTargetLang] = useState("French");
  const [roomTargetLang, setRoomTargetLang] = useState("French");
  const [qaTargetLang, setQaTargetLang] = useState("French");
  const [welcomeOtherScript, setWelcomeOtherScript] = useState("");
  const [translating, setTranslating] = useState(false);
  const [shortening, setShortening] = useState(false);
  const [shorteningFr, setShorteningFr] = useState(false);
  const [shorteningOther, setShorteningOther] = useState(false);
  const [playingLang, setPlayingLang] = useState<string | null>(null); // "en" | "fr" | "other"

  // Card Info (?) Toggle States
  const [showRoomWalkthroughInfo, setShowRoomWalkthroughInfo] = useState(false);
  const [showQaInfo, setShowQaInfo] = useState(false);
  const [showGreetingInfo, setShowGreetingInfo] = useState(false);
  const [showGatingInfo, setShowGatingInfo] = useState(false);

  const [translatingRoomId, setTranslatingRoomId] = useState<string | null>(null);
  const [translatingQaIdx, setTranslatingQaIdx] = useState<number | null>(null);
  const [rewritingRoomId, setRewritingRoomId] = useState<string | null>(null);
  const [rewritingQaIdx, setRewritingQaIdx] = useState<number | null>(null);

  const getLangCode = (lang: string): string => {
    switch (lang) {
      case "French": return "fr-FR";
      case "Spanish": return "es-ES";
      case "German": return "de-DE";
      case "Italian": return "it-IT";
      case "Portuguese": return "pt-PT";
      case "Mandarin": return "zh-CN";
      case "Japanese": return "ja-JP";
      case "Dutch": return "nl-NL";
      case "Russian": return "ru-RU";
      case "Arabic": return "ar-SA";
      default: return "es-ES";
    }
  };

  const detectLanguage = (text: string, fallbackLang: string): string => {
    const lower = text.toLowerCase();
    const hasEnglishWords = /\b(the|and|is|of|to|welcome|this|room|house|kitchen|bathroom|living|pool|garden|estate|garage|floor|window|ceiling|door|private|tour|agent|information|details)\b/.test(lower);
    if (hasEnglishWords) {
      return "English";
    }
    const hasFrenchWords = /\b(le|la|les|est|dans|pour|une|bonjour|bienvenue|cuisine|chambre|salon|maison|salle|et|est)\b/.test(lower);
    if (hasFrenchWords) {
      return "French";
    }
    return fallbackLang;
  };

  const speakText = async (text: string, langName: string, trackingKey: string) => {
    if (!text) {
      toast.error("Script is empty. Please enter or generate text first.");
      return;
    }

    if (playingLang === trackingKey) {
      stopSpeaking();
      return;
    }

    // Stop any existing playing audio or speech first
    stopSpeaking();

    const detectedLang = langName || "English";

    setPlayingLang(trackingKey);
    const toastId = toast.loading(`Connecting to Sora's premium voice servers for ${detectedLang}...`);

    try {
      const response = await fetch("/api/tts-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: detectedLang })
      });
      toast.dismiss(toastId);
      if (!response.ok) {
        throw new Error("Failed to synthesize via Gemini TTS server.");
      }
      const data = await response.json();
      if (data.success && data.base64Audio) {
        const mimeType = data.mimeType || "audio/wav";
        const binary = atob(data.base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        
        (window as any)._vertexCurrentAudio = audio;
        
        audio.onended = () => {
          setPlayingLang(null);
          URL.revokeObjectURL(url);
        };
        
        audio.onerror = (e) => {
          console.error("Audio playback error", e);
          setPlayingLang(null);
          URL.revokeObjectURL(url);
        };
        
        await audio.play();
      } else {
        throw new Error(data.error || "No audio returned from Gemini.");
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      console.warn("[speakText Sora error, falling back]:", err);
      // Fallback to local speech synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const langCode = trackingKey === "en" ? "en-US" : (trackingKey === "fr" ? "fr-FR" : getLangCode(detectedLang));
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        
        // Ensure we try to find a female voice to represent Sora
        if (window.speechSynthesis.getVoices) {
          const voices = window.speechSynthesis.getVoices();
          const femaleWords = ["female", "sami", "samantha", "zira", "amelie", "hazel", "marta", "elsa", "sora", "google"];
          const matchedVoice = voices.find(v => 
            v.lang.startsWith(langCode.substring(0, 2)) && 
            femaleWords.some(word => v.name.toLowerCase().includes(word))
          ) || voices.find(v => v.lang.startsWith(langCode.substring(0, 2)));
          if (matchedVoice) {
            utterance.voice = matchedVoice;
          }
        }

        utterance.onend = () => {
          setPlayingLang(null);
        };
        utterance.onerror = () => {
          setPlayingLang(null);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setPlayingLang(null);
        toast.error("Sora neural voice failed and browser speech synthesis is unavailable.");
      }
    }
  };

  const stopSpeaking = () => {
    if ((window as any)._vertexCurrentAudio) {
      try {
        if (typeof (window as any)._vertexCurrentAudio.stop === "function") {
          (window as any)._vertexCurrentAudio.stop();
        } else if (typeof (window as any)._vertexCurrentAudio.pause === "function") {
          (window as any)._vertexCurrentAudio.pause();
        }
      } catch (e) {}
      (window as any)._vertexCurrentAudio = null;
    }
    if ((window as any)._vertexCurrentAudioContext) {
      try {
        (window as any)._vertexCurrentAudioContext.close();
      } catch (e) {}
      (window as any)._vertexCurrentAudioContext = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlayingLang(null);
  };

  const handleTranslateScript = async () => {
    setUserHasEdited(true);
    if (!welcomeEn) {
      toast.error("Please enter or generate an English script first.");
      return;
    }
    setTranslating(true);
    try {
      // Sync walkthrough and Q&A target languages to the selected welcome script language
      setRoomTargetLang(targetLang);
      setQaTargetLang(targetLang);

      const response = await fetch("/api/translate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: welcomeEn, targetLanguage: targetLang })
      });
      if (!response.ok) {
        throw new Error("Failed to translate script via Gemini proxy.");
      }
      const data = await response.json();
      if (data.success) {
        setWelcomeOtherScript(data.translatedText);
        setRoomTargetLang(targetLang);
        setQaTargetLang(targetLang);
        toast.success(`Successfully translated welcome script to ${targetLang}!`);
        await initiateAutoSave(welcomeEn, welcomeFr, data.translatedText, targetLang);
      } else {
        toast.error(data.error || "Failed to translate script.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while calling the translation API.");
    } finally {
      setTranslating(false);
    }
  };

  const handleTranslateRoomScript = async (roomId: string) => {
    setUserHasEdited(true);
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    setTranslatingRoomId(roomId);
    try {
      const response = await fetch("/api/translate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: room.script, targetLanguage: roomTargetLang })
      });
      if (!response.ok) throw new Error("Translation request failed.");
      const data = await response.json();
      if (data.success) {
        const updated = rooms.map(r => r.id === roomId ? { ...r, script: data.translatedText } : r);
        setRooms(updated);
        if (selectedListing) {
          localStorage.setItem(`rooms_tour_${selectedListing.id}`, JSON.stringify(updated));
          await initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, updated);
        }
        toast.success(`Succesfully translated room script to ${roomTargetLang}! Saved and live!`);
      } else {
        toast.error(data.error || "Failed online translation.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to translate script.");
    } finally {
      setTranslatingRoomId(null);
    }
  };

  const handleTranslateQaAnswer = async (index: number) => {
    setUserHasEdited(true);
    const qaItem = qas[index];
    if (!qaItem) return;
    
    setTranslatingQaIdx(index);
    try {
      const response = await fetch("/api/translate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: qaItem.answer, targetLanguage: qaTargetLang })
      });
      if (!response.ok) throw new Error("Translation request failed.");
      const data = await response.json();
      if (data.success) {
        const updated = qas.map((q, i) => i === index ? { ...q, answer: data.translatedText } : q);
        setQas(updated);
        if (selectedListing) {
          localStorage.setItem(`qas_tour_${selectedListing.id}`, JSON.stringify(updated));
          await initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, rooms, updated);
        }
        toast.success(`Successfully translated answer to ${qaTargetLang}! Saved and live!`);
      } else {
        toast.error(data.error || "Failed online translation.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to translate answer.");
    } finally {
      setTranslatingQaIdx(null);
    }
  };

  const handleLuxuryRewriteRoom = async (roomId: string) => {
    setUserHasEdited(true);
    const room = rooms.find(r => r.id === roomId);
    if (!room || !room.script) return;
    
    setRewritingRoomId(roomId);
    try {
      const response = await fetch("/api/luxury-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: room.script, type: "room" })
      });
      if (!response.ok) throw new Error("Luxury rewrite request failed.");
      const data = await response.json();
      if (data.success && data.rewrittenText) {
        const updated = rooms.map(r => r.id === roomId ? { ...r, script: data.rewrittenText } : r);
        setRooms(updated);
        if (selectedListing) {
          localStorage.setItem(`rooms_tour_${selectedListing.id}`, JSON.stringify(updated));
          await initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, updated);
        }
        toast.success(`🎉 Generated rewritten luxury text for ${room.name}! Saved to Firestore.`);
      } else {
        toast.error(data.error || "Failed luxury rewrite.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate luxury rewrite.");
    } finally {
      setRewritingRoomId(null);
    }
  };

  const handleLuxuryRewriteQa = async (index: number) => {
    setUserHasEdited(true);
    const qaItem = qas[index];
    if (!qaItem || !qaItem.answer) return;
    
    setRewritingQaIdx(index);
    try {
      const response = await fetch("/api/luxury-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: qaItem.answer, type: "qa" })
      });
      if (!response.ok) throw new Error("Luxury rewrite request failed.");
      const data = await response.json();
      if (data.success && data.rewrittenText) {
        const updated = qas.map((q, i) => i === index ? { ...q, answer: data.rewrittenText } : q);
        setQas(updated);
        if (selectedListing) {
          localStorage.setItem(`qas_tour_${selectedListing.id}`, JSON.stringify(updated));
          await initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, rooms, updated);
        }
        toast.success(`🎉 Generated rewritten luxury text for Q&A answer! Saved to Firestore.`);
      } else {
        toast.error(data.error || "Failed luxury rewrite.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate luxury rewrite.");
    } finally {
      setRewritingQaIdx(null);
    }
  };

  // Latest state ref for screen leave / unmount / beforeunload autosave
  const latestRef = useRef({
    welcomeEn, welcomeFr, welcomeOtherScript, targetLang, rooms, qas, ctas, soraVoice, selectedListing, userHasEdited
  });

  useEffect(() => {
    latestRef.current = {
      welcomeEn, welcomeFr, welcomeOtherScript, targetLang, rooms, qas, ctas, soraVoice, selectedListing, userHasEdited
    };
  }, [welcomeEn, welcomeFr, welcomeOtherScript, targetLang, rooms, qas, ctas, soraVoice, selectedListing, userHasEdited]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const curr = latestRef.current;
      if (curr.userHasEdited && curr.selectedListing) {
        localStorage.setItem(`rooms_tour_${curr.selectedListing.id}`, JSON.stringify(curr.rooms));
        localStorage.setItem(`qas_tour_${curr.selectedListing.id}`, JSON.stringify(curr.qas));
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      const curr = latestRef.current;
      if (curr.userHasEdited && curr.selectedListing) {
        console.log("[AiTours] Screen leave / unmount detected. Performing automatic background save...");
        initiateAutoSave(
          curr.welcomeEn,
          curr.welcomeFr,
          curr.welcomeOtherScript,
          curr.targetLang,
          curr.rooms,
          curr.qas,
          curr.ctas,
          curr.soraVoice
        );
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadListings();
    }
  }, [user]);

  async function loadListings(preserveId?: string) {
    setLoading(true);
    try {
      if (!user) return;
      const isAdmin = (user as any).role === 'ADMIN';
      const rawData = isAdmin ? await getAllListings() : await getUserListings(user.id);
      const data = (rawData || []).filter(l => !isListingExpired(l));
      setListings(data);
      if (data && data.length > 0) {
        const idToSelect = preserveId || selectedListing?.id || data[0].id;
        const matching = data.find(l => l.id === idToSelect);
        if (matching) {
          handleSelectListing(matching);
        } else {
          handleSelectListing(data[0]);
        }
      } else {
        setSelectedListing(null);
      }
    } catch (err) {
      toast.error("Failed to load listings for AI Tour configuration");
    } finally {
      setLoading(false);
    }
  }

  const handleSelectListing = (listing: Listing) => {
    if (userHasEdited && selectedListing && selectedListing.id !== listing.id) {
      console.log(`[AiTours] Autosaving pending edits before switching from ${selectedListing.id} to ${listing.id}`);
      initiateAutoSave();
    }
    
    setSelectedListing(listing);
    setUserHasEdited(false); // Reset edit state when switching/selecting a listing
    
    // Determine the English script text (avoiding audio URLs / base64 binary sound paths)
    let initialEnScript = "";
    if (listing.welcome_en_script && !isAudioUrl(listing.welcome_en_script)) {
      initialEnScript = listing.welcome_en_script;
    } else if (listing.welcome_en && !isAudioUrl(listing.welcome_en)) {
      initialEnScript = listing.welcome_en;
    } else {
      initialEnScript = "Hi, I'm Sora, your AI property assistant. This tour shows how I connect listings, answer client questions, book showings, and run your open house gate and lead sign-in. Tap each step to follow along.";
    }
    setWelcomeEn(initialEnScript);

    // Determine the French script text (avoiding audio URLs / base64 binary sound paths)
    let initialFrScript = "";
    if (listing.welcome_fr_script && !isAudioUrl(listing.welcome_fr_script)) {
      initialFrScript = listing.welcome_fr_script;
    } else if (listing.welcome_fr && !isAudioUrl(listing.welcome_fr)) {
      initialFrScript = listing.welcome_fr;
    } else {
      initialFrScript = "Bonjour, je suis Sora, votre assistante immobilière IA. Cette visite guidée vous montre comment je mets en relation les annonces, réponds aux questions des clients, planifie les visites et gère l'accueil des visiteurs lors des journées portes ouvertes et l'inscription des prospects. Touchez chaque étape pour suivre le tutoriel.";
    }
    setWelcomeFr(initialFrScript);

    setTargetLang(listing.welcome_other_lang || "French");
    setRoomTargetLang(listing.welcome_other_lang || "French");
    setQaTargetLang(listing.welcome_other_lang || "French");
    setWelcomeOtherScript(listing.welcome_other_script || "");

    setTalkingPoints(listing.talkingPoints || [
      "Custom crown moldings and hand-scraped white oak floors",
      "Floor-to-ceiling windows boasting panoramic skyline views",
      "Professional-grade chef's kitchen featuring Sub-Zero appliances",
      "Private outdoor terrace with customized heating units"
    ]);

    // Set initial defaults
    const defaultRooms = [
      { id: "1", name: "Grand Foyer", script: "We begin in the grand foyer, accented by double-height ceilings and custom brass chandelier fixtures. Take a moment to notice the seamless alignment of the white oak floors flowing elegantly into the main living pavilion.", order: 1 },
      { id: "2", name: "Chef's Kitchen", script: "Next is the kitchen. This culinary studio features a massive Calacatta gold marble island, custom soft-close cabinetry, and integrated Sub-Zero refrigerator. Perfect for both morning espresso and large catering events.", order: 2 },
      { id: "3", name: "Primary Oasis", script: "Finally, the master chamber features dual walk-in dressing suites, motorized sun shades, and a spa-inspired wet bath complete with a freestanding soaking tub and direct private balcony access.", order: 3 }
    ];

    const defaultQas = [
      { question: "When was the roof last replaced?", answer: "The roof was fully replaced in Fall 2024 with premium architectural shingles designed to withstand adverse weather, backed by a fully transferable 30-year warranty." },
      { question: "What is the average utility cost?", answer: "Thanks to newly installed high-efficiency dual-zone heat pumps and multi-pane smart glass, the average combined monthly HVAC and electric utilities operate under $240, even during peak summer months." }
    ];

    const defaultCtas = [
      { label: "Book Private Tour", action: "calendar" },
      { label: "Request Disclosures & Floor Plans", action: "documents" }
    ];

    // Load tourConfig from Firestore or migrate on-demand
    const fetchOrCreateTourConfig = async () => {
      try {
        const config = await getTourConfig(listing.id);
        if (config) {
          // Document exists! Set the loaded states
          if (config.welcomeTexts) {
            setWelcomeEn(config.welcomeTexts.en && !isAudioUrl(config.welcomeTexts.en) ? config.welcomeTexts.en : initialEnScript);
            setWelcomeFr(config.welcomeTexts.fr && !isAudioUrl(config.welcomeTexts.fr) ? config.welcomeTexts.fr : initialFrScript);
            // Detect other language code
            const otherLangCode = Object.keys(config.welcomeTexts).find(k => k !== "en" && k !== "fr");
            if (otherLangCode) {
              setWelcomeOtherScript(config.welcomeTexts[otherLangCode] || "");
              const langName = {
                ar: "Arabic", "zh-CN": "Chinese (Simplified)", "zh-TW": "Chinese (Traditional)",
                nl: "Dutch", en: "English", fr: "French", de: "German", hi: "Hindi",
                it: "Italian", ja: "Japanese", ko: "Korean", pt: "Portuguese",
                ru: "Russian", es: "Spanish", vi: "Vietnamese"
              }[otherLangCode] || "Spanish";
              setTargetLang(langName);
              setRoomTargetLang(langName);
              setQaTargetLang(langName);
            }
          }
          if (config.voiceId) {
            setSoraVoice(config.voiceId);
          }
          if (config.rooms && config.rooms.length > 0) {
            setRooms(config.rooms);
            localStorage.setItem(`rooms_tour_${listing.id}`, JSON.stringify(config.rooms));
          } else {
            setRooms(defaultRooms);
          }
          if (config.qas && config.qas.length > 0) {
            setQas(config.qas);
            localStorage.setItem(`qas_tour_${listing.id}`, JSON.stringify(config.qas));
          } else {
            setQas(defaultQas);
          }
          if (config.ctas && config.ctas.length > 0) {
            setCtas(config.ctas);
            localStorage.setItem(`ctas_tour_${listing.id}`, JSON.stringify(config.ctas));
          } else {
            setCtas(defaultCtas);
          }
        } else {
          // Document does not exist yet! Perform on-demand migration to Firestore
          console.log(`[On-Demand Migration] Creating tourConfig for listing ${listing.id}`);
          const welcomeTextsMap: Record<string, string> = {
            ...DEFAULT_WELCOME_TEXTS,
            en: initialEnScript,
            fr: initialFrScript
          };
          const initialConfig = {
            voiceId: "Kore",
            ttsModel: "gemini-3.1-flash-tts-preview",
            welcomeTexts: welcomeTextsMap,
            defaultLanguage: "en",
            rooms: defaultRooms,
            qas: defaultQas,
            ctas: defaultCtas,
            mediaManifest: [],
            brokerageBranding: {
              logoUrl: listing.brokerageLogo || "",
              accentColor: "#0052A5",
              backgroundUrl: "",
              avatarId: ""
            },
            updatedAt: Date.now()
          };
          await saveTourConfig(listing.id, initialConfig);
          
          setRooms(defaultRooms);
          setQas(defaultQas);
          setCtas(defaultCtas);
          setSoraVoice("Kore");
          
          localStorage.setItem(`rooms_tour_${listing.id}`, JSON.stringify(defaultRooms));
          localStorage.setItem(`qas_tour_${listing.id}`, JSON.stringify(defaultQas));
          localStorage.setItem(`ctas_tour_${listing.id}`, JSON.stringify(defaultCtas));
        }
      } catch (err) {
        console.error("[AiTours] Error fetching/migrating tourConfig:", err);
        // Fallback to local storage if Firestore has issues
        const savedRooms = localStorage.getItem(`rooms_tour_${listing.id}`);
        setRooms(savedRooms ? JSON.parse(savedRooms) : defaultRooms);
        const savedQas = localStorage.getItem(`qas_tour_${listing.id}`);
        setQas(savedQas ? JSON.parse(savedQas) : defaultQas);
        const savedCtas = localStorage.getItem(`ctas_tour_${listing.id}`);
        setCtas(savedCtas ? JSON.parse(savedCtas) : defaultCtas);
      }
    };
    fetchOrCreateTourConfig();

    // Load basic voice / sign-in configurations from listing
    setVoiceEnabled(listing.voiceEnabled !== undefined ? !!listing.voiceEnabled : (listing.voiceName !== "Disabled"));
    setMultilingualEnabled(!!(listing as any).multilingualEnabled);
    setLenderHandoff(!!(listing as any).lenderHandoff);
    setSelectedLenderName((listing as any).selectedLenderName || "Pinnacle Capital Partners (Preferred)");
    setSignInPrompt(listing.qrDestination === "sign-in" ? "start" : "none");
  };

  // Auto-Save helper for Sora Tour Workspace - saves BOTH welcome texts and rooms/qas/ctas/voices to Firestore
  const initiateAutoSave = async (
    enVal = welcomeEn,
    frVal = welcomeFr,
    otherVal = welcomeOtherScript,
    langVal = targetLang,
    updatedRooms = rooms,
    updatedQas = qas,
    updatedCtas = ctas,
    voiceIdVal = soraVoice
  ) => {
    if (!selectedListing) return;
    try {
      // Get language code for 'langVal'
      const langMap: Record<string, string> = {
        Arabic: "ar", "Chinese (Simplified)": "zh-CN", "Chinese (Traditional)": "zh-TW",
        Dutch: "nl", English: "en", French: "fr", German: "de", Hindi: "hi",
        Italian: "it", Japanese: "ja", Korean: "ko", Portuguese: "pt",
        Russian: "ru", Spanish: "es", Vietnamese: "vi"
      };
      const otherLangCode = langMap[langVal] || "es";
      
      const welcomeTextsMap = {
        ...DEFAULT_WELCOME_TEXTS,
        en: enVal,
        fr: frVal
      };
      if (langVal && otherLangCode) {
        welcomeTextsMap[otherLangCode] = otherVal;
      }

      // Save tourConfig to listings/{listingId}/tourConfig/main
      const configData = {
        voiceId: voiceIdVal,
        ttsModel: "gemini-3.1-flash-tts-preview",
        welcomeTexts: welcomeTextsMap,
        defaultLanguage: "en",
        rooms: updatedRooms,
        qas: updatedQas,
        ctas: updatedCtas,
        mediaManifest: (selectedListing as any).mediaManifest || [],
        brokerageBranding: {
          logoUrl: selectedListing.brokerageLogo || "",
          accentColor: "#0052A5",
          backgroundUrl: "",
          avatarId: ""
        },
        updatedAt: Date.now()
      };
      
      await saveTourConfig(selectedListing.id, configData);

      // Save to main listing doc for backwards compatibility and real-time syncing
      await updateListing(selectedListing.id, {
        welcome_en_script: enVal,
        welcome_fr_script: frVal,
        welcome_other_lang: langVal,
        welcome_other_script: otherVal,
        welcome_en: enVal,
        welcome_fr: frVal,
        rooms: updatedRooms,
        qas: updatedQas,
        ctas: updatedCtas,
        voiceName: voiceEnabled ? "Sora Studio Male/Female (Neural)" : "Disabled",
        voiceEnabled: voiceEnabled,
        multilingualEnabled: multilingualEnabled,
        lenderHandoff: lenderHandoff,
        selectedLenderName: selectedLenderName,
        qrDestination: signInPrompt === "start" ? "sign-in" : "tour",
        updatedAt: Date.now()
      });

      // Update in-memory selectedListing & listings array so isWelcomeDirty, isRoomsDirty, etc. turn false
      const updatedObj: Listing = {
        ...selectedListing,
        welcome_en_script: enVal,
        welcome_fr_script: frVal,
        welcome_other_lang: langVal,
        welcome_other_script: otherVal,
        welcome_en: enVal,
        welcome_fr: frVal,
        rooms: updatedRooms,
        qas: updatedQas,
        ctas: updatedCtas,
        voiceName: voiceEnabled ? "Sora Studio Male/Female (Neural)" : "Disabled",
        voiceEnabled: voiceEnabled,
        multilingualEnabled: multilingualEnabled,
        lenderHandoff: lenderHandoff,
        selectedLenderName: selectedLenderName,
        qrDestination: signInPrompt === "start" ? "sign-in" : "tour",
        voiceId: voiceIdVal
      } as Listing;

      setSelectedListing(updatedObj);
      setListings(prev => prev.map(l => l.id === updatedObj.id ? updatedObj : l));

      toast.success("Changes auto-saved and live!", { duration: 1500 });
      setUserHasEdited(false);
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  };

  // AI (Sora) action: Generate Tour Intro
  const handleGenerateTourIntro = async () => {
    if (!selectedListing) return;
    setSoraGenerating(true);
    setUserHasEdited(true);
    
    // Simulate premium human-like Sora response based on the listing facts
    const generated = `Welcome to the exquisite property at ${selectedListing.address}. I am Sora, your dedicated real estate AI advisor. Today, I'll be guiding you through a modern masterpiece featuring ${selectedListing.beds || 3} bedrooms and ${selectedListing.baths || 3} bathrooms across ${selectedListing.sqft || "3,200"} finished square feet of absolute luxury. Let's pause in the foyer and begin our tour of these premium spaces.`;
    setWelcomeEn(generated);

    let updatedFr = welcomeFr;
    try {
      const res = await fetch("/api/translate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: generated, targetLanguage: "French" })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.translatedText) {
          updatedFr = data.translatedText;
          setWelcomeFr(updatedFr);
        }
      }
    } catch (e) {
      console.warn("Failed translating intro to French:", e);
    }

    setSoraGenerating(false);
    toast.success("Sora generated intro in English and updated French translation!");
    await initiateAutoSave(generated, updatedFr, welcomeOtherScript, targetLang);
  };

  // AI (Sora) action: Rewrite Tour with more premium copywriting
  const handleRewriteTour = async () => {
    if (!selectedListing) return;
    setSoraGenerating(true);
    setUserHasEdited(true);
    
    const rewritten = `Step inside ${selectedListing.address}, where classic sophistication meets state-of-the-art living. I am Sora, your AI companion. Notice the abundance of dramatic natural light and refined structural symmetry surrounding you. Every corner of this ${selectedListing.propertyType || "estate"} has been meticulously curated. Let's begin searching for your perfect sanctuary.`;
    setWelcomeEn(rewritten);

    let updatedFr = welcomeFr;
    try {
      const res = await fetch("/api/translate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rewritten, targetLanguage: "French" })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.translatedText) {
          updatedFr = data.translatedText;
          setWelcomeFr(updatedFr);
        }
      }
    } catch (e) {
      console.warn("Failed translating rewritten intro to French:", e);
    }

    setSoraGenerating(false);
    toast.success("Sora rewrote welcome script and updated French translation!");
    await initiateAutoSave(rewritten, updatedFr, welcomeOtherScript, targetLang);
  };

  const handleShortenScript = async (type: "en" | "fr" | "other") => {
    setUserHasEdited(true);
    const textToShorten = type === "en" ? welcomeEn : (type === "fr" ? welcomeFr : welcomeOtherScript);
    if (!textToShorten) {
      toast.error("There is no script text to condense. Please generate or enter script first.");
      return;
    }
    
    if (type === "en") setShortening(true);
    else if (type === "fr") setShorteningFr(true);
    else setShorteningOther(true);

    try {
      const response = await fetch("/api/shorten-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToShorten })
      });
      if (!response.ok) throw new Error("Failed to condense script via server proxy.");
      const data = await response.json();
      if (data.success) {
        if (type === "en") {
          setWelcomeEn(data.shortenedText);
          
          toast.info("Translating shortened script to French...", { duration: 2000 });
          try {
            const translateResponse = await fetch("/api/translate-script", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: data.shortenedText, targetLanguage: "French" })
            });
            if (translateResponse.ok) {
              const translateData = await translateResponse.json();
              if (translateData.success) {
                setWelcomeFr(translateData.translatedText);
                toast.success("Shortened English script and automatically converted to French!");
                await initiateAutoSave(data.shortenedText, translateData.translatedText, welcomeOtherScript, targetLang);
              } else {
                await initiateAutoSave(data.shortenedText, welcomeFr, welcomeOtherScript, targetLang);
              }
            } else {
              await initiateAutoSave(data.shortenedText, welcomeFr, welcomeOtherScript, targetLang);
            }
          } catch (tErr) {
            await initiateAutoSave(data.shortenedText, welcomeFr, welcomeOtherScript, targetLang);
          }
        } else if (type === "fr") {
          setWelcomeFr(data.shortenedText);
          toast.success("Script successfully condensed by Sora into a fast-speaking, premium concise format!");
          await initiateAutoSave(welcomeEn, data.shortenedText, welcomeOtherScript, targetLang);
        } else {
          setWelcomeOtherScript(data.shortenedText);
          toast.success("Script successfully condensed by Sora into a fast-speaking, premium concise format!");
          await initiateAutoSave(welcomeEn, welcomeFr, data.shortenedText, targetLang);
        }
      } else {
        toast.error(data.error || "Failed to shorten script.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while calling the condense API.");
    } finally {
      setShortening(false);
      setShorteningFr(false);
      setShorteningOther(false);
    }
  };

  const handleAddRoom = () => {
    setUserHasEdited(true);
    if (!newRoomName || !newRoomScript || !selectedListing) {
      toast.error("Please provide both a room name and voice-ready script");
      return;
    }
    const newlyAdded = {
      id: crypto.randomUUID(),
      name: newRoomName,
      script: newRoomScript,
      order: rooms.length + 1
    };
    const updated = [...rooms, newlyAdded];
    setRooms(updated);
    localStorage.setItem(`rooms_tour_${selectedListing.id}`, JSON.stringify(updated));
    setNewRoomName("");
    setNewRoomScript("");
    toast.success(`Successfully added the "${newlyAdded.name}" to the AI Tour!`);
    initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, updated);
  };

  const handleDeleteRoom = (roomId: string) => {
    setUserHasEdited(true);
    if (!selectedListing) return;
    const updated = rooms.filter(r => r.id !== roomId);
    setRooms(updated);
    localStorage.setItem(`rooms_tour_${selectedListing.id}`, JSON.stringify(updated));
    toast.info("Room removed from tour");
    initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, updated);
  };

  const handleMoveRoomUp = (index: number) => {
    setUserHasEdited(true);
    if (index === 0 || !selectedListing) return;
    const updated = [...rooms];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    
    // Update order values sequentially
    updated.forEach((r, idx) => {
      r.order = idx + 1;
    });

    setRooms(updated);
    localStorage.setItem(`rooms_tour_${selectedListing.id}`, JSON.stringify(updated));
    toast.success("Room moved up sequence successfully!");
    initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, updated);
  };

  const handleMoveRoomDown = (index: number) => {
    setUserHasEdited(true);
    if (index === rooms.length - 1 || !selectedListing) return;
    const updated = [...rooms];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;

    // Update order values sequentially
    updated.forEach((r, idx) => {
      r.order = idx + 1;
    });

    setRooms(updated);
    localStorage.setItem(`rooms_tour_${selectedListing.id}`, JSON.stringify(updated));
    toast.success("Room moved down sequence successfully!");
    initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, updated);
  };

  const handleAddPoint = () => {
    if (!newPoint) return;
    const updated = [...talkingPoints, newPoint];
    setTalkingPoints(updated);
    setNewPoint("");
  };

  const handleDeletePoint = (index: number) => {
    const updated = talkingPoints.filter((_, i) => i !== index);
    setTalkingPoints(updated);
  };

  const handleAddQa = () => {
    setUserHasEdited(true);
    if (!newQuestion || !newAnswer || !selectedListing) {
      toast.error("Please provide both question and answer");
      return;
    }
    const cleanQuestion = newQuestion.trim();
    const cleanAnswer = newAnswer.trim();
    if (!cleanQuestion || !cleanAnswer) {
      toast.error("Question and answer cannot be empty.");
      return;
    }
    const formattedQuestion = cleanQuestion.charAt(0).toUpperCase() + cleanQuestion.slice(1);
    const formattedAnswer = cleanAnswer.charAt(0).toUpperCase() + cleanAnswer.slice(1);

    const updated = [...qas, { question: formattedQuestion, answer: formattedAnswer }];
    setQas(updated);
    localStorage.setItem(`qas_tour_${selectedListing.id}`, JSON.stringify(updated));
    setNewQuestion("");
    setNewAnswer("");
    toast.success("Added new frequently asked buyer question block.");
    initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, rooms, updated);
  };

  const handleDeleteQa = (index: number) => {
    setUserHasEdited(true);
    if (!selectedListing) return;
    const updated = qas.filter((_, i) => i !== index);
    setQas(updated);
    localStorage.setItem(`qas_tour_${selectedListing.id}`, JSON.stringify(updated));
    initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, rooms, updated);
  };

  const handleAddCta = () => {
    setUserHasEdited(true);
    if (!newCtaLabel || !newCtaLabel.trim()) {
      toast.error("Please enter text for the Custom Interactive CTA Button first.");
      return;
    }
    const words = newCtaLabel.trim().split(/\s+/);
    const formatted = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    const updated = [...ctas, { label: formatted, action: newCtaAction }];
    setCtas(updated);
    if (selectedListing) {
      localStorage.setItem(`ctas_tour_${selectedListing.id}`, JSON.stringify(updated));
      initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, rooms, qas, updated);
    }
    setNewCtaLabel("");
    toast.success("Added new interaction button on the mobile client experience.");
  };

  const handleDeleteCta = (index: number) => {
    setUserHasEdited(true);
    const updated = ctas.filter((_, i) => i !== index);
    setCtas(updated);
    if (selectedListing) {
      localStorage.setItem(`ctas_tour_${selectedListing.id}`, JSON.stringify(updated));
      initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, rooms, qas, updated);
    }
    setCtaToDelete(null);
    toast.success("Removed client-facing interactive button.");
  };

  const translateAllToTarget = async () => {
    if (!selectedListing) return;
    const toastId = toast.loading(`Sora is translating walkthrough and Q&A to ${targetLang}...`);
    try {
      let updatedRooms = [...rooms];
      let updatedQas = [...qas];

      const roomsMismatch = roomTargetLang !== targetLang;
      const qasMismatch = qaTargetLang !== targetLang;

      if (roomsMismatch) {
        updatedRooms = await Promise.all(rooms.map(async (room) => {
          try {
            const response = await fetch("/api/translate-script", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: room.script, targetLanguage: targetLang })
            });
            if (!response.ok) return room;
            const data = await response.json();
            return data.success ? { ...room, script: data.translatedText } : room;
          } catch (err) {
            return room;
          }
        }));
        setRooms(updatedRooms);
        setRoomTargetLang(targetLang);
        localStorage.setItem(`rooms_tour_${selectedListing.id}`, JSON.stringify(updatedRooms));
      }

      if (qasMismatch) {
        updatedQas = await Promise.all(qas.map(async (qa) => {
          try {
            const response = await fetch("/api/translate-script", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: qa.answer, targetLanguage: targetLang })
            });
            if (!response.ok) return qa;
            const data = await response.json();
            return data.success ? { ...qa, answer: data.translatedText } : qa;
          } catch (err) {
            return qa;
          }
        }));
        setQas(updatedQas);
        setQaTargetLang(targetLang);
        localStorage.setItem(`qas_tour_${selectedListing.id}`, JSON.stringify(updatedQas));
      }

      toast.success(`Successfully aligned and translated walkthrough materials to ${targetLang}! Saving now...`, { id: toastId });
      
      // Call executePublish directly with updated states
      await executePublish(updatedRooms, updatedQas, targetLang, targetLang);
    } catch (err) {
      toast.error("Failed to complete automatic translations.", { id: toastId });
    }
  };

  const executePublish = async (
    pubRooms = rooms,
    pubQas = qas,
    pubRoomLang = roomTargetLang,
    pubQaLang = qaTargetLang
  ) => {
    if (!selectedListing) return;
    setLoading(true);
    try {
      // Save elements directly into the listing model in Firestore via initiateAutoSave
      await initiateAutoSave(
        welcomeEn,
        welcomeFr,
        welcomeOtherScript,
        targetLang,
        pubRooms,
        pubQas,
        ctas,
        soraVoice
      );

      // Show immediate response
      toast.success(`🎉 Excellent! "${selectedListing.address}" AI Voice Tour is compiled and published live!`, {
        description: `Your guest-facing microsite, flyers, and dynamic open house QR code destinations are safely synced. Active languages: Welcome: ${targetLang}, Walkthrough: ${pubRoomLang}, Q&A: ${pubQaLang}.`,
        duration: 8000
      });

      // Synchronize latest state back into components list
      await loadListings(selectedListing.id);
    } catch (err) {
      toast.error("Failed to commit settings to Cloud Firestore");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishTour = async () => {
    if (!selectedListing) return;

    if (!voiceEnabled && !multilingualEnabled && !lenderHandoff) {
      toast.error("Enabled Features Error", {
        description: "Please select at least one feature (Voice, Multilingual, or Lender Handoff) under Verification & Gating Rules before publishing."
      });
      return;
    }

    const roomsMismatch = roomTargetLang !== targetLang;
    const qasMismatch = qaTargetLang !== targetLang;

    if (roomsMismatch || qasMismatch) {
      if (roomsMismatch && qasMismatch) {
        setLangConflictType("both");
      } else if (roomsMismatch) {
        setLangConflictType("rooms");
      } else {
        setLangConflictType("qas");
      }
      setLangConflictOpen(true);
      return;
    }

    await executePublish(rooms, qas, roomTargetLang, qaTargetLang);
  };

  const handleSaveGatingRules = async () => {
    if (!selectedListing) return;
    setLoading(true);
    try {
      await initiateAutoSave(
        welcomeEn,
        welcomeFr,
        welcomeOtherScript,
        targetLang,
        rooms,
        qas,
        ctas,
        soraVoice
      );
      toast.success("Verification & Gating Rules saved successfully!", {
        description: "Gating mechanics, sign-in flows, and active features updated on Firestore."
      });
      await loadListings(selectedListing.id);
    } catch (err) {
      toast.error("Failed to save gating rules on Firestore");
    } finally {
      setLoading(false);
    }
  };

  const currentEnBase = (selectedListing?.welcome_en_script && !isAudioUrl(selectedListing.welcome_en_script)) 
    ? selectedListing.welcome_en_script 
    : (selectedListing?.welcome_en && !isAudioUrl(selectedListing.welcome_en) ? selectedListing.welcome_en : "");
  const currentFrBase = (selectedListing?.welcome_fr_script && !isAudioUrl(selectedListing.welcome_fr_script)) 
    ? selectedListing.welcome_fr_script 
    : (selectedListing?.welcome_fr && !isAudioUrl(selectedListing.welcome_fr) ? selectedListing.welcome_fr : "");

  const isWelcomeDirty = !!(selectedListing && (
    welcomeEn !== currentEnBase ||
    welcomeFr !== currentFrBase ||
    targetLang !== (selectedListing.welcome_other_lang || "Spanish") ||
    welcomeOtherScript !== (selectedListing.welcome_other_script || "")
  ));

  const isRoomsDirty = !!(selectedListing && JSON.stringify(rooms) !== JSON.stringify(selectedListing.rooms || []));

  const isQasDirty = !!(selectedListing && JSON.stringify(qas) !== JSON.stringify(selectedListing.qas || []));

  const isCtasDirty = !!(selectedListing && JSON.stringify(ctas) !== JSON.stringify(selectedListing.ctas || []));

  const isGatingDirty = !!(selectedListing && (
    multilingualEnabled !== !!(selectedListing as any).multilingualEnabled ||
    lenderHandoff !== !!(selectedListing as any).lenderHandoff ||
    selectedLenderName !== ((selectedListing as any).selectedLenderName || "Pinnacle Capital Partners (Preferred)") ||
    soraVoice !== ((selectedListing as any).voiceId || "Kore") ||
    (signInPrompt === "start" ? "sign-in" : "tour") !== (selectedListing.qrDestination || "tour")
  ));

  const isDirty = userHasEdited && (isWelcomeDirty || isRoomsDirty || isQasDirty || isCtasDirty || isGatingDirty);

  // Background auto-save debouncer
  useEffect(() => {
    if (!isDirty || !selectedListing) return;

    const timer = setTimeout(async () => {
      try {
        console.log("[AutoSave] Unsaved changes detected. Auto-saving...");
        await initiateAutoSave(
          welcomeEn,
          welcomeFr,
          welcomeOtherScript,
          targetLang,
          rooms,
          qas,
          ctas,
          soraVoice
        );
        await loadListings(selectedListing.id);
        toast.dismiss(); // Clear any previous warning toasts
        toast.success("✨ Workspace changes auto-saved successfully!");
      } catch (err) {
        console.error("[AutoSave] Background auto-save failed:", err);
      }
    }, 4000); // 4-second idle timeout to trigger auto-save

    return () => clearTimeout(timer);
  }, [
    isDirty,
    welcomeEn,
    welcomeFr,
    welcomeOtherScript,
    targetLang,
    rooms,
    qas,
    ctas,
    soraVoice,
    selectedListing?.id
  ]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes in your Sora Tour Workspace. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    const handleBubbleClick = (e: MouseEvent) => {
      if (!isDirty) return;
      
      // Find closest anchor tag
      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== "A") {
        target = target.parentElement;
      }
      
      // If it's a link pointing away from the current page
      if (target && target.tagName === "A") {
        const href = target.getAttribute("href");
        if (href && !href.includes("aitours")) {
          // Prevent navigation
          e.preventDefault();
          e.stopPropagation();
          
          // Show auto-saving toast
          toast.loading("💾 Auto-saving changes before navigating...", { id: "autosave-nav" });
          
          // Trigger the immediate auto-save
          initiateAutoSave(
            welcomeEn,
            welcomeFr,
            welcomeOtherScript,
            targetLang,
            rooms,
            qas,
            ctas,
            soraVoice
          ).then(() => {
            toast.success("✨ Changes auto-saved!", { id: "autosave-nav" });
            // Now navigate!
            window.location.href = href;
          }).catch((err) => {
            console.error("Auto-save failed on navigate:", err);
            toast.error("Failed to auto-save, redirecting...", { id: "autosave-nav" });
            setTimeout(() => {
              window.location.href = href;
            }, 1000);
          });
        }
      }
    };
    
    document.addEventListener("click", handleBubbleClick, true); // Capture phase
    return () => {
      document.removeEventListener("click", handleBubbleClick, true);
    };
  }, [isDirty, welcomeEn, welcomeFr, welcomeOtherScript, targetLang, rooms, qas, ctas, soraVoice]);

  return (
    <div className="space-y-8">
      {/* Header section with listing selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 mb-5 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-stone-900 font-sans">Sora Tour Workspace</h1>
            <button
              onClick={() => setShowWorkspaceHelp(!showWorkspaceHelp)}
              className="inline-flex items-center justify-center p-1.5 rounded-full text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
              title="Learn about Sora Tour Workspace"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          <p className="text-slate-500 mt-1">Design, edit, and publish guided AI Tours featuring your brand and a voice-ready narrator.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Label className="text-xs font-extrabold uppercase tracking-wider text-black whitespace-nowrap">Configure Property:</Label>
          <select 
            className="bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800"
            value={selectedListing?.id || ""}
            onChange={async (e) => {
              const found = listings.find(l => l.id === e.target.value);
              if (found) {
                if (isDirty) {
                  toast.loading("💾 Auto-saving changes to current listing...", { id: "autosave-switch" });
                  try {
                    await initiateAutoSave(
                      welcomeEn,
                      welcomeFr,
                      welcomeOtherScript,
                      targetLang,
                      rooms,
                      qas,
                      ctas,
                      soraVoice
                    );
                    toast.success("✨ Current listing changes auto-saved!", { id: "autosave-switch" });
                  } catch (err) {
                    console.error("Auto-save on switch failed:", err);
                    toast.error("Failed to auto-save changes", { id: "autosave-switch" });
                  }
                }
                handleSelectListing(found);
              }
            }}
          >
            {listings.map((l) => (
              <option key={l.id} value={l.id}>{l.address} ({l.city})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Workspace Information Guide Card */}
      {showWorkspaceHelp && (
        <Card className="border-amber-200 bg-amber-50/60 shadow-md rounded-2xl p-6 relative animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => setShowWorkspaceHelp(false)}
            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-100 transition-colors cursor-pointer"
            title="Close guide"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-700 rounded-2xl shrink-0">
              <Info className="h-6 w-6" />
            </div>
            <div className="space-y-3">
              <h3 className="text-base font-bold text-amber-950 font-sans">
                What is Sora Tour Workspace?
              </h3>
              <p className="text-xs text-amber-900/90 leading-relaxed font-sans">
                Sora Tour Workspace is your central command center for authoring, customizing, and publishing AI-guided voice property tours for your listings. Powered by Gemini AI (Sora), it transforms static property details into interactive, voice-first experiences for open house visitors and online buyers.
              </p>
              
              <div className="grid md:grid-cols-3 gap-3 pt-2">
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200/60 space-y-1">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <Volume2 className="h-3.5 w-3.5 text-amber-600" /> Welcome Scripts
                  </span>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Craft custom opening greetings in English, French, and 11+ additional languages with real-time neural voice previews.
                  </p>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-amber-200/60 space-y-1">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-amber-600" /> Room Narrations & Q&A
                  </span>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Define step-by-step room walkthroughs and interactive Q&A points that Sora presents during buyer tours.
                  </p>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-amber-200/60 space-y-1">
                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-amber-600" /> Gating & Lender Pairing
                  </span>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Configure sign-in gating rules, QR code destinations, and paired lender co-branding for seamless lead capture.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {!selectedListing ? (
        <Card className="text-center p-12 max-w-[calc(640px-15px)] mx-auto">
          <CardHeader>
            <Home className="h-12 w-12 text-slate-300 mx-auto animate-pulse" />
            <CardTitle className="text-lg font-bold mt-4">No Active Listings Loaded</CardTitle>
            <CardDescription className="text-sm">You must create a listing first in the Listings panel before designing a voice-guided tour.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-amber-600 hover:bg-amber-500 flex items-center gap-1 mx-auto text-xs font-bold">
              <Plus className="h-4 w-4" /> Create First Listing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5 w-full">
          
          {/* Main Workspace Column */}
          <div className="lg:col-span-2 space-y-4 min-w-0 w-full">
            
            {/* Sora Welcome Script */}
            <Card className="w-full border-slate-200 shadow-sm bg-white text-black rounded-2xl overflow-hidden mx-0">
              <CardHeader className="py-2.5 px-3.5 border-b border-slate-100 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-900">
                      <Sparkles className="h-4 w-4 text-amber-500 fill-amber-300 animate-spin-slow" /> Sora Welcome Script
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500 font-medium">Configure the narrative script that playing tourists will hear instantly upon scanning.</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <Button 
                      onClick={handleGenerateTourIntro} 
                      disabled={soraGenerating}
                      variant="outline" 
                      className="border-amber-200 text-amber-800 hover:bg-amber-50 text-[9px] uppercase font-black tracking-wider gap-0.5 h-7 px-2.5 bg-white"
                    >
                      {soraGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Generate Intro
                    </Button>
                    <Button 
                      onClick={handleRewriteTour}
                      disabled={soraGenerating}
                      variant="ghost" 
                      className="border border-slate-300 hover:bg-slate-50 hover:text-slate-900 text-slate-700 text-[9px] uppercase font-bold tracking-wider gap-1 h-7 px-2.5 transition-colors duration-200 bg-white"
                    >
                      <ListRestart className="h-3 w-3 text-slate-600 group-hover:text-slate-900" />
                      Rewrite Luxury
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-[11px] font-black uppercase text-slate-700 font-bold">English Script (Welcome Prompt)</Label>
                      <button 
                        type="button"
                        onClick={() => setShowGreetingInfo(!showGreetingInfo)}
                        className="p-1 rounded-full text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        title="How this section and Save Script button work. Click for info."
                      >
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Button 
                        onClick={() => handleShortenScript("en")}
                        disabled={shortening || !welcomeEn}
                        variant="outline"
                        className="h-6 text-[9px] py-1 px-2 font-black uppercase border-amber-200 bg-white hover:bg-amber-100 text-black"
                      >
                        {shortening ? <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" /> : <Sparkles className="h-2.5 w-2.5 mr-1 text-amber-500" />}
                        Shorten
                      </Button>
                      {playingLang === "en" ? (
                        <Button 
                          onClick={stopSpeaking}
                          variant="destructive"
                          className="h-6 text-[9px] py-1 px-2 font-black uppercase bg-red-600 hover:bg-red-700 text-white animate-pulse"
                        >
                          <Square className="h-2.5 w-2.5 mr-1 fill-white" /> STOP ENGLISH
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => speakText(welcomeEn, "English", "en")}
                          variant="outline"
                          className="h-6 text-[9px] py-1 px-2 font-bold uppercase border-emerald-300 bg-white hover:bg-emerald-100 text-black"
                        >
                          <Play className="h-2.5 w-2.5 mr-1 fill-emerald-800 text-emerald-800" /> Speak English
                        </Button>
                      )}
                    </div>
                  </div>

                  {showGreetingInfo && (
                    <div className="my-2 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-2 animate-in fade-in slide-in-from-top-1 text-left shadow-xs">
                      <div className="flex items-center justify-between font-bold text-amber-900">
                        <span className="flex items-center gap-1.5 text-xs">
                          <Info className="h-4 w-4 text-amber-600 shrink-0" /> How the Sora Welcome Script &amp; Save Script Button Work
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setShowGreetingInfo(false)} 
                          className="text-amber-700 hover:text-amber-950 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-amber-100 cursor-pointer"
                        >
                          ✕ Close
                        </button>
                      </div>
                      <p className="text-[11px] text-amber-900/90 leading-relaxed">
                        This section controls the primary greeting narrative that home buyers hear instantly upon scanning your property QR code or initiating an AI Tour.
                      </p>
                      <ul className="text-[10px] text-amber-900 space-y-1.5 list-disc pl-4">
                        <li><strong>Master English Source:</strong> Craft or edit your initial opening property script in English. Sora speaks this greeting aloud when the tour begins.</li>
                        <li><strong>Live Neural Voice Preview:</strong> Click <em>"Speak English"</em> to hear Sora synthesize and pronounce your text in real time.</li>
                        <li><strong>Script Shorten Tool:</strong> Click <em>"Shorten"</em> to automatically condense long greetings into snappy, high-converting opening statements.</li>
                        <li><strong>Save Script Button Action:</strong> When you click the orange <strong>"Save Script"</strong> button below:
                          <ol className="list-decimal pl-4 mt-1 space-y-0.5 font-medium text-slate-900">
                            <li>Persists your updated master English welcome script to your Firestore property database.</li>
                            <li>Triggers automated neural AI translation to keep French, Spanish, German, and 70+ multilingual tour scripts synchronized on the fly.</li>
                            <li>Instantly updates all live QR code destinations and tablet kiosk loops.</li>
                          </ol>
                        </li>
                      </ul>
                    </div>
                  )}
                  <Textarea 
                    value={welcomeEn} 
                    onChange={(e) => { setWelcomeEn(e.target.value); setUserHasEdited(true); }} 
                    onBlur={() => initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang)}
                    rows={3} 
                    className="text-xs font-sans text-slate-900 focus-visible:ring-1 focus-visible:ring-amber-500 bg-white border border-slate-200"
                  />
                  <p className="text-[9px] text-slate-500 italic font-medium leading-tight">This represents Sora's initial greeting block before moving to specific rooms.</p>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                    <Label className="text-[11px] font-black uppercase text-slate-700 font-bold">French Script (Bonjour Évaluateurs)</Label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button 
                        onClick={() => handleShortenScript("fr")}
                        disabled={shorteningFr || !welcomeFr}
                        variant="outline"
                        className="h-6 text-[9px] py-1 px-2 font-black uppercase border-amber-200 bg-white hover:bg-amber-100 text-black"
                      >
                        {shorteningFr ? <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" /> : <Sparkles className="h-2.5 w-2.5 mr-1 text-amber-500" />}
                        Shorten
                      </Button>
                      {playingLang === "fr" ? (
                        <Button 
                          onClick={stopSpeaking}
                          variant="destructive"
                          className="h-6 text-[9px] py-1 px-2 font-black uppercase bg-red-600 hover:bg-red-700 text-white animate-pulse"
                        >
                          <Square className="h-2.5 w-2.5 mr-1 fill-white" /> Arrêt
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => speakText(welcomeFr, "French", "fr")}
                          variant="outline"
                          className="h-6 text-[9px] py-1 px-2 font-bold uppercase border-emerald-300 bg-white hover:bg-emerald-100 text-black"
                        >
                          <Play className="h-2.5 w-2.5 mr-1 fill-emerald-500 text-emerald-800" /> Parlons Français
                        </Button>
                      )}
                      <span className="text-[9px] font-bold text-amber-750 px-1 py-0.5 bg-amber-50 border border-amber-100 rounded uppercase font-sans">Multilingual Active</span>
                    </div>
                  </div>
                  <Textarea 
                    value={welcomeFr} 
                    onChange={(e) => { setWelcomeFr(e.target.value); setUserHasEdited(true); }} 
                    onBlur={() => initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang)}
                    rows={2} 
                    className="text-xs font-sans text-slate-900 focus-visible:ring-1 focus-visible:ring-amber-500 bg-white border border-slate-200"
                  />
                </div>
              </CardContent>
              <CardFooter className="py-2.5 px-4 border-t border-slate-100 bg-white flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-500">
                  {isWelcomeDirty ? "● Unsaved changes" : "✓ Saved to Firestore"}
                </span>
                <Button 
                  onClick={async () => {
                    setLoading(true);
                    try {
                      let updatedFr = welcomeFr;
                      let updatedOther = welcomeOtherScript;
                      
                      if (welcomeEn && welcomeEn.trim()) {
                        // Translate to French automatically
                        try {
                          const resFr = await fetch("/api/translate-script", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ text: welcomeEn, targetLanguage: "French" })
                          });
                          if (resFr.ok) {
                            const dataFr = await resFr.json();
                            if (dataFr.success && dataFr.translatedText) {
                              updatedFr = dataFr.translatedText;
                              setWelcomeFr(updatedFr);
                            }
                          }
                        } catch (e) {
                          console.warn("Failed translating French welcome script on save:", e);
                        }

                        // Also translate to 3rd target language if selected
                        if (targetLang && targetLang !== "English" && targetLang !== "French") {
                          try {
                            const resOther = await fetch("/api/translate-script", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ text: welcomeEn, targetLanguage: targetLang })
                            });
                            if (resOther.ok) {
                              const dataOther = await resOther.json();
                              if (dataOther.success && dataOther.translatedText) {
                                updatedOther = dataOther.translatedText;
                                setWelcomeOtherScript(updatedOther);
                              }
                            }
                          } catch (e) {
                            console.warn(`Failed translating ${targetLang} welcome script on save:`, e);
                          }
                        }
                      }
                      
                      await initiateAutoSave(welcomeEn, updatedFr, updatedOther, targetLang);
                      toast.success("Sora Welcome Script saved & French script updated automatically!");
                    } catch (err) {
                      toast.error("Failed to save Welcome Script");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  size="sm"
                  className="h-7 px-3 bg-[#e17100] hover:bg-[#b05800] text-white font-black text-[9px] uppercase cursor-pointer rounded-lg border-none flex items-center gap-1"
                >
                  {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Script
                </Button>
              </CardFooter>
            </Card>

            {/* Multilingual Conversion Notice */}
            <Card className="w-full border-blue-200 bg-blue-50/70 shadow-xs rounded-2xl overflow-hidden mx-0 p-4 sm:p-5">
              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200/80 shadow-xs">
                  <Globe2 className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-950">
                      Multilingual Auto-Translation Active
                    </h4>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-blue-200/90 text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-300/80">
                      Automatic
                    </span>
                  </div>
                  <p className="text-xs text-blue-900 font-medium leading-relaxed">
                    <strong>Notice:</strong> Your welcome message, Room-by-Room Walkthrough content, and Sora's Knowledge Base (Buyer Q&A) in English will automatically be converted to all available multilingual languages (French, Spanish, German, Italian, Portuguese, Mandarin, Japanese, Dutch, Russian, Arabic, etc.) whenever you click <strong>Save Script</strong>. <strong className="font-extrabold text-black">You must have the Pro Advanced Conversational AI plan.</strong>
                  </p>
                </div>
              </div>
            </Card>

            {/* Room-by-room audio sequences */}
            <Card className="w-full border-slate-200 shadow-sm bg-white text-black rounded-2xl overflow-hidden mx-0">
              <CardHeader className="py-2.5 px-4 border-b border-slate-100 bg-white">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-900">
                    <Layers className="h-4 w-4 text-amber-600" /> Room-by-Room Walkthrough content
                    <button 
                      type="button"
                      onClick={() => setShowRoomWalkthroughInfo(!showRoomWalkthroughInfo)}
                      className="p-1 rounded-full text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer ml-1"
                      title="What is Room-by-Room Walkthrough? Click for info."
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                      🇬🇧 English Master Content
                    </span>
                    <Button
                      size="sm"
                      onClick={async () => {
                        await initiateAutoSave();
                        toast.success("✅ Room walkthrough scripts saved successfully!");
                      }}
                      className="h-6 text-[9px] font-black uppercase bg-slate-900 hover:bg-slate-800 text-white px-2.5 cursor-pointer"
                    >
                      <Save className="h-2.5 w-2.5 mr-1" /> Save Walkthroughs
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-[10px] text-slate-500 font-medium">Define high-fidelity scripts in English to narrate key areas of the home. Use <strong>Generate Rewritten Luxury Text</strong> to upgrade prose. On Pro plans, Sora auto-converts this on the fly to 70+ languages during live client tours.</CardDescription>

                {showRoomWalkthroughInfo && (
                  <div className="mt-2.5 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1.5 animate-in fade-in slide-in-from-top-1 text-left">
                    <div className="flex items-center justify-between font-bold text-amber-900">
                      <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5 text-amber-600" /> What is Room-by-Room Walkthrough?</span>
                      <button onClick={() => setShowRoomWalkthroughInfo(false)} className="text-amber-700 hover:text-amber-950 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-amber-100 cursor-pointer">✕ Close</button>
                    </div>
                    <p className="text-[11px] text-amber-900/90 leading-relaxed">
                      This section defines custom voice scripts for individual rooms or areas of the property (e.g. Master Suite, Chef's Kitchen, Covered Patio).
                    </p>
                    <ul className="text-[10px] text-amber-900 space-y-1 list-disc pl-4">
                      <li><strong>Interactive Guided Tour:</strong> Sora reads these exact room descriptions aloud when visitors take an interactive guided tour or tap on specific rooms.</li>
                      <li><strong>Custom Editing:</strong> You can edit room names, re-sequence the tour order, or update the script content anytime.</li>
                      <li><strong>Individual Save Entry Buttons:</strong> Click the <strong>Save Entry</strong> button on each room card below to immediately commit changes for that specific room.</li>
                      <li><strong>Luxury AI Rewriter:</strong> Click <em>"Generate Rewritten Luxury Text"</em> to rewrite prose using high-end real estate descriptors.</li>
                      <li><strong>Multilingual Support:</strong> On Pro plans, these English scripts automatically translate into 70+ languages on the fly during live tours.</li>
                    </ul>
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  {rooms.map((room, idx) => (
                    <div key={room.id} className="p-3 border rounded-xl border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-1">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-1.5 w-full">
                        <div className="flex items-center justify-between font-sans gap-2 flex-wrap">
                          <Input
                            value={room.name}
                            onChange={(e) => {
                              const updatedName = e.target.value;
                              const updated = rooms.map(r => r.id === room.id ? { ...r, name: updatedName } : r);
                              setRooms(updated);
                              setUserHasEdited(true);
                              if (selectedListing) {
                                localStorage.setItem(`rooms_tour_${selectedListing.id}`, JSON.stringify(updated));
                              }
                            }}
                            onBlur={() => {
                              initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, rooms);
                            }}
                            className="text-xs font-bold text-slate-900 uppercase tracking-wider h-7 bg-white border-slate-200 flex-1 max-w-xs"
                            placeholder="Room Title (e.g. Master Suite)"
                          />
                          <div className="flex items-center gap-1">
                            {/* Sequence Position adjustment buttons */}
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={idx === 0}
                              onClick={() => handleMoveRoomUp(idx)}
                              className="h-6 w-6 text-slate-400 hover:text-slate-850 disabled:opacity-30 bg-transparent shrink-0"
                              title="Move Up"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={idx === rooms.length - 1}
                              onClick={() => handleMoveRoomDown(idx)}
                              className="h-6 w-6 text-slate-400 hover:text-slate-850 disabled:opacity-30 bg-transparent shrink-0"
                              title="Move Down"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>

                            {/* Safe iFrame-Friendly Deletion Popup */}
                            {confirmDeleteRoomId === room.id ? (
                              <div className="flex items-center gap-1 p-1 bg-red-50 rounded border border-red-200 animate-in fade-in zoom-in-95 text-left ml-1 shrink-0">
                                <span className="text-[9px] font-bold text-red-600 px-1">Delete?</span>
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    handleDeleteRoom(room.id);
                                    setConfirmDeleteRoomId(null);
                                  }}
                                  className="h-5 px-1.5 text-[8px] bg-red-650 hover:bg-red-750 font-bold uppercase text-white cursor-pointer"
                                >
                                  Yes, Delete
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => setConfirmDeleteRoomId(null)}
                                  className="h-5 px-1.5 text-[8px] text-slate-500 hover:text-slate-800 cursor-pointer"
                                >
                                  No, Keep
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setConfirmDeleteRoomId(room.id)}
                                className="h-6 w-6 text-slate-400 hover:text-rose-600 bg-transparent shrink-0 transition-colors"
                                title="Delete Room"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <Textarea
                          value={room.script}
                          onChange={(e) => {
                            const updatedScript = e.target.value;
                            const updated = rooms.map(r => r.id === room.id ? { ...r, script: updatedScript } : r);
                            setRooms(updated);
                            setUserHasEdited(true);
                            if (selectedListing) {
                              localStorage.setItem(`rooms_tour_${selectedListing.id}`, JSON.stringify(updated));
                            }
                          }}
                          onBlur={() => {
                            initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, rooms);
                          }}
                          rows={2}
                          className="text-xs text-slate-800 bg-white border-slate-200 font-sans resize-y"
                          placeholder="Enter voice walkthrough narration script for this room..."
                        />
                        
                        <div className="flex flex-wrap gap-1.5 pt-1.5 mt-1 border-t border-dashed border-slate-200">
                          <Button
                            onClick={async () => {
                              await initiateAutoSave();
                              toast.success(`Saved room walkthrough script for "${room.name || 'Room'}"!`);
                            }}
                            className="whitespace-normal h-auto min-h-5.5 py-1 px-2.5 text-[9px] font-black uppercase bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-2xs"
                          >
                            <Save className="h-2.5 w-2.5 mr-1" /> Save Entry
                          </Button>

                          <Button
                            onClick={() => {
                              if (playingLang === `room_${room.id}`) {
                                stopSpeaking();
                              } else {
                                speakText(room.script, "English", `room_${room.id}`);
                              }
                            }}
                            variant="outline"
                            className="whitespace-normal h-auto min-h-5.5 py-1 px-2 text-[9px] font-bold uppercase border-slate-200 text-slate-700 hover:bg-slate-150 select-none bg-white text-left"
                          >
                            {playingLang === `room_${room.id}` ? (
                              <>
                                <Square className="h-2 w-2 mr-1 fill-rose-600 text-rose-600 animate-pulse" /> Stop Audio
                              </>
                            ) : (
                              <>
                                <Play className="h-2 w-2 mr-1 fill-slate-500 text-slate-500" /> Preview Sora Voice (English)
                              </>
                            )}
                          </Button>
                          
                          <Button
                            onClick={() => handleLuxuryRewriteRoom(room.id)}
                            disabled={rewritingRoomId === room.id}
                            className="whitespace-normal h-auto min-h-5.5 py-1 px-2.5 text-[9px] font-extrabold uppercase select-none transition-all duration-300 bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-400 cursor-pointer shadow-2xs"
                          >
                            {rewritingRoomId === room.id ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin mr-1 text-slate-950" />
                            ) : (
                              <Sparkles className="h-2.5 w-2.5 mr-1 text-slate-950 fill-slate-950" />
                            )}
                            Generate Rewritten Luxury Text
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add room console */}
                <div className="border-t border-slate-100 pt-3 space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-200 mt-1">
                  <p className="text-[10px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1">
                    <Plus className="h-3 w-3 text-amber-600" /> Add Tour Room Sequence (English)
                  </p>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-1">
                      <Label htmlFor="room-name" className="text-[9px] uppercase font-bold text-slate-600">Room Title (English)</Label>
                      <Input 
                        id="room-name"
                        placeholder="e.g., Wine Cellar, Patio" 
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        className="h-8 text-xs mt-0.5 bg-white text-stone-900" 
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="room-script" className="text-[9px] uppercase font-bold text-slate-600">Voice Tour Script (English)</Label>
                      <Input 
                        id="room-script"
                        placeholder="Underneath the stairs lies our climate-gated cellar space..." 
                        value={newRoomScript}
                        onChange={(e) => setNewRoomScript(e.target.value)}
                        className="h-8 text-xs mt-0.5 bg-white text-stone-900" 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-0.5">
                    <Button 
                      onClick={handleAddRoom}
                      className="bg-amber-600 hover:bg-amber-500 text-[9px] font-black uppercase h-7 px-3.5"
                    >
                      Add Room Block
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="py-2.5 px-4 border-t border-slate-100 bg-white flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-500">
                  {isRoomsDirty ? "● Unsaved changes" : "✓ Saved to Firestore"}
                </span>
                <Button 
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, rooms);
                      toast.success("Room-by-Room Walkthrough content saved successfully!");
                    } catch (err) {
                      toast.error("Failed to save walkthrough content");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  size="sm"
                  className="h-7 px-3 bg-[#e17100] hover:bg-[#b05800] text-white font-black text-[9px] uppercase cursor-pointer rounded-lg border-none flex items-center gap-1"
                >
                  {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Walkthrough
                </Button>
              </CardFooter>
            </Card>

            {/* Buyer Q&A Repository */}
            <Card className="w-full border-stone-200 shadow-sm bg-white rounded-2xl overflow-hidden mx-0">
              <CardHeader className="py-2.5 px-4 border-b border-slate-100 bg-white">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-stone-900">
                    <MessageSquare className="h-4 w-4 text-amber-600" /> Sora's Knowledge Base (Buyer Q&A)
                    <button 
                      type="button"
                      onClick={() => setShowQaInfo(!showQaInfo)}
                      className="p-1 rounded-full text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer ml-1"
                      title="What is Sora's Knowledge Base? Click for info."
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                      🇬🇧 English Master Knowledge
                    </span>
                    <Button
                      size="sm"
                      onClick={async () => {
                        await initiateAutoSave();
                        toast.success("✅ Sora Q&A Knowledge Base saved successfully!");
                      }}
                      className="h-6 text-[9px] font-black uppercase bg-slate-900 hover:bg-slate-800 text-white px-2.5 cursor-pointer"
                    >
                      <Save className="h-2.5 w-2.5 mr-1" /> Save Q&A
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-[10px] text-stone-500 font-medium">Teach Sora listing facts in English. Use <strong>Generate Rewritten Luxury Text</strong> to polish answers. On Pro plans, Sora auto-converts responses on the fly to 70+ client languages.</CardDescription>

                {showQaInfo && (
                  <div className="mt-2.5 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1.5 animate-in fade-in slide-in-from-top-1 text-left">
                    <div className="flex items-center justify-between font-bold text-amber-900">
                      <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5 text-amber-600" /> What is Sora's Knowledge Base (Buyer Q&A)?</span>
                      <button onClick={() => setShowQaInfo(false)} className="text-amber-700 hover:text-amber-950 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-amber-100 cursor-pointer">✕ Close</button>
                    </div>
                    <p className="text-[11px] text-amber-900/90 leading-relaxed">
                      Sora's Knowledge Base contains vetted property facts that Sora uses to answer prospective buyer questions accurately during open house visits and online voice tours.
                    </p>
                    <ul className="text-[10px] text-amber-900 space-y-1 list-disc pl-4">
                      <li><strong>Grounding & Accuracy:</strong> Guarantees Sora answers with facts you provide (e.g. HOA dues, roof/HVAC age, school zones, inclusions, recent updates) and avoids AI hallucination.</li>
                      <li><strong>Individual Save Entry Buttons:</strong> Click <strong>Save Entry</strong> on any fact card below to instantly save edits for that specific Q&A topic.</li>
                      <li><strong>Add Custom Facts:</strong> Add new listing topics and custom answers using the console at the bottom of the card.</li>
                      <li><strong>Multilingual Answers:</strong> On Pro plans, Sora auto-converts these answers on the fly to match the client's language during live voice chat.</li>
                    </ul>
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  {qas.map((qaItem, idx) => (
                    <div key={idx} className="p-3 bg-stone-50/50 border rounded-xl border-stone-200 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-1">
                          <span className="text-xs font-black text-amber-700 shrink-0">Q:</span>
                          <Input
                            value={qaItem.question}
                            onChange={(e) => {
                              const updatedQ = e.target.value;
                              const updated = qas.map((q, i) => i === idx ? { ...q, question: updatedQ } : q);
                              setQas(updated);
                              setUserHasEdited(true);
                              if (selectedListing) {
                                localStorage.setItem(`qas_tour_${selectedListing.id}`, JSON.stringify(updated));
                              }
                            }}
                            onBlur={() => {
                              initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, rooms, qas);
                            }}
                            className="h-7 text-xs font-bold text-stone-900 bg-white border-stone-200 flex-1"
                            placeholder="Question topic or prompt..."
                          />
                        </div>
                        
                        {/* Safe iFrame-Friendly Deletion Popup */}
                        {confirmDeleteQaIdx === idx ? (
                          <div className="flex items-center gap-1.5 p-1 bg-rose-50 rounded border border-rose-200 animate-in fade-in zoom-in-95 text-left shrink-0">
                            <span className="text-[9px] font-bold text-rose-800 px-1">Delete?</span>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                handleDeleteQa(idx);
                                setConfirmDeleteQaIdx(null);
                              }}
                              className="h-5 px-1.5 text-[8px] bg-red-650 hover:bg-red-700 font-bold uppercase text-white cursor-pointer"
                            >
                              Yes, Delete
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setConfirmDeleteQaIdx(null)}
                              className="h-5 px-1.5 text-[8px] border-slate-200 hover:bg-slate-50 font-bold uppercase text-stone-700 bg-white cursor-pointer"
                            >
                              No, Keep
                            </Button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setConfirmDeleteQaIdx(idx)}
                            className="text-stone-400 hover:text-rose-600 transition-colors shrink-0 p-1"
                            title="Delete Fact"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-start gap-1.5 w-full">
                        <span className="text-xs font-black text-amber-700 shrink-0 mt-1">A:</span>
                        <Textarea
                          value={qaItem.answer}
                          onChange={(e) => {
                            const updatedA = e.target.value;
                            const updated = qas.map((q, i) => i === idx ? { ...q, answer: updatedA } : q);
                            setQas(updated);
                            setUserHasEdited(true);
                            if (selectedListing) {
                              localStorage.setItem(`qas_tour_${selectedListing.id}`, JSON.stringify(updated));
                            }
                          }}
                          onBlur={() => {
                            initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, rooms, qas);
                          }}
                          rows={2}
                          className="text-xs text-stone-800 bg-white border-stone-200 font-sans resize-y"
                          placeholder="Sora's vetted answer for this property fact..."
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-dashed border-stone-200/80">
                        <Button
                          onClick={async () => {
                            await initiateAutoSave();
                            toast.success(`Saved Q&A fact "${qaItem.question || 'Entry'}"!`);
                          }}
                          className="whitespace-normal h-auto min-h-5.5 py-1 px-2.5 text-[9px] font-black uppercase bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-2xs"
                        >
                          <Save className="h-2.5 w-2.5 mr-1" /> Save Entry
                        </Button>

                        <Button
                          onClick={() => {
                            if (playingLang === `qa_${idx}`) {
                              stopSpeaking();
                            } else {
                              speakText(qaItem.answer, "English", `qa_${idx}`);
                            }
                          }}
                          variant="outline"
                          className="whitespace-normal h-auto min-h-5.5 py-1 px-2 text-[9px] font-bold uppercase border-stone-200 text-stone-700 hover:bg-stone-50 select-none text-left"
                        >
                          {playingLang === `qa_${idx}` ? (
                            <>
                              <Square className="h-2 w-2 mr-1 fill-rose-600 text-rose-600 animate-pulse" /> Stop Audio
                            </>
                          ) : (
                            <>
                              <Play className="h-2 w-2 mr-1 fill-stone-700 text-stone-700" /> Preview Sora Voice (English)
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => handleLuxuryRewriteQa(idx)}
                          disabled={rewritingQaIdx === idx}
                          className="whitespace-normal h-auto min-h-5.5 py-1 px-2.5 text-[9px] font-extrabold uppercase select-none transition-all duration-300 bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-400 cursor-pointer shadow-2xs"
                        >
                          {rewritingQaIdx === idx ? (
                            <Loader2 className="h-2.5 w-2.5 animate-spin mr-1 text-slate-950" />
                          ) : (
                            <Sparkles className="h-2.5 w-2.5 mr-1 text-slate-950 fill-slate-950" />
                          )}
                          Generate Rewritten Luxury Text
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-100 pt-3 space-y-1.5">
                  <p className="text-[10px] font-black uppercase text-stone-700">Add Custom Listing Fact (English)</p>
                  <div className="space-y-1.5">
                    <Input 
                      placeholder="e.g., What are the school zonings? (English)" 
                      value={newQuestion}
                      onChange={(e) => {
                        const val = e.target.value;
                        const formatted = val.charAt(0).toUpperCase() + val.slice(1);
                        setNewQuestion(formatted);
                      }}
                      className="h-8 text-xs" 
                    />
                    <Textarea 
                      placeholder="Situated in top Hilltop Elementary and Westlake High jurisdictions... (English)" 
                      value={newAnswer}
                      onChange={(e) => {
                        const val = e.target.value;
                        const formatted = val.charAt(0).toUpperCase() + val.slice(1);
                        setNewAnswer(formatted);
                      }}
                      rows={2}
                      className="text-xs" 
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleAddQa} className="bg-amber-600 hover:bg-amber-500 text-[9px] font-black uppercase h-7 px-3.5">
                        Add Question Fact
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="py-2.5 px-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-500">
                  {isQasDirty ? "● Unsaved changes" : "✓ Saved to Firestore"}
                </span>
                <Button 
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, rooms, qas);
                      toast.success("Knowledge Base (Buyer Q&A) saved successfully!");
                    } catch (err) {
                      toast.error("Failed to save knowledge base");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  size="sm"
                  className="h-7 px-3 bg-[#e17100] hover:bg-[#b05800] text-white font-black text-[9px] uppercase cursor-pointer rounded-lg border-none flex items-center gap-1"
                >
                  {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Knowledge Base
                </Button>
              </CardFooter>
            </Card>

          </div>

          {/* Settings / Controls Column */}
          <div className="space-y-4 min-w-0 w-full">
            
            {/* Tour CTA Config */}
            <Card className="border-stone-200 shadow-sm bg-white rounded-2xl overflow-hidden w-full mx-0">
              <CardHeader className="py-2.5 px-4 border-b border-slate-100 bg-white">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-stone-850">Client-facing Interactive Buttons</CardTitle>
                <CardDescription className="text-[10px] text-stone-500 font-medium">Set clickable action prompts shown on client smartphones while listening.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1 font-sans">
                  {ctas.map((cta, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-stone-50 p-2 rounded-lg border border-stone-200">
                      <div className="text-[10px] font-bold text-stone-800 leading-tight">
                        {cta.label} <span className="text-[8px] font-normal text-stone-500">({cta.action})</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setCtaToDelete({ index: idx, label: cta.label })}
                        className="text-stone-400 hover:text-rose-500 hover:bg-rose-50 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                {/* Delete interactive button confirm modal */}
                {ctaToDelete !== null && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                    <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 text-center space-y-4 animate-scale-up font-sans">
                      <div className="flex justify-center">
                        <div className="p-3 bg-red-105 text-red-650 rounded-full bg-red-50">
                          <Trash2 className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                      <div className="space-y-1.5 text-center">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Confirm Deletion</h4>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          Do you want this <span className="font-bold text-slate-900">({ctaToDelete.label})</span> deleted?
                        </p>
                      </div>
                      <div className="flex gap-3 justify-center pt-2">
                        <Button
                          type="button"
                          onClick={() => {
                            handleDeleteCta(ctaToDelete.index);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 px-5 rounded-xl cursor-pointer min-w-[80px]"
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCtaToDelete(null)}
                          className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs h-9 px-5 rounded-xl cursor-pointer min-w-[80px]"
                        >
                          No
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-2.5 space-y-1.5">
                  <p className="text-[10px] uppercase font-black text-stone-500">Insert Custom Interactive CTA Button</p>
                  <div className="space-y-1.5 font-sans">
                    <Input 
                      placeholder="e.g. Schedule Private Viewing" 
                      value={newCtaLabel}
                      onChange={(e) => {
                        let val = e.target.value;
                        const words = val.split(" ");
                        const formatted = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                        setNewCtaLabel(formatted);
                      }}
                      className="h-8 text-xs bg-white" 
                    />
                    <select 
                      className="bg-white border text-xs w-full h-8 rounded-lg outline-none px-2 focus:ring-1 focus:ring-amber-500 text-stone-700"
                      value={newCtaAction}
                      onChange={(e) => setNewCtaAction(e.target.value)}
                    >
                      <option value="calendar">Action: Book a Showing</option>
                      <option value="documents">Action: Request Document Package</option>
                      <option value="lender">Action: Request Financing Options</option>
                    </select>
                    <Button onClick={handleAddCta} className="w-full bg-amber-600 hover:bg-amber-500 text-[9px] font-black uppercase h-7 mt-0.5">
                      Add Interaction Key
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="py-2.5 px-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-500">
                  {isCtasDirty ? "● Unsaved changes" : "✓ Saved to Firestore"}
                </span>
                <Button 
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await initiateAutoSave(welcomeEn, welcomeFr, welcomeOtherScript, targetLang, rooms, qas, ctas);
                      toast.success("Client-facing Interactive Buttons saved successfully!");
                    } catch (err) {
                      toast.error("Failed to save interactive buttons");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  size="sm"
                  className="h-7 px-3 bg-[#e17100] hover:bg-[#b05800] text-white font-black text-[9px] uppercase cursor-pointer rounded-lg border-none flex items-center gap-1"
                >
                  {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Interactive Buttons
                </Button>
              </CardFooter>
            </Card>

            {/* AI Tour Entry Gates & Flow */}
            <Card className="border-slate-200 shadow-sm bg-white text-black rounded-2xl overflow-hidden w-full mx-0 flex flex-col justify-between">
              <CardHeader className="py-2.5 px-4 border-b border-slate-100 bg-white">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    Verification & Gating Rules
                    <button 
                      type="button"
                      onClick={() => setShowGatingInfo(!showGatingInfo)}
                      className="p-1 rounded-full text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer ml-0.5"
                      title="What are Verification & Gating Rules? Click for info."
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </CardTitle>
                <CardDescription className="text-[10px] text-slate-500 font-medium">Govern when playing tours prompt and lock behind guest sign-ins.</CardDescription>

                {showGatingInfo && (
                  <div className="mt-2.5 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1.5 animate-in fade-in slide-in-from-top-1 text-left">
                    <div className="flex items-center justify-between font-bold text-amber-900">
                      <span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5 text-amber-600" /> What are Verification & Gating Rules?</span>
                      <button onClick={() => setShowGatingInfo(false)} className="text-amber-700 hover:text-amber-950 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-amber-100 cursor-pointer">✕ Close</button>
                    </div>
                    <p className="text-[11px] text-amber-900/90 leading-relaxed">
                      Verification & Gating Rules control how visitors interact with Sora during open house visits and online microsite tours.
                    </p>
                    <ul className="text-[10px] text-amber-900 space-y-1 list-disc pl-4">
                      <li><strong>Mandatory Sign-In:</strong> Forces attendees to complete lead check-in before Sora narrate room scripts.</li>
                      <li><strong>No Gate:</strong> Direct instant access to tour narration without requiring check-in first.</li>
                      <li><strong>70-Language Multilingual Support:</strong> Allows Sora to detect and speak 70+ client languages on the fly (Gated to Pro Plans).</li>
                      <li><strong>Active Lender Handoff:</strong> Enables Sora to introduce your paired mortgage specialist when attendees ask financing questions or opt-in for rate information.</li>
                    </ul>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1.5 font-sans">
                  <Label className="text-[10px] font-black uppercase text-slate-700 font-bold">Open House Entry Sign-In Gate</Label>
                  <div className="grid grid-cols-2 gap-1 font-sans">
                    <button 
                      onClick={() => { setSignInPrompt("start"); setUserHasEdited(true); }}
                      className={`px-2 py-1.5 text-[9px] rounded-lg border text-center transition-all duration-200 cursor-pointer ${
                        signInPrompt === 'start' 
                          ? 'bg-amber-50 border-amber-500 text-amber-800 font-extrabold' 
                          : 'bg-white text-stone-600 border-stone-200 font-bold'
                      } hover:bg-[#e17100] hover:text-white hover:font-bold hover:border-[#e17100]`}
                    >
                      Mandatory (Prompt First)
                    </button>
                    <button 
                      onClick={() => { setSignInPrompt("none"); setUserHasEdited(true); }}
                      className={`px-2 py-1.5 text-[9px] rounded-lg border text-center transition-all duration-200 cursor-pointer ${
                        signInPrompt === 'none' 
                          ? 'bg-amber-50 border-amber-500 text-amber-800 font-extrabold' 
                          : 'bg-white text-stone-600 border-stone-200 font-bold'
                      } hover:bg-[#e17100] hover:text-white hover:font-bold hover:border-[#e17100]`}
                    >
                      No Gate (Direct)
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-500 italic font-medium leading-tight mt-0.5">
                    Mandatory requires full check-in before Sora narrate the room scriptures. No Gate allows instant access.
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-2.5 font-sans text-left">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase text-slate-700 font-bold">Enabled Features</Label>
                  </div>
                  
                  <div className="space-y-1.5 pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 opacity-80">
                      <input 
                        type="checkbox" 
                        checked={true} 
                        disabled={true}
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 accent-amber-600"
                      />
                      Enable Sora voice synthetic audio (Always On)
                    </label>

                    <label className={`flex items-center gap-2 text-xs font-semibold flex-wrap p-1.5 rounded-lg border transition-all ${!isPro ? "bg-slate-100/70 border-slate-200 opacity-60 grayscale cursor-not-allowed select-none" : "border-transparent cursor-pointer text-slate-700"}`}>
                      <input 
                        type="checkbox" 
                        checked={multilingualEnabled && isPro} 
                        disabled={!isPro}
                        onChange={(e) => {
                          if (!isPro) return;
                          const val = e.target.checked;
                          setMultilingualEnabled(val);
                          setUserHasEdited(true);
                        }}
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 accent-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className={!isPro ? "text-slate-500 font-medium line-through decoration-slate-400" : "text-slate-700 font-semibold"}>
                        Enable Multilingual Support (70 languages)
                      </span>
                      {!isPro && (
                        <span 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toast.error("Pro Plan Required", {
                              description: "You must have the Pro Advanced Conversational AI plan in order to enable 70-language multilingual support."
                            });
                          }}
                          className="text-[9px] font-extrabold uppercase bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300 ml-1 cursor-pointer hover:bg-amber-200 flex items-center gap-1 shadow-2xs"
                        >
                          <Lock className="h-2.5 w-2.5 text-amber-800" /> Pro Plan Required
                        </span>
                      )}
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={lenderHandoff} 
                        onChange={(e) => {
                          const val = e.target.checked;
                          setLenderHandoff(val);
                          setUserHasEdited(true);
                        }}
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 accent-amber-600"
                      />
                      Active Lender Handoff
                    </label>
                  </div>

                  {lenderHandoff && (
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1 mt-2 text-left">
                      <Label className="text-[9px] font-black uppercase text-slate-700 font-bold">Paired Mortgage Specialist</Label>
                      <select 
                        value={selectedLenderName}
                        onChange={(e) => { setSelectedLenderName(e.target.value); setUserHasEdited(true); }}
                        className="bg-white border text-[10px] h-7 rounded-md w-full outline-none px-1.5 focus:ring-1 focus:ring-amber-500 mt-0.5 font-bold text-stone-750"
                      >
                        <option value="Pinnacle Capital Partners (Preferred)">Pinnacle Capital Partners (Preferred)</option>
                        <option value="LendWise Solutions Inc.">LendWise Solutions Inc.</option>
                        <option value="Alliance Residential Lending">Alliance Residential Lending</option>
                      </select>
                      <p className="text-[9px] text-slate-500 font-medium leading-tight mt-0.5">When a client opts-in for mortgage help during the tour, lead metadata immediately routes to this specialist.</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="py-2.5 px-4 border-t border-slate-100 bg-white flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-500">
                  {isGatingDirty ? "● Unsaved changes" : "✓ Saved to Firestore"}
                </span>
                <Button 
                  onClick={handleSaveGatingRules}
                  disabled={loading}
                  size="sm"
                  className="h-7 px-3 bg-[#e17100] hover:bg-[#b05800] text-white font-black text-[9px] uppercase cursor-pointer rounded-lg border-none flex items-center gap-1"
                >
                  {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Rules
                </Button>
              </CardFooter>
            </Card>

          </div>

        </div>
      )}

      {/* Language Conflict Modal Window */}
      {langConflictOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="max-w-md w-full bg-stone-900 border border-stone-700 text-white shadow-2xl p-6 rounded-2xl space-y-4">
            <CardHeader className="p-0 space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Sparkles className="h-5 w-5 animate-pulse text-amber-400 fill-amber-300" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-100 uppercase tracking-wide">Language Alignment Optimizer</CardTitle>
              </div>
              <CardDescription className="text-[11px] text-slate-300">
                Sora detected mismatched target languages across your active tour sections.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 text-slate-200 text-xs leading-relaxed space-y-2">
              <p>
                Your Welcome Translation target language is set to <strong className="text-amber-400 uppercase font-black">{targetLang}</strong>.
              </p>
              {langConflictType === "both" && (
                <p>
                  However, your **Room Walkthrough script** ({roomTargetLang}) and **Knowledge Base Q&A** ({qaTargetLang}) target different languages.
                </p>
              )}
              {langConflictType === "rooms" && (
                <p>
                  However, your **Room-by-Room Walkthrough target language** is currently ({roomTargetLang}).
                </p>
              )}
              {langConflictType === "qas" && (
                <p>
                  However, your **Sora Knowledge Base target language** is currently ({qaTargetLang}).
                </p>
              )}
              <p className="font-extrabold text-amber-300">
                Would you like Sora to automatically align and translate these walkthrough scripts to {targetLang}?
              </p>
            </CardContent>

            <CardFooter className="p-0 pt-3 flex flex-col sm:flex-row sm:items-center justify-end gap-2 text-right">
              <Button
                variant="outline"
                onClick={() => {
                  setLangConflictOpen(false);
                  executePublish(rooms, qas, roomTargetLang, qaTargetLang);
                }}
                className="w-full sm:w-auto bg-transparent border-stone-600 text-stone-200 hover:bg-stone-800 text-[10px] font-bold uppercase cursor-pointer"
              >
                No, leave as is
              </Button>
              <Button
                onClick={async () => {
                  setLangConflictOpen(false);
                  await translateAllToTarget();
                }}
                className="w-full sm:w-auto bg-[#155dfc] hover:bg-[#0c4fd2] text-white text-[10px] font-bold uppercase cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-3 w-3" /> Yes, translate it
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
