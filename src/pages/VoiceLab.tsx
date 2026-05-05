import { Mic2, Play, Plus, RefreshCw, Star, MoreVertical, Pencil, Trash2, Save, X, Volume2, Music, CheckCircle2, Upload } from "lucide-react";
import { useState, useRef } from "react";
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
  status: 'Active' | 'Processing';
  type: 'Cloned' | 'Synthetic';
  rating: number;
  previewUrl?: string;
  tags?: string[];
}

const INITIAL_VOICES: Voice[] = [
  { id: "1", name: "Sarah's Clone (Agent)", status: "Active", type: "Cloned", rating: 4.8, tags: ["Female", "Authoritative"] },
  { id: "2", name: "Professional Female (Default)", status: "Active", type: "Synthetic", rating: 4.9, tags: ["Female", "Professional"] },
  { id: "3", name: "Warm Male (Default)", status: "Active", type: "Synthetic", rating: 4.5, tags: ["Male", "Friendly"] },
  { id: "4", name: "Luc's Clone (Admin)", status: "Active", type: "Cloned", rating: 5.0, tags: ["Male", "Calm"] },
];

export default function VoiceLab() {
  const [voices, setVoices] = useState<Voice[]>(INITIAL_VOICES);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI States
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeVoice, setActiveVoice] = useState<Voice | null>(null);
  const [testText, setTestText] = useState("Hi, I'm the AI agent for 888 Bel Air Road. How can I help you today?");
  const [isTesting, setIsTesting] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [editName, setEditName] = useState("");

  // Create Clone states
  const [newCloneName, setNewCloneName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleTestVoice = (voice: Voice) => {
    setActiveVoice(voice);
    setPreviewReady(false);
    setIsTestOpen(true);
  };

  const runTest = () => {
    setIsTesting(true);
    setPreviewReady(false);
    setTimeout(() => {
      setIsTesting(false);
      setPreviewReady(true);
      toast.success(`Voice preview for ${activeVoice?.name} generated successfully.`);
    }, 2000);
  };

  const playPreview = () => {
    if (!activeVoice || !testText) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(testText);
    const voicesList = window.speechSynthesis.getVoices();
    
    if (voicesList.length > 0) {
      const lowerName = activeVoice.name.toLowerCase();
      // Improved matching logic for gender and quality
      const isFemale = lowerName.includes('female') || lowerName.includes('sarah') || activeVoice.tags?.includes('Female');
      const isMale = lowerName.includes('male') || lowerName.includes('luc') || activeVoice.tags?.includes('Male');

      // Priority: Modern/High-quality voices first
      const bestVoice = voicesList.find(v => {
        const vName = v.name.toLowerCase();
        const isTargetGender = isFemale ? (vName.includes('female') || vName.includes('zira') || vName.includes('samantha') || vName.includes('aura')) :
                              isMale ? (vName.includes('male') || vName.includes('david') || vName.includes('alex') || vName.includes('guy')) : true;
        return isTargetGender && (vName.includes('google') || vName.includes('natural') || vName.includes('enhanced'));
      }) || voicesList.find(v => {
        const vName = v.name.toLowerCase();
        return isFemale ? (vName.includes('female') || vName.includes('zira') || vName.includes('samantha')) :
               isMale ? (vName.includes('male') || vName.includes('david') || vName.includes('alex')) : true;
      });

      if (bestVoice) utterance.voice = bestVoice;
    }
    
    // Slight adjustments to make it less "robotic"
    utterance.rate = 0.95; // Slightly slower feels more natural
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
    toast.info(`Playing preview for ${activeVoice.name}...`);
  };

  const handleDeleteVoice = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!window.confirm("Are you sure you want to delete this voice model? This cannot be undone.")) return;
    setVoices(prev => prev.filter(v => v.id !== id));
    toast.success("Voice model deleted");
  };

  const handleSaveRename = () => {
    if (!activeVoice) return;
    setVoices(prev => prev.map(v => v.id === activeVoice.id ? { ...v, name: editName } : v));
    setIsEditOpen(false);
    toast.success("Voice renamed successfully");
  };

  const handleCreateClone = () => {
    if (!newCloneName) {
      toast.error("Please enter a name for your clone");
      return;
    }
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const newVoice: Voice = {
            id: Math.random().toString(),
            name: newCloneName,
            status: 'Processing',
            type: 'Cloned',
            rating: 0
          };
          setVoices(prev => [newVoice, ...prev]);
          setIsUploading(false);
          setIsCloneOpen(false);
          setNewCloneName("");
          setUploadProgress(0);
          toast.success("Voice cloning process started. This usually takes 10-15 minutes.");
        }, 500);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voice Lab</h1>
          <p className="text-slate-500 mt-1">Manage AI voices and custom voice clones for your tours.</p>
        </div>
        <Button onClick={() => setIsCloneOpen(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="h-4 w-4" /> Create Voice Clone
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {voices.map((voice) => (
          <div key={voice.id} className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col hover:border-blue-400 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 group">
            <div className="p-6 relative">
              <div className="absolute top-4 right-2 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-blue-600 transition-colors bg-white/80 backdrop-blur-sm rounded-full">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  } />
                  <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-slate-200">
                    <DropdownMenuItem className="gap-2 font-bold" onClick={(e) => {
                      e.stopPropagation();
                      setActiveVoice(voice);
                      setEditName(voice.name);
                      setIsEditOpen(true);
                    }}>
                      <Pencil className="h-4 w-4 text-blue-600" /> Rename Voice
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 font-bold text-red-600 focus:text-red-700 focus:bg-red-50" onClick={(e) => handleDeleteVoice(voice.id, e)}>
                      <Trash2 className="h-4 w-4" /> Delete Voice
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-start justify-between mb-4 pr-8">
                <div className={`p-3 rounded-full inline-block ${voice.type === 'Cloned' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                  <Mic2 className="h-6 w-6" />
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-tight
                    ${voice.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}
                  `}>
                  {voice.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{voice.name}</h3>
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
                 <Button 
                   onClick={() => handleTestVoice(voice)}
                   className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 gap-2 shadow-none"
                 >
                   <Play className="h-4 w-4" /> Test Voice
                 </Button>
               ) : (
                 <Button disabled className="flex-1 bg-white border border-slate-200 text-slate-400 gap-2 shadow-none opacity-60">
                   <RefreshCw className="h-4 w-4 animate-spin" /> Processing Clone
                 </Button>
               )}
            </div>
          </div>
        ))}

        {voices.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl border-slate-200 bg-slate-50/50">
            <Mic2 className="mx-auto h-12 w-12 text-slate-200 mb-4" />
            <h3 className="font-bold text-lg text-slate-900">No voices found</h3>
            <p className="text-slate-500">Create a clone or use system default voices.</p>
          </div>
        )}
      </div>

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
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">Sample Text</label>
              <textarea 
                value={testText}
                onChange={e => setTestText(e.target.value)}
                className="w-full h-32 p-4 rounded-xl border border-slate-200 bg-slate-50 resize-none focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm leading-relaxed"
              />
            </div>
            
            {isTesting ? (
              <div className="bg-blue-600 rounded-xl p-6 flex flex-col items-center justify-center space-y-4 text-white">
                <div className="flex gap-1 items-end h-8">
                  {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className="w-1.5 bg-white/40 rounded-full animate-pulse" style={{ height: `${Math.random()*100}%`, animationDelay: `${i*100}ms` }} />
                  ))}
                </div>
                <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Generating Audio...</p>
              </div>
            ) : previewReady ? (
              <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-8 flex flex-col items-center justify-center space-y-4">
                <div 
                  onClick={playPreview}
                  className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-transform shadow-lg shadow-blue-200"
                >
                  <Play className="h-8 w-8 ml-1" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-blue-900">Audio preview ready</p>
                  <p className="text-xs text-blue-600 mt-1">Click the button above to listen</p>
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
            <Button onClick={runTest} disabled={isTesting} className="bg-blue-600 hover:bg-blue-700 min-w-[120px]">
              {isTesting ? "Generating..." : previewReady ? "Regenerate" : "Generate Preview"}
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
    </div>
  );
}
