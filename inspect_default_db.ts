import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0289343453",
  appId: "1:142937005005:web:0b7eb5813eff5496998284",
  apiKey: "AIzaSyCVqNGati2Cw6RrBr3zm1aqSIhIkV2VdEg",
  authDomain: "gen-lang-client-0289343453.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Default database

async function run() {
  try {
    console.log("Signing in anonymously on default DB...");
    await signInAnonymously(auth);
    console.log("Signed in successfully.");
    
    console.log("=== Checking listings collection on default DB ===");
    try {
      const snap = await getDocs(collection(db, "listings"));
      console.log(`Success! Found ${snap.docs.length} documents.`);
    } catch (err: any) {
      console.error("Failed to list listings on default DB:", err.message);
    }
    
    console.log("=== Checking appConfig collection on default DB ===");
    try {
      const snap = await getDocs(collection(db, "appConfig"));
      console.log(`Success! Found ${snap.docs.length} documents.`);
    } catch (err: any) {
      console.error("Failed to list appConfig on default DB:", err.message);
    }
    
    console.log("=== Trying to write a test doc to appConfig on default DB ===");
    try {
      await setDoc(doc(db, "appConfig", "platformDefaults"), { test: true });
      console.log("Successfully wrote test doc!");
    } catch (err: any) {
      console.error("Failed to write test doc:", err.message);
    }
  } catch (err: any) {
    console.error("Error:", err.message || err);
  }
  process.exit(0);
}

run();
