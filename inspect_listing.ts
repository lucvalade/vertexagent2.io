import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "ai-studio-7041987e-3421-4d21-9e4e-7f7a7b28e938"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const docRef = doc(db, "listings", "3a801a86-316c-46c0-aa19-7498d2a76e62");
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    console.log("=== Listing Data ===");
    console.log(JSON.stringify(snap.data(), null, 2));
  } else {
    console.log("Listing not found!");
  }
}

run();
