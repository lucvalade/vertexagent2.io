import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Admin SDK using ambient service account or credentials
admin.initializeApp({
  projectId: "gen-lang-client-0289343453",
});

const db = getFirestore("ai-studio-7041987e-3421-4d21-9e4e-7f7a7b28e938");

async function checkAppConfig() {
  try {
    const docRef = db.collection("appConfig").doc("platformDefaults");
    const snap = await docRef.get();
    if (snap.exists) {
      console.log("=== Found /appConfig/platformDefaults with Admin SDK ===");
      console.log(JSON.stringify(snap.data(), null, 2));
    } else {
      console.log("=== /appConfig/platformDefaults NOT found with Admin SDK ===");
    }

    // Also check root collection appConfig
    console.log("=== Checking appConfig collection ===");
    const colSnap = await db.collection("appConfig").get();
    console.log(`Found ${colSnap.size} documents in appConfig:`);
    colSnap.forEach(d => {
      console.log(`- Document ID: ${d.id}`);
      console.log(JSON.stringify(d.data(), null, 2));
    });
  } catch (err: any) {
    console.error("Error inspecting appConfig via Admin SDK:", err.message || err);
  }
  process.exit(0);
}

checkAppConfig();
