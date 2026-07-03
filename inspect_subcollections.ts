import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc } from "firebase/firestore";

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
  for (const id of ids) {
    console.log(`\n===================================`);
    console.log(`CHECKING SUBCOLLECTIONS OF LISTING: ${id}`);
    console.log(`===================================`);
    try {
      // Get documents in "assets" subcollection
      const assetsCol = collection(db, "listings", id, "assets");
      const assetsSnap = await getDocs(assetsCol);
      console.log(`Subcollection 'assets' has ${assetsSnap.size} documents.`);
      assetsSnap.forEach((doc) => {
        console.log(`Asset ID: ${doc.id}, data:`, JSON.stringify(doc.data(), null, 2));
      });
    } catch (err: any) {
      console.error("Error for listing", id, ":", err.message || err);
    }
  }
  process.exit(0);
}

run();
