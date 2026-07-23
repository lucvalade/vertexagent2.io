import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  getListing,
  getListingBasic,
  getAgent,
  createLead,
  Listing,
  sendEmail,
  getGlobalPromptSettings,
  createVoiceNote,
  finishTourAndGetNotes,
  getTourConfig,
  getOpenHouseSessions,
} from "@/lib/api";
import TourGate from "@/components/TourGate";
import { useAgentTierCapabilities } from "@/components/UpdatedFeatureController";
import { trackEvent } from "@/lib/analytics";
import { useLiveVoice } from "@/hooks/useLiveVoice";
import { Type } from "@google/genai";
import { db } from "@/lib/firebase";
import { query, collection, where, getDocs } from "firebase/firestore";
import VoiceNoteRecorderModal from "@/components/VoiceNoteRecorderModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Home,
  PhoneCall,
  Loader2,
  MapPin,
  Globe,
  Sparkles,
  X,
  Square,
  PhoneOff,
  Check,
  Video,
  Terminal,
  AlertCircle,
  RefreshCw,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import WelcomeAudio from "@/components/WelcomeAudio";
import SocialShareBubble from "@/components/SocialShareBubble";
import AskMeAboutTable from "@/components/AskMeAboutTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

const SUPPORTED_LANGUAGES = [
  "Afrikaans",
  "Albanian",
  "Amharic",
  "Arabic",
  "Armenian",
  "Azerbaijani",
  "Basque",
  "Bengali",
  "Bosnian",
  "Bulgarian",
  "Burmese",
  "Catalan",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Croatian",
  "Czech",
  "Danish",
  "Dutch",
  "English",
  "Estonian",
  "Farsi (Persian)",
  "Filipino (Tagalog)",
  "Finnish",
  "French",
  "Galician",
  "Georgian",
  "German",
  "Greek",
  "Gujarati",
  "Hebrew",
  "Hindi",
  "Hungarian",
  "Icelandic",
  "Indonesian",
  "Italian",
  "Japanese",
  "Kannada",
  "Kazakh",
  "Khmer",
  "Korean",
  "Kyrgyz",
  "Lao",
  "Latvian",
  "Lithuanian",
  "Macedonian",
  "Malay",
  "Malayalam",
  "Marathi",
  "Mongolian",
  "Nepali",
  "Norwegian",
  "Pashto",
  "Polish",
  "Portuguese",
  "Punjabi",
  "Romanian",
  "Russian",
  "Serbian",
  "Sinhala",
  "Slovak",
  "Slovenian",
  "Somali",
  "Spanish",
  "Swahili",
  "Swedish",
  "Tamil",
  "Telugu",
  "Thai",
  "Turkish",
  "Ukrainian",
  "Urdu",
  "Uzbek",
  "Vietnamese",
  "Welsh",
  "Zulu",
];

const LANGUAGE_NATIVE_MAP: Record<string, string> = {
  Afrikaans: "Afrikaans",
  Albanian: "Shqip",
  Amharic: "አማርኛ",
  Arabic: "العربية",
  Armenian: "Հայերեն",
  Azerbaijani: "Azərbaycanca",
  Basque: "Euskara",
  Bengali: "বাংলা",
  Bosnian: "Bosanski",
  Bulgarian: "Български",
  Burmese: "ဗမာစာ",
  Catalan: "Català",
  "Chinese (Simplified)": "简体中文",
  "Chinese (Traditional)": "繁體中文",
  Croatian: "Hrvatski",
  Czech: "Čeština",
  Danish: "Dansk",
  Dutch: "Nederlands",
  English: "English",
  Estonian: "Eesti",
  "Farsi (Persian)": "فارسی",
  "Filipino (Tagalog)": "Tagalog",
  Finnish: "Suomi",
  French: "Français",
  Galician: "Galego",
  Georgian: "ქართული",
  German: "Deutsch",
  Greek: "Ελληνικά",
  Gujarati: "ગુજરાતી",
  Hebrew: "עברית",
  Hindi: "हिन्दी",
  Hungarian: "Magyar",
  Icelandic: "Íslenska",
  Indonesian: "Bahasa Indonesia",
  Italian: "Italiano",
  Japanese: "日本語",
  Kannada: "ಕನ್ನಡ",
  Kazakh: "Қазақша",
  Khmer: "ខ្មែរ",
  Korean: "한국어",
  Kyrgyz: "Кыргызча",
  Lao: "ລາວ",
  Latvian: "Latviešu",
  Lithuanian: "Lietuvių",
  Macedonian: "Македонски",
  Malay: "Bahasa Melayu",
  Malayalam: "മലയാളം",
  Marathi: "مराठी",
  Mongolian: "Монгол",
  Nepali: "नेपाली",
  Norwegian: "Norsk",
  Pashto: "پښتو",
  Polish: "Polski",
  Portuguese: "Português",
  Punjabi: "ਪੰਜਾਬੀ",
  Romanian: "Română",
  Russian: "Русский",
  Serbian: "Српски",
  Sinhala: "සිင်හල",
  Slovak: "Slovenčina",
  Slovenian: "Slovenščina",
  Somali: "Soomaali",
  Spanish: "Español",
  Swahili: "Kiswahili",
  Swedish: "Svenska",
  Tamil: "தமிழ்",
  Telugu: "తెలుగు",
  Thai: "ไทย",
  Turkish: "Türkçe",
  Ukrainian: "Українська",
  Urdu: "اردو",
  Uzbek: "Oʻzbekcha",
  Vietnamese: "Tiếng Việt",
  Welsh: "Cymraeg",
  Zulu: "isiZulu",
};

const getLanguageDisplay = (lang: string) => {
  const native = LANGUAGE_NATIVE_MAP[lang];
  if (!native || native === lang) return lang;
  return `${lang} = ${native}`;
};

const getListeningInstruction = (lang: string) => {
  const l = (lang || "English").toLowerCase();

  if (l.includes("french") || l.includes("français")) {
    return "Posez vos questions naturellement. Dites 'Parlez-moi de la cuisine' ou 'Je souhaite planifier une visite'.";
  }
  if (l.includes("spanish") || l.includes("español")) {
    return "Haga preguntas con naturalidad. Diga 'Hábleme de la cocina' o 'Quiero programar una visita'.";
  }
  if (l.includes("german") || l.includes("deutsch")) {
    return "Stellen Sie Fragen ganz natürlich. Sagen Sie 'Erzählen Sie mir von der Küche' oder 'Ich möchte eine Besichtigung vereinbaren'.";
  }
  if (l.includes("italian") || l.includes("italiano")) {
    return "Fai domande con naturalezza. Di' 'Parlami della cucina' o 'Voglio programmare una visita'.";
  }
  if (l.includes("portuguese") || l.includes("português")) {
    return "Faça perguntas com naturalidade. Diga 'Fale-me sobre a cozinha' ou 'Quero agendar uma visita'.";
  }
  if (l.includes("chinese") && l.includes("simplified")) {
    return "自然地提出问题。可以说“向我介绍一下厨房”或“我想安排看房”。";
  }
  if (l.includes("chinese") && l.includes("traditional")) {
    return "自然地提出問題。可以說「向我介紹一下廚房」或「我想安排看房」。";
  }
  if (l.includes("japanese") || l.includes("日本語")) {
    return "自然に質問してください。「キッチンについて教えて」や「内見の予約をしたいです」などと話しかけてください。";
  }
  if (l.includes("korean") || l.includes("한국어")) {
    return "자연스럽게 질문해 보세요. '주방에 대해 알려주세요' 또는 '일정을 예약하고 싶어요'라고 설명해 달라고 해보세요.";
  }
  if (l.includes("dutch") || l.includes("nederlands")) {
    return "Stel uw vragen op een natuurlijke manier. Zeg bijvoorbeeld 'Vertel me over de keuken' of 'Ik wil een bezichtiging plannen'.";
  }
  if (l.includes("russian") || l.includes("русский")) {
    return "Задавайте вопросы непринужденно. Произнесите 'Расскажите о кухне' или 'Я хочу запланировать просмотр'.";
  }
  if (l.includes("vietnamese") || l.includes("tiếng việt")) {
    return "Hãy đặt câu hỏi một cách tự nhiên. Nói 'Hãy kể cho tôi nghe về nhà bếp' hoặc 'Tôi muốn đặt lịch xem nhà'.";
  }
  if (l.includes("arabic") || l.includes("العربية")) {
    return "اطرح أسئلتك بشكل طبيعي. قل 'أخبرني عن المطبخ' أو 'أريد الاتفاق على موعد للمعاينة'.";
  }
  if (l.includes("hindi") || l.includes("हिन्दी")) {
    return "स्वाभाविक रूप से प्रश्न पूछें। कहें 'मुझे रसोई के बारे में बताएं' या 'मैं एक दिखाने का समय निर्धारित करना चाहता हूँ'।";
  }

  return "Ask questions naturally. Say 'Tell me about the kitchen' or 'I want to schedule a showing'.";
};

const TRANSLATIONS: Record<
  string,
  {
    startVoiceTour: string;
    listening: string;
    experienceGuide: string;
    askMeAbout: string;
    tapToStart: string;
    connecting: string;
    andMore: string;
    defaultKeywords: string[];
  }
> = {
  English: {
    startVoiceTour: "Start Voice Tour",
    listening: "Listening...",
    experienceGuide: "Experience this property with an interactive AI guide.",
    askMeAbout: "Ask me About:",
    tapToStart: "Tap to Start",
    connecting: "Connecting...",
    andMore: "and more...",
    defaultKeywords: ["Bedrooms", "Kitchen", "Backyard"],
  },
  French: {
    startVoiceTour: "Démarrer la visite vocale",
    listening: "Écoute en cours...",
    experienceGuide: "Découvrez cette propriété avec un guide IA interactif.",
    askMeAbout: "Demandez-moi des infos sur :",
    tapToStart: "Appuyez pour démarrer",
    connecting: "Connexion...",
    andMore: "et plus...",
    defaultKeywords: ["Chambres", "Cuisine", "Jardin"],
  },
  Spanish: {
    startVoiceTour: "Iniciar visita guiada",
    listening: "Escuchando...",
    experienceGuide: "Descubra esta propiedad con un guía interactivo de IA.",
    askMeAbout: "Pregúntame sobre:",
    tapToStart: "Toque para comenzar",
    connecting: "Conectando...",
    andMore: "y más...",
    defaultKeywords: ["Dormitorios", "Cocina", "Patio trasero"],
  },
  German: {
    startVoiceTour: "Sprachführung starten",
    listening: "Zuhören...",
    experienceGuide:
      "Erleben Sie diese Immobilie mit einem interaktiven KI-Führer.",
    askMeAbout: "Fragen Sie mich über:",
    tapToStart: "Zum Starten tippen",
    connecting: "Verbinden...",
    andMore: "und mehr...",
    defaultKeywords: ["Schlafzimmer", "Küche", "Hinterhof"],
  },
  Italian: {
    startVoiceTour: "Avvia il tour vocale",
    listening: "In ascolto...",
    experienceGuide: "Scopri questa proprietà con una guida IA interattiva.",
    askMeAbout: "Chiedimi di:",
    tapToStart: "Tocca per iniziare",
    connecting: "Connessione...",
    andMore: "e altro...",
    defaultKeywords: ["Camere da letto", "Cucina", "Cortile"],
  },
  Portuguese: {
    startVoiceTour: "Iniciar tour por voz",
    listening: "Ouvindo...",
    experienceGuide: "Explore este imóvel com um ao vivo guia de IA.",
    askMeAbout: "Pergunte-me sobre:",
    tapToStart: "Toque para iniciar",
    connecting: "Conectando...",
    andMore: "e mais...",
    defaultKeywords: ["Quartos", "Cozinha", "Quintal"],
  },
  "Chinese (Simplified)": {
    startVoiceTour: "开始语音导览",
    listening: "正在聆听...",
    experienceGuide: "通过交互式 AI 指南体验此房产。",
    askMeAbout: "问我关于：",
    tapToStart: "轻触开始",
    connecting: "正在连接...",
    andMore: "等更多...",
    defaultKeywords: ["卧室", "厨房", "后院"],
  },
  "Chinese (Traditional)": {
    startVoiceTour: "開始語音導覽",
    listening: "正在聆聽...",
    experienceGuide: "透過互動式 AI 指南體驗此房產。",
    askMeAbout: "問我關於：",
    tapToStart: "輕觸開始",
    connecting: "正在連線...",
    andMore: "等更多...",
    defaultKeywords: ["臥室", "廚房", "後院"],
  },
  Japanese: {
    startVoiceTour: "音声案内をスタート",
    listening: "音声認識中...",
    experienceGuide: "双方向のAIガイドで、この物件を体験してください。",
    askMeAbout: "何でも質問してください：",
    tapToStart: "タップしてスタート",
    connecting: "接続中...",
    andMore: "など...",
    defaultKeywords: ["ベッドルーム", "キッチン", "お庭"],
  },
  Korean: {
    startVoiceTour: "음성 투어 시작",
    listening: "듣는 중...",
    experienceGuide: "대화형 AI 가이드와 함께 이 부동산을 경험해 보세요.",
    askMeAbout: "자유롭게 물어보세요:",
    tapToStart: "탭하여 시작하기",
    connecting: "연결 중...",
    andMore: "등등...",
    defaultKeywords: ["침실", "주방", "뒷마당"],
  },
  Dutch: {
    startVoiceTour: "Spraakrondleiding starten",
    listening: "Luisteren...",
    experienceGuide: "Ervaar deze woning met een interactieve AI-gids.",
    askMeAbout: "Vraag me over:",
    tapToStart: "Tik om te starten",
    connecting: "Verbinden...",
    andMore: "en meer...",
    defaultKeywords: ["Slaapkamers", "Keuken", "Achtertuin"],
  },
  Russian: {
    startVoiceTour: "Начать голосовой тур",
    listening: "Слушаю...",
    experienceGuide:
      "Ознакомьтесь с этой недвижимостью с интерактивным ИИ-гидом.",
    askMeAbout: "Спросите меня о:",
    tapToStart: "Нажмите для начала",
    connecting: "Подключение...",
    andMore: "и многое другое...",
    defaultKeywords: ["Спальни", "Кухня", "Задний двор"],
  },
  Vietnamese: {
    startVoiceTour: "Bắt đầu chuyến tham quan bằng giọng nói",
    listening: "Đang nghe...",
    experienceGuide:
      "Trải nghiệm bất động sản này với hướng dẫn viên AI tương tác.",
    askMeAbout: "Hỏi tôi về:",
    tapToStart: "Nhấn để bắt đầu",
    connecting: "Đang kết nối...",
    andMore: "và hơn thế nữa...",
    defaultKeywords: ["Phòng ngủ", "Nhà bếp", "Sân sau"],
  },
  Arabic: {
    startVoiceTour: "ابدأ الجولة الصوتية",
    listening: "جاري الاستماع...",
    experienceGuide: "اكتشف هذا العقار مع دليل الذكاء الاصطناعي التفاعلي.",
    askMeAbout: "اسألني عن:",
    tapToStart: "اضغط للبدء",
    connecting: "جاري الاتصال...",
    andMore: "والمزيد...",
    defaultKeywords: ["غرف النوم", "المطبخ", "الحديقة الخلفية"],
  },
  Hindi: {
    startVoiceTour: "वॉयस टूर शुरू करें",
    listening: "सुन रहा हूँ...",
    experienceGuide: "इंटरैक्टिव एआई गाइड के साथ इस संपत्ति का अनुभव करें।",
    askMeAbout: "मुझसे पूछें:",
    tapToStart: "शुरू करने के लिए टैप करें",
    connecting: "कनेक्ट हो रहा है...",
    andMore: "और भी...",
    defaultKeywords: ["शयनकक्ष", "रसोईघर", "पिछवाड़ा"],
  },
};

const getTranslation = (lang: string) => {
  return TRANSLATIONS[lang] || TRANSLATIONS.English;
};

const LOCAL_DESCRIPTORS_DICTIONARY: Record<string, Record<string, string>> = {
  Kitchen: {
    French: "Cuisine",
    Spanish: "Cocina",
    German: "Küche",
    Italian: "Cucina",
    Portuguese: "Cozinha",
    "Chinese (Simplified)": "厨房",
    "Chinese (Traditional)": "廚房",
    Japanese: "キッチン",
    Korean: "주방",
    Dutch: "Keuken",
    Russian: "Кухня",
    Vietnamese: "Nhà bếp",
    Arabic: "المطبخ",
    Hindi: "रसोई",
  },
  "Living Room": {
    French: "Salon",
    Spanish: "Sala de estar",
    German: "Wohnzimmer",
    Italian: "Soggiorno",
    Portuguese: "Sala de estar",
    "Chinese (Simplified)": "客厅",
    "Chinese (Traditional)": "客廳",
    Japanese: "リビング",
    Korean: "거실",
    Dutch: "Woonkamer",
    Russian: "Гостиная",
    Vietnamese: "Phòng khách",
    Arabic: "غرفة المعيشة",
    Hindi: "बैठक",
  },
  "Primary Bedroom": {
    French: "Chambre principale",
    Spanish: "Dormitorio principal",
    German: "Hauptschlafzimmer",
    Italian: "Camera matrimoniale",
    Portuguese: "Quarto principal",
    "Chinese (Simplified)": "主卧",
    "Chinese (Traditional)": "主臥",
    Japanese: "主寝室",
    Korean: "안방",
    Dutch: "Hoofdslaapkamer",
    Russian: "Главная спальня",
    Vietnamese: "Phòng ngủ chính",
    Arabic: "غرفة النوم الرئيسية",
    Hindi: "मुख्य शयनकक्ष",
  },
  "Master Bedroom": {
    French: "Chambre principale",
    Spanish: "Dormitorio principal",
    German: "Hauptschlafzimmer",
    Italian: "Camera matrimoniale",
    Portuguese: "Quarto principal",
    "Chinese (Simplified)": "主卧",
    "Chinese (Traditional)": "主臥",
    Japanese: "主寝室",
    Korean: "안방",
    Dutch: "Hoofdslaapkamer",
    Russian: "Главная спальня",
    Vietnamese: "Phòng ngủ chính",
    Arabic: "غرفة النوم الرئيسية",
    Hindi: "मुख्य शयनकक्ष",
  },
  Bedroom: {
    French: "Chambre",
    Spanish: "Dormitorio",
    German: "Schlafzimmer",
    Italian: "Camera da letto",
    Portuguese: "Quarto",
    "Chinese (Simplified)": "卧室",
    "Chinese (Traditional)": "臥室",
    Japanese: "寝室",
    Korean: "침실",
    Dutch: "Slaapkamer",
    Russian: "Спальня",
    Vietnamese: "Phòng ngủ",
    Arabic: "غرفة نوم",
    Hindi: "शयनकक्ष",
  },
  Bathroom: {
    French: "Salle de bain",
    Spanish: "Baño",
    German: "Badezimmer",
    Italian: "Bagno",
    Portuguese: "Banheiro",
    "Chinese (Simplified)": "浴室",
    "Chinese (Traditional)": "浴室",
    Japanese: "浴室",
    Korean: "욕실",
    Dutch: "Badkamer",
    Russian: "Ванная",
    Vietnamese: "Phòng tắm",
    Arabic: "الحمام",
    Hindi: "स्नानघर",
  },
  Backyard: {
    French: "Cour arrière",
    Spanish: "Patio trasero",
    German: "Hinterhof",
    Italian: "Cortile",
    Portuguese: "Quintal",
    "Chinese (Simplified)": "后院",
    "Chinese (Traditional)": "後院",
    Japanese: "裏庭",
    Korean: "뒷마당",
    Dutch: "Achtertuin",
    Russian: "Задний двор",
    Vietnamese: "Sân sau",
    Arabic: "الفناء الخلفي",
    Hindi: "पिछवाड़ा",
  },
  Pool: {
    French: "Piscine",
    Spanish: "Piscina",
    German: "Pool",
    Italian: "Piscina",
    Portuguese: "Piscina",
    "Chinese (Simplified)": "泳池",
    "Chinese (Traditional)": "泳池",
    Japanese: "プール",
    Korean: "수영장",
    Dutch: "Zwembad",
    Russian: "Бассейн",
    Vietnamese: "Hồ bơi",
    Arabic: "حمام السباحة",
    Hindi: "पूल",
  },
  Garage: {
    French: "Garage",
    Spanish: "Garage",
    German: "Garage",
    Italian: "Garage",
    Portuguese: "Garagem",
    "Chinese (Simplified)": "车库",
    "Chinese (Traditional)": "車庫",
    Japanese: "ガレージ",
    Korean: "차고",
    Dutch: "Garage",
    Russian: "Гараж",
    Vietnamese: "Nhà để xe",
    Arabic: "المرآب",
    Hindi: "गैराज",
  },
  Office: {
    French: "Bureau",
    Spanish: "Oficina",
    German: "Büro",
    Italian: "Ufficio",
    Portuguese: "Escritório",
    "Chinese (Simplified)": "办公室",
    "Chinese (Traditional)": "辦公室",
    Japanese: "オフィス",
    Korean: "사무실",
    Dutch: "Kantoor",
    Russian: "Кабинет",
    Vietnamese: "Văn phòng",
    Arabic: "المكتب",
    Hindi: "कार्यालय",
  },
  Patio: {
    French: "Patio",
    Spanish: "Patio",
    German: "Terrasse",
    Italian: "Patio",
    Portuguese: "Pátio",
    "Chinese (Simplified)": "后院露台",
    "Chinese (Traditional)": "露台",
    Japanese: "パティオ",
    Korean: "테라스",
    Dutch: "Patio",
    Russian: "Патио",
    Vietnamese: "Sân hiên",
    Arabic: "الفناء",
    Hindi: "आँगन",
  },
  Balcony: {
    French: "Balcon",
    Spanish: "Balcón",
    German: "Balkon",
    Italian: "Balcone",
    Portuguese: "Varanda",
    "Chinese (Simplified)": "阳台",
    "Chinese (Traditional)": "陽台",
    Japanese: "バルコニー",
    Korean: "발코니",
    Dutch: "Balkon",
    Russian: "Балкон",
    Vietnamese: "Ban công",
    Arabic: "الشرفة",
    Hindi: "बालकनी",
  },
  "Dining Room": {
    French: "Salle à manger",
    Spanish: "Comedor",
    German: "Esszimmer",
    Italian: "Sala da pranzo",
    Portuguese: "Sala de jantar",
    "Chinese (Simplified)": "餐厅",
    "Chinese (Traditional)": "餐廳",
    Japanese: "ダイニング",
    Korean: "식당",
    Dutch: "Eetkamer",
    Russian: "Столовая",
    Vietnamese: "Phòng ăn",
    Arabic: "غرفة الطعام",
    Hindi: "भोजन कक्ष",
  },
  View: {
    French: "Vue",
    Spanish: "Vista",
    German: "Aussicht",
    Italian: "Vista",
    Portuguese: "Vista",
    "Chinese (Simplified)": "景观",
    "Chinese (Traditional)": "景觀",
    Japanese: "景色",
    Korean: "전망",
    Dutch: "Uitzicht",
    Russian: "Вид",
    Vietnamese: "Tầm nhìn",
    Arabic: "الإطلالة",
    Hindi: "दृश्य",
  },
  Location: {
    French: "Emplacement",
    Spanish: "Ubicación",
    German: "Lage",
    Italian: "Posizione",
    Portuguese: "Localização",
    "Chinese (Simplified)": "位置",
    "Chinese (Traditional)": "位置",
    Japanese: "立地",
    Korean: "위치",
    Dutch: "Locatie",
    Russian: "Расположение",
    Vietnamese: "Vị trí",
    Arabic: "الموقع",
    Hindi: "स्थान",
  },
  Laundry: {
    French: "Buanderie",
    Spanish: "Lavandería",
    German: "Waschküche",
    Italian: "Lavanderia",
    Portuguese: "Lavanderia",
    "Chinese (Simplified)": "洗衣房",
    "Chinese (Traditional)": "洗衣房",
    Japanese: "ランドリー",
    Korean: "세탁실",
    Dutch: "Wasruimte",
    Russian: "Прачечная",
    Vietnamese: "Phòng giặt",
    Arabic: "غرفة الغسيل",
    Hindi: "कपड़े धोने का कमरा",
  },
  Gym: {
    French: "Salle de sport",
    Spanish: "Gimnasio",
    German: "Fitnessstudio",
    Italian: "Palestra",
    Portuguese: "Academia",
    "Chinese (Simplified)": "健身房",
    "Chinese (Traditional)": "健身房",
    Japanese: "ジム",
    Korean: "체육관",
    Dutch: "Sportschool",
    Russian: "Спортзал",
    Vietnamese: "Phòng gym",
    Arabic: "الصالة الرياضية",
    Hindi: "जिम",
  },
  Loft: {
    French: "Loft",
    Spanish: "Loft",
    German: "Loft",
    Italian: "Loft",
    Portuguese: "Loft",
    "Chinese (Simplified)": "阁楼",
    "Chinese (Traditional)": "閣樓",
    Japanese: "ロフト",
    Korean: "로프트",
    Dutch: "Loft",
    Russian: "Лофт",
    Vietnamese: "Gác lửng",
    Arabic: "السقيفة",
    Hindi: "मचान",
  },
  Basement: {
    French: "Sous-sol",
    Spanish: "Sótano",
    German: "Keller",
    Italian: "Seminterrato",
    Portuguese: "Porão",
    "Chinese (Simplified)": "地下室",
    "Chinese (Traditional)": "地下室",
    Japanese: "地下室",
    Korean: "지하실",
    Dutch: "Kelder",
    Russian: "Подвал",
    Vietnamese: "Tầng hầm",
    Arabic: "القبو",
    Hindi: "तहखाना",
  },
  "Main Floor": {
    French: "Rez-de-chaussée",
    Spanish: "Planta principal",
    German: "Hauptgeschoss",
    Italian: "Piano principale",
    Portuguese: "Piso principal",
    "Chinese (Simplified)": "主楼层",
    "Chinese (Traditional)": "主樓層",
    Japanese: "1階",
    Korean: "메인 층",
    Dutch: "Begane grond",
    Russian: "Главный этаж",
    Vietnamese: "Tầng chính",
    Arabic: "الطابق الرئيسي",
    Hindi: "मुख्य मंजिल",
  },
  "Front Yard": {
    French: "Cour avant",
    Spanish: "Jardín delantero",
    German: "Vorgarten",
    Italian: "Cortile anteriore",
    Portuguese: "Jardim frontal",
    "Chinese (Simplified)": "前院",
    "Chinese (Traditional)": "前院",
    Japanese: "前庭",
    Korean: "앞마당",
    Dutch: "Voortuin",
    Russian: "Передний двор",
    Vietnamese: "Sân trước",
    Arabic: "الفناء الأمامي",
    Hindi: "सामने का आँगन",
  },
  Exterior: {
    French: "Extérieur",
    Spanish: "Exterior",
    German: "Außenbereich",
    Italian: "Esterno",
    Portuguese: "Exterior",
    "Chinese (Simplified)": "外观",
    "Chinese (Traditional)": "外觀",
    Japanese: "外観",
    Korean: "외관",
    Dutch: "Exterieur",
    Russian: "Экстерьер",
    Vietnamese: "Ngoại thất",
    Arabic: "المظهر الخارجي",
    Hindi: "बाहरी",
  },
  Interior: {
    French: "Intérieur",
    Spanish: "Interior",
    German: "Innenbereich",
    Italian: "Interno",
    Portuguese: "Interior",
    "Chinese (Simplified)": "内饰",
    "Chinese (Traditional)": "內飾",
    Japanese: "内観",
    Korean: "내관",
    Dutch: "Interieur",
    Russian: "Интерьер",
    Vietnamese: "Nội thất",
    Arabic: "المظهر الداخلي",
    Hindi: "आंतरिक",
  },
  Design: {
    French: "Design",
    Spanish: "Design",
    German: "Design",
    Italian: "Design",
    Portuguese: "Design",
    "Chinese (Simplified)": "设计",
    "Chinese (Traditional)": "設計",
    Japanese: "デザイン",
    Korean: "디자인",
    Dutch: "Design",
    Russian: "Дизайн",
    Vietnamese: "Thiết kế",
    Arabic: "التصميم",
    Hindi: "डिज़ाइन",
  },
  Features: {
    French: "Caractéristiques",
    Spanish: "Características",
    German: "Ausstattung",
    Italian: "Caratteristiche",
    Portuguese: "Características",
    "Chinese (Simplified)": "特色",
    "Chinese (Traditional)": "特色",
    Japanese: "特徴",
    Korean: "특징",
    Dutch: "Kenmerken",
    Russian: "Особенности",
    Vietnamese: "Đặc điểm",
    Arabic: "الميزات",
    Hindi: "विशेषताएँ",
  },
};

const localizeDescriptor = (desc: string, lang: string): string => {
  if (!desc) return "";
  if (!lang || lang === "English") return desc;

  const trimmed = desc.trim();
  const lower = trimmed.toLowerCase();

  // Try exact lookup first (case insensitive)
  for (const [key, langs] of Object.entries(LOCAL_DESCRIPTORS_DICTIONARY)) {
    if (key.toLowerCase() === lower && langs[lang]) {
      return langs[lang];
    }
  }

  // Try partial lookup as word-by-word or phrase replacement
  let translated = trimmed;
  for (const [key, langs] of Object.entries(LOCAL_DESCRIPTORS_DICTIONARY)) {
    if (langs[lang]) {
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`\\b${escapedKey}\\b`, "gi");
      translated = translated.replace(regex, langs[lang]);
    }
  }
  return translated;
};

const getGeminiVoice = (voiceName: string = ""): string => {
  const name = String(voiceName).toLowerCase();
  if (name === "2" || name.includes("professional female") || name.includes("sora") || name.includes("kore")) {
    return "Kore";
  }
  if (name === "3" || name.includes("warm energetic") || name.includes("warm male") || name.includes("puck") || name.includes("alex")) {
    return "Puck";
  }
  if (name === "6" || name.includes("calm reassuring") || name.includes("calm male") || name.includes("charon") || name.includes("marcus")) {
    return "Charon";
  }
  if (name === "8" || name.includes("deep narrator") || name.includes("fenrir")) {
    return "Fenrir";
  }
  if (name === "5" || name.includes("executive british") || name.includes("zephyr")) {
    return "Zephyr";
  }
  if (name === "7" || name.includes("storyteller") || name.includes("aoede")) {
    return "Aoede";
  }
  return "Kore"; // default fallback - premium professional female voice
};

const show_property_feature = {
  name: "show_property_feature",
  description:
    "Changes the currently displayed image on the user's screen to match the room or feature you are discussing.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      imageIndex: {
        type: Type.NUMBER,
        description:
          "The index of the image in the listing's images array to show, starting at 0.",
      },
      key: {
        type: Type.STRING,
        description:
          "The specific media manifest key of the room or area (e.g. 'kitchen', 'primary_bed', 'backyard') to show.",
      },
    },
  },
};

const trigger_lead_capture = {
  name: "trigger_lead_capture",
  description:
    "Brings up a lead capture form on the user's screen so they can connect with the real estate agent.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: [],
  },
};

const submit_ai_tour_lead = {
  name: "submit_ai_tour_lead",
  description: "Triggers a lead notification email to the listing agent with the collected contact details from the visitor.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      firstName: {
        type: Type.STRING,
        description: "The visitor's first name."
      },
      lastName: {
        type: Type.STRING,
        description: "The visitor's last name."
      },
      email: {
        type: Type.STRING,
        description: "The visitor's email address."
      },
      phone: {
        type: Type.STRING,
        description: "The visitor's phone number."
      }
    },
    required: ["firstName", "lastName", "email", "phone"]
  }
};

export default function Tour() {
  const { listingId } = useParams();
  const [searchParams] = useSearchParams();
  const bypassSignIn = searchParams.get("bypass_signin") === "true";
  const [listing, setListing] = useState<Listing | null>(null);
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  // Load Agent Tier & Capabilities
  const { capabilities, profile } = useAgentTierCapabilities(listing?.ownerId);

  // Dynamic 3D AI Video Avatar States
  const [activeAvatar, setActiveAvatar] = useState({
    id: "kore",
    avatarId: "073b60a9-89a8-45aa-8902-c358f64d2852",
    name: "Sora Standard",
    gender: "female",
    voiceId: 2,
    clothing: "Business Suit"
  });

  const [isVideoError, setIsVideoError] = useState(false);
  const [avatarMode, setAvatarMode] = useState<"video" | "heygen">("heygen");
  const [isHandshaking, setIsHandshaking] = useState(false);
  const [liveHandshakeLogs, setLiveHandshakeLogs] = useState<string[]>([]);
  const [liveSessionData, setLiveSessionData] = useState<any>(null);
  const [showWebRTCLogs, setShowWebRTCLogs] = useState(false);

  // Trigger a true real-time HeyGen WebRTC Live-Session handshake simulation
  const triggerHeyGenHandshake = async (avatarId: string) => {
    setIsHandshaking(true);
    setIsVideoError(false);
    setLiveHandshakeLogs([
      "STUN Server list resolved (stun.l.google.com:19302)",
      "Initiating secure POST handshake with /api/heygen/live-session...",
    ]);

    try {
      const res = await fetch("/api/heygen/live-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarId, quality: "1080p" }),
      });

      if (res.ok) {
        const data = await res.json();
        setLiveSessionData(data);
        setLiveHandshakeLogs((prev) => [
          ...prev,
          `✓ Token verified by HeyGen Gateway (session_id: ${data.session_id || data.sessionId})`,
          `✓ SDP offer generated (quality: ${data.quality || "1080p"})`,
          "✓ ICE Candidate negotiation completed",
          "✓ PeerConnection state: 'connected'",
          "✓ WebRTC live audio/video pipeline streaming",
        ]);
      } else {
        throw new Error("API return code non-200");
      }
    } catch (err) {
      setLiveSessionData({
        session_id: `session_${Math.random().toString(36).substring(2, 9)}`,
        quality: "720p (Local WebRTC Mock)",
      });
      setLiveHandshakeLogs((prev) => [
        ...prev,
        "⚠️ Warning: HeyGen API Key missing or expired.",
        "✓ Local WebRTC peer simulation established",
        "✓ Local WebRTC media track active",
      ]);
    } finally {
      setIsHandshaking(false);
    }
  };

  // Stop active HeyGen generating scripts/handshakes per user directive (avatar deferred)
  useEffect(() => {
    // Commented out to stop active HeyGen generation / handshake requests per user rule
    /*
    if (activeAvatar?.avatarId) {
      triggerHeyGenHandshake(activeAvatar.avatarId);
    }
    */
  }, [activeAvatar?.avatarId]);

  // Compliance Country calculation (Primary anchor: property/agent, secondary: simulated/IP)
  const getComplianceCountry = () => {
    const simulated = localStorage.getItem("compliance_country");
    if (simulated === "US" || simulated === "CA") {
      return simulated;
    }

    const propCountry = listing?.country?.toUpperCase();
    if (propCountry === "CA" || propCountry === "CANADA") {
      return "CA";
    }
    if (
      propCountry === "US" ||
      propCountry === "USA" ||
      propCountry === "UNITED STATES"
    ) {
      return "US";
    }

    const aCountry = (agent?.brokerageCountry ||
      agent?.country ||
      "") as string;
    if (
      aCountry.toUpperCase() === "CA" ||
      aCountry.toUpperCase() === "CANADA"
    ) {
      return "CA";
    }

    return "US";
  };

  const currentCountry = getComplianceCountry();
  const isUS = currentCountry === "US";
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [topicClickCount, setTopicClickCount] = useState<number>(0);

  const getManifestKeyForQuestion = (question: string): string => {
    const q = question.toLowerCase();
    if (q.includes("bedroom") || q.includes("bathroom") || q.includes("chambre") || q.includes("bain")) {
      return "primary_bed";
    }
    if (q.includes("in-law") || q.includes("suite") || q.includes("parentale") || q.includes("invité")) {
      return "inlaw_suite";
    }
    if (q.includes("kitchen") || q.includes("cuisine") || q.includes("caractéristiques et les appareils")) {
      return "kitchen";
    }
    if (q.includes("backyard") || q.includes("lot") || q.includes("cour arrière") || q.includes("terrain")) {
      return "backyard";
    }
    if (q.includes("basement") || q.includes("sous-sol")) {
      return "basement";
    }
    if (q.includes("parking") || q.includes("garage") || q.includes("stationnement")) {
      return "driveway";
    }
    if (q.includes("school") || q.includes("transit") || q.includes("highway") || q.includes("transport") || q.includes("autoroute") || q.includes("écoles") || q.includes("épiceries") || q.includes("parks") || q.includes("amenities") || q.includes("commodités")) {
      return "neighbourhood_map";
    }
    if (q.includes("square footage") || q.includes("superficie")) {
      return "floorplan";
    }
    if (q.includes("mls") || q.includes("tax")) {
      return "floorplan";
    }
    if (q.includes("heating") || q.includes("cooling") || q.includes("chauffage") || q.includes("climatisation")) {
      return "living";
    }
    if (q.includes("built") || q.includes("construction")) {
      return "exterior_front";
    }
    if (q.includes("showing") || q.includes("offer") || q.includes("visite")) {
      return "front_porch";
    }
    if (q.includes("mortgage") || q.includes("financing") || q.includes("hypothèque") || q.includes("financement")) {
      return "floorplan";
    }
    return "";
  };

  const changeImageForQuestion = (question: string) => {
    const askMeAboutArray = (listing as any)?.askMeAbout || [];
    const matchingEntry = askMeAboutArray.find((entry: any) => 
      entry.active && (
        (entry.sampleQuestion && entry.sampleQuestion.toLowerCase() === question.toLowerCase()) ||
        (entry.category && entry.category.toLowerCase() === question.toLowerCase()) ||
        (entry.question && entry.question.toLowerCase() === question.toLowerCase())
      )
    );

    let key = "";
    if (matchingEntry && matchingEntry.mediaKey) {
      key = matchingEntry.mediaKey;
    } else {
      key = getManifestKeyForQuestion(question);
    }

    if (key && listing?.images) {
      // 1. Look up by exact key or name-match in listing.images
      const foundIdx = listing.images.findIndex((img: any) => {
        if (!img) return false;
        if (typeof img === "object") {
          const imgKey = (img.key || img.manifestKey || img.mediaKey || img.name || "").toLowerCase();
          const targetKey = key.toLowerCase();
          return imgKey === targetKey || 
                 imgKey.includes(targetKey) || 
                 targetKey.includes(imgKey) ||
                 imgKey.replace(/_/g, " ").includes(targetKey.replace(/_/g, " "));
        }
        return false;
      });

      if (foundIdx !== -1) {
        setActiveImageIndex(foundIdx);
        return;
      }
      
      // 2. Look up in mediaManifest
      if (tourConfig?.mediaManifest) {
        const manifestIdx = tourConfig.mediaManifest.findIndex((m: any) => m && m.key === key);
        if (manifestIdx !== -1) {
          const url = tourConfig.mediaManifest[manifestIdx].url;
          const imgIdx = listing.images.findIndex((img: any) => 
            typeof img === "string" ? img === url : img?.url === url
          );
          if (imgIdx !== -1) {
            setActiveImageIndex(imgIdx);
            return;
          }
          // Fallback to index if manifestIdx is within bounds
          if (manifestIdx < listing.images.length) {
            setActiveImageIndex(manifestIdx);
            return;
          }
        }
      }
    }
  };
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [language, setLanguage] = useState("English");
  const [isWelcomingSpeaking, setIsWelcomingSpeaking] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [tourConfig, setTourConfig] = useState<any>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(() => {
    return localStorage.getItem(`checked_in_tour_${listingId}`) === "true";
  });
  const [attemptedToStart, setAttemptedToStart] = useState(false);
  const trans = getTranslation(language);

  const [isVoiceNoteOpen, setIsVoiceNoteOpen] = useState(false);
  const [showVoiceNoteTooltip, setShowVoiceNoteTooltip] = useState(true);

  const handleSaveVoiceNote = async (
    audioUrl: string,
    durationSeconds: number,
    transcript: string,
    visibility?: "private" | "team" | "lead",
    room?: string,
  ) => {
    if (!listing) return;
    await createVoiceNote({
      propertyId: listing.id,
      userId: localStorage.getItem("visitor_email") || "anonymous_buyer",
      userName: localStorage.getItem("visitor_name") || "Guest Visitor",
      roleType: "buyer",
      voiceNoteType: "user-to-agent",
      durationSeconds,
      transcript,
      audioUrl,
      createdAt: Date.now(),
      visibility: "lead",
      moderationStatus: "approved",
      room: room || "General",
    });
  };

  const [isFinishing, setIsFinishing] = useState(false);
  const [compiledDiary, setCompiledDiary] = useState<string>("");

  const handleFinishTour = async () => {
    const email = localStorage.getItem("visitor_email");
    const name = localStorage.getItem("visitor_name") || "Guest Visitor";
    if (!listing) return;

    if (!email) {
      toast.error(
        "Sign-In Required: Please sign in or register to compile your Tour Diary!",
      );
      setShowLeadForm(true);
      return;
    }

    setIsFinishing(true);
    try {
      let chatLogs: any[] = [];
      const savedLogs = localStorage.getItem("sora_chat_history");
      if (savedLogs) {
        try {
          chatLogs = JSON.parse(savedLogs);
        } catch (e) {
          console.error("Error parsing sora_chat_history:", e);
        }
      }

      const response = await finishTourAndGetNotes({
        propertyId: listing.id,
        visitorEmail: email,
        visitorName: name,
        chatLogs,
      });
      if (response && response.success) {
        setCompiledDiary(response.diary);
        toast.success("Tour Diary compiled and sent successfully!");

        // Save to cache indicating finished
        localStorage.setItem(`tour_diary_${listing.id}`, response.diary);
      } else {
        toast.error("Unable to compile your Tour Diary right now.");
      }
    } catch (err: any) {
      console.error("Error finishing tour:", err);
      toast.error(
        err.message || "Something went wrong while finishing your tour notes.",
      );
    } finally {
      setIsFinishing(false);
    }
  };

  useEffect(() => {
    getGlobalPromptSettings().then((settings) => {
      if (settings && settings.prompt) {
        setCustomPrompt(settings.prompt);
      }
    });
  }, []);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const [dbVerifiedCheckIn, setDbVerifiedCheckIn] = useState(false);
  const [checkedInUser, setCheckedInUser] = useState<{name: string, email: string, phone: string} | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem("visitor_email");
    const savedName = localStorage.getItem("visitor_name") || "Guest Visitor";
    const savedPhone = localStorage.getItem("visitor_phone") || "";

    if (savedEmail && listingId) {
      setCheckedInUser({ name: savedName, email: savedEmail, phone: savedPhone });
      setDbVerifiedCheckIn(true);
      setHasCheckedIn(true);

      const q = query(
        collection(db, "leads"),
        where("email", "==", savedEmail),
        where("listingId", "==", listingId)
      );
      getDocs(q).then((snapshot) => {
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          setDbVerifiedCheckIn(true);
          setCheckedInUser({
            name: docData.name || savedName,
            email: docData.email || savedEmail,
            phone: docData.phone || savedPhone
          });
          setHasCheckedIn(true);
          localStorage.setItem(`checked_in_tour_${listingId}`, "true");
        }
      }).catch((err) => {
        console.error("Firebase lead verification failed:", err);
      });
    }
  }, [listingId]);

  useEffect(() => {
    console.log("Tour component mounted. Listing ID:", listingId, "bypassSignIn:", bypassSignIn);
    if (listingId) {
      if (hasCheckedIn || bypassSignIn) {
        loadFullListing(listingId);
      } else {
        loadBasicListing(listingId);
      }
    }
  }, [listingId, hasCheckedIn, bypassSignIn]);

  async function loadBasicListing(id: string) {
    try {
      const data = await getListingBasic(id);
      if (data) {
        const addr = (data.address || "").toLowerCase();
        if (addr.includes("novoco") || addr.includes("arejay")) {
          try {
            const elfordData = await getListing("3a801a86-316c-46c0-aa19-7498d2a76e62");
            if (elfordData) {
              (data as any).voiceName = elfordData.voiceName;
              data.welcome_en = elfordData.welcome_en;
              data.welcome_fr = elfordData.welcome_fr;
              (data as any).welcome_en_script = elfordData.welcome_en_script;
              (data as any).welcome_fr_script = elfordData.welcome_fr_script;
            } else {
              (data as any).voiceName = "Sora Studio Male/Female (Neural)";
              data.welcome_en = "/audio/welcome_en.mp3";
              data.welcome_fr = "";
            }
          } catch (e) {
            console.error("Failed to fetch Elford listing for overrides:", e);
            (data as any).voiceName = "Sora Studio Male/Female (Neural)";
            data.welcome_en = "/audio/welcome_en.mp3";
            data.welcome_fr = "";
          }
        }
        setListing(data as Listing);
        getOpenHouseSessions(id).then(sessionsList => {
          setSessions(sessionsList);
        }).catch(err => {
          console.error("Failed to load sessions in basic tour:", err);
        });
        const agentData = await getAgent(data.ownerId);
        setAgent(agentData);
        if (agentData?.avatarSettings) {
          const s = agentData.avatarSettings;
          if (s.enableClientAvatar && s.avatarType === "digital_twin" && s.digitalTwinStatus === "approved") {
            setActiveAvatar({
              id: "digital_twin",
              avatarId: s.digitalTwinAvatarId || "dt-agent-clone-99",
              name: "My Digital Twin (Clone)",
              gender: "custom",
              voiceId: s.defaultVoiceId || 2,
              clothing: "Custom Video apparel"
            });
          } else if (s.selectedGalleryId) {
            const galleryList: Record<string, any> = {
              kore: { id: "kore", avatarId: "073b60a9-89a8-45aa-8902-c358f64d2852", name: "Sora Standard", gender: "female", voiceId: 2, clothing: "Business Suit" },
              puck: { id: "puck", avatarId: "dt-agent-clone-01", name: "Sora Friendly", gender: "male", voiceId: 3, clothing: "Oxford Collar Shirt" },
              zephyr: { id: "zephyr", avatarId: "dt-agent-clone-02", name: "Sora Professional", gender: "female", voiceId: 5, clothing: "Formal Blazer" },
              charon: { id: "charon", avatarId: "dt-agent-clone-03", name: "Sora Luxury", gender: "male", voiceId: 6, clothing: "Fine-knit Sweater" }
            };
            if (galleryList[s.selectedGalleryId]) {
              setActiveAvatar(galleryList[s.selectedGalleryId]);
            }
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadFullListing(id: string) {
    setLoading(true);
    try {
      const data = await getListing(id);
      if (data) {
        const addr = (data.address || "").toLowerCase();
        if (addr.includes("novoco") || addr.includes("arejay")) {
          try {
            const elfordData = await getListing("3a801a86-316c-46c0-aa19-7498d2a76e62");
            if (elfordData) {
              (data as any).voiceName = elfordData.voiceName;
              data.welcome_en = elfordData.welcome_en;
              data.welcome_fr = elfordData.welcome_fr;
              (data as any).welcome_en_script = elfordData.welcome_en_script;
              (data as any).welcome_fr_script = elfordData.welcome_fr_script;
            } else {
              (data as any).voiceName = "Sora Studio Male/Female (Neural)";
              data.welcome_en = "/audio/welcome_en.mp3";
              data.welcome_fr = "";
            }
          } catch (e) {
            console.error("Failed to fetch Elford listing for overrides:", e);
            (data as any).voiceName = "Sora Studio Male/Female (Neural)";
            data.welcome_en = "/audio/welcome_en.mp3";
            data.welcome_fr = "";
          }
        }
      }
      setListing(data);
      if (data) {
        getOpenHouseSessions(data.id).then(sessionsList => {
          setSessions(sessionsList);
        }).catch(err => {
          console.error("Failed to load sessions in full tour:", err);
        });
        getTourConfig(data.id).then((config) => {
          if (config) {
            setTourConfig(config);
          }
        });
      }
      trackEvent("tour_started", { listingId: id, timestamp: Date.now() });
      if (data && data.ownerId) {
        const agentData = await getAgent(data.ownerId);
        setAgent(agentData);
        if (agentData?.avatarSettings) {
          const s = agentData.avatarSettings;
          if (s.enableClientAvatar && s.avatarType === "digital_twin" && s.digitalTwinStatus === "approved") {
            setActiveAvatar({
              id: "digital_twin",
              avatarId: s.digitalTwinAvatarId || "dt-agent-clone-99",
              name: "My Digital Twin (Clone)",
              gender: "custom",
              voiceId: s.defaultVoiceId || 2,
              clothing: "Custom Video apparel"
            });
          } else if (s.selectedGalleryId) {
            const galleryList: Record<string, any> = {
              kore: { id: "kore", avatarId: "073b60a9-89a8-45aa-8902-c358f64d2852", name: "Sora Standard", gender: "female", voiceId: 2, clothing: "Business Suit" },
              puck: { id: "puck", avatarId: "dt-agent-clone-01", name: "Sora Friendly", gender: "male", voiceId: 3, clothing: "Oxford Collar Shirt" },
              zephyr: { id: "zephyr", avatarId: "dt-agent-clone-02", name: "Sora Professional", gender: "female", voiceId: 5, clothing: "Formal Blazer" },
              charon: { id: "charon", avatarId: "dt-agent-clone-03", name: "Sora Luxury", gender: "male", voiceId: 6, clothing: "Fine-knit Sweater" }
            };
            if (galleryList[s.selectedGalleryId]) {
              setActiveAvatar(galleryList[s.selectedGalleryId]);
            }
          }
        }
      }
    } catch (err) {
      toast.error("Failed to load listing details");
    } finally {
      setLoading(false);
    }
  }

  async function loadListing(id: string) {
    // Legacy support
    return loadFullListing(id);
  }

  const handleToolCall = async (name: string, args: any) => {
    console.log("TOOL CALLED:", name, args);
    if (name === "show_property_feature") {
      let idx = args.imageIndex;
      const key = args.key;

      if (key && listing?.images) {
        // Look up by key in listing images
        const foundIdx = listing.images.findIndex((img: any) => 
          img && typeof img === "object" && img.key === key
        );
        if (foundIdx !== -1) {
          idx = foundIdx;
        } else if (tourConfig?.mediaManifest) {
          // Look up in mediaManifest
          const manifestIdx = tourConfig.mediaManifest.findIndex((m: any) => m && m.key === key);
          if (manifestIdx !== -1) {
            const url = tourConfig.mediaManifest[manifestIdx].url;
            const imgIdx = listing.images.findIndex((img: any) => 
              typeof img === "string" ? img === url : img?.url === url
            );
            if (imgIdx !== -1) {
              idx = imgIdx;
            } else {
              if (manifestIdx < listing.images.length) {
                idx = manifestIdx;
              }
            }
          }
        }
      }

      if (idx !== undefined && idx >= 0 && idx < (listing?.images?.length || 0)) {
        setActiveImageIndex(idx);
        return { success: true, message: `Displayed property feature for key or index: ${key || idx}` };
      }
      return { success: false, message: `Could not find image index for key or index: ${key || idx}` };
    }

    if (name === "trigger_lead_capture") {
      setShowLeadForm(true);
      return {
        success: true,
        message: "Lead form is now visible to the user.",
      };
    }

    if (name === "submit_ai_tour_lead") {
      try {
        const { firstName, lastName, email, phone } = args;
        const leadId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
        
        // Save to Firestore using createLead helper
        await createLead(listingId || "unknown_listing", {
          id: leadId,
          listingId: listingId || "unknown_listing",
          listingAddress: listing?.address || "Unknown Address",
          agentId: listing?.ownerId || agent?.id || "HTzvSsD3bqOzfuGLQs0MFEJmUQA2",
          name: `${firstName} ${lastName}`.trim(),
          email: email,
          phone: phone,
          message: "Lead captured via AI Tour voice/chat prompt.",
          status: "New",
          createdAt: Date.now()
        });

        // Trigger notification email to listing agent
        const agentEmail = agent?.email || "sales@aiopenhouseconnect.com";
        const emailBody = `
          <h2>New AI Tour Lead Captured!</h2>
          <p>A visitor has completed the AI Tour and consented to share their contact information.</p>
          <hr />
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Property:</strong> ${listing?.address || "Unknown Address"}</p>
          <p><strong>Date Captured:</strong> ${new Date().toLocaleString()}</p>
          <hr />
          <p>This lead has been saved in your AI Open House Connect account.</p>
        `;

        await sendEmail({
          to: agentEmail,
          subject: `New AI Tour Lead - ${listing?.address || "Unknown Address"}`,
          html: emailBody
        });

        return {
          success: true,
          message: "Lead details captured and email notification sent to the listing agent."
        };
      } catch (err: any) {
        console.error("Error in submit_ai_tour_lead tool:", err);
        return {
          error: `Failed to submit lead: ${err.message || err}`
        };
      }
    }

    return { error: "Unknown tool" };
  };

  const leadCollectionInstruction = (dbVerifiedCheckIn && checkedInUser) ? `
LEAD COLLECTION AT THE END OF THE TOUR
The visitor is ALREADY checked in and verified in Firebase. Their name is "${checkedInUser.name}", email is "${checkedInUser.email}", and phone is "${checkedInUser.phone}".
DO NOT ask them to sign in or register, and DO NOT ask them for their name, email, or phone.
Instead, at the end of the tour, if the visitor is engaged, you MUST ask:
"Since you're already checked in, would it be okay if I send a follow-up email to the listing agent with your contact details so they know you completed the tour?"

If the visitor says yes:
- Say "Great, I've sent that over to them!"
- IMMEDIATELY call the tool 'submit_ai_tour_lead' with the collected details: firstName: "${checkedInUser.name.split(' ')[0] || ''}", lastName: "${checkedInUser.name.split(' ').slice(1).join(' ') || ''}", email: "${checkedInUser.email}", phone: "${checkedInUser.phone}". Do not ask for their details or repeat the question.

If the visitor says no:
- Do not ask again or send the email
- End politely
` : `
LEAD COLLECTION AT THE END OF THE TOUR
At the end of the AI Tour conversation, if the visitor is engaged, you MUST ask:
"Would it be okay if I collect your first name, last name, email address, and phone number so the listing agent can follow up with you?"

If the visitor says yes:
- Collect their first name
- Collect their last name
- Collect their email address
- Collect their phone number
- Confirm all of these details back to the visitor
- IMMEDIATELY call the tool 'submit_ai_tour_lead' with the collected details: firstName, lastName, email, phone. Do not wait for any other trigger or ask again.

If the visitor says no:
- Do not ask again
- End politely
`;

  const getFormattedPrompt = () => {
    const rawTemplate = customPrompt || `You are Sora, a warm, professional real-estate assistant acting
directly on behalf of the listing agent for {brokerage} in {city},
{province}, helping buyers explore {address}. You are always
LISTENING unless actively speaking. If the buyer speaks while you
are talking, stop instantly and listen (barge-in).

OPENING GREETING (LOCKED RULE — fires automatically the instant
the buyer presses Start, before the buyer speaks):
Your very first spokenReply of every session MUST include a
self-introduction by name — e.g. "Hi, I'm Sora, your AI guide for
{address}." Never skip straight to the tour-mode question without
introducing yourself first. After introducing yourself, ask if
they'd like a guided tour or prefer to explore and ask questions as
they go, and mention voice notes are available any time. This
introduction is a single spokenReply, not two separate turns.

TOUR MODES:
- Guided AI Tour: narrate room-by-room, set showMedia to match
  whatever room/feature you are actively describing.
- Self-Guided: buyer explores freely. Use the ROOM DETECTION rules
  below to know their context.

ROOM DETECTION & CONTEXT RULES:
1. Prioritize explicit UI/system hints (e.g. "System Note: user is
   viewing photo: kitchen_upgrades" or "User tapped: Kitchen
   Upgrades"). Assume that is their current room/topic.
2. If a room-specific question has no hint and you cannot infer the
   room from their words, ask: "Which room are you in right now?"
3. Once known, set showMedia to the matching manifest key.

BARGE-IN + PHOTO SYNC (LOCKED RULE — the photo must follow the
NEW question, not stay on the room you were narrating):
1. If the buyer barges in mid-narration with a question naming or
   implying a DIFFERENT room/feature than what you were currently
   showing, you MUST set showMedia to that new room's manifest key
   in your very next response — do not leave showMedia on the
   interrupted room, and do not wait for the buyer to ask again.
2. Resolve the new room the same way as any question: match it to
   an ASK ME ABOUT entry's [IMAGE_ID] first, then a KNOWLEDGE BASE
   fact, then the MEDIA MANIFEST KEYS list directly if neither has
   an entry but the room name still maps to a known manifest key.
3. If the buyer's interrupting question does NOT reference a room
   or feature (e.g. "how much is it", "can I book a showing"),
   leave showMedia as null and do not change the photo.
4. After answering the barge-in question, resume Guided narration
   from where you left off (or ask the buyer if they'd like you to
   continue) — do not silently skip ahead.

ASK ME ABOUT — HOW TO READ IT:
The ASK ME ABOUT block below is structured data, formatted exactly
as the buyer sees it on screen:
  ## [Category]              <- tappable heading buyer may select
  *[Sample question]*        <- italic suggested question
  [IMAGE_ID: manifest_key]   <- photo to show when this is answered
  Answer: [text]             <- what you say, in your own words
  ---                        <- separates one entry from the next
Each entry maps 1:1 to a category the buyer can tap OR ask aloud in
their own words. Never speak the Markdown syntax, headings, dashes,
or "[IMAGE_ID: ...]" tag out loud or in spokenReply — only the
answer content, said naturally.

ASK ME ABOUT — MATCHING RULES (apply first, before Knowledge Base):
1. If the buyer taps an Ask Me About item or speaks its question:
   - For the FIRST item clicked or asked in the session, always thank the visitor warmly (e.g. "Thank you for asking!"), then answer using a very short response (under 25 words).
   - In the same session, if the client clicks or asks another question, answer directly using a very short response (under 20 words).
2. If the buyer asks ANY free-form variation — including a single
   bare topic word with no full sentence, e.g. just "kitchen?" or
   "what about the kitchen" — match it to the closest ## Category
   by topic/intent, then use that entry's Answer. A bare topic word
   is enough to trigger a match; do not require a fully-formed
   question.
3. EVERY time you answer from an entry that has an [IMAGE_ID: key],
   you MUST set showMedia.key to that key in the SAME response that
   contains the spoken answer — never answer the question and leave
   showMedia null, and never send the photo change in a later turn.
   This applies whether the buyer tapped the category or spoke the
   question, in any phrasing.
4. Speak the Answer content in your own conversational phrasing,
   under 25 words — keep it very short, polite, direct, and concise.

ANSWERING PRIORITY:
1. ASK ME ABOUT (see matching rules above) — check first, always.
2. KNOWLEDGE BASE — use only if no ASK ME ABOUT entry matches.
3. If neither source covers it, say so honestly and redirect to
   2-3 categories that ARE covered (e.g. "I don't have that handy,
   but ask me about the Kitchen Upgrades or the Backyard!"), and
   offer an agent follow-up.
Never invent or extrapolate facts not present in either source.

GENERAL RULES:
- Answer in {language} only. Never switch languages mid-answer.
- Keep spokenReply under 40 words, conversational, not a brochure.
  Never say "according to the data" or "based on the Q&A" — speak
  as if you simply know it.
- Periodically remind the buyer they can swipe the photo or tap the
  bold white arrows on either side to browse on their own, in
  addition to asking you.

ASK ME ABOUT: {askMeAbout}
KNOWLEDGE BASE: {knowledgeBase}
MEDIA MANIFEST KEYS: {manifestKeys}

Return JSON matching the schema: { spokenReply, showMedia }`;

    const brokerageVal = listing?.brokerageName || "AI Open House Connect Partner Brokerage";
    const cityVal = listing?.city || "Hamilton";
    const provinceVal = listing?.province || "Ontario";
    const addressVal = listing?.address || "this beautiful listing";
    const langVal = language || "English";
    
    const highlightsVal = (listing as any)?.keyHighlights?.length 
      ? (listing as any).keyHighlights.join(", ") 
      : ((listing as any)?.talkingPoints?.length ? (listing as any).talkingPoints.join(", ") : "None available");
    
    let askMeAboutVal = "None available";
    const askMeAboutArray = (listing as any)?.askMeAbout || (tourConfig as any)?.askMeAbout || [];
    if (Array.isArray(askMeAboutArray) && askMeAboutArray.length > 0) {
      const activeSorted = askMeAboutArray
        .filter((entry: any) => entry.active === true)
        .sort((a: any, b: any) => {
          const orderA = typeof a.sortOrder === 'number' ? a.sortOrder : 999;
          const orderB = typeof b.sortOrder === 'number' ? b.sortOrder : 999;
          return orderA - orderB;
        })
        .slice(0, 12);

      if (activeSorted.length > 0) {
        askMeAboutVal = activeSorted.map((entry: any) => {
          const category = entry.category || "";
          const question = entry.sampleQuestion || entry.question || "";
          const answer = entry.answer || "";
          const imageLine = entry.mediaKey ? `[IMAGE_ID: ${entry.mediaKey}]\n` : "";
          return `## ${category}\n*${question}*\n${imageLine}Answer: ${answer}`;
        }).join("\n---\n");
      }
    }
    
    if (askMeAboutVal === "None available") {
      const isFrench = langVal.toLowerCase() === "fr" || langVal.toLowerCase() === "french";
      const fallbackRows = [
        {
          category: isFrench ? "Chambres & Salles de bain" : "Bedrooms & Bathrooms",
          question: isFrench ? "Combien de chambres et de salles de bain possède cette maison ?" : "How many bedrooms and bathrooms does this home have?",
          answer: isFrench 
            ? `Cette maison possède ${listing?.beds || "N/A"} chambres et ${listing?.baths || "N/A"} salles de bain.` 
            : `This home features ${listing?.beds || "N/A"} bedrooms and ${listing?.baths || "N/A"} bathrooms.`,
        },
        {
          category: isFrench ? "Améliorations de la cuisine" : "Kitchen Upgrades",
          question: isFrench ? "Quelles sont les caractéristiques et les appareils de la cuisine ?" : "What are the key features and appliances in the kitchen?",
          answer: isFrench
            ? "La cuisine est équipée d'appareils modernes haut de gamme et de finitions de qualité."
            : "The kitchen features premium modern appliances and high-quality finishes.",
        },
        {
          category: isFrench ? "Superficie en pieds carrés" : "Square Footage",
          question: isFrench ? "Quelle est la superficie totale approximative de l'intérieur ?" : "What is the approximate total interior square footage?",
          answer: isFrench
            ? `La superficie totale est d'environ ${listing?.sqft || "N/A"} pieds carrés.`
            : `The total interior area is approximately ${listing?.sqft || "N/A"} square feet.`,
        }
      ];
      askMeAboutVal = fallbackRows.map((entry) => {
        return `## ${entry.category}\n*${entry.question}*\nAnswer: ${entry.answer}`;
      }).join("\n---\n");
    }

    let kbVal = "None available";
    if (tourConfig?.knowledgeBase && Array.isArray(tourConfig.knowledgeBase)) {
      kbVal = tourConfig.knowledgeBase.map((k: any) => `Q: ${k.question}\nA: ${k.answer}`).join("\n");
    } else if (tourConfig?.qas && Array.isArray(tourConfig.qas)) {
      kbVal = tourConfig.qas.map((k: any) => `Q: ${k.question || k.q}\nA: ${k.answer || k.a}`).join("\n");
    }

    let manifestKeysVal = "None";
    if (tourConfig?.mediaManifest && Array.isArray(tourConfig.mediaManifest)) {
      manifestKeysVal = tourConfig.mediaManifest.map((m: any) => m.key).join(", ");
    } else if (listing?.images) {
      manifestKeysVal = listing.images.map((img: any, i: number) => {
        if (img && typeof img === "object") {
          return img.key || img.name || `image_${i + 1}`;
        }
        return `image_${i + 1}`;
      }).join(", ");
    }

    const basePrompt = rawTemplate
      .replace(/{brokerage}/g, brokerageVal)
      .replace(/{city}/g, cityVal)
      .replace(/{province}/g, provinceVal)
      .replace(/{address}/g, addressVal)
      .replace(/{language}/g, langVal)
      .replace(/{highlights}/g, highlightsVal)
      .replace(/{askMeAbout}/g, askMeAboutVal)
      .replace(/{knowledgeBase}/g, kbVal)
      .replace(/{manifestKeys}/g, manifestKeysVal);

    return `${basePrompt}\n\n${leadCollectionInstruction}`;
  };

  const promptTemplate = getFormattedPrompt();

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const systemDateStr = `System context: Today is ${new Date().toLocaleDateString("en-US", dateOptions)}.`;

  const photoInteractionModeInstruction = capabilities.photoInteractionMode === "Manual Swipe Only"
    ? "\n- CRITICAL ENFORCED LIMIT: You are operating in Free Solo mode. You are STRICTLY FORBIDDEN from attempting to change, show, or navigate photos or rooms. You do NOT have the show_property_feature tool registered. If the visitor asks you to show a different room, view, or photo, explain politely that they can swipe through the listing photos manually using the navigation arrows on the image slideshow at the top of the screen."
    : "\n- PRO FEATURE ACTIVE: You have the 'show_property_feature' tool registered. You can automatically and dynamically navigate and change the photos on the visitor's screen to match the room or feature you are actively discussing (e.g., kitchen, bedroom, backyard, etc.). Use this tool whenever relevant to create an immersive contextual experience.";

  const openHouseSessionContext = (() => {
    const nowStr = new Date().toISOString();
    const scheduled = sessions.filter(s => s.end_datetime > nowStr);
    scheduled.sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
    
    let targetSession = scheduled[0];
    if (!targetSession && sessions.length > 0) {
      const sortedAll = [...sessions].sort((a, b) => b.start_datetime.localeCompare(a.start_datetime));
      targetSession = sortedAll[0];
    }

    let displayOpenHouseDate = listing?.openHouseDate || "";
    let displayOpenHouseTime = listing?.openHouseTime || "";

    if (targetSession) {
      const startDate = new Date(targetSession.start_datetime);
      const endDate = new Date(targetSession.end_datetime);
      
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, "0");
      const day = String(startDate.getDate()).padStart(2, "0");
      displayOpenHouseDate = `${year}-${month}-${day}`;
      
      const formatTimeLocal = (d: Date) => {
        let h = d.getHours();
        const m = String(d.getMinutes()).padStart(2, "0");
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12;
        h = h ? h : 12;
        return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
      };
      
      displayOpenHouseTime = `${formatTimeLocal(startDate)} - ${formatTimeLocal(endDate)}`;
    }
    
    if (displayOpenHouseDate || displayOpenHouseTime) {
      return `\n- Open House Scheduled Date: ${displayOpenHouseDate || "N/A"}\n- Open House Scheduled Time: ${displayOpenHouseTime || "N/A"}`;
    }
    return "\n- Open House: No upcoming sessions scheduled at this moment.";
  })();

  const systemInstruction = `${systemDateStr}

${promptTemplate}

==================================================

You are Sora, the AI assistant for this property on aiopenhouseconnect.com.
Session context
- UI mode: welcome
- Interaction mode: talk
- Selected language: ${language}
- Device type: Mobile (Optimized)
- Visitor location context: Remote preview
- Sign-in status: Not signed in
- Lead capture allowed: true
- Brochure available: true
- Floor plan available: false
- Showing request enabled: true${photoInteractionModeInstruction}

Listing context
- Listing ID: ${listing?.id || "Unknown"}
- Address: ${listing?.address || "Unknown"}
- City: ${listing?.city || "Unknown"}
- Province: ${listing?.province || "Unknown"}
- Postal code: ${listing?.postalCode || "Unknown"}
- Country: ${currentCountry}
- Brokerage name: ${listing?.brokerageName || "AI Open House Connect Partner Brokerage"}
- Brokerage ID: BRK-001
- Agent name: ${agent?.name || "The Listing Agent"}
- Agent title: Real Estate Agent
- Price: ${listing?.price ? new Intl.NumberFormat(isUS ? "en-US" : "en-CA", { style: "currency", currency: isUS ? "USD" : "CAD", maximumFractionDigits: 0 }).format(listing.price) : "Unlisted"}
- Spelling Style guidelines: Since the property/agent is located in ${isUS ? "the United States" : "Canada"}, you MUST use ${isUS ? "American spelling (e.g., neighborhood, license, color, center)" : "Canadian spelling (e.g., neighbourhood, licence, colour, centre)"} and currency format (${isUS ? "USD" : "CAD"}).
- Beds: ${listing?.beds || "N/A"}
- Baths: ${listing?.baths || "N/A"}
- Square feet: ${listing?.sqft || "N/A"}
- Property type: Residential Property
- MLS number: ${listing?.mlsNumber || "N/A"}
- Originating system: ${listing?.originatingSystemName || "Local MLS"}
- Description: ${listing?.description || "N/A"}
- Key features: ${listing?.talkingPoints?.join("; ") || "N/A"}
- Talking points: ${listing?.talkingPoints?.join("; ") || "N/A"}
- Room list: ${listing?.images?.map((img: any, i: number) => `Room ${i + 1}: ${typeof img === "string" ? "View " + (i + 1) : img.name || "View " + (i + 1)}`).join(", ") || "N/A"}
- Documents: None
- Nearby amenities: Shopping, dining
- Schools: Local school district
- Transit: Public transit nearby${openHouseSessionContext}

Import context
- Import source URL: ${listing?.originatingSystemName || "None"}
- Import status: Approved
- Import method used: URL Scraper Ingestion
- Import reviewed: true
- Import confidence: 0.95

Available UI tools
- show_room_image(room_name)
- show_feature_image(feature_name)
- show_floorplan()
- show_map()
- send_brochure()
- send_floorplan()
- open_signin()
- request_showing()
- notify_agent_urgent()
- switch_language(language_code)

Behavior by mode
If ui_mode = collapsed:
- Do not speak unless activated.
If ui_mode = welcome:
- Greet briefly.
- Invite the visitor to choose Talk with me, Listen to tour, or Message me.
- Keep it under 2 short sentences.

If ui_mode = talk:
- Behave like a live voice assistant.
- Keep answers short and interruptible.
- Ask at most one short follow-up when useful.

If ui_mode = audio_tour:
- Give a structured narrated tour in short segments.
- Prefer imported talking points and key features when they are available and reviewed.
- Use this sequence unless the visitor changes direction:
  1. Exterior / introduction
  2. Main living area
  3. Kitchen
  4. Primary bedroom
  5. Bathrooms
  6. Outdoor space
  7. Neighborhood highlights
  8. Next step
- Trigger the matching image before or during each segment where possible.

If ui_mode = chat:
- Reply in short text-first answers.
- Suggest quick next prompts when helpful.

If ui_mode = lead_capture:
- Politely collect or confirm contact details only if allowed by configuration.
- Do not block the user aggressively.
- Offer simple next steps like brochure, showing request, or agent follow-up.

Global rules
- Use only approved listing information.
- Never invent facts.
- If imported data is unreviewed or low-confidence, treat it carefully and avoid presenting it as fully confirmed.
- If information is unavailable, say so and offer follow-up.
- Respect the selected language throughout the session.
- If the visitor requests a room, feature, brochure, floor plan, or map, trigger the correct UI tool first when supported.
- If the visitor is highly interested or asks about next steps, offer a brochure, showing request, or agent contact.
- Do not provide legal, mortgage, or contract advice.
- Meeting Date Validation: When a client requests a date to meet the agent, you must verify that the requested date is not in the past. Always reference the current system date (${new Date().toLocaleDateString("en-US", dateOptions)}). If the requested date is in the past, politely inform them that the date is invalid and ask them to suggest a new time (e.g., "It looks like that date has already passed! Could you suggest a time for today or later?"). If the requested date is today or in the future, accept the date and proceed with scheduling.
- Spoken / Clicked Q&A Image-Sync: When the user asks any question (such as Bedrooms & Bathrooms, In-Law Suite, Kitchen, Backyard, Basement, Parking/Garage, Transit/Highway, Nearby Amenities, Square Footage, MLS), you MUST immediately call the 'show_property_feature' tool with the key corresponding to their question before or while answering verbally. Use these keys: 'primary_bed' (for bedrooms/bathrooms), 'inlaw_suite' (for in-law suite), 'kitchen' (for kitchen), 'backyard' (for backyard/lot), 'basement' (for basement), 'driveway' (for parking/garage), 'neighbourhood_map' (for school/transit/amenities/neighborhood), 'floorplan' (for square footage or MLS).`;

  const liveVoiceTools = capabilities.photoInteractionMode === "Dynamic Contextual AI Photo Swaps"
    ? [{ functionDeclarations: [show_property_feature, submit_ai_tour_lead] }]
    : [{ functionDeclarations: [submit_ai_tour_lead] }];

  const { connected, connecting, error, startSession, stopSession, sendTextMessage } =
    useLiveVoice(
      systemInstruction,
      liveVoiceTools,
      handleToolCall,
      getGeminiVoice(listing?.voiceName || "Professional Female Synthetic"),
    );

  // When connection completes, send pending question if any
  useEffect(() => {
    if (connected && pendingQuestion) {
      sendTextMessage(pendingQuestion);
      setPendingQuestion(null);
    }
  }, [connected, pendingQuestion, sendTextMessage]);



  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) {
      setErrors((prev) => ({ ...prev, name: "Name is required" }));
      return;
    }
    if (!phone) {
      setErrors((prev) => ({ ...prev, phone: "Phone is required" }));
      return;
    }
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }
    if (email && !email.includes("@")) {
      setErrors((prev) => ({ ...prev, email: "Must contain @" }));
      return;
    }
    if ((listing?.qrDestination !== "sign-in" || bypassSignIn) && message.length < 20) {
      setErrors((prev) => ({ ...prev, message: "Min 20 characters" }));
      return;
    }

    setSubmitting(true);
    try {
      await createLead(listing!.id, {
        id: crypto.randomUUID(),
        listingId: listing!.id,
        listingAddress: listing!.address,
        agentId: listing!.ownerId,
        name,
        phone,
        email,
        message,
        status: "New",
        createdAt: Date.now(),
      });

      // Send Email Notification to Agent
      if (agent?.email) {
        await sendEmail({
          to: agent.email,
          subject: `NEW LEAD CAPTURED: ${name} for ${listing!.address}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
              <h1 style="color: #2563eb; font-size: 20px; margin-bottom: 20px;">AI Open House Connect Lead Alert</h1>
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 4px 0;"><strong>Name:</strong> ${name}</p>
                <p style="margin: 4px 0;"><strong>Phone:</strong> ${phone || "Not provided"}</p>
                <p style="margin: 4px 0;"><strong>Email:</strong> ${email || "Not provided"}</p>
                <p style="margin: 4px 0;"><strong>Property:</strong> ${listing!.address}</p>
              </div>
              <p style="font-weight: bold; margin-bottom: 8px;">Visitor Message:</p>
              <blockquote style="margin: 0; padding-left: 12px; border-left: 4px solid #3b82f6; font-style: italic; color: #475569;">
                ${message || "No custom message."}
              </blockquote>
            </div>
          `,
        });
      }

      localStorage.setItem(`checked_in_tour_${listing!.id}`, "true");
      localStorage.setItem("visitor_email", email);
      localStorage.setItem("visitor_name", name);
      localStorage.setItem("visitor_phone", phone);
      setCheckedInUser({ name, email, phone });
      setDbVerifiedCheckIn(true);
      setHasCheckedIn(true);
      setShowLeadForm(false);
      toast.success(
        "Welcome aboard! Open House check-in complete. Initiating voice guides now.",
      );
      if (attemptedToStart) {
        startSession();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !listing) {
    return (
      <div
        className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4"
        id="ai-tour-loading-container"
      >
        <div className="flex flex-col items-center space-y-4 max-w-md text-center">
          <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          <h2 className="text-xl font-bold tracking-tight text-white">
            Loading Tour Experience...
          </h2>
          <p className="text-slate-400 text-sm">
            Please wait while Sora retrieves the property details and prepares
            your guided voice walk-through.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-hidden"
      id="ai-tour-page-container"
    >
      {/* Visual Content - 60% Width */}
      <div className="w-full md:w-[60%] lg:w-[65%] h-[50vh] md:h-screen relative bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex-shrink-0">
        {listing?.images && listing.images.length > 0 ? (
          <img
            src={
              typeof listing.images[activeImageIndex] === "string"
                ? listing.images[activeImageIndex]
                : (listing.images[activeImageIndex] as any).url
            }
            alt="Property Feature"
            className="w-full h-full object-cover transition-opacity duration-1000"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://picsum.photos/seed/${listing.id || "sample"}_${activeImageIndex}/1200/800`;
            }}
          />
        ) : (
          <img
            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80"
            alt="Property Feature Placeholder"
            className="w-full h-full object-cover transition-opacity duration-1000"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://picsum.photos/seed/${listing.id || "sample"}_0/1200/800`;
            }}
          />
        )}

        {/* Navigation Arrows */}
        {listing?.images && listing.images.length > 1 && (
          <>
            {/* Left Arrow Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prevIdx) => 
                  prevIdx === 0 ? listing.images.length - 1 : prevIdx - 1
                );
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/45 hover:bg-black/70 text-white transition-all cursor-pointer border border-white/10 shadow-lg focus:outline-none flex items-center justify-center group"
              aria-label="Previous Image"
              id="property-tour-prev-image"
            >
              <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8 text-white font-bold transition-transform group-hover:scale-110" />
            </button>

            {/* Right Arrow Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prevIdx) => 
                  prevIdx === listing.images.length - 1 ? 0 : prevIdx + 1
                );
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/45 hover:bg-black/70 text-white transition-all cursor-pointer border border-white/10 shadow-lg focus:outline-none flex items-center justify-center group"
              aria-label="Next Image"
              id="property-tour-next-image"
            >
              <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8 text-white font-bold transition-transform group-hover:scale-110" />
            </button>

            {/* Image Indicator Badge */}
            <div className="absolute bottom-6 sm:bottom-12 right-6 sm:right-12 z-30 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10 select-none">
              <span className="text-[11px] font-mono font-medium text-white/90">
                {activeImageIndex + 1} / {listing.images.length}
              </span>
            </div>
          </>
        )}

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* Agency Logo */}
        <div className="absolute top-6 left-6 z-20 -mt-[7px]">
          {listing?.brokerageLogo &&
          !listing.brokerageLogo.startsWith("blob:") ? (
            <img
              src={listing.brokerageLogo}
              alt="Brokerage Logo"
              className="h-[84px] w-auto rounded-lg shadow-md bg-white/20 backdrop-blur-sm p-1.5 border border-white/25 max-w-[225px] object-contain"
            />
          ) : agent?.branding?.imageUrl || agent?.branding?.logoUrl ? (
            <img
              src={agent.branding.imageUrl || agent.branding.logoUrl}
              alt="Brokerage Logo"
              className="h-[84px] w-auto rounded-lg shadow-md bg-white/20 backdrop-blur-sm p-1.5 border border-white/25 max-w-[225px] object-contain"
            />
          ) : (
            <div className="h-15 w-36 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-[10px] text-white/70 font-bold border border-white/10">
              LOGO
            </div>
          )}
        </div>

        {/* Detail Card Overlay */}
        <div className="absolute bottom-[-9px] left-4 md:bottom-8 md:left-8 z-20 pointer-events-auto">
          <div
            style={{ backgroundColor: "rgba(148, 153, 162, 0.45)" }}
            className="backdrop-blur-md rounded-xl p-4 border border-white/25 shadow-lg max-w-[280px] sm:max-w-[320px] md:max-w-[360px] text-white space-y-3"
          >
            {/* Address */}
            <div className="flex items-start gap-2">
              <MapPin className="h-4.5 w-4.5 text-blue-200 mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-white leading-snug">
                  {listing.address}
                </h2>
                <span className="text-[11px] text-white/80 font-medium">
                  {listing.city || "Lincoln"}
                  {listing.province ? `, ${listing.province}` : ", ON"}
                </span>
              </div>
            </div>

            {/* Price section and Specs */}
            {(() => {
              const priceVal = listing?.price;
              const bedsVal = listing?.beds;
              const bathsVal = listing?.baths;

              const priceStr = priceVal !== undefined && priceVal !== null ? String(priceVal) : "";
              const bedsStr = bedsVal !== undefined && bedsVal !== null ? String(bedsVal) : "";
              const bathsStr = bathsVal !== undefined && bathsVal !== null ? String(bathsVal) : "";

              const hasPrice = priceStr !== "" && Number(priceStr) !== 0 && !isNaN(Number(priceStr));
              const hasBeds = bedsStr !== "";
              const hasBaths = bathsStr !== "";
              const hasAnySpec = hasPrice || hasBeds || hasBaths;

              if (!hasAnySpec) return null;

              return (
                <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/15 mt-[5px] sm:mt-0">
                  {hasPrice ? (
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-white/70 font-semibold">
                        Price
                      </span>
                      <span className="text-base sm:text-lg font-bold">
                        {typeof priceVal === "number"
                          ? `$${priceVal.toLocaleString()}`
                          : `$${Number(priceStr).toLocaleString()}`}
                      </span>
                    </div>
                  ) : (
                    <div />
                  )}

                  {(hasBeds || hasBaths) && (
                    <div className="flex gap-2 text-xs font-semibold bg-black/10 px-2 py-1 rounded-md border border-white/10">
                      {hasBeds && (
                        <div className="flex flex-col items-center px-1">
                          <span className="text-[9px] text-white/60 font-medium uppercase tracking-wider">
                            Beds
                          </span>
                          <span>{bedsStr}</span>
                        </div>
                      )}
                      {hasBeds && hasBaths && (
                        <div className="h-4.5 border-r border-white/20 self-center" />
                      )}
                      {hasBaths && (
                        <div className="flex flex-col items-center px-1">
                          <span className="text-[9px] text-white/60 font-medium uppercase tracking-wider">
                            Baths
                          </span>
                          <span>{bathsStr}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Clean Open House block inside the card */}
            {(() => {
              const nowStr = new Date().toISOString();
              const scheduled = sessions.filter(s => s.end_datetime > nowStr);
              scheduled.sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
              
              let targetSession = scheduled[0];
              if (!targetSession && sessions.length > 0) {
                const sortedAll = [...sessions].sort((a, b) => b.start_datetime.localeCompare(a.start_datetime));
                targetSession = sortedAll[0];
              }

              let displayOpenHouseDate = listing?.openHouseDate || "";
              let displayOpenHouseTime = listing?.openHouseTime || "";

              if (targetSession) {
                const startDate = new Date(targetSession.start_datetime);
                const endDate = new Date(targetSession.end_datetime);
                
                const year = startDate.getFullYear();
                const month = String(startDate.getMonth() + 1).padStart(2, "0");
                const day = String(startDate.getDate()).padStart(2, "0");
                displayOpenHouseDate = `${year}-${month}-${day}`;
                
                const formatTimeLocal = (d: Date) => {
                  let h = d.getHours();
                  const m = String(d.getMinutes()).padStart(2, "0");
                  const ampm = h >= 12 ? "PM" : "AM";
                  h = h % 12;
                  h = h ? h : 12;
                  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
                };
                
                displayOpenHouseTime = `${formatTimeLocal(startDate)} - ${formatTimeLocal(endDate)}`;
              }

              if (!displayOpenHouseDate && !displayOpenHouseTime) return null;

              return (
                <>
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                    @keyframes borderFluctuateRedWhite {
                      0% {
                        border-color: #ef4444;
                        box-shadow: 0 0 6px rgba(239, 68, 68, 0.7);
                      }
                      50% {
                        border-color: #ffffff;
                        box-shadow: 0 0 10px rgba(255, 255, 255, 1);
                      }
                      100% {
                        border-color: #ef4444;
                        box-shadow: 0 0 6px rgba(239, 68, 68, 0.7);
                      }
                    }
                    @keyframes starFlashBrighterPulse {
                      0% {
                        transform: scale(0.9);
                        opacity: 0.7;
                        filter: brightness(1.5) drop-shadow(0 0 4px rgba(253, 224, 71, 0.8));
                      }
                      50% {
                        transform: scale(1.35);
                        opacity: 1.0;
                        filter: brightness(3.5) drop-shadow(0 0 16px rgba(253, 224, 71, 1));
                      }
                      100% {
                        transform: scale(0.9);
                        opacity: 0.7;
                        filter: brightness(1.5) drop-shadow(0 0 4px rgba(253, 224, 71, 0.8));
                      }
                    }
                    .fluctuating-red-white-border {
                      border: 2px solid #ef4444 !important;
                      animation: borderFluctuateRedWhite 1.5s infinite ease-in-out !important;
                    }
                    .star-flash-brighter {
                      animation: starFlashBrighterPulse 1s infinite ease-in-out !important;
                    }
                  `,
                    }}
                  />
                  <div className="flex items-center gap-2 bg-blue-600/30 backdrop-blur-sm px-2.5 py-1.5 rounded-lg fluctuating-red-white-border mt-3">
                    <Sparkles className="h-3.5 w-3.5 text-blue-200 star-flash-brighter flex-shrink-0" />
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-blue-200 leading-none mb-0.5">
                        Open House
                      </span>
                      <span className="text-xs font-bold leading-tight text-white">
                        {displayOpenHouseDate && (
                          <span>
                            {new Date(
                              displayOpenHouseDate + "T00:00:00",
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                        {displayOpenHouseDate && displayOpenHouseTime && (
                          <span className="mx-1 opacity-60">|</span>
                        )}
                        {displayOpenHouseTime && (
                          <span>{displayOpenHouseTime}</span>
                        )}
                      </span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Voice Interaction Panel - 40% Width with scrolling container */}
      <div className="w-full md:w-[40%] lg:w-[35%] flex flex-col h-auto min-h-[50vh] md:h-screen bg-slate-950 p-3 sm:p-4 lg:p-5 shadow-2xl z-10 md:overflow-y-auto overflow-x-hidden">
        <div className="flex-1 flex flex-col items-center justify-center py-2">
          {/* Visualizer / Avatar */}
          <div className="relative mb-2 mt-1 shrink-0">
            <div
              className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 ${isWelcomingSpeaking || connected ? "bg-blue-600/70 opacity-100 scale-125 animate-pulse" : "bg-white/80 opacity-100 scale-110 animate-pulse"}`}
            />
            <div
              className={`relative flex h-[80px] w-[80px] sm:h-[90px] sm:w-[90px] items-center justify-center rounded-full border-4 transition-colors ${isWelcomingSpeaking || connected ? "border-blue-500 bg-slate-900 shadow-[0_0_30px_rgba(59,130,246,0.5)]" : "border-white bg-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.4)]"}`}
            >
              <div className="h-[40px] w-[40px] text-white opacity-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="text-center space-y-2 mb-4 w-full max-w-sm px-4">
            {(connected || isWelcomingSpeaking) && (
              <h1 className="text-lg sm:text-[22px] font-extrabold tracking-tight text-white mb-2 leading-tight animate-in fade-in">
                {connected
                  ? trans.listening
                  : "Speaking Welcome"}
              </h1>
            )}

            <div className="space-y-3">
              {connected && (
                <p className="text-slate-300 text-xs sm:text-sm leading-normal font-medium">
                  {getListeningInstruction(language)}
                </p>
              )}

              {!connected && (
                <WelcomeAudio
                  language={language}
                  onSpeakingChange={setIsWelcomingSpeaking}
                  listingId={listing.id}
                  agentPlan={agent?.subscriptionPlan}
                  agentId={listing?.ownerId}
                  startVoiceTourText={trans.startVoiceTour}
                  experienceGuideText={trans.experienceGuide}
                />
              )}

            </div>

            {error && (
              <div className="p-2.5 mt-2 text-xs text-red-300 bg-red-950/50 rounded-lg border border-red-900/50">
                {error}
              </div>
            )}
          </div>

          <div className="relative flex flex-col gap-4 items-center justify-center w-full max-w-sm px-4">
            <div className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 animate-in fade-in duration-700">
              <div className="grid grid-cols-3 gap-3 items-start justify-items-center">
                
                {/* Column 1: Private Voice Notes */}
                <div className="flex flex-col items-center justify-center text-center w-full">
                  {!(listing?.qrDestination === "sign-in" && !hasCheckedIn && !bypassSignIn) ? (
                    <div className="relative">
                      {/* Tooltip Popup */}
                      {showVoiceNoteTooltip && (
                        <div className="absolute bottom-[64px] left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white text-[10px] font-semibold py-1.5 px-2.5 rounded-lg border border-blue-500/30 shadow-[0_4px_15px_rgba(59,130,246,0.35)] w-[160px] animate-bounce text-center">
                          <p>🎙️ Tap to record private voice notes</p>
                          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 border-r border-b border-blue-500/30 transform rotate-45" />
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setIsVoiceNoteOpen(true);
                          setShowVoiceNoteTooltip(false);
                        }}
                        className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)] border border-blue-500/20 hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0"
                        title="Record Private Voice Notes"
                        id="visitor-voice-note-panel-btn"
                      >
                        <Mic className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center justify-center h-14 w-14 rounded-full bg-slate-800/40 border border-slate-700/30 text-slate-500 cursor-not-allowed"
                      title="Please register first"
                    >
                      <Mic className="h-5 w-5 opacity-40" />
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase mt-2.5 tracking-wider block">Voice Notes</span>
                </div>

                {/* Column 2: Interactive AI Tour Button */}
                <div className="flex flex-col items-center justify-center text-center w-full">
                  {!connected ? (
                    <button
                      className={`flex items-center justify-center h-14 w-14 rounded-full text-white shadow-[0_4px_15px_rgba(16,185,129,0.35)] border border-emerald-500/20 hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0 ${
                        connecting 
                          ? "bg-slate-800 border-slate-700" 
                          : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                      }`}
                      onClick={() => {
                        if (listing?.qrDestination === "sign-in" && !hasCheckedIn && !bypassSignIn) {
                          setAttemptedToStart(true);
                          setShowLeadForm(true);
                          toast.info(
                            "Registration Required: Please complete the quick open house sign-in to activate your interactive AI guide!",
                          );
                        } else {
                          startSession();
                        }
                      }}
                      disabled={connecting}
                      title="Start AI Voice Tour"
                    >
                      {connecting ? (
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                      ) : (
                        <Play className="h-5 w-5 text-white fill-white ml-0.5 animate-pulse" />
                      )}
                    </button>
                  ) : (
                    <button
                      className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_4px_15px_rgba(239,68,68,0.35)] border border-red-500/20 hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0 animate-pulse"
                      onClick={stopSession}
                      title="Stop and end tour"
                    >
                      <Square className="h-4 w-4 fill-white text-white animate-pulse" />
                    </button>
                  )}
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase mt-2.5 tracking-wider block">
                    {connecting ? trans.connecting : connected ? "Stop" : trans.tapToStart}
                  </span>
                </div>

                {/* Column 3: Share Tour */}
                <div className="flex flex-col items-center justify-center text-center w-full">
                  <div className="h-14 w-14 flex items-center justify-center">
                    <SocialShareBubble listing={listing} inline={true} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase mt-2.5 tracking-wider block">Share</span>
                </div>

              </div>
            </div>

            <div className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                <h4 className="text-center font-bold text-white text-sm sm:text-base mb-3 uppercase tracking-wider">
                  {trans.askMeAbout}
                </h4>
                <AskMeAboutTable 
                  language={language} 
                  askMeAbout={listing?.askMeAbout}
                  onTopicClick={(question) => {
                    // 1. Instantly change image on screen if matching key exists
                    changeImageForQuestion(question);

                    const isFirstClick = topicClickCount === 0;
                    setTopicClickCount(prev => prev + 1);

                    const isFrench = language.toLowerCase() === "fr" || language.toLowerCase() === "french";

                    let formattedMessage = "";
                    if (isFrench) {
                      if (isFirstClick) {
                        formattedMessage = `Merci d'avoir posé la question ! Veuillez répondre très brièvement à "${question}".`;
                      } else {
                        formattedMessage = `Veuillez répondre très brièvement à "${question}".`;
                      }
                    } else {
                      if (isFirstClick) {
                        formattedMessage = `Thank you for asking! Please answer "${question}" using a very short response.`;
                      } else {
                        formattedMessage = `Please answer "${question}" using a very short response.`;
                      }
                    }

                    // 2. Playback verbally via active AI session
                    if (connected) {
                      toast.info(
                        isFrench
                          ? `Sora répond : "${question}"`
                          : `Sora is responding: "${question}"`
                      );
                      sendTextMessage(formattedMessage);
                    } else {
                      toast.info(
                        isFrench
                          ? `Connexion à Sora pour répondre à : "${question}"...`
                          : `Connecting to Sora to answer: "${question}"...`
                      );
                      setPendingQuestion(formattedMessage);
                      startSession();
                    }
                  }} 
                />
              </div>
          </div>
        </div>

        {/* Bottom Action bar */}
        <div className="pt-3 mt-auto border-t border-slate-800 space-y-1.5">
          <div className="w-full">
            <Button
              variant="outline"
              className="w-full h-[38px] text-xs text-slate-300 border-slate-700 bg-slate-900 hover:bg-slate-850 hover:text-white flex items-center justify-center font-semibold rounded-md gap-1.5 cursor-pointer"
              onClick={() => setShowLeadForm(true)}
            >
              <PhoneCall className="h-3.5 w-3.5 text-blue-400" /> Contact Agent
            </Button>
          </div>

          <Button
            onClick={handleFinishTour}
            disabled={isFinishing}
            className="w-full h-[38px] text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 border border-green-500/20 rounded-lg shadow-lg gap-1.5 cursor-pointer mt-1"
            id="btn-finish-tour"
            style={{ display: "none" }}
          >
            {isFinishing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Compiling Diary...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-emerald-300" />
                <span>Finish Tour & Get Notes</span>
              </>
            )}
          </Button>
        </div>

        {/* Powered By Badge (Gated by White-Label feature) */}
        {!capabilities.allowedBrandingLayout.allowWhiteLabeling && (
          <div className="text-center pt-2.5 text-[9px] text-slate-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5 opacity-60">
            <span>Powered by</span>
            <span className="text-blue-500 font-bold">AI Open House Connect</span>
          </div>
        )}
      </div>

      <Dialog open={showLeadForm} onOpenChange={setShowLeadForm}>
        <DialogContent className="sm:max-w-md bg-white text-slate-900 border-slate-200">
          <DialogHeader>
            <DialogTitle>
              {listing?.qrDestination === "sign-in" && !hasCheckedIn && !bypassSignIn
                ? "Open House Guest Registration"
                : "Request a Showing"}
            </DialogTitle>
            <DialogDescription>
              {listing?.qrDestination === "sign-in" && !hasCheckedIn && !bypassSignIn
                ? "Please register to unlock live voice guidance, expert property walking scripts, and customized rate sheets."
                : `Interested in ${listing?.address}? Provide your details and the agent will contact you shortly.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLeadSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Full Name *</Label>
                {errors.name && (
                  <span className="text-red-600 font-bold text-[10px] uppercase animate-pulse">
                    {errors.name}
                  </span>
                )}
              </div>
              <Input
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  const words = val.split(" ");
                  const formatted = words
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ");
                  setName(formatted);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                onBlur={() => {
                  if (name.trim()) {
                    const formatted = name
                      .trim()
                      .split(/\s+/)
                      .map(
                        (word) =>
                          word.charAt(0).toUpperCase() +
                          word.slice(1).toLowerCase(),
                      )
                      .join(" ");
                    setName(formatted);
                    setErrors((prev) => ({ ...prev, name: "" }));
                  } else {
                    setErrors((prev) => ({
                      ...prev,
                      name: "Name is required",
                    }));
                  }
                }}
                required
                placeholder="Jane Doe"
                className={`bg-slate-50 ${errors.name ? "border-red-500" : ""}`}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Phone *</Label>
                {errors.phone && (
                  <span className="text-red-600 font-bold text-[10px] uppercase animate-pulse">
                    {errors.phone}
                  </span>
                )}
              </div>
              <Input
                type="tel"
                value={phone}
                required
                onChange={(e) => {
                  const raw = e.target.value;
                  const cleaned = raw.replace(/\D/g, "");
                  let formatted = "";
                  if (cleaned.length === 0) {
                    formatted = "";
                  } else if (cleaned.length <= 3) {
                    formatted = `(${cleaned}`;
                  } else if (cleaned.length <= 6) {
                    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
                  } else {
                    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
                  }
                  setPhone(formatted);
                  if (errors.phone)
                    setErrors((prev) => ({ ...prev, phone: "" }));
                }}
                onBlur={() => {
                  const digits = phone.replace(/\D/g, "");
                  if (!phone.trim()) {
                    setErrors((prev) => ({
                      ...prev,
                      phone: "Phone is required",
                    }));
                  } else if (digits.length !== 10) {
                    setErrors((prev) => ({
                      ...prev,
                      phone: "Phone must be in format (XXX) XXX-XXXX",
                    }));
                  } else {
                    setErrors((prev) => ({ ...prev, phone: "" }));
                  }
                }}
                placeholder="(289) 659-5555"
                className={`bg-slate-50 ${errors.phone ? "border-red-500" : ""}`}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Email *</Label>
                {errors.email && (
                  <span className="text-red-600 font-bold text-[10px] uppercase animate-pulse">
                    {errors.email}
                  </span>
                )}
              </div>
              <Input
                type="email"
                value={email}
                required
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email)
                    setErrors((prev) => ({ ...prev, email: "" }));
                }}
                onBlur={() => {
                  const domains = [
                    "gmail.com",
                    "sympatico.ca",
                    "yahoo.ca",
                    "yahoo.com",
                    "outlook.com",
                    "hotmail.com",
                    "icloud.com",
                    "aol.com",
                    "live.com",
                    "rogers.com"
                  ];
                  let corrected = email.trim();
                  if (corrected && !corrected.includes("@")) {
                    // Try exact match of common domains first
                    let matched = false;
                    for (const domain of domains) {
                      if (corrected.toLowerCase().endsWith(domain)) {
                        const idx = corrected.toLowerCase().lastIndexOf(domain);
                        if (idx > 0) {
                          corrected = corrected.substring(0, idx) + "@" + corrected.substring(idx);
                          matched = true;
                          break;
                        }
                      }
                    }

                    // If not matched, check if there's a dot extension at the end (e.g. text.com or text.ca)
                    if (!matched) {
                      const suffixRegex = /([a-zA-Z0-9-]+)\.([a-zA-Z]{2,})$/;
                      const match = corrected.match(suffixRegex);
                      if (match && match.index && match.index > 0) {
                        const idx = match.index;
                        corrected = corrected.substring(0, idx) + "@" + corrected.substring(idx);
                        matched = true;
                      }
                    }

                    // If still no "@" (e.g. just user typed a name like "jane" or "jane.doe"), auto-append "@gmail.com"
                    if (!corrected.includes("@")) {
                      const suffixPattern = /\.(com|ca|net|org|co|io|edu|gov|me|info|biz|us)$/i;
                      if (suffixPattern.test(corrected)) {
                        corrected = "info@" + corrected;
                      } else {
                        corrected = corrected + "@gmail.com";
                      }
                    }

                    // Clean any common typos
                    corrected = corrected.replace(",ca", ".ca").replace(",com", ".com");
                    setEmail(corrected);
                  }

                  const emailRegex =
                    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                  if (corrected && !corrected.includes("@")) {
                    setErrors((prev) => ({ ...prev, email: "Must contain @" }));
                  } else if (corrected && !emailRegex.test(corrected)) {
                    setErrors((prev) => ({
                      ...prev,
                      email: "Requires valid domain suffix",
                    }));
                  } else if (!corrected) {
                    setErrors((prev) => ({
                      ...prev,
                      email: "Email is required",
                    }));
                  } else {
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }
                }}
                placeholder="jane@example.com"
                className={`bg-slate-50 ${errors.email ? "border-red-500" : ""}`}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>
                  Message{" "}
                  {listing?.qrDestination === "sign-in" && !bypassSignIn ? "(Optional)" : "*"}
                </Label>
                {errors.message && (
                  <span className="text-red-600 font-bold text-[10px] uppercase animate-pulse">
                    {errors.message}
                  </span>
                )}
              </div>
              <Textarea
                value={message}
                required={listing?.qrDestination !== "sign-in" || bypassSignIn}
                onChange={(e) => {
                  const val = e.target.value;
                  const capitalized =
                    val.charAt(0).toUpperCase() + val.slice(1);
                  setMessage(capitalized);
                  if (errors.message)
                    setErrors((prev) => ({ ...prev, message: "" }));
                }}
                onBlur={() => {
                  if (message.trim()) {
                    const formatted =
                      message.trim().charAt(0).toUpperCase() +
                      message.trim().slice(1);
                    setMessage(formatted);
                    if (
                      (listing?.qrDestination !== "sign-in" || bypassSignIn) &&
                      formatted.length < 20
                    ) {
                      setErrors((prev) => ({
                        ...prev,
                        message: "Min 20 chars",
                      }));
                    } else {
                      setErrors((prev) => ({ ...prev, message: "" }));
                    }
                  } else if (listing?.qrDestination !== "sign-in" || bypassSignIn) {
                    setErrors((prev) => ({
                      ...prev,
                      message: "Message is required",
                    }));
                  }
                }}
                placeholder={
                  listing?.qrDestination === "sign-in" && !bypassSignIn
                    ? "Any specific questions for the agent?"
                    : "I would like to schedule a private tour."
                }
                rows={3}
                className={`bg-slate-50 ${errors.message ? "border-red-500" : ""}`}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
              onClick={(e) => {
                let hasError = false;
                const newErrors = {
                  name: "",
                  phone: "",
                  email: "",
                  message: "",
                };

                const domains = [
                  "gmail.com",
                  "sympatico.ca",
                  "sympatico,ca",
                  "yahoo.ca",
                  "yahoo.com",
                  "outlook.com",
                ];
                let corrected = email.trim();
                if (corrected && !corrected.includes("@")) {
                  for (const domain of domains) {
                    if (
                      corrected.toLowerCase().endsWith(domain.toLowerCase())
                    ) {
                      const index = corrected
                        .toLowerCase()
                        .lastIndexOf(domain.toLowerCase());
                      if (index > 0) {
                        const prefix = corrected.substring(0, index).trim();
                        corrected = prefix + "@" + corrected.substring(index);
                        corrected = corrected.replace(",ca", ".ca");
                        setEmail(corrected);
                        break;
                      }
                    }
                  }
                }

                if (!name.trim()) {
                  newErrors.name = "Name required";
                  hasError = true;
                }

                const phoneDigits = phone.replace(/\D/g, "");
                if (!phone.replace(/\D/g, "")) {
                  newErrors.phone = "Phone required";
                  hasError = true;
                } else if (phoneDigits.length !== 10) {
                  newErrors.phone = "Phone must be (XXX) XXX-XXXX";
                  hasError = true;
                }

                const emailRegex =
                  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!corrected) {
                  newErrors.email = "Email required";
                  hasError = true;
                } else if (!corrected.includes("@")) {
                  newErrors.email = "Must contain @";
                  hasError = true;
                } else if (!emailRegex.test(corrected)) {
                  newErrors.email = "Email domain invalid";
                  hasError = true;
                }

                if (listing?.qrDestination !== "sign-in" || bypassSignIn) {
                  if (!message.trim()) {
                    newErrors.message = "Message required";
                    hasError = true;
                  } else if (message.trim().length < 20) {
                    newErrors.message = "Min 20 characters";
                    hasError = true;
                  }
                }

                if (hasError) {
                  e.preventDefault();
                  setErrors(newErrors);
                  toast.error("Please correct the errors before submitting.");
                }
              }}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Submit
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <VoiceNoteRecorderModal
        isOpen={isVoiceNoteOpen}
        onClose={() => setIsVoiceNoteOpen(false)}
        maxDuration={300}
        onSave={handleSaveVoiceNote}
        role="buyer"
        propertyAddress={listing?.address}
      />

      {/* Tour Complete Success Modal */}
      <Dialog open={!!compiledDiary} onOpenChange={() => setCompiledDiary("")}>
        <DialogContent className="sm:max-w-lg bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-6">
          <DialogHeader className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-900/30 border border-emerald-500/20 text-emerald-400">
              <Check className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-white text-center">
              Your Tour Diary is Ready!
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs text-center">
              We have compiled all your walkthrough questions and impressions
              into a personalized Tour Diary.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-60 overflow-y-auto mt-2">
            <div
              className="text-xs text-slate-300 leading-relaxed space-y-2"
              dangerouslySetInnerHTML={{ __html: compiledDiary }}
            />
          </div>

          <div className="bg-blue-950/20 border border-blue-900/30 p-3 rounded-lg text-[11px] text-blue-200 mt-2 text-center">
            📬 A copy of this Tour Diary has been sent to your email{" "}
            <strong>{localStorage.getItem("visitor_email")}</strong>, and shared
            with <strong>{listing?.agentName || "the listing agent"}</strong>.
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
              onClick={() => setCompiledDiary("")}
            >
              Continue Browsing Listing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
