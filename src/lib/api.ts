import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { db, handleFirestoreError, isQuotaError, OperationType } from "./firebase";

export interface ListingImage {
  url: string;
  name: string;
}

export interface Listing {
  id: string;
  ownerId: string;
  address: string;
  city?: string;
  province?: string;
  postalCode?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  propertyType?: string;
  mlsNumber?: string;
  mlsCountry?: string;
  originatingSystemName?: string;
  country?: string;
  brokerageName?: string;
  brokerageLogo?: string;
  brandingTemplate?: "luxury" | "tech" | "standard";
  qrDestination?: "sign-in" | "microsite" | "tour" | "presentation";
  agentName?: string;
  agentPhone?: string;
  description?: string;
  documents?: { name: string; url: string }[];
  images?: (string | ListingImage)[];
  talkingPoints?: string[];
  webhookUrl?: string;
  voiceId?: string;
  voiceName?: string;
  tourDescriptors?: string[];
  openHouseDate?: string;
  openHouseDateFormat?: string;
  openHouseTime?: string;
  welcome_en?: string;
  welcome_fr?: string;
  welcome_en_script?: string;
  welcome_fr_script?: string;
  welcome_other_lang?: string;
  welcome_other_script?: string;
  voiceEnabled?: boolean;
  multilingualEnabled?: boolean;
  lenderHandoff?: boolean;
  selectedLenderName?: string;
  enforcePhoneGate?: boolean;
  enforceOptInConsent?: boolean;
  status?: "Active" | "Inactive" | "Processing";
  qrBrandingOption?: "logo" | "photo" | "none";
  ctas?: { label: string; action: string }[];
  rooms?: any[];
  qas?: any[];
  publishedAt?: string;
  createdAt: number;
  updatedAt: number;
  isShared?: boolean;
  assignmentContext?: any;
  room_walkthrough_lang?: string;
  qa_knowledge_lang?: string;
  flyerHeroImage?: string;
  excludedPhotos?: string[];
  flyerHeadline?: string;
  flyerSubHeadline?: string;
  flyerDescription?: string;
  flyerCta?: string;
  avatarEnabled?: boolean;
  flyerTemplate?: string;
  flyerAccentColor?: string;
  flyerOrientation?: string;
  flyerTitleFont?: string;
  flyerTitleSize?: string;
  flyerTitleBold?: boolean;
  flyerSubtitleFont?: string;
  flyerSubtitleSize?: string;
  flyerSubtitleBold?: boolean;
  flyerDescriptionFont?: string;
  flyerDescriptionSize?: string;
  flyerDescriptionBold?: boolean;
  flyerCtaFont?: string;
  flyerCtaSize?: string;
  flyerCtaBold?: boolean;
  flyerStatusBadgeText?: string;
  flyerOpenHouseTime?: string;
  flyerIncludeLenderBlock?: boolean;
  flyerLenderName?: string;
  flyerLenderCta?: string;
  flyerShowSecondaryPhotos?: boolean;
  flyerQrBrandingOption?: string;
  flyerQrDest?: string;
  flyerCustomQrUrl?: string;
  flyerAgentNameOverride?: string;
  flyerAgentPhoneOverride?: string;
  flyerBrokerageNameOverride?: string;
  socialShareEnabled?: boolean;
  socialShareTitle?: string;
  socialShareDescription?: string;
  socialShareOptions?: {
    facebook?: boolean;
    instagram?: boolean;
    whatsapp?: boolean;
    textMessage?: boolean;
    email?: boolean;
    copyLink?: boolean;
  };
  askMeAbout?: any[];
}

export interface Lead {
  id: string;
  listingId: string;
  listingAddress: string;
  agentId: string;
  name: string;
  phone?: string;
  email?: string;
  message?: string;
  status?: "New" | "Hot" | "Warm" | "Cold";
  createdAt: number;
  isLaunchSignup?: boolean;
  notes?: string;
  verified?: boolean;
  mortgageInterest?: boolean;
  customAnswers?: any;
  requestedDocs?: string[];
  conversationSummary?: {
    expressedInterests: string[];
    questionsAsked: string[];
    highIntentIndicators: string[];
    formattedSummary: string;
    generatedAt: number;
  };
  // Data Enrichment & Compliance fields
  isVerified?: boolean;
  confidenceScore?: "high" | "medium" | "low" | string;
  occupation?: string;
  employer?: string;
  education?: string;
  socialProfiles?: {
    linkedin?: string;
    facebook?: string;
  };
  waiverAccepted?: boolean;
  waiverVersion?: string;
  isShared?: boolean;
  sharedListingAssignmentId?: string;
  listingOwnerAgentId?: string;
  hostingAgentId?: string;
  capturedByAgentId?: string;
  leadVisibility?: string;
  mortgageConsent?: boolean;
  ipAddress?: string;
  detectedCountry?: string;
  detectedRegion?: string;
  detectedCity?: string;
  geoProvider?: string;
  jurisdictionRulesApplied?: string;
}

export async function generateLeadSummary(params: {
  leadName: string;
  leadMessage?: string;
  listingAddress?: string;
  listingDescription?: string;
  talkingPoints?: string[];
}) {
  const response = await fetch("/api/leads/generate-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to generate AI summary");
  }
  const data = await response.json();
  return data.summary;
}

export async function enrichLeadData(params: {
  name: string;
  email?: string;
  phone?: string;
  waiverAccepted?: boolean;
  waiverVersion?: string;
}) {
  const response = await fetch("/api/leads/enrich", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to enrich lead data");
  }
  const data = await response.json();
  return data.data;
}

export async function updateLead(leadId: string, updates: Partial<Lead>) {
  const path = `leads/${leadId}`;
  try {
    await updateDoc(doc(db, "leads", leadId), updates);
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn(`[Firestore Quota] Updating lead ${leadId} in local storage cache.`);
      try {
        const stored = JSON.parse(localStorage.getItem("local_buffered_leads") || "[]");
        const idx = stored.findIndex((l: any) => l.id === leadId);
        if (idx >= 0) {
          stored[idx] = { ...stored[idx], ...updates };
          localStorage.setItem("local_buffered_leads", JSON.stringify(stored));
        }
      } catch (e) {}
      return;
    }
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function createListing(listing: Listing) {
  const path = `listings/${listing.id}`;
  try {
    await setDoc(doc(db, "listings", listing.id), listing);
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn(`[Firestore Quota] Saving created listing ${listing.id} to local storage buffer.`);
      try {
        const stored = JSON.parse(localStorage.getItem("local_buffered_listings") || "[]");
        localStorage.setItem("local_buffered_listings", JSON.stringify([...stored.filter((l: any) => l.id !== listing.id), listing]));
      } catch (e) {}
      return;
    }
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateListing(listingId: string, updates: Partial<Listing>) {
  const path = `listings/${listingId}`;
  try {
    await setDoc(doc(db, "listings", listingId), updates, { merge: true });
    // Also update local storage buffer if present
    try {
      const stored = JSON.parse(localStorage.getItem("local_buffered_listings") || "[]");
      const idx = stored.findIndex((l: any) => l.id === listingId);
      if (idx >= 0) {
        stored[idx] = { ...stored[idx], ...updates };
        localStorage.setItem("local_buffered_listings", JSON.stringify(stored));
      }
    } catch (e) {}
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn(`[Firestore Quota] Updating listing ${listingId} in local storage cache.`);
      try {
        const stored = JSON.parse(localStorage.getItem("local_buffered_listings") || "[]");
        const idx = stored.findIndex((l: any) => l.id === listingId);
        if (idx >= 0) {
          stored[idx] = { ...stored[idx], ...updates };
          localStorage.setItem("local_buffered_listings", JSON.stringify(stored));
        }
      } catch (e) {}
      return;
    }
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export interface TourConfig {
  voiceId: string;
  ttsModel: string;
  welcomeTexts: Record<string, string>;
  defaultLanguage: string;
  mediaManifest: { key: string; url: string; caption: string }[];
  rooms?: { id: string; name: string; script: string; order: number }[];
  qas?: { question: string; answer: string }[];
  ctas?: { label: string; action: string }[];
  brokerageBranding: {
    logoUrl?: string;
    accentColor?: string;
    backgroundUrl?: string;
    avatarId?: string;
  };
  updatedAt?: number;
}

export const DEFAULT_WELCOME_TEXTS: Record<string, string> = {
  ar: "أهلاً بك! أنا سورا، مساعدتك الذكية في مجال العقارات. شكراً لزيارتك هذا البيت المفتوح. لا تتردد في إلقاء نظرة حولك، واستكشاف الغرف، وطرح أي أسئلة عليّ بخصوص ميزات العقار أو Сعر أو الحي.",
  "zh-CN": "欢迎！我是 Sora，您的房产人工智能助手。感谢您参观本次开放日。请随意看看，探索各个房间，并向我提问有关房产特征、价格或周边的任何问题。",
  "zh-TW": "歡迎！我是 Sora，您的房地產人工智慧助手。感謝您參觀本次開放日。請隨意看看，探索各個房間，並向我提問有關房產特徵、價格或周邊的任何問題。",
  nl: "Welkom! Ik ben Sora, uw vastgoed AI-assistent. Bedankt voor uw bezoek aan dit open huis. Voel u vrij om rond te kijken, de kamers te verkennen en mij vragen te stellen over de kenmerken van de woning, de prijs of de buurt.",
  en: "Welcome! I am Sora, your real estate AI assistant. Thank you for visiting this open house. Please feel free to look around, explore the rooms, and ask me any questions about the property features, pricing, or neighborhood.",
  fr: "Bonjour ! Je suis Sora, votre guide pour cette visite. Je suis ravie de vous accompagner. Avez-vous des questions sur cette propriété ?",
  de: "Willkommen! Ich bin Sora, Ihre Immobilien-KI-Assistentin. Vielen Dank für Ihren Besuch bei diesem Tag der offenen Tür. Bitte schauen Sie sich ungezwungen um, erkunden Sie die Räume und stellen Sie mir Fragen zu den Eigenschaften der Immobilie, dem Preis oder der Nachbarschaft.",
  hi: "स्वागत है! मैं सोरा हूँ, आपकी रियल एस्टेट एआई सहायक। इस ओपन हाउस में आने के लिए धन्यवाद। कृपया बेझिझक चारों ओर देखें, कमरों का अन्веषण करें, और मुझसे संपत्ति की विशेषताओं, कीमत या पड़ोस के बारे में कोई भी प्रश्न पूछें।",
  it: "Benvenuto! Sono Sora, la tua assistente AI immobiliare. Grazie per aver visitato questa casa aperta. Ti invitiamo a guardarti intorno, esplorare le stanze e farmi qualsiasi domanda sulle caratteristiche della proprietà, sul prezzo o sul quartiere.",
  ja: "ようこそ！私は不動産AIアシスタントのSoraです。このオープンハウスにお越しいただきありがとうございます。どうぞご自由に周りを見渡し、お部屋を探索し、物件の特徴や価格、周辺環境について何でもご質問ください。",
  ko: "환영합니다! 저는 귀하의 부동산 AI 어시스턴트인 Sora입니다. 이번 오픈 하우스에 방문해 주셔서 감사합니다. 자유롭게 둘러보시고, 방을 살펴보시며 매물의 특징, 가격 또는 주변 환경에 대해 궁금한 점이 있으시면 언제든지 질문해 주세요.",
  pt: "Bem-vindo! Eu sou Sora, sua assistente de IA imobiliária. Obrigado por visitar esta casa aberta. Sinta-se à vontade para olhar ao redor, explorar os cômodos e me fazer qualquer pergunta sobre as características do imóvel, preço ou vizinhança.",
  ru: "Добро пожаловать! Я Сора, ваш ИИ-помощник по недвижимости. Спасибо, что посетили этот день открытых дверей. Пожалуйста, не стесняйтесь осматриваться, изучать комнаты и задавать мне любые вопросы о характеристиках недвижимости, цене или районе.",
  es: "¡Bienvenido! Soy Sora, su asistente de inteligencia artificial para bienes raíces. Gracias por visitar esta casa abierta. Por favor, siéntase libre de mirar a su alrededor, explorar las habitaciones y hacerme cualquier pregunta sobre las características de la propiedad, el precio o el vecindario.",
  vi: "Chào mừng! Tôi là Sora, trợ lý AI bất động sản của bạn. Cảm ơn bạn đã ghé thăm buổi mở cửa xem nhà này. Xin vui lòng tự nhiên nhìn xung quanh, khám phá các phòng và hỏi tôi bất kỳ câu hỏi nào về các tính năng của bất động sản, giá cả hoặc khu lân cận."
};

export async function getTourConfig(listingId: string): Promise<TourConfig | null> {
  const path = `listings/${listingId}/tourConfig/main`;
  try {
    const docRef = doc(db, "listings", listingId, "tourConfig", "main");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as TourConfig;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

export async function saveTourConfig(listingId: string, data: Partial<TourConfig>) {
  const path = `listings/${listingId}/tourConfig/main`;
  try {
    const docRef = doc(db, "listings", listingId, "tourConfig", "main");
    await setDoc(docRef, {
      ...data,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteListingOp(listingId: string) {
  const path = `listings/${listingId}`;
  try {
    await deleteDoc(doc(db, "listings", listingId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function getListingBasic(listingId: string): Promise<Pick<Listing, "id" | "address" | "ownerId" | "city" | "province" | "price" | "beds" | "baths" | "images" | "openHouseDate" | "openHouseTime" | "qrDestination" | "country" | "welcome_en" | "welcome_fr" | "tourDescriptors"> | null> {
  if (listingId === "pilot-listing-01") {
    const full = await getListing(listingId);
    if (full) {
      return {
        id: full.id,
        address: full.address,
        ownerId: full.ownerId,
        city: full.city,
        province: full.province,
        price: full.price,
        beds: full.beds,
        baths: full.baths,
        images: full.images,
        openHouseDate: full.openHouseDate,
        openHouseTime: full.openHouseTime,
        qrDestination: full.qrDestination,
        country: full.country,
        welcome_en: full.welcome_en,
        welcome_fr: full.welcome_fr,
        tourDescriptors: full.tourDescriptors || []
      };
    }
    return null;
  }
  const path = `listings/${listingId}`;
  try {
    const d = await getDoc(doc(db, "listings", listingId));
    if (d.exists()) {
      const data = d.data() as Listing;
      return {
        id: data.id,
        address: data.address,
        ownerId: data.ownerId,
        city: data.city,
        province: data.province,
        price: data.price,
        beds: data.beds,
        baths: data.baths,
        images: data.images,
        openHouseDate: data.openHouseDate,
        openHouseTime: data.openHouseTime,
        qrDestination: data.qrDestination,
        country: data.country,
        welcome_en: data.welcome_en,
        welcome_fr: data.welcome_fr,
        tourDescriptors: data.tourDescriptors || []
      };
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function getListing(listingId: string): Promise<Listing | null> {
  if (listingId === "pilot-listing-01") {
    const path = `properties/pilot-listing-01`;
    try {
      const pDoc = await getDoc(doc(db, "properties", "pilot-listing-01"));
      if (pDoc.exists()) {
        const pData = pDoc.data();
        const mappedData: Listing = {
          id: "pilot-listing-01",
          ownerId: pData.agentUid || "HTzvSsD3bqOzfuGLQs0MFEJmUQA2",
          address: pData.address || "Pilot Property Address",
          city: pData.city || "Hamilton",
          province: pData.province || "ON",
          postalCode: pData.postalCode || "",
          price: pData.listPrice ?? pData.price,
          beds: pData.bedrooms ?? pData.beds,
          baths: pData.bathrooms ?? pData.baths,
          sqft: pData.squareFeet ?? pData.sqft,
          propertyType: pData.propertyType || "Residential",
          mlsNumber: pData.mlsNumber || "",
          description: pData.description || "",
          talkingPoints: pData.features || pData.talkingPoints || [],
          avatarEnabled: pData.avatarEnabled ?? true,
          qrDestination: pData.qrDestination || "tour",
          status: pData.status || "Active",
          images: pData.images || [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"
          ],
          welcome_en: pData.welcome_en || "/audio/welcome_en.mp3",
          welcome_fr: pData.welcome_fr || "",
          createdAt: pData.createdAt || Date.now(),
          updatedAt: pData.updatedAt || Date.now()
        };
        return mappedData;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }
  const path = `listings/${listingId}`;
  try {
    const fetchDoc = getDoc(doc(db, "listings", listingId));
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
    const d = await Promise.race([fetchDoc, timeout]) as any;

    if (d && typeof d.exists === "function" && d.exists()) {
      const data = d.data() as Listing;
      // Cache locally for offline/quota fast load
      try {
        const stored = JSON.parse(localStorage.getItem("local_buffered_listings") || "[]");
        const filtered = stored.filter((l: any) => l.id !== listingId);
        localStorage.setItem("local_buffered_listings", JSON.stringify([...filtered, data]));
      } catch (e) {}
      return data;
    }

    // Check local storage buffer if doc not found or timed out in Firestore
    try {
      const stored = JSON.parse(localStorage.getItem("local_buffered_listings") || "[]");
      const found = stored.find((l: any) => l.id === listingId);
      if (found) return found;
    } catch (e) {}
    return null;
  } catch (err) {
    console.warn("[getListing] Error fetching from Firestore, checking local storage cache:", err);
    try {
      const stored = JSON.parse(localStorage.getItem("local_buffered_listings") || "[]");
      const found = stored.find((l: any) => l.id === listingId);
      if (found) return found;
    } catch (e) {}
    return null;
  }
}

export async function getAgent(userId: string) {
  const path = `users/${userId}`;
  try {
    const d = await getDoc(doc(db, "users", userId));
    if (d.exists()) {
      return d.data();
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function getTeamMembers(brokerageName: string) {
  const path = "users";
  try {
    const q = brokerageName
      ? query(collection(db, path), where("brokerage", "==", brokerageName))
      : query(collection(db, path));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function updateUser(userId: string, updates: any) {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, "users", userId), updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function getUserListings(userId: string): Promise<Listing[]> {
  const path = "listings";
  const getLocal = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("local_buffered_listings") || "[]");
      return stored.filter((l: any) => l.ownerId === userId);
    } catch (e) {
      return [];
    }
  };

  try {
    const q = query(collection(db, path), where("ownerId", "==", userId));
    const fetchSnap = getDocs(q);
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
    const snapshot = await Promise.race([fetchSnap, timeout]) as any;

    if (!snapshot || !snapshot.docs) {
      return getLocal();
    }
    const listings = snapshot.docs.map((doc: any) => doc.data() as Listing);
    if (listings.length > 0) {
      try {
        const stored = JSON.parse(localStorage.getItem("local_buffered_listings") || "[]");
        const existingIds = new Set(listings.map((l: Listing) => l.id));
        const remaining = stored.filter((l: any) => !existingIds.has(l.id));
        localStorage.setItem("local_buffered_listings", JSON.stringify([...remaining, ...listings]));
      } catch (e) {}
    }
    return listings;
  } catch (err) {
    console.warn("[getUserListings] Error or timeout, checking local storage:", err);
    return getLocal();
  }
}

export async function getAllListings(): Promise<Listing[]> {
  const path = "listings";
  const getLocal = () => {
    try {
      return JSON.parse(localStorage.getItem("local_buffered_listings") || "[]");
    } catch (e) {
      return [];
    }
  };

  try {
    const q = query(collection(db, path));
    const fetchSnap = getDocs(q);
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
    const snapshot = await Promise.race([fetchSnap, timeout]) as any;

    if (!snapshot || !snapshot.docs) {
      return getLocal();
    }
    const listings = snapshot.docs.map((doc: any) => doc.data() as Listing);
    if (listings.length > 0) {
      try {
        const stored = JSON.parse(localStorage.getItem("local_buffered_listings") || "[]");
        const existingIds = new Set(listings.map((l: Listing) => l.id));
        const remaining = stored.filter((l: any) => !existingIds.has(l.id));
        localStorage.setItem("local_buffered_listings", JSON.stringify([...remaining, ...listings]));
      } catch (e) {}
    }
    return listings;
  } catch (err) {
    console.warn("[getAllListings] Error or timeout, checking local storage:", err);
    return getLocal();
  }
}

export interface OpenHouseSession {
  session_id: string;
  listing_id: string;
  start_datetime: string; // ISO String in UTC
  end_datetime: string; // ISO String in UTC
  status: "scheduled" | "completed";
  created_by: string;
  created_at: number;
  updated_at: number;
}

export function parseDateTimeToUTC(dateStr: string, timeRangeStr: string): { start: string; end: string } {
  if (!dateStr) {
    const defaultStart = new Date().toISOString();
    const defaultEnd = new Date(Date.now() + 3 * 3600 * 1000).toISOString();
    return { start: defaultStart, end: defaultEnd };
  }
  
  let startTime = "09:00";
  let endTime = "12:00";
  if (timeRangeStr) {
    const parts = timeRangeStr.split("-");
    if (parts[0]) {
      const parsedStart = parseTimeString(parts[0].trim());
      if (parsedStart) startTime = parsedStart;
    }
    if (parts[1]) {
      const parsedEnd = parseTimeString(parts[1].trim());
      if (parsedEnd) endTime = parsedEnd;
    }
  }
  
  const startObj = new Date(`${dateStr}T${startTime}:00`);
  const endObj = new Date(`${dateStr}T${endTime}:00`);
  
  return {
    start: isNaN(startObj.getTime()) ? new Date().toISOString() : startObj.toISOString(),
    end: isNaN(endObj.getTime()) ? new Date(Date.now() + 3 * 3600 * 1000).toISOString() : endObj.toISOString()
  };
}

function parseTimeString(timeStr: string): string | null {
  // First match H:MM AM/PM or H:MM
  let match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const ampm = match[3];
    
    if (ampm) {
      if (ampm.toUpperCase() === "PM" && hours < 12) {
        hours += 12;
      } else if (ampm.toUpperCase() === "AM" && hours === 12) {
        hours = 0;
      }
    }
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }
  
  // Otherwise match H AM/PM or H
  match = timeStr.match(/(\d+)\s*(AM|PM)?/i);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = "00";
    const ampm = match[2];
    
    if (ampm) {
      if (ampm.toUpperCase() === "PM" && hours < 12) {
        hours += 12;
      } else if (ampm.toUpperCase() === "AM" && hours === 12) {
        hours = 0;
      }
    }
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }
  
  return null;
}

export async function createOpenHouseSession(session: Omit<OpenHouseSession, "status">): Promise<OpenHouseSession> {
  const path = "open_house_sessions";
  try {
    const now = new Date().toISOString();
    const status = now < session.end_datetime ? "scheduled" : "completed";
    const fullSession: OpenHouseSession = {
      ...session,
      status,
      updated_at: Date.now()
    };
    await setDoc(doc(db, path, session.session_id), fullSession);
    return fullSession;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function getOpenHouseSessions(listingId?: string): Promise<OpenHouseSession[]> {
  const path = "open_house_sessions";
  try {
    let q;
    if (listingId) {
      q = query(collection(db, path), where("listing_id", "==", listingId));
    } else {
      q = query(collection(db, path));
    }
    const fetchSnap = getDocs(q);
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
    const snapshot = await Promise.race([fetchSnap, timeout]) as any;

    if (!snapshot || !snapshot.docs) {
      return [];
    }

    const now = new Date().toISOString();
    return snapshot.docs.map((doc: any) => {
      const data = doc.data() as OpenHouseSession;
      const computedStatus = now < data.end_datetime ? "scheduled" : "completed";
      return {
        ...data,
        status: computedStatus
      };
    });
  } catch (err) {
    console.warn("[getOpenHouseSessions] Failed or timed out:", err);
    return [];
  }
}

export async function updateOpenHouseSession(sessionId: string, updates: Partial<OpenHouseSession>) {
  const path = "open_house_sessions";
  try {
    const docRef = doc(db, path, sessionId);
    await updateDoc(docRef, {
      ...updates,
      updated_at: Date.now()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteOpenHouseSession(sessionId: string) {
  const path = "open_house_sessions";
  try {
    await deleteDoc(doc(db, path, sessionId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function routeLeadToCRM(listing: Listing, lead: Lead) {
  if (!listing.webhookUrl) return;
  try {
    const response = await fetch(listing.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "new_lead",
        lead,
        listing: { address: listing.address, id: listing.id }
      })
    });
    console.log(`[CRM Routing] Webhook sent to ${listing.webhookUrl}:`, response.status);
  } catch (err) {
    console.error("[CRM Routing] Failed to send webhook:", err);
  }
}

export async function createLead(listingId: string, lead: Lead) {
  try {
    // Save to local storage buffer first as guaranteed fallback
    try {
      const stored = JSON.parse(localStorage.getItem("local_buffered_leads") || "[]");
      localStorage.setItem("local_buffered_leads", JSON.stringify([...stored.filter((l: any) => l.id !== lead.id), lead]));
    } catch (e) {}

    let listingData: Listing | null = null;
    if (listingId !== "DEMO_SIGNUP") {
      // Ensure we have listing details
      try {
        const listingDoc = await getDoc(doc(db, "listings", listingId));
        if (listingDoc.exists()) {
          listingData = listingDoc.data() as Listing;
          lead.agentId = listingData.ownerId;
          lead.listingAddress = listingData.address;
          
          // Auto-generate AI lead summary on creation
          try {
            const summary = await generateLeadSummary({
              leadName: lead.name,
              leadMessage: lead.message,
              listingAddress: listingData.address,
              listingDescription: listingData.description,
              talkingPoints: listingData.talkingPoints
            });
            lead.conversationSummary = {
              ...summary,
              generatedAt: Date.now()
            };
          } catch (summaryErr) {
            console.error("Auto-generating lead summary failed on creation:", summaryErr);
          }
          
          // Save to listing subcollection
          await setDoc(doc(db, "listings", listingId, "leads", lead.id), lead);

          // CRM Routing
          routeLeadToCRM(listingData, lead);
        }
      } catch (subErr) {
        if (isQuotaError(subErr)) {
          console.warn("[Firestore Quota] Quota reached saving lead to listing subcollection. Preserved in local buffer.");
        }
      }
    } else {
      lead.isLaunchSignup = true;
    }
    
    // Save to global collection (agent/admin-accessible)
    await setDoc(doc(db, "leads", lead.id), lead);
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn(`[Firestore Quota] Quota limit reached creating lead ${lead.id}. Preserved in local storage buffer.`);
      return;
    }
    handleFirestoreError(err, OperationType.CREATE, `leads/${lead.id}`);
  }
}

export async function getUserLeads(userId: string): Promise<Lead[]> {
  const path = "leads";
  const getLocal = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("local_buffered_leads") || "[]");
      return stored.filter((l: any) => l.agentId === userId || !l.agentId);
    } catch (e) {
      return [];
    }
  };

  try {
    const q = query(collection(db, path), where("agentId", "==", userId));
    const fetchSnap = getDocs(q);
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
    const snapshot = await Promise.race([fetchSnap, timeout]) as any;

    if (!snapshot || !snapshot.docs) {
      return getLocal();
    }
    const leads = snapshot.docs.map((doc: any) => doc.data() as Lead);
    if (leads.length > 0) {
      try {
        const stored = JSON.parse(localStorage.getItem("local_buffered_leads") || "[]");
        const existingIds = new Set(leads.map((l: Lead) => l.id));
        const remaining = stored.filter((l: any) => !existingIds.has(l.id));
        localStorage.setItem("local_buffered_leads", JSON.stringify([...remaining, ...leads]));
      } catch (e) {}
    }
    return leads;
  } catch (err) {
    console.warn("[getUserLeads] Error or timeout, checking local storage:", err);
    return getLocal();
  }
}

export async function getLead(leadId: string): Promise<Lead | null> {
  const path = `leads/${leadId}`;
  try {
    const fetchDoc = getDoc(doc(db, "leads", leadId));
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
    const d = await Promise.race([fetchDoc, timeout]) as any;

    if (d && typeof d.exists === "function" && d.exists()) {
      return d.data() as Lead;
    }
    try {
      const stored = JSON.parse(localStorage.getItem("local_buffered_leads") || "[]");
      const found = stored.find((l: any) => l.id === leadId);
      if (found) return found;
    } catch (e) {}
    return null;
  } catch (err) {
    console.warn("[getLead] Error fetching lead:", err);
    try {
      const stored = JSON.parse(localStorage.getItem("local_buffered_leads") || "[]");
      const found = stored.find((l: any) => l.id === leadId);
      if (found) return found;
    } catch (e) {}
    return null;
  }
}

export async function getListingLeads(listingId: string): Promise<Lead[]> {
  const path = `listings/${listingId}/leads`;
  const getLocal = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("local_buffered_leads") || "[]");
      return stored.filter((l: any) => l.listingId === listingId);
    } catch (e) {
      return [];
    }
  };

  try {
    const q = query(collection(db, "listings", listingId, "leads"));
    const fetchSnap = getDocs(q);
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
    const snapshot = await Promise.race([fetchSnap, timeout]) as any;

    if (!snapshot || !snapshot.docs) {
      return getLocal();
    }
    return snapshot.docs.map((doc: any) => doc.data() as Lead);
  } catch (err) {
    console.warn("[getListingLeads] Error fetching listing leads:", err);
    return getLocal();
  }
}

export interface EmailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(payload: EmailPayload) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send email");
    }

    return await response.json();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error("Email request timed out. Please check your SMTP settings.");
    }
    console.error("sendEmail error:", err);
    throw err;
  }
}

export async function getGlobalPromptSettings() {
  try {
    const d = await getDoc(doc(db, "settings", "global_prompt"));
    if (d.exists()) {
      return d.data();
    }
  } catch (err) {
    console.error("Error fetching global prompt settings:", err);
  }
  return null;
}

export async function saveGlobalPromptSettings(settings: { prompt?: string; password?: string }) {
  try {
    await setDoc(doc(db, "settings", "global_prompt"), settings, { merge: true });
  } catch (err) {
    console.error("Error saving global prompt settings:", err);
  }
}

export interface VoiceNote {
  id: string;
  propertyId: string;
  userId: string;
  userName: string;
  roleType: 'buyer' | 'agent';
  voiceNoteType: 'private' | 'team' | 'user-to-agent';
  durationSeconds: number;
  transcript: string;
  audioUrl: string;
  createdAt: number;
  visibility: 'private' | 'team' | 'lead';
  abuseFlagged?: boolean;
  moderationStatus?: 'approved' | 'pending_review' | 'flagged';
  room?: string;
}

export async function getVoiceNotes(propertyId: string): Promise<VoiceNote[]> {
  try {
    const q = query(collection(db, "voice_notes"), where("propertyId", "==", propertyId));
    const snap = await getDocs(q);
    const notes: VoiceNote[] = [];
    snap.forEach((docSnap) => {
      notes.push({ id: docSnap.id, ...docSnap.data() } as VoiceNote);
    });
    return notes.sort((a,b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error("Error fetching voice notes: ", err);
    // Return empty array instead of letting the app fail
    return [];
  }
}

export async function createVoiceNote(note: Omit<VoiceNote, "id">): Promise<VoiceNote> {
  const id = crypto.randomUUID();
  const path = `voice_notes/${id}`;
  try {
    const docRef = doc(db, "voice_notes", id);
    await setDoc(docRef, { ...note, id });
    return { ...note, id };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function deleteVoiceNote(noteId: string, propertyId: string): Promise<void> {
  const path = `voice_notes/${noteId}`;
  try {
    const docRef = doc(db, "voice_notes", noteId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function finishTourAndGetNotes(params: {
  propertyId: string;
  visitorEmail: string;
  visitorName: string;
  chatLogs?: any[];
}) {
  const response = await fetch("/api/tour/finish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to finish tour & compile notes");
  }
  return await response.json();
}


