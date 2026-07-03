import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

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
    console.log("Signing in anonymously...");
    await signInAnonymously(auth);
    console.log("Fetching listings...");
    const querySnapshot = await getDocs(collection(db, "listings"));
    
    let elfordWelcomeEn = "";
    
    // First, find the Elford Cres listing and get its welcome_en
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const addr = (data.address || "").toLowerCase();
      if (addr.includes("elford")) {
        elfordWelcomeEn = data.welcome_en || "";
        console.log(`Found Elford Cres listing! welcome_en length: ${elfordWelcomeEn.length}`);
      }
    });
    
    if (!elfordWelcomeEn) {
      throw new Error("Could not find welcome_en on Elford Cres listing!");
    }
    
    // Now, update Novoco and Arejay listings
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const addr = (data.address || "").toLowerCase();
      if (addr.includes("novoco") || addr.includes("arejay")) {
        console.log(`Updating listing: ${data.address} (ID: ${docSnap.id})...`);
        const docRef = doc(db, "listings", docSnap.id);
        await updateDoc(docRef, {
          voiceName: "Sora Studio Male/Female (Neural)",
          welcome_en: elfordWelcomeEn,
          welcome_fr: "",
          updatedAt: Date.now()
        });
        console.log(`Successfully updated ${data.address}!`);
      }
    }
    
    console.log("All updates completed successfully!");
  } catch (err: any) {
    console.error("Error during update:", err.message || err);
  } finally {
    process.exit(0);
  }
}

run();
