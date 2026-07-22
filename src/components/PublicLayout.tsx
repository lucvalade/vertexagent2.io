import React from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, logout } from "@/hooks/useAuth";
import { Loader2, Menu, X, ArrowRight, Search, Mic, Bot, Send, ArrowUp, Square, MessageSquare } from "lucide-react";
import Logo from "./Logo";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function Waveform({ status }: { status: "idle" | "listening" | "processing" | "speaking" }) {
  if (status === "idle" || status === "processing") {
    return (
      <div className="flex items-center justify-center gap-1.5 h-6">
        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
      </div>
    );
  }

  const isSora = status === "speaking";
  const colorClass = isSora ? "bg-blue-600" : "bg-red-600";

  return (
    <div className="flex items-center justify-center gap-1.5 h-8">
      <div className={`w-1.5 h-4 ${colorClass} rounded-full animate-[bounce_0.8s_infinite_100ms]`} />
      <div className={`w-1.5 h-7 ${colorClass} rounded-full animate-[bounce_0.8s_infinite_200ms]`} />
      <div className={`w-1.5 h-5 ${colorClass} rounded-full animate-[bounce_0.8s_infinite_300ms]`} />
      <div className={`w-1.5 h-8 ${colorClass} rounded-full animate-[bounce_0.8s_infinite_400ms]`} />
      <div className={`w-1.5 h-6 ${colorClass} rounded-full animate-[bounce_0.8s_infinite_500ms]`} />
      <div className={`w-1.5 h-7 ${colorClass} rounded-full animate-[bounce_0.8s_infinite_600ms]`} />
      <div className={`w-1.5 h-4 ${colorClass} rounded-full animate-[bounce_0.8s_infinite_700ms]`} />
    </div>
  );
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const menuToggleRef = React.useRef<HTMLButtonElement>(null);
  const navDrawerRef = React.useRef<HTMLElement>(null);

  // Public Search States
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchLang, setSearchLang] = React.useState<"en" | "fr">("en");
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchResult, setSearchResult] = React.useState<{ answer: string; links: Array<{ label: string; url: string }> } | null>(null);

  // Public AI Voice Concierge States
  const [isVoiceConciergeOpen, setIsVoiceConciergeOpen] = React.useState(false);
  const [conciergeMode, setConciergeMode] = React.useState<"select" | "voice" | "text">("select");
  const [voiceConciergeStatus, setVoiceConciergeStatus] = React.useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const [voiceConciergeHistory, setVoiceConciergeHistory] = React.useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [voiceConciergeLang, setVoiceConciergeLang] = React.useState<"en" | "fr">("en");
  const [voiceConciergeVoiceId, setVoiceConciergeVoiceId] = React.useState<string>("2");
  const [voiceConciergeInputText, setVoiceConciergeInputText] = React.useState("");
  const recognitionRef = React.useRef<any>(null);
  const audioPlayerRef = React.useRef<HTMLAudioElement | null>(null);

  const introTimeoutRef = React.useRef<any>(null);
  const silenceTimeoutRef = React.useRef<any>(null);
  const hasAskedOnceMoreRef = React.useRef<boolean>(false);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error("Microphone permission denied:", err);
      return false;
    }
  };

  const startVoiceMode = async () => {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      alert(voiceConciergeLang === "en"
        ? "Microphone access is required to use the voice concierge."
        : "L'accès au microphone est requis pour utiliser le concierge vocal.");
      return;
    }
    setConciergeMode("voice");
    setVoiceConciergeHistory([]);
    setVoiceConciergeStatus("idle");

    if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

    introTimeoutRef.current = setTimeout(() => {
      playIntroMessage();
    }, 1500);
  };

  const startTextMode = () => {
    setConciergeMode("text");
    setVoiceConciergeStatus("idle");
    const welcome = voiceConciergeLang === "en"
      ? "Hello! I am Sora, your AI voice concierge for AI Open House Connect. I am here to help you navigate our platform, answer questions about our premium real estate features, setup kiosks, CRM integrations, or customized property tours. I can also understand and speak over 65+ languages, so feel free to talk to me in whichever language you prefer. How can I help you today?"
      : "Bonjour ! Je suis Sora, votre concierge vocal IA de AI Open House Connect. Je suis ici pour vous aider à naviguer sur notre plateforme et répondre à vos questions sur nos fonctionnalités immobilières premium, nos bornes tactiles, nos intégrations CRM ou nos visites virtuelles personnalisées. Je peux également comprendre et parler plus de 65 langues différentes, alors n'hésitez pas à me parler dans la langue de votre choix. Comment puis-je vous aider aujourd'hui ?";
    setVoiceConciergeHistory([{ role: "assistant", text: welcome }]);
  };

  const handleOpenVoiceConcierge = async () => {
    // Attempt to unlock audio playback with a brief silence play to satisfy browser autoplay requirements
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        // Play a silent 0.05s buffer via Web Audio API to unlock
        const buffer = audioCtx.createBuffer(1, 1, 22050);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);
      }
    } catch (e) {
      console.warn("Failed to unlock audio context via Web Audio API:", e);
    }

    try {
      // Play a short silent base64 WAV sound to unlock standard HTML5 Audio elements
      const unlockAudio = new Audio();
      unlockAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=="; // tiny 4-byte silent WAV
      unlockAudio.play().catch(() => {});
    } catch (e) {}

    setConciergeMode("select");
    setIsVoiceConciergeOpen(true);
  };

  React.useEffect(() => {
    const triggerOpen = () => {
      handleOpenVoiceConcierge();
    };
    window.addEventListener("open-voice-concierge", triggerOpen);
    return () => {
      window.removeEventListener("open-voice-concierge", triggerOpen);
    };
  }, [searchLang]);

  const stopVoiceConciergeAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = "";
      audioPlayerRef.current = null;
    }
    if (voiceConciergeStatus === "speaking") {
      setVoiceConciergeStatus("idle");
    }
  };

  // Handle teardown when voice concierge is closed or destroyed
  const handleTeardown = () => {
    stopVoiceConciergeAudio();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onspeechstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (introTimeoutRef.current) {
      clearTimeout(introTimeoutRef.current);
      introTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    setVoiceConciergeStatus("idle");
    setConciergeMode("select");
  };

  // Sync language with search site language and trigger teardown on close
  React.useEffect(() => {
    if (isVoiceConciergeOpen) {
      setVoiceConciergeLang(searchLang);
      setConciergeMode("select");
    } else {
      handleTeardown();
    }
  }, [isVoiceConciergeOpen]);

  // Handle active language change in voice mode to restart intro welcome audio
  React.useEffect(() => {
    if (isVoiceConciergeOpen && conciergeMode === "voice") {
      setVoiceConciergeHistory([]);
      stopVoiceConciergeAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch (e) {}
          recognitionRef.current = null;
      }
      setVoiceConciergeStatus("idle");
      if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

      introTimeoutRef.current = setTimeout(() => {
        playIntroMessage();
      }, 1500);
    }
  }, [voiceConciergeLang]);

  const startSilenceTimer = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    if (hasAskedOnceMoreRef.current) {
      return;
    }

    silenceTimeoutRef.current = setTimeout(async () => {
      console.log("No reply for 5 seconds, asking once more...");
      hasAskedOnceMoreRef.current = true;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }

      setVoiceConciergeStatus("processing");

      try {
        const res = await fetch("/api/public-concierge-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "ASK_ONCE_MORE",
            lang: voiceConciergeLang === "en" ? "English" : "French",
            voiceId: voiceConciergeVoiceId
          })
        });

        if (!res.ok) throw new Error("Failed to fetch follow up audio");

        const data = await res.json();
        const replyText = data.displayText || data.spokenReply;
        const audioBase64 = data.base64Audio;

        // Add reply to history
        setVoiceConciergeHistory(prev => [...prev, { role: "assistant", text: replyText }]);

        if (audioBase64) {
          setVoiceConciergeStatus("speaking");
          const audioSrc = `data:audio/mp3;base64,${audioBase64}`;
          const audio = new Audio(audioSrc);
          audioPlayerRef.current = audio;

          audio.onended = () => {
            setVoiceConciergeStatus("idle");
            startSpeechRecognition();
          };

          audio.onerror = (e) => {
            console.error("Audio playback error:", e);
            setVoiceConciergeStatus("idle");
            startSpeechRecognition();
          };

          await audio.play();
        } else {
          setVoiceConciergeStatus("idle");
          startSpeechRecognition();
        }
      } catch (err) {
        console.error("Error asking once more:", err);
        setVoiceConciergeStatus("idle");
        startSpeechRecognition();
      }
    }, 5000);
  };

  const playIntroMessage = async () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    setVoiceConciergeStatus("processing");

    try {
      const res = await fetch("/api/public-concierge-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "INTRO_WELCOME",
          lang: voiceConciergeLang === "en" ? "English" : "French",
          voiceId: voiceConciergeVoiceId
        })
      });

      if (!res.ok) throw new Error("Failed to fetch welcome audio");

      const data = await res.json();
      const replyText = data.displayText || data.spokenReply;
      const audioBase64 = data.base64Audio;

      // Update history with intro message
      setVoiceConciergeHistory([{ role: "assistant", text: replyText }]);

      if (audioBase64) {
        setVoiceConciergeStatus("speaking");
        const audioSrc = `data:audio/mp3;base64,${audioBase64}`;
        const audio = new Audio(audioSrc);
        audioPlayerRef.current = audio;

        audio.onended = () => {
          setVoiceConciergeStatus("idle");
          startSpeechRecognition();
        };

        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          setVoiceConciergeStatus("idle");
          startSpeechRecognition();
        };

        await audio.play();
      } else {
        setVoiceConciergeStatus("idle");
        startSpeechRecognition();
      }
    } catch (err) {
      console.error("Error playing intro message:", err);
      setVoiceConciergeStatus("idle");
      startSpeechRecognition();
    }
  };

  // Web Speech API initialization
  const startSpeechRecognition = () => {
    if (introTimeoutRef.current) {
      clearTimeout(introTimeoutRef.current);
      introTimeoutRef.current = null;
    }

    stopVoiceConciergeAudio();
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(searchLang === "en" ? "Speech recognition is not supported in this browser. Please use text mode!" : "La reconnaissance vocale n'est pas supportée dans ce navigateur. Veuillez utiliser le mode écrit !");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = voiceConciergeLang === "en" ? "en-US" : "fr-CA";

      rec.onstart = () => {
        setVoiceConciergeStatus("listening");
        setVoiceConciergeInputText("");
        startSilenceTimer();
      };

      rec.onspeechstart = () => {
        if (voiceConciergeStatus === "speaking") {
          console.log("Barge-in detected via onspeechstart!");
          stopVoiceConciergeAudio();
          setVoiceConciergeStatus("listening");
        }
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      };

      rec.onresult = (event: any) => {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          submitConciergeQuery(transcript, false);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error, event);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setVoiceConciergeStatus("idle");
        }
      };

      rec.onend = () => {
        if (isVoiceConciergeOpen && conciergeMode === "voice" && (recognitionRef.current === rec) && (voiceConciergeStatus as string) !== "idle") {
          setTimeout(() => {
            if (isVoiceConciergeOpen && conciergeMode === "voice" && (recognitionRef.current === rec) && (voiceConciergeStatus as string) !== "idle") {
              try {
                rec.start();
              } catch (e) {
                console.warn("SpeechRecognition restart failed:", e);
              }
            }
          }, 150);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      setVoiceConciergeStatus("idle");
    }
  };

  const submitConciergeQuery = async (queryText: string, isTextMode: boolean = false) => {
    if (!queryText.trim()) return;

    if (introTimeoutRef.current) {
      clearTimeout(introTimeoutRef.current);
      introTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    hasAskedOnceMoreRef.current = false; // Reset silence check-in flag on active query

    stopVoiceConciergeAudio();
    
    // Add to history
    setVoiceConciergeHistory(prev => [...prev, { role: "user", text: queryText }]);
    setVoiceConciergeStatus("processing");

    try {
      const res = await fetch("/api/public-concierge-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          lang: voiceConciergeLang === "en" ? "English" : "French",
          voiceId: voiceConciergeVoiceId,
          isTextMode,
          history: voiceConciergeHistory.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
          }))
        })
      });

      if (!res.ok) {
        throw new Error("Failed to call concierge endpoint");
      }

      const data = await res.json();
      const replyText = data.displayText || data.spokenReply;
      const audioBase64 = data.base64Audio;

      // Add reply to history
      setVoiceConciergeHistory(prev => [...prev, { role: "assistant", text: replyText }]);

      if (!isTextMode && audioBase64) {
        setVoiceConciergeStatus("speaking");
        const audioSrc = `data:audio/mp3;base64,${audioBase64}`;
        const audio = new Audio(audioSrc);
        audioPlayerRef.current = audio;
        audio.onended = () => {
          setVoiceConciergeStatus("idle");
          startSpeechRecognition();
        };
        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          setVoiceConciergeStatus("idle");
          startSpeechRecognition();
        };
        await audio.play();
      } else {
        setVoiceConciergeStatus("idle");
        if (!isTextMode) {
          startSpeechRecognition();
        }
      }
    } catch (err) {
      console.error("Error submitting concierge query:", err);
      const errText = voiceConciergeLang === "en" 
        ? "I'm sorry, I encountered an error processing your request. Please try again."
        : "Désolé, j'ai rencontré une erreur lors du traitement de votre demande. Veuillez réessayer.";
      setVoiceConciergeHistory(prev => [...prev, { role: "assistant", text: errText }]);
      setVoiceConciergeStatus("idle");
      if (!isTextMode) {
        startSpeechRecognition();
      }
    }
  };

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const res = await fetch("/api/public-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, lang: searchLang === "en" ? "English" : "French" })
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
      } else {
        setSearchResult({
          answer: searchLang === "en" ? "No matches — try the AI Tour demo or contact us." : "Aucune correspondance — essayez la démo ou contactez-nous.",
          links: []
        });
      }
    } catch (e) {
      setSearchResult({
        answer: searchLang === "en" ? "Error processing search. Please try again." : "Erreur de recherche. Veuillez réessayer.",
        links: []
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSuggestClick = async (query: string) => {
    setSearchQuery(query);
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const res = await fetch("/api/public-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query, lang: searchLang === "en" ? "English" : "French" })
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
      } else {
        setSearchResult({
          answer: searchLang === "en" ? "No matches — try the AI Tour demo or contact us." : "Aucune correspondance — essayez la démo ou contactez-nous.",
          links: []
        });
      }
    } catch (e) {
      setSearchResult({
        answer: searchLang === "en" ? "Error processing search. Please try again." : "Erreur de recherche. Veuillez réessayer.",
        links: []
      });
    } finally {
      setSearchLoading(false);
    }
  };

  React.useEffect(() => {
    if (!searchOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  const [isFlashing, setIsFlashing] = React.useState(() => {
    try {
      const entered = sessionStorage.getItem("how_it_works_flashed");
      return !entered;
    } catch (e) {
      return true;
    }
  });

  React.useEffect(() => {
    if (isFlashing) {
      try {
        sessionStorage.setItem("how_it_works_flashed", "true");
      } catch (e) {}
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isFlashing]);

  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  React.useEffect(() => {
    if (mobileMenuOpen) {
      const timer = setTimeout(() => {
        const firstLink = navDrawerRef.current?.querySelector("a") as HTMLElement;
        firstLink?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [mobileMenuOpen]);

  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (!navDrawerRef.current) return;
      const focusableElements = navDrawerRef.current.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [mobileMenuOpen]);

  React.useEffect(() => {
    const handleHashScroll = () => {
      const hash = location.hash;
      if (hash) {
        const id = hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    };

    const timeout = setTimeout(handleHashScroll, 350);
    return () => clearTimeout(timeout);
  }, [location.pathname, location.hash]);

  const isLinkActive = (linkInput: string | { href: string; items?: { href: string }[] }) => {
    const checkHref = (href: string) => {
      if (!href) return false;
      const [pathPart, hashPart] = href.split("#");
      const [cleanPathPart, queryPart] = pathPart.split("?");
      const currentCleanPath = location.pathname;
      const pathMatches = currentCleanPath === cleanPathPart;
      
      if (queryPart && location.search) {
        if (location.search.includes(queryPart) && pathMatches) return true;
      }
      if (hashPart) {
        return pathMatches && location.hash === `#${hashPart}`;
      }
      return pathMatches;
    };

    if (typeof linkInput === "string") {
      return checkHref(linkInput);
    }
    
    if (checkHref(linkInput.href)) return true;
    if (linkInput.items) {
      return linkInput.items.some(item => checkHref(item.href));
    }
    return false;
  };

  const navLinks = [
    {
      label: "Products",
      href: "/product",
      items: [
        { name: "AI Property Tours", desc: "Interactive smart guided media voice narrates homes", href: "/product#narrator" },
        { name: "Active Listings, Open House Links & QR Codes", desc: "Access property sign-ins, dynamic flyers and yard sign QR directory", href: "/open-houses#listings-directory" },
        { name: "Talk with Sora", desc: "Real-time voice chat answers property facts naturally", href: "/product#narrator" },
        { name: "Listen to Tour", desc: "Guided ambient audio walks you room-by-room", href: "/product#narrator" },
        { name: "Message Me", desc: "Prompt mobile chat for buyers on the move", href: "/product#features" },
        { name: "Branding & Templates", desc: "Brokerage themes cascade to individual listing flyers", href: "/brokerages#compliance-demo" },
        { name: "Automations & Analytics", desc: "Track scans, visits, conversations and hot leads automatically", href: "/product#features" }
      ]
    },
    { label: "How it Works", href: "/how-it-works" },
    { label: "Use Cases", href: "/#features" },
    { label: "Demo", href: "/demo" },
    {
      label: "Company",
      href: "/contact",
      items: [
        { name: "Mission & Values", desc: "Reimagining the open house to convert more leads", href: "/contact?tab=mission" },
        { name: "Enterprise Solutions", desc: "Custom scale operations for franchise organizations", href: "/contact?tab=enterprise" },
        { name: "Contact Support", desc: "Dedicated round the clock account concierge", href: "/contact?tab=support" },
        { name: "Agents Help Guide", desc: "Get started with solo agent properties setup and kiosks", href: "/help?role=agent" },
        { name: "Brokers Help Guide", desc: "Office settings, brokerage subdomain, and agent invitations", href: "/help?role=brokerage" },
        { name: "Lenders Help Guide", desc: "B2B partnerships, subscriptions, and explicit consent gates", href: "/help?role=lender" },
        { name: "Teams Help Guide", desc: "Manage rosters, enforce routing policies and overrides", href: "/help?role=team" }
      ]
    },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "/#faq" }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-slate-50 overflow-x-hidden">
      <style>{`
        @keyframes flash-black-blue {
          0%, 100% { color: #000000 !important; }
          50% { color: #2563eb !important; }
        }
        .animate-flash-black-blue {
          animation: flash-black-blue 0.8s infinite ease-in-out;
        }

        .hamburger-btn {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 24px;
          height: 18px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          z-index: 1000;
          outline: none;
          position: relative;
        }
        .bar {
          display: block;
          width: 100%;
          height: 2px;
          background-color: #ffffff;
          border-radius: 2px;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .hamburger-btn.is-open .bar:nth-child(1) {
          transform: translateY(8px) rotate(45deg);
        }
        .hamburger-btn.is-open .bar:nth-child(2) {
          opacity: 0;
          transform: scaleX(0);
        }
        .hamburger-btn.is-open .bar:nth-child(3) {
          transform: translateY(-8px) rotate(-45deg);
        }

        .nav-drawer {
          position: fixed;
          top: 0;
          left: 0;
          height: 100%;
          width: 325px;
          max-width: 85%;
          background: #ffffff;
          box-shadow: 4px 0 24px rgba(0,0,0,0.12);
          transform: translateX(-100%);
          transition: transform 0.3s ease;
          z-index: 999;
          overflow-y: auto;
          padding: 18px 24px 24px;
        }
        .nav-drawer.is-open {
          transform: translateX(0);
        }

        .nav-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
          z-index: 998;
        }
        .nav-backdrop.is-open {
          opacity: 1;
          pointer-events: all;
        }

        @media (prefers-reduced-motion: no-preference) {
          .bar,
          .nav-drawer,
          .nav-backdrop {
            transition-duration: 0.3s;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .bar,
          .nav-drawer,
          .nav-backdrop {
            transition: none;
          }
        }
      `}</style>
      {/* HEADER */}
      <header 
        className="fixed top-0 inset-x-0 w-full rounded-none lg:top-3 lg:inset-x-4 lg:rounded-[20px] max-w-7xl lg:mx-auto h-16 z-50 border-b lg:border border-white/20 transition-all duration-300 backdrop-blur-md shadow-lg"
        style={{ backgroundColor: scrolled ? "rgba(80, 162, 255, 0.55)" : "rgba(80, 162, 255, 1)" }}
      >
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <Logo variant="white" iconClassName="h-8.5 w-8.5" />
          </Link>
          
          <nav className="hidden lg:flex items-center gap-6 text-sm font-bold text-white h-full">
            {navLinks.map((link) => {
              const active = isLinkActive(link);
              return (
                <div key={link.label} className="relative group flex items-center h-full">
                  <Link 
                    to={link.href} 
                    className={`hover:text-white/80 transition-colors py-5 flex items-center gap-0.5 tracking-tight font-bold ${
                      active ? "text-yellow-300 font-black" : "text-white"
                    } ${
                      link.label === "How It Works" && isFlashing ? "animate-flash-black-blue" : ""
                    }`}
                  >
                    {link.label}
                    {link.items && <span className="text-[8px] opacity-40 ml-1">▼</span>}
                  </Link>
                  {link.items && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 hidden group-hover:grid grid-cols-2 gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl min-w-[500px] z-50 text-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="col-span-2 border-b pb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        {link.label === "Products" ? "Product" : link.label} Solutions
                      </div>
                      {link.items.map((item) => {
                        const itemActive = isLinkActive(item.href);
                        return (
                          <Link 
                            to={item.href || link.href} 
                            key={item.name} 
                            className={`group/sub p-2.5 rounded-xl transition-all block text-left ${
                              itemActive ? "bg-blue-50 border-l-4 border-blue-600 pl-1.5" : "hover:bg-blue-600"
                            }`}
                          >
                            <p className={`text-xs font-bold transition-colors ${
                              itemActive ? "text-blue-600" : "text-slate-900 group-hover/sub:text-white"
                            }`}>{item.name}</p>
                            <p className={`text-[10px] mt-0.5 leading-normal transition-colors ${
                              itemActive ? "text-blue-500" : "text-slate-500 group-hover/sub:text-blue-100"
                            }`}>{item.desc}</p>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Custom I'm An Dropdown with top choice Choose Role */}
            <div className="relative group flex items-center h-full">
              <button 
                id="im-an-dropdown-trigger"
                className={`hover:text-white/80 transition-colors py-5 flex items-center gap-1 tracking-tight font-bold cursor-pointer bg-transparent border-none outline-none ${
                  location.pathname.startsWith("/guides") ? "text-yellow-300 font-black" : "text-white"
                }`}
              >
                <span>Select Playbook</span>
                <span className="text-[8px] opacity-40">▼</span>
              </button>
              <div className="absolute top-16 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-2xl p-2.5 shadow-2xl min-w-[200px] z-50 text-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="border-b pb-2 mb-1.5 px-3 text-[10px] font-black tracking-widest text-slate-400 uppercase text-center">
                  Choose Role
                </div>
                <Link 
                  to="/guides?role=agent" 
                  className="hover:bg-blue-50 hover:text-blue-600 rounded-lg py-2 px-3 transition-colors text-xs font-bold text-left block"
                >
                  Agent Playbook
                </Link>
                <Link 
                  to="/guides?role=team" 
                  className="hover:bg-blue-50 hover:text-blue-600 rounded-lg py-2 px-3 transition-colors text-xs font-bold text-left block"
                >
                  Team Lead Playbook
                </Link>
                <Link 
                  to="/guides?role=broker" 
                  className="hover:bg-blue-50 hover:text-blue-600 rounded-lg py-2 px-3 transition-colors text-xs font-bold text-left block"
                >
                  Broker Playbook
                </Link>
                <Link 
                  to="/guides?role=lender" 
                  className="hover:bg-blue-50 hover:text-blue-600 rounded-lg py-2 px-3 transition-colors text-xs font-bold text-left block"
                >
                  Lender Playbook
                </Link>
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-4">
            {/* Search Icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all duration-200 outline-none cursor-pointer flex items-center justify-center shrink-0"
              title="Search website copy"
              aria-label="Search website copy"
            >
              <Search className="h-5 w-5" />
            </button>

            <div className="hidden sm:flex items-center gap-4">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : user ? (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" className="font-extrabold text-xs text-white hover:text-white hover:bg-white/10" onClick={() => navigate("/app")}>Dashboard</Button>
                  <Button variant="outline" className="font-extrabold text-xs bg-transparent hover:bg-white/10 text-white hover:text-white border border-white/20 transition-colors duration-200" onClick={async () => { await logout(); navigate("/"); }}>Logout</Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" className="font-extrabold text-xs text-white hover:text-white hover:bg-white/10" onClick={() => navigate("/login")}>Login</Button>
                  <Button onClick={() => navigate("/register")} className="bg-white hover:bg-white/90 text-[#162556] font-extrabold text-xs">Get Started</Button>
                </div>
              )}
            </div>

            <div className="lg:hidden flex items-center gap-2.5">
              {/* To the left of the hamburger menu, create a link called Start Free */}
              <Link 
                to="/register" 
                className="text-[10px] font-black text-[#50a2ff] bg-white hover:bg-blue-50 active:scale-[0.85] scale-90 transition-all text-center px-2.5 py-1 rounded-lg shadow-sm whitespace-nowrap select-none uppercase tracking-wider"
              >
                Start Free
              </Link>

              {/* Custom Hamburger Button according to PDF Guide */}
              <button 
                id="menu-toggle"
                ref={menuToggleRef}
                aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
                aria-expanded={mobileMenuOpen}
                aria-controls="nav-drawer"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className={`hamburger-btn ${mobileMenuOpen ? "is-open" : ""}`}
              >
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop overlay */}
      <div 
        id="nav-backdrop"
        onClick={() => {
          setMobileMenuOpen(false);
          menuToggleRef.current?.focus();
        }}
        className={`nav-backdrop lg:hidden ${mobileMenuOpen ? "is-open" : ""}`}
        aria-hidden="true"
      />

      {/* Navigation drawer according to PDF Guide */}
      <nav 
        id="nav-drawer"
        ref={navDrawerRef}
        className={`nav-drawer lg:hidden flex flex-col ${mobileMenuOpen ? "is-open" : ""}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex flex-col h-full">
          {/* Header Card inside mobile menu */}
          <div className="rounded-xl flex items-center justify-between text-white p-4 mb-4" style={{ backgroundColor: '#50a2ff' }}>
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="hover:opacity-95 transition-opacity">
              <Logo variant="white" iconClassName="h-7.5 w-7.5" />
            </Link>
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                menuToggleRef.current?.focus();
              }} 
              className="text-white hover:text-white/80 transition-colors bg-transparent border-0 outline-none p-1 cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Structured Menu Options */}
          <div className="flex flex-col gap-1 text-left px-2 flex-grow overflow-y-auto">
            {/* Products */}
            <div className="border-b border-slate-100 py-3">
              <span className="font-extrabold text-[#111827] text-base block text-left mb-2">Products</span>
              <div className="pl-4 space-y-2.5">
                <Link to="/product#narrator" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/product#narrator") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>AI Property Tours</Link>
                <Link to="/open-houses#listings-directory" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/open-houses#listings-directory") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>Active Listings, Open House Links & QR Codes</Link>
                <Link to="/product#narrator" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/product#narrator") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>Talk with Sora</Link>
                <Link to="/product#narrator" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/product#narrator") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>Listen to Tour</Link>
                <Link to="/product#features" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/product#features") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>Message Me</Link>
                <Link to="/brokerages#compliance-demo" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/brokerages#compliance-demo") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>Branding & Templates</Link>
                <Link to="/product#features" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/product#features") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>Automations & Analytics</Link>
              </div>
            </div>

            {/* How It Works */}
            <div className="border-b border-slate-100 py-3">
              <Link 
                to="/how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className={`font-extrabold text-base hover:text-blue-500 transition-colors block text-left ${
                  isLinkActive("/how-it-works") ? "text-blue-600 font-black" : "text-[#111827]"
                } ${
                  isFlashing ? "animate-flash-black-blue" : ""
                }`}
              >
                How It Works
              </Link>
            </div>

            {/* Use Cases */}
            <div className="border-b border-slate-100 py-3">
              <Link 
                to="/#features" 
                onClick={() => setMobileMenuOpen(false)}
                className={`font-extrabold text-base hover:text-blue-500 transition-colors block text-left ${
                  isLinkActive("/#features") ? "text-blue-600 font-black" : "text-[#111827]"
                }`}
              >
                Use Cases
              </Link>
            </div>

            {/* Demo */}
            <div className="border-b border-slate-100 py-3">
              <Link 
                to="/demo" 
                onClick={() => setMobileMenuOpen(false)}
                className={`font-extrabold text-base hover:text-blue-500 transition-colors block text-left ${
                  isLinkActive("/demo") ? "text-blue-600 font-black" : "text-[#111827]"
                }`}
              >
                Demo
              </Link>
            </div>

            {/* Company */}
            <div className="border-b border-slate-100 py-3">
              <span className="font-extrabold text-[#111827] text-base block text-left mb-2">Company</span>
              <div className="pl-4 space-y-2.5">
                <Link to="/contact?tab=mission" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/contact?tab=mission") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>Mission & Values</Link>
                <Link to="/contact?tab=enterprise" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/contact?tab=enterprise") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>Enterprise Solutions</Link>
                <Link to="/contact?tab=support" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/contact?tab=support") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>Contact Support</Link>
                <Link to="/help?role=agent" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/help?role=agent") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>Agents Help Guide</Link>
                <Link to="/help?role=brokerage" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/help?role=brokerage") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>Brokers Help Guide</Link>
                <Link to="/help?role=lender" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/help?role=lender") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>Lenders Help Guide</Link>
                <Link to="/help?role=team" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/help?role=team") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>Teams Help Guide</Link>
              </div>
            </div>

            {/* Pricing */}
            <div className="border-b border-slate-100 py-3">
              <Link 
                to="/pricing" 
                onClick={() => setMobileMenuOpen(false)}
                className={`font-extrabold text-base hover:text-blue-500 transition-colors block text-left ${
                  isLinkActive("/pricing") ? "text-blue-600 font-black" : "text-[#111827]"
                }`}
              >
                Pricing
              </Link>
            </div>

            {/* FAQ */}
            <div className="border-b border-slate-100 py-3">
              <Link 
                to="/#faq" 
                onClick={() => setMobileMenuOpen(false)}
                className={`font-extrabold text-base hover:text-blue-500 transition-colors block text-left ${
                  isLinkActive("/#faq") ? "text-blue-600 font-black" : "text-[#111827]"
                }`}
              >
                FAQ
              </Link>
            </div>

            {/* I'm An Dropdown */}
            <div className="py-3">
              <span className="font-extrabold text-[#111827] text-base block text-left mb-2">Select Playbook (Choose Role)</span>
              <div className="pl-4 space-y-2.5">
                <Link to="/guides?role=agent" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/guides?role=agent") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>Agent Playbook</Link>
                <Link to="/guides?role=team" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/guides?role=team") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>Team Lead Playbook</Link>
                <Link to="/guides?role=broker" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/guides?role=broker") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>Broker Playbook</Link>
                <Link to="/guides?role=lender" onClick={() => setMobileMenuOpen(false)} className={`text-xs font-semibold block text-left ${isLinkActive("/guides?role=lender") ? "text-blue-600 font-extrabold" : "text-slate-500 hover:text-blue-600"}`}>Lender Playbook</Link>
              </div>
            </div>
          </div>

          {/* Action Buttons at the bottom */}
          <div className="mt-auto pt-4 border-t border-slate-100 space-y-3 px-2">
            {user ? (
              <>
                <Button 
                  onClick={() => { setMobileMenuOpen(false); navigate("/app"); }}
                  className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white font-extrabold h-12 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      setMobileMenuOpen(false);
                      await logout();
                      navigate("/");
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold h-12 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => { setMobileMenuOpen(false); navigate("/login"); }}
                  className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white font-extrabold h-12 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Login
                </Button>
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/register");
                  }}
                  className="w-full bg-[#155dfc] hover:bg-blue-700 text-white font-extrabold h-12 rounded-xl text-xs sm:text-sm cursor-pointer"
                >
                  <span>Get Started</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 pt-24 pb-8">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-16 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            
            {/* Column 1 - Product */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-white">Product</h4>
              <ul className="space-y-2.5">
                <li><Link to="/#product" className="hover:text-white transition-colors">Interactive Tours</Link></li>
                <li><Link to="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link to="/#features" className="hover:text-white transition-colors font-semibold text-blue-400">Feature Deck</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing Plans</Link></li>
              </ul>
            </div>

            {/* Column 2 - Company */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-white">Company</h4>
              <ul className="space-y-2.5">
                <li><Link to="/contact" className="hover:text-white transition-colors">About Team</Link></li>
                <li><a href="mailto:support@aiopenhouseconnect.com" className="hover:text-white transition-colors">Media Kit</a></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Partnerships</Link></li>
              </ul>
            </div>

            {/* Column 3 - Resources */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-white">Resources</h4>
              <ul className="space-y-2.5">
                <li><Link to="/compliance" className="hover:text-white transition-colors">Agency Disclosures</Link></li>
                <li><Link to="/open-houses" className="hover:text-white transition-colors">Open House Manual</Link></li>
                <li><Link to="/url-import" className="hover:text-white transition-colors">URL Extraction API</Link></li>
                <li><Link to="/integrations" className="hover:text-white transition-colors">CRM Field Routing</Link></li>
              </ul>
            </div>

            {/* Column 4 - Contact */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-white">Contact</h4>
              <ul className="space-y-2.5">
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Concierge</Link></li>
                <li className="text-zinc-500 font-mono text-[10px]">support@aiopenhouseconnect.com</li>
                <li className="text-zinc-500 font-mono text-[10px]">AI Open House Connect Headquarters</li>
                <li className="text-zinc-500 font-mono text-[10px]">Toronto, ON, Canada</li>
              </ul>
            </div>

          </div>

          {/* Bottom row: copyright, privacy, terms */}
          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-zinc-500">
            <span>&copy; {new Date().getFullYear()} AI Open House Connect Inc. All rights reserved.</span>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/compliance" className="hover:text-white transition-colors">RECO Regulatory Disclosure</Link>
            </div>
          </div>

        </div>
      </footer>

      {/* Search Overlay Modal */}
      {searchOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSearchOpen(false)}
          />

          {/* Modal Container */}
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header / Input area */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchLang === "en" ? "Search features, pricing, FAQs..." : "Rechercher des fonctionnalités, tarifs, FAQ..."}
                className="w-full text-base text-slate-900 bg-transparent outline-none border-0 p-0 placeholder-slate-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchSubmit();
                  }
                }}
              />
              
              {/* Language Selector inside Modal */}
              <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setSearchLang("en")}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${searchLang === "en" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setSearchLang("fr")}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${searchLang === "fr" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                >
                  FR
                </button>
              </div>

              <button
                onClick={() => setSearchOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 shrink-0 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Results or default / empty states */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {searchLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-sm text-slate-500 font-medium animate-pulse">
                    {searchLang === "en" ? "Generating direct answer..." : "Génération de la réponse directe..."}
                  </p>
                </div>
              ) : searchResult ? (
                <div className="space-y-6">
                  {/* Generated Answer */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {searchLang === "en" ? "AI Generated Answer" : "Réponse générée par l'IA"}
                    </h4>
                    <div className="text-slate-700 text-sm leading-relaxed bg-blue-50/50 border border-blue-100/50 rounded-xl p-4">
                      {searchResult.answer}
                    </div>
                  </div>

                  {/* Supporting links */}
                  {searchResult.links && searchResult.links.length > 0 ? (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {searchLang === "en" ? "Supporting Links" : "Liens de référence"}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {searchResult.links.map((link, idx) => (
                          <Link
                            key={idx}
                            to={link.url}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 text-slate-700 hover:text-blue-700 text-xs font-semibold transition-all group"
                          >
                            <span>{link.label}</span>
                            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40">
                      <p className="text-xs font-medium text-amber-800 leading-normal">
                        {searchLang === "en"
                          ? "No matches — try the AI Tour demo or contact us."
                          : "Aucune correspondance — essayez la démo de visite IA ou contactez-nous."}
                      </p>
                      <div className="mt-3 flex gap-3">
                        <Link
                          to="/demo"
                          onClick={() => setSearchOpen(false)}
                          className="text-xs font-bold text-amber-900 hover:underline"
                        >
                          {searchLang === "en" ? "Try AI Tour Demo" : "Essayer la démo"}
                        </Link>
                        <Link
                          to="/contact"
                          onClick={() => setSearchOpen(false)}
                          className="text-xs font-bold text-amber-900 hover:underline"
                        >
                          {searchLang === "en" ? "Contact Support" : "Contacter le support"}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">
                    {searchLang === "en" 
                      ? "Type your question above and press Enter to search." 
                      : "Saisissez votre question ci-dessus et appuyez sur Entrée pour rechercher."}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => { handleSuggestClick(searchLang === "en" ? "What is Agent Pro?" : "Qu'est-ce qu'Agent Pro ?"); }}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer"
                    >
                      {searchLang === "en" ? "What is Agent Pro?" : "Qu'est-ce qu'Agent Pro ?"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleSuggestClick(searchLang === "en" ? "How does the sign-in kiosk work?" : "Comment fonctionne le kiosque ?"); }}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer"
                    >
                      {searchLang === "en" ? "How does the sign-in kiosk work?" : "Comment fonctionne le kiosque ?"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleSuggestClick(searchLang === "en" ? "Lender pricing" : "Tarifs prêteurs"); }}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer"
                    >
                      {searchLang === "en" ? "Lender pricing" : "Tarifs prêteurs"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Public AI Voice Concierge Dialog */}
      <Dialog open={isVoiceConciergeOpen} onOpenChange={setIsVoiceConciergeOpen}>
        <DialogContent className="sm:max-w-[520px] bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-xl font-bold text-[#111827] flex items-center gap-2">
              <span className="relative flex h-3.5 w-3.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${voiceConciergeStatus !== "idle" ? "inline-flex" : "hidden"}`}></span>
                <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${voiceConciergeStatus !== "idle" ? "bg-emerald-500" : "bg-slate-300"}`}></span>
              </span>
              <span>
                {voiceConciergeLang === "en" ? "AI Voice Concierge" : "Concierge Vocal IA"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              {voiceConciergeLang === "en"
                ? "Talk with our interactive public assistant. Scoped strictly to public platform details."
                : "Parlez avec notre assistant public interactif. Limité strictement aux détails publics."}
            </DialogDescription>
          </DialogHeader>

          {/* Quick Settings Bar: Language */}
          <div className="flex items-center justify-between gap-3 pt-3 pb-2 bg-stone-50 p-3 rounded-xl border border-stone-100">
            {/* Lang toggle */}
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Language / Langue:</span>
              <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setVoiceConciergeLang("en");
                    stopVoiceConciergeAudio();
                  }}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${voiceConciergeLang === "en" ? "bg-[#0052A5] text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVoiceConciergeLang("fr");
                    stopVoiceConciergeAudio();
                  }}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${voiceConciergeLang === "fr" ? "bg-[#0052A5] text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                >
                  FR
                </button>
              </div>
            </div>
          </div>

          {/* MODE SELECT SUBMENU (Fires before anything else) */}
          {conciergeMode === "select" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <p className="text-sm font-semibold text-slate-700 text-center">
                {voiceConciergeLang === "en"
                  ? "Choose how you'd like to chat with Sora:"
                  : "Choisissez comment vous souhaitez discuter avec Sora :"}
              </p>
              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  type="button"
                  onClick={startVoiceMode}
                  className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-2xl hover:border-[#0052A5] hover:bg-slate-50 transition-all cursor-pointer group"
                >
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                    <Mic className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {voiceConciergeLang === "en" ? "Voice Mode" : "Mode Vocal"}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 text-center">
                    {voiceConciergeLang === "en" ? "Speak & Listen" : "Parler & Écouter"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={startTextMode}
                  className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-2xl hover:border-[#0052A5] hover:bg-slate-50 transition-all cursor-pointer group"
                >
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {voiceConciergeLang === "en" ? "Text Mode" : "Mode Écrit"}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 text-center">
                    {voiceConciergeLang === "en" ? "Type & Read" : "Saisir & Lire"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* VOICE MODE UI */}
          {conciergeMode === "voice" && (
            <>
              {/* Interactive Mic Visualization Area */}
              <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-b from-stone-50/50 to-white border-y border-stone-100 relative overflow-hidden">
                {/* Visual pulsing wave ring */}
                <div className="relative flex items-center justify-center h-28 w-28">
                  {voiceConciergeStatus === "listening" && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping duration-1000" />
                      <div className="absolute inset-2 rounded-full bg-red-500/20 animate-pulse duration-700" />
                    </>
                  )}
                  {voiceConciergeStatus === "speaking" && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping duration-1000" />
                      <div className="absolute inset-2 rounded-full bg-blue-500/20 animate-pulse duration-700" />
                    </>
                  )}
                  {voiceConciergeStatus === "processing" && (
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-500 animate-spin duration-3000" />
                  )}

                  {/* Main Circular Trigger Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (voiceConciergeStatus !== "idle") {
                        // STOP everything and revert to idle
                        stopVoiceConciergeAudio();
                        if (recognitionRef.current) {
                          try {
                            recognitionRef.current.onend = null;
                            recognitionRef.current.stop();
                          } catch (e) {}
                          recognitionRef.current = null;
                        }
                        if (silenceTimeoutRef.current) {
                          clearTimeout(silenceTimeoutRef.current);
                          silenceTimeoutRef.current = null;
                        }
                        if (introTimeoutRef.current) {
                          clearTimeout(introTimeoutRef.current);
                          introTimeoutRef.current = null;
                        }
                        setVoiceConciergeStatus("idle");
                      } else {
                        startSpeechRecognition();
                      }
                    }}
                    className={`relative z-10 h-20 w-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border-2 ${
                      voiceConciergeStatus === "idle" 
                        ? "bg-blue-600 hover:bg-blue-700 border-blue-500 text-white" 
                        : "bg-red-600 hover:bg-red-700 border-red-500 text-white"
                    }`}
                  >
                    {voiceConciergeStatus === "idle" ? (
                      <Mic className="h-8 w-8 text-white" />
                    ) : (
                      <Square className="h-8 w-8 fill-white text-white" />
                    )}
                  </button>
                </div>

                <div className="mt-4">
                  <Waveform status={voiceConciergeStatus} />
                </div>

                {/* Current status tag */}
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-2 h-4">
                  {voiceConciergeStatus === "listening" && (voiceConciergeLang === "en" ? "Listening to you..." : "À l'écoute...")}
                  {voiceConciergeStatus === "processing" && (voiceConciergeLang === "en" ? "AI is processing..." : "Traitement IA...")}
                  {voiceConciergeStatus === "speaking" && (voiceConciergeLang === "en" ? "Sora is speaking..." : "Sora parle...")}
                  {voiceConciergeStatus === "idle" && (voiceConciergeLang === "en" ? "Tap To Start" : "Appuyez pour démarrer")}
                </p>
              </div>

              {/* Dialogue Log Terminal */}
              <div className="flex-1 min-h-[160px] max-h-[220px] overflow-y-auto border border-stone-100 rounded-2xl bg-stone-950 p-4 font-sans text-xs space-y-4 shadow-inner my-3">
                {voiceConciergeHistory.map((turn, i) => (
                  <div 
                    key={i} 
                    className={`flex flex-col space-y-1 ${turn.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-500">
                      {turn.role === "user" 
                        ? (voiceConciergeLang === "en" ? "You" : "Vous") 
                        : (voiceConciergeLang === "en" ? "Sora" : "Sora")}
                    </span>
                    <span className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                      turn.role === "user" 
                        ? "bg-stone-800 text-stone-200 rounded-tr-none border border-stone-700/50" 
                        : "bg-blue-600 text-white rounded-tl-none shadow-md"
                    }`}>
                      {turn.text}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* TEXT MODE UI */}
          {conciergeMode === "text" && (
            <>
              {/* Dialogue Log Terminal */}
              <div className="flex-1 min-h-[240px] max-h-[320px] overflow-y-auto border border-stone-100 rounded-2xl bg-stone-950 p-4 font-sans text-xs space-y-4 shadow-inner my-3">
                {voiceConciergeHistory.map((turn, i) => (
                  <div 
                    key={i} 
                    className={`flex flex-col space-y-1 ${turn.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-500">
                      {turn.role === "user" 
                        ? (voiceConciergeLang === "en" ? "You" : "Vous") 
                        : (voiceConciergeLang === "en" ? "Sora" : "Sora")}
                    </span>
                    <span className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                      turn.role === "user" 
                        ? "bg-stone-800 text-stone-200 rounded-tr-none border border-stone-700/50" 
                        : "bg-blue-600 text-white rounded-tl-none shadow-md"
                    }`}>
                      {turn.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Input for Text Mode */}
              <div className="pt-2 border-t flex items-center gap-2">
                <input
                  type="text"
                  value={voiceConciergeInputText}
                  onChange={(e) => setVoiceConciergeInputText(e.target.value)}
                  placeholder={voiceConciergeLang === "en" ? "Type your question here..." : "Posez votre question ici..."}
                  className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white text-slate-900"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && voiceConciergeInputText.trim() && voiceConciergeStatus !== "processing") {
                      const query = voiceConciergeInputText;
                      setVoiceConciergeInputText("");
                      submitConciergeQuery(query, true);
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={!voiceConciergeInputText.trim() || voiceConciergeStatus === "processing"}
                  onClick={() => {
                    const query = voiceConciergeInputText;
                    setVoiceConciergeInputText("");
                    submitConciergeQuery(query, true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {voiceConciergeLang === "en" ? "Send" : "Envoyer"}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating AI Voice Concierge Button */}
      <div className="fixed bottom-6 right-6 z-[90] flex items-center gap-3">
        <button
          type="button"
          onClick={handleOpenVoiceConcierge}
          className="flex items-center gap-3 px-5 py-4 rounded-full bg-gradient-to-r from-blue-600 to-[#0052A5] hover:from-blue-700 hover:to-[#004185] text-white font-extrabold text-sm shadow-2xl hover:shadow-3xl hover:scale-110 active:scale-95 transition-all duration-200 group relative border border-blue-500/30 cursor-pointer"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 rounded-full transition-opacity" />
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <Mic className="h-5 w-5 animate-pulse text-white group-hover:scale-110 transition-transform" />
          <span className="whitespace-nowrap shadow-sm">
            {searchLang === "en" ? "AI Voice Concierge" : "Concierge Vocal IA"}
          </span>
        </button>

        {/* GO TO TOP ARROW */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 border border-blue-500/30 cursor-pointer"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
}
