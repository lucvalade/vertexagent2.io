import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { createListing, getListing, updateListing, Listing, deleteListingOp, ListingImage } from "@/lib/api";
import { Loader2, Plus, X, Trash2, ArrowLeft, MoreHorizontal, Pencil, Save, Image as ImageIcon, Sparkles, CheckCircle2, Mic2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, doc, getDoc, updateDoc, where } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Voice {
  id: string;
  name: string;
  type: string;
  isDefault?: boolean;
}

export default function EditListing() {
  const { user } = useAuth();
  const { listingId } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(listingId);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [urlIngest, setUrlIngest] = useState("");
  
  // Form State
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [price, setPrice] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [mlsNumber, setMlsNumber] = useState("");
  const [originatingSystemName, setOriginatingSystemName] = useState("");
  const [country, setCountry] = useState("US");
  const [brokerageName, setBrokerageName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ListingImage[]>([]);
  const [newImage, setNewImage] = useState("");
  
  // Voice State
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [voiceId, setVoiceId] = useState("");
  const [voiceName, setVoiceName] = useState("");

  // Image Rename State
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [editingImageName, setEditingImageName] = useState("");

  const [talkingPoints, setTalkingPoints] = useState<string[]>([]);
  const [newPoint, setNewPoint] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [tourDescriptors, setTourDescriptors] = useState<string[]>(new Array(16).fill(""));

  // Voice Warning Check
  useEffect(() => {
    if (!loading && user && !user.defaultVoiceId) {
      toast.warning("No default AI voice set", {
        description: "Set a default voice in the Voice Lab to automatically assign it to your tours.",
        action: {
          label: "Go to Voice Lab",
          onClick: () => navigate("/app/voicelab")
        },
        duration: 10000,
      });
    }
  }, [loading, user?.defaultVoiceId]);

  useEffect(() => {
    if (isEdit && listingId) {
      loadData(listingId);
    }
  }, [listingId]);

  const handleVoiceSelect = async (vId: string, vName: string) => {
    setVoiceId(vId);
    setVoiceName(vName);
    
    if (user?.id) {
      try {
        // Propagate to User Profile
        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, { defaultVoiceId: vId === 'none' ? null : vId });
        
        // Propagate to Voice collection isDefault flags (optimized)
        const voicesRef = collection(db, "users", user.id, "voices");
        const q = query(voicesRef, where("isDefault", "==", true));
        const currentDefaults = await getDocs(q);
        
        for (const d of currentDefaults.docs) {
          if (d.id !== vId) {
            await updateDoc(d.ref, { isDefault: false });
          }
        }
        
        if (vId !== 'none') {
          await updateDoc(doc(db, "users", user.id, "voices", vId), { isDefault: true });
        }
        
        if (vId === 'none') {
           toast.info("System default voice removed.");
        } else {
           toast.success(`"${vName}" set as system default for all new listings.`);
        }
      } catch (err) {
        console.error("Error setting default voice:", err);
      }
    }
  };

  async function loadData(id: string) {
    try {
      // Load voices first to ensure we can match names
      if (user?.id) {
        const voicesRef = collection(db, "users", user.id, "voices");
        const voicesSnap = await getDocs(query(voicesRef));
        const voicesData = voicesSnap.docs.map(doc => {
          const d = doc.data() as any;
          if (d.name && d.name.includes(" (Default)")) {
            d.name = d.name.replace(" (Default)", "");
          }
          return { id: doc.id, ...d } as Voice;
        });
        setAvailableVoices(voicesData);
      }

      const data = await getListing(id);
      if (data) {
        const isAdmin = (user as any)?.role === 'ADMIN';
        if (data.ownerId !== user?.id && !isAdmin) {
          toast.error("Unauthorized");
          navigate("/app/listings");
          return;
        }
        const fetchedAddress = data.address || "";
        const fetchedCity = data.city || "";
        const fetchedProvince = data.province || "";
        const fetchedPostalCode = data.postalCode || "";

        setAddress(fetchedAddress);
        setCity(fetchedCity);
        setProvince(fetchedProvince);
        setPostalCode(fetchedPostalCode);
        
        // Try to parse address components ONLY if they are truly missing
        if (fetchedAddress && (!fetchedCity || !fetchedProvince || !fetchedPostalCode)) {
          const parts = fetchedAddress.split(',').map(p => p.trim());
          if (parts.length >= 3) {
            if (!fetchedCity) setCity(parts[1]);
            
            const lastPart = parts[parts.length - 1];
            const stateZipMatch = lastPart.match(/^([A-Z]{2})\s+(.*)$/i);
            
            if (stateZipMatch) {
              if (!fetchedProvince) setProvince(stateZipMatch[1]);
              if (!fetchedPostalCode) setPostalCode(stateZipMatch[2]);
            } else if (parts.length === 4) {
               if (!fetchedProvince) setProvince(parts[2]);
               if (!fetchedPostalCode) setPostalCode(parts[3]);
            }
          }
        }
        
        setPrice(data.price?.toString() || "");
        setBeds(data.beds?.toString() || "");
        setBaths(data.baths?.toString() || "");
        setSqft(data.sqft?.toString() || "");
        setMlsNumber(data.mlsNumber || "");
        setOriginatingSystemName(data.originatingSystemName || "");
        setCountry(data.country || "US");
        setBrokerageName(data.brokerageName || "");
        setAgentName(data.agentName || "");
        setDescription(data.description || "");
        
        // Normalize images
        const normalizedImages: ListingImage[] = (data.images || []).map(img => {
          if (typeof img === 'string') {
            const fileName = img.split('/').pop()?.split('?')[0] || "image.jpg";
            return { url: img, name: fileName };
          }
          return img;
        });
        setImages(normalizedImages);
        
        setVoiceId(data.voiceId || "none");
        setVoiceName(data.voiceName || (data.voiceId === "none" || !data.voiceId ? "NONE (No AI Voice)" : ""));
        setTalkingPoints(data.talkingPoints || []);
        
        // Load tour descriptors, ensuring we have exactly 16 slots
        const loadedDescriptors = data.tourDescriptors || [];
        const descriptorsArray = new Array(16).fill("");
        loadedDescriptors.forEach((val: string, idx: number) => {
          if (idx < 16) descriptorsArray[idx] = val;
        });
        setTourDescriptors(descriptorsArray);

        setWebhookUrl(data.webhookUrl || "");
      }
    } catch (err) {
      toast.error("Failed to load listing");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isEdit && user?.id) {
      const fetchDefaults = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.id));
          const userData = userDoc.data();
          
          const voicesRef = collection(db, "users", user.id, "voices");
          const voicesSnap = await getDocs(query(voicesRef));
          const voicesData = voicesSnap.docs.map(doc => {
            const d = doc.data() as any;
            if (d.name && d.name.includes(" (Default)")) {
              d.name = d.name.replace(" (Default)", "");
            }
            return { id: doc.id, ...d } as Voice;
          });
          setAvailableVoices(voicesData);

          // Use system default if available
          const defaultVoice = voicesData.find(v => v.id === userData?.defaultVoiceId || v.isDefault);
          if (defaultVoice) {
            setVoiceId(defaultVoice.id);
            setVoiceName(defaultVoice.name);
          } else {
            setVoiceId("none");
            setVoiceName("NONE (No AI Voice)");
          }
        } catch (err) {
          console.error("Error fetching default voice:", err);
        }
      };
      fetchDefaults();
    }
  }, [isEdit, user?.id]);

  async function handleIngest() {
    if (!urlIngest) {
      toast.error("Please enter a property URL first");
      return;
    }
    
    try {
      const url = new URL(urlIngest);
      if (!url.hostname) throw new Error();
    } catch (e) {
      toast.error("Please enter a valid URL (e.g. https://zillow.com/...)");
      return;
    }

    toast.info("Ingesting URL... This may take a minute.");
    setLoading(true);
    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlIngest })
      });
      
      const resData = await response.json();
      
      // Even if response is not ok, we might have partial data in resData.data
      const data = resData.data;

      if (data) {
        const ingestedAddress = data.address || "";
        if (ingestedAddress) setAddress(ingestedAddress);
        
        const ingestedCity = data.city || "";
        const ingestedProvince = data.province || "";
        const ingestedPostalCode = data.postalCode || "";

        if (ingestedCity) setCity(ingestedCity);
        if (ingestedProvince) setProvince(ingestedProvince);
        if (ingestedPostalCode) setPostalCode(ingestedPostalCode);
        
        if (data.originatingSystemName) setOriginatingSystemName(data.originatingSystemName);
        if (data.country) setCountry(data.country);
        if (data.agentName) setAgentName(data.agentName);

        // Try to parse address components as fallback ONLY if they are still missing
        if (ingestedAddress && (!ingestedCity || !ingestedProvince || !ingestedPostalCode)) {
          const parts = ingestedAddress.split(',').map(p => p.trim());
          if (parts.length >= 3) {
            if (!ingestedCity && !city) setCity(parts[1]);
            const lastPart = parts[parts.length - 1];
            const stateZipMatch = lastPart.match(/^([A-Z]{2})\s+(.*)$/i);
            if (stateZipMatch) {
              if (!ingestedProvince && !province) setProvince(stateZipMatch[1]);
              if (!ingestedPostalCode && !postalCode) setPostalCode(stateZipMatch[2]);
            } else if (parts.length === 4) {
               if (!ingestedProvince && !province) setProvince(parts[2]);
               if (!ingestedPostalCode && !postalCode) setPostalCode(parts[3]);
            }
          }
        }
        
        if (data.price) setPrice(data.price.toString());
        if (data.beds) setBeds(data.beds.toString());
        if (data.baths) setBaths(data.baths.toString());
        if (data.sqft) setSqft(data.sqft.toString());
        if (data.mlsNumber) setMlsNumber(data.mlsNumber);
        if (data.brokerageName) setBrokerageName(data.brokerageName);
        if (data.agentName) setAgentName(data.agentName);
        if (data.description) setDescription(data.description);
        
        if (data.images && data.images.length > 0) {
          const normalized = data.images.map((img, idx) => {
            if (typeof img === 'string') {
              return { url: img, name: `Photo ${idx + 1} (Name Me)` };
            }
            // If it's an object with a boring name, make it a placeholder
            if (img.name && (img.name.length > 25 || img.name.includes('image') || /^[a-f0-9-]{36}$/.test(img.name))) {
               return { ...img, name: `Photo ${idx + 1} (Name Me)` };
            }
            return img;
          });
          setImages(normalized);
        }
        
        // Use keyFeatures if talkingPoints are missing
        const points = data.talkingPoints || data.keyFeatures || [];
        if (points.length > 0) setTalkingPoints(points);

        if (data.importStatus === "partial") {
          toast.warning("Partial import complete. Please review missing fields.");
        } else if (data.importStatus === "failed") {
          toast.error("We could not fully read this page. Source URL has been saved.");
        } else {
          toast.success("Successfully ingested listing data!");
        }
      }

      if (!response.ok) {
        throw new Error(resData.error || "Failed to ingest");
      }
    } catch (err: any) {
      console.error(err);
      // We don't want to show raw stack traces, just the clear error message from server
      toast.error(err.message || "Failed to ingest listing");
    } finally {
      setLoading(false);
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handleAddImage = () => {
    try {
      if (newImage) {
        const url = new URL(newImage);
        const fileName = url.pathname.split('/').pop()?.split('?')[0] || "property-image.jpg";
        setImages([...images, { url: newImage, name: fileName }]);
        setNewImage("");
        toast.success("Image added");
      }
    } catch (e) {
      toast.error("Invalid image URL");
    }
  };

  const handleRenameImage = (index: number) => {
    setEditingImageIndex(index);
    setEditingImageName(images[index].name);
    setIsRenameDialogOpen(true);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const saveImageName = async () => {
    if (editingImageIndex !== null && editingImageName.trim()) {
      const updated = [...images];
      updated[editingImageIndex] = { ...updated[editingImageIndex], name: editingImageName.trim() };
      setImages(updated);
      setIsRenameDialogOpen(false);
      setEditingImageIndex(null);
      
      if (isEdit && listingId) {
        try {
          await updateListing(listingId, { images: updated });
          toast.success("Image renamed and synced to assets");
        } catch (err) {
          toast.error("Renamed locally but failed to sync to assets");
        }
      } else {
        toast.success("Image renamed");
      }
    }
  };

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!address) {
      toast.error("Address is required");
      return;
    }

    // Validations
    const numericPrice = price ? parseInt(price) : 0;
    if (price && (isNaN(numericPrice) || numericPrice <= 0)) {
      toast.error("Price must be a positive number");
      return;
    }

    const numericSqft = sqft ? parseInt(sqft) : 0;
    if (sqft && (isNaN(numericSqft) || numericSqft >= 50000)) {
      toast.error("Square feet must be a realistic number (less than 50,000)");
      return;
    }

    if (mlsNumber && !/^[A-Z0-9-]{3,32}$/i.test(mlsNumber)) {
      toast.error("Invalid MLS Number format. Should be 3-32 alphanumeric characters.");
      return;
    }

    let formattedPostalCode = postalCode.trim();
    if (country === 'CA') {
      formattedPostalCode = formattedPostalCode.toUpperCase();
      // Auto-format: Add space if missing (A1A1A1 -> A1A 1A1)
      if (formattedPostalCode.length === 6 && !formattedPostalCode.includes(' ')) {
        formattedPostalCode = formattedPostalCode.slice(0, 3) + ' ' + formattedPostalCode.slice(3);
      }
      
      const caRegex = /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ ]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
      if (formattedPostalCode && !caRegex.test(formattedPostalCode)) {
        toast.error("Invalid Canadian Postal Code (Format: A1A 1A1). Note: D, F, I, O, Q, U are not used.");
        return;
      }
    } else {
      const usRegex = /^\d{5}(-\d{4})?$/;
      if (formattedPostalCode && !usRegex.test(formattedPostalCode)) {
        toast.error("Invalid US Zip Code (Format: 12345 or 12345-6789)");
        return;
      }
    }
    
    setSaving(true);
    try {
      const payload: Partial<Listing> = {
        address: address || "",
        city: city || "",
        province: province || "",
        postalCode: formattedPostalCode || "",
        price: price ? parseInt(price) : null,
        beds: beds ? parseInt(beds) : null,
        baths: baths ? parseInt(baths) : null,
        sqft: sqft ? parseInt(sqft) : null,
        mlsNumber: mlsNumber.toUpperCase() || "",
        originatingSystemName: originatingSystemName || "",
        country: country || "US",
        brokerageName: brokerageName || "",
        agentName: agentName || "",
        description: description || "",
        images: images || [],
        talkingPoints: talkingPoints || [],
        tourDescriptors: tourDescriptors.filter(d => d.trim() !== ""),
        webhookUrl: webhookUrl || "",
        voiceId: voiceId || "",
        voiceName: voiceName || "",
        updatedAt: Date.now()
      };

      if (isEdit) {
        await updateListing(listingId!, payload);
        toast.success("Listing updated");
      } else {
        const newId = crypto.randomUUID();
        const fullPayload = {
          id: newId,
          ownerId: user!.id,
          createdAt: Date.now(),
          ...payload
        } as Listing;
        
        await createListing(fullPayload);
        
        toast.success("Listing created");
        navigate(`/app/listings/edit/${newId}`);
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Failed to save listing";
      try {
        const errorData = JSON.parse(err.message);
        if (errorData.error) msg = `Save Error: ${errorData.error}`;
      } catch (e) {
        if (err.message) msg = `Save Error: ${err.message}`;
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteListingOp(listingId!);
      toast.success("Listing deleted");
      navigate("/app/listings");
    } catch (err) {
      toast.error("Failed to delete listing");
    }
  }

  if (loading) {
     return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-4">
        <Link 
          to="/app/listings" 
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> View Listings
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">{isEdit ? "Edit Listing" : "New Listing"}</h1>
          {isEdit && (
             <AlertDialog>
               <AlertDialogTrigger render={
                 <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" type="button">
                   <Trash2 className="h-4 w-4 mr-2" /> Delete
                 </Button>
               } />
               <AlertDialogContent>
                 <AlertDialogHeader>
                   <AlertDialogTitle>Do you really want to delete this?</AlertDialogTitle>
                   <AlertDialogDescription>
                     This action cannot be undone. This will permanently remove the listing for <span className="font-bold text-base text-slate-900">{address}</span>.
                   </AlertDialogDescription>
                 </AlertDialogHeader>
                 <AlertDialogFooter>
                   <AlertDialogCancel>No</AlertDialogCancel>
                   <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Yes</AlertDialogAction>
                 </AlertDialogFooter>
               </AlertDialogContent>
             </AlertDialog>
          )}
        </div>
      </div>

      {!isEdit && (
        <Card className="border-dashed bg-slate-50/50">
          <CardHeader>
            <CardTitle>URL Import</CardTitle>
            <CardDescription>Paste a property URL (e.g. Zillow/Redfin) to auto-fill the listing details using Gemini.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input placeholder="https://zillow.com/..." value={urlIngest} onChange={e => setUrlIngest(e.target.value)} />
            <Button variant="secondary" onClick={handleIngest}>Import</Button>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSave} className="space-y-6 pb-32">
        <Card>
          <CardHeader>
            <CardTitle>Basic Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Property Address *</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, City, ST" required />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
              </div>
              <div className="space-y-2">
                <Label>Province/State</Label>
                <Input value={province} onChange={e => setProvince(e.target.value)} placeholder="ST/PR" />
              </div>
              <div className="space-y-2">
                <Label>Postal/Zip Code</Label>
                <Input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="12345" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brokerage Name</Label>
                <Input value={brokerageName} onChange={e => setBrokerageName(e.target.value)} placeholder="Century 21, etc." />
              </div>
              <div className="space-y-2">
                <Label>Agent Name</Label>
                <Input 
                  value={agentName} 
                  onChange={e => setAgentName(e.target.value)} 
                  placeholder="e.g. Jane Doe" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>MLS® Number</Label>
                <Input value={mlsNumber} onChange={e => setMlsNumber(e.target.value.toUpperCase())} placeholder="MLS123456" />
              </div>
              <div className="space-y-2">
                <Label>Originating System (MLS Board)</Label>
                <Input value={originatingSystemName} onChange={e => setOriginatingSystemName(e.target.value)} placeholder="e.g. NAR, CREA" />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={country} 
                  onChange={e => setCountry(e.target.value)}
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="500000" />
              </div>
              <div className="space-y-2">
                <Label>Beds</Label>
                <Input type="number" value={beds} onChange={e => setBeds(e.target.value)} placeholder="3" />
              </div>
              <div className="space-y-2">
                <Label>Baths</Label>
                <Input type="number" value={baths} onChange={e => setBaths(e.target.value)} placeholder="2" />
              </div>
              <div className="space-y-2">
                <Label>Sq Ft</Label>
                <Input type="number" value={sqft} onChange={e => setSqft(e.target.value)} placeholder="2000" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} placeholder="Describe the property..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Tour Setup</CardTitle>
            <CardDescription>Supply data for the AI voice agent to discuss.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <Label className="text-base font-bold">Tour Descriptors</Label>
                <p className="text-xs text-slate-500">Add up to 16 key features or rooms, (Like Living Room / Kitchen / Bedrooms / Bathrooms Key Features / Basement / Front Yard / Back Yard + Pool), that visitors can ask the AI agent about during the tour to trigger specific visuals and voice descriptions.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tourDescriptors.map((desc, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-4">{idx + 1}.</span>
                    <Input 
                      value={desc} 
                      onChange={e => {
                        const updated = [...tourDescriptors];
                        updated[idx] = e.target.value.slice(0, 30);
                        setTourDescriptors(updated);
                      }} 
                      placeholder={`Feature ${idx + 1}`}
                      maxLength={30}
                      className="h-9 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex flex-col gap-1">
                <Label>AI Tour Voice</Label>
                <p className="text-xs text-slate-500 mb-2">Select a voice to narrate this tour. The default voice from your Voice Lab is auto-selected for new listings.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* NONE Option */}
                <div 
                  onClick={() => handleVoiceSelect("none", "NONE (No AI Voice)")}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${voiceId === 'none' ? 'border-blue-600 bg-blue-50 shadow-blue-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                  <div className={`p-2 rounded-full ${voiceId === 'none' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Mic2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold truncate">NONE</p>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">No AI Voice Model</p>
                  </div>
                  {voiceId === 'none' && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                </div>

                {availableVoices.length > 0 ? (
                  availableVoices.map((v) => (
                    v.id !== 'none' && (
                      <div 
                        key={v.id}
                        onClick={() => handleVoiceSelect(v.id, v.name)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${voiceId === v.id ? 'border-blue-600 bg-blue-50 shadow-blue-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                      >
                        <div className={`p-2 rounded-full ${voiceId === v.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <Mic2 className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${voiceId === v.id ? 'text-blue-900' : 'text-slate-900'}`}>{v.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{v.type}</p>
                            {v.id === user?.defaultVoiceId && <span className="text-[9px] bg-blue-100 text-blue-600 px-1 rounded font-bold uppercase">Default</span>}
                          </div>
                        </div>
                        {voiceId === v.id && (
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    )
                  ))
                ) : (
                  <div className="border border-dashed rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500">No custom voices. Go to <Link to="/app/voicelab" className="text-blue-600 font-bold hover:underline">Voice Lab</Link>.</p>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic px-1">Tip: Choose a voice that matches the "vibe" of the architecture and neighborhood.</p>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label>Listing Images</Label>
              <div className="flex gap-2 mb-2">
                <Input value={newImage} onChange={e => setNewImage(e.target.value)} placeholder="https://example.com/image.jpg" />
                <Button type="button" variant="outline" onClick={handleAddImage}>
                  <Plus className="h-4 w-4 mr-2" /> Add Image
                </Button>
              </div>
              
              {images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-[4/3] shadow-sm">
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      
                      {/* Menu Overlay */}
                      <div className="absolute top-3 right-3 transition-all duration-300">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="secondary" size="icon" className="h-9 w-9 bg-white/95 backdrop-blur-md border-0 shadow-xl hover:bg-white text-slate-900 rounded-full">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRenameImage(i)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSave()}>
                              <Save className="h-4 w-4 mr-2" /> Save
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600"
                              onClick={() => {
                                if (window.confirm("Delete this image?")) {
                                  setImages(prev => prev.filter((_, idx) => idx !== i));
                                  toast.success("Image removed");
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Info Overlay */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className={`bg-white/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-2xl border border-white/20 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 ${img.name.includes('(Name Me)') ? 'border-orange-200 bg-orange-50/90' : ''}`}>
                          <div className={`${img.name.includes('(Name Me)') ? 'bg-orange-500' : 'bg-blue-600'} p-1.5 rounded-md shadow-sm`}>
                            <ImageIcon className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="flex flex-col flex-1 truncate">
                            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 leading-none mb-1">
                              {img.name.includes('(Name Me)') ? 'Needs Title' : 'Image Title'}
                            </span>
                            <span className="text-sm font-bold text-black truncate tracking-tight">{img.name}</span>
                          </div>
                          {img.name.includes('(Name Me)') && (
                             <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-100" onClick={(e) => { e.stopPropagation(); handleRenameImage(i); }}>
                               <Pencil className="h-4 w-4" />
                             </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                  <ImageIcon className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-xs font-medium">No images added yet.</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Key AI Talking Points</Label>
              <div className="flex gap-2 mb-2">
                <Input value={newPoint} onChange={e => setNewPoint(e.target.value)} placeholder="e.g. Roof was replaced in 2021" onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newPoint) { setTalkingPoints([...talkingPoints, newPoint]); setNewPoint(""); }
                  }
                }}/>
                <Button type="button" variant="outline" onClick={() => {
                  if (newPoint) { setTalkingPoints([...talkingPoints, newPoint]); setNewPoint(""); }
                }}>Add</Button>
              </div>
              <ul className="list-disc pl-4 space-y-1 mt-2">
                {talkingPoints.map((pt, i) => (
                  <li key={i} className="flex justify-between items-center text-sm text-slate-700 bg-slate-50 p-2 border rounded-md">
                    <span>{pt}</span>
                    <button type="button" onClick={() => setTalkingPoints(talkingPoints.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-2 pt-4 border-t">
              <Label>CRM Webhook (Lead Export)</Label>
              <Input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." />
              <div className="bg-slate-100 p-3 rounded-lg mt-2">
                <p className="text-xs font-bold text-slate-700 mb-1">DATA EXPORTED TO WEBHOOK:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <p className="text-[10px] text-slate-500 font-mono">• client_name</p>
                  <p className="text-[10px] text-slate-500 font-mono">• client_email</p>
                  <p className="text-[10px] text-slate-500 font-mono">• property_id</p>
                  <p className="text-[10px] text-slate-500 font-mono">• agent_name</p>
                  <p className="text-[10px] text-slate-500 font-mono">• source_url</p>
                  <p className="text-[10px] text-slate-500 font-mono">• timestamps</p>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Triggered instantly when a prospect requests an agent contact.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Floating Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-center pointer-events-none">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200 p-2 rounded-2xl shadow-2xl flex items-center gap-2 max-w-sm w-full pointer-events-auto ring-1 ring-black/5 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="hidden sm:flex flex-col pl-2 border-r pr-2 border-slate-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1 text-center">Status</p>
              <p className="text-xs font-bold text-slate-500">{isEdit ? "Editing" : "New"}</p>
            </div>
            
            <div className="flex gap-2 ml-auto w-full sm:w-auto">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                className="flex-1 sm:flex-none font-bold text-slate-500 h-9"
                onClick={() => navigate(isEdit ? `/app/listings/${listingId}` : "/app/listings")}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving} 
                size="sm"
                className="flex-1 sm:flex-none min-w-[120px] bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 font-bold h-9"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  isEdit ? "Save Changes" : "Create Listing"
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Image Title</DialogTitle>
            <DialogDescription>
              Give this image a descriptive name for the AI to use during the tour.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="aspect-video rounded-lg overflow-hidden border bg-slate-100 flex items-center justify-center">
              {editingImageIndex !== null && (
                <img 
                  src={images[editingImageIndex].url} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageName" className="font-bold text-slate-700">Image Name</Label>
              <Input 
                id="imageName" 
                value={editingImageName} 
                onChange={(e) => setEditingImageName(e.target.value)} 
                placeholder="e.g. Master Bedroom, Gourmet Kitchen"
                className="h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveImageName} className="bg-blue-600 hover:bg-blue-500 font-bold px-8">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
