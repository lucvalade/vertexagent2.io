import { useEffect, useRef, useState } from "react";
import { Play, Sparkles, Square, AlertCircle, Loader2 } from "lucide-react";

/**
 * 15 welcome texts verbatim from the 15-language spreadsheet / migration config.
 */
const WELCOME_TEXTS: Record<string, string> = {
  ar: "أهلاً بك! أنا سورا، مساعدتك الذكية في مجال العقارات. شكراً لزيارتك هذا البيت المفتوح. لا تتردد في إلقاء نظرة حولك، واستكشاف الغرف، وطرح أي أسئلة عليّ بخصوص ميزات العقار أو Сعر أو الحي.",
  "zh-CN": "欢迎！我是 Sora，您的房产人工智能助手。感谢您参观本次开放日。请随意看看，探索各个房间，并向我提问有关房产特征、价格或周边的任何问题。",
  "zh-TW": "歡迎！我是 Sora，您的房地產人工智慧助手。感謝您參觀本次開放日。請隨意看看，探索各個房間，並向我提問有關房產特徵、價格或周邊的任何問題。",
  nl: "Welkom! Ik ben Sora, uw vastgoed AI-assistent. Bedankt voor uw bezoek aan dit open huis. Voel u vrij om rond te kijken, de kamers te verkennen en mij vragen te stellen over de kenmerken van de woning, de prijs of de buurt.",
  en: "Welcome! I am Sora, your real estate AI assistant. Thank you for visiting this open house. Please feel free to look around, explore the rooms, and ask me any questions about the property features, pricing, or neighborhood.",
  fr: "Bonjour ! Je suis Sora, votre guide pour cette visite. Je suis ravie de vous accompagner. Avez-vous des questions sur cette propriété ?",
  de: "Willkommen! Ich bin Sora, Ihre Immobilien-KI-Assistentin. Vielen Dank für Ihren Besuch bei diesem Tag der offenen Tür. Bitte schauen Sie sich ungezwungen um, erkunden Sie die Räume und stellen Sie mir Fragen zu den Eigenschaften der Immobilie, dem Preis oder der Nachbarschaft.",
  hi: "स्वागत है! मैं सोरा हूँ, आपकी रियल एस्टेट एआई सहायक। इस ओपन हाउस में आने के लिए धन्यवाद। कृपया बेझिझक चारों ओर देखें, कमरों का अन्वेषण करें, और मुझसे संपत्ति की विशेषताओं, कीमत या पड़ोस के बारे में कोई भी प्रश्न पूछें।",
  it: "Benvenuto! Sono Sora, la tua assistente AI immobiliare. Grazie per aver visitato questa casa aperta. Ti invitiamo a guardarti intorno, esplorare le stanze e farmi qualsiasi domanda sulle caratteristiche della proprietà, sul prezzo o sul quartiere.",
  ja: "ようこそ！私は不動産AIアシスタントのSoraです。このオープンハウスにお越しいただきありがとうございます。どうぞご自由に周りを見渡し、お部屋を探索し、物件の特徴や価格、周辺環境について何でもご質問ください。",
  ko: "환영합니다! 저는 귀하의 부동산 AI 어시스턴트인 Sora입니다. 이번 오픈 하우스에 방문해 주셔서 감사합니다. 자유롭게 둘러보시고, 방을 살펴보시며 매물의 특징, 가격 또는 주변 환경에 대해 궁금한 점이 있으시면 언제든지 질문해 주세요.",
  pt: "Bem-vindo! Eu sou Sora, sua assistente de IA imobiliária. Obrigado por visitar esta casa aberta. Sinta-se à vontade para olhar ao redor, explorar os cômodos e me fazer qualquer pergunta sobre as características do imóvel, preço ou vizinhança.",
  ru: "Добро пожаловать! Я Сора, ваш ИИ-помощник по недвижимости. Спасибо, что посетили этот день открытых дверей. Пожалуйста, не стесняйтесь осматриваться, изучать комнаты и задавать мне любые вопросы о характеристиках недвижимости, цене или районе.",
  es: "¡Bienvenido! Soy Sora, su asistente de inteligencia artificial para bienes raíces. Gracias por visitar esta casa abierta. Por favor, siéntase libre de mirar a su alrededor, explorar las habitaciones y hacerme cualquier pregunta sobre las características de la propiedad, el precio o el vecindario.",
  vi: "Chào mừng! Tôi là Sora, trợ lý AI bất động sản của bạn. Cảm ơn bạn đã ghé thăm buổi mở cửa xem nhà này. Xin vui lòng tự nhiên nhìn xung quanh, khám phá các phòng và hỏi tôi bất kỳ câu hỏi nào về các tính năng của bất động sản, giá cả hoặc khu lân cận."
};

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
}

export default function WelcomeAudio({
  language: languageProp,
  onSpeakingChange,
}: WelcomeAudioProps) {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const activeUrlRef = useRef<string | null>(null);

  const [language, setLanguage] = useState(languageProp || "en");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "generating" | "ready" | "playing" | "error">("idle");
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (el && blobUrl) {
      el.src = blobUrl;
      el.load();
    }
  }, [blobUrl]);

  // Fetch welcome audio when the language prop changes or on mount
  useEffect(() => {
    const targetLang = languageProp || "en";
    setLanguage(targetLang);
    generateAudioForLanguage(targetLang, false);
  }, [languageProp]);

  const generateAudioForLanguage = async (langCode: string, autoPlay: boolean = false) => {
    // Revoke previous URL if any
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
      setBlobUrl(null);
    }

    setStatus("generating");
    setError(null);
    setSpeaking(false);

    const textToSpeak = WELCOME_TEXTS[langCode] || WELCOME_TEXTS["en"];
    const langName = LANGUAGE_NAMES[langCode] || "English";

    try {
      const response = await fetch("/api/tts-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSpeak,
          lang: langName,
          voiceName: "sora" // server will map this to 'Kore'
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
              console.error("[WelcomeAudio] autoPlay failed:", err);
              setError("Could not play the welcome message.");
              setStatus("error");
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

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLang = e.target.value;
    setLanguage(selectedLang);
    generateAudioForLanguage(selectedLang, false);
  };

  const play = async () => {
    const el = audioElementRef.current;
    if (!el || !blobUrl) return;

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
        src={blobUrl || undefined}
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
          <option value="ar">Arabic (العربية)</option>
          <option value="zh-CN">Chinese (Simplified / 简体中文)</option>
          <option value="zh-TW">Chinese (Traditional / 繁體中文)</option>
          <option value="nl">Dutch (Nederlands)</option>
          <option value="en">English</option>
          <option value="fr">French (Français)</option>
          <option value="de">German (Deutsch)</option>
          <option value="hi">Hindi (हिन्दी)</option>
          <option value="it">Italian (Italiano)</option>
          <option value="ja">Japanese (日本語)</option>
          <option value="ko">Korean (한국어)</option>
          <option value="pt">Portuguese (Português)</option>
          <option value="ru">Russian (Русский)</option>
          <option value="es">Spanish (Español)</option>
          <option value="vi">Vietnamese (Tiếng Việt)</option>
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
            <span>Ready</span>
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
            Start Welcome Tour
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
