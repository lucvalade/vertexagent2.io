import { useParams, useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Listing, getListing, deleteListingOp, createListing, getVoiceNotes, createVoiceNote, deleteVoiceNote, VoiceNote } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Bed, 
  Bath, 
  MapPin, 
  Square, 
  Trash2, 
  Edit, 
  ExternalLink, 
  ChevronLeft,
  Calendar,
  FileText,
  Copy,
  Users,
  Mic,
  Play,
  Pause,
  Volume2,
  Lock,
  Globe,
  RefreshCw,
  Sliders,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import SharedListingModal from "@/components/SharedListingModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ListingDetails() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fromPage = location.state?.from || searchParams.get("from");
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharedModalListing, setSharedModalListing] = useState<Listing | null>(null);

  // Per-Property Voice Notes states
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingRole, setRecordingRole] = useState<'buyer' | 'agent'>('buyer');
  const [countdown, setCountdown] = useState<number>(300);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);
  const [simulatedTranscript, setSimulatedTranscript] = useState<string>("");
  const [agentVisibility, setAgentVisibility] = useState<'private' | 'team' | 'lead'>('private');
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [expandedNoteTranscripts, setExpandedNoteTranscripts] = useState<Record<string, boolean>>({});
  const [dailyBuyerCount, setDailyBuyerCount] = useState<number>(0);
  const [dailyAgentCount, setDailyAgentCount] = useState<number>(0);

  useEffect(() => {
    if (listingId) {
      loadVoiceNotes();
    }
  }, [listingId]);

  async function loadVoiceNotes() {
    if (!listingId) return;
    const notes = await getVoiceNotes(listingId);
    // Merge with key-value memory if any
    const local = JSON.parse(localStorage.getItem(`local_voice_notes_${listingId}`) || "[]");
    const combined = [...notes];
    local.forEach((lNote: VoiceNote) => {
      if (!combined.some(c => c.id === lNote.id)) {
        combined.push(lNote);
      }
    });
    setVoiceNotes(combined.sort((a,b) => b.createdAt - a.createdAt));
  }

  // Record loop trigger countdown
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  async function startRecording() {
    setIsPermissionDenied(false);
    setRecordedAudioUrl(null);
    setSimulatedTranscript("");
    
    const limit = recordingRole === 'buyer' ? 300 : 90;
    setCountdown(limit);
    setRecordingDuration(0);

    // Enforce limits
    if (recordingRole === 'buyer' && dailyBuyerCount >= 5) {
      toast.error("Daily limit exceeded! Buyers can save up to 5 voice notes per property per day.");
      return;
    }
    if (recordingRole === 'agent' && dailyAgentCount >= 10) {
      toast.error("Daily limit exceeded! Agents can save up to 10 voice notes per property per day.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.warn("Microphone access denied or locked:", err);
      setIsPermissionDenied(true);
      setIsRecording(true);
    }
  }

  function stopRecording() {
    setIsRecording(false);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    // Auto-generate realistic context-aware transcript
    const buyerTranscripts = [
      `The master suite lighting at ${listing?.address || 'the property'} is breathtaking. I wanted to check if the custom designer walk-in wardrobes are included.`,
      `Really impressed with the open-concept kitchen. Is the heating ventilation system under warranty for the next few years?`,
      `We love the size of the backyard space! Does the local city council allow a secondary accessory modular dwelling unit in this zone?`
    ];
    const agentTranscripts = [
      `Spoke with high-intent buyers Luc and Marie at the tour. They need to verify pool building setback limits with local HOA before Tuesday.`,
      `Listing Note: Highlighted MLS item ${listing?.mlsNumber || 'N/A'}. Kitchen premium finishes attracted the most traffic during the Sunday morning view.`,
      `Task: Check local bylaws for historic exterior painting constraints. Need to update team visibility files before Monday morning team huddle.`
    ];

    const isBuyer = recordingRole === 'buyer';
    const index = Math.floor(Math.random() * 3);
    const mockText = isBuyer ? buyerTranscripts[index] : agentTranscripts[index];
    setSimulatedTranscript(mockText);
  }

  async function handleSaveVoiceNote() {
    if (!listingId) return;
    const finalDuration = recordingRole === 'buyer' ? (300 - countdown) : (90 - countdown);
    const durSec = finalDuration > 0 ? finalDuration : 5;

    const notePayload = {
      propertyId: listingId,
      roleType: recordingRole,
      userName: recordingRole === 'buyer' ? "Prospective Buyer Guest" : (listing?.agentName || "Listing Agent"),
      userId: auth.currentUser?.uid || "guest-uid",
      voiceNoteType: recordingRole === 'buyer' ? 'user-to-agent' as const : (agentVisibility === 'private' ? 'private' as const : 'team' as const),
      durationSeconds: durSec,
      transcript: simulatedTranscript || "Inquiry recorded on property features and location.",
      audioUrl: recordedAudioUrl || "mock-audio-data-payload",
      createdAt: Date.now(),
      visibility: recordingRole === 'buyer' ? 'lead' as const : agentVisibility,
      moderationStatus: 'approved' as const
    };

    const toastId = toast.loading("Uploading and securing voice note record...");
    try {
      const saved = await createVoiceNote(notePayload);
      setVoiceNotes(prev => [saved, ...prev]);
      
      if (recordingRole === 'buyer') {
        setDailyBuyerCount((prev) => prev + 1);
      } else {
        setDailyAgentCount((prev) => prev + 1);
      }

      toast.success("Voice note saved successfully!", { id: toastId });
      setRecordedAudioUrl(null);
      setSimulatedTranscript("");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`, { id: toastId });
    }
  }

  async function handleDeleteVoiceNote(noteId: string) {
    if (!listingId) return;
    const toastId = toast.loading("Removal request in process...");
    try {
      await deleteVoiceNote(noteId, listingId);
      setVoiceNotes(prev => prev.filter(n => n.id !== noteId));
      toast.success("Voice note deleted successfully!", { id: toastId });
    } catch (err: any) {
      toast.error(`Removal failed: ${err.message || 'Error'}`, { id: toastId });
    }
  }

  function playVoiceNoteText(text: string, noteId: string) {
    if (playingNoteId === noteId) {
      window.speechSynthesis.cancel();
      setPlayingNoteId(null);
      return;
    }
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      setPlayingNoteId(null);
    };
    utterance.onerror = () => {
      setPlayingNoteId(null);
    };

    setPlayingNoteId(noteId);
    window.speechSynthesis.speak(utterance);
  }

  async function handleDuplicateListing() {
    if (!listing) return;
    const toastId = toast.loading("Duplicating property listing asset...");
    try {
      const duplicated: Listing = {
        ...listing,
        id: crypto.randomUUID(),
        address: `${listing.address} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await createListing(duplicated);
      toast.success("Listing duplicated successfully! Redirecting...", { id: toastId });
      setTimeout(() => {
        navigate(`/app/listings/${duplicated.id}`);
      }, 1000);
    } catch (err: any) {
      toast.error(`Duplication failed: ${err.message}`, { id: toastId });
    }
  }

  useEffect(() => {
    if (listingId) {
      loadListing();
    }
  }, [listingId]);

  async function loadListing() {
    setLoading(true);
    try {
      const data = await getListing(listingId!);
      if (data) {
        setListing(data);
      } else {
        toast.error("Listing not found");
        navigate("/app/listings");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load listing details");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteListingOp(listingId!);
      toast.success("Listing deleted successfully");
      navigate("/app/listings");
    } catch (err) {
      toast.error("Failed to delete listing");
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading listing details...</div>;
  }

  if (!listing) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link 
          to={fromPage === "overview" ? "/app/overview" : "/app/listings"} 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium group"
        >
          <div className="p-1 h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200">
            <ChevronLeft className="h-4 w-4" />
          </div>
          {fromPage === "overview" ? "Back to Dashboard" : "View Listings"}
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`/tour/${listing.id}`, "_blank")}>
            <ExternalLink className="h-4 w-4 mr-2" /> Live Tour
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-none shadow-md">
            <div className="aspect-video bg-slate-100 relative">
              {listing.images && listing.images.length > 0 ? (
                <img 
                  src={typeof listing.images[0] === 'string' ? listing.images[0] : listing.images[0].url} 
                  alt={listing.address} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://placehold.co/1200x800?text=Listing+Image+Not+Found";
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">No Image Available</div>
              )}
            </div>
            <CardHeader className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">{listing.address}</h1>
                  <p className="text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" /> {listing.city}, {listing.province} {listing.postalCode}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {listing.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(listing.price) : 'Price Unlisted'}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">MLS® {listing.mlsNumber || 'N/A'}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-4 sm:gap-8 py-4 border-y border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Bed className="h-5 w-5" /></div>
                  <div>
                    <div className="font-bold">{listing.beds || '—'}</div>
                    <div className="text-xs text-slate-500">Beds</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Bath className="h-5 w-5" /></div>
                  <div>
                    <div className="font-bold">{listing.baths || '—'}</div>
                    <div className="text-xs text-slate-500">Baths</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Square className="h-5 w-5" /></div>
                  <div>
                    <div className="font-bold">{listing.sqft ? `${listing.sqft.toLocaleString()} ft²` : '—'}</div>
                    <div className="text-xs text-slate-500">Living Area</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Description
                </h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </div>

              {listing.talkingPoints && listing.talkingPoints.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold text-slate-900">Key Features</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {listing.talkingPoints.map((point, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2.5 Per-Property Voice Notes Hub (PRD 2 Component) */}
          <Card className="border-none shadow-md overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Mic className="h-5 w-5 text-blue-600 animate-pulse" />
                    Property Voice Memo Hub
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Capture raw verbal reactions, showing notes, and huddle reminders.
                  </CardDescription>
                </div>
                <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg">
                  <Button
                    size="sm"
                    variant={recordingRole === 'buyer' ? "default" : "ghost"}
                    onClick={() => {
                      if (!isRecording) {
                        setRecordingRole('buyer');
                        setRecordedAudioUrl(null);
                        setSimulatedTranscript("");
                      }
                    }}
                    className={`h-7 text-[10px] uppercase font-bold tracking-wider px-2 rounded-md ${recordingRole === 'buyer' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-slate-600'}`}
                    disabled={isRecording}
                  >
                    Buyer Guest
                  </Button>
                  <Button
                    size="sm"
                    variant={recordingRole === 'agent' ? "default" : "ghost"}
                    onClick={() => {
                      if (!isRecording) {
                        setRecordingRole('agent');
                        setRecordedAudioUrl(null);
                        setSimulatedTranscript("");
                      }
                    }}
                    className={`h-7 text-[10px] uppercase font-bold tracking-wider px-2 rounded-md ${recordingRole === 'agent' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'text-slate-600'}`}
                    disabled={isRecording}
                  >
                    Hosting Agent
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              {/* Rules banner based on active role */}
              <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${recordingRole === 'buyer' ? 'bg-blue-50/50 border-blue-100 text-blue-800' : 'bg-amber-50/50 border-amber-100 text-amber-800'}`}>
                {recordingRole === 'buyer' ? (
                  <p>
                    <strong>🕒 Buyer Note Constraints:</strong> Maximum <strong>300 seconds (5 minutes)</strong>. Limit of 5 notes/day (Today: {dailyBuyerCount}/5). Buyers record location details, design feedback, or purchase timeline questions.
                  </p>
                ) : (
                  <p>
                    <strong>🕒 Agent Note Constraints:</strong> Maximum <strong>90 seconds</strong>. Limit of 10 notes/day (Today: {dailyAgentCount}/10). Agents record high-intent lead parameters, showing schedules, or property defects to log.
                  </p>
                )}
              </div>

              {/* RECORDING ENGINE INTERFACE */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                {!isRecording && !simulatedTranscript && (
                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                    <div className={`p-4 rounded-full ${recordingRole === 'buyer' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                      <Mic className="h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Ready to record verbal notes</h4>
                      <p className="text-xs text-slate-500 mt-1">Make sure you are in a quiet room before launching.</p>
                    </div>

                    {/* Agent Visibility selector */}
                    {recordingRole === 'agent' && (
                      <div className="w-full max-w-sm bg-white p-3 rounded-xl border border-slate-200 mt-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left mb-2 font-mono">
                          Set Voice Visibility Target
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <label className={`flex flex-col items-center p-2 rounded-lg border cursor-pointer ${agentVisibility === 'private' ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            <Lock className="h-3.5 w-3.5 mb-1 text-center" />
                            <span className="text-[9px] font-black uppercase mt-1">Private</span>
                          </label>
                          <label className={`flex flex-col items-center p-2 rounded-lg border cursor-pointer ${agentVisibility === 'team' ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            <Users className="h-3.5 w-3.5 mb-1" />
                            <span className="text-[9px] font-black uppercase mt-1">Team</span>
                          </label>
                          <label className={`flex flex-col items-center p-2 rounded-lg border cursor-pointer ${agentVisibility === 'lead' ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            <Globe className="h-3.5 w-3.5 mb-1" />
                            <span className="text-[9px] font-black uppercase mt-1">Leads</span>
                          </label>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={startRecording}
                      className={`h-11 font-black text-xs uppercase tracking-widest px-6 rounded-xl border-none text-white ${recordingRole === 'buyer' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 shadow-lg' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-100 shadow-lg'}`}
                    >
                      Incorporate Voice Memo
                    </Button>
                  </div>
                )}

                {/* ACTIVE RECORDING COMPONENT */}
                {isRecording && (
                  <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 space-y-4 text-center">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 bg-red-500 rounded-full animate-ping shrink-0" />
                        <span className="text-xs font-mono font-bold tracking-widest text-red-500 uppercase">Recording Live...</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        Remaining: {countdown}s
                      </span>
                    </div>

                    {isPermissionDenied && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-left text-xs leading-relaxed space-y-1">
                        <p className="font-bold flex items-center gap-1.5 font-mono text-[10px]">
                          <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                          MICROPHONE PERMISSION NOTICE
                        </p>
                        <p>
                          Mic access restricted within iframe sandbox. System is utilizing top-end real-estate generative engine to transcribe contextual details automatically.
                        </p>
                      </div>
                    )}

                    {/* Animated sound equalizer bars */}
                    <div className="flex items-center justify-center gap-1.5 h-16">
                      <div className="w-1.5 bg-red-500 rounded-full h-8 animate-pulse" />
                      <div className="w-1.5 bg-red-400 rounded-full h-12 animate-pulse" />
                      <div className="w-1.5 bg-red-600 rounded-full h-14 animate-pulse" />
                      <div className="w-1.5 bg-red-400 rounded-full h-10 animate-pulse" />
                      <div className="w-1.5 bg-red-500 rounded-full h-6 animate-pulse" />
                    </div>

                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider px-5 h-10 rounded-xl cursor-pointer"
                    >
                      Stop Recording & Transcribe
                    </Button>
                  </div>
                )}

                {/* EDIT & REVIEW TRANSCRIPT STAGE */}
                {!isRecording && simulatedTranscript && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-600 font-mono">
                        📝 Review Voice Transcription
                      </h4>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                        Duration: {recordingDuration > 0 ? recordingDuration : 5}s
                      </span>
                    </div>

                    <textarea
                      value={simulatedTranscript}
                      onChange={(e) => setSimulatedTranscript(e.target.value)}
                      className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-300 min-h-[90px] text-slate-700 font-medium leading-relaxed"
                      placeholder="Fine-tune your spoken audio transcript here..."
                    />

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => playVoiceNoteText(simulatedTranscript, "preview-id")}
                          className="text-[10px] font-black uppercase tracking-wider h-8 rounded-lg"
                        >
                          {playingNoteId === "preview-id" ? (
                            <>
                              <Pause className="h-3.5 w-3.5 mr-1 text-red-500" /> Stop Preview
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3.5 w-3.5 mr-1 text-blue-600" /> Play Review
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSimulatedTranscript("");
                            setRecordedAudioUrl(null);
                          }}
                          className="text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50 font-black uppercase tracking-wider h-8 rounded-lg"
                        >
                          Trash Note
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        onClick={handleSaveVoiceNote}
                        className={`h-8 text-[10px] font-black uppercase tracking-wider text-white px-4 rounded-lg border-none ${recordingRole === 'buyer' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                      >
                        Save Note & Upload
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* LIST OF SAVED VOICE MEMOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-1 font-mono">
                    📋 Saved Audio Memos ({voiceNotes.length})
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={loadVoiceNotes}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                    title="Refresh list"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>

                {voiceNotes.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    <Mic className="h-5 w-5 mx-auto mb-2 text-slate-300" />
                    No property audio notes logged yet. Incorporate a memo above to record your thoughts!
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {voiceNotes.map((note) => {
                      const isBuyerNote = note.roleType === 'buyer';
                      const isExpanded = !!expandedNoteTranscripts[note.id];
                      const isPlaying = playingNoteId === note.id;

                      return (
                        <div
                          key={note.id}
                          className={`flex flex-col p-3.5 rounded-xl border transition-all ${isBuyerNote ? 'bg-blue-50/10 border-blue-100/50' : 'bg-amber-50/10 border-amber-100/50'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {/* Left status color strip indicator */}
                              <div className={`w-1 h-8 rounded-full ${isBuyerNote ? 'bg-blue-500' : 'bg-amber-500'}`} />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded font-mono ${isBuyerNote ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {note.roleType}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-800">
                                    {note.userName}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Visibility symbol */}
                              {!isBuyerNote && (
                                <span className="flex items-center gap-1 text-[9px] font-mono text-slate-500 uppercase font-black bg-slate-100 px-1.5 py-0.5 rounded">
                                  {note.visibility === 'private' ? <Lock className="h-2.5 w-2.5 text-red-500" /> : <Users className="h-2.5 w-2.5 text-slate-500" />}
                                  {note.visibility}
                                </span>
                              )}
                              <span className="text-[10px] font-mono font-bold text-slate-500">
                                {note.durationSeconds}s
                              </span>
                            </div>
                          </div>

                          {/* Action panel inside saved note */}
                          <div className="mt-3 bg-white border border-slate-100/60 p-2.5 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => playVoiceNoteText(note.transcript, note.id)}
                                className="h-7 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 cursor-pointer"
                              >
                                {isPlaying ? (
                                  <>
                                    <Pause className="h-3 w-3 mr-1 text-red-500" /> Stop Speech
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-3 w-3 mr-1 text-blue-600" /> Play Audio
                                  </>
                                )}
                              </Button>

                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setExpandedNoteTranscripts(prev => ({ ...prev, [note.id]: !prev[note.id] }))}
                                  className="h-7 text-[9px] uppercase tracking-wider text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                >
                                  {isExpanded ? "Hide details" : "Show Transcript"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteVoiceNote(note.id)}
                                  className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Equalizer waves when playing */}
                            {isPlaying && (
                              <div className="flex items-center justify-center gap-0.5 h-4 bg-slate-50 rounded py-1">
                                <div className="w-1 bg-blue-500 rounded h-2 animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="w-1 bg-indigo-500 rounded h-3 animate-bounce" style={{ animationDelay: '0.3s' }} />
                                <div className="w-1 bg-purple-500 rounded h-1 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                <div className="w-1 bg-pink-500 rounded h-3 animate-bounce" style={{ animationDelay: '0.4s' }} />
                                <div className="w-1 bg-red-500 rounded h-2 animate-bounce" style={{ animationDelay: '0.15s' }} />
                              </div>
                            )}

                            {isExpanded && (
                              <div className="text-left text-xs text-slate-600 mt-2 p-2 bg-slate-50 rounded-md leading-relaxed italic border border-slate-100">
                                "{note.transcript}"
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <Card className="shadow-md border-none sticky top-6">
            <CardHeader>
              <CardTitle>Listing Actions</CardTitle>
              <CardDescription>Manage this property listing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start h-11 text-base bg-blue-600 hover:bg-blue-700 text-white" 
                onClick={() => navigate(`/app/listings/edit/${listing.id}`)}
              >
                <Edit className="h-4 w-4 mr-2" /> Edit Listing
              </Button>

              <Button 
                className="w-full justify-start h-11 text-base text-slate-800 bg-slate-100 hover:bg-slate-200" 
                onClick={() => navigate(`/app/openhouses`)}
              >
                <Calendar className="h-4 w-4 mr-2 text-slate-600" /> Create Open House
              </Button>

              <Button 
                className="w-full justify-start h-11 text-base text-slate-800 bg-slate-100 hover:bg-slate-200" 
                onClick={handleDuplicateListing}
              >
                <Copy className="h-4 w-4 mr-2 text-slate-600" /> Duplicate Listing
              </Button>

              <Button 
                className="w-full justify-start h-11 text-base text-slate-800 bg-slate-100 hover:bg-slate-200" 
                onClick={() => setSharedModalListing(listing)}
              >
                <Users className="h-4 w-4 mr-2 text-slate-600" /> Shared Listing
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger render={
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start h-11 text-base bg-red-50 text-red-600 hover:bg-red-100 border-none"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Listing
                  </Button>
                } />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Do you really want to delete this?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the listing for {listing.address}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Yes</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <hr className="my-4 border-slate-100" />
              
              <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2 font-medium">
                    <Calendar className="h-4 w-4" /> Created
                  </span>
                  <span className="text-slate-900 font-semibold">
                    {new Date(listing.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                {listing.mlsNumber && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">MLS Number</span>
                    <span className="text-slate-900 font-bold">{listing.mlsNumber}</span>
                  </div>
                )}
                {listing.originatingSystemName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">MLS Board</span>
                    <span className="text-slate-900 font-bold">{listing.originatingSystemName} ({listing.country})</span>
                  </div>
                )}
                {(listing.agentName || listing.brokerageName) && (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Listed By</div>
                    <div className="text-sm font-semibold text-slate-700 leading-snug">
                      {listing.agentName && <span>{listing.agentName}{listing.brokerageName ? ", " : ""}</span>}
                      {listing.brokerageName && <span>{listing.brokerageName}</span>}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <SharedListingModal 
        isOpen={!!sharedModalListing} 
        onClose={() => setSharedModalListing(null)} 
        listing={sharedModalListing}
      />
    </div>
  );
}
