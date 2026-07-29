let cachedRegion: string | null = null;

/**
 * Detects the user's region using browser language preferences first,
 * with IP geolocation fallback.
 */
export async function getUserRegion(): Promise<string> {
  if (cachedRegion) return cachedRegion;

  // Tier 1: Check browser language strings (Fastest)
  const browserLang = typeof navigator !== "undefined" 
    ? (navigator.language || (navigator.languages && navigator.languages[0]) || "")
    : "";
  const langLower = browserLang.toLowerCase();

  if (langLower === "en-ca" || langLower === "ca" || langLower.endsWith("-ca")) {
    cachedRegion = "Canada (en-CA)";
    return cachedRegion;
  } else if (langLower === "en-us" || langLower === "us" || langLower.endsWith("-us")) {
    cachedRegion = "United States (en-US)";
    return cachedRegion;
  }

  // Tier 2: Fallback to IP Geolocation if browser language is generic
  try {
    const response = await fetch("https://ipapi.co/json");
    if (response.ok) {
      const data = await response.json();
      if (data.country_code === "CA") {
        cachedRegion = "Canada (en-CA)";
        return cachedRegion;
      } else if (data.country_code === "US") {
        cachedRegion = "United States (en-US)";
        return cachedRegion;
      }
    }
  } catch (error) {
    console.warn("Geolocation lookup failed, defaulting to US context:", error);
  }

  // Default fallback if everything else fails
  cachedRegion = "United States (en-US)";
  return cachedRegion;
}

export function getEnglishLabel(region: string): string {
  if (region.includes("Canada") || region.includes("en-CA")) {
    return "English (CA)";
  }
  return "English (US)";
}
