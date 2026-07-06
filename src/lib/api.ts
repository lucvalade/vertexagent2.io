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
import { db, handleFirestoreError, OperationType } from "./firebase";

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
  socialShareOptions?: {
    facebook?: boolean;
    instagram?: boolean;
    whatsapp?: boolean;
    textMessage?: boolean;
    email?: boolean;
    copyLink?: boolean;
  };
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
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function createListing(listing: Listing) {
  const path = `listings/${listing.id}`;
  try {
    await setDoc(doc(db, "listings", listing.id), listing);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateListing(listingId: string, updates: Partial<Listing>) {
  const path = `listings/${listingId}`;
  try {
    await updateDoc(doc(db, "listings", listingId), updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
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

export async function getListingBasic(listingId: string): Promise<Pick<Listing, "id" | "address" | "ownerId" | "city" | "province" | "price" | "beds" | "baths" | "images" | "openHouseDate" | "openHouseTime" | "qrDestination" | "country" | "welcome_en" | "welcome_fr"> | null> {
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
        welcome_fr: full.welcome_fr
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
        welcome_fr: data.welcome_fr
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
    const d = await getDoc(doc(db, "listings", listingId));
    if (d.exists()) {
      return d.data() as Listing;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
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
  try {
    const q = query(collection(db, path), where("ownerId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Listing);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getAllListings(): Promise<Listing[]> {
  const path = "listings";
  try {
    const q = query(collection(db, path));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Listing);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
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
    const snapshot = await getDocs(q);
    const now = new Date().toISOString();
    return snapshot.docs.map(doc => {
      const data = doc.data() as OpenHouseSession;
      const computedStatus = now < data.end_datetime ? "scheduled" : "completed";
      return {
        ...data,
        status: computedStatus
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
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
    let listingData: Listing | null = null;
    if (listingId !== "DEMO_SIGNUP") {
      // Ensure we have listing details
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
    } else {
      lead.isLaunchSignup = true;
    }
    
    // Save to global collection (agent/admin-accessible)
    await setDoc(doc(db, "leads", lead.id), lead);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `leads/${lead.id}`);
  }
}

export async function getUserLeads(userId: string): Promise<Lead[]> {
  const path = "leads";
  try {
    const q = query(collection(db, path), where("agentId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Lead);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function getLead(leadId: string): Promise<Lead | null> {
  const path = `leads/${leadId}`;
  try {
    const d = await getDoc(doc(db, "leads", leadId));
    if (d.exists()) {
      return d.data() as Lead;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function getListingLeads(listingId: string): Promise<Lead[]> {
  const path = `listings/${listingId}/leads`;
  try {
    const q = query(collection(db, "listings", listingId, "leads"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Lead);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
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


