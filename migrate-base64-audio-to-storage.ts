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
    console.log("Signing in anonymously with Client SDK...");
    await signInAnonymously(auth);
    console.log("Authentication successful!");

    // Make sure public directories exist
    const defaultLocalDir = path.join(process.cwd(), "public", "audio", "defaults");
    fs.mkdirSync(defaultLocalDir, { recursive: true });

    // Copy defaults locally for absolute fallback
    const enDefaultPath = path.join(process.cwd(), "public", "audio", "welcome_en.mp3");
    const frDefaultPath = path.join(process.cwd(), "public", "audio", "welcome_fr.mp3");

    if (fs.existsSync(enDefaultPath)) {
      fs.copyFileSync(enDefaultPath, path.join(defaultLocalDir, "welcome_en_standard.mp3"));
      console.log("Copied welcome_en to defaults/welcome_en_standard.mp3");
    }
    if (fs.existsSync(frDefaultPath)) {
      fs.copyFileSync(frDefaultPath, path.join(defaultLocalDir, "welcome_fr_standard.mp3"));
      console.log("Copied welcome_fr to defaults/welcome_fr_standard.mp3");
    }

    const bucketName = "gen-lang-client-0289343453.firebasestorage.app";
    const defaultEnUrl = `https://storage.googleapis.com/${bucketName}/defaults/welcome_en_standard.mp3`;
    const defaultFrUrl = `https://storage.googleapis.com/${bucketName}/defaults/welcome_fr_standard.mp3`;

    console.log("Constructed default EN GCS URL:", defaultEnUrl);
    console.log("Constructed default FR GCS URL:", defaultFrUrl);

    // Save default URLs to default_urls.json
    fs.writeFileSync(
      "default_urls.json",
      JSON.stringify({ defaultEnUrl, defaultFrUrl }, null, 2)
    );
    console.log("Saved default URLs to default_urls.json");

    // Scan listings for Base64 strings
    console.log("Scanning listings for Base64 audio...");
    const querySnapshot = await getDocs(collection(db, "listings"));
    console.log(`Found ${querySnapshot.size} listings to scan.`);

    let migratedCount = 0;

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const id = docSnap.id;
      const updates: any = {};

      console.log(`Checking listing ${id} (${data.address})...`);

      // Create local listing audio directory for local static fallback serving
      const localListingDir = path.join(process.cwd(), "public", "audio", "listings", id, "audio");

      // check welcome_en
      if (data.welcome_en && data.welcome_en.startsWith("data:audio")) {
        console.log(`Found Base64 welcome_en for listing ${id}. Processing...`);
        const base64Parts = data.welcome_en.split(",");
        const base64Data = base64Parts[1];
        const mimeType = base64Parts[0].match(/:(.*?);/)?.[1] || "audio/mpeg";
        const buffer = Buffer.from(base64Data, "base64");

        const ext = mimeType.includes("wav") ? "wav" : "mp3";
        
        // Save locally for 100% robust static serving fallback
        fs.mkdirSync(localListingDir, { recursive: true });
        const localPath = path.join(localListingDir, `welcome_en.${ext}`);
        fs.writeFileSync(localPath, buffer);
        console.log(`Saved welcome_en locally to: ${localPath}`);

        const downloadUrl = `https://storage.googleapis.com/${bucketName}/listings/${id}/audio/welcome_en.${ext}`;
        updates.welcome_en = downloadUrl;
        updates.welcome_message_type = "custom_override";
        updates.welcome_linked_at = Date.now();
        updates.welcome_linked_by = "agent";
      }

      // check welcome_fr
      if (data.welcome_fr && data.welcome_fr.startsWith("data:audio")) {
        console.log(`Found Base64 welcome_fr for listing ${id}. Processing...`);
        const base64Parts = data.welcome_fr.split(",");
        const base64Data = base64Parts[1];
        const mimeType = base64Parts[0].match(/:(.*?);/)?.[1] || "audio/mpeg";
        const buffer = Buffer.from(base64Data, "base64");

        const ext = mimeType.includes("wav") ? "wav" : "mp3";

        // Save locally for 100% robust static serving fallback
        fs.mkdirSync(localListingDir, { recursive: true });
        const localPath = path.join(localListingDir, `welcome_fr.${ext}`);
        fs.writeFileSync(localPath, buffer);
        console.log(`Saved welcome_fr locally to: ${localPath}`);

        const downloadUrl = `https://storage.googleapis.com/${bucketName}/listings/${id}/audio/welcome_fr.${ext}`;
        updates.welcome_fr = downloadUrl;
        updates.welcome_message_type = "custom_override";
        updates.welcome_linked_at = Date.now();
        updates.welcome_linked_by = "agent";
      }

      if (Object.keys(updates).length > 0) {
        console.log(`Updating listing ${id} in Firestore...`);
        await updateDoc(doc(db, "listings", id), updates);
        console.log(`Successfully migrated listing ${id}!`);
        migratedCount++;
      } else {
        console.log(`Listing ${id} did not require Base64 migration.`);
      }
    }

    console.log(`Step 1 migration finished. Migrated ${migratedCount} listings with Base64 audio.`);
  } catch (err: any) {
    console.error("Step 1 migration error:", err.message || err);
  } finally {
    process.exit(0);
  }
}

run();
