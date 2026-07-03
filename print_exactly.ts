import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0289343453",
  appId: "1:142937005005:web:0b7eb5813eff5496998284",
  apiKey: "AIzaSyCVqNGati2Cw6RrBr3zm1aqSIhIkV2VdEg",
  authDomain: "gen-lang-client-0289343453.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "ai-studio-7041987e-3421-4d21-9e4e-7f7a7b28e938");

async function checkListing() {
  try {
    await signInAnonymously(auth);
    const docRef = doc(db, "listings", "3a801a86-316c-46c0-aa19-7498d2a76e62");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      console.log(JSON.stringify(snap.data(), null, 2));
    } else {
      console.log("Listing not found!");
    }
  } catch (err: any) {
    console.error("Error fetching listing:", err.message || err);
  }
  process.exit(0);
}

checkListing();
