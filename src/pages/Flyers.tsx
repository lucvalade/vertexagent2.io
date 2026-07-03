import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAllListings, getUserListings, Listing, getAgent, updateListing } from "@/lib/api";
import { 
  Printer, 
  Download, 
  Sparkles, 
  Layers, 
  Layout, 
  QrCode, 
  User, 
  Building, 
  Sliders, 
  ArrowLeft, 
  ArrowRight,
  ArrowUp,
  ArrowDown,
  CheckCircle2, 
  HelpCircle,
  FileText,
  BadgePercent,
  CheckCircle,
  Bot,
  MapPin,
  RefreshCw,
  Eye,
  Type,
  Heading,
  AlignLeft,
  Settings,
  ChevronDown,
  Instagram,
  Smartphone,
  Share2,
  Calendar,
  Sparkle,
  Volume2,
  Lock,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

type FlyerTemplate = 
  | "luxury_royal" 
  | "modern_minimalist" 
  | "open_house_showcase" 
  | "scan_to_tour_ai" 
  | "brokerage_branded"
  | "lead_form_sign_in"
  | "just_listed_sold";

type QrDestination = "ai_tour" | "open_house" | "lead_form" | "details_page" | "custom_url";
type AccentColor = "slate" | "gold" | "emerald" | "sapphire" | "ruby";
type Orientation = "portrait" | "square";
type PreviewMode = "print" | "mobile" | "qr_test";

export default function Flyers() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Layout & Styling Config
  const [template, setTemplate] = useState<FlyerTemplate>("luxury_royal");
  const [qrDest, setQrDest] = useState<QrDestination>("ai_tour");
  const [customQrUrl, setCustomQrUrl] = useState("");
  const [accentColor, setAccentColor] = useState<AccentColor>("gold");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("print");
  const [activeTab, setActiveTab] = useState<"edit" | "settings" | "typography" | "qr_code">("edit");
  const [legalName, setLegalName] = useState("PINNACLE REAL ESTATE GROUP");
  const [brokerageLogo, setBrokerageLogo] = useState("");
  const [agentPhoto, setAgentPhoto] = useState("");
  const [qrBrandingOption, setQrBrandingOption] = useState<"logo" | "photo" | "none">("logo");
  const [rawBrokerageName, setRawBrokerageName] = useState("");
  const [activeHelpPopup, setActiveHelpPopup] = useState<{ title: string; content: string } | null>(null);

  // Typography Options State
  const [titleFont, setTitleFont] = useState<"geometric" | "humanist" | "grotesque" | "serif">("grotesque");
  const [titleSize, setTitleSize] = useState<"xs" | "sm" | "md" | "lg" | "xl">("md");
  const [titleBold, setTitleBold] = useState<boolean>(true);

  const [subtitleFont, setSubtitleFont] = useState<"geometric" | "humanist" | "grotesque" | "serif">("grotesque");
  const [subtitleSize, setSubtitleSize] = useState<"xs" | "sm" | "md" | "lg">("sm");
  const [subtitleBold, setSubtitleBold] = useState<boolean>(true);

  const [descriptionFont, setDescriptionFont] = useState<"geometric" | "humanist" | "grotesque" | "serif">("humanist");
  const [descriptionSize, setDescriptionSize] = useState<"xs" | "sm" | "md" | "lg">("xs");
  const [descriptionBold, setDescriptionBold] = useState<boolean>(false);

  const [ctaFont, setCtaFont] = useState<"geometric" | "humanist" | "grotesque" | "serif">("grotesque");
  const [ctaSize, setCtaSize] = useState<"xs" | "sm" | "md" | "lg">("xs");
  const [ctaBold, setCtaBold] = useState<boolean>(true);

  const getFontFamily = (category: "geometric" | "humanist" | "grotesque" | "serif") => {
    switch (category) {
      case "geometric": return "'Poppins', 'Montserrat', sans-serif";
      case "humanist": return "'Open Sans', 'Lato', sans-serif";
      case "grotesque": return "'Inter', sans-serif";
      case "serif": return "'Playfair Display', 'Garamond', serif";
    }
  };

  const getTitleFontSize = (size: "xs" | "sm" | "md" | "lg" | "xl", isOnScreen: boolean) => {
    if (isOnScreen) {
      switch (size) {
        case "xs": return "11px";
        case "sm": return "13px";
        case "md": return "14.5px";
        case "lg": return "17px";
        case "xl": return "20px";
      }
    } else {
      switch (size) {
        case "xs": return "18px";
        case "sm": return "21px";
        case "md": return "24px";
        case "lg": return "29px";
        case "xl": return "34px";
      }
    }
  };

  const getSubtitleFontSize = (size: "xs" | "sm" | "md" | "lg", isOnScreen: boolean) => {
    if (isOnScreen) {
      switch (size) {
        case "xs": return "7.5px";
        case "sm": return "8.5px";
        case "md": return "10px";
        case "lg": return "12px";
      }
    } else {
      switch (size) {
        case "xs": return "10px";
        case "sm": return "12px";
        case "md": return "14px";
        case "lg": return "16px";
      }
    }
  };

  const getDescriptionFontSize = (size: "xs" | "sm" | "md" | "lg", isOnScreen: boolean) => {
    if (isOnScreen) {
      switch (size) {
        case "xs": return "7.5px";
        case "sm": return "8.5px";
        case "md": return "10px";
        case "lg": return "11.5px";
      }
    } else {
      switch (size) {
        case "xs": return "9.5px";
        case "sm": return "11.5px";
        case "md": return "13px";
        case "lg": return "14.5px";
      }
    }
  };

  const getCtaFontSize = (size: "xs" | "sm" | "md" | "lg", isOnScreen: boolean) => {
    if (isOnScreen) {
      switch (size) {
        case "xs": return "6.5px";
        case "sm": return "7.5px";
        case "md": return "9px";
        case "lg": return "10.5px";
      }
    } else {
      switch (size) {
        case "xs": return "8px";
        case "sm": return "9.5px";
        case "md": return "11px";
        case "lg": return "12.5px";
      }
    }
  };

  // Content state overrides
  const [customHeadline, setCustomHeadline] = useState("");
  const [customSubHeadline, setCustomSubHeadline] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customCta, setCustomCta] = useState("");
  const [openHouseTime, setOpenHouseTime] = useState("Sunday, June 14th • 2:00 PM - 5:00 PM");
  const [statusBadgeText, setStatusBadgeText] = useState("JUST LISTED");
  const [selectedHeroImage, setSelectedHeroImage] = useState<string>("");
  const [excludedPhotos, setExcludedPhotos] = useState<string[]>([]);

  // Agent contact adjustments
  const [agentNameOverride, setAgentNameOverride] = useState("");
  const [agentPhoneOverride, setAgentPhoneOverride] = useState("");
  const [agentEmailOverride, setAgentEmailOverride] = useState("");
  const [brokerageNameOverride, setBrokerageNameOverride] = useState("");

  // Validation helpers & Input masking inside Flyers
  const isPhoneValid = (phone: string) => {
    return /^\(\d{3}\) \d{3}-\d{4}$/.test(phone);
  };

  const isEmailValid = (email: string) => {
    if (!email.includes("@")) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleNameChange = (val: string) => {
    const capitalized = val.replace(/\b([a-z])/g, (match) => match.toUpperCase());
    setAgentNameOverride(capitalized);
  };

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    let formatted = cleaned;
    if (cleaned.length > 0) {
      if (cleaned.length <= 3) {
        formatted = `(${cleaned}`;
      } else if (cleaned.length <= 6) {
        formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      } else {
        formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
      }
    }
    setAgentPhoneOverride(formatted);
  };

  const isSaveAestheticsEnabled = 
    agentNameOverride.trim().length > 0 && 
    isPhoneValid(agentPhoneOverride) && 
    isEmailValid(agentEmailOverride);

  // Options toggles
  const [showSecondaryPhotos, setShowSecondaryPhotos] = useState(true);
  const [includeLenderBlock, setIncludeLenderBlock] = useState(false);
  const [lenderName, setLenderName] = useState("Alpha Preferred Mortgages");
  const [lenderCta, setLenderCta] = useState("Get Pre-approved");

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useEffect(() => {
    async function loadAgentBranding() {
      if (!user) return;
      try {
        const agentData = await getAgent(user.id);
        if (agentData) {
          if (agentData.brokerageProfile?.legalName) {
            setLegalName(agentData.brokerageProfile.legalName);
            setRawBrokerageName(agentData.brokerageProfile.legalName);
          }
          if (agentData.branding?.imageUrl || agentData.branding?.logoUrl) {
            setBrokerageLogo(agentData.branding.imageUrl || agentData.branding.logoUrl || "");
          }
          if (agentData.branding?.agentPhotoUrl) {
            setAgentPhoto(agentData.branding.agentPhotoUrl || "");
          }
        }
      } catch (err) {
        console.error("Failed to load agent branding details in Flyers:", err);
      }
    }

    if (user) {
      loadListings();
      loadAgentBranding();
    }
  }, [user]);

  async function loadListings() {
    setLoading(true);
    try {
      if (!user) return;
      const isAdmin = (user as any).role === "ADMIN";
      const data = isAdmin ? await getAllListings() : await getUserListings(user.id);
      setListings(data || []);
      if (data && data.length > 0) {
        setSelectedListing(data[0]);
        autoFillListingData(data[0], template);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load listings for flyer configurations.");
    } finally {
      setLoading(false);
    }
  }

  const autoFillListingData = (listing: Listing, activeTemplate: FlyerTemplate) => {
    if (!listing) return;

    // Load first image as default selected hero photo
    const firstImg = listing.images && listing.images.length > 0
      ? (typeof listing.images[0] === "string" ? listing.images[0] : (listing.images[0] as any).url)
      : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200";
    
    setSelectedHeroImage(listing.flyerHeroImage || firstImg);
    setExcludedPhotos(listing.excludedPhotos || []);

    if (listing.flyerTemplate) {
      setTemplate(listing.flyerTemplate as FlyerTemplate);
    }

    // Default headlines customized by templates
    const headlines: Record<FlyerTemplate, string> = {
      luxury_royal: "AN ARCHITECTURAL MASTERPIECE IN EVERY SENSE",
      modern_minimalist: "Sleek Aesthetics Meets Modern Convenience",
      open_house_showcase: "UPCOMING OPEN HOUSE SHOWCASE EVENT",
      scan_to_tour_ai: "WALK THROUGH WITH SORA — THE TALKING AI COMPANION",
      brokerage_branded: "Exclusive Property Spotlight Portfolio",
      lead_form_sign_in: "WELCOME! SCAN TO CHECK-IN & BROWSE DISCLOSURES",
      just_listed_sold: "BEAUTIFUL SHOWCLASS RESIDENCE RECENTLY DEBUTED"
    };

    const subheadlines: Record<FlyerTemplate, string> = {
      luxury_royal: "Exclusive Presentation Framework paired with Premium Modern Layout Elements",
      modern_minimalist: "Architectural minimalism framing floor-to-ceiling glass systems",
      open_house_showcase: "Join us this weekend for personal property presentations & refreshments",
      scan_to_tour_ai: "Put your AirPods in and experience our hands-free audio narrator tour",
      brokerage_branded: "Representing fine homes on behalf of the modern portfolio",
      lead_form_sign_in: "Touchless registration compliant with local brokerage board standards",
      just_listed_sold: "A signature property featuring state-of-the-art smart home technologies"
    };

    const activeTemp = listing.flyerTemplate as FlyerTemplate || activeTemplate;
    setCustomHeadline(listing.flyerHeadline || (headlines[activeTemp] || "AN UNCOMPROMISING PARADISE OF STYLE AND REFINEMENT").toUpperCase().slice(0, 80));
    setCustomSubHeadline(listing.flyerSubHeadline || (subheadlines[activeTemp] || "Discover premium structural attributes and elegant details.").slice(0, 120));
    
    const shortDesc = listing.description 
      ? listing.description.split(".").slice(0, 3).join(".") + "."
      : "Step into uncompromised luxury wrapping high-contrast views, pristine floorplans, premium material lists, and high-fidelity comfort throughout.";
    setCustomDescription(listing.flyerDescription || shortDesc.slice(0, 272));

    const ctas: Record<QrDestination, string> = {
      ai_tour: "Scan code to connect your headset & start Sora's live audio tour!",
      open_house: "Scan code to register safety logs & sign in securely instantly.",
      lead_form: "Scan code to file consent and receive instant property brochures.",
      details_page: "Scan code to load MLS disclosures, interactive map, and pricing.",
      custom_url: "Scan code to access verified premium media slides and specs directly."
    };
    setCustomCta(listing.flyerCta || ctas[qrDest].slice(0, 100));

    // Agent defaults
    const listAny = listing as any;
    const defaultName = listAny.agentName || user?.name || "Premium Broker Representative";
    setAgentNameOverride(defaultName.replace(/\b([a-z])/g, (match) => match.toUpperCase()));

    const rawPhone = listAny.agentPhone || "555-779-1100";
    const cleanedDigits = rawPhone.replace(/\D/g, "").slice(-10);
    const formattedPhone = cleanedDigits.length === 10 
      ? `(${cleanedDigits.slice(0, 3)}) ${cleanedDigits.slice(3, 6)}-${cleanedDigits.slice(6, 10)}`
      : "(555) 779-1100";
    setAgentPhoneOverride(formattedPhone);

    setAgentEmailOverride(listAny.agentEmail || user?.email || "advisor@aiopenhouseconnect.com");
    setBrokerageNameOverride(listAny.brokerageName || rawBrokerageName || legalName || "Pinnacle Real Estate Group");
  };

  const handleListingChange = (listingId: string) => {
    const list = listings.find(l => l.id === listingId);
    if (list) {
      setSelectedListing(list);
      autoFillListingData(list, template);
      toast.info(`Synced flyer builder with data from ${list.address}`);
    }
  };

  const handleTemplateChange = (newTemplate: FlyerTemplate) => {
    setTemplate(newTemplate);
    if (selectedListing) {
      autoFillListingData(selectedListing, newTemplate);
    }
  };

  const handleQrDestChange = (newDest: QrDestination) => {
    setQrDest(newDest);
    const ctas: Record<QrDestination, string> = {
      ai_tour: "Scan code to connect your headset & start Sora's live audio tour!",
      open_house: "Scan code to register safety logs & sign in securely instantly.",
      lead_form: "Scan code to file consent and receive instant property brochures.",
      details_page: "Scan code to load MLS disclosures, interactive map, and pricing.",
      custom_url: "Scan code to access verified premium media slides and specs directly."
    };
    setCustomCta((ctas[newDest] || "").slice(0, 100));
  };

  // AI copywriting generator with realistic responses related to AI Open House Connect models
  const runAiGenText = async (type: "headline" | "description" | "cta") => {
    if (!selectedListing) {
      toast.error("Please select a listing first.");
      return;
    }
    setIsGeneratingAi(true);
    
    setTimeout(() => {
      if (type === "headline") {
        const hList = [
          `THE ABSOLUTE PEAK OF LUXURY RESIDING AT ${selectedListing.address.toUpperCase()}`,
          `UNRIVALED MODERN SOPHISTICATION • MASTERWORK CONCRETE & OAK`,
          `CRAFTED TO CAPTIVATE: A SIGNATURE RESIDENCE OF MONUMENTAL SCALE`,
          `YOUR DIGITAL AUDIO WALKTHROUGH READY • SCAN TO COMMENCE`
        ];
        const picked = hList[Math.floor(Math.random() * hList.length)].toUpperCase().slice(0, 80);
        setCustomHeadline(picked);
        toast.success("✨ Generated elegant luxury headline.");
      } else if (type === "description") {
        const address = selectedListing.address || "this magnificent residence";
        const beds = selectedListing.beds ? `${selectedListing.beds} beds` : "";
        const baths = selectedListing.baths ? `${selectedListing.baths} baths` : "";
        const bedsBaths = [beds, baths].filter(Boolean).join(" & ");

        const options = [
          `A pristine masterpiece of modern design at ${address}${bedsBaths ? `. Featuring ${bedsBaths}` : ""}, this residence centers custom architectural structures of steel & glass, wide-plank select oak floors, custom marble chef's surfaces, and zero-tolerance millwork.`,
          `Impeccable architectural elegance at ${address}${bedsBaths ? ` with ${bedsBaths}` : ""}. Cascades soaring natural light across wide-plank white oak flooring. Boasts custom slab marble prep suite, bespoke millwork, and smart integrations for ultimate luxury living.`,
          `This signature residence at ${address} offers pristine bespoke finishes. Combining deep steel window panels and glass structures, the layout flows seamlessly onto wide-plank oak flooring. Fully integrated with automated smart home controls and high security.`
        ];

        let pickedText = options[Math.floor(Math.random() * options.length)];
        
        if (pickedText.length > 272) {
          const truncated = pickedText.slice(0, 269);
          const lastPeriod = truncated.lastIndexOf(".");
          if (lastPeriod > 100) {
            pickedText = truncated.slice(0, lastPeriod + 1);
          } else {
            const lastSpace = truncated.lastIndexOf(" ");
            pickedText = truncated.slice(0, lastSpace) + "...";
          }
        }

        setCustomDescription(pickedText);
        toast.success("✨ Generated elegant 272-character pitch.");
      } else if (type === "cta") {
        setCustomCta(`Scan to let Sora, our AI tour pilot, present this home to your ears in natural real-time dialogue!`.slice(0, 100));
        toast.success("✨ Created helpful voice-guided audio CTA.");
      }
      setIsGeneratingAi(false);
    }, 850);
  };

  // Build target URL
  const getQrUrl = () => {
    if (!selectedListing) return "https://aiopenhouseconnect.com";
    const base = window.location.origin;
    let url = "";
    switch(qrDest) {
      case "ai_tour": 
        url = `${base}/tour/${selectedListing.id}`;
        break;
      case "open_house":
        url = `${base}/open-houses?listingId=${selectedListing.id}`;
        break;
      case "lead_form":
        url = `${base}/microsite/${selectedListing.id}?sign_in=true`;
        break;
      case "details_page":
        url = `${base}/microsite/${selectedListing.id}`;
        break;
      case "custom_url":
        url = customQrUrl || "https://aiopenhouseconnect.com";
        break;
      default:
        url = `${base}/tour/${selectedListing.id}`;
    }
    if (url && !url.match(/^[a-zA-Z]+:\/\//)) {
      url = "https://" + url;
    }
    return url;
  };

  const handlePrint = () => {
    const printableElement = document.getElementById("flyer-printable-canvas");
    if (!printableElement) {
      toast.error("Printable flyer element not found.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      // Fallback if popup blocker is active
      window.print();
      return;
    }

    // Determine exact hex color palettes corresponding to chosen UI state
    const primaryColorHex = 
      accentColor === "gold" ? "#b45309" :
      accentColor === "slate" ? "#18181b" :
      accentColor === "emerald" ? "#047857" :
      accentColor === "sapphire" ? "#1d4ed8" :
      "#be123c"; // ruby

    const accentBgHex = 
      accentColor === "gold" ? "#fffbeb" :
      accentColor === "slate" ? "#f4f4f5" :
      accentColor === "emerald" ? "#ecfdf5" :
      accentColor === "sapphire" ? "#eff6ff" :
      "#fff1f2"; // ruby

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getQrUrl())}`;

    let htmlContent = "";

    if (orientation === "portrait") {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${selectedListing ? `${selectedListing.address}, ${selectedListing.city}` : "AI Open House Connect"}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;700&family=Poppins:wght@400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@400;600;700;800&family=Lato:wght@400;700;900&display=swap');
            
            @page { 
              size: letter portrait; 
              margin: 0; 
            }
            
            body { 
              margin: 0; 
              padding: 0.45in 0.5in 0.45in 0.5in; 
              background-color: white; 
              color: #1e293b;
              font-family: ${template === "luxury_royal" ? "'Playfair Display', serif" : "'Inter', sans-serif"};
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              box-sizing: border-box;
            }

            .container {
              width: 7.5in;
              height: 10.0in;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-sizing: border-box;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 12px;
            }

            .brand-logo-container {
              display: flex;
              align-items: center;
              gap: 10px;
            }

            .logo-badge {
              background-color: ${primaryColorHex};
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 900;
              font-size: 11px;
              letter-spacing: 1px;
            }

            .logo-text-title {
              font-weight: 800;
              font-size: 10px;
              letter-spacing: 1px;
              margin: 0;
              color: #0f172a;
            }

            .logo-text-subtitle {
              font-size: 8px;
              color: #64748b;
              margin: 0;
              font-weight: 600;
            }

            .brokerage-title {
              font-weight: 800;
              font-size: 10px;
              margin: 0;
              color: #0f172a;
              text-transform: uppercase;
              text-align: right;
            }

            .brokerage-subtitle {
              font-size: 7.5px;
              color: #64748b;
              margin: 0;
              text-transform: uppercase;
              margin-top: 2px;
              text-align: right;
            }

            /* Headline & Location */
            .headline-section {
              text-align: center;
              margin: ${includeLenderBlock ? '8px 0 4px 0' : '15px 0 10px 0'};
              position: relative;
            }

            .status-badge {
              display: inline-block;
              background-color: #0f172a;
              color: white;
              font-size: 8px;
              font-weight: 800;
              padding: 3px 8px;
              border-radius: 4px;
              text-transform: uppercase;
              margin-bottom: 8px;
              letter-spacing: 0.5px;
            }

            .main-headline {
              font-family: ${getFontFamily(titleFont)};
              font-size: ${getTitleFontSize(titleSize, false)};
              font-weight: ${titleBold ? '900' : '500'};
              color: ${primaryColorHex};
              text-transform: uppercase;
              margin: 0;
              line-height: 1.2;
              letter-spacing: -0.5px;
              
              /* Line Clamping for 2 lines maximum */
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              max-height: 2.4em;
            }

            .location-tag {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
              font-size: 11px;
              color: #64748b;
              font-weight: 600;
              margin: 6px 0 0 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            @keyframes rotatingFlyerBorder {
              0% { border-color: #ef4444; }
              33% { border-color: #ffffff; }
              66% { border-color: #3b82f6; }
              100% { border-color: #ef4444; }
            }

            /* Hero section */
            .hero-container {
              position: relative;
              width: 100%;
              height: ${includeLenderBlock ? '2.8in' : '3.2in'};
              border-radius: 8px;
              overflow: hidden;
              border: 2px solid #ef4444;
              box-sizing: border-box;
              animation: rotatingFlyerBorder 4s linear infinite;
            }

            .hero-image {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .price-badge {
              position: absolute;
              top: 15px;
              right: 15px;
              background-color: rgba(15, 23, 42, 0.9);
              color: white;
              padding: 6px 12px;
              border-radius: 6px;
              font-size: 13px;
              font-weight: 800;
              letter-spacing: -0.5px;
              font-family: Arial, Helvetica, sans-serif !important;
            }

            .audio-badge {
              position: absolute;
              bottom: 12px;
              left: 12px;
              right: 12px;
              background-color: rgba(30, 58, 138, 0.95);
              border: 1px solid rgba(59, 130, 246, 0.3);
              border-radius: 6px;
              padding: 8px 12px;
              color: white;
              display: flex;
              align-items: center;
              gap: 10px;
            }

            .audio-text {
              margin: 0;
              font-size: 9px;
              font-weight: 800;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              font-family: 'Inter', sans-serif;
            }

            /* Grid dashboard stats */
            .dashboard-stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              background-color: ${accentBgHex};
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: ${includeLenderBlock ? '6px' : '10px'};
              text-align: center;
              margin: ${includeLenderBlock ? '8px 0' : '15px 0'};
            }

            .stat-item {
              border-right: 1px solid #cbd5e1;
            }

            .stat-item:last-child {
              border-right: none;
            }

            .stat-lbl {
              font-size: 9px;
              color: #64748b;
              text-transform: uppercase;
              font-weight: 700;
              margin: 0 0 3px 0;
              font-family: Arial, Helvetica, sans-serif !important;
            }

            .stat-val {
              font-size: 18px;
              font-weight: 900;
              color: #0f172a;
              margin: 0;
              line-height: 1;
              font-family: Arial, Helvetica, sans-serif !important;
            }

            /* Middle section content split */
            .content-area {
              display: grid;
              grid-template-columns: 8fr 4fr;
              gap: 20px;
              align-items: start;
              margin-bottom: ${includeLenderBlock ? '8px' : '15px'};
            }

            .description-col {
              display: flex;
              flex-direction: column;
              gap: 10px;
            }

            .subheadline {
              font-family: ${getFontFamily(subtitleFont)};
              font-size: ${getSubtitleFontSize(subtitleSize, false)};
              font-weight: ${subtitleBold ? '900' : '400'};
              color: #0f172a;
              margin: 0;
              line-height: 1.4;
              text-align: center;
            }

            .description-text {
              font-family: ${getFontFamily(descriptionFont)};
              font-size: ${getDescriptionFontSize(descriptionSize, false)};
              font-weight: ${descriptionBold ? '700' : '400'};
              color: #475569;
              line-height: 1.6;
              margin: 0;
              text-align: justify;
            }

            .event-time-callout {
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 6px 10px;
              font-size: 10px;
              background-color: #f8fafc;
              color: #334155;
              display: inline-flex;
              align-items: center;
              gap: 6px;
              margin-top: 5px;
              width: fit-content;
            }

            .active-point {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background-color: #3b82f6;
            }

            /* QR Code Side Box */
            .qr-badge-box {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px;
              text-align: center;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 8px;
            }

            .qr-image-wrapper {
              background-color: white;
              padding: 4px;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              display: inline-flex;
              position: relative;
            }

            .qr-overlay {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: white;
              padding: 2px;
              border-radius: ${qrBrandingOption === "photo" ? "50%" : "4px"};
              border: 1px solid #cbd5e1;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .qr-overlay img {
              display: block;
              width: 24px;
              height: 24px;
              object-fit: contain;
              border-radius: ${qrBrandingOption === "photo" ? "50%" : "2px"};
            }

            .qr-promo-label {
              font-family: ${getFontFamily(ctaFont)};
              font-size: ${getCtaFontSize(ctaSize, false)};
              font-weight: ${ctaBold ? '900' : '500'};
              color: #0f172a;
              text-transform: uppercase;
              margin: 0;
              letter-spacing: 0.5px;
              max-width: 100px;
              line-height: 1.2;
            }

            /* Room photos strip */
            .photo-strip {
              display: flex;
              gap: 12px;
              margin-top: ${includeLenderBlock ? '6px' : '10px'};
            }

            .strip-item {
              flex: 1;
              height: ${includeLenderBlock ? '1.05in' : '1.3in'};
              border-radius: 6px;
              overflow: hidden;
              border: 1px solid #e2e8f0;
            }

            .strip-photo {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            /* Footer agent section */
            .footer {
              border-top: 1px solid #f1f5f9;
              padding-top: ${includeLenderBlock ? '8px' : '12px'};
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: ${includeLenderBlock ? '6px' : '10px'};
            }

            .agent-card {
              display: flex;
              align-items: center;
              gap: 10px;
            }

            .agent-avatar {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background-color: #f1f5f9;
              border: 1px solid #cbd5e1;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #475569;
            }

            .agent-name {
              font-size: 10px;
              font-weight: 900;
              color: #0f172a;
              margin: 0;
              line-height: 1.2;
            }

            .agent-phone {
              font-size: 8.5px;
              color: #64748b;
              margin: 0;
              font-family: 'JetBrains Mono', monospace;
              margin-top: 2px;
            }

            .regulatory-block {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 8.5px;
              color: #64748b;
              font-weight: 500;
              font-family: 'Inter', sans-serif;
            }

            .logo-bullet {
              color: #3b82f6;
              font-weight: bold;
            }

            .lender-block {
              background-color: #fffbeb;
              border: 1px solid #fef3c7;
              padding: 6px 10px;
              border-radius: 6px;
              text-align: right;
              max-width: 2.5in;
            }

            .lender-title {
              font-size: 8.5px;
              font-weight: 900;
              color: #000000;
              margin: 0;
              text-transform: uppercase;
              line-height: 1;
            }

            .lender-cta {
              font-size: 7.5px;
              color: #000000;
              margin: 0;
              margin-top: 2px;
              text-transform: uppercase;
              line-height: 1.2;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="brand-logo-container">
                <div class="logo-badge">VA</div>
                <div>
                  <p class="logo-text-title">AI OPEN HOUSE CONNECT</p>
                  <p class="logo-text-subtitle">DIGITAL COMPANION</p>
                </div>
              </div>
              <div>
                <p class="brokerage-title">${brokerageNameOverride || legalName || "PINNACLE REAL ESTATE GROUP"}</p>
                <p class="brokerage-subtitle">EXCLUSIVE SYNDICATE</p>
              </div>
            </div>

            <div class="headline-section">
              ${template === "just_listed_sold" ? `<span class="status-badge">${statusBadgeText}</span>` : ""}
              <h2 class="main-headline">${customHeadline}</h2>
              <p class="location-tag"><span style="display: inline-flex; align-items: center; font-size: 13px; line-height: 1; margin-right: 2px;">📍</span><span>${selectedListing.address}, ${selectedListing.city}</span></p>
            </div>

            <div class="hero-container">
              <img src="${selectedHeroImage || fallbackImg}" class="hero-image" alt="Primary Property View" />
              <div class="price-badge">$${(selectedListing.price || 5000000).toLocaleString()}</div>
              
              ${template === "scan_to_tour_ai" ? `
              <div class="audio-badge">
                <span class="audio-icon">🔊</span>
                <p class="audio-text">LIVE AUDIO WALKTHROUGH READY</p>
              </div>
              ` : ""}
            </div>

            <div class="dashboard-stats">
              <div class="stat-item">
                <p class="stat-lbl">Beds</p>
                <p class="stat-val">${selectedListing.beds || 5}</p>
              </div>
              <div class="stat-item">
                <p class="stat-lbl">Baths</p>
                <p class="stat-val">${selectedListing.baths || 6}</p>
              </div>
              <div class="stat-item">
                <p class="stat-lbl">Sq Ft</p>
                <p class="stat-val">${(selectedListing.sqft || 4300).toLocaleString()}</p>
              </div>
              <div class="stat-item">
                <p class="stat-lbl">Est. Rate</p>
                <p class="stat-val" style="color: #2e7d32;">4.92% APR</p>
              </div>
            </div>

            <div class="content-area">
              <div class="description-col">
                ${customSubHeadline ? `<h3 class="subheadline">${customSubHeadline}</h3>` : ""}
                <p class="description-text">${customDescription}</p>
                
                ${(template === "open_house_showcase" || template === "lead_form_sign_in") ? `
                <div class="event-time-callout">
                  <span class="active-point"></span>
                  <span>Event Time: <strong>${openHouseTime}</strong></span>
                </div>
                ` : ""}
              </div>
              
              <div class="qr-badge-box">
                <div class="qr-image-wrapper">
                  <img src="${qrCodeUrl}" width="112" height="112" alt="Web Scan" />
                  ${
                    (qrBrandingOption === "logo" && brokerageLogo) || (qrBrandingOption === "photo" && agentPhoto) ? `
                    <div class="qr-overlay">
                      <img src="${qrBrandingOption === "logo" ? brokerageLogo : agentPhoto}" alt="overlay" />
                    </div>
                    ` : ""
                  }
                </div>
                <p class="qr-promo-label">
                  ${qrDest === "ai_tour" ? "Scan to tour" : "Scan to register"}
                </p>
              </div>
            </div>

            ${showSecondaryPhotos ? `
            <div class="photo-strip">
              <div class="strip-item">
                <img src="${secondPhoto}" class="strip-photo" />
              </div>
              <div class="strip-item">
                <img src="${thirdPhoto}" class="strip-photo" />
              </div>
            </div>
            ` : ""}

            <div class="footer">
              <div class="agent-card">
                <div class="agent-avatar">👤</div>
                <div>
                  <p class="agent-name">${agentNameOverride || "Advisory Agent"}</p>
                  <p class="agent-phone">${agentPhoneOverride || "+1 (555) 779-1100"}</p>
                </div>
              </div>
              
              ${includeLenderBlock ? `
              <div class="lender-block">
                <p class="lender-title">${lenderName}</p>
                <p class="lender-cta">${lenderCta.slice(0, 16)}</p>
              </div>
              ` : `
              <div class="regulatory-block">
                <span class="logo-bullet">✓</span> Board Compliant Media Standard.
              </div>
              `}
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // Landscape Design Layout
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${selectedListing ? `${selectedListing.address}, ${selectedListing.city}` : "AI Open House Connect"}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;700&family=Poppins:wght@400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@400;600;700;800&family=Lato:wght@400;700;900&display=swap');
            
            @page { 
              size: letter landscape; 
              margin: 0; 
            }
            
            body { 
              margin: 0; 
              padding: 0.5in 0.45in 0.5in 0.45in; 
              background-color: white; 
              color: #1e293b;
              font-family: ${template === "luxury_royal" ? "'Playfair Display', serif" : "'Inter', sans-serif"};
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              box-sizing: border-box;
            }

            .container {
              width: 10.1in;
              height: 7.5in;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-sizing: border-box;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 10px;
            }

            .brand-logo-container {
              display: flex;
              align-items: center;
              gap: 10px;
            }

            .logo-badge {
              background-color: ${primaryColorHex};
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 900;
              font-size: 11px;
            }

            .logo-text-title {
              font-weight: 800;
              font-size: 10px;
              margin: 0;
              color: #0f172a;
            }

            .logo-text-subtitle {
              font-size: 8px;
              color: #64748b;
              margin: 0;
            }

            .brokerage-title {
              font-weight: 800;
              font-size: 10px;
              margin: 0;
              color: #0f172a;
              text-transform: uppercase;
            }

            .brokerage-subtitle {
              font-size: 7.5px;
              color: #64748b;
              margin: 0;
              text-transform: uppercase;
              margin-top: 2px;
              text-align: right;
            }

            .split-body {
              display: grid;
              grid-template-columns: 5in 4.6in;
              gap: 0.4in;
              flex: 1;
              margin: 15px 0;
              align-items: stretch;
            }

            .left-column {
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }

            .right-column {
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }

            @keyframes rotatingFlyerBorder {
              0% { border-color: #ef4444; }
              33% { border-color: #ffffff; }
              66% { border-color: #3b82f6; }
              100% { border-color: #ef4444; }
            }

            /* Hero container */
            .hero-container {
              position: relative;
              width: 100%;
              height: 2.7in;
              border-radius: 8px;
              overflow: hidden;
              border: 2px solid #ef4444;
              box-sizing: border-box;
              animation: rotatingFlyerBorder 4s linear infinite;
            }

            .hero-image {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .price-badge {
              position: absolute;
              top: 12px;
              right: 12px;
              background-color: rgba(15, 23, 42, 0.9);
              color: white;
              padding: 5px 10px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 800;
              font-family: Arial, Helvetica, sans-serif !important;
            }

            /* Headline details */
            .headline-section {
              margin-bottom: 8px;
              position: relative;
            }

            .status-badge {
              display: inline-block;
              background-color: #0f172a;
              color: white;
              font-size: 7px;
              font-weight: 800;
              padding: 2px 6px;
              border-radius: 4px;
              text-transform: uppercase;
              margin-bottom: 5px;
            }

            .main-headline {
              font-family: ${getFontFamily(titleFont)};
              font-size: ${getTitleFontSize(titleSize, false)};
              font-weight: ${titleBold ? '900' : '500'};
              color: ${primaryColorHex};
              text-transform: uppercase;
              margin: 0;
              line-height: 1.2;
              
              /* Line Clamping for 2 lines maximum */
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              max-height: 2.4em;
            }

            .location-tag {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
              font-size: 9.5px;
              color: #64748b;
              font-weight: 600;
              margin: 4px 0 0 0;
              text-transform: uppercase;
            }

            /* Dashboard stats */
            .dashboard-stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              background-color: ${accentBgHex};
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 8px;
              text-align: center;
              margin-bottom: 8px;
            }

            .stat-item {
              border-right: 1px solid #cbd5e1;
            }

            .stat-item:last-child {
              border-right: none;
            }

            .stat-lbl {
              font-size: 8px;
              color: #64748b;
              text-transform: uppercase;
              font-weight: 600;
              margin: 0 0 2px 0;
              font-family: Arial, Helvetica, sans-serif !important;
            }

            .stat-val {
              font-size: 15px;
              font-weight: 900;
              color: #0f172a;
              margin: 0;
              font-family: Arial, Helvetica, sans-serif !important;
            }

            /* Split detail grid inside right col */
            .info-qr-grid {
              display: grid;
              grid-template-columns: 2.8in 1.5in;
              gap: 15px;
              align-items: start;
            }

            .subheadline {
              font-family: ${getFontFamily(subtitleFont)};
              font-size: ${getSubtitleFontSize(subtitleSize, false)};
              font-weight: ${subtitleBold ? '900' : '400'};
              color: #0f172a;
              margin: 0 0 4px 0;
              text-align: center;
            }

            .description-text {
              font-family: ${getFontFamily(descriptionFont)};
              font-size: ${getDescriptionFontSize(descriptionSize, false)};
              font-weight: ${descriptionBold ? '700' : '400'};
              color: #475569;
              line-height: 1.5;
              margin: 0;
              text-align: justify;
            }

            .event-time-callout {
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 4px 8px;
              font-size: 8.5px;
              background-color: #f8fafc;
              color: #334155;
              display: inline-flex;
              align-items: center;
              gap: 5px;
              margin-top: 5px;
            }

            .active-point {
              width: 5px;
              height: 5px;
              border-radius: 50%;
              background-color: #3b82f6;
            }

            .qr-badge-box {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 8px;
              text-align: center;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 6px;
            }

            .qr-image-wrapper {
              background-color: white;
              padding: 4px;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              display: inline-flex;
              position: relative;
            }

            .qr-overlay {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: white;
              padding: 2px;
              border-radius: ${qrBrandingOption === "photo" ? "50%" : "4px"};
              border: 1px solid #cbd5e1;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .qr-overlay img {
              display: block;
              width: 18px;
              height: 18px;
              object-fit: contain;
              border-radius: ${qrBrandingOption === "photo" ? "50%" : "2px"};
            }

            .qr-promo-label {
              font-family: ${getFontFamily(ctaFont)};
              font-size: ${getCtaFontSize(ctaSize, false)};
              font-weight: ${ctaBold ? '900' : '500'};
              color: #0f172a;
              text-transform: uppercase;
              margin: 0;
              line-height: 1.1;
            }

            /* Photos strip and signatures */
            .photo-strip {
              display: flex;
              gap: 10px;
              height: 1.05in;
            }

            .strip-item {
              flex: 1;
              height: 100%;
              border-radius: 6px;
              overflow: hidden;
              border: 1px solid #e2e8f0;
            }

            .strip-photo {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .footer {
              border-top: 1px solid #f1f5f9;
              padding-top: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }

            .agent-card {
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .agent-avatar {
              width: 26px;
              height: 26px;
              border-radius: 50%;
              background-color: #f1f5f9;
              border: 1px solid #cbd5e1;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11.5px;
            }

            .agent-name {
              font-size: 9px;
              font-weight: 900;
              color: #0f172a;
              margin: 0;
            }

            .agent-phone {
              font-size: 8px;
              color: #64748b;
              margin: 0;
              font-family: 'JetBrains Mono', monospace;
            }

            .regulatory-block {
              display: flex;
              align-items: center;
              gap: 3px;
              font-size: 8px;
              color: #64748b;
            }

            .lender-block {
              background-color: #fffbeb;
              border: 1px solid #fef3c7;
              padding: 4px 8px;
              border-radius: 6px;
              text-align: right;
              max-width: 2.2in;
            }

            .lender-title {
              font-size: 8px;
              font-weight: 900;
              color: #000000;
              margin: 0;
              text-transform: uppercase;
            }

            .lender-cta {
              font-size: 7px;
              color: #000000;
              margin: 0;
              margin-top: 1px;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="brand-logo-container">
                <div class="logo-badge">VA</div>
                <div>
                  <p class="logo-text-title">AI OPEN HOUSE CONNECT</p>
                  <p class="logo-text-subtitle">DIGITAL COMPANION</p>
                </div>
              </div>
              <div style="text-align: right;">
                <p class="brokerage-title">${brokerageNameOverride || legalName || "PINNACLE REAL ESTATE GROUP"}</p>
                <p class="brokerage-subtitle">EXCLUSIVE SYNDICATE</p>
              </div>
            </div>

            <div class="split-body">
              <div class="left-column">
                <div class="hero-container">
                  <img src="${selectedHeroImage || fallbackImg}" class="hero-image" alt="Primary Property View" />
                  <div class="price-badge">$${(selectedListing.price || 5000000).toLocaleString()}</div>
                </div>

                ${showSecondaryPhotos ? `
                <div class="photo-strip">
                  <div class="strip-item">
                    <img src="${secondPhoto}" class="strip-photo" />
                  </div>
                  <div class="strip-item">
                    <img src="${thirdPhoto}" class="strip-photo" />
                  </div>
                </div>
                ` : `<div style="height: 1.05in; border: 1px dashed #cbd5e1; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #64748b;">No secondary photos selected.</div>`}
              </div>

              <div class="right-column">
                <div>
                  <div class="headline-section">
                    ${template === "just_listed_sold" ? `<span class="status-badge">${statusBadgeText}</span>` : ""}
                    <h2 class="main-headline">${customHeadline}</h2>
                    <p class="location-tag"><span style="display: inline-flex; align-items: center; font-size: 11px; line-height: 1; margin-right: 2px;">📍</span><span>${selectedListing.address}, ${selectedListing.city}</span></p>
                  </div>

                  <div class="dashboard-stats">
                    <div class="stat-item">
                      <p class="stat-lbl">Beds</p>
                      <p class="stat-val">${selectedListing.beds || 5}</p>
                    </div>
                    <div class="stat-item">
                      <p class="stat-lbl">Baths</p>
                      <p class="stat-val">${selectedListing.baths || 6}</p>
                    </div>
                    <div class="stat-item">
                      <p class="stat-lbl">Sq Ft</p>
                      <p class="stat-val">${(selectedListing.sqft || 4300).toLocaleString()}</p>
                    </div>
                    <div class="stat-item">
                      <p class="stat-lbl">Est. Rate</p>
                      <p class="stat-val" style="color: #2e7d32;">4.92% APR</p>
                    </div>
                  </div>
                </div>

                <div class="info-qr-grid">
                  <div>
                    ${customSubHeadline ? `<h3 class="subheadline">${customSubHeadline}</h3>` : ""}
                    <p class="description-text">${customDescription}</p>
                    
                    ${(template === "open_house_showcase" || template === "lead_form_sign_in") ? `
                    <div class="event-time-callout">
                      <span class="active-point"></span>
                      <span>Event: <strong>${openHouseTime}</strong></span>
                    </div>
                    ` : ""}
                  </div>

                  <div class="qr-badge-box">
                    <div class="qr-image-wrapper">
                      <img src="${qrCodeUrl}" width="88" height="88" alt="Web Scan" />
                      ${
                        (qrBrandingOption === "logo" && brokerageLogo) || (qrBrandingOption === "photo" && agentPhoto) ? `
                        <div class="qr-overlay">
                          <img src="${qrBrandingOption === "logo" ? brokerageLogo : agentPhoto}" alt="overlay" />
                        </div>
                        ` : ""
                      }
                    </div>
                    <p class="qr-promo-label">
                      ${qrDest === "ai_tour" ? "Scan to tour" : "Scan to register"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="footer">
              <div class="agent-card">
                <div class="agent-avatar">👤</div>
                <div>
                  <p class="agent-name">${agentNameOverride || "Advisory Agent"}</p>
                  <p class="agent-phone">${agentPhoneOverride || "+1 (555) 779-1100"}</p>
                </div>
              </div>
              
              ${includeLenderBlock ? `
              <div class="lender-block">
                <p class="lender-title">${lenderName}</p>
                <p class="lender-cta">${lenderCta.slice(0, 16)}</p>
              </div>
              ` : `
              <div class="regulatory-block">
                <span>✓</span> Board Compliant Media Standard.
              </div>
              `}
            </div>
          </div>
        </body>
        </html>
      `;
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownloadQrCode = () => {
    try {
      const qrg = document.getElementById("active-qr-svg");
      if (qrg) {
        const svgString = new XMLSerializer().serializeToString(qrg);
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const blobURL = (window.URL || (window as any).webkitURL).createObjectURL(svgBlob);
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 500;
          canvas.height = 500;
          const context = canvas.getContext("2d");
          if (context) {
            context.fillStyle = "#FFFFFF";
            context.fillRect(0, 0, 500, 500);
            context.drawImage(image, 25, 25, 450, 450);
            const png = canvas.toDataURL("image/png");
            
            const safeAddress = (selectedListing?.address || "listing")
              .replace(/[^a-zA-Z0-9]/g, ""); // IE: 77ElfordCresHamilton

            const dlLink = document.createElement("a");
            dlLink.download = `${safeAddress}.png`;
            dlLink.href = png;
            document.body.appendChild(dlLink);
            dlLink.click();
            document.body.removeChild(dlLink);
            toast.success(`✨ Dynamic tracking QR code downloaded as high-res PNG (${safeAddress}.png)!`);
          }
        };
        image.src = blobURL;
      } else {
        toast.error("Unable to extract QR graphic reference.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error creating QR raster stream download.");
    }
  };

  // Color preset mapping
  const colorClasses: Record<AccentColor, { bg: string; text: string; border: string; preview: string; name: string; fill: string }> = {
    gold: { bg: "bg-amber-900", text: "text-amber-600", border: "border-amber-700/50", preview: "bg-amber-500", name: "Imperial Gold", fill: "bg-amber-50" },
    slate: { bg: "bg-zinc-950", text: "text-zinc-800", border: "border-zinc-800", preview: "bg-zinc-900", name: "Minimalist Slate", fill: "bg-zinc-50" },
    emerald: { bg: "bg-emerald-950", text: "text-emerald-600", border: "border-emerald-800", preview: "bg-emerald-600", name: "Zen Emerald", fill: "bg-emerald-50" },
    sapphire: { bg: "bg-slate-900", text: "text-blue-600", border: "border-blue-900", preview: "bg-blue-600", name: "Pacific Sapphire", fill: "bg-blue-50" },
    ruby: { bg: "bg-rose-950", text: "text-rose-600", border: "border-rose-900", preview: "bg-rose-600", name: "Stellar Ruby", fill: "bg-rose-50" },
  };

  const activeColor = colorClasses[accentColor];

  // Primary image fallback
  const fallbackImg = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200";
  const listingPhotos = selectedListing?.images || [];
  
  const togglePhotoInclusion = async (url: string) => {
    if (!selectedListing) {
      toast.error("Please select a listing first.");
      return;
    }

    if (excludedPhotos.includes(url)) {
      // Including/checking this photo
      const currentCheckedPhotosCount = listingPhotos
        .map(photo => typeof photo === "string" ? photo : (photo as any).url)
        .filter(u => !excludedPhotos.includes(u)).length;
      
      const targetCheckedCount = currentCheckedPhotosCount + 1;
      
      if (targetCheckedCount > 3) {
        toast.error("⚠️ Not Allowed: You cannot exceed 3 checked photos in total for the printed flyer layout (1 Featured + 2 Secondary). Please uncheck another photo first.");
        return;
      }
      
      const updatedExcluded = excludedPhotos.filter(p => p !== url);
      setExcludedPhotos(updatedExcluded);
      
      const tid = toast.loading("Auto-saving photo checkbox change...");
      try {
        await updateListing(selectedListing.id, {
          excludedPhotos: updatedExcluded
        });
        const updatedListing = { ...selectedListing, excludedPhotos: updatedExcluded };
        setSelectedListing(updatedListing);
        setListings(prev => prev.map(l => l.id === selectedListing.id ? updatedListing : l));
        toast.dismiss(tid);
        toast.success("Saved! Photo included in flyer secondary strip.");
      } catch (err) {
        toast.dismiss(tid);
        toast.error("Failed to auto-save photo selection.");
      }
    } else {
      // Excluding/unchecking this photo
      if (url === selectedHeroImage) {
        toast.error("Cannot exclude the active featured primary photo!");
        return;
      }
      const updatedExcluded = [...excludedPhotos, url];
      setExcludedPhotos(updatedExcluded);
      
      const tid = toast.loading("Auto-saving photo checkbox change...");
      try {
        await updateListing(selectedListing.id, {
          excludedPhotos: updatedExcluded
        });
        const updatedListing = { ...selectedListing, excludedPhotos: updatedExcluded };
        setSelectedListing(updatedListing);
        setListings(prev => prev.map(l => l.id === selectedListing.id ? updatedListing : l));
        toast.dismiss(tid);
        toast.success("Saved! Photo excluded from flyer secondary strip.");
      } catch (err) {
        toast.dismiss(tid);
        toast.error("Failed to auto-save photo exclusion.");
      }
    }
  };

  const movePhotoInFlyer = async (index: number, direction: 'left' | 'right' | 'up' | 'down') => {
    if (!selectedListing) return;
    const photos = [...listingPhotos];
    let targetIndex = index;
    if (direction === 'left') {
      targetIndex = index - 1;
    } else if (direction === 'right') {
      targetIndex = index + 1;
    } else if (direction === 'up') {
      targetIndex = index - 4;
    } else if (direction === 'down') {
      targetIndex = index + 4;
    }

    if (targetIndex >= 0 && targetIndex < photos.length) {
      const temp = photos[index];
      photos[index] = photos[targetIndex];
      photos[targetIndex] = temp;
      
      const tid = toast.loading("Saving new image layout order...");
      try {
        await updateListing(selectedListing.id, {
          images: photos
        });
        const updatedListing = { ...selectedListing, images: photos };
        setSelectedListing(updatedListing);
        setListings(prev => prev.map(l => l.id === selectedListing.id ? updatedListing : l));
        toast.dismiss(tid);
        toast.success(`Image moved ${direction} successfully and auto-saved!`);
      } catch (err) {
        toast.dismiss(tid);
        toast.error("Failed to auto-save image order.");
      }
    } else {
      toast.warning(`Cannot move image ${direction} from this position.`);
    }
  };

  const filteredSecondaryPhotos = listingPhotos
    .map(photo => typeof photo === "string" ? photo : (photo as any).url)
    .filter(url => url !== selectedHeroImage)
    .filter(url => !excludedPhotos.includes(url));

  const secondPhoto = filteredSecondaryPhotos[0] || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600";
  const thirdPhoto = filteredSecondaryPhotos[1] || "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=600";

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes rotatingFlyerBorder {
          0% { border-color: #ef4444; }
          33% { border-color: #ffffff; }
          66% { border-color: #3b82f6; }
          100% { border-color: #ef4444; }
        }
        .preview-rotating-border {
          border: 2px solid #ef4444 !important;
          animation: rotatingFlyerBorder 4s linear infinite !important;
          box-sizing: border-box !important;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #flyer-printable-canvas, #flyer-printable-canvas * {
            visibility: visible;
          }
          #flyer-printable-canvas {
            position: absolute;
            left: 0;
            top: 0;
            width: 8.5in !important;
            height: 11in !important;
            margin: 0 !important;
            padding: 0.5in !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Title & Download Commands Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            <Layout className="h-7 w-7 text-blue-600" />
            Marketing Flyer Suite
          </h1>
          <p className="text-sm text-slate-500">
            Generate high-density elegant flyers synced with active listing properties and Sora's live audio tours under seconds.
          </p>
        </div>
        
        {/* Export Dropdown controls */}
        {selectedListing && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Button 
              onClick={handlePrint}
              className="bg-[#155dfc] hover:bg-[#155dfc]/90 text-white font-extrabold gap-2 rounded-xl h-11 px-5 text-xs cursor-pointer flex-1 sm:flex-none animate-pulse"
            >
              <Printer className="h-4 w-4" />
              Print Flyer (PDF)
            </Button>
            <Button 
              onClick={handleDownloadQrCode}
              className="bg-[#155dfc] hover:bg-[#155dfc]/90 text-white font-extrabold gap-2 rounded-xl h-11 px-4 text-xs cursor-pointer flex-1 sm:flex-none"
            >
              <QrCode className="h-4 w-4 active:text-blue-900 text-white" />
              Download QR Only
            </Button>
          </div>
        )}
      </div>

      {!selectedListing ? (
        <Card className="border-dashed border-2 py-16 text-center">
          <CardContent className="space-y-4">
            <FileText className="h-12 w-12 text-slate-400 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-slate-800">No Listings Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Please seed listings or complete an ingestion parse before accessing print media marketing.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Edit Controls column */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="mx-auto max-w-[calc(100%-15px)] lg:max-w-none lg:mx-0 rounded-2xl border-blue-900/40 shadow-sm overflow-hidden text-left bg-[#155dfc] text-white">
              <div className="border-b-2 border-white bg-white/10 flex">
                <button
                  onClick={() => setActiveTab("edit")}
                  className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === "edit" ? "border-white text-white" : "border-transparent text-blue-100 hover:text-white"
                  }`}
                >
                  1. Content
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === "settings" ? "border-white text-white" : "border-transparent text-blue-100 hover:text-white"
                  }`}
                >
                  2. Aesthetics
                </button>
                <button
                  onClick={() => setActiveTab("typography")}
                  className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === "typography" ? "border-white text-white" : "border-transparent text-blue-100 hover:text-white"
                  }`}
                >
                  3. Typography
                </button>
                <button
                  onClick={() => setActiveTab("qr_code")}
                  className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === "qr_code" ? "border-white text-white" : "border-transparent text-blue-100 hover:text-white"
                  }`}
                >
                  4. QR Code
                </button>
              </div>

              <CardContent className="p-6 space-y-5">
                {activeTab === "edit" ? (
                  <>
                    {/* Listing select */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <Label className={`text-[10px] uppercase tracking-wider transition-colors duration-150 ${
                          activeHelpPopup?.title === "Sync Property Record" ? "text-white font-black" : "text-white/80 font-black"
                        }`}>Sync Property Record</Label>
                        <button
                          type="button"
                          onClick={() => setActiveHelpPopup({
                            title: "Sync Property Record",
                            content: "Import and keep active MLS listing facts synchronized with the marketing flyer canvas instantly."
                          })}
                          className={`cursor-pointer p-0.5 transition-all duration-150 ${
                            activeHelpPopup?.title === "Sync Property Record"
                              ? "text-white scale-125"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <HelpCircle className="h-3.5 w-3.5 transition-all" strokeWidth={activeHelpPopup?.title === "Sync Property Record" ? 3.5 : 2} />
                        </button>
                      </div>
                      <select
                        value={selectedListing?.id || ""}
                        onChange={(e) => handleListingChange(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                      >
                        {listings.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.address}, {l.city} (${(l.price || 0).toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Headline inputs */}
                    <div className="space-y-1.5 animate-in fade-in">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <Label className={`text-[10px] uppercase tracking-wider transition-colors duration-150 ${
                            activeHelpPopup?.title === "Flyer Primary Title" ? "text-white font-black" : "text-white/80 font-black"
                          }`}>Flyer Primary Title</Label>
                          <button
                            type="button"
                            onClick={() => setActiveHelpPopup({
                              title: "Flyer Primary Title",
                              content: "The primary display banner on your printed flyer. Use eye-catching uppercase luxury copy."
                            })}
                            className={`cursor-pointer p-0.5 transition-all duration-150 ${
                              activeHelpPopup?.title === "Flyer Primary Title"
                                ? "text-white scale-125"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            <HelpCircle className="h-3.5 w-3.5 transition-all" strokeWidth={activeHelpPopup?.title === "Flyer Primary Title" ? 3.5 : 2} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-mono font-bold ${customHeadline.length >= 45 ? 'text-amber-300' : 'text-white'}`}>
                            {customHeadline.length}/60 {customHeadline.length >= 45 && (
                              <span className="animate-pulse font-normal">({Math.min(100, Math.round((customHeadline.length / 60) * 100))}% Reached)</span>
                            )}
                          </span>
                          <button
                            onClick={() => runAiGenText("headline")}
                            disabled={isGeneratingAi}
                            className="text-[9px] font-extrabold text-white hover:text-slate-200 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className="h-3 w-3 text-white" />
                            AI Headline Builder
                          </button>
                        </div>
                      </div>
                      <Input
                        value={customHeadline}
                        onChange={(e) => setCustomHeadline(e.target.value.toUpperCase().slice(0, 60))}
                        placeholder="LUXURY ESTATE"
                        maxLength={60}
                        className="text-xs sm:text-sm font-semibold h-10 border-slate-200 rounded-xl tracking-tight uppercase"
                      />
                    </div>

                    {/* Subheadline and taglines */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <Label className={`text-[10px] uppercase tracking-wider transition-colors duration-150 ${
                            activeHelpPopup?.title === "Marketing Subtitle" ? "text-white font-black" : "text-white/80 font-black"
                          }`}>Marketing Subtitle</Label>
                          <button
                            type="button"
                            onClick={() => setActiveHelpPopup({
                              title: "Marketing Subtitle",
                              content: "A secondary hook framing the luxury characteristics, location, or active offering style of this listing."
                            })}
                            className={`cursor-pointer p-0.5 transition-all duration-150 ${
                              activeHelpPopup?.title === "Marketing Subtitle"
                                ? "text-white scale-125"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            <HelpCircle className="h-3.5 w-3.5 transition-all" strokeWidth={activeHelpPopup?.title === "Marketing Subtitle" ? 3.5 : 2} />
                          </button>
                        </div>
                        <span className={`text-[9px] font-mono font-bold ${customSubHeadline.length >= 90 ? 'text-amber-300' : 'text-white'}`}>
                          {customSubHeadline.length}/120 {customSubHeadline.length >= 90 && <span className="animate-pulse font-normal">(75% Reached)</span>}
                        </span>
                      </div>
                      <Input 
                        value={customSubHeadline}
                        onChange={(e) => setCustomSubHeadline(e.target.value.slice(0, 120))}
                        placeholder="Enter property subtitle..."
                        maxLength={120}
                        className="text-xs sm:text-sm h-10 border-slate-200 rounded-xl"
                      />
                    </div>

                    {/* Description copywriter */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <Label className={`text-[10px] uppercase tracking-wider transition-colors duration-150 ${
                            activeHelpPopup?.title === "Property Pitch Paragraph" ? "text-white font-black" : "text-white/80 font-black"
                          }`}>Property Pitch Paragraph</Label>
                          <button
                            type="button"
                            onClick={() => setActiveHelpPopup({
                              title: "Property Pitch Paragraph",
                              content: "A short, cohesive paragraph highlighting premium materials, neighborhood facts, and architectural features. Maximum of 272 characters (use the AI Copywriter to fine tune)."
                            })}
                            className={`cursor-pointer p-0.5 transition-all duration-150 ${
                              activeHelpPopup?.title === "Property Pitch Paragraph"
                                ? "text-white scale-125"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            <HelpCircle className="h-3.5 w-3.5 transition-all" strokeWidth={activeHelpPopup?.title === "Property Pitch Paragraph" ? 3.5 : 2} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-mono font-bold ${customDescription.length >= 204 ? 'text-amber-300' : 'text-white'}`}>
                            {customDescription.length}/272 {customDescription.length >= 204 && (
                              <span className="animate-pulse font-normal">
                                ({Math.min(100, Math.round((customDescription.length / 272) * 100))}% Reached)
                              </span>
                            )}
                          </span>
                          <button
                            onClick={() => runAiGenText("description")}
                            disabled={isGeneratingAi}
                            className="text-[9px] font-extrabold text-white hover:text-slate-200 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className="h-3 w-3 text-white" />
                            AI Copywriter
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={customDescription}
                        onChange={(e) => {
                          const val = e.target.value;
                          const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
                          if (capitalized.length >= 272 && customDescription.length < 272) {
                            toast.warning("⚠️ Maximum description limit reached! We recommend using the 'AI Copywriter' to automatically refine and compress the text fit.", {
                              duration: 5000,
                              description: "Click the 'AI Copywriter' button above the textbox to make your listing description perfect."
                            });
                          }
                          setCustomDescription(capitalized.slice(0, 272));
                        }}
                        rows={3}
                        maxLength={272}
                        className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed font-sans"
                        placeholder="Detail premium components and details..."
                      />
                      {customDescription.length === 272 && (
                        <p className="text-[10px] text-amber-300 font-medium bg-amber-950/20 border border-amber-900/30 px-3 py-1.5 rounded-lg animate-pulse">
                          Maximum limit of 272 characters reached. Let our <button type="button" onClick={() => runAiGenText("description")} className="underline text-blue-400 font-bold hover:text-blue-300 cursor-pointer inline flex items-center gap-0.5">AI Copywriter</button> generate a perfect optimized version!
                        </p>
                      )}
                    </div>

                    {/* Dynamic Hero Picture selector from Listing. This handles user item 5 "Customize featured image" */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label className={`text-[10px] uppercase tracking-wider transition-colors duration-150 ${
                          activeHelpPopup?.title === "Select Featured Primary Photo" ? "text-white font-black" : "text-white/80 font-black"
                        }`}>Select Featured Primary Photo</Label>
                        <button
                          type="button"
                          onClick={() => setActiveHelpPopup({
                            title: "Select Featured Primary Photo",
                            content: "Select which listing image takes center stage. Check or uncheck thumbnails to show or hide them from the secondary room strip."
                          })}
                          className={`cursor-pointer p-0.5 transition-all duration-150 ${
                            activeHelpPopup?.title === "Select Featured Primary Photo"
                              ? "text-white scale-125"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <HelpCircle className="h-3.5 w-3.5 transition-all" strokeWidth={activeHelpPopup?.title === "Select Featured Primary Photo" ? 3.5 : 2} />
                        </button>
                      </div>
                      <p className="text-[9.5px] text-slate-200 mt-0.5">Click a thumbnail to set as primary. Uncheck a thumbnail's circle to hide it from the footer secondary strip.</p>

                      {(() => {
                        const checkedCount = listingPhotos
                          .map(p => typeof p === "string" ? p : (p as any).url)
                          .filter(u => !excludedPhotos.includes(u)).length;
                        if (checkedCount > 3) {
                          return (
                            <div className="p-3 bg-amber-500/15 border border-amber-500/40 text-amber-205 rounded-xl text-[10px] sm:text-[10.5px] leading-relaxed font-sans font-medium flex items-start gap-2 mt-2 animate-in fade-in duration-150">
                              <span className="shrink-0 mt-0.5">⚠️</span>
                              <div>
                                <p className="font-extrabold text-amber-300 uppercase tracking-wide">Photo Selection Limit Note</p>
                                <p className="text-amber-100/90">You have checked <strong>{checkedCount}</strong> photos (1 primary Thumbnail + {checkedCount - 1} additional photos). The standard template is designed to fit 1 main primary thumbnail and up to 2 additional secondary photos. Extra checked photos will be omitted on printed/PDF flyer sheets.</p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      <div className="grid grid-cols-4 gap-2 mt-1">
                        {listingPhotos.map((photo, i) => {
                          const url = typeof photo === "string" ? photo : (photo as any).url;
                          const isHero = selectedHeroImage === url;
                          const isExcluded = excludedPhotos.includes(url);
                          return (
                            <div key={url} className={`relative group/thumb rounded-xl p-1 bg-slate-800/40 border transition-all h-fit self-start ${isHero ? 'border-blue-500 bg-blue-500/5 mt-5' : 'border-slate-700 mt-5'}`}>
                              {isHero && (
                                <div className="absolute -top-4.5 left-0 right-0 text-[7px] text-blue-300 font-extrabold uppercase text-center tracking-wider truncate">
                                  ★ Header Image for Flyer
                                </div>
                              )}
                              <div className="relative rounded-lg overflow-hidden border transition-all block h-14 bg-black/20">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!selectedListing) return;
                                    setSelectedHeroImage(url);
                                    let updatedExcluded = excludedPhotos;
                                    if (excludedPhotos.includes(url)) {
                                      updatedExcluded = excludedPhotos.filter(p => p !== url);
                                      setExcludedPhotos(updatedExcluded);
                                    }
                                    const tid = toast.loading("Auto-saving primary photo...");
                                    try {
                                      await updateListing(selectedListing.id, {
                                        flyerHeroImage: url,
                                        excludedPhotos: updatedExcluded
                                      });
                                      const updatedListing = { ...selectedListing, flyerHeroImage: url, excludedPhotos: updatedExcluded };
                                      setSelectedListing(updatedListing);
                                      setListings(prev => prev.map(l => l.id === selectedListing.id ? updatedListing : l));
                                      toast.dismiss(tid);
                                      toast.success("Saved! New featured primary photo selected.");
                                    } catch (err) {
                                      toast.dismiss(tid);
                                      toast.error("Failed to auto-save primary photo selection.");
                                    }
                                  }}
                                  className="w-full h-full object-cover relative cursor-pointer focus:outline-none"
                                >
                                  <img src={url} alt={`Listing image ${i}`} className="w-full h-full object-cover" />
                                  <span className="absolute bottom-1 right-1 bg-black/70 text-white font-mono text-[8px] px-1 rounded font-bold leading-none">#{i + 1}</span>
                                </button>

                                {/* Absolute overlay movement buttons */}
                                <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-xs flex justify-around opacity-0 group-hover/thumb:opacity-100 transition-opacity py-0.5 z-20">
                                  <button
                                    type="button"
                                    title="Move Left"
                                    onClick={(e) => { e.stopPropagation(); movePhotoInFlyer(i, 'left'); }}
                                    className="text-white hover:text-blue-400 p-0.5 cursor-pointer disabled:opacity-20"
                                    disabled={i === 0}
                                  >
                                    <ArrowLeft className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Move Right"
                                    onClick={(e) => { e.stopPropagation(); movePhotoInFlyer(i, 'right'); }}
                                    className="text-white hover:text-blue-400 p-0.5 cursor-pointer disabled:opacity-20"
                                    disabled={i === listingPhotos.length - 1}
                                  >
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Move Up"
                                    onClick={(e) => { e.stopPropagation(); movePhotoInFlyer(i, 'up'); }}
                                    className="text-white hover:text-blue-400 p-0.5 cursor-pointer disabled:opacity-20"
                                    disabled={i < 4}
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Move Down"
                                    onClick={(e) => { e.stopPropagation(); movePhotoInFlyer(i, 'down'); }}
                                    className="text-white hover:text-blue-400 p-0.5 cursor-pointer disabled:opacity-20"
                                    disabled={i >= listingPhotos.length - 4}
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </button>
                                </div>

                                {/* Checkbox inclusion circle overlay */}
                                {!isHero && (
                                  <button
                                    type="button"
                                    onClick={() => togglePhotoInclusion(url)}
                                    className={`absolute top-1 left-1.5 h-4 w-4 rounded-full flex items-center justify-center border text-white font-black text-[9px] shadow-sm transition-all z-10 ${
                                      !isExcluded ? 'bg-blue-600 border-blue-500 hover:bg-blue-700' : 'bg-black/40 border-slate-350 hover:bg-black/60'
                                    }`}
                                    title={isExcluded ? "Include in secondary strip" : "Exclude from secondary strip"}
                                  >
                                    {!isExcluded ? "✓" : ""}
                                  </button>
                                )}
                                {isHero && (
                                  <div className="absolute top-1 left-1.5 bg-blue-600 border border-blue-500 text-white rounded-full p-0.5 shadow z-10" title="Primary Header (Included)">
                                    <CheckCircle className="h-2.5 w-2.5" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {listingPhotos.length === 0 && (
                          <div className="col-span-4 p-2 text-center text-[10px] text-slate-400 bg-slate-50 border border-dashed rounded-lg">
                            No secondary images. Standard hero used.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Open House scheduling details if active */}
                    {(template === "open_house_showcase" || template === "lead_form_sign_in") && (
                      <div className="p-3 bg-blue-900/30 border border-blue-800/60 rounded-xl space-y-2 animate-in fade-in">
                        <Label className="text-[10px] font-black uppercase text-white tracking-wider flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-blue-400" /> Event Schedule Timing
                        </Label>
                        <Input 
                          value={openHouseTime}
                          onChange={(e) => setOpenHouseTime(e.target.value)}
                          placeholder="e.g. Saturday, June 13th • 1PM - 4PM"
                          className="bg-white h-9 text-xs border-slate-200 rounded-lg text-black"
                        />
                      </div>
                    )}

                    {/* Badges for Just listed layouts */}
                    {template === "just_listed_sold" && (
                      <div className="p-3 bg-blue-900/30 border border-blue-800/60 rounded-xl space-y-2 animate-in fade-in">
                        <Label className="text-[10px] font-black uppercase text-white tracking-wider">Marketing Ribbon Label</Label>
                        <div className="flex gap-1 flex-wrap">
                          {["JUST LISTED", "JUST SOLD", "CONTRACT PENDING", "PRICE REDUCED"].map(text => (
                            <button
                              key={text}
                              onClick={() => setStatusBadgeText(text)}
                              className={`px-2 py-1 rounded text-[9px] font-black border transition-all ${
                                statusBadgeText === text ? "bg-amber-800 text-white border-amber-900" : "bg-blue-950/50 text-slate-200 border-blue-800 hover:text-white"
                              }`}
                            >
                              {text}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* QR Code trigger actions setup */}
                    <div className="space-y-4 pt-3 border-t">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <Label className={`text-[10px] uppercase tracking-wider transition-colors duration-150 ${
                            activeHelpPopup?.title === "Dynamic Scan Destination" ? "text-white font-black" : "text-white/80 font-black"
                          }`}>Dynamic Scan Destination</Label>
                          <button
                            type="button"
                            onClick={() => setActiveHelpPopup({
                              title: "Dynamic Scan Destination",
                              content: "The physical destination QR code scans resolve to. Changes instantly without re-printing."
                            })}
                            className={`cursor-pointer p-0.5 transition-all duration-150 ${
                              activeHelpPopup?.title === "Dynamic Scan Destination"
                                ? "text-white scale-125"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            <HelpCircle className="h-3.5 w-3.5 transition-all" strokeWidth={activeHelpPopup?.title === "Dynamic Scan Destination" ? 3.5 : 2} />
                          </button>
                        </div>
                        <select
                          value={qrDest}
                          onChange={(e) => handleQrDestChange(e.target.value as QrDestination)}
                          className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                        >
                          <option value="ai_tour">🚀 Sora AI Guided Tour (Sora Voice)</option>
                          <option value="open_house">🔑 Digital Open House Sign-In Kiosk</option>
                          <option value="lead_form">📬 Legal Consent & Asset Materials Dispatch</option>
                          <option value="details_page">🏠 Listing Microsite Details Page</option>
                          <option value="custom_url">🔗 Custom Personal Redirect Link</option>
                        </select>
                      </div>

                      {qrDest === "custom_url" && (
                        <div className="space-y-1.5 animate-in fade-in">
                          <Label className="text-xs text-white font-bold">Redirect Web Address (URL)</Label>
                          <Input
                            value={customQrUrl}
                            onChange={(e) => setCustomQrUrl(e.target.value)}
                            placeholder="https://exclusive-portfolio.com"
                            className="text-xs h-10 border-slate-200 rounded-xl text-black"
                          />
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <Label className={`text-[10px] uppercase tracking-wider transition-colors duration-150 ${
                              activeHelpPopup?.title === "QR Code Overlay Prompt" ? "text-white font-black" : "text-white/80 font-black"
                            }`}>QR Code Overlay Prompt</Label>
                            <button
                              type="button"
                              onClick={() => setActiveHelpPopup({
                                title: "QR Code Overlay Prompt",
                                content: "Prompted CTA displayed alongside the QR barcode to encourage immediate visitor phone scans."
                              })}
                              className={`cursor-pointer p-0.5 transition-all duration-150 ${
                                activeHelpPopup?.title === "QR Code Overlay Prompt"
                                  ? "text-white scale-125"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              <HelpCircle className="h-3.5 w-3.5 transition-all" strokeWidth={activeHelpPopup?.title === "QR Code Overlay Prompt" ? 3.5 : 2} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-mono font-bold ${customCta.length >= 75 ? 'text-amber-300' : 'text-white'} mr-[5px]`}>
                              {customCta.length}/100 {customCta.length >= 75 && <span className="animate-pulse font-normal">(75% Reached)</span>}
                            </span>
                            <button
                              onClick={() => runAiGenText("cta")}
                              disabled={isGeneratingAi}
                              className="text-[9px] text-white font-medium hover:font-black hover:text-white flex items-center gap-1 cursor-pointer transition-all duration-150"
                            >
                              <Sparkles className="h-3 w-3 text-white" />
                              AI CTA Generator
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveHelpPopup({
                                title: "AI CTA Generator",
                                content: "Generate high-converting conversion call-to-actions tailored dynamically to the active scan destination."
                              })}
                              className={`cursor-pointer p-0.5 transition-all duration-150 ${
                                activeHelpPopup?.title === "AI CTA Generator"
                                  ? "text-white scale-125"
                                  : "text-slate-400 hover:text-white"
                              }`}
                            >
                              <HelpCircle className="h-3 w-3 transition-all" strokeWidth={activeHelpPopup?.title === "AI CTA Generator" ? 3.5 : 2} />
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={customCta}
                          onChange={(e) => {
                            const val = e.target.value;
                            const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
                            setCustomCta(capitalized.slice(0, 100));
                          }}
                          placeholder="Scan to connect headset"
                          rows={1}
                          maxLength={100}
                          className="w-full text-xs sm:text-sm p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 h-10 focus:ring-1 focus:ring-blue-500 focus:outline-none font-sans leading-relaxed text-black font-semibold resize-none"
                        />
                      </div>
                    </div>

                    {/* Action Block for Save and Edit */}
                    <div className="flex gap-2.5 pt-4 border-t border-slate-200 flex-wrap">
                      <Button
                        type="button"
                        onClick={async () => {
                          if (!selectedListing) {
                            toast.error("Please select a listing first.");
                            return;
                          }
                          const tid = toast.loading("Saving custom flyer content to database...");
                          try {
                            await updateListing(selectedListing.id, {
                              flyerHeroImage: selectedHeroImage,
                              excludedPhotos: excludedPhotos,
                              flyerHeadline: customHeadline,
                              flyerSubHeadline: customSubHeadline,
                              flyerDescription: customDescription,
                              flyerCta: customCta,
                              flyerTemplate: template
                            });
                            // Sync changes locally in the state too
                            setListings(prev => prev.map(l => l.id === selectedListing.id ? {
                              ...l,
                              flyerHeroImage: selectedHeroImage,
                              excludedPhotos: excludedPhotos,
                              flyerHeadline: customHeadline,
                              flyerSubHeadline: customSubHeadline,
                              flyerDescription: customDescription,
                              flyerCta: customCta,
                              flyerTemplate: template
                            } : l));
                            toast.dismiss(tid);
                            toast.success("✨ Flyer Content Draft saved and locked successfully to Firestore Database! live preview refreshed.");
                          } catch (err) {
                            toast.dismiss(tid);
                            console.error(err);
                            toast.error("Failed to save flyer settings.");
                          }
                        }}
                        className="flex-1 bg-white text-[#155dfc] font-extrabold uppercase text-[10px] tracking-wider h-10 rounded-xl hover:bg-amber-400 hover:text-slate-950 hover:scale-108 active:scale-95 transition-all duration-300 transform shadow-md hover:shadow-xl cursor-pointer border-none"
                      >
                        Save Content
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          toast.info("💡 Easy editing unlocked. Direct inputs below are active.");
                        }}
                        className="flex-1 border-white/45 text-white bg-[#155dfc]/10 font-extrabold uppercase text-[10px] tracking-wider h-10 rounded-xl hover:bg-white hover:text-[#155dfc] hover:scale-108 active:scale-95 transition-all duration-300 transform shadow-md hover:shadow-xl cursor-pointer"
                      >
                        Edit Layout
                      </Button>
                    </div>
                  </>
                ) : activeTab === "settings" ? (
                  <>
                    {/* Design preset selection */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-white tracking-wider">Select Premium Layout Template</Label>
                      <div className="grid grid-cols-1 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                        {[
                          { id: "luxury_royal", name: "Crown Luxury Royal", desc: "Serif headers, tailored classic borders, sophisticated spacing" },
                          { id: "modern_minimalist", name: "Sleek Modern Minimalist", desc: "Monospaced spec tags, wide borders, pristine white gutters" },
                          { id: "open_house_showcase", name: "Showcase Open House Kiosk", desc: "Highlighted event scheduling details & check-in badges" },
                          { id: "scan_to_tour_ai", name: "Sora Audio-Guided Promo", desc: "Focuses on headset pairing, voice tour, waveform elements" },
                          { id: "brokerage_branded", name: "Brokerage Fine Portfolio", desc: "Prominent brokerage branding banner, corporate alignment" },
                          { id: "lead_form_sign_in", name: "Lead Sign-In Signage", desc: "Large QR box specifically built for tablet entryways" },
                          { id: "just_listed_sold", name: "Market Status Spotlights", desc: "Showcases JUST LISTED / JUST SOLD ribbon bands" }
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleTemplateChange(t.id as FlyerTemplate)}
                            className={`p-3 text-left rounded-xl flex flex-col justify-center transition-all cursor-pointer ${
                              template === t.id 
                                ? "border-4 border-white bg-white/15 font-black shadow-lg" 
                                : "border-2 border-white/40 bg-white/5 hover:bg-white/10 hover:border-white/60"
                            }`}
                          >
                            <span className="text-white font-black text-xs">{t.name}</span>
                            <span className="text-[9.5px] text-slate-300 leading-tight mt-0.5">{t.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Accent colors */}
                    <div className="space-y-2 pt-3 border-t border-blue-900">
                      <Label className="text-[10px] font-black uppercase text-white tracking-wider">Branding Accent Color</Label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {Object.entries(colorClasses).map(([colorKey, data]) => (
                          <button
                            key={colorKey}
                            onClick={() => setAccentColor(colorKey as AccentColor)}
                            className={`h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                              accentColor === colorKey ? "border-amber-400 bg-white/20 shadow-inner" : "border-white/15 hover:bg-white/5"
                            }`}
                            title={data.name}
                          >
                            <span className={`h-4.5 w-4.5 rounded-full ${data.preview} shadow-sm border border-white`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Page orientation toggles */}
                    <div className="space-y-2 pt-3 border-t border-blue-900">
                      <Label className="text-[10px] font-black uppercase text-white tracking-wider">Flyer Aspect Ratio Format</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setOrientation("portrait")}
                          className={`py-2 text-xs font-bold border rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            orientation === "portrait" ? "bg-amber-500 border-amber-600 text-slate-950 font-extrabold shadow-sm animate-pulse-subtle" : "bg-blue-950/40 border-blue-800 text-slate-200 hover:text-white"
                          }`}
                        >
                          <Layout className="h-3.5 w-3.5" />
                          Portrait (8.5" x 11")
                        </button>
                        <button
                          onClick={() => setOrientation("square")}
                          className={`py-2 text-xs font-bold border rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            orientation === "square" ? "bg-amber-500 border-amber-600 text-slate-950 font-extrabold shadow-sm animate-pulse-subtle" : "bg-blue-950/40 border-blue-800 text-slate-200 hover:text-white"
                          }`}
                        >
                          <Instagram className="h-3.5 w-3.5" />
                          Square (1:1 Social)
                        </button>
                      </div>
                    </div>

                    {/* Agent overridden contact values */}
                    <div className="space-y-2.5 pt-3 border-t border-blue-900">
                      <Label className="text-[10px] font-black uppercase text-white tracking-wider">Agent Contact Overrides</Label>
                      <div className="space-y-1.5 text-left">
                        <div>
                          <Label className="text-[9px] text-white mb-0.5 block font-bold">First & Last Name (Auto-Capitalized)</Label>
                          <Input 
                            value={agentNameOverride} 
                            onChange={(e) => handleNameChange(e.target.value)} 
                            placeholder="Agent Name" 
                            className="h-8 text-xs bg-white text-slate-950 font-semibold"
                          />
                        </div>
                        <div>
                          <Label className="text-[9px] text-white mb-0.5 block font-bold">Phone Number (Strict format: (###) ###-####)</Label>
                          <Input 
                            value={agentPhoneOverride} 
                            onChange={(e) => handlePhoneChange(e.target.value)} 
                            placeholder="(###) ###-####" 
                            className="h-8 text-xs font-mono bg-white text-slate-950 font-semibold"
                          />
                          {!isPhoneValid(agentPhoneOverride) && agentPhoneOverride.trim() !== "" && (
                            <p className="text-[10px] text-amber-300 font-extrabold mt-0.5 animate-pulse">⚠️ Phone must be exactly (###) ###-####</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-[9px] text-white mb-0.5 block font-bold">Email Address (Requires @ & domain)</Label>
                          <Input 
                            value={agentEmailOverride} 
                            onChange={(e) => setAgentEmailOverride(e.target.value)} 
                            placeholder="Broker Email" 
                            className="h-8 text-xs font-mono bg-white text-slate-950 font-semibold"
                          />
                          {!isEmailValid(agentEmailOverride) && agentEmailOverride.trim() !== "" && (
                            <p className="text-[10px] text-amber-300 font-extrabold mt-0.5 animate-pulse">⚠️ Requires valid email address containing '@'</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Advanced toggle buttons */}
                    <div className="space-y-2 pt-3 border-t border-blue-900">
                      <Label className="text-[10px] font-black uppercase text-white tracking-wider">Structural Blocks</Label>
                      
                      <label className="flex items-center gap-3 p-2.5 bg-blue-900/30 border border-blue-800/60 rounded-xl cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showSecondaryPhotos}
                          onChange={(e) => setShowSecondaryPhotos(e.target.checked)}
                          className="h-4 w-4 rounded border-blue-800 text-blue-600 bg-blue-950"
                        />
                        <div className="text-xs text-left">
                          <p className="font-extrabold text-white">Show Room Strip</p>
                          <p className="text-[9.5px] text-slate-200">Display mini ambient picture row at footer.</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-2.5 bg-blue-900/30 border border-blue-800/60 rounded-xl cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={includeLenderBlock}
                          onChange={(e) => setIncludeLenderBlock(e.target.checked)}
                          className="h-4 w-4 rounded border-blue-800 text-blue-600 bg-blue-950"
                        />
                        <div className="text-xs text-left">
                          <p className="font-extrabold text-white">Include preferred lender block</p>
                          <p className="text-[9.5px] text-slate-200">Add compliant rate support options.</p>
                        </div>
                      </label>
                    </div>

                    {includeLenderBlock && (
                      <div className="p-3 bg-blue-900/40 border border-blue-800/60 rounded-xl space-y-2.5 animate-in fade-in text-left">
                        <div className="flex items-center justify-between text-white font-black text-xs">
                          <div className="flex items-center gap-1">
                            <BadgePercent className="h-4 w-4 text-amber-400" />
                            <span>Lender Co-Op Integration</span>
                          </div>
                          <span className={`text-[9px] font-mono font-bold ${lenderCta.length >= 12 ? 'text-amber-300' : 'text-white'} mr-[3px]`}>
                            {lenderCta.length}/16 {lenderCta.length >= 12 && <span className="animate-pulse font-normal">(75% Reached)</span>}
                          </span>
                        </div>
                        <Input 
                          value={lenderName} 
                          onChange={(e) => setLenderName(e.target.value)} 
                          placeholder="Name of lender entity" 
                          className="bg-white h-8 text-[11px] text-black font-semibold" 
                        />
                        <Input 
                          value={lenderCta} 
                          onChange={(e) => setLenderCta(e.target.value.slice(0, 16))} 
                          placeholder="Get Pre-approved" 
                          maxLength={16}
                          className="bg-white h-8 text-[11px] text-black font-semibold" 
                        />
                      </div>
                    )}

                     {/* Action Block for Save and Edit */}
                    <div className="flex gap-2.5 pt-4 border-t border-slate-200 flex-wrap animate-in fade-in">
                      <Button
                        type="button"
                        onClick={() => {
                          toast.success("🎨 Aesthetics presets, theme color and layout orientation saved successfully!");
                        }}
                        disabled={!isSaveAestheticsEnabled}
                        className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-80/50 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold uppercase text-[10px] tracking-wider h-10 rounded-xl"
                      >
                        Save Aesthetics
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          toast.info("🛠️ Custom aesthetics override unlocked.");
                        }}
                        className="flex-1 border-white/15 text-white hover:bg-white/10 font-extrabold uppercase text-[10px] tracking-wider h-10 rounded-xl bg-transparent"
                      >
                        Edit Style
                      </Button>
                    </div>
                  </>
                ) : activeTab === "typography" ? (
                  <div className="space-y-4 animate-in fade-in">
                    {/* Primary Title Typography Card */}
                    <div className="p-3.5 bg-blue-900/30 border border-blue-800/60 rounded-xl space-y-3 text-left">
                      <div className="flex justify-between items-center pb-1.5 border-b border-blue-800/50">
                        <span className="text-[10px] font-black uppercase text-white tracking-wider">Title Typography</span>
                        <Type className="h-3.5 w-3.5 text-blue-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-white uppercase">Font Category</label>
                          <select
                            value={titleFont}
                            onChange={(e) => setTitleFont(e.target.value as any)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-black shadow-sm"
                          >
                            <option value="grotesque">Geometric Grotesque</option>
                            <option value="geometric">Geometric Sans-Serif</option>
                            <option value="humanist">Humanist Sans-Serif</option>
                            <option value="serif">Display Serif</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-white uppercase">Size Scale</label>
                          <select
                            value={titleSize}
                            onChange={(e) => setTitleSize(e.target.value as any)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-black shadow-sm"
                          >
                            <option value="xs">Extra Small (18px)</option>
                            <option value="sm">Small (21px)</option>
                            <option value="md">Medium (24px)</option>
                            <option value="lg">Large (29px)</option>
                            <option value="xl">Extra Large (34px)</option>
                          </select>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={titleBold}
                          onChange={(e) => setTitleBold(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-blue-800 text-blue-600 focus:ring-0 bg-blue-950"
                        />
                        <span className="text-[10px] font-bold text-white uppercase">Bold emphasis</span>
                      </label>
                    </div>

                    {/* Marketing Subtitle Typography Card */}
                    <div className="p-3.5 bg-blue-900/30 border border-blue-800/60 rounded-xl space-y-3 text-left">
                      <div className="flex justify-between items-center pb-1.5 border-b border-blue-800/50">
                        <span className="text-[10px] font-black uppercase text-white tracking-wider">Subtitle Typography</span>
                        <Heading className="h-3.5 w-3.5 text-blue-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-white uppercase">Font Category</label>
                          <select
                            value={subtitleFont}
                            onChange={(e) => setSubtitleFont(e.target.value as any)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-black shadow-sm"
                          >
                            <option value="grotesque">Geometric Grotesque</option>
                            <option value="geometric">Geometric Sans-Serif</option>
                            <option value="humanist">Humanist Sans-Serif</option>
                            <option value="serif">Display Serif</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-white uppercase">Size Scale</label>
                          <select
                            value={subtitleSize}
                            onChange={(e) => setSubtitleSize(e.target.value as any)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-black shadow-sm"
                          >
                            <option value="xs">Extra Small</option>
                            <option value="sm">Small</option>
                            <option value="md">Medium</option>
                            <option value="lg">Large</option>
                          </select>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={subtitleBold}
                          onChange={(e) => setSubtitleBold(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-blue-800 text-blue-600 focus:ring-0 bg-blue-950"
                        />
                        <span className="text-[10px] font-bold text-white uppercase">Bold emphasis</span>
                      </label>
                    </div>

                    {/* Description Paragraph Typography Card */}
                    <div className="p-3.5 bg-blue-900/30 border border-blue-800/60 rounded-xl space-y-3 text-left">
                      <div className="flex justify-between items-center pb-1.5 border-b border-blue-800/50">
                        <span className="text-[10px] font-black uppercase text-white tracking-wider">Body Description Typography</span>
                        <AlignLeft className="h-3.5 w-3.5 text-blue-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-white uppercase">Font Category</label>
                          <select
                            value={descriptionFont}
                            onChange={(e) => setDescriptionFont(e.target.value as any)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-black shadow-sm"
                          >
                            <option value="grotesque">Geometric Grotesque</option>
                            <option value="geometric">Geometric Sans-Serif</option>
                            <option value="humanist">Humanist Sans-Serif</option>
                            <option value="serif">Display Serif</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-white uppercase">Size Scale</label>
                          <select
                            value={descriptionSize}
                            onChange={(e) => setDescriptionSize(e.target.value as any)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-black shadow-sm"
                          >
                            <option value="xs">Extra Small</option>
                            <option value="sm">Small</option>
                            <option value="md">Medium</option>
                            <option value="lg">Large</option>
                          </select>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={descriptionBold}
                          onChange={(e) => setDescriptionBold(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-blue-800 text-blue-600 focus:ring-0 bg-blue-950"
                        />
                        <span className="text-[10px] font-bold text-white uppercase">Bold emphasis</span>
                      </label>
                    </div>

                    {/* QR Code Action CTA Typography Card */}
                    <div className="p-3.5 bg-blue-900/30 border border-blue-800/60 rounded-xl space-y-3 text-left">
                      <div className="flex justify-between items-center pb-1.5 border-b border-blue-800/50">
                        <span className="text-[10px] font-black uppercase text-white tracking-wider">QR CTA Prompt Typography</span>
                        <QrCode className="h-3.5 w-3.5 text-blue-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-white uppercase">Font Category</label>
                          <select
                            value={ctaFont}
                            onChange={(e) => setCtaFont(e.target.value as any)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-black shadow-sm"
                          >
                            <option value="grotesque">Geometric Grotesque</option>
                            <option value="geometric">Geometric Sans-Serif</option>
                            <option value="humanist">Humanist Sans-Serif</option>
                            <option value="serif">Display Serif</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-white uppercase">Size Scale</label>
                          <select
                            value={ctaSize}
                            onChange={(e) => setCtaSize(e.target.value as any)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-black shadow-sm"
                          >
                            <option value="xs">Extra Small</option>
                            <option value="sm">Small</option>
                            <option value="md">Medium</option>
                            <option value="lg">Large</option>
                          </select>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={ctaBold}
                          onChange={(e) => setCtaBold(e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-blue-800 text-blue-600 focus:ring-0 bg-blue-950"
                        />
                        <span className="text-[10px] font-bold text-white uppercase">Bold emphasis</span>
                      </label>
                    </div>

                    <div className="text-[10px] text-slate-200 bg-blue-950/40 border border-blue-900/60 p-2.5 rounded-xl font-normal text-left sm:text-center italic leading-normal">
                      💡 Tip: Standardize on 2 font categories for optimal brand composition matching compliance and exclusive presentation.
                    </div>

                    {/* Action Block for Save and Edit */}
                    <div className="flex gap-2.5 pt-4 border-t border-slate-200 flex-wrap animate-in fade-in">
                      <Button
                        type="button"
                        onClick={() => {
                          toast.success("✍️ Typography scales, bold values, and pairings saved successfully!");
                        }}
                        className="flex-1 bg-white text-[#155dfc] font-extrabold uppercase text-[10px] tracking-wider h-10 rounded-xl hover:bg-slate-50"
                      >
                        Save Typography
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          toast.info("🔡 Typography modifications enabled. Fine-tune your parameters below.");
                        }}
                        className="flex-1 border-slate-200 text-slate-800 hover:bg-slate-50 font-extrabold uppercase text-[10px] tracking-wider h-10 rounded-xl"
                      >
                        Edit Fonts
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in max-w-sm mx-auto text-center text-white pb-3">
                    <p className="text-xs font-black uppercase tracking-wider text-blue-200">Dynamic QR Display Manager</p>
                    <p className="text-[10px] text-slate-200 leading-normal">
                      Exhibition guests scan this code to access check-in sheets or launch the guided tour.
                    </p>

                    <div className="bg-white p-4 rounded-2xl border border-blue-900/40 shadow-md relative flex items-center justify-center mx-auto w-[210px] h-[210px]">
                      <QRCodeSVG 
                        id="flyer-dynamic-qr-preview-svg"
                        value={getQrUrl()} 
                        size={180} 
                        level="H"
                        fgColor="#0f172a"
                        imageSettings={
                          (qrBrandingOption === "logo" && brokerageLogo) || (qrBrandingOption === "photo" && agentPhoto) ? {
                            src: qrBrandingOption === "logo" ? brokerageLogo : agentPhoto,
                            x: undefined,
                            y: undefined,
                            height: 48,
                            width: 48,
                            excavate: true,
                          } : undefined
                        }
                      />
                    </div>

                    <div className="text-xs text-slate-100 text-left w-full space-y-2 pt-2 bg-blue-950/45 p-4 rounded-xl border border-blue-800/60 font-sans">
                      <p className="font-bold uppercase tracking-wider text-[9px] text-blue-300">QR Scan Destination</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-[10px] text-blue-200 truncate bg-blue-950 p-1.5 rounded border border-blue-900 flex-1 select-all">
                          {getQrUrl()}
                        </p>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-[10px] h-7 px-2.5 font-bold hover:bg-white hover:text-blue-900 text-slate-800 bg-white"
                          onClick={() => {
                            navigator.clipboard.writeText(getQrUrl());
                            toast.success("URL copied to clipboard!");
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                      <p className="text-[9.5px] text-slate-300 leading-normal">
                        Perfect to print on luxury tabletop stands, giving buyers a touchless check-in process instantly.
                      </p>
                    </div>

                    {/* Brokerage Logo or Agent Photo Embedding Manager */}
                    <div className="w-full text-left space-y-3 pt-3 border-t border-blue-800/50">
                      <p className="font-extrabold uppercase tracking-wider text-[10px] text-blue-300 block">Brokerage Logo or Agent Photo</p>
                      
                      <div className="space-y-2.5">
                        {/* Radio Button 1: Brokerage Logo */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-blue-800/60 bg-blue-950/40 hover:bg-blue-950/70 transition-colors">
                          <label htmlFor="branding-logo-flyer" className="flex items-center gap-2.5 cursor-pointer w-full select-none">
                            <input 
                              type="radio" 
                              id="branding-logo-flyer" 
                              name="qr-branding-flyer" 
                              value="logo"
                              checked={qrBrandingOption === "logo"}
                              onChange={() => {
                                if (!brokerageLogo) {
                                  toast.error("A Brokerage Logo is required under Settings > Branding & UI to select this option.");
                                  return;
                                }
                                setQrBrandingOption("logo");
                                toast.success("Brokerage Logo selected for dynamic QR presentation!");
                              }}
                              className="h-4 w-4 text-blue-400 border-blue-800 focus:ring-0 cursor-pointer"
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white">Brokerage Logo</span>
                              <span className="text-[10px] text-slate-300 leading-tight">Integrate company agency brand specs</span>
                            </div>
                          </label>
                          {brokerageLogo ? (
                            <img src={brokerageLogo} alt="Brokerage Logo" className="h-[35px] w-auto max-w-[75px] object-contain rounded border border-blue-800/60 bg-white p-0.5" />
                          ) : (
                            <span className="text-[10px] text-slate-400 italic bg-blue-950 px-2 py-0.5 rounded font-mono border border-blue-900">Not Configured</span>
                          )}
                        </div>

                        {/* Radio Button 2: Agent Photo */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-blue-800/60 bg-blue-950/40 hover:bg-blue-950/70 transition-colors">
                          <label htmlFor="branding-photo-flyer" className="flex items-center gap-2.5 cursor-pointer w-full select-none">
                            <input 
                              type="radio" 
                              id="branding-photo-flyer" 
                              name="qr-branding-flyer" 
                              value="photo"
                              checked={qrBrandingOption === "photo"}
                              onChange={() => {
                                if (!agentPhoto) {
                                  toast.error("An Agent Photo is required under Settings > Branding & UI to select this option.");
                                  return;
                                }
                                setQrBrandingOption("photo");
                                toast.success("Agent Photo selected for dynamic QR presentation!");
                              }}
                              className="h-4 w-4 text-blue-400 border-blue-800 focus:ring-0 cursor-pointer"
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white">Agent Photo</span>
                              <span className="text-[10px] text-slate-300 leading-tight">Promote host identity visually on scan gates</span>
                            </div>
                          </label>
                          {agentPhoto ? (
                            <img src={agentPhoto} alt="Agent Portrait" className="h-[35px] w-[35px] object-cover rounded-full border border-blue-800/60 bg-white" />
                          ) : (
                            <span className="text-[10px] text-slate-400 italic bg-blue-950 px-2 py-0.5 rounded font-mono border border-blue-900">Not Configured</span>
                          )}
                        </div>

                        {/* Radio Button 3: None */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-blue-800/60 bg-blue-950/40 hover:bg-blue-950/70 transition-colors">
                          <label htmlFor="branding-none-flyer" className="flex items-center gap-2.5 cursor-pointer w-full select-none">
                            <input 
                              type="radio" 
                              id="branding-none-flyer" 
                              name="qr-branding-flyer" 
                              value="none"
                              checked={qrBrandingOption === "none"}
                              onChange={() => {
                                setQrBrandingOption("none");
                                toast.success("No image overlay chosen. Standard clean barcode presentation restored.");
                              }}
                              className="h-4 w-4 text-blue-400 border-blue-800 focus:ring-0 cursor-pointer"
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white">Standard (No Overlay)</span>
                              <span className="text-[10px] text-slate-300 leading-tight">Fast-scanning high contrast layout</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Visual Previews Column */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* View switcher matching items (Print preview, Mobile stories, QR check details) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setPreviewMode("print")}
                  className={`flex-1 sm:flex-none px-4 py-2 font-black rounded-lg text-xs tracking-tight transition-all flex items-center justify-center gap-1.5 ${
                    previewMode === "print" ? "bg-[#155dfc] text-white shadow-sm" : "text-slate-600 hover:text-[#155dfc] hover:bg-slate-200/50"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Print Mockup
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`flex-1 sm:flex-none px-4 py-2 font-black rounded-lg text-xs tracking-tight transition-all flex items-center justify-center gap-1.5 ${
                    previewMode === "mobile" ? "bg-[#155dfc] text-white shadow-sm" : "text-slate-600 hover:text-[#155dfc] hover:bg-slate-200/50"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Instagram Stories View
                </button>
                <button
                  onClick={() => setPreviewMode("qr_test")}
                  className={`flex-1 sm:flex-none px-4 py-2 font-black rounded-lg text-xs tracking-tight transition-all flex items-center justify-center gap-1.5 ${
                    previewMode === "qr_test" ? "bg-[#155dfc] text-white shadow-sm" : "text-slate-600 hover:text-[#155dfc] hover:bg-slate-200/50"
                  }`}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  QR Scan Grounding
                </button>
              </div>

              <div className="text-[10px] text-zinc-400 font-mono mt-1 sm:mt-0">
                Format: <strong className="text-zinc-600 font-bold uppercase">{orientation} Aspect</strong>
              </div>
            </div>

            {/* Print Mockup Renderer */}
            {previewMode === "print" && (
              <div className="mx-auto max-w-[calc(100%-15px)] lg:max-w-none lg:mx-0 w-full bg-slate-700/5 p-4 sm:p-8 rounded-2xl border border-slate-200/80 flex justify-center items-center shadow-inner overflow-auto h-[610px]">
                <div 
                  id="flyer-printable-canvas"
                  style={{
                    width: "430px",
                    height: orientation === "portrait" ? "555px" : "430px"
                  }}
                  className={`bg-white text-slate-950 flex flex-col justify-between shadow-2xl relative select-none rounded border border-slate-300 pointer-events-none transition-all duration-300 text-left ${
                    includeLenderBlock && orientation === "portrait" ? "p-4.5" : "p-6"
                  } ${
                    template === "luxury_royal" ? "font-serif" : "font-sans"
                  }`}
                >
                  {/* Top line banner */}
                  <div className={`flex items-center justify-between border-b border-slate-100 ${includeLenderBlock && orientation === "portrait" ? "pb-1.5" : "pb-2"}`}>
                    <div className="flex items-center gap-2">
                      <div className={`h-6 w-6 rounded flex items-center justify-center text-white text-[9px] font-black tracking-widest ${activeColor.bg}`}>
                        VA
                      </div>
                      <div>
                        <p className="text-[8px] font-black tracking-wider text-slate-950">AI OPEN HOUSE CONNECT</p>
                        <p className="text-[6.5px] text-slate-400 font-mono leading-none">DIGITAL COMPANION</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-900 leading-none">
                        {brokerageNameOverride || legalName || "PINNACLE REAL ESTATE GROUP"}
                      </p>
                      <p className="text-[6.5px] text-slate-400 leading-none mt-0.5">EXCLUSIVE SYNDICATE</p>
                    </div>
                  </div>

                  {/* Title & Address */}
                  <div className={`space-y-0.5 text-center relative ${includeLenderBlock && orientation === "portrait" ? "pt-1.5" : "pt-2"}`}>
                    {/* Status badges for Just Listed Template */}
                    {template === "just_listed_sold" && (
                      <span className="absolute -top-1 left-1 px-2 py-0.5 text-[6.5px] font-black tracking-wider text-white rounded bg-slate-950 font-sans shadow">
                        {statusBadgeText}
                      </span>
                    )}

                    <h2 
                      style={{
                        fontFamily: getFontFamily(titleFont),
                        fontSize: getTitleFontSize(titleSize, true),
                        fontWeight: titleBold ? '900' : '500',
                      }}
                      className={`tracking-tight leading-tight uppercase max-h-[2.4em] overflow-hidden ${activeColor.text}`}
                    >
                      {customHeadline}
                    </h2>
                    <p className="text-[8.5px] text-slate-400 font-medium font-mono uppercase mt-0.5 flex items-center justify-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5 text-slate-400 inline" />
                      {selectedListing.address}, {selectedListing.city}
                    </p>
                  </div>

                  {/* Hero primary image selection */}
                  <div 
                    style={{
                      width: "100%",
                      height: includeLenderBlock && orientation === "portrait" ? "94px" : "112px",
                      overflow: "hidden"
                    }}
                    className="relative rounded border border-slate-100 bg-white flex items-center justify-center preview-rotating-border"
                  >
                    {(() => {
                      const hasListingImages = selectedListing?.images && selectedListing.images.length > 0;
                      const hasAgentPhoto = agentPhoto && agentPhoto.trim() !== "" && !agentPhoto.includes("placeholder");
                      let resolvedSrc = "";

                      if (selectedHeroImage && !selectedHeroImage.includes("placeholder") && !selectedHeroImage.includes("via.placeholder")) {
                        resolvedSrc = selectedHeroImage;
                      } else if (hasListingImages) {
                        const firstImage = selectedListing.images[0];
                        const s = typeof firstImage === "string" ? firstImage : (firstImage as any).url;
                        if (s && !s.includes("placeholder") && !s.includes("via.placeholder")) {
                          resolvedSrc = s;
                        }
                      }

                      if (!resolvedSrc && hasAgentPhoto) {
                        resolvedSrc = agentPhoto;
                      }

                      if (!resolvedSrc || resolvedSrc.includes("placeholder") || resolvedSrc.includes("via.placeholder")) {
                        resolvedSrc = fallbackImg;
                      }

                      return (
                        <img 
                          src={resolvedSrc} 
                          alt="Primary Feature" 
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          className="w-full h-full object-cover" 
                        />
                      );
                    })()}
                    
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-[9px] font-bold leading-none" style={{ fontFamily: 'Arial, sans-serif' }}>
                      ${(selectedListing.price || 5000000).toLocaleString()}
                    </div>

                    {/* Simulated Voice wave UI overlay for AI Tour Promotion templates */}
                    {template === "scan_to_tour_ai" && (
                      <div className="absolute bottom-2 left-2 right-2 bg-blue-900/80 backdrop-blur-sm rounded p-1.5 flex items-center gap-2 border border-blue-600/30 text-white animate-pulse">
                        <Volume2 className="h-3 w-3 text-blue-300" />
                        <div className="flex-1">
                          <p className="text-[6.5px] font-bold">LIVE AUDIO WALKTHROUGH READY</p>
                          <div className="flex gap-0.5 h-1.5 items-center mt-0.5">
                            <span className="bg-white/80 w-0.5 h-1" />
                            <span className="bg-white/80 w-0.5 h-2.5" />
                            <span className="bg-white/80 w-0.5 h-1.5" />
                            <span className="bg-white/80 w-0.5 h-2" />
                            <span className="bg-white/80 w-0.5 h-1" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Core stats monospaced bar */}
                  <div className={`grid grid-cols-4 gap-2 bg-slate-50 rounded text-center text-[8px] border border-slate-100 ${
                    includeLenderBlock && orientation === "portrait" ? "p-1 mt-1.5" : "p-1.5 mt-2"
                  }`} style={{ fontFamily: 'Arial, sans-serif' }}>
                    <div className="border-r border-slate-200" style={{ fontFamily: 'Arial, sans-serif' }}>
                      <p className="text-[6.5px] text-slate-400 font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>Beds</p>
                      <p className="font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'Arial, sans-serif' }}>{selectedListing.beds || 5}</p>
                    </div>
                    <div className="border-r border-slate-200" style={{ fontFamily: 'Arial, sans-serif' }}>
                      <p className="text-[6.5px] text-slate-400 font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>Baths</p>
                      <p className="font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'Arial, sans-serif' }}>{selectedListing.baths || 6}</p>
                    </div>
                    <div className="border-r border-slate-200" style={{ fontFamily: 'Arial, sans-serif' }}>
                      <p className="text-[6.5px] text-slate-400 font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>Sq Ft</p>
                      <p className="font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'Arial, sans-serif' }}>{(selectedListing.sqft || 4300).toLocaleString()}</p>
                    </div>
                    <div style={{ fontFamily: 'Arial, sans-serif' }}>
                      <p className="text-[6.5px] text-slate-400 font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>Est. Rate</p>
                      <p className="font-extrabold text-emerald-600 leading-tight" style={{ fontFamily: 'Arial, sans-serif' }}>4.92% APR</p>
                    </div>
                  </div>

                  {/* Descriptive text columns & QR */}
                  <div className={`grid grid-cols-12 gap-3 items-center ${
                    includeLenderBlock && orientation === "portrait" ? "mt-1.5" : "mt-2"
                  }`}>
                    <div className="col-span-8 space-y-1 text-left">
                      {customSubHeadline && (
                        <strong 
                          style={{
                            fontFamily: getFontFamily(subtitleFont),
                            fontSize: getSubtitleFontSize(subtitleSize, true),
                            fontWeight: subtitleBold ? '900' : '400',
                          }}
                          className="text-slate-800 block mb-0.5 leading-snug"
                        >
                          {customSubHeadline}
                        </strong>
                      )}
                      <p 
                        style={{
                          fontFamily: getFontFamily(descriptionFont),
                          fontSize: getDescriptionFontSize(descriptionSize, true),
                          fontWeight: descriptionBold ? '700' : '400',
                        }}
                        className="text-slate-600 leading-snug line-clamp-4 overflow-hidden"
                      >
                        {customDescription}
                      </p>

                      {/* Scheduling clocks overlay for Event Kiosks */}
                      {(template === "open_house_showcase" || template === "lead_form_sign_in") && (
                        <div className="p-1 px-2 border border-slate-200 rounded text-[7px] bg-slate-50/50 flex items-center gap-1 text-slate-700">
                          <span className="inline-block h-1.5 w-1.5 bg-blue-500 rounded-full animate-ping" />
                          <span>Event Time: <strong className="font-semibold text-slate-950">{openHouseTime}</strong></span>
                        </div>
                      )}

                      {showSecondaryPhotos && orientation === "portrait" && (
                        <div className={`flex gap-1.5 ${includeLenderBlock ? "mt-1" : "mt-1.5"}`}>
                          <div 
                            style={{
                              width: "50%",
                              height: includeLenderBlock ? "30px" : "36px",
                              overflow: "hidden"
                            }}
                            className="rounded border border-slate-100 bg-white flex items-center justify-center"
                          >
                            {(() => {
                              const hasAgentPhoto = agentPhoto && agentPhoto.trim() !== "" && !agentPhoto.includes("placeholder");
                              let srcVal = "";
                              if (filteredSecondaryPhotos && filteredSecondaryPhotos[0] && !filteredSecondaryPhotos[0].includes("placeholder") && !filteredSecondaryPhotos[0].includes("via.placeholder")) {
                                srcVal = filteredSecondaryPhotos[0];
                              } else if (hasAgentPhoto) {
                                srcVal = agentPhoto;
                              }

                              if (!srcVal || srcVal.includes("placeholder") || srcVal.includes("via.placeholder")) {
                                srcVal = "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600";
                              }

                              return (
                                <img 
                                  src={srcVal} 
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  className="w-full h-full object-cover" 
                                  alt="Secondary Feature 1" 
                                />
                              );
                            })()}
                          </div>
                          
                          <div 
                            style={{
                              width: "50%",
                              height: includeLenderBlock ? "30px" : "36px",
                              overflow: "hidden"
                            }}
                            className="rounded border border-slate-100 bg-white flex items-center justify-center"
                          >
                            {(() => {
                              const hasAgentPhoto = agentPhoto && agentPhoto.trim() !== "" && !agentPhoto.includes("placeholder");
                              let srcVal = "";
                              if (filteredSecondaryPhotos && filteredSecondaryPhotos[1] && !filteredSecondaryPhotos[1].includes("placeholder") && !filteredSecondaryPhotos[1].includes("via.placeholder")) {
                                srcVal = filteredSecondaryPhotos[1];
                              } else if (hasAgentPhoto) {
                                srcVal = agentPhoto;
                              }

                              if (!srcVal || srcVal.includes("placeholder") || srcVal.includes("via.placeholder")) {
                                srcVal = "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=600";
                              }

                              return (
                                <img 
                                  src={srcVal} 
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  className="w-full h-full object-cover" 
                                  alt="Secondary Feature 2" 
                                />
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* QR Code */}
                    <div className="col-span-4 p-2 bg-slate-50 border rounded-lg flex flex-col items-center justify-center text-center space-y-1">
                      <div className="bg-white p-0.5 rounded border">
                        <QRCodeSVG 
                          id="active-qr-svg"
                          value={getQrUrl()} 
                          size={52}
                          level="H"
                          imageSettings={
                            (qrBrandingOption === "logo" && brokerageLogo) || (qrBrandingOption === "photo" && agentPhoto) ? {
                              src: qrBrandingOption === "logo" ? brokerageLogo : agentPhoto,
                              x: undefined,
                              y: undefined,
                              height: 14,
                              width: 14,
                              excavate: true,
                            } : undefined
                          }
                        />
                      </div>
                      <p 
                        style={{
                          fontFamily: getFontFamily(ctaFont),
                          fontSize: getCtaFontSize(ctaSize, true),
                          fontWeight: ctaBold ? '900' : '500',
                        }}
                        className="text-slate-950 leading-none uppercase tracking-tight max-w-[65px]"
                      >
                        {qrDest === "ai_tour" ? "Scan to tour" : "Scan to register"}
                      </p>
                    </div>
                  </div>

                  {/* Agent Sign & Regulatory Disclaimer */}
                  <div className={`border-t border-slate-100 flex items-center justify-between ${
                    includeLenderBlock && orientation === "portrait" ? "mt-1 pt-1.5" : "mt-2 pt-2"
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <div className="h-6 w-6 bg-slate-100 text-slate-700 border rounded flex items-center justify-center">
                        <User className="h-3 w-3 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-[7.5px] font-black text-slate-950 leading-tight">
                          {agentNameOverride || "Advisory Agent"}
                        </p>
                        <p className="text-[6.5px] text-slate-400 font-mono leading-none mt-0.5">
                          {agentPhoneOverride || "+1 (555) 779-1100"}
                        </p>
                      </div>
                    </div>

                    {includeLenderBlock ? (
                      <div className="p-1 px-1.5 bg-amber-50/50 border border-amber-200/50 text-right rounded font-sans max-w-[150px]">
                        <p className="text-[6.5px] font-black text-amber-900 uppercase leading-none">{lenderName}</p>
                        <p className="text-[5.5px] text-amber-700 leading-snug mt-0.5 uppercase tracking-wide truncate">{lenderCta.slice(0, 16)}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 text-[6.5px] text-slate-400 font-sans font-medium">
                        <CheckCircle className="h-2 w-2 text-blue-500" />
                        <span>Board Compliant Media Standard.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Smartphone Instagram Story Mockup view */}
            {previewMode === "mobile" && (
              <div className="mx-auto max-w-[calc(100%-15px)] lg:max-w-none lg:mx-0 w-full bg-slate-700/5 p-4 sm:p-8 rounded-2xl border border-slate-200/80 flex justify-center items-center h-[610px]">
                <div className="w-[280px] h-[530px] bg-slate-950 rounded-[40px] p-3.5 border-4 border-slate-800 shadow-2xl relative flex flex-col justify-between overflow-hidden">
                  
                  {/* Smartphone camera island mockup details */}
                  <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-black rounded-full z-20 flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-900/80 mr-2" />
                    <span className="h-1 w-4 bg-zinc-800 rounded-full" />
                  </div>

                  {/* Internal Story Image block backdrop */}
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={selectedHeroImage || fallbackImg} 
                      alt="Social backdrop" 
                      className="w-full h-full object-cover blur-md brightness-50 scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/90" />
                  </div>

                  {/* Screen Content Overlay */}
                  <div className="z-10 flex flex-col justify-between h-full pt-6 text-left text-white">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center bg-black/40 backdrop-blur-md p-2 rounded-xl">
                      <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded bg-blue-600 text-white font-mono text-[8px] font-black flex items-center justify-center">VA</div>
                        <div>
                          <p className="text-[7.5px] font-black tracking-wide leading-none">{brokerageNameOverride || legalName || "PINNACLE GROUP"}</p>
                          <p className="text-[6.5px] text-zinc-300 pointer-events-none mt-0.5 font-mono">Live Interactive Walkthrough</p>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[6px] font-black bg-blue-500">REAL-TIME</span>
                    </div>

                    {/* Central Pitch Block and Large Prompts */}
                    <div className="space-y-2 mt-6">
                      <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black tracking-wide font-mono ${activeColor.bg}`}>
                        ${(selectedListing.price || 5000000).toLocaleString()}
                      </span>
                      <h3 className={`text-base font-black tracking-tight leading-none uppercase text-amber-300`}>
                        {customHeadline}
                      </h3>
                      <p className="text-[9px] text-zinc-200 leading-snug">
                        {customDescription.slice(0, 150)}...
                      </p>
                    </div>

                    {/* Footer Scan with QR code and live voice companion callout */}
                    <div className="space-y-2.5 mt-auto bg-black/70 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="p-1 bg-white rounded-lg shrink-0 select-none">
                          <QRCodeSVG 
                            value={getQrUrl()} 
                            size={56}
                            level="H"
                            imageSettings={
                              (qrBrandingOption === "logo" && brokerageLogo) || (qrBrandingOption === "photo" && agentPhoto) ? {
                                src: qrBrandingOption === "logo" ? brokerageLogo : agentPhoto,
                                x: undefined,
                                y: undefined,
                                height: 16,
                                width: 16,
                                excavate: true,
                              } : undefined
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] text-zinc-300 font-mono uppercase tracking-wider font-semibold">Buyer Action Required</p>
                          <p className="text-[9.5px] font-bold text-white uppercase tracking-tight leading-tight">
                            {customCta.slice(0, 75)}...
                          </p>
                        </div>
                      </div>

                      {/* Agent brand indicators */}
                      <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[7px] text-zinc-400">
                        <span>Agent: <strong>{agentNameOverride}</strong></span>
                        <span>Tel: {agentPhoneOverride}</span>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* QR Scan test and dynamic grounding view */}
            {previewMode === "qr_test" && (
              <div className="mx-auto max-w-[calc(100%-15px)] lg:max-w-none lg:mx-0 w-full bg-slate-700/5 p-6 rounded-2xl border border-slate-200/80 text-left space-y-4 font-sans h-auto mb-2.5">
                {/* Analytical trackers mockup */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
                    <p className="text-[10px] text-white font-mono uppercase">Simulation Scans Tracked</p>
                    <p className="text-2xl font-black font-mono">1,489</p>
                    <p className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                      <span>↑ +18.4%</span>
                      <span className="text-white font-normal">from print cards</span>
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
                    <p className="text-[10px] text-white font-mono uppercase">Conversion Rate Goal</p>
                    <p className="text-2xl font-black font-mono">23.8%</p>
                    <p className="text-[9px] text-blue-400 font-bold">789 checking signins</p>
                  </div>
                </div>

                {/* Integration guide block */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-800 space-y-1.5 leading-relaxed">
                  <p className="font-bold flex items-center gap-1 text-blue-900">
                    <Bot className="h-4.5 w-4.5 text-blue-600 shrink-0" /> How scans drive AI Open House Connect Leads
                  </p>
                  <p>
                    When buyers scan the flyer’s QR code at the yard sign or entry stand, they’re taken directly to that home’s voice tour or digital sign-in page. It’s a quick and easy way to explore the property on their phone.
                  </p>
                </div>
              </div>
            )}

            {/* Simulated instructions tip */}
            <div className="p-4 bg-amber-50 text-amber-900 rounded-xl border border-amber-100 text-left text-xs space-y-1.5">
              <p className="font-extrabold flex items-center gap-1 font-sans">
                <Sparkle className="h-4 w-4 text-amber-600 animate-spin" /> High-End Media Print Suggestions:
              </p>
              <p className="leading-relaxed font-normal">
                To guarantee absolute perfection, print on <strong>Grade A premium semigloss cardstock</strong> using your local print vendor. If deploying as physical yard signage, our <strong>Square Aspect Social format</strong> aligns flawlessly on 18" x 18" metal yard stakes.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Interactive Tooltip Help Popup Modal */}
      {activeHelpPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-left space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <h4 className="text-sm font-black text-slate-950 uppercase tracking-tight flex items-center gap-1.5">
                <HelpCircle className="h-4.5 w-4.5 text-blue-600" />
                {activeHelpPopup.title}
              </h4>
              <button 
                onClick={() => setActiveHelpPopup(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold leading-none p-1.5 bg-slate-100 rounded-full cursor-pointer"
                type="button"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">{activeHelpPopup.content}</p>
            <div className="pt-2">
              <Button 
                onClick={() => setActiveHelpPopup(null)}
                className="w-full bg-slate-950 hover:bg-slate-900 text-white font-extrabold rounded-xl h-10 text-xs uppercase tracking-wide cursor-pointer"
                type="button"
              >
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
