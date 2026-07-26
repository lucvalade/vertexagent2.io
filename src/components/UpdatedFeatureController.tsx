import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface AgentPricingAndBrandingProfile {
  agent_id: string;
  account_tier: "Solo" | "Pro";
  sora_session_constraints: {
    turn_limit_per_session: number;
    monthly_session_cap: number;
  };
  media_processing_rules: {
    ai_auto_metadata_tagging: boolean;
    dynamic_photo_swaps_enabled: boolean;
  };
  branding_configuration: {
    company_logo_url: string;
    agent_headshot_url: string;
    is_white_labeled: boolean;
    brokerage_theme_palette: {
      primary_accent_color: string;
      use_premium_glassmorphism: boolean;
    };
  };
}

export function initializeAgentTierCapabilities(agentProfile: any) {
  // Constant platform baseline items
  const AUTOMATED_MEDIA_MANIFEST_TAGGING = true;

  if (!agentProfile || agentProfile.account_tier === "Solo") {
    return {
      maxConversationTurns: 10, // Updated from 3-5 to 10-turn limit
      aiMediaManifestTagging: AUTOMATED_MEDIA_MANIFEST_TAGGING, // Enabled for Free Tier
      photoInteractionMode: "Dynamic Contextual AI Photo Swaps", // AI will auto-navigate photos dynamically for all users
      allowedBrandingLayout: {
        showHeadshot: true,
        showLogo: true,
        useStandardBackground: true,
        allowWhiteLabeling: false,
        useBrokerageColors: false,
      },
    };
  }

  // Otherwise, Pro tier features
  return {
    maxConversationTurns: 9999, // Uncapped/virtually unlimited
    aiMediaManifestTagging: AUTOMATED_MEDIA_MANIFEST_TAGGING, // Enabled
    photoInteractionMode: "Dynamic Contextual AI Photo Swaps", // AI will auto-navigate photos dynamically based on conversation
    allowedBrandingLayout: {
      showHeadshot: true,
      showLogo: true,
      useStandardBackground: false, // can use premium custom background
      allowWhiteLabeling: true, // hides "Powered by AI Open House Connect" badge
      useBrokerageColors: true, // allows glassmorphism 2.0 & custom colors
    },
  };
}

export function useAgentTierCapabilities(agentId?: string) {
  const [capabilities, setCapabilities] = useState(() => initializeAgentTierCapabilities(null));
  const [profile, setProfile] = useState<AgentPricingAndBrandingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, "agent_pricing_branding_profiles", agentId);
    
    // Subscribe to real-time changes
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as AgentPricingAndBrandingProfile;
          setProfile(data);
          setCapabilities(initializeAgentTierCapabilities(data));
        } else {
          // Fallback to Solo
          setProfile(null);
          setCapabilities(initializeAgentTierCapabilities(null));
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error loading agent tier profile:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [agentId]);

  return { capabilities, profile, loading, error };
}
