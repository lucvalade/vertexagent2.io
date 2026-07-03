import fetch from "node-fetch";

const projectId = "gen-lang-client-0289343453";
const dbId = "ai-studio-7041987e-3421-4d21-9e4e-7f7a7b28e938";
const apiKey = "AIzaSyCVqNGati2Cw6RrBr3zm1aqSIhIkV2VdEg";

async function run() {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/listings?key=${apiKey}`;
  console.log("Fetching from:", url);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("HTTP error:", res.status, await res.text());
      return;
    }
    const data: any = await res.json();
    if (!data.documents) {
      console.log("No documents found in 'listings'");
      return;
    }
    for (const doc of data.documents) {
      const name = doc.name.split("/").pop();
      const fields = doc.fields;
      const address = fields.address?.stringValue || "Unknown Address";
      console.log(`\nAddress: ${address} (Doc ID: ${name})`);
      console.log(`- welcome_en:`, fields.welcome_en?.stringValue || "not present");
      console.log(`- welcome_fr:`, fields.welcome_fr?.stringValue || "not present");
      console.log(`- voiceName:`, fields.voiceName?.stringValue || "not present");
      console.log(`- welcome_en_script:`, fields.welcome_en_script?.stringValue || "not present");
      console.log(`- welcome_fr_script:`, fields.welcome_fr_script?.stringValue || "not present");
    }
  } catch (err) {
    console.error("Error running query:", err);
  }
}

run();
