import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play, RotateCcw, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";

interface WelcomeAudioProps {
  language: string;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  sources?: {
    en: string;
    fr: string;
  };
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
  "Hindi": "hi"
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
    welcomeSpeech: "Bienvenue dans cette magnifique propriété. N'hésitez pas à l'explorer et à me poser des questions sur les pièces, les caractéristiques ou l'agencement au fil de votre visite."
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
  }
};

export default function WelcomeAudio({
  language,
  onSpeakingChange,
  sources = { en: "/audio/welcome_en.mp3", fr: "/audio/welcome_fr.mp3" }
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<any>(null);

  // Initialize pre-recorded HTML Audio for EN and FR or overridden playback
  useEffect(() => {
    if (!isPreRecorded) return;

    const audio = new Audio(audioSrc);
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
      console.warn(`Welcome audio failed to load: ${audioSrc}. Falling back to clean speech synthesis.`);
      // If MP3 fails, seamlessly turn to SpeechSynthesis
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
      // Chrome/Safari doesn't allow changing volume mid-track on SpeechSynthesis easily,
      // but we can pause and resume or cancel/replay with new volume if muted.
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

  const handleStartPlay = async () => {
    // If there is an override or native is EN/FR
    if (isPreRecorded && audioRef.current) {
      try {
        await audioRef.current.play();
      } catch (err) {
        console.warn("Audio playback interrupted, falling back to speech synthesis:", err);
        playSpeechSynthesis();
      }
    } else {
      setPlaybackOverride("none");
      playSpeechSynthesis();
    }
  };

  const playSpeechSynthesis = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Text-to-speech not supported on this browser.");
      return;
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(activeLabels.welcomeSpeech);
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
    if (isPreRecorded && audioRef.current) {
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
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          High-Fidelity Welcome Audio:
        </span>
        <div className="flex gap-2 w-full justify-center">
          <button
            type="button"
            onClick={async () => {
              if (playbackOverride === "en" && isPlaying) {
                handleStopPlay();
                setPlaybackOverride("none");
              } else {
                handleStopPlay();
                setPlaybackOverride("en");
                setTimeout(async () => {
                  if (audioRef.current) {
                    try {
                      await audioRef.current.play();
                    } catch (e) {
                      console.error("Override play failed:", e);
                    }
                  }
                }, 60);
              }
            }}
            className={`flex-1 max-w-[140px] text-center text-[10px] py-1.5 px-2 rounded-lg font-bold border transition-all ${
              playbackOverride === "en" && isPlaying
                ? "bg-blue-600 border-blue-500 text-white shadow-md animate-pulse"
                : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            🇬🇧 English Welcome
          </button>
          
          <button
            type="button"
            onClick={async () => {
              if (playbackOverride === "fr" && isPlaying) {
                handleStopPlay();
                setPlaybackOverride("none");
              } else {
                handleStopPlay();
                setPlaybackOverride("fr");
                setTimeout(async () => {
                  if (audioRef.current) {
                    try {
                      await audioRef.current.play();
                    } catch (e) {
                      console.error("Override play failed:", e);
                    }
                  }
                }, 60);
              }
            }}
            className={`flex-1 max-w-[140px] text-center text-[10px] py-1.5 px-2 rounded-lg font-bold border transition-all ${
              playbackOverride === "fr" && isPlaying
                ? "bg-blue-600 border-blue-500 text-white shadow-md animate-pulse"
                : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            🇫🇷 French Welcome
          </button>

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
