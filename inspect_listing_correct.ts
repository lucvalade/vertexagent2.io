import fs from "fs";
import path from "path";

async function main() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  let configContent: any = {};
  if (fs.existsSync(configPath)) {
    configContent = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
  const projectId = configContent.projectId;
  const dbId = configContent.firestoreDatabaseId;
  const apiKey = configContent.apiKey;
  const listingId = "c3507e9a-b388-43ea-ac92-76d7d7a2154a";

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/listings/${listingId}?key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.log("Failed to fetch. Status:", res.status, await res.text());
    return;
  }
  const data = await res.json();
  console.log("Listing document from REST API:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
