import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export type EventType = 
  | "sign_in" 
  | "tour_started" 
  | "microsite_visited" 
  | "document_sent" 
  | "lead_followup_sent";

export const trackEvent = async (eventName: EventType, data: Record<string, any>) => {
  try {
    await addDoc(collection(db, "analytics"), {
      eventName,
      ...data,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Failed to track event:", err);
  }
};
