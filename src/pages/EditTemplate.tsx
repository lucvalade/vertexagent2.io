import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

export default function EditTemplate() {
  const { templateId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Template</h1>
            <p className="text-slate-500 mt-1">Configure default settings for this property type.</p>
          </div>
        </div>
        <button onClick={() => navigate(-1)} className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-blue-700">
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Template Name</label>
          <input type="text" className="w-full px-3 py-2 border rounded-md text-sm" defaultValue={templateId === 'new' ? '' : 'High-End Luxury Default'} />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Default Tone</label>
            <select className="w-full px-3 py-2 border rounded-md text-sm bg-white">
              <option>Professional & Elegant</option>
              <option>Warm & Welcoming</option>
              <option>Direct & Financial</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Lead Gate Threshold</label>
            <select className="w-full px-3 py-2 border rounded-md text-sm bg-white">
              <option>Immediate (Hard gate)</option>
              <option>2 rooms</option>
              <option>3 rooms</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5 border-t pt-6">
          <label className="text-sm font-medium text-slate-700 block mb-2">Supported Languages</label>
          <div className="flex flex-wrap gap-3">
            {['English', 'Spanish', 'French', 'Mandarin'].map(lang => (
              <label key={lang} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="rounded border-slate-300 text-blue-600" defaultChecked={lang === 'English'} />
                {lang}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
