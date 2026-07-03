import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogIn, ArrowRight, Loader2, Mail, Lock, Facebook, Apple, Eye, EyeOff } from "lucide-react";
import { useAuth, loginWithGoogle, loginWithFacebook, loginWithApple, loginWithEmail } from "@/hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Login failed:", err);
      const errMsg = err.message || "";
      if (
        errMsg.toLowerCase().includes("proxy") || 
        errMsg.toLowerCase().includes("non-object") || 
        errMsg.toLowerCase().includes("target or handler")
      ) {
        toast.error("Google login blocked by preview iframe restrictions", {
          description: "Google Auth is restricted inside sandboxed iframes. Press 'Open in New Tab' at the top-right of AI Studio to log in with Google, or click below to use the fast Email login.",
          duration: 10000,
        });
      } else {
        toast.error(errMsg || "Login failed. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    try {
      await loginWithFacebook();
    } catch (err: any) {
      console.error("Facebook Login failed:", err);
      if (err.code === "auth/operation-not-allowed" || err.code === "auth/configuration-not-found") {
        toast.info("Facebook authentication is ready to configure. Please integrate your Facebook App ID in your Firebase console under Authentication > Sign-in method.");
      } else {
        toast.error(err.message || "Facebook login failed. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      await loginWithApple();
    } catch (err: any) {
      console.error("Apple Login failed:", err);
      if (err.code === "auth/operation-not-allowed" || err.code === "auth/configuration-not-found") {
        toast.info("Apple Sign-In is ready to configure. Please configure Apple Sign-In credentials in your Firebase console under Authentication > Sign-in method.");
      } else {
        toast.error(err.message || "Apple login failed. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!email.includes("@")) {
      toast.error("The email address must contain the '@' symbol.");
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
        toast.error("If your password is between 12 and 16 characters long, it must contain a mix of uppercase letters, lowercase letters, numbers, and symbols.");
        return;
      }
    }

    setEmailLoading(true);
    try {
      await loginWithEmail(email, password);
      toast.success("Welcome back!");
    } catch (err: any) {
      console.error("Email login failed:", err);
      toast.error(err.message || "Login failed. Check your credentials.");
      setEmailLoading(false);
    }
  };

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      console.log("User detected in Login page, redirecting...");
      const from = (location.state as any)?.from?.pathname || "/app/overview";
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm font-medium text-slate-500">Redirecting to dashboard...</p>
          <Button onClick={() => navigate("/app/overview")}>Click here if not redirected</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden text-left">
      {/* Decorative blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000" />

      <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl overflow-hidden rounded-3xl">
        <div className="h-2 bg-blue-600" />
        <CardHeader className="text-center pt-8 pb-6 px-8">
          <div className="mx-auto w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <LogIn className="h-7 w-7 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-slate-900 mb-2">Welcome Back</CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            Sign in to manage your AI property tours.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 flex flex-col gap-4">
          {!showEmailForm ? (
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleGoogleLogin} 
                disabled={loading}
                size="lg"
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-100 hover:border-blue-200 h-14 font-bold text-base transition-all rounded-2xl flex gap-3 shadow-sm"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
                )}
                Login with Google
              </Button>

              <Button 
                onClick={handleFacebookLogin} 
                disabled={loading}
                size="lg"
                className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white h-14 font-bold text-base transition-all rounded-2xl flex gap-3 shadow-sm border-0"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Facebook className="h-5 w-5 fill-white" />
                )}
                Login with Facebook
              </Button>

              <Button 
                onClick={handleAppleLogin} 
                disabled={loading}
                size="lg"
                className="w-full bg-slate-900 hover:bg-black text-white h-14 font-bold text-base transition-all rounded-2xl flex gap-3 shadow-sm border-0"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Apple className="h-5 w-5 fill-white" />
                )}
                Login with Apple
              </Button>

              <button 
                onClick={() => setShowEmailForm(true)}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors mx-auto underline-offset-4 hover:underline mt-2"
              >
                Or login with email instead
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
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
                <div className="flex justify-between items-center pr-1">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Password</Label>
                  <button type="button" className="text-[10px] font-bold text-blue-600 hover:underline">Forgot?</button>
                </div>
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
              </div>

              <Button 
                type="submit"
                disabled={emailLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold shadow-lg shadow-blue-100 mt-2"
              >
                {emailLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
              </Button>

              <button 
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Back to Google Login
              </button>
            </form>
          )}
        </CardContent>
        <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 px-8 flex justify-between items-center text-xs">
          <p className="text-slate-500 font-medium">New member?</p>
          <Link to="/register" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
            Create Account <ArrowRight className="h-3 w-3" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
