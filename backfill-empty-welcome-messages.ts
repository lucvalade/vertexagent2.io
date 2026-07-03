import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

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
    console.log("Signing in anonymously with Client SDK for Step 2...");
    await signInAnonymously(auth);
    console.log("Authentication successful!");

    // Read default URLs from JSON file
    let defaultEnUrl = "https://storage.googleapis.com/gen-lang-client-0289343453.firebasestorage.app/defaults/welcome_en_standard.mp3";
    let defaultFrUrl = "https://storage.googleapis.com/gen-lang-client-0289343453.firebasestorage.app/defaults/welcome_fr_standard.mp3";

    if (fs.existsSync("default_urls.json")) {
      const savedUrls = JSON.parse(fs.readFileSync("default_urls.json", "utf-8"));
      if (savedUrls.defaultEnUrl) defaultEnUrl = savedUrls.defaultEnUrl;
      if (savedUrls.defaultFrUrl) defaultFrUrl = savedUrls.defaultFrUrl;
    }

    console.log("Using Platform Defaults:");
    console.log("- welcome_en:", defaultEnUrl);
    console.log("- welcome_fr:", defaultFrUrl);

    // Scan listings
    console.log("Scanning listings for empty welcome messages...");
    const querySnapshot = await getDocs(collection(db, "listings"));
    console.log(`Found ${querySnapshot.size} listings to check.`);

    let updatedCount = 0;

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const id = docSnap.id;
      const updates: any = {};

      const needsEn = !data.welcome_en || data.welcome_en.trim() === "";
      const needsFr = !data.welcome_fr || data.welcome_fr.trim() === "";

      if (needsEn) {
        console.log(`Listing ${id} (${data.address}) has empty welcome_en. Backfilling...`);
        updates.welcome_en = defaultEnUrl;
      }

      if (needsFr) {
        console.log(`Listing ${id} (${data.address}) has empty welcome_fr. Backfilling...`);
        updates.welcome_fr = defaultFrUrl;
      }

      if (needsEn || needsFr) {
        updates.welcome_message_type = "platform_default";
        updates.welcome_linked_at = Date.now();
        updates.welcome_linked_by = "system_backfill";
        
        // Ensure voice standard is set
        updates.voice_id = 2;
        updates.voiceId = 2;
        updates.voice_name = "Sora (Professional Female Synthetic)";
        updates.voiceName = "Sora (Professional Female Synthetic)";
      }

      if (Object.keys(updates).length > 0) {
        console.log(`Updating listing ${id} in Firestore...`);
        await updateDoc(doc(db, "listings", id), updates);
        console.log(`Successfully updated listing ${id}!`);
        updatedCount++;
      } else {
        console.log(`Listing ${id} is already populated.`);
      }
    }

    console.log(`Step 2 completed successfully. Backfilled ${updatedCount} listings.`);
  } catch (err: any) {
    console.error("Step 2 backfill error:", err.message || err);
  } finally {
    process.exit(0);
  }
}

run();
