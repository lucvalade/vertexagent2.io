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
  originatingSystemName?: string;
  country?: string;
  brokerageName?: string;
  brokerageLogo?: string;
  brandingTemplate?: "luxury" | "tech" | "standard";
  qrDestination?: "sign-in" | "microsite" | "tour";
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
  ctas?: { label: string; action: string }[];
  createdAt: number;
  updatedAt: number;
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

export async function getListing(listingId: string): Promise<Listing | null> {
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

