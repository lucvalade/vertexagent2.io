async function run() {
  try {
    console.log("=== Querying local dev server API ===");
    const res = await fetch("http://localhost:3000/api/welcome-messages/defaults");
    if (res.ok) {
      const data = await res.json();
      console.log("Success! Server defaults:", JSON.stringify(data, null, 2));
    } else {
      console.error("Server API returned error:", res.status, res.statusText, await res.text());
    }
  } catch (err: any) {
    console.error("Error calling server API:", err.message || err);
  }
}

run();
