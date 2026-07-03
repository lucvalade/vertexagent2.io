async function run() {
  try {
    console.log("=== Posting test platform default to local server ===");
    const res = await fetch("http://localhost:3000/api/welcome-messages/defaults", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale: "en",
        text_value: "Welcome to AI Open House Connect. I am Sora, your AI guide.",
        userId: "admin_test"
      })
    });
    
    if (res.ok) {
      console.log("Success! Platform default written via local server API:", await res.json());
    } else {
      console.error("Local server API returned error:", res.status, res.statusText, await res.text());
    }
  } catch (err: any) {
    console.error("Error calling server API:", err.message || err);
  }
}

run();
