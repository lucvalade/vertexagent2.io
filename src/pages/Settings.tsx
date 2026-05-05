import { Building2, Globe, Shield, Bell, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAgent, updateUser } from "@/lib/api";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile State
  const [legalName, setLegalName] = useState("");
  const [recoId, setRecoId] = useState("");
  const [brokerOfRecord, setBrokerOfRecord] = useState("");
  const [officePhone, setOfficePhone] = useState("");
  const [officeEmail, setOfficeEmail] = useState("");

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tab State
  const [activeTab, setActiveTab] = useState<"profile" | "branding" | "compliance" | "notifications">("profile");

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

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  async function loadProfile() {
    try {
      const data: any = await getAgent(user!.id);
      if (data?.brokerageProfile) {
        const bp = data.brokerageProfile;
        setLegalName(bp.legalName || "Vertex Realty Group Brokerage");
        setRecoId(bp.recoId || "B-481923");
        setBrokerOfRecord(bp.brokerOfRecord || "Luc Valade");
        setOfficePhone(bp.officePhone || "(905) 555-0192");
        setOfficeEmail(bp.officeEmail || "ops@vertexrealty.ca");
      } else {
        // Defaults if none exist
        setLegalName("Vertex Realty Group Brokerage");
        setRecoId("B-481923");
        setBrokerOfRecord("Luc Valade");
        setOfficePhone("(905) 555-0192");
        setOfficeEmail("ops@vertexrealty.ca");
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

  const handleBlur = (field: string, value: string) => {
    let error = "";
    switch (field) {
      case "legalName":
        if (!value.trim()) error = "Legal Name is required";
        else if (!isTitleCase(value)) error = "First letter of each name must be capitalized";
        break;
      case "recoId":
        if (!value.trim()) error = "Brokerage ID / RECO is required";
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
    if (!legalName || !recoId || !brokerOfRecord || !officePhone || !officeEmail) {
      toast.error("Please fill in all required fields in Brokerage Profile");
      return;
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
        updatedAt: Date.now()
      });
      toast.success("Settings updated successfully");
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
          <p className="text-slate-500 mt-1">Manage brokerage setup, compliance, and application defaults.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Building2 className="h-4 w-4" /> Brokerage Profile
          </button>
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
          
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => setActiveTab("admin" as any)}
              className={`w-full flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-left transition-colors ${activeTab === ('admin' as any) ? 'bg-red-50 text-red-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Shield className="h-4 w-4 text-red-500" /> Admin Controls
            </button>
          )}
        </div>
        
        <div className="md:col-span-3 space-y-6">
          {activeTab === "profile" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-bold mb-4">Brokerage Profile</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Legal Name</label>
                    <input 
                      type="text" 
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.legalName ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      onBlur={(e) => handleBlur("legalName", e.target.value)}
                      placeholder="Vertex Realty Group Brokerage"
                    />
                    {errors.legalName && <p className="text-xs text-red-500 font-medium">{errors.legalName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Brokerage ID / RECO</label>
                    <input 
                      type="text" 
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.recoId ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                      value={recoId}
                      onChange={(e) => setRecoId(e.target.value)}
                      onBlur={(e) => handleBlur("recoId", e.target.value)}
                      placeholder="B-481923"
                    />
                    {errors.recoId && <p className="text-xs text-red-500 font-medium">{errors.recoId}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Broker of Record</label>
                  <input 
                    type="text" 
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.brokerOfRecord ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                    value={brokerOfRecord}
                    onChange={(e) => setBrokerOfRecord(e.target.value)}
                    onBlur={(e) => handleBlur("brokerOfRecord", e.target.value)}
                    placeholder="Luc Valade"
                  />
                  {errors.brokerOfRecord && <p className="text-xs text-red-500 font-medium">{errors.brokerOfRecord}</p>}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Office Phone</label>
                    <input 
                      type="text" 
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.officePhone ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                      value={officePhone}
                      onChange={(e) => setOfficePhone(formatPhone(e.target.value))}
                      onBlur={(e) => handleBlur("officePhone", e.target.value)}
                      placeholder="(905) 555-0192"
                    />
                    {errors.officePhone && <p className="text-xs text-red-500 font-medium">{errors.officePhone}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Office Email</label>
                    <input 
                      type="email" 
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.officeEmail ? 'border-red-300 ring-red-100' : 'border-slate-200'}`} 
                      value={officeEmail}
                      onChange={(e) => setOfficeEmail(e.target.value)}
                      onBlur={(e) => handleBlur("officeEmail", e.target.value)}
                      placeholder="ops@vertexrealty.ca"
                    />
                    {errors.officeEmail && <p className="text-xs text-red-500 font-medium">{errors.officeEmail}</p>}
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
                    <div className="flex gap-2">
                       <input 
                        id="primaryColorInput"
                        type="color" 
                        className="h-9 w-12 rounded border p-1 cursor-pointer"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                      />
                      <input 
                        type="text" 
                        className="flex-1 px-3 py-2 border rounded-md text-sm cursor-pointer"
                        value={primaryColor}
                        readOnly
                        onClick={() => triggerColorPicker('primaryColorInput')}
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
                          * Admins: Receive texts for <span className="font-bold text-slate-700">Direct Offers</span> and <span className="font-bold text-slate-700">Price Feedback</span>.
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

          {activeTab === ("admin" as any) && user?.role === 'ADMIN' && (
            <div className="bg-white border border-red-100 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-bold text-red-900">Admin Control Panel</h2>
              </div>
              
              <div className="space-y-6">
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                  <h3 className="text-sm font-bold text-red-800 mb-2">Global System Configuration</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-700">Maintenance Mode</span>
                      <button className="h-5 w-9 bg-slate-200 rounded-full relative"><div className="absolute left-1 top-0.5 h-4 w-4 bg-white rounded-full"></div></button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-700">Allow New Agent Registrations</span>
                      <button className="h-5 w-9 bg-green-500 rounded-full relative"><div className="absolute right-1 top-0.5 h-4 w-4 bg-white rounded-full"></div></button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
                    <h4 className="font-bold text-sm">System Logs</h4>
                    <p className="text-xs text-slate-500">View all real-time events and errors.</p>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
                    <h4 className="font-bold text-sm">Billing & Subs</h4>
                    <p className="text-xs text-slate-500">Manage stripe connectivity and plans.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

