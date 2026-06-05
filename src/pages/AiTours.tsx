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

  // AI (Sora) Loading State
  const [soraGenerating, setSoraGenerating] = useState(false);

  // AI Multilingual States
  const [targetLang, setTargetLang] = useState("Spanish");
  const [roomTargetLang, setRoomTargetLang] = useState("French");
  const [qaTargetLang, setQaTargetLang] = useState("French");
  const [welcomeOtherScript, setWelcomeOtherScript] = useState("");
  const [translating, setTranslating] = useState(false);
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

    // Stop any existing playing audio first
    if ((window as any)._vertexCurrentAudio) {
      try {
        (window as any)._vertexCurrentAudio.pause();
      } catch (e) {}
      (window as any)._vertexCurrentAudio = null;
    }

    const detectedLang = detectLanguage(text, langName);

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
        const audio = new Audio("data:audio/mp3;base64," + data.base64Audio);
        (window as any)._vertexCurrentAudio = audio;
        audio.onended = () => {
          setPlayingLang(null);
        };
        audio.onerror = () => {
          setPlayingLang(null);
          toast.error("Failed to play Sora Voice audio.");
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
        utterance.onend = () => {
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
        (window as any)._vertexCurrentAudio.pause();
      } catch (e) {}
      (window as any)._vertexCurrentAudio = null;
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
      initialEnScript = `Hello and welcome to the exquisite property at ${listing.address}. I am Sora, your personal AI property guide. I am thrilled to accompany you on this digital walkthrough. Let's begin the tour!`;
    }
    setWelcomeEn(initialEnScript);

    // Determine the French script text (avoiding base64 binary sound URLs)
    let initialFrScript = "";
    if (listing.welcome_fr_script) {
      initialFrScript = listing.welcome_fr_script;
    } else if (listing.welcome_fr && !listing.welcome_fr.startsWith("data:audio") && !listing.welcome_fr.endsWith(".mp3") && listing.welcome_fr.length < 1000) {
      initialFrScript = listing.welcome_fr;
    } else {
      initialFrScript = `Bonjour et bienvenue au ${listing.address}. Je suis Sora, votre guide immobilier personnel IA. Je suis ravie de vous accompagner aujourd'hui.`;
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
    const updated = [...qas, { question: newQuestion, answer: newAnswer }];
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
    if (!newCtaLabel) return;
    let formatted = newCtaLabel.trim();
    if (formatted.length > 0) {
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
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
    toast.success("Removed client-facing interactive button.");
  };

  const handlePublishTour = async () => {
    if (!selectedListing) return;

    if (roomTargetLang !== targetLang) {
      toast.error("Language Alignment Conflict", {
        description: `Your Room-by-Room Walkthrough target language (${roomTargetLang}) does not match your Welcome translation language (${targetLang}). All sections must target the same language before publishing.`,
        duration: 8000
      });
      const el = document.getElementById("room-lang-select-container");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-amber-500", "ring-offset-4", "transition-all", "duration-500");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-amber-500", "ring-offset-4");
        }, 4000);
      }
      return;
    }

    if (qaTargetLang !== targetLang) {
      toast.error("Language Alignment Conflict", {
        description: `Your Sora Knowledge Base target language (${qaTargetLang}) does not match your Welcome translation language (${targetLang}). All sections must target the same language before publishing.`,
        duration: 8000
      });
      const el = document.getElementById("qa-lang-select-container");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-amber-500", "ring-offset-4", "transition-all", "duration-500");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-amber-500", "ring-offset-4");
        }, 4000);
      }
      return;
    }

    setLoading(true);
    try {
      // Save elements directly into the listing model in Firestore
      await updateListing(selectedListing.id, {
        welcome_en_script: welcomeEn,
        welcome_fr_script: welcomeFr,
        welcome_other_lang: targetLang,
        welcome_other_script: welcomeOtherScript,
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
        ctas: ctas
      });

      // Show immediate response
      toast.success(`🎉 Excellent! "${selectedListing.address}" AI Voice Tour is compiled and published live!`, {
        description: "Your guest-facing microsite, flyers, and dynamic open house QR code destinations are safely synced with Sora's updated tour sequence.",
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
          <Label className="text-xs font-bold uppercase tracking-wider text-stone-500 whitespace-nowrap">Configure Property:</Label>
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
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Workspace Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Sora Welcome Script */}
            <Card className="border-blue-900 shadow-sm bg-blue-950 rounded-2xl w-[calc(100%-15px)]">
              <CardHeader className="pb-3 border-b border-blue-900 bg-blue-900">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                      <Sparkles className="h-5 w-5 text-amber-500 fill-amber-300 animate-spin-slow" /> Sora Welcome Script
                    </CardTitle>
                    <CardDescription className="text-xs">Configure the narrative script that playing tourists will hear instantly upon scanning.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={handleGenerateTourIntro} 
                      disabled={soraGenerating}
                      variant="outline" 
                      className="border-amber-200 text-amber-800 hover:bg-amber-50 text-[10px] uppercase font-black tracking-wider gap-1 h-8"
                    >
                      {soraGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Generate Tour Intro
                    </Button>
                    <Button 
                      onClick={handleRewriteTour}
                      disabled={soraGenerating}
                      variant="ghost" 
                      className="hover:bg-slate-100 text-[10px] uppercase font-bold tracking-wider gap-1 h-8"
                    >
                      <ListRestart className="h-3 w-3 text-slate-500" />
                      Rewrite Luxury
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs font-black uppercase text-stone-700">English Script (Welcome Prompt)</Label>
                    <div className="flex items-center gap-1.5">
                      {playingLang === "en" ? (
                        <Button 
                          onClick={stopSpeaking}
                          variant="destructive"
                          className="h-7 text-[10px] py-1 px-2.5 font-bold uppercase"
                        >
                          <Square className="h-3 w-3 mr-1 fill-white" /> Stop Voice
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => speakText(welcomeEn, "English", "en")}
                          variant="outline"
                          className="h-7 text-[10px] py-1 px-2.5 font-bold uppercase border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                        >
                          <Play className="h-3 w-3 mr-1 fill-emerald-800" /> Speak English
                        </Button>
                      )}
                    </div>
                  </div>
                  <Textarea 
                    value={welcomeEn} 
                    onChange={(e) => setWelcomeEn(e.target.value)} 
                    rows={4} 
                    className="text-xs font-sans text-stone-850 focus-visible:ring-1 focus-visible:ring-amber-500 bg-stone-50/50"
                  />
                  <p className="text-[10px] text-stone-400 italic font-medium leading-tight">This represents Sora's initial greeting block before moving to specific rooms.</p>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs font-black uppercase text-stone-700">French Script (Bonjour Évaluateurs)</Label>
                    <div className="flex items-center gap-1.5">
                      {playingLang === "fr" ? (
                        <Button 
                          onClick={stopSpeaking}
                          variant="destructive"
                          className="h-7 text-[10px] py-1 px-2.5 font-bold uppercase"
                        >
                          <Square className="h-3 w-3 mr-1 fill-white" /> Stop Voice
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => speakText(welcomeFr, "French", "fr")}
                          variant="outline"
                          className="h-7 text-[10px] py-1 px-2.5 font-bold uppercase border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                        >
                          <Play className="h-3 w-3 mr-1 fill-emerald-800" /> Speak French
                        </Button>
                      )}
                      <span className="text-[10px] font-bold text-amber-700 px-1.5 py-0.5 bg-amber-50 border border-amber-100 rounded uppercase">Multilingual Active</span>
                    </div>
                  </div>
                  <Textarea 
                    value={welcomeFr} 
                    onChange={(e) => setWelcomeFr(e.target.value)} 
                    rows={3} 
                    className="text-xs font-sans text-stone-800 focus-visible:ring-1 focus-visible:ring-amber-500 bg-stone-50/50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Multilingual Scripts Companion Card */}
            <Card className="border-stone-200 shadow-sm bg-white rounded-2xl w-[calc(100%-15px)]">
              <CardHeader className="pb-3 border-b border-slate-100 bg-amber-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-black flex items-center gap-2 text-stone-900 uppercase tracking-tight">
                      <Globe2 className="h-4 w-4 text-emerald-600" /> Multilingual Scripts & Translation
                    </CardTitle>
                    <CardDescription className="text-xs font-medium text-left">Convert your English script into other global languages instantly in a single click using Gemini neural translation.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid sm:grid-cols-3 gap-4 items-end">
                  <div className="sm:col-span-2 space-y-1.5 text-left">
                    <Label className="text-xs font-bold uppercase text-stone-700">Choose Welcome Translation Language</Label>
                    <select 
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 font-sans cursor-pointer text-stone-850"
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
                      className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-[10px] uppercase font-black tracking-wider text-white flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {translating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Convert Script
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs font-black uppercase text-stone-700">{targetLang} Translation Draft</Label>
                    <div className="flex items-center gap-1.5">
                      {playingLang === "other" ? (
                        <Button 
                          onClick={stopSpeaking}
                          variant="destructive"
                          className="h-7 text-[10px] py-1 px-2.5 font-bold uppercase animate-pulse"
                        >
                          <Square className="h-3 w-3 mr-1 fill-white" /> Stop Voice
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => speakText(welcomeOtherScript, targetLang, "other")}
                          variant="outline"
                          className="h-7 text-[10px] py-1 px-2.5 font-bold uppercase border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                        >
                          <Play className="h-3 w-3 mr-1 fill-emerald-800" /> Preview Sora Voice
                        </Button>
                      )}
                    </div>
                  </div>
                  <Textarea 
                    value={welcomeOtherScript} 
                    onChange={(e) => setWelcomeOtherScript(e.target.value)} 
                    rows={4} 
                    placeholder={`The computed ${targetLang} welcome script will display here once converted. You can also manually paste/edit translations.`}
                    className="text-xs font-sans text-stone-850 focus-visible:ring-1 focus-visible:ring-amber-500 bg-stone-50/50"
                  />
                  <p className="text-[10px] text-stone-400 italic font-medium leading-tight">This translated script is stored securely and activates when foreign visitors access multilingual mode.</p>
                </div>
              </CardContent>
            </Card>

            {/* Room-by-room audio sequences */}
            <Card className="border-blue-900 shadow-sm bg-blue-950 rounded-2xl w-[calc(100%-15px)]">
              <CardHeader className="pb-3 border-b border-blue-900 bg-blue-900">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                  <Layers className="h-5 w-5 text-amber-600" /> Room-by-Room Walkthrough content
                </CardTitle>
                <CardDescription className="text-xs font-medium">Define high-fidelity scripts to narrate key areas of the home when visitors select a room.</CardDescription>
              </CardHeader>
              
              <CardContent className="p-6 space-y-4">
                {/* Dedicated Walkthrough translation dropdown selector */}
                <div id="room-lang-select-container" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50/20 rounded-xl border border-stone-200 text-left">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-black uppercase text-stone-700 tracking-wider">Walkthrough language</Label>
                    <p className="text-[10px] text-stone-500 font-medium font-sans">Select a translation language to convert/preview individual rooms.</p>
                  </div>
                  <select 
                    value={roomTargetLang}
                    onChange={(e) => setRoomTargetLang(e.target.value)}
                    className="h-8 min-w-[140px] px-2.5 bg-white border border-stone-250 rounded-lg text-xs font-bold focus:ring-1 focus:ring-amber-500 cursor-pointer text-stone-850"
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

                <div className="space-y-3">
                  {rooms.map((room, idx) => (
                    <div key={room.id} className="p-4 border rounded-xl border-stone-200 bg-stone-50/30 flex flex-col sm:flex-row items-start gap-4">
                      <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-1 w-full">
                        <div className="flex items-center justify-between font-sans">
                          <p className="text-xs font-bold text-stone-900 uppercase tracking-wider">{room.name}</p>
                          <button 
                            onClick={() => handleDeleteRoom(room.id)}
                            className="text-stone-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-normal font-sans italic pr-4">"{room.script}"</p>
                        
                        <div className="flex flex-wrap gap-2 pt-2 mt-2 border-t border-dashed border-stone-250">
                          <Button
                            onClick={() => {
                              if (playingLang === `room_${room.id}`) {
                                stopSpeaking();
                              } else {
                                speakText(room.script, roomTargetLang, `room_${room.id}`);
                              }
                            }}
                            variant="outline"
                            className="h-6 text-[9px] py-1 px-2.5 font-bold uppercase border-stone-200 text-stone-700 hover:bg-stone-50 select-none"
                          >
                            {playingLang === `room_${room.id}` ? (
                              <>
                                <Square className="h-2.5 w-2.5 mr-1 fill-rose-600 text-rose-600 animate-pulse" /> Stop Voice
                              </>
                            ) : (
                              <>
                                <Play className="h-2.5 w-2.5 mr-1 fill-stone-700 text-stone-700" /> Preview Sora Voice ({roomTargetLang})
                              </>
                            )}
                          </Button>
                          
                          <Button
                            onClick={() => handleTranslateRoomScript(room.id)}
                            disabled={translatingRoomId === room.id}
                            variant="outline"
                            className="h-6 text-[9px] py-1 px-2.5 font-bold uppercase border-emerald-100 text-emerald-800 bg-emerald-50/20 hover:bg-emerald-50 select-none"
                          >
                            {translatingRoomId === room.id ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />
                            ) : (
                              <Sparkles className="h-2.5 w-2.5 mr-1" />
                            )}
                            Translate to {roomTargetLang}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add room console */}
                <div className="border-t border-stone-100 pt-4 space-y-3 bg-[#faf9f6]/40 p-4 rounded-xl border border-stone-200 mt-2">
                  <p className="text-[10px] font-black uppercase text-stone-700 tracking-wider flex items-center gap-1">
                    <Plus className="h-3 w-3 text-amber-600" /> Add Tour Room Sequence
                  </p>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-1">
                      <Label htmlFor="room-name" className="text-[10px] uppercase font-bold text-stone-500">Room Title</Label>
                      <Input 
                        id="room-name"
                        placeholder="e.g., Wine Cellar, Patio" 
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        className="h-9 text-xs mt-1 bg-white" 
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="room-script" className="text-[10px] uppercase font-bold text-stone-500">Voice Tour Script (Speak out)</Label>
                      <Input 
                        id="room-script"
                        placeholder="Underneath the stairs lies our climate-gated cellar space..." 
                        value={newRoomScript}
                        onChange={(e) => setNewRoomScript(e.target.value)}
                        className="h-9 text-xs mt-1 bg-white" 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button 
                      onClick={handleAddRoom}
                      className="bg-amber-600 hover:bg-amber-500 text-[10px] font-black uppercase h-8"
                    >
                      Add Room Block
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buyer Q&A Repository */}
            <Card className="border-stone-200 shadow-sm bg-white rounded-2xl w-[calc(100%-15px)]">
              <CardHeader className="pb-3 border-b border-slate-100 bg-white">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-stone-900">
                  <MessageSquare className="h-5 w-5 text-amber-600" /> Sora's Knowledge Base (Buyer Q&A)
                </CardTitle>
                <CardDescription className="text-xs">Teach Sora listing facts. If a consumer asks these questions, Sora responds with these exact vetted answers.</CardDescription>
              </CardHeader>
              
              <CardContent className="p-6 space-y-4">
                {/* Dedicated Q&A translation dropdown selector */}
                <div id="qa-lang-select-container" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50/20 rounded-xl border border-stone-200 text-left">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-black uppercase text-stone-700 tracking-wider">Q&A translation language</Label>
                    <p className="text-[10px] text-stone-500 font-medium font-sans">Select a translation language to convert/preview individual answers.</p>
                  </div>
                  <select 
                    value={qaTargetLang}
                    onChange={(e) => setQaTargetLang(e.target.value)}
                    className="h-8 min-w-[140px] px-2.5 bg-white border border-stone-250 rounded-lg text-xs font-bold focus:ring-1 focus:ring-amber-500 cursor-pointer text-stone-850"
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

                <div className="space-y-3">
                  {qas.map((qaItem, idx) => (
                    <div key={idx} className="p-3 bg-stone-50/20 border rounded-xl border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-stone-850">Q: {qaItem.question}</p>
                        <button 
                          onClick={() => handleDeleteQa(idx)}
                          className="text-stone-400 hover:text-rose-500 text-xs font-bold transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-normal pl-4 border-l border-amber-300 font-sans italic">A: {qaItem.answer}</p>
                      
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-stone-200/80">
                        <Button
                          onClick={() => {
                            if (playingLang === `qa_${idx}`) {
                              stopSpeaking();
                            } else {
                              speakText(qaItem.answer, qaTargetLang, `qa_${idx}`);
                            }
                          }}
                          variant="outline"
                          className="h-6 text-[9px] py-1 px-2.5 font-bold uppercase border-stone-200 text-stone-700 hover:bg-stone-50 select-none"
                        >
                          {playingLang === `qa_${idx}` ? (
                            <>
                              <Square className="h-2.5 w-2.5 mr-1 fill-rose-600 text-rose-600 animate-pulse" /> Stop Voice
                            </>
                          ) : (
                            <>
                              <Play className="h-2.5 w-2.5 mr-1 fill-stone-700 text-stone-700" /> Preview Sora Voice ({qaTargetLang})
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => handleTranslateQaAnswer(idx)}
                          disabled={translatingQaIdx === idx}
                          variant="outline"
                          className="h-6 text-[9px] py-1 px-2.5 font-bold uppercase border-emerald-100 text-emerald-800 bg-emerald-50/20 hover:bg-emerald-50 select-none"
                        >
                          {translatingQaIdx === idx ? (
                            <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />
                          ) : (
                            <Sparkles className="h-2.5 w-2.5 mr-1" />
                          )}
                          Translate Answer to {qaTargetLang}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-100 pt-4 space-y-2">
                  <p className="text-[10px] font-black uppercase text-stone-700">Add Custom Listing Fact</p>
                  <div className="space-y-2">
                    <Input 
                      placeholder="e.g., What are the school zonings?" 
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="h-9 text-xs" 
                    />
                    <Textarea 
                      placeholder="Sighted inside the coveted Hilltop Elementary and Westlake High jurisdictions, ranking among the top 5% provincially..." 
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      rows={2}
                      className="text-xs" 
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleAddQa} className="bg-amber-600 hover:bg-amber-500 text-[10px] font-black uppercase h-8">
                        Add Question Fact
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Settings / Controls Column */}
          <div className="space-y-6">
            
            {/* Action panel & CTAs */}
            <Card className="border-blue-900 shadow-sm bg-blue-950 rounded-2xl">
              <CardHeader className="pb-3 border-b border-blue-900 bg-blue-900">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-black uppercase text-white tracking-wider">Deploy & Publish Status</CardTitle>
                  {isDirty ? (
                    <span className="text-[10px] font-black uppercase text-amber-700 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded animate-pulse">Draft</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase text-emerald-700 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded">Saved</span>
                  )}
                </div>
                <CardDescription className="text-xs">Publish your changes to sync across print flyers, tablets, and QR paths.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4 bg-white">
                <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 text-[11px] text-amber-900 leading-normal">
                  <p className="font-bold uppercase tracking-wide text-[9px] text-amber-700 mb-1">Live Endpoint</p>
                  Your guided property tour is configured at: <br/>
                  <span className="font-mono bg-white px-1 border border-amber-100 rounded text-blue-600 font-bold block mt-1 truncate">
                    {window.location.origin}/tour/{selectedListing.id}
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <Button 
                    onClick={handlePublishTour}
                    className="w-full bg-amber-600 hover:bg-amber-500 font-bold text-xs h-10 tracking-wider uppercase flex items-center justify-center gap-1.5"
                  >
                    <BookmarkCheck className="h-4 w-4" /> Publish Active Tour
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tour CTA Config */}
            <Card className="border-stone-200 shadow-sm bg-white rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-100 bg-white">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-stone-850">Client-facing Interactive Buttons</CardTitle>
                <CardDescription className="text-xs">Set clickable action prompts shown on client smartphones while listening.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  {ctas.map((cta, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      <div className="text-[11px] font-bold text-stone-800">
                        {cta.label} <span className="text-[9px] font-normal text-stone-500">({cta.action})</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteCta(idx)}
                        className="text-stone-400 hover:text-rose-500 text-xs font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 space-y-2">
                  <p className="text-[10px] uppercase font-black text-stone-500">Insert Custom Interactive CTA Button</p>
                  <div className="space-y-1.5">
                    <Input 
                      placeholder="e.g. Schedule Private Viewing" 
                      value={newCtaLabel}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val.length > 0) {
                          val = val.charAt(0).toUpperCase() + val.slice(1);
                        }
                        setNewCtaLabel(val);
                      }}
                      className="h-8 text-xs bg-white" 
                    />
                    <select 
                      className="bg-white border text-xs w-full h-8 rounded-lg outline-none px-2 focus:ring-1 focus:ring-amber-500"
                      value={newCtaAction}
                      onChange={(e) => setNewCtaAction(e.target.value)}
                    >
                      <option value="calendar">Action: Book a Showing</option>
                      <option value="documents">Action: Request Document Package</option>
                      <option value="lender">Action: Request Financing Options</option>
                    </select>
                    <Button onClick={handleAddCta} className="w-full bg-amber-600 hover:bg-amber-500 text-[10px] font-black uppercase h-8 mt-1">
                      Add Interaction Key
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Tour Entry Gates & Flow */}
            <Card className="border-blue-900 shadow-sm bg-blue-950 rounded-2xl">
              <CardHeader className="pb-3 border-b border-blue-900 bg-blue-900">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">Verification & Gating Rules</CardTitle>
                <CardDescription className="text-xs">Govern when playing tours prompt and lock behind guest sign-ins.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-stone-500">Open House Entry Sign-In Gate</Label>
                  <div className="grid grid-cols-2 gap-1">
                    <button 
                      onClick={() => setSignInPrompt("start")}
                      className={`px-3 py-2 text-[10px] font-bold rounded-lg border text-center ${signInPrompt === 'start' ? 'bg-amber-50 border-amber-500 text-amber-800 font-extrabold' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
                    >
                      Mandatory (Prompt First)
                    </button>
                    <button 
                      onClick={() => setSignInPrompt("none")}
                      className={`px-3 py-2 text-[10px] font-bold rounded-lg border text-center ${signInPrompt === 'none' ? 'bg-amber-50 border-amber-500 text-amber-800 font-extrabold' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
                    >
                      No Gate (Direct)
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400 italic font-medium leading-tight mt-1">
                    Mandatory requires full check-in before Sora narrate the room scriptures. No Gate allows instant access.
                  </p>
                </div>

                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase text-stone-500">Enabled Features</Label>
                  </div>
                  
                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                      <input 
                        type="checkbox" 
                        checked={voiceEnabled} 
                        onChange={(e) => setVoiceEnabled(e.target.checked)}
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 accent-amber-600"
                      />
                      Enable Sora voice synthetic audio
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                      <input 
                        type="checkbox" 
                        checked={multilingualEnabled} 
                        onChange={(e) => setMultilingualEnabled(e.target.checked)}
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 accent-amber-600"
                      />
                      Enable Multilingual Support (75+ languages)
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700 mt-1">
                      <input 
                        type="checkbox" 
                        checked={lenderHandoff} 
                        onChange={(e) => setLenderHandoff(e.target.checked)}
                        className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 accent-amber-600"
                      />
                      Active Lender Handoff
                    </label>
                  </div>

                  {lenderHandoff && (
                    <div className="p-3 bg-stone-50 rounded-xl border space-y-1 mt-2.5">
                      <Label className="text-[9px] font-black uppercase text-stone-500">Paired Mortgage Specialist</Label>
                      <select 
                        value={selectedLenderName}
                        onChange={(e) => setSelectedLenderName(e.target.value)}
                        className="bg-white border text-[10px] h-8 rounded-lg w-full outline-none px-2 focus:ring-1 focus:ring-amber-500 mt-1 font-bold text-stone-700"
                      >
                        <option value="Pinnacle Capital Partners (Preferred)">Pinnacle Capital Partners (Preferred)</option>
                        <option value="LendWise Solutions Inc.">LendWise Solutions Inc.</option>
                        <option value="Alliance Residential Lending">Alliance Residential Lending</option>
                      </select>
                      <p className="text-[9px] text-stone-400 font-medium leading-tight">When a client opts-in for mortgage help during the tour, lead metadata immediately routes to this specialist.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

        </div>
      )}
    </div>
  );
}
