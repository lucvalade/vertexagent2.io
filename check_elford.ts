import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0289343453",
  appId: "1:142937005005:web:0b7eb5813eff5496998284",
  apiKey: "AIzaSyCVqNGati2Cw6RrBr3zm1aqSIhIkV2VdEg",
  authDomain: "gen-lang-client-0289343453.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "ai-studio-7041987e-3421-4d21-9e4e-7f7a7b28e938");

async function run() {
  try {
    await signInAnonymously(auth);
    const querySnapshot = await getDocs(collection(db, "listings"));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const addr = (data.address || "").toLowerCase();
      if (addr.includes("elford") || addr.includes("novoco") || addr.includes("arejay")) {
        console.log(`Address: ${data.address}`);
        console.log(`- voiceName: ${data.voiceName}`);
        console.log(`- welcome_en: ${data.welcome_en}`);
        console.log(`- welcome_fr: ${data.welcome_fr}`);
        console.log(`- welcome_en_script: ${data.welcome_en_script}`);
        console.log(`- welcome_fr_script: ${data.welcome_fr_script}`);
      }
    });
  } catch (err: any) {
    console.error("Error:", err.message || err);
  } finally {
    process.exit(0);
  }
}

run();
