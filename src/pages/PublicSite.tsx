import { Button } from "@/components/ui/button";
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
  
  // Demo Booking state
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

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
  // CRITICAL: Kore Premium Female Audio Voice Selector / Cache
  // This logic is designed to prevent robotic/fallback male voices (like Microsoft David) from hijacking the experience.
  // It checks for high-quality female voices (Samantha on Apple, Zira on Windows, Hazel, English Female profiles) 
  // and caches the choice once so it persists perfectly across all visitor interactions.
  // -------------------------------------------------------------
  const [koreFemaleVoice, setKoreFemaleVoice] = useState<SpeechSynthesisVoice | null>(null);

  const selectKoreFemaleVoiceOnce = () => {
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
        return name.includes("kore") && !name.includes("male");
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
    const v = selectKoreFemaleVoiceOnce();
    if (v) setKoreFemaleVoice(v);

    // Some browsers populate speech voices asynchronously
    const handleVoicesChanged = () => {
      const vSec = selectKoreFemaleVoiceOnce();
      if (vSec) setKoreFemaleVoice(vSec);
    };

    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    };
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

      const activeVoice = koreFemaleVoice || selectKoreFemaleVoiceOnce();
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

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.name || !bookingForm.email || !bookingForm.phone) {
      toast.error("Please fill in your name, email, and phone number.");
      return;
    }

    setIsSubmittingBooking(true);
    try {
      // Save directly to Firestore for real persistent data storage
      await addDoc(collection(db, "demo_requests"), {
        ...bookingForm,
        createdAt: serverTimestamp(),
        source: "Landing Page Demo Request"
      });

      toast.success("✨ Experience scheduled successfully! We will contact you shortly to confirm your live AI walk-through.");
      setIsDemoModalOpen(false);
      setBookingForm({ name: "", email: "", phone: "", notes: "" });
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
    { label: "Pricing", href: "#pricing" },
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
      desc: "Expand representation with custom welcome messages and conversational speech dynamically generated in over 60+ global languages.",
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
      q: "What questions can buyers ask?",
      a: "Buyers can ask anything from structural characteristics like the age of the roofing and plumbing to lifestyle queries like school districts, transit times, and zoning laws. The AI host responds contextually utilizing real estate data parameters provided when you import the listing."
    },
    {
      q: "Does it support multiple languages?",
      a: "Absolutely. The platform features an integrated translator suite that extends accessibility across 60+ global languages. Welcomes and natural voice responses configure instantly, so localized community hubs or diverse foreign investors tour fluidly in their native tongues."
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
      a: "Yes! VertexAgent supports instant CRM synchronization. All parsed visitor metrics, verification outcomes, and custom questions route instantly via Webhook destinations (like Zapier, Make, or custom REST APIs) to your primary database."
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
      
      {/* 1. Header */}
      <header className="fixed top-3 inset-x-3 md:top-4 md:inset-x-6 max-w-7xl mx-auto h-16 sm:h-20 bg-blue-950 backdrop-blur-[24px] z-50 border border-white/35 rounded-2xl sm:rounded-[24px] shadow-[0_8px_32px_rgba(2,36,187,0.12),0_12px_40px_rgba(0,0,0,0.15),inset_0_1.5px_6px_rgba(255,255,255,0.65)]">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-white">
            <div className="h-9 w-9 bg-white rounded-full flex items-center justify-center text-[#0224bb] text-base font-extrabold shadow-sm animate-multicolor-pulse">
              A
            </div>
            <span className="font-extrabold text-white">Ai Open House Connect</span>
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
            <Link 
              to="/login" 
              className="text-sm font-bold text-white hover:text-white/80 transition-colors"
            >
              Sign In
            </Link>
            <Button 
              onClick={() => setIsDemoModalOpen(true)}
              className="bg-white hover:bg-white/90 text-[#0224bb] font-extrabold px-5 py-2 rounded-xl text-xs sm:text-sm tracking-tight cursor-pointer shadow-sm"
            >
              Book a Demo
            </Button>
          </div>

          {/* Mobile Menu Icon */}
          <div className="md:hidden flex items-center gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger className="text-white h-10 w-10 p-0 rounded-xl hover:bg-white/10 flex items-center justify-center border border-white/20 cursor-pointer">
                <Menu className="h-6 w-6" />
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] border-l-slate-100 bg-white p-6">
                <div className="flex flex-col gap-8 mt-6">
                  <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900" onClick={() => setMobileMenuOpen(false)}>
                    <div className="h-9 w-9 bg-white rounded-full flex items-center justify-center text-[#0224bb] text-base font-extrabold border border-slate-200">
                      A
                    </div>
                    <span className="leading-tight">
                      Ai Open House<br />
                      Connect
                    </span>
                  </Link>
                  <nav className="flex flex-col gap-4 text-left">
                    {navLinks.map((link) => (
                      <a 
                        key={link.label}
                        href={link.href} 
                        className="font-bold text-base text-slate-850 hover:text-slate-900 hover:bg-slate-50 p-2 rounded-xl transition-colors block text-left"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </a>
                    ))}
                    <div className="h-[1px] bg-slate-100 my-2"></div>
                    <Link 
                      to="/login"
                      className="font-bold text-base text-slate-850 hover:text-slate-900 hover:bg-slate-50 p-2 rounded-xl transition-colors block text-left"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  </nav>
                  
                  <Button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsDemoModalOpen(true);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 rounded-xl text-sm"
                  >
                    Book a Demo
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* 2. Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/50 text-slate-800 text-xs font-bold tracking-tight uppercase">
            <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500" />
            AI Open House Tours
          </div>

          {/* Heading H1 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05] max-w-4xl mx-auto">
            Turn every open house into an AI-guided tour
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
              className="w-full sm:w-auto h-14 px-8 inline-flex items-center justify-center bg-white border border-slate-200 text-slate-800 font-bold rounded-2xl text-base hover:bg-slate-50 hover:border-slate-300 transition-colors"
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
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800">Click a buyer prompt below to view & hear Sora's natural response</h3>
          </div>

          {/* Interactivity Phone Mockup Layout */}
          <div className="grid md:grid-cols-12 gap-8 items-center max-w-4xl mx-auto bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm relative">
            
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
                      <p className="text-[8.5px] text-zinc-400 font-sans tracking-tight">Active Tour • Kore Voice</p>
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
                            {msg.sender === "buyer" ? "Visitor" : "Sora AI Host"}
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
                          {isMockupPaused ? "Sora is paused..." : "Sora speaking (Kore)..."}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isMockupPaused ? (
                          <button
                            onClick={handleResumeMockup}
                            type="button"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded p-1 flex items-center justify-center transition-colors cursor-pointer"
                            title="Resume Kore Voice"
                          >
                            <Play className="h-2.5 w-2.5 fill-current" />
                          </button>
                        ) : (
                          <button
                            onClick={handlePauseMockup}
                            type="button"
                            className="bg-amber-600 hover:bg-amber-400 text-white rounded p-1 flex items-center justify-center transition-colors cursor-pointer"
                            title="Pause Kore Voice"
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
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Interactive Panel</span>
                <h4 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">Let buyers explore your listing interactively</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  VertexAgent's conversational engine, pre-loaded with our premium Kore female voice, reads your active listing details, floor plans, and PDFs to answer visitor questions in real time. Try clicking a query button below:
                </p>
              </div>

              {isMockupSpeaking && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-100/80 rounded-2xl flex items-center justify-between gap-4 text-xs transition-all duration-300">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Volume2 className={`h-4.5 w-4.5 shrink-0 ${isMockupPaused ? "text-amber-500" : "text-blue-600 animate-bounce"}`} />
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-800 leading-snug">Sora Voice Assistant Active</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5 animate-pulse">
                        {isMockupPaused ? "Speaking is currently paused" : "Sora is narrating listing info..."}
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
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
                <span>Microphone feedback simulated</span>
                <button 
                  onClick={() => setMockupDialogue([
                    { sender: "sora", text: "[slow] Hi, I’m Sora, your AI property assistant. [pause] Welcome to this open house experience. [pause] Tap any buyer question button below to ask me anything about materials, school catchments, or structural features!" }
                  ])} 
                  className="hover:text-slate-700 underline"
                >
                  Clear chat logs
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. Problem / Value Split */}
      <section className="py-20 md:py-28 bg-slate-50 border-b border-slate-200/50 px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Main H2 Heading */}
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-left md:text-center max-w-4xl mx-auto leading-tight">
            Designed for how buyers actually tour homes today
          </h2>

          <div className="grid md:grid-cols-2 gap-10 items-start pt-6">
            
            {/* Left Headline */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-red-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
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
              A better tour in three steps
            </h2>
          </div>

          {/* 3 cards in sequence */}
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="group bg-slate-50 hover:bg-[#0224bb] p-8 rounded-3xl border border-slate-200/50 space-y-5 text-left hover:shadow-xl transition-all duration-300 cursor-default">
              <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-mono font-bold text-sm group-hover:bg-white group-hover:text-[#0224bb] transition-colors duration-300">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-white tracking-tight transition-colors duration-300">Open the tour</h3>
              <p className="text-xs text-slate-500 group-hover:text-blue-100 leading-relaxed font-normal transition-colors duration-300">
                Scan the customizable QR code displayed at the entrance or click the active listing link. No bulky app installation required.
              </p>
            </div>

            {/* Step 2 */}
            <div className="group bg-slate-50 hover:bg-[#0224bb] p-8 rounded-3xl border border-slate-200/50 space-y-5 text-left hover:shadow-xl transition-all duration-300 cursor-default">
              <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-mono font-bold text-sm group-hover:bg-white group-hover:text-[#0224bb] transition-colors duration-300">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-white tracking-tight transition-colors duration-300">Hear the welcome</h3>
              <p className="text-xs text-slate-500 group-hover:text-blue-100 leading-relaxed font-normal transition-colors duration-300">
                An AI assistant greets visitors, providing crucial legal consent logs and offering high-fidelity material packets directly.
              </p>
            </div>

            {/* Step 3 */}
            <div className="group bg-slate-50 hover:bg-[#0224bb] p-8 rounded-3xl border border-slate-200/50 space-y-5 text-left hover:shadow-xl transition-all duration-300 cursor-default">
              <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-mono font-bold text-sm group-hover:bg-white group-hover:text-[#0224bb] transition-colors duration-300">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-white tracking-tight transition-colors duration-300">Ask as you walk</h3>
              <p className="text-xs text-slate-500 group-hover:text-blue-100 leading-relaxed font-normal transition-colors duration-300">
                Ask about the construction details, local utility fees, school catchments, or room scales naturally while moving room-to-room.
              </p>
            </div>

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
      <section id="features" className="py-20 md:py-28 bg-slate-50 border-y border-slate-100 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* Heading H2 */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Product Capabilities</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Everything you need for a smarter open house
            </h2>
          </div>

          {/* 6 feature blocks */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div 
                key={`feat-${i}`}
                className="group p-6 bg-white hover:bg-[#0224bb] rounded-2xl border border-slate-200/50 text-left space-y-4 hover:shadow-xl transition-all duration-300 cursor-default"
              >
                <div className="h-10 w-10 bg-slate-950 text-white rounded-xl flex items-center justify-center group-hover:bg-white group-hover:text-[#0224bb] transition-all duration-300">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-white tracking-tight transition-colors duration-300">{f.title}</h3>
                <p className="text-xs text-slate-500 group-hover:text-blue-100 leading-relaxed font-normal transition-colors duration-300">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Multilingual claim footnote */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-400 italic">
              *The multilingual claim should remain prominent because the attached file shows prepared welcome-message support in 60+ languages.
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
                Ensure every guest tours with absolute comfort. VertexAgent provides real estate-focused, context-aware instant translation. Boost buyer accessibility, improve brand presence, and capture global investor leads without language barriers.
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
            <div className="group md:col-span-7 bg-slate-50 hover:bg-[#0224bb] p-6 sm:p-8 rounded-3xl border border-slate-200/80 transition-all duration-300 hover:shadow-xl cursor-default">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 group-hover:border-white/20 pb-3 text-slate-400 group-hover:text-blue-200 transition-colors duration-300">
                  <span className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400 group-hover:text-blue-200 transition-colors duration-300">Global Prepared Translation Hub</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 group-hover:bg-white/10 text-blue-600 group-hover:text-white border border-blue-100 group-hover:border-white/20 transition-all duration-300">60+ LANGUAGES</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {premiumLanguages.map((lang, lIdx) => (
                    <div 
                      key={`lang-${lIdx}`}
                      className="px-3 py-2 bg-white group-hover:bg-white/10 rounded-xl border border-slate-200/60 group-hover:border-white/10 shadow-sm flex items-center justify-between text-xs text-slate-800 group-hover:text-white hover:border-slate-400 hover:shadow-sm cursor-default transition-all duration-300 gap-3"
                    >
                      <span className="font-extrabold text-slate-900 group-hover:text-white transition-colors duration-300">{lang.name}</span>
                      <span className="text-[10px] text-slate-400 group-hover:text-blue-200 italic font-mono font-normal transition-colors duration-300">{lang.native}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-200/60 group-hover:border-white/20 text-[10px] text-slate-400 group-hover:text-blue-100 leading-normal font-normal transition-colors duration-300">
                  *Our ready-to-use template collection includes prepared native translated welcome flows in Spanish, German, Italian, Portuguese, Simplified Chinese, Traditional Chinese, Japanese, Korean, Dutch, Russian, Vietnamese, Arabic, and Hindi.
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 8. Use Cases */}
      <section id="use-cases" className="py-20 md:py-28 bg-slate-50 border-t border-slate-200/50 px-6 scroll-mt-20">
        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* Heading H2 */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Flexible Deployments</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Built for more than one kind of showing
            </h2>
          </div>

          {/* 6 Tiles */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Tile 1 */}
            <div className="group bg-white hover:bg-[#0224bb] p-6 rounded-2xl border border-slate-200/50 space-y-3 text-left transition-all duration-300 hover:shadow-xl cursor-default">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 group-hover:text-blue-200 transition-colors duration-300">Open houses</span>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-white transition-colors duration-300">Modern Digital Sign-In</h3>
              <p className="text-xs text-slate-500 group-hover:text-blue-100 leading-normal transition-colors duration-300">
                Ditch physical pads. Capture digital name, email, and phone validation with direct CRM routing.
              </p>
            </div>

            {/* Tile 2 */}
            <div className="group bg-white hover:bg-[#0224bb] p-6 rounded-2xl border border-slate-200/50 space-y-3 text-left transition-all duration-300 hover:shadow-xl cursor-default">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 group-hover:text-blue-200 transition-colors duration-300">Vacant homes</span>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-white transition-colors duration-300">Self-Guided Inquiries</h3>
              <p className="text-xs text-slate-500 group-hover:text-blue-100 leading-normal transition-colors duration-300">
                Provide secure touchless scanning, letting prospective buyers tour empty homes with continuous AI accompaniment.
              </p>
            </div>

            {/* Tile 3 */}
            <div className="group bg-white hover:bg-[#0224bb] p-6 rounded-2xl border border-slate-200/50 space-y-3 text-left transition-all duration-300 hover:shadow-xl cursor-default">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 group-hover:text-blue-200 transition-colors duration-300">Self-guided tours</span>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-white transition-colors duration-300">Private Walkthroughs</h3>
              <p className="text-xs text-slate-500 group-hover:text-blue-100 leading-normal transition-colors duration-300">
                Let buyers explore silently at their own preferred pace while keeping accurate voice guides readily available on prompt.
              </p>
            </div>

            {/* Tile 4 */}
            <div className="group bg-white hover:bg-[#0224bb] p-6 rounded-2xl border border-slate-200/50 space-y-3 text-left transition-all duration-300 hover:shadow-xl cursor-default">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 group-hover:text-blue-200 transition-colors duration-300">New developments</span>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-white transition-colors duration-300">Interactive Pre-Sales</h3>
              <p className="text-xs text-slate-500 group-hover:text-blue-100 leading-normal transition-colors duration-300">
                Explain blueprint materials, structural options, and deliver brochures instantly to buyer email folders.
              </p>
            </div>

            {/* Tile 5 */}
            <div className="group bg-white hover:bg-[#0224bb] p-6 rounded-2xl border border-slate-200/50 space-y-3 text-left transition-all duration-300 hover:shadow-xl cursor-default">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 group-hover:text-blue-200 transition-colors duration-300">Broker teams</span>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-white transition-colors duration-300">Centralized Team Controls</h3>
              <p className="text-xs text-slate-500 group-hover:text-blue-100 leading-normal transition-colors duration-300">
                Maintain uniform RECO compliance templates, branding, and round-robin lead routing rules effortlessly.
              </p>
            </div>

            {/* Tile 6 */}
            <div className="group bg-white hover:bg-[#0224bb] p-6 rounded-2xl border border-slate-200/50 space-y-3 text-left transition-all duration-300 hover:shadow-xl cursor-default">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 group-hover:text-blue-200 transition-colors duration-300">Multilingual buyer traffic</span>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-white transition-colors duration-300">Inclusive Accessibility</h3>
              <p className="text-xs text-slate-500 group-hover:text-blue-100 leading-normal transition-colors duration-300">
                Greet buyer traffic from any background natively, ensuring immediate engagement and high-quality lead scoring.
              </p>
            </div>

          </div>

          {/* Use case grounding footnote */}
          <div className="text-center">
            <p className="text-xs text-slate-400 italic leading-relaxed">
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
            See what buyers experience the moment the tour starts
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
              Schedule Your Demo
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
                  className="group bg-slate-50 hover:bg-[#0224bb] border border-slate-200/60 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-default"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 flex items-center justify-between text-left font-bold text-slate-900 group-hover:text-white text-sm sm:text-base cursor-pointer transition-colors duration-300 outline-none"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 text-slate-500 group-hover:text-blue-100 shrink-0 transition-colors duration-300" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-500 group-hover:text-blue-100 shrink-0 transition-colors duration-300" />
                    )}
                  </button>
                  
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-500 group-hover:text-blue-100 leading-relaxed border-t border-slate-100 group-hover:border-white/20 transition-all duration-300">
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
              *The multilingual answer should cite that the current welcome-message set already spans 60+ languages.
            </p>
          </div>

        </div>
      </section>

      {/* 11. Final CTA */}
      <section className="py-20 md:py-28 bg-slate-50 border-t border-slate-200/50 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          {/* Heading H2 */}
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Give every listing a better tour experience
          </h2>

          <p className="text-slate-500 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Welcome buyers, guide the walkthrough, and answer questions in real time with an AI-powered property tour built for modern open houses. The multilingual welcome-message system strengthens the first interaction and broadens accessibility.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg"
              onClick={() => setIsDemoModalOpen(true)}
              className="w-full sm:w-auto h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm"
            >
              Book a Demo
            </Button>
            <a 
              href="mailto:support@vertexagent.io"
              className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center bg-white border border-slate-200 text-slate-800 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors"
            >
              Talk to Sales
            </a>
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
                <li><Link to="/pricing" className="hover:text-white transition-colors">SaaS Plans</Link></li>
              </ul>
            </div>

            {/* Column 2 - Company */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-white">Company</h4>
              <ul className="space-y-2.5">
                <li><Link to="/contact" className="hover:text-white transition-colors">About Team</Link></li>
                <li><a href="mailto:support@vertexagent.io" className="hover:text-white transition-colors">Media Kit</a></li>
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
                <li className="text-zinc-500 font-mono text-[10px]">support@vertexagent.io</li>
                <li className="text-zinc-500 font-mono text-[10px]">VertexAgent Headquarters</li>
                <li className="text-zinc-500 font-mono text-[10px]">Toronto, ON, Canada</li>
              </ul>
            </div>

          </div>

          {/* Bottom row: copyright, privacy, terms */}
          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-zinc-500">
            <span>&copy; {new Date().getFullYear()} VertexAgent.io Inc. All rights reserved.</span>
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
              Schedule Your Demo
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed font-normal">
              Book a live walking walkthrough of VertexAgent. Provide your information below and an account specialist will coordinate with you.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBookingSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5 text-left">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Your Name</Label>
              <Input 
                value={bookingForm.name}
                onChange={e => setBookingForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Agent Name / Broker"
                className="bg-slate-50/50 border-slate-200 h-10 text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5 text-left">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</Label>
              <Input 
                type="email"
                value={bookingForm.email}
                onChange={e => setBookingForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="you@brokerage.com"
                className="bg-slate-50/50 border-slate-200 h-10 text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5 text-left">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone Number</Label>
              <Input 
                type="tel"
                value={bookingForm.phone}
                onChange={e => setBookingForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 000-0000"
                className="bg-slate-50/50 border-slate-200 h-10 text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5 text-left">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Listing URL or Notes (Optional)</Label>
              <Input 
                value={bookingForm.notes}
                onChange={e => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g. Zillow link or agency name"
                className="bg-slate-50/50 border-slate-200 h-10 text-xs rounded-xl"
              />
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5"
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
