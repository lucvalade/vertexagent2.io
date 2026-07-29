import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { Share2, Facebook, Instagram, Send, Mail, Link as LinkIcon, Check, X, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SocialShareBubbleProps {
  listing: any;
  inline?: boolean;
}

export default function SocialShareBubble({ listing, inline = false }: SocialShareBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const panelHeight = panelRef.current ? panelRef.current.offsetHeight : 340;
    const panelWidth = panelRef.current ? panelRef.current.offsetWidth : 288;

    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;

    // Check if there is enough room above to show the information box
    const fitsAbove = spaceAbove >= panelHeight + 10;
    const placeAbove = fitsAbove || spaceAbove > spaceBelow;

    // Position horizontally (aligned with icon center, clamped within viewport)
    let left = rect.left + rect.width / 2 - panelWidth / 2;
    left = Math.max(12, Math.min(left, viewportWidth - panelWidth - 12));

    // Position vertically
    let top: number;
    if (placeAbove) {
      top = Math.max(12, rect.top - panelHeight - 10);
    } else {
      top = Math.min(viewportHeight - panelHeight - 12, rect.bottom + 10);
    }

    setPanelStyle({
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 100,
    });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        panelRef.current && !panelRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const panelHeight = 340;
      const panelWidth = 288;
      const spaceAbove = rect.top;
      const spaceBelow = viewportHeight - rect.bottom;
      const placeAbove = spaceAbove >= panelHeight + 10 || spaceAbove > spaceBelow;
      let left = rect.left + rect.width / 2 - panelWidth / 2;
      left = Math.max(12, Math.min(left, viewportWidth - panelWidth - 12));
      let top = placeAbove
        ? Math.max(12, rect.top - panelHeight - 10)
        : Math.min(viewportHeight - panelHeight - 12, rect.bottom + 10);
      setPanelStyle({
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 100,
      });
    }
    setIsOpen(!isOpen);
  };

  // Email Action Modal States
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientFirstName, setRecipientFirstName] = useState("");
  const [recipientLastName, setRecipientLastName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Text Message (SMS) Modal States
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [selectedSmsOption, setSelectedSmsOption] = useState("option1");
  const [customSmsText, setCustomSmsText] = useState("");

  if (!listing) return null;

  // Resolve whether social sharing is enabled
  const isEnabled = listing.socialShareEnabled !== false;
  if (!isEnabled) return null;

  // Retrieve option visibility. Default to true for the 6 options
  const options = listing.socialShareOptions || {
    facebook: true,
    instagram: true,
    whatsapp: true,
    textMessage: true,
    email: true,
    copyLink: true,
  };

  const shareUrl = window.location.href;
  const shareText = `Explore this gorgeous home at ${listing.address || "this address"}. Beds: ${listing.beds || "N/A"}, Baths: ${listing.baths || "N/A"}. Click here for the full Sora-guided tour: ${shareUrl}`;

  const getSmsOptionText = (optionId: string) => {
    const propertyAddress = listing.address || "this address";
    const tourUrl = window.location.href;
    switch (optionId) {
      case "option1":
        return `Check out this home I toured at ${propertyAddress} as I thought you might like it. Here is the virtual AI Tour link: ${tourUrl}`;
      case "option2":
        return `Hi! Thanks for visiting the open house at ${propertyAddress}. Here is the AI Tour link as promised: ${tourUrl}`;
      case "option3":
        return `Take a virtual tour of ${propertyAddress} here: ${tourUrl}`;
      default:
        return `Take a virtual tour of ${propertyAddress} here: ${tourUrl}`;
    }
  };

  const updateSmsText = (optionKey: string) => {
    setSelectedSmsOption(optionKey);
    setCustomSmsText(getSmsOptionText(optionKey));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("✨ Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareClick = (platform: string) => {
    // Intercept click on 'email' and open our in-app modal popup instead of mailto client
    if (platform === "email") {
      setModalError("");
      
      const storedName = localStorage.getItem("visitor_name") || "";
      const storedEmail = localStorage.getItem("visitor_email") || "";
      
      let first = "";
      let last = "";
      if (storedName) {
        const parts = storedName.trim().split(/\s+/);
        first = parts[0] || "";
        last = parts.slice(1).join(" ") || "";
      }
      
      setClientFirstName(first);
      setClientLastName(last);
      setClientEmail(storedEmail);
      
      setRecipientEmail("");
      setRecipientFirstName("");
      setRecipientLastName("");
      
      setIsEmailModalOpen(true);
      setIsOpen(false); // Close the share menu bubble when opening modal
      return;
    }

    if (platform === "textMessage") {
      updateSmsText("option1");
      setIsSmsModalOpen(true);
      setIsOpen(false);
      return;
    }

    let url = "";
    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(url, "_blank", "noopener,noreferrer");
        break;
      case "instagram":
        navigator.clipboard.writeText(shareUrl);
        toast.info("📸 Link copied! Ready to paste into your Instagram Bio or Story.");
        break;
      case "whatsapp":
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        window.open(url, "_blank", "noopener,noreferrer");
        break;
      default:
        break;
    }
  };

  const forceStartCapital = (val: string) => {
    if (!val) return "";
    return val.charAt(0).toUpperCase() + val.slice(1);
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    const rEmailTrimmed = recipientEmail.trim();
    const storedEmail = localStorage.getItem("visitor_email") || "";
    const storedName = localStorage.getItem("visitor_name") || "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rEmailTrimmed)) {
      setModalError("Please enter a valid email address for your friend.");
      return;
    }

    let finalClientEmail = "";
    let finalClientFirst = "";
    let finalClientLast = "";

    if (storedEmail) {
      finalClientEmail = storedEmail.trim();
      let first = "Guest";
      let last = "Visitor";
      if (storedName) {
        const parts = storedName.trim().split(/\s+/);
        first = parts[0] || "Guest";
        last = parts.slice(1).join(" ") || "Visitor";
      }
      finalClientFirst = first.charAt(0).toUpperCase() + first.slice(1);
      finalClientLast = last.charAt(0).toUpperCase() + last.slice(1);
    } else {
      finalClientEmail = clientEmail.trim();
      finalClientFirst = clientFirstName.trim();
      finalClientLast = clientLastName.trim();
    }

    const hasStoredDetails = !!storedEmail;
    const rFirstTrimmed = hasStoredDetails ? "Friend" : recipientFirstName.trim();
    const rLastTrimmed = hasStoredDetails ? "" : recipientLastName.trim();

    if (!hasStoredDetails) {
      if (!rFirstTrimmed) {
        setModalError("Friend's first name is required.");
        return;
      }
      if (rFirstTrimmed[0] !== rFirstTrimmed[0].toUpperCase()) {
        setModalError("Friend's first name must begin with a CAPITAL letter.");
        return;
      }
      if (!rLastTrimmed) {
        setModalError("Friend's last name is required.");
        return;
      }
      if (rLastTrimmed[0] !== rLastTrimmed[0].toUpperCase()) {
        setModalError("Friend's last name must begin with a CAPITAL letter.");
        return;
      }

      if (!emailRegex.test(finalClientEmail)) {
        setModalError("Please enter a valid email address for yourself.");
        return;
      }
      if (!finalClientFirst) {
        setModalError("Your first name is required.");
        return;
      }
      if (finalClientFirst[0] !== finalClientFirst[0].toUpperCase()) {
        setModalError("Your first name must begin with a CAPITAL letter.");
        return;
      }
      if (!finalClientLast) {
        setModalError("Your last name is required.");
        return;
      }
      if (finalClientLast[0] !== finalClientLast[0].toUpperCase()) {
        setModalError("Your last name must begin with a CAPITAL letter.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/share-tour-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendEmail: rEmailTrimmed,
          senderFirstName: finalClientFirst,
          senderLastName: finalClientLast,
          clientEmail: finalClientEmail,
          recipientEmail: rEmailTrimmed,
          recipientFirstName: rFirstTrimmed,
          recipientLastName: rLastTrimmed,
          listingId: listing.id,
          propertyId: listing.id,
          originUrl: window.location.origin
        })
      });

      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to send. Please try again.");
      }

      toast.success("Tour shared successfully!");
      
      // Cleanup & Close
      setRecipientEmail("");
      setRecipientFirstName("");
      setRecipientLastName("");
      setIsEmailModalOpen(false);
    } catch (err: any) {
      setModalError("Unable to send. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if at least one platform is active
  const anyPlatformActive = Object.values(options).some(Boolean);
  if (!anyPlatformActive) return null;

  return (
    <div className={inline ? "font-sans text-left" : "fixed bottom-6 right-6 z-50 font-sans text-left"}>
      {/* Sliding bubble panel */}
      {isOpen && (
        <div
          ref={panelRef}
          style={panelStyle}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl w-72 animate-fade-in text-slate-100"
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5 mb-1">
            <Share2 className="h-4 w-4 text-blue-500" /> Share Property
          </h4>
          <p className="text-[11px] text-slate-400 leading-normal mb-4">
            Select an active option below to share physical details with close friends or family.
          </p>

          <div className="space-y-2.5">
            {options.facebook && (
              <button
                onClick={() => handleShareClick("facebook")}
                className="w-full flex items-center justify-between text-left px-3 py-2 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-slate-700 transition cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Facebook className="h-3.5 w-3.5 text-blue-500 fill-blue-500" /> Facebook Feed
                </span>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Share</span>
              </button>
            )}

            {options.instagram && (
              <button
                onClick={() => handleShareClick("instagram")}
                className="w-full flex items-center justify-between text-left px-3 py-2 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-slate-700 transition cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Instagram className="h-3.5 w-3.5 text-pink-500" /> Instagram Link
                </span>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Copy</span>
              </button>
            )}

            {options.whatsapp && (
              <button
                onClick={() => handleShareClick("whatsapp")}
                className="w-full flex items-center justify-between text-left px-3 py-2 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-slate-700 transition cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <span className="h-3.5 w-3.5 text-emerald-500 font-bold">💬</span> WhatsApp Chat
                </span>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Send</span>
              </button>
            )}

            {options.textMessage && (
              <button
                onClick={() => handleShareClick("textMessage")}
                className="w-full flex items-center justify-between text-left px-3 py-2 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-slate-700 transition cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Send className="h-3.5 w-3.5 text-sky-400" /> Text Message (SMS)
                </span>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Launch</span>
              </button>
            )}

            {options.email && (
              <button
                onClick={() => handleShareClick("email")}
                className="w-full flex items-center justify-between text-left px-3 py-2 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-slate-700 transition cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-300" /> Email
                </span>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Compose</span>
              </button>
            )}

            {options.copyLink && (
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-between text-left px-3 py-2 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-slate-700 transition cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <LinkIcon className="h-3.5 w-3.5 text-amber-500" />}
                  Copy Direct Link
                </span>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Copy</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Trigger Button with Variant Layouts */}
      {inline ? (
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className="flex items-center justify-center h-[56px] w-[56px] rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.8)] border-2 border-purple-300/40 transition-all hover:scale-110 active:scale-95 cursor-pointer relative scale-105 animate-[pulse_0.6s_infinite_ease-in-out]"
          title="Share this listing"
        >
          <Share2 className="h-5 w-5 text-white animate-pulse" />
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-purple-400 rounded-full border-2 border-slate-900 animate-ping" />
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-purple-400 rounded-full border-2 border-slate-900" />
        </button>
      ) : (
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className="flex items-center justify-center h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] border-2 border-white/15 transition-transform hover:scale-105 active:scale-95 cursor-pointer relative animate-fade-in"
          title="Share this listing"
        >
          <Share2 className="h-6 w-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-slate-900 animate-ping" />
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-slate-900" />
        </button>
      )}

      {/* Elegant, clean, compact Send Email In-App Action Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full shadow-2xl relative overflow-hidden font-sans">
            {/* Modal Title Banner */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" /> Share Tour with a Friend
              </h3>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="text-white hover:text-slate-300 transition cursor-pointer p-1 rounded-lg hover:bg-slate-850"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Modal Content Form */}
            <form onSubmit={handleSubmitEmail} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 bg-red-950/60 border border-red-900 text-white text-xs rounded-xl flex items-start gap-2.5">
                  <ShieldAlert className="h-4 w-4 text-red-300 shrink-0 mt-0.5" />
                  <p className="leading-normal font-medium text-white">{modalError}</p>
                </div>
              )}

              <p className="text-xs text-white leading-relaxed font-semibold">
                Share this interactive tour directly with your friend! Your friend will receive a link to the tour, and you will receive a thank you from the agent.
              </p>

              {/* FRIEND INFO SECTION */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-3">
                <p className="text-[10px] font-black uppercase text-white tracking-wider border-b border-slate-800 pb-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                  Friend's Information
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-white tracking-wider block">
                    Friend's Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="friend@domain.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {!localStorage.getItem("visitor_email") && (
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-white tracking-wider block">
                        Friend's First Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="First name"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition"
                        value={recipientFirstName}
                        onChange={(e) => setRecipientFirstName(e.target.value.length > 0 ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : "")}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-white tracking-wider block">
                        Friend's Last Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Last name"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition"
                        value={recipientLastName}
                        onChange={(e) => setRecipientLastName(e.target.value.length > 0 ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : "")}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CLIENT INFO SECTION */}
              {!localStorage.getItem("visitor_email") && (
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-3">
                  <p className="text-[10px] font-black uppercase text-white tracking-wider border-b border-slate-800 pb-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Sender (Your Information)
                  </p>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-white tracking-wider block">
                      Your Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-white tracking-wider block">
                        Your First Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="First name"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition"
                        value={clientFirstName}
                        onChange={(e) => setClientFirstName(e.target.value.length > 0 ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : "")}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-white tracking-wider block">
                        Your Last Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Last name"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition"
                        value={clientLastName}
                        onChange={(e) => setClientLastName(e.target.value.length > 0 ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : "")}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer text-center"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs shadow-lg transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-3 w-3 text-white" />
                      <span className="text-white">Sending...</span>
                    </>
                  ) : (
                    <span className="text-white">Send Email</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Elegant, interactive Text Message (SMS) Customization Modal */}
      {isSmsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full shadow-2xl relative overflow-hidden font-sans">
            {/* Modal Title Banner */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Send className="h-4 w-4 text-sky-400" /> Share via Text (SMS)
              </h3>
              <button
                onClick={() => setIsSmsModalOpen(false)}
                className="text-white hover:text-slate-300 transition cursor-pointer p-1 rounded-lg hover:bg-slate-850"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Modal Content / Options Form */}
            <div className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              <p className="text-xs text-white leading-relaxed font-semibold">
                Select a message template. It generates a clickable link that opens pre-populated in your native messaging app.
              </p>

              {/* TEMPLATE PICKER */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-white tracking-wider block">
                  Select SMS Style:
                </label>
                
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => updateSmsText("option1")}
                    className={`w-full text-left p-3 rounded-xl border transition text-xs flex flex-col gap-1 ${
                      selectedSmsOption === "option1"
                        ? "bg-sky-950/40 border-sky-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${selectedSmsOption === "option1" ? "bg-sky-400 animate-pulse" : "bg-slate-500"}`}></span>
                      Option 1: Visitor to Friend
                    </span>
                    <span className="text-[10px] opacity-90 line-clamp-2">
                      Check out this home I toured...
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSmsText("option2")}
                    className={`w-full text-left p-3 rounded-xl border transition text-xs flex flex-col gap-1 ${
                      selectedSmsOption === "option2"
                        ? "bg-sky-950/40 border-sky-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${selectedSmsOption === "option2" ? "bg-sky-400 animate-pulse" : "bg-slate-500"}`}></span>
                      Option 2: Agent to Lead
                    </span>
                    <span className="text-[10px] opacity-90 line-clamp-2">
                      Hi! Thanks for visiting...
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSmsText("option3")}
                    className={`w-full text-left p-3 rounded-xl border transition text-xs flex flex-col gap-1 ${
                      selectedSmsOption === "option3"
                        ? "bg-sky-950/40 border-sky-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${selectedSmsOption === "option3" ? "bg-sky-400 animate-pulse" : "bg-slate-500"}`}></span>
                      Option 3: Ultra-short (Safest)
                    </span>
                    <span className="text-[10px] opacity-90 line-clamp-2">
                      Take a virtual tour...
                    </span>
                  </button>
                </div>
              </div>

              {/* PREVIEW & CUSTOM EDITOR */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-white tracking-wider flex justify-between">
                  <span>Message Preview:</span>
                  <span className={`${customSmsText.length > 160 ? "text-amber-400" : "text-emerald-400"} text-[9px] font-medium`}>
                    {customSmsText.length} chars
                  </span>
                </label>
                <textarea
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-sky-500 transition resize-none font-medium leading-relaxed"
                  value={customSmsText}
                  onChange={(e) => setCustomSmsText(e.target.value)}
                  maxLength={400}
                />
              </div>

              {/* TECHNICAL WRAPPING NOTICE & ACTIONS */}
              <p className="text-[9px] text-white/90 leading-snug font-medium">
                * Message wrapped in encodeURIComponent() automatically for reliable native SMS handoff.
              </p>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSmsModalOpen(false)}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                    const smsProtocol = isIOS ? "sms:&body=" : "sms:?body=";
                    const encodedBody = encodeURIComponent(customSmsText);
                    const smsLink = `${smsProtocol}${encodedBody}`;
                    
                    window.open(smsLink, "_self");
                    setIsSmsModalOpen(false);
                    toast.success("📱 Opening your messages application...");
                  }}
                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs shadow-lg transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5 text-white" />
                  <span className="text-white">Open SMS App</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
