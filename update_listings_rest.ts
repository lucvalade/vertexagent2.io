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

const projectId = "gen-lang-client-0289343453";
const dbId = "ai-studio-7041987e-3421-4d21-9e4e-7f7a7b28e938";

async function run() {
  try {
    console.log("Signing in anonymously on client SDK...");
    await signInAnonymously(auth);
    console.log("Fetching listings to find Elford Cres and get IDs...");
    const querySnapshot = await getDocs(collection(db, "listings"));
    
    let elfordWelcomeEn = "";
    
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
    
    // For each listing matching Novoco or Arejay, let's use the REST PATCH API to update!
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const addr = (data.address || "").toLowerCase();
      if (addr.includes("novoco") || addr.includes("arejay")) {
        console.log(`Updating ${data.address} (ID: ${docSnap.id}) via REST PATCH...`);
        
        const fields = {
          voiceName: { stringValue: "Sora Studio Male/Female (Neural)" },
          welcome_en: { stringValue: elfordWelcomeEn },
          welcome_fr: { stringValue: "" },
          updatedAt: { integerValue: Date.now().toString() }
        };
        
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/listings/${docSnap.id}?updateMask.fieldPaths=voiceName&updateMask.fieldPaths=welcome_en&updateMask.fieldPaths=welcome_fr&updateMask.fieldPaths=updatedAt`;
        
        const response = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields })
        });
        
        if (response.ok) {
          console.log(`Successfully updated ${data.address} via REST PATCH!`);
        } else {
          const text = await response.text();
          console.error(`Failed to update ${data.address}: ${response.status} ${response.statusText} - ${text}`);
        }
      }
    }
    
    console.log("REST updates completed!");
  } catch (err: any) {
    console.error("Error during REST update:", err.message || err);
  } finally {
    process.exit(0);
  }
}

run();
