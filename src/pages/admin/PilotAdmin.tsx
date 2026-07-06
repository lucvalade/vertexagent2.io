import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save, Globe, Plus, Trash2, ShieldAlert } from "lucide-react";

// Translations dictionary for EN/FR UI support
const TRANSLATIONS = {
  en: {
    title: "VertexAgent — Pilot Admin",
    save: "Save",
    saving: "Saving...",
    saved: "Saved successfully",
    loadError: "Failed to load current values",
    saveError: "Failed to save values",
    retry: "Retry",
    listingTab: "Listing",
    agentTab: "Agent",
    group1: "Group 1 — Address",
    group2: "Group 2 — Listing Details",
    group3: "Group 3 — Specs",
    group4: "Group 4 — Narrative",
    group5: "Group 5 — Open House",
    group6: "Group 6 — Controls",
    address: "Address",
    city: "City",
    province: "Province",
    postalCode: "Postal Code",
    mlsNumber: "MLS Number",
    propertyType: "Property Type",
    status: "Status",
    listPrice: "List Price (CAD)",
    taxes: "Taxes (CAD/year)",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    squareFeet: "Square Feet",
    yearBuilt: "Year Built",
    parking: "Parking",
    heating: "Heating",
    cooling: "Cooling",
    description: "Description",
    features: "Features",
    upgrades: "Upgrades",
    openHouseTimes: "Open House Times",
    addFeature: "Add Feature",
    addUpgrade: "Add Upgrade",
    addOpenHouse: "Add Open House",
    start: "Start",
    end: "End",
    remove: "Remove",
    avatarEnabled: "Enable 'Meet the AI Agent' button on this listing (kill switch).",
    agentUid: "Agent UID (Read-only)",
    firstName: "First Name",
    lastName: "Last Name",
    brokerage: "Brokerage",
    phone: "Phone",
    email: "Email",
    languages: "Spoken Languages",
    english: "English",
    french: "French",
    noFeatures: "No features added yet.",
    noUpgrades: "No upgrades added yet.",
    noOpenHouses: "No open house times scheduled.",
    validationEmail: "Please enter a valid email address.",
    validationPhone: "Format hint: +1 XXX XXX XXXX"
  },
  fr: {
    title: "VertexAgent — Admin Pilote",
    save: "Enregistrer",
    saving: "Enregistrement...",
    saved: "Enregistré avec succès",
    loadError: "Échec du chargement des valeurs actuelles",
    saveError: "Échec de l'enregistrement des valeurs",
    retry: "Réessayer",
    listingTab: "Détails de la propriété",
    agentTab: "Détails de l'agent",
    group1: "Groupe 1 — Adresse",
    group2: "Groupe 2 — Détails de l'annonce",
    group3: "Groupe 3 — Caractéristiques",
    group4: "Groupe 4 — Description & Listes",
    group5: "Groupe 5 — Portes Ouvertes",
    group6: "Groupe 6 — Contrôles",
    address: "Adresse",
    city: "Ville",
    province: "Province",
    postalCode: "Code Postal",
    mlsNumber: "Numéro MLS",
    propertyType: "Type de propriété",
    status: "Statut",
    listPrice: "Prix de liste (CAD)",
    taxes: "Taxes (CAD/an)",
    bedrooms: "Chambres",
    bathrooms: "Salles de bain",
    squareFeet: "Superficie (pieds carrés)",
    yearBuilt: "Année de construction",
    parking: "Stationnement",
    heating: "Chauffage",
    cooling: "Climatisation",
    description: "Description",
    features: "Caractéristiques principales",
    upgrades: "Améliorations",
    openHouseTimes: "Horaires des Portes Ouvertes",
    addFeature: "Ajouter une caractéristique",
    addUpgrade: "Ajouter une amélioration",
    addOpenHouse: "Ajouter des Portes Ouvertes",
    start: "Heure de début",
    end: "Heure de fin",
    remove: "Supprimer",
    avatarEnabled: "Activer le bouton 'Meet the AI Agent' sur cette annonce (bouton d'arrêt d'urgence).",
    agentUid: "UID de l'agent (Lecture seule)",
    firstName: "Prénom",
    lastName: "Nom",
    brokerage: "Courtier / Agence",
    phone: "Téléphone",
    email: "Courriel",
    languages: "Langues parlées",
    english: "Anglais",
    french: "Français",
    noFeatures: "Aucune caractéristique ajoutée.",
    noUpgrades: "Aucune amélioration ajoutée.",
    noOpenHouses: "Aucune porte ouverte de planifiée.",
    validationEmail: "Veuillez entrer une adresse courriel valide.",
    validationPhone: "Exemple de format: +1 XXX XXX XXXX"
  }
};

// America/Toronto timezone offset helper
function getTorontoOffset(date: Date): string {
  const year = date.getFullYear();
  // EDT begins second Sunday of March, ends first Sunday of November
  let sundayCount = 0;
  let dstStart = new Date(year, 2, 1);
  for (let d = 1; d <= 14; d++) {
    const temp = new Date(year, 2, d);
    if (temp.getDay() === 0) {
      sundayCount++;
      if (sundayCount === 2) {
        dstStart = temp;
        break;
      }
    }
  }
  
  let dstEnd = new Date(year, 10, 1);
  for (let d = 1; d <= 7; d++) {
    const temp = new Date(year, 10, d);
    if (temp.getDay() === 0) {
      dstEnd = temp;
      break;
    }
  }
  
  dstStart.setHours(2, 0, 0, 0);
  dstEnd.setHours(2, 0, 0, 0);
  
  const isDST = date >= dstStart && date < dstEnd;
  return isDST ? "-04:00" : "-05:00";
}

// Convert from datetime-local value (YYYY-MM-DDTHH:mm) to ISO with Toronto timezone offset
function toTorontoISOString(localStr: string): string {
  if (!localStr) return "";
  const [datePart, timePart] = localStr.split("T");
  if (!datePart || !timePart) return "";
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  const dateObj = new Date(year, month - 1, day, hours, minutes);
  const offset = getTorontoOffset(dateObj);
  return `${localStr}:00${offset}`;
}

// Extract the local datetime part from an ISO 8601 string
function toLocalDatetimeString(isoStr: string): string {
  if (!isoStr) return "";
  // Extract up to YYYY-MM-DDTHH:mm
  return isoStr.substring(0, 16);
}

// Format numbers with commas
const formatNumberWithCommas = (val: string | number) => {
  if (val === undefined || val === null || val === "") return "";
  const num = parseFloat(String(val).replace(/,/g, ""));
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("en-US").format(num);
};

// Parse formatted strings into plain numbers
const parseNumberFromCommas = (str: string): number => {
  if (!str) return 0;
  const parsed = parseFloat(str.replace(/,/g, ""));
  return isNaN(parsed) ? 0 : parsed;
};

export default function PilotAdmin() {
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [activeTab, setActiveTab] = useState<"listing" | "agent">("listing");
  
  const [loadingListing, setLoadingListing] = useState(true);
  const [loadingAgent, setLoadingAgent] = useState(true);
  const [savingListing, setSavingListing] = useState(false);
  const [savingAgent, setSavingAgent] = useState(false);
  
  const [listingLoadError, setListingLoadError] = useState<string | null>(null);
  const [agentLoadError, setAgentLoadError] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  // Listing fields
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("ON");
  const [postalCode, setPostalCode] = useState("");
  const [mlsNumber, setMlsNumber] = useState("");
  const [propertyType, setPropertyType] = useState("Detached");
  const [status, setStatus] = useState("Active");
  
  const [listPriceStr, setListPriceStr] = useState("");
  const [taxesStr, setTaxesStr] = useState("");
  
  const [bedrooms, setBedrooms] = useState<number | "">("");
  const [bathrooms, setBathrooms] = useState<number | "">("");
  const [squareFeet, setSquareFeet] = useState<number | "">("");
  const [yearBuilt, setYearBuilt] = useState<number | "">("");
  
  const [parking, setParking] = useState("");
  const [heating, setHeating] = useState("");
  const [cooling, setCooling] = useState("");
  
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [upgrades, setUpgrades] = useState<string[]>([]);
  
  const [openHouseTimes, setOpenHouseTimes] = useState<{ start: string; end: string }[]>([]);
  const [avatarEnabled, setAvatarEnabled] = useState(true);
  const [agentUid] = useState("HTzvSsD3bqOzfuGLQs0MFEJmUQA2");

  // Import fields
  const [importListingId, setImportListingId] = useState("624f7c64-8977-4b36-91d4-de118724885d");
  const [isImporting, setIsImporting] = useState(false);

  const handleImportListing = async (id: string) => {
    if (!id.trim()) {
      toast.error("Please enter a valid listing ID");
      return;
    }
    setIsImporting(true);
    try {
      const docRef = doc(db, "listings", id.trim());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAddress(data.address || "");
        setCity(data.city || "");
        setProvince(data.province || "ON");
        setPostalCode(data.postalCode === "NONE" ? "" : (data.postalCode || ""));
        setMlsNumber(data.mlsNumber || "");
        setPropertyType(data.propertyType || "Detached");
        setStatus(data.status || "Active");
        setListPriceStr(formatNumberWithCommas(data.price ?? ""));
        setTaxesStr(formatNumberWithCommas(data.taxes ?? ""));
        setBedrooms(data.beds ?? "");
        setBathrooms(data.baths ?? "");
        setSquareFeet(data.sqft ?? "");
        setYearBuilt(data.yearBuilt ?? "");
        setParking(data.parking || "");
        setHeating(data.heating || "");
        setCooling(data.cooling || "");
        setDescription(data.description || "");
        
        if (data.talkingPoints && Array.isArray(data.talkingPoints)) {
          setFeatures(data.talkingPoints);
        } else if (data.talkingPoints?.arrayValue?.values) {
          const pts = data.talkingPoints.arrayValue.values.map((v: any) => v.stringValue).filter(Boolean);
          setFeatures(pts);
        } else {
          setFeatures([]);
        }

        // Import agent information
        if (data.agentName) {
          const parts = data.agentName.trim().split(/\s+/);
          if (parts.length > 1) {
            setFirstName(parts[0]);
            setLastName(parts.slice(1).join(" "));
          } else {
            setFirstName(data.agentName);
            setLastName("");
          }
        }
        if (data.brokerageName || data.originatingSystemName) {
          setBrokerage(data.brokerageName || data.originatingSystemName || "");
        }
        
        // Prefill contact if it's the specific Hamilton pilot listing for Michael St. Jean
        if (id.trim() === "624f7c64-8977-4b36-91d4-de118724885d") {
          setEmail("info@stjeanrealty.com");
          setPhone("+1 905 515 9005");
          setLanguages(["en", "fr"]);
        }
        
        toast.success("Successfully imported data and agent info from listing: " + id);
      } else {
        toast.error("Listing ID not found in the listings collection.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to import listing: ${err.message || "Unknown error"}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Agent fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [languages, setLanguages] = useState<string[]>(["en"]);

  // Fetch Firestore listing
  const fetchListing = async () => {
    setLoadingListing(true);
    setListingLoadError(null);
    try {
      const docRef = doc(db, "properties", "pilot-listing-01");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAddress(data.address || "");
        setCity(data.city || "");
        setProvince(data.province || "ON");
        setPostalCode(data.postalCode || "");
        setMlsNumber(data.mlsNumber || "");
        setPropertyType(data.propertyType || "Detached");
        setStatus(data.status || "Active");
        setListPriceStr(formatNumberWithCommas(data.listPrice ?? ""));
        setTaxesStr(formatNumberWithCommas(data.taxes ?? ""));
        setBedrooms(data.bedrooms ?? "");
        setBathrooms(data.bathrooms ?? "");
        setSquareFeet(data.squareFeet ?? "");
        setYearBuilt(data.yearBuilt ?? "");
        setParking(data.parking || "");
        setHeating(data.heating || "");
        setCooling(data.cooling || "");
        setDescription(data.description || "");
        setFeatures(data.features || []);
        setUpgrades(data.upgrades || []);
        setAvatarEnabled(data.avatarEnabled ?? true);
        
        if (data.openHouseTimes && Array.isArray(data.openHouseTimes)) {
          const rows = data.openHouseTimes.map((item: any) => ({
            start: toLocalDatetimeString(item.start || ""),
            end: toLocalDatetimeString(item.end || "")
          }));
          setOpenHouseTimes(rows);
        } else {
          setOpenHouseTimes([]);
        }
      }
    } catch (err: any) {
      console.error(err);
      setListingLoadError(err?.message || "Firestore load error");
    } finally {
      setLoadingListing(false);
    }
  };

  // Fetch Firestore agent
  const fetchAgent = async () => {
    setLoadingAgent(true);
    setAgentLoadError(null);
    try {
      const docRef = doc(db, "agents", "HTzvSsD3bqOzfuGLQs0MFEJmUQA2");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setBrokerage(data.brokerage || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        setLanguages(data.languages || ["en"]);
      }
    } catch (err: any) {
      console.error(err);
      setAgentLoadError(err?.message || "Firestore load error");
    } finally {
      setLoadingAgent(false);
    }
  };

  useEffect(() => {
    fetchListing();
    fetchAgent();
  }, []);

  // Repeatable array helpers for features
  const handleAddFeature = () => {
    setFeatures([...features, ""]);
  };

  const handleUpdateFeature = (index: number, val: string) => {
    const updated = [...features];
    updated[index] = val;
    setFeatures(updated);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  // Repeatable array helpers for upgrades
  const handleAddUpgrade = () => {
    setUpgrades([...upgrades, ""]);
  };

  const handleUpdateUpgrade = (index: number, val: string) => {
    const updated = [...upgrades];
    updated[index] = val;
    setUpgrades(updated);
  };

  const handleRemoveUpgrade = (index: number) => {
    setUpgrades(upgrades.filter((_, i) => i !== index));
  };

  // Repeatable array helpers for open houses
  const handleAddOpenHouse = () => {
    setOpenHouseTimes([...openHouseTimes, { start: "", end: "" }]);
  };

  const handleUpdateOpenHouse = (index: number, key: "start" | "end", val: string) => {
    const updated = [...openHouseTimes];
    updated[index] = { ...updated[index], [key]: val };
    setOpenHouseTimes(updated);
  };

  const handleRemoveOpenHouse = (index: number) => {
    setOpenHouseTimes(openHouseTimes.filter((_, i) => i !== index));
  };

  // Multi-select for languages
  const handleToggleLanguage = (langCode: string) => {
    if (languages.includes(langCode)) {
      setLanguages(languages.filter((l) => l !== langCode));
    } else {
      setLanguages([...languages, langCode]);
    }
  };

  // Save Listing
  const handleSaveListing = async () => {
    setSavingListing(true);
    try {
      const dbTimes = openHouseTimes
        .filter((row) => row.start && row.end)
        .map((row) => ({
          start: toTorontoISOString(row.start),
          end: toTorontoISOString(row.end)
        }));

      const payload = {
        address,
        city,
        province,
        postalCode,
        mlsNumber,
        propertyType,
        status,
        listPrice: parseNumberFromCommas(listPriceStr),
        taxes: parseNumberFromCommas(taxesStr),
        bedrooms: bedrooms === "" ? null : Number(bedrooms),
        bathrooms: bathrooms === "" ? null : Number(bathrooms),
        squareFeet: squareFeet === "" ? null : Number(squareFeet),
        yearBuilt: yearBuilt === "" ? null : Number(yearBuilt),
        parking,
        heating,
        cooling,
        description,
        features: features.filter((f) => f.trim() !== ""),
        upgrades: upgrades.filter((u) => u.trim() !== ""),
        openHouseTimes: dbTimes,
        avatarEnabled,
        agentUid
      };

      await setDoc(doc(db, "properties", "pilot-listing-01"), payload, { merge: true });
      toast.success(t.saved, { duration: 2000 });
    } catch (err: any) {
      console.error(err);
      toast.error(`${t.saveError}: ${err?.message || "Unknown error"}`);
    } finally {
      setSavingListing(false);
    }
  };

  // Save Agent
  const handleSaveAgent = async () => {
    setSavingAgent(true);
    try {
      const payload = {
        firstName,
        lastName,
        brokerage,
        phone,
        email,
        languages
      };

      await setDoc(doc(db, "agents", "HTzvSsD3bqOzfuGLQs0MFEJmUQA2"), payload, { merge: true });
      toast.success(t.saved, { duration: 2000 });
    } catch (err: any) {
      console.error(err);
      toast.error(`${t.saveError}: ${err?.message || "Unknown error"}`);
    } finally {
      setSavingAgent(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-900 text-slate-100 flex flex-col pb-24">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white font-bold tracking-tight shadow-md flex items-center justify-center">
            VA
          </div>
          <span className="font-sans font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            {t.title}
          </span>
        </div>
        <button
          onClick={() => setLang(lang === "en" ? "fr" : "en")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 transition rounded-xl text-xs font-semibold"
        >
          <Globe className="h-4 w-4" />
          {lang === "en" ? "FR" : "EN"}
        </button>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Tab Selection */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("listing")}
            className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === "listing"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-100"
            }`}
          >
            {t.listingTab}
          </button>
          <button
            onClick={() => setActiveTab("agent")}
            className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === "agent"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-100"
            }`}
          >
            {t.agentTab}
          </button>
        </div>

        {/* Tab 1: Listing Tab */}
        {activeTab === "listing" && (
          <div className="space-y-6">
            {listingLoadError && (
              <div className="bg-red-950/80 border border-red-800 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-300 text-sm">{t.loadError}</h4>
                    <p className="text-xs text-red-400 leading-normal font-mono">{listingLoadError}</p>
                  </div>
                </div>
                <Button onClick={fetchListing} variant="destructive" className="text-xs font-bold shrink-0">
                  {t.retry}
                </Button>
              </div>
            )}

            {loadingListing ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="text-sm font-medium">Loading Listing...</span>
              </div>
            ) : (
              <div className="space-y-6 pb-12">
                {/* Autofill helper for pilot listings */}
                <div className="bg-gradient-to-r from-blue-950/40 to-indigo-950/40 rounded-xl p-4 sm:p-6 border border-blue-800/50 space-y-3 shadow-lg relative overflow-hidden">
                  <div className="absolute right-0 top-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-sans font-bold text-sm text-blue-200">
                        {lang === "en" ? "Autofill from Live Listings" : "Remplissage automatique depuis les annonces actives"}
                      </h4>
                      <p className="text-xs text-slate-400 leading-normal mt-0.5">
                        {lang === "en" 
                          ? "Pull property information directly from the active database to skip manual data entry." 
                          : "Récupérez directement les informations de la propriété depuis la base de données active."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                    <div className="flex-1">
                      <Input
                        value={importListingId}
                        onChange={(e) => setImportListingId(e.target.value)}
                        placeholder="Enter Listing ID"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm h-9"
                      />
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        onClick={() => handleImportListing(importListingId)}
                        disabled={isImporting}
                        className="bg-blue-600 hover:bg-blue-500 text-xs font-bold h-9 transition px-4 flex items-center gap-2 text-white"
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            {lang === "en" ? "Importing..." : "Importation..."}
                          </>
                        ) : (
                          lang === "en" ? "Import Listing" : "Importer l'annonce"
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => {
                          setImportListingId("624f7c64-8977-4b36-91d4-de118724885d");
                          handleImportListing("624f7c64-8977-4b36-91d4-de118724885d");
                        }}
                        disabled={isImporting}
                        variant="secondary"
                        className="text-xs font-bold h-9 transition border border-slate-800 bg-slate-900 text-blue-400 hover:text-blue-300 hover:bg-slate-800"
                      >
                        {lang === "en" ? "Use Hamilton Listing" : "Utiliser l'annonce Hamilton"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Group 1: Address */}
                <div className="bg-slate-950/60 rounded-xl p-4 sm:p-6 border border-slate-800/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800 pb-2">
                    {t.group1}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.address}</label>
                      <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. 4 Clifton Downs Rd"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.city}</label>
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Hamilton"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.province}</label>
                      <Input
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        placeholder="ON"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.postalCode}</label>
                      <Input
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="e.g. L8P 2B3"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Group 2: Listing Details */}
                <div className="bg-slate-950/60 rounded-xl p-4 sm:p-6 border border-slate-800/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800 pb-2">
                    {t.group2}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.mlsNumber}</label>
                      <Input
                        value={mlsNumber}
                        onChange={(e) => setMlsNumber(e.target.value)}
                        placeholder="e.g. X1234567"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.propertyType}</label>
                      <select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-100 text-xs sm:text-sm outline-none focus:border-blue-500"
                      >
                        <option value="Detached">Detached</option>
                        <option value="Semi-Detached">Semi-Detached</option>
                        <option value="Townhouse">Townhouse</option>
                        <option value="Condo">Condo</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.status}</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-100 text-xs sm:text-sm outline-none focus:border-blue-500"
                      >
                        <option value="Active">Active</option>
                        <option value="Sold">Sold</option>
                        <option value="Pending">Pending</option>
                        <option value="Coming Soon">Coming Soon</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.listPrice}</label>
                      <Input
                        value={listPriceStr}
                        onChange={(e) => setListPriceStr(e.target.value.replace(/[^0-9.,]/g, ""))}
                        onBlur={() => setListPriceStr(formatNumberWithCommas(listPriceStr))}
                        placeholder="e.g. 1,250,000"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium text-slate-400">{t.taxes}</label>
                      <Input
                        value={taxesStr}
                        onChange={(e) => setTaxesStr(e.target.value.replace(/[^0-9.,]/g, ""))}
                        onBlur={() => setTaxesStr(formatNumberWithCommas(taxesStr))}
                        placeholder="e.g. 4,500"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Group 3: Specs */}
                <div className="bg-slate-950/60 rounded-xl p-4 sm:p-6 border border-slate-800/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800 pb-2">
                    {t.group3}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.bedrooms}</label>
                      <Input
                        type="number"
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g. 4"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.bathrooms}</label>
                      <Input
                        type="number"
                        step="0.5"
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g. 2.5"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.squareFeet}</label>
                      <Input
                        type="number"
                        value={squareFeet}
                        onChange={(e) => setSquareFeet(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g. 2500"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.yearBuilt}</label>
                      <Input
                        type="number"
                        value={yearBuilt}
                        onChange={(e) => setYearBuilt(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="e.g. 1995"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.parking}</label>
                      <Input
                        value={parking}
                        onChange={(e) => setParking(e.target.value)}
                        placeholder="e.g. 2 Garage, 4 Driveway"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.heating}</label>
                      <Input
                        value={heating}
                        onChange={(e) => setHeating(e.target.value)}
                        placeholder="e.g. Forced Air, Gas"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium text-slate-400">{t.cooling}</label>
                      <Input
                        value={cooling}
                        onChange={(e) => setCooling(e.target.value)}
                        placeholder="e.g. Central Air"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Group 4: Narrative */}
                <div className="bg-slate-950/60 rounded-xl p-4 sm:p-6 border border-slate-800/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800 pb-2">
                    {t.group4}
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.description}</label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the beautiful details of this property..."
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm min-h-[120px]"
                      />
                    </div>

                    {/* Features repeatable list */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-400">{t.features}</label>
                        <Button
                          type="button"
                          onClick={handleAddFeature}
                          className="h-7 px-2 bg-blue-600 hover:bg-blue-700 text-[10px] font-bold rounded-md flex gap-1 items-center"
                        >
                          <Plus className="h-3 w-3" />
                          {t.addFeature}
                        </Button>
                      </div>
                      
                      {features.length === 0 ? (
                        <p className="text-xs text-slate-600 italic py-1">{t.noFeatures}</p>
                      ) : (
                        <div className="space-y-2">
                          {features.map((feat, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <Input
                                value={feat}
                                onChange={(e) => handleUpdateFeature(index, e.target.value)}
                                placeholder="e.g. Finished Basement with Walk-out"
                                className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm flex-1"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => handleRemoveFeature(index)}
                                className="h-8 w-8 p-0 rounded-lg shrink-0 flex items-center justify-center bg-red-950 hover:bg-red-900 border border-red-800"
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Upgrades repeatable list */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-400">{t.upgrades}</label>
                        <Button
                          type="button"
                          onClick={handleAddUpgrade}
                          className="h-7 px-2 bg-blue-600 hover:bg-blue-700 text-[10px] font-bold rounded-md flex gap-1 items-center"
                        >
                          <Plus className="h-3 w-3" />
                          {t.addUpgrade}
                        </Button>
                      </div>
                      
                      {upgrades.length === 0 ? (
                        <p className="text-xs text-slate-600 italic py-1">{t.noUpgrades}</p>
                      ) : (
                        <div className="space-y-2">
                          {upgrades.map((upg, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <Input
                                value={upg}
                                onChange={(e) => handleUpdateUpgrade(index, e.target.value)}
                                placeholder="e.g. Roof shingles replaced (2024)"
                                className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm flex-1"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => handleRemoveUpgrade(index)}
                                className="h-8 w-8 p-0 rounded-lg shrink-0 flex items-center justify-center bg-red-950 hover:bg-red-900 border border-red-800"
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Group 5: Open House repeatable times */}
                <div className="bg-slate-950/60 rounded-xl p-4 sm:p-6 border border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                      {t.group5}
                    </h3>
                    <Button
                      type="button"
                      onClick={handleAddOpenHouse}
                      className="h-7 px-2 bg-blue-600 hover:bg-blue-700 text-[10px] font-bold rounded-md flex gap-1 items-center"
                    >
                      <Plus className="h-3 w-3" />
                      {t.addOpenHouse}
                    </Button>
                  </div>

                  {openHouseTimes.length === 0 ? (
                    <p className="text-xs text-slate-600 italic py-1">{t.noOpenHouses}</p>
                  ) : (
                    <div className="space-y-4">
                      {openHouseTimes.map((row, index) => (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-slate-900/40 p-3 rounded-lg border border-slate-800"
                        >
                          <div className="grid grid-cols-2 gap-2 flex-1 w-full">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">{t.start}</span>
                              <input
                                type="datetime-local"
                                value={row.start}
                                onChange={(e) => handleUpdateOpenHouse(index, "start", e.target.value)}
                                className="w-full h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-100 text-xs font-mono outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">{t.end}</span>
                              <input
                                type="datetime-local"
                                value={row.end}
                                onChange={(e) => handleUpdateOpenHouse(index, "end", e.target.value)}
                                className="w-full h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-100 text-xs font-mono outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => handleRemoveOpenHouse(index)}
                            className="h-8 w-8 p-0 rounded-lg shrink-0 flex items-center justify-center bg-red-950 hover:bg-red-900 border border-red-800"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Group 6: Controls */}
                <div className="bg-slate-950/60 rounded-xl p-4 sm:p-6 border border-slate-800/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800 pb-2">
                    {t.group6}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={avatarEnabled}
                          onChange={(e) => setAvatarEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                        <span className="ml-3 text-xs sm:text-sm font-semibold text-slate-300">
                          {t.avatarEnabled}
                        </span>
                      </label>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.agentUid}</label>
                      <Input
                        value={agentUid}
                        disabled
                        className="bg-slate-900/50 border-slate-800/60 text-slate-500 text-xs sm:text-sm font-mono"
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-800/60 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      <p>
                        - <a
                          href="/tour/pilot-listing-01?bypass_signin=true"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          AI Tour
                        </a>. Then link it to listing id: <a
                          href="/tour/pilot-listing-01?bypass_signin=true"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          /tour/pilot-listing-01
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sticky Save for Listing */}
            {!loadingListing && (
              <div className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/90 backdrop-blur px-4 sm:px-6 py-4 flex justify-end z-40">
                <div className="max-w-4xl w-full mx-auto flex justify-end">
                  <Button
                    onClick={handleSaveListing}
                    disabled={savingListing}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-11 rounded-xl flex gap-2 items-center shadow-lg"
                  >
                    {savingListing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.saving}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {t.save}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Agent Tab */}
        {activeTab === "agent" && (
          <div className="space-y-6">
            {agentLoadError && (
              <div className="bg-red-950/80 border border-red-800 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-300 text-sm">{t.loadError}</h4>
                    <p className="text-xs text-red-400 leading-normal font-mono">{agentLoadError}</p>
                  </div>
                </div>
                <Button onClick={fetchAgent} variant="destructive" className="text-xs font-bold shrink-0">
                  {t.retry}
                </Button>
              </div>
            )}

            {loadingAgent ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="text-sm font-medium">Loading Agent Profile...</span>
              </div>
            ) : (
              <div className="space-y-6 pb-12">
                <div className="bg-slate-950/60 rounded-xl p-4 sm:p-6 border border-slate-800/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800 pb-2">
                    {t.agentTab}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.firstName}</label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Luc"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.lastName}</label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Valade"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium text-slate-400">{t.brokerage}</label>
                      <Input
                        value={brokerage}
                        onChange={(e) => setBrokerage(e.target.value)}
                        placeholder="e.g. Vertex Brokerage Inc."
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">
                        {t.phone} <span className="text-[10px] text-slate-500 font-normal">({t.validationPhone})</span>
                      </label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 XXX XXX XXXX"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">{t.email}</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="luc.valade@gmail.com"
                        className="bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm"
                      />
                    </div>
                    
                    {/* Spoken Languages */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-medium text-slate-400">{t.languages}</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleLanguage("en")}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            languages.includes("en")
                              ? "bg-blue-600 text-white border border-transparent shadow"
                              : "bg-slate-900 text-slate-400 border border-slate-800"
                          }`}
                        >
                          🇬🇧 {t.english}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleLanguage("fr")}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            languages.includes("fr")
                              ? "bg-blue-600 text-white border border-transparent shadow"
                              : "bg-slate-900 text-slate-400 border border-slate-800"
                          }`}
                        >
                          🇫🇷 {t.french}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sticky Save for Agent */}
            {!loadingAgent && (
              <div className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/90 backdrop-blur px-4 sm:px-6 py-4 flex justify-end z-40">
                <div className="max-w-4xl w-full mx-auto flex justify-end">
                  <Button
                    onClick={handleSaveAgent}
                    disabled={savingAgent}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-11 rounded-xl flex gap-2 items-center shadow-lg"
                  >
                    {savingAgent ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.saving}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {t.save}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
