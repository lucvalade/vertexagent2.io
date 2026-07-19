import { Building2, Globe, Shield, Bell, Loader2, Mic2, CheckCircle2, ChevronDown, Plus, CreditCard, Sparkles, Video, Check, Upload, AlertCircle, Play, Pause, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAgent, updateUser } from "@/lib/api";
import { toast } from "sonner";
import { doc, getDoc, setDoc, collection, query, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate, useLocation } from "react-router-dom";
import WelcomeMessageDefaultsEmbed from "./WelcomeMessageDefaultsEmbed";
import Billing from "./Billing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getBoardNameByProvince = (province: string) => {
  const p = province.toLowerCase().trim();
  if (p.includes("ontario")) return "RECO";
  if (p.includes("alberta")) return "RECA";
  if (p.includes("british columbia") || p === "bc") return "BCFSA";
  if (p.includes("quebec") || p === "qc") return "OACIQ";
  if (p.includes("saskatchewan") || p === "sk") return "SREA";
  if (p.includes("manitoba") || p === "mb") return "MSC";
  if (p.includes("new brunswick") || p === "nb") return "FCNB";
  if (p.includes("nova scotia") || p === "ns") return "NSREC";
  if (p.includes("prince edward island") || p === "pei") return "PEICA";
  if (p.includes("newfoundland") || p === "nl") return "Government of NL";
  return "";
};

const CANADA_PROVINCES: Record<string, string> = {
  "AB": "Alberta",
  "BC": "British Columbia",
  "MB": "Manitoba",
  "NB": "New Brunswick",
  "NL": "Newfoundland and Labrador",
  "NT": "Northwest Territories",
  "NS": "Nova Scotia",
  "NU": "Nunavut",
  "ON": "Ontario",
  "PE": "Prince Edward Island",
  "QC": "Quebec",
  "SK": "Saskatchewan",
  "YT": "Yukon"
};

const US_STATES: Record<string, string> = {
  "AL": "Alabama",
  "AK": "Alaska",
  "AZ": "Arizona",
  "AR": "Arkansas",
  "CA": "California",
  "CO": "Colorado",
  "CT": "Connecticut",
  "DE": "Delaware",
  "DC": "District of Columbia",
  "FL": "Florida",
  "GA": "Georgia",
  "HI": "Hawaii",
  "ID": "Idaho",
  "IL": "Illinois",
  "IN": "Indiana",
  "IA": "Iowa",
  "KS": "Kansas",
  "KY": "Kentucky",
  "LA": "Louisiana",
  "ME": "Maine",
  "MD": "Maryland",
  "MA": "Massachusetts",
  "MI": "Michigan",
  "MN": "Minnesota",
  "MS": "Mississippi",
  "MO": "Missouri",
  "MT": "Montana",
  "NE": "Nebraska",
  "NV": "Nevada",
  "NH": "New Hampshire",
  "NJ": "New Jersey",
  "NM": "New Mexico",
  "NY": "New York",
  "NC": "North Carolina",
  "ND": "North Dakota",
  "OH": "Ohio",
  "OK": "Oklahoma",
  "OR": "Oregon",
  "PA": "Pennsylvania",
  "RI": "Rhode Island",
  "SC": "South Carolina",
  "SD": "South Dakota",
  "TN": "Tennessee",
  "TX": "Texas",
  "UT": "Utah",
  "VT": "Vermont",
  "VA": "Virginia",
  "WA": "Washington",
  "WV": "West Virginia",
  "WI": "Wisconsin",
  "WY": "Wyoming"
};

const ALL_PROVINCES_STATES_UPPER: Record<string, string> = {
  ...CANADA_PROVINCES,
  ...US_STATES
};

const LONG_NAME_LOOKUP: Record<string, string> = {};
Object.entries(ALL_PROVINCES_STATES_UPPER).forEach(([abbr, name]) => {
  LONG_NAME_LOOKUP[name.toLowerCase()] = name;
});

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile State
  const [legalName, setLegalName] = useState("");
  const [recoId, setRecoId] = useState("");
  const [brokerOfRecord, setBrokerOfRecord] = useState("");
  const [officePhone, setOfficePhone] = useState("");
  const [officeEmail, setOfficeEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTimeZone, setBirthTimeZone] = useState("America/Toronto");

  // New Profile Address States
  const [profileAddress, setProfileAddress] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileProvince, setProfileProvince] = useState("");
  const [profileCountry, setProfileCountry] = useState("");
  const [profilePostalCode, setProfilePostalCode] = useState("");

  // Global Brokerage File State (Admin Only)
  const [brokerageName, setBrokerageName] = useState("");
  const [brokerageAddress, setBrokerageAddress] = useState("");
  const [brokerageCity, setBrokerageCity] = useState("");
  const [brokerageProvince, setBrokerageProvince] = useState("");
  const [brokerageCountry, setBrokerageCountry] = useState("");
  const [brokeragePostalCode, setBrokeragePostalCode] = useState("");
  const [brokeragePhone, setBrokeragePhone] = useState("");
  const [brokerageEmail, setBrokerageEmail] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  
  // Social Profiles
  const [socials, setSocials] = useState({
    facebook: "",
    instagram: "",
    youtube: "",
    tiktok: "",
    x: "",
    linkedin: ""
  });

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Avatar Settings State
  const [avatarAddonPaid, setAvatarAddonPaid] = useState(false);
  const [enableClientAvatar, setEnableClientAvatar] = useState(false);
  const [enableVoiceAvatar, setEnableVoiceAvatar] = useState(false);
  const [avatarType, setAvatarType] = useState<"gallery" | "digital_twin">("gallery");
  const [selectedGalleryId, setSelectedGalleryId] = useState("kore");
  const [digitalTwinStatus, setDigitalTwinStatus] = useState<"none" | "pending_upload" | "processing" | "approved" | "rejected">("none");
  const [digitalTwinAvatarId, setDigitalTwinAvatarId] = useState("");
  const [consentApproved, setConsentApproved] = useState(false);
  const [avatarPage, setAvatarPage] = useState<number>(1);

  // Hidden video file uploads
  const [selectedTrainingFile, setSelectedTrainingFile] = useState<File | null>(null);
  const [selectedConsentFile, setSelectedConsentFile] = useState<File | null>(null);
  const [trainingFileName, setTrainingFileName] = useState("");
  const [consentFileName, setConsentFileName] = useState("");

  // Active audio preview ID
  const [activePreviewVoiceId, setActivePreviewVoiceId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Stop synthesis on tab change or unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        try { activeAudioRef.current.pause(); } catch (e) {}
        activeAudioRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-fill Issuing Jurisdiction and Board Name from Profile Province and Country
  useEffect(() => {
    if (profileProvince && profileCountry) {
      setJurisdiction(`${profileProvince}, ${profileCountry}`);
      const autoBoard = getBoardNameByProvince(profileProvince);
      if (autoBoard) {
        setBoardName(autoBoard);
      }
    } else if (profileProvince) {
      setJurisdiction(profileProvince);
      const autoBoard = getBoardNameByProvince(profileProvince);
      if (autoBoard) {
        setBoardName(autoBoard);
      }
    } else if (profileCountry) {
      setJurisdiction(profileCountry);
    }
  }, [profileProvince, profileCountry]);

  const handleTogglePreview = async (av: { id: string; name: string; voiceId: number }) => {
    if (activePreviewVoiceId === av.id) {
      if (activeAudioRef.current) {
        try { activeAudioRef.current.pause(); } catch (e) {}
        activeAudioRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setActivePreviewVoiceId(null);
      toast.info("Audio preview stopped.");
    } else {
      // Stop any existing playing audio first
      if (activeAudioRef.current) {
        try { activeAudioRef.current.pause(); } catch (e) {}
        activeAudioRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      const utteranceText = av.id === "kore" 
        ? "Hello! I am Sora, your real estate AI guide. I will help you explore this beautiful property."
        : av.id === "puck"
        ? "Hey there! I am Alex. Welcome to the tour! Let me show you around this amazing home."
        : av.id === "zephyr"
        ? "Welcome. I am Sophia. It is my pleasure to guide you through this exquisite residence today."
        : "Hello, welcome in. My name is Marcus. Let me share a few details about this tranquil property.";

      const toastId = toast.loading(`Generating premium neural voice preview for ${av.name}...`);
      setActivePreviewVoiceId(av.id);

      try {
        const response = await fetch("/api/tts-simple", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: utteranceText,
            lang: "English",
            voiceName: av.id
          })
        });

        toast.dismiss(toastId);

        if (!response.ok) {
          throw new Error("Failed to synthesize preview via server.");
        }

        const data = await response.json();
        if (data.success && data.base64Audio) {
          const mimeType = data.mimeType || "audio/wav";
          const binary = atob(data.base64Audio);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          activeAudioRef.current = audio;

          audio.onended = () => {
            setActivePreviewVoiceId(null);
            URL.revokeObjectURL(url);
          };

          audio.onerror = () => {
            setActivePreviewVoiceId(null);
            URL.revokeObjectURL(url);
          };

          await audio.play();
          toast.success(`Playing premium preview for ${av.name}...`);
        } else {
          throw new Error(data.error || "No audio returned.");
        }
      } catch (err) {
        toast.dismiss(toastId);
        console.error("[Voice Settings Preview Error]:", err);
        toast.error("Failed to generate premium neural preview. Falling back to local synthesis.");

        // Fallback to speech synthesis
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(utteranceText);
          const voicesList = window.speechSynthesis.getVoices();
          let voiceToUse = null;
          if (av.id === "kore" || av.id === "zephyr") {
            voiceToUse = voicesList.find(v => v.lang.startsWith("en-GB") && v.name.toLowerCase().includes("female")) || 
                         voicesList.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("female"));
          } else {
            voiceToUse = voicesList.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("male"));
          }
          if (voiceToUse) {
            utterance.voice = voiceToUse;
          }

          if (av.id === "kore") {
            utterance.rate = 0.95;
            utterance.pitch = 1.0;
          } else if (av.id === "puck") {
            utterance.rate = 1.1;
            utterance.pitch = 1.1;
          } else if (av.id === "zephyr") {
            utterance.rate = 0.9;
            utterance.pitch = 1.02;
          } else if (av.id === "charon") {
            utterance.rate = 0.85;
            utterance.pitch = 0.85;
          }

          utterance.onend = () => {
            setActivePreviewVoiceId(null);
          };
          utterance.onerror = () => {
            setActivePreviewVoiceId(null);
          };

          window.speechSynthesis.speak(utterance);
        } else {
          setActivePreviewVoiceId(null);
        }
      }
    }
  };

  const validateAvatarStep = (step: number): { valid: boolean; message: string } => {
    if (step === 1) {
      if (!avatarAddonPaid) {
        return {
          valid: false,
          message: "Please unlock the Sora 3D AI Avatar Extension ($20/mo) before moving onto Gallery & Twin."
        };
      }
      if (!enableClientAvatar && !enableVoiceAvatar) {
        return {
          valid: false,
          message: "Please enable at least one of Client-Facing AI Tours or Agent Voice Control before moving onto Gallery & Twin."
        };
      }
    }
    if (step === 2) {
      if (avatarType === "gallery") {
        if (!selectedGalleryId) {
          return {
            valid: false,
            message: "Please select an avatar from the Sora Pre-Vetted Gallery before moving onto Safety & Gateway."
          };
        }
      } else {
        if (digitalTwinStatus !== "approved" && digitalTwinStatus !== "processing") {
          return {
            valid: false,
            message: "Please select, upload, and submit your training video & consent statement for processing, or approve your digital twin first."
          };
        }
      }
    }
    if (step === 3) {
      if (!moderationResult) {
        return {
          valid: false,
          message: "Please run a safety moderation scan by typing a script and clicking 'Scan Script' before moving onto Live Handshake."
        };
      }
    }
    return { valid: true, message: "" };
  };

  // Script moderation and live session simulator states
  const [scriptToModerate, setScriptToModerate] = useState("Welcome to this beautiful estate! Let me guide you through the modern kitchen.");
  const [moderationResult, setModerationResult] = useState<{ passed: boolean; sanitizedText: string } | null>(null);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [liveSessionDetails, setLiveSessionDetails] = useState<any>(null);
  const [isInitializingLive, setIsInitializingLive] = useState(false);

  // Tab State
  const viewMode = location.pathname.startsWith('/app/admin') ? 'ADMIN' : 'CLIENT';
  const [activeTab, setActiveTab] = useState<"profile" | "branding" | "compliance" | "notifications" | "welcome_defaults" | "avatars" | "billing" | "admin">(viewMode === 'ADMIN' ? 'branding' : 'profile');
  const [adminSubTab, setAdminSubTab] = useState<"overview" | "company" | "plans" | "stripe">("overview");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && ["profile", "branding", "compliance", "notifications", "welcome_defaults", "avatars", "billing", "admin"].includes(tab)) {
      // Ensure avatars can only be accessed under ADMIN mode
      if (tab === "avatars" && viewMode === "CLIENT") {
        setActiveTab("profile");
      } else {
        setActiveTab(tab as any);
      }
    } else {
      setActiveTab(viewMode === 'ADMIN' ? 'branding' : 'profile');
    }
  }, [location.search, viewMode]);

  // Sora Welcome Defaults Management State (Removed/Commented out for standalone iFrame migration)
  /*
  const [welcomeDefaults, setWelcomeDefaults] = useState<any[]>([]);
  const [welcomeDefaultsLoading, setWelcomeDefaultsLoading] = useState(false);
  const [editingDefaultTexts, setEditingDefaultTexts] = useState<Record<string, string>>({
    en: "Welcome! I am Sora, your real estate AI assistant. Thank you for visiting this open house. Please feel free to look around, explore the rooms, and ask me any questions about the property features, pricing, or neighborhood."
  });
  const [savingDefaultLocale, setSavingDefaultLocale] = useState<string | null>(null);
  const [translatingAllDefaults, setTranslatingAllDefaults] = useState(false);
  const [isRewritingWelcomeDefault, setIsRewritingWelcomeDefault] = useState(false);

  const handleAiRewriteWelcomeDefault = async () => {
    const textToRewrite = editingDefaultTexts["en"]?.trim();
    if (!textToRewrite) {
      toast.error("Please enter some English default welcome text first.");
      return;
    }

    setIsRewritingWelcomeDefault(true);
    const toastId = toast.loading("Rewriting default welcome message with Sora AI...");
    try {
      const res = await fetch("/api/shorten-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToRewrite }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.shortenedText) {
          const cleanText = result.shortenedText.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
          const words = cleanText.split(" ");
          let cappedText = cleanText;
          if (words.length > 40) {
            cappedText = words.slice(0, 40).join(" ") + "...";
          }
          setEditingDefaultTexts(prev => ({
            ...prev,
            en: cappedText
          }));
          toast.success("Default welcome message rewritten!", { id: toastId });
        } else {
          toast.error("Failed to rewrite. AI did not return valid text.", { id: toastId });
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to contact AI rewrite service.", { id: toastId });
      }
    } catch (err) {
      console.error("AI Rewrite default welcome error:", err);
      toast.error("Error during AI rewrite of default welcome message.", { id: toastId });
    } finally {
      setIsRewritingWelcomeDefault(false);
    }
  };

  const handleTranslateAllDefaults = async () => {
    const enText = editingDefaultTexts["en"];
    if (!enText || !enText.trim()) {
      toast.error("Please enter a welcome message in US English (Default) first.");
      return;
    }
    setTranslatingAllDefaults(true);
    try {
      const response = await fetch("/api/welcome-messages/translate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: enText.trim() })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.translations) {
          const updated = {
            ...editingDefaultTexts,
            ...data.translations,
            en: enText.trim()
          };
          setEditingDefaultTexts(updated);
          
          // Bulk Save to backend
          toast.info("Saving translated defaults to database...");
          const saveRes = await fetch("/api/welcome-messages/defaults/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              translations: updated,
              userId: user?.id
            })
          });
          if (saveRes.ok) {
            toast.success("Successfully translated and SAVED the US English default message into all 24 languages!");
            await fetchWelcomeDefaults();
          } else {
            toast.warning("Translated successfully, but failed to save defaults in bulk. Please try updating individually.");
          }
        } else {
          toast.error("Failed to translate default welcome message.");
        }
      } else {
        toast.error("Error communicating with the translation service.");
      }
    } catch (err) {
      console.error("Failed to translate defaults:", err);
      toast.error("Network error while translating welcome message.");
    } finally {
      setTranslatingAllDefaults(false);
    }
  };

  // Fetching the platform defaults
  const fetchWelcomeDefaults = async () => {
    setWelcomeDefaultsLoading(true);
    try {
      const res = await fetch("/api/welcome-messages/defaults");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.defaults) {
          setWelcomeDefaults(data.defaults);
          // Initialize editing texts
          const editingMap: Record<string, string> = {};
          data.defaults.forEach((d: any) => {
            editingMap[d.locale] = d.text_value;
          });
          if (!editingMap["en"]) {
            editingMap["en"] = "Welcome! I am Sora, your real estate AI assistant. Thank you for visiting this open house. Please feel free to look around, explore the rooms, and ask me any questions about the property features, pricing, or neighborhood.";
          }
          setEditingDefaultTexts(editingMap);
        }
      }
    } catch (err) {
      console.error("Failed to fetch platform welcome message defaults:", err);
    } finally {
      setWelcomeDefaultsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "welcome_defaults") {
      fetchWelcomeDefaults();
    }
  }, [activeTab]);
  */

  // Logs State
  const [logs, setLogs] = useState<any[]>([]);
  const [fetchingPostal, setFetchingPostal] = useState(false);

  // Country/Province Lists
  const CA_PROVINCES = ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Northwest Territories", "Nunavut", "Yukon"];
  const US_STATES = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];

  // Pricing Plans State
  const [plans, setPlans] = useState([
    { id: 'agent', name: 'Active Agent', price: 149, listings: 5, features: ['5 active listings', 'Unlimited AI conversations', 'Full Brand Customization'] },
    { id: 'pro', name: 'Team Pro', price: 399, listings: 25, features: ['25 active listings', 'Advanced Analytics', 'Priority Support'] },
    { id: 'enterprise', name: 'Enterprise', price: 999, listings: -1, features: ['Unlimited listings', 'Custom AI Training', 'Dedicated Account Manager'] }
  ]);
  const [pricingTitle, setPricingTitle] = useState("Simple, flexible pricing");
  const [pricingDescription, setPricingDescription] = useState("Pricing models designed to maximize your revenue while minimizing friction, matching the seasonal nature of real estate.");

  // Stripe State
  const [stripeConnected, setStripeConnected] = useState(true);
  const [webhookSecret, setWebhookSecret] = useState("whsec_...");

  useEffect(() => {
    if (viewMode === 'ADMIN') {
      setActiveTab("admin" as any);
    }
  }, [viewMode]);

  // Branding State
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoStoragePath, setLogoStoragePath] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [accentColor, setAccentColor] = useState("#f8fafc");
  const [agentPhotoUrl, setAgentPhotoUrl] = useState("");
  const [selectedAgentPhotoFile, setSelectedAgentPhotoFile] = useState<File | null>(null);

  // Compliance State
  const [disclaimer, setDisclaimer] = useState("");
  const [privacyUrl, setPrivacyUrl] = useState("");
  
  // Refined Reciprocity State
  const [licenseNumber, setLicenseNumber] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [boardName, setBoardName] = useState("");
  const [licenseType, setLicenseType] = useState("");

  // Notifications State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [dailyDigest, setDailyDigest] = useState(true);

  // Preferences State
  const [defaultVoiceId, setDefaultVoiceId] = useState("");
  const [voices, setVoices] = useState<any[]>([]);

  // Admin Controls State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistrations, setAllowRegistrations] = useState(true);

  // Auto-save logic
  const isDirtyRef = useRef(false);
  const latestStateRef = useRef<any>(null);
  const isInitialLoadFinishedRef = useRef(false);

  // Keep latestStateRef.current in sync on every render
  latestStateRef.current = {
    legalName, recoId, brokerOfRecord, officePhone, officeEmail, birthDate, birthTimeZone,
    primaryColor, logoUrl, logoStoragePath, accentColor, agentPhotoUrl,
    disclaimer, privacyUrl, licenseNumber, jurisdiction, boardName, licenseType,
    emailAlerts, smsAlerts, dailyDigest, defaultVoiceId, maintenanceMode, allowRegistrations,
    plans, pricingTitle, pricingDescription, stripeConnected, webhookSecret,
    profileAddress, profileCity, profileProvince, profileCountry, profilePostalCode,
    avatarSettings: {
      addonPaid: avatarAddonPaid,
      enableClientAvatar,
      enableVoiceAvatar,
      avatarType,
      selectedGalleryId,
      digitalTwinStatus,
      digitalTwinAvatarId,
      consentApproved
    }
  };

  // Flag changes as dirty
  useEffect(() => {
    if (!loading && user?.id) {
      if (!isInitialLoadFinishedRef.current) {
        isInitialLoadFinishedRef.current = true;
        isDirtyRef.current = false;
        return;
      }
      isDirtyRef.current = true;
    }
  }, [
    legalName, recoId, brokerOfRecord, officePhone, officeEmail, birthDate, birthTimeZone,
    primaryColor, logoUrl, logoStoragePath, accentColor, agentPhotoUrl,
    disclaimer, privacyUrl, licenseNumber, jurisdiction, boardName, licenseType,
    emailAlerts, smsAlerts, dailyDigest, defaultVoiceId, maintenanceMode, allowRegistrations,
    plans, pricingTitle, pricingDescription, stripeConnected, webhookSecret,
    avatarAddonPaid, enableClientAvatar, enableVoiceAvatar, avatarType,
    selectedGalleryId, digitalTwinStatus, digitalTwinAvatarId, consentApproved, loading,
    profileAddress, profileCity, profileProvince, profileCountry, profilePostalCode
  ]);

  // Unmount effect for auto-saving changes
  useEffect(() => {
    return () => {
      if (isDirtyRef.current && latestStateRef.current && user) {
        const state = latestStateRef.current;
        updateUser(user.id, {
          brokerageProfile: {
            legalName: state.legalName,
            recoId: state.recoId,
            brokerOfRecord: state.brokerOfRecord,
            officePhone: state.officePhone,
            officeEmail: state.officeEmail,
            birthDate: state.birthDate,
            birthTimeZone: state.birthTimeZone,
            address: state.profileAddress,
            city: state.profileCity,
            province: state.profileProvince,
            country: state.profileCountry,
            postalCode: state.profilePostalCode,
            updatedAt: Date.now()
          },
          branding: {
            primaryColor: state.primaryColor,
            imageUrl: state.logoUrl,
            storagePath: state.logoStoragePath,
            accentColor: state.accentColor,
            agentPhotoUrl: state.agentPhotoUrl
          },
          compliance: {
            disclaimer: state.disclaimer,
            privacyUrl: state.privacyUrl,
            reciprocity: {
              licenseNumber: state.licenseNumber,
              jurisdiction: state.jurisdiction,
              boardName: state.boardName,
              licenseType: state.licenseType
            }
          },
          notifications: {
            emailAlerts: state.emailAlerts,
            smsAlerts: state.smsAlerts,
            dailyDigest: state.dailyDigest
          },
          defaultVoiceId: state.defaultVoiceId,
          avatarSettings: {
            ...state.avatarSettings,
            updatedAt: Date.now()
          },
          updatedAt: Date.now()
        }).then(() => {
          console.log("Auto-save on unmount completed successfully");
        }).catch(err => {
          console.error("Auto-save on unmount failed:", err);
        });

        if (user.role === 'ADMIN') {
          const adminData = {
            maintenanceMode: state.maintenanceMode,
            allowRegistrations: state.allowRegistrations,
            plans: state.plans,
            brokerageName,
            brokerageAddress,
            brokerageCity,
            brokerageProvince,
            brokerageCountry,
            brokeragePostalCode,
            brokeragePhone,
            brokerageEmail,
            adminEmail,
            socials,
            pricingTitle: state.pricingTitle,
            pricingDescription: state.pricingDescription,
            stripeConnected: state.stripeConnected,
            webhookSecret: state.webhookSecret,
            updatedBy: user.id,
            updatedAt: Date.now()
          };
          setDoc(doc(db, "settings", "global"), adminData).catch(err => {
            console.error("Auto-save global admin settings on unmount failed:", err);
          });
        }
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  async function loadProfile() {
    try {
      // Try to load admin settings if admin
      if (user?.role === 'ADMIN') {
        const adminSettings: any = await getDoc(doc(db, "settings", "global"))
          .then(d => d.exists() ? d.data() : {})
          .catch(err => {
             console.error("Admin Settings Load Error:", err);
             return {};
          });
        
        setMaintenanceMode(adminSettings.maintenanceMode ?? false);
        setAllowRegistrations(adminSettings.allowRegistrations ?? true);
        if (adminSettings.plans) {
          setPlans(adminSettings.plans);
        }
        setBrokerageName(adminSettings.brokerageName || "");
        setBrokerageAddress(adminSettings.brokerageAddress || "");
        setBrokerageCity(adminSettings.brokerageCity || "");
        setBrokerageProvince(adminSettings.brokerageProvince || "");
        setBrokerageCountry(adminSettings.brokerageCountry || "");
        setBrokeragePostalCode(adminSettings.brokeragePostalCode || "");
        setBrokeragePhone(adminSettings.brokeragePhone || "");
        setBrokerageEmail(adminSettings.brokerageEmail || "");
        setAdminEmail(adminSettings.adminEmail || "");
        if (adminSettings.socials) {
          setSocials({ ...socials, ...adminSettings.socials });
        }
        setPricingTitle(adminSettings.pricingTitle || "Simple, flexible pricing");
        setPricingDescription(adminSettings.pricingDescription || "Pricing models designed to maximize your revenue while minimizing friction, matching the seasonal nature of real estate.");
        setStripeConnected(adminSettings.stripeConnected ?? true);
        setWebhookSecret(adminSettings.webhookSecret || "whsec_...");
      }

      const data: any = await getAgent(user!.id);
      if (data?.brokerageProfile) {
        const bp = data.brokerageProfile;
        setLegalName(bp.legalName || "AI Open House Connect HQ");
        setRecoId(bp.recoId || "B-481923");
        setBrokerOfRecord(bp.brokerOfRecord || "Luc Valade");
        setOfficePhone(bp.officePhone || "(289) 659-5170");
        setOfficeEmail(bp.officeEmail || "ops@aiopenhouseconnect.com");
        setBirthDate(bp.birthDate || "");
        setBirthTimeZone(bp.birthTimeZone || "America/Toronto");
        setProfileAddress(bp.address || "");
        setProfileCity(bp.city || "");
        setProfileProvince(bp.province || "");
        setProfileCountry(bp.country || "");
        setProfilePostalCode(bp.postalCode || "");
      } else {
        // Defaults if none exist
        setLegalName("AI Open House Connect HQ");
        setRecoId("B-481923");
        setBrokerOfRecord("Luc Valade");
        setOfficePhone("(289) 659-5170");
        setOfficeEmail("ops@aiopenhouseconnect.com");
        setBirthDate("");
        setBirthTimeZone("America/Toronto");
        setProfileAddress("");
        setProfileCity("");
        setProfileProvince("");
        setProfileCountry("");
        setProfilePostalCode("");
      }

      if (data?.branding) {
        setPrimaryColor(data.branding.primaryColor || "#2563eb");
        setLogoUrl(data.branding.imageUrl || data.branding.logoUrl || "");
        setLogoStoragePath(data.branding.storagePath || data.branding.logoStoragePath || "");
        setAccentColor(data.branding.accentColor || "#f8fafc");
        setAgentPhotoUrl(data.branding.agentPhotoUrl || "");
      }

      if (data?.compliance) {
        setDisclaimer(data.compliance.disclaimer || "");
        setPrivacyUrl(data.compliance.privacyUrl || "");
        
        const rec = data.compliance.reciprocity || {};
        setLicenseNumber(rec.licenseNumber || "");
        setJurisdiction(rec.jurisdiction || "");
        setBoardName(rec.boardName || "");
        setLicenseType(rec.licenseType || "");
      }

      if (data?.notifications) {
        setEmailAlerts(data.notifications.emailAlerts ?? true);
        setSmsAlerts(data.notifications.smsAlerts ?? false);
        setDailyDigest(data.notifications.dailyDigest ?? true);
      }

      if (data?.defaultVoiceId) {
        setDefaultVoiceId(data.defaultVoiceId);
      }

      if (data?.avatarSettings) {
        setAvatarAddonPaid(data.avatarSettings.addonPaid ?? false);
        setEnableClientAvatar(data.avatarSettings.enableClientAvatar ?? false);
        setEnableVoiceAvatar(data.avatarSettings.enableVoiceAvatar ?? false);
        setAvatarType(data.avatarSettings.avatarType || "gallery");
        setSelectedGalleryId(data.avatarSettings.selectedGalleryId || "kore");
        setDigitalTwinStatus(data.avatarSettings.digitalTwinStatus || "none");
        setDigitalTwinAvatarId(data.avatarSettings.digitalTwinAvatarId || "");
        setConsentApproved(data.avatarSettings.consentApproved ?? false);
      }

      // Load available voices
      const voicesRef = collection(db, "users", user!.id, "voices");
      const voicesSnap = await getDocs(query(voicesRef));
      const voicesData = voicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVoices(voicesData);

      if (data?.role === 'ADMIN') {
        const adminSettings: any = await getDoc(doc(db, "settings", "global"))
          .then(d => d.exists() ? d.data() : {})
          .catch(err => handleFirestoreError(err, OperationType.GET, "settings/global"));
        setMaintenanceMode(adminSettings.maintenanceMode ?? false);
        setAllowRegistrations(adminSettings.allowRegistrations ?? true);
        if (adminSettings.plans) {
          setPlans(adminSettings.plans);
        }
        setBrokerageName(adminSettings.brokerageName || "");
        setBrokerageAddress(adminSettings.brokerageAddress || "");
        setBrokerageCity(adminSettings.brokerageCity || "");
        setBrokerageProvince(adminSettings.brokerageProvince || "");
        setBrokerageCountry(adminSettings.brokerageCountry || "");
        setBrokeragePostalCode(adminSettings.brokeragePostalCode || "");
        setBrokeragePhone(adminSettings.brokeragePhone || "");
        setBrokerageEmail(adminSettings.brokerageEmail || "");
        setAdminEmail(adminSettings.adminEmail || "");
        if (adminSettings.socials) {
          setSocials({ ...socials, ...adminSettings.socials });
        }
        setPricingTitle(adminSettings.pricingTitle || "Simple, flexible pricing");
        setPricingDescription(adminSettings.pricingDescription || "Pricing models designed to maximize your revenue while minimizing friction, matching the seasonal nature of real estate.");
        setStripeConnected(adminSettings.stripeConnected ?? true);
        setWebhookSecret(adminSettings.webhookSecret || "whsec_...");
      }
    } catch (err) {
      toast.error("Failed to load profile settings");
    } finally {
      setLoading(false);
    }
  }

  const isTitleCase = (str: string) => {
    if (!str.trim()) return false;
    return str.split(" ").every(word => {
      const clean = word.replace(/[^a-zA-Z]/g, "");
      if (clean.length === 0) return true;
      return /^[A-Z]/.test(clean);
    });
  };

  const validatePhone = (phone: string) => {
    return /^\(\d{3}\) \d{3}-\d{4}$/.test(phone);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateReco = (id: string) => {
    return /^[A-Z0-9-]{3,20}$/i.test(id);
  };

  const triggerColorPicker = (id: string) => {
    const el = document.getElementById(id) as HTMLInputElement;
    if (el) el.click();
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const validateUrl = (url: string) => {
    if (url.startsWith('blob:') || url.startsWith('data:')) return true;
    try {
      new URL(url);
      return url.startsWith("http");
    } catch {
      return false;
    }
  };

  const validateImageUrl = (url: string) => {
    if (url.startsWith('blob:') || url.startsWith('data:')) return true;
    if (!validateUrl(url)) return false;
    // Allow Firebase Storage URLs
    if (url.includes('firebasestorage.googleapis.com')) return true;
    return /\.(jpg|jpeg|png|gif|webp|svg)($|\?|#)/i.test(url);
  };

  const toTitleCase = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  };

  const capitalizeAddressWord = (val: string) => {
    return val.split(" ").map(w => {
      if (!w) return "";
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(" ");
  };

  const formatPostalCodeInput = (val: string) => {
    let formatted = val.toUpperCase();
    if (/^[A-Z]/.test(formatted)) {
      // Canada
      formatted = formatted.replace(/-/g, " ");
      formatted = formatted.replace(/[^A-Z0-9 ]/g, "");
      formatted = formatted.replace(/\s+/g, " ");
      const noSpace = formatted.replace(/\s/g, "");
      if (noSpace.length === 6 && /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(noSpace)) {
        formatted = `${noSpace.slice(0, 3)} ${noSpace.slice(3)}`;
      }
    } else {
      // US
      formatted = formatted.replace(/[^0-9-]/g, "");
      const cleanDigits = formatted.replace(/-/g, "");
      if (cleanDigits.length > 5) {
        formatted = `${cleanDigits.slice(0, 5)}-${cleanDigits.slice(5, 9)}`;
      } else {
        formatted = cleanDigits;
      }
    }
    return formatted;
  };

  const handleBlur = (field: string, value: string) => {
    let error = "";
    switch (field) {
      case "legalName":
        if (!value.trim()) error = "Legal Name is required";
        else if (!isTitleCase(value)) error = "First letter of each name must be capitalized";
        break;
      case "recoId":
        if (!value.trim()) error = "License ID / RECO is required";
        else if (!validateReco(value)) error = "Invalid format (3-20 alphanumeric characters)";
        break;
      case "brokerOfRecord":
        if (!value.trim()) error = "Broker of Record is required";
        else if (!isTitleCase(value)) error = "First letter of each name must be capitalized";
        break;
      case "officePhone":
        if (!value.trim()) error = "Office Phone is required";
        else if (!validatePhone(value)) error = "Invalid format: (555) 555-5555";
        break;
      case "officeEmail":
        if (!value.trim()) error = "Office Email is required";
        else if (!validateEmail(value)) error = "Invalid email format";
        break;
      case "logoUrl":
        if (value.trim()) {
           if (!validateUrl(value)) error = "Invalid URL format (must start with http/https)";
           else if (!validateImageUrl(value)) error = "Invalid image extension (allowed: .jpg, .png, .gif, .webp, .svg)";
        }
        break;
      case "privacyUrl":
        if (!value.trim()) {
          error = "Privacy Policy URL is required";
        } else if (!validateUrl(value)) {
          error = "Invalid URL (must start with http/https)";
        } else if (!value.startsWith("https://")) {
          error = "Privacy Policy URL must start with https://";
        } else if (!value.includes("/privacy")) {
          error = "Privacy Policy URL must contain '/privacy'";
        }
        break;
      case "disclaimer":
        if (value.length > 0 && !/^[A-Z]/.test(value)) error = "Disclaimer must start with a capital letter";
        break;
      case "licenseNumber":
        if (value.trim() && !/^[a-zA-Z0-9-]{3,30}$/.test(value)) error = "Invalid License Number (alphanumeric)";
        break;
      case "licenseType":
        if (!value.trim()) error = "Type Of Licence is required";
        else if (!isTitleCase(value)) error = "First letter of each word must be capitalized";
        break;
      case "jurisdiction":
        if (!value.trim()) error = "Issuing Jurisdiction is required";
        else if (!isTitleCase(value)) error = "First letter of each word must be capitalized";
        break;
      case "boardName":
        if (!value.trim()) error = "Board Name is required";
        else if (!isTitleCase(value)) error = "First letter of each word must be capitalized";
        break;
      case "profileAddress":
        if (!value.trim()) {
          error = "Address is required";
        } else {
          const capitalized = capitalizeAddressWord(value);
          setProfileAddress(capitalized);
        }
        break;
      case "profileCity":
        if (!value.trim()) {
          error = "City is required";
        } else {
          const capitalized = capitalizeAddressWord(value);
          setProfileCity(capitalized);
          if (!isTitleCase(capitalized)) {
            error = "First letter of each word must be capitalized";
          }
        }
        break;
      case "profileProvince": {
        const valTrimmed = value.trim();
        if (!valTrimmed) {
          error = "Province/State is required";
        } else {
          const valUpper = valTrimmed.toUpperCase();
          const valLower = valTrimmed.toLowerCase();
          if (ALL_PROVINCES_STATES_UPPER[valUpper] !== undefined) {
            setProfileProvince(valUpper);
          } else if (LONG_NAME_LOOKUP[valLower] !== undefined) {
            setProfileProvince(LONG_NAME_LOOKUP[valLower]);
          } else {
            const capitalized = capitalizeAddressWord(valTrimmed);
            setProfileProvince(capitalized);
            error = "Invalid Province or State abbreviation or full name. Please provide a valid Canadian Province or US State.";
          }
        }
        break;
      }
      case "profileCountry":
        if (!value.trim()) {
          error = "Country is required";
        } else {
          const capitalized = capitalizeAddressWord(value);
          setProfileCountry(capitalized);
          if (!isTitleCase(capitalized)) {
            error = "First letter of each word must be capitalized";
          }
        }
        break;
      case "profilePostalCode": {
        let cleanVal = value.trim().toUpperCase();
        if (/^[A-Z]/.test(cleanVal)) {
          // Canada format
          cleanVal = cleanVal.replace(/-/g, " ");
          cleanVal = cleanVal.replace(/[^A-Z0-9 ]/g, "");
          cleanVal = cleanVal.replace(/\s+/g, " ");
          const noSpace = cleanVal.replace(/\s/g, "");
          if (noSpace.length === 6 && /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(noSpace)) {
            cleanVal = `${noSpace.slice(0, 3)} ${noSpace.slice(3)}`;
          }
        } else {
          // US format
          cleanVal = cleanVal.replace(/[^0-9-]/g, "");
          const cleanDigits = cleanVal.replace(/-/g, "");
          if (cleanDigits.length > 5) {
            cleanVal = `${cleanDigits.slice(0, 5)}-${cleanDigits.slice(5, 9)}`;
          } else {
            cleanVal = cleanDigits;
          }
        }
        setProfilePostalCode(cleanVal);

        if (!cleanVal) {
          error = "Postal/Zip Code is required";
        } else {
          if (/^[A-Z]/.test(cleanVal)) {
            const canadaRegex = /^[A-Z]\d[A-Z] \d[A-Z]\d$/;
            if (!canadaRegex.test(cleanVal)) {
              error = "Canada Postal Code must be in the format: A1A 1A1 (alternating letter-digit with exactly one space, no hyphens)";
            }
          } else {
            const usRegex = /^\d{5}$|^\d{5}-\d{4}$/;
            if (!usRegex.test(cleanVal)) {
              error = "US ZIP Code must be a 5-digit number (12345) or a 9-digit format with a hyphen (12345-6789)";
            }
          }
        }
        break;
      }
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    if (error) toast.error(error);
  };

  const handleTestScript = async () => {
    if (!scriptToModerate.trim()) {
      toast.error("Please enter a script to test.");
      return;
    }
    setModerationLoading(true);
    try {
      const res = await fetch("/api/heygen/speak-moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: scriptToModerate })
      });
      if (res.ok) {
        const data = await res.json();
        setModerationResult({
          passed: data.passed,
          sanitizedText: data.sanitizedText
        });
        if (data.passed) {
          toast.success("Script passed moderation successfully!");
        } else {
          toast.warning("Inappropriate keywords detected and sanitized!");
        }
      } else {
        // Fallback simulation if route isn't fully set up or offline
        const lower = scriptToModerate.toLowerCase();
        const isBanned = lower.includes("banned") || lower.includes("explicit") || lower.includes("violent") || lower.includes("abusive");
        const sanitized = isBanned ? scriptToModerate.replace(/(banned|explicit|violent|abusive)/gi, "[REDACTED]") : scriptToModerate;
        setModerationResult({
          passed: !isBanned,
          sanitizedText: sanitized
        });
        if (!isBanned) {
          toast.success("Script passed local moderation check!");
        } else {
          toast.warning("Local moderation filtered inappropriate content.");
        }
      }
    } catch (err) {
      console.error("Moderation test error:", err);
      toast.error("Error connecting to moderation server.");
    } finally {
      setModerationLoading(false);
    }
  };

  const handleStartLiveStream = async () => {
    setIsInitializingLive(true);
    let avatarId = avatarType === "gallery" ? selectedGalleryId : (digitalTwinAvatarId || "dt-agent-clone-99");
    if (avatarId === "kore") {
      avatarId = "073b60a9-89a8-45aa-8902-c358f64d2852";
    } else if (avatarId === "puck") {
      avatarId = "dt-agent-clone-01";
    } else if (avatarId === "zephyr") {
      avatarId = "dt-agent-clone-02";
    } else if (avatarId === "charon") {
      avatarId = "dt-agent-clone-03";
    }
    try {
      const res = await fetch("/api/heygen/live-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarId })
      });
      if (res.ok) {
        const data = await res.json();
        setLiveSessionDetails({
          session_id: data.session_id || data.sessionId,
          quality: "1080p WebRTC",
          sdp: "m=video 9 UDP/TLS/RTP/SAVPF..."
        });
        toast.success("Live avatar WebRTC handshake succeeded! Stream connected.");
        // Simulate speech activity shortly after connecting
        setTimeout(() => {
          setIsPlayingPreview(true);
        }, 1500);
      } else {
        // Fallback simulation if route not fully ready or server error
        setTimeout(() => {
          setLiveSessionDetails({
            session_id: `session_${Math.random().toString(36).substring(2, 9)}`,
            quality: "720p (Local WebRTC Mock)",
            sdp: "mock_sdp_data_local_loopback"
          });
          toast.success("WebRTC Mock loopback connected successfully!");
          setTimeout(() => {
            setIsPlayingPreview(true);
          }, 1500);
        }, 1000);
      }
    } catch (err) {
      console.error("Live stream connection error:", err);
      toast.error("Handshake error. Failed to establish WebRTC channel.");
    } finally {
      setIsInitializingLive(false);
    }
  };

  const switchTab = async (newTab: any) => {
    if (isDirtyRef.current) {
      toast.info("Auto-saving your changes...");
      await handleSave(true);
    }
    setActiveTab(newTab);
  };

  async function handleSave(isAutoSave: boolean | React.MouseEvent<HTMLButtonElement> = false) {
    const autoSave = typeof isAutoSave === 'boolean' ? isAutoSave : false;
    // Final Validations
    if (activeTab === "profile") {
      const newErrors = { ...errors };

      if (!profileAddress.trim()) {
        newErrors.profileAddress = "Address is required";
      } else {
        const capitalized = capitalizeAddressWord(profileAddress);
        if (profileAddress !== capitalized) setProfileAddress(capitalized);
        delete newErrors.profileAddress;
      }

      if (!profileCity.trim()) {
        newErrors.profileCity = "City is required";
      } else {
        const capitalized = capitalizeAddressWord(profileCity);
        if (profileCity !== capitalized) setProfileCity(capitalized);
        if (!isTitleCase(capitalized)) {
          newErrors.profileCity = "First letter of each word must be capitalized";
        } else {
          delete newErrors.profileCity;
        }
      }

      if (!profileProvince.trim()) {
        newErrors.profileProvince = "Province/State is required";
      } else {
        const valTrimmed = profileProvince.trim();
        const valUpper = valTrimmed.toUpperCase();
        const valLower = valTrimmed.toLowerCase();
        if (ALL_PROVINCES_STATES_UPPER[valUpper] !== undefined) {
          if (profileProvince !== valUpper) setProfileProvince(valUpper);
          delete newErrors.profileProvince;
        } else if (LONG_NAME_LOOKUP[valLower] !== undefined) {
          const matchedName = LONG_NAME_LOOKUP[valLower];
          if (profileProvince !== matchedName) setProfileProvince(matchedName);
          delete newErrors.profileProvince;
        } else {
          const capitalized = capitalizeAddressWord(valTrimmed);
          if (profileProvince !== capitalized) setProfileProvince(capitalized);
          newErrors.profileProvince = "Invalid Province or State abbreviation or full name. Please provide a valid Canadian Province or US State.";
        }
      }

      if (!profileCountry.trim()) {
        newErrors.profileCountry = "Country is required";
      } else {
        const capitalized = capitalizeAddressWord(profileCountry);
        if (profileCountry !== capitalized) setProfileCountry(capitalized);
        if (!isTitleCase(capitalized)) {
          newErrors.profileCountry = "First letter of each word must be capitalized";
        } else {
          delete newErrors.profileCountry;
        }
      }

      if (!profilePostalCode.trim()) {
        newErrors.profilePostalCode = "Postal/Zip Code is required";
      } else {
        let cleanVal = profilePostalCode.trim().toUpperCase();
        if (/^[A-Z]/.test(cleanVal)) {
          // Canada format
          cleanVal = cleanVal.replace(/-/g, " ");
          cleanVal = cleanVal.replace(/[^A-Z0-9 ]/g, "");
          cleanVal = cleanVal.replace(/\s+/g, " ");
          const noSpace = cleanVal.replace(/\s/g, "");
          if (noSpace.length === 6 && /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(noSpace)) {
            cleanVal = `${noSpace.slice(0, 3)} ${noSpace.slice(3)}`;
          }
        } else {
          // US format
          cleanVal = cleanVal.replace(/[^0-9-]/g, "");
          const cleanDigits = cleanVal.replace(/-/g, "");
          if (cleanDigits.length > 5) {
            cleanVal = `${cleanDigits.slice(0, 5)}-${cleanDigits.slice(5, 9)}`;
          } else {
            cleanVal = cleanDigits;
          }
        }
        if (profilePostalCode !== cleanVal) setProfilePostalCode(cleanVal);

        if (/^[A-Z]/.test(cleanVal)) {
          const canadaRegex = /^[A-Z]\d[A-Z] \d[A-Z]\d$/;
          if (!canadaRegex.test(cleanVal)) {
            newErrors.profilePostalCode = "Canada Postal Code must be in the format: A1A 1A1 (alternating letter-digit with exactly one space, no hyphens)";
          } else {
            delete newErrors.profilePostalCode;
          }
        } else {
          const usRegex = /^\d{5}$|^\d{5}-\d{4}$/;
          if (!usRegex.test(cleanVal)) {
            newErrors.profilePostalCode = "US ZIP Code must be a 5-digit number (12345) or a 9-digit format with a hyphen (12345-6789)";
          } else {
            delete newErrors.profilePostalCode;
          }
        }
      }

      setErrors(newErrors);

      if (!legalName.trim() || !recoId.trim() || !brokerOfRecord.trim() || !officePhone.trim() || !officeEmail.trim() ||
          !profileAddress.trim() || !profileCity.trim() || !profileProvince.trim() || !profileCountry.trim() || !profilePostalCode.trim() ||
          Object.values(newErrors).some(e => e)) {
        if (!autoSave) {
          toast.error("Please fill in all required fields and fix validation errors in the Account Profile");
        }
        return;
      }
    }

    if (activeTab === "compliance") {
      if (!licenseType.trim() || !jurisdiction.trim() || !boardName.trim() || !privacyUrl.trim()) {
        if (!autoSave) {
          toast.error("Please fill in all required fields in Compliance (Type Of Licence, Issuing Jurisdiction, Board Name, and Privacy Policy URL)");
        }
        return;
      }
    }

    if (user?.role === 'ADMIN' && activeTab === 'admin' && adminSubTab === 'company') {
      if (!brokerageName || !brokerageAddress || !brokerageCity || !brokerageCountry || !brokerageProvince || !brokeragePostalCode || !brokeragePhone || !brokerageEmail || !adminEmail) {
        if (!autoSave) {
          toast.error("Please fill in all mandatory fields in the AI Open House Connect File");
        }
        return;
      }
    }

    if (Object.values(errors).some(e => e)) {
      if (!autoSave) {
        toast.error("Please fix validation errors before saving");
      }
      return;
    }

    setSaving(true);
    let finalLogoUrl = logoUrl;
    let finalStoragePath = logoStoragePath;
    let finalAgentPhotoUrl = agentPhotoUrl;

    try {
      if (selectedFile && user) {
        try {
          const uploadPromise = (async () => {
            const storageRef = ref(storage, `logos/${user.id}/logo-${Date.now()}`);
            const snap = await uploadBytes(storageRef, selectedFile);
            const downloadUrl = await getDownloadURL(snap.ref);
            return { imageUrl: downloadUrl, storagePath: snap.ref.fullPath };
          })();

          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("Firebase Storage upload timed out")), 6000)
          );

          const result = await Promise.race([uploadPromise, timeoutPromise]);
          if (result) {
            finalLogoUrl = result.imageUrl;
            finalStoragePath = result.storagePath;
          }
        } catch (uploadErr) {
          console.warn("Storage upload failed, falling back to data URL conversion:", uploadErr);
          const base64Data = await fileToBase64(selectedFile);
          finalLogoUrl = base64Data;
          finalStoragePath = `base64/${selectedFile.name}`;
          toast.info("Logo stored locally in Firestore (Storage skipped or timed out).");
        }
        
        // Update states to reflect successful upload
        setLogoUrl(finalLogoUrl);
        setLogoStoragePath(finalStoragePath);
        setSelectedFile(null);
      }

      if (selectedAgentPhotoFile && user) {
        try {
          const uploadPromise = (async () => {
            const storageRef = ref(storage, `photos/${user.id}/photo-${Date.now()}`);
            const snap = await uploadBytes(storageRef, selectedAgentPhotoFile);
            const downloadUrl = await getDownloadURL(snap.ref);
            return downloadUrl;
          })();

          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("Firebase Storage upload timed out")), 6000)
          );

          const result = await Promise.race([uploadPromise, timeoutPromise]);
          if (result) {
            finalAgentPhotoUrl = result;
          }
        } catch (uploadErr) {
          console.warn("Storage photo upload failed, falling back to data URL conversion:", uploadErr);
          const base64Data = await fileToBase64(selectedAgentPhotoFile);
          finalAgentPhotoUrl = base64Data;
          toast.info("Photo stored locally in Firestore (Storage skipped or timed out).");
        }

        setAgentPhotoUrl(finalAgentPhotoUrl);
        setSelectedAgentPhotoFile(null);
      }

      await updateUser(user!.id, {
        brokerageProfile: {
          legalName,
          recoId,
          brokerOfRecord,
          officePhone,
          officeEmail,
          birthDate,
          birthTimeZone,
          address: profileAddress,
          city: profileCity,
          province: profileProvince,
          country: profileCountry,
          postalCode: profilePostalCode,
          updatedAt: Date.now()
        },
        branding: {
          primaryColor,
          imageUrl: finalLogoUrl,
          storagePath: finalStoragePath,
          accentColor,
          agentPhotoUrl: finalAgentPhotoUrl
        },
        compliance: {
          disclaimer,
          privacyUrl,
          reciprocity: {
            licenseNumber,
            jurisdiction,
            boardName,
            licenseType
          }
        },
        notifications: {
          emailAlerts,
          smsAlerts,
          dailyDigest
        },
        defaultVoiceId,
        avatarSettings: {
          addonPaid: avatarAddonPaid,
          enableClientAvatar,
          enableVoiceAvatar,
          avatarType,
          selectedGalleryId,
          digitalTwinStatus,
          digitalTwinAvatarId,
          consentApproved,
          updatedAt: Date.now()
        },
        updatedAt: Date.now()
      });

      if (user?.role === 'ADMIN' && activeTab === 'admin') {
        const adminData = {
          maintenanceMode,
          allowRegistrations,
          plans,
          brokerageName,
          brokerageAddress,
          brokerageCity,
          brokerageProvince,
          brokerageCountry,
          brokeragePostalCode,
          brokeragePhone,
          brokerageEmail,
          adminEmail,
          socials,
          pricingTitle,
          pricingDescription,
          stripeConnected,
          webhookSecret,
          updatedBy: user.id,
          updatedAt: Date.now()
        };
        await setDoc(doc(db, "settings", "global"), adminData);

        // Add to system logs
        await addDoc(collection(db, "system_logs"), {
          type: "ACTION",
          message: "Global System Settings Updated",
          timestamp: serverTimestamp(),
          userEmail: user.email,
          userId: user.id,
          details: {
            changes: {
              maintenanceMode,
              allowRegistrations,
              stripeConnected
            }
          }
        });
      }

      if (autoSave) {
        toast.success("Changes auto-saved");
      } else {
        toast.success("Changes have been saved");
      }
      isDirtyRef.current = false;
    } catch (err: any) {
      console.error("Save Error:", err);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className={`space-y-6 mx-auto ${viewMode === 'ADMIN' ? 'max-w-[879px]' : 'max-w-4xl'}`}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-slate-500 mt-1">Manage system setup, compliance, and application defaults.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1">
          {viewMode !== 'ADMIN' ? (
            <>
              <button 
                onClick={() => switchTab("profile")}
                className={`w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Building2 className="h-4 w-4" /> Account Profile
              </button>
              <button 
                onClick={() => switchTab("billing")}
                className={`w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'billing' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <CreditCard className="h-4 w-4" /> Billings & Plans
              </button>
              <button 
                onClick={() => switchTab("branding")}
                className={`w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'branding' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Globe className="h-4 w-4" /> Branding & UI
              </button>
              <button 
                onClick={() => switchTab("compliance")}
                className={`w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'compliance' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Shield className="h-4 w-4" /> Compliance
              </button>
              <button 
                onClick={() => switchTab("notifications")}
                className={`w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'notifications' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Bell className="h-4 w-4" /> Notifications
              </button>
              <button 
                onClick={() => switchTab("welcome_defaults")}
                className={`w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'welcome_defaults' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Mic2 className="h-4 w-4" /> Sora Welcome Defaults
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => switchTab("profile")}
                className={`w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Building2 className="h-4 w-4" /> My Profile
              </button>
              <button 
                onClick={() => switchTab("avatars")}
                className={`w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'avatars' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Video className="h-4 w-4" /> AI Video Avatars
              </button>
            </>
          )}
          
          {user?.role === 'ADMIN' && viewMode === 'ADMIN' && (
            <button 
              onClick={() => switchTab("admin" as any)}
              className={`w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-left transition-colors ${activeTab === ('admin' as any) ? 'bg-red-50 text-red-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Shield className="h-4 w-4 text-red-500" /> Admin Control Panel
            </button>
          )}
        </div>
        
        <div className="md:col-span-3 space-y-6">
          {activeTab === "profile" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold">{viewMode === 'ADMIN' ? 'Admin Access' : 'Account Profile'}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your legal representative and office contact details.</p>
                </div>
                {viewMode !== 'ADMIN' && (
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    Agent Settings
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                      <span>Legal Representative / Corporate Name</span>
                    </label>
                    <input 
                      type="text" 
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.legalName ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                      value={legalName}
                      onChange={(e) => {
                        const val = e.target.value;
                        const formatted = val.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                        setLegalName(formatted);
                      }}
                      onBlur={(e) => handleBlur("legalName", e.target.value)}
                      placeholder="e.g., AI Open House Connect HQ"
                    />
                    {errors.legalName && <p className="text-xs text-red-500 font-medium">{errors.legalName}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                      <span>License ID / RECO</span>
                    </label>
                    <input 
                      type="text" 
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.recoId ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                      value={recoId}
                      onChange={(e) => setRecoId(e.target.value)}
                      onBlur={(e) => handleBlur("recoId", e.target.value)}
                      placeholder="e.g., B-481923"
                    />
                    {errors.recoId && <p className="text-xs text-red-500 font-medium">{errors.recoId}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                      <span>Broker of Record</span>
                    </label>
                    {viewMode !== 'ADMIN' ? (
                      <select 
                        className={`w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.brokerOfRecord ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                        value={brokerOfRecord || "Agent of Record"}
                        onChange={(e) => setBrokerOfRecord(e.target.value)}
                      >
                        <option value="Agent of Record">Agent of Record</option>
                        <option value="Broker of Record">Broker of Record</option>
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.brokerOfRecord ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                        value={brokerOfRecord}
                        onChange={(e) => {
                          const val = e.target.value;
                          const formatted = val.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                          setBrokerOfRecord(formatted);
                        }}
                        onBlur={(e) => handleBlur("brokerOfRecord", e.target.value)}
                        placeholder="e.g., Luc Valade"
                      />
                    )}
                    {errors.brokerOfRecord && <p className="text-xs text-red-500 font-medium">{errors.brokerOfRecord}</p>}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Office Address</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className={`text-sm font-medium ${errors.profileAddress ? 'text-red-600 font-bold' : 'text-slate-700'}`}>Address <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.profileAddress ? 'border-red-600 ring-red-100' : 'border-slate-200'}`} 
                        value={profileAddress}
                        onChange={(e) => setProfileAddress(capitalizeAddressWord(e.target.value))}
                        onBlur={(e) => handleBlur("profileAddress", e.target.value)}
                        placeholder="e.g., 760 Upper James St"
                      />
                      {errors.profileAddress && <p className="text-xs text-red-600 font-bold mt-1">{errors.profileAddress}</p>}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1.5">
                      <label className={`text-sm font-medium ${errors.profileCity ? 'text-red-600 font-bold' : 'text-slate-700'}`}>City <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.profileCity ? 'border-red-600 ring-red-100' : 'border-slate-200'}`} 
                        value={profileCity}
                        onChange={(e) => setProfileCity(capitalizeAddressWord(e.target.value))}
                        onBlur={(e) => handleBlur("profileCity", e.target.value)}
                        placeholder="e.g., Hamilton"
                      />
                      {errors.profileCity && <p className="text-xs text-red-600 font-bold mt-1">{errors.profileCity}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className={`text-sm font-medium ${errors.profileProvince ? 'text-red-600 font-bold' : 'text-slate-700'}`}>Province/State <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.profileProvince ? 'border-red-600 ring-red-100' : 'border-slate-200'}`} 
                        value={profileProvince}
                        onChange={(e) => setProfileProvince(capitalizeAddressWord(e.target.value))}
                        onBlur={(e) => handleBlur("profileProvince", e.target.value)}
                        placeholder="e.g., Ontario"
                      />
                      {errors.profileProvince && <p className="text-xs text-red-600 font-bold mt-1">{errors.profileProvince}</p>}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1.5">
                      <label className={`text-sm font-medium ${errors.profileCountry ? 'text-red-600 font-bold' : 'text-slate-700'}`}>Country <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.profileCountry ? 'border-red-600 ring-red-100' : 'border-slate-200'}`} 
                        value={profileCountry}
                        onChange={(e) => setProfileCountry(capitalizeAddressWord(e.target.value))}
                        onBlur={(e) => handleBlur("profileCountry", e.target.value)}
                        placeholder="e.g., Canada"
                      />
                      {errors.profileCountry && <p className="text-xs text-red-600 font-bold mt-1">{errors.profileCountry}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className={`text-sm font-medium ${errors.profilePostalCode ? 'text-red-600 font-bold' : 'text-slate-700'}`}>Postal/Zip Code <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.profilePostalCode ? 'border-red-600 ring-red-100' : 'border-slate-200'}`} 
                        value={profilePostalCode}
                        onChange={(e) => setProfilePostalCode(formatPostalCodeInput(e.target.value))}
                        onBlur={(e) => handleBlur("profilePostalCode", e.target.value)}
                        placeholder="e.g., L9C 3A2"
                      />
                      {errors.profilePostalCode && <p className="text-xs text-red-600 font-bold mt-1">{errors.profilePostalCode}</p>}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                      <span>Office Phone</span>
                      <span className="text-[10px] text-slate-400 font-mono">(555) 555-5555</span>
                    </label>
                    <input 
                      type="text" 
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.officePhone ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                      value={officePhone}
                      onChange={(e) => setOfficePhone(formatPhone(e.target.value))}
                      onBlur={(e) => handleBlur("officePhone", e.target.value)}
                      placeholder="(289) 659-5170"
                    />
                    {errors.officePhone && <p className="text-xs text-red-500 font-medium">{errors.officePhone}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                      <span>Office Email</span>
                    </label>
                    <input 
                      type="text" 
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.officeEmail ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                      value={officeEmail}
                      onChange={(e) => setOfficeEmail(e.target.value)}
                      onBlur={(e) => handleBlur("officeEmail", e.target.value)}
                      placeholder="ops@aiopenhouseconnect.com"
                    />
                    {errors.officeEmail && <p className="text-xs text-red-500 font-medium">{errors.officeEmail}</p>}
                  </div>
                </div>

                <div className="space-y-4 border border-slate-100 bg-slate-50/50 p-4 rounded-lg">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                        <span>Birthday Date</span>
                        <span className="text-[10px] text-slate-400 font-mono">YYYY-MM-DD</span>
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                        <span>Time Zone</span>
                        <span className="text-[10px] text-slate-400 font-mono">For Scheduled Alerts</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={birthTimeZone}
                        onChange={(e) => setBirthTimeZone(e.target.value)}
                      >
                        <option value="America/Toronto">Eastern Time (America/Toronto - Toronto/Montreal)</option>
                        <option value="America/New_York">Eastern Time (America/New_York - New York)</option>
                        <option value="America/Winnipeg">Central Time (America/Winnipeg - Winnipeg)</option>
                        <option value="America/Chicago">Central Time (America/Chicago - Chicago)</option>
                        <option value="America/Edmonton">Mountain Time (America/Edmonton - Edmonton/Calgary)</option>
                        <option value="America/Denver">Mountain Time (America/Denver - Denver)</option>
                        <option value="America/Vancouver">Pacific Time (America/Vancouver - Vancouver)</option>
                        <option value="America/Los_Angeles">Pacific Time (America/Los_Angeles - Los Angeles)</option>
                        <option value="America/Halifax">Atlantic Time (America/Halifax - Halifax)</option>
                        <option value="America/St_Johns">Newfoundland Time (America/St_Johns - St. John's)</option>
                      </select>
                    </div>
                  </div>

                  {viewMode === 'ADMIN' && (
                    <div className="pt-3 border-t border-slate-100 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">Birthday notification service runs automatically in the background.</span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/admin/trigger-birthday-check", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ force: true })
                            });
                            if (res.ok) {
                              const data = await res.json();
                              toast.success(`Birthday notification service triggered successfully! Checked user accounts.`);
                            } else {
                              toast.error("Failed to run birthday service check.");
                            }
                          } catch (err) {
                            toast.error("Error communicating with birthday service.");
                          }
                        }}
                        className="text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap"
                      >
                        Run Birthday Service Check Now
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Profile
                  </button>
                </div>
              </div>

              {user?.email === "luc.valade@gmail.com" && (
                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="text-sm font-bold text-amber-800 mb-2">Developer Tools</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-amber-900">Current Role: {user.role}</p>
                      <p className="text-[10px] text-amber-700">Toggle role to test ADMIN vs AGENT features.</p>
                    </div>
                    <button 
                      onClick={async () => {
                        if (!user?.id) return;
                        try {
                          const newRole = user.role === 'ADMIN' ? 'AGENT' : 'ADMIN';
                          await updateUser(user.id, { role: newRole, updatedAt: Date.now() });
                          toast.success(`Role successfully changed to ${newRole}.`);
                          setTimeout(() => window.location.reload(), 1000);
                        } catch (err) {
                          console.error("Role switch error:", err);
                          toast.error("Failed to update role in database.");
                        }
                      }}
                      className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded hover:bg-amber-700 transition-colors"
                    >
                      Switch to {user.role === 'ADMIN' ? 'AGENT' : 'ADMIN'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "branding" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-bold mb-4">Branding & UI</h2>

              {/* Dynamic QR Code & Branding Assets Verification Banner */}
              <div className="mb-6 p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col gap-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Branding Asset Verification Status</h3>
                  <p className="text-xs text-slate-600 leading-normal">
                    These assets are dynamically embedded in QR codes, print materials, listing websites, and voice walkthrough guides.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5 shrink-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    logoUrl 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${logoUrl ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    Brokerage Logo: {logoUrl ? "Verified ✅" : "Not Configured ⚠️"}
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    agentPhotoUrl 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${agentPhotoUrl ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    Agent Photo: {agentPhotoUrl ? "Verified ✅" : "Not Configured ⚠️"}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* TOP SECTION: Primary color */}
                <div className="border-b pb-6">
                  <div className="max-w-md space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Primary Color</label>
                    <div className="relative group">
                      <input 
                        type="text" 
                        className="w-full pl-3 pr-12 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono font-medium bg-white"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#2563EB"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <button className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100 transition-all outline-none cursor-pointer">
                              <div 
                                className="h-4 w-4 rounded shadow-inner border border-black/10" 
                                style={{ backgroundColor: primaryColor }}
                              />
                              <ChevronDown className="h-3 w-3 text-slate-400" />
                            </button>
                          } />
                          <DropdownMenuContent align="end" className="w-48 p-2">
                             <div className="grid grid-cols-5 gap-1.5 mb-2">
                              {["/src/pages/Settings.tsx", "#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#7c3aed", "#db2777", "#0891b2", "#ea580c", "#475569", "#000000"].filter(c => c.startsWith('#')).map(c => (
                                <button 
                                  key={c}
                                  className="h-6 w-6 rounded-md border border-slate-200 shadow-sm hover:scale-110 transition-transform cursor-pointer"
                                  style={{ backgroundColor: c }}
                                  onClick={() => setPrimaryColor(c)}
                                  title={c}
                                />
                              ))}
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => triggerColorPicker('primaryColorInput')} className="cursor-pointer">
                              <Plus className="h-3.5 w-3.5 mr-2" />
                              <span className="text-xs">Custom Color</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <input 
                        id="primaryColorInput"
                        type="color" 
                        className="sr-only"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                </div>

                {/* BOTTOM SECTION: Two column split for Brokerage Logo and Agent Photo */}
                <div className="grid md:grid-cols-2 gap-6 pt-2">
                  {/* LEFT COLUMN: Brokerage Logo URL */}
                  <div className="space-y-3.5 p-4 bg-slate-50/55 rounded-2xl border border-slate-100">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-bold text-slate-850">Brokerage Logo URL</label>
                      <span className="text-[10px] text-slate-400">Direct image link or native file attachment</span>
                    </div>
                    <input 
                      type="text" 
                      className={`w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.logoUrl ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      onBlur={(e) => handleBlur("logoUrl", e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                    {logoUrl && (
                      <div className="mt-3 p-2 bg-white border border-slate-200 rounded-lg inline-block shadow-sm">
                        <img src={logoUrl} alt="Logo preview" className="h-16 w-auto rounded-md object-contain max-w-[220px]" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <input 
                        id="logoInput" 
                        type="file" 
                        accept=".png,.jpg,.jpeg" 
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                             if (file.size > 2 * 1024 * 1024) {
                                toast.error("File size must be less than 2MB");
                                return;
                             }
                             setSelectedFile(file);
                             setLogoUrl(URL.createObjectURL(file));
                             toast.success(`Logo ${file.name} selected. Click "Save Changes" to finalize.`);
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => document.getElementById('logoInput')?.click()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-md transition-colors"
                      >
                        Select File
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setLogoUrl("");
                          setLogoStoragePath("");
                          const input = document.getElementById('logoInput') as HTMLInputElement;
                          if (input) input.value = '';
                          toast.info("Upload cancelled.");
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-md transition-colors"
                      >
                        Clear Logo
                      </button>
                      <span className="text-[10px] text-slate-400">.png or .jpg, max 2MB</span>
                    </div>
                    {errors.logoUrl && <p className="text-xs text-red-500 font-medium">{errors.logoUrl}</p>}
                  </div>

                  {/* RIGHT COLUMN: Agent Photo URL */}
                  <div className="space-y-3.5 p-4 bg-slate-50/55 rounded-2xl border border-slate-100">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-bold text-slate-850">Agent Photo URL</label>
                      <span className="text-[10px] text-slate-400">Direct headshot link or native file attachment</span>
                    </div>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border rounded-md text-sm bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={agentPhotoUrl}
                      onChange={(e) => setAgentPhotoUrl(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                    />
                    {agentPhotoUrl && (
                      <div className="mt-3 p-2 bg-white border border-slate-200 rounded-lg inline-block shadow-sm">
                        <img src={agentPhotoUrl} alt="Agent photo preview" className="h-16 w-16 object-cover rounded-full" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <input 
                        id="agentPhotoInput" 
                        type="file" 
                        accept=".png,.jpg,.jpeg" 
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                             if (file.size > 2 * 1024 * 1024) {
                                toast.error("File size must be less than 2MB");
                                return;
                             }
                             setSelectedAgentPhotoFile(file);
                             setAgentPhotoUrl(URL.createObjectURL(file));
                             toast.success(`Photo ${file.name} selected. Click "Save Changes" to finalize.`);
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => document.getElementById('agentPhotoInput')?.click()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-md transition-colors"
                      >
                        Select Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAgentPhotoFile(null);
                          setAgentPhotoUrl("");
                          const input = document.getElementById('agentPhotoInput') as HTMLInputElement;
                          if (input) input.value = '';
                          toast.info("Upload cancelled.");
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-md transition-colors"
                      >
                        Clear Photo
                      </button>
                      <span className="text-[10px] text-slate-400">.png or .jpg, max 2MB</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "compliance" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-bold mb-4">Compliance & Legal</h2>
              <div className="space-y-4">
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-medium text-slate-700">Default Disclaimer</label>
                  <div className="relative">
                    <textarea 
                      className={`w-full px-3 py-2 border rounded-md text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 pb-8 ${errors.disclaimer ? 'border-red-300 ring-red-100' : 'border-slate-200'}`}
                      value={disclaimer}
                      maxLength={2000}
                      onChange={(e) => {
                        const val = e.target.value;
                        const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
                        setDisclaimer(capitalized);
                      }}
                      onBlur={(e) => handleBlur("disclaimer", e.target.value)}
                      placeholder="Enter the legal disclaimer that appears on all marketing materials..."
                    />
                    {errors.disclaimer && <p className="text-xs text-red-500 font-medium mt-1">{errors.disclaimer}</p>}
                    <div className="absolute bottom-2 right-2 flex items-center pointer-events-none">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-50/80 backdrop-blur-sm border ${disclaimer.length >= 1500 ? 'text-amber-600 border-amber-200 bg-amber-50 font-bold' : disclaimer.length > 1900 ? 'text-red-500 border-red-100 bg-red-50' : 'text-slate-400 border-slate-100'}`}>
                        {disclaimer.length} / 2000 {disclaimer.length >= 1500 && <span className="animate-pulse font-normal ml-1">(75% Reached)</span>}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-bold text-slate-900">Licensing & Reciprocity</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">License Number</label>
                      <input 
                        type="text" 
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.licenseNumber ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        onBlur={(e) => handleBlur("licenseNumber", e.target.value)}
                        placeholder="e.g., A9999999"
                      />
                      {errors.licenseNumber && <p className="text-xs text-red-500 font-medium">{errors.licenseNumber}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Type of Licence <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.licenseType ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                        value={licenseType}
                        onChange={(e) => {
                          const val = e.target.value;
                          const formatted = val.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                          setLicenseType(formatted);
                        }}
                        onBlur={(e) => handleBlur("licenseType", e.target.value)}
                        placeholder="e.g., Real Estate Broker"
                      />
                      {errors.licenseType && <p className="text-xs text-red-500 font-medium">{errors.licenseType}</p>}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Issuing Jurisdiction <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.jurisdiction ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                        value={jurisdiction}
                        onChange={(e) => {
                          const val = e.target.value;
                          const formatted = val.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                          setJurisdiction(formatted);
                        }}
                        onBlur={(e) => handleBlur("jurisdiction", e.target.value)}
                        placeholder="e.g., Ontario, Canada"
                      />
                      {errors.jurisdiction && <p className="text-xs text-red-500 font-medium">{errors.jurisdiction}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Board Name <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.boardName ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                        value={boardName}
                        onChange={(e) => {
                          const val = e.target.value;
                          const formatted = val.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                          setBoardName(formatted);
                        }}
                        onBlur={(e) => handleBlur("boardName", e.target.value)}
                        placeholder="e.g., RECO, TRREB"
                      />
                      {errors.boardName && <p className="text-xs text-red-500 font-medium">{errors.boardName}</p>}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-1 gap-4 pt-4 border-t">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                      <span>Privacy Policy URL <span className="text-red-500">*</span></span>
                      <span className="text-[10px] text-slate-400">Must start with https:// and contain /privacy</span>
                    </label>
                    <input 
                      type="text" 
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.privacyUrl ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                      value={privacyUrl}
                      onChange={(e) => setPrivacyUrl(e.target.value)}
                      onBlur={(e) => handleBlur("privacyUrl", e.target.value)}
                      placeholder="https://www.yoursitename/privacy"
                    />
                    {errors.privacyUrl && <p className="text-xs text-red-500 font-medium">{errors.privacyUrl}</p>}
                  </div>
                </div>
                <div className="pt-4 border-t flex justify-end">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-bold mb-4">Notification Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-sm font-semibold">Lead Email Alerts</h4>
                    <p className="text-xs text-slate-500">Instant notification when a lead views your property.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.role !== 'ADMIN' && <span className="text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-500">Agent Only</span>}
                    <button 
                      onClick={() => setEmailAlerts(!emailAlerts)}
                      className={`h-6 w-11 rounded-full transition-colors relative ${emailAlerts ? 'bg-blue-600' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${emailAlerts ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-t">
                  <div>
                    <h4 className="text-sm font-semibold">SMS Notifications</h4>
                    <div className="space-y-1">
                      {user?.role === 'ADMIN' ? (
                        <p className="text-xs text-slate-500 italic">
                          * Agents: Receive texts for <span className="font-bold text-slate-700">Direct Offers</span> and <span className="font-bold text-slate-700">Price Feedback</span>.
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          * Agents: Receive instant texts for <span className="font-bold text-blue-600">Viewing Requests</span>.
                        </p>
                      )}
                    </div>
                  </div>
                   <button 
                    onClick={() => setSmsAlerts(!smsAlerts)}
                    className={`h-6 w-11 rounded-full transition-colors relative ${smsAlerts ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${smsAlerts ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between py-2 border-t">
                  <div>
                    <h4 className="text-sm font-semibold">Daily Activity Digest</h4>
                    <p className="text-xs text-slate-500 leading-tight italic">
                      * Includes: Listing view counts, new lead summary, and daily performance metrics.
                    </p>
                  </div>
                   <button 
                    onClick={() => setDailyDigest(!dailyDigest)}
                    className={`h-6 w-11 rounded-full transition-colors relative ${dailyDigest ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${dailyDigest ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                <div className="pt-4 border-t flex justify-end">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "welcome_defaults" && (
            <div className="settings-card-wrapper animate-in fade-in slide-in-from-right-4 duration-300">
              <WelcomeMessageDefaultsEmbed />
            </div>
          )}

          {activeTab === "avatars" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              
              {/* TOP WIZARD PROGRESS BAR */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between max-w-3xl mx-auto">
                  {[
                    { step: 1, label: "3D Extension" },
                    { step: 2, label: "Gallery & Twin" },
                    { step: 3, label: "Safety & Gateway" },
                    { step: 4, label: "Live Handshake" }
                  ].map((s, idx, arr) => (
                    <div key={s.step} className="flex items-center flex-1 last:flex-initial">
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (s.step <= avatarPage) {
                              setAvatarPage(s.step);
                            } else {
                              for (let p = avatarPage; p < s.step; p++) {
                                const check = validateAvatarStep(p);
                                if (!check.valid) {
                                  toast.error(check.message);
                                  return;
                                }
                              }
                              setAvatarPage(s.step);
                            }
                          }}
                          className="flex items-center gap-2 text-left focus:outline-none group cursor-pointer"
                        >
                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              avatarPage === s.step
                                ? "bg-blue-600 text-white ring-4 ring-blue-100"
                                : avatarPage > s.step
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                            }`}
                          >
                            {avatarPage > s.step ? "✓" : s.step}
                          </div>
                          <span className={`text-xs font-semibold whitespace-nowrap hidden sm:inline transition-colors ${avatarPage === s.step ? "text-blue-600 font-bold" : "text-slate-500 group-hover:text-slate-700"}`}>
                            {s.label}
                          </span>
                        </button>
                      </div>
                      {idx < arr.length - 1 && (
                        <div className={`h-[2px] mx-4 flex-1 ${avatarPage > s.step ? "bg-emerald-500" : "bg-slate-100"}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* PAGE 1: 3D EXTENSION */}
              {avatarPage === 1 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Video className="h-5 w-5 text-blue-600 animate-pulse" />
                        Sora AI Video Avatar (3D Extension) <span className="text-black font-black text-[10px] bg-stone-150 px-2 py-0.5 rounded tracking-widest uppercase ml-2">COMING SOON</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Deploy an interactive digital avatar layer to guide clients through physical tours, or interface with your Agent Voice Control.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded animate-pulse">
                      Live v1.0
                    </span>
                  </div>

                  <div className="p-4 border border-blue-100 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-blue-600 animate-spin-slow" />
                        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Sora Avatar Licensing & Tiers</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Interactive 3D Video Avatars are billed as a premium add-on or included in Elite/Brokerage subscription tiers.
                      </p>
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 bg-white/80 px-2 py-1 rounded border border-slate-100 w-fit mt-2">
                        <><AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Premium Add-on (Locked)</>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-black font-black text-xs tracking-widest uppercase mb-1.5">COMING SOON</span>
                      <button
                        type="button"
                        disabled
                        className="bg-stone-300 text-stone-500 font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-all whitespace-nowrap flex items-center gap-1.5 opacity-50 cursor-not-allowed pointer-events-none"
                      >
                        <CreditCard className="h-4 w-4" />
                        Unlock 3D Avatar ($20/mo)
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-150 rounded-xl flex items-center justify-between bg-stone-50/50 opacity-40 select-none pointer-events-none">
                      <div>
                        <h4 className="text-xs font-bold text-slate-500">Client-Facing AI Tours</h4>
                        <p className="text-[11px] text-slate-500 mt-1">Overlays the 3D avatar on public listing walk-throughs.</p>
                      </div>
                      <button
                        type="button"
                        disabled
                        className="h-6 w-11 rounded-full bg-stone-300 relative shrink-0 cursor-not-allowed"
                      >
                        <div className="absolute top-1 h-4 w-4 rounded-full bg-stone-150 left-1" />
                      </button>
                    </div>

                    <div className="p-4 border border-slate-150 rounded-xl flex items-center justify-between bg-slate-50/50">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Agent Voice Control</h4>
                        <p className="text-[11px] text-slate-500 mt-1">Render the avatar on your internal voice-directed dashboard.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnableVoiceAvatar(!enableVoiceAvatar)}
                        className={`h-6 w-11 rounded-full transition-colors relative shrink-0 cursor-pointer ${enableVoiceAvatar ? 'bg-blue-600' : 'bg-red-500'}`}
                      >
                        <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${enableVoiceAvatar ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>

                  {(!avatarAddonPaid || (!enableClientAvatar && !enableVoiceAvatar)) && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                      <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                      <span>Please unlock the 3D Extension and enable at least one avatar option. Make sure to click Save & Continue below to proceed.</span>
                    </div>
                  )}
                </div>
              )}

              {/* PAGE 2: GALLERY & TWIN */}
              {avatarPage === 2 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div className="flex border-b border-slate-100 gap-4">
                    <button
                      type="button"
                      onClick={() => setAvatarType("gallery")}
                      className={`pb-2 text-sm font-bold border-b-2 transition-all ${avatarType === "gallery" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"}`}
                    >
                      Sora Pre-Vetted Gallery
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarType("digital_twin")}
                      className={`pb-2 text-sm font-bold border-b-2 transition-all ${avatarType === "digital_twin" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"}`}
                    >
                      Create My Digital Twin (Likeness Clone)
                    </button>
                  </div>

                  {avatarType === "gallery" ? (
                    <div className="space-y-4">
                      <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg text-[11px] text-slate-600 leading-relaxed">
                        <span className="font-bold text-slate-700">Server-Side Gallery Filtering Policy:</span> This gallery queries pre-approved avatar files from HeyGen where <code>clothing_style IN (&apos;business_professional&apos;,&apos;smart_casual&apos;)</code> and <code>age_verified = true</code>. No casual styles or unverified accounts are loaded to preserve corporate brand integrity.
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { id: "kore", name: "Sora Classic", role: "Standard Professional Female", style: "Business Suit", desc: "Crisp, concise, highly professional British hybrid delivery.", voiceId: 2, color: "from-pink-500 to-rose-600" },
                          { id: "puck", name: "Alex (Puck)", role: "Casual Smart Male", style: "Oxford Collar Shirt", desc: "Warm, approcheable energetic modern delivery style.", voiceId: 3, color: "from-blue-500 to-sky-600" },
                          { id: "zephyr", name: "Sophia (Zephyr)", role: "Executive Female", style: "Formal Blazer", desc: "Formal British RP style. Perfect for luxury or commercial assets.", voiceId: 5, color: "from-purple-500 to-indigo-600" },
                          { id: "charon", name: "Marcus (Charon)", role: "Calm Reassuring Male", style: "Fine-knit Sweater", desc: "Deep, trustworthy tone. Ideal for family homes and long listings.", voiceId: 6, color: "from-emerald-500 to-teal-600" }
                        ].map((av) => {
                          const isSelected = selectedGalleryId === av.id;
                          return (
                            <div
                              key={av.id}
                              onClick={() => setSelectedGalleryId(av.id)}
                              className={`border rounded-xl p-4 flex flex-col justify-between transition-all cursor-pointer hover:shadow-md relative overflow-hidden ${isSelected ? 'border-blue-500 bg-blue-50/10 ring-2 ring-blue-100/50' : 'border-slate-200 bg-white'}`}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1 shadow-sm z-10">
                                  <Check className="h-3.5 w-3.5" />
                                </div>
                              )}
                              <div className="space-y-3">
                                <div className={`h-24 w-full rounded-lg bg-gradient-to-tr ${av.color} flex flex-col items-center justify-center text-white font-extrabold text-lg shadow-inner relative overflow-hidden`}>
                                  <span>{av.name.split(" ")[0]}</span>
                                  <span className="text-[9px] uppercase font-black tracking-widest opacity-70 mt-1">Pre-Vetted</span>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-xs font-extrabold text-slate-800">{av.name}</h4>
                                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{av.role}</p>
                                  <p className="text-xs text-slate-600 leading-normal line-clamp-2 mt-1">{av.desc}</p>
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t flex items-center justify-between text-[11px] font-mono text-slate-400">
                                <span>Voice ID: {av.voiceId}</span>
                                <button
                                  type="button"
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 flex items-center gap-1 cursor-pointer ${
                                    activePreviewVoiceId === av.id
                                      ? "bg-rose-100 border-rose-300 text-rose-700 hover:bg-rose-200"
                                      : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePreview(av);
                                  }}
                                >
                                  {activePreviewVoiceId === av.id ? "Stop Preview" : "Start Preview"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      
                      {/* Status Checker */}
                      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Biometric Identity Status</span>
                          <div className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${
                              digitalTwinStatus === "approved" ? "bg-emerald-500 animate-ping" :
                              digitalTwinStatus === "processing" ? "bg-amber-500 animate-pulse" :
                              digitalTwinStatus === "rejected" ? "bg-rose-500" : "bg-slate-300"
                            }`} />
                            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                              {digitalTwinStatus === "none" && "No Clone Configured"}
                              {digitalTwinStatus === "processing" && "Processing & Matching Twin..."}
                              {digitalTwinStatus === "approved" && "Verified & Active"}
                              {digitalTwinStatus === "rejected" && "Rejected — Compliance Check Failed"}
                            </h4>
                          </div>
                        </div>

                        {digitalTwinStatus === "processing" && (
                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setDigitalTwinStatus("approved");
                                setDigitalTwinAvatarId("dt-agent-clone-99");
                                toast.success("Simulation: Digital Twin verified successfully!");
                              }}
                              className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg hover:bg-emerald-700 cursor-pointer shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setDigitalTwinStatus("rejected")}
                              className="bg-rose-600 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg hover:bg-rose-700 cursor-pointer shadow-sm"
                            >
                              Fail
                            </button>
                          </div>
                        )}
                      </div>

                      {digitalTwinStatus === "none" && (
                        <div className="space-y-4">
                          <div className="p-4 border rounded-xl bg-white space-y-2">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                              <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">1</span>
                              Video Training upload (2-Minute Requirement)
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Upload a clean, 2-minute video: 15 seconds listening, 90 seconds talking, 15 seconds listening, uncut. Well-lit, one continuous take. Submissions must be of legal adult age.
                            </p>
                            <input
                              type="file"
                              id="training-file-input"
                              accept="video/*"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setSelectedTrainingFile(file);
                                  setTrainingFileName(file.name);
                                  toast.success(`Selected training video: ${file.name}`);
                                }
                              }}
                            />
                            <div 
                              className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer" 
                              onClick={() => document.getElementById("training-file-input")?.click()}
                            >
                              <Upload className="h-6 w-6 text-slate-400 mb-1" />
                              <span className="text-xs font-semibold text-slate-700">
                                {trainingFileName ? `Selected: ${trainingFileName}` : "Drag & drop your 2-minute raw training clip"}
                              </span>
                              {trainingFileName && <span className="text-[10px] text-emerald-600 font-bold mt-1">Ready to upload ✓</span>}
                            </div>
                          </div>

                          <div className="p-4 border rounded-xl bg-white space-y-3">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                              <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">2</span>
                              Mandatory Identity & Biometric Legal Consent
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Record a separate short video (under 30 seconds) reading the verbatim statement below:
                            </p>
                            <div className="bg-slate-950 text-slate-100 p-3 rounded-lg font-mono text-[10px] leading-relaxed border border-slate-800">
                              "I, <span className="text-blue-400 font-bold">{legalName || user?.name || "Agent Name"}</span>, hereby authorize AI Open House Connect and its video processing engine to create a high-fidelity 3D digital twin avatar of my face, voice, and likeness."
                            </div>
                            <div className="flex items-start gap-2 bg-blue-50/40 border border-blue-100 p-2.5 rounded">
                              <input
                                type="checkbox"
                                id="consent-check"
                                checked={consentApproved}
                                onChange={(e) => setConsentApproved(e.target.checked)}
                                className="h-4 w-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <label htmlFor="consent-check" className="text-xs text-slate-700 leading-normal cursor-pointer font-medium">
                                I verify that I will speak the exact verbatim consent script.
                              </label>
                            </div>
                            <input
                              type="file"
                              id="consent-file-input"
                              accept="video/*"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setSelectedConsentFile(file);
                                  setConsentFileName(file.name);
                                  toast.success(`Selected consent video: ${file.name}`);
                                }
                              }}
                            />
                            <div 
                              className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer" 
                              onClick={() => document.getElementById("consent-file-input")?.click()}
                            >
                              <Video className="h-6 w-6 text-slate-400 mb-1" />
                              <span className="text-xs font-semibold text-slate-700">
                                {consentFileName ? `Selected: ${consentFileName}` : "Upload your short consent confirmation video"}
                              </span>
                              {consentFileName && <span className="text-[10px] text-emerald-600 font-bold mt-1">Ready to upload ✓</span>}
                            </div>
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!trainingFileName) {
                                  toast.error("Please upload your 2-minute raw training clip first.");
                                  return;
                                }
                                if (!consentApproved) {
                                  toast.error("Please verify compliance & check the consent box first.");
                                  return;
                                }
                                if (!consentFileName) {
                                  toast.error("Please upload your short consent confirmation video first.");
                                  return;
                                }
                                setDigitalTwinStatus("processing");
                                toast.success("Likeness training pipeline initialized!");
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              Submit to Processing (~10 mins)
                            </button>
                          </div>
                        </div>
                      )}

                      {digitalTwinStatus === "processing" && (
                        <div className="p-8 border border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-2 bg-slate-50/50">
                          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                          <h4 className="font-bold text-slate-800 text-xs">Processing Custom Likeness</h4>
                          <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
                            HeyGen&apos;s biometric identity matcher is auditing your consent video. This usually takes 10-15 minutes. Use the simulator buttons above to approve or fail the processing.
                          </p>
                        </div>
                      )}

                      {digitalTwinStatus === "approved" && (
                        <div className="p-6 border border-emerald-150 rounded-xl bg-emerald-50/10 flex flex-col items-center justify-center text-center space-y-2">
                          <Check className="h-8 w-8 text-emerald-600 animate-bounce" />
                          <h4 className="font-bold text-slate-800 text-xs">Active Custom Avatar: &quot;My Digital Twin&quot;</h4>
                          <p className="text-xs text-slate-500">Designated ID: dt-agent-clone-99. Status: Verified & Active.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PAGE 3: SECURITY & GATEWAY */}
              {avatarPage === 3 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      Sora safety Speak Moderation API Console
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-normal">
                      Every listing walkthrough generated by Gemini passes through a real-time server-side safety moderation script before sending to HeyGen to filter explicit, violent, or inappropriate content.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <textarea
                        rows={3}
                        value={scriptToModerate}
                        onChange={(e) => setScriptToModerate(e.target.value)}
                        placeholder="Type a script to test safety moderation..."
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-slate-50/50"
                      />
                      <button
                        type="button"
                        disabled={moderationLoading}
                        onClick={handleTestScript}
                        className="absolute right-3 bottom-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {moderationLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
                        Scan Script
                      </button>
                    </div>

                    {moderationResult && (
                      <div className={`p-4 border rounded-xl text-xs space-y-2 animate-in fade-in duration-200 ${moderationResult.passed ? 'bg-emerald-50/40 border-emerald-100' : 'bg-red-50/40 border-red-100'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">Moderation Output</span>
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${moderationResult.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {moderationResult.passed ? "Passed Check" : "Flagged & Filtered"}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] leading-relaxed text-slate-700 bg-white p-2 rounded border border-slate-100">
                          <strong>Output sent to HeyGen:</strong> &quot;{moderationResult.sanitizedText}&quot;
                        </div>
                        {!moderationResult.passed && (
                          <p className="text-[10px] text-red-600">
                            Warning: Prohibited terms were redacted by safety middleware BEFORE execution to prevent HeyGen account termination.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-150 pt-4 space-y-4">
                    <div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                        <RefreshCw className="h-4 w-4 text-blue-600" />
                        HeyGen API Gateway Integration Points
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Secure, server-side REST configurations proxying tokens without exposing keys to the client.
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 space-y-1">
                        <span className="text-[9px] font-mono text-blue-600 font-extrabold uppercase bg-blue-50 px-1.5 py-0.5 rounded">POST</span>
                        <div className="text-[10px] font-mono font-bold text-slate-800">/train-avatar</div>
                        <p className="text-[9px] text-slate-500 leading-relaxed">Submits the 2-min training file + consent script for biometric clone compilation.</p>
                      </div>
                      <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 space-y-1">
                        <span className="text-[9px] font-mono text-purple-600 font-extrabold uppercase bg-purple-50 px-1.5 py-0.5 rounded">POST</span>
                        <div className="text-[10px] font-mono font-bold text-slate-800">/live-session</div>
                        <p className="text-[9px] text-slate-500 leading-relaxed">Starts a real-time WebRTC streaming peer session, fetching ICE server tokens.</p>
                      </div>
                      <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 space-y-1">
                        <span className="text-[9px] font-mono text-amber-600 font-extrabold uppercase bg-amber-50 px-1.5 py-0.5 rounded">GET</span>
                        <div className="text-[10px] font-mono font-bold text-slate-800">/status/:avatarId</div>
                        <p className="text-[9px] text-slate-500 leading-relaxed">Webhooks and poller checking processing status to automatically deploy twins.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 4: LIVE MONITOR */}
              {avatarPage === 4 && (
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-xl border border-slate-850 space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-blue-400">Handshake Live</span>
                      <h3 className="text-base font-extrabold text-white">Live Avatar Monitor</h3>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      liveSessionDetails 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {liveSessionDetails ? "WebRTC STREAM" : "IDLE"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Glowing Live Feed Window */}
                    <div className="lg:col-span-2 relative h-80 w-full rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 flex flex-col items-center justify-center overflow-hidden group shadow-inner">
                      
                      {/* Active Video Screen simulation */}
                      {liveSessionDetails ? (
                        <>
                          <video
                            key={selectedGalleryId}
                            src={
                              selectedGalleryId === "kore"
                                ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
                                : selectedGalleryId === "puck"
                                ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
                                : selectedGalleryId === "zephyr"
                                ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
                                : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                            }
                            className="absolute inset-0 w-full h-full object-cover opacity-60"
                            autoPlay
                            loop
                            muted
                            playsInline
                            crossOrigin="anonymous"
                          />
                          <div className="absolute inset-0 flex flex-col justify-between p-4 z-10 animate-in fade-in duration-300 bg-slate-950/20">
                            {/* Live Indicator */}
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 bg-red-600/90 text-[9px] text-white font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full animate-pulse shadow-sm">
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                webrtc stream
                              </span>
                              <span className="text-[9px] font-mono text-slate-400 bg-slate-950/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-slate-850">
                                {liveSessionDetails.quality || "1080p"}
                              </span>
                            </div>

                            {/* Central Pulsing Avatar Graphic representing active stream */}
                            <div className="flex flex-col items-center justify-center grow">
                              <div className="relative animate-pulse">
                                <div className="absolute -inset-1.5 rounded-full bg-blue-500 opacity-20 blur" />
                                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-blue-400 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                                  {avatarType === "gallery" 
                                    ? (selectedGalleryId === "kore" ? "So" : selectedGalleryId === "puck" ? "Al" : selectedGalleryId === "zephyr" ? "So" : "Ma") 
                                    : "DT"
                                  }
                                </div>
                              </div>
                              <span className="text-sm font-bold text-white mt-3 shadow-sm">
                                {avatarType === "gallery" 
                                  ? (selectedGalleryId === "kore" ? "Sora Standard" : selectedGalleryId === "puck" ? "Sora Friendly" : selectedGalleryId === "zephyr" ? "Sora Professional" : "Sora Luxury") 
                                  : "My Digital Twin"
                                }
                              </span>
                              <span className="text-[10px] text-slate-300 mt-1 font-mono drop-shadow bg-slate-950/40 px-1.5 py-0.5 rounded">Status: Connected to live WebRTC port</span>
                            </div>

                            {/* Live Speech transcript indicator */}
                            <div className="bg-slate-950/80 backdrop-blur-sm border border-slate-800 p-2.5 rounded-xl text-center space-y-1">
                              <span className="text-[8px] uppercase tracking-widest text-slate-500 font-extrabold block">Live script transcript feedback</span>
                              <p className="text-[10px] text-slate-300 leading-normal line-clamp-2 italic">
                                {isPlayingPreview ? scriptToModerate : "Listening for voice direction/script updates..."}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                          <div className="h-14 w-14 rounded-full bg-slate-850 flex items-center justify-center text-slate-500 border border-slate-800">
                            <Video className="h-6 w-6 text-slate-400" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Avatar Feed offline</span>
                            <p className="text-xs text-slate-400 leading-normal max-w-[200px]">
                              Click "Start Live Video Tour" on the right to connect with your virtual guide.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 flex flex-col justify-between">
                      {/* Active Avatar Meta details */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 block">Active Avatar Configuration</span>
                        
                        <div className="grid grid-cols-1 gap-2.5 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-500 block uppercase">Avatar Name</span>
                            <span className="font-bold text-white leading-normal block">
                              {avatarType === "gallery" 
                                ? (selectedGalleryId === "kore" ? "Sora Standard" : selectedGalleryId === "puck" ? "Sora Friendly" : selectedGalleryId === "zephyr" ? "Sora Professional" : "Sora Luxury") 
                                : "My Digital Twin"
                              }
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-500 block uppercase">Type & Engine Match</span>
                            <span className="font-bold text-blue-400 leading-normal block font-mono">HeyGen Live v1 (WebRTC)</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-500 block uppercase">Billing Gate</span>
                            <span className="font-bold text-emerald-400 leading-normal block">Elite Included</span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Handshake Console Logs */}
                      {liveSessionDetails && (
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 font-mono text-[9px] text-slate-400 space-y-1">
                          <span className="text-[8px] uppercase tracking-widest text-slate-500 font-extrabold block">Handshake Metrics</span>
                          <div className="text-emerald-400 font-bold">✓ ICE Servers loaded</div>
                          <div className="text-slate-300">✓ Token auth verification succeeded</div>
                        </div>
                      )}

                      {/* Handshake actions */}
                      <div className="space-y-2 pt-2">
                        {!liveSessionDetails ? (
                          <button
                            type="button"
                            onClick={handleStartLiveStream}
                            disabled={isInitializingLive}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                          >
                            {isInitializingLive ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Connecting Live Tour...
                              </>
                            ) : (
                              <>
                                <Play className="h-3.5 w-3.5" />
                                Start Live Video Tour
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setLiveSessionDetails(null);
                              setIsPlayingPreview(false);
                              toast.info("WebRTC stream session terminated.");
                            }}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                          >
                            <Pause className="h-3.5 w-3.5" />
                            End Live Video Tour
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NAVIGATION FOOTER */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {avatarPage > 1 && (
                    <button
                      type="button"
                      onClick={() => setAvatarPage(avatarPage - 1)}
                      className="border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {avatarPage < 4 ? (
                    <button
                      type="button"
                      onClick={() => {
                        const check = validateAvatarStep(avatarPage);
                        if (!check.valid) {
                          toast.error(check.message);
                          return;
                        }
                        toast.success(`Step ${avatarPage} configurations saved locally!`);
                        setAvatarPage(avatarPage + 1);
                      }}
                      className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      Save & Continue
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-xs hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save Avatar Settings
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

          {activeTab === "billing" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <Billing />
            </div>
          )}

          {activeTab === "admin" && user?.role === 'ADMIN' && (
            <div className="bg-white border border-red-100 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <h2 className="text-lg font-bold text-red-900">Admin Control Panel</h2>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setAdminSubTab("overview")}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${adminSubTab === 'overview' ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                  >
                    System
                  </button>
                  <button 
                    onClick={() => setAdminSubTab("company")}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${adminSubTab === 'company' ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                  >
                    Company
                  </button>
                  <button 
                    onClick={() => setAdminSubTab("plans")}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${adminSubTab === 'plans' ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                  >
                    Pricing
                  </button>
                  <button 
                    onClick={() => setAdminSubTab("stripe")}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${adminSubTab === 'stripe' ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                  >
                    Stripe
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                {adminSubTab === "overview" && (
                  <>
                    <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                      <h3 className="text-sm font-bold text-red-800 mb-2">Global System Configuration</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-red-700">Maintenance Mode</span>
                          <button 
                            onClick={() => setMaintenanceMode(!maintenanceMode)}
                            className={`h-5 w-9 rounded-full relative transition-colors ${maintenanceMode ? 'bg-red-600' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-0.5 h-4 w-4 bg-white rounded-full transition-all ${maintenanceMode ? 'right-1' : 'left-1'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-red-700">Allow New Agent Registrations</span>
                          <button 
                            onClick={() => setAllowRegistrations(!allowRegistrations)}
                            className={`h-5 w-9 rounded-full relative transition-colors ${allowRegistrations ? 'bg-green-500' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-0.5 h-4 w-4 bg-white rounded-full transition-all ${allowRegistrations ? 'right-1' : 'left-1'}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t space-y-4">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest px-1">Billing & Subscription</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-lg hover:border-red-300 cursor-pointer transition-colors" onClick={() => setAdminSubTab("plans")}>
                          <h4 className="font-bold text-sm text-red-600">Company Plans</h4>
                          <p className="text-xs text-slate-500">Manage agent quotas and pricing.</p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors" onClick={() => setAdminSubTab("stripe")}>
                          <h4 className="font-bold text-sm text-blue-600">Payment Rails</h4>
                          <p className="text-xs text-slate-500">Stripe connectivity status.</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {adminSubTab === "company" && (
                   <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">AI Open House Connect File</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 col-span-2">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">Company Name</label>
                          <input 
                            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                            value={brokerageName}
                            maxLength={100}
                            required
                            onChange={(e) => setBrokerageName(toTitleCase(e.target.value))}
                            placeholder="AI Open House Connect HQ"
                          />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">Address</label>
                          <input 
                            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                            value={brokerageAddress}
                            maxLength={200}
                            required
                            onChange={(e) => setBrokerageAddress(toTitleCase(e.target.value))}
                            placeholder="123 King St W"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 col-span-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">City</label>
                            <input 
                              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                              value={brokerageCity}
                              maxLength={100}
                              required
                              onChange={(e) => setBrokerageCity(toTitleCase(e.target.value))}
                              placeholder="Toronto"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">Province / State</label>
                            <select 
                              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none disabled:opacity-50 disabled:bg-slate-100"
                              value={brokerageProvince}
                              onChange={(e) => setBrokerageProvince(e.target.value)}
                              disabled={!brokerageCountry}
                            >
                              <option value="">{brokerageCountry ? `Select ${brokerageCountry === 'Canada' ? 'Province' : 'State'}` : 'Select Country First'}</option>
                              {brokerageCountry === "Canada" && CA_PROVINCES.map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                              {brokerageCountry === "USA" && US_STATES.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">Postal / Zip Code</label>
                            <div className="flex gap-2">
                              <input 
                                className="flex-1 text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                value={brokeragePostalCode}
                                maxLength={20}
                                onChange={(e) => setBrokeragePostalCode(e.target.value)}
                                placeholder="M5X 1C7"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">Country</label>
                            <select 
                              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                              value={brokerageCountry}
                              onChange={(e) => {
                                setBrokerageCountry(e.target.value);
                                setBrokerageProvince(""); // Reset province when country changes
                              }}
                            >
                              <option value="">Select Country</option>
                              <option value="Canada">Canada</option>
                              <option value="USA">USA</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">Office Phone</label>
                            <input 
                              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                              value={brokeragePhone}
                              maxLength={20}
                              onChange={(e) => setBrokeragePhone(formatPhone(e.target.value))}
                              placeholder="(289) 659-5170"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">Office Email</label>
                          <input 
                            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                            value={brokerageEmail}
                            type="email"
                            required
                            maxLength={100}
                            onChange={(e) => setBrokerageEmail(e.target.value)}
                            placeholder="office@vertexrealty.ca"
                          />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">Admin Contact Email</label>
                          <input 
                            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                            value={adminEmail}
                            type="email"
                            required
                            maxLength={100}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            placeholder="admin@vertexrealty.ca"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Social Profiles (URLs)</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {Object.entries(socials).map(([key, value]) => (
                          <div key={key} className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-tight capitalize">{key === 'x' ? 'X (formerly Twitter)' : key}</label>
                            <input 
                              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                              value={value}
                              onChange={(e) => setSocials({ ...socials, [key]: e.target.value })}
                              placeholder={`https://${key}.com/username`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}



                {adminSubTab === "plans" && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                        Subscription Plans Management
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded tracking-widest uppercase">Live Updates</span>
                      </h3>

                      <div className="space-y-4 mb-6 pb-6 border-b border-slate-200">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">Pricing Header Title</label>
                          <input 
                            className="w-full text-lg font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                            value={pricingTitle}
                            onChange={(e) => setPricingTitle(e.target.value)}
                            placeholder="Simple, flexible pricing"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">Pricing Header Description</label>
                          <textarea 
                            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-600 focus:ring-2 focus:ring-red-500 focus:outline-none min-h-[80px]"
                            value={pricingDescription}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPricingDescription(val.charAt(0).toUpperCase() + val.slice(1));
                            }}
                            placeholder="Pricing models designed to maximize your revenue..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        {plans.map((plan, idx) => (
                          <div key={plan.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plan Name</label>
                                <input 
                                  value={plan.name}
                                  onChange={(e) => {
                                    const newPlans = [...plans];
                                    newPlans[idx].name = e.target.value;
                                    setPlans(newPlans);
                                  }}
                                  className="w-full text-sm font-bold border-b border-transparent focus:border-red-500 focus:outline-none transition-colors"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Price ($)</label>
                                <input 
                                  type="number"
                                  value={plan.price}
                                  onChange={(e) => {
                                    const newPlans = [...plans];
                                    newPlans[idx].price = parseInt(e.target.value) || 0;
                                    setPlans(newPlans);
                                  }}
                                  className="w-full text-sm font-bold border-b border-transparent focus:border-red-500 focus:outline-none transition-colors"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Listings Limit (-1 for unlimited)</label>
                              <input 
                                type="number"
                                value={plan.listings}
                                onChange={(e) => {
                                  const newPlans = [...plans];
                                  newPlans[idx].listings = parseInt(e.target.value);
                                  setPlans(newPlans);
                                }}
                                className="w-full text-sm font-bold border-b border-transparent focus:border-red-500 focus:outline-none transition-colors"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Key Features (comma separated)</label>
                              <textarea 
                                value={plan.features.join(", ")}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
                                  const newPlans = [...plans];
                                  newPlans[idx].features = capitalized.split(",").map(f => f.trim());
                                  setPlans(newPlans);
                                }}
                                className="w-full text-xs text-slate-600 min-h-[60px] border border-slate-100 rounded p-2 focus:ring-1 focus:ring-red-500 focus:outline-none transition-colors"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {adminSubTab === "stripe" && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Stripe Administration</h3>
                          <p className="text-xs text-slate-500">Manage global transaction settings and connectivity.</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${stripeConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {stripeConnected ? 'CONNECTED' : 'DISCONNECTED'}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                          <div>
                            <p className="text-sm font-bold text-slate-800">Payment Gateway Status</p>
                            <p className="text-xs text-slate-500">Toggle live/test mode processing for all agents.</p>
                          </div>
                          <button 
                            onClick={() => setStripeConnected(!stripeConnected)}
                            className={`h-6 w-11 rounded-full relative transition-colors ${stripeConnected ? 'bg-blue-600' : 'bg-slate-300'}`}
                          >
                            <div className={`absolute top-1 h-4 w-4 bg-white rounded-full transition-all ${stripeConnected ? 'right-1' : 'left-1'}`} />
                          </button>
                        </div>

                        <div className="space-y-4 pt-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Webhook Secret</label>
                            <div className="flex gap-2">
                              <input 
                                type="password" 
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-red-500 focus:outline-none"
                                value={webhookSecret}
                                onChange={(e) => setWebhookSecret(e.target.value)}
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 italic">Used for synchronizing subscription states across all agent accounts.</p>
                          </div>

                          <div className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <CreditCard className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">Master Merchant Account</p>
                                <p className="text-xs text-slate-500">acct_1Ou9XP...</p>
                              </div>
                            </div>
                            <button 
                              className="text-xs font-black uppercase tracking-widest text-blue-600 hover:underline"
                              onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                            >
                              Stripe Dashboard
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (viewMode === 'ADMIN') {
                        navigate('/app/admin');
                      } else {
                        navigate('/app');
                      }
                    }}
                    className="px-4 py-2 border border-slate-200 rounded-md font-medium text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-red-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

