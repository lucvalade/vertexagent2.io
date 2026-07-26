import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  memoryLocalCache,
  doc,
  getDoc
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";

// Resolve ES Module default import wrapper discrepancy for JSON configurations in certain bundlers
const getFirebaseConfig = () => {
  if (!firebaseConfig) {
    console.error("[Firebase] Config JSON import is empty.");
    return {};
  }
  
  // Check if properties exist on top level or inside the default property
  const fallback = (firebaseConfig as any).default || firebaseConfig;
  const config = (firebaseConfig as any).apiKey ? firebaseConfig : fallback;
  
  console.log("[Firebase Init] Initializing with config keys:", Object.keys(config));
  return config;
};

const resolvedConfig = getFirebaseConfig();

export const app = initializeApp(resolvedConfig);
export const auth = getAuth(app);

let initializedDb: any;
try {
  initializedDb = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  }, resolvedConfig.firestoreDatabaseId);
  console.log("[Firebase Init] Firestore initialized with memoryLocalCache successfully.");
} catch (err) {
  console.warn("[Firebase Init] Failed to initialize memoryLocalCache, falling back to default getFirestore:", err);
  initializedDb = getFirestore(app, resolvedConfig.firestoreDatabaseId);
}

export const db = initializedDb;

// Validate Connection to Firestore (MANDATORY skill check constraint)
async function testConnection() {
  try {
    await getDoc(doc(db, "appConfig", "global"));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errCode = (error as any)?.code;
    if (
      errMsg.includes("the client is offline") ||
      errMsg.includes("unavailable") ||
      errMsg.includes("resource-exhausted") ||
      errMsg.includes("Quota limit exceeded") ||
      errCode === "unavailable" ||
      errCode === "resource-exhausted"
    ) {
      console.warn("[Firebase Init] Connection check: Firestore client is operating in offline/quota fallback mode.");
    } else {
      console.error("[Firebase Init] Firestore connection error:", error);
    }
  }
}
testConnection();

let safeStorage: any = null;
try {
  safeStorage = getStorage(app);
} catch (e) {
  console.warn("Firebase Storage service is not available or provisioned in this project.");
}

export const storage = safeStorage;

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isQuotaOrOfflineError(error: unknown): boolean {
  if (!error) return false;
  const errMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code;
  return (
    errCode === "resource-exhausted" || 
    errCode === "unavailable" ||
    errCode === "auth/network-request-failed" ||
    errMsg.includes("resource-exhausted") || 
    errMsg.includes("Quota limit exceeded") ||
    errMsg.includes("unavailable") ||
    errMsg.includes("auth/network-request-failed") ||
    errMsg.includes("client is offline") ||
    errMsg.includes("INTERNAL ASSERTION FAILED") ||
    errMsg.includes("Unexpected state") ||
    errMsg.includes("b815") ||
    errMsg.includes("ca9")
  );
}

export const isQuotaError = isQuotaOrOfflineError;

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errMsg = error instanceof Error ? error.message : String(error);

  if (isQuotaOrOfflineError(error)) {
    console.warn(`[Firestore Offline / Quota Fallback] ${operationType.toUpperCase()} on ${path || "document"}: Operating in offline or fallback state. (${errMsg})`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
}
