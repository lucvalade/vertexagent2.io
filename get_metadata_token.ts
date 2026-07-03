async function run() {
  try {
    const url = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";
    const res = await fetch(url, {
      headers: {
        "Metadata-Flavor": "Google"
      }
    });
    if (res.ok) {
      const data: any = await res.json();
      console.log("Success! Token starts with:", data.access_token.substring(0, 30));
    } else {
      console.error("Failed to fetch token from metadata server:", res.status, res.statusText);
    }
  } catch (err: any) {
    console.error("Error fetching metadata token:", err.message || err);
  }
}

run();
