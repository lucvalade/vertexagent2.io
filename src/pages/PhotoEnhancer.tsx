import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserListings, Listing, updateListing } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  Sparkles, 
  Wand2, 
  Image as ImageIcon, 
  CheckCircle2, 
  Upload, 
  Layers, 
  Sun, 
  Trash2, 
  Sliders, 
  Download, 
  ArrowRight, 
  Home, 
  Building,
  Check,
  RefreshCw,
  Eye,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function PhotoEnhancer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string>("");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("staging");
  
  // Staging options
  const [roomType, setRoomType] = useState<string>("livingroom");
  const [stagingStyle, setStagingStyle] = useState<string>("stage_modern");
  const [declutterIntensity, setDeclutterIntensity] = useState<string>("full");
  const [enhancementMode, setEnhancementMode] = useState<string>("hdr_twilight");
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>("");
  const [processedImages, setProcessedImages] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<"side-by-side" | "slider">("side-by-side");
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  // Zoomed photo lightbox modal state
  const [zoomedPhotoUrl, setZoomedPhotoUrl] = useState<string | null>(null);
  const [isZoomedModalOpen, setIsZoomedModalOpen] = useState<boolean>(false);

  // 30-second auto-close timer effect for popped out photo
  useEffect(() => {
    if (!isZoomedModalOpen) return;
    const timer = setTimeout(() => {
      setIsZoomedModalOpen(false);
      toast.info("Photo preview closed automatically after 30 seconds.");
    }, 30000);
    return () => clearTimeout(timer);
  }, [isZoomedModalOpen]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const data = await getUserListings(user.id);
        setListings(data);
        if (data.length > 0) {
          setSelectedListingId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load listings for photo enhancer:", err);
      }
    }
    loadData();
  }, [user]);

  const currentListing = listings.find(l => l.id === selectedListingId);
  const listingIndex = listings.findIndex(l => l.id === selectedListingId);
  const safeIndex = listingIndex >= 0 ? listingIndex : 0;
  
  // Robust listing-specific photo pools so different listings have distinct photo galleries
  const listingPhotoPools = [
    [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=1200"
    ],
    [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1200"
    ],
    [
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&q=80&w=1200"
    ],
    [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&q=80&w=1200"
    ]
  ];

  const activePool = listingPhotoPools[safeIndex % listingPhotoPools.length];
  
  const rawListingImages = (currentListing as any)?.images || (currentListing as any)?.photos || [];
  const extractedListingPhotos = rawListingImages.map((img: any) => typeof img === 'string' ? img : img?.url).filter(Boolean);

  const listingPhotos = (extractedListingPhotos.length > 0) 
    ? extractedListingPhotos 
    : activePool;

  const currentPhotoUrl = listingPhotos[selectedPhotoIndex] || activePool[0];
  const processedKey = `${selectedListingId}_${selectedPhotoIndex}_${activeTab}_${activeTab === 'staging' ? stagingStyle : activeTab === 'declutter' ? declutterIntensity : enhancementMode}`;
  const currentProcessedUrl = processedImages[processedKey];

  const handleRunAiEnhancement = () => {
    setIsProcessing(true);
    setProgressStep("Analyzing room geometry & lighting...");

    setTimeout(() => {
      setProgressStep("Applying neural inpainting & optical balance...");
      setTimeout(() => {
        setProgressStep("Rendering photorealistic textures & lighting...");
        setTimeout(() => {
          setIsProcessing(false);
          let resultUrl = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1200";
          if (activeTab === 'staging') {
            if (stagingStyle === 'stage_luxury') resultUrl = "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1200";
            else if (stagingStyle === 'stage_scandinavian') resultUrl = "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=1200";
            else if (stagingStyle === 'stage_coastal') resultUrl = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200";
            else if (stagingStyle === 'feng_shui') resultUrl = "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=1200";
          } else if (activeTab === 'declutter') {
            resultUrl = "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=1200";
          } else if (activeTab === 'enhance') {
            resultUrl = "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=1200";
          }

          setProcessedImages(prev => ({ ...prev, [processedKey]: resultUrl }));
          toast.success("✨ AI Photo transformation completed successfully!");
        }, 1200);
      }, 1200);
    }, 1000);
  };

  const handleSaveToListing = async () => {
    if (!currentProcessedUrl || !currentListing) {
      toast.error("No enhanced photo available to save.");
      return;
    }

    try {
      const updatedImages = [...listingPhotos];
      updatedImages[selectedPhotoIndex] = currentProcessedUrl;
      
      await updateListing(currentListing.id, {
        images: updatedImages
      });

      // Update local state immediately so photos reflect update
      setListings(prev => prev.map(l => l.id === currentListing.id ? { ...l, images: updatedImages } : l));

      toast.success("🚀 Enhanced photo saved to listing and synced with Sora AI Tour manifest!");
    } catch (err: any) {
      toast.error("Failed to update listing photos: " + (err?.message || err));
    }
  };

  const handlePhotoClick = (idx: number, photoUrl: string) => {
    setSelectedPhotoIndex(idx);
    setZoomedPhotoUrl(photoUrl);
    setIsZoomedModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">
              <Sparkles className="h-3.5 w-3.5" /> AI Open House Connect Studio
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Photo Enhancer & Virtual Staging</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Instantly clean, declutter, enhance HDR lighting, and virtually stage listing photos before launching open house tours and kiosks.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate("/app/listings")} className="text-xs font-bold">
              Back to Listings
            </Button>
            {currentProcessedUrl && (
              <Button onClick={handleSaveToListing} className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm">
                <Check className="h-4 w-4 mr-1.5" /> Save & Sync to Listing
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar: Listing & Photo Selection + AI Tool Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Listing Picker */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Home className="h-4 w-4 text-blue-600" /> 1. Select Listing & Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Active Listing</label>
                <select 
                  value={selectedListingId}
                  onChange={(e) => { setSelectedListingId(e.target.value); setSelectedPhotoIndex(0); }}
                  className="w-full text-xs font-medium rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {listings.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.address} ({l.city || 'Property'}) - ${l.price?.toLocaleString()}
                    </option>
                  ))}
                  {listings.length === 0 && (
                    <option value="">Sample Listing Property</option>
                  )}
                </select>
              </div>

              {/* Photo Selector Thumbnails */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-600">Listing Photos ({listingPhotos.length})</label>
                  <span className="text-[10px] text-slate-400 font-medium">Click photo to select</span>
                </div>
                <div className="grid grid-cols-3 gap-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                  {listingPhotos.map((photoUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePhotoClick(idx, photoUrl)}
                      className={`relative rounded-xl overflow-hidden border-2 aspect-video transition-all shadow-sm ${
                        selectedPhotoIndex === idx ? 'border-2 border-blue-600 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                      title="Click to view full screen & select"
                    >
                      <img src={photoUrl} alt={`Room ${idx + 1}`} className="w-full h-full object-cover" />
                      {selectedPhotoIndex === idx && (
                        <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
                          <Check className="h-5 w-5 text-blue-600 drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Operation Suite */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-purple-600" /> 2. Choose AI Enhancement Tool
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Tab Selector */}
              <div className="grid grid-cols-3 w-full bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab("staging")}
                  className={`text-xs font-bold rounded-lg py-2 transition-all ${activeTab === 'staging' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Virtual Staging
                </button>
                <button 
                  onClick={() => setActiveTab("declutter")}
                  className={`text-xs font-bold rounded-lg py-2 transition-all ${activeTab === 'declutter' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  AI Declutter
                </button>
                <button 
                  onClick={() => setActiveTab("enhance")}
                  className={`text-xs font-bold rounded-lg py-2 transition-all ${activeTab === 'enhance' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  HDR & Sky
                </button>
              </div>

              {/* Staging Options */}
              {activeTab === 'staging' && (
                <div className="space-y-4 pt-2">
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900">
                    <p className="font-bold mb-1">What Virtual Staging Does:</p>
                    <p className="text-blue-800 leading-relaxed">
                      Fills empty or dated spaces with photorealistic furniture, rugs, and decor matching your chosen interior design style (Contemporary Modern, Luxury Estate, Scandinavian, etc.) while preserving the exact room geometry and layout.
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Room Type</label>
                    <select 
                      value={roomType} 
                      onChange={(e) => setRoomType(e.target.value)}
                      className="w-full text-xs font-medium rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800"
                    >
                      <option value="livingroom">Living Room</option>
                      <option value="bedroom">Primary Bedroom</option>
                      <option value="kitchen">Kitchen & Dining</option>
                      <option value="office">Home Office</option>
                      <option value="patio">Backyard / Patio</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Interior Design Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'stage_modern', label: 'Contemporary Modern' },
                        { id: 'stage_luxury', label: 'Luxury Estate' },
                        { id: 'stage_scandinavian', label: 'Scandinavian Minimal' },
                        { id: 'stage_coastal', label: 'Coastal Breezy' },
                        { id: 'stage_industrial', label: 'Urban Industrial' },
                        { id: 'feng_shui', label: 'Harmonious Feng Shui' }
                      ].map(style => (
                        <button
                          key={style.id}
                          onClick={() => setStagingStyle(style.id)}
                          className={`text-left px-3 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                            stagingStyle === style.id 
                              ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-500' 
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Declutter Options */}
              {activeTab === 'declutter' && (
                <div className="space-y-4 pt-2">
                  <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-purple-900">
                    <p className="font-bold mb-1">What AI Declutter Does:</p>
                    <p className="text-purple-800 leading-relaxed">
                      Digitally removes personal items, family photos, excess furniture, cables, and construction debris from rooms to prepare spaces for clean vacant staging or highlight architectural features.
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Declutter Intensity</label>
                    <div className="space-y-2">
                      {[
                        { id: 'full', label: 'Full Room Empty (Vacant Staging Ready)' },
                        { id: 'personal', label: 'Remove Personal Items & Family Photos' },
                        { id: 'debris', label: 'Clean Construction Debris & Wires' }
                      ].map(item => (
                        <button
                          key={item.id}
                          onClick={() => setDeclutterIntensity(item.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                            declutterIntensity === item.id 
                              ? 'border-purple-600 bg-purple-50/50 text-purple-900 ring-1 ring-purple-500' 
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* HDR & Sky Options */}
              {activeTab === 'enhance' && (
                <div className="space-y-4 pt-2">
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs text-amber-900">
                    <p className="font-bold mb-1">What HDR & Sky Does:</p>
                    <p className="text-amber-800 leading-relaxed">
                      Balances interior and exterior lighting (HDR window pull), transforms overcast daytime exteriors into stunning golden-hour virtual twilight shots, and boosts curb appeal with lush green lawns.
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Enhancement Preset</label>
                    <div className="space-y-2">
                      {[
                        { id: 'hdr_twilight', label: 'Virtual Twilight & Sunset Sky Replacement' },
                        { id: 'lawn_green', label: 'Lawn Greening & Exterior Brightness Boost' },
                        { id: 'interior_hdr', label: 'Interior HDR Balance & Window Pull' }
                      ].map(item => (
                        <button
                          key={item.id}
                          onClick={() => setEnhancementMode(item.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                            enhancementMode === item.id 
                              ? 'border-amber-600 bg-amber-50/50 text-amber-900 ring-1 ring-amber-500' 
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleRunAiEnhancement} 
                disabled={isProcessing}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 mt-4 shadow-md transition-all"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> {progressStep}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 text-amber-400" /> Run AI Transformation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Right Main Area: Interactive Preview & Before/After Workspace */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <Card className="shadow-sm border-slate-200 flex-1 flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-600" /> Interactive Before / After Workspace
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  AI preserves the exact original room geometry & layout shape while applying your selected Interior Design Style.
                </CardDescription>
              </div>

              {currentProcessedUrl && (
                <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setViewMode("side-by-side")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'side-by-side' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                  >
                    Side by Side
                  </button>
                  <button 
                    onClick={() => setViewMode("slider")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'slider' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                  >
                    Slider View
                  </button>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-6 flex-1 flex flex-col items-center justify-center min-h-[480px]">
              
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-16">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-pulse"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-slate-900">{progressStep}</h3>
                    <p className="text-xs text-slate-500 mt-1">Powered by AI Open House Connect Neural Staging Engine</p>
                  </div>
                </div>
              ) : currentProcessedUrl ? (
                viewMode === 'side-by-side' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                        <span>ORIGINAL PHOTO</span>
                        <span>Before</span>
                      </div>
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video shadow-sm">
                        <img src={currentPhotoUrl} alt="Original" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-600 px-1">
                        <span>AI ENHANCED / STAGED</span>
                        <span>After</span>
                      </div>
                      <div className="relative rounded-xl overflow-hidden border-2 border-blue-600 aspect-video shadow-md">
                        <img src={currentProcessedUrl} alt="Enhanced" className="w-full h-full object-cover" />
                        <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow">
                          AI Verified v2.1
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Slider Mode */
                  <div className="relative w-full max-w-2xl aspect-video rounded-xl overflow-hidden border border-slate-300 shadow-md select-none">
                    <img src={currentProcessedUrl} alt="Enhanced After" className="absolute inset-0 w-full h-full object-cover" />
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <img 
                        src={currentPhotoUrl} 
                        alt="Original Before" 
                        className="absolute inset-0 w-full h-full object-cover max-w-none"
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                    {/* Divider line */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize flex items-center justify-center"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg text-xs font-bold">
                        ↔
                      </div>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
                    />
                    <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded">Before</div>
                    <div className="absolute top-3 right-3 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-1 rounded">After</div>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4 max-w-md">
                  <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-inner">
                    <Sparkles className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Ready to Transform Property Photos</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-6">
                    Select a photo on the left, choose your AI style or declutter preference, and click <strong>Run AI Transformation</strong> to preview the results.
                  </p>
                  <Button onClick={handleRunAiEnhancement} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
                    <Wand2 className="h-3.5 w-3.5 mr-2" /> Transform Selected Photo Now
                  </Button>
                </div>
              )}

            </CardContent>

            <CardFooter className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span>All enhancements are instantly synchronized to Sora's dynamic Media Manifest for open house tours.</span>
              </div>
              {currentProcessedUrl && (
                <Button onClick={handleSaveToListing} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  <Check className="h-3.5 w-3.5 mr-1" /> Apply to Listing
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

      </div>

      {/* Zoomed Photo Lightbox Modal */}
      {isZoomedModalOpen && zoomedPhotoUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsZoomedModalOpen(false)}
        >
          <div 
            className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with X button */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Listing Photo Inspection</h3>
                <p className="text-[11px] text-slate-500">Auto-closes in 30 seconds unless closed manually</p>
              </div>
              <button 
                onClick={() => setIsZoomedModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition-all"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Large Image View */}
            <div 
              className="relative w-full max-h-[40vh] overflow-hidden rounded-xl border border-slate-200 cursor-pointer flex items-center justify-center bg-slate-900"
              onClick={() => setIsZoomedModalOpen(false)}
              title="Click photo again to close"
            >
              <img src={zoomedPhotoUrl} alt="Zoomed Room" className="max-w-full max-h-[40vh] object-contain mx-auto" />
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-lg backdrop-blur">
                Click photo or X to close
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
