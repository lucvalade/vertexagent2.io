async function getAccessToken(): Promise<string> {
  const url = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";
  const res = await fetch(url, { headers: { "Metadata-Flavor": "Google" } });
  if (!res.ok) throw new Error("Failed to fetch IAM token");
  const data: any = await res.json();
  return data.access_token;
}

async function run() {
  const projectId = "gen-lang-client-0289343453";
  try {
    const token = await getAccessToken();
    console.log("=== Listing Firebase Rules Releases ===");
    const res = await fetch(`https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error("Failed to list releases:", res.status, res.statusText, await res.text());
    }
  } catch (err: any) {
    console.error("Error:", err.message || err);
  }
}

run();
