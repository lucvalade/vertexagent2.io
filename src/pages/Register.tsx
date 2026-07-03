import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck, UserPlus, ArrowRight, Loader2, Mail, Lock, User, Facebook, Apple, Eye, EyeOff } from "lucide-react";
import { useAuth, loginWithGoogle, loginWithFacebook, loginWithApple, signUpWithEmail } from "@/hooks/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan");
  
  // Save chosen plan path to localStorage for integration hook
  useEffect(() => {
    if (planParam) {
      localStorage.setItem("selected_signup_plan", planParam);
    }
  }, [planParam]);

  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Registration failed:", err);
      const errMsg = err.message || "";
      if (
        errMsg.toLowerCase().includes("proxy") || 
        errMsg.toLowerCase().includes("non-object") || 
        errMsg.toLowerCase().includes("target or handler")
      ) {
        toast.error("Google login blocked by preview iframe restrictions", {
          description: "Google Auth is restricted inside sandboxed iframes. Press 'Open in New Tab' at the top-right of AI Studio to log in with Google, or click below to use the fast Email signup.",
          duration: 10000,
        });
      } else {
        toast.error(errMsg || "Registration failed. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleFacebookRegister = async () => {
    setLoading(true);
    try {
      await loginWithFacebook();
    } catch (err: any) {
      console.error("Facebook registration failed:", err);
      if (err.code === "auth/operation-not-allowed" || err.code === "auth/configuration-not-found") {
        toast.info("Facebook authentication is ready to configure. Please integrate your Facebook App ID in your Firebase console under Authentication > Sign-in method.");
      } else {
        toast.error(err.message || "Facebook registration failed. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleAppleRegister = async () => {
    setLoading(true);
    try {
      await loginWithApple();
    } catch (err: any) {
      console.error("Apple registration failed:", err);
      if (err.code === "auth/operation-not-allowed" || err.code === "auth/configuration-not-found") {
        toast.info("Apple Sign-In is ready to configure. Please configure Apple Sign-In credentials in your Firebase console under Authentication > Sign-in method.");
      } else {
        toast.error(err.message || "Apple registration failed. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.includes("@") || !emailRegex.test(email)) {
      toast.error("Valid email format with domain and '@' symbol is required.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (password.length >= 12 && password.length <= 16) {
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSymbol = /[^A-Za-z0-9]/.test(password);
      if (!hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
        toast.error("Password between 12 and 16 characters must contain uppercase letters, lowercase letters, numbers, and symbols.");
        return;
      }
    }

    setEmailLoading(true);
    try {
      await signUpWithEmail(email, password, name);
      toast.success("Account created successfully!");
    } catch (err: any) {
      console.error("Email registration failed:", err);
      toast.error(err.message || "Registration failed. Check your details.");
      setEmailLoading(false);
    }
  };

  // Redirect if user becomes authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/app/overview", { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const getPlanDetails = () => {
    switch (planParam) {
      case "pro":
        return {
          title: "Pro Agent Tier Pre-selected",
          desc: "Unlocks advanced Sora voice-guided property highlights, automated follow-up drafts, and prioritized MLS syncing.",
          color: "bg-blue-50 text-blue-800 border-blue-200",
          topColor: "bg-blue-600",
        };
      case "team":
        return {
          title: "Team Pro Tier Pre-selected",
          desc: "Enables organizational management, team-wide override policies, listing delegator, and shared co-branding.",
          color: "bg-indigo-50 text-indigo-800 border-indigo-200",
          topColor: "bg-indigo-600",
        };
      case "brokerage":
        return {
          title: "Brokerage Tier Pre-selected",
          desc: "Enables office hierarchies, centralized lender routing rules, and multi-agent compliance audits.",
          color: "bg-zinc-100 text-zinc-800 border-zinc-200",
          topColor: "bg-zinc-950",
        };
      case "lender":
        return {
          title: "LO Partner Tier Pre-selected",
          desc: "Enables lender subscriptions, compliant borrower opt-in pathways, and co-branded open house marketing.",
          color: "bg-emerald-50 text-emerald-800 border-emerald-200",
          topColor: "bg-emerald-600",
        };
      default:
        return {
          title: "Solo Agent Free Pre-selected",
          desc: "100% free offline-capable sign-in, standard visitor analytics, and standard list building.",
          color: "bg-amber-50 text-amber-900 border-amber-200",
          topColor: "bg-amber-500",
        };
    }
  };

  const planDetails = getPlanDetails();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000" />

      <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl overflow-hidden rounded-3xl transition-all">
        <div className={`h-2 ${planDetails.topColor}`} />
        <CardHeader className="text-center pt-8 pb-4 px-8">
          <div className="mx-auto w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <UserPlus className="h-7 w-7 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-slate-900 mb-2">Join AI Open House Connect</CardTitle>
          <CardDescription className="text-slate-500 font-medium leading-relaxed">
            Try Free for 14 Days (No Credit Card Required). Create your account to start.
          </CardDescription>
        </CardHeader>

        {planParam && (
          <div className={`mx-8 p-4 rounded-2xl border text-left mb-4 shadow-sm ${planDetails.color}`}>
            <p className="text-xs font-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              {planDetails.title}
            </p>
            <p className="text-[11px] leading-relaxed opacity-90">{planDetails.desc}</p>
          </div>
        )}

        <CardContent className="px-8 pb-8 flex flex-col gap-4">
          {!showEmailForm ? (
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleGoogleRegister} 
                disabled={loading}
                size="lg"
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-100 hover:border-blue-200 h-14 font-bold text-base transition-all rounded-2xl flex gap-3 shadow-sm"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
                )}
                Continue with Google
              </Button>

              <Button 
                onClick={handleFacebookRegister} 
                disabled={loading}
                size="lg"
                className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white h-14 font-bold text-base transition-all rounded-2xl flex gap-3 shadow-sm border-0"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Facebook className="h-5 w-5 fill-white" />
                )}
                Continue with Facebook
              </Button>

              <Button 
                onClick={handleAppleRegister} 
                disabled={loading}
                size="lg"
                className="w-full bg-slate-900 hover:bg-black text-white h-14 font-bold text-base transition-all rounded-2xl flex gap-3 shadow-sm border-0"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Apple className="h-5 w-5 fill-white" />
                )}
                Continue with Apple
              </Button>

              <button 
                onClick={() => setShowEmailForm(true)}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors mx-auto underline-offset-4 hover:underline mt-2"
              >
                Or sign up with email instead
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Jane Doe" 
                    value={name}
                    onChange={e => {
                      const val = e.target.value;
                      const words = val.split(" ");
                      const formatted = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                      setName(formatted);
                    }}
                    maxLength={100}
                    className="pl-10 h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all rounded-xl font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="email"
                    placeholder="name@brokerage.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    maxLength={100}
                    className="pl-10 h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all rounded-xl font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    maxLength={100}
                    className="pl-10 pr-10 h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all rounded-xl font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 outline-none p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Secure Password Requirements Guideline Checklist */}
                <div className="mt-2.5 p-2.5 rounded-xl border border-blue-50 bg-blue-50/20 text-[10px] sm:text-xs text-slate-600 space-y-1 font-semibold leading-relaxed">
                  <p className="font-extrabold uppercase text-[9px] tracking-wider text-slate-400 mb-1">Password Convention Guidelines</p>
                  <div className="flex items-center gap-1.5">
                    <span className={password.length >= 8 ? "text-emerald-600" : "text-stone-400"}>
                      {password.length >= 8 ? "✓" : "○"} Minimum 8 characters {password.length > 0 && `(${password.length})`}
                    </span>
                  </div>
                  
                  {password.length >= 12 && password.length <= 16 && (
                    <div className="border-t border-blue-100/40 pt-1.5 mt-1 space-y-0.5">
                      <p className="text-[9px] uppercase font-black text-blue-700">12-16 Character Checklist (Must fulfill all):</p>
                      <div className="grid grid-cols-2 gap-x-2">
                        <span className={/[A-Z]/.test(password) ? "text-emerald-600" : "text-slate-400"}>
                          {/[A-Z]/.test(password) ? "✓" : "○"} Uppercase letter
                        </span>
                        <span className={/[a-z]/.test(password) ? "text-emerald-600" : "text-slate-400"}>
                          {/[a-z]/.test(password) ? "✓" : "○"} Lowercase letter
                        </span>
                        <span className={/[0-9]/.test(password) ? "text-emerald-600" : "text-slate-400"}>
                          {/[0-9]/.test(password) ? "✓" : "○"} Numeric digit
                        </span>
                        <span className={/[^A-Za-z0-9]/.test(password) ? "text-emerald-600" : "text-slate-400"}>
                          {/[^A-Za-z0-9]/.test(password) ? "✓" : "○"} Special symbol
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                type="submit"
                disabled={emailLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold shadow-lg shadow-blue-100 mt-2"
              >
                {emailLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
              </Button>

              <button 
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Back to Google Sign In
              </button>
            </form>
          )}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100"></span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 mb-0.5">Secure Registration</p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">Your credentials are protected with enterprise-grade security.</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 px-8 flex justify-between items-center text-xs">
          <p className="text-slate-500 font-medium">Already have an account?</p>
          <Link to="/login" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
            Sign In <ArrowRight className="h-3 w-3" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
