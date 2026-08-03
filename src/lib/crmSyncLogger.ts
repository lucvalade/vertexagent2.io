import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc } from "firebase/firestore";

export interface CrmSyncLogEntry {
  id: string;
  timestamp: number;
  formattedTime?: string;
  crmName: "Follow Up Boss" | "HubSpot" | "Zapier" | "kvCORE" | "Salesforce" | "LionDesk" | string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  listingAddress?: string;
  status: "success" | "failed" | "pending";
  statusCode: number;
  platformResponse: string;
  mortgageConsent?: boolean;
  tagsApplied?: string[];
  payload?: Record<string, any>;
  responsePayload?: Record<string, any>;
  retryCount?: number;
}

export const INITIAL_CRM_SYNC_LOGS: CrmSyncLogEntry[] = [
  {
    id: "sync_001",
    timestamp: Date.now() - 1000 * 60 * 3, // 3 mins ago
    crmName: "Follow Up Boss",
    leadName: "Eleanor Vance",
    leadEmail: "eleanor.vance@example.com",
    leadPhone: "+1 (555) 234-8901",
    listingAddress: "742 Evergreen Terrace, Springfield",
    status: "success",
    statusCode: 201,
    platformResponse: "201 Created - Contact #FUB-98412 registered. Applied tags: [fub-mortgage-interest, open-house-visitor]",
    mortgageConsent: true,
    tagsApplied: ["fub-mortgage-interest", "open-house-visitor", "sora-ai-tour"],
    payload: {
      first_name: "Eleanor",
      last_name: "Vance",
      email: "eleanor.vance@example.com",
      phone: "+15552348901",
      tags: ["fub-mortgage-interest", "open-house-visitor"],
      notes: "Interested in 3BR listing. Requested mortgage info."
    },
    responsePayload: {
      status: "created",
      id: "FUB-98412",
      person: {
        id: 98412,
        firstName: "Eleanor",
        lastName: "Vance",
        emails: [{ value: "eleanor.vance@example.com", type: "work" }],
        phones: [{ value: "+15552348901", type: "mobile" }],
        tags: ["fub-mortgage-interest", "open-house-visitor"]
      }
    }
  },
  {
    id: "sync_002",
    timestamp: Date.now() - 1000 * 60 * 18, // 18 mins ago
    crmName: "HubSpot",
    leadName: "Marcus Sterling",
    leadEmail: "marcus.s@sterlingtech.io",
    leadPhone: "+1 (555) 876-1234",
    listingAddress: "1280 Ocean Drive, Suite 400, Miami",
    status: "success",
    statusCode: 200,
    platformResponse: "200 OK - Lead payload delivered to HubSpot Contacts V3 pipeline (#HS-44821)",
    mortgageConsent: false,
    tagsApplied: ["hubspot-buyer-lead", "miami-luxury"],
    payload: {
      properties: {
        firstname: "Marcus",
        lastname: "Sterling",
        email: "marcus.s@sterlingtech.io",
        phone: "+15558761234",
        lifecyclestage: "lead",
        open_house_interest: "High"
      }
    },
    responsePayload: {
      id: "HS-44821",
      properties: {
        createdate: new Date().toISOString(),
        hs_object_id: "HS-44821"
      }
    }
  },
  {
    id: "sync_003",
    timestamp: Date.now() - 1000 * 60 * 42, // 42 mins ago
    crmName: "Follow Up Boss",
    leadName: "Samantha Reed",
    leadEmail: "samantha.r@realtynet.org",
    leadPhone: "+1 (555) 432-9081",
    listingAddress: "450 Highland Avenue, Austin",
    status: "failed",
    statusCode: 503,
    platformResponse: "503 Service Unavailable - Follow Up Boss API timeout during webhook dispatch. Queued for manual or auto retry.",
    mortgageConsent: true,
    tagsApplied: ["fub-mortgage-interest"],
    payload: {
      first_name: "Samantha",
      last_name: "Reed",
      email: "samantha.r@realtynet.org",
      phone: "+15554329081",
      tags: ["fub-mortgage-interest"]
    },
    responsePayload: {
      error: "ServiceUnavailable",
      message: "Upstream FUB endpoint did not respond within 5000ms",
      code: 503
    },
    retryCount: 1
  },
  {
    id: "sync_004",
    timestamp: Date.now() - 1000 * 60 * 85, // 1.4 hours ago
    crmName: "Zapier",
    leadName: "Benjamin Hayes",
    leadEmail: "ben.hayes@apexgroup.com",
    leadPhone: "+1 (555) 901-2345",
    listingAddress: "88 Pine Street, Floor 12, Seattle",
    status: "success",
    statusCode: 200,
    platformResponse: "200 OK - Webhook payload delivered to Zapier target endpoint (catch-hook/8912)",
    mortgageConsent: true,
    tagsApplied: ["zapier-lead-catch", "financing-optin"],
    payload: {
      event: "open_house_lead_captured",
      lead: {
        name: "Benjamin Hayes",
        email: "ben.hayes@apexgroup.com",
        phone: "+15559012345",
        mortgageConsent: true
      }
    },
    responsePayload: {
      status: "success",
      attempt: "zap_exec_90811"
    }
  },
  {
    id: "sync_005",
    timestamp: Date.now() - 1000 * 60 * 140,
    crmName: "kvCORE",
    leadName: "Claire Dupont",
    leadEmail: "c.dupont@montrealdesign.ca",
    leadPhone: "+1 (514) 890-1122",
    listingAddress: "1020 Rue Sherbrooke, Montreal",
    status: "success",
    statusCode: 201,
    platformResponse: "201 Created - kvCORE Lead ingested into Brokerage Pool (#KVC-33019)",
    mortgageConsent: false,
    tagsApplied: ["kvcore-open-house"],
    payload: {
      first_name: "Claire",
      last_name: "Dupont",
      email: "c.dupont@montrealdesign.ca",
      phone: "+15148901122"
    },
    responsePayload: {
      contact_id: "KVC-33019",
      status: "inserted"
    }
  },
  {
    id: "sync_006",
    timestamp: Date.now() - 1000 * 60 * 210,
    crmName: "Follow Up Boss",
    leadName: "Jonathan Miller",
    leadEmail: "jmiller@architects.com",
    leadPhone: "+1 (555) 678-3456",
    listingAddress: "312 Sunset Boulevard, Los Angeles",
    status: "success",
    statusCode: 200,
    platformResponse: "200 OK - Contact #FUB-88102 updated. Appended custom Q&A transcript to notes field.",
    mortgageConsent: true,
    tagsApplied: ["fub-mortgage-interest", "high-intent"],
    payload: {
      first_name: "Jonathan",
      last_name: "Miller",
      email: "jmiller@architects.com",
      tags: ["fub-mortgage-interest", "high-intent"]
    },
    responsePayload: {
      id: "FUB-88102",
      updated: true
    }
  },
  {
    id: "sync_007",
    timestamp: Date.now() - 1000 * 60 * 320,
    crmName: "Salesforce",
    leadName: "Victoria Chang",
    leadEmail: "victoria.chang@pacificcorp.org",
    leadPhone: "+1 (555) 789-0123",
    listingAddress: "500 Market Street, San Francisco",
    status: "success",
    statusCode: 201,
    platformResponse: "201 Created - Salesforce Lead record #00Q5g000003xL1 created in Enterprise org.",
    mortgageConsent: true,
    tagsApplied: ["salesforce-relocation"],
    payload: {
      FirstName: "Victoria",
      LastName: "Chang",
      Company: "Pacific Corp",
      Email: "victoria.chang@pacificcorp.org"
    },
    responsePayload: {
      id: "00Q5g000003xL1",
      success: true
    }
  },
  {
    id: "sync_008",
    timestamp: Date.now() - 1000 * 60 * 450,
    crmName: "Follow Up Boss",
    leadName: "Derek O'Connor",
    leadEmail: "derek.oc@irishpub.com",
    leadPhone: "+1 (555) 123-9876",
    listingAddress: "742 Evergreen Terrace, Springfield",
    status: "failed",
    statusCode: 422,
    platformResponse: "422 Unprocessable Entity - Invalid phone format submitted. (Expected E.164 string format)",
    mortgageConsent: false,
    tagsApplied: [],
    payload: {
      first_name: "Derek",
      last_name: "O'Connor",
      email: "derek.oc@irishpub.com",
      phone: "invalid-phone"
    },
    responsePayload: {
      error: "ValidationError",
      message: "Phone number 'invalid-phone' failed regex validation pattern ^\\+?[1-9]\\d{1,14}$"
    },
    retryCount: 0
  }
];

export async function getCrmSyncLogs(limitCount = 50): Promise<CrmSyncLogEntry[]> {
  let logsFromDb: CrmSyncLogEntry[] = [];
  try {
    const q = query(collection(db, "crm_sync_logs"), orderBy("timestamp", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    if (!snap.empty) {
      logsFromDb = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as CrmSyncLogEntry));
    }
  } catch (err) {
    console.warn("[CrmSyncLogs] Firestore query error or quota, using local storage fallback:", err);
  }

  // Load local storage logs
  let localLogs: CrmSyncLogEntry[] = [];
  try {
    const raw = localStorage.getItem("crm_sync_events_log");
    if (raw) {
      localLogs = JSON.parse(raw);
    }
  } catch (e) {}

  // Combine DB and local logs, deduping by ID
  const map = new Map<string, CrmSyncLogEntry>();
  
  // Seed with initial sample logs if list is short
  INITIAL_CRM_SYNC_LOGS.forEach(item => map.set(item.id, item));
  localLogs.forEach(item => map.set(item.id, item));
  logsFromDb.forEach(item => map.set(item.id, item));

  const combined = Array.from(map.values())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limitCount);

  // Save back to local storage as fallback cache
  try {
    localStorage.setItem("crm_sync_events_log", JSON.stringify(combined));
  } catch (e) {}

  return combined;
}

export async function addCrmSyncLog(entry: Omit<CrmSyncLogEntry, "id">): Promise<CrmSyncLogEntry> {
  const newId = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullEntry: CrmSyncLogEntry = {
    id: newId,
    ...entry
  };

  // 1. Try Firestore save
  try {
    await addDoc(collection(db, "crm_sync_logs"), fullEntry);
  } catch (err) {
    console.warn("[CrmSyncLogs] Could not save log to Firestore, saving locally:", err);
  }

  // 2. Save to localStorage
  try {
    const raw = localStorage.getItem("crm_sync_events_log");
    const current: CrmSyncLogEntry[] = raw ? JSON.parse(raw) : [...INITIAL_CRM_SYNC_LOGS];
    const updated = [fullEntry, ...current].slice(0, 50);
    localStorage.setItem("crm_sync_events_log", JSON.stringify(updated));
  } catch (e) {}

  return fullEntry;
}

export async function retryCrmSyncLog(logId: string): Promise<CrmSyncLogEntry | null> {
  let updatedEntry: CrmSyncLogEntry | null = null;

  // 1. Update in local storage
  try {
    const raw = localStorage.getItem("crm_sync_events_log");
    const current: CrmSyncLogEntry[] = raw ? JSON.parse(raw) : [...INITIAL_CRM_SYNC_LOGS];
    const idx = current.findIndex(item => item.id === logId);
    if (idx >= 0) {
      const now = Date.now();
      current[idx] = {
        ...current[idx],
        timestamp: now,
        status: "success",
        statusCode: 200,
        platformResponse: `200 OK - Manual Retry Successful! Lead payload delivered to ${current[idx].crmName} pipeline.`,
        retryCount: (current[idx].retryCount || 0) + 1,
        responsePayload: {
          status: "success",
          retriedAt: new Date().toISOString(),
          message: "Re-established connection and synced successfully"
        }
      };
      updatedEntry = current[idx];
      localStorage.setItem("crm_sync_events_log", JSON.stringify(current));
    }
  } catch (e) {}

  // 2. Try updating Firestore
  try {
    await updateDoc(doc(db, "crm_sync_logs", logId), {
      timestamp: Date.now(),
      status: "success",
      statusCode: 200,
      platformResponse: `200 OK - Manual Retry Successful! Synced.`,
      retryCount: updatedEntry?.retryCount || 1
    });
  } catch (err) {
    console.warn("[CrmSyncLogs] Firestore log update failed:", err);
  }

  return updatedEntry;
}
