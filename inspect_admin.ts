async function getAccessToken(): Promise<string> {
  const url = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";
  const res = await fetch(url, { headers: { "Metadata-Flavor": "Google" } });
  if (!res.ok) throw new Error("Failed to fetch IAM token");
  const data: any = await res.json();
  return data.access_token;
}

const projectId = "gen-lang-client-0289343453";
const dbId = "ai-studio-7041987e-3421-4d21-9e4e-7f7a7b28e938";

async function inspectAppConfig() {
  try {
    const token = await getAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/appConfig/platformDefaults`;
    
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log("=== Found /appConfig/platformDefaults with Auth REST API ===");
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`=== /appConfig/platformDefaults NOT found (Status: ${res.status} ${res.statusText}) ===`);
      if (res.status === 404) {
        console.log("Document does not exist. We can create it!");
      } else {
        console.log(await res.text());
      }
    }
  } catch (err: any) {
    console.error("Error inspecting:", err.message || err);
  }
}

inspectAppConfig();
