import { useEffect, useRef, useState } from "react";
import { Play, Sparkles, Square, AlertCircle, Loader2 } from "lucide-react";
import { useAgentTierCapabilities } from "./UpdatedFeatureController";
import { getTourConfig, DEFAULT_WELCOME_TEXTS } from "@/lib/api";

/**
 * Mapping language select codes to full language names for TTS parameters
 */
const LANGUAGE_NAMES: Record<string, string> = {
  ar: "Arabic",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  nl: "Dutch",
  en: "English",
  fr: "French",
  de: "German",
  hi: "Hindi",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  pt: "Portuguese",
  ru: "Russian",
  es: "Spanish",
  vi: "Vietnamese"
};

interface WelcomeAudioProps {
  language?: string;
  sources?: {
    en?: string;
    fr?: string;
  };
  onSpeakingChange?: (isSpeaking: boolean) => void;
  listingId?: string;
  autoHideAfterPlay?: boolean;
  agentPlan?: string;
  agentId?: string;
}

export default function WelcomeAudio({
  onSpeakingChange,
  agentPlan,
  agentId,
  listingId,
}: WelcomeAudioProps) {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const activeUrlRef = useRef<string | null>(null);

  const { capabilities } = useAgentTierCapabilities(agentId);
  const isPro = capabilities.maxConversationTurns > 10 || agentPlan === "pro" || agentPlan === "pro_agent" || agentPlan === "elite" || agentPlan === "team_pro";

  const [language, setLanguage] = useState("en");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "generating" | "ready" | "playing" | "error">("idle");
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic configurations loaded from Firestore tourConfig/main
  const [welcomeTexts, setWelcomeTexts] = useState<Record<string, string>>(DEFAULT_WELCOME_TEXTS);
  const [voiceId, setVoiceId] = useState("Kore");
  const [ttsModel, setTtsModel] = useState("gemini-2.5-flash-preview-tts");

  const generateAudioForLanguageWithParams = async (
    langCode: string,
    texts: Record<string, string>,
    voice: string,
    model: string,
    autoPlay: boolean = false
  ) => {
    // Revoke previous URL if any
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
      setBlobUrl(null);
    }

    setStatus("generating");
    setError(null);
    setSpeaking(false);

    const textToSpeak = texts[langCode] || texts["en"] || DEFAULT_WELCOME_TEXTS[langCode] || DEFAULT_WELCOME_TEXTS["en"];
    const langName = LANGUAGE_NAMES[langCode] || "English";

    try {
      const response = await fetch("/api/tts-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSpeak,
          lang: langName,
          voiceName: voice,
          model: model
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact Gemini TTS servers.");
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
        
        activeUrlRef.current = url;
        setBlobUrl(url);
        
        if (autoPlay) {
          const el = audioElementRef.current;
          if (el) {
            el.src = url;
            el.load();
            setError(null);
            try {
              el.currentTime = 0;
              await el.play();
              setSpeaking(true);
              setStatus("playing");
            } catch (err: any) {
              console.error("[WelcomeAudio] autoPlay failed, falling back to ready state:", err);
              // Fallback to "ready" state so they can click the button to trigger 100% synchronous direct play
              setStatus("ready");
              setSpeaking(false);
            }
          }
        } else {
          setStatus("ready");
        }
      } else {
        throw new Error(data.error || "No audio returned from Gemini.");
      }
    } catch (err: any) {
      console.error("[WelcomeAudio] Error generating audio:", err);
      setError(err.message || "Could not generate welcome audio.");
      setStatus("error");
    }
  };

  const generateAudioForLanguage = async (langCode: string, autoPlay: boolean = false) => {
    return generateAudioForLanguageWithParams(langCode, welcomeTexts, voiceId, ttsModel, autoPlay);
  };

  // Load tourConfig from Firestore on mount or when listingId changes
  useEffect(() => {
    const fetchTourConfig = async () => {
      try {
        let activeLang = "en";
        let activeTexts = DEFAULT_WELCOME_TEXTS;
        let activeVoice = "Kore";
        let activeModel = "gemini-2.5-flash-preview-tts";

        if (listingId) {
          const config = await getTourConfig(listingId);
          if (config) {
            if (config.welcomeTexts) {
              setWelcomeTexts(config.welcomeTexts);
              activeTexts = config.welcomeTexts;
            }
            if (config.voiceId) {
              setVoiceId(config.voiceId);
              activeVoice = config.voiceId;
            }
            if (config.ttsModel) {
              setTtsModel(config.ttsModel);
              activeModel = config.ttsModel;
            }
            if (config.defaultLanguage) {
              setLanguage(config.defaultLanguage);
              activeLang = config.defaultLanguage;
            }
          }
        }
        // Pre-generate audio with the correct loaded configurations
        await generateAudioForLanguageWithParams(activeLang, activeTexts, activeVoice, activeModel, false);
      } catch (err) {
        console.error("[WelcomeAudio] Error loading Firestore tourConfig:", err);
        await generateAudioForLanguageWithParams("en", DEFAULT_WELCOME_TEXTS, "Kore", "gemini-2.5-flash-preview-tts", false);
      }
    };
    fetchTourConfig();
  }, [listingId]);

  // Sync speaking change status with parent component
  useEffect(() => {
    if (onSpeakingChange) {
      onSpeakingChange(speaking);
    }
  }, [speaking, onSpeakingChange]);

  // Clean up Blob URLs on unmount
  useEffect(() => {
    return () => {
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
      }
    };
  }, []);

  // Force loading the audio element when blobUrl changes to avoid browser quirks
  useEffect(() => {
    const el = audioElementRef.current;
    if (el) {
      if (blobUrl) {
        el.src = blobUrl;
        el.load();
      } else {
        el.removeAttribute("src");
        el.load();
      }
    }
  }, [blobUrl]);

  // Lock language to English if agent is on Solo tier
  useEffect(() => {
    if (!isPro && language !== "en") {
      setLanguage("en");
      handleReset();
    }
  }, [agentPlan, isPro, language]);

  // Preset language dropdown menu on mount to explicitly "English" ("en")
  useEffect(() => {
    setLanguage("en");
    if (!listingId) {
      generateAudioForLanguageWithParams("en", DEFAULT_WELCOME_TEXTS, "Kore", "gemini-2.5-flash-preview-tts", false);
    }
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLang = e.target.value;
    if (!isPro && selectedLang !== "en") {
      setLanguage("en");
      return;
    }
    setLanguage(selectedLang);
    generateAudioForLanguage(selectedLang, false);
  };

  const play = async () => {
    const el = audioElementRef.current;
    if (!el) return;

    if (!blobUrl || status === "error") {
      await generateAudioForLanguage(language, true);
      return;
    }

    setError(null);
    try {
      el.currentTime = 0;
      await el.play();
      setSpeaking(true);
      setStatus("playing");
    } catch (err: any) {
      console.error("[WelcomeAudio] play() failed:", err);
      setError("Could not play the welcome message.");
      setStatus("error");
    }
  };

  const stop = () => {
    const el = audioElementRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    setSpeaking(false);
    setStatus("ready");
  };

  const handleReset = () => {
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
      setBlobUrl(null);
    }
    setLanguage("en");
    setError(null);
    setSpeaking(false);
    setStatus("idle");
  };

  const handleEnded = () => {
    setSpeaking(false);
    setStatus("ready");
  };

  const handleAudioError = () => {
    console.error("[WelcomeAudio] HTMLAudioElement reports error playing Blob URL");
    setError("Audio playback error occurred.");
    setStatus("error");
    setSpeaking(false);
  };

  return (
    <div id="ai-guided-welcome-tour-card" className="flex flex-col w-full bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 backdrop-blur-sm shadow-lg mt-4 animate-in fade-in duration-300 text-left">
      <audio
        ref={audioElementRef}
        onEnded={handleEnded}
        onError={handleAudioError}
        preload="auto"
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
        <span className="text-xs text-slate-200 font-semibold tracking-wide">
          AI Guided Welcome Tour
        </span>
      </div>

      {/* 1. Language Dropdown Label & Select */}
      <div className="w-full mb-3">
        <label htmlFor="welcome-language-select" className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
          Welcome Language
        </label>
        <select
          id="welcome-language-select"
          value={language}
          onChange={handleLanguageChange}
          disabled={status === "generating"}
          className="w-full bg-slate-800 border border-slate-700/80 text-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="ar" disabled={!isPro}>Arabic (العربية) {!isPro && "🔒 (Pro Upgrade)"}</option>
          <option value="zh-CN" disabled={!isPro}>Chinese (Simplified / 简体中文) {!isPro && "🔒 (Pro Upgrade)"}</option>
          <option value="zh-TW" disabled={!isPro}>Chinese (Traditional / 繁體中文) {!isPro && "🔒 (Pro Upgrade)"}</option>
          <option value="nl" disabled={!isPro}>Dutch (Nederlands) {!isPro && "🔒 (Pro Upgrade)"}</option>
          <option value="en">English (English)</option>
          <option value="fr" disabled={!isPro}>French (Français) {!isPro && "🔒 (Pro Upgrade)"}</option>
          <option value="de" disabled={!isPro}>German (Deutsch) {!isPro && "🔒 (Pro Upgrade)"}</option>
          <option value="hi" disabled={!isPro}>Hindi (हिन्दी) {!isPro && "🔒 (Pro Upgrade)"}</option>
          <option value="it" disabled={!isPro}>Italian (Italiano) {!isPro && "🔒 (Pro Upgrade)"}</option>
          <option value="ja" disabled={!isPro}>Japanese (日本語) {!isPro && "🔒 (Pro Upgrade)"}</option>
          <option value="ko" disabled={!isPro}>Korean (한국어) {!isPro && "🔒 (Pro Upgrade)"}</option>
          <option value="pt" disabled={!isPro}>Portuguese (Português) {!isPro && "🔒 (Pro Upgrade)"}</option>
          <option value="ru" disabled={!isPro}>Russian (Русский) {!isPro && "🔒 (Pro Upgrade)"}</option>
          <option value="es" disabled={!isPro}>Spanish (Español) {!isPro && "🔒 (Pro Upgrade)"}</option>
          <option value="vi" disabled={!isPro}>Vietnamese (Tiếng Việt) {!isPro && "🔒 (Pro Upgrade)"}</option>
        </select>
      </div>

      {/* 2. Status Line */}
      <div className="flex items-center h-5 mb-4">
        {status === "generating" && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Generating audio…</span>
          </div>
        )}
        {status === "ready" && (
          <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>● Ready</span>
          </div>
        )}
        {status === "playing" && (
          <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span>Playing…</span>
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
            <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <span className="truncate">{error || "Error generating audio"}</span>
          </div>
        )}
        {status === "idle" && (
          <span className="text-xs text-slate-500">Idle</span>
        )}
      </div>

      {/* 3. Start/Stop Button */}
      <div className="w-full mb-3">
        {status === "playing" ? (
          <button
            type="button"
            onClick={stop}
            className="w-full flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-lg transition-all border border-red-500/20 cursor-pointer"
          >
            <Square className="h-3 w-3 fill-white text-white animate-pulse" />
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={play}
            disabled={status !== "ready"}
            className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:active:scale-100 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-lg transition-all border border-blue-500/20 cursor-pointer disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-3 w-3 fill-white text-white" />
            Start
          </button>
        )}
      </div>

      {/* 4. Reset Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleReset}
          className="text-[11px] text-slate-400 hover:text-slate-200 font-medium px-2 py-1 hover:bg-slate-800/40 rounded transition-all cursor-pointer"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
