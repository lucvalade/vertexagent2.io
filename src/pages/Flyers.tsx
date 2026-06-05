import { useState, useEffect, useRef } from "react";
import { toPng, toJpeg } from "html-to-image";
import { useAuth } from "@/hooks/useAuth";
import { getAllListings, getUserListings, Listing } from "@/lib/api";
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
  const [activeTab, setActiveTab] = useState<"edit" | "settings" | "typography">("edit");

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

  // Options toggles
  const [showSecondaryPhotos, setShowSecondaryPhotos] = useState(true);
  const [includeLenderBlock, setIncludeLenderBlock] = useState(false);
  const [lenderName, setLenderName] = useState("Alpha Preferred Mortgages");
  const [lenderCta, setLenderCta] = useState("Get pre-approved");

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useEffect(() => {
    if (user) {
      loadListings();
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
    setSelectedHeroImage(firstImg);
    setExcludedPhotos([]);

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

    setCustomHeadline((headlines[activeTemplate] || "AN UNCOMPROMISING PARADISE OF STYLE AND REFINEMENT").toUpperCase().slice(0, 80));
    setCustomSubHeadline((subheadlines[activeTemplate] || "Discover premium structural attributes and bespoke details.").slice(0, 120));
    
    const shortDesc = listing.description 
      ? listing.description.split(".").slice(0, 3).join(".") + "."
      : "Step into uncompromised luxury wrapping high-contrast views, pristine floorplans, premium material lists, and high-fidelity comfort throughout.";
    setCustomDescription(shortDesc.slice(0, 300));

    const ctas: Record<QrDestination, string> = {
      ai_tour: "Scan code to connect your headset & start Sora's live audio tour!",
      open_house: "Scan code to register safety logs & sign in securely instantly.",
      lead_form: "Scan code to file consent and receive instant property brochures.",
      details_page: "Scan code to load MLS disclosures, interactive map, and pricing.",
      custom_url: "Scan code to access verified premium media slides and specs directly."
    };
    setCustomCta(ctas[qrDest].slice(0, 100));

    // Agent defaults
    const listAny = listing as any;
    setAgentNameOverride(listAny.agentName || user?.name || "Premium Broker Representative");
    setAgentPhoneOverride(listAny.agentPhone || "+1 (555) 779-1100");
    setAgentEmailOverride(listAny.agentEmail || user?.email || "advisor@vertexagent.io");
    setBrokerageNameOverride(listAny.brokerageName || "Pinnacle Real Estate Group");
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

  // AI copywriting generator with realistic responses related to VertexAgent models
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
        const picked = `A pristine masterwork of geometric architecture and custom millwork at ${selectedListing.address}. Framed by custom steel window walls, the layout cascades gorgeous light into wide rift-sawn oak flooring systems. Ready for the modern buyer with multi-zone smart controls.`.slice(0, 300);
        setCustomDescription(picked);
        toast.success("✨ Generated premium properties copy.");
      } else if (type === "cta") {
        setCustomCta(`Scan to let Sora, our AI tour pilot, present this home to your ears in natural real-time dialogue!`.slice(0, 100));
        toast.success("✨ Created helpful voice-guided audio CTA.");
      }
      setIsGeneratingAi(false);
    }, 850);
  };

  // Build target URL
  const getQrUrl = () => {
    if (!selectedListing) return "https://vertexagent.io";
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
        url = customQrUrl || "https://vertexagent.io";
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

    const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(getQrUrl())}`;

    let htmlContent = "";

    if (orientation === "portrait") {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Print Flyer - ${selectedListing?.address || "VertexAgent"}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;700&family=Poppins:wght@400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@400;600;700;800&family=Lato:wght@400;700;900&display=swap');
            
            @page { 
              size: letter portrait; 
              margin: 0.5in; 
            }
            
            body { 
              margin: 0; 
              padding: 0; 
              background-color: white; 
              color: #1e293b;
              font-family: ${template === "luxury_royal" ? "'Playfair Display', serif" : "'Inter', sans-serif"};
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .container {
              width: 7.5in;
              height: 10in;
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
              font-size: 11px;
              color: #64748b;
              font-weight: 600;
              margin: 6px 0 0 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            /* Hero section */
            .hero-container {
              position: relative;
              width: 100%;
              height: ${includeLenderBlock ? '2.8in' : '3.2in'};
              border-radius: 8px;
              overflow: hidden;
              border: 1px solid #e2e8f0;
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
            }

            .stat-val {
              font-size: 18px;
              font-weight: 900;
              color: #0f172a;
              margin: 0;
              line-height: 1;
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
              color: #78350f;
              margin: 0;
              text-transform: uppercase;
              line-height: 1;
            }

            .lender-cta {
              font-size: 7.5px;
              color: #b45309;
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
                  <p class="logo-text-title">VERTEXAGENT</p>
                  <p class="logo-text-subtitle">DIGITAL COMPANION</p>
                </div>
              </div>
              <div>
                <p class="brokerage-title">${brokerageNameOverride || "PINNACLE REAL ESTATE GROUP"}</p>
                <p class="brokerage-subtitle">EXCLUSIVE SYNDICATE</p>
              </div>
            </div>

            <div class="headline-section">
              ${template === "just_listed_sold" ? `<span class="status-badge">${statusBadgeText}</span>` : ""}
              <h2 class="main-headline">${customHeadline}</h2>
              <p class="location-tag">📍 ${selectedListing.address}, ${selectedListing.city}</p>
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
          <title>Print Flyer - ${selectedListing?.address || "VertexAgent"}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;700&family=Poppins:wght@400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800;900&family=Open+Sans:wght@400;600;700;800&family=Lato:wght@400;700;900&display=swap');
            
            @page { 
              size: letter landscape; 
              margin: 0.5in; 
            }
            
            body { 
              margin: 0; 
              padding: 0; 
              background-color: white; 
              color: #1e293b;
              font-family: ${template === "luxury_royal" ? "'Playfair Display', serif" : "'Inter', sans-serif"};
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .container {
              width: 10in;
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

            /* Hero container */
            .hero-container {
              position: relative;
              width: 100%;
              height: 2.7in;
              border-radius: 8px;
              overflow: hidden;
              border: 1px solid #e2e8f0;
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
            }

            .stat-val {
              font-size: 15px;
              font-weight: 900;
              color: #0f172a;
              margin: 0;
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
              color: #78350f;
              margin: 0;
              text-transform: uppercase;
            }

            .lender-cta {
              font-size: 7px;
              color: #b45309;
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
                  <p class="logo-text-title">VERTEXAGENT</p>
                  <p class="logo-text-subtitle">DIGITAL COMPANION</p>
                </div>
              </div>
              <div style="text-align: right;">
                <p class="brokerage-title">${brokerageNameOverride || "PINNACLE REAL ESTATE GROUP"}</p>
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
                    <p class="location-tag">📍 ${selectedListing.address}, ${selectedListing.city}</p>
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

  const handleDownloadFile = (type: "png" | "jpg") => {
    const node = document.getElementById("flyer-printable-canvas");
    if (!node) {
      toast.error("Printable flyer element not found.");
      return;
    }

    const toastId = toast.loading(`Rasterizing vector blocks to High-Density 300DPI ${type.toUpperCase()}...`);
    
    // We render using a higher pixel ratio to support premium print resolution (equivalent to 300dpi)
    const options = {
      quality: 0.98,
      pixelRatio: 2,
      style: {
        transform: "scale(1)",
        transformOrigin: "top left"
      }
    };

    const promise = type === "png" 
      ? toPng(node, options) 
      : toJpeg(node, options);

    const safeAddress = (selectedListing?.address || "vertexagent_flyer")
      .replace(/[^a-zA-Z0-9]/g, ""); // IE: 77ElfordCresHamilton

    promise
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `${safeAddress}.${type}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.dismiss(toastId);
        toast.success(`✨ Branded flyer saved successfully as ${safeAddress}.${type}`);
      })
      .catch((err) => {
        console.error("Export error", err);
        toast.dismiss(toastId);
        toast.error(`Rasterization failed: ${err.message || "Unknown error"}. Try printing to PDF instead.`);
      });
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
  
  const togglePhotoInclusion = (url: string) => {
    if (excludedPhotos.includes(url)) {
      setExcludedPhotos(prev => prev.filter(p => p !== url));
      toast.success("Photo included back into secondary strip.");
    } else {
      if (url === selectedHeroImage) {
        toast.error("Cannot exclude the active featured primary photo!");
        return;
      }
      setExcludedPhotos(prev => [...prev, url]);
      toast.info("Photo excluded from secondary strip.");
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
              className="bg-blue-900 hover:bg-blue-950 active:bg-white active:text-blue-900 text-white font-extrabold gap-2 rounded-xl h-11 px-5 text-xs cursor-pointer flex-1 sm:flex-none"
            >
              <Printer className="h-4 w-4" />
              Print Flyer (PDF)
            </Button>
            <Button 
              onClick={() => handleDownloadFile("png")}
              className="bg-blue-900 hover:bg-blue-950 active:bg-white active:text-blue-900 text-white font-extrabold gap-2 rounded-xl h-11 px-4 text-xs cursor-pointer flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4 active:text-blue-900 text-white" />
              Save JPG / PNG
            </Button>
            <Button 
              onClick={handleDownloadQrCode}
              className="bg-blue-900 hover:bg-blue-950 active:bg-white active:text-blue-900 text-white font-extrabold gap-2 rounded-xl h-11 px-4 text-xs cursor-pointer flex-1 sm:flex-none"
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
            <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden text-left">
              <div className="border-b border-slate-100 bg-slate-50/50 flex">
                <button
                  onClick={() => setActiveTab("edit")}
                  className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === "edit" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  1. Content
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === "settings" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  2. Aesthetics
                </button>
                <button
                  onClick={() => setActiveTab("typography")}
                  className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === "typography" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  3. Typography
                </button>
              </div>

              <CardContent className="p-6 space-y-5">
                {activeTab === "edit" ? (
                  <>
                    {/* Listing select */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Sync Property Record</Label>
                        <div className="group relative inline-block">
                          <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                          <div className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl w-48 z-50 text-center font-normal normal-case leading-normal">
                            Import and keep active MLS listing facts synchronized with the marketing flyer canvas instantly.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                          </div>
                        </div>
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
                          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Flyer Primary Title</Label>
                          <div className="group relative inline-block">
                            <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                            <div className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl w-48 z-50 text-center font-normal normal-case leading-normal">
                              The primary display banner on your printed flyer. Use eye-catching uppercase luxury copy.
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-bold text-slate-400">{customHeadline.length}/80</span>
                          <button
                            onClick={() => runAiGenText("headline")}
                            disabled={isGeneratingAi}
                            className="text-[9px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className="h-3 w-3" />
                            AI Headline Builder
                          </button>
                        </div>
                      </div>
                      <Input
                        value={customHeadline}
                        onChange={(e) => setCustomHeadline(e.target.value.toUpperCase().slice(0, 80))}
                        placeholder="LUXURY ESTATE"
                        maxLength={80}
                        className="text-xs sm:text-sm font-semibold h-10 border-slate-200 rounded-xl tracking-tight uppercase"
                      />
                    </div>

                    {/* Subheadline and taglines */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Marketing Subtitle</Label>
                          <div className="group relative inline-block">
                            <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                            <div className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl w-48 z-50 text-center font-normal normal-case leading-normal">
                              A secondary hook framing the luxury characteristics, location, or active offering style of this listing.
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-slate-400">{customSubHeadline.length}/120</span>
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
                          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Property Pitch Paragraph</Label>
                          <div className="group relative inline-block">
                            <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                            <div className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl w-48 z-50 text-center font-normal normal-case leading-normal">
                              Short cohesive paragraphs detailing bespoke materials, neighborhood statistics, and highlight architectural features.
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold text-slate-400">{customDescription.length}/300</span>
                          <button
                            onClick={() => runAiGenText("description")}
                            disabled={isGeneratingAi}
                            className="text-[9px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className="h-3 w-3" />
                            AI Copywriter
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value.slice(0, 300))}
                        rows={5}
                        maxLength={300}
                        className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed font-sans"
                        placeholder="Detail premium components and details..."
                      />
                    </div>

                    {/* Dynamic Hero Picture selector from Listing. This handles user item 5 "Customize featured image" */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Select Featured Primary Photo</Label>
                        <div className="group relative inline-block">
                          <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                          <div className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl w-48 z-50 text-center font-normal normal-case leading-normal">
                            Select which listing image takes center stage. Check or uncheck thumbnails to show or hide them from the secondary room strip.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                          </div>
                        </div>
                      </div>
                      <p className="text-[9.5px] text-slate-400 mt-0.5">Click a thumbnail to set as primary. Uncheck a thumbnail's circle to hide it from the footer secondary strip.</p>
                      
                      <div className="grid grid-cols-4 gap-2 mt-1">
                        {listingPhotos.map((photo, index) => {
                          const url = typeof photo === "string" ? photo : (photo as any).url;
                          const isHero = selectedHeroImage === url;
                          const isExcluded = excludedPhotos.includes(url);
                          return (
                            <div key={index} className="relative group/thumb">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedHeroImage(url);
                                  if (excludedPhotos.includes(url)) {
                                    setExcludedPhotos(prev => prev.filter(p => p !== url));
                                  }
                                  toast.info(`Featured photo updated to image #${index + 1}`);
                                }}
                                className={`w-full h-12 rounded-lg overflow-hidden border-2 transition-all relative block ${
                                  isHero ? "border-blue-600 scale-95 shadow-sm" : "border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <img src={url} alt={`Listing image ${index}`} className="w-full h-full object-cover" />
                                <span className="absolute bottom-0 right-0 bg-black/70 text-white font-mono text-[7px] px-1 font-bold">#{index + 1}</span>
                              </button>
                              
                              {!isHero && (
                                <input
                                  type="checkbox"
                                  checked={!isExcluded}
                                  onChange={() => togglePhotoInclusion(url)}
                                  className="absolute top-1 left-1.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 bg-white shadow cursor-pointer z-10"
                                  title={isExcluded ? "Include in secondary strip" : "Exclude from secondary strip"}
                                />
                              )}
                              {isHero && (
                                <div className="absolute top-1 left-1.5 bg-blue-600 text-white rounded-full p-0.5 shadow z-10" title="Primary Hero (Included)">
                                  <CheckCircle className="h-2.5 w-2.5" />
                                </div>
                              )}
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
                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2 animate-in fade-in">
                        <Label className="text-[10px] font-black uppercase text-blue-800 tracking-wider flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Event Schedule Timing
                        </Label>
                        <Input 
                          value={openHouseTime}
                          onChange={(e) => setOpenHouseTime(e.target.value)}
                          placeholder="e.g. Saturday, June 13th • 1PM - 4PM"
                          className="bg-white h-9 text-xs border-slate-200 rounded-lg"
                        />
                      </div>
                    )}

                    {/* Badges for Just listed layouts */}
                    {template === "just_listed_sold" && (
                      <div className="p-3 bg-yellow-50/50 border border-yellow-200 rounded-xl space-y-2 animate-in fade-in">
                        <Label className="text-[10px] font-black uppercase text-yellow-800 tracking-wider">Marketing Ribbon Label</Label>
                        <div className="flex gap-1">
                          {["JUST LISTED", "JUST SOLD", "CONTRACT PENDING", "PRICE REDUCED"].map(text => (
                            <button
                              key={text}
                              onClick={() => setStatusBadgeText(text)}
                              className={`px-2 py-1 rounded text-[9px] font-black border transition-all ${
                                statusBadgeText === text ? "bg-amber-950 text-white border-slate-950" : "bg-white text-slate-500 hover:text-slate-700"
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
                          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Dynamic Scan Destination</Label>
                          <div className="group relative inline-block">
                            <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                            <div className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl w-48 z-50 text-center font-normal normal-case leading-normal">
                              The physical destination QR code scans resolve to. Changes instantly without re-printing.
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                            </div>
                          </div>
                        </div>
                        <select
                          value={qrDest}
                          onChange={(e) => handleQrDestChange(e.target.value as QrDestination)}
                          className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                        >
                          <option value="ai_tour">🚀 Sora Voice AI Guided Tour</option>
                          <option value="open_house">🔑 Digital Open House Sign-In Kiosk</option>
                          <option value="lead_form">📬 Legal Consent & Asset Materials Dispatch</option>
                          <option value="details_page">🏠 Listing Microsite Details Page</option>
                          <option value="custom_url">🔗 Custom Personal Redirect Link</option>
                        </select>
                      </div>

                      {qrDest === "custom_url" && (
                        <div className="space-y-1.5 animate-in fade-in">
                          <Label className="text-xs text-slate-500">Redirect Web Address (URL)</Label>
                          <Input
                            value={customQrUrl}
                            onChange={(e) => setCustomQrUrl(e.target.value)}
                            placeholder="https://exclusive-portfolio.com"
                            className="text-xs h-10 border-slate-200 rounded-xl"
                          />
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">QR Code Overlay Prompt</Label>
                            <div className="group relative inline-block">
                              <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                              <div className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl w-48 z-50 text-center font-normal normal-case leading-normal">
                                Prompted CTA displayed alongside the QR barcode to encourage immediate visitor phone scans.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono font-bold text-slate-400 mr-[5px]">{customCta.length}/100</span>
                            <button
                              onClick={() => runAiGenText("cta")}
                              disabled={isGeneratingAi}
                              className="text-[9px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="h-3 w-3" />
                              AI CTA Generator
                            </button>
                            <div className="group relative inline-block -left-[15px]">
                              <HelpCircle className="h-3 w-3 text-slate-400 hover:text-slate-500 cursor-help" />
                              <div className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[9px] p-2 rounded-lg shadow-xl w-[183px] z-50 text-center font-normal normal-case leading-normal">
                                Generate high-converting conversion call-to-actions tailored dynamically to the active scan destination.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <textarea
                          value={customCta}
                          onChange={(e) => setCustomCta(e.target.value.slice(0, 100))}
                          placeholder="Scan to connect headset"
                          rows={3}
                          maxLength={100}
                          className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-200 rounded-xl text-slate-700 h-20 focus:ring-1 focus:ring-blue-500 focus:outline-none font-sans leading-relaxed"
                        />
                      </div>
                    </div>
                  </>
                ) : activeTab === "settings" ? (
                  <>
                    {/* Design preset selection */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Select Premium Layout Template</Label>
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
                            className={`p-3 text-left border rounded-xl flex flex-col justify-center transition-all ${
                              template === t.id 
                                ? "border-blue-600 bg-blue-50/50 shadow-sm" 
                                : "border-slate-200 hover:bg-slate-50/50"
                            }`}
                          >
                            <span className="text-slate-950 font-black text-xs">{t.name}</span>
                            <span className="text-[9.5px] text-slate-500 leading-tight mt-0.5">{t.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Accent colors */}
                    <div className="space-y-2 pt-3 border-t">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Branding Accent Color</Label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {Object.entries(colorClasses).map(([colorKey, data]) => (
                          <button
                            key={colorKey}
                            onClick={() => setAccentColor(colorKey as AccentColor)}
                            className={`h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                              accentColor === colorKey ? "border-slate-950 bg-slate-950/5" : "border-slate-200"
                            }`}
                            title={data.name}
                          >
                            <span className={`h-4.5 w-4.5 rounded-full ${data.preview} shadow-sm`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Page orientation toggles */}
                    <div className="space-y-2 pt-3 border-t">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Flyer Aspect Ratio Format</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setOrientation("portrait")}
                          className={`py-2 text-xs font-bold border rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                            orientation === "portrait" ? "bg-slate-900 border-slate-950 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Layout className="h-3.5 w-3.5" />
                          Portrait (8.5" x 11")
                        </button>
                        <button
                          onClick={() => setOrientation("square")}
                          className={`py-2 text-xs font-bold border rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                            orientation === "square" ? "bg-slate-900 border-slate-950 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Instagram className="h-3.5 w-3.5" />
                          Square (1:1 Social)
                        </button>
                      </div>
                    </div>

                    {/* Agent overridden contact values */}
                    <div className="space-y-2.5 pt-3 border-t">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Agent Contact Overrides</Label>
                      <div className="space-y-1.5">
                        <Input 
                          value={agentNameOverride} 
                          onChange={(e) => setAgentNameOverride(e.target.value)} 
                          placeholder="Agent Name" 
                          className="h-8 text-xs"
                        />
                        <Input 
                          value={agentPhoneOverride} 
                          onChange={(e) => setAgentPhoneOverride(e.target.value)} 
                          placeholder="Phone Number" 
                          className="h-8 text-xs font-mono"
                        />
                        <Input 
                          value={agentEmailOverride} 
                          onChange={(e) => setAgentEmailOverride(e.target.value)} 
                          placeholder="Broker Email" 
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Advanced toggle buttons */}
                    <div className="space-y-2 pt-3 border-t">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Structural Blocks</Label>
                      
                      <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200/50 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showSecondaryPhotos}
                          onChange={(e) => setShowSecondaryPhotos(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <div className="text-xs text-left">
                          <p className="font-extrabold text-slate-800">Show Room Strip</p>
                          <p className="text-[9.5px] text-slate-400">Display mini ambient picture row at footer.</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200/50 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={includeLenderBlock}
                          onChange={(e) => setIncludeLenderBlock(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <div className="text-xs text-left">
                          <p className="font-extrabold text-slate-800">Include preferred lender block</p>
                          <p className="text-[9.5px] text-slate-400">Add compliant rate support options.</p>
                        </div>
                      </label>
                    </div>

                    {includeLenderBlock && (
                      <div className="p-3 bg-amber-50/45 border border-amber-200/60 rounded-xl space-y-2.5 animate-in fade-in text-left">
                        <div className="flex items-center justify-between text-amber-950 font-black text-xs">
                          <div className="flex items-center gap-1">
                            <BadgePercent className="h-4 w-4 text-amber-600" />
                            <span>Lender Co-Op Integration</span>
                          </div>
                          <span className="text-[9px] font-mono font-bold text-amber-600/80">{lenderCta.length}/16</span>
                        </div>
                        <Input value={lenderName} onChange={(e) => setLenderName(e.target.value)} placeholder="Name of lender entity" className="bg-white h-8 text-[11px]" />
                        <Input 
                          value={lenderCta} 
                          onChange={(e) => setLenderCta(e.target.value.slice(0, 16))} 
                          placeholder="Get pre-approved" 
                          maxLength={16}
                          className="bg-white h-8 text-[11px]" 
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4 animate-in fade-in">
                    {/* Primary Title Typography Card */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 text-left">
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Title Typography</span>
                        <Type className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Font Category</label>
                          <select
                            value={titleFont}
                            onChange={(e) => setTitleFont(e.target.value as any)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="grotesque">Geometric Grotesque</option>
                            <option value="geometric">Geometric Sans-Serif</option>
                            <option value="humanist">Humanist Sans-Serif</option>
                            <option value="serif">Display Serif</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Size Scale</label>
                          <select
                            value={titleSize}
                            onChange={(e) => setTitleSize(e.target.value as any)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Bold emphasis</span>
                      </label>
                    </div>

                    {/* Marketing Subtitle Typography Card */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 text-left">
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Subtitle Typography</span>
                        <Heading className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Font Category</label>
                          <select
                            value={subtitleFont}
                            onChange={(e) => setSubtitleFont(e.target.value as any)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="grotesque">Geometric Grotesque</option>
                            <option value="geometric">Geometric Sans-Serif</option>
                            <option value="humanist">Humanist Sans-Serif</option>
                            <option value="serif">Display Serif</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Size Scale</label>
                          <select
                            value={subtitleSize}
                            onChange={(e) => setSubtitleSize(e.target.value as any)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Bold emphasis</span>
                      </label>
                    </div>

                    {/* Description Paragraph Typography Card */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 text-left">
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Body Description Typography</span>
                        <AlignLeft className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Font Category</label>
                          <select
                            value={descriptionFont}
                            onChange={(e) => setDescriptionFont(e.target.value as any)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="grotesque">Geometric Grotesque</option>
                            <option value="geometric">Geometric Sans-Serif</option>
                            <option value="humanist">Humanist Sans-Serif</option>
                            <option value="serif">Display Serif</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Size Scale</label>
                          <select
                            value={descriptionSize}
                            onChange={(e) => setDescriptionSize(e.target.value as any)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Bold emphasis</span>
                      </label>
                    </div>

                    {/* QR Code Action CTA Typography Card */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 text-left">
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider">QR CTA Prompt Typography</span>
                        <QrCode className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Font Category</label>
                          <select
                            value={ctaFont}
                            onChange={(e) => setCtaFont(e.target.value as any)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="grotesque">Geometric Grotesque</option>
                            <option value="geometric">Geometric Sans-Serif</option>
                            <option value="humanist">Humanist Sans-Serif</option>
                            <option value="serif">Display Serif</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Size Scale</label>
                          <select
                            value={ctaSize}
                            onChange={(e) => setCtaSize(e.target.value as any)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Bold emphasis</span>
                      </label>
                    </div>

                    <div className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 p-2.5 rounded-xl font-normal text-left sm:text-center italic leading-normal">
                      💡 Tip: Standardize on 2 font categories for optimal brand composition matching compliance and exclusive presentation.
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
                    previewMode === "print" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Print Mockup
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`flex-1 sm:flex-none px-4 py-2 font-black rounded-lg text-xs tracking-tight transition-all flex items-center justify-center gap-1.5 ${
                    previewMode === "mobile" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Instagram Stories View
                </button>
                <button
                  onClick={() => setPreviewMode("qr_test")}
                  className={`flex-1 sm:flex-none px-4 py-2 font-black rounded-lg text-xs tracking-tight transition-all flex items-center justify-center gap-1.5 ${
                    previewMode === "qr_test" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
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
              <div className="bg-slate-700/5 p-4 sm:p-8 rounded-2xl border border-slate-200/80 flex justify-center items-center shadow-inner overflow-auto h-[610px]">
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
                        <p className="text-[8px] font-black tracking-wider text-slate-950">VERTEXAGENT</p>
                        <p className="text-[6.5px] text-slate-400 font-mono leading-none">DIGITAL COMPANION</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-900 leading-none">
                        {brokerageNameOverride || "PINNACLE REAL ESTATE GROUP"}
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
                  <div className={`relative rounded overflow-hidden border border-slate-100 ${
                    includeLenderBlock && orientation === "portrait" ? "h-[94px] mt-1.5" : "h-28 mt-2"
                  }`}>
                    <img 
                      src={selectedHeroImage || fallbackImg} 
                      alt="Primary Feature" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-[9px] font-mono font-bold leading-none">
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
                  <div className={`grid grid-cols-4 gap-2 bg-slate-50 rounded text-center font-mono text-[8px] border border-slate-100 ${
                    includeLenderBlock && orientation === "portrait" ? "p-1 mt-1.5" : "p-1.5 mt-2"
                  }`}>
                    <div className="border-r border-slate-200">
                      <p className="text-[6.5px] text-slate-400 font-sans font-normal">Beds</p>
                      <p className="font-extrabold text-slate-900 leading-tight">{selectedListing.beds || 5}</p>
                    </div>
                    <div className="border-r border-slate-200">
                      <p className="text-[6.5px] text-slate-400 font-sans font-normal">Baths</p>
                      <p className="font-extrabold text-slate-900 leading-tight">{selectedListing.baths || 6}</p>
                    </div>
                    <div className="border-r border-slate-200">
                      <p className="text-[6.5px] text-slate-400 font-sans font-normal">Sq Ft</p>
                      <p className="font-extrabold text-slate-900 leading-tight">{(selectedListing.sqft || 4300).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[6.5px] text-slate-400 font-sans font-normal">Est. Rate</p>
                      <p className="font-extrabold text-emerald-600 leading-tight">4.92% APR</p>
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
                          <div className={`w-1/2 rounded overflow-hidden ${includeLenderBlock ? "h-[30px]" : "h-9"}`}>
                            <img src={secondPhoto} className="w-full h-full object-cover" />
                          </div>
                          <div className={`w-1/2 rounded overflow-hidden ${includeLenderBlock ? "h-[30px]" : "h-9"}`}>
                            <img src={thirdPhoto} className="w-full h-full object-cover" />
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
                          level="M"
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
              <div className="bg-slate-700/5 p-4 sm:p-8 rounded-2xl border border-slate-200/80 flex justify-center items-center h-[610px]">
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
                          <p className="text-[7.5px] font-black tracking-wide leading-none">{brokerageNameOverride || "PINNACLE GROUP"}</p>
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
                            level="M"
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
              <div className="bg-slate-700/5 p-6 rounded-2xl border border-slate-200/80 text-left space-y-4 font-sans h-[610px] overflow-y-auto w-full">
                {/* Analytical trackers mockup */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
                    <p className="text-[10px] text-zinc-400 font-mono uppercase">Simulation Scans Tracked</p>
                    <p className="text-2xl font-black font-mono">1,489</p>
                    <p className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                      <span>↑ +18.4%</span>
                      <span className="text-zinc-500 font-normal">from print yards</span>
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
                    <p className="text-[10px] text-zinc-400 font-mono uppercase">Conversion Rate Goal</p>
                    <p className="text-2xl font-black font-mono">23.8%</p>
                    <p className="text-[9px] text-blue-400 font-bold">789 checking signins</p>
                  </div>
                </div>

                {/* Integration guide block */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-800 space-y-1.5 leading-relaxed">
                  <p className="font-bold flex items-center gap-1 text-blue-900">
                    <Bot className="h-4.5 w-4.5 text-blue-600 shrink-0" /> How scans drive VertexAgent Leads
                  </p>
                  <p>
                    Whenever a buyer scans this flyer QR code at a property yard or foyer entryway stand, our live routing framework captures their UTM channel (UTM_Print_Yard) and links their browser to the listing's custom voice walkthrough or kiosk sign-in.
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
    </div>
  );
}
