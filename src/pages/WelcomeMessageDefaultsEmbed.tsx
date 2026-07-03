import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Mic2, Sparkles } from "lucide-react";

export default function WelcomeMessageDefaultsEmbed() {
  const { user } = useAuth();

  // Sora Welcome Defaults Management State
  const [welcomeDefaults, setWelcomeDefaults] = useState<any[]>([]);
  const [welcomeDefaultsLoading, setWelcomeDefaultsLoading] = useState(false);
  const [editingDefaultTexts, setEditingDefaultTexts] = useState<Record<string, string>>({
    en: "Welcome! I am Sora, your real estate AI assistant. Thank you for visiting this open house. Please feel free to look around, explore the rooms, and ask me any questions about the property features, pricing, or neighborhood."
  });
  const [savingDefaultLocale, setSavingDefaultLocale] = useState<string | null>(null);
  const [translatingAllDefaults, setTranslatingAllDefaults] = useState(false);
  const [isRewritingWelcomeDefault, setIsRewritingWelcomeDefault] = useState(false);

  useEffect(() => {
    // Apply body-specific iframe styles
    document.body.style.margin = "0";
    document.body.style.overflowY = "auto";
    document.body.style.backgroundColor = "transparent";
    
    fetchWelcomeDefaults();

    return () => {
      // Revert styles on unmount
      document.body.style.margin = "";
      document.body.style.overflowY = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  const handleAiRewriteWelcomeDefault = async () => {
    const textToRewrite = editingDefaultTexts["en"]?.trim();
    if (!textToRewrite) {
      toast.error("Please enter some English default welcome text first.");
      return;
    }

    setIsRewritingWelcomeDefault(true);
    const toastId = toast.loading("Rewriting default welcome message with Sora AI...");
    try {
      const res = await fetch("/api/shorten-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToRewrite }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.shortenedText) {
          const cleanText = result.shortenedText.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
          const words = cleanText.split(" ");
          let cappedText = cleanText;
          if (words.length > 40) {
            cappedText = words.slice(0, 40).join(" ") + "...";
          }
          setEditingDefaultTexts(prev => ({
            ...prev,
            en: cappedText
          }));
          toast.success("Default welcome message rewritten!", { id: toastId });
        } else {
          toast.error("Failed to rewrite. AI did not return valid text.", { id: toastId });
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to contact AI rewrite service.", { id: toastId });
      }
    } catch (err) {
      console.error("AI Rewrite default welcome error:", err);
      toast.error("Error during AI rewrite of default welcome message.", { id: toastId });
    } finally {
      setIsRewritingWelcomeDefault(false);
    }
  };

  const handleTranslateAllDefaults = async () => {
    const enText = editingDefaultTexts["en"];
    if (!enText || !enText.trim()) {
      toast.error("Please enter a welcome message in US English (Default) first.");
      return;
    }
    setTranslatingAllDefaults(true);
    try {
      const response = await fetch("/api/welcome-messages/translate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: enText.trim() })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.translations) {
          const updated = {
            ...editingDefaultTexts,
            ...data.translations,
            en: enText.trim()
          };
          setEditingDefaultTexts(updated);
          
          // Bulk Save to backend
          toast.info("Saving translated defaults to database...");
          const saveRes = await fetch("/api/welcome-messages/defaults/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              translations: updated,
              userId: user?.id
            })
          });
          if (saveRes.ok) {
            toast.success("Successfully translated and SAVED the US English default message into all 24 languages!");
            await fetchWelcomeDefaults();
          } else {
            toast.warning("Translated successfully, but failed to save defaults in bulk. Please try updating individually.");
          }
        } else {
          toast.error("Failed to translate default welcome message.");
        }
      } else {
        toast.error("Error communicating with the translation service.");
      }
    } catch (err) {
      console.error("Failed to translate defaults:", err);
      toast.error("Network error while translating welcome message.");
    } finally {
      setTranslatingAllDefaults(false);
    }
  };

  const fetchWelcomeDefaults = async () => {
    setWelcomeDefaultsLoading(true);
    try {
      const res = await fetch("/api/welcome-messages/defaults");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.defaults) {
          setWelcomeDefaults(data.defaults);
          // Initialize editing texts
          const editingMap: Record<string, string> = {};
          data.defaults.forEach((d: any) => {
            editingMap[d.locale] = d.text_value;
          });
          if (!editingMap["en"]) {
            editingMap["en"] = "Welcome! I am Sora, your real estate AI assistant. Thank you for visiting this open house. Please feel free to look around, explore the rooms, and ask me any questions about the property features, pricing, or neighborhood.";
          }
          setEditingDefaultTexts(editingMap);
        }
      }
    } catch (err) {
      console.error("Failed to fetch platform welcome message defaults:", err);
    } finally {
      setWelcomeDefaultsLoading(false);
    }
  };

  return (
    <div id="welcome-message-defaults-embed-container" className="m-0 p-0 overflow-y-auto bg-transparent w-full h-full">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Mic2 className="h-5 w-5 text-[#155dfc]" />
            <h2 className="text-lg font-bold text-slate-800">Platform Welcome Message Defaults</h2>
          </div>
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
            System Settings
          </span>
        </div>

        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Configure the fallback verbal welcome messages Sora uses when visitors begin a property tour. If an agent does not define a custom property override message, Sora will use these system-wide defaults according to the visitor's preferred language locale.
        </p>

        {welcomeDefaultsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-[#155dfc] animate-spin" />
            <span className="ml-2 text-sm text-slate-500">Loading default welcome messages...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {[
              { code: "en", name: "English (Default)", flag: "🇺🇸" },
              { code: "fr", name: "French (Français)", flag: "🇫🇷" },
              { code: "es", name: "Spanish (Español)", flag: "🇪🇸" },
              { code: "zh-CN", name: "Chinese (Simplified) (中文简体)", flag: "🇨🇳" },
              { code: "zh-TW", name: "Chinese (Traditional) (中文繁體)", flag: "🇹🇼" },
              { code: "de", name: "German (Deutsch)", flag: "🇩🇪" },
              { code: "it", name: "Italian (Italiano)", flag: "🇮🇹" },
              { code: "pt", name: "Portuguese (Português)", flag: "🇵🇹" },
              { code: "ja", name: "Japanese (日本語)", flag: "🇯🇵" },
              { code: "ko", name: "Korean (한국어)", flag: "🇰🇷" },
              { code: "nl", name: "Dutch (Nederlands)", flag: "🇳🇱" },
              { code: "ru", name: "Russian (Русский)", flag: "🇷🇺" },
              { code: "vi", name: "Vietnamese (Tiếng Việt)", flag: "🇻🇳" },
              { code: "ar", name: "Arabic (العربية)", flag: "🇸🇦" },
              { code: "hi", name: "Hindi (हिन्दी)", flag: "🇮🇳" },
              { code: "bn", name: "Bengali (বাংলা)", flag: "🇧🇩" },
              { code: "id", name: "Indonesian (Bahasa Indonesia)", flag: "🇮🇩" },
              { code: "pl", name: "Polish (Polski)", flag: "🇵🇱" },
              { code: "ro", name: "Romanian (Română)", flag: "🇷🇴" },
              { code: "sv", name: "Swedish (Svenska)", flag: "🇸🇪" },
              { code: "ta", name: "Tamil (தமிழ்)", flag: "🇱🇰" },
              { code: "th", name: "Thai (ไทย)", flag: "🇹🇭" },
              { code: "tr", name: "Turkish (Türkçe)", flag: "🇹🇷" },
              { code: "ur", name: "Urdu (اردو)", flag: "🇵🇰" }
            ].map(({ code: locale, name: label, flag }) => {
              return (
                <div key={locale} className="p-4 border rounded-lg bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="text-lg">{flag}</span>
                      {label}
                    </label>
                    <div className="flex items-center gap-2">
                      {locale === "en" && (
                        <>
                          <button
                            type="button"
                            onClick={handleAiRewriteWelcomeDefault}
                            disabled={isRewritingWelcomeDefault}
                            className="text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 px-2.5 py-1 rounded-md bg-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            {isRewritingWelcomeDefault ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Rewriting...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3.5 w-3.5" />
                                AI Rewrite
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleTranslateAllDefaults}
                            disabled={translatingAllDefaults}
                            className="text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 px-2.5 py-1 rounded-md bg-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            {translatingAllDefaults ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Translating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3.5 w-3.5" />
                                Translate to all Languages
                              </>
                            )}
                          </button>
                        </>
                      )}
                      <span className="text-[10px] font-mono font-semibold text-slate-400 bg-white px-2 py-0.5 rounded border">
                        locale: {locale}
                      </span>
                    </div>
                  </div>

                  <textarea
                    value={editingDefaultTexts[locale] || ""}
                    onChange={(e) => setEditingDefaultTexts({
                      ...editingDefaultTexts,
                      [locale]: e.target.value
                    })}
                    rows={3}
                    placeholder={`Enter default welcome message for ${locale}...`}
                    className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm font-sans leading-relaxed focus:border-blue-500 focus:ring-blue-500"
                  />

                  {user?.role === 'ADMIN' ? (
                    <div className="flex justify-end">
                      <button
                        onClick={async () => {
                          const textVal = editingDefaultTexts[locale];
                          if (!textVal || !textVal.trim()) {
                            toast.error("Default welcome message cannot be blank");
                            return;
                          }
                          setSavingDefaultLocale(locale);
                          try {
                            const response = await fetch("/api/welcome-messages/defaults", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                locale,
                                text_value: textVal.trim(),
                                userId: user?.id
                              })
                            });
                            if (response.ok) {
                              toast.success(`Default welcome message for ${locale.toUpperCase()} updated!`);
                              fetchWelcomeDefaults();
                            } else {
                              toast.error("Failed to update welcome message default.");
                            }
                          } catch (err) {
                            toast.error("Network error while saving default welcome message.");
                          } finally {
                            setSavingDefaultLocale(null);
                          }
                        }}
                        disabled={savingDefaultLocale === locale}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-md font-semibold text-xs hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {savingDefaultLocale === locale && <Loader2 className="h-3 w-3 animate-spin" />}
                        Update Default
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic text-right">
                      * Only Platform Admins can edit system-wide default scripts.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
