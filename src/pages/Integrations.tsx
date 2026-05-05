import { Link } from "react-router-dom";
import { Plug, Zap, CheckCircle2, ArrowRight } from "lucide-react";

export default function Integrations() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM & Integrations</h1>
          <p className="text-slate-500 mt-1">Connect your existing tools to automate lead flow.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 flex-grow">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Zapier</h2>
            <p className="text-slate-500 text-sm mb-4">Connect Vertex with 5,000+ apps. Trigger workflows when new leads request an agent or when a conversation finishes.</p>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Webhook support
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> API Access
            </div>
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

        <div className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 flex-grow">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <Plug className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Salesforce</h2>
            <p className="text-slate-500 text-sm mb-4">Enterprise sync for brokerage accounts. Auto-create Opportunities and Tasks when high-intent leads are intercepted.</p>
          </div>
          <div className="p-4 border-t bg-slate-50 mt-auto">
            <button className="w-full bg-white border border-slate-200 text-slate-400 font-medium py-2 rounded-lg text-sm cursor-not-allowed">
              Enterprise Plan Required
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
