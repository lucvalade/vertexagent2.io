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
  agentName?: string;
  agentPhone?: string;
  description?: string;
  images?: (string | ListingImage)[];
  talkingPoints?: string[];
  webhookUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  message?: string;
  createdAt: number;
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

export async function createLead(listingId: string, lead: Lead) {
  const path = `listings/${listingId}/leads/${lead.id}`;
  try {
    await setDoc(doc(db, "listings", listingId, "leads", lead.id), lead);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
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
