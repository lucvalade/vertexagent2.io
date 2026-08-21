import React, { useState, useEffect } from 'react';
import { Search, Volume2, Upload, Trash2, Play, CheckCircle2, Loader2, AlertCircle, Sparkles, Building } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function AdminWelcomeMessages() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  
  // Audio state
  const [uploadingEn, setUploadingEn] = useState(false);
  const [uploadingFr, setUploadingFr] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveListingGreetings = async () => {
    if (!selectedListing) return;
    setIsSaving(true);
    const toastId = toast.loading("Saving welcome message configurations...");
    try {
      await updateDoc(doc(db, "listings", selectedListing.id), {
        welcome_en: selectedListing.welcome_en || "",
        welcome_fr: selectedListing.welcome_fr || "",
        updatedAt: Date.now()
      });

      await addDoc(collection(db, "system_logs"), {
        type: "ACTION",
        message: `Admin saved welcome message configuration for ${selectedListing.address || selectedListing.title}`,
        timestamp: serverTimestamp(),
        userEmail: user?.email,
        details: {
          listingId: selectedListing.id,
          hasEn: !!selectedListing.welcome_en,
          hasFr: !!selectedListing.welcome_fr
        }
      });

      toast.success("Welcome message changes saved successfully!", { id: toastId });
    } catch (err) {
      console.error("Failed to save welcome messages:", err);
      toast.error("Failed to save changes. Please try again.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setListings(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "listings");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Update selected listing details when the source data changes
  useEffect(() => {
    if (selectedListing) {
      const updated = listings.find(l => l.id === selectedListing.id);
      if (updated) {
        setSelectedListing(updated);
      }
    }
  }, [listings]);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, lang: "en" | "fr") => {
    const file = e.target.files?.[0];
    if (!file || !selectedListing) return;

    if (!file.type.startsWith("audio/") && !file.name.endsWith(".mp3")) {
      toast.error("Please upload a valid .mp3 audio file.");
      return;
    }

    if (file.size > 800 * 1024) {
      toast.error("File exceeds limit. Keep welcome audio files under 800KB (approx. 1 minute) to optimize loading speed.");
      return;
    }

    const setUploading = lang === "en" ? setUploadingEn : setUploadingFr;
    setUploading(true);
    const toastId = toast.loading(`Uploading ${lang === 'en' ? 'English' : 'French'} Welcome Audio...`);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = reader.result as string;
        
        await updateDoc(doc(db, "listings", selectedListing.id), {
          [lang === "en" ? "welcome_en" : "welcome_fr"]: base64String,
          updatedAt: Date.now()
        });

        // Add to audit logs
        await addDoc(collection(db, "system_logs"), {
          type: "ACTION",
          message: `Admin uploaded custom welcome audio (${lang.toUpperCase()}) for listing ${selectedListing.title || selectedListing.address}`,
          timestamp: serverTimestamp(),
          userEmail: user?.email,
          details: {
            listingId: selectedListing.id,
            language: lang,
            fileName: file.name,
            fileSize: file.size
          }
        });

        toast.success(`${lang === "en" ? "English" : "French"} Welcome Audio successfully updated!`, { id: toastId });
      } catch (err) {
        console.error("Failed to save welcome audio:", err);
        toast.error("Failed to save audio file to listing.", { id: toastId });
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      toast.error("Error reading audio file.", { id: toastId });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const removeAudio = async (lang: "en" | "fr") => {
    if (!selectedListing) return;

    const confirmRemove = window.confirm(`Are you sure you want to delete the stored ${lang === 'en' ? 'English' : 'French'} custom welcome audio for this listing?`);
    if (!confirmRemove) return;

    try {
      await updateDoc(doc(db, "listings", selectedListing.id), {
        [lang === "en" ? "welcome_en" : "welcome_fr"]: "",
        updatedAt: Date.now()
      });

      // Add to audit logs
      await addDoc(collection(db, "system_logs"), {
        type: "ACTION",
        message: `Admin removed custom welcome audio (${lang.toUpperCase()}) for listing ${selectedListing.title || selectedListing.address}`,
        timestamp: serverTimestamp(),
        userEmail: user?.email,
        details: {
          listingId: selectedListing.id,
          language: lang
        }
      });

      toast.success(`Removed ${lang === "en" ? "English" : "French"} welcome audio.`);
    } catch (err) {
      console.error("Failed to remove audio:", err);
      toast.error("Failed to remove welcome audio.");
    }
  };

  const linkAudioForListing = async (listingId: string, address: string) => {
    const toastId = toast.loading(`Linking greetings to ${address}...`);
    try {
      await updateDoc(doc(db, "listings", listingId), {
        welcome_en: "/audio/welcome_en.mp3",
        welcome_fr: "/audio/welcome_fr.mp3",
        updatedAt: Date.now()
      });

      // Add to audit logs
      await addDoc(collection(db, "system_logs"), {
        type: "ACTION",
        message: `Admin linked default Sora welcome messages (EN & FR) to ${address}`,
        timestamp: serverTimestamp(),
        userEmail: user?.email,
        details: {
          listingId,
          linkedDefaults: true
        }
      });

      toast.success(`Successfully linked English & French welcome messages to ${address}!`, { id: toastId });
    } catch (error) {
      console.error("Failed to link welcome audio:", error);
      toast.error(`Failed to link greetings: ${(error as Error).message}`, { id: toastId });
    }
  };

  const recommendationListings = listings.filter(l => {
    const addr = `${l.title || ''} ${l.address || ''}`.toLowerCase();
    const isTarget = addr.includes("arejay") || addr.includes("novoco");
    const lacksAudio = !l.welcome_en || !l.welcome_fr;
    return isTarget && lacksAudio;
  });

  const filteredListings = listings.filter(l => {
    const searchString = `${l.title || ''} ${l.address || ''} ${l.agentName || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 italic uppercase">Welcome Messages</h1>
          <p className="text-slate-500 font-medium">Manage and audit premium pre-recorded agent walkthrough intros per property.</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
          <span className="text-xs text-blue-700 font-bold">Only administrators can upload and change custom greetings.</span>
        </div>
      </div>

      {recommendationListings.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm text-left animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 shrink-0" />
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">AI Tour Welcome Message Recommendation</h3>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Sora recommends linking the custom English and French welcome greeting files to your active tour properties to ensure cohesive visitor onboarding:
              </p>
              <div className="flex flex-col gap-1 pl-7 pt-1">
                {recommendationListings.map(l => (
                  <div key={l.id} className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                    {l.title || l.address || 'Untitled Property'}
                  </div>
                ))}
              </div>
            </div>
            <Button
              onClick={async () => {
                for (const l of recommendationListings) {
                  await linkAudioForListing(l.id, l.title || l.address);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl shadow-sm hover:shadow shrink-0 transition-all flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> Link Greetings
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Listings Search and List View */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search address, listing, or agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-slate-200"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-[550px] overflow-y-auto">
            <div className="p-3 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-500">
              <span>Property Listings</span>
              <span>Audio Status</span>
            </div>
            
            {loading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                <span className="text-xs text-slate-400 uppercase font-black tracking-widest">Loading Listings...</span>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-medium">
                No properties found matching "{searchTerm}".
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredListings.map((l) => {
                  const hasEn = !!l.welcome_en;
                  const hasFr = !!l.welcome_fr;
                  const isSelected = selectedListing?.id === l.id;
                  const displayAddress = l.address || l.title || 'Property Address';

                  return (
                    <button
                      key={l.id}
                      onClick={() => setSelectedListing(l)}
                      className={`w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-all ${
                        isSelected ? 'bg-blue-50/50 border-l-4 border-blue-600 pl-3' : ''
                      }`}
                    >
                      <div className="space-y-1 pr-2 truncate">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{displayAddress}</h4>
                        {l.title && l.title !== l.address && (
                          <p className="text-xs text-slate-500 truncate">{l.title}</p>
                        )}
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Building className="h-3 w-3 shrink-0" />
                          <span className="truncate">{l.city ? `${l.city}, ${l.state || l.province || ''}` : 'Active Property'}</span>
                        </p>
                        {l.agentName && (
                          <span className="inline-block text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-extrabold uppercase">
                            {l.agentName}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          hasEn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                        }`}>
                          EN
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          hasFr ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                        }`}>
                          FR
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Listing Greeting Configuration */}
        <div className="lg:col-span-7">
          {selectedListing ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-left p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2.5 py-0.5 uppercase tracking-widest">
                    ACTIVE PROPERTY SELECTION
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedListing.address || selectedListing.title || 'Selected Property Address'}
                  </h2>
                  {selectedListing.title && selectedListing.title !== selectedListing.address && (
                    <p className="text-xs text-slate-500 font-medium">{selectedListing.title}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {selectedListing.price && (
                    <span className="text-sm font-black text-slate-800 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                      {selectedListing.price}
                    </span>
                  )}
                  <Button
                    onClick={handleSaveListingGreetings}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    <span>{isSaving ? "Saving..." : "Save Welcome Messages"}</span>
                  </Button>
                </div>
              </div>

              {/* English Welcome Greeting Panel */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">English Welcome Greeting</span>
                    {selectedListing.welcome_en ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Stored
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 font-bold px-2.5 py-0.5 rounded-full">
                        Empty (Sora will use default TTS)
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-4">
                  {selectedListing.welcome_en ? (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500 italic">Play stored English custom greeting audio (.mp3 format):</p>
                      <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
                        <audio src={selectedListing.welcome_en} controls className="h-8 w-full" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAudio("en")}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 cursor-pointer"
                          title="Delete Greeting"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2 text-xs text-slate-400 font-medium">
                      No custom audio recorded. Sora will auto-generate the welcome greeting on the fly using AI voices.
                    </div>
                  )}

                  <div className="pt-2">
                    <label className="flex items-center justify-center border border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-lg p-4 cursor-pointer text-center text-slate-600 hover:text-blue-600 transition-all">
                      {uploadingEn ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-600" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      <span className="text-xs font-black uppercase tracking-wider">
                        {uploadingEn ? "Processing Upload..." : "Upload English Custom MP3"}
                      </span>
                      <input
                        type="file"
                        accept="audio/mp3, audio/*"
                        className="hidden"
                        onChange={(e) => handleAudioUpload(e, "en")}
                        disabled={uploadingEn}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* French Welcome Greeting Panel */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">French Welcome Greeting</span>
                    {selectedListing.welcome_fr ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Stored
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 font-bold px-2.5 py-0.5 rounded-full">
                        Empty (Sora will use default TTS)
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-4">
                  {selectedListing.welcome_fr ? (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500 italic">Play stored French custom greeting audio (.mp3 format):</p>
                      <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
                        <audio src={selectedListing.welcome_fr} controls className="h-8 w-full" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAudio("fr")}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 cursor-pointer"
                          title="Delete Greeting"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2 text-xs text-slate-400 font-medium">
                      No custom audio recorded. Sora will auto-generate the welcome greeting on the fly using AI voices.
                    </div>
                  )}

                  <div className="pt-2">
                    <label className="flex items-center justify-center border border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-lg p-4 cursor-pointer text-center text-slate-600 hover:text-blue-600 transition-all">
                      {uploadingFr ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-600" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      <span className="text-xs font-black uppercase tracking-wider">
                        {uploadingFr ? "Processing Upload..." : "Upload French Custom MP3"}
                      </span>
                      <input
                        type="file"
                        accept="audio/mp3, audio/*"
                        className="hidden"
                        onChange={(e) => handleAudioUpload(e, "fr")}
                        disabled={uploadingFr}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer with SAVE Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Audio files are cached and synced with Sora AI Tour visitors automatically.</span>
                </span>
                <Button
                  onClick={handleSaveListingGreetings}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-xl shadow-sm cursor-pointer flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>{isSaving ? "Saving Configuration..." : "Save Welcome Messages"}</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-4 h-full min-h-[400px]">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100 shadow-sm animate-bounce">
                <Volume2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-base uppercase tracking-wider">No Listing Selected</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Select a real estate listing from the left-hand panel to view or upload custom welcome walkthrough audio greetings.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
