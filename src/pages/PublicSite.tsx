import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import BlindsOpenHouseText from "@/components/BlindsOpenHouseText";
import { 
  ArrowRight, 
  Home, 
  Mic, 
  Globe, 
  BarChart3, 
  Search, 
  Loader2, 
  Menu, 
  X, 
  Sparkles, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight,
  PhoneCall, 
  Lock, 
  Bookmark, 
  Languages, 
  Bot, 
  Smartphone, 
  FileCheck, 
  Maximize2,
  CalendarDays,
  Send,
  Building,
  ShieldAlert,
  Volume2,
  Play,
  Pause,
  Square,
  ShieldCheck,
  Check
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import PublicLayout from "@/components/PublicLayout";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function PublicSite() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [selectedRole, setSelectedRole] = useState<string>("agent");
  const [pilotListing, setPilotListing] = useState<any>(null);

  // Demo Booking state
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({ name: "", email: "", phone: "", website: "", details: "" });
  const [bookingErrors, setBookingErrors] = useState<Record<string, { field: string; isValid: boolean; errorMessage: string }>>({});
  const [bookingTouched, setBookingTouched] = useState<Record<string, boolean>>({});
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // FAQ state
  const [openFaqIndices, setOpenFaqIndices] = useState<Record<number, boolean>>({
    0: true,
  });

  // Testimonials tab
  const [activeTestimonialTab, setActiveTestimonialTab] = useState<"all" | "agents" | "brokers" | "lenders">("all");
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);

  // Interactive Phone Mockup states
  const [selectedMockupRoom, setSelectedMockupRoom] = useState<"exterior" | "living" | "kitchen" | "backyard">("exterior");
  const [mockupDialogue, setMockupDialogue] = useState<Array<{ sender: "buyer" | "sora"; text: string }>>([]);
  const [isMockupSpeaking, setIsMockupSpeaking] = useState(false);
  const [isMockupPaused, setIsMockupPaused] = useState(false);
  const [consentChecked, setConsentChecked] = useState(true);
  const mockupAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechSessionIdRef = useRef(0);
  const mockupAudioTimeoutRef = useRef<any>(null);

  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch Pilot Property (pilot-listing-01) details to ensure Firestore is source of truth
  useEffect(() => {
    const fetchPilotProperty = async () => {
      try {
        const pDoc = await getDoc(doc(db, "properties", "pilot-listing-01"));
        if (pDoc.exists()) {
          const data = pDoc.data();
          setPilotListing({
            address: data.address || "4 Clifton Downs Rd",
            city: data.city || "Hamilton",
            province: data.province || "ON",
            price: data.listPrice ?? data.price ?? 1199000,
            beds: data.beds || "3+1",
            baths: data.baths || 3,
            hasInLawSuite: data.hasInLawSuite ?? true,
            brokerage: data.brokerage || "Michael St. John Realty",
          });
        }
      } catch (err) {
        console.error("Failed to load pilot-listing-01 from Firestore:", err);
      }
    };
    fetchPilotProperty();
  }, []);

  const listingDetails = pilotListing || {
    address: "4 Clifton Downs Rd",
    city: "Hamilton",
    province: "ON",
    price: 1199000,
    beds: "3+1", // Ontario Bedrooms plus convention
    baths: 3,
    hasInLawSuite: true,
    brokerage: "Michael St. John Realty",
  };



  // Initialize Dialogue on load or language switch
  useEffect(() => {
    const welcomeText = lang === "en" 
      ? "[slow] Hi, I’m Sora, your AI property guide. [pause] Welcome to this interactive open house tour for 4 Clifton Downs Road. [pause] Tap any buyer question below to explore!"
      : "[slow] Bonjour, je suis Sora, votre guide immobilière IA. [pause] Bienvenue dans cette visite interactive du 4 Clifton Downs Road. [pause] Appuyez sur une question ci-dessous pour commencer !";
    
    setMockupDialogue([{ sender: "sora", text: welcomeText }]);
  }, [lang]);

  // Handle Synthesis with high quality Sora voice from backend
  const handleStopMockup = () => {
    if (mockupAudioRef.current) {
      mockupAudioRef.current.pause();
      mockupAudioRef.current.currentTime = 0;
    }
    if (mockupAudioTimeoutRef.current) {
      clearTimeout(mockupAudioTimeoutRef.current);
    }
    speechSessionIdRef.current++;
    setIsMockupSpeaking(false);
    setIsMockupPaused(false);
  };

  const speakMockupWithPauses = async (textToSpeak: string) => {
    const currentSessionId = speechSessionIdRef.current;
    setIsMockupSpeaking(true);
    setIsMockupPaused(false);

    try {
      const cleanText = textToSpeak.replace(/\[\w+\]/g, "").trim();
      const langName = lang === "fr" ? "French" : "English";

      const response = await fetch("/api/tts-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanText,
          lang: langName,
          voiceName: "Kore" // Sora's official premium voice!
        })
      });

      if (currentSessionId !== speechSessionIdRef.current) return;

      if (!response.ok) {
        throw new Error("Failed to contact Gemini TTS servers.");
      }

      const data = await response.json();
      if (currentSessionId !== speechSessionIdRef.current) return;

      if (data.success && data.base64Audio) {
        const mimeType = data.mimeType || "audio/wav";
        const binary = atob(data.base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);

        if (!mockupAudioRef.current) {
          mockupAudioRef.current = new Audio();
        }

        mockupAudioRef.current.src = url;
        mockupAudioRef.current.load();

        mockupAudioRef.current.onended = () => {
          if (currentSessionId === speechSessionIdRef.current) {
            setIsMockupSpeaking(false);
            setIsMockupPaused(false);
          }
        };

        mockupAudioRef.current.onerror = () => {
          if (currentSessionId === speechSessionIdRef.current) {
            setIsMockupSpeaking(false);
            setIsMockupPaused(false);
          }
        };

        await mockupAudioRef.current.play();
      }
    } catch (err) {
      console.error("[PublicSite Mockup TTS Error]:", err);
      setIsMockupSpeaking(false);
      setIsMockupPaused(false);
    }
  };

  const simulatedQuestions = [
    {
      id: "materials",
      label_en: "What custom features are in the living room?",
      label_fr: "Quels sont les détails du salon ?",
      response_en: "The living room features a custom double-sided fireplace, towering 12-foot ceilings, and grand solid walnut wall panels crafted specifically for Michael St. John Realty listings. Let me know if you would like showing information!",
      response_fr: "Le salon est doté d'un foyer double face sur mesure, de plafonds majestueux de 12 pieds et de magnifiques panneaux muraux en noyer massif. Souhaitez-vous planifier une visite ?",
      room: "living" as const
    },
    {
      id: "kitchen",
      label_en: "Can you tell me about the chef's kitchen?",
      label_fr: "Parlez-moi de la cuisine de chef ?",
      response_en: "This kitchen features sleek premium quartz island surfaces, customized Sub-Zero appliances, and an open layout that overlooks the back gardens. It's the ultimate space for hosting guests.",
      response_fr: "Cette cuisine est équipée d'une îlot en quartz haut de gamme, d'appareils Sub-Zero intégrés et d'un aménagement ouvert idéal pour recevoir vos invités.",
      room: "kitchen" as const
    },
    {
      id: "suite",
      label_en: "Is there a separate in-law suite?",
      label_fr: "Y a-t-il une suite parentale séparée ?",
      response_en: "Yes, this Hamilton listing fully complies with Ontario standards—boasting a private in-law suite with its own separate entry and second kitchen, providing fantastic structural flexibility.",
      response_fr: "Oui, cette propriété à Hamilton comprend une suite parentale privée avec entrée séparée et une deuxième cuisine complète, idéale pour une grande flexibilité structurelle.",
      room: "exterior" as const
    },
    {
      id: "compliance",
      label_en: "Are my chat records private and compliant?",
      label_fr: "Mes données sont-elles sécurisées et conformes ?",
      response_en: "Absolutely. All transcripts are logged under strict PIPEDA and Quebec Law 25 compliance protocols. We require explicit buyer consent before any walkthrough audio begins.",
      response_fr: "Absolument. Toutes les transcriptions sont conservées en conformité rigoureuse avec la LPRPDE et la Loi 25 du Québec. Votre consentement explicite est obligatoire avant de démarrer.",
      room: "exterior" as const
    }
  ];

  const handleSimulatedQuestion = (q: typeof simulatedQuestions[0]) => {
    if (!consentChecked) {
      toast.error(
        lang === "en" 
          ? "Please provide explicit consent to start the tour!" 
          : "Veuillez donner votre consentement explicite pour démarrer la visite !"
      );
      return;
    }

    handleStopMockup();
    setSelectedMockupRoom(q.room);
    
    const labelText = lang === "en" ? q.label_en : q.label_fr;
    const responseText = lang === "en" ? q.response_en : q.response_fr;

    setMockupDialogue(prev => [
      ...prev,
      { sender: "buyer", text: labelText },
    ]);

    setIsMockupSpeaking(true);

    setTimeout(() => {
      setMockupDialogue(prev => [
        ...prev,
        { sender: "sora", text: responseText }
      ]);
      speakMockupWithPauses(responseText);
    }, 600);
  };

  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length === 0) return "";
    if (digits.length <= 3) {
      return `(${digits}`;
    }
    if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  // Demo Booking validation & submit
  const validateBookingField = (field: string, value: string): boolean => {
    let isValid = true;
    let errorMessage = "";

    if (field === "name") {
      const cleaned = value.trim().replace(/\s+/g, " ");
      if (!cleaned) {
        isValid = false;
        errorMessage = "Full Name is required.";
      } else {
        const parts = cleaned.split(" ");
        if (parts.length < 2) {
          isValid = false;
          errorMessage = "Please enter both first and last name.";
        }
      }
    } else if (field === "email") {
      const trimmed = value.trim();
      if (!trimmed) {
        isValid = false;
        errorMessage = "Email Address is required.";
      } else if (!trimmed.includes("@")) {
        isValid = false;
        errorMessage = "Please enter a valid email address that includes @.";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
          isValid = false;
          errorMessage = "Please enter a valid email address.";
        }
      }
    } else if (field === "phone") {
      const trimmed = value.trim();
      if (!trimmed) {
        isValid = false;
        errorMessage = "Phone Number is required.";
      } else {
        const phonePattern = /^\(\d{3}\) \d{3}-\d{4}$/;
        if (!phonePattern.test(trimmed)) {
          isValid = false;
          errorMessage = "Please enter a valid phone number in (###) ###-#### format.";
        }
      }
    } else if (field === "website") {
      const trimmed = value.trim();
      if (!trimmed) {
        isValid = false;
        errorMessage = "Website is required.";
      } else if (!trimmed.startsWith("https://")) {
        isValid = false;
        errorMessage = "Please enter a valid website in this format: https://www.website.com.";
      } else {
        const urlPattern = /^https:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9.\/?=&%#_:-]+$/;
        if (!urlPattern.test(trimmed)) {
          isValid = false;
          errorMessage = "Please enter a valid website in this format: https://www.website.com.";
        }
      }
    }

    setBookingErrors(prev => ({
      ...prev,
      [field]: { field, isValid, errorMessage }
    }));

    return isValid;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Set all fields as touched
    const allFields = ["name", "email", "phone", "website"];
    const newTouched: Record<string, boolean> = {};
    allFields.forEach(f => {
      newTouched[f] = true;
    });
    setBookingTouched(newTouched);

    let isAllValid = true;
    allFields.forEach(f => {
      const isValid = validateBookingField(f, (bookingForm as any)[f]);
      if (!isValid) isAllValid = false;
    });

    if (!isAllValid) {
      toast.error(
        lang === "en" 
          ? "Please resolve all form errors before submitting." 
          : "Veuillez corriger toutes les erreurs avant de soumettre."
      );
      return;
    }

    setIsSubmittingBooking(true);
    try {
      await addDoc(collection(db, "demo_requests"), {
        ...bookingForm,
        agentUid: "HTzvSsD3bqOzfuGLQs0MFEJmUQA2",
        createdAt: serverTimestamp(),
        brokerage: "Michael St. John Realty",
        location: "Hamilton, Ontario",
        status: "PENDING_REVIEW"
      });

      toast.success(
        lang === "en" 
          ? "Demo Requested Successfully! We've scheduled your tour." 
          : "Démo demandée avec succès ! Nous avons programmé votre visite."
      );
      setBookingForm({ name: "", email: "", phone: "", website: "", details: "" });
      setBookingTouched({});
      setBookingErrors({});
      setIsDemoModalOpen(false);
    } catch (err) {
      console.error("Booking failed:", err);
      toast.error("Booking error, please try again.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // High fidelity translation dictionary for complete bilingual layout
  const t = {
    en: {
      nav: {
        product: "Product",
        pricing: "Pricing",
        useCases: "Use Cases",
        faq: "FAQ",
        login: "Log In",
        getStarted: "Get Started"
      },
      hero: {
        eyebrow: "AI-Powered Real Estate Tour Platform",
        headline: "Open houses *reimagined* with your personal AI guide",
        sub: "Delight buyers with sora, a warm conversational guide that speaks 70 languages, handles listings compliance, and routes leads contextually.",
        ctaFree: "Get Started Free",
        ctaDemo: "Book a Custom Demo",
        download: "Available on iOS & Android"
      },
      socialProof: "Trusted by 5,000+ top-producing Canadian agents across RE/MAX, Royal LePage, and Michael St. John Realty.",
      pullQuote: {
        quote: "The future of real estate tours. AI Open House Connect is bridging physical open houses with conversational AI.",
        author: "News Review"
      },
      press: "TO BE FEATURED IN",
      features: {
        question1: "How do we capture qualified buyers without messy paper sheets?",
        answer1: "Deliver a secure Attendee-Facing Lock Mode. Guests scan a QR Code or sign in on an offline-buffered tablet that syncs automatically to Google's Firestore, resets in 5 seconds, and requires an agent-configured PIN to exit.",
        
        question2: "Can an AI actually guide visitors through a physical home?",
        answer2: "Meet Sora, your warm conversational guide. Sora multilingual capabilities, responds instantly to building specs and local zones, and displays high-definition rooms in sync with the audio walkthrough.",
        
        question3: "How do we ensure absolute compliance and explicit buyer consent?",
        answer3: "Strict PIPEDA & Quebec Law 25 parameters. Audio transcripts are fully secured, and explicit opt-in boxes prevent unpermitted data collection. Completely MLS-unbranded templates protect brokerages.",
        
        question4: "Can we pair with preferred lenders and automate mortgage pre-qualification?",
        answer4: "With absolute consent, leads who check 'mortgage interest' route directly to your paired lenders. Organization overrides let teams define strict precedence rules globally.",
        
        question5: "Will my custom branding and brokerage guidelines be protected?",
        answer5: "Always. Upload custom brokerage logos, apply accent colors, and manage multiple listings templates. Set up listing parameters under Ontario's 3+1 bedrooms and in-law suite classifications.",
        
        question6: "Does it synchronize leads automatically with my existing CRM?",
        answer6: "Asymmetric Follow Up Boss (and more) sync with interactive mapping, push system tags, local log preservation, and Zapier/Make.com options."
      },
      pricing: {
        title: "Simple, transparent pricing built for real estate",
        sub: "Upgrade to unlock advanced multilingual capabilities and CRM integrations.",
        soloName: "Solo Agent",
        soloPrice: "Free",
        soloDesc: "Replaces paper sign-in sheets with digital capture.",
        proName: "Pro Agent",
        proPrice: "$29",
        proDesc: "Unlock all 70 languages, Follow Up Boss CRM sync, and advanced analytics.",
        brokerName: "Broker",
        brokerPrice: "$299",
        brokerDesc: "Unlimited listings, team routing overrides, and white-label tools."
      }
    },
    fr: {
      nav: {
        product: "Produit",
        pricing: "Tarifs",
        useCases: "Cas d'usage",
        faq: "FAQ",
        login: "Connexion",
        getStarted: "Commencer"
      },
      hero: {
        eyebrow: "Plateforme immobilière propulsée par l'IA",
        headline: "Les visites libres *réimaginées* avec votre guide IA personnel",
        sub: "Enchantez les acheteurs avec sora, un guide conversationnel chaleureux qui parle plus de 15 langues, assure la conformité et transmet les prospects.",
        ctaFree: "Essai gratuit",
        ctaDemo: "Réserver une démo",
        download: "Disponible sur iOS et Android"
      },
      socialProof: "Approuvé par plus de 5 000 agents canadiens chez RE/MAX, Royal LePage et Michael St. John Realty.",
      pullQuote: {
        quote: "L'avenir des visites immobilières. AI Open House Connect relie les visites physiques à l'intelligence artificielle.",
        author: "News Review"
      },
      press: "VU DANS",
      features: {
        question1: "Comment capturer des acheteurs qualifiés sans fiches papier ?",
        answer1: "Proposez un mode kiosque sécurisé. Les visiteurs scannent un code QR ou s'enregistrent sur une tablette hors ligne avec synchronisation automatique vers Google's Firestore, réinitialisation automatique en 5 secondes et code PIN agent.",
        
        question2: "Une IA peut-elle vraiment guider les visiteurs dans une maison ?",
        answer2: "Rencontrez Sora, votre guide conversationnel. Capacités multilingues de Sora, répond instantanément aux détails structurels et affiche les photos en parfaite synchronisation avec l'audio.",
        
        question3: "Comment garantir une conformité absolue et le consentement de l'acheteur ?",
        answer3: "Conformité stricte à la LPRPDE et à la Loi 25 du Québec. Les transcriptions audio sont sécurisées, et les cases d'acceptation explicites empêchent toute collecte non autorisée.",
        
        question4: "Peut-on s'associer à des prêteurs et automatiser la préqualification ?",
        answer4: "Avec un consentement explicite, les prospects intéressés sont directement acheminés vers vos prêteurs partenaires. Les règles de l'équipe régissent l'ordre de priorité.",
        
        question5: "Mon image de marque et mes directives de courtage seront-elles protégées ?",
        answer5: "Toujours. Téléversez vos logos de courtage, appliquez vos couleurs et gérez vos modèles. Configurez vos fiches selon les normes ontariennes (3+1 chambres, suite parentale, etc.).",
        
        question6: "Est-ce que l'application se synchronise automatiquement avec mon CRM ?",
        answer6: "Synchronisation asymétrique directe avec Follow Up Boss. Associez les champs, transmettez les balises système et conservez les prospects localement en cas de perte de connexion."
      },
      pricing: {
        title: "Des tarifs simples et transparents pour l'immobilier",
        sub: "Passez au forfait supérieur pour débloquer les fonctionnalités multilingues et l'intégration CRM.",
        soloName: "Solo Agent",
        soloPrice: "Gratuit",
        soloDesc: "Remplace les fiches papier par une capture numérique des prospects.",
        proName: "Pro Agent",
        proPrice: "29 $",
        proDesc: "Débloquez les 15 langues, la synchronisation avec Follow Up Boss et les analyses avancées.",
        brokerName: "Broker",
        brokerPrice: "299 $",
        brokerDesc: "Listings illimités, règles de transmission d'équipe et marque blanche."
      }
    }
  };

  const curr = t[lang];

  return (
    <PublicLayout>
      {/* 2. Hero Section */}
      <section className="relative pt-[79px] lg:pt-[91px] pb-24 md:pb-32 px-6 overflow-hidden bg-gradient-to-b from-stone-50/50 to-[#FFFFFF]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-8 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border text-stone-800 text-[10px] sm:text-xs font-bold uppercase">
              <Sparkles className="h-3.5 w-3.5 text-[#0052A5] fill-[#0052A5] animate-pulse" />
              <span>{curr.hero.eyebrow}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-[56px] font-bold tracking-tight text-[#111827] leading-[1.1] font-sans">
              <BlindsOpenHouseText /> <span className="italic font-normal text-[#0052A5]">reimagined</span> with your personal AI guide.
            </h1>

            <p className="text-lg md:text-xl text-[#6B7280] leading-relaxed max-w-xl font-normal">
              {curr.hero.sub}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button 
                size="lg"
                onClick={() => setIsDemoModalOpen(true)}
                className="w-full sm:w-auto h-14 px-8 bg-[#0052A5] hover:bg-[#004185] text-white font-bold rounded-xl text-base shadow-lg hover:shadow group cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-black"
              >
                {curr.hero.ctaDemo}
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link 
                to="/register"
                className="w-full sm:w-auto h-14 px-8 inline-flex items-center justify-center bg-white border-2 border-black text-[#111827] hover:bg-stone-50 font-bold rounded-xl text-base shadow-sm hover:scale-105 active:scale-95 transition-all duration-200"
              >
                {curr.hero.ctaFree}
              </Link>
            </div>

            {/* Public AI Voice Concierge CTA Widget */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-voice-concierge"))}
                className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-[#0052A5] hover:from-blue-700 hover:to-[#004185] text-white font-extrabold text-sm shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 group relative overflow-hidden border border-blue-500/30 cursor-pointer"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <Mic className="h-5 w-5 animate-pulse text-white group-hover:scale-110 transition-transform" />
                <span>
                  {lang === "en" ? "Talk to our AI Voice Concierge" : "Parler au Concierge Vocal IA"}
                </span>
              </button>
            </div>

            {/* Download Badges styled in CSS */}
            <div className="pt-6 flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                <span>{curr.hero.download}:</span>
                <div className="flex items-center gap-3">
                  {/* iOS App Store Button */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-b from-[#0484EB] to-[#024982] text-white rounded-lg cursor-default shadow-md border border-[#0484EB]/30 transition-transform hover:scale-[1.02]">
                    <svg className="h-5 w-5 fill-white" viewBox="0 0 170 170">
                      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.14-1.92-14.36-6.15-3.35-2.71-7.22-7.43-11.64-14.16-4.81-7.3-8.84-15.67-12.11-25.12-3.26-9.45-4.9-18.41-4.9-26.9 0-12.73 3.03-23.01 9.09-30.81 6.06-7.8 13.72-11.75 22.98-11.87 4.58 0 9.68 1.41 15.3 4.23 5.62 2.81 9.53 4.23 11.74 4.23 2.11 0 5.89-1.35 11.34-4.05 5.45-2.7 10.27-3.99 14.46-3.87 14.93.85 26.24 6.29 33.91 16.32-13.55 8.23-20.15 19.34-19.8 33.37.3 10.86 4.35 19.83 12.15 26.9 7.8 7.07 16.74 10.96 26.83 11.64-2.1 6.13-4.73 12.26-7.89 18.39zm-32.32-114.9c0 8.01-2.85 15.27-8.56 21.8-5.71 6.52-12.63 10.35-20.78 11.48-.11-1.01-.17-2.02-.17-3.03 0-7.65 2.91-14.95 8.74-21.9 5.83-6.95 12.87-10.86 21.11-11.74.22 1.13.34 2.26.34 3.39z" />
                    </svg>
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] leading-tight text-white/85 font-semibold uppercase tracking-wider">Download on the</span>
                      <span className="font-bold text-xs leading-none">App Store</span>
                    </div>
                  </div>

                  {/* Android Google Play Button */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-lg cursor-default shadow-md border border-stone-800 transition-transform hover:scale-[1.02]">
                    <svg className="h-5 w-5" viewBox="0 0 256 256">
                      <path d="M12 11.23c-.35.39-.56.98-.56 1.74v230.06c0 .76.21 1.35.56 1.74l1.24 1.24L142 117.27V114l-128.76-104z" fill="#4285F4" />
                      <path d="M181.76 157l-39.76-39.73L12 246.01c.47.5 1.25.56 2.15.18l167.61-71.3c.4-.16.6-.45.6-.79 0-.44-.2-.79-.6-.96z" fill="#34A853" />
                      <path d="M181.76 99l-39.76 39.73L12 10.01c.47-.5 1.25-.56 2.15-.18l167.61 71.3c.4.16.6.45.6.79 0 .44-.2.79-.6.96z" fill="#EA4335" />
                      <path d="M181.16 128.87l43.52-18.49c.89-.38 1.32-.98 1.32-1.74s-.43-1.36-1.32-1.74L181.16 88.4c-.4-.17-.8-.17-1.2 0l-37.96 37.96v4.54l37.96 37.96c.4.17.8.17 1.2 0z" fill="#FBBC04" />
                    </svg>
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] leading-tight text-white/85 font-semibold uppercase tracking-wider">Get it on</span>
                      <span className="font-bold text-xs leading-none">Google Play</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-black font-black text-xs tracking-widest uppercase">
                {lang === "fr" ? "BIENTÔT DISPONIBLE" : "COMING SOON"}
              </div>
            </div>
          </div>

          {/* Right Layered Mockup Column */}
          <div className="lg:col-span-6 relative flex justify-center items-center">
            {/* Underneath: Tablet Mockup */}
            <div className="w-full max-w-[480px] bg-white border border-stone-200 rounded-2xl shadow-2xl p-6 hidden sm:block relative -rotate-2 transform scale-95 origin-right">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
                <span className="text-xs font-bold text-[#0052A5] tracking-wider uppercase font-mono">AI OPEN HOUSE CONNECT ADMIN</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold">ONLINE</span>
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-stone-100 rounded w-1/3"></div>
                <div className="h-8 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between px-3 text-xs text-stone-500">
                  <span>Michael St. John Listing Active</span>
                  <span className="text-[#0052A5] font-bold">4 Clifton Downs Rd</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-1">
                  <div className="p-2.5 bg-[#0052A5]/5 rounded-xl border border-[#0052A5]/10 text-center">
                    <p className="text-[10px] text-stone-500 font-medium">Beds (plus)</p>
                    <p className="text-sm font-bold text-[#0052A5]">3+1 Rooms</p>
                  </div>
                  <div className="p-2.5 bg-[#0052A5]/5 rounded-xl border border-[#0052A5]/10 text-center">
                    <p className="text-[10px] text-stone-500 font-medium">In-Law Suite</p>
                    <p className="text-sm font-bold text-[#0052A5]">Yes (Separate)</p>
                  </div>
                  <div className="p-2.5 bg-[#0052A5]/5 rounded-xl border border-[#0052A5]/10 text-center">
                    <p className="text-[10px] text-stone-500 font-medium">Price (CAD)</p>
                    <p className="text-sm font-bold text-[#0052A5]">$1.19M</p>
                  </div>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-stone-500">
                    <span>FOLLOW UP BOSS SYNCING</span>
                    <span className="text-emerald-500 flex items-center gap-1">● READY</span>
                  </div>
                  <div className="h-1.5 bg-stone-200 rounded overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlapping Phone Mockup */}
            <div className="absolute top-10 sm:top-24 sm:-left-4 z-20 w-[270px] bg-slate-900 border-4 border-slate-800 rounded-[36px] shadow-2xl p-3 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="h-4 w-24 bg-slate-800 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-30"></div>
              <div className="bg-slate-950 rounded-[28px] overflow-hidden p-3 pt-6 text-white text-xs flex flex-col justify-between h-[420px]">
                <div className="border-b border-white/10 pb-2 mb-2 flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-bold text-slate-300">SORA TOUR</p>
                    <p className="text-[10px] font-bold text-emerald-400">4 Clifton Downs Rd</p>
                  </div>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-sans">
                  <div className="bg-slate-900/80 p-2.5 rounded-2xl rounded-tl-none border border-white/5 text-[10.5px] leading-snug">
                    "Welcome! I am Sora, your conversational guide for this beautiful Michael St. John property in Hamilton. Ready to explore?"
                  </div>
                  <div className="bg-[#0052A5] p-2.5 rounded-2xl rounded-tr-none text-[10.5px] ml-auto max-w-[85%] leading-snug">
                    "Tell me about the Ontario bedrooms convention and the in-law suite here."
                  </div>
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                  <div className="flex-1 bg-slate-900 rounded-full h-7 px-3 flex items-center text-[10px] text-slate-500">
                    Sora is speaking...
                  </div>
                  <div className="h-7 w-7 rounded-full bg-[#0052A5] flex items-center justify-center">
                    <Mic className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>



      {/* 4. Press Mention + Pull Quote */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="text-xs font-bold text-[#0052A5] tracking-widest uppercase">NEWS REVIEW</span>
          <p className="text-2xl sm:text-3xl font-bold italic text-[#111827] leading-relaxed">
            "{curr.pullQuote.quote}"
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-[#6B7280]">
            <span className="font-bold text-[#111827]">— {curr.pullQuote.author}</span>
            <span>|</span>
            <span>Canadian Real Estate Trends</span>
          </div>
        </div>
      </section>

      {/* 5. Featured In (Grayscale Logo Row) */}
      <div className="py-10 bg-[#3b82f6] text-center">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-bold text-white uppercase tracking-widest mb-8">{curr.press}</p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 text-white font-extrabold">
            <span className="text-white font-extrabold text-sm sm:text-base tracking-widest">INMAN NEWS</span>
            <span className="text-white font-extrabold text-sm sm:text-base tracking-widest">REM MAGAZINE</span>
            <span className="text-white font-extrabold text-sm sm:text-base tracking-widest">TECHCRUNCH</span>
            <span className="text-white font-extrabold text-sm sm:text-base tracking-widest">YAHOO! FINANCE</span>
            <span className="text-white font-extrabold text-sm sm:text-base tracking-widest">TORONTO STAR</span>
          </div>
        </div>
      </div>

      {/* Interactive Mockup Preview (Product Visual Section) */}
      <section id="product" className="py-24 bg-white px-6 scroll-mt-20">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-bold text-[#0052A5] tracking-widest uppercase">LIVE MOCKUP STAGE</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827]">
              {lang === "en" ? "Experience Sora's Natural Voice Firsthand" : "Découvrez en direct la voix naturelle de Sora"}
            </h2>
            <p className="text-[#6B7280] max-w-xl mx-auto">
              {lang === "en" 
                ? "Click any question below. Our simulation will load the corresponding room visual and guide you using Sora's female warm voice."
                : "Cliquez sur une question. Notre simulation chargera le visuel correspondant et vous guidera avec la voix chaleureuse de Sora."}
            </p>
          </div>

          <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl border border-stone-200 bg-stone-50 shadow-lg text-left relative overflow-hidden">
            <div className="grid md:grid-cols-12 gap-8 items-center">
              
              {/* Left: Device Simulator */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="w-[280px] h-[520px] bg-slate-950 rounded-[44px] p-3 shadow-2xl relative border-4 border-slate-800 overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-slate-800 rounded-b-2xl z-20 flex items-center justify-center">
                    <div className="h-1.5 w-12 bg-slate-900 rounded-full"></div>
                  </div>

                  {/* Audio Visual screen */}
                  <div className="flex-1 bg-slate-900 rounded-[32px] overflow-hidden flex flex-col justify-between relative pt-6 text-white text-xs select-none">
                    <div className="p-3 border-b border-white/5 bg-slate-950/80 backdrop-blur-md flex items-center justify-between">
                      <div>
                        <p className="text-[10.5px] font-bold text-slate-200">4 Clifton Downs Rd</p>
                        <p className="text-[8px] text-zinc-400">Hamilton, Ontario</p>
                      </div>
                      <span className="flex items-center gap-1 text-[8px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        SORA ACTIVE
                      </span>
                    </div>

                    {/* Room Media visualizer */}
                    <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                      <img 
                        src={
                          selectedMockupRoom === "living" 
                            ? "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=600"
                            : selectedMockupRoom === "kitchen"
                            ? "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600"
                            : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600"
                        } 
                        alt="Listing room" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                      <div className="absolute bottom-2 left-2 text-[9px] bg-slate-950/60 px-1.5 py-0.5 rounded uppercase font-semibold">
                        {selectedMockupRoom} view
                      </div>
                    </div>

                    {/* Dialogue log */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-2 max-h-[160px] text-[10px] leading-snug">
                      {mockupDialogue.map((chat, i) => (
                        <div 
                          key={i} 
                          className={`p-2 rounded-xl max-w-[90%] ${
                            chat.sender === "buyer" 
                              ? "bg-[#0052A5] text-white ml-auto rounded-tr-none" 
                              : "bg-slate-800 text-slate-100 mr-auto rounded-tl-none"
                          }`}
                        >
                          {chat.text.replace(/\[\w+\]/g, "")}
                        </div>
                      ))}
                    </div>

                    {/* Controls */}
                    <div className="p-3 border-t border-white/5 bg-slate-950/80 backdrop-blur-md flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {isMockupSpeaking ? (
                          <Button 
                            onClick={handleStopMockup}
                            size="icon" 
                            className="h-6 w-6 bg-rose-500 hover:bg-rose-600 rounded-full text-white"
                          >
                            <Square className="h-3 w-3" />
                          </Button>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center">
                            <Volume2 className="h-3 w-3 text-slate-400" />
                          </div>
                        )}
                        <span className="text-[9px] text-zinc-400 font-medium">
                          {isMockupSpeaking ? "Speaking..." : "Ready"}
                        </span>
                      </div>
                      
                      <div className="text-[9px] text-zinc-500 font-mono font-medium">
                        Kore Voice (EN/FR)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Triggers & Explicit Consent Checkbox */}
              <div className="md:col-span-7 space-y-6">
                <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-sm space-y-3">
                  <h4 className="text-sm font-bold text-[#111827]">
                    {lang === "en" ? "Explicit Buyer Consent Required" : "Consentement explicite obligatoire"}
                  </h4>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    {lang === "en" 
                      ? "Under PIPEDA and Quebec Law 25 regulations, buyers must give explicit, verifiable consent before voice transcriptions are recorded."
                      : "Sous les réglementations LPRPDE et Loi 25 du Québec, le consentement est requis avant d'entamer l'enregistrement."}
                  </p>
                  <label className="flex items-start gap-2.5 select-none pt-1">
                    <input 
                      type="checkbox" 
                      checked={consentChecked}
                      disabled
                      className="mt-0.5 rounded border-stone-300 text-[#0052A5] focus:ring-transparent h-4 w-4 cursor-not-allowed"
                    />
                    <span className="text-xs font-semibold text-[#111827]">
                      {lang === "en" 
                        ? "I consent to start the AI tour & log conversation metrics." 
                        : "Je consens à démarrer la visite et à enregistrer les données."}
                    </span>
                  </label>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider pl-1">
                    {lang === "en" ? "Select a buyer inquiry:" : "Sélectionnez une question :"}
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {simulatedQuestions.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => handleSimulatedQuestion(q)}
                        className={`text-left p-3 border border-stone-200 bg-white rounded-xl text-xs font-semibold transition-all hover:bg-[#0052A5]/5 hover:border-[#0052A5]/20 cursor-pointer ${
                          !consentChecked ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                      >
                        {lang === "en" ? q.label_en : q.label_fr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Listing Fact Sheet */}
                <div className="p-4 bg-[#0052A5]/5 border border-[#0052A5]/10 rounded-2xl space-y-2">
                  <p className="text-[11px] font-bold text-[#0052A5] uppercase tracking-wider font-mono">
                    {lang === "en" ? "Source Listing Fact Sheet" : "Fiche descriptive de la propriété"}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-stone-500">{lang === "en" ? "Address" : "Adresse"}</p>
                      <p className="font-bold text-[#111827]">{listingDetails.address}</p>
                    </div>
                    <div>
                      <p className="text-stone-500">{lang === "en" ? "Bedrooms" : "Chambres"}</p>
                      <p className="font-bold text-[#111827]">{listingDetails.beds} Beds</p>
                    </div>
                    <div>
                      <p className="text-stone-500">{lang === "en" ? "In-Law Suite" : "Suite parentale"}</p>
                      <p className="font-bold text-[#111827]">Separate Entrance</p>
                    </div>
                    <div>
                      <p className="text-stone-500">{lang === "en" ? "Price (CAD)" : "Prix (CAD)"}</p>
                      <p className="font-bold text-[#0052A5]">${listingDetails.price.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 6. Testimonial Carousel with Filter Tags */}
      <section className="py-24 bg-[#3b82f6] text-white px-6 border-y border-[#3b82f6]/50">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-blue-100 tracking-widest uppercase">TESTIMONIALS</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              {lang === "en" ? "Hear from top performers using Sora" : "Ils utilisent la technologie de Sora"}
            </h2>
            
            {/* Filter Tags */}
            <div className="flex justify-center items-center gap-2 pt-4">
              {["all", "agents", "brokers", "lenders"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTestimonialTab(tab as any); setActiveTestimonialIndex(0); }}
                  className={`text-xs font-bold px-4 py-2 rounded-full border transition-all hover:scale-105 active:scale-95 duration-200 ${
                    activeTestimonialTab === tab 
                      ? "bg-white border-white text-[#3b82f6]" 
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Testimonial slider view */}
          {(() => {
            const testimonialsList = [
              {
                type: "agents",
                quote_en: '"AI Open House Connect has completely streamlined how our team manages weekends. Visitors scan the QR, talk to Sora in their native language, and the conversation is pushed as notes straight into Follow Up Boss. It’s perfect."',
                quote_fr: '"AI Open House Connect a complètement simplifié la gestion de nos fins de semaine. Les visiteurs scannent le QR, discutent avec Sora, et la conversation est intégrée directement dans Follow Up Boss. C\'est parfait."',
                author: "Sarah Jenkins",
                role: "Senior Sales Associate, Pinegrove Realty Group • Hamilton, ON",
                initials: "SJ"
              },
              {
                type: "agents",
                quote_en: '"Having Sora act as our digital co-host at the front door is incredible. Our buyer lead quality has soared since using the secure offline kiosk tablet."',
                quote_fr: '"Avoir Sora comme co-hôte numérique à la porte d\'entrée est incroyable. La qualité de nos prospects a augmenté de façon exponentielle depuis l\'utilisation de la tablette de kiosque hors ligne sécurisée."',
                author: "David Chen",
                role: "Listing Specialist, Summit Real Estate Brokerage • Burlington, ON",
                initials: "DC"
              },
              {
                type: "brokers",
                quote_en: '"From a compliance standpoint, this platform is a game-changer. It enforces RECO-aligned templates and captures liability waivers, protecting our brokerage perfectly on every open house transaction."',
                quote_fr: '"Du point de vue de la conformité, cette plateforme change la donne. Elle applique des modèles conformes à la RECO et enregistre les décharges de responsabilité, protégeant notre courtage sur chaque transaction de visite libre."',
                author: "Robert St. John",
                role: "Managing Broker, Michael St. John Realty • Hamilton, ON",
                initials: "RS"
              },
              {
                type: "brokers",
                quote_en: '"The ability to enforce organization-wide routing policies and paired lender overrides gives our regional offices ultimate authority while keeping all compliance logs pristine."',
                quote_fr: '"La capacité d\'appliquer des politiques d\'acheminement à l\'échelle de l\'organisation et des dérogations pour les prêteurs partenaires donne à nos bureaux régionaux une autorité ultime tout en conservant des registres de conformité parfaits."',
                author: "Eleanor Vance",
                role: "Principal Broker, Vanguard Real Estate • Hamilton, ON",
                initials: "EV"
              },
              {
                type: "lenders",
                quote_en: '"The Consent Gate ensures we only receive leads who actively requested mortgage assistance. This transparent buyer opt-in system has tripled our pre-qualification rates."',
                quote_fr: '"La barrière de consentement garantit que nous ne recevons que des prospects ayant activement demandé une aide hypothécaire. Ce système transparent a triplé nos taux de préqualification."',
                author: "Marcus Brody",
                role: "Senior Mortgage Planner, Maplewood Mortgage Solutions • Toronto, ON",
                initials: "MB"
              },
              {
                type: "lenders",
                quote_en: '"With absolute compliance and direct lender routing rules, we have built a highly reliable partnership with our local real estate teams. A must-have B2B real estate integration."',
                quote_fr: '"Grâce à une conformité absolue et à des règles de transmission directe des prêteurs, nous avons établi un partenariat très fiable avec nos équipes immobilières locales. Une intégration B2B indispensable."',
                author: "Fiona Gallagher",
                role: "VP of Business Development, Dominion Lending Group • Vancouver, BC",
                initials: "FG"
              }
            ];

            const filtered = activeTestimonialTab === "all" 
              ? testimonialsList 
              : testimonialsList.filter(item => item.type === activeTestimonialTab);

            const activeIdx = activeTestimonialIndex % filtered.length;
            const current = filtered[activeIdx] || testimonialsList[0];

            return (
              <div className="max-w-3xl mx-auto bg-[#3b82f6] border border-blue-400 rounded-3xl p-8 sm:p-10 shadow-lg relative flex flex-col justify-between min-h-[280px]">
                <div className="space-y-6 text-white">
                  <p className="text-lg sm:text-xl text-white font-medium leading-relaxed italic">
                    {lang === "en" ? current.quote_en : current.quote_fr}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
                      {current.initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{current.author}</h4>
                      <p className="text-xs text-blue-100">{current.role}</p>
                    </div>
                  </div>
                </div>

                {filtered.length > 1 && (
                  <div className="flex justify-between items-center mt-6 pt-6 border-t border-blue-400">
                    <div className="flex gap-1.5">
                      {filtered.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveTestimonialIndex(idx)}
                          className={`h-2 w-2 rounded-full transition-all ${
                            activeIdx === idx ? "bg-white w-4" : "bg-white/30"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTestimonialIndex((prev) => (prev - 1 + filtered.length) % filtered.length)}
                        className="p-1.5 border border-blue-400 rounded-full hover:bg-white/10 transition-colors text-white hover:scale-110 active:scale-95 duration-200"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setActiveTestimonialIndex((prev) => (prev + 1) % filtered.length)}
                        className="p-1.5 border border-blue-400 rounded-full hover:bg-white/10 transition-colors text-white hover:scale-110 active:scale-95 duration-200"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </section>

      {/* 7. Six Alternating Feature Sections (Question-format H2s) */}
      <section id="features" className="py-24 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 space-y-32">
          
          {/* Section Heading */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#0052A5] tracking-widest uppercase">THE COHESIVE MOAT</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827]">
              {lang === "en" ? "Designed for how buyers actually tour homes today." : "Conçu pour la réalité des acheteurs d'aujourd'hui."}
            </h2>
          </div>

          {/* Feature 1 */}
          <div className="grid md:grid-cols-12 gap-12 items-center bg-[#3b82f6] text-white p-8 sm:p-12 rounded-3xl shadow-xl">
            <div className="md:col-span-6 space-y-6 text-left">
              <span className="text-xs font-extrabold text-blue-100 uppercase font-mono">01 / REGISTRATION KIOSK</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {curr.features.question1}
              </h3>
              <p className="text-blue-50/90 text-base leading-relaxed">
                {curr.features.answer1}
              </p>
            </div>
            <div className="md:col-span-6 bg-white rounded-2xl p-6 h-[250px] flex items-center justify-center text-[#111827] shadow-lg">
              <div className="space-y-3 text-center w-full max-w-xs">
                <span className="text-[11px] bg-red-500/10 text-rose-600 px-2.5 py-1 rounded-full font-bold">LOCAL OFFLINE QUEUE</span>
                <p className="text-xs font-bold text-[#111827]">"Local Cache Sync Pending: 4 leads"</p>
                <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-3/4"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: AI Tour RIGHT AFTER sign-in to show the value immediately */}
          <div className="grid md:grid-cols-12 gap-12 items-center md:flex-row-reverse">
            <div className="md:col-span-6 md:order-2 space-y-6 text-left">
              <span className="text-xs font-extrabold text-[#0052A5] uppercase font-mono">02 / INTERACTIVE AI TOUR</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#111827] leading-tight">
                {curr.features.question2}
              </h3>
              <p className="text-[#6B7280] text-base leading-relaxed">
                {curr.features.answer2}
              </p>
            </div>
            <div className="md:col-span-6 md:order-1 bg-stone-50 border border-stone-200 rounded-3xl p-6 h-[250px] flex items-center justify-center">
              <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-md border border-stone-150">
                <div className="h-12 w-12 rounded-full bg-[#0052A5]/10 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-[#0052A5]" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Sora Warm Female Voice</p>
                  <p className="text-sm font-extrabold text-[#111827]">Sora Classic Profile Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Compliance */}
          <div className="grid md:grid-cols-12 gap-12 items-center bg-[#3b82f6] text-white p-8 sm:p-12 rounded-3xl shadow-xl">
            <div className="md:col-span-6 space-y-6 text-left">
              <span className="text-xs font-extrabold text-blue-100 uppercase font-mono">03 / COMPLIANCE & PRIVACY</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {curr.features.question3}
              </h3>
              <p className="text-blue-50/90 text-base leading-relaxed">
                {curr.features.answer3}
              </p>
            </div>
            <div className="md:col-span-6 bg-white rounded-2xl p-6 h-[250px] flex items-center justify-center text-[#111827] shadow-lg">
              <div className="space-y-2 text-center">
                <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-[#111827]">PIPEDA + Law 25 Compliant</p>
                <p className="text-xs text-stone-500">Transcripts secure. Explicit consent required.</p>
              </div>
            </div>
          </div>

          {/* Feature 4: Lenders */}
          <div className="grid md:grid-cols-12 gap-12 items-center md:flex-row-reverse">
            <div className="md:col-span-6 md:order-2 space-y-6 text-left">
              <span className="text-xs font-extrabold text-[#0052A5] uppercase font-mono">04 / INTEGRATED LENDERS</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#111827] leading-tight">
                {curr.features.question4}
              </h3>
              <p className="text-[#6B7280] text-base leading-relaxed">
                {curr.features.answer4}
              </p>
            </div>
            <div className="md:col-span-6 md:order-1 bg-stone-50 border border-stone-200 rounded-3xl p-6 h-[250px] flex items-center justify-center">
              <div className="p-4 bg-white rounded-2xl shadow-md border border-stone-150 max-w-xs space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#111827]">Mortgage Interest Opt-in</span>
                  <span className="text-emerald-500 font-bold">YES</span>
                </div>
                <div className="h-px bg-stone-100"></div>
                <p className="text-[10px] text-stone-500">Auto-routes lead directly to paired lenders queue.</p>
              </div>
            </div>
          </div>

          {/* Feature 5: Branding */}
          <div className="grid md:grid-cols-12 gap-12 items-center bg-[#3b82f6] text-white p-8 sm:p-12 rounded-3xl shadow-xl">
            <div className="md:col-span-6 space-y-6 text-left">
              <span className="text-xs font-extrabold text-blue-100 uppercase font-mono">05 / BRANDING CONTROL</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {curr.features.question5}
              </h3>
              <p className="text-blue-50/90 text-base leading-relaxed">
                {curr.features.answer5}
              </p>
            </div>
            <div className="md:col-span-6 bg-white rounded-2xl p-6 h-[250px] flex items-center justify-center text-[#111827] shadow-lg">
              <div className="text-center space-y-2">
                <div className="font-bold text-[#0052A5] uppercase tracking-widest text-sm">MICHAEL ST. JOHN</div>
                <p className="text-xs text-stone-500">Accent Color: #0052A5</p>
                <span className="text-[10px] border border-stone-200 px-2 py-0.5 rounded text-stone-500">MLS Unbranded available</span>
              </div>
            </div>
          </div>

          {/* Feature 6: CRM */}
          <div className="grid md:grid-cols-12 gap-12 items-center md:flex-row-reverse">
            <div className="md:col-span-6 md:order-2 space-y-6 text-left">
              <span className="text-xs font-extrabold text-[#0052A5] uppercase font-mono">06 / FOLLOW UP BOSS CRM</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#111827] leading-tight">
                {curr.features.question6}
              </h3>
              <p className="text-[#6B7280] text-base leading-relaxed">
                {curr.features.answer6}
              </p>
            </div>
            <div className="md:col-span-6 md:order-1 bg-stone-50 border border-stone-200 rounded-3xl p-6 h-[250px] flex items-center justify-center">
              <div className="space-y-3 w-full max-w-xs">
                <div className="p-3 bg-white border border-stone-200 rounded-xl shadow-sm text-xs font-bold text-[#111827] flex justify-between">
                  <span>Follow Up Boss Integration</span>
                  <span className="text-[#0052A5]">Active</span>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-[10.5px] font-semibold text-center">
                  Tags added: fub-mortgage-interest
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 8. Brokerage Templates SEO Grid */}
      <section className="py-24 bg-[#3b82f6] text-white border-y border-[#3b82f6]/50 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-blue-100 tracking-widest uppercase">COMPLIANCE & ORGANIZATIONS</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              {lang === "en" ? "SEO Brokerage Listing Templates" : "Modèles SEO de fiches immobilières"}
            </h2>
            <p className="text-blue-50/90 max-w-xl mx-auto text-sm">
              {lang === "en" ? (
                <>
                  Perfectly customized layouts compliant with RECO standards.
                  <br />
                  Search or deploy yours instantly.
                </>
              ) : (
                "Des mises en page entièrement personnalisées et conformes aux normes d'Ontario. Déployez le vôtre en quelques secondes."
              )}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Michael St. Jean Realty",
              "RE/MAX Escarpment",
              "Royal LePage State",
              "Sotheby's International",
              "Century 21 Canada",
              "Keller Williams Complete"
            ].map((br, idx) => (
              <div key={idx} className="bg-white text-[#111827] border border-stone-200 rounded-2xl p-6 shadow-md hover:shadow-2xl hover:scale-105 active:scale-95 duration-300 transition-all transform cursor-pointer space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[#0052A5] tracking-wider uppercase">Ontario Template</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">RECO Compliant</span>
                </div>
                <h4 className="font-bold text-[#111827] text-base">{br}</h4>
                <p className="text-xs text-[#6B7280] leading-normal">
                  Pre-mapped branding configurations, unbranded virtual tours, and automated mortgage routing rules.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8.5 FAQ Section */}
      <section id="faq" className="py-24 bg-slate-900 text-white border-y border-slate-800 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-blue-400 tracking-widest uppercase bg-blue-500/10 px-3.5 py-1.5 rounded-full border border-blue-500/20 inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              {lang === "en" ? "KNOWLEDGE BASE & SUPPORT" : "BASE DE CONNAISSANCES ET SUPPORT"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {lang === "en" ? "Frequently Asked Questions" : "Foire aux Questions"}
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              {lang === "en" 
                ? "Everything you need to know about solo agent safety, Sora AI audio tours, tablet kiosks, and CRM integrations."
                : "Tout ce que vous devez savoir sur la sécurité des agents, les visites vocales IA, les kiosques et les CRM."}
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              {
                q: lang === "en" ? "What are the 'CHECKIN AGENT' and 'SAVE LOGS' buttons for?" : "À quoi servent les boutons 'CHECKIN AGENT' et 'SAVE LOGS' ?",
                a: lang === "en" 
                  ? "These controls are part of our Solo-Agent Safety System. Clicking 'CHECKIN AGENT' confirms you are safe on-site and resets your check-in timer. If you fail to check in before the event ends, an emergency protocol pings designated contacts. 'SAVE LOGS' archives timestamped location logs and visitor audit trails to Firestore."
                  : "Ces commandes font partie de notre système de sécurité. Cliquer sur 'CHECKIN AGENT' confirme votre sécurité. 'SAVE LOGS' me dans les archives les journaux d'audit de localisation et de visiteurs."
              },
              {
                q: lang === "en" ? "How does the 'Send Sora Follow-Up Email' feature work?" : "Comment fonctionne l'envoi de courriels de suivi Sora ?",
                a: lang === "en"
                  ? "Inside your Guest Visitor Roster, Sora analyzes the exact voice questions visitors asked during their tour (kitchen, master suite, HOA fees) and their mortgage consent status. Sora automatically generates a tailored follow-up email draft with 1-click re-drafting and instant sending."
                  : "Dans votre liste de visiteurs, Sora analyse les questions vocales posées pendant la visite et génère un modèle de suivi personnalisé."
              },
              {
                q: lang === "en" ? "Can I sign visitors in if the property has no Wi-Fi?" : "Puis-je inscrire des visiteurs sans Wi-Fi ?",
                a: lang === "en"
                  ? "Yes! Our Offline Event Buffer automatically caches guest sign-ins locally when internet connectivity is weak or absent. Once Wi-Fi or cellular data restores, all leads automatically sync to Firestore and your connected CRM."
                  : "Oui ! Notre tampon d'événement hors ligne enregistre automatiquement les inscriptions localement."
              },
              {
                q: lang === "en" ? "How do I re-import MLS listing data or trigger 'Go Live'?" : "Comment réimporter les données MLS ou publier ?",
                a: lang === "en"
                  ? "In Step 2 of the Edit Listing Dashboard, click 'Re-Import Listing Data' to refresh MLS specs and descriptions. If a draft listing is pending for over 24 hours, an automated 'Go Live' reminder lets you publish in 1 click."
                  : "Dans l'étape 2 du tableau de bord de modification, cliquez sur 'Réimporter les données MLS' pour actualiser les spécifications."
              },
              {
                q: lang === "en" ? "What is the Lender Consent Gate?" : "Qu'est-ce que la porte de consentement du prêteur ?",
                a: lang === "en"
                  ? "To satisfy PIPEDA and RESPA co-marketing compliance, visitors must explicitly check an opt-in box ('Would you like information on financing options?') for their contact info to route to your paired lender."
                  : "Pour respecter la conformité, les visiteurs doivent cocher une case d'autorisation explicite pour transmettre leurs coordonnées au prêteur."
              }
            ].map((faq, idx) => {
              const isOpen = !!openFaqIndices[idx];
              return (
                <div 
                  key={idx}
                  className="border border-slate-800 rounded-2xl bg-slate-950/60 overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndices(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <span className="font-bold text-white text-sm md:text-base flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">Q</span>
                      {faq.q}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-400" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 text-xs md:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 mt-2 pt-3 pl-14">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center pt-4">
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs md:text-sm transition-all duration-200 shadow-lg hover:scale-105"
            >
              <span>{lang === "en" ? "View Full FAQ & Knowledge Base Page" : "Consulter la page FAQ complète"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Final CTA Band */}
      <section id="pricing" className="py-24 bg-[#0B1220] text-center px-6 text-white relative">
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <span className="text-xs font-bold text-[#0052A5] tracking-widest uppercase bg-[#0052A5]/10 px-3 py-1 rounded-full border border-[#0052A5]/30">
            {lang === "en" ? "GET STARTED TODAY" : "COMMENCER DÈS AUJOURD'HUI"}
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            {lang === "en" ? "Give every listing a better tour experience today" : "Offrez une meilleure visite pour chaque propriété"}
          </h2>
          <p className="text-stone-400 max-w-xl mx-auto text-base sm:text-lg">
            {lang === "en"
              ? "Join top Canadian real estate brokerages. Deploy Sora as your smart on-demand open house host."
              : "Rejoignez les meilleurs courtiers immobiliers canadiens. Déployez Sora pour vos visites libres."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={() => setIsDemoModalOpen(true)}
              size="lg"
              className="w-full sm:w-auto h-14 px-8 bg-[#0052A5] hover:bg-[#004185] text-white font-bold rounded-xl text-base border-2 border-white hover:scale-105 active:scale-95 transition-all duration-200 shadow-md cursor-pointer"
            >
              {lang === "en" ? "Book a Demo" : "Réserver une démo"}
            </Button>
            <Link 
              to="/register"
              className="w-full sm:w-auto h-14 px-8 inline-flex items-center justify-center bg-transparent border-2 border-white text-white hover:bg-stone-900 font-bold rounded-xl text-base hover:scale-105 active:scale-95 transition-all duration-200 shadow-md"
            >
              {lang === "en" ? "Get Started Free" : "Commencer gratuitement"}
            </Link>
          </div>
        </div>
      </section>

      {/* 11. Custom Validated Demo Booking Modal */}
      <Dialog open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#111827]">
              {lang === "en" ? "Schedule a Custom AI Tour Demo" : "Planifier une démo personnalisée"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              {lang === "en" 
                ? "Provide your details. Our system uses strict validation to confirm agent credentials."
                : "Saisissez vos informations. Notre système utilise une validation stricte."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBookingSubmit} className="space-y-4 pt-2 text-left">
            
            {/* Full Name field with Capitalization validation */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#111827]">
                {lang === "en" ? "Full Name" : "Nom complet"} <span className="text-[#0052A5]">*</span>
              </Label>
              <Input 
                value={bookingForm.name}
                onChange={(e) => {
                  const val = e.target.value;
                  const formatted = val.replace(/\b\w/g, char => char.toUpperCase());
                  setBookingForm(prev => ({ ...prev, name: formatted }));
                  if (bookingTouched.name) validateBookingField("name", formatted);
                }}
                onBlur={() => {
                  const formatted = bookingForm.name.replace(/\b\w/g, char => char.toUpperCase()).trim().replace(/\s+/g, " ");
                  setBookingForm(prev => ({ ...prev, name: formatted }));
                  setBookingTouched(prev => ({ ...prev, name: true }));
                  validateBookingField("name", formatted);
                }}
                placeholder="e.g. Michael Jean"
                className="rounded-xl border-stone-200 text-sm h-11"
              />
              {bookingTouched.name && bookingErrors.name && !bookingErrors.name.isValid && (
                <p className="text-xs text-rose-600 font-medium pl-1">{bookingErrors.name.errorMessage}</p>
              )}
            </div>

            {/* Email field */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#111827]">
                {lang === "en" ? "Email Address" : "Adresse courriel"} <span className="text-[#0052A5]">*</span>
              </Label>
              <Input 
                type="email"
                value={bookingForm.email}
                onChange={(e) => {
                  setBookingForm(prev => ({ ...prev, email: e.target.value }));
                  if (bookingTouched.email) validateBookingField("email", e.target.value);
                }}
                onBlur={() => {
                  setBookingTouched(prev => ({ ...prev, email: true }));
                  validateBookingField("email", bookingForm.email);
                }}
                placeholder="agent@example.com"
                className="rounded-xl border-stone-200 text-sm h-11"
              />
              {bookingTouched.email && bookingErrors.email && !bookingErrors.email.isValid && (
                <p className="text-xs text-rose-600 font-medium pl-1">{bookingErrors.email.errorMessage}</p>
              )}
            </div>

            {/* Phone field */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#111827]">
                {lang === "en" ? "Phone Number" : "Numéro de téléphone"} <span className="text-[#0052A5]">*</span>
              </Label>
              <Input 
                value={bookingForm.phone}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setBookingForm(prev => ({ ...prev, phone: formatted }));
                  if (bookingTouched.phone) validateBookingField("phone", formatted);
                }}
                onBlur={() => {
                  setBookingTouched(prev => ({ ...prev, phone: true }));
                  validateBookingField("phone", bookingForm.phone);
                }}
                placeholder="(289) 659-2541"
                className="rounded-xl border-stone-200 text-sm h-11"
              />
              {bookingTouched.phone && bookingErrors.phone && !bookingErrors.phone.isValid && (
                <p className="text-xs text-rose-600 font-medium pl-1">{bookingErrors.phone.errorMessage}</p>
              )}
            </div>

            {/* Website starting with https:// */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#111827]">
                {lang === "en" ? "Brokerage Website" : "Site web d'agence"} <span className="text-[#0052A5]">*</span>
              </Label>
              <Input 
                value={bookingForm.website}
                onChange={(e) => {
                  setBookingForm(prev => ({ ...prev, website: e.target.value }));
                  if (bookingTouched.website) validateBookingField("website", e.target.value);
                }}
                onBlur={() => {
                  setBookingTouched(prev => ({ ...prev, website: true }));
                  validateBookingField("website", bookingForm.website);
                }}
                placeholder="https://www.michaelstjean.com"
                className="rounded-xl border-stone-200 text-sm h-11"
              />
              {bookingTouched.website && bookingErrors.website && !bookingErrors.website.isValid && (
                <p className="text-xs text-rose-600 font-medium pl-1">{bookingErrors.website.errorMessage}</p>
              )}
            </div>

            {/* Comments / Details */}
            <div className="space-y-1.5 relative">
              <Label className="text-xs font-semibold text-[#111827]">
                {lang === "en" ? "Tour Requirements" : "Exigences de visite"}
              </Label>
              <textarea 
                value={bookingForm.details}
                onChange={(e) => {
                  const val = e.target.value;
                  const capitalized = val.slice(0, 1).toUpperCase() + val.slice(1);
                  const limited = capitalized.slice(0, 1000);
                  setBookingForm(prev => ({ ...prev, details: limited }));
                }}
                placeholder={lang === "en" ? "Enter property detail notes..." : "Saisissez les notes de propriété..."}
                rows={3}
                className="w-full rounded-xl border border-stone-200 p-3 pr-4 pb-8 text-sm focus:outline-none focus:ring-1 focus:ring-[#0052A5]"
              />
              <div className="absolute bottom-2 right-3 text-[10px] text-slate-400 font-mono pointer-events-none">
                {bookingForm.details.length} / 1,000
              </div>
            </div>

            <Button 
              type="submit"
              disabled={isSubmittingBooking}
              className="w-full bg-[#0052A5] hover:bg-[#004185] text-white font-bold h-11 rounded-xl transition-all hover:scale-[1.02] active:scale-95 duration-200 cursor-pointer shadow-md"
            >
              {isSubmittingBooking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                lang === "en" ? "Request Live Pilot Access" : "Demander un accès pilote"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

    </PublicLayout>
  );
}
