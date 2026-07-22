import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  doc,
  getDocFromServer
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
const isIframe = typeof window !== "undefined" && window.self !== window.top;

if (isIframe) {
  console.log("[Firebase Init] Operating inside an iframe sandbox. Initializing standard Firestore without local disk persistence to prevent cache lock contention.");
  initializedDb = getFirestore(app, resolvedConfig.firestoreDatabaseId);
} else {
  try {
    initializedDb = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    }, resolvedConfig.firestoreDatabaseId);
    console.log("[Firebase Init] Firestore persistent multi-tab local cache initialized successfully.");
  } catch (err) {
    console.warn("[Firebase Init] Failed to initialize persistent local cache, falling back to standard Firestore:", err);
    initializedDb = getFirestore(app, resolvedConfig.firestoreDatabaseId);
  }
}

export const db = initializedDb;

// Validate Connection to Firestore (MANDATORY skill check constraint)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "appConfig", "global"));
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

export function isQuotaError(error: unknown): boolean {
  if (!error) return false;
  const errMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code;
  return errCode === "resource-exhausted" || errMsg.includes("resource-exhausted") || errMsg.includes("Quota limit exceeded");
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errMsg = error instanceof Error ? error.message : String(error);

  if (isQuotaError(error)) {
    console.warn(`[Firestore Quota Exceeded] ${operationType.toUpperCase()} on ${path || "document"}: Daily free quota limit reached. Operating in offline/local fallback mode.`);
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
