
import { db } from "./src/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

async function seedWaitlist() {
  const signups = [
    { name: "John Doe", email: "john@example.com", createdAt: new Date() },
    { name: "Jane Smith", email: "jane@example.com", createdAt: new Date() },
  ];

  const collectionRef = collection(db, "waitlist_signups");
  for (const signup of signups) {
    await addDoc(collectionRef, signup);
  }
  console.log("Seeded 2 dummy waitlist signups.");
}

seedWaitlist().catch(console.error);
