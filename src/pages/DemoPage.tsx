import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  Mic, 
  Tv, 
  QrCode, 
  Send, 
  Compass, 
  CheckCircle2, 
  Volume2, 
  FileText,
  Clock,
  Briefcase,
  Play,
  Pause,
  ArrowRight,
  Loader2
} from "lucide-react";

export default function DemoPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [activeTab, setActiveTab] = useState<"voice" | "signin" | "flyer">("voice");
  const [selectedRoom, setSelectedRoom] = useState<string>("living");
  const [micActive, setMicActive] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiResponding, setIsAiResponding] = useState(false);

  // Audio Playback states and references
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);
  
  // Sign-In Form State
  const [guestName, setGuestName] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  // Pro Form Validation Fields & Error States
  const [formFullName, setFormFullName] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [fullNameTouched, setFullNameTouched] = useState(false);

  const [formEmail, setFormEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const [formPhone, setFormPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);

  const [formWebsite, setFormWebsite] = useState("");
  const [websiteError, setWebsiteError] = useState("");
  const [websiteTouched, setWebsiteTouched] = useState(false);

  const [formDetails, setFormDetails] = useState("");
  const [detailsError, setDetailsError] = useState("");
  const [detailsTouched, setDetailsTouched] = useState(false);

  // Helper to validate Full Name
  const validateFullName = (val: string): boolean => {
    const cleaned = val.trim().replace(/\s+/g, " ");
    if (!cleaned) {
      setFullNameError("Full Name is required.");
      return false;
    }
    const parts = cleaned.split(" ");
    if (parts.length < 2) {
      setFullNameError("Please enter both first and last name.");
      return false;
    }
    const firstWordValid = /^[A-Z]/.test(parts[0]);
    const lastWordValid = /^[A-Z]/.test(parts[parts.length - 1]);
    if (!firstWordValid || !lastWordValid) {
      setFullNameError("Please enter a full name with the first letter of the first and last name capitalized.");
      return false;
    }
    setFullNameError("");
    return true;
  };

  const handleFullNameChange = (val: string) => {
    const words = val.split(" ");
    const capitalizedWords = words.map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : "");
    const formatted = capitalizedWords.join(" ");
    setFormFullName(formatted);
    if (fullNameTouched) {
      validateFullName(formatted);
    }
  };

  // Helper to validate Email
  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError("Email Address is required.");
      return false;
    }
    if (!trimmed.includes("@")) {
      setEmailError("Please enter a valid email address that includes @.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError("Please enter a valid email address that includes @.");
      return false;
    }
    setEmailError("");
    return true;
  };

  // Helper to validate Phone
  const validatePhone = (val: string): boolean => {
    const phonePattern = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (!val) {
      setPhoneError("Phone Number is required.");
      return false;
    }
    if (!phonePattern.test(val)) {
      setPhoneError("Please enter a valid phone number in this format: (289) 659-2541.");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, "");
    const truncated = digits.slice(0, 10);
    let formatted = "";
    if (truncated.length > 0) {
      formatted += "(" + truncated.slice(0, 3);
    }
    if (truncated.length >= 3) {
      formatted += ") ";
    }
    if (truncated.length > 3) {
      formatted += truncated.slice(3, 6);
    }
    if (truncated.length >= 6) {
      formatted += "-";
    }
    if (truncated.length > 6) {
      formatted += truncated.slice(6, 10);
    }
    setFormPhone(formatted);
    if (phoneTouched) {
      validatePhone(formatted);
    }
  };

  // Helper to validate Website
  const validateWebsite = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setWebsiteError("Website is required.");
      return false;
    }
    if (!trimmed.startsWith("https://")) {
      setWebsiteError("Please enter a valid website in this format: https://www.website.com.");
      return false;
    }
    const urlPattern = /^https:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9.\/?=&%#_:-]+$/;
    if (!urlPattern.test(trimmed)) {
      setWebsiteError("Please enter a valid website in this format: https://www.website.com.");
      return false;
    }
    setWebsiteError("");
    return true;
  };

  // Helper to validate Details
  const validateDetails = (val: string): boolean => {
    if (!val) {
      setDetailsError("Details are required.");
      return false;
    }
    const trimmed = val.trim();
    if (trimmed.length > 0 && !/^[A-Z]/.test(trimmed)) {
      setDetailsError("Please start the details with a capital letter and keep the text under 1,000 characters.");
      return false;
    }
    setDetailsError("");
    return true;
  };

  const handleDetailsChange = (val: string) => {
    if (val.length > 1000) {
      val = val.slice(0, 1000);
    }
    let formatted = val;
    if (val.length > 0) {
      formatted = val.charAt(0).toUpperCase() + val.slice(1);
    }
    setFormDetails(formatted);
    if (detailsTouched) {
      validateDetails(formatted);
    }
  };

  // Deep descriptions for each room simulation triggers
  const getRoomDescription = (room: string) => {
    if (room === "living") {
      return "We are now in the majestic living pavilion. Look around at the soaring architectural concrete facades and floor-to-ceiling glass wrapping around the canyon overlook. This space features dual master fireplaces and a customized automated slide door system.";
    }
    if (room === "pool") {
      return "Notice the floating heated salt-water infinity pool design, featuring wrap-around glass margins hovering over the scenic canyons. It includes a custom submerged fire-pit lounge and automated lighting controls for evening entertaining.";
    }
    if (room === "penthouse") {
      return "Featuring handcrafted walnut finishes, custom acoustics, and a private elevated dual-deck pool escape. The ultimate primary master retreat designed for complete tranquility and architectural luxury.";
    }
    return "";
  };

  // Clean speech synthesis if the user navigates away or switches tabs
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeTab]);

  // Speech helper function with professional female North American settings
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsSpeechPaused(false);

    const utterance = new SpeechSynthesisUtterance(text);
    // Premium polite pace to remove any robotic high-frequency cadence
    utterance.rate = 0.90;
    utterance.pitch = 0.98;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name.toLowerCase().includes("aria") && v.name.toLowerCase().includes("natural")) ||
                  voices.find(v => v.name.toLowerCase().includes("samantha")) ||
                  voices.find(v => v.name.toLowerCase().includes("google") && v.name.toLowerCase().includes("us english") && !v.name.toLowerCase().includes("male")) ||
                  voices.find(v => v.name.toLowerCase().includes("zira")) ||
                  voices.find(v => v.name.toLowerCase().includes("female")) ||
                  voices.find(v => v.lang.toLowerCase().startsWith("en")) || null;

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsSpeechPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsSpeechPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleRoomSelect = (room: string) => {
    setSelectedRoom(room);
    setAiResponse(null);
    const text = getRoomDescription(room);
    speakText(text);
  };

  const playCurrentRoomTour = () => {
    if (isSpeechPaused) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        setIsSpeechPaused(false);
      }
    } else {
      const text = aiResponse || getRoomDescription(selectedRoom);
      speakText(text);
    }
  };

  const pauseSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsSpeechPaused(true);
    }
  };

  const stopSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsSpeechPaused(false);
    }
  };

  // Custom offset scroll handler to "Lower the display point by 20px"
  useEffect(() => {
    const handleScroll = () => {
      if (window.location.hash === "#simulator-flow") {
        const element = document.getElementById("simulator-flow");
        if (element) {
          setTimeout(() => {
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            // Standard offset is usually 64px for header. Subtracting 120px scrolls less deep,
            // which effectively offsets the displayed segment down (lowering the display point) by an extra 20px - 40px.
            const offsetPosition = elementPosition - 110;
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
          }, 350);
        }
      } else {
        window.scrollTo(0, 0);
      }
    };
    handleScroll();
    window.addEventListener("hashchange", handleScroll);
    return () => window.removeEventListener("hashchange", handleScroll);
  }, []);

  // Handle Demo AI questions
  const askAIEngine = (question: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsSpeechPaused(false);
    }
    setMicActive(true);
    setIsAiResponding(true);
    setAiResponse(null);

    setTimeout(() => {
      setMicActive(false);
      setIsAiResponding(false);
      
      let answer = "";
      if (question.includes("price") || question.includes("cost")) {
        answer = "This grand master estate is listed at $150,000,000. It includes 38,000 square feet of architectural space and a private motor court.";
      } else if (question.includes("school") || question.includes("education")) {
        answer = "It is zoned within the preeminent Los Angeles Unified School District, specifically under Warner Avenue Elementary and University Senior High.";
      } else {
        answer = "The canyon retreat features custom calacatta gold marble island waterfalls, gaggenau cooking systems, and fully customizable automated slide doors opening to the infinity pool.";
      }
      
      setAiResponse(answer);
      speakText(answer);
    }, 1800);
  };

  const checkFullNameValid = (val: string): boolean => {
    const cleaned = val.trim().replace(/\s+/g, " ");
    const parts = cleaned.split(" ");
    if (parts.length < 2) return false;
    return /^[A-Z]/.test(parts[0]) && /^[A-Z]/.test(parts[parts.length - 1]);
  };

  const checkEmailValid = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed.includes("@")) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  };

  const checkPhoneValid = (val: string): boolean => {
    return /^\(\d{3}\) \d{3}-\d{4}$/.test(val);
  };

  const checkWebsiteValid = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed.startsWith("https://")) return false;
    return /^https:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9.\/?=&%#_:-]+$/.test(trimmed);
  };

  const checkDetailsValid = (val: string): boolean => {
    const trimmed = val.trim();
    if (trimmed.length === 0 || trimmed.length > 1000) return false;
    return /^[A-Z]/.test(trimmed);
  };

  const isFormValid = 
    checkFullNameValid(formFullName) &&
    checkEmailValid(formEmail) &&
    checkPhoneValid(formPhone) &&
    checkWebsiteValid(formWebsite) &&
    checkDetailsValid(formDetails);

  // Submit mock guest signin
  const handleDemoSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Touch all fields to show validation on submit
    setFullNameTouched(true);
    setEmailTouched(true);
    setPhoneTouched(true);
    setWebsiteTouched(true);
    setDetailsTouched(true);

    const isNameV = validateFullName(formFullName);
    const isEmailV = validateEmail(formEmail);
    const isPhoneV = validatePhone(formPhone);
    const isWebsiteV = validateWebsite(formWebsite);
    const isDetailsV = validateDetails(formDetails);

    if (isNameV && isEmailV && isPhoneV && isWebsiteV && isDetailsV) {
      const trimmed = formFullName.trim().replace(/\s+/g, " ");
      const formattedName = trimmed.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      setGuestName(formattedName);
      setIsRegistered(true);
      toast.success(`Success! Registered visitor "${formattedName}" with pristine data validation.`);
    } else {
      toast.error("Form validation failed. Please make sure all required fields are correct.");
    }
  };

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-slate-50 via-white to-slate-100 min-h-screen text-slate-800 pb-24 text-left font-sans">
        
        {/* HERO */}
        <section className="relative py-20 px-6 overflow-hidden border-b border-slate-200">
          <div className="absolute inset-0 bg-grid-slate-900/[0.03] bg-[size:20px_20px]"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full filter blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto space-y-6 text-center max-w-3xl mx-auto z-10 relative">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase mx-auto">
              <Sparkles className="h-3 w-3 animate-pulse" /> Sandbox Interactive Playground
            </span>
            
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Interactive Product Demo Sandbox
            </h1>
            
            <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Toggle between the Hands-Free AI tour narrator, custom tablet entryway sign-in kiosk, and pre-formatted flyers below to experience AI Open House Connect immediately first-hand!
            </p>
          </div>
        </section>

        {/* DEMO SWITCHER INTERACTIVES */}
        <section id="simulator-flow" className="py-20 px-6 max-w-7xl mx-auto space-y-12 scroll-mt-[110px]">
          
          <div className="flex flex-wrap gap-3 justify-center">
            <button 
              onClick={() => setActiveTab("voice")}
              className={`px-5 py-3 rounded-2xl border text-sm font-bold flex gap-2 items-center transition-all ${activeTab === "voice" ? "bg-slate-900 text-white border-slate-950" : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"}`}
            >
              <Volume2 className="h-4 w-4" /> 01. Walk & Talk with Sora
            </button>
            <button 
              onClick={() => setActiveTab("signin")}
              className={`px-5 py-3 rounded-2xl border text-sm font-bold flex gap-2 items-center transition-all ${activeTab === "signin" ? "bg-slate-900 text-white border-slate-950" : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"}`}
            >
              <Tv className="h-4 w-4" /> 02. Entryway Sign-In Stand
            </button>
            <button 
              onClick={() => setActiveTab("flyer")}
              className={`px-5 py-3 rounded-2xl border text-sm font-bold flex gap-2 items-center transition-all ${activeTab === "flyer" ? "bg-slate-900 text-white border-slate-950" : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"}`}
            >
              <FileText className="h-4 w-4" /> 03. Active Listing Yard Flyers
            </button>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-stretch pt-4 text-left">
            
            {/* Left descriptive text */}
            <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-black uppercase tracking-widest text-blue-600 border-l-4 border-blue-600 pl-3">SIMULATOR FLOW</span>
                
                {activeTab === "voice" && (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-extrabold text-slate-950 tracking-tight">The AI Guided Tour Guide</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Sora narrates listing facts based on which room location is detected. Click the mock questions below to see how she answers in-depth zoning, property materials, and neighborhood school criteria.
                    </p>
                    <div className="space-y-2 pt-2">
                      <button onClick={() => askAIEngine("What is the listing price?")} className="w-full text-left p-3 rounded-xl border bg-slate-50 hover:bg-blue-50 text-xs font-bold text-slate-700 flex justify-between items-center transition-all">
                        <span>"What is the listing price?"</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                      </button>
                      <button onClick={() => askAIEngine("What school system is this zoned for?")} className="w-full text-left p-3 rounded-xl border bg-slate-50 hover:bg-blue-50 text-xs font-bold text-slate-700 flex justify-between items-center transition-all">
                        <span>"What school system is this zoned for?"</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "signin" && (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-extrabold text-slate-950 tracking-tight">Digital Sign-In Stand</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      No more trying to read messy pencil clipboard details. Let buyers sign-in cleanly. If they select disclosures requests, AI Open House Connect delivers the PDF immediately.
                    </p>
                    <blockquote className="p-4 bg-slate-50 border-l-4 border-emerald-500 rounded-r-2xl italic text-xs text-slate-600">
                      "Since launching AI Open House Kiosks, our captured open house lead rate improved by 45% because visitor details are verified."
                    </blockquote>
                  </div>
                )}

                {activeTab === "flyer" && (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-extrabold text-slate-950 tracking-tight">Responsive Brand Flyers</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      AI Open House Connect outputs dynamic PDF and image flyers complete with custom QR tags. Place these on yard signs or entry stands so guests scan, register, and talk to Sora hands-free on their own device.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-100 rounded-2xl text-[10px] text-slate-500 italic mt-auto">
                All simulators stream real-time simulated payloads and audio guides mimicking the production systems.
              </div>
            </div>

            {/* Right Interactive Play Panels based on tab */}
            <div className="lg:col-span-8 bg-slate-900 border-4 border-slate-950 rounded-[40px] p-6 sm:p-8 text-white relative shadow-2xl overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-84 h-84 bg-blue-600/5 rounded-full filter blur-3xl -mr-20 -mt-20"></div>
              
              <div className="space-y-6 relative z-10 flex-1 flex flex-col justify-between">
                
                {/* Header inside simulated black frame */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-800 text-xs font-mono">
                  <div className="flex gap-1 items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <span>AI Open House Connect Platform Playback Sandbox</span>
                  <span className="text-emerald-400">ACTIVE PLAY</span>
                </div>

                {/* TAB 1: Handsfree AI Guided voice */}
                {activeTab === "voice" && (
                  <div className="space-y-4 py-4 flex-1">
                    {/* Architectural Beacon Context */}
                    <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-left space-y-1.5 shadow-inner">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Physical Beacon Simulator</span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        These buttons represent distinct structural zones in a real estate listing. Instantly trigger localized walk-talk commentary by simulating entry to a space:
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                      <button 
                        onClick={() => handleRoomSelect("living")} 
                        className={`p-3 rounded-xl border text-center text-xs font-bold transition-all shadow-sm ${selectedRoom === "living" ? "bg-blue-600 border-blue-700 text-white font-extrabold ring-1 ring-blue-400" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"}`}
                      >
                        Living Pavilion
                      </button>
                      <button 
                        onClick={() => handleRoomSelect("pool")} 
                        className={`p-3 rounded-xl border text-center text-xs font-bold transition-all shadow-sm ${selectedRoom === "pool" ? "bg-blue-600 border-blue-700 text-white font-extrabold ring-1 ring-blue-400" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"}`}
                      >
                        Infinity Oasis
                      </button>
                      <button 
                        onClick={() => handleRoomSelect("penthouse")} 
                        className={`p-3 rounded-xl border text-center text-xs font-bold transition-all shadow-sm ${selectedRoom === "penthouse" ? "bg-blue-600 border-blue-700 text-white font-extrabold ring-1 ring-blue-400" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"}`}
                      >
                        Penthouse Wing
                      </button>
                    </div>

                    <div className="p-5 bg-slate-950/80 border border-slate-850 rounded-2xl space-y-3 min-h-[160px] flex flex-col justify-center">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                        <span>AUDIO SYNTHESIS SYSTEM</span>
                        <span>{micActive ? "● AI IS PROCESSING..." : isPlaying ? "🔊 KORE VOICE SPEAKING..." : "NARRATOR IDLE"}</span>
                      </div>

                      {isAiResponding ? (
                        <div className="space-y-2 text-center py-6">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" />
                          <p className="text-[10px] text-slate-500 font-mono animate-pulse">Sora is searching listing documents and composing reply...</p>
                        </div>
                      ) : aiResponse ? (
                        <div className="space-y-2 text-left animate-in fade-in duration-300">
                          <p className="text-[10px] text-blue-400 font-bold font-mono uppercase">AI Assistant Sora:</p>
                          <p className="text-xs text-slate-200 leading-relaxed italic">
                            "{aiResponse}"
                          </p>
                        </div>
                      ) : (
                        <div className="text-left text-slate-300 py-3 italic text-xs leading-relaxed">
                          <p className="text-[10px] text-blue-400 font-bold font-mono uppercase mb-1">Room Walkthrough Guide:</p>
                          {selectedRoom === "living" && `"${getRoomDescription("living")}"`}
                          {selectedRoom === "pool" && `"${getRoomDescription("pool")}"`}
                          {selectedRoom === "penthouse" && `"${getRoomDescription("penthouse")}"`}
                        </div>
                      )}
                    </div>

                    {/* Integrated Micro-Playback System controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className={`relative flex h-2 w-2 ${isPlaying ? 'visible' : 'invisible'}`}>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">
                          {isPlaying ? "Sora Voice Tour Active" : isSpeechPaused ? "Voice Guide Paused" : "Select room above to begin auto-play"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPlaying ? (
                          <Button 
                            onClick={pauseSpeech} 
                            size="sm" 
                            className="bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white px-3 py-1.5 h-8 text-[11px] rounded-lg font-bold flex gap-1.5"
                          >
                            <Pause className="h-3.5 w-3.5" /> Pause Guide
                          </Button>
                        ) : (
                          <Button 
                            onClick={playCurrentRoomTour} 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 h-8 text-[11px] rounded-lg font-bold flex gap-1.5 shadow-md shadow-blue-500/15"
                          >
                            <Play className="h-3.5 w-3.5 fill-white" /> {isSpeechPaused ? "Resume Guide" : "Listen Tour"}
                          </Button>
                        )}
                        <Button 
                          onClick={stopSpeech} 
                          size="sm" 
                          variant="ghost" 
                          className="text-slate-400 hover:text-slate-200 h-8 px-2.5 text-[11px]"
                        >
                          Stop
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Tablet Sign In */}
                {activeTab === "signin" && (
                  <div className="space-y-4 py-4 flex-1">
                    {isRegistered ? (
                      <div className="p-8 bg-slate-950/80 border border-slate-850 rounded-2xl text-center space-y-4 animate-in fade-in duration-300">
                        <div className="h-12 w-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-lg">✓</div>
                        <h4 className="font-bold text-sm">Thank You for Registering, {guestName}!</h4>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                          Our pipeline simulator successfully triggered! Disclosures and brochures have been dispatched. We've scored this lead and synced the cards to your CRM panel.
                        </p>
                        <Button 
                          onClick={() => { 
                            setIsRegistered(false); 
                            setGuestName(""); 
                            setFormFullName(""); 
                            setFormEmail(""); 
                            setFormPhone(""); 
                            setFormWebsite(""); 
                            setFormDetails(""); 
                            setFullNameTouched(false); 
                            setEmailTouched(false); 
                            setPhoneTouched(false); 
                            setWebsiteTouched(false); 
                            setDetailsTouched(false); 
                            setFullNameError(""); 
                            setEmailError(""); 
                            setPhoneError(""); 
                            setWebsiteError(""); 
                            setDetailsError(""); 
                          }} 
                          className="text-xs bg-slate-800 text-white border border-slate-750 hover:bg-slate-700 rounded-xl"
                        >
                          Simulate another Guest registration
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleDemoSignIn} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-4 text-left">
                        
                        {/* 1. Full Name */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="fullName" className="text-[10px] font-bold text-slate-400 uppercase">Full Name</Label>
                            {fullNameTouched ? (
                              fullNameError ? (
                                <span className="text-rose-400 text-[9px] font-semibold">⚠️ Needs capitalization</span>
                              ) : formFullName ? (
                                <span className="text-emerald-400 text-[10px] font-bold">✓ Ready</span>
                              ) : null
                            ) : null}
                          </div>
                          <Input 
                            id="fullName"
                            value={formFullName}
                            onChange={(e) => handleFullNameChange(e.target.value)}
                            onBlur={() => {
                              setFullNameTouched(true);
                              validateFullName(formFullName);
                            }}
                            className={`bg-slate-900 h-10 text-xs rounded-xl text-white transition-all duration-200 ${
                              fullNameTouched 
                                ? fullNameError 
                                  ? "border-rose-500 focus:ring-rose-500 bg-rose-950/20" 
                                  : formFullName 
                                    ? "border-emerald-500 focus:ring-emerald-500 bg-emerald-950/10" 
                                    : "border-slate-800"
                                : "border-slate-800"
                            }`}
                            placeholder="John Smith"
                            aria-invalid={fullNameTouched && !!fullNameError}
                            aria-describedby={fullNameError ? "fullName-err" : undefined}
                            required
                          />
                          {fullNameTouched && fullNameError && (
                            <p id="fullName-err" className="text-rose-400 text-[9px] font-semibold mt-1 animate-in fade-in duration-200">
                              ⚠️ {fullNameError}
                            </p>
                          )}
                        </div>

                        {/* 2. Email Address */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="emailAddress" className="text-[10px] font-bold text-slate-400 uppercase">Email Address</Label>
                            {emailTouched ? (
                              emailError ? (
                                <span className="text-rose-400 text-[9px] font-semibold">⚠️ Invalid structure</span>
                              ) : formEmail ? (
                                <span className="text-emerald-400 text-[10px] font-bold">✓ Ready</span>
                              ) : null
                            ) : null}
                          </div>
                          <Input 
                            id="emailAddress"
                            type="email"
                            value={formEmail}
                            onChange={(e) => {
                              setFormEmail(e.target.value);
                              if (emailTouched) {
                                validateEmail(e.target.value);
                              }
                            }}
                            onBlur={() => {
                              setEmailTouched(true);
                              validateEmail(formEmail);
                            }}
                            className={`bg-slate-900 h-10 text-xs rounded-xl text-white transition-all duration-200 ${
                              emailTouched 
                                ? emailError 
                                  ? "border-rose-500 focus:ring-rose-500 bg-rose-950/20" 
                                  : formEmail 
                                    ? "border-emerald-500 focus:ring-emerald-500 bg-emerald-950/10" 
                                    : "border-slate-800"
                                : "border-slate-800"
                            }`}
                            placeholder="name@example.com"
                            aria-invalid={emailTouched && !!emailError}
                            aria-describedby={emailError ? "email-err" : undefined}
                            required
                          />
                          {emailTouched && emailError && (
                            <p id="email-err" className="text-rose-400 text-[9px] font-semibold mt-1 animate-in fade-in duration-200">
                              ⚠️ {emailError}
                            </p>
                          )}
                        </div>

                        {/* 3 & 4. Phone and Website in responsive grid */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <Label htmlFor="phoneNumber" className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</Label>
                              {phoneTouched ? (
                                phoneError ? (
                                  <span className="text-rose-400 text-[9px] font-semibold">⚠️ Format error</span>
                                ) : formPhone ? (
                                  <span className="text-emerald-400 text-[10px] font-bold">✓ Ready</span>
                                ) : null
                              ) : null}
                            </div>
                            <Input 
                              id="phoneNumber"
                              type="tel"
                              value={formPhone}
                              onChange={(e) => handlePhoneChange(e.target.value)}
                              onBlur={() => {
                                setPhoneTouched(true);
                                validatePhone(formPhone);
                              }}
                              className={`bg-slate-900 h-10 text-xs rounded-xl text-white transition-all duration-200 ${
                                phoneTouched 
                                  ? phoneError 
                                    ? "border-rose-500 focus:ring-rose-500 bg-rose-950/20" 
                                    : formPhone 
                                      ? "border-emerald-500 focus:ring-emerald-500 bg-emerald-950/10" 
                                      : "border-slate-800"
                                  : "border-slate-800"
                              }`}
                              placeholder="(289) 659-2541"
                              aria-invalid={phoneTouched && !!phoneError}
                              aria-describedby={phoneError ? "phone-err" : undefined}
                              required
                            />
                            {phoneTouched && phoneError && (
                              <p id="phone-err" className="text-rose-400 text-[9px] font-semibold mt-1 animate-in fade-in duration-200">
                                ⚠️ {phoneError}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <Label htmlFor="websiteUrl" className="text-[10px] font-bold text-slate-400 uppercase">Website</Label>
                              {websiteTouched ? (
                                websiteError ? (
                                  <span className="text-rose-400 text-[9px] font-semibold">⚠️ Full HTTPS url needed</span>
                                ) : formWebsite ? (
                                  <span className="text-emerald-400 text-[10px] font-bold">✓ Ready</span>
                                ) : null
                              ) : null}
                            </div>
                            <Input 
                              id="websiteUrl"
                              type="url"
                              value={formWebsite}
                              onChange={(e) => {
                                setFormWebsite(e.target.value);
                                if (websiteTouched) {
                                  validateWebsite(e.target.value);
                                }
                              }}
                              onBlur={() => {
                                setWebsiteTouched(true);
                                validateWebsite(formWebsite);
                              }}
                              className={`bg-slate-900 h-10 text-xs rounded-xl text-white transition-all duration-200 ${
                                websiteTouched 
                                  ? websiteError 
                                    ? "border-rose-500 focus:ring-rose-500 bg-rose-950/20" 
                                    : formWebsite 
                                      ? "border-emerald-500 focus:ring-emerald-500 bg-emerald-950/10" 
                                      : "border-slate-800"
                                  : "border-slate-800"
                              }`}
                              placeholder="https://www.website.com"
                              aria-invalid={websiteTouched && !!websiteError}
                              aria-describedby={websiteError ? "website-err" : undefined}
                              required
                            />
                            {websiteTouched && websiteError && (
                              <p id="website-err" className="text-rose-400 text-[9px] font-semibold mt-1 animate-in fade-in duration-200">
                                ⚠️ {websiteError}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 5. Details Textarea */}
                        <div className="space-y-1.5 relative">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="detailsText" className="text-[10px] font-bold text-slate-400 uppercase">Details</Label>
                            {detailsTouched ? (
                              detailsError ? (
                                <span className="text-rose-400 text-[9px] font-semibold">⚠️ Must capitalize start</span>
                              ) : formDetails ? (
                                <span className="text-emerald-400 text-[10px] font-bold">✓ Ready</span>
                              ) : null
                            ) : null}
                          </div>
                          <div className="relative">
                            <textarea 
                              id="detailsText"
                              value={formDetails}
                              onChange={(e) => handleDetailsChange(e.target.value)}
                              onBlur={() => {
                                setDetailsTouched(true);
                                validateDetails(formDetails);
                              }}
                              placeholder="Enter up to 1000 characters"
                              rows={4}
                              aria-invalid={detailsTouched && !!detailsError}
                              aria-describedby={detailsError ? "details-err" : undefined}
                              className={`bg-slate-900 border text-xs rounded-xl text-white p-3 w-full outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200 resize-none ${
                                detailsTouched 
                                  ? detailsError 
                                    ? "border-rose-500 focus:ring-rose-500 bg-rose-950/20" 
                                    : formDetails 
                                      ? "border-emerald-500 focus:ring-emerald-500 bg-emerald-950/10" 
                                      : "border-slate-800"
                                  : "border-slate-800"
                              }`}
                              maxLength={1000}
                              required
                            />
                            {/* Live counter aligned bottom right within or below textarea */}
                            <div className={`absolute bottom-2 right-3 text-[9px] font-mono select-none ${formDetails.length >= 750 ? 'text-amber-500 font-bold' : 'text-slate-500'}`}>
                              {formDetails.length} / 1000 {formDetails.length >= 750 && <span className="animate-pulse font-normal">(75% Reached)</span>}
                            </div>
                          </div>
                          {detailsTouched && detailsError && (
                            <p id="details-err" className="text-rose-400 text-[9px] font-semibold mt-1 animate-in fade-in duration-200">
                              ⚠️ {detailsError}
                            </p>
                          )}
                        </div>

                        <div className="p-3 bg-slate-900/80 rounded-xl text-[10px] text-slate-400 leading-normal text-left">
                          <strong>Live Validation Active:</strong> Submitting is disabled until the criteria for all five fields are completed.
                        </div>

                        <Button 
                          type="submit" 
                          disabled={!isFormValid}
                          className={`w-full h-11 text-xs font-bold rounded-xl flex gap-1.5 transition-all duration-200 ${
                            isFormValid 
                              ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" 
                              : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
                          }`}
                        >
                          <Send className="h-4 w-4" /> Sign In (Simulate trigger)
                        </Button>
                      </form>
                    )}
                  </div>
                )}

                {/* TAB 3: Flyer QR codes */}
                {activeTab === "flyer" && (
                  <div className="space-y-4 py-4 flex-1 text-center">
                    <div className="p-6 bg-slate-950 border border-slate-850 rounded-2xl inline-flex flex-col items-center justify-center space-y-4 mx-auto">
                      <div className="p-3 bg-white rounded-2xl">
                        <QrCode className="h-24 w-24 text-slate-950" />
                      </div>
                      <div className="space-y-1 max-w-xs sm:max-w-md">
                        <h4 className="text-xs font-bold text-slate-100">Simulated Listing QR Badge</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          Guests point their phone cameras at this flyer tag to activate the voice walkthrough on demand without registering upfront.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer specs */}
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono border-t border-slate-800 pt-3">
                  <span>Interactive sandbox environment</span>
                  <span>Press buttons to run simulator sequences</span>
                </div>

              </div>
            </div>

          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
