import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0289343453",
  appId: "1:142937005005:web:0b7eb5813eff5496998284",
  apiKey: "AIzaSyCVqNGati2Cw6RrBr3zm1aqSIhIkV2VdEg",
  authDomain: "gen-lang-client-0289343453.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-7041987e-3421-4d21-9e4e-7f7a7b28e938");

async function run() {
  const ids = ["5aee09e8-429f-4b32-b55b-a4b707a38933", "c3507e9a-b388-43ea-ac92-76d7d7a2154a"];
  const locales = ["en", "fr"];

  console.log("\n===================================");
  console.log("CHECKING property_welcome_messages");
  console.log("===================================");
  for (const id of ids) {
    for (const locale of locales) {
      const docId = `${id}_${locale}`;
      try {
        const docRef = doc(db, "property_welcome_messages", docId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          console.log(`[property_welcome_messages] Found ${docId}:`);
          console.log(" - text_value:", snap.data().text_value);
          console.log(" - translation_status:", snap.data().translation_status);
        } else {
          console.log(`[property_welcome_messages] ${docId} NOT found.`);
        }
      } catch (err: any) {
        console.error(`Error fetching ${docId}:`, err.message || err);
      }
    }
  }

  console.log("\n===================================");
  console.log("CHECKING platform_content_defaults");
  console.log("===================================");
  for (const locale of locales) {
    const docId = `sora_welcome_message_${locale}`;
    try {
      const docRef = doc(db, "platform_content_defaults", docId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        console.log(`[platform_content_defaults] Found ${docId}:`);
        console.log(" - text_value:", snap.data().text_value);
      } else {
        console.log(`[platform_content_defaults] ${docId} NOT found.`);
      }
    } catch (err: any) {
      console.error(`Error fetching default ${docId}:`, err.message || err);
    }
  }

  process.exit(0);
}

run();
