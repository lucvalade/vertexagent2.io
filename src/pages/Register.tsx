import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck, UserPlus, ArrowRight, Loader2, Mail, Lock, User } from "lucide-react";
import { useAuth, loginWithGoogle, signUpWithEmail } from "@/hooks/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Registration failed:", err);
      toast.error(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000" />

      <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl overflow-hidden rounded-3xl transition-all">
        <div className="h-2 bg-blue-600" />
        <CardHeader className="text-center pt-8 pb-6 px-8">
          <div className="mx-auto w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <UserPlus className="h-7 w-7 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-slate-900 mb-2">Join VertexAgent</CardTitle>
          <CardDescription className="text-slate-500 font-medium leading-relaxed">
            Try Free for 14 Days (No Credit Card Required). Create your account to start.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 flex flex-col gap-4">
          {!showEmailForm ? (
            <>
              <Button 
                onClick={handleGoogleRegister} 
                disabled={loading}
                size="lg"
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-100 hover:border-blue-200 h-14 font-bold text-lg transition-all rounded-2xl flex gap-3 shadow-sm"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
                )}
                Continue with Google
              </Button>

              <button 
                onClick={() => setShowEmailForm(true)}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors mx-auto underline-offset-4 hover:underline"
              >
                Or sign up with email instead
              </button>
            </>
          ) : (
            <form onSubmit={handleEmailRegister} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Jane Doe" 
                    value={name}
                    onChange={e => setName(e.target.value)}
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
                    type="password"
                    placeholder="••••••••" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    maxLength={100}
                    className="pl-10 h-12 bg-slate-50 border-slate-100 focus:bg-white transition-all rounded-xl font-medium"
                    required
                  />
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
