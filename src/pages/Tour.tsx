import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getListing, getAgent, createLead, Listing, sendEmail } from "@/lib/api";
import { useLiveVoice } from "@/hooks/useLiveVoice";
import { Type } from "@google/genai";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mic, MicOff, Home, PhoneCall, Loader2, MapPin, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

const SUPPORTED_LANGUAGES = [
  "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Azerbaijani", "Basque", "Bengali", "Bosnian", "Bulgarian", 
  "Burmese", "Catalan", "Chinese (Simplified)", "Chinese (Traditional)", "Croatian", "Czech", "Danish", "Dutch", 
  "English", "Estonian", "Farsi (Persian)", "Filipino (Tagalog)", "Finnish", "French", "Galician", "Georgian", 
  "German", "Greek", "Gujarati", "Hebrew", "Hindi", "Hungarian", "Icelandic", "Indonesian", "Italian", "Japanese", 
  "Kannada", "Kazakh", "Khmer", "Korean", "Kyrgyz", "Lao", "Latvian", "Lithuanian", "Macedonian", "Malay", "Malayalam", 
  "Marathi", "Mongolian", "Nepali", "Norwegian", "Pashto", "Polish", "Portuguese", "Punjabi", "Romanian", "Russian", 
  "Serbian", "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish", "Swahili", "Swedish", "Tamil", "Telugu", "Thai", 
  "Turkish", "Ukrainian", "Urdu", "Uzbek", "Vietnamese", "Welsh", "Zulu"
];

const show_property_feature = {
  name: "show_property_feature",
  description: "Changes the currently displayed image on the user's screen to match the room or feature you are discussing.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      imageIndex: {
        type: Type.NUMBER,
        description: "The index of the image in the listing's images array to show, starting at 0."
      }
    },
    required: ["imageIndex"]
  }
};

const trigger_lead_capture = {
  name: "trigger_lead_capture",
  description: "Brings up a lead capture form on the user's screen so they can connect with the real estate agent.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: []
  }
};

export default function Tour() {
  const { listingId } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [language, setLanguage] = useState("English");

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (listingId) {
      loadListing(listingId);
    }
  }, [listingId]);

  async function loadListing(id: string) {
    if (id === "sample") {
      setListing({
        id: "sample",
        ownerId: "sample_agent",
        address: "123 VertexAgent Lane, Sample City, CA",
        price: 1250000,
        beds: 4,
        baths: 3,
        description: "Welcome to this beautiful smart home featuring an open concept living area, modernized kitchen with quartz countertops, and a stunning backyard perfect for entertaining.",
        images: [
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1000",
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000"
        ],
        talkingPoints: ["Newly renovated kitchen", "Smart home integration", "Open concept layout"],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setAgent({
        name: "Demo Agent",
        email: "demo@vertexagent.io"
      });
      setLoading(false);
      return;
    }
    
    try {
      const data = await getListing(id);
      setListing(data);
      if (data && data.ownerId) {
        const agentData = await getAgent(data.ownerId);
        setAgent(agentData);
      }
    } catch (err) {
      toast.error("Failed to load listing details");
    } finally {
      setLoading(false);
    }
  }

  const handleToolCall = async (name: string, args: any) => {
    console.log("TOOL CALLED:", name, args);
    if (name === "show_property_feature") {
      const idx = args.imageIndex;
      if (idx >= 0 && idx < (listing?.images?.length || 0)) {
        setActiveImageIndex(idx);
      }
      return { success: true };
    }
    
    if (name === "trigger_lead_capture") {
      setShowLeadForm(true);
      return { success: true, message: "Lead form is now visible to the user." };
    }
    
    return { error: "Unknown tool" };
  };

  const systemInstruction = `You are the AI talking-tour assistant for this real estate listing.
Listing context:
- Listing ID: ${listing?.id || "Unknown"}
- Property address: ${listing?.address || "Unknown"}
- Brokerage name: VertexAgent Partner Brokerage
- Brokerage ID: BRK-001
- Agent name: ${agent?.name || "The Listing Agent"}
- Agent role: Real Estate Agent
- Languages enabled: All Supported
- Language spoken currently: ${language}. You MUST exclusively speak in this language.
- Lead gate threshold: 3 questions or high interest
- Skip allowed: True
- Immediate access enabled: False

Property facts:
- Price: ${listing?.price ? "$" + listing.price.toLocaleString() : "Unlisted"}
- Beds/Baths: ${listing?.beds || "N/A"} / ${listing?.baths || "N/A"}
- Sq Ft: N/A
- Lot Size: N/A
- Property type: Residential Property
- Key features: ${listing?.talkingPoints?.join("; ") || "N/A"}
- Room list: See tools/images
- Uploaded documents: None

Neighborhood context:
- Nearby schools: Local school district
- Transit: Accessible via public transit
- Amenities: Nearby shopping and dining
- Landmarks: Local community landmarks

Behavior:
- Welcome the visitor briefly.
- If the visitor appears to be on-site or says they are outside, acknowledge that.
- Offer one simple starting option, such as seeing the kitchen, living room, backyard, floor plan, or neighborhood highlights.
- Use tools to update visuals before speaking about the requested item.
- Use only the facts above and uploaded content.
- If information is not available, offer agent follow-up.
- If the visitor shows high intent or reaches the threshold, begin the approved lead-capture flow using "trigger_lead_capture".
- Tone: Warm, professional, local, trustworthy. Short spoken turns optimized for voice playback.`;

  const { connected, connecting, error, startSession, stopSession } = useLiveVoice(
    systemInstruction,
    [{ functionDeclarations: [show_property_feature, trigger_lead_capture] }],
    handleToolCall
  );

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) { 
      setErrors(prev => ({ ...prev, name: "Name is required" }));
      return; 
    }
    if (!phone) {
      setErrors(prev => ({ ...prev, phone: "Phone is required" }));
      return;
    }
    if (!email) {
      setErrors(prev => ({ ...prev, email: "Email is required" }));
      return;
    }
    if (email && !email.includes('@')) {
      setErrors(prev => ({ ...prev, email: "Must contain @" }));
      return;
    }
    if (message.length < 20) {
      setErrors(prev => ({ ...prev, message: "Min 20 characters" }));
      return;
    }
    
    setSubmitting(true);
    try {
      await createLead(listing!.id, {
        id: crypto.randomUUID(),
        listingId: listing!.id,
        listingAddress: listing!.address,
        agentId: listing!.ownerId,
        name,
        phone,
        email,
        message,
        status: "New",
        createdAt: Date.now()
      });

      // Send Email Notification to Agent
      if (agent?.email) {
        await sendEmail({
          to: agent.email,
          subject: `NEW LEAD CAPTURED: ${name} for ${listing!.address}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
              <h1 style="color: #2563eb; font-size: 20px; margin-bottom: 20px;">VertexAgent Lead Alert</h1>
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 4px 0;"><strong>Name:</strong> ${name}</p>
                <p style="margin: 4px 0;"><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                <p style="margin: 4px 0;"><strong>Email:</strong> ${email || 'Not provided'}</p>
                <p style="margin: 4px 0;"><strong>Property:</strong> ${listing!.address}</p>
              </div>
              <p style="font-weight: bold; margin-bottom: 8px;">Visitor Message:</p>
              <p style="font-style: italic; color: #64748b; background: #fff; padding: 12px; border: 1px dashed #cbd5e1; border-radius: 4px;">
                "${message || 'No message provided.'}"
              </p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                <a href="${window.location.origin}/app/leads?agent=${listing!.ownerId}&listing=${listing!.id}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">View in Dashboard</a>
                <p style="margin-top: 12px; font-size: 10px; color: #94a3b8; font-family: monospace;">Agent Identification Code: ${listing!.ownerId}</p>
              </div>
            </div>
          `,
          text: `New Lead Captured: ${name} for ${listing!.address}. Phone: ${phone}, Email: ${email}`
        }).catch(err => console.error("Lead email failed:", err));
      }

      if (listing!.webhookUrl) {
         fetch(listing!.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              name, phone, email, message, 
              propertyAddress: listing!.address,
              tourUrl: window.location.href 
            })
         }).catch(err => console.error("Webhook failed:", err));
      }

      toast.success("Thanks! The agent will be in touch soon.");
      setShowLeadForm(false);
    } catch (err) {
      toast.error("Failed to submit lead.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-muted-foreground animate-pulse font-medium">Loading Tour Experience...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-xl text-slate-500">Property not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black text-white relative overflow-hidden">
      {/* Visual Content - 60% Width */}
      <div className="w-full md:w-[60%] lg:w-[65%] h-[50vh] md:h-screen relative bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800">
        {listing.images && listing.images.length > 0 ? (
          <img 
            src={typeof listing.images[activeImageIndex] === 'string' ? listing.images[activeImageIndex] : (listing.images[activeImageIndex] as any).url} 
            alt="Property Feature" 
            className="w-full h-full object-cover transition-opacity duration-1000"
          />
        ) : (
          <div className="flex w-full h-full items-center justify-center text-slate-500">
            <Home className="h-24 w-24 opacity-20" />
            <span className="sr-only">No Images Available</span>
          </div>
        )}
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
        
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 pointer-events-none">
          <div className="flex items-center gap-2 text-white/80 mb-2 font-medium">
             <MapPin className="h-5 w-5 text-blue-400" />
             <h2 className="text-xl drop-shadow-md">
               {listing.address}{listing.city ? `, ${listing.city}` : ""}{listing.province ? `, ${listing.province}` : ""}
             </h2>
          </div>
          <div className="flex gap-x-2 text-sm md:text-base text-white drop-shadow-lg ml-1 items-baseline">
             {listing.price !== undefined && <span className="font-bold text-lg">${listing.price.toLocaleString()}</span>}
             {listing.beds !== undefined && <span className="font-medium">{listing.beds} Beds</span>}
             {listing.baths !== undefined && <span className="font-medium">{listing.baths} Baths</span>}
          </div>
        </div>
      </div>

      {/* Voice Interaction Panel - 40% Width */}
      <div className="w-full md:w-[40%] lg:w-[35%] flex flex-col h-[50vh] md:h-screen bg-slate-950 p-6 shadow-2xl z-10">
         <div className="flex-1 flex flex-col items-center justify-center">
            {/* Visualizer / Avatar */}
             <div className="relative mb-6 mt-2">
              <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 ${connected ? 'bg-blue-600/70 opacity-100 scale-150 animate-pulse' : 'bg-white/80 opacity-100 scale-125 animate-pulse'}`} />
              <div className={`relative flex h-[110px] w-[110px] items-center justify-center rounded-full border-4 transition-colors ${connected ? 'border-blue-500 bg-slate-900 shadow-[0_0_60px_rgba(59,130,246,0.7)]' : 'border-white bg-slate-900 shadow-[0_0_60px_rgba(255,255,255,0.6)]'}`}>
                <div className="h-[54px] w-[54px] text-white opacity-100 drop-shadow-[0_0_20px_rgba(255,255,255,1)]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="text-center space-y-3 mb-6 w-full max-w-sm px-4">
              <h1 className="text-[26px] font-extrabold tracking-tight text-white mb-4">
                {connected ? "Listening..." : "Start Voice Tour"}
              </h1>
              
              <div className="space-y-4">
                <p className="text-slate-300 text-sm leading-relaxed font-medium">
                  {connected 
                    ? "Ask questions naturally. Say 'Tell me about the kitchen' or 'I want to schedule a showing'." 
                    : "Experience this property with an interactive AI guide."}
                </p>
                
                {!connected && (
                   <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                     <p className="text-white font-black text-sm mb-2 tracking-wide">Ask me About:</p>
                     <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1.5 text-white font-bold text-[14px] leading-relaxed">
                        {listing.tourDescriptors && listing.tourDescriptors.length > 0 ? (
                          listing.tourDescriptors.map((desc, i) => (
                             <span key={i} className="flex items-center drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                                {desc}
                                {i < (listing.tourDescriptors?.length || 0) - 1 && <span className="ml-2 text-white/40 font-normal">/</span>}
                             </span>
                          ))
                        ) : (
                          <span className="text-white/60 italic font-medium">Bedrooms / Kitchen / Backyard / and more...</span>
                        )}
                     </div>
                   </div>
                )}
              </div>

              {error && (
                <div className="p-3 mt-4 text-sm text-red-300 bg-red-950/50 rounded-lg border border-red-900/50">
                   {error}
                </div>
              )}
            </div>

            <div className="flex gap-4 items-center">
              {!connected ? (
                <Button 
                  size="lg" 
                  className="rounded-full h-[54px] px-[34px] text-base bg-blue-600 hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all font-semibold"
                  onClick={startSession}
                  disabled={connecting}
                >
                  {connecting ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <Mic className="mr-3 h-4 w-4" />}
                  {connecting ? "Connecting..." : "Tap to Start"}
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  variant="destructive"
                  className="rounded-full h-[54px] w-[54px] p-0 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                  onClick={stopSession}
                >
                  <MicOff className="h-5 w-5" />
                  <span className="sr-only">End Tour</span>
                </Button>
              )}
            </div>
         </div>

         {/* Bottom Action bar */}
         <div className="pt-4 mt-auto border-t border-slate-800 space-y-2">
           <DropdownMenu>
             <DropdownMenuTrigger className="w-full">
               <div className="flex w-full justify-between items-center bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-3 py-1.5 rounded-md transition-colors text-xs font-medium">
                 <div className="flex items-center gap-2">
                   <Globe className="h-3.5 w-3.5" />
                   {language}
                 </div>
                 <span className="text-[10px] text-slate-500 border rounded px-1 py-0.5 bg-slate-950 border-slate-800 text-white">Change</span>
               </div>
             </DropdownMenuTrigger>
             <DropdownMenuContent className="w-full min-w-[240px] bg-slate-900 border-slate-800 text-slate-200" align="end" side="top">
               <ScrollArea className="h-48">
                 {SUPPORTED_LANGUAGES.map(lang => (
                   <DropdownMenuItem 
                     key={lang} 
                     onClick={() => setLanguage(lang)}
                     className={`focus:bg-slate-800 focus:text-white cursor-pointer ${language === lang ? 'bg-slate-800 text-white font-medium' : ''}`}
                   >
                     {lang}
                   </DropdownMenuItem>
                 ))}
               </ScrollArea>
             </DropdownMenuContent>
           </DropdownMenu>

           <Button variant="outline" className="w-full h-9 text-xs text-white border-blue-600/30 bg-blue-600/10 hover:bg-blue-600/20" onClick={() => setShowLeadForm(true)}>
             <PhoneCall className="mr-2 h-3.5 w-3.5" /> Contact Agent
           </Button>
         </div>
      </div>

      <Dialog open={showLeadForm} onOpenChange={setShowLeadForm}>
        <DialogContent className="sm:max-w-md bg-white text-slate-900 border-slate-200">
          <DialogHeader>
            <DialogTitle>Request a Showing</DialogTitle>
            <DialogDescription>
              Interested in {listing.address}? Provide your details and the agent will contact you shortly.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLeadSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Full Name *</Label>
                {errors.name && <span className="text-red-600 font-bold text-[10px] uppercase animate-pulse">{errors.name}</span>}
              </div>
              <Input 
                value={name} 
                onChange={e => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                }} 
                onBlur={() => {
                  if (name.trim()) {
                    const formatted = name.trim().split(/\s+/).map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    ).join(" ");
                    setName(formatted);
                    setErrors(prev => ({ ...prev, name: "" }));
                  } else {
                    setErrors(prev => ({ ...prev, name: "Name is required" }));
                  }
                }}
                required 
                placeholder="Jane Doe" 
                className={`bg-slate-50 ${errors.name ? 'border-red-500' : ''}`} 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Phone *</Label>
                {errors.phone && <span className="text-red-600 font-bold text-[10px] uppercase animate-pulse">{errors.phone}</span>}
              </div>
              <Input 
                type="tel" 
                value={phone} 
                required
                onChange={e => {
                  const x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
                  if (x) {
                    setPhone(!x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : ''));
                  }
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
                }} 
                onBlur={() => {
                  const digits = phone.replace(/\D/g, '');
                  if (!phone.trim()) {
                    setErrors(prev => ({ ...prev, phone: "Phone is required" }));
                  } else if (digits.length < 10) {
                    setErrors(prev => ({ ...prev, phone: "Invalid Number" }));
                  } else {
                    setErrors(prev => ({ ...prev, phone: "" }));
                  }
                }}
                placeholder="(555) 123-4567" 
                className={`bg-slate-50 ${errors.phone ? 'border-red-500' : ''}`} 
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Email *</Label>
                {errors.email && <span className="text-red-600 font-bold text-[10px] uppercase animate-pulse">{errors.email}</span>}
              </div>
              <Input 
                type="email" 
                value={email} 
                required
                onChange={e => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                }} 
                onBlur={() => {
                  if (email && !email.includes('@')) {
                    setErrors(prev => ({ ...prev, email: "Must contain @" }));
                  } else if (!email) {
                    setErrors(prev => ({ ...prev, email: "Email is required" }));
                  } else {
                    setErrors(prev => ({ ...prev, email: "" }));
                  }
                }}
                placeholder="jane@example.com" 
                className={`bg-slate-50 ${errors.email ? 'border-red-500' : ''}`} 
              />
            </div>
            <div className="space-y-2">
               <div className="flex justify-between items-center">
                 <Label>Message *</Label>
                 {errors.message && <span className="text-red-600 font-bold text-[10px] uppercase animate-pulse">{errors.message}</span>}
               </div>
               <Textarea 
                value={message} 
                required
                onChange={e => {
                  setMessage(e.target.value);
                  if (errors.message) setErrors(prev => ({ ...prev, message: "" }));
                }} 
                onBlur={() => {
                  if (message.trim()) {
                    const formatted = message.trim().charAt(0).toUpperCase() + message.trim().slice(1);
                    setMessage(formatted);
                    if (formatted.length < 20) {
                      setErrors(prev => ({ ...prev, message: "Min 20 chars" }));
                    } else {
                      setErrors(prev => ({ ...prev, message: "" }));
                    }
                  } else {
                    setErrors(prev => ({ ...prev, message: "Message is required" }));
                  }
                }}
                placeholder="I would like to schedule a private tour." 
                rows={3} 
                className={`bg-slate-50 ${errors.message ? 'border-red-500' : ''}`} 
               />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting}
              onClick={(e) => {
                let hasError = false;
                const newErrors = { name: "", phone: "", email: "", message: "" };

                if (!name.trim()) { newErrors.name = "Name required"; hasError = true; }
                if (!phone.replace(/\D/g, '')) { newErrors.phone = "Phone required"; hasError = true; }
                else if (phone.replace(/\D/g, '').length < 10) { newErrors.phone = "Invalid Phone"; hasError = true; }
                
                if (!email.trim()) { newErrors.email = "Email required"; hasError = true; }
                else if (!email.includes('@')) { newErrors.email = "Must contain @"; hasError = true; }
                
                if (!message.trim()) { newErrors.message = "Message required"; hasError = true; }
                else if (message.trim().length < 20) { newErrors.message = "Min 20 characters"; hasError = true; }

                if (hasError) {
                  e.preventDefault();
                  setErrors(newErrors);
                  toast.error("Please correct the errors before submitting.");
                }
              }}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
