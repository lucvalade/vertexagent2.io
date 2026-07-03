import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play, RotateCcw, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface WelcomeAudioProps {
  language: string;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  sources?: {
    en: string;
    fr: string;
  };
  listingId?: string;
}

const LANGUAGES_MAP: Record<string, string> = {
  "English": "en",
  "French": "fr",
  "Spanish": "es",
  "German": "de",
  "Italian": "it",
  "Portuguese": "pt",
  "Chinese (Simplified)": "zh-CN",
  "Chinese (Traditional)": "zh-TW",
  "Japanese": "ja",
  "Korean": "ko",
  "Dutch": "nl",
  "Russian": "ru",
  "Vietnamese": "vi",
  "Arabic": "ar",
  "Hindi": "hi",
  "Bengali": "bn",
  "Indonesian": "id",
  "Polish": "pl",
  "Romanian": "ro",
  "Swedish": "sv",
  "Tamil": "ta",
  "Thai": "th",
  "Turkish": "tr",
  "Urdu": "ur"
};

const WELCOME_LABELS: Record<string, {
  tapToStart: string;
  replay: string;
  mute: string;
  unmute: string;
  playing: string;
  stop: string;
  start: string;
  welcomeSpeech: string;
}> = {
  English: {
    tapToStart: "Tap to Start Welcome Tour",
    replay: "Replay Welcome",
    mute: "Mute",
    unmute: "Unmute",
    playing: "Playing Welcome Audio...",
    stop: "Stop",
    start: "Start",
    welcomeSpeech: "Welcome to this beautiful property. Feel free to explore and ask me any questions about the rooms, features, or layout as you walk through."
  },
  French: {
    tapToStart: "Lancer la visite de bienvenue",
    replay: "Recommencer la bienvenue",
    mute: "Muet",
    unmute: "Activer le son",
    playing: "Lecture de l'audio de bienvenue...",
    stop: "Arrêter",
    start: "Démarrer",
    welcomeSpeech: "Bonjour ! Je suis Sora, votre guide pour cette visite. Je suis ravie de vous accompagner. Avez-vous des questions sur cette propriété ?"
  },
  Spanish: {
    tapToStart: "Iniciar visita de bienvenida",
    replay: "Repetir bienvenida",
    mute: "Silenciar",
    unmute: "Activar sonido",
    playing: "Reproduciendo audio de bienvenida...",
    stop: "Detener",
    start: "Iniciar",
    welcomeSpeech: "Bienvenido a esta hermosa propiedad. Siéntase libre de explorar y hacerme cualquier pregunta sobre las habitaciones, características o distribución mientras camina."
  },
  German: {
    tapToStart: "Willkommenstour starten",
    replay: "Willkommen erneut abspielen",
    mute: "Stummschalten",
    unmute: "Ton einschalten",
    playing: "Willkommens-Audio wird abgespielt...",
    stop: "Stoppen",
    start: "Starten",
    welcomeSpeech: "Willkommen in dieser wunderschönen Immobilie. Fühlen Sie sich frei, sie zu erkunden und mir Fragen zu den Räumen, Merkmalen oder dem Grundriss zu stellen, während Sie durchgehen."
  },
  Italian: {
    tapToStart: "Avvia il tour di benvenuto",
    replay: "Riproduci benvenuto",
    mute: "Silenzia",
    unmute: "Riattiva audio",
    playing: "Riproduzione audio di benvenuto...",
    stop: "Interrompi",
    start: "Avvia",
    welcomeSpeech: "Benvenuti in questa splendida proprietà. Senti libero di esplorare e farmi qualsiasi domanda sulle stanze, caratteristiche o disposizione mentre cammini."
  },
  Portuguese: {
    tapToStart: "Iniciar tour de boas-vindas",
    replay: "Repetir boas-vindas",
    mute: "Mudar para mudo",
    unmute: "Ativar som",
    playing: "Reproduzindo áudio de boas-vindas...",
    stop: "Parar",
    start: "Iniciar",
    welcomeSpeech: "Bem-vindo a esta bela propriedade. Sinta-se à vontade para explorar e me fazer qualquer pergunta sobre os cômodos, características ou layout enquanto caminha."
  },
  "Chinese (Simplified)": {
    tapToStart: "启动欢迎导览",
    replay: "重新播放欢迎语",
    mute: "静音",
    unmute: "取消静音",
    playing: "正在播放欢迎音频...",
    stop: "停止",
    start: "开始",
    welcomeSpeech: "欢迎光临这处美丽的房产。您在参观时可以随时向我询问有关房间、特色或布局的任何问题。"
  },
  "Chinese (Traditional)": {
    tapToStart: "啟動歡迎導覽",
    replay: "重新播放歡迎語",
    mute: "靜音",
    unmute: "取消靜音",
    playing: "正在播放歡迎音訊...",
    stop: "停止",
    start: "開始",
    welcomeSpeech: "歡迎光臨這處美麗的房產。您在參觀時可以隨時向我詢問有關房間、特色或布局的任何問題。"
  },
  Japanese: {
    tapToStart: "ウェルカムツアーを開始",
    replay: "もう一度再生",
    mute: "ミュート",
    unmute: "ミュート解除",
    playing: "ウェルカムオーディオを再生中...",
    stop: "停止",
    start: "スタート",
    welcomeSpeech: "この素晴らしい物件へようこそ。ご自由に見学していただき、お部屋や特徴、間取りについてのご質問がございましたら、いつでもお気軽にお尋ねください。"
  },
  Korean: {
    tapToStart: "웰컴 투어 시작하기",
    replay: "웰컴 오디오 다시 듣기",
    mute: "음소거",
    unmute: "음소거 해제",
    playing: "웰컴 오디오 재생 중...",
    stop: "정지",
    start: "시작",
    welcomeSpeech: "이 아름다운 부동산에 오신 것을 환영합니다. 자유롭게 둘러보시고 방, 특징 또는 구조에 대해 궁금한 점이 있으시면 언제든지 저에게 물어보세요."
  },
  Dutch: {
    tapToStart: "Welkomstrondleiding starten",
    replay: "Welkom opnieuw afspelen",
    mute: "Dempen",
    unmute: "Geluid aanzetten",
    playing: "Welkomstaudio afspelen...",
    stop: "Stoppen",
    start: "Starten",
    welcomeSpeech: "Welkom bij deze prachtige woning. Voel je vrij om rond te kijken en me vragen te stellen over de kamers, kenmerken of indeling tijdens je rondgang."
  },
  Russian: {
    tapToStart: "Начать приветственный тур",
    replay: "Повторить приветствие",
    mute: "Без звука",
    unmute: "Включить звук",
    playing: "Воспроизведение приветствия...",
    stop: "Остановить",
    start: "Начать",
    welcomeSpeech: "Добро пожаловать в эту превосходную недвижимость. Пожалуйста, осматривайтесь и задавайте ИИ любые вопросы о комнатах, особенностях или планировке во время вашего визита."
  },
  Vietnamese: {
    tapToStart: "Bắt đầu chuyến tham quan chào mừng",
    replay: "Phát lại lời chào",
    mute: "Tắt tiếng",
    unmute: "Bật tiếng",
    playing: "Đang phát âm thanh chào mừng...",
    stop: "Dừng",
    start: "Bắt đầu",
    welcomeSpeech: "Chào mừng bạn đến với bất động sản tuyệt đẹp này. Hãy tự do khám phá và đặt bất kỳ câu hỏi nào về các phòng, tính năng hoặc thiết kế trong khi bạn tham quan."
  },
  Arabic: {
    tapToStart: "ابدأ جولة الترحيب",
    replay: "إعادة تشغيل الترحيب",
    mute: "كتم الصوت",
    unmute: "إلغاء الكتم",
    playing: "جاري تشغيل الصوت الترحيبي...",
    stop: "إيقاف",
    start: "ابدأ",
    welcomeSpeech: "مرحبًا بكم في هذا العقار الرائع. لا تتردد في الاستكشاف وطرح أي أسئلة حول الغرف والميزات أو التقسيم أثناء تجولك."
  },
  Hindi: {
    tapToStart: "स्वागत टूर शुरू करें",
    replay: "स्वागत संदेश फिर से चलाएं",
    mute: "म्यूट करें",
    unmute: "अनम्यूट करें",
    playing: "स्वागत ऑडियो चल रहा है...",
    stop: "रोकें",
    start: "प्रारंभ करें",
    welcomeSpeech: "इस सुंदर संपत्ति में आपका स्वागत है। घूमने और कमरों, सुविधाओं या रूप-रेखा के बारे में कोई भी प्रश्न पूछने के लिए स्वतंत्र महसूस करें।"
  },
  Bengali: {
    tapToStart: "স্বাগতম ট্যুর শুরু করুন",
    replay: "আবার শুনুন",
    mute: "মিউট করুন",
    unmute: "আনমিউট করুন",
    playing: "স্বাগতম অডিও বাজানো হচ্ছে...",
    stop: "থামুন",
    start: "শুরু",
    welcomeSpeech: "এই সুন্দর সম্পত্তিতে আপনাকে স্বাগতম। ঘুরে দেখতে এবং কোন প্রশ্ন থাকলে জিজ্ঞাসা করতে দ্বিধা করবেন না।"
  },
  Indonesian: {
    tapToStart: "Mulai Tur Selamat Datang",
    replay: "Putar Ulang Sambutan",
    mute: "Bisukan",
    unmute: "Bunyikan",
    playing: "Memutar Audio Sambutan...",
    stop: "Berhenti",
    start: "Mulai",
    welcomeSpeech: "Selamat datang di properti indah ini. Silakan menjelajah dan jangan ragu untuk menanyakan apa pun tentang ruangan, fitur, atau tata letak saat Anda berkeliling."
  },
  Polish: {
    tapToStart: "Rozpocznij zwiedzanie",
    replay: "Odtwórz ponownie",
    mute: "Wycisz",
    unmute: "Wyłącz wyciszenie",
    playing: "Odtwarzanie powitania...",
    stop: "Zatrzymaj",
    start: "Rozpocznij",
    welcomeSpeech: "Witamy w tej pięknej nieruchomości. Zapraszamy do zwiedzania i zadawania pytań dotyczących pokoi, funkcji lub układu."
  },
  Romanian: {
    tapToStart: "Începe turul de bun venit",
    replay: "Redă din nou",
    mute: "Fără sunet",
    unmute: "Activează sunetul",
    playing: "Se redă mesajul de bun venit...",
    stop: "Oprește",
    start: "Pornește",
    welcomeSpeech: "Bine ați venit la această proprietate frumoasă. Simțiți-vă liberi să explorați și să puneți întrebări despre camere, dotări sau compartimentare."
  },
  Swedish: {
    tapToStart: "Starta välkomstturen",
    replay: "Spela upp igen",
    mute: "Ljud av",
    unmute: "Ljud på",
    playing: "Spelar välkomstljud...",
    stop: "Stoppa",
    start: "Starta",
    welcomeSpeech: "Välkommen till denna vackra fastighet. Känn dig fri att utforska och ställa frågor om rummen, funktionerna eller planlösningen."
  },
  Tamil: {
    tapToStart: "வரவேற்பு சுற்றுப்பயணத்தைத் தொடங்கு",
    replay: "மீண்டும் இயக்கு",
    mute: "ஒலியை அடக்கு",
    unmute: "ஒலியை இயக்கு",
    playing: "வரவேற்பு ஆடியோ இயங்குகிறது...",
    stop: "நிறுத்து",
    start: "தொடங்கு",
    welcomeSpeech: "இந்த அழகான வீட்டிற்கு உங்களை வரவேற்கிறோம். தாராளமாக சுற்றிப் பார்த்து, அறைகள் அல்லது வசதிகள் பற்றி ஏதேனும் கேள்விகள் இருந்தால் கேளுங்கள்."
  },
  Thai: {
    tapToStart: "เริ่มทัวร์ต้อนรับ",
    replay: "เล่นเสียงต้อนรับอีกครั้ง",
    mute: "ปิดเสียง",
    unmute: "เปิดเสียง",
    playing: "กำลังเล่นเสียงต้อนรับ...",
    stop: "หยุด",
    start: "เริ่ม",
    welcomeSpeech: "ยินดีต้อนรับสู่บ้านที่สวยงามหลังนี้ ขอเชิญเดินชมรอบๆ และสอบถามข้อมูลเกี่ยวกับห้อง ฟีเจอร์ หรือแผนผังของบ้านได้ตลอดเวลา"
  },
  Turkish: {
    tapToStart: "Hoş Geldiniz Turunu Başlat",
    replay: "Tekrar Oynat",
    mute: "Sessiz",
    unmute: "Sesi Aç",
    playing: "Hoş geldiniz sesi çalınıyor...",
    stop: "Durdur",
    start: "Başlat",
    welcomeSpeech: "Bu güzel mülke hoş geldiniz. Lütfen dilediğiniz gibi gezin ve odalar, özellikler veya yerleşim hakkında sorularınızı sorun."
  },
  Urdu: {
    tapToStart: "خوش آمدید ٹور شروع کریں",
    replay: "دوبارہ چلائیں",
    mute: "میوٹ کریں",
    unmute: "ان میوٹ کریں",
    playing: "خوش آمدید آواز چل رہی ہے...",
    stop: "روکیں",
    start: "شروع کریں",
    welcomeSpeech: "اس خوبصورت جائیداد میں آپ کا خیر مقدم ہے۔ گھومنے اور کمروں, خصوصیات یا نقشہ کے بارے میں کوئی بھی سوال پوچھنے کے لیے بلا جھجھک بات کریں۔"
  }
};

export default function WelcomeAudio({
  language,
  onSpeakingChange,
  sources = { en: "/audio/welcome_en.mp3", fr: "/audio/welcome_fr.mp3" },
  listingId
}: WelcomeAudioProps) {
  const normalizedLang = Object.keys(WELCOME_LABELS).find(
    k => k.toLowerCase() === (language || "English").toLowerCase()
  ) || "English";

  const labels = WELCOME_LABELS[normalizedLang] || WELCOME_LABELS.English;
  const targetLangCode = LANGUAGES_MAP[normalizedLang] || "en";

  const [playbackOverride, setPlaybackOverride] = useState<"none" | "en" | "fr">("none");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [resolvedTextEn, setResolvedTextEn] = useState("");
  const [resolvedTextFr, setResolvedTextFr] = useState("");
  const [voiceName, setVoiceName] = useState<string>("Professional Female Synthetic");
  const [generatingAudio, setGeneratingAudio] = useState(false);

  const activeLangCode = playbackOverride === "en" 
    ? "en" 
    : playbackOverride === "fr" 
    ? "fr" 
    : targetLangCode;

  useEffect(() => {
    if (!listingId) return;
    const fetchListingAndResolved = async () => {
      try {
        // Fetch listing to get configured voice match
        const listingRef = doc(db, "listings", listingId);
        const listingSnap = await getDoc(listingRef);
        if (listingSnap.exists()) {
          const listingData = listingSnap.data();
          if (listingData.voiceName) {
            setVoiceName(listingData.voiceName);
          }
        }

        // Pre-fetch English welcome message
        const resEn = await fetch(`/api/welcome-messages/resolve/${listingId}?locale=en`);
        if (resEn.ok) {
          const dataEn = await resEn.json();
          if (dataEn.success && dataEn.text_value) {
            setResolvedTextEn(dataEn.text_value);
          }
        }

        // Pre-fetch French welcome message
        const resFr = await fetch(`/api/welcome-messages/resolve/${listingId}?locale=fr`);
        if (resFr.ok) {
          const dataFr = await resFr.json();
          if (dataFr.success && dataFr.text_value) {
            setResolvedTextFr(dataFr.text_value);
          }
        }
      } catch (err) {
        console.warn("Error fetching listing or resolved welcome messages:", err);
      }
    };
    fetchListingAndResolved();
  }, [listingId]);

  // Reset override whenever outer language prop changes
  useEffect(() => {
    setPlaybackOverride("none");
  }, [language]);

  const isPreRecorded = targetLangCode === "en" || targetLangCode === "fr" || playbackOverride !== "none";
  
  const audioSrc = (playbackOverride === "fr" || (playbackOverride === "none" && targetLangCode === "fr")) 
    ? sources.fr 
    : sources.en;

  const activeLabels = playbackOverride === "en" 
    ? WELCOME_LABELS.English 
    : playbackOverride === "fr" 
    ? WELCOME_LABELS.French 
    : labels;

  const resolveAudioUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    
    // Map custom listing audios to local static assets instantly
    if (url.includes("/listings/") && url.includes("/audio/")) {
      const idx = url.indexOf("listings/");
      if (idx !== -1) {
        return `/audio/${url.substring(idx)}`;
      }
    }

    // Robustly map storage defaults to local audio defaults to bypass network, CORS, and GCS issues
    if (url.includes("/defaults/welcome_")) {
      const filename = url.substring(url.lastIndexOf("/") + 1);
      return `/audio/defaults/${filename}`;
    }

    if (url.includes("/welcome_") && !url.includes("/listings/")) {
      const filename = url.substring(url.lastIndexOf("/") + 1);
      return `/audio/${filename}`;
    }

    if (url.startsWith("https://storage.googleapis.com/gen-lang-client-0289343453.firebasestorage.app/")) {
      return url.replace("https://storage.googleapis.com/gen-lang-client-0289343453.firebasestorage.app/", "/audio/");
    }

    return url;
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<any>(null);

  // Initialize custom uploaded base64 HTML Audio for EN and FR or overridden playback if available
  useEffect(() => {
    if (!isPreRecorded) return;
    
    const isSupportedAudio = audioSrc && (
      audioSrc.startsWith("data:audio/") || 
      audioSrc.startsWith("http") || 
      audioSrc.startsWith("/audio")
    );
    if (!isSupportedAudio) return;

    const resolvedUrl = resolveAudioUrl(audioSrc);
    const audio = new Audio(resolvedUrl);
    audio.preload = "auto";
    audio.muted = isMuted;
    audioRef.current = audio;

    const handlePlay = () => {
      setIsPlaying(true);
      if (onSpeakingChange) onSpeakingChange(true);
    };

    const handlePauseOrEnd = () => {
      setIsPlaying(false);
      if (onSpeakingChange) onSpeakingChange(false);
      if (audio.currentTime === audio.duration || audio.ended) {
        setHasPlayedOnce(true);
      }
    };

    const handleError = () => {
      console.warn(`Welcome audio failed to load: ${audioSrc}. Falling back to dynamic synthesis.`);
      audioRef.current = null;
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePauseOrEnd);
    audio.addEventListener("ended", handlePauseOrEnd);
    audio.addEventListener("error", handleError);

    return () => {
      audio.pause();
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePauseOrEnd);
      audio.removeEventListener("ended", handlePauseOrEnd);
      audio.removeEventListener("error", handleError);
      audioRef.current = null;
    };
  }, [audioSrc, isPreRecorded, isMuted, onSpeakingChange]);

  // Handle Mute changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
    if (utteranceRef.current && typeof window !== "undefined" && window.speechSynthesis) {
      if (isMuted) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        if (onSpeakingChange) onSpeakingChange(false);
      }
    }
  }, [isMuted, onSpeakingChange]);

  // Clean up Speech Synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const synthesizeAndPlay = async (textToSpeak: string, languageLabel: string) => {
    setGeneratingAudio(true);
    const toastId = toast.loading(`Connecting to Sora's voice server with matched character voice...`);
    try {
      const response = await fetch("/api/tts-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSpeak,
          lang: languageLabel,
          voiceName: voiceName
        })
      });

      if (!response.ok) {
        throw new Error("Failed to synthesize welcome audio");
      }

      const data = await response.json();
      if (data.success && data.base64Audio) {
        const audioUrl = `data:${data.mimeType || "audio/wav"};base64,${data.base64Audio}`;
        
        // Play the synthesized high-fidelity audio
        const audio = new Audio(audioUrl);
        audio.muted = isMuted;
        audioRef.current = audio;

        audio.addEventListener("play", () => {
          setIsPlaying(true);
          if (onSpeakingChange) onSpeakingChange(true);
        });

        audio.addEventListener("pause", () => {
          setIsPlaying(false);
          if (onSpeakingChange) onSpeakingChange(false);
        });

        audio.addEventListener("ended", () => {
          setIsPlaying(false);
          setHasPlayedOnce(true);
          if (onSpeakingChange) onSpeakingChange(false);
        });

        audio.addEventListener("error", () => {
          console.warn("Synthesized audio playback error, falling back to speech synthesis.");
          playSpeechSynthesisFallback(textToSpeak);
        });

        await audio.play();
        toast.success(`Playing welcome tour with Sora's matched voice character: ${voiceName}!`, { id: toastId });
      } else {
        throw new Error("No audio payload");
      }
    } catch (err) {
      console.warn("Synthesis failed, falling back to native browser TTS:", err);
      toast.dismiss(toastId);
      playSpeechSynthesisFallback(textToSpeak);
    } finally {
      setGeneratingAudio(false);
    }
  };

  const handleStartPlay = async () => {
    const isFr = playbackOverride === "fr" || (playbackOverride === "none" && targetLangCode === "fr");
    const textToSpeak = isFr 
      ? (resolvedTextFr || WELCOME_LABELS.French.welcomeSpeech)
      : (resolvedTextEn || WELCOME_LABELS.English.welcomeSpeech);

    const currentLang = playbackOverride === "en" ? "English" : playbackOverride === "fr" ? "French" : normalizedLang;

    // Check if there is a custom uploaded base64 welcome audio
    const currentAudioSrc = isFr ? sources.fr : sources.en;

    const hasCustomUploadedAudio = currentAudioSrc && (
      currentAudioSrc.startsWith("data:audio/") || 
      currentAudioSrc.startsWith("http") || 
      currentAudioSrc.startsWith("/audio")
    );

    if (hasCustomUploadedAudio && audioRef.current) {
      try {
        await audioRef.current.play();
      } catch (err) {
        console.warn("Audio playback interrupted, falling back to synthesis:", err);
        await synthesizeAndPlay(textToSpeak, currentLang);
      }
    } else {
      await synthesizeAndPlay(textToSpeak, currentLang);
    }
  };

  const playSpeechSynthesisFallback = (textToSpeak: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Text-to-speech not supported on this browser.");
      return;
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = targetLangCode;
    utterance.volume = isMuted ? 0 : 1;

    utterance.onstart = () => {
      setIsPlaying(true);
      if (onSpeakingChange) onSpeakingChange(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setHasPlayedOnce(true);
      if (onSpeakingChange) onSpeakingChange(false);
    };

    utterance.onerror = (e) => {
      console.error("Speech synthesis error", e);
      setIsPlaying(false);
      if (onSpeakingChange) onSpeakingChange(false);
    };

    // Find and set best matching native voice for language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetLangCode.toLowerCase()));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleStopPlay = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    utteranceRef.current = null;
    setIsPlaying(false);
    if (onSpeakingChange) onSpeakingChange(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const activeLangCodeDisp = playbackOverride !== "none" ? playbackOverride.toUpperCase() : targetLangCode.toUpperCase();

  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 backdrop-blur-sm shadow-md mt-4 animate-opacity">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
        <span className="text-xs text-slate-300 font-medium">
          {isPlaying ? activeLabels.playing : activeLabels.tapToStart} ({activeLangCodeDisp})
        </span>
      </div>

      <div className="flex items-center gap-2">
        {!isPlaying ? (
          <button
            type="button"
            onClick={handleStartPlay}
            className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs py-2 px-4 rounded-full shadow-lg transition-all border border-blue-400/20"
          >
            {hasPlayedOnce ? <RotateCcw className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {hasPlayedOnce ? activeLabels.replay : activeLabels.start}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStopPlay}
            className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs py-2 px-4 rounded-full shadow-lg transition-all border border-red-400/20"
          >
            <Square className="h-2.5 w-2.5 fill-white text-white mr-0.5 animate-pulse" />
            {activeLabels.stop}
          </button>
        )}

        <button
          type="button"
          onClick={toggleMute}
          title={isMuted ? activeLabels.unmute : activeLabels.mute}
          className={`flex items-center justify-center p-2 rounded-full border transition-all ${
            isMuted 
              ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200" 
              : "bg-slate-800/80 border-slate-700/80 text-blue-400 hover:text-blue-300"
          }`}
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* High-Fidelity Audio Presentations Links */}
      <div className="w-full pt-2.5 mt-1 border-t border-slate-800/40 flex flex-col items-center gap-2">
        <span className="text-[10px] text-white font-bold uppercase tracking-wider">
          High-Fidelity Welcome Audio:
        </span>
        <div className="flex gap-2 w-full justify-center">
          <button
            type="button"
            onClick={async () => {
              handleStopPlay();
              if (playbackOverride === "en") {
                setPlaybackOverride("none");
              } else {
                setPlaybackOverride("en");
              }
            }}
            className={`flex-1 max-w-[140px] text-center text-[10px] py-1.5 px-2 rounded-lg font-bold border transition-all ${
              playbackOverride === "en"
                ? "bg-blue-600 border-blue-500 text-white shadow-md"
                : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            🇨🇦 English Welcome
          </button>
          
          {sources.fr && (
            <button
              type="button"
              onClick={async () => {
                handleStopPlay();
                if (playbackOverride === "fr") {
                  setPlaybackOverride("none");
                } else {
                  setPlaybackOverride("fr");
                }
              }}
              className={`flex-1 max-w-[140px] text-center text-[10px] py-1.5 px-2 rounded-lg font-bold border transition-all ${
                playbackOverride === "fr"
                  ? "bg-blue-600 border-blue-500 text-white shadow-md"
                  : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              🇫🇷 Bienvenue en Français
            </button>
          )}

          {playbackOverride !== "none" && (
            <button
              type="button"
              onClick={() => {
                handleStopPlay();
                setPlaybackOverride("none");
              }}
              title="Reset to native language"
              className="px-2 py-1.5 text-[10px] font-black uppercase text-red-400 bg-red-950/20 hover:bg-red-950/30 border border-red-900/30 rounded-lg transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
