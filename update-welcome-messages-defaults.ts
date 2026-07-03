import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDocs, updateDoc } from "firebase/firestore";
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

const locales = ["ar", "bn", "zh-CN", "zh-TW", "nl", "en", "fr", "de", "hi", "id", "it", "ja", "ko", "pl", "pt", "ro", "ru", "es", "sv", "ta", "th", "tr", "ur", "vi"];
const bucketName = "gen-lang-client-0289343453.firebasestorage.app";

async function run() {
  const summary: {
    listingsUpdated: string[];
    defaultsWritten: Record<string, any>;
    localesVerified: number;
    errors: string[];
  } = {
    listingsUpdated: [],
    defaultsWritten: {},
    localesVerified: 0,
    errors: []
  };

  try {
    console.log("Signing in anonymously...");
    await signInAnonymously(auth);
    console.log("Successfully signed in.");

    // Step 1: Confirm translated audio files exist locally (which map to Firebase Storage via /audio/ replacement)
    console.log("Verifying translated audio files...");
    const defaultsDir = path.join(process.cwd(), "public", "audio", "defaults");
    let verifiedCount = 0;
    
    for (const locale of locales) {
      const fileName = `welcome_${locale}_standard.mp3`;
      const localPath = path.join(defaultsDir, fileName);
      if (fs.existsSync(localPath)) {
        verifiedCount++;
      } else {
        const errMsg = `Translated audio file missing: ${fileName}`;
        console.warn(errMsg);
        summary.errors.push(errMsg);
      }
    }
    summary.localesVerified = verifiedCount;
    console.log(`Verified ${verifiedCount}/${locales.length} locales.`);

    // Step 2: Build default URLs map
    const defaultUrlsMap: Record<string, string> = {};
    for (const locale of locales) {
      defaultUrlsMap[`welcome_${locale}`] = `https://storage.googleapis.com/${bucketName}/defaults/welcome_${locale}_standard.mp3`;
    }

    // Step 3: Write to appConfig/platformDefaults in Firestore
    console.log("Updating appConfig/platformDefaults in Firestore...");
    const platformDefaultsRef = doc(db, "appConfig", "platformDefaults");
    const platformDefaultsPayload = {
      id: "platformDefaults",
      welcome_message_type: "platform_default_translated",
      updatedAt: Date.now(),
      ...defaultUrlsMap
    };
    await setDoc(platformDefaultsRef, platformDefaultsPayload);
    summary.defaultsWritten = platformDefaultsPayload;
    console.log("Successfully updated appConfig/platformDefaults.");

    // Step 4: Populate individual locale configs in platform_content_defaults
    console.log("Populating platform_content_defaults locales in Firestore...");
    for (const locale of locales) {
      const localeRef = doc(db, "platform_content_defaults", locale);
      await setDoc(localeRef, {
        id: locale,
        locale: locale,
        url: `https://storage.googleapis.com/${bucketName}/defaults/welcome_${locale}_standard.mp3`,
        updatedAt: Date.now()
      });
    }
    console.log("Successfully populated platform_content_defaults.");

    // Step 5: Update all existing listings matching conditions
    console.log("Scanning listings...");
    const listingsSnap = await getDocs(collection(db, "listings"));
    console.log(`Found ${listingsSnap.size} total listings in collection.`);

    for (const listingDoc of listingsSnap.docs) {
      const listingData = listingDoc.data();
      const listingId = listingDoc.id;

      // Skip custom_override listings strictly
      if (listingData.welcome_message_type === "custom_override") {
        console.log(`Listing ${listingId} has type 'custom_override'. Skipping.`);
        continue;
      }

      // Update if listing is platform_default OR has no type set but is active
      const isPlatformDefault = listingData.welcome_message_type === "platform_default";
      const isUnset = !listingData.welcome_message_type;

      if (isPlatformDefault || isUnset) {
        console.log(`Updating listing ${listingId} to platform_default_translated...`);
        
        const listingUpdates: Record<string, any> = {
          welcome_message_type: "platform_default_translated",
          welcome_linked_at: Date.now(),
          welcome_linked_by: "platform_update",
          voice_id: listingData.voice_id || 2,
          ...defaultUrlsMap
        };

        await updateDoc(doc(db, "listings", listingId), listingUpdates);
        summary.listingsUpdated.push(listingId);
        console.log(`Successfully updated listing ${listingId}!`);
      }
    }

  } catch (err: any) {
    const fatalErr = err.message || err;
    console.error("Platform update error:", fatalErr);
    summary.errors.push(`Fatal error: ${fatalErr}`);
  }

  // Output raw JSON summary as requested
  console.log("\n=== SUMMARY JSON ===");
  console.log(JSON.stringify(summary, null, 2));
}

run();
