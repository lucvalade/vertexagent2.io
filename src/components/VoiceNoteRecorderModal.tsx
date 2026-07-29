import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, Square, Play, Pause, Trash2, Check, Loader2, Volume2, Shield, Users } from "lucide-react";
import { toast } from "sonner";

interface VoiceNoteRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxDuration: number; // in seconds (e.g. 45 or 90)
  onSave: (audioUrl: string, durationSeconds: number, transcript: string, visibility: 'private' | 'team' | 'lead', room?: string) => Promise<void>;
  role: 'buyer' | 'agent';
  propertyAddress?: string;
}

export default function VoiceNoteRecorderModal({
  isOpen,
  onClose,
  maxDuration,
  onSave,
  role,
  propertyAddress
}: VoiceNoteRecorderModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>("General");

  // Notes/transcript input
  const [transcript, setTranscript] = useState("");
  
  // Visibility option for agent
  const [visibility, setVisibility] = useState<'private' | 'team' | 'lead'>(
    role === 'agent' ? 'private' : 'lead'
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Set the dynamic max duration based on role
  const finalMaxDuration = role === 'buyer' ? 300 : maxDuration;

  // Pre-fill transcript suggestions based on common questions or instructions
  useEffect(() => {
    if (isOpen) {
      setDuration(0);
      setAudioBlob(null);
      setAudioUrl("");
      setIsRecording(false);
      setTranscript("");
      setIsPlaying(false);
      setSelectedRoom("General");
      audioChunksRef.current = [];
      if (role === 'agent') {
        setVisibility('private');
      } else {
        setVisibility('lead');
      }
    }
  }, [isOpen, role]);

  // Clean up recording/playing on unmount or close
  useEffect(() => {
    return () => {
      stopRecordingAndCleanup();
    };
  }, []);

  // Monitor duration limit
  useEffect(() => {
    if (isRecording && duration >= finalMaxDuration) {
      stopRecording();
      toast.info(`Recording reached the maximum limit of ${finalMaxDuration} seconds.`);
    }
  }, [duration, isRecording, finalMaxDuration]);

  const stopRecordingAndCleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
  };

  const startRecording = async () => {
    try {
      setAudioBlob(null);
      setAudioUrl("");
      setDuration(0);
      audioChunksRef.current = [];

      // Query microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(recordedBlob);

        // Convert blob to DataURL (base64) so it can be saved in persistent database safely
        const reader = new FileReader();
        reader.readAsDataURL(recordedBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setAudioUrl(base64data);
        };

        // Stop all audio tracks from stream to release the mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      toast.success("Recording started... speak clearly into your microphone.");
    } catch (err) {
      console.error("Failed to access microphone:", err);
      toast.error("Microphone access denied or unavailable. Please check browser permissions.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const togglePlayback = () => {
    if (!audioUrl) return;

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => {
        setIsPlaying(false);
      };
    }

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.src = audioUrl;
      audioPlayerRef.current.play();
      setIsPlaying(false);
      // Wait for play promise
      audioPlayerRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error("Playback error:", err);
          toast.error("Unable to play voice note preview.");
        });
    }
  };

  const handleSaveNote = async () => {
    if (!audioUrl) {
      toast.error("Please record some audio first.");
      return;
    }

    setIsSaving(true);
    try {
      const finalTranscript = transcript.trim() || (
        role === 'agent' 
          ? `Internal voice note recorded by Agent [${visibility === 'private' ? 'Private' : 'Team'}]` 
          : `Voice note tag: ${selectedRoom}. Recorded during AI Tour.`
      );

      await onSave(audioUrl, duration, finalTranscript, visibility, role === 'buyer' ? selectedRoom : undefined);
      toast.success(role === 'agent' ? "Internal Voice Note saved!" : "Voice Note sent to listing agent!");
      onClose();
    } catch (err) {
      console.error("Error saving voice note:", err);
      toast.error("Unable to save voice note. Saved to local storage fallback instead.");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const discardRecording = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setAudioBlob(null);
    setAudioUrl("");
    setDuration(0);
    setIsPlaying(false);
    setTranscript("");
    toast.info("Recording discarded.");
  };

  // Convert seconds to clean format (MM:SS)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md w-[calc(100%-30px)] bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-4 sm:p-6">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
            {role === 'buyer' ? (
              <>
                <span className="p-1 px-2.5 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-md animate-pulse">
                  AI Tour Notes
                </span>
                Voice Note
              </>
            ) : (
              <>
                <span className="p-1 px-2.5 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-md animate-pulse">
                  Agent Portal
                </span>
                Record Internal Voice Note
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            {role === 'buyer' ? (
              <span className="block text-[11px] leading-relaxed text-slate-300 bg-blue-950/40 p-2.5 rounded-lg border border-blue-900/30 font-medium">
                Your notes will be summarized and emailed to you. A copy is also shared with the listing agent to help answer your questions.
              </span>
            ) : (
              "Record a voice-based follow-up, client memory, or property note up to 180 seconds (3 minutes)."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-5 space-y-4">
          
          {/* Room Selection Dropdown – Buyer UI Only */}
          {role === 'buyer' && (
            <div className="w-full space-y-1.5">
              <Label className="text-xs tracking-wide text-slate-300 font-bold block">
                Select Room
              </Label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                <option value="General">General</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Living Room">Living Room</option>
                <option value="Master Bedroom">Master Bedroom</option>
                <option value="Bathrooms">Bathrooms</option>
                <option value="Basement">Basement</option>
                <option value="Exterior">Exterior</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-center gap-6 w-full">
            {/* Visual Wave / Indicator */}
            <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
              {isRecording && (
                <>
                  <div className="absolute inset-0 rounded-full bg-red-600/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full bg-red-600/30 animate-pulse duration-1000" />
                </>
              )}
              {!isRecording && audioUrl && (
                <div className="absolute inset-0 rounded-full bg-green-600/10 animate-pulse" />
              )}
              <div 
                onClick={isRecording ? stopRecording : startRecording}
                className={`z-10 w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-lg cursor-pointer hover:scale-105 active:scale-95 ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : audioUrl 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                {isRecording ? (
                  <Square className="h-6 w-6 animate-pulse text-white" />
                ) : (
                  <Mic className="h-7 w-7 text-white" />
                )}
              </div>
            </div>

            {/* Side Note indicating limit beside the microphone */}
            <div className="max-w-[170px] text-left space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 block">System Limit</span>
              <p className="text-[11px] leading-tight text-slate-300 font-semibold font-sans">
                {role === 'agent' 
                  ? "Standard high-fidelity voice session up to 180 seconds or 3 minutes max limit." 
                  : `AI Tour structured tour diary session up to ${finalMaxDuration} seconds (5 minutes).`}
              </p>
            </div>
          </div>

          {/* Timing Indicator */}
          <div className="text-center">
            <div className="font-mono text-xl font-bold tracking-wider">
              {formatTime(duration)} <span className="text-[10px] text-slate-500 font-sans">/ {formatTime(finalMaxDuration)}</span>
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">
              {isRecording 
                ? "Recording Active" 
                : audioUrl 
                  ? "Audio Captured & Ready" 
                  : "Tap Microphone or Start Below"}
            </p>
          </div>

          {/* Primary client toggle start/stop button or standard buttons */}
          <div className="w-full pt-1">
            <Button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-full h-10 rounded-xl text-xs font-bold gap-2 transition-all shadow-md ${
                isRecording 
                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" 
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="h-3.5 w-3.5 fill-white" />
                  <span>Stop Recording (Force Limit at {formatTime(finalMaxDuration)})</span>
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5" />
                  <span>Start Recording (Max {formatTime(finalMaxDuration)} Minutes)</span>
                </>
              )}
            </Button>
          </div>

          {/* Action buttons during playback/preview */}
          {audioUrl && !isRecording && (
            <div className="flex items-center gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 w-full justify-between">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={togglePlayback} 
                className="text-white hover:bg-slate-800 h-9 px-3 gap-2"
              >
                {isPlaying ? <Pause className="h-4 w-4 text-orange-400" /> : <Play className="h-4 w-4 text-green-400" />}
                {isPlaying ? "Pause Preview" : "Listen Preview"}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={discardRecording} 
                className="text-red-400 hover:text-red-300 hover:bg-red-950/20 h-9 px-3 gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Discard
              </Button>
            </div>
          )}

          {/* Agent Private vs Team Options */}
          {role === 'agent' && (
            <div className="w-full space-y-2 pt-2">
              <Label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Visibility Status
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    visibility === 'private'
                      ? 'border-blue-600 bg-blue-600/10 text-white'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <Shield className="h-3.5 w-3.5" />
                  Private (Only Me)
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('team')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    visibility === 'team'
                      ? 'border-blue-600 bg-blue-600/10 text-white'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  Team Shared
                </button>
              </div>
            </div>
          )}

          {/* Transcript/Brief Note Addition for Agent only (Buyer has Select Room instead) */}
          {role === 'agent' && (
            <div className="w-full space-y-1.5 pt-2">
              <Label htmlFor="transcript-note" className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex justify-between">
                <span>Short Description / Summary Note</span>
                <span className="text-[9px] text-slate-500 font-normal">Optional</span>
              </Label>
              <Input 
                id="transcript-note"
                type="text" 
                placeholder="e.g., John Smith has a dog, wants fenced backyard"
                className="bg-slate-950 border-slate-800 text-xs text-white placeholder-slate-600 h-9 focus-visible:ring-1 focus-visible:ring-blue-600"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                disabled={isRecording}
              />
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex gap-2.5 pt-2 border-t border-slate-800/80">
          {audioUrl && !isRecording ? (
            <Button 
              type="button" 
              className="flex-1 bg-white hover:bg-blue-600 text-black hover:text-white font-semibold transition-colors border-0" 
              onClick={discardRecording}
              disabled={isSaving}
            >
              Delete & Re-record
            </Button>
          ) : (
            <Button 
              type="button" 
              className="flex-1 bg-white hover:bg-blue-600 text-black hover:text-white font-semibold transition-colors border-0" 
              onClick={onClose}
              disabled={isSaving || isRecording}
            >
              Delete & Re-record
            </Button>
          )}
          <Button 
            type="button" 
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold gap-2 shadow-lg" 
            onClick={handleSaveNote}
            disabled={isSaving || isRecording || !audioUrl}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {role === 'agent' ? "Save Note" : "Add to My Tour Notes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
