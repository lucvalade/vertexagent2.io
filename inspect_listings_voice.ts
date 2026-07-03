import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0289343453",
  appId: "1:142937005005:web:0b7eb5813eff5496998284",
  apiKey: "AIzaSyCVqNGati2Cw6RrBr3zm1aqSIhIkV2VdEg",
  authDomain: "gen-lang-client-0289343453.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-7041987e-3421-4d21-9e4e-7f7a7b28e938");

async function run() {
  const ids = ["b1dbdb5d-b5fc-43e8-ba11-2c69b431a3ed", "f13d6b80-4391-4a1b-8d94-ff1bb7a70733", "c3507e9a-b388-43ea-ac92-76d7d7a2154a"];
  for (const id of ids) {
    console.log(`\n===================================`);
    console.log(`READING LISTING: ${id}`);
    console.log(`===================================`);
    try {
      const docRef = doc(db, "listings", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Listing Address:", data.address);
        console.log("welcome_en:", data.welcome_en);
        console.log("welcome_fr:", data.welcome_fr);
        console.log("welcome_en_script:", data.welcome_en_script);
        console.log("welcome_fr_script:", data.welcome_fr_script);
        console.log("voiceName:", data.voiceName);
        console.log("voiceId:", data.voiceId);
        // Print other fields containing welcome or audio or tour or script just in case
        const keys = Object.keys(data);
        for (const key of keys) {
          if (key.toLowerCase().includes("welcome") || key.toLowerCase().includes("audio") || key.toLowerCase().includes("voice") || key.toLowerCase().includes("script")) {
            console.log(`Other field [${key}]:`, data[key]);
          }
        }
      } else {
        console.log("No such document!");
      }
    } catch (err: any) {
      console.error("Error:", err.message || err);
    }
  }
  process.exit(0);
}

run();
