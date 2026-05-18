import { Building2, Globe, Shield, Bell, Loader2, Mic2, CheckCircle2, ChevronDown, Plus, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAgent, updateUser } from "@/lib/api";
import { toast } from "sonner";
import { doc, getDoc, setDoc, collection, query, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  // Tab State
  const viewMode = location.pathname.startsWith('/app/admin') ? 'ADMIN' : 'CLIENT';
  const [activeTab, setActiveTab] = useState<"profile" | "branding" | "compliance" | "notifications" | "admin">("profile");
  const [adminSubTab, setAdminSubTab] = useState<"overview" | "company" | "plans" | "stripe">("overview");

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
  const [accentColor, setAccentColor] = useState("#f8fafc");

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

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  async function loadProfile() {
    try {
      // Load logs if admin
      if (user?.role === 'ADMIN') {
        const logsRef = collection(db, "logs");
        const logsSnap = await getDocs(query(logsRef));
        const logsData = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => b.timestamp - a.timestamp);
        if (logsData.length === 0) {
          // Mock some logs if none exist
          setLogs([
            { id: '1', action: 'ADMIN_LOGIN', user: user.email, timestamp: Date.now() - 3600000, message: 'Admin logged in from new IP' },
            { id: '2', action: 'SETTINGS_UPDATE', user: 'system', timestamp: Date.now() - 7200000, message: 'Maintenance mode toggled OFF' },
            { id: '3', action: 'USER_REGISTER', user: 'new_agent@example.com', timestamp: Date.now() - 86400000, message: 'New agent registered via landing page' }
          ]);
        } else {
          setLogs(logsData);
        }
      }

      const data: any = await getAgent(user!.id);
      if (data?.brokerageProfile) {
        const bp = data.brokerageProfile;
        setLegalName(bp.legalName || "VertexAgent HQ");
        setRecoId(bp.recoId || "B-481923");
        setBrokerOfRecord(bp.brokerOfRecord || "Luc Valade");
        setOfficePhone(bp.officePhone || "(905) 555-0192");
        setOfficeEmail(bp.officeEmail || "ops@vertexagent.ca");
      } else {
        // Defaults if none exist
        setLegalName("VertexAgent HQ");
        setRecoId("B-481923");
        setBrokerOfRecord("Luc Valade");
        setOfficePhone("(905) 555-0192");
        setOfficeEmail("ops@vertexagent.ca");
      }

      if (data?.branding) {
        setPrimaryColor(data.branding.primaryColor || "#2563eb");
        setLogoUrl(data.branding.logoUrl || "");
        setAccentColor(data.branding.accentColor || "#f8fafc");
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

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return url.startsWith("http");
    } catch {
      return false;
    }
  };

  const validateImageUrl = (url: string) => {
    if (!validateUrl(url)) return false;
    return /\.(jpg|jpeg|png|gif|webp|svg)($|\?|#)/i.test(url);
  };

  const toTitleCase = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
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
        if (value.trim() && !validateUrl(value)) error = "Invalid URL (must start with http/https)";
        break;
      case "disclaimer":
        if (value.length > 0 && !/^[A-Z]/.test(value)) error = "Disclaimer must start with a capital letter";
        break;
      case "licenseNumber":
        if (value.trim() && !/^[a-zA-Z0-9-]{3,30}$/.test(value)) error = "Invalid License Number (alphanumeric)";
        break;
      case "licenseType":
      case "jurisdiction":
      case "boardName":
        if (value.trim() && !isTitleCase(value)) error = "First letter of each word must be capitalized";
        break;
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    if (error) toast.error(error);
  };

  async function handleSave() {
    // Final Validations
    if (activeTab === "profile") {
      // Profile tab no longer requires validation as it only contains dev tools or info message
    }

    if (user?.role === 'ADMIN' && activeTab === 'admin' && adminSubTab === 'company') {
      if (!brokerageName || !brokerageAddress || !brokerageCity || !brokerageCountry || !brokerageProvince || !brokeragePostalCode || !brokeragePhone || !brokerageEmail || !adminEmail) {
        toast.error("Please fill in all mandatory fields in the VertexAgent File");
        return;
      }
    }

    if (Object.values(errors).some(e => e)) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    setSaving(true);
    try {
      await updateUser(user!.id, {
        brokerageProfile: {
          legalName,
          recoId,
          brokerOfRecord,
          officePhone,
          officeEmail,
          updatedAt: Date.now()
        },
        branding: {
          primaryColor,
          logoUrl,
          accentColor
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

      toast.success("Changes have been saved");
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
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-slate-500 mt-1">Manage system setup, compliance, and application defaults.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Building2 className="h-4 w-4" /> {viewMode === 'ADMIN' ? 'My Profile' : 'Account Profile'}
          </button>
          
          {viewMode !== 'ADMIN' && (
            <>
              <button 
                onClick={() => setActiveTab("branding")}
                className={`w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'branding' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Globe className="h-4 w-4" /> Branding & UI
              </button>
              <button 
                onClick={() => setActiveTab("compliance")}
                className={`w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'compliance' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Shield className="h-4 w-4" /> Compliance
              </button>
              <button 
                onClick={() => setActiveTab("notifications")}
                className={`w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'notifications' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Bell className="h-4 w-4" /> Notifications
              </button>
            </>
          )}
          
          {user?.role === 'ADMIN' && viewMode === 'ADMIN' && (
            <button 
              onClick={() => setActiveTab("admin" as any)}
              className={`w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-left transition-colors ${activeTab === ('admin' as any) ? 'bg-red-50 text-red-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Shield className="h-4 w-4 text-red-500" /> Admin Control Panel
            </button>
          )}
        </div>
        
        <div className="md:col-span-3 space-y-6">
          {activeTab === "profile" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-bold mb-4">{viewMode === 'ADMIN' ? 'Admin Access' : 'Account Profile'}</h2>
              
              {viewMode !== 'ADMIN' && (
                <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                  <p className="text-sm text-slate-500">Account profiles are managed at the company level. Contact your administrator for changes.</p>
                </div>
              )}

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
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Primary Color</label>
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
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Logo URL</label>
                    <input 
                      type="text" 
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.logoUrl ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      onBlur={(e) => handleBlur("logoUrl", e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-[10px] text-slate-500 italic mt-1 leading-tight">
                      * Logos appear on listing landing pages and PDF reports (recommended: transparent PNG, max 400px width).
                    </p>
                    {errors.logoUrl && <p className="text-xs text-red-500 font-medium">{errors.logoUrl}</p>}
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
                      onChange={(e) => setDisclaimer(e.target.value)}
                      onBlur={(e) => handleBlur("disclaimer", e.target.value)}
                      placeholder="Enter the legal disclaimer that appears on all marketing materials..."
                    />
                    {errors.disclaimer && <p className="text-xs text-red-500 font-medium mt-1">{errors.disclaimer}</p>}
                    <div className="absolute bottom-2 right-2 flex items-center pointer-events-none">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-50/80 backdrop-blur-sm border ${disclaimer.length > 1900 ? 'text-red-500 border-red-100 bg-red-50' : 'text-slate-400 border-slate-100'}`}>
                        {disclaimer.length} / 2000
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
                      <label className="text-sm font-medium text-slate-700">Type of Licence</label>
                      <input 
                        type="text" 
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.licenseType ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                        value={licenseType}
                        onChange={(e) => setLicenseType(e.target.value)}
                        onBlur={(e) => handleBlur("licenseType", e.target.value)}
                        placeholder="e.g., Registered Architect, CPA"
                      />
                      {errors.licenseType && <p className="text-xs text-red-500 font-medium">{errors.licenseType}</p>}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Issuing Jurisdiction</label>
                      <input 
                        type="text" 
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.jurisdiction ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                        value={jurisdiction}
                        onChange={(e) => setJurisdiction(e.target.value)}
                        onBlur={(e) => handleBlur("jurisdiction", e.target.value)}
                        placeholder="e.g., Ontario, Canada"
                      />
                      {errors.jurisdiction && <p className="text-xs text-red-500 font-medium">{errors.jurisdiction}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Board Name</label>
                      <input 
                        type="text" 
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.boardName ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                        value={boardName}
                        onChange={(e) => setBoardName(e.target.value)}
                        onBlur={(e) => handleBlur("boardName", e.target.value)}
                        placeholder="e.g., RECO, TRREB"
                      />
                      {errors.boardName && <p className="text-xs text-red-500 font-medium">{errors.boardName}</p>}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-1 gap-4 pt-4 border-t">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Privacy Policy URL</label>
                    <input 
                      type="text" 
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.privacyUrl ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                      value={privacyUrl}
                      onChange={(e) => setPrivacyUrl(e.target.value)}
                      onBlur={(e) => handleBlur("privacyUrl", e.target.value)}
                      placeholder="https://vertexrealty.ca/privacy"
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
                      <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">VertexAgent File</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 col-span-2">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-tight">Company Name</label>
                          <input 
                            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                            value={brokerageName}
                            maxLength={100}
                            required
                            onChange={(e) => setBrokerageName(toTitleCase(e.target.value))}
                            placeholder="VertexAgent HQ"
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
                        <div className="grid md:grid-cols-3 gap-4">
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
                        <div className="grid md:grid-cols-2 gap-4">
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
                              placeholder="(905) 555-0192"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
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
                            onChange={(e) => setPricingDescription(e.target.value)}
                            placeholder="Pricing models designed to maximize your revenue..."
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
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
                                  const newPlans = [...plans];
                                  newPlans[idx].features = e.target.value.split(",").map(f => f.trim());
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

                <div className="pt-4 border-t flex justify-end">
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

