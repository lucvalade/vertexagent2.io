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
  Square
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, logout } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function PublicSite() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const navDrawerRef = useRef<HTMLElement>(null);
  
  // Demo Booking state
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({ name: "", email: "", phone: "", website: "", details: "" });
  const [bookingErrors, setBookingErrors] = useState<Record<string, { field: string; isValid: boolean; errorMessage: string }>>({});
  const [bookingTouched, setBookingTouched] = useState<Record<string, boolean>>({});
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      const timer = setTimeout(() => {
        const firstLink = navDrawerRef.current?.querySelector("a") as HTMLElement;
        firstLink?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (!navDrawerRef.current) return;
      const focusableElements = navDrawerRef.current.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [mobileMenuOpen]);

  // FAQ state
  const [openFaqIndices, setOpenFaqIndices] = useState<Record<number, boolean>>({
    0: true, // first open by default
  });

  const toggleFaq = (index: number) => {
    setOpenFaqIndices(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Interactive Phone Mockup states
  const [selectedMockupRoom, setSelectedMockupRoom] = useState<"living" | "kitchen" | "exterior">("living");
  const [mockupDialogue, setMockupDialogue] = useState<Array<{ sender: "buyer" | "sora"; text: string }>>([
    { sender: "sora", text: "[slow] Hi, I’m Sora, your AI property assistant. [pause] Welcome to this open house experience. [pause] Tap any buyer question button below to ask me anything about materials, school catchments, or structural features!" }
  ]);
  const [isMockupSpeaking, setIsMockupSpeaking] = useState(false);
  const [isMockupPaused, setIsMockupPaused] = useState(false);
  const mockupAudioRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechSessionIdRef = useRef(0);
  const mockupAudioTimeoutRef = useRef<any>(null);

  // -------------------------------------------------------------
  // CRITICAL: Sora Premium Female Audio Voice Selector / Cache
  // This logic is designed to prevent robotic/fallback male voices (like Microsoft David) from hijacking the experience.
  // It checks for high-quality female voices (Samantha on Apple, Zira on Windows, Hazel, English Female profiles) 
  // and caches the choice once so it persists perfectly across all visitor interactions.
  // -------------------------------------------------------------
  const [soraFemaleVoice, setSoraFemaleVoice] = useState<SpeechSynthesisVoice | null>(null);

  const selectSoraFemaleVoiceOnce = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Strict prioritizing to ensure a premium female warmth is used:
    const matchedVoice =
      voices.find(v => v.name.toLowerCase().includes("samantha")) ||
      voices.find(v => v.name.toLowerCase().includes("zira")) ||
      voices.find(v => v.name.toLowerCase().includes("hazel")) ||
      voices.find(v => {
        const name = v.name.toLowerCase();
        return name.includes("sora") && !name.includes("male");
      }) ||
      voices.find(v => {
        const name = v.name.toLowerCase();
        return name.includes("google us english") && !name.includes("male");
      }) ||
      voices.find(v => {
        const name = v.name.toLowerCase();
        return (name.includes("female") || name.includes("woman") || name.includes("girl") || name.includes("susan") || name.includes("karen") || name.includes("tessa") || name.includes("victoria")) && !name.includes("male");
      }) ||
      voices.find(v => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        return lang.startsWith("en") && !name.includes("male") && !name.includes("david") && !name.includes("george") && !name.includes("ravi") && !name.includes("mark") && !name.includes("shawn") && !name.includes("daniel");
      }) ||
      voices[0]; // If absolutely no other options are found

    return matchedVoice;
  };

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Try primary resolve
    const v = selectSoraFemaleVoiceOnce();
    if (v) setSoraFemaleVoice(v);

    // Some browsers populate speech voices asynchronously
    const handleVoicesChanged = () => {
      const vSec = selectSoraFemaleVoiceOnce();
      if (vSec) setSoraFemaleVoice(vSec);
    };

    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    };
  }, []);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const mockupDetails = {
    living: {
      image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=600",
      title: "Royal Living Room",
      spec: "650 sqft • Double Fireplace • 12ft Ceilings",
    },
    kitchen: {
      image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600",
      title: "Chef's Kitchen",
      spec: "400 sqft • Quartz Countertops • Sub-Zero Suite",
    },
    exterior: {
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600",
      title: "Zen Canyon View Patio",
      spec: "1,200 sqft • Saltwater Infinity Pool • Firepit",
    }
  };

  const simulatedQuestions = [
    {
      id: "materials",
      label: "What premium materials were used?",
      response: "The foundation uses premium architectural carbon-braced concrete paired with structural solid walnut paneling. Thermally fractured insulated floor-to-ceiling glass wraps the living area for maximum energy efficiency.",
      room: "living" as const
    },
    {
      id: "schools",
      label: "What are the school ratings?",
      response: "This pocket is assigned to Canyon Heights Academy and Summit Collegiate, both boasting stellar Academic Performance ratings of 9.2/10 and fully integrated IB modern programs.",
      room: "exterior" as const
    },
    {
      id: "layout",
      label: "Is there an open kitchen layout?",
      response: "Absolutely. The kitchen integrates fully with the open-plan grand salon. A massive central quartz island functions as the culinary hub, featuring a discrete layout and sub-zero custom appliances.",
      room: "kitchen" as const
    }
  ];

  const handlePauseMockup = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsMockupPaused(true);
    }
  };

  const handleResumeMockup = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setIsMockupPaused(false);
    }
  };

  const handleStopMockup = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      speechSessionIdRef.current++;
      if (mockupAudioTimeoutRef.current) {
        clearTimeout(mockupAudioTimeoutRef.current);
        mockupAudioTimeoutRef.current = null;
      }
      setIsMockupSpeaking(false);
      setIsMockupPaused(false);
    }
  };

  const speakMockupWithPauses = (fullText: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    
    // Invalidate any active session and cancel the speaker
    window.speechSynthesis.cancel();
    if (mockupAudioTimeoutRef.current) {
      clearTimeout(mockupAudioTimeoutRef.current);
      mockupAudioTimeoutRef.current = null;
    }
    
    speechSessionIdRef.current++;
    const currentSessionId = speechSessionIdRef.current;

    setIsMockupSpeaking(true);
    setIsMockupPaused(false);

    const listChunks = fullText.split("[pause]");
    let chunkIndex = 0;

    const speakNextChunk = () => {
      if (currentSessionId !== speechSessionIdRef.current) {
        return;
      }

      if (chunkIndex >= listChunks.length) {
        setIsMockupSpeaking(false);
        setIsMockupPaused(false);
        return;
      }

      const rawChunk = listChunks[chunkIndex];
      const isSlowAction = rawChunk.includes("[slow]");
      let cleanChunk = rawChunk.replace(/\[\w+\]/g, "").trim();

      if (!cleanChunk) {
        mockupAudioTimeoutRef.current = setTimeout(() => {
          if (currentSessionId === speechSessionIdRef.current) {
            chunkIndex++;
            speakNextChunk();
          }
        }, 1200);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanChunk);
      
      // Steady, elegant, unhurried speed
      utterance.rate = isSlowAction ? 0.82 : 0.88;
      utterance.pitch = 1.0;

      const activeVoice = soraFemaleVoice || selectSoraFemaleVoiceOnce();
      if (activeVoice) {
        utterance.voice = activeVoice;
      }

      utterance.onend = () => {
        if (currentSessionId !== speechSessionIdRef.current) {
          return;
        }
        chunkIndex++;
        if (chunkIndex < listChunks.length) {
          mockupAudioTimeoutRef.current = setTimeout(() => {
            if (currentSessionId === speechSessionIdRef.current) {
              speakNextChunk();
            }
          }, 1200);
        } else {
          setIsMockupSpeaking(false);
          setIsMockupPaused(false);
        }
      };

      utterance.onerror = () => {
        if (currentSessionId === speechSessionIdRef.current) {
          setIsMockupSpeaking(false);
          setIsMockupPaused(false);
        }
      };

      mockupAudioRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    speakNextChunk();
  };

  const handleSimulatedQuestion = (q: typeof simulatedQuestions[0]) => {
    handleStopMockup();

    setSelectedMockupRoom(q.room);
    
    // Add dialogue
    setMockupDialogue(prev => [
      ...prev,
      { sender: "buyer", text: q.label },
    ]);

    setIsMockupSpeaking(true);

    setTimeout(() => {
      setMockupDialogue(prev => [
        ...prev,
        { sender: "sora", text: q.response }
      ]);

      speakMockupWithPauses(q.response);
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Validate single field using requested tracking format
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
        } else {
          const firstWordValid = /^[A-Z]/.test(parts[0]);
          const lastWordValid = /^[A-Z]/.test(parts[parts.length - 1]);
          if (!firstWordValid || !lastWordValid) {
            isValid = false;
            errorMessage = "Please enter a full name with the first letter of the first and last name capitalized.";
          }
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
          errorMessage = "Please enter a valid email address that includes @.";
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
          errorMessage = "Please enter a valid phone number in this format: (289) 659-2541.";
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
    } else if (field === "details") {
      const trimmed = value.trim();
      if (!trimmed) {
        isValid = false;
        errorMessage = "Details are required.";
      } else if (trimmed.length > 1000) {
        isValid = false;
        errorMessage = "Please start the details with a capital letter and keep the text under 1,000 characters.";
      } else if (!/^[A-Z]/.test(trimmed)) {
        isValid = false;
        errorMessage = "Please start the details with a capital letter and keep the text under 1,000 characters.";
      }
    }

    setBookingErrors(prev => ({
      ...prev,
      [field]: { field, isValid, errorMessage }
    }));

    return isValid;
  };

  const handleBookingNameChange = (val: string) => {
    const words = val.split(" ");
    const capitalized = words.map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : "").join(" ");
    setBookingForm(prev => ({ ...prev, name: capitalized }));
    if (bookingTouched.name) {
      validateBookingField("name", capitalized);
    }
  };

  const handleBookingEmailChange = (val: string) => {
    setBookingForm(prev => ({ ...prev, email: val }));
    if (bookingTouched.email) {
      validateBookingField("email", val);
    }
  };

  const handleBookingPhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    let formatted = "";
    if (digits.length > 0) {
      formatted += "(" + digits.slice(0, 3);
    }
    if (digits.length >= 3) {
      formatted += ") ";
    }
    if (digits.length > 3) {
      formatted += digits.slice(3, 6);
    }
    if (digits.length >= 6) {
      formatted += "-";
    }
    if (digits.length > 6) {
      formatted += digits.slice(6, 10);
    }
    setBookingForm(prev => ({ ...prev, phone: formatted }));
    if (bookingTouched.phone) {
      validateBookingField("phone", formatted);
    }
  };

  const handleBookingWebsiteChange = (val: string) => {
    setBookingForm(prev => ({ ...prev, website: val }));
    if (bookingTouched.website) {
      validateBookingField("website", val);
    }
  };

  const handleBookingDetailsChange = (val: string) => {
    if (val.length > 1000) {
      val = val.slice(0, 1000);
    }
    let formatted = val;
    if (val.length > 0) {
      formatted = val.charAt(0).toUpperCase() + val.slice(1);
    }
    setBookingForm(prev => ({ ...prev, details: formatted }));
    if (bookingTouched.details) {
      validateBookingField("details", formatted);
    }
  };

  const isBookingFormValid = () => {
    const cleanedName = bookingForm.name.trim().replace(/\s+/g, " ");
    const nameParts = cleanedName.split(" ");
    const isNameValid = nameParts.length >= 2 && /^[A-Z]/.test(nameParts[0]) && /^[A-Z]/.test(nameParts[nameParts.length - 1]);

    const emailTrimmed = bookingForm.email.trim();
    const isEmailValid = emailTrimmed.includes("@") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);

    const isPhoneValid = /^\(\d{3}\) \d{3}-\d{4}$/.test(bookingForm.phone);

    const websiteTrimmed = bookingForm.website.trim();
    const isWebsiteValid = websiteTrimmed.startsWith("https://") && /^https:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9.\/?=&%#_:-]+$/.test(websiteTrimmed);

    const detailsTrimmed = bookingForm.details.trim();
    const isDetailsValid = detailsTrimmed.length > 0 && detailsTrimmed.length <= 1000 && /^[A-Z]/.test(detailsTrimmed);

    return isNameValid && isEmailValid && isPhoneValid && isWebsiteValid && isDetailsValid;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields touched
    const touchedAll = { name: true, email: true, phone: true, website: true, details: true };
    setBookingTouched(touchedAll);

    // Validate all fields
    const isNameValid = validateBookingField("name", bookingForm.name);
    const isEmailValid = validateBookingField("email", bookingForm.email);
    const isPhoneValid = validateBookingField("phone", bookingForm.phone);
    const isWebsiteValid = validateBookingField("website", bookingForm.website);
    const isDetailsValid = validateBookingField("details", bookingForm.details);

    if (!isNameValid || !isEmailValid || !isPhoneValid || !isWebsiteValid || !isDetailsValid) {
      toast.error("Please correct the errors in the booking form before submitting.");
      return;
    }

    const words = bookingForm.name.trim().split(" ");
    const formattedName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    setIsSubmittingBooking(true);
    try {
      // Save directly to Firestore for real persistent data storage
      await addDoc(collection(db, "demo_requests"), {
        name: formattedName,
        email: bookingForm.email,
        phone: bookingForm.phone,
        website: bookingForm.website,
        details: bookingForm.details,
        createdAt: serverTimestamp(),
        source: "Landing Page Demo Request"
      });

      toast.success("✨ Experience scheduled successfully! We will contact you shortly to confirm your live AI walk-through.");
      setIsDemoModalOpen(false);
      setBookingForm({ name: "", email: "", phone: "", website: "", details: "" });
      setBookingErrors({});
      setBookingTouched({});
    } catch (err) {
      console.error("Booking error:", err);
      toast.error("There was an issue scheduling your demo. Please try again.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const navLinks = [
    { label: "Product", href: "#product" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Use Cases", href: "#use-cases" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "#faq" }
  ];

  // Specific 6 features
  const features = [
    {
      title: "AI tour host",
      desc: "Sora serves as your virtual co-pilot, conversing naturally with prospective buyers and highlighting custom features while maintaining your brokerage standards.",
      icon: Bot
    },
    {
      title: "Natural property Q&A",
      desc: "Instant responses grounded purely on verified listing data, building facts, architectural specifics, and local neighborhood dynamics.",
      icon: Mic
    },
    {
      title: "Multilingual welcomes",
      desc: "Expand representation with custom welcome messages and conversational speech dynamically generated in over 70+ global languages.",
      icon: Languages
    },
    {
      title: "Self-guided experience",
      desc: "Accelerate engagement during slow hours or vacant properties, letting prospects unlock rich audio walking guides with an intuitive QR scan.",
      icon: Smartphone
    },
    {
      title: "Better listing presentation",
      desc: "Deploy highly custom compliance blocks, digital disclosures, floor plan sheets, and marketing flyers that maintain premium brand integrity.",
      icon: FileCheck
    },
    {
      title: "Repeatable across listings",
      desc: "Save setup hours by utilizing centralized settings templates that immediately roll over into newly loaded listings automatically.",
      icon: Home
    }
  ];

  // Languages data
  const premiumLanguages = [
    { name: "Spanish", native: "Español", code: "es" },
    { name: "German", native: "Deutsch", code: "de" },
    { name: "Italian", native: "Italiano", code: "it" },
    { name: "Portuguese", native: "Português", code: "pt" },
    { name: "Simplified Chinese", native: "简体中文", code: "zh-cn" },
    { name: "Traditional Chinese", native: "繁體中文", code: "zh-tw" },
    { name: "Japanese", native: "日本語", code: "ja" },
    { name: "Korean", native: "한국어", code: "ko" },
    { name: "Dutch", native: "Nederlands", code: "nl" },
    { name: "Russian", native: "Русский", code: "ru" },
    { name: "Vietnamese", native: "Tiếng Việt", code: "vi" },
    { name: "Arabic", native: "العربية", code: "ar" },
    { name: "Hindi", native: "हिन्दी", code: "hi" }
  ];

  // FAQs
  const faqs = [
    {
      q: "Can agents and buyers record voice notes?",
      a: "Yes! The platform supports high-fidelity per-property voice notes. Agents and authorized team members can record detailed client summaries, private reminders, or follow-up insights with an expanded limit of up to 3 minutes (180 seconds). In buyer-facing kiosk or walkthrough views, visitors can record quick 45-second audio questions or property feedback automatically routed to the agent's dashboard."
    },
    {
      q: "What questions can buyers ask?",
      a: "Buyers can ask anything from structural characteristics like the age of the roofing and plumbing to lifestyle queries like school districts, transit times, and zoning laws. The AI host responds contextually utilizing real estate data parameters provided when you import the listing."
    },
    {
      q: "Does it support multiple languages?",
      a: "Absolutely. The platform features an integrated translator suite that extends accessibility across 70+ global languages. Welcomes and natural voice responses configure instantly, so localized community hubs or diverse foreign investors tour fluidly in their native tongues."
    },
    {
      q: "Is it only for open houses?",
      a: "No! While perfect for digital open house registration, agents also deploy the tablet kiosk modes and touchless QR guides for unattended vacant lock-box properties, private client walkthroughs, and brokerage window displays."
    },
    {
      q: "Does it replace the agent?",
      a: "Never. It is designed to relieve modern agents of redundant tasks—like collecting compliance signatures and repeating entry facts—letting you prioritize face-to-face negotiations with higher intent leads."
    },
    {
      q: "Can I use it on multiple listings?",
      a: "Yes. Our systems are optimized for scale, meaning you can easily duplicate core compliance disclosures, custom forms, and routing parameters across your entire active brokerage inventory registry instantly."
    },
    {
      q: "Can I sync leads automatically to my CRM?",
      a: "Yes! AI Open House Connect supports instant CRM synchronization. All parsed visitor metrics, verification outcomes, and custom questions route instantly via Webhook destinations (like Zapier, Make, or custom REST APIs) to your primary database."
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-slate-50 selection:bg-blue-100 antialiased">
      <style>{`
        .hamburger-btn {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 24px;
          height: 18px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          z-index: 1000;
          outline: none;
          position: relative;
        }
        .bar {
          display: block;
          width: 100%;
          height: 2px;
          background-color: #ffffff;
          border-radius: 2px;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .hamburger-btn.is-open .bar:nth-child(1) {
          transform: translateY(8px) rotate(45deg);
        }
        .hamburger-btn.is-open .bar:nth-child(2) {
          opacity: 0;
          transform: scaleX(0);
        }
        .hamburger-btn.is-open .bar:nth-child(3) {
          transform: translateY(-8px) rotate(-45deg);
        }

        .nav-drawer {
          position: fixed;
          top: 0;
          left: 0;
          height: 100%;
          width: 325px;
          max-width: 85%;
          background: #ffffff;
          box-shadow: 4px 0 24px rgba(0,0,0,0.12);
          transform: translateX(-100%);
          transition: transform 0.3s ease;
          z-index: 999;
          overflow-y: auto;
          padding: 18px 24px 24px;
        }
        .nav-drawer.is-open {
          transform: translateX(0);
        }

        .nav-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
          z-index: 998;
        }
        .nav-backdrop.is-open {
          opacity: 1;
          pointer-events: all;
        }

        @media (prefers-reduced-motion: no-preference) {
          .bar,
          .nav-drawer,
          .nav-backdrop {
            transition-duration: 0.3s;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .bar,
          .nav-drawer,
          .nav-backdrop {
            transition: none;
          }
        }
      `}</style>
      
      {/* 1. Header */}
      <header 
        className="fixed top-0 inset-x-0 w-full rounded-none lg:top-3 lg:inset-x-4 lg:rounded-[24px] max-w-7xl lg:mx-auto h-16 sm:h-20 z-50 border-b lg:border border-white/20 transition-all duration-300 backdrop-blur-md shadow-lg"
        style={{ backgroundColor: scrolled ? "rgba(80, 162, 255, 0.55)" : "rgba(80, 162, 255, 1)" }}
      >
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          
          {/* Logo */}
          <Link 
            to="/" 
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="hover:opacity-90 transition-opacity"
          >
            <Logo variant="white" iconClassName="h-9 w-9" />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-white">
            {navLinks.map((link) => (
              <a 
                key={link.label} 
                href={link.href} 
                className="text-white hover:text-white/80 font-bold transition-colors py-2 relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </nav>

          {/* Call to action & Access */}
          <div className="hidden md:flex items-center gap-6">
            <div className="relative group/freetip">
              <Link 
                to="/pricing" 
                className="text-sm font-bold text-white hover:text-white/80 transition-colors uppercase tracking-wider block py-2"
              >
                FREE
              </Link>
              {/* Tooltip on desktop hover */}
              <div className="absolute top-11 left-1/2 -translate-x-1/2 hidden group-hover/freetip:block w-72 bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl border border-slate-800 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-left">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-t border-l border-slate-800 rotate-45"></div>
                <p className="font-extrabold text-[#50a2ff] text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  Starter Plan
                </p>
                <p className="text-slate-200 leading-normal font-medium">
                  Digital sign-ins and smart lead capture for solo agents.
                </p>
              </div>
            </div>
            <Link 
              to="/login" 
              className="text-sm font-bold text-white hover:text-white/80 transition-colors"
            >
              <span className="animate-pulse-fast text-amber-300">Sign-In</span>
            </Link>
            <Button 
              onClick={() => setIsDemoModalOpen(true)}
              className="bg-white hover:bg-white/90 text-[#162556] font-extrabold px-5 py-2 rounded-xl text-xs sm:text-sm tracking-tight cursor-pointer shadow-sm"
            >
              Book a Demo
            </Button>
          </div>

          {/* Mobile Menu Icon */}
          <div className="md:hidden flex items-center gap-2.5">
            {/* To the left of the hamburger menu, create a link called Start Free */}
            <Link 
              to="/register" 
              className="text-[10px] font-black text-[#50a2ff] bg-white hover:bg-blue-50 active:scale-[0.85] scale-90 transition-all text-center px-2.5 py-1 rounded-lg shadow-sm whitespace-nowrap select-none uppercase tracking-wider"
            >
              Start Free
            </Link>

            {/* Custom Hamburger Button according to PDF Guide */}
            <button 
              id="menu-toggle"
              ref={menuToggleRef}
              aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileMenuOpen}
              aria-controls="nav-drawer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className={`hamburger-btn ${mobileMenuOpen ? "is-open" : ""}`}
            >
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop overlay */}
      <div 
        id="nav-backdrop"
        onClick={() => {
          setMobileMenuOpen(false);
          menuToggleRef.current?.focus();
        }}
        className={`nav-backdrop md:hidden ${mobileMenuOpen ? "is-open" : ""}`}
        aria-hidden="true"
      />

      {/* Navigation drawer according to PDF Guide */}
      <nav 
        id="nav-drawer"
        ref={navDrawerRef}
        className={`nav-drawer md:hidden flex flex-col ${mobileMenuOpen ? "is-open" : ""}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex flex-col h-full">
          {/* Header Card inside mobile menu */}
          <div className="rounded-xl flex items-center justify-between text-white p-4 mb-4 select-none" style={{ backgroundColor: '#50a2ff' }}>
            <Link 
              to="/" 
              onClick={() => {
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="hover:opacity-90 transition-opacity"
            >
              <Logo variant="white" iconClassName="h-8 w-8" />
            </Link>
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                menuToggleRef.current?.focus();
              }} 
              className="text-white hover:text-white/80 transition-colors bg-transparent border-0 outline-none p-1 cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Structured Menu Options exactly matching the layout / PublicLayout / screenshot */}
          <div className="flex flex-col gap-1 text-left px-2 flex-grow overflow-y-auto">
            {/* How It Works */}
            <div className="border-b border-slate-100 py-3">
              <Link 
                to="/how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="font-extrabold text-[#111827] text-base hover:text-blue-500 transition-colors block text-left"
              >
                How It Works
              </Link>
            </div>

            {/* Products */}
            <div className="border-b border-slate-100 py-3">
              <span className="font-extrabold text-[#111827] text-base block text-left mb-2">Products</span>
              <div className="pl-4 space-y-2.5">
                <Link to="/product#narrator" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">AI Property Tours</Link>
                <Link to="/open-houses" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Open House Sign-In</Link>
                <Link to="/product#narrator" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Talk with Sora</Link>
                <Link to="/product#narrator" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Listen to Tour</Link>
                <Link to="/product#features" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Message Me</Link>
                <Link to="/brokerages#compliance-demo" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Branding & Templates</Link>
                <Link to="/product#features" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Automations & Analytics</Link>
              </div>
            </div>

            {/* Pricing */}
            <div className="border-b border-slate-100 py-3">
              <Link 
                to="/pricing" 
                onClick={() => setMobileMenuOpen(false)}
                className="font-extrabold text-[#111827] text-base hover:text-blue-500 transition-colors block text-left"
              >
                Pricing
              </Link>
            </div>

            {/* Demo */}
            <div className="border-b border-slate-100 py-3">
              <Link 
                to="/demo" 
                onClick={() => setMobileMenuOpen(false)}
                className="font-extrabold text-[#111827] text-base hover:text-blue-500 transition-colors block text-left"
              >
                Demo
              </Link>
            </div>

            {/* Company */}
            <div className="border-b border-slate-100 py-3">
              <span className="font-extrabold text-[#111827] text-base block text-left mb-2">Company</span>
              <div className="pl-4 space-y-2.5">
                <Link to="/contact?tab=mission" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Mission & Values</Link>
                <Link to="/contact?tab=support" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Contact Support</Link>
                <Link to="/contact?tab=enterprise" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Enterprise Solutions</Link>
              </div>
            </div>

            {/* Help */}
            <div className="py-3 font-semibold pb-4">
              <span className="font-extrabold text-[#111827] text-base block text-left mb-2">Help</span>
              <div className="pl-4 space-y-2.5">
                <Link to="/open-houses" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Open Houses</Link>
                <Link to="/url-import" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">URL Import</Link>
                <Link to="/brokerages" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Brokerages</Link>
                <Link to="/integrations" onClick={() => setMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 block text-left">Integrations</Link>
              </div>
            </div>
          </div>

          {/* Bottom Action buttons */}
          <div className="mt-auto pt-4 border-t border-slate-100 space-y-3 px-2">
            <Button 
              onClick={() => { setMobileMenuOpen(false); navigate("/app"); }}
              className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white font-extrabold h-12 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Dashboard
            </Button>
            {user ? (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    setMobileMenuOpen(false);
                    await logout();
                    navigate("/");
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold h-12 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Sign-Out
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/login");
                }}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-extrabold h-12 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Sign-In / Sign-Up
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border text-slate-800 text-xs font-bold tracking-tight uppercase blue-pulsating-border">
            <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500" />
            AI Open House Tours
          </div>

          {/* Heading H1 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05] max-w-4xl mx-auto flex flex-col items-center justify-center gap-2">
            Turn every {" "}
            <BlindsOpenHouseText />
            <span className="sm:hidden block">into an AI</span>
            <span className="sm:hidden block">guided tour</span>
            <span className="hidden sm:inline">into an AI-guided tour</span>
          </h1>

          {/* Supporting text */}
          <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
            Give buyers a voice-guided experience that welcomes them, answers questions, and helps them understand the home as they walk through it. The current product materials support a guided welcome flow and multilingual tour experience.
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg"
              onClick={() => setIsDemoModalOpen(true)}
              className="w-full sm:w-auto h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-base shadow-sm hover:shadow transition-all group cursor-pointer"
            >
              Book a Demo
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 ml-1.5">
                →
              </span>
            </Button>
            <a 
              href="#product"
              className="w-full sm:w-auto h-14 px-8 inline-flex items-center justify-center bg-white border-2 border-blue-600 text-blue-600 font-extrabold rounded-2xl text-base hover:bg-blue-50/50 hover:border-blue-700 transition-colors shadow-sm"
            >
              See It in Action
            </a>
          </div>

          {/* Optional proof strip below CTA */}
          <div className="pt-10 border-t border-slate-200/60 max-w-3xl mx-auto">
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Multilingual welcome messages
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Voice-guided tours
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Buyer Q&A
              </span>
            </div>
          </div>

        </div>

        {/* Ambient decorative elements */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-blue-100/30 rounded-full filter blur-[100px] pointer-events-none -z-10"></div>
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-80 h-80 bg-slate-100/50 rounded-full filter blur-[80px] pointer-events-none -z-10"></div>
      </section>

      {/* 3. Product Visual Section */}
      <section id="product" className="py-12 bg-white border-y border-slate-100 px-6 scroll-mt-20">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Live Demo Mockup Experience</span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800">Click a buyer prompt below to view & hear Sora's natural voice response</h3>
          </div>

          {/* Interactivity Phone Mockup Layout */}
          <motion.div 
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.75 }}
            className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl border border-blue-200/50 shadow-sm relative overflow-hidden text-left" 
            style={{ backgroundColor: '#50a2ff' }}
          >
            <div className="grid md:grid-cols-12 gap-8 items-center relative -left-[5px] sm:left-0">
              
              {/* Left: Phone Screen Mockup */}
              <div className="md:col-span-5 flex justify-center">
                <div className="w-[280px] h-[520px] bg-slate-950 rounded-[40px] p-3 shadow-2xl relative border-4 border-slate-800 overflow-hidden flex flex-col justify-between">
                  
                  {/* Speaker pill */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-slate-800 rounded-b-2xl z-20 flex items-center justify-center">
                    <div className="h-1.5 w-12 bg-slate-900 rounded-full"></div>
                  </div>

                  {/* Simulated Screen Area */}
                  <div className="flex-1 bg-slate-900 rounded-[30px] overflow-hidden flex flex-col justify-between relative pt-6 text-white text-xs select-none">
                    
                    {/* Lock Screen Header / Property banner */}
                    <div className="p-3 border-b border-white/5 bg-slate-950/80 backdrop-blur-md flex items-center justify-between">
                      <div>
                        <p className="text-[10.5px] font-bold text-slate-200 max-w-[130px] truncate">124 Canyon Ridge</p>
                        <p className="text-[8.5px] text-zinc-400 font-sans tracking-tight">Active Tour • Sora Voice</p>
                      </div>
                      <span className="flex items-center gap-1 text-[8.5px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-mono font-bold leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        SORA LIVE
                      </span>
                    </div>

                    {/* Property Image & Spec Showcase */}
                    <div className="relative h-28 shrink-0 bg-slate-800 overflow-hidden">
                      <img 
                        src={mockupDetails[selectedMockupRoom].image} 
                        alt={selectedMockupRoom} 
                        className="w-full h-full object-cover brightness-75 transition-all duration-500" 
                      />
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[8px] font-mono whitespace-nowrap text-white">
                        {mockupDetails[selectedMockupRoom].spec}
                      </div>
                    </div>

                    {/* Simulated Messenger Body */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[190px] flex flex-col justify-end">
                      <AnimatePresence initial={false}>
                        {mockupDialogue.map((msg, index) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            key={index}
                            className={`flex flex-col max-w-[90%] ${
                              msg.sender === "buyer" ? "self-end items-end" : "self-start items-start"
                            }`}
                          >
                            <div className={`p-2.5 rounded-2xl text-[10px] leading-relaxed font-sans relative group/msg ${
                              msg.sender === "buyer" 
                                ? "bg-slate-200 text-slate-950 rounded-br-sm" 
                                : "bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700/55"
                            }`}>
                              <div>{msg.text.replace(/\[\w+\]/g, "").trim()}</div>
                              {msg.sender === "sora" && (
                                <button
                                  onClick={() => speakMockupWithPauses(msg.text)}
                                  className="absolute right-1 -bottom-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover/msg:opacity-100 transition-opacity duration-200 cursor-pointer shadow-md flex items-center justify-center z-10"
                                  title="Play Voice"
                                >
                                  <Volume2 className="h-2.5 w-2.5" />
                                </button>
                              )}
                            </div>
                            <span className="text-[7.5px] text-slate-500 mt-0.5 uppercase tracking-wide font-mono">
                              {msg.sender === "buyer" ? "Visitor" : "Sora Voice"}
                            </span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Speech speaking feedback widget */}
                    {isMockupSpeaking && (
                      <div className="bg-slate-950/95 border-t border-white/10 p-2 text-[9px] flex items-center justify-between gap-1.5 font-mono text-blue-400">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isMockupPaused ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 select-none"></div>
                          ) : (
                            <span className="relative flex h-1.5 w-1.5 shrink-0 select-none">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                          )}
                          <span className="truncate text-[8.5px] text-slate-300">
                            {isMockupPaused ? "Sora Voice is paused..." : "Sora Voice speaking..."}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isMockupPaused ? (
                            <button
                              onClick={handleResumeMockup}
                              type="button"
                              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded p-1 flex items-center justify-center transition-colors cursor-pointer"
                              title="Resume Sora Voice"
                            >
                              <Play className="h-2.5 w-2.5 fill-current" />
                            </button>
                          ) : (
                            <button
                              onClick={handlePauseMockup}
                              type="button"
                              className="bg-amber-600 hover:bg-amber-400 text-white rounded p-1 flex items-center justify-center transition-colors cursor-pointer"
                              title="Pause Sora Voice"
                            >
                              <Pause className="h-2.5 w-2.5 fill-current" />
                            </button>
                          )}
                          <button
                            onClick={handleStopMockup}
                            type="button"
                            className="bg-rose-600 hover:bg-rose-500 text-white rounded p-1 flex items-center justify-center transition-colors cursor-pointer"
                            title="Stop Voice"
                          >
                            <Square className="h-2.5 w-2.5 fill-current" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Simulated Input controls */}
                    <div className="p-2 border-t border-white/5 bg-slate-950 flex items-center gap-1 text-[9px] text-slate-400 italic">
                      <span className="truncate flex-1">Guided and matched with your listing disclosures...</span>
                      <Send className="h-3 w-3 text-slate-600" />
                    </div>
                  </div>

                </div>
              </div>

              {/* Right: Simulated Prompt Controls */}
              <div className="md:col-span-7 space-y-5 text-left pl-0 md:pl-4">
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-[#0a1e3d] uppercase tracking-wider font-mono">Interactive Panel</span>
                  <h4 className="text-xl font-black text-slate-950 tracking-tight leading-snug">Let buyers explore your listing interactively</h4>
                  <p className="text-xs text-slate-950 font-semibold leading-relaxed">
                    AI Open House Connect's conversational engine, pre-loaded with our premium Sora voice assistant, reads your active listing details, floor plans, and PDFs to answer visitor questions in real time. Try clicking a query button below:
                  </p>
                </div>

                {isMockupSpeaking && (
                  <div className="p-3.5 bg-blue-50/60 border border-blue-100/80 rounded-2xl flex items-center justify-between gap-4 text-xs transition-all duration-300">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Volume2 className={`h-4.5 w-4.5 shrink-0 ${isMockupPaused ? "text-amber-500" : "text-blue-600 animate-bounce"}`} />
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-800 leading-snug">Sora Voice Assistant Active</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5 animate-pulse">
                          {isMockupPaused ? "Speaking is currently paused" : "Sora Voice is narrating listing info..."}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 font-sans">
                      {isMockupPaused ? (
                        <button
                          onClick={handleResumeMockup}
                          type="button"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 select-none cursor-pointer transition-all active:scale-95 shadow-sm"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Resume</span>
                        </button>
                      ) : (
                        <button
                          onClick={handlePauseMockup}
                          type="button"
                          className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 select-none cursor-pointer transition-all active:scale-95 shadow-sm"
                        >
                          <Pause className="h-3 w-3 fill-current" />
                          <span>Pause</span>
                        </button>
                      )}
                      <button
                        onClick={handleStopMockup}
                        type="button"
                        className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 select-none cursor-pointer transition-all active:scale-95 shadow-sm"
                      >
                        <Square className="h-3 w-3 fill-current" />
                        <span>Stop</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  {simulatedQuestions.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleSimulatedQuestion(q)}
                      className="w-full p-3 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs text-left cursor-pointer transition-all hover:translate-x-1"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0"></span>
                        <span className="font-extrabold text-slate-800">{q.label}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>

                {/* Reset dialog link */}
                <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[10px] font-black text-white uppercase tracking-widest leading-none">
                  <span className="text-white font-extrabold">Microphone feedback simulated</span>
                  <button 
                    onClick={() => setMockupDialogue([
                      { sender: "sora", text: "[slow] Hi, I’m Sora, your AI property assistant. [pause] Welcome to this open house experience. [pause] Tap any buyer question button below to ask me anything about materials, school catchments, or structural features!" }
                    ])} 
                    className="hover:text-amber-100 underline text-white font-extrabold cursor-pointer"
                  >
                    Clear chat logs
                  </button>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* 4. Problem / Value Split */}
      <section className="py-20 md:py-28 bg-slate-50 border-b border-slate-200/50 px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Main H2 Heading */}
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-center max-w-4xl mx-auto leading-tight">
            Designed for how buyers actually <br />tour homes today
          </h2>

          <div className="grid md:grid-cols-2 gap-10 items-start pt-6">
            
            {/* Left Headline */}
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#50a2ff] text-red-500 text-xs font-bold tracking-widest uppercase font-mono blue-pulsating-border">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                The Structural Disconnect
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
                Open houses are still too passive
              </h3>
            </div>

            {/* Right Copy */}
            <div className="space-y-6 text-slate-600 text-sm sm:text-base leading-relaxed">
              <p>
                Buyers often walk through homes with little context, while agents repeat the same introduction over and over. This product turns the showing into a guided, interactive experience with a welcome message and live property Q&A.
              </p>
              
              <div>
                <a 
                  href="#how-it-works" 
                  className="font-bold text-slate-900 hover:text-slate-800 inline-flex items-center gap-1.5 text-sm"
                >
                  Learn how it works
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. How It Works */}
      <section id="how-it-works" className="py-20 md:py-28 bg-white px-6 scroll-mt-20">
        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* Heading H2 */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Streamlined Steps</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              A better tour in <br className="sm:hidden" /> three steps
            </h2>
          </div>

          {/* 3 cards in sequence */}
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group p-8 rounded-3xl border border-blue-200/50 text-left hover:scale-105 hover:-translate-y-2 hover:shadow-2xl active:scale-98 transition-all duration-300 cursor-default" 
              style={{ backgroundColor: '#50a2ff' }}
            >
              <div className="relative -left-[5px] sm:left-0 space-y-5">
                <div className="h-10 w-10 bg-slate-950 text-white rounded-xl flex items-center justify-center font-mono font-black text-sm">
                  01
                </div>
                <h3 className="text-lg font-black text-slate-950 tracking-tight">Open the tour</h3>
                <p className="text-xs text-slate-950 font-semibold leading-relaxed">
                  Scan the customizable QR code displayed at the entrance or click the active listing link. No bulky app installation required.
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group p-8 rounded-3xl border border-blue-200/50 text-left hover:scale-105 hover:-translate-y-2 hover:shadow-2xl active:scale-98 transition-all duration-300 cursor-default" 
              style={{ backgroundColor: '#50a2ff' }}
            >
              <div className="relative -left-[5px] sm:left-0 space-y-5">
                <div className="h-10 w-10 bg-slate-950 text-white rounded-xl flex items-center justify-center font-mono font-black text-sm">
                  02
                </div>
                <h3 className="text-lg font-black text-slate-950 tracking-tight">Hear the welcome</h3>
                <p className="text-xs text-slate-950 font-semibold leading-relaxed">
                  An AI assistant greets visitors, providing crucial legal consent logs and offering high-fidelity material packets directly.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group p-8 rounded-3xl border border-blue-200/50 text-left hover:scale-105 hover:-translate-y-2 hover:shadow-2xl active:scale-98 transition-all duration-300 cursor-default" 
              style={{ backgroundColor: '#50a2ff' }}
            >
              <div className="relative -left-[5px] sm:left-0 space-y-5">
                <div className="h-10 w-10 bg-slate-950 text-white rounded-xl flex items-center justify-center font-mono font-black text-sm">
                  03
                </div>
                <h3 className="text-lg font-black text-slate-950 tracking-tight">Ask as you walk</h3>
                <p className="text-xs text-slate-950 font-semibold leading-relaxed">
                  Ask about the construction details, local utility fees, school catchments, or room scales naturally while moving room-to-room.
                </p>
              </div>
            </motion.div>

          </div>

          {/* Welcome and Q&A framing footnote */}
          <div className="text-center">
            <p className="text-xs text-slate-400 italic">
              *The welcome and Q&A framing is directly reflected in the attached multilingual welcome-message file, which invites visitors to explore and ask about rooms, features, and layout.
            </p>
          </div>

        </div>
      </section>

      {/* 6. Feature Grid */}
      <section id="features" className="py-20 md:py-28 px-6 border-y border-blue-200/30" style={{ backgroundColor: '#50a2ff' }}>
        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* Heading H2 */}
          <div className="text-center space-y-3">
            <span className="text-xs font-black text-slate-950 uppercase tracking-widest font-mono">Product Capabilities</span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950">
              Everything you need for a smarter open house
            </h2>
          </div>

          {/* 6 feature blocks */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.1 }}
                key={`feat-${i}`}
                className="group p-6 bg-white rounded-2xl border border-blue-200/50 text-left space-y-4 hover:shadow-2xl hover:scale-105 active:scale-98 transition-all duration-300 cursor-default"
              >
                <div className="h-10 w-10 bg-slate-950 text-white rounded-xl flex items-center justify-center">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-950 tracking-tight">{f.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Multilingual claim footnote */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-950 font-bold italic">
              *The multilingual claim should remain prominent because the attached file shows prepared welcome-message support in 70+ languages.
            </p>
          </div>

        </div>
      </section>

      {/* 7. Multilingual Section */}
      <section className="py-20 md:py-28 bg-white px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* Heading H2 */}
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Welcome more buyers in their language
            </h2>
          </div>

          <div className="grid md:grid-cols-12 gap-10 items-center">
            
            {/* Left Column Description */}
            <div className="md:col-span-5 space-y-5 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Demographics & Reach</span>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
                Ensure every guest tours with absolute comfort. AI Open House Connect provides real estate-focused, context-aware instant translation. Boost buyer accessibility, improve brand presence, and capture global investor leads without language barriers.
              </p>
              <div className="pt-2">
                <Button 
                  onClick={() => setIsDemoModalOpen(true)}
                  className="bg-slate-950 hover:bg-slate-800 text-white text-xs px-4 py-2 rounded-lg font-bold"
                >
                  Schedule Translation Demo
                </Button>
              </div>
            </div>

            {/* Right Column Visual Language Grid or Globe element */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5 }}
              className="group md:col-span-7 p-6 sm:p-8 rounded-3xl border border-blue-200/80 transition-all duration-300 hover:shadow-xl cursor-default" 
              style={{ backgroundColor: '#50a2ff' }}
            >
              <div className="space-y-4 relative -left-[5px] sm:left-0">
                <div className="flex items-center justify-between border-b border-blue-300 pb-3">
                  <span className="text-xs font-black font-mono uppercase tracking-widest text-[#0a1e3d]">Global Prepared Translation Hub</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-blue-600 border border-blue-200 font-extrabold">70+ LANGUAGES</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {[...premiumLanguages].sort((a, b) => a.name.localeCompare(b.name)).map((lang, lIdx) => (
                    <div 
                      key={`lang-${lIdx}`}
                      className="px-3 py-2 bg-white rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between text-xs text-slate-800 hover:border-slate-400 hover:shadow-sm cursor-default transition-all duration-300 gap-3"
                    >
                      <span className="font-extrabold text-slate-900">{lang.name}</span>
                      <span className="text-[10px] text-slate-500 italic font-mono font-bold">{lang.native}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-blue-300 text-[10px] text-slate-950 font-semibold leading-normal">
                  *Our ready-to-use template collection includes prepared native translated welcome flows in Spanish, German, Italian, Portuguese, Simplified Chinese, Traditional Chinese, Japanese, Korean, Dutch, Russian, Vietnamese, Arabic, and Hindi.
                </div>
              </div>
            </motion.div>

          </div>

        </div>
      </section>

      {/* 8. Use Cases */}
      <section id="use-cases" className="py-20 md:py-28 px-6 scroll-mt-20 border-t border-blue-200/30" style={{ backgroundColor: '#50a2ff' }}>
        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* Heading H2 */}
          <div className="text-center space-y-3">
            <span className="text-xs font-black text-slate-950 uppercase tracking-widest font-mono">Flexible Deployments</span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950">
              Built for more than one kind of showing
            </h2>
          </div>

          {/* 6 Tiles */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Tile 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="group bg-white p-6 rounded-2xl border border-blue-200/50 space-y-3 text-left hover:scale-105 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 cursor-default"
            >
              <span className="text-[10px] font-black font-mono uppercase tracking-wider text-slate-500">Open houses</span>
              <h3 className="text-base font-extrabold text-slate-950 tracking-tight">Modern Digital Sign-In</h3>
              <p className="text-xs text-slate-600 font-semibold leading-normal">
                Ditch physical pads. Capture digital name, email, and phone validation with direct CRM routing.
              </p>
            </motion.div>

            {/* Tile 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="group bg-white p-6 rounded-2xl border border-blue-200/50 space-y-3 text-left hover:scale-105 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 cursor-default"
            >
              <span className="text-[10px] font-black font-mono uppercase tracking-wider text-slate-500">Vacant homes</span>
              <h3 className="text-base font-extrabold text-slate-950 tracking-tight">Self-Guided Inquiries</h3>
              <p className="text-xs text-slate-600 font-semibold leading-normal">
                Provide secure touchless scanning, letting prospective buyers tour empty homes with continuous AI accompaniment.
              </p>
            </motion.div>

            {/* Tile 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="group bg-white p-6 rounded-2xl border border-blue-200/50 space-y-3 text-left hover:scale-105 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 cursor-default"
            >
              <span className="text-[10px] font-black font-mono uppercase tracking-wider text-slate-500">Self-guided tours</span>
              <h3 className="text-base font-extrabold text-slate-950 tracking-tight">Private Walkthroughs</h3>
              <p className="text-xs text-slate-600 font-semibold leading-normal">
                Let buyers explore silently at their own preferred pace while keeping accurate voice guides readily available on prompt.
              </p>
            </motion.div>

            {/* Tile 4 */}
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="group bg-white p-6 rounded-2xl border border-blue-200/50 space-y-3 text-left hover:scale-105 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 cursor-default"
            >
              <span className="text-[10px] font-black font-mono uppercase tracking-wider text-slate-500">New developments</span>
              <h3 className="text-base font-extrabold text-slate-950 tracking-tight">Interactive Pre-Sales</h3>
              <p className="text-xs text-slate-600 font-semibold leading-normal">
                Explain blueprint materials, structural options, and deliver brochures instantly to buyer email folders.
              </p>
            </motion.div>

            {/* Tile 5 */}
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="group bg-white p-6 rounded-2xl border border-blue-200/50 space-y-3 text-left hover:scale-105 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 cursor-default"
            >
              <span className="text-[10px] font-black font-mono uppercase tracking-wider text-slate-500">Broker teams</span>
              <h3 className="text-base font-extrabold text-slate-950 tracking-tight">Centralized Team Controls</h3>
              <p className="text-xs text-slate-600 font-semibold leading-normal">
                Maintain uniform RECO compliance templates, branding, and round-robin lead routing rules effortlessly.
              </p>
            </motion.div>

            {/* Tile 6 */}
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="group bg-white p-6 rounded-2xl border border-blue-200/50 space-y-3 text-left hover:scale-105 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 cursor-default"
            >
              <span className="text-[10px] font-black font-mono uppercase tracking-wider text-slate-500">Multilingual buyer traffic</span>
              <h3 className="text-base font-extrabold text-slate-950 tracking-tight">Inclusive Accessibility</h3>
              <p className="text-xs text-slate-600 font-semibold leading-normal">
                Greet buyer traffic from any background natively, ensuring immediate engagement and high-quality lead scoring.
              </p>
            </motion.div>

          </div>

          {/* Use case grounding footnote */}
          <div className="text-center">
            <p className="text-xs text-slate-950 font-bold italic leading-relaxed">
              This section should reassure buyers that the product is broader than a one-time open-house tool while still staying anchored in the core use case.
            </p>
          </div>

        </div>
      </section>

      {/* 9. Demo CTA Band */}
      <section className="py-16 bg-slate-900 text-white relative overflow-hidden px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          
          {/* Heading H2 */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            See what buyers experience <br />
            the moment the tour starts
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Preview the welcome, the interaction flow, and the buyer Q&A in a live walkthrough.
          </p>

          <div className="pt-2">
            <Button 
              size="lg"
              onClick={() => setIsDemoModalOpen(true)}
              className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-8 h-12 rounded-xl text-sm"
            >
              Schedule a Demo
            </Button>
          </div>

        </div>

        {/* Diagonal glowing streak */}
        <div className="absolute top-0 right-0 w-80 h-[100%] bg-blue-500/10 -skew-x-12 pointer-events-none blur-3xl"></div>
      </section>

      {/* 10. FAQ */}
      <section id="faq" className="py-20 md:py-28 bg-white px-6 scroll-mt-20">
        <div className="max-w-3xl mx-auto space-y-12">
          
          {/* Heading H2 */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Got Questions?</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndices[index];
              return (
                <div 
                  key={`faq-${index}`}
                  className={`group border border-slate-200/60 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-default ${
                    isOpen 
                      ? 'bg-[#162556] text-white' 
                      : 'bg-slate-50 hover:bg-[#162556]'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className={`w-full p-5 flex items-center justify-between text-left font-bold text-sm sm:text-base cursor-pointer transition-colors duration-300 outline-none ${
                      isOpen ? 'text-white' : 'text-slate-900 group-hover:text-white'
                    }`}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 text-white shrink-0 transition-colors duration-300" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-500 group-hover:text-blue-100 shrink-0 transition-colors duration-300" />
                    )}
                  </button>
                  
                  {isOpen && (
                    <div className={`px-5 pb-5 pt-1 text-xs sm:text-sm leading-relaxed border-t transition-all duration-300 ${
                      isOpen 
                        ? 'text-blue-100 border-white/20' 
                        : 'text-slate-500 group-hover:text-blue-100 border-slate-100'
                    }`}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* FAQ multilingual grounding info */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-400 italic">
              *The multilingual answer should cite that the current welcome-message set already spans 70+ languages.
            </p>
          </div>

        </div>
      </section>

      {/* 11. Final CTA */}
      <section className="py-20 md:py-28 border-t border-blue-200/30 px-6" style={{ backgroundColor: '#50a2ff' }}>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          {/* Heading H2 */}
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-950">
            Give every listing a <br />
            better tour experience
          </h2>

          <p className="text-slate-950 font-semibold text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Welcome buyers, guide the walkthrough, and answer questions in real time with an AI-powered property tour built for modern open houses. The multilingual welcome-message system strengthens the first interaction and broadens accessibility.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg"
              onClick={() => setIsDemoModalOpen(true)}
              className="w-full sm:w-auto h-12 px-8 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-xl text-sm border-none shadow-md"
            >
              Book a Demo
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDemoModalOpen(true)}
              className="w-full sm:w-auto h-12 px-8 bg-white border border-slate-200 text-slate-800 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors shadow-sm"
            >
              Talk to Sales
            </Button>
          </div>

        </div>
      </section>

      {/* 12. Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-16 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            
            {/* Column 1 - Product */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-white">Product</h4>
              <ul className="space-y-2.5">
                <li><a href="#product" className="hover:text-white transition-colors">Interactive Tours</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#features" className="hover:text-white transition-colors font-semibold text-blue-400">Feature Deck</a></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing Plans</Link></li>
              </ul>
            </div>

            {/* Column 2 - Company */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-white">Company</h4>
              <ul className="space-y-2.5">
                <li><Link to="/contact" className="hover:text-white transition-colors">About Team</Link></li>
                <li><a href="mailto:support@aiopenhouseconnect.com" className="hover:text-white transition-colors">Media Kit</a></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Partnerships</Link></li>
              </ul>
            </div>

            {/* Column 3 - Resources */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-white">Resources</h4>
              <ul className="space-y-2.5">
                <li><Link to="/compliance" className="hover:text-white transition-colors">Agency Disclosures</Link></li>
                <li><Link to="/open-houses" className="hover:text-white transition-colors">Open House Manual</Link></li>
                <li><Link to="/url-import" className="hover:text-white transition-colors">URL Extraction API</Link></li>
                <li><Link to="/integrations" className="hover:text-white transition-colors">CRM Field Routing</Link></li>
              </ul>
            </div>

            {/* Column 4 - Contact */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-white">Contact</h4>
              <ul className="space-y-2.5">
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Concierge</Link></li>
                <li className="text-zinc-500 font-mono text-[10px]">support@aiopenhouseconnect.com</li>
                <li className="text-zinc-500 font-mono text-[10px]">AI Open House Connect Headquarters</li>
                <li className="text-zinc-500 font-mono text-[10px]">Toronto, ON, Canada</li>
              </ul>
            </div>

          </div>

          {/* Bottom row: copyright, privacy, terms */}
          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-zinc-500">
            <span>&copy; {new Date().getFullYear()} AI Open House Connect Inc. All rights reserved.</span>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/compliance" className="hover:text-white transition-colors">RECO Regulatory Disclosure</Link>
            </div>
          </div>

        </div>
      </footer>

      {/* Realistic Booking Dialog / Modal */}
      <Dialog open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
          <DialogHeader className="space-y-2.5 text-left">
            <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold">
              <CalendarDays className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-950 font-sans">
              Schedule a Demo
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed font-normal">
              Book a live walking walkthrough of AI Open House Connect. Provide your information below and an account specialist will coordinate with you.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBookingSubmit} className="space-y-4 pt-2">
            {/* 1. Full Name */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-start gap-2">
                <Label htmlFor="demo_fullName" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block pt-0.5">Full Name</Label>
                {bookingTouched.name && bookingErrors.name && !bookingErrors.name.isValid && (
                  <span className="text-rose-600 text-[10px] font-semibold text-right leading-tight max-w-[240px]">
                    {bookingErrors.name.errorMessage}
                  </span>
                )}
                {bookingTouched.name && (!bookingErrors.name || bookingErrors.name.isValid) && bookingForm.name && (
                  <span className="text-emerald-600 text-[10px] font-bold text-right leading-none">✓ Valid</span>
                )}
              </div>
              <Input 
                id="demo_fullName"
                value={bookingForm.name}
                onChange={e => handleBookingNameChange(e.target.value)}
                onBlur={() => {
                  setBookingTouched(prev => ({ ...prev, name: true }));
                  validateBookingField("name", bookingForm.name);
                }}
                placeholder="John Smith"
                className={`bg-slate-50/50 h-10 text-xs rounded-xl transition-all duration-200 ${
                  bookingTouched.name 
                    ? bookingErrors.name && !bookingErrors.name.isValid
                      ? "border-rose-500 bg-rose-50/10 focus-visible:ring-rose-500" 
                      : "border-emerald-500 bg-emerald-50/10 focus-visible:ring-emerald-500"
                    : "border-slate-200"
                }`}
                required
              />
            </div>

            {/* 2. Email Address */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-start gap-2">
                <Label htmlFor="demo_email" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block pt-0.5">Email Address</Label>
                {bookingTouched.email && bookingErrors.email && !bookingErrors.email.isValid && (
                  <span className="text-rose-600 text-[10px] font-semibold text-right leading-tight max-w-[240px]">
                    {bookingErrors.email.errorMessage}
                  </span>
                )}
                {bookingTouched.email && (!bookingErrors.email || bookingErrors.email.isValid) && bookingForm.email && (
                  <span className="text-emerald-600 text-[10px] font-bold text-right leading-none">✓ Valid</span>
                )}
              </div>
              <Input 
                id="demo_email"
                type="email"
                value={bookingForm.email}
                onChange={e => handleBookingEmailChange(e.target.value)}
                onBlur={() => {
                  setBookingTouched(prev => ({ ...prev, email: true }));
                  validateBookingField("email", bookingForm.email);
                }}
                placeholder="name@example.com"
                className={`bg-slate-50/50 h-10 text-xs rounded-xl transition-all duration-200 ${
                  bookingTouched.email 
                    ? bookingErrors.email && !bookingErrors.email.isValid
                      ? "border-rose-500 bg-rose-50/10 focus-visible:ring-rose-500" 
                      : "border-emerald-500 bg-emerald-50/10 focus-visible:ring-emerald-500"
                    : "border-slate-200"
                }`}
                required
              />
            </div>

            {/* 3. Phone Number */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-start gap-2">
                <Label htmlFor="demo_phone" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block pt-0.5">Phone Number</Label>
                {bookingTouched.phone && bookingErrors.phone && !bookingErrors.phone.isValid && (
                  <span className="text-rose-600 text-[10px] font-semibold text-right leading-tight max-w-[240px]">
                    {bookingErrors.phone.errorMessage}
                  </span>
                )}
                {bookingTouched.phone && (!bookingErrors.phone || bookingErrors.phone.isValid) && bookingForm.phone && (
                  <span className="text-emerald-600 text-[10px] font-bold text-right leading-none">✓ Valid</span>
                )}
              </div>
              <Input 
                id="demo_phone"
                type="tel"
                value={bookingForm.phone}
                onChange={e => handleBookingPhoneChange(e.target.value)}
                onBlur={() => {
                  setBookingTouched(prev => ({ ...prev, phone: true }));
                  validateBookingField("phone", bookingForm.phone);
                }}
                placeholder="(289) 659-2541"
                className={`bg-slate-50/50 h-10 text-xs rounded-xl transition-all duration-200 ${
                  bookingTouched.phone 
                    ? bookingErrors.phone && !bookingErrors.phone.isValid
                      ? "border-rose-500 bg-rose-50/10 focus-visible:ring-rose-500" 
                      : "border-emerald-500 bg-emerald-50/10 focus-visible:ring-emerald-500"
                    : "border-slate-200"
                }`}
                required
              />
            </div>

            {/* 4. Website */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-start gap-2">
                <Label htmlFor="demo_website" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block pt-0.5">Website</Label>
                {bookingTouched.website && bookingErrors.website && !bookingErrors.website.isValid && (
                  <span className="text-rose-600 text-[10px] font-semibold text-right leading-tight max-w-[240px]">
                    {bookingErrors.website.errorMessage}
                  </span>
                )}
                {bookingTouched.website && (!bookingErrors.website || bookingErrors.website.isValid) && bookingForm.website && (
                  <span className="text-emerald-600 text-[10px] font-bold text-right leading-none">✓ Valid</span>
                )}
              </div>
              <Input 
                id="demo_website"
                type="url"
                value={bookingForm.website}
                onChange={e => handleBookingWebsiteChange(e.target.value)}
                onBlur={() => {
                  setBookingTouched(prev => ({ ...prev, website: true }));
                  validateBookingField("website", bookingForm.website);
                }}
                placeholder="https://www.website.com"
                className={`bg-slate-50/50 h-10 text-xs rounded-xl transition-all duration-200 ${
                  bookingTouched.website 
                    ? bookingErrors.website && !bookingErrors.website.isValid
                      ? "border-rose-500 bg-rose-50/10 focus-visible:ring-rose-500" 
                      : "border-emerald-500 bg-emerald-50/10 focus-visible:ring-emerald-500"
                    : "border-slate-200"
                }`}
                required
              />
            </div>

            {/* 5. Details */}
            <div className="space-y-1.5 text-left relative">
              <div className="flex justify-between items-start gap-2">
                <Label htmlFor="demo_details" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block pt-0.5">Details</Label>
                {bookingTouched.details && bookingErrors.details && !bookingErrors.details.isValid && (
                  <span className="text-rose-600 text-[10px] font-semibold text-right leading-tight max-w-[240px]">
                    {bookingErrors.details.errorMessage}
                  </span>
                )}
                {bookingTouched.details && (!bookingErrors.details || bookingErrors.details.isValid) && bookingForm.details && (
                  <span className="text-emerald-600 text-[10px] font-bold text-right leading-none">✓ Valid</span>
                )}
              </div>
              <div className="relative">
                <textarea 
                  id="demo_details"
                  value={bookingForm.details}
                  onChange={e => handleBookingDetailsChange(e.target.value)}
                  onBlur={() => {
                    setBookingTouched(prev => ({ ...prev, details: true }));
                    validateBookingField("details", bookingForm.details);
                  }}
                  placeholder="Enter up to 1000 characters (start with uppercase)"
                  rows={3}
                  className={`w-full bg-slate-50/50 border h-20 text-xs rounded-xl p-3 focus:outline-none focus:ring-2 transition-all duration-200 font-sans resize-none text-slate-800 ${
                    bookingTouched.details 
                      ? bookingErrors.details && !bookingErrors.details.isValid
                        ? "border-rose-500 focus:ring-rose-500 bg-rose-50/10" 
                        : "border-emerald-500 focus:ring-emerald-500 bg-emerald-50/10"
                      : "border-slate-200 focus:ring-blue-500"
                  }`}
                  maxLength={1000}
                  required
                />
                <div className={`absolute bottom-2 right-3 text-[9px] font-mono select-none ${bookingForm.details.length >= 750 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                  {bookingForm.details.length} / 1000 {bookingForm.details.length >= 750 && <span className="animate-pulse font-normal">(75% Reached)</span>}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className={`w-full font-bold h-11 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 ${
                  isBookingFormValid() 
                    ? "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer" 
                    : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-80"
                }`}
                disabled={isSubmittingBooking}
              >
                {isSubmittingBooking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Scheduling...</span>
                  </>
                ) : (
                  <>
                    <CalendarDays className="h-4 w-4" />
                    <span>Confirm Booking Slot</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
