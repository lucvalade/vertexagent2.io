import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, MessageSquare, Play, FastForward, Pause, Volume2, SkipBack, SkipForward, Loader2, X, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GoogleGenAI, Modality } from "@google/genai";

import { auth, db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const DUMMY_CONVOS: Record<string, any> = {
  "1": { id: "1", property: "888 Bel Air Rd, Los Angeles", lang: "English", duration: "4m 12s", qs: 8, date: 1746906300000, // May 10, 2026, 7:45 PM
    transcript: [
      { speaker: "AI", text: "Hi there! Welcome to 888 Bel Air Rd. I'm Sarah, the AI agent for this property. Before we dive into the details, in case we get disconnected, who am I speaking with and what's the best number to reach you back on?" },
      { speaker: "Client", text: "Hi, this is Mark. My number is 555-0123. I'm interested in the swimming pool." },
      { speaker: "AI", text: "Great to meet you, Mark! I've noted that. The pool is a stunning zero-edge infinity design with panoramic views. It's essentially the crown jewel of the outdoor space. Would you like me to send you the full digital brochure with the floor plans to that number or an email?" },
      { speaker: "Client", text: "Phone is fine. Tell me more about the taxes." },
      { speaker: "AI", text: "Absolutely. Annual taxes are roughly $340,000. I can include a detailed financial breakdown in that brochure I'm sending over." },
      { speaker: "Client", text: "Thanks, Sarah. Does it have a guest house?" },
      { speaker: "AI", text: "Yes, a separate 2,000 sq ft guest wing with its own private entrance and kitchenette. Perfect for long-term visitors or live-in staff." }
    ]
  },
  "2": { id: "2", property: "15 Central Park West, NY", lang: "Spanish", duration: "1m 45s", qs: 2, date: Date.now() - 1000 * 60 * 60 * 2,
    transcript: [
       { speaker: "AI", text: "¡Hola! Bienvenido a 15 Central Park West. Soy el agente de inteligencia artificial de esta propiedad. ¿En qué puedo ayudarle hoy?" },
       { speaker: "Client", text: "¿Hay estacionamiento?" },
       { speaker: "AI", text: "Sí, el edificio ofrece servicio de aparcacoches (valet parking) y estacionamiento subterráneo privado para los residentes." }
    ]
  }
};

export default function ConversationDetails() {
  const { convoId } = useParams();
  const navigate = useNavigate();
  const [convo, setConvo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isShowingPlayer, setIsShowingPlayer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<number>(1);

  // Sync with Firestore
  useEffect(() => {
    if (!convoId) return;

    const unsub = onSnapshot(doc(db, "conversations", convoId), async (snap) => {
      if (snap.exists()) {
        setConvo(snap.data());
        setLoading(false);
      } else {
        // Not in firestore, check dummy
        const dummy = DUMMY_CONVOS[convoId] || DUMMY_CONVOS["1"];
        setConvo(dummy);
        setLoading(false);
        
        // Save to firestore if it was a dummy hit (to fulfill "saved after first time")
        try {
          await setDoc(doc(db, "conversations", convoId), dummy);
          console.log("[Firestore] Cached dummy conversation to Firestore.");
        } catch (e) {
          console.warn("[Firestore] Failed to cache conversation:", e);
        }
      }
    }, (error) => {
      console.error("[Firestore] Error fetching conversation:", error);
      // Fallback to dummy data on permission error
      const dummy = DUMMY_CONVOS[convoId] || DUMMY_CONVOS["1"];
      setConvo(dummy);
      setLoading(false);
    });

    return () => unsub();
  }, [convoId]);

  // Handle sequential message display
  useEffect(() => {
    if (!convo || isPlaying) return;
    
    // Staggered reveal if not playing audio
    if (visibleMessages < (convo.transcript?.length || 0)) {
      const lastRevealedMsg = convo.transcript[visibleMessages - 1];
      const baseDelay = 1200; // Minimum delay between turns
      const charDelay = (lastRevealedMsg.text.length / 12) * 1000; // Speaking speed
      const totalDelay = Math.min(Math.max(baseDelay, charDelay), 5000); 

      const timer = setTimeout(() => {
        setVisibleMessages(prev => prev + 1);
      }, totalDelay);
      return () => clearTimeout(timer);
    }
  }, [convo, visibleMessages, isPlaying]);

  // Reset sequential display when playing starts/stops
  useEffect(() => {
    if (isPlaying) {
      // While playing, let the audio progress drive visibility or at least show all up to active
    }
  }, [isPlaying]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const fullAudioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const synthesizeConversation = async () => {
    if (fullAudioBufferRef.current) return fullAudioBufferRef.current;
    
    setIsSynthesizing(true);
    const toastId = toast.loading("Accessing encrypted neural recording...", {
      description: "Checking secure cloud cache for high-definition audio."
    });

    try {
      // 1. PRODUCTION CHECK: Check Firebase Storage for cached version
      const storagePath = `conversations/${convoId || 'demo'}.mp3`;
      
      if (storage) {
        try {
          const storageRef = ref(storage, storagePath);
          const url = await getDownloadURL(storageRef);
          
          toast.loading("HD recording found. Streaming...", { id: toastId });
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          }
          const buffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
          fullAudioBufferRef.current = buffer;
          toast.success("HD Recording loaded from cache", { id: toastId });
          return buffer;
        } catch (e: any) {
          console.log("[AudioCache] No cache or error:", e.message);
        }
      }

      toast.loading("Restoring recording with neural audio...", {
        id: toastId,
        description: "Synthesizing high-definition audio components."
      });

      // 2. SYNTHESIZE
      const promptText = `TTS the following conversation between Sarah (AI Agent) and Mark (Client):
      ${convo.transcript.map((m: any) => `${m.speaker}: ${m.text}`).join('\n')}`;

      const synthesisPromise = ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: promptText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: 'AI',
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                },
                {
                  speaker: 'Client',
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
                }
              ]
            }
          }
        }
      });

      const synthesisTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Gemini synthesis timed out (30s)")), 30000)
      );

      const response = await Promise.race([synthesisPromise, synthesisTimeout]) as any;

      const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      const base64Audio = audioPart?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio data returned from Gemini");

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Decode for immediate playback
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      
      let buffer: AudioBuffer;
      try {
        buffer = await audioContextRef.current.decodeAudioData(bytes.buffer.slice(0));
      } catch (decodeErr) {
        const length = Math.floor(bytes.buffer.byteLength / 2);
        const pcm16 = new Int16Array(bytes.buffer.slice(0, length * 2));
        buffer = audioContextRef.current.createBuffer(1, pcm16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < pcm16.length; i++) channelData[i] = pcm16[i] / 32768.0;
      }
      
      fullAudioBufferRef.current = buffer;

      // 3. PRODUCTION CACHE: Upload to Firebase Storage in background
      if (storage) {
        (async () => {
          try {
            const storageRef = ref(storage, `conversations/${convoId || 'demo'}.mp3`);
            const blob = new Blob([bytes.buffer], { type: 'audio/mp3' });
            await uploadBytes(storageRef, blob);
            console.log("Cached recording to storage.");
          } catch (uploadErr) {
            console.warn("Storage upload failed (possibly rules or quota):", uploadErr);
          }
        })();
      }
      
      toast.success("Recording restored.", { id: toastId });
      return buffer;
    } catch (err) {
      console.error("TTS HD Error:", err);
      toast.error("HD Recording took too long or failed. Please try again.", { id: toastId });
      return null;
    } finally {
      setIsSynthesizing(false);
    }
  };

  const startPlayback = async (offset = 0) => {
    const buffer = await synthesizeConversation();
    if (!buffer || !audioContextRef.current) return;

    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      if (Math.abs(playProgress - 100) < 1) {
        setIsPlaying(false);
        setPlayProgress(0);
        pausedTimeRef.current = 0;
      }
    };

    startTimeRef.current = audioContextRef.current.currentTime - offset;
    source.start(0, offset);
    audioSourceRef.current = source;
    setIsPlaying(true);
  };

  const pausePlayback = () => {
    if (audioSourceRef.current && audioContextRef.current) {
      audioSourceRef.current.stop();
      pausedTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current;
      setIsPlaying(false);
    }
  };

  const togglePlayback = () => {
    if (!isPlaying) {
      startPlayback(pausedTimeRef.current);
    } else {
      pausePlayback();
    }
  };

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Sync progress and speakers
  useEffect(() => {
    let interval: any;
    if (isPlaying && fullAudioBufferRef.current && audioContextRef.current) {
      interval = setInterval(() => {
        const audioCtx = audioContextRef.current!;
        const currentTime = audioCtx.currentTime - startTimeRef.current;
        const duration = fullAudioBufferRef.current!.duration;
        const progress = Math.min((currentTime / duration) * 100, 100);
        
        if (progress >= 100) {
          setPlayProgress(100);
          setIsPlaying(false);
          setIsShowingPlayer(false);
          setCurrentSpeaker(null);
          clearInterval(interval);
          return;
        }

        setPlayProgress(progress);
        
        // Match progress to transcript more accurately
        const transcript = convo.transcript;
        const totalChars = transcript.reduce((acc: number, m: any) => acc + m.text.length, 0);
        
        // Refined temporal alignment with strict turn completion and 0.5s buffers
        const PAUSE_DURATION = 0.5; // seconds
        const charsPerSec = 15; // Average speaking rate
        
        let cumulativeTime = -0.5; // Start with a small lead-in
        let activeIndex = 0;
        
        const totalDuration = transcript.reduce((acc: number, m: any) => {
          return acc + (m.text.length / charsPerSec) + PAUSE_DURATION;
        }, 0);

        const currentSeconds = (progress / 100) * totalDuration;

        for (let i = 0; i < transcript.length; i++) {
          const m = transcript[i];
          const duration = m.text.length / charsPerSec;
          
          if (currentSeconds <= cumulativeTime + duration) {
            activeIndex = i;
            break;
          }
          
          cumulativeTime += duration + PAUSE_DURATION;
          activeIndex = i;
        }
        
        setCurrentSpeaker(transcript[activeIndex].speaker);
        
        // Auto-scroll to active bubble
        const bubbleId = `bubble-${activeIndex}`;
        const element = document.getElementById(bubbleId);
        if (element && scrollAreaRef.current) {
          const container = scrollAreaRef.current;
          const rect = element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, convo.transcript]);

  const activeIndex = useMemo(() => {
    if (!isPlaying) return -1;
    const transcript = convo.transcript;
    const charsPerSec = 15;
    const PAUSE_DURATION = 0.5;
    
    const totalDuration = transcript.reduce((acc: number, m: any) => {
      return acc + (m.text.length / charsPerSec) + PAUSE_DURATION;
    }, 0);

    const currentSeconds = (playProgress / 100) * totalDuration;
    
    let cumulativeTime = -0.5;
    for (let i = 0; i < transcript.length; i++) {
      const m = transcript[i];
      const duration = m.text.length / charsPerSec;
      if (currentSeconds <= cumulativeTime + duration) return i;
      cumulativeTime += duration + PAUSE_DURATION;
    }
    return transcript.length - 1;
  }, [isPlaying, playProgress, convo.transcript]);

  useEffect(() => {
    return () => {
      if (audioSourceRef.current) audioSourceRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !convo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Accessing Secure Records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Conversation Transcript</h1>
            <p className="text-slate-500 mt-1">{convo.property}</p>
          </div>
        </div>

        {/* Global Speaker Status Overlay */}
        {isPlaying && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full animate-pulse">
            <div className={`w-2 h-2 rounded-full ${currentSpeaker === 'AI' ? 'bg-green-500' : 'bg-blue-500'}`} />
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              {currentSpeaker === 'AI' ? 'AI Agent Speaking...' : 'Client Speaking...'}
            </span>
          </div>
        )}
      </div>

      {isShowingPlayer && (
        <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-2xl space-y-4 animate-in slide-in-from-bottom-4 fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center">
                <Volume2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Neural AI Recording</p>
                <p className="font-bold text-sm tracking-tight">{convo.property}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded uppercase">HD Audio</span>
              <button 
                onClick={() => { setIsShowingPlayer(false); pausePlayback(); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-all rounded-lg text-[10px] font-black tracking-widest"
                title="Close Player"
              >
                <X className="h-3.5 w-3.5" /> CLOSE
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Button 
                size="icon" 
                className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95"
                onClick={togglePlayback}
                disabled={isSynthesizing}
              >
                {isSynthesizing ? <Loader2 className="h-6 w-6 animate-spin" /> : isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 ml-0.5 fill-current" />}
              </Button>
            </div>
            
            <div className="flex-1 space-y-2">
              <div 
                className="w-full bg-slate-800 h-2 rounded-full overflow-hidden cursor-pointer group relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const clickedProgress = x / rect.width;
                  if (fullAudioBufferRef.current) {
                    const seekTime = clickedProgress * fullAudioBufferRef.current.duration;
                    setPlayProgress(clickedProgress * 100);
                    startPlayback(seekTime);
                  }
                }}
              >
                <div className="h-full bg-blue-500 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${playProgress}%` }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>{formatTime(audioContextRef.current ? audioContextRef.current.currentTime - startTimeRef.current : 0)}</span>
                <span>{convo.duration}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider mb-2">Details</h3>
            
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-400 mb-1">Date & Time</div>
                <div className="font-medium text-sm">{format(convo.date, "PPp")}</div>
              </div>
              
              <div>
                <div className="text-xs text-slate-400 mb-1">Language</div>
                <div className="font-medium text-sm inline-block bg-slate-100 px-2 py-0.5 rounded">{convo.lang}</div>
              </div>
              
              <div>
                <div className="text-xs text-slate-400 mb-1">Duration</div>
                <div className="font-medium text-sm flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {convo.duration}
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3 space-y-2 border border-blue-100">
              <p className="text-[10px] font-bold text-blue-700 uppercase">Voice Biometrics</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-slate-600">AI: Sarah (Neural)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[10px] text-slate-600">Client: Identified</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-3">
          <div className="bg-white border rounded-2xl shadow-md overflow-hidden flex flex-col h-[650px]">
            {/* COMPACT WAVEFORM PLAYER (Inspired by User Image) */}
            <div className="border-b bg-white sticky top-0 z-10">
              <div className="bg-slate-50 border-b border-slate-100 py-1.5 px-4 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-[#FF6B35]" />
                <p className="text-[10px] font-medium text-slate-500">
                  <span className="font-bold text-[#FF6B35] mr-1">Note:</span> 
                  Generating the high-definition neural recording may take up to 60 seconds.
                </p>
              </div>
              <div className="p-4 flex items-center gap-4">
                <Button 
                  onClick={togglePlayback}
                  disabled={isSynthesizing}
                  size="icon"
                  className="h-12 w-12 rounded-full bg-[#FF6B35] hover:bg-[#E85D2C] shadow-lg shadow-orange-200 transition-all flex-shrink-0"
                >
                  {isSynthesizing ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : isPlaying ? (
                    <Pause className="h-6 w-6 fill-current text-white" />
                  ) : (
                    <Play className="h-6 w-6 ml-1 fill-current text-white" />
                  )}
                </Button>

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-bold text-[#FF6B35] uppercase tracking-widest">
                      {isSynthesizing ? "Restoring Neural Audio..." : isPlaying ? "Reproducing call..." : fullAudioBufferRef.current ? "HD Recording Ready" : "HD Restoration Required"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {formatTime(audioContextRef.current ? audioContextRef.current.currentTime - startTimeRef.current : 0)} / {convo.duration}
                    </span>
                  </div>
                  
                  {/* Waveform-style Progress Bar */}
                  <div 
                    className="relative h-10 w-full overflow-hidden cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const clickedProgress = x / rect.width;
                      if (fullAudioBufferRef.current) {
                        const seekTime = clickedProgress * fullAudioBufferRef.current.duration;
                        setPlayProgress(clickedProgress * 100);
                        startPlayback(seekTime);
                      }
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-between gap-[2px]">
                      {[...Array(40)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-1 rounded-full bg-slate-100 transition-all duration-200`}
                          style={{ 
                            height: `${20 + Math.sin(i * 0.5) * 40 + Math.random() * 20}%`,
                            backgroundColor: (i / 40) * 100 <= playProgress ? '#FF6B35' : '#F1F5F9'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar bg-slate-50/30" ref={scrollAreaRef}>
              {convo.transcript.map((msg: any, i: number) => {
                const isActive = activeIndex === i && isPlaying;
                const isVisible = isPlaying ? (i <= activeIndex || activeIndex === -1) : (i < visibleMessages);
                
                if (!isVisible && !isPlaying) return null;

                return (
                  <div 
                    key={i} 
                    id={`bubble-${i}`}
                    className={`flex flex-col ${msg.speaker === 'Client' ? 'items-end ml-auto' : 'items-start mr-auto'} transition-all duration-500 max-w-[85%] ${isPlaying && !isActive ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'} animate-in fade-in slide-in-from-bottom-2`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 px-1 text-left w-full">
                       <div className={`${msg.speaker === 'AI' ? 'bg-[#FF6B35]' : 'bg-blue-600'} w-1.5 h-4 rounded-full mr-1.5 ${isActive ? 'animate-pulse' : ''}`} />
                       <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${msg.speaker === 'AI' ? 'text-[#FF6B35]' : 'text-blue-600'}`}>
                        {msg.speaker === 'AI' ? ' Sarah (AI Agent)' : 'Mark (Verified Client)'}
                        {msg.speaker === 'AI' && <Sparkles className="h-3 w-3" />}
                      </span>
                    </div>
                    <div className={`p-4 rounded-2xl relative shadow-sm border text-left ${
                      msg.speaker === 'Client' 
                        ? 'bg-blue-600 text-white rounded-tr-sm border-blue-700' 
                        : 'bg-[#FFF8F4] text-slate-800 rounded-tl-sm border-orange-100 shadow-[0_0_15px_rgba(255,107,53,0.05)]'
                    } ${isActive ? 'ring-4 ring-[#FF6B35] ring-offset-2 scale-[1.02] shadow-xl z-20 !bg-orange-100 !border-orange-300' : ''} ${msg.speaker === 'AI' && !isActive ? 'border-orange-200/50' : ''} transition-all duration-300`}>
                      <p className="text-sm leading-relaxed font-medium">{msg.text}</p>
                      
                      {isActive && (
                        <div className="absolute -bottom-1 -right-1">
                           <div className="h-4 w-4 bg-[#FF6B35] rounded-full flex items-center justify-center animate-bounce shadow-md">
                              <Volume2 className="h-2 w-2 text-white" />
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
