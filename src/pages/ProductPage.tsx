import React, { useState, useEffect, useRef } from "react";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { 
  Sparkles, 
  Mic, 
  Volleyball, 
  Volume2, 
  PhoneCall, 
  ShieldCheck, 
  Layers, 
  Tv, 
  Compass, 
  CheckCircle2, 
  Play, 
  Pause,
  ArrowRight
} from "lucide-react";

export default function ProductPage() {
  const [selectedRoom, setSelectedRoom] = useState<"foyer" | "kitchen" | "suite">("foyer");
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<any>(null);

  const roomNarrations = {
    foyer: {
      title: "Grande Entryway & Foyer",
      transcript: "Welcome to 888 Bel Air Road. As we step through the massive 12-foot custom hand-carved mahogany doors, observe the soaring double-height ceilings and the elegant, circular floating marble staircase...",
      voiceStyle: "Sora (Pre-Approved Female Voice)"
    },
    kitchen: {
      title: "Chef's Culinary Domain",
      transcript: "This is a full-stack professional culinary kitchen. Notice the dual solid calacatta gold marble waterfalls on the islands, custom gaggenau appliances, and the hidden butler pantry...",
      voiceStyle: "Sora (Pre-Approved Female Voice)"
    },
    suite: {
      title: "Master Penthouse Suite",
      transcript: "Step into the master wing. Here we find custom walnut paneled ceilings, automated pocket doors opening to a private heated plunge pool, and panoramic 270-degree views of the Los Angeles basin...",
      voiceStyle: "Sora (Pre-Approved Female Voice)"
    }
  };

  // Save voice samples list to Firestore system logs to persist on startup for user testing
  useEffect(() => {
    const saveSamplesToDatabase = async () => {
      try {
        await addDoc(collection(db, "system_logs"), {
          type: "voice_samples_database_saved",
          timestamp: Date.now(),
          samples: [
            {
              id: "foyer",
              title: "Grande Entryway & Foyer",
              transcript: "Welcome to 888 Bel Air Road. As we step through the massive 12-foot custom hand-carved mahogany doors, observe the soaring double-height ceilings and the elegant, circular floating marble staircase...",
              voiceStyle: "Sora (Pre-Approved Female Voice)"
            },
            {
              id: "kitchen",
              title: "Chef's Culinary Domain",
              transcript: "This is a full-stack professional culinary kitchen. Notice the dual solid calacatta gold marble waterfalls on the islands, custom gaggenau appliances, and the hidden butler pantry...",
              voiceStyle: "Sora (Pre-Approved Female Voice)"
            },
            {
              id: "suite",
              title: "Master Penthouse Suite",
              transcript: "Step into the master wing. Here we find custom walnut paneled ceilings, automated pocket doors opening to a private heated plunge pool, and panoramic 270-degree views of the Los Angeles basin...",
              voiceStyle: "Sora (Pre-Approved Female Voice)"
            }
          ]
        });
      } catch (err) {
        console.warn("Silence firebase save on public route:", err);
      }
    };
    saveSamplesToDatabase();
  }, []);

  // Log voice sample selection to Firestore database as requested by safety and testing rules
  const logSelectionToDatabase = async (room: "foyer" | "kitchen" | "suite") => {
    try {
      await addDoc(collection(db, "system_logs"), {
        type: "voice_sample_selection",
        roomId: room,
        title: roomNarrations[room].title,
        transcript: roomNarrations[room].transcript,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn("Database sync analytics error:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const selectRoomAndStopText = (room: "foyer" | "kitchen" | "suite") => {
    setSelectedRoom(room);
    setAudioProgress(0);
    setIsPlaying(false);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    logSelectionToDatabase(room);
  };

  const toggleNarrator = async () => {
    if (typeof window === "undefined") return;

    if (isPlaying) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsPlaying(false);
      setAudioProgress(0);
      return;
    }

    setIsPlaying(true);
    setAudioProgress(1);

    // Save playing details to Firebase database
    try {
      await addDoc(collection(db, "system_logs"), {
        type: "voice_sample_played",
        platform: "Cora Guide Voice Narrator",
        roomId: selectedRoom,
        title: roomNarrations[selectedRoom].title,
        transcript: roomNarrations[selectedRoom].transcript,
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn("Skipped playing log write:", e);
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();

      const transcript = roomNarrations[selectedRoom].transcript;
      const utterance = new SpeechSynthesisUtterance(transcript);
      // Premium warm, professional North American female agent voice properties (30 to 35 years old)
      utterance.rate = 0.90; // Polite, rhythmic, measured tempo typical of clean audio guides
      utterance.pitch = 0.98; // Warmer, slightly lower pitch to completely remove robotic high-frequency nasal notes

      const voices = window.speechSynthesis.getVoices();
      const getProfessionalFemaleVoice = () => {
        // 1. Aria (Edge premium/natural North American English)
        const ariaNatural = voices.find(v => v.name.toLowerCase().includes("aria") && v.name.toLowerCase().includes("natural"));
        if (ariaNatural) return ariaNatural;

        // 2. Samantha (macOS/iOS clear mid-thirties real estate persona)
        const samantha = voices.find(v => v.name.toLowerCase().includes("samantha"));
        if (samantha) return samantha;

        // 3. Dynamic Natural en-US female
        const enUsNatural = voices.find(v => v.name.toLowerCase().includes("natural") && v.lang.toLowerCase().includes("en-us") && v.name.toLowerCase().includes("female"));
        if (enUsNatural) return enUsNatural;

        // 4. Google US English (Standard Chrome/Android clear narrator)
        const googleUsEng = voices.find(v => v.name.toLowerCase().includes("google") && v.name.toLowerCase().includes("us english") && !v.name.toLowerCase().includes("male"));
        if (googleUsEng) return googleUsEng;

        // 5. Microsoft Zira (Clear North American)
        const zira = voices.find(v => v.name.toLowerCase().includes("zira"));
        if (zira) return zira;

        // 6. Generic high-quality US/CA female
        const usFemale = voices.find(v => v.name.toLowerCase().includes("female") && (v.lang.toLowerCase().startsWith("en-us") || v.lang.toLowerCase().startsWith("en-ca")));
        if (usFemale) return usFemale;

        // Fallbacks
        const fallbackFemale = voices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("sora"));
        if (fallbackFemale) return fallbackFemale;

        return voices.find(v => v.lang.toLowerCase().startsWith("en-us")) || voices.find(v => v.lang.toLowerCase().startsWith("en")) || null;
      };

      const femaleVoice = getProfessionalFemaleVoice();
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      // Pin reference to global window scope to bypass garbage collection abort bug
      (window as any).activeUtterance = utterance;
      utteranceRef.current = utterance;

      utterance.onstart = () => {
        setIsPlaying(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setAudioProgress(100);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };

      utterance.onerror = (e) => {
        console.warn("Speech Synthesis error:", e);
        setIsPlaying(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };

      let progressVal = 0;
      const estimatedDuration = Math.max(transcript.length * 65, 4000); 
      const stepMs = 150;
      const totalSteps = estimatedDuration / stepMs;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        progressVal = Math.min(progressVal + (100 / totalSteps), 99);
        setAudioProgress(Math.round(progressVal));
      }, stepMs);

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const charIndex = event.charIndex;
          const calculated = Math.min(Math.round((charIndex / transcript.length) * 100), 99);
          if (calculated > progressVal) {
            progressVal = calculated;
            setAudioProgress(calculated);
          }
        }
      };

      window.speechSynthesis.speak(utterance);
    } else {
      let progressVal = 0;
      intervalRef.current = setInterval(() => {
        progressVal += 2;
        if (progressVal >= 100) {
          clearInterval(intervalRef.current);
          setAudioProgress(100);
          setIsPlaying(false);
        } else {
          setAudioProgress(progressVal);
        }
      }, 100);
    }
  };

  return (
    <PublicLayout>
      <div className="bg-gradient-to-b from-slate-50 via-white to-slate-100 min-h-screen text-slate-800 pb-24 text-left font-sans">
        
        {/* HERO SECTION */}
        <section className="relative py-24 px-6 overflow-hidden border-b border-slate-200">
          <div className="absolute inset-0 bg-grid-slate-900/[0.03] bg-[size:20px_20px]"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full filter blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 relative z-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase">
                <Sparkles className="h-3 w-3" /> AI Propety Tours - Core Product Capabilities
              </div>
              
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
                AI Guided Voice Tours <br />
                <span className="text-blue-600">for Modern Real Estate</span>
              </h1>
              
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                VertexAgent turns simple listings into immersive voice-narrated homes, giving prospective buyers hand-held conversational tour assistants as they look around.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <a href="#narrator" className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-center">
                  Try AI Voice Narrators
                </a>
                <a href="#features" className="px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-sm transition-all text-center">
                  Core Solutions
                </a>
              </div>
            </div>

            {/* Visual previewer mockup */}
            <div className="lg:col-span-5 bg-slate-900 p-6 rounded-[32px] border-4 border-slate-950 shadow-2xl space-y-4 text-white">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <div className="flex gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">VertexAgent.io Media Node</span>
              </div>

              <div className="aspect-[4/3] bg-slate-950 rounded-2xl flex flex-col justify-between p-4 relative overflow-hidden" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.85))" }}>
                <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold">● LIVE VISITOR MIC</div>
                
                <div className="text-center pt-10">
                  <Compass className="h-12 w-12 text-blue-500 mx-auto animate-spin-slow" />
                  <p className="text-xs font-bold mt-2">Guided Walkthrough In Session</p>
                  <p className="text-[10px] text-slate-400 mt-1">Narrating: Main Entryway Room</p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-blue-400 font-bold uppercase tracking-wide">Assistant Sora</span>
                    <span className="text-slate-500 font-mono">Stream Active</span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-normal italic">
                    "This estate boasts majestic white water views, custom calacatta waterfalls, and automated floor-to-ceiling glass..."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI VOICE SIMULATOR */}
        <section id="narrator" className="py-20 px-6 border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto space-y-12">
            
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">AI Propterty Tours / Speech Synthesis Engine</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-950">
                Interactive Voice Room Narrator
              </h2>
              <p className="text-slate-500 text-sm">
                Choose a room and activate the play state to preview how Sora narrate home details room-by-room as prospective buyers walk around.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-5 space-y-4">
                <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-widest font-mono">Select Room Location:</h3>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => selectRoomAndStopText("foyer")}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center ${selectedRoom === "foyer" ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-950">01. Grande Double-Height Foyer</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Explore floating marble stairs, high glass facades.</p>
                    </div>
                    {selectedRoom === "foyer" && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                  </button>
 
                  <button 
                    onClick={() => selectRoomAndStopText("kitchen")}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center ${selectedRoom === "kitchen" ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-950">02. Chef's Professional Kitchen</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Dual marble waterfalls, premium gas utilities.</p>
                    </div>
                    {selectedRoom === "kitchen" && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                  </button>
 
                  <button 
                    onClick={() => selectRoomAndStopText("suite")}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center ${selectedRoom === "suite" ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-950">03. Penthouse Master Bedroom</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Walnut finishes, private hot saltwater plunge pool.</p>
                    </div>
                    {selectedRoom === "suite" && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                  </button>
                </div>
              </div>

              {/* Right: Actual Voice simulator console */}
              <div className="lg:col-span-7 bg-slate-900 text-white rounded-[32px] p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
                
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-xs font-mono">
                  <span>SPEECH PROCESSOR NODE</span>
                  <span className="text-blue-500">VOICE ACTIVE (SORA)</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-lg text-slate-100">{roomNarrations[selectedRoom].title}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Profile style: Warm, professional California local speaker</p>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl relative min-h-[140px] flex items-center justify-center">
                    {/* Progress bars / wave visualization */}
                    {isPlaying ? (
                      <div className="absolute top-2 right-4 flex gap-[3px] h-4 items-end">
                        <span className="w-1 h-2 bg-blue-500 rounded animate-pulse"></span>
                        <span className="w-1 h-3 bg-indigo-500 rounded animate-pulse delay-75"></span>
                        <span className="w-1 h-4 bg-blue-400 rounded animate-pulse delay-150"></span>
                        <span className="w-1 h-2 bg-blue-600 rounded animate-pulse"></span>
                      </div>
                    ) : null}

                    <p className="text-xs text-slate-300 leading-relaxed italic text-left relative z-10">
                      "{roomNarrations[selectedRoom].transcript}"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>VOICE SYNTHESIS COMPLETED</span>
                      <span>{audioProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${audioProgress}%` }}></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <Button onClick={toggleNarrator} className="bg-blue-600 hover:bg-blue-700 text-xs font-bold px-6 h-10 rounded-xl flex gap-1.5">
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isPlaying ? "Pause Narration" : "Listen to Cora Guide"}
                    </Button>
                    <span className="text-[10px] font-mono text-slate-500">Synthetic Voice Audio Stream (Female)</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* COMPREHENSIVE SUB-FEATURES */}
        <section id="features" className="py-20 px-6 max-w-7xl mx-auto space-y-16">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Automations & Analytics / Deep Feature Breakdown</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Complete AI Real Estate Experience</h2>
            <p className="text-slate-600 leading-normal">
              VertexAgent delivers a multi-channel framework covering every prospective client touchpoint.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="p-6 bg-white border border-slate-200/80 rounded-3xl space-y-4">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Mic className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">AI Guided Video Narrations</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Let buyers listen in as they browse. The vocal streams are completely synced with listed floor plans and key features.
              </p>
            </div>

            <div className="p-6 bg-white border border-slate-200/80 rounded-3xl space-y-4">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Volume2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Talk to Sora Voice Interface</h3>
              <p className="text-xs text-slate-500 leading-normal">
                An active microphone widget that parses client questions ("What schools is this zoned for?") and responds verbally inside seconds.
              </p>
            </div>

            <div className="p-6 bg-white border border-slate-200/80 rounded-3xl space-y-4">
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <PhoneCall className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Direct Agent SMS Messaging</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Instant fallback. If the client requests immediate human showings or direct agent replies, SMS dispatch alerts the listing team immediately.
              </p>
            </div>

          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
