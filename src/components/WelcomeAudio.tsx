import { useEffect, useRef, useState } from "react";
import { Play, Sparkles, Square, AlertCircle, Loader2, Star, ChevronDown, Search, Check } from "lucide-react";
import { useAgentTierCapabilities } from "./UpdatedFeatureController";
import { getTourConfig, DEFAULT_WELCOME_TEXTS } from "@/lib/api";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";

/**
 * Mapping language select codes to full language names for TTS parameters
 */
const LANGUAGE_API_NAMES: Record<string, string> = {
  af: "Afrikaans",
  sq: "Albanian",
  am: "Amharic",
  ar: "Arabic",
  hy: "Armenian",
  az: "Azerbaijani",
  eu: "Basque",
  bn: "Bengali",
  bs: "Bosnian",
  bg: "Bulgarian",
  my: "Burmese",
  ca: "Catalan",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  hr: "Croatian",
  cs: "Czech",
  da: "Danish",
  nl: "Dutch",
  en: "English",
  et: "Estonian",
  fa: "Farsi (Persian)",
  fil: "Filipino (Tagalog)",
  fi: "Finnish",
  fr: "French",
  gl: "Galician",
  ka: "Georgian",
  de: "German",
  el: "Greek",
  gu: "Gujarati",
  he: "Hebrew",
  hi: "Hindi",
  hu: "Hungarian",
  is: "Icelandic",
  id: "Indonesian",
  it: "Italian",
  ja: "Japanese",
  kn: "Kannada",
  kk: "Kazakh",
  km: "Khmer",
  ko: "Korean",
  ky: "Kyrgyz",
  lo: "Lao",
  lv: "Latvian",
  lt: "Lithuanian",
  mk: "Macedonian",
  ms: "Malay",
  ml: "Malayalam",
  mr: "Marathi",
  mn: "Mongolian",
  ne: "Nepali",
  no: "Norwegian",
  ps: "Pashto",
  pl: "Polish",
  pt: "Portuguese",
  pa: "Punjabi",
  ro: "Romanian",
  ru: "Russian",
  sr: "Serbian",
  si: "Sinhala",
  sk: "Slovak",
  sl: "Slovenian",
  so: "Somali",
  es: "Spanish",
  sw: "Swahili",
  sv: "Swedish",
  ta: "Tamil",
  te: "Telugu",
  th: "Thai",
  tr: "Turkish",
  uk: "Ukrainian",
  ur: "Urdu",
  uz: "Uzbek",
  vi: "Vietnamese",
  cy: "Welsh",
  zu: "Zulu"
};

const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  af: "Afrikaans",
  sq: "Shqip (Albanian)",
  am: "አማርኛ (Amharic)",
  ar: "العربية (Arabic)",
  hy: "Հայերեն (Armenian)",
  az: "Azərbaycanca (Azerbaijani)",
  eu: "Euskara (Basque)",
  bn: "বাংলা (Bengali)",
  bs: "Bosanski (Bosnian)",
  bg: "Български (Bulgarian)",
  my: "ဗမာစာ (Burmese)",
  ca: "Català (Catalan)",
  "zh-CN": "简体中文 (Chinese - Simplified)",
  "zh-TW": "繁體中文 (Chinese - Traditional)",
  hr: "Hrvatski (Croatian)",
  cs: "Čeština (Czech)",
  da: "Dansk (Danish)",
  nl: "Nederlands (Dutch)",
  en: "English (English - US)",
  et: "Eesti (Estonian)",
  fa: "فارسی (Farsi / Persian)",
  fil: "Tagalog (Filipino)",
  fi: "Suomi (Finnish)",
  fr: "Français (French)",
  gl: "Galego (Galician)",
  ka: "ქართული (Georgian)",
  de: "Deutsch (German)",
  el: "Ελληνικά (Greek)",
  gu: "ગુજરાતી (Gujarati)",
  he: "עברית (Hebrew)",
  hi: "हिन्दी (Hindi)",
  hu: "Magyar (Hungarian)",
  is: "Íslenska (Icelandic)",
  id: "Bahasa Indonesia (Indonesian)",
  it: "Italiano (Italian)",
  ja: "日本語 (Japanese)",
  kn: "ಕನ್ನಡ (Kannada)",
  kk: "Қазақ тілі (Kazakh)",
  km: "ភាសាខ្មែរ (Khmer)",
  ko: "한국어 (Korean)",
  ky: "Кыргызча (Kyrgyz)",
  lo: "ພາສາລາວ (Lao)",
  lv: "Latviešu (Latvian)",
  lt: "Lietuvių (Lithuanian)",
  mk: "Macedonian (Македонски)",
  ms: "Bahasa Melayu (Malay)",
  ml: "മലയാളം (Malayalam)",
  mr: "मराठी (Marathi)",
  mn: "Монгол (Mongolian)",
  ne: "नेपाली (Nepali)",
  no: "Norsk (Norwegian)",
  ps: "پښتو (Pashto)",
  pl: "Polski (Polish)",
  pt: "Português (Portuguese)",
  pa: "ਪੰਜਾਬੀ (Punjabi)",
  ro: "Română (Romanian)",
  ru: "Русский (Russian)",
  sr: "Српски (Serbian)",
  si: "සිංහல (Sinhala)",
  sk: "Slovenčina (Slovak)",
  sl: "Slovenščina (Slovenian)",
  so: "Soomaali (Somali)",
  es: "Español (Spanish)",
  sw: "Kiswahili (Swahili)",
  sv: "Svenska (Swedish)",
  ta: "தமிழ் (Tamil)",
  te: "తెలుగు (Telugu)",
  th: "ไทย (Thai)",
  tr: "Türkçe (Turkish)",
  uk: "Українська (Ukrainian)",
  ur: "اردو (Urdu)",
  uz: "Oʻzbekcha (Uzbek)",
  vi: "Tiếng Việt (Vietnamese)",
  cy: "Cymraeg (Welsh)",
  zu: "isiZulu (Zulu)"
};

const START_TRANSLATIONS: Record<string, string> = {
  ar: "ابدأ (Start)",
  bn: "শুরু করুন (Start)",
  nl: "Starten (Start)",
  en: "Start",
  fr: "Démarrer (Start)",
  de: "Starten (Start)",
  hi: "शुरू करें (Start)",
  id: "Mulai (Start)",
  it: "Avvia (Start)",
  ja: "開始 (Start)",
  ko: "시작 (Start)",
  pl: "Rozpocznij (Start)",
  pt: "Iniciar (Start)",
  ro: "Start",
  ru: "Начать (Start)",
  es: "Iniciar (Start)",
  sv: "Starta (Start)",
  ta: "தொடங்கு (Start)",
  th: "เริ่ม (Start)",
  tr: "Başlat (Start)",
  ur: "شروع کریں (Start)",
  vi: "Bắt đầu (Start)",
  "zh-CN": "开始 (Start)",
  "zh-TW": "開始 (Start)"
};

const PLAY_TRANSLATIONS: Record<string, string> = {
  ar: "تشغيل الصوت / Play Audio",
  bn: "অডিও শুনুন / Play Audio",
  nl: "Audio afspelen / Play Audio",
  en: "Play Audio",
  fr: "Écouter l'audio / Play Audio",
  de: "Audio abspielen / Play Audio",
  hi: "ऑडियो चलाएं / Play Audio",
  id: "Putar Audio / Play Audio",
  it: "Riproduci audio / Play Audio",
  ja: "オーディオ再生 / Play Audio",
  ko: "오디오 재생 / Play Audio",
  pl: "Odtwórz dźwięk / Play Audio",
  pt: "Reproduzir áudio / Play Audio",
  ro: "Redare audio / Play Audio",
  ru: "Воспроизвести аудио / Play Audio",
  es: "Reproducir audio / Play Audio",
  sv: "Spela ljud / Play Audio",
  ta: "ஆடியோவை இயக்கு / Play Audio",
  th: "เล่นเสียง / Play Audio",
  tr: "Sesi Çal / Play Audio",
  ur: "آڈیو چلائیں / Play Audio",
  vi: "Phát âm thanh / Play Audio",
  "zh-CN": "播放音频 / Play Audio",
  "zh-TW": "播放音訊 / Play Audio"
};

interface WelcomeAudioProps {
  language?: string;
  onLanguageChange?: (language: string) => void;
  sources?: {
    en?: string;
    fr?: string;
  };
  onSpeakingChange?: (isSpeaking: boolean) => void;
  listingId?: string;
  autoHideAfterPlay?: boolean;
  agentPlan?: string;
  agentId?: string;
  startVoiceTourText?: string;
  experienceGuideText?: string;
}

export default function WelcomeAudio({
  language: propsLanguage,
  onLanguageChange,
  onSpeakingChange,
  agentPlan,
  agentId,
  listingId,
  startVoiceTourText,
  experienceGuideText,
}: WelcomeAudioProps) {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const activeUrlRef = useRef<string | null>(null);

  const { user } = useAuth();
  const isAdmin = user?.email?.toLowerCase() === "luc.valade@gmail.com" || (user as any)?.role === "admin" || (user as any)?.role === "platform_admin";

  const { capabilities, loading: capabilitiesLoading } = useAgentTierCapabilities(agentId);
  const isPro = capabilities.maxConversationTurns > 10 || agentPlan === "pro" || agentPlan === "pro_agent" || agentPlan === "elite" || agentPlan === "team_pro" || isAdmin;

  const [language, setLanguage] = useState("en");

  // Sync incoming propsLanguage (e.g. "English", "French", "fr", "es") to internal language code (e.g. "en", "fr", "es")
  useEffect(() => {
    if (propsLanguage) {
      const lower = propsLanguage.toLowerCase();
      const matchedCode = Object.entries(LANGUAGE_API_NAMES).find(
        ([code, name]) => code.toLowerCase() === lower || name.toLowerCase() === lower
      )?.[0];
      if (matchedCode && matchedCode !== language) {
        setLanguage(matchedCode);
      }
    }
  }, [propsLanguage]);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "generating" | "ready" | "playing" | "error">("idle");
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic configurations loaded from Firestore tourConfig/main
  const [welcomeTexts, setWelcomeTexts] = useState<Record<string, string>>(DEFAULT_WELCOME_TEXTS);
  const [voiceId, setVoiceId] = useState("Kore");
  const [ttsModel, setTtsModel] = useState("gemini-3.1-flash-tts-preview");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredLanguages = Object.entries(LANGUAGE_DISPLAY_NAMES).filter(([code, name]) =>
    name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    const langName = LANGUAGE_API_NAMES[langCode] || "English";

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
        let activeTexts: Record<string, string> = { ...DEFAULT_WELCOME_TEXTS };
        let activeVoice = "Kore";
        let activeModel = "gemini-3.1-flash-tts-preview";

        if (listingId) {
          const config = await getTourConfig(listingId);
          if (config && config.welcomeTexts) {
            activeTexts = { ...activeTexts, ...config.welcomeTexts };
          }

          // Merge custom scripts from main listing document as fallback/override
          try {
            const listingSnap = await getDoc(doc(db, "listings", listingId));
            if (listingSnap.exists()) {
              const lData = listingSnap.data();
              const customEn = lData.welcome_en_script || lData.welcome_en;
              const customFr = lData.welcome_fr_script || lData.welcome_fr;
              const customOther = lData.welcome_other_script;
              const customOtherLang = lData.welcome_other_lang;

              if (customEn && !customEn.startsWith("data:audio") && !customEn.endsWith(".mp3") && customEn.trim()) {
                activeTexts.en = customEn;
              }
              if (customFr && !customFr.startsWith("data:audio") && !customFr.endsWith(".mp3") && customFr.trim()) {
                activeTexts.fr = customFr;
              }
              if (customOther && customOtherLang && customOther.trim()) {
                const langCodeMap: Record<string, string> = {
                  Arabic: "ar", "Chinese (Simplified)": "zh-CN", "Chinese (Traditional)": "zh-TW",
                  Dutch: "nl", English: "en", French: "fr", German: "de", Hindi: "hi",
                  Italian: "it", Japanese: "ja", Korean: "ko", Portuguese: "pt",
                  Russian: "ru", Spanish: "es", Vietnamese: "vi"
                };
                const cCode = langCodeMap[customOtherLang];
                if (cCode) {
                  activeTexts[cCode] = customOther;
                }
              }
            }
          } catch (docErr) {
            console.warn("[WelcomeAudio] Error reading listing doc scripts:", docErr);
          }

          setWelcomeTexts(activeTexts);

          if (config) {
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
        // Set status to idle to wait for manual Start button click
        setStatus("idle");
      } catch (err) {
        console.error("[WelcomeAudio] Error loading Firestore tourConfig:", err);
        setStatus("idle");
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
    if (!capabilitiesLoading && !isPro && language !== "en") {
      setLanguage("en");
      handleReset();
    }
  }, [capabilitiesLoading, agentPlan, isPro, language]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLang = e.target.value;
    if (!isPro && selectedLang !== "en") {
      setLanguage("en");
      return;
    }
    setLanguage(selectedLang);
    // Clear previous audio on language change, so it's generated on-demand
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
      setBlobUrl(null);
    }
    setStatus("idle");
  };

  const play = async () => {
    const el = audioElementRef.current;
    if (!el) return;

    if (!blobUrl || status === "error" || status === "idle") {
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

  const getButtonLabel = () => {
    if (status === "generating") {
      return "Generating audio…";
    }
    if (status === "ready") {
      return PLAY_TRANSLATIONS[language] || "Play Audio";
    }
    return START_TRANSLATIONS[language] || "Start";
  };

  return (
    <div id="ai-guided-welcome-tour-card" className="flex flex-col w-full bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 backdrop-blur-sm shadow-lg mt-4 animate-in fade-in duration-300 text-left">
      <audio
        ref={audioElementRef}
        onEnded={handleEnded}
        onError={handleAudioError}
        preload="auto"
      />

      {/* Start Voice Tour */}
      <div className="flex flex-col items-center justify-center text-center gap-1.5 mb-5 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-blue-400 justify-center">
          <Star className="w-5 h-5 fill-blue-400 shrink-0" />
          <h3 className="font-extrabold text-base sm:text-lg text-white uppercase tracking-wide">
            {startVoiceTourText || "Start Voice Tour"}
          </h3>
        </div>
        <p className="text-slate-400 text-xs font-medium">
          {experienceGuideText || "Experience this property with an interactive AI guide"}
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
        <span className="text-xs text-slate-200 font-semibold tracking-wide">
          AI Guided Welcome Tour
        </span>
      </div>

      {/* 1. Searchable Language Dropdown */}
      <div className="w-full mb-3 relative" ref={dropdownRef}>
        <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
          Welcome Language
        </label>
        
        {/* Toggle Button */}
        <button
          type="button"
          disabled={status === "generating"}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full bg-slate-800 border border-slate-700/80 text-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between text-left"
        >
          <span>{LANGUAGE_DISPLAY_NAMES[language] || "English (English - US)"}</span>
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
        </button>

        {/* Floating Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-700/80 rounded-lg shadow-xl z-50 max-h-[250px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Search Box */}
            <div className="p-2 border-b border-slate-800 flex items-center gap-2 bg-slate-950/80">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search language..."
                className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSearchQuery(""); }}
                  className="text-[10px] text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Language List */}
            <div className="overflow-y-auto flex-1 py-1 max-h-[190px]">
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map(([code, name]) => {
                  const isLocked = !isPro && code !== "en";
                  const isSelected = language === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      disabled={isLocked}
                      onClick={() => {
                        setLanguage(code);
                        const langName = LANGUAGE_API_NAMES[code] || "English";
                        if (onLanguageChange) {
                          onLanguageChange(langName);
                        }
                        // Clear previous audio on language change
                        if (activeUrlRef.current) {
                          URL.revokeObjectURL(activeUrlRef.current);
                          activeUrlRef.current = null;
                          setBlobUrl(null);
                        }
                        setStatus("idle");
                        setIsDropdownOpen(false);
                        setSearchQuery("");
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected 
                          ? "bg-blue-600/30 text-blue-400 font-semibold" 
                          : isLocked 
                            ? "text-slate-600 cursor-not-allowed opacity-50 hover:bg-transparent" 
                            : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span className="truncate text-left">{name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                      {isLocked && <span className="text-[10px] text-slate-500 bg-slate-800/40 px-1.5 py-0.5 rounded shrink-0">🔒 Pro</span>}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-xs text-slate-500 text-center">
                  No languages found
                </div>
              )}
            </div>
          </div>
        )}
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
            Stop - {LANGUAGE_API_NAMES[language] || "Audio"}
          </button>
        ) : (
          <button
            type="button"
            onClick={play}
            disabled={status !== "ready" && status !== "idle" && status !== "error"}
            className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:active:scale-100 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-lg transition-all border border-blue-500/20 cursor-pointer disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-3 w-3 fill-white text-white" />
            {getButtonLabel()}
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
