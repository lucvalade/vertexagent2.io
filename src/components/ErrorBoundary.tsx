import React, { Component, ErrorInfo, ReactNode } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled runtime crash caught by ErrorBoundary:", error, errorInfo);
    
    // Attempt to log the crash to Firestore system_logs
    try {
      addDoc(collection(db, "system_logs"), {
        type: "CRASH",
        message: `React Crash: ${error.message || "Unknown error"}`,
        timestamp: serverTimestamp(),
        createdAt: Date.now(),
        details: {
          name: error.name || "Error",
          message: error.message || "",
          stack: error.stack || "",
          componentStack: errorInfo.componentStack || "",
          userAgent: navigator.userAgent,
          location: window.location.href,
        },
        userEmail: "system_error_boundary",
      }).catch(err => {
        console.error("Failed to write crash log to Firestore:", err);
      });
    } catch (err) {
      console.error("Offline or inactive Firestore during crash capture:", err);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div id="crash-fallback" className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="h-16 w-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-500 animate-pulse">
              <AlertTriangle className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black italic tracking-tighter uppercase text-slate-100">
                Application Interruption
              </h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                The Sora automated real-estate core recovered from an unexpected state.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-4 text-left">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Error Signature</p>
              <p className="text-xs font-mono text-red-400 font-medium mt-1 select-all break-all leading-relaxed">
                {this.state.error?.name || "RangeError"}: {this.state.error?.message || "Format string contains an unescaped latin alphabet character"}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={this.handleReset}
                className="bg-blue-600 hover:bg-blue-500 font-bold w-full rounded-xl py-5 uppercase tracking-widest text-xs shadow-lg shadow-blue-500/10 gap-2 h-auto"
              >
                <RefreshCw className="h-4 w-4" /> Restart Session
              </Button>
              <Button
                variant="ghost"
                onClick={() => { window.location.href = "/"; }}
                className="text-slate-400 hover:text-white hover:bg-white/5 font-extrabold w-full py-3 text-xs uppercase tracking-wider gap-2 h-auto"
              >
                <Home className="h-4 w-4" /> Exit to Homepage
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
