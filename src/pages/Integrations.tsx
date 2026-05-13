import { Link } from "react-router-dom";
import { Plug, Zap, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function Integrations() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = onSnapshot(doc(db, "users", user.id), (snap) => {
      if (snap.exists()) {
        setIntegrations(snap.data()?.integrations || {});
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user?.id]);

  const toggleIntegration = async (key: string) => {
    if (!user?.id) return;
    const newValue = !integrations[key];
    try {
      await updateDoc(doc(db, "users", user.id), {
        [`integrations.${key}`]: newValue
      });
      toast.success(newValue ? `${key} connected!` : `${key} disconnected.`);
    } catch (e) {
      toast.error("Failed to update integration.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM & Integrations</h1>
          <p className="text-slate-500 mt-1">Connect your existing tools to automate lead flow.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* HubSpot Integration */}
        <div className={`bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col transition-all duration-300 ${integrations.hubspot ? 'ring-2 ring-orange-500 border-orange-200 shadow-orange-100 shadow-xl' : ''}`}>
          <div className="p-6 flex-grow">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                <Plug className="h-6 w-6" />
              </div>
              {integrations.hubspot && (
                <div className="bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">HubSpot</h2>
            <p className="text-slate-500 text-sm mb-4">Automatically sync new leads, contact details, and tour summaries to your HubSpot CRM.</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Contact creation
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Timeline events
              </div>
            </div>
          </div>
          <div className="p-4 border-t bg-slate-50 mt-auto">
            <button 
              onClick={() => toggleIntegration('hubspot')}
              className={`w-full font-bold py-2 px-4 rounded-lg border transition-all ${integrations.hubspot ? 'border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
            >
              {integrations.hubspot ? "Disconnect HubSpot" : "Connect HubSpot"}
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 flex-grow">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Zapier</h2>
            <p className="text-slate-500 text-sm mb-4">Connect Vertex with 5,000+ apps. Trigger workflows when new leads request an agent or when a conversation finishes.</p>
          </div>
          <div className="p-4 border-t bg-slate-50 mt-auto">
            <button className="w-full bg-white border border-slate-200 text-slate-700 font-medium py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors flex justify-center items-center gap-2">
              Configure Webhooks <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 flex-grow">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Plug className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Follow Up Boss</h2>
            <p className="text-slate-500 text-sm mb-4">Directly sync leads, conversation transcripts, and lead scores to FUB. (Requires Office Manager role)</p>
          </div>
          <div className="p-4 border-t bg-slate-50 mt-auto">
            <button className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
              Connect FUB
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
