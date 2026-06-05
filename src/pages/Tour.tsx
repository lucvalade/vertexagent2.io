import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getListing, getAgent, createLead, Listing, sendEmail, getGlobalPromptSettings } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { useLiveVoice } from "@/hooks/useLiveVoice";
import { Type } from "@google/genai";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mic, MicOff, Home, PhoneCall, Loader2, MapPin, Globe, Sparkles, X, Square, PhoneOff } from "lucide-react";
import WelcomeAudio from "@/components/WelcomeAudio";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

const SUPPORTED_LANGUAGES = [
  "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Azerbaijani", "Basque", "Bengali", "Bosnian", "Bulgarian", 
  "Burmese", "Catalan", "Chinese (Simplified)", "Chinese (Traditional)", "Croatian", "Czech", "Danish", "Dutch", 
  "English", "Estonian", "Farsi (Persian)", "Filipino (Tagalog)", "Finnish", "French", "Galician", "Georgian", 
  "German", "Greek", "Gujarati", "Hebrew", "Hindi", "Hungarian", "Icelandic", "Indonesian", "Italian", "Japanese", 
  "Kannada", "Kazakh", "Khmer", "Korean", "Kyrgyz", "Lao", "Latvian", "Lithuanian", "Macedonian", "Malay", "Malayalam", 
  "Marathi", "Mongolian", "Nepali", "Norwegian", "Pashto", "Polish", "Portuguese", "Punjabi", "Romanian", "Russian", 
  "Serbian", "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish", "Swahili", "Swedish", "Tamil", "Telugu", "Thai", 
  "Turkish", "Ukrainian", "Urdu", "Uzbek", "Vietnamese", "Welsh", "Zulu"
];

const LANGUAGE_NATIVE_MAP: Record<string, string> = {
  "Afrikaans": "Afrikaans",
  "Albanian": "Shqip",
  "Amharic": "አማርኛ",
  "Arabic": "العربية",
  "Armenian": "Հայերեն",
  "Azerbaijani": "Azərbaycanca",
  "Basque": "Euskara",
  "Bengali": "বাংলা",
  "Bosnian": "Bosanski",
  "Bulgarian": "Български",
  "Burmese": "ဗမာစာ",
  "Catalan": "Català",
  "Chinese (Simplified)": "简体中文",
  "Chinese (Traditional)": "繁體中文",
  "Croatian": "Hrvatski",
  "Czech": "Čeština",
  "Danish": "Dansk",
  "Dutch": "Nederlands",
  "English": "English",
  "Estonian": "Eesti",
  "Farsi (Persian)": "فارسی",
  "Filipino (Tagalog)": "Tagalog",
  "Finnish": "Suomi",
  "French": "Français",
  "Galician": "Galego",
  "Georgian": "ქართული",
  "German": "Deutsch",
  "Greek": "Ελληνικά",
  "Gujarati": "ગુજરાતી",
  "Hebrew": "עברית",
  "Hindi": "हिन्दी",
  "Hungarian": "Magyar",
  "Icelandic": "Íslenska",
  "Indonesian": "Bahasa Indonesia",
  "Italian": "Italiano",
  "Japanese": "日本語",
  "Kannada": "ಕನ್ನಡ",
  "Kazakh": "Қазақша",
  "Khmer": "ខ្មែរ",
  "Korean": "한국어",
  "Kyrgyz": "Кыргызча",
  "Lao": "ລາວ",
  "Latvian": "Latviešu",
  "Lithuanian": "Lietuvių",
  "Macedonian": "Македонски",
  "Malay": "Bahasa Melayu",
  "Malayalam": "മലയാളം",
  "Marathi": "مराठी",
  "Mongolian": "Монгол",
  "Nepali": "नेपाली",
  "Norwegian": "Norsk",
  "Pashto": "پښتو",
  "Polish": "Polski",
  "Portuguese": "Português",
  "Punjabi": "ਪੰਜਾਬੀ",
  "Romanian": "Română",
  "Russian": "Русский",
  "Serbian": "Српски",
  "Sinhala": "සිင်හල",
  "Slovak": "Slovenčina",
  "Slovenian": "Slovenščina",
  "Somali": "Soomaali",
  "Spanish": "Español",
  "Swahili": "Kiswahili",
  "Swedish": "Svenska",
  "Tamil": "தமிழ்",
  "Telugu": "తెలుగు",
  "Thai": "ไทย",
  "Turkish": "Türkçe",
  "Ukrainian": "Українська",
  "Urdu": "اردو",
  "Uzbek": "Oʻzbekcha",
  "Vietnamese": "Tiếng Việt",
  "Welsh": "Cymraeg",
  "Zulu": "isiZulu"
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

const TRANSLATIONS: Record<string, {
  startVoiceTour: string;
  listening: string;
  experienceGuide: string;
  askMeAbout: string;
  tapToStart: string;
  connecting: string;
  andMore: string;
  defaultKeywords: string[];
}> = {
  English: {
    startVoiceTour: "Start Voice Tour",
    listening: "Listening...",
    experienceGuide: "Experience this property with an interactive AI guide.",
    askMeAbout: "Ask me About:",
    tapToStart: "Tap to Start",
    connecting: "Connecting...",
    andMore: "and more...",
    defaultKeywords: ["Bedrooms", "Kitchen", "Backyard"]
  },
  French: {
    startVoiceTour: "Démarrer la visite vocale",
    listening: "Écoute en cours...",
    experienceGuide: "Découvrez cette propriété avec un guide IA interactif.",
    askMeAbout: "Demandez-moi des infos sur :",
    tapToStart: "Appuyez pour démarrer",
    connecting: "Connexion...",
    andMore: "et plus...",
    defaultKeywords: ["Chambres", "Cuisine", "Jardin"]
  },
  Spanish: {
    startVoiceTour: "Iniciar visita guiada",
    listening: "Escuchando...",
    experienceGuide: "Descubra esta propiedad con un guía interactivo de IA.",
    askMeAbout: "Pregúntame sobre:",
    tapToStart: "Toque para comenzar",
    connecting: "Conectando...",
    andMore: "y más...",
    defaultKeywords: ["Dormitorios", "Cocina", "Patio trasero"]
  },
  German: {
    startVoiceTour: "Sprachführung starten",
    listening: "Zuhören...",
    experienceGuide: "Erleben Sie diese Immobilie mit einem interaktiven KI-Führer.",
    askMeAbout: "Fragen Sie mich über:",
    tapToStart: "Zum Starten tippen",
    connecting: "Verbinden...",
    andMore: "und mehr...",
    defaultKeywords: ["Schlafzimmer", "Küche", "Hinterhof"]
  },
  Italian: {
    startVoiceTour: "Avvia il tour vocale",
    listening: "In ascolto...",
    experienceGuide: "Scopri questa proprietà con una guida IA interattiva.",
    askMeAbout: "Chiedimi di:",
    tapToStart: "Tocca per iniziare",
    connecting: "Connessione...",
    andMore: "e altro...",
    defaultKeywords: ["Camere da letto", "Cucina", "Cortile"]
  },
  Portuguese: {
    startVoiceTour: "Iniciar tour por voz",
    listening: "Ouvindo...",
    experienceGuide: "Explore este imóvel com um ao vivo guia de IA.",
    askMeAbout: "Pergunte-me sobre:",
    tapToStart: "Toque para iniciar",
    connecting: "Conectando...",
    andMore: "e mais...",
    defaultKeywords: ["Quartos", "Cozinha", "Quintal"]
  },
  "Chinese (Simplified)": {
    startVoiceTour: "开始语音导览",
    listening: "正在聆听...",
    experienceGuide: "通过交互式 AI 指南体验此房产。",
    askMeAbout: "问我关于：",
    tapToStart: "轻触开始",
    connecting: "正在连接...",
    andMore: "等更多...",
    defaultKeywords: ["卧室", "厨房", "后院"]
  },
  "Chinese (Traditional)": {
    startVoiceTour: "開始語音導覽",
    listening: "正在聆聽...",
    experienceGuide: "透過互動式 AI 指南體驗此房產。",
    askMeAbout: "問我關於：",
    tapToStart: "輕觸開始",
    connecting: "正在連線...",
    andMore: "等更多...",
    defaultKeywords: ["臥室", "廚房", "後院"]
  },
  Japanese: {
    startVoiceTour: "音声案内をスタート",
    listening: "音声認識中...",
    experienceGuide: "双方向のAIガイドで、この物件を体験してください。",
    askMeAbout: "何でも質問してください：",
    tapToStart: "タップしてスタート",
    connecting: "接続中...",
    andMore: "など...",
    defaultKeywords: ["ベッドルーム", "キッチン", "お庭"]
  },
  Korean: {
    startVoiceTour: "음성 투어 시작",
    listening: "듣는 중...",
    experienceGuide: "대화형 AI 가이드와 함께 이 부동산을 경험해 보세요.",
    askMeAbout: "자유롭게 물어보세요:",
    tapToStart: "탭하여 시작하기",
    connecting: "연결 중...",
    andMore: "등등...",
    defaultKeywords: ["침실", "주방", "뒷마당"]
  },
  Dutch: {
    startVoiceTour: "Spraakrondleiding starten",
    listening: "Luisteren...",
    experienceGuide: "Ervaar deze woning met een interactieve AI-gids.",
    askMeAbout: "Vraag me over:",
    tapToStart: "Tik om te starten",
    connecting: "Verbinden...",
    andMore: "en meer...",
    defaultKeywords: ["Slaapkamers", "Keuken", "Achtertuin"]
  },
  Russian: {
    startVoiceTour: "Начать голосовой тур",
    listening: "Слушаю...",
    experienceGuide: "Ознакомьтесь с этой недвижимостью с интерактивным ИИ-гидом.",
    askMeAbout: "Спросите меня о:",
    tapToStart: "Нажмите для начала",
    connecting: "Подключение...",
    andMore: "и многое другое...",
    defaultKeywords: ["Спальни", "Кухня", "Задний двор"]
  },
  Vietnamese: {
    startVoiceTour: "Bắt đầu chuyến tham quan bằng giọng nói",
    listening: "Đang nghe...",
    experienceGuide: "Trải nghiệm bất động sản này với hướng dẫn viên AI tương tác.",
    askMeAbout: "Hỏi tôi về:",
    tapToStart: "Nhấn để bắt đầu",
    connecting: "Đang kết nối...",
    andMore: "và hơn thế nữa...",
    defaultKeywords: ["Phòng ngủ", "Nhà bếp", "Sân sau"]
  },
  Arabic: {
    startVoiceTour: "ابدأ الجولة الصوتية",
    listening: "جاري الاستماع...",
    experienceGuide: "اكتشف هذا العقار مع دليل الذكاء الاصطناعي التفاعلي.",
    askMeAbout: "اسألني عن:",
    tapToStart: "اضغط للبدء",
    connecting: "جاري الاتصال...",
    andMore: "والمزيد...",
    defaultKeywords: ["غرف النوم", "المطبخ", "الحديقة الخلفية"]
  },
  Hindi: {
    startVoiceTour: "वॉयस टूर शुरू करें",
    listening: "सुन रहा हूँ...",
    experienceGuide: "इंटरैक्टिव एआई गाइड के साथ इस संपत्ति का अनुभव करें।",
    askMeAbout: "मुझसे पूछें:",
    tapToStart: "शुरू करने के लिए टैप करें",
    connecting: "कनेक्ट हो रहा है...",
    andMore: "और भी...",
    defaultKeywords: ["शयनकक्ष", "रसोईघर", "पिछवाड़ा"]
  }
};

const getTranslation = (lang: string) => {
  return TRANSLATIONS[lang] || TRANSLATIONS.English;
};

const LOCAL_DESCRIPTORS_DICTIONARY: Record<string, Record<string, string>> = {
  "Kitchen": {
    "French": "Cuisine",
    "Spanish": "Cocina",
    "German": "Küche",
    "Italian": "Cucina",
    "Portuguese": "Cozinha",
    "Chinese (Simplified)": "厨房",
    "Chinese (Traditional)": "廚房",
    "Japanese": "キッチン",
    "Korean": "주방",
    "Dutch": "Keuken",
    "Russian": "Кухня",
    "Vietnamese": "Nhà bếp",
    "Arabic": "المطبخ",
    "Hindi": "रसोई"
  },
  "Living Room": {
    "French": "Salon",
    "Spanish": "Sala de estar",
    "German": "Wohnzimmer",
    "Italian": "Soggiorno",
    "Portuguese": "Sala de estar",
    "Chinese (Simplified)": "客厅",
    "Chinese (Traditional)": "客廳",
    "Japanese": "リビング",
    "Korean": "거실",
    "Dutch": "Woonkamer",
    "Russian": "Гостиная",
    "Vietnamese": "Phòng khách",
    "Arabic": "غرفة المعيشة",
    "Hindi": "बैठक"
  },
  "Primary Bedroom": {
    "French": "Chambre principale",
    "Spanish": "Dormitorio principal",
    "German": "Hauptschlafzimmer",
    "Italian": "Camera matrimoniale",
    "Portuguese": "Quarto principal",
    "Chinese (Simplified)": "主卧",
    "Chinese (Traditional)": "主臥",
    "Japanese": "主寝室",
    "Korean": "안방",
    "Dutch": "Hoofdslaapkamer",
    "Russian": "Главная спальня",
    "Vietnamese": "Phòng ngủ chính",
    "Arabic": "غرفة النوم الرئيسية",
    "Hindi": "मुख्य शयनकक्ष"
  },
  "Master Bedroom": {
    "French": "Chambre principale",
    "Spanish": "Dormitorio principal",
    "German": "Hauptschlafzimmer",
    "Italian": "Camera matrimoniale",
    "Portuguese": "Quarto principal",
    "Chinese (Simplified)": "主卧",
    "Chinese (Traditional)": "主臥",
    "Japanese": "主寝室",
    "Korean": "안방",
    "Dutch": "Hoofdslaapkamer",
    "Russian": "Главная спальня",
    "Vietnamese": "Phòng ngủ chính",
    "Arabic": "غرفة النوم الرئيسية",
    "Hindi": "मुख्य शयनकक्ष"
  },
  "Bedroom": {
    "French": "Chambre",
    "Spanish": "Dormitorio",
    "German": "Schlafzimmer",
    "Italian": "Camera da letto",
    "Portuguese": "Quarto",
    "Chinese (Simplified)": "卧室",
    "Chinese (Traditional)": "臥室",
    "Japanese": "寝室",
    "Korean": "침실",
    "Dutch": "Slaapkamer",
    "Russian": "Спальня",
    "Vietnamese": "Phòng ngủ",
    "Arabic": "غرفة نوم",
    "Hindi": "शयनकक्ष"
  },
  "Bathroom": {
    "French": "Salle de bain",
    "Spanish": "Baño",
    "German": "Badezimmer",
    "Italian": "Bagno",
    "Portuguese": "Banheiro",
    "Chinese (Simplified)": "浴室",
    "Chinese (Traditional)": "浴室",
    "Japanese": "浴室",
    "Korean": "욕실",
    "Dutch": "Badkamer",
    "Russian": "Ванная",
    "Vietnamese": "Phòng tắm",
    "Arabic": "الحمام",
    "Hindi": "स्नानघर"
  },
  "Backyard": {
    "French": "Cour arrière",
    "Spanish": "Patio trasero",
    "German": "Hinterhof",
    "Italian": "Cortile",
    "Portuguese": "Quintal",
    "Chinese (Simplified)": "后院",
    "Chinese (Traditional)": "後院",
    "Japanese": "裏庭",
    "Korean": "뒷마당",
    "Dutch": "Achtertuin",
    "Russian": "Задний двор",
    "Vietnamese": "Sân sau",
    "Arabic": "الفناء الخلفي",
    "Hindi": "पिछवाड़ा"
  },
  "Pool": {
    "French": "Piscine",
    "Spanish": "Piscina",
    "German": "Pool",
    "Italian": "Piscina",
    "Portuguese": "Piscina",
    "Chinese (Simplified)": "泳池",
    "Chinese (Traditional)": "泳池",
    "Japanese": "プール",
    "Korean": "수영장",
    "Dutch": "Zwembad",
    "Russian": "Бассейн",
    "Vietnamese": "Hồ bơi",
    "Arabic": "حمام السباحة",
    "Hindi": "पूल"
  },
  "Garage": {
    "French": "Garage",
    "Spanish": "Garage",
    "German": "Garage",
    "Italian": "Garage",
    "Portuguese": "Garagem",
    "Chinese (Simplified)": "车库",
    "Chinese (Traditional)": "車庫",
    "Japanese": "ガレージ",
    "Korean": "차고",
    "Dutch": "Garage",
    "Russian": "Гараж",
    "Vietnamese": "Nhà để xe",
    "Arabic": "المرآب",
    "Hindi": "गैराज"
  },
  "Office": {
    "French": "Bureau",
    "Spanish": "Oficina",
    "German": "Büro",
    "Italian": "Ufficio",
    "Portuguese": "Escritório",
    "Chinese (Simplified)": "办公室",
    "Chinese (Traditional)": "辦公室",
    "Japanese": "オフィス",
    "Korean": "사무실",
    "Dutch": "Kantoor",
    "Russian": "Кабинет",
    "Vietnamese": "Văn phòng",
    "Arabic": "المكتب",
    "Hindi": "कार्यालय"
  },
  "Patio": {
    "French": "Patio",
    "Spanish": "Patio",
    "German": "Terrasse",
    "Italian": "Patio",
    "Portuguese": "Pátio",
    "Chinese (Simplified)": "后院露台",
    "Chinese (Traditional)": "露台",
    "Japanese": "パティオ",
    "Korean": "테라스",
    "Dutch": "Patio",
    "Russian": "Патио",
    "Vietnamese": "Sân hiên",
    "Arabic": "الفناء",
    "Hindi": "आँगन"
  },
  "Balcony": {
    "French": "Balcon",
    "Spanish": "Balcón",
    "German": "Balkon",
    "Italian": "Balcone",
    "Portuguese": "Varanda",
    "Chinese (Simplified)": "阳台",
    "Chinese (Traditional)": "陽台",
    "Japanese": "バルコニー",
    "Korean": "발코니",
    "Dutch": "Balkon",
    "Russian": "Балкон",
    "Vietnamese": "Ban công",
    "Arabic": "الشرفة",
    "Hindi": "बालकनी"
  },
  "Dining Room": {
    "French": "Salle à manger",
    "Spanish": "Comedor",
    "German": "Esszimmer",
    "Italian": "Sala da pranzo",
    "Portuguese": "Sala de jantar",
    "Chinese (Simplified)": "餐厅",
    "Chinese (Traditional)": "餐廳",
    "Japanese": "ダイニング",
    "Korean": "식당",
    "Dutch": "Eetkamer",
    "Russian": "Столовая",
    "Vietnamese": "Phòng ăn",
    "Arabic": "غرفة الطعام",
    "Hindi": "भोजन कक्ष"
  },
  "View": {
    "French": "Vue",
    "Spanish": "Vista",
    "German": "Aussicht",
    "Italian": "Vista",
    "Portuguese": "Vista",
    "Chinese (Simplified)": "景观",
    "Chinese (Traditional)": "景觀",
    "Japanese": "景色",
    "Korean": "전망",
    "Dutch": "Uitzicht",
    "Russian": "Вид",
    "Vietnamese": "Tầm nhìn",
    "Arabic": "الإطلالة",
    "Hindi": "दृश्य"
  },
  "Location": {
    "French": "Emplacement",
    "Spanish": "Ubicación",
    "German": "Lage",
    "Italian": "Posizione",
    "Portuguese": "Localização",
    "Chinese (Simplified)": "位置",
    "Chinese (Traditional)": "位置",
    "Japanese": "立地",
    "Korean": "위치",
    "Dutch": "Locatie",
    "Russian": "Расположение",
    "Vietnamese": "Vị trí",
    "Arabic": "الموقع",
    "Hindi": "स्थान"
  },
  "Laundry": {
    "French": "Buanderie",
    "Spanish": "Lavandería",
    "German": "Waschküche",
    "Italian": "Lavanderia",
    "Portuguese": "Lavanderia",
    "Chinese (Simplified)": "洗衣房",
    "Chinese (Traditional)": "洗衣房",
    "Japanese": "ランドリー",
    "Korean": "세탁실",
    "Dutch": "Wasruimte",
    "Russian": "Прачечная",
    "Vietnamese": "Phòng giặt",
    "Arabic": "غرفة الغسيل",
    "Hindi": "कपड़े धोने का कमरा"
  },
  "Gym": {
    "French": "Salle de sport",
    "Spanish": "Gimnasio",
    "German": "Fitnessstudio",
    "Italian": "Palestra",
    "Portuguese": "Academia",
    "Chinese (Simplified)": "健身房",
    "Chinese (Traditional)": "健身房",
    "Japanese": "ジム",
    "Korean": "체육관",
    "Dutch": "Sportschool",
    "Russian": "Спортзал",
    "Vietnamese": "Phòng gym",
    "Arabic": "الصالة الرياضية",
    "Hindi": "जिम"
  },
  "Loft": {
    "French": "Loft",
    "Spanish": "Loft",
    "German": "Loft",
    "Italian": "Loft",
    "Portuguese": "Loft",
    "Chinese (Simplified)": "阁楼",
    "Chinese (Traditional)": "閣樓",
    "Japanese": "ロフト",
    "Korean": "로프트",
    "Dutch": "Loft",
    "Russian": "Лофт",
    "Vietnamese": "Gác lửng",
    "Arabic": "السقيفة",
    "Hindi": "मचान"
  },
  "Basement": {
    "French": "Sous-sol",
    "Spanish": "Sótano",
    "German": "Keller",
    "Italian": "Seminterrato",
    "Portuguese": "Porão",
    "Chinese (Simplified)": "地下室",
    "Chinese (Traditional)": "地下室",
    "Japanese": "地下室",
    "Korean": "지하실",
    "Dutch": "Kelder",
    "Russian": "Подвал",
    "Vietnamese": "Tầng hầm",
    "Arabic": "القبو",
    "Hindi": "तहखाना"
  },
  "Main Floor": {
    "French": "Rez-de-chaussée",
    "Spanish": "Planta principal",
    "German": "Hauptgeschoss",
    "Italian": "Piano principale",
    "Portuguese": "Piso principal",
    "Chinese (Simplified)": "主楼层",
    "Chinese (Traditional)": "主樓層",
    "Japanese": "1階",
    "Korean": "메인 층",
    "Dutch": "Begane grond",
    "Russian": "Главный этаж",
    "Vietnamese": "Tầng chính",
    "Arabic": "الطابق الرئيسي",
    "Hindi": "मुख्य मंजिल"
  },
  "Front Yard": {
    "French": "Cour avant",
    "Spanish": "Jardín delantero",
    "German": "Vorgarten",
    "Italian": "Cortile anteriore",
    "Portuguese": "Jardim frontal",
    "Chinese (Simplified)": "前院",
    "Chinese (Traditional)": "前院",
    "Japanese": "前庭",
    "Korean": "앞마당",
    "Dutch": "Voortuin",
    "Russian": "Передний двор",
    "Vietnamese": "Sân trước",
    "Arabic": "الفناء الأمامي",
    "Hindi": "सामने का आँगन"
  },
  "Exterior": {
    "French": "Extérieur",
    "Spanish": "Exterior",
    "German": "Außenbereich",
    "Italian": "Esterno",
    "Portuguese": "Exterior",
    "Chinese (Simplified)": "外观",
    "Chinese (Traditional)": "外觀",
    "Japanese": "外観",
    "Korean": "외관",
    "Dutch": "Exterieur",
    "Russian": "Экстерьер",
    "Vietnamese": "Ngoại thất",
    "Arabic": "المظهر الخارجي",
    "Hindi": "बाहरी"
  },
  "Interior": {
    "French": "Intérieur",
    "Spanish": "Interior",
    "German": "Innenbereich",
    "Italian": "Interno",
    "Portuguese": "Interior",
    "Chinese (Simplified)": "内饰",
    "Chinese (Traditional)": "內飾",
    "Japanese": "内観",
    "Korean": "내관",
    "Dutch": "Interieur",
    "Russian": "Интерьер",
    "Vietnamese": "Nội thất",
    "Arabic": "المظهر الداخلي",
    "Hindi": "आंतरिक"
  },
  "Design": {
    "French": "Design",
    "Spanish": "Design",
    "German": "Design",
    "Italian": "Design",
    "Portuguese": "Design",
    "Chinese (Simplified)": "设计",
    "Chinese (Traditional)": "設計",
    "Japanese": "デザイン",
    "Korean": "디자인",
    "Dutch": "Design",
    "Russian": "Дизайн",
    "Vietnamese": "Thiết kế",
    "Arabic": "التصميم",
    "Hindi": "डिज़ाइन"
  },
  "Features": {
    "French": "Caractéristiques",
    "Spanish": "Características",
    "German": "Ausstattung",
    "Italian": "Caratteristiche",
    "Portuguese": "Características",
    "Chinese (Simplified)": "特色",
    "Chinese (Traditional)": "特色",
    "Japanese": "特徴",
    "Korean": "특징",
    "Dutch": "Kenmerken",
    "Russian": "Особенности",
    "Vietnamese": "Đặc điểm",
    "Arabic": "الميزات",
    "Hindi": "विशेषताएँ"
  }
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
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKey}\\b`, 'gi');
      translated = translated.replace(regex, langs[lang]);
    }
  }
  return translated;
};

const getGeminiVoice = (voiceName: string = ""): string => {
  const name = voiceName.toLowerCase();
  if (name.includes("professional female")) return "Kore";
  if (name.includes("executive british")) return "Zephyr";
  if (name.includes("storyteller") || name.includes("aoede")) return "Aoede";
  if (name.includes("warm energetic") || name.includes("warm male") || name.includes("puck")) return "Puck";
  if (name.includes("calm reassuring") || name.includes("calm male") || name.includes("charon")) return "Charon";
  if (name.includes("deep narrator") || name.includes("narrator") || name.includes("fenrir")) return "Fenrir";
  return "Kore"; // default fallback - premium professional female voice
};

const show_property_feature = {
  name: "show_property_feature",
  description: "Changes the currently displayed image on the user's screen to match the room or feature you are discussing.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      imageIndex: {
        type: Type.NUMBER,
        description: "The index of the image in the listing's images array to show, starting at 0."
      }
    },
    required: ["imageIndex"]
  }
};

const trigger_lead_capture = {
  name: "trigger_lead_capture",
  description: "Brings up a lead capture form on the user's screen so they can connect with the real estate agent.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: []
  }
};

export default function Tour() {
  const { listingId } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [language, setLanguage] = useState("English");
  const [isWelcomingSpeaking, setIsWelcomingSpeaking] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [hasCheckedIn, setHasCheckedIn] = useState(() => {
    return localStorage.getItem(`checked_in_tour_${listingId}`) === "true";
  });
  const [attemptedToStart, setAttemptedToStart] = useState(false);
  const trans = getTranslation(language);

  useEffect(() => {
    getGlobalPromptSettings().then(settings => {
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
  const [errors, setErrors] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    console.log("Tour component mounted. Listing ID:", listingId);
    if (listingId) {
      loadListing(listingId);
    }
  }, [listingId]);

  async function loadListing(id: string) {
    console.log("Loading listing:", id);
    if (id === "sample") {
      setListing({
        id: "sample",
        ownerId: "sample_agent",
        address: "123 VertexAgent Lane, Sample City, CA",
        price: 1250000,
        beds: 4,
        baths: 3,
        description: "Welcome to this beautiful smart home featuring an open concept living area, modernized kitchen with quartz countertops, and a stunning backyard perfect for entertaining.",
        images: [
          "https://picsum.photos/seed/samplehouse/1200/800",
          "https://picsum.photos/seed/sampleliving/1200/800"
        ],
        talkingPoints: ["Newly renovated kitchen", "Smart home integration", "Open concept layout"],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setAgent({
        name: "Demo Agent",
        email: "demo@vertexagent.io"
      });
      setLoading(false);
      return;
    }
    
    try {
      const data = await getListing(id);
      setListing(data);
      trackEvent("tour_started", { listingId: id, timestamp: Date.now() });
      if (data && data.ownerId) {
        const agentData = await getAgent(data.ownerId);
        setAgent(agentData);
      }
    } catch (err) {
      toast.error("Failed to load listing details");
    } finally {
      setLoading(false);
    }
  }

  const handleToolCall = async (name: string, args: any) => {
    console.log("TOOL CALLED:", name, args);
    if (name === "show_property_feature") {
      const idx = args.imageIndex;
      if (idx >= 0 && idx < (listing?.images?.length || 0)) {
        setActiveImageIndex(idx);
      }
      return { success: true };
    }
    
    if (name === "trigger_lead_capture") {
      setShowLeadForm(true);
      return { success: true, message: "Lead form is now visible to the user." };
    }
    
    return { error: "Unknown tool" };
  };

  const promptTemplate = customPrompt || `You are Sora, the AI property assistant for VertexAgent.io.
You represent the listing agent and brokerage for a specific property. Your job is to help visitors explore the property through voice, guided audio, and text chat.

Primary goals:
- Help the visitor understand the property.
- Answer listing-specific questions clearly and briefly.
- Guide the visitor through the home in a natural way.
- Show relevant visuals before or while describing them when possible.
- Offer next steps when interest is high.
- Support sign-in, brochure requests, and showing requests naturally.
- Use imported listing data confidently when it has been reviewed and approved.

Assistant rules:
1. Use only approved listing facts, uploaded documents, room descriptions, media assets, configured neighborhood context, and approved imported listing data.
2. Never invent facts about the property, neighborhood, pricing, availability, schools, timelines, legal matters, or financing.
3. If imported data has not been approved or is marked uncertain, do not state it as confirmed fact.
4. If you do not know something, say that clearly and offer agent follow-up.
5. Speak in short, natural sentences optimized for mobile and voice.
6. Keep most spoken answers to 1 to 3 short sentences unless the user asks for more.
7. When a visitor asks about a room, feature, floor plan, map, brochure, or document, trigger the relevant asset first if the interface supports it.
8. Respect the selected language and continue fully in that language.
9. Adapt behavior to the selected interaction mode: welcome, talk, audio tour, chat, or lead capture.
10. In live voice mode, allow interruption and keep the tone conversational.
11. In audio tour mode, narrate the home in short guided sections and follow a logical tour order.
12. In chat mode, keep responses short, scannable, and text-friendly.
13. If the visitor shows strong interest, offer simple next steps such as receiving the brochure, booking a showing, or speaking with the agent.
14. If the user requests legal, financing, representation, or contractual advice, defer to the agent or an appropriate licensed professional.
15. Preserve brokerage identity and agent identity.
16. Do not sound robotic, overly salesy, or generic.
17. Use imported key features and talking points to structure tours when they are available and approved.
18. Use deduplicated image labels to match room references more accurately during the tour.

Mode behavior:
- Welcome mode: greet briefly and help the visitor choose Talk with me, Listen to tour, or Message me.
- Talk mode: act like a live real-time property guide.
- Audio tour mode: narrate the home in a structured path with short sections.
- Chat mode: answer quickly and suggest simple prompts when useful.
- Lead capture mode: transition politely into sign-in or follow-up collection when configured triggers are met.
Tone:
- Warm
- Professional
- Local
- Reassuring
- Concise`;

  const systemInstruction = `${promptTemplate}

==================================================

You are Sora, the AI assistant for this property on VertexAgent.io.
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
- Showing request enabled: true

Listing context
- Listing ID: ${listing?.id || "Unknown"}
- Address: ${listing?.address || "Unknown"}
- City: ${listing?.city || "Unknown"}
- Province: ${listing?.province || "Unknown"}
- Postal code: ${listing?.postalCode || "Unknown"}
- Country: ${listing?.country || "USA"}
- Brokerage name: ${listing?.brokerageName || "VertexAgent Partner Brokerage"}
- Brokerage ID: BRK-001
- Agent name: ${agent?.name || "The Listing Agent"}
- Agent title: Real Estate Agent
- Price: ${listing?.price ? "$" + listing.price.toLocaleString() : "Unlisted"}
- Beds: ${listing?.beds || "N/A"}
- Baths: ${listing?.baths || "N/A"}
- Square feet: ${listing?.sqft || "N/A"}
- Property type: Residential Property
- MLS number: ${listing?.mlsNumber || "N/A"}
- Originating system: ${listing?.originatingSystemName || "Local MLS"}
- Description: ${listing?.description || "N/A"}
- Key features: ${listing?.talkingPoints?.join("; ") || "N/A"}
- Talking points: ${listing?.talkingPoints?.join("; ") || "N/A"}
- Room list: ${listing?.images?.map((img: any, i: number) => `Room ${i + 1}: ${typeof img === "string" ? "View " + (i+1) : (img.name || "View " + (i+1))}`).join(", ") || "N/A"}
- Documents: None
- Nearby amenities: Shopping, dining
- Schools: Local school district
- Transit: Public transit nearby

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
- Do not provide legal, mortgage, or contract advice.`;

  const { connected, connecting, error, startSession, stopSession } = useLiveVoice(
    systemInstruction,
    [{ functionDeclarations: [show_property_feature, trigger_lead_capture] }],
    handleToolCall,
    getGeminiVoice(listing?.voiceName || "Professional Female")
  );

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) { 
      setErrors(prev => ({ ...prev, name: "Name is required" }));
      return; 
    }
    if (!phone) {
      setErrors(prev => ({ ...prev, phone: "Phone is required" }));
      return;
    }
    if (!email) {
      setErrors(prev => ({ ...prev, email: "Email is required" }));
      return;
    }
    if (email && !email.includes('@')) {
      setErrors(prev => ({ ...prev, email: "Must contain @" }));
      return;
    }
    if (listing?.qrDestination !== "sign-in" && message.length < 20) {
      setErrors(prev => ({ ...prev, message: "Min 20 characters" }));
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
        createdAt: Date.now()
      });

      // Send Email Notification to Agent
      if (agent?.email) {
        await sendEmail({
          to: agent.email,
          subject: `NEW LEAD CAPTURED: ${name} for ${listing!.address}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
              <h1 style="color: #2563eb; font-size: 20px; margin-bottom: 20px;">VertexAgent Lead Alert</h1>
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 4px 0;"><strong>Name:</strong> ${name}</p>
                <p style="margin: 4px 0;"><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                <p style="margin: 4px 0;"><strong>Email:</strong> ${email || 'Not provided'}</p>
                <p style="margin: 4px 0;"><strong>Property:</strong> ${listing!.address}</p>
              </div>
              <p style="font-weight: bold; margin-bottom: 8px;">Visitor Message:</p>
              <p style="font-style: italic; color: #64748b; background: #fff; padding: 12px; border: 1px dashed #cbd5e1; border-radius: 4px;">
                "${message || 'No message provided.'}"
              </p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                <a href="${window.location.origin}/app/leads?agent=${listing!.ownerId}&listing=${listing!.id}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">View in Dashboard</a>
                <p style="margin-top: 12px; font-size: 10px; color: #94a3b8; font-family: monospace;">Agent Identification Code: ${listing!.ownerId}</p>
              </div>
            </div>
          `,
          text: `New Lead Captured: ${name} for ${listing!.address}. Phone: ${phone}, Email: ${email}`
        }).catch(err => console.error("Lead email failed:", err));
      }

      if (listing!.webhookUrl) {
         fetch(listing!.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              name, phone, email, message, 
              propertyAddress: listing!.address,
              tourUrl: window.location.href 
            })
         }).catch(err => console.error("Webhook failed:", err));
      }

      localStorage.setItem(`checked_in_tour_${listing!.id}`, "true");
      setHasCheckedIn(true);
      toast.success("Thanks! Open House check-in complete. You now have unrestricted access to the AI property guide.");
      setShowLeadForm(false);
      if (attemptedToStart) {
        startSession();
        setAttemptedToStart(false);
      }
    } catch (err) {
      toast.error("Failed to submit lead.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-muted-foreground animate-pulse font-medium">Loading Tour Experience...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-xl text-slate-500">Property not found</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white p-6 text-center">
        <p className="text-red-500 font-bold mb-4">Error: {error}</p>
        <Button onClick={() => window.location.reload()}>Reload Tour</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black text-white relative overflow-y-auto md:overflow-hidden">
      {/* Visual Content - 60% Width */}
      <div className="w-full md:w-[60%] lg:w-[65%] h-[40vh] sm:h-[50vh] md:h-screen relative bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800">
        {listing.images && listing.images.length > 0 ? (
          <img 
            src={typeof listing.images[activeImageIndex] === 'string' ? listing.images[activeImageIndex] : (listing.images[activeImageIndex] as any).url} 
            alt="Property Feature" 
            className="w-full h-full object-cover transition-opacity duration-1000"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://picsum.photos/seed/${listing.id || 'sample'}_${activeImageIndex}/1200/800`;
            }}
          />
        ) : (
          <div className="flex w-full h-full items-center justify-center text-slate-500">
            <Home className="h-24 w-24 opacity-20" />
            <span className="sr-only">No Images Available</span>
          </div>
        )}
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* Agency Logo */}
        <div className="absolute top-6 left-6 z-20">
          {(listing.brokerageLogo && !listing.brokerageLogo.startsWith('blob:')) ? (
            <img src={listing.brokerageLogo} alt="Brokerage Logo" className="h-14 w-auto rounded-lg shadow-md bg-white/20 backdrop-blur-sm p-1.5 border border-white/25 max-w-[150px] object-contain" />
          ) : (agent?.branding?.imageUrl || agent?.branding?.logoUrl) ? (
            <img src={agent.branding.imageUrl || agent.branding.logoUrl} alt="Brokerage Logo" className="h-14 w-auto rounded-lg shadow-md bg-white/20 backdrop-blur-sm p-1.5 border border-white/25 max-w-[150px] object-contain" />
          ) : (
            <div className="h-10 w-24 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-[10px] text-white/70 font-bold border border-white/10">
              LOGO
            </div>
          )}
        </div>
        
        {/* Detail Card Overlay */}
        <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-20 pointer-events-auto">
          <div 
            style={{ backgroundColor: 'rgba(148, 153, 162, 0.45)' }}
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
                  {listing.city}{listing.province ? `, ${listing.province}` : ""}
                </span>
              </div>
            </div>

            {/* Price section and Specs */}
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/15">
              {listing.price !== undefined && (
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-widest text-white/70 font-semibold">Price</span>
                  <span className="text-base sm:text-lg font-bold">${listing.price.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex gap-2 text-xs font-semibold bg-black/10 px-2 py-1 rounded-md border border-white/10">
                {listing.beds !== undefined && (
                  <div className="flex flex-col items-center px-1">
                    <span className="text-[9px] text-white/60 font-medium uppercase tracking-wider">Beds</span>
                    <span>{listing.beds}</span>
                  </div>
                )}
                {listing.beds !== undefined && listing.baths !== undefined && (
                  <div className="h-4.5 border-r border-white/20 self-center" />
                )}
                {listing.baths !== undefined && (
                  <div className="flex flex-col items-center px-1">
                    <span className="text-[9px] text-white/60 font-medium uppercase tracking-wider">Baths</span>
                    <span>{listing.baths}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Clean Open House block inside the card */}
            {(listing.openHouseDate || listing.openHouseTime) && (
              <>
                <style dangerouslySetInnerHTML={{__html: `
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
                `}} />
                <div className="flex items-center gap-2 bg-blue-600/30 backdrop-blur-sm px-2.5 py-1.5 rounded-lg fluctuating-red-white-border">
                  <Sparkles className="h-3.5 w-3.5 text-orange-200 star-flash-brighter flex-shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-blue-200 leading-none mb-0.5">Open House</span>
                    <span className="text-xs font-bold leading-tight text-white">
                      {listing.openHouseDate && (
                        <span>
                          {new Date(listing.openHouseDate + 'T00:00:00').toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </span>
                      )}
                      {listing.openHouseDate && listing.openHouseTime && <span className="mx-1 opacity-60">|</span>}
                      {listing.openHouseTime && <span>{listing.openHouseTime}</span>}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Voice Interaction Panel - 40% Width */}
      <div className="w-full md:w-[40%] lg:w-[35%] flex flex-col h-auto min-h-[50vh] md:h-screen bg-slate-950 p-6 shadow-2xl z-10">
         <div className="flex-1 flex flex-col items-center justify-center">
            {/* Visualizer / Avatar */}
              <div className="relative mb-6 mt-2">
              <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 ${isWelcomingSpeaking || connected ? 'bg-blue-600/70 opacity-100 scale-150 animate-pulse' : 'bg-white/80 opacity-100 scale-125 animate-pulse'}`} />
              <div className={`relative flex h-[110px] w-[110px] items-center justify-center rounded-full border-4 transition-colors ${isWelcomingSpeaking || connected ? 'border-blue-500 bg-slate-900 shadow-[0_0_60px_rgba(59,130,246,0.7)]' : 'border-white bg-slate-900 shadow-[0_0_60px_rgba(255,255,255,0.6)]'}`}>
                <div className="h-[54px] w-[54px] text-white opacity-100 drop-shadow-[0_0_20px_rgba(255,255,255,1)]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="text-center space-y-3 mb-6 w-full max-w-sm px-4">
              <h1 className="text-[26px] font-extrabold tracking-tight text-white mb-4">
                {connected ? trans.listening : (isWelcomingSpeaking ? "Speaking Welcome" : trans.startVoiceTour)}
              </h1>
              
              <div className="space-y-4">
                <p className="text-slate-300 text-sm leading-relaxed font-medium">
                  {connected 
                    ? getListeningInstruction(language) 
                    : trans.experienceGuide}
                </p>

                {!connected && (
                  <WelcomeAudio 
                    language={language} 
                    onSpeakingChange={setIsWelcomingSpeaking} 
                    sources={{
                      en: (listing as any)?.welcome_en || "/audio/welcome_en.mp3",
                      fr: (listing as any)?.welcome_fr || "/audio/welcome_fr.mp3"
                    }}
                  />
                )}
                
                {!connected && (
                   <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                     <p className="text-white font-black text-sm mb-2 tracking-wide">{trans.askMeAbout}</p>
                     <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1.5 text-white font-bold text-[14px] leading-relaxed">
                        {listing.tourDescriptors && listing.tourDescriptors.length > 0 ? (
                          listing.tourDescriptors.map((desc, i) => (
                             <span key={i} className="flex items-center drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                                {localizeDescriptor(desc, language)}
                                {i < (listing.tourDescriptors?.length || 0) - 1 && <span className="ml-2 text-white/40 font-normal">/</span>}
                             </span>
                          ))
                        ) : (
                          <span className="text-white/60 italic font-medium">{trans.defaultKeywords.join(" / ")} / {trans.andMore}</span>
                        )}
                     </div>
                   </div>
                )}
              </div>

              {error && (
                <div className="p-3 mt-4 text-sm text-red-300 bg-red-950/50 rounded-lg border border-red-900/50">
                   {error}
                </div>
              )}
            </div>

            <div className="flex gap-4 items-center">
              {!connected ? (
                <Button 
                  size="lg" 
                  className="rounded-full h-[54px] px-[34px] text-base bg-blue-600 hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all font-semibold"
                  onClick={() => {
                    if (listing?.qrDestination === "sign-in" && !hasCheckedIn) {
                      setAttemptedToStart(true);
                      setShowLeadForm(true);
                      toast.info("Registration Required: Please complete the quick open house sign-in to activate your interactive AI guide!");
                    } else {
                      startSession();
                    }
                  }}
                  disabled={connecting}
                >
                  {connecting ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Mic className="mr-3 h-4 w-4" />}
                  {connecting ? trans.connecting : trans.tapToStart}
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  variant="destructive"
                  className="rounded-full h-[54px] px-[34px] text-base bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all font-semibold flex items-center justify-center"
                  onClick={stopSession}
                  title="Stop and end presentation"
                >
                  <Square className="mr-2 h-4 w-4 fill-white text-white animate-pulse" />
                  <span className="text-white">Stop</span>
                </Button>
              )}
            </div>
         </div>

         {/* Bottom Action bar */}
         <div className="pt-4 mt-auto border-t border-slate-800 space-y-2">
           <span className="text-xs font-bold text-white text-center block mb-1">
             Select a Tour Language
           </span>
           <DropdownMenu>
             <DropdownMenuTrigger className="w-full">
               <div className="flex w-full justify-between items-center bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-3 py-1.5 rounded-md transition-colors text-xs font-medium">
                 <div className="flex items-center gap-2">
                   <Globe className="h-3.5 w-3.5" />
                   {getLanguageDisplay(language)}
                 </div>
                 <span className="text-[10px] text-slate-500 border rounded px-1 py-0.5 bg-slate-950 border-slate-800 text-white">Change</span>
               </div>
             </DropdownMenuTrigger>
             <DropdownMenuContent className="w-full min-w-[260px] bg-slate-900 border-slate-800 text-slate-200 p-0" align="end" side="top">
               <div className="p-2 border-b border-slate-800">
                 <Input 
                   type="text"
                   placeholder="Search language..."
                   className="h-8 text-xs bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   onKeyDown={(e) => e.stopPropagation()}
                   onClick={(e) => e.stopPropagation()}
                 />
               </div>
               <ScrollArea className="h-48 my-1">
                 {SUPPORTED_LANGUAGES.filter(lang => getLanguageDisplay(lang).toLowerCase().includes(searchTerm.toLowerCase())).map(lang => (
                   <DropdownMenuItem 
                     key={lang} 
                     onClick={() => { setLanguage(lang); setSearchTerm(""); }}
                     className={`focus:bg-slate-800 focus:text-white cursor-pointer ${language === lang ? 'bg-slate-800 text-white font-medium' : ''}`}
                   >
                     {getLanguageDisplay(lang)}
                   </DropdownMenuItem>
                 ))}
               </ScrollArea>
             </DropdownMenuContent>
           </DropdownMenu>

           <Button variant="outline" className="w-full h-9 text-xs text-white border-blue-600/30 bg-blue-600/10 hover:bg-white hover:text-black" onClick={() => setShowLeadForm(true)}>
             <PhoneCall className="mr-2 h-3.5 w-3.5" /> Contact Agent
           </Button>
         </div>
      </div>

      <Dialog open={showLeadForm} onOpenChange={setShowLeadForm}>
        <DialogContent className="sm:max-w-md bg-white text-slate-900 border-slate-200">
          <DialogHeader>
            <DialogTitle>{listing?.qrDestination === "sign-in" && !hasCheckedIn ? "Open House Guest Registration" : "Request a Showing"}</DialogTitle>
            <DialogDescription>
              {listing?.qrDestination === "sign-in" && !hasCheckedIn 
                ? "Please register to unlock live voice guidance, expert property walking scripts, and customized rate sheets." 
                : `Interested in ${listing?.address}? Provide your details and the agent will contact you shortly.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLeadSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Full Name *</Label>
                {errors.name && <span className="text-red-600 font-bold text-[10px] uppercase animate-pulse">{errors.name}</span>}
              </div>
              <Input 
                value={name} 
                onChange={e => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                }} 
                onBlur={() => {
                  if (name.trim()) {
                    const formatted = name.trim().split(/\s+/).map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    ).join(" ");
                    setName(formatted);
                    setErrors(prev => ({ ...prev, name: "" }));
                  } else {
                    setErrors(prev => ({ ...prev, name: "Name is required" }));
                  }
                }}
                required 
                placeholder="Jane Doe" 
                className={`bg-slate-50 ${errors.name ? 'border-red-500' : ''}`} 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Phone *</Label>
                {errors.phone && <span className="text-red-600 font-bold text-[10px] uppercase animate-pulse">{errors.phone}</span>}
              </div>
              <Input 
                type="tel" 
                value={phone} 
                required
                onChange={e => {
                  const x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
                  if (x) {
                    setPhone(!x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : ''));
                  }
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
                }} 
                onBlur={() => {
                  const digits = phone.replace(/\D/g, '');
                  if (!phone.trim()) {
                    setErrors(prev => ({ ...prev, phone: "Phone is required" }));
                  } else if (digits.length < 10) {
                    setErrors(prev => ({ ...prev, phone: "Invalid Number" }));
                  } else {
                    setErrors(prev => ({ ...prev, phone: "" }));
                  }
                }}
                placeholder="(555) 123-4567" 
                className={`bg-slate-50 ${errors.phone ? 'border-red-500' : ''}`} 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Email *</Label>
                {errors.email && <span className="text-red-600 font-bold text-[10px] uppercase animate-pulse">{errors.email}</span>}
              </div>
              <Input 
                type="email" 
                value={email} 
                required
                onChange={e => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                }} 
                onBlur={() => {
                  if (email && !email.includes('@')) {
                    setErrors(prev => ({ ...prev, email: "Must contain @" }));
                  } else if (!email) {
                    setErrors(prev => ({ ...prev, email: "Email is required" }));
                  } else {
                    setErrors(prev => ({ ...prev, email: "" }));
                  }
                }}
                placeholder="jane@example.com" 
                className={`bg-slate-50 ${errors.email ? 'border-red-500' : ''}`} 
              />
            </div>
            <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <Label>Message {listing?.qrDestination === "sign-in" ? "(Optional)" : "*"}</Label>
                 {errors.message && <span className="text-red-600 font-bold text-[10px] uppercase animate-pulse">{errors.message}</span>}
               </div>
               <Textarea 
                value={message} 
                required={listing?.qrDestination !== "sign-in"}
                onChange={e => {
                  setMessage(e.target.value);
                  if (errors.message) setErrors(prev => ({ ...prev, message: "" }));
                }} 
                onBlur={() => {
                  if (message.trim()) {
                    const formatted = message.trim().charAt(0).toUpperCase() + message.trim().slice(1);
                    setMessage(formatted);
                    if (listing?.qrDestination !== "sign-in" && formatted.length < 20) {
                      setErrors(prev => ({ ...prev, message: "Min 20 chars" }));
                    } else {
                      setErrors(prev => ({ ...prev, message: "" }));
                    }
                  } else if (listing?.qrDestination !== "sign-in") {
                    setErrors(prev => ({ ...prev, message: "Message is required" }));
                  }
                }}
                placeholder={listing?.qrDestination === "sign-in" ? "Any specific questions for the agent?" : "I would like to schedule a private tour."}
                rows={3} 
                className={`bg-slate-50 ${errors.message ? 'border-red-500' : ''}`} 
               />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting}
              onClick={(e) => {
                let hasError = false;
                const newErrors = { name: "", phone: "", email: "", message: "" };

                if (!name.trim()) { newErrors.name = "Name required"; hasError = true; }
                if (!phone.replace(/\D/g, '')) { newErrors.phone = "Phone required"; hasError = true; }
                else if (phone.replace(/\D/g, '').length < 10) { newErrors.phone = "Invalid Phone"; hasError = true; }
                
                if (!email.trim()) { newErrors.email = "Email required"; hasError = true; }
                else if (!email.includes('@')) { newErrors.email = "Must contain @"; hasError = true; }
                
                if (listing?.qrDestination !== "sign-in") {
                  if (!message.trim()) { newErrors.message = "Message required"; hasError = true; }
                  else if (message.trim().length < 20) { newErrors.message = "Min 20 characters"; hasError = true; }
                }

                if (hasError) {
                  e.preventDefault();
                  setErrors(newErrors);
                  toast.error("Please correct the errors before submitting.");
                }
              }}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
