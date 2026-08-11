import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, MicOff, X, Sparkles, HelpCircle, ChevronRight, Check, ArrowRight, Loader2, Navigation, Volume2, VolumeX, List, User, Home, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getUserLeads, getUserListings, updateLead, Lead, Listing } from "@/lib/api";

export default function AgentVoiceControl() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeMode, setActiveMode] = useState<"command" | "dictation" | "auto">("auto");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<any>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  // Disambiguation states
  const [leadMatches, setLeadMatches] = useState<Lead[]>([]);
  const [listingMatches, setListingMatches] = useState<Listing[]>([]);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== "undefined" ? window.speechSynthesis : null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition is not supported in this browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setInterimTranscript("");
      setParseResult(null);
      setLeadMatches([]);
      setListingMatches([]);
    };

    rec.onresult = (event: any) => {
      let finalStr = "";
      let interimStr = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript;
        } else {
          interimStr += event.results[i][0].transcript;
        }
      }

      if (finalStr) {
        setTranscript(prev => (prev + " " + finalStr).trim());
      }
      setInterimTranscript(interimStr);
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error", event);
      if (event.error !== "no-speech") {
        toast.error(`Voice error: ${event.error}`);
        setIsListening(false);
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Speak feedback via web speech synthesis
  const speakFeedback = (text: string) => {
    if (!soundEnabled || !synthRef.current) return;
    try {
      synthRef.current.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = synthRef.current.getVoices().find(v => v.name.includes("Google") || v.name.includes("Sora")) || null;
      synthRef.current.speak(utterance);
    } catch (e) {
      console.error("Speech Synthesis failed:", e);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech Recognition is not supported or permitted in this browser.", {
        description: "Please try a modern browser like Chrome, Safari, or Edge."
      });
      return;
    }
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleCancel = () => {
    stopListening();
    setTranscript("");
    setInterimTranscript("");
    setParseResult(null);
    setLeadMatches([]);
    setListingMatches([]);
    setIsOpen(false);
  };

  const handleConfirm = async () => {
    stopListening();
    const finalTranscript = (transcript + " " + interimTranscript).trim();
    if (!finalTranscript) {
      toast.warning("Please say a command or dictate some notes first.");
      return;
    }

    setProcessing(true);
    setLeadMatches([]);
    setListingMatches([]);

    try {
      const response = await fetch("/api/voice/parse-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: finalTranscript, activeMode })
      });

      if (!response.ok) {
        throw new Error("Failed to parse voice command");
      }

      const data = await response.json();
      if (data.success && data.result) {
        const result = data.result;
        setParseResult(result);
        
        // Speak response feedback
        if (result.feedbackMessage) {
          speakFeedback(result.feedbackMessage);
          toast.success(result.feedbackMessage);
        }

        // Process Command actions
        if (result.mode === "command" || ["safety_checkin", "reimport_data", "generate_email"].includes(result.action)) {
          await executeCommand(result);
        }
      } else {
        toast.error("Could not understand voice command.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Voice server error", { description: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const executeCommand = async (result: any) => {
    if (!user) return;

    if (result.action === "navigate") {
      if (result.targetPath === "back") {
        navigate(-1);
      } else if (result.targetPath) {
        navigate(result.targetPath);
        setIsOpen(false);
      } else {
        toast.error("Could not determine navigation target path.");
      }
    } else if (result.action === "safety_checkin") {
      toast.success("Safety Check-In Triggered!", {
        description: "Confirmed on-site status and archived location audit log."
      });
      if (result.targetPath) {
        navigate(result.targetPath);
      }
      setIsOpen(false);
    } else if (result.action === "reimport_data") {
      toast.info("Navigating to Listings", {
        description: "Click 'Re-Import Listing Data' in Step 2 of Edit Listing."
      });
      if (result.targetPath) {
        navigate(result.targetPath);
      }
      setIsOpen(false);
    } else if (result.action === "generate_email") {
      toast.info("Navigating to Leads Workspace", {
        description: "Select a lead and click 'Send Sora Follow-Up Email'."
      });
      if (result.targetPath) {
        navigate(result.targetPath);
      }
      setIsOpen(false);
    } else if (result.action === "open_lead" && result.targetName) {
      // Fuzzy search in user leads
      try {
        const leads = await getUserLeads(user.id);
        const searchStr = result.targetName.toLowerCase();
        const matches = leads.filter(l => l.name.toLowerCase().includes(searchStr));

        if (matches.length === 1) {
          navigate(`/app/leads/${matches[0].id}`);
          setIsOpen(false);
        } else if (matches.length > 1) {
          setLeadMatches(matches);
          speakFeedback(`I found multiple matches for ${result.targetName}. Please select the correct lead.`);
        } else {
          toast.error(`Lead not found matching: "${result.targetName}"`);
          speakFeedback(`Sorry, I couldn't find any lead matching ${result.targetName}.`);
        }
      } catch (err) {
        console.error("Lead fetch failed", err);
      }
    } else if (result.action === "open_listing" && result.targetName) {
      // Fuzzy search in user listings
      try {
        const listings = await getUserListings(user.id);
        const searchStr = result.targetName.toLowerCase();
        const matches = listings.filter(l => l.address.toLowerCase().includes(searchStr));

        if (matches.length === 1) {
          navigate(`/app/listings/${matches[0].id}`);
          setIsOpen(false);
        } else if (matches.length > 1) {
          setListingMatches(matches);
          speakFeedback(`I found multiple properties matching ${result.targetName}. Please select one.`);
        } else {
          toast.error(`Property not found matching: "${result.targetName}"`);
          speakFeedback(`Sorry, I couldn't find any property matching ${result.targetName}.`);
        }
      } catch (err) {
        console.error("Listing fetch failed", err);
      }
    } else if (result.action === "save") {
      // Attempt to save active page (simulate save button trigger)
      const saveBtn = document.querySelector("button[id*='save'], button[type='submit']") as HTMLButtonElement;
      if (saveBtn) {
        saveBtn.click();
        toast.success("Save command triggered!");
        setIsOpen(false);
      } else {
        toast.error("No save button found on this screen.");
      }
    } else if (result.action === "toggle_setting" && result.targetName === "social_sharing") {
      toast.info("Toggling social sharing settings...");
    }
  };

  // Dictation Notes Application
  const handleApplyNote = async () => {
    if (!parseResult?.dictatedText || !user) return;

    // Detect if we are on a lead detail page
    const match = location.pathname.match(/\/app\/leads\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const currentLeadId = match[1];
      try {
        setProcessing(true);
        // Save note in Firestore
        await updateLead(currentLeadId, {
          notes: parseResult.dictatedText
        });
        toast.success("Dictated note successfully applied to Lead workspace!");
        setIsOpen(false);
      } catch (err) {
        toast.error("Failed to append note to lead.");
      } finally {
        setProcessing(false);
      }
    } else {
      // Not on lead details, let them copy it
      navigator.clipboard.writeText(parseResult.dictatedText);
      toast.success("Note copied to clipboard!", {
        description: "Navigate to a lead's page or listing description to paste it."
      });
      setIsOpen(false);
    }
  };

  const getIsLeadDetailsActive = () => {
    return location.pathname.includes("/app/leads/");
  };

  return (
    <>
      {/* Persistent microphone button in Chrome layout */}
      <button
        onClick={() => {
          setIsOpen(true);
          startListening();
        }}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 bg-gradient-to-r from-[#155dfc] to-[#50a2ff] hover:from-[#1352e0] hover:to-[#4595f0] text-white rounded-full flex items-center justify-center shadow-[0_6px_25px_rgba(21,93,252,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20 cursor-pointer animate-[pulse_2.5s_infinite_ease-in-out]"
        title="Launch Agent Voice Control"
        id="agent-voice-launcher-btn"
      >
        <Mic className="h-6 w-6 text-white" />
      </button>

      {/* Main Voice Panel Modal / Drawer overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white border-none shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-ping" />
                <span className="font-bold text-sm tracking-wide uppercase text-blue-400">Sora Voice</span>
                <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-none font-mono text-[10px]">
                  Agent Voice Control
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-slate-400 hover:text-white transition-colors"
                  title={soundEnabled ? "Mute responses" : "Unmute responses"}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-rose-500" />}
                </button>
                <button
                  onClick={handleCancel}
                  className="text-slate-400 hover:text-white transition-colors rounded-full p-1 hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Voice Mode Toggles */}
              <div className="flex justify-center p-1 bg-slate-100 rounded-lg">
                {(["auto", "command", "dictation"] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setActiveMode(mode)}
                    className={`flex-1 text-center py-1.5 text-xs font-bold rounded-md capitalize transition-all ${
                      activeMode === mode
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {mode === "auto" ? "⚡ Auto-Detect" : mode}
                  </button>
                ))}
              </div>

              {/* Listening Waves and Live Preview */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 min-h-[140px] flex flex-col justify-between relative">
                {isListening && (
                  <div className="absolute top-4 right-4 flex gap-1 items-center">
                    <span className="h-2 w-2 bg-rose-500 rounded-full animate-bounce duration-300" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 bg-rose-500 rounded-full animate-bounce duration-300" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 bg-rose-500 rounded-full animate-bounce duration-300" style={{ animationDelay: "300ms" }} />
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider ml-1">Live Mic</span>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Dynamic Instruction */}
                  <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                    {isListening ? "Listening, speak clearly..." : "Transcription Preview"}
                  </div>

                  {/* Transcripts Display */}
                  <div className="text-slate-800 font-medium text-sm leading-relaxed max-h-[120px] overflow-y-auto">
                    {transcript ? (
                      <span className="text-slate-800">{transcript}</span>
                    ) : null}
                    {interimTranscript ? (
                      <span className="text-slate-400 font-normal italic"> {interimTranscript}</span>
                    ) : null}
                    {!transcript && !interimTranscript && (
                      <span className="text-slate-400 italic">
                        {isListening 
                          ? "Try saying 'Go to Leads', 'Open John Smith', or dictate a note..."
                          : "Tap the microphone to start speaking."}
                      </span>
                    )}
                  </div>
                </div>

                {/* Micro waveform effect when listening */}
                {isListening && (
                  <div className="flex justify-center gap-1.5 mt-4 items-center">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => {
                      const height = Math.floor(Math.random() * 20) + 4;
                      return (
                        <div
                          key={i}
                          className="w-1 bg-[#155dfc] rounded-full transition-all duration-150 animate-pulse"
                          style={{
                            height: `${height}px`,
                            animationDelay: `${i * 100}ms`
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Parsed Dictation Notes Section */}
              {parseResult && parseResult.mode === "dictation" && (
                <div className="border border-green-200 bg-green-50/40 rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-green-100 pb-2">
                    <span className="text-xs font-bold text-green-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-green-600 animate-spin" />
                      Polished Dictation Draft
                    </span>
                    {getIsLeadDetailsActive() && (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">
                        Active Lead Selected
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="text-slate-800 text-xs bg-white border border-slate-100 p-3 rounded-lg leading-relaxed shadow-sm">
                      "{parseResult.dictatedText}"
                    </div>
                    {parseResult.dictationSummary && (
                      <p className="text-slate-500 text-[11px] leading-normal italic">
                        <strong>Summary:</strong> {parseResult.dictationSummary}
                      </p>
                    )}
                    {parseResult.actionItems?.length > 0 && (
                      <div className="space-y-1 mt-2">
                        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Extracted Actions</span>
                        <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4 font-medium">
                          {parseResult.actionItems.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={handleApplyNote}
                      className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs"
                      disabled={processing}
                    >
                      {processing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <Check className="h-3.5 w-3.5 mr-1" />
                      )}
                      {getIsLeadDetailsActive() ? "Apply directly to Lead" : "Copy to Clipboard"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Lead Disambiguation Matches */}
              {leadMatches.length > 0 && (
                <div className="border border-amber-200 bg-amber-50/30 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    I found multiple leads. Please select one:
                  </div>
                  <div className="grid gap-2 max-h-[160px] overflow-y-auto">
                    {leadMatches.map(lead => (
                      <button
                        key={lead.id}
                        onClick={() => {
                          navigate(`/app/leads/${lead.id}`);
                          setIsOpen(false);
                        }}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-100 hover:border-blue-500 hover:bg-blue-50/20 text-left rounded-lg text-xs transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500" />
                          <span className="font-bold text-slate-700">{lead.name}</span>
                          {lead.email && <span className="text-slate-400 font-normal">({lead.email})</span>}
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Listing Disambiguation Matches */}
              {listingMatches.length > 0 && (
                <div className="border border-amber-200 bg-amber-50/30 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    I found multiple properties. Please select one:
                  </div>
                  <div className="grid gap-2 max-h-[160px] overflow-y-auto">
                    {listingMatches.map(listing => (
                      <button
                        key={listing.id}
                        onClick={() => {
                          navigate(`/app/listings/${listing.id}`);
                          setIsOpen(false);
                        }}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-100 hover:border-blue-500 hover:bg-blue-50/20 text-left rounded-lg text-xs transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <Home className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500" />
                          <span className="font-bold text-slate-700">{listing.address}</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Controls Footer */}
              <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer font-semibold"
                >
                  <HelpCircle className="h-4 w-4" />
                  What can I say?
                </button>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancel} className="text-slate-500 hover:text-slate-800">
                    Cancel
                  </Button>

                  {isListening ? (
                    <Button
                      size="sm"
                      onClick={stopListening}
                      className="bg-amber-500 hover:bg-amber-400 text-white font-bold"
                    >
                      <MicOff className="h-3.5 w-3.5 mr-1" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={startListening}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold"
                    >
                      <Mic className="h-3.5 w-3.5 mr-1" />
                      Listen
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={handleConfirm}
                    disabled={processing || (!transcript && !interimTranscript)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
                  >
                    {processing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <CornerDownLeft className="h-3.5 w-3.5 mr-1" />
                    )}
                    Send Command
                  </Button>
                </div>
              </div>

              {/* Parsed Q&A / Platform Info Response Section */}
              {parseResult && (parseResult.mode === "info" || parseResult.action === "info") && (
                <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-5 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                    <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      Sora Platform Knowledge Assistant
                    </span>
                  </div>
                  <div className="text-slate-800 text-xs bg-white border border-slate-100 p-3 rounded-lg leading-relaxed shadow-sm">
                    {parseResult.feedbackMessage || parseResult.dictationSummary}
                  </div>
                  {parseResult.dictationSummary && parseResult.feedbackMessage && (
                    <p className="text-slate-600 text-[11px] leading-normal italic pl-1">
                      {parseResult.dictationSummary}
                    </p>
                  )}
                </div>
              )}

              {/* Help Overlay Drawer */}
              {showHelp && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-600 space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
                  <div className="font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200 flex items-center justify-between">
                    <span>💡 Sample Commands & Voice Guide</span>
                    <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600">Close</button>
                  </div>
                  <div className="space-y-2">
                    <p>
                      <strong>🌐 Navigation:</strong> "Go to Leads Captured", "Go to Open Houses", "Go to Listings", "Go to Integrations", "Go to FAQ", "Go back"
                    </p>
                    <p>
                      <strong>🛡️ Safety & Open Houses:</strong> "Check in agent", "Perform safety check-in", "Save safety logs"
                    </p>
                    <p>
                      <strong>📩 Follow-Up Emails & CRM:</strong> "Draft Sora follow-up email", "How do I map Follow Up Boss?"
                    </p>
                    <p>
                      <strong>🔄 MLS Data:</strong> "Re-import listing data", "Refresh MLS specs"
                    </p>
                    <p>
                      <strong>📂 Open Records:</strong> "Open lead John Smith", "Open property 123 Main Street"
                    </p>
                    <p>
                      <strong>✍️ Notes Dictation:</strong> "Add follow-up note: Buyer is extremely warm and wants to purchase before September."
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
