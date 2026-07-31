import { Mic2, Play, Pause, Download, Plus, RefreshCw, Star, MoreVertical, Pencil, Trash2, Save, X, Volume2, Music, CheckCircle2, Upload, Loader2, Zap, MessageSquare, StopCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, updateDoc, addDoc, deleteDoc, setDoc, getDocs } from "firebase/firestore";
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Voice {
  id: string;
  name: string;
  status: 'Active' | 'Inactive' | 'Processing';
  type: 'Cloned' | 'Synthetic';
  rating: number;
  ratingCount: number;
  previewUrl?: string;
  tags?: string[];
  isDefault?: boolean;
}

const INITIAL_VOICES: Voice[] = [
  { id: "v1", name: "Sora Welcome (Sora)", status: "Active", type: "Synthetic", rating: 4.9, ratingCount: 124, tags: ["Female", "Warm", "First Touch"], isDefault: true },
  { id: "v2", name: "Open House Sign-In (Sora)", status: "Active", type: "Synthetic", rating: 4.8, ratingCount: 95, tags: ["Female", "Polished", "Front Desk"] },
  { id: "v3", name: "AI Tour Intro (Aoede)", status: "Active", type: "Synthetic", rating: 4.9, ratingCount: 202, tags: ["Female", "Tour Guide", "Expressive"] },
  { id: "v4", name: "Lender Handoff (Sora)", status: "Active", type: "Synthetic", rating: 4.8, ratingCount: 78, tags: ["Female", "High-Trust", "Financing"] },
  { id: "v5", name: "Follow-Up Message (Sora)", status: "Active", type: "Synthetic", rating: 4.9, ratingCount: 147, tags: ["Female", "Refined", "Nurture"] },
  { id: "2", name: "Professional Female Synthetic (Sora)", status: "Active", type: "Synthetic", rating: 4.9, ratingCount: 45, tags: ["Female", "Professional", "Sora"] },
  { id: "5", name: "Executive British (Female) Synthetic", status: "Active", type: "Synthetic", rating: 4.8, ratingCount: 22, tags: ["Female", "British", "Executive", "Zephyr"] },
  { id: "7", name: "Dynamic Storyteller (British Female) Synthetic", status: "Active", type: "Synthetic", rating: 4.9, ratingCount: 56, tags: ["Female", "British", "Expressive", "Aoede"] },
  { id: "3", name: "Warm Energetic Male Synthetic (Puck)", status: "Active", type: "Synthetic", rating: 4.7, ratingCount: 32, tags: ["Male", "Warm", "Energetic", "Puck"] },
  { id: "6", name: "Calm Reassuring Male Synthetic (Charon)", status: "Active", type: "Synthetic", rating: 4.6, ratingCount: 19, tags: ["Male", "Calm", "Warm", "Charon"] },
];

export default function VoiceLab() {
  const { user } = useAuth();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI States
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [voiceToDelete, setVoiceToDelete] = useState<Voice | null>(null);
  const [activeVoice, setActiveVoice] = useState<Voice | null>(null);
  const [testText, setTestText] = useState("Hi, I'm the AI agent for 888 Bel Air Road. How can I help you today?");
  const [initialTestText, setInitialTestText] = useState("");
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [editName, setEditName] = useState("");

  // Create Clone states
  const [newCloneName, setNewCloneName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Live session states
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<"connecting" | "active" | "idle">("idle");
  const [transcripts, setTranscripts] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const playbackQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  // Welcome Messages Audio Builder States
  const [welcomeVoiceId, setWelcomeVoiceId] = useState<string>("");
  const [welcomeEnText, setWelcomeEnText] = useState("[slow] Hi, I’m Sora, your AI property assistant. [pause] Welcome to this open house experience. [pause] I’m here to help you explore the home, answer questions, and guide you through the next steps at your own pace.");
  const [welcomeFrText, setWelcomeFrText] = useState("[slow] Bonjour, je suis Sora, votre assistante immobilière IA. [pause] Bienvenue à cette visite de portes ouvertes. [pause] Je suis là pour vous aider à explorer la maison, répondre à vos questions et vous guider à votre propre rythme.");
  const [generatingEn, setGeneratingEn] = useState(false);
  const [generatingFr, setGeneratingFr] = useState(false);
  const [enAudioUrl, setEnAudioUrl] = useState<string | null>(null);
  const [frAudioUrl, setFrAudioUrl] = useState<string | null>(null);
  const [playingEnWelcome, setPlayingEnWelcome] = useState(false);
  const [playingFrWelcome, setPlayingFrWelcome] = useState(false);
  const [welcomeEnAudio, setWelcomeEnAudio] = useState<HTMLAudioElement | null>(null);
  const [welcomeFrAudio, setWelcomeFrAudio] = useState<HTMLAudioElement | null>(null);

  // Auto-initialize selected welcome voice once voices load
  useEffect(() => {
    const list = voices.length > 0 ? voices : INITIAL_VOICES;
    if (list.length > 0 && !welcomeVoiceId) {
      const defaultVoice = list.find(v => v.isDefault) || list[0];
      setWelcomeVoiceId(defaultVoice.id);
    }
  }, [voices, welcomeVoiceId]);

  // Clean up any welcome playing audios on unmount
  useEffect(() => {
    return () => {
      if (welcomeEnAudio) welcomeEnAudio.pause();
      if (welcomeFrAudio) welcomeFrAudio.pause();
    };
  }, [welcomeEnAudio, welcomeFrAudio]);

  // Clean up any playing testing audio when modal is closed
  useEffect(() => {
    if (!isTestOpen) {
      if (previewSourceRef.current) {
        try {
          previewSourceRef.current.stop();
        } catch (e) {}
        previewSourceRef.current = null;
      }
      setIsPlayingPreview(false);
    }
  }, [isTestOpen]);

  // Sync with Firestore
  useEffect(() => {
    if (!user?.id) return;

    const voicesRef = collection(db, "users", user.id, "voices");
    const q = query(voicesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbVoices = snapshot.docs
        .filter(doc => doc.id !== "1")
        .map(doc => {
          const data = doc.data() as any;
          if (data.name && data.name.includes(" (Default)")) {
            data.name = data.name.replace(" (Default)", "");
          }
          return { id: doc.id, ...data } as Voice;
        });

      // Merge initial default voices with user custom voices in-memory
      const mergedList: Voice[] = [...dbVoices];
      for (const ini of INITIAL_VOICES) {
        if (!mergedList.some(v => v.id === ini.id)) {
          mergedList.push(ini);
        }
      }

      // Sort voices so default is at the top
      const sortedVoices = mergedList.sort((a, b) => {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        return 0;
      });

      setVoices(sortedVoices);
      setLoading(false);
    }, (err) => {
      console.warn("[VoiceLab] Snapshot error (quota/offline), using default voices:", err);
      setVoices(INITIAL_VOICES);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const handleRestoreDefaults = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const voicesRef = collection(db, "users", user.id, "voices");
      for (const v of INITIAL_VOICES) {
        await setDoc(doc(voicesRef, v.id), v);
      }
      toast.success("Default voice samples restored.");
    } catch (err) {
      toast.error("Failed to restore default voices.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomText = async () => {
    if (!user?.id || !activeVoice) return;
    try {
      const voiceDocRef = doc(db, "users", user.id, "voices", activeVoice.id);
      await updateDoc(voiceDocRef, { customSampleText: testText });
      setInitialTestText(testText);
      toast.success("Custom sample text saved for this voice!");
    } catch (e) {
      console.error("Failed to save custom sample text:", e);
      toast.error("Failed to save custom sample text");
    }
  };

  const handleTestVoice = (voice: Voice) => {
    setActiveVoice(voice);
    setPreviewReady(false);
    setUserRating(0); // Ensure rating resets per voice test
    
    let textToUse = "";
    const lowerName = voice.name.toLowerCase();
    if ((voice as any).customSampleText) {
      textToUse = (voice as any).customSampleText;
    } else if (lowerName.includes("welcome")) {
      textToUse = "[slow] Hi, I’m Sora, your AI property assistant. [pause] Welcome to this open house experience. [pause] I’m here to help you explore the home, answer questions, and guide you through the next steps at your own pace.";
    } else if (lowerName.includes("sign-in")) {
      textToUse = "[slow] Welcome in. [pause] Please take a moment to sign in so we can share property details and help personalize your visit. [pause] If you have any questions during the tour, I’ll be here to help.";
    } else if (lowerName.includes("tour intro")) {
      textToUse = "[slow] Welcome to the tour. [pause] As you move through the home, I can point out key features, answer questions, and help you learn more about the property. [pause] Take your time, and explore in whatever order feels most natural to you.";
    } else if (lowerName.includes("lender")) {
      textToUse = "[slow] If you’d like, I can also connect you with a mortgage professional for financing questions. [pause] This is completely optional, but it can be helpful if you’d like to better understand budget, pre-approval, or next steps.";
    } else if (lowerName.includes("follow-up")) {
      textToUse = "[slow] Thank you for visiting today. [pause] I hope the tour helped you get a better feel for the home. [pause] If you’d like more details, want to revisit the property, or have financing questions, I’m here to help with the next step.";
    } else if (lowerName.includes("storyteller")) {
      textToUse = "[slow] Let me tell you about the stunning kitchen which was completely renovated in 2025. It boasts professional-grade appliances, quartz countertops, and a massive walk-in pantry.";
    } else if (lowerName.includes("executive")) {
      textToUse = "[slow] The master suite is a private sanctuary. Highlighted by panoramic sunset views, integrated fireplace, and a massive walk-in wardrobe.";
    } else {
      textToUse = "Hi, I'm Sora, your AI assistant. How can I help you explore this beautiful property today?";
    }
    
    setTestText(textToUse);
    setInitialTestText(textToUse);
    setIsTestOpen(true);
  };

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [testAudioBuffer, setTestAudioBuffer] = useState<AudioBuffer | null>(null);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);

  const runTest = async () => {
    if (!activeVoice || !testText) return;
    setIsTesting(true);
    setPreviewReady(false);
    setTestAudioBuffer(null);
    setTestAudioUrl(null);

    try {
      // Map voices to prebuilt names for variety
      let voiceName = 'Kore';
      let styleInstruction = "";
      const lowerName = activeVoice.name.toLowerCase();

      if (lowerName.includes('welcome') || lowerName.includes('first touch')) {
        voiceName = 'Kore';
        styleInstruction = `Configure Voice: Sora.
Audio Profile: Polished, warm, smooth, stable, and premium female persona. Sounds trustworthy, elegant, and highly professional, fitting a luxury real estate brand.
Scene: Greeting a guest or guiding an open house experience for the first time.
Director's Notes: Deliver with a smooth, warm, client-friendly tone. Pacing must be calm, relaxed, and completely natural. Do not sound high-pitched, excited, rushed, or robotic. Speak with absolute confidence and clarity. Use natural breathing pauses.`;
      } else if (lowerName.includes('sign-in')) {
        voiceName = 'Kore';
        styleInstruction = `Configure Voice: Sora.
Audio Profile: Clear, highly polished, professional female assistant designed for modern transactional/digital environments. Sound articulate, calm, reassuring, and easy to follow.
Scene: Guiding a visitor through a touchless open house sign-in flow.
Director's Notes: Prioritize data trust and structural clarity. Delivery must remain polite, concise, low-pressure, informative, and highly approachable.`;
      } else if (lowerName.includes('tour intro') || lowerName.includes('aoede')) {
        voiceName = 'Aoede';
        styleInstruction = `Configure Voice: Aoede.
Audio Profile: Premium, fluid, highly engaging AI tour guide. Possesses an elegant, smooth rhythm with deep conversational inflections.
Scene: Initiating an interactive, self-guided property tour.
Director's Notes: Sound warm, highly informative, and confident. Keep the pace completely relaxed. The buyer should feel fluidly guided and educated, never hard-sold.`;
      } else if (lowerName.includes('lender') || lowerName.includes('financing')) {
        voiceName = 'Kore';
        styleInstruction = `Configure Voice: Sora.
Audio Profile: High-trust, mature, exceptionally composed, warm, and helpful female assistant handling sensitive real estate financing handoffs.
Scene: Introducing an optional mortgage pre-approval or financing handoff.
Director's Notes: Maintain a deeply respectful, supportive, steady, trustworthy, and non-pushy tone. Project calm authority and neutral helpfulness.`;
      } else if (lowerName.includes('follow-up') || lowerName.includes('sora') || lowerName.includes('umbriel') || lowerName.includes('nurture')) {
        voiceName = 'Kore';
        styleInstruction = `Configure Voice: Sora.
Audio Profile: Warm, deeply refined, thoughtful, friendly, and reassuring female assistant handling post-visit real estate operations.
Scene: Follow-up message engaging a home buyer after their open house visit.
Director's Notes: Use an encouraging, welcoming, and reassuring female tone (Sora). Keep the cadence steady, rhythmic, and natural. Make the message feel personalized, professional, and accessible.`;
      } else if (lowerName.includes('professional female') || lowerName.includes('sora') || lowerName.includes('kore')) {
        voiceName = 'Kore';
        styleInstruction = `Configure Voice: Sora.
Audio Profile: Polished, warm, smooth, stable, and premium female persona. Sounds trustworthy, elegant, and highly professional, fitting a luxury real estate brand.
Scene: Greeting a guest or guiding an open house experience.
Director's Notes: Deliver with a smooth, warm, client-friendly female tone (Sora). Pacing must be calm, relaxed, and completely natural. Speak with absolute confidence and clarity. Use natural breathing pauses.`;
      } else if (lowerName.includes('executive british') || lowerName.includes('zephyr')) {
        voiceName = 'Zephyr';
        styleInstruction = "Deliver this slowly and deliberately using a refined, premium British accent with crisp, executive clarity: ";
      } else if (lowerName.includes('storyteller')) {
        voiceName = 'Aoede';
        styleInstruction = "Deliver using an expressive, engaging, story-led British tone. Add natural emotional inflections so it sounds vivid, inviting, and alive: ";
      } else if (lowerName.includes('warm energetic') || lowerName.includes('puck')) {
        voiceName = 'Puck';
        styleInstruction = "Deliver this with an energetic, friendly, and spirited tone: ";
      } else if (lowerName.includes('calm reassuring') || lowerName.includes('charon')) {
        voiceName = 'Charon';
        styleInstruction = "Configure Voice: Charon. Deliver this with a calm, friendly, reassuring, and highly trustworthy male tone: ";
      } else if (lowerName.includes('deep narrator') || lowerName.includes('fenrir')) {
        voiceName = 'Fenrir';
        styleInstruction = "Configure Voice: Fenrir. Deliver this in a slow, soothing, deep-narrative cadence using a professional narrator voice: ";
      }

      const promptText = `${styleInstruction}\n\nDeliver the following script with precise pacing:\n${testText}`;

      const response = await fetch("/api/tts-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: promptText,
          lang: activeVoice.name.toLowerCase().includes("french") ? "French" : "English",
          voiceName: activeVoice.name,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (!data.base64Audio) {
        throw new Error("No audio data returned from TTS API");
      }

      const base64Audio = data.base64Audio;

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      
      let buffer: AudioBuffer;
      try {
        // Try decoding as container (WAV/MP3)
        buffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
      } catch (decodeErr) {
        // Fallback for raw PCM 16-bit signed, 24kHz Mono
        console.warn("Voice Test: Decoding failed, assuming raw PCM fallback", decodeErr);
        const length = Math.floor(bytes.buffer.byteLength / 2);
        const pcm16 = new Int16Array(bytes.buffer.slice(0, length * 2));
        buffer = ctx.createBuffer(1, pcm16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < pcm16.length; i++) {
          channelData[i] = pcm16[i] / 32768.0;
        }
      }

      const testBlob = new Blob([bytes], { type: "audio/mp3" });
      const testUrl = URL.createObjectURL(testBlob);
      setTestAudioUrl(testUrl);

      setTestAudioBuffer(buffer);
      setPreviewReady(true);
      toast.success("Neural preview generated.");
    } catch (err) {
      console.error("Test TTS Error:", err);
      toast.error("Failed to generate neural preview. Check console for details.");
    } finally {
      setIsTesting(false);
    }
  };

  const playPreview = () => {
    if (!testAudioBuffer || !audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    // If already playing, stop it
    if (isPlayingPreview && previewSourceRef.current) {
      try {
        previewSourceRef.current.stop();
      } catch (e) {
        console.warn("Error stopping preview source:", e);
      }
      setIsPlayingPreview(false);
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = testAudioBuffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
      setIsPlayingPreview(false);
    };

    previewSourceRef.current = source;
    setIsPlayingPreview(true);
    source.start(0);
    
    toast.info(`Playing neural voice: ${activeVoice?.name}`);
  };

  // --- Gemini Live API Integration ---

  const startLiveSession = async (voice: Voice) => {
    if (!user?.id) return;
    
    // 1. Safety cleanup of any stale resources
    stopLiveSession();
    
    // Explicitly close audio context if it was created at a different sample rate for TTS testing
    if (audioContextRef.current && audioContextRef.current.sampleRate !== 16000) {
      try {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      } catch (e) {
        console.warn("Failed to close old audio context", e);
      }
    }
    
    setLiveStatus("connecting");
    setTranscripts([]);
    setIsLiveOpen(true);
    setActiveVoice(voice);

    // Small delay to ensure hardware is released from previous tracks
    await new Promise(r => setTimeout(r, 200));

    try {
      // 2. Request Microphone FIRST
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        streamRef.current = stream;
      } catch (micErr: any) {
        console.error("Microphone access error:", micErr);
        let msg = "Cannot access the microphone.";
        
        if (micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError') {
          msg = "Microphone access denied. Please allow microphone access in your browser settings and try again.";
        } else if (micErr.name === 'NotReadableError' || micErr.name === 'TrackStartError' || micErr.message?.includes('Could not start audio source') || micErr.message?.includes('in use')) {
          msg = "Your microphone is being used by another application (like Zoom or another browser tab). Please close other apps and try again.";
        } else if (micErr.name === 'NotFoundError' || micErr.name === 'DevicesNotFoundError') {
          msg = "No microphone found. Please ensure your microphone is plugged in and recognized by your system.";
        }
        
        toast.error(msg, { duration: 5000 });
        setLiveStatus("idle");
        return;
      }

      // 3. Initialize/Resume Audio Context
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        try {
          audioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
        } catch (e) {
          console.warn("Failed to create 16kHz context, falling back to default", e);
          audioContextRef.current = new AudioContextClass();
        }
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // 4. Use sessionPromise pattern from SKILL.md
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { 
              prebuiltVoiceConfig: { 
                voiceName: (() => {
                  const lowercaseVoiceName = voice.name.toLowerCase();
                  if (lowercaseVoiceName.includes('professional female') || lowercaseVoiceName.includes('sora') || lowercaseVoiceName.includes('welcome') || lowercaseVoiceName.includes('sign-in') || lowercaseVoiceName.includes('handoff') || lowercaseVoiceName.includes('follow-up')) return 'Kore';
                  if (lowercaseVoiceName.includes('executive british') || lowercaseVoiceName.includes('zephyr')) return 'Zephyr';
                  if (lowercaseVoiceName.includes('storyteller') || lowercaseVoiceName.includes('aoede')) return 'Aoede';
                  if (lowercaseVoiceName.includes('warm energetic') || lowercaseVoiceName.includes('puck')) return 'Puck';
                  if (lowercaseVoiceName.includes('calm reassuring') || lowercaseVoiceName.includes('charon')) return 'Charon';
                  return 'Kore';
                })()
              } 
            },
          },
          systemInstruction: `You are ${voice.name}, a professional and helpful real estate assistant. 
          Your primary goals are:
          1. Provide information about properties (especially 888 Bel Air Road).
          2. LEAD CAPTURE: Early in the conversation, after the initial greeting, find a natural way to ask for the caller's name and contact information (phone or email). 
             Example: "Just in case we get disconnected while talking about the property, who am I speaking with and what's the best number to reach you back on?"
          3. If they hesitate, explain that you can send them the full property brochure via text or email.
          4. Represent the agency with warmth and competence.
          Keep your responses concise and tailored for a live conversation.`,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setLiveStatus("active");
            setIsLiveActive(true);
            
            if (!audioContextRef.current || !streamRef.current) return;

            const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
            
            source.connect(processor);
            processor.connect(audioContextRef.current.destination);
            
            // Store for cleanup
            if (sessionRef.current) {
              (sessionRef.current as any)._processor = processor;
              (sessionRef.current as any)._source = source;
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part?.inlineData?.data) {
                const base64Audio = part.inlineData.data;
                const binary = atob(base64Audio);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                const pcmData = new Int16Array(bytes.buffer);
                
                playbackQueueRef.current.push(pcmData);
                processPlaybackQueue();
              }

              if (part?.text) {
                const text = part.text;
                setTranscripts(prev => [...prev, { role: 'ai', text }]);
              }
            }

            if (message.serverContent?.interrupted) {
              playbackQueueRef.current = [];
              isPlayingRef.current = false;
            }
          },
          onclose: () => {
            stopLiveSession();
          },
          onerror: (err) => {
            console.error("Gemini Live Error:", err);
            toast.error("Live session encountered an error.");
            stopLiveSession();
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Session start error:", err);
      toast.error("Failed to start live session.");
      setLiveStatus("idle");
      setIsLiveActive(false);
    }
  };

  const processPlaybackQueue = async () => {
    if (isPlayingRef.current || playbackQueueRef.current.length === 0) return;
    
    isPlayingRef.current = true;
    const ctx = audioContextRef.current!;
    if (ctx.state === 'suspended') await ctx.resume();
    
    while (playbackQueueRef.current.length > 0) {
      const pcmData = playbackQueueRef.current.shift()!;
      const floatData = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) floatData[i] = pcmData[i] / 0x7FFF;
      
      const buffer = ctx.createBuffer(1, floatData.length, 24000);
      buffer.getChannelData(0).set(floatData);
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      
      await new Promise<void>((resolve) => {
        source.onended = () => resolve();
        source.start();
      });
    }
    
    isPlayingRef.current = false;
  };

  const stopLiveSession = () => {
    setIsLiveActive(false);
    setLiveStatus("idle");
    
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }

    if (sessionRef.current) {
      const s = sessionRef.current as any;
      if (s._processor) {
        try { s._processor.disconnect(); } catch (e) {}
      }
      if (s._source) {
        try { s._source.disconnect(); } catch (e) {}
      }
      try { s.close(); } catch (e) {}
      sessionRef.current = null;
    }

    playbackQueueRef.current = [];
    isPlayingRef.current = false;
  };

  const handleRateVoice = async (rating: number) => {
    if (!activeVoice || !user?.id) return;
    setUserRating(rating);
    
    try {
      const newCount = (activeVoice.ratingCount || 0) + 1;
      const currentRating = activeVoice.rating || 0;
      const newRating = Number(((currentRating * (activeVoice.ratingCount || 0) + rating) / newCount).toFixed(1));
      
      const voiceRef = doc(db, "users", user.id, "voices", activeVoice.id);
      await updateDoc(voiceRef, {
        rating: newRating,
        ratingCount: newCount
      });
      
      toast.success("Thank you for your feedback!");
    } catch (err) {
      toast.error("Failed to save rating");
    }
  };

  const handleSetDefault = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;

    const clickedVoice = voices.find(v => v.id === id);
    const isAlreadyDefault = clickedVoice?.isDefault;

    if (clickedVoice?.status !== 'Active' && !isAlreadyDefault) {
      toast.error("Inactive voices cannot be set as default. Please enable the voice first.");
      return;
    }

    try {
      const voicesRef = collection(db, "users", user.id, "voices");
      const currentVoices = await getDocs(voicesRef);
      
      for (const voiceDoc of currentVoices.docs) {
        const vId = voiceDoc.id;
        const vData = voiceDoc.data();
        
        if (vId === id) {
          // If already default, remove it. Otherwise, set it.
          await updateDoc(doc(db, "users", user.id, "voices", vId), { isDefault: !isAlreadyDefault });
        } else if (vData.isDefault) {
          // Unset any other defaults
          await updateDoc(doc(db, "users", user.id, "voices", vId), { isDefault: false });
        }
      }

      // Update user profile
      await updateDoc(doc(db, "users", user.id), { 
        defaultVoiceId: isAlreadyDefault ? null : id 
      });
      
      if (isAlreadyDefault) {
        toast.success("Default voice removed. New tours will use system defaults.");
      } else {
        toast.success("Voice set as system default for all new tours.");
      }
    } catch (err) {
      console.error("Error updating default voice:", err);
      toast.error("Failed to update default voice preference.");
    }
  };

  const handleToggleStatus = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;

    const voice = voices.find(v => v.id === id);
    if (!voice) return;

    try {
      const nextStatus: 'Active' | 'Inactive' = voice.status === 'Active' ? 'Inactive' : 'Active';
      const voiceRef = doc(db, "users", user.id, "voices", id);
      
      const updates: any = { status: nextStatus };
      if (nextStatus === 'Inactive' && voice.isDefault) {
        updates.isDefault = false;
        // Also clear user default if it was this one
        await updateDoc(doc(db, "users", user.id), { defaultVoiceId: null });
      }
      
      await updateDoc(voiceRef, updates);
      toast.info(`${voice.name} set to ${nextStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteVoice = async (voice: Voice, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setVoiceToDelete(voice);
    setIsDeleteOpen(true);
  };

  const confirmDeleteVoice = async () => {
    if (!voiceToDelete || !user?.id) return;

    try {
      const voiceRef = doc(db, "users", user.id, "voices", voiceToDelete.id);
      await deleteDoc(voiceRef);
      
      // If we deleted the default voice, clear it from user record
      if (voiceToDelete.isDefault) {
        await updateDoc(doc(db, "users", user.id), { defaultVoiceId: null });
      }

      toast.success(`${voiceToDelete.name} deleted successfully`);
      setIsDeleteOpen(false);
      setVoiceToDelete(null);
    } catch (err) {
      console.error("Delete voice error:", err);
      toast.error("Failed to delete voice model");
    }
  };

  const generateWelcomeAudio = async (lang: 'en' | 'fr') => {
    const activeList = voices.length > 0 ? voices : INITIAL_VOICES;
    const selectedVoice = activeList.find(v => v.id === welcomeVoiceId);
    if (!selectedVoice) {
      toast.error("Please select a voice model first.");
      return;
    }

    const isEn = lang === 'en';
    const text = isEn ? welcomeEnText : welcomeFrText;
    
    if (isEn) {
      setGeneratingEn(true);
      if (welcomeEnAudio) {
        welcomeEnAudio.pause();
        setPlayingEnWelcome(false);
      }
    } else {
      setGeneratingFr(true);
      if (welcomeFrAudio) {
        welcomeFrAudio.pause();
        setPlayingFrWelcome(false);
      }
    }

    try {
      // Map voice model name to Gemini TTS voice
      let voiceName = 'Kore';
      let styleInstruction = "";
      const lowerName = selectedVoice.name.toLowerCase();

      if (lowerName.includes('welcome') || lowerName.includes('first touch')) {
        voiceName = 'Kore';
        styleInstruction = `Configure Voice: Sora.
Audio Profile: Polished, warm, smooth, stable, and premium female persona. Sounds trustworthy, elegant, and highly professional, fitting a luxury real estate brand.
Director's Notes: Deliver with a smooth, warm, client-friendly tone. Pacing must be calm, relaxed, and completely natural. Do not sound high-pitched, excited, rushed, or robotic. Speak with absolute confidence and clarity. Use natural breathing pauses.`;
      } else if (lowerName.includes('tour intro') || lowerName.includes('aoede')) {
        voiceName = 'Aoede';
        styleInstruction = `Configure Voice: Aoede.
Audio Profile: Premium, fluid, highly engaging AI tour guide. Possesses an elegant, smooth rhythm with deep conversational inflections.
Director's Notes: Sound warm, highly informative, and confident. Keep the pace completely relaxed. The buyer should feel fluidly guided and educated, never hard-sold.`;
      } else if (lowerName.includes('lender') || lowerName.includes('financing')) {
        voiceName = 'Kore';
        styleInstruction = `Configure Voice: Sora.
Audio Profile: High-trust, mature, exceptionally composed, warm, and helpful female assistant handling sensitive real estate financing handoffs.
Director's Notes: Maintain a deeply respectful, supportive, steady, trustworthy, and non-pushy tone. Project calm authority and neutral helpfulness.`;
      } else if (lowerName.includes('follow-up') || lowerName.includes('sora') || lowerName.includes('umbriel') || lowerName.includes('nurture')) {
        voiceName = 'Kore';
        styleInstruction = `Configure Voice: Sora.
Audio Profile: Warm, deeply refined, thoughtful, friendly, and reassuring female assistant handling post-visit real estate operations.
Director's Notes: Use an encouraging, welcoming, and reassuring female tone (Sora). Keep the cadence steady, rhythmic, and natural.`;
      } else if (lowerName.includes('professional female') || lowerName.includes('sora') || lowerName.includes('kore')) {
        voiceName = 'Kore';
        styleInstruction = `Configure Voice: Sora.
Audio Profile: Polished, warm, smooth, stable, and premium female persona. Sounds trustworthy, elegant, and highly professional, fitting a luxury real estate brand.
Director's Notes: Deliver with a smooth, warm, client-friendly female tone (Sora). Pacing must be calm, relaxed, and completely natural. Speak with absolute confidence and clarity. Use natural breathing pauses.`;
      } else if (lowerName.includes('executive british') || lowerName.includes('zephyr')) {
        voiceName = 'Zephyr';
      } else if (lowerName.includes('storyteller')) {
        voiceName = 'Aoede';
      } else if (lowerName.includes('warm energetic') || lowerName.includes('puck')) {
        voiceName = 'Puck';
      } else if (lowerName.includes('calm reassuring') || lowerName.includes('charon')) {
        voiceName = 'Charon';
      } else if (lowerName.includes('deep narrator') || lowerName.includes('fenrir')) {
        voiceName = 'Fenrir';
      }

      const promptText = `${styleInstruction}\n\nDeliver the following script with precise pacing:\n${text}`;

      const response = await fetch("/api/tts-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: promptText,
          lang: isEn ? "English" : "French",
          voiceName: selectedVoice.name,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (!data.base64Audio) {
        throw new Error("No audio data returned from TTS API");
      }

      // Convert base64 to Blob
      const binary = atob(data.base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      
      const blob = new Blob([bytes], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);

      if (isEn) {
        setEnAudioUrl(url);
        toast.success("English welcome greeting generated successfully!");
      } else {
        setFrAudioUrl(url);
        toast.success("French welcome greeting generated successfully!");
      }
    } catch (err: any) {
      console.error("Generate welcome audio error:", err);
      toast.error(`Failed to generate welcome audio: ${err.message || "Unknown error"}`);
    } finally {
      if (isEn) {
        setGeneratingEn(false);
      } else {
        setGeneratingFr(false);
      }
    }
  };

  const togglePlayWelcomeEn = () => {
    if (playingEnWelcome) {
      welcomeEnAudio?.pause();
      setPlayingEnWelcome(false);
    } else {
      if (playingFrWelcome) {
        welcomeFrAudio?.pause();
        setPlayingFrWelcome(false);
      }
      if (!enAudioUrl) return;
      const audio = new Audio(enAudioUrl);
      audio.play().then(() => {
        setPlayingEnWelcome(true);
        setWelcomeEnAudio(audio);
        audio.onended = () => setPlayingEnWelcome(false);
      }).catch(err => {
        console.error("Welcome play error:", err);
        toast.error("Could not play generated English audio.");
      });
    }
  };

  const togglePlayWelcomeFr = () => {
    if (playingFrWelcome) {
      welcomeFrAudio?.pause();
      setPlayingFrWelcome(false);
    } else {
      if (playingEnWelcome) {
        welcomeEnAudio?.pause();
        setPlayingEnWelcome(false);
      }
      if (!frAudioUrl) return;
      const audio = new Audio(frAudioUrl);
      audio.play().then(() => {
        setPlayingFrWelcome(true);
        setWelcomeFrAudio(audio);
        audio.onended = () => setPlayingFrWelcome(false);
      }).catch(err => {
        console.error("Welcome play error:", err);
        toast.error("Could not play generated French audio.");
      });
    }
  };

  const handleSaveRename = async () => {
    if (!activeVoice || !user?.id) return;
    
    try {
      const voiceRef = doc(db, "users", user.id, "voices", activeVoice.id);
      await updateDoc(voiceRef, { name: editName });
      setIsEditOpen(false);
      toast.success("Voice renamed successfully");
    } catch (err) {
      toast.error("Failed to rename voice");
    }
  };

  const handleCreateClone = async () => {
    if (!newCloneName || !user?.id) {
      toast.error("Please enter a name for your clone");
      return;
    }
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(async () => {
      progress += 5;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        try {
          const voicesRef = collection(db, "users", user.id, "voices");
          await addDoc(voicesRef, {
            name: newCloneName,
            status: 'Processing',
            type: 'Cloned',
            rating: 0,
            ratingCount: 0,
            createdAt: Date.now()
          });
          
          setIsUploading(false);
          setIsCloneOpen(false);
          setNewCloneName("");
          setUploadProgress(0);
          toast.success("Voice cloning process started. This usually takes 10-15 minutes.");
        } catch (err) {
          toast.error("Failed to start cloning process");
          setIsUploading(false);
        }
      }
    }, 100);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto-populate name if empty or generic
      if (!newCloneName || newCloneName === "") {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setNewCloneName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
      toast.info(`Selected ${file.name} for cloning.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voice Lab</h1>
          <p className="text-slate-500 mt-1">Manage AI voices and custom voice clones for your tours. You can set the text for the welcome tour in AI Tour.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleRestoreDefaults} className="gap-2 border-slate-200">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> <span className="hidden xs:inline">Restore Defaults</span><span className="xs:hidden">Restore</span>
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
          <Zap className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-blue-900">How to select your AI Tour voice?</h2>
          <p className="text-xs text-blue-700 mt-0.5 font-medium">Use the <span className="font-black">"Set as Default"</span> button on any voice model below. Your chosen default voice will automatically be assigned to all new tours you create.</p>
        </div>
      </div>

      {/* Welcome Message Audio Builder Section */}
      <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-blue-600" /> Welcome Greetings Audio Builder
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Configure and generate high-quality neural welcome messages for your open houses and pilot listings.
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="space-y-1.5 flex-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Selected Voice Model</label>
            <select
              value={welcomeVoiceId}
              onChange={(e) => {
                setWelcomeVoiceId(e.target.value);
                // Reset generated URLs to prompt re-generation for the new voice model
                setEnAudioUrl(null);
                setFrAudioUrl(null);
                if (welcomeEnAudio) welcomeEnAudio.pause();
                if (welcomeFrAudio) welcomeFrAudio.pause();
                setPlayingEnWelcome(false);
                setPlayingFrWelcome(false);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {(voices.length > 0 ? voices : INITIAL_VOICES).filter(v => v.status === "Active").map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.type})</option>
              ))}
              {(voices.length > 0 ? voices : INITIAL_VOICES).filter(v => v.status !== "Active").length > 0 && <option disabled>─── Inactive Voices ───</option>}
              {(voices.length > 0 ? voices : INITIAL_VOICES).filter(v => v.status !== "Active").map(v => (
                <option key={v.id} value={v.id} disabled>{v.name} (Inactive)</option>
              ))}
            </select>
          </div>
          <div className="text-xs text-slate-500 md:max-w-md pt-2 md:pt-4">
            Generates optimized neural MP3 files tailored specifically for real estate open house greetings.
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* English Welcome Builder */}
          <div className="border border-slate-100 rounded-xl bg-slate-50/30 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">English Welcome Script</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">EN</span>
              </div>
              <textarea
                value={welcomeEnText}
                onChange={(e) => {
                  setWelcomeEnText(e.target.value);
                  setEnAudioUrl(null); // Reset URL on text change to force regeneration
                }}
                rows={4}
                className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                placeholder="Write the English welcome message here..."
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                onClick={() => generateWelcomeAudio('en')}
                disabled={generatingEn || !welcomeVoiceId}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-2 shrink-0"
              >
                {generatingEn ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" />
                    Generate Audio
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={!enAudioUrl}
                onClick={togglePlayWelcomeEn}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 disabled:opacity-50"
              >
                {playingEnWelcome ? <Pause className="h-4 w-4 text-red-500" /> : <Play className="h-4 w-4 text-blue-600" />}
                {playingEnWelcome ? "Pause" : "Play Preview"}
              </Button>
            </div>
          </div>

          {/* French Welcome Builder */}
          <div className="border border-slate-100 rounded-xl bg-slate-50/30 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">French Welcome Script</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">FR</span>
              </div>
              <textarea
                value={welcomeFrText}
                onChange={(e) => {
                  setWelcomeFrText(e.target.value);
                  setFrAudioUrl(null); // Reset URL on text change to force regeneration
                }}
                rows={4}
                className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                placeholder="Write the French welcome message here..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                onClick={() => generateWelcomeAudio('fr')}
                disabled={generatingFr || !welcomeVoiceId}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-2 shrink-0"
              >
                {generatingFr ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" />
                    Generate Audio
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={!frAudioUrl}
                onClick={togglePlayWelcomeFr}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-2 disabled:opacity-50"
              >
                {playingFrWelcome ? <Pause className="h-4 w-4 text-red-500" /> : <Play className="h-4 w-4 text-blue-600" />}
                {playingFrWelcome ? "Pause" : "Play Preview"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(voices.length > 0 ? voices : INITIAL_VOICES).map((voice) => (
          <div key={voice.id} className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col hover:border-blue-400 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 group">
            <div className="p-6 relative">
              <div className="absolute top-4 right-2 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <button type="button" className="p-2 text-slate-400 group-hover:text-blue-600 transition-colors bg-white/80 backdrop-blur-sm rounded-full cursor-pointer inline-block outline-none">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  } />
                  <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-slate-200">
                    <DropdownMenuItem className="gap-2 font-bold" onClick={(e) => {
                      e.stopPropagation();
                      setActiveVoice(voice);
                      setEditName(voice.name);
                      setIsEditOpen(true);
                    }}>
                      <Pencil className="h-4 w-4 text-blue-600" /> Rename Voice
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={`gap-2 font-bold ${voice.status !== 'Active' && !voice.isDefault && voice.id !== user?.defaultVoiceId ? 'opacity-50 cursor-not-allowed' : ''}`} 
                      onClick={(e) => handleSetDefault(voice.id, e)}
                    >
                      <CheckCircle2 className={`h-4 w-4 ${voice.isDefault || voice.id === user?.defaultVoiceId ? 'text-blue-600' : 'text-slate-300'}`} /> 
                      {voice.isDefault || voice.id === user?.defaultVoiceId ? "Remove Default" : "Set as Default"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 font-bold" onClick={(e) => handleToggleStatus(voice.id, e)}>
                      <RefreshCw className="h-4 w-4 text-emerald-600" /> 
                      Set to {voice.status === 'Active' ? 'Inactive' : 'Active'}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 font-bold text-red-600 focus:text-red-700 focus:bg-red-50" onClick={(e) => handleDeleteVoice(voice, e)}>
                      <Trash2 className="h-4 w-4" /> Delete Voice
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-start justify-between mb-4 pr-8">
                <div className={`p-3 rounded-full inline-block ${voice.type === 'Cloned' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                  <Mic2 className="h-6 w-6" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <button 
                    onClick={(e) => handleToggleStatus(voice.id, e)}
                    title="Click to toggle status"
                    className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-tight transition-all hover:scale-105 active:scale-95
                      ${voice.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : voice.status === 'Inactive' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-amber-100 text-amber-700'}
                    `}>
                    {voice.status}
                  </button>
                  {voice.isDefault || voice.id === user?.defaultVoiceId ? (
                    <button 
                      onClick={(e) => handleSetDefault(voice.id, e)}
                      title="Click to remove default setting"
                      className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md flex items-center gap-1 hover:bg-blue-700 transition-all active:scale-95"
                    >
                      <CheckCircle2 className="h-3 w-3" /> System Default
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => handleSetDefault(voice.id, e)}
                      disabled={voice.status !== 'Active'}
                      className={`px-2.5 py-1 border text-[10px] font-black uppercase tracking-widest rounded-full transition-all
                        ${voice.status === 'Active' 
                          ? 'border-blue-200 text-blue-600 hover:bg-blue-50' 
                          : 'border-slate-200 text-slate-300 cursor-not-allowed'}
                      `}
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {voice.name}
                {(voice.isDefault || voice.id === user?.defaultVoiceId) && <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">Default</span>}
              </h3>
              <p className="text-sm font-medium text-slate-500 mb-4">{voice.type} Voice Model</p>
              
              {voice.rating > 0 && (
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-bold text-slate-700 ml-1">{voice.rating} user rating</span>
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex gap-2">
                {voice.status === "Active" ? (
                  <>
                    <Button 
                      onClick={() => handleTestVoice(voice)}
                      className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 gap-2 shadow-none"
                    >
                      <Play className="h-4 w-4" /> Test
                    </Button>
                    <Button 
                      onClick={() => startLiveSession(voice)}
                      className="flex-1 bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 gap-2 shadow-none"
                    >
                      <MessageSquare className="h-4 w-4" /> Live
                    </Button>
                  </>
               ) : voice.status === "Inactive" ? (
                 <Button 
                   onClick={(e) => handleToggleStatus(voice.id, e)}
                   className="flex-1 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 gap-2 shadow-none group/btn"
                 >
                   <RefreshCw className="h-4 w-4 group-hover/btn:animate-spin" /> Inactive (Enable)
                 </Button>
               ) : (
                 <Button disabled className="flex-1 bg-white border border-slate-200 text-slate-400 gap-2 shadow-none opacity-60">
                   <RefreshCw className="h-4 w-4 animate-spin" /> Processing Clone
                 </Button>
               )}
            </div>
          </div>
        ))}

      </div>

      {/* Live Agent Session Dialog */}
      <Dialog open={isLiveOpen} onOpenChange={(val) => {
        if (!val && isLiveActive) {
          stopLiveSession();
        }
        setIsLiveOpen(val);
      }}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-white overflow-hidden p-0">
          <div className="p-8 space-y-8 relative overflow-hidden">
            {/* Animated background pulses */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl transition-all duration-1000 ${isLiveActive ? 'scale-150 opacity-50' : 'scale-100 opacity-20'}`} />
            
            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${isLiveActive ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                <DialogTitle className="text-xl">Live Conversation: {activeVoice?.name}</DialogTitle>
              </div>
              <DialogDescription className="text-slate-400">
                You are talking directly to your AI Listing agent.
              </DialogDescription>
            </DialogHeader>

            <div className="relative z-10 h-64 bg-black/40 rounded-3xl border border-white/5 flex flex-col p-6 overflow-y-auto custom-scrollbar">
              {transcripts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <Mic2 className="h-10 w-10 text-blue-400" />
                  <p className="text-sm">
                    {liveStatus === 'connecting' ? 'Connecting to neural network...' : 
                     liveStatus === 'idle' && !isLiveActive ? 'Microphone or Connection Error. Please check permissions and try again.' :
                     'Say something to start the conversation...'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transcripts.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600' : 'bg-white/10'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center space-y-6 relative z-10">
              <div className="flex gap-4">
                {[1,2,3,4,5,6,7].map(i => (
                  <div 
                    key={'bar-' + i} 
                    className={`w-1.5 rounded-full bg-blue-500 transition-all duration-150 ${isLiveActive ? 'animate-bounce' : 'h-1.5'}`} 
                    style={{ 
                      height: isLiveActive ? `${20 + Math.random() * 60}px` : '6px',
                      animationDelay: `${i * 100}ms`,
                      animationDuration: '600ms'
                    }} 
                  />
                ))}
              </div>

              {isLiveActive ? (
                <Button 
                  size="lg" 
                  onClick={stopLiveSession}
                  className="bg-red-500 hover:bg-red-600 rounded-full px-8 gap-2 font-bold h-14"
                >
                  <StopCircle className="h-5 w-5" /> End Session
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  onClick={() => activeVoice && startLiveSession(activeVoice)}
                  disabled={liveStatus === 'connecting'}
                  className="bg-blue-600 hover:bg-blue-700 rounded-full px-8 gap-2 font-bold h-14 shadow-xl shadow-blue-500/20"
                >
                  {liveStatus === 'connecting' ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Mic2 className="h-5 w-5" /> Start Conversation
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Voice Dialog */}
      <Dialog open={isTestOpen} onOpenChange={setIsTestOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-blue-600" />
              Test Voice: {activeVoice?.name}
            </DialogTitle>
            <DialogDescription>
              Enter any text to hear how this AI voice will sound during your listing tours.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="space-y-2 relative pb-10">
              <label className="text-xs font-bold uppercase text-slate-400">Sample Text</label>
              <textarea 
                value={testText}
                onChange={e => {
                  const val = e.target.value;
                  setTestText(val.charAt(0).toUpperCase() + val.slice(1));
                }}
                className="w-full h-28 p-4 rounded-xl border border-slate-200 bg-slate-50 resize-none focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm leading-relaxed"
              />
              {testText !== initialTestText && (
                <div className="absolute right-0 bottom-0">
                  <Button
                    type="button"
                    onClick={handleSaveCustomText}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1 h-8 rounded-lg shadow-sm font-semibold"
                  >
                    <Save className="h-3 w-3" /> Save Preset
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Premium Real Estate Presets</span>
                <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">Google AI Studio</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  {
                    title: "Welcome Message",
                    script: "[slow] Hi, I’m Sora, your AI property assistant. [pause] Welcome to this open house experience. [pause] I’m here to help you explore the home, answer questions, and guide you through the next steps at your own pace.",
                  },
                  {
                    title: "Kiosk Sign-In",
                    script: "[slow] Welcome in. [pause] Please take a moment to sign in so we can share property details and help personalize your visit. [pause] If you have any questions during the tour, I’ll be here to help.",
                  },
                  {
                    title: "AI Tour Intro",
                    script: "[slow] Welcome to the tour. [pause] As you move through the home, I can point out key features, answer questions, and help you learn more about the property. [pause] Take your time, and explore in whatever order feels most natural to you.",
                  },
                  {
                    title: "Lender Handoff",
                    script: "[slow] If you’d like, I can also connect you with a mortgage professional for financing questions. [pause] This is completely optional, but it can be helpful if you’d like to better understand budget, pre-approval, or next steps.",
                  },
                  {
                    title: "Follow-Up Message",
                    script: "[slow] Thank you for visiting today. [pause] I hope the tour helped you get a better feel for the home. [pause] If you’d like more details, want to revisit the property, or have financing questions, I’m here to help with the next step.",
                  },
                ].map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTestText(p.script)}
                    className="p-2 text-xs font-semibold text-center rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 shadow-sm transition-all cursor-pointer"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
            
            {isTesting ? (
              <div className="bg-blue-600 rounded-xl p-6 flex flex-col items-center justify-center space-y-4 text-white">
                <div className="flex gap-1 items-end h-8">
                  {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={'pulse-bar-' + i} className="w-1.5 bg-white/40 rounded-full animate-pulse" style={{ height: `${Math.random()*100}%`, animationDelay: `${i*100}ms` }} />
                  ))}
                </div>
                <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Generating Audio...</p>
              </div>
            ) : previewReady ? (
              <div className="space-y-6">
                <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-5.5 flex flex-col items-center justify-center space-y-3">
                  <div 
                    onClick={playPreview}
                    className="h-14 w-14 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-transform shadow-lg shadow-blue-200 animate-none"
                    title={isPlayingPreview ? "Stop" : "Play"}
                  >
                    {isPlayingPreview ? (
                      <Pause className="h-7 w-7" />
                    ) : (
                      <Play className="h-7 w-7 ml-1" />
                    )}
                  </div>
                  <div className="text-center flex flex-col items-center">
                    <p className="text-sm font-bold text-blue-900">
                      {isPlayingPreview ? "Playing neural preview..." : "Audio preview ready"}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {isPlayingPreview ? "Click button to Stop" : "Click button above to listen"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <div className="text-center space-y-3">
                    <p className="text-sm font-bold text-slate-900">How did it sound?</p>
                    <div className="flex justify-center gap-2">
                      {[1,2,3,4,5].map(i => (
                        <button 
                          key={i} 
                          onClick={() => handleRateVoice(i)}
                          className={`p-1 transition-all ${userRating >= i ? 'text-amber-500 scale-110' : 'text-slate-200 hover:text-amber-200'}`}
                        >
                          <Star className={`h-8 w-8 ${userRating >= i ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Rate to improve the model</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 rounded-xl p-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
                <Music className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-xs text-slate-500">Audio preview not generated</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              window.speechSynthesis.cancel();
              setIsTestOpen(false);
            }}>Close</Button>
            <Button 
              onClick={isPlayingPreview ? () => {
                if (previewSourceRef.current) {
                  try { previewSourceRef.current.stop(); } catch(e){}
                }
                setIsPlayingPreview(false);
              } : runTest} 
              disabled={isTesting} 
              className={`min-w-[120px] font-semibold text-white ${isPlayingPreview ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isTesting ? "Generating..." : isPlayingPreview ? "Stop" : previewReady ? "Regenerate" : "Generate Preview"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Voice Model</DialogTitle>
            <DialogDescription>Change the label for this voice to organize your library.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="e.g. Friendly Listing Agent"
              className="bg-white"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRename} className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Voice Clone Dialog */}
      <Dialog open={isCloneOpen} onOpenChange={(val) => !isUploading && setIsCloneOpen(val)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Voice Clone</DialogTitle>
            <DialogDescription>
              Clone your own voice or a client's voice with just 60 seconds of audio.
            </DialogDescription>
          </DialogHeader>
          
          {!isUploading ? (
            <div className="py-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400 tracking-tighter">Clone Label</label>
                <Input 
                  value={newCloneName}
                  onChange={e => setNewCloneName(e.target.value)}
                  placeholder="e.g. My Personal Clone"
                />
              </div>

              <div 
                className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300 transition-all cursor-pointer group relative"
                onClick={triggerFileUpload}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="audio/*" 
                  onChange={handleFileSelected} 
                />
                <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-transform mb-4 border ${selectedFile ? 'bg-green-50 text-green-500 border-green-100' : 'bg-blue-50 text-blue-500 border-blue-100'} group-hover:scale-110`}>
                  {selectedFile ? <CheckCircle2 className="h-8 w-8" /> : <Mic2 className="h-8 w-8" />}
                </div>
                <p className="text-sm font-bold text-slate-900 text-center">
                  {selectedFile ? selectedFile.name : "Record or Upload Audio"}
                </p>
                <p className="text-xs text-slate-500 mt-1 text-center font-medium">
                  {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to clone` : "MP3 or WAV preferred. Minimum 1 minute."}
                </p>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-[11px] text-amber-800 leading-tight">
                  By cloning a voice, you confirm you have legal permission to use the speaker's likeness for business communications.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-12 space-y-6">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full border-4 border-slate-100" />
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-blue-600 transition-all duration-300"
                    style={{ clipPath: `inset(${100 - uploadProgress}% 0 0 0)` }}
                  />
                  <Mic2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-blue-600 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Uploading Voice Sample</h4>
                  <p className="text-xs text-slate-500">{uploadProgress}% complete</p>
                </div>
              </div>
              
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" disabled={isUploading} onClick={() => setIsCloneOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateClone} 
              disabled={isUploading || !newCloneName}
              className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
            >
              {isUploading ? "Processing..." : "Start Cloning"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" /> Delete Voice Model
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-bold text-slate-900">"{voiceToDelete?.name}"</span>? 
              This action cannot be undone and this voice will no longer be available for tours.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteVoice} className="flex-1 sm:flex-none font-bold">
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
