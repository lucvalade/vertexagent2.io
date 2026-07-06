/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { Lock, Eye, EyeOff, User, Mail, Phone, Sparkles, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function App() {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminPopupOpen, setIsAdminPopupOpen] = useState(false);

  // Waitlist form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Clear old localStorage and sessionStorage lock states to ensure it always prompts waitlist on load
    localStorage.removeItem("site_password_unlocked");
    sessionStorage.removeItem("site_password_unlocked");
    
    // Check if we are on a tour page to set initial state appropriately
    if (window.location.pathname.includes("/tour/")) {
      setIsUnlocked(true);
    } else {
      setIsUnlocked(false);
    }
  }, []);

  const isTourPage = window.location.pathname.includes("/tour/");
  const effectiveUnlocked = isUnlocked || isTourPage;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Danielle8923$$" || password === "8923") {
      sessionStorage.setItem("site_password_unlocked", "true");
      setIsUnlocked(true);
      setIsAdminPopupOpen(false);
      toast.success("Welcome to AI Open House Connect!");
    } else {
      toast.error("Invalid password. Please try again.");
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/waitlist-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim()
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to join waitlist");
      }

      setIsSubmitted(true);
      toast.success("Successfully registered on the waitlist!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setIsSubmitted(false);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-x-hidden">
      {/* Blurred app background when locked */}
      <div className={!effectiveUnlocked ? "filter blur-md select-none pointer-events-none transition-all duration-500" : "transition-all duration-500"}>
        <Outlet />
      </div>

      {/* Primary Waitlist Form Interface & Landing Page when locked */}
      {!effectiveUnlocked && (
        <div className="fixed inset-0 z-[8888] flex items-center justify-center p-4 bg-slate-950 text-slate-100 overflow-y-auto selection:bg-blue-500 selection:text-white" id="waitlist-landing-container">
          
          {/* Top Right Admin Trigger */}
          <div className="absolute top-6 right-6 z-50">
            <button
              onClick={() => setIsAdminPopupOpen(true)}
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors duration-150 px-3.5 py-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-lg shadow-sm cursor-pointer"
              id="admin-login-link"
            >
              <Lock className="h-3 w-3" />
              <span>Admin</span>
            </button>
          </div>

          {/* Background Ambient Glows */}
          <div className="absolute top-[-10%] left-[5%] w-[45vw] h-[45vh] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[5%] w-[45vw] h-[45vh] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="w-full max-w-xl my-8">
            <div className="text-center space-y-3 mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Next-Gen Real Estate Tour Platform</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white font-sans">
                AI Open House <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Connect</span>
              </h1>
              <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                Connect listings with guided AI Voice Tours, effortless offline registration kiosks, and automatic CRM synchronization.
              </p>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/90 rounded-2xl p-6 md:p-8 shadow-2xl relative" id="waitlist-form-card">
              {!isSubmitted ? (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white">Join the Elite Waitlist</h2>
                    <p className="text-slate-400 text-xs">
                      Sign up today to request immediate early pilot access. All entries are reviewed by our team.
                    </p>
                  </div>

                  <form onSubmit={handleWaitlistSubmit} id="waitlist-form" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          First Name <span className="text-blue-400 font-bold">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                            <User className="h-4 w-4" />
                          </span>
                          <input
                            type="text"
                            name="firstName"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-sans"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Last Name <span className="text-blue-400 font-bold">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                            <User className="h-4 w-4" />
                          </span>
                          <input
                            type="text"
                            name="lastName"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Email Address <span className="text-blue-400 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                          <Mail className="h-4 w-4" />
                        </span>
                        <input
                          type="email"
                          name="email"
                          placeholder="Email Address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Phone Number
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                          <Phone className="h-4 w-4" />
                        </span>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="Phone Number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-sans"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-150 transform active:scale-[0.98] border border-blue-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Adding to Waitlist...</span>
                        </>
                      ) : (
                        <>
                          <span>Join Waitlist</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="text-center py-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-center">
                    <div className="h-16 w-16 bg-emerald-500/15 border border-emerald-500/35 rounded-full flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      <CheckCircle className="h-9 w-9" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-extrabold text-white">You're on the list!</h2>
                    <p className="text-slate-300 text-sm max-w-sm mx-auto leading-relaxed">
                      Thanks! You have been successfully added to our elite private pilot program.
                    </p>
                    <p className="text-slate-400 text-xs max-w-xs mx-auto">
                      Registration details have been submitted and dispatched directly to <strong className="text-slate-200 font-semibold">sales@vertexagent.io</strong> for seat activation.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleResetForm}
                      className="px-6 py-2.5 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer"
                    >
                      Submit Another Registration
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center mt-6 text-[10px] text-slate-600 uppercase tracking-widest font-semibold">
              AI OPEN HOUSE CONNECT &copy; {new Date().getFullYear()} &bull; SECURED PRIVATE BETA
            </div>
          </div>
        </div>
      )}

      {/* Admin Password Sign-In Popup Modal Overlay */}
      {isAdminPopupOpen && !effectiveUnlocked && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200" id="password-popup-overlay">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200" id="password-popup-card">
            {/* Subtle background decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                <Lock className="h-5 w-5 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-extrabold tracking-tight text-white font-sans">
                  Private Administration Sign In
                </h2>
                <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
                  Please enter the private launch security password to access the AI Open House Connect platform.
                </p>
              </div>

              <form onSubmit={handleUnlock} className="w-full space-y-4 pt-2">
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                    Launch Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm placeholder-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-mono"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdminPopupOpen(false)}
                    className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all duration-150 border border-blue-500/10 cursor-pointer"
                  >
                    Authenticate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}
