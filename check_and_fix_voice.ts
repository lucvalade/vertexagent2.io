import { getListing, updateListing } from "./src/lib/api";

async function fixListingVoice() {
  const listingId = "624f7c64-8977-4b36-91d4-de118724885d";
  const listing = await getListing(listingId);
  
  if (!listing) {
    console.error("Listing not found");
    return;
  }
  
  console.log("Current listing voiceName:", listing.voiceName);
  
  // Update to "Professional Female Synthetic (Sora)"
  // According to src/pages/EditListing.tsx, id "2" corresponds to this.
  await updateListing(listingId, {
    voiceId: "2",
    voiceName: "Professional Female Synthetic (Sora)"
  });
  
  console.log("Listing voice updated.");
}

fixListingVoice();
