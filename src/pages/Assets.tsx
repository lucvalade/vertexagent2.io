import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Folder, 
  Plus, 
  Search, 
  ChevronLeft, 
  Layout, 
  Map, 
  PlayCircle, 
  FileSearch, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Download,
  Upload,
  X,
  File
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getUserListings, Listing, deleteListingOp, updateListing } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type AssetType = 'image' | 'document' | 'video' | 'floorplan';

interface Asset {
  id: string;
  name: string;
  type: AssetType;
  url: string;
  size: string;
  date: string;
}

export default function Assets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // UI States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [newName, setNewName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadListings();
    }
  }, [user]);

  async function loadListings() {
    setLoading(true);
    try {
      const data = await getUserListings(user!.id);
      setListings(data);
    } catch (err) {
      console.error("Failed to load listings for assets", err);
    } finally {
      setLoading(false);
    }
  }

  // Helper to generate key for asset storage simulation
  const [listingAssetsMap, setListingAssetsMap] = useState<Record<string, Asset[]>>({});

  useEffect(() => {
    if (listings.length > 0) {
      const newMap: Record<string, Asset[]> = {};
      listings.forEach(l => {
        newMap[l.id] = getInitialAssets(l);
      });
      setListingAssetsMap(newMap);
    }
  }, [listings]);

  const getInitialAssets = (listing: Listing): Asset[] => {
    const assets: Asset[] = [];
    if (listing.images && listing.images.length > 0) {
      listing.images.forEach((img, i) => {
        const url = typeof img === 'string' ? img : img.url;
        let name = "";
        if (typeof img === 'object' && img.name) {
          name = img.name;
        } else {
          const fileName = url.split('/').pop()?.split('?')[0] || `photo-${i + 1}.jpg`;
          name = i === 0 ? `Main_Photo_${fileName}` : fileName;
        }

        assets.push({
          id: `img-${listing.id}-${i}`, // Stable ID without Math.random()
          name: name,
          type: 'image',
          url: url,
          size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
          date: new Date(listing.updatedAt || listing.createdAt || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        });
      });
    }
    assets.push({
      id: `fp-${listing.id}`,
      name: `${listing.address.split(',')[0].replace(/\s+/g, '_')}_Floorplan.pdf`,
      type: 'floorplan',
      url: "https://example.com/floorplan.pdf",
      size: "1.8 MB",
      date: new Date(listing.createdAt || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    });
    return assets;
  };

  const currentAssets = selectedListing ? (listingAssetsMap[selectedListing.id] || []) : [];

  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this property folder and all its assets?")) return;
    try {
      await deleteListingOp(id);
      setListings(prev => prev.filter(l => l.id !== id));
      toast.success("Property folder deleted");
    } catch (err) {
      toast.error("Failed to delete folder");
    }
  };

  const computeTourDescriptors = (imgs: any[]): string[] => {
    const descriptors = new Array(16).fill("");
    if (imgs && imgs.length > 0) {
      for (let i = 0; i < 16; i++) {
        if (i < imgs.length) {
          const img = imgs[i];
          let rawName = "";
          if (typeof img === 'string') {
            rawName = img.split('/').pop()?.split('?')[0] || "";
          } else if (img && typeof img === 'object') {
            rawName = img.name || "";
          }
          let name = rawName.replace(/\.[^/.]+$/, ""); // Strip extensions
          name = name.split(/[_\-\s]+/)
            .filter(Boolean)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" ");
          descriptors[i] = name.slice(0, 30);
        }
      }
    }
    return descriptors.filter(d => d.trim() !== "");
  };

  const handleDeleteAsset = async () => {
    if (!selectedListing || !assetToDelete) return;
    
    const updatedImages = (selectedListing.images || []).filter(img => {
      const url = typeof img === 'string' ? img : img.url;
      return url !== assetToDelete.url;
    });

    try {
      const newDescriptors = computeTourDescriptors(updatedImages);
      await updateListing(selectedListing.id, { 
        images: updatedImages,
        tourDescriptors: newDescriptors
      });
      
      setListingAssetsMap(prev => ({
        ...prev,
        [selectedListing.id]: prev[selectedListing.id].filter(a => a.id !== assetToDelete.id)
      }));
      
      setListings(prev => prev.map(l => 
        l.id === selectedListing.id ? { ...l, images: updatedImages, tourDescriptors: newDescriptors } : l
      ));

      setSelectedListing(prev => prev ? { ...prev, images: updatedImages, tourDescriptors: newDescriptors } : null);
      
      setAssetToDelete(null);
      toast.success("Asset deleted and listing updated");
    } catch (err) {
      console.error("Delete asset error:", err);
      toast.error("Failed to delete asset from listing");
    }
  };

  const handleDownloadAsset = (asset: Asset, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!asset || !asset.url) {
      toast.error("No asset URL found");
      return;
    }
    
    try {
      const link = document.createElement("a");
      link.href = asset.url;
      link.download = asset.name || "download";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Download started for ${asset.name}`);
    } catch (err) {
      console.error("Download failed", err);
      toast.error("Failed to trigger download");
    }
  };

  const handleRenameAsset = async () => {
    if (!selectedListing || !activeAsset) return;
    
    const updatedImages = (selectedListing.images || []).map(img => {
      const url = typeof img === 'string' ? img : img.url;
      if (url === activeAsset.url) {
        return { url, name: newName };
      }
      return img;
    });

    try {
      const newDescriptors = computeTourDescriptors(updatedImages);
      await updateListing(selectedListing.id, { 
        images: updatedImages,
        tourDescriptors: newDescriptors
      });
      
      setListingAssetsMap(prev => ({
        ...prev,
        [selectedListing.id]: prev[selectedListing.id].map(a => 
          a.id === activeAsset.id ? { ...a, name: newName } : a
        )
      }));

      setListings(prev => prev.map(l => 
        l.id === selectedListing.id ? { ...l, images: updatedImages, tourDescriptors: newDescriptors } : l
      ));

      setSelectedListing(prev => prev ? { ...prev, images: updatedImages, tourDescriptors: newDescriptors } : null);

      setIsRenameOpen(false);
      toast.success("Asset renamed and synced to listing");
    } catch (err) {
      console.error("Rename asset error:", err);
      toast.error("Failed to rename asset on listing");
    }
  };

  const handleSimulateUpload = () => {
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          if (selectedListing) {
            const firstImg = selectedListing.images?.[0];
            const url = firstImg ? (typeof firstImg === 'string' ? firstImg : firstImg.url) : "https://images.unsplash.com/photo-1512917774080-9991f1c4c750";
            const newAsset: Asset = {
              id: `custom-${Math.random()}`,
              name: "Newly_Uploaded_File.jpg",
              type: 'image',
              url: url,
              size: "2.4 MB",
              date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            };
            setListingAssetsMap(prev => ({
              ...prev,
              [selectedListing.id]: [newAsset, ...prev[selectedListing.id]]
            }));
          }
          setIsUploading(false);
          setIsUploadOpen(false);
          setUploadProgress(0);
          toast.success("Asset uploaded successfully");
        }, 500);
      }
    }, 200);
  };

  const filteredListings = listings.filter(l => 
    l.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderAssetThumbnail = (asset: Asset, listing: Listing) => {
    switch (asset.type) {
      case 'image':
        return (
          <img 
            src={asset.url} 
            alt={asset.name} 
            className="w-full h-full object-cover rounded-lg"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const seed = asset.name ? asset.name.replace(/\s+/g, '_') : 'realestate';
              target.src = `https://picsum.photos/seed/${seed}/400/300`;
            }}
          />
        );
      case 'floorplan':
      case 'document':
        return (
          <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-4">
             <div className="h-16 w-12 bg-white border border-slate-200 rounded shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-3 bg-red-600 flex items-center justify-center text-[6px] text-white font-black">
                   PDF
                </div>
                {asset.type === 'floorplan' ? <Map className="h-6 w-6 text-slate-400 mt-2" /> : <FileText className="h-6 w-6 text-slate-400 mt-2" />}
             </div>
          </div>
        );
      case 'video':
        return (
          <div className="relative w-full h-full">
            {listing.images && listing.images[0] ? (
              <img 
                src={typeof listing.images[0] === 'string' ? listing.images[0] : listing.images[0].url} 
                alt="Drone preview" 
                className="w-full h-full object-cover rounded-lg opacity-60"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Video className="h-10 w-10 text-slate-400" />
            )}
            <PlayCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-white fill-white/20" />
          </div>
        );
      default:
        return <ImageIcon className="h-10 w-10 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-100 animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 id="page-title" className="text-3xl font-bold tracking-tight">
            {selectedListing ? "Listing Assets" : "Asset Library"}
          </h1>
          <p className="text-slate-500 mt-1">
            {selectedListing 
              ? `Assets for ${selectedListing.address}`
              : "Grouped by property for easy management."}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedListing && (
            <Button variant="outline" onClick={() => setSelectedListing(null)} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> Back to Folders
            </Button>
          )}
          <Button 
            id="upload-asset-btn"
            className="bg-blue-600 hover:bg-blue-700 gap-2"
            disabled={!selectedListing}
            onClick={() => setIsUploadOpen(true)}
            title={!selectedListing ? "Select a folder first" : ""}
          >
            <Plus className="h-4 w-4" /> Upload Asset
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search listings or assets..." 
            className="pl-9 bg-white border-slate-200"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {!selectedListing ? (
        // Folders View
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredListings.map((listing) => (
            <div 
              key={listing.id} 
              className="group"
            >
              <div 
                onClick={() => setSelectedListing(listing)}
                className="relative h-40 bg-slate-50 rounded-2xl border-2 border-slate-100 p-4 transition-all hover:shadow-xl hover:border-blue-400 hover:bg-white flex flex-col items-center justify-center overflow-hidden cursor-pointer"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500 rounded-t-2xl opacity-80 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute top-2 right-2 z-20">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 bg-white/50 backdrop-blur-sm shadow-sm border border-slate-100" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/app/listings/${listing.id}/edit`); }}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit Property
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={(e) => handleDeleteFolder(listing.id, e)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Folder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {listing.images && listing.images[0] ? (
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={typeof listing.images[0] === 'string' ? listing.images[0] : listing.images[0].url} 
                      alt="" 
                      className="w-full h-full object-cover opacity-10 group-hover:opacity-20 transition-opacity"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://picsum.photos/seed/${listing.id}/400/300`;
                      }}
                    />
                  </div>
                ) : null}

                <Folder className="h-16 w-16 text-blue-500 fill-blue-50 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <div className="mt-2 text-blue-600 font-bold text-xs bg-blue-50 px-2 py-0.5 rounded-full relative z-10 border border-blue-100 font-mono">
                  {(listingAssetsMap[listing.id] || []).length} FILES
                </div>
              </div>
              <div className="mt-3 flex justify-between items-start">
                <div className="flex-1 min-w-0" onClick={() => setSelectedListing(listing)}>
                  <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight text-sm">
                    {listing.address.split(',')[0]}
                  </h3>
                  <p className="text-xs text-slate-500">{listing.city || 'Unknown City'}</p>
                </div>
              </div>
            </div>
          ))}

          {filteredListings.length === 0 && (
            <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Folder className="mx-auto h-12 w-12 text-slate-300 mb-2" />
              <p className="text-slate-500 font-medium">No property folders found matching your search.</p>
            </div>
          )}
        </div>
      ) : (
        // Assets Grid View for selected listing
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {currentAssets.filter(a => 
            a.name.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((asset) => (
            <Card 
              key={asset.id} 
              className="overflow-hidden border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group relative cursor-pointer"
              onClick={() => {
                setPreviewAsset(asset);
                setIsPreviewOpen(true);
              }}
            >
              <div className="aspect-square bg-slate-50 flex items-center justify-center p-0 overflow-hidden relative">
                {renderAssetThumbnail(asset, selectedListing)}
                
                <div className="absolute top-2 right-2 z-20">
                  <DropdownMenu>
                    <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} render={
                      <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm border-2 border-slate-950 bg-white hover:bg-slate-100 text-slate-950 rounded-full">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => {
                        setActiveAsset(asset);
                        setNewName(asset.name);
                        setIsRenameOpen(true);
                      }}>
                        <Pencil className="h-4 w-4 mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleDownloadAsset(asset, e)}>
                        <Download className="h-4 w-4 mr-2" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => setAssetToDelete(asset)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {asset.type === 'floorplan' && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white p-1 rounded shadow-sm">
                    <Map className="h-3 w-3" />
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <h4 className="text-xs font-bold text-slate-800 truncate" title={asset.name}>
                  {asset.name}
                </h4>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-slate-400 font-medium uppercase font-mono">{asset.size}</span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase font-mono">{asset.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {currentAssets.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <ImageIcon className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">No assets in this folder</h3>
              <p className="text-slate-500 text-sm">Upload images, floorplans or documents to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Asset</DialogTitle>
            <DialogDescription>
              Give this file a descriptive name for your AI to understand better.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              placeholder="e.g. Master_Bedroom_Pano.jpg"
              className="bg-white"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameAsset} className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={(val) => !isUploading && setIsUploadOpen(val)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Assets</DialogTitle>
            <DialogDescription>
              Add images, floorplans, or brochures to <strong>{selectedListing?.address.split(',')[0]}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 pt-2">
            {!isUploading ? (
              <div 
                className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300 transition-all cursor-pointer group"
                onClick={handleSimulateUpload}
              >
                <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform mb-4 shadow-sm border border-blue-100">
                  <Upload className="h-8 w-8" />
                </div>
                <p className="text-sm font-bold text-slate-900">Click to select files</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF, or MP4 (Max 50MB)</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <File className="h-4 w-4 text-blue-500" />
                    Uploading assets...
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                  <p className="text-xs text-blue-700 font-medium">Processing media to generate thumbnails...</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
             <Button variant="ghost" disabled={isUploading} onClick={() => setIsUploadOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden border-none bg-slate-950/95">
          <div className="flex items-center justify-between p-4 bg-slate-900 text-white z-20">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${previewAsset?.type === 'floorplan' ? 'bg-blue-500' : 'bg-slate-700'}`}>
                {previewAsset?.type === 'floorplan' ? <Map className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight truncate max-w-[200px] md:max-w-md">{previewAsset?.name}</h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase">{previewAsset?.size} • {previewAsset?.date}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} render={
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-white hover:bg-slate-800">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        if (previewAsset) {
                          setActiveAsset(previewAsset);
                          setNewName(previewAsset.name);
                          setIsPreviewOpen(false);
                          setIsRenameOpen(true);
                        }
                      }}>
                        <Pencil className="h-4 w-4 mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); if (previewAsset) handleDownloadAsset(previewAsset, e); }}>
                        <Download className="h-4 w-4 mr-2" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => {
                        if (previewAsset) {
                          setAssetToDelete(previewAsset);
                          setIsPreviewOpen(false);
                        }
                      }}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsPreviewOpen(false)}
                className="h-9 w-9 text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-[300px]">
            {previewAsset?.type === 'image' && (
              <img 
                src={previewAsset.url} 
                alt={previewAsset.name}
                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const seed = previewAsset.name ? previewAsset.name.replace(/\s+/g, '_') : 'realestate';
                  target.src = `https://picsum.photos/seed/${seed}/1200/800`;
                }}
              />
            )}
            {(previewAsset?.type === 'floorplan' || previewAsset?.type === 'document') && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 rounded-lg p-6 md:p-12 text-center space-y-6">
                <div className="h-32 w-24 bg-white border-2 border-slate-200 rounded-lg shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-6 bg-red-600 flex items-center justify-center text-[10px] text-white font-black">
                     PDF
                  </div>
                  {previewAsset.type === 'floorplan' ? <Map className="h-12 w-12 text-slate-300 mt-4" /> : <FileText className="h-12 w-12 text-slate-300 mt-4" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xl">{previewAsset.name}</h4>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2 italic">
                    Preview is not available for PDF documents in this browser view. 
                    Please download the file to view the content.
                  </p>
                </div>
                <Button onClick={() => previewAsset && handleDownloadAsset(previewAsset)} className="bg-slate-900 hover:bg-slate-800 gap-2 px-10 h-12 text-sm font-bold shadow-lg">
                  <Download className="h-4 w-4" /> Download Original PDF
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!assetToDelete} onOpenChange={(open) => !open && setAssetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Do you really want to delete this image?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-bold text-slate-900">{assetToDelete?.name}</span> from the listing assets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAsset} 
              className="bg-red-600 hover:bg-red-700 font-bold"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
