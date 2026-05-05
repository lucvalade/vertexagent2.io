import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, MessageSquare, Play, FastForward, Pause, Volume2, SkipBack, SkipForward } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DUMMY_CONVOS: Record<string, any> = {
  "1": { id: "1", property: "888 Bel Air Rd, Los Angeles", lang: "English", duration: "4m 12s", qs: 8, date: Date.now() - 1000 * 60 * 30,
    transcript: [
      { speaker: "AI", text: "Hi there! Welcome to 888 Bel Air Rd. I'm the AI agent for this property. How can I help you today?" },
      { speaker: "Client", text: "Can you tell me about the pool?" },
      { speaker: "AI", text: "Absolutely! The property features a stunning zero-edge infinity pool that offers unobstructed, panoramic views of the Los Angeles skyline. It's heated year-round. Would you like to hear about the outdoor entertainment area nearby?" },
      { speaker: "Client", text: "Yes please." },
      { speaker: "AI", text: "Right next to the infinity pool, you'll find a fully equipped outdoor kitchen, a fire pit lounge seating 12, and a covered cabana area. It's essentially an extension of the indoor living space." },
      { speaker: "Client", text: "How much are the property taxes?" },
      { speaker: "AI", text: "The estimated annual property taxes for this estate are approximately $340,000, though I recommend verifying specifics with a tax professional. Is there a specific financial aspect you're curious about?" }
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
  const convo = DUMMY_CONVOS[convoId || "1"] || DUMMY_CONVOS["1"];
  
  const [isShowingPlayer, setIsShowingPlayer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [playProgress, setPlayProgress] = useState(0);

  const togglePlayback = () => {
    if (!isPlaying) {
      toast.info("Playing conversation audio...", {
        description: "Sound output generated via AI synthesis."
      });
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  // Simulate audio playback and speaker focus
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlayProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            setCurrentSpeaker(null);
            return 0;
          }
          
          // Rough logic to switch current active speaker based on progress
          const totalMsgs = convo.transcript.length;
          const currentIdx = Math.floor((prev / 100) * totalMsgs);
          if (convo.transcript[currentIdx]) {
            setCurrentSpeaker(convo.transcript[currentIdx].speaker);
          }
          
          return prev + 0.5;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, convo.transcript]);

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
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center">
                <Volume2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Call Recording</p>
                <p className="font-bold text-sm tracking-tight">{convo.property}</p>
              </div>
            </div>
            <button 
              onClick={() => { setIsShowingPlayer(false); setIsPlaying(false); }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Pause className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white"><SkipBack className="h-4 w-4" /></Button>
              <Button 
                size="icon" 
                className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-500"
                onClick={togglePlayback}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white"><SkipForward className="h-4 w-4" /></Button>
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${playProgress}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0:00</span>
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
            
            <div className="pt-4 border-t border-slate-100">
              <Button 
                onClick={() => { setIsShowingPlayer(true); togglePlayback(); }}
                variant={isShowingPlayer ? "secondary" : "outline"}
                className="w-full gap-2"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isShowingPlayer ? "Voice Player Active" : "Play Audio"}
              </Button>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 space-y-2 border border-blue-100">
              <p className="text-[10px] font-bold text-blue-700 uppercase">Voice Biometrics</p>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-slate-600">AI: Sarah (North American)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[10px] text-slate-600">Client: Identified (Mobile)</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-3">
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
              <div className="font-semibold text-slate-700">Transcript</div>
              <div className="text-xs text-slate-500 font-medium bg-white px-3 py-1 rounded-full border">AI & Client interaction</div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {convo.transcript.map((msg: any, i: number) => {
                const isActive = currentSpeaker === msg.speaker && isPlaying;
                return (
                  <div key={i} className={`flex flex-col ${msg.speaker === 'Client' ? 'items-end' : 'items-start'} transition-opacity duration-500 ${isPlaying && !isActive ? 'opacity-40' : 'opacity-100'}`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      {msg.speaker === 'AI' ? (
                        <div className="h-5 w-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-[10px] font-bold">AI</div>
                      ) : (
                        <div className="h-5 w-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold">CL</div>
                      )}
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{msg.speaker}</span>
                    </div>
                    <div className={`p-4 rounded-2xl max-w-[85%] relative border-2 ${
                      msg.speaker === 'Client' 
                        ? 'bg-blue-600 text-white rounded-tr-sm border-blue-600' 
                        : 'bg-slate-50 text-slate-800 rounded-tl-sm border-slate-100'
                    } ${isActive ? 'scale-[1.02] border-yellow-400 shadow-lg' : ''} transition-all duration-300`}>
                      {isActive && (
                        <div className="absolute -top-1 -right-1 flex gap-0.5">
                          <div className="w-1 h-3 bg-yellow-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1 h-4 bg-yellow-400 animate-bounce" style={{ animationDelay: '100ms' }} />
                          <div className="w-1 h-2 bg-yellow-400 animate-bounce" style={{ animationDelay: '200ms' }} />
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{msg.text}</p>
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
