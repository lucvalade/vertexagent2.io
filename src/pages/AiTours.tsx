import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAllListings, getUserListings, updateListing, Listing } from "@/lib/api";
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
  Square
} from "lucide-react";

export default function AiTours() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  
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
    const dictionary: Record<string, { preview: string; translateRoom: string; translateAnswer: string }> = {
      French: {
        preview: "Écouter la voix de Sora (Français)",
        translateRoom: "Traduire en Français",
        translateAnswer: "Traduire la resposta en Français"
      },
      Spanish: {
        preview: "Escuchar la voz de Sora (Español)",
        translateRoom: "Traducir al Español",
        translateAnswer: "Traducir respuesta al Español"
      },
      German: {
        preview: "Sora-Stimme anhören (Deutsch)",
        translateRoom: "Auf Deutsch übersetzen",
        translateAnswer: "Antwort auf Deutsch übersetzen"
      },
      Italian: {
        preview: "Ascolta la voce di Sora (Italiano)",
        translateRoom: "Traduci in Italiano",
        translateAnswer: "Traduci la risposta in Italiano"
      },
      Portuguese: {
        preview: "Ouvir a voz de Sora (Português)",
        translateRoom: "Traduzir para Português",
        translateAnswer: "Traduzir resposta para Português"
      },
      Mandarin: {
        preview: "预览Sora语音 (中文)",
        translateRoom: "翻译成中文",
        translateAnswer: "将回答翻译成中文"
      },
      Japanese: {
        preview: "Soraの音声プレビュー (日本語)",
        translateRoom: "日本語に翻訳",
        translateAnswer: "回答を日本語に翻訳"
      },
      Dutch: {
        preview: "Sora-stem beluisteren (Nederlands)",
        translateRoom: "Vertaal naar het Nederlands",
        translateAnswer: "Vertaal antwoord naar het Nederlands"
      },
      Russian: {
        preview: "Прослушать голос Sora (Русский)",
        translateRoom: "Перевести на русский",
        translateAnswer: "Перевести ответ на русский"
      },
      Arabic: {
        preview: "معاينة صوت سورا (العربية)",
        translateRoom: "ترجم إلى العربية",
        translateAnswer: "ترجم الإجابة إلى العربية"
      },
      English: {
        preview: "Preview Sora Voice (English)",
        translateRoom: "Translate to English",
        translateAnswer: "Translate Answer to English"
      }
    };

    return dictionary[lang] || {
      preview: `Preview Sora Voice (${lang})`,
      translateRoom: `Translate to ${lang}`,
      translateAnswer: `Translate Answer to ${lang}`
    };
  };

  // AI (Sora) Loading State
  const [soraGenerating, setSoraGenerating] = useState(false);

  // AI Multilingual States
  const [targetLang, setTargetLang] = useState("Spanish");
  const [roomTargetLang, setRoomTargetLang] = useState("French");
  const [qaTargetLang, setQaTargetLang] = useState("French");
  const [welcomeOtherScript, setWelcomeOtherScript] = useState("");
  const [translating, setTranslating] = useState(false);
  const [shortening, setShortening] = useState(false);
  const [shorteningFr, setShorteningFr] = useState(false);
  const [shorteningOther, setShorteningOther] = useState(false);
  const [playingLang, setPlayingLang] = useState<string | null>(null); // "en" | "fr" | "other"

  const [translatingRoomId, setTranslatingRoomId] = useState<string | null>(null);
  const [translatingQaIdx, setTranslatingQaIdx] = useState<number | null>(null);

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
    if (!welcomeEn) {
      toast.error("Please enter or generate an English script first.");
      return;
    }
    setTranslating(true);
    try {
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
        toast.success(`Successfully translated welcome script to ${targetLang}!`);
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
        }
        toast.success(`Succesfully translated room script to ${roomTargetLang}! Save changes by publishing.`);
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
        }
        toast.success(`Successfully translated answer to ${qaTargetLang}! Save changes by publishing.`);
      } else {
        toast.error(data.error || "Failed online translation.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to translate answer.");
    } finally {
      setTranslatingQaIdx(null);
    }
  };

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
      const data = isAdmin ? await getAllListings() : await getUserListings(user.id);
      setListings(data || []);
      if (data && data.length > 0) {
        const idToSelect = preserveId || selectedListing?.id || data[0].id;
        const matching = data.find(l => l.id === idToSelect);
        if (matching) {
          handleSelectListing(matching);
        } else {
          handleSelectListing(data[0]);
        }
      }
    } catch (err) {
      toast.error("Failed to load listings for AI Tour configuration");
    } finally {
      setLoading(false);
    }
  }

  const handleSelectListing = (listing: Listing) => {
    setSelectedListing(listing);
    
    // Determine the English script text (avoiding base64 binary sound URLs)
    let initialEnScript = "";
    if (listing.welcome_en_script) {
      initialEnScript = listing.welcome_en_script;
    } else if (listing.welcome_en && !listing.welcome_en.startsWith("data:audio") && !listing.welcome_en.endsWith(".mp3") && listing.welcome_en.length < 1000) {
      initialEnScript = listing.welcome_en;
    } else {
      initialEnScript = "Hi, I'm Sora, your AI property assistant. This tour shows how I connect listings, answer client questions, book showings, and run your open house gate and lead sign-in. Tap each step to follow along.";
    }
    setWelcomeEn(initialEnScript);

    // Determine the French script text (avoiding base64 binary sound URLs)
    let initialFrScript = "";
    if (listing.welcome_fr_script) {
      initialFrScript = listing.welcome_fr_script;
    } else if (listing.welcome_fr && !listing.welcome_fr.startsWith("data:audio") && !listing.welcome_fr.endsWith(".mp3") && listing.welcome_fr.length < 1000) {
      initialFrScript = listing.welcome_fr;
    } else {
      initialFrScript = "Bonjour, je suis Sora, votre assistante immobilière IA. Cette visite guidée vous montre comment je mets en relation les annonces, réponds aux questions des clients, planifie les visites et gère l'accueil des visiteurs lors des journées portes ouvertes et l'inscription des prospects. Touchez chaque étape pour suivre le tutoriel.";
    }
    setWelcomeFr(initialFrScript);

    setTargetLang(listing.welcome_other_lang || "Spanish");
    setRoomTargetLang(listing.welcome_other_lang || "Spanish");
    setQaTargetLang(listing.welcome_other_lang || "Spanish");
    setWelcomeOtherScript(listing.welcome_other_script || "");

    setTalkingPoints(listing.talkingPoints || [
      "Custom crown moldings and hand-scraped white oak floors",
      "Floor-to-ceiling windows boasting panoramic skyline views",
      "Professional-grade chef's kitchen featuring Sub-Zero appliances",
      "Private outdoor terrace with customized heating units"
    ]);

    // Initial Rooms set
    const savedRooms = localStorage.getItem(`rooms_tour_${listing.id}`);
    if (savedRooms) {
      setRooms(JSON.parse(savedRooms));
    } else {
      const defaultRooms = [
        { id: "1", name: "Grand Foyer", script: "We begin in the grand foyer, accented by double-height ceilings and custom brass chandelier fixtures. Take a moment to notice the seamless alignment of the white oak floors flowing elegantly into the main living pavilion.", order: 1 },
        { id: "2", name: "Chef's Kitchen", script: "Next is the kitchen. This culinary studio features a massive Calacatta gold marble island, custom soft-close cabinetry, and integrated Sub-Zero refrigerator. Perfect for both morning espresso and large catering events.", order: 2 },
        { id: "3", name: "Primary Oasis", script: "Finally, the master chamber features dual walk-in dressing suites, motorized sun shades, and a spa-inspired wet bath complete with a freestanding soaking tub and direct private balcony access.", order: 3 }
      ];
      setRooms(defaultRooms);
      localStorage.setItem(`rooms_tour_${listing.id}`, JSON.stringify(defaultRooms));
    }

    // Initial Q&As
    const savedQas = localStorage.getItem(`qas_tour_${listing.id}`);
    if (savedQas) {
      setQas(JSON.parse(savedQas));
    } else {
      const defaultQas = [
        { question: "When was the roof last replaced?", answer: "The roof was fully replaced in Fall 2024 with premium architectural shingles designed to withstand adverse weather, backed by a fully transferable 30-year warranty." },
        { question: "What is the average utility cost?", answer: "Thanks to newly installed high-efficiency dual-zone heat pumps and multi-pane smart glass, the average combined monthly HVAC and electric utilities operate under $240, even during peak summer months." }
      ];
      setQas(defaultQas);
      localStorage.setItem(`qas_tour_${listing.id}`, JSON.stringify(defaultQas));
    }

    // Custom CTAs selection
    const savedCtas = localStorage.getItem(`ctas_tour_${listing.id}`);
    if (savedCtas) {
      setCtas(JSON.parse(savedCtas));
    } else if ((listing as any).ctas) {
      setCtas((listing as any).ctas);
    } else {
      const defaultCtas = [
        { label: "Book Private Tour", action: "calendar" },
        { label: "Request Disclosures & Floor Plans", action: "documents" }
      ];
      setCtas(defaultCtas);
      localStorage.setItem(`ctas_tour_${listing.id}`, JSON.stringify(defaultCtas));
    }

    // Load basic voice / sign-in configurations from listing
    setVoiceEnabled(listing.voiceEnabled !== undefined ? !!listing.voiceEnabled : (listing.voiceName !== "Disabled"));
    setMultilingualEnabled(!!(listing as any).multilingualEnabled);
    setLenderHandoff(!!(listing as any).lenderHandoff);
    setSelectedLenderName((listing as any).selectedLenderName || "Pinnacle Capital Partners (Preferred)");
    setSignInPrompt(listing.qrDestination === "sign-in" ? "start" : "none");
  };

  // AI (Sora) action: Generate Tour Intro
  const handleGenerateTourIntro = () => {
    if (!selectedListing) return;
    setSoraGenerating(true);
    
    // Simulate premium human-like Sora response based on the listing facts
    setTimeout(() => {
      const generated = `Welcome to the exquisite property at ${selectedListing.address}. I am Sora, your dedicated real estate AI advisor. Today, I'll be guiding you through a modern masterpiece featuring ${selectedListing.beds || 3} bedrooms and ${selectedListing.baths || 3} bathrooms across ${selectedListing.sqft || "3,200"} finished square feet of absolute luxury. Let's pause in the foyer and begin our tour of these premium spaces.`;
      setWelcomeEn(generated);
      setSoraGenerating(false);
      toast.success("Sora generated a beautiful, professional tour introduction!");
    }, 1200);
  };

  // AI (Sora) action: Rewrite Tour with more premium copywriting
  const handleRewriteTour = () => {
    if (!selectedListing) return;
    setSoraGenerating(true);
    
    setTimeout(() => {
      const rewritten = `Step inside ${selectedListing.address}, where classic sophistication meets state-of-the-art living. I am Sora, your AI companion. Notice the abundance of dramatic natural light and refined structural symmetry surrounding you. Every corner of this ${selectedListing.propertyType || "estate"} has been meticulously curated. Let's begin searching for your perfect sanctuary.`;
      setWelcomeEn(rewritten);
      setSoraGenerating(false);
      toast.success("Sora rewrote the welcome script into ultra-premium luxury style.");
    }, 1200);
  };

  const handleShortenScript = async (type: "en" | "fr" | "other") => {
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
        } else if (type === "fr") {
          setWelcomeFr(data.shortenedText);
        } else {
          setWelcomeOtherScript(data.shortenedText);
        }
        toast.success("Script successfully condensed by Sora into a fast-speaking, premium concise format!");
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
  };

  const handleDeleteRoom = (roomId: string) => {
    if (!selectedListing) return;
    const updated = rooms.filter(r => r.id !== roomId);
    setRooms(updated);
    localStorage.setItem(`rooms_tour_${selectedListing.id}`, JSON.stringify(updated));
    toast.info("Room removed from tour");
  };

  const handleMoveRoomUp = (index: number) => {
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
  };

  const handleMoveRoomDown = (index: number) => {
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
  };

  const handleDeleteQa = (index: number) => {
    if (!selectedListing) return;
    const updated = qas.filter((_, i) => i !== index);
    setQas(updated);
    localStorage.setItem(`qas_tour_${selectedListing.id}`, JSON.stringify(updated));
  };

  const handleAddCta = () => {
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
    }
    setNewCtaLabel("");
    toast.success("Added new interaction button on the mobile client experience.");
  };

  const handleDeleteCta = (index: number) => {
    const updated = ctas.filter((_, i) => i !== index);
    setCtas(updated);
    if (selectedListing) {
      localStorage.setItem(`ctas_tour_${selectedListing.id}`, JSON.stringify(updated));
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
      // Save elements directly into the listing model in Firestore
      await updateListing(selectedListing.id, {
        welcome_en_script: welcomeEn,
        welcome_fr_script: welcomeFr,
        welcome_other_lang: targetLang,
        welcome_other_script: welcomeOtherScript,
        room_walkthrough_lang: pubRoomLang,
        qa_knowledge_lang: pubQaLang,
        // Bypass text scripts if the existing field values are voice base64 URLs
        ...(selectedListing.welcome_en?.startsWith("data:audio") ? {} : { welcome_en: welcomeEn }),
        ...(selectedListing.welcome_fr?.startsWith("data:audio") ? {} : { welcome_fr: welcomeFr }),
        talkingPoints: talkingPoints,
        qrDestination: signInPrompt === "start" ? "sign-in" : "tour",
        voiceName: voiceEnabled ? "Sora Studio Male/Female (Neural)" : "Disabled",
        voiceEnabled: voiceEnabled,
        multilingualEnabled: multilingualEnabled,
        lenderHandoff: lenderHandoff,
        selectedLenderName: selectedLenderName,
        ctas: ctas,
        publishedAt: new Date().toISOString()
      });

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
      await updateListing(selectedListing.id, {
        qrDestination: signInPrompt === "start" ? "sign-in" : "tour",
        voiceName: voiceEnabled ? "Sora Studio Male/Female (Neural)" : "Disabled",
        voiceEnabled: voiceEnabled,
        multilingualEnabled: multilingualEnabled,
        lenderHandoff: lenderHandoff,
        selectedLenderName: selectedLenderName,
        updatedAt: Date.now()
      });
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

  const isDirty = !!(selectedListing && (
    welcomeEn !== (selectedListing.welcome_en_script || selectedListing.welcome_en || "") ||
    welcomeFr !== (selectedListing.welcome_fr_script || selectedListing.welcome_fr || "") ||
    targetLang !== (selectedListing.welcome_other_lang || "Spanish") ||
    welcomeOtherScript !== (selectedListing.welcome_other_script || "")
  ));

  return (
    <div className="space-y-8">
      {/* Header section with listing selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-stone-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 font-sans">Sora Tour Workspace</h1>
          <p className="text-slate-500 mt-1">Design, edit, and publish guided AI Tours featuring your brand and a voice-ready narrator.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Label className="text-xs font-extrabold uppercase tracking-wider text-black whitespace-nowrap">Configure Property:</Label>
          <select 
            className="bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800"
            value={selectedListing?.id || ""}
            onChange={(e) => {
              const found = listings.find(l => l.id === e.target.value);
              if (found) handleSelectListing(found);
            }}
          >
            {listings.map((l) => (
              <option key={l.id} value={l.id}>{l.address} ({l.city})</option>
            ))}
          </select>
        </div>
      </div>

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
            <Card className="w-full border-blue-900 shadow-sm bg-blue-950 rounded-2xl overflow-hidden mx-0">
              <CardHeader className="py-2.5 px-3.5 border-b border-blue-900 bg-blue-900">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-white">
                      <Sparkles className="h-4 w-4 text-amber-500 fill-amber-300 animate-spin-slow" /> Sora Welcome Script
                    </CardTitle>
                    <CardDescription className="text-[10px] text-white font-medium">Configure the narrative script that playing tourists will hear instantly upon scanning.</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <Button 
                      onClick={handleGenerateTourIntro} 
                      disabled={soraGenerating}
                      variant="outline" 
                      className="border-amber-200 text-amber-800 hover:bg-amber-50 text-[9px] uppercase font-black tracking-wider gap-0.5 h-7 px-2.5"
                    >
                      {soraGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Generate Intro
                    </Button>
                    <Button 
                      onClick={handleRewriteTour}
                      disabled={soraGenerating}
                      variant="ghost" 
                      className="border border-white hover:bg-white hover:text-blue-950 text-white text-[9px] uppercase font-bold tracking-wider gap-1 h-7 px-2.5 transition-colors duration-200"
                    >
                      <ListRestart className="h-3 w-3 text-white group-hover:text-blue-950" />
                      Rewrite Luxury
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                    <Label className="text-[11px] font-black uppercase text-white font-bold">English Script (Welcome Prompt)</Label>
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
                          <Square className="h-2.5 w-2.5 mr-1 fill-white" /> STOP
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
                  <Textarea 
                    value={welcomeEn} 
                    onChange={(e) => setWelcomeEn(e.target.value)} 
                    rows={3} 
                    className="text-xs font-sans text-white focus-visible:ring-1 focus-visible:ring-amber-500 bg-[#192f72]"
                  />
                  <p className="text-[9px] text-blue-200 italic font-medium leading-tight">This represents Sora's initial greeting block before moving to specific rooms.</p>
                </div>

                <div className="space-y-2 border-t border-blue-900 pt-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                    <Label className="text-[11px] font-black uppercase text-white font-bold">French Script (Bonjour Évaluateurs)</Label>
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
                          <Square className="h-2.5 w-2.5 mr-1 fill-white" /> STOP
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
                      <span className="text-[9px] font-bold text-amber-750 px-1 py-0.5 bg-amber-50 border border-amber-100 rounded uppercase">Multilingual Active</span>
                    </div>
                  </div>
                  <Textarea 
                    value={welcomeFr} 
                    onChange={(e) => setWelcomeFr(e.target.value)} 
                    rows={2} 
                    className="text-xs font-sans text-white focus-visible:ring-1 focus-visible:ring-amber-500 bg-[#192f72]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Multilingual Scripts Companion Card */}
            <Card className="w-full border-stone-200 shadow-sm bg-white rounded-2xl overflow-hidden mx-0">
              <CardHeader className="py-2.5 px-4 border-b border-slate-100 bg-amber-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-black flex items-center gap-1.5 text-stone-900 uppercase tracking-tight">
                      <Globe2 className="h-4 w-4 text-emerald-600" /> Multilingual Scripts & Translation
                    </CardTitle>
                    <CardDescription className="text-[10px] font-medium text-left">Convert your English script into other global languages instantly in a single click using Gemini neural translation.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2 space-y-1 text-left">
                    <Label className="text-[10px] font-extrabold uppercase text-black">Choose Welcome Translation Language</Label>
                    <select 
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="w-full h-8 px-2 bg-white border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 font-sans cursor-pointer text-stone-850"
                    >
                      <option value="French">French (Français)</option>
                      <option value="Spanish">Spanish (Español)</option>
                      <option value="German">German (Deutsch)</option>
                      <option value="Italian">Italian (Italiano)</option>
                      <option value="Portuguese">Portuguese (Português)</option>
                      <option value="Mandarin">Mandarin (普通话)</option>
                      <option value="Japanese">Japanese (日本語)</option>
                      <option value="Dutch">Dutch (Nederlands)</option>
                      <option value="Russian">Russian (Русский)</option>
                      <option value="Arabic">Arabic (العربية)</option>
                      <option value="English">English (English)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <Button 
                      onClick={handleTranslateScript} 
                      disabled={translating || !welcomeEn}
                      className="w-full h-8 bg-emerald-600 hover:bg-emerald-500 text-[9px] uppercase font-black tracking-wider text-white flex items-center justify-center gap-1 shadow-sm"
                    >
                      {translating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Convert Script
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 border-t pt-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                    <Label className="text-[11px] font-black uppercase text-stone-700">{targetLang} Translation Draft</Label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button 
                        onClick={() => handleShortenScript("other")}
                        disabled={shorteningOther || !welcomeOtherScript}
                        variant="outline"
                        className="h-6 text-[9px] py-1 px-2 font-black uppercase border-amber-200 text-amber-800 hover:bg-amber-50"
                      >
                        {shorteningOther ? <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" /> : <Sparkles className="h-2.5 w-2.5 mr-1 text-amber-850" />}
                        Shorten
                      </Button>
                      {playingLang === "other" ? (
                        <Button 
                          onClick={stopSpeaking}
                          variant="destructive"
                          className="h-6 text-[9px] py-1 px-2 font-black uppercase bg-red-600 hover:bg-red-700 text-white animate-pulse"
                        >
                          <Square className="h-2.5 w-2.5 mr-1 fill-white" /> STOP
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => speakText(welcomeOtherScript, targetLang, "other")}
                          variant="outline"
                          className="h-6 text-[9px] py-1 px-2 font-bold uppercase border-emerald-200 text-emerald-800 hover:bg-emerald-50 text-left whitespace-normal leading-normal"
                        >
                          <Play className="h-2.5 w-2.5 mr-1 fill-emerald-850 text-emerald-850 shrink-0" /> {getWalkthroughTranslations(targetLang).preview}
                        </Button>
                      )}
                    </div>
                  </div>
                  <Textarea 
                    value={welcomeOtherScript} 
                    onChange={(e) => setWelcomeOtherScript(e.target.value)} 
                    rows={3} 
                    placeholder={`The computed ${targetLang} welcome script will display here once converted. You can also manually paste/edit translations.`}
                    className="text-xs font-sans text-stone-850 focus-visible:ring-1 focus-visible:ring-amber-500 bg-stone-50/50"
                  />
                  <p className="text-[9px] text-stone-400 italic font-medium leading-tight">This translated script is stored securely and activates when foreign visitors access multilingual mode.</p>
                </div>
              </CardContent>
            </Card>

            {/* Room-by-room audio sequences */}
            <Card className="w-full border-blue-900 shadow-sm bg-blue-950 rounded-2xl overflow-hidden mx-0">
              <CardHeader className="py-2 px-3.5 border-b border-blue-900 bg-blue-900">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-white">
                  <Layers className="h-4 w-4 text-amber-600" /> Room-by-Room Walkthrough content
                </CardTitle>
                <CardDescription className="text-[10px] text-white font-medium">Define high-fidelity scripts to narrate key areas of the home when visitors select a room.</CardDescription>
              </CardHeader>
              
              <CardContent className="p-4 space-y-3">
                {/* Dedicated Walkthrough translation dropdown selector */}
                <div id="room-lang-select-container" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-blue-900/50 rounded-xl border border-blue-800 text-left">
                  <div className="space-y-0.5">
                    <Label className="text-[10px] font-black uppercase text-white tracking-wider font-bold">Walkthrough language</Label>
                    <p className="text-[9px] text-blue-200 font-medium font-sans">Select a translation language to convert/preview individual rooms.</p>
                  </div>
                  <select 
                    value={roomTargetLang}
                    onChange={(e) => setRoomTargetLang(e.target.value)}
                    className="h-7 min-w-[130px] px-2 bg-white border border-stone-250 rounded-lg text-xs font-bold focus:ring-1 focus:ring-amber-500 cursor-pointer text-stone-850"
                  >
                    <option value="French">French (Français)</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Italian">Italian (Italiano)</option>
                    <option value="Portuguese">Portuguese (Português)</option>
                    <option value="Mandarin">Mandarin (普通话)</option>
                    <option value="Japanese">Japanese (日本語)</option>
                    <option value="Dutch">Dutch (Nederlands)</option>
                    <option value="Russian">Russian (Русский)</option>
                    <option value="Arabic">Arabic (العربية)</option>
                    <option value="English">English (English)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  {rooms.map((room, idx) => (
                    <div key={room.id} className="p-3 border rounded-xl border-blue-900 bg-blue-900/30 flex flex-col sm:flex-row items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-0.5 w-full">
                        <div className="flex items-center justify-between font-sans gap-2 flex-wrap">
                          <p className="text-xs font-bold text-white uppercase tracking-wider">{room.name}</p>
                          <div className="flex items-center gap-1">
                            {/* Sequence Position adjustment buttons */}
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={idx === 0}
                              onClick={() => handleMoveRoomUp(idx)}
                              className="h-6 w-6 text-blue-300 hover:text-white disabled:opacity-30 bg-transparent shrink-0"
                              title="Move Up"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={idx === rooms.length - 1}
                              onClick={() => handleMoveRoomDown(idx)}
                              className="h-6 w-6 text-blue-300 hover:text-white disabled:opacity-30 bg-transparent shrink-0"
                              title="Move Down"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>

                            {/* Safe iFrame-Friendly Deletion Popup */}
                            {confirmDeleteRoomId === room.id ? (
                              <div className="flex items-center gap-1 p-1 bg-red-950/80 rounded border border-red-800 animate-in fade-in zoom-in-95 text-left ml-1 shrink-0">
                                <span className="text-[9px] font-bold text-red-200 px-1">Delete?</span>
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
                                  className="h-5 px-1.5 text-[8px] text-stone-300 hover:text-white cursor-pointer"
                                >
                                  No, Keep
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setConfirmDeleteRoomId(room.id)}
                                className="h-6 w-6 text-blue-300 hover:text-rose-400 bg-transparent shrink-0 transition-colors"
                                title="Delete Room"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-blue-100 leading-normal font-sans italic pr-4">"{room.script}"</p>
                        
                        <div className="flex flex-wrap gap-1.5 pt-1.5 mt-1.5 border-t border-dashed border-blue-900">
                          <Button
                            onClick={() => {
                              if (playingLang === `room_${room.id}`) {
                                stopSpeaking();
                              } else {
                                speakText(room.script, roomTargetLang, `room_${room.id}`);
                              }
                            }}
                            variant="outline"
                            className="whitespace-normal h-auto min-h-5.5 py-1 px-2 text-[9px] font-bold uppercase border-blue-800 text-blue-200 hover:bg-blue-900 select-none bg-blue-950/40 text-left"
                          >
                            {playingLang === `room_${room.id}` ? (
                              <>
                                <Square className="h-2 w-2 mr-1 fill-rose-600 text-rose-600 animate-pulse" /> Stop Voice
                              </>
                            ) : (
                              <>
                                <Play className="h-2 w-2 mr-1 fill-blue-200 text-blue-200" /> {getWalkthroughTranslations(roomTargetLang).preview}
                              </>
                            )}
                          </Button>
                          
                          <Button
                            onClick={() => handleTranslateRoomScript(room.id)}
                            disabled={translatingRoomId === room.id}
                            className={`whitespace-normal h-auto min-h-5.5 py-1 px-2 text-[9px] font-bold uppercase select-none transition-all duration-300 text-left ${
                              translatingRoomId === room.id 
                                ? 'bg-blue-400 hover:bg-blue-500 border border-blue-400 text-white font-bold' 
                                : 'bg-white hover:bg-slate-50 text-black border border-stone-200'
                            }`}
                          >
                            {translatingRoomId === room.id ? (
                              <Loader2 className="h-2 w-2 animate-spin mr-1" />
                            ) : (
                              <Sparkles className="h-2 w-2 mr-1" />
                            )}
                            {getWalkthroughTranslations(roomTargetLang).translateRoom}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add room console */}
                <div className="border-t border-blue-900 pt-3 space-y-2 bg-blue-900/30 p-3 rounded-xl border border-blue-800 mt-1">
                  <p className="text-[10px] font-black uppercase text-white tracking-wider flex items-center gap-1">
                    <Plus className="h-3 w-3 text-amber-600" /> Add Tour Room Sequence
                  </p>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-1">
                      <Label htmlFor="room-name" className="text-[9px] uppercase font-bold text-blue-200">Room Title</Label>
                      <Input 
                        id="room-name"
                        placeholder="e.g., Wine Cellar, Patio" 
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        className="h-8 text-xs mt-0.5 bg-white text-stone-900" 
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="room-script" className="text-[9px] uppercase font-bold text-blue-200">Voice Tour Script (Speak out)</Label>
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
            </Card>

            {/* Buyer Q&A Repository */}
            <Card className="w-full border-stone-200 shadow-sm bg-white rounded-2xl overflow-hidden mx-0">
              <CardHeader className="py-2.5 px-4 border-b border-slate-100 bg-white">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-stone-900">
                  <MessageSquare className="h-4 w-4 text-amber-600" /> Sora's Knowledge Base (Buyer Q&A)
                </CardTitle>
                <CardDescription className="text-[10px] text-stone-500 font-medium">Teach Sora listing facts. If a consumer asks these questions, Sora responds with these exact vetted answers.</CardDescription>
              </CardHeader>
              
              <CardContent className="p-4 space-y-3">
                {/* Dedicated Q&A translation dropdown selector */}
                <div id="qa-lang-select-container" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-amber-50/20 rounded-xl border border-stone-200 text-left">
                  <div className="space-y-0.5">
                    <Label className="text-[10px] font-black uppercase text-stone-700 tracking-wider">Q&A translation language</Label>
                    <p className="text-[9px] text-stone-500 font-medium font-sans">Select a translation language to convert/preview individual answers.</p>
                  </div>
                  <select 
                    value={qaTargetLang}
                    onChange={(e) => setQaTargetLang(e.target.value)}
                    className="h-7 min-w-[130px] px-2 bg-white border border-stone-250 rounded-lg text-xs font-bold focus:ring-1 focus:ring-amber-500 cursor-pointer text-stone-850"
                  >
                    <option value="French">French (Français)</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Italian">Italian (Italiano)</option>
                    <option value="Portuguese">Portuguese (Português)</option>
                    <option value="Mandarin">Mandarin (普通话)</option>
                    <option value="Japanese">Japanese (日本語)</option>
                    <option value="Dutch">Dutch (Nederlands)</option>
                    <option value="Russian">Russian (Русский)</option>
                    <option value="Arabic">Arabic (العربية)</option>
                    <option value="English">English (English)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  {qas.map((qaItem, idx) => (
                    <div key={idx} className="p-2.5 bg-stone-50/20 border rounded-xl border-stone-200 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-[11px] font-bold text-stone-850">Q: {qaItem.question}</p>
                        
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
                      <p className="text-[10px] text-stone-600 leading-normal pl-3 border-l-2 border-amber-300 font-sans italic">A: {qaItem.answer}</p>
                      
                      <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-dashed border-stone-200/80">
                        <Button
                          onClick={() => {
                            if (playingLang === `qa_${idx}`) {
                              stopSpeaking();
                            } else {
                              speakText(qaItem.answer, qaTargetLang, `qa_${idx}`);
                            }
                          }}
                          variant="outline"
                          className="whitespace-normal h-auto min-h-5.5 py-1 px-2 text-[9px] font-bold uppercase border-stone-200 text-stone-700 hover:bg-stone-50 select-none text-left"
                        >
                          {playingLang === `qa_${idx}` ? (
                            <>
                              <Square className="h-2 w-2 mr-1 fill-rose-600 text-rose-600 animate-pulse" /> Stop Voice
                            </>
                          ) : (
                            <>
                              <Play className="h-2 w-2 mr-1 fill-stone-700 text-stone-700" /> {getWalkthroughTranslations(qaTargetLang).preview}
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => handleTranslateQaAnswer(idx)}
                          disabled={translatingQaIdx === idx}
                          className={`whitespace-normal h-auto min-h-5.5 py-1 px-2 text-[9px] font-bold uppercase select-none transition-all duration-300 text-left ${
                            translatingQaIdx === idx 
                              ? 'bg-blue-400 hover:bg-blue-500 border border-blue-400 text-white font-bold' 
                              : 'bg-white hover:bg-slate-50 text-black border border-stone-200'
                          }`}
                        >
                          {translatingQaIdx === idx ? (
                            <Loader2 className="h-2 w-2 animate-spin mr-1" />
                          ) : (
                            <Sparkles className="h-2 w-2 mr-1" />
                          )}
                          {getWalkthroughTranslations(qaTargetLang).translateAnswer}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-100 pt-3 space-y-1.5">
                  <p className="text-[10px] font-black uppercase text-stone-700">Add Custom Listing Fact</p>
                  <div className="space-y-1.5">
                    <Input 
                      placeholder="e.g., What are the school zonings?" 
                      value={newQuestion}
                      onChange={(e) => {
                        const val = e.target.value;
                        const formatted = val.charAt(0).toUpperCase() + val.slice(1);
                        setNewQuestion(formatted);
                      }}
                      className="h-8 text-xs" 
                    />
                    <Textarea 
                      placeholder="Sighted inside the coveted Hilltop Elementary and Westlake High jurisdictions, ranking among the top 5% provincially..." 
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
            </Card>

          </div>

          {/* Settings / Controls Column */}
          <div className="space-y-4 min-w-0 w-full">
            
            {/* Action panel & CTAs */}
            <Card className="border-blue-900 shadow-sm bg-blue-950 rounded-2xl overflow-hidden w-full mx-0">
              <CardHeader className="py-2.5 px-4 border-b border-blue-900 bg-blue-900">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-black uppercase text-white tracking-wider">Deploy & Publish Status</CardTitle>
                  {isDirty ? (
                    <span className="text-[9px] font-black uppercase text-amber-700 px-1.5 py-0.2 bg-amber-50 border border-amber-200 rounded animate-pulse">Draft</span>
                  ) : (
                    <span className="text-[9px] font-black uppercase text-emerald-700 px-1.5 py-0.2 bg-emerald-50 border border-emerald-200 rounded">Saved</span>
                  )}
                </div>
                <CardDescription className="text-[10px] text-white font-medium">Publish your changes to sync across print flyers, tablets, and QR paths.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3 bg-white">
                <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-100 text-[10px] text-amber-900 leading-normal font-sans">
                  <p className="font-bold uppercase tracking-wide text-[8px] text-amber-700 mb-0.5">Live Endpoint</p>
                  Your guided property tour is configured at: <br/>
                  <span className="font-mono bg-white px-1 border border-amber-100 rounded text-blue-600 font-bold block mt-0.5 truncate text-[10px]">
                    {window.location.origin}/tour/{selectedListing.id}
                  </span>
                </div>

                <div className="space-y-2 pt-1 font-sans">
                  <Button 
                    onClick={handlePublishTour}
                    className="w-full bg-amber-600 hover:bg-amber-500 font-black text-[11px] h-8.5 tracking-wider uppercase flex items-center justify-center gap-1 shadow-sm"
                  >
                    <BookmarkCheck className="h-4 w-4" /> Publish Active Tour
                  </Button>
                  
                  <div className="text-center pt-0.5">
                    <p className="text-stone-500 font-mono text-[9px] font-medium leading-none">
                      Last Published: {selectedListing?.publishedAt ? (() => {
                        const d = new Date(selectedListing.publishedAt);
                        const optionsDate: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' };
                        const dateFormatted = d.toLocaleDateString('en-US', optionsDate);
                        
                        let hours = d.getHours();
                        const minutes = d.getMinutes().toString().padStart(2, '0');
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        hours = hours % 12;
                        hours = hours ? hours : 12;
                        const timeFormatted = `${hours}:${minutes} ${ampm}`;
                        
                        return `${dateFormatted}, ${timeFormatted}`;
                      })() : "Jun 10, 2026, 3:39 PM"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
            </Card>

            {/* AI Tour Entry Gates & Flow */}
            <Card className="border-blue-900 shadow-sm bg-blue-950 rounded-2xl overflow-hidden w-full mx-0 flex flex-col justify-between">
              <CardHeader className="py-2.5 px-4 border-b border-blue-900 bg-blue-900">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">Verification & Gating Rules</CardTitle>
                <CardDescription className="text-[10px] text-white font-medium">Govern when playing tours prompt and lock behind guest sign-ins.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1.5 font-sans">
                  <Label className="text-[10px] font-black uppercase text-blue-200 font-bold">Open House Entry Sign-In Gate</Label>
                  <div className="grid grid-cols-2 gap-1 font-sans">
                    <button 
                      onClick={() => setSignInPrompt("start")}
                      className={`px-2 py-1.5 text-[9px] rounded-lg border text-center transition-all duration-200 cursor-pointer ${
                        signInPrompt === 'start' 
                          ? 'bg-amber-50 border-amber-500 text-amber-800 font-extrabold' 
                          : 'bg-white text-stone-600 border-stone-200 font-bold'
                      } hover:bg-[#e17100] hover:text-white hover:font-bold hover:border-[#e17100]`}
                    >
                      Mandatory (Prompt First)
                    </button>
                    <button 
                      onClick={() => setSignInPrompt("none")}
                      className={`px-2 py-1.5 text-[9px] rounded-lg border text-center transition-all duration-200 cursor-pointer ${
                        signInPrompt === 'none' 
                          ? 'bg-amber-50 border-amber-500 text-amber-800 font-extrabold' 
                          : 'bg-white text-stone-600 border-stone-200 font-bold'
                      } hover:bg-[#e17100] hover:text-white hover:font-bold hover:border-[#e17100]`}
                    >
                      No Gate (Direct)
                    </button>
                  </div>
                  <p className="text-[9px] text-blue-200 italic font-medium leading-tight mt-0.5">
                    Mandatory requires full check-in before Sora narrate the room scriptures. No Gate allows instant access.
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-blue-900 pt-2.5 font-sans text-left">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase text-blue-200 font-bold">Enabled Features</Label>
                  </div>
                  
                  <div className="space-y-1 pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white">
                      <input 
                        type="checkbox" 
                        checked={voiceEnabled} 
                        onChange={(e) => {
                          const val = e.target.checked;
                          if (!val && !multilingualEnabled && !lenderHandoff) {
                            toast.error("At least one enabled feature must be selected under Verification & Gating Rules.");
                            return;
                          }
                          setVoiceEnabled(val);
                        }}
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 accent-amber-600"
                      />
                      Enable Sora voice synthetic audio
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white">
                      <input 
                        type="checkbox" 
                        checked={multilingualEnabled} 
                        onChange={(e) => {
                          const val = e.target.checked;
                          if (!val && !voiceEnabled && !lenderHandoff) {
                            toast.error("At least one enabled feature must be selected under Verification & Gating Rules.");
                            return;
                          }
                          setMultilingualEnabled(val);
                        }}
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 accent-amber-600"
                      />
                      Enable Multilingual Support (75+ languages)
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={lenderHandoff} 
                        onChange={(e) => {
                          const val = e.target.checked;
                          if (!val && !voiceEnabled && !multilingualEnabled) {
                            toast.error("At least one enabled feature must be selected under Verification & Gating Rules.");
                            return;
                          }
                          setLenderHandoff(val);
                        }}
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 accent-amber-600"
                      />
                      Active Lender Handoff
                    </label>
                  </div>

                  {lenderHandoff && (
                    <div className="p-2 bg-blue-900/50 rounded-lg border border-blue-800 space-y-1 mt-2 text-left">
                      <Label className="text-[9px] font-black uppercase text-blue-200 font-bold">Paired Mortgage Specialist</Label>
                      <select 
                        value={selectedLenderName}
                        onChange={(e) => setSelectedLenderName(e.target.value)}
                        className="bg-white border text-[10px] h-7 rounded-md w-full outline-none px-1.5 focus:ring-1 focus:ring-amber-500 mt-0.5 font-bold text-stone-750"
                      >
                        <option value="Pinnacle Capital Partners (Preferred)">Pinnacle Capital Partners (Preferred)</option>
                        <option value="LendWise Solutions Inc.">LendWise Solutions Inc.</option>
                        <option value="Alliance Residential Lending">Alliance Residential Lending</option>
                      </select>
                      <p className="text-[9px] text-blue-200 font-medium leading-tight mt-0.5">When a client opts-in for mortgage help during the tour, lead metadata immediately routes to this specialist.</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-blue-900 pt-3 flex items-center justify-between font-sans">
                  <span className="text-[10px] font-semibold text-blue-200">
                    Saves configurations to Firestore:
                  </span>
                  <Button 
                    onClick={handleSaveGatingRules}
                    disabled={loading}
                    size="sm"
                    className="h-7 px-3 bg-[#e17100] hover:bg-[#b05800] text-white font-black text-[9px] uppercase cursor-pointer rounded-lg border-none"
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    Save Rules
                  </Button>
                </div>
              </CardContent>
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
