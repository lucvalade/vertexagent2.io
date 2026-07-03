console.log("=== Environment Variables ===");
for (const [key, val] of Object.entries(process.env)) {
  if (key.includes("FIREBASE") || key.includes("GOOGLE") || key.includes("PORT") || key.includes("API") || key.includes("KEY")) {
    console.log(`${key}: ${val}`);
  }
}
