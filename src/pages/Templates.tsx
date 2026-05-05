 import { Plus, LayoutTemplate, FileText, Settings, Copy, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([
    { id: "1", name: "High-End Luxury Default", defaultTone: "Professional & Elegant", defaultGate: "3 rooms", languages: ["EN", "FR", "ZH"] },
    { id: "2", name: "Suburban Family Home", defaultTone: "Warm & Welcoming", defaultGate: "2 rooms", languages: ["EN", "ES"] },
    { id: "3", name: "Investor Quick-Pitch", defaultTone: "Direct & Financial", defaultGate: "Immediate", languages: ["EN"] },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = () => {
    if (!newName) {
      toast.error("Template name is required");
      return;
    }
    const newTmpl = {
      id: Date.now().toString(),
      name: newName,
      defaultTone: "Professional",
      defaultGate: "2 rooms",
      languages: ["EN"]
    };
    setTemplates(prev => [...prev, newTmpl]);
    setIsModalOpen(false);
    setNewName("");
    toast.success("New template created");
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success("Template deleted");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brokerage Templates</h1>
          <p className="text-slate-500 mt-1">Configure default settings, voices, and lead gates for your team.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white gap-2 font-bold shadow-lg shadow-blue-100">
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tmpl) => (
          <div key={tmpl.id} className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
            <div className="p-6 border-b flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <LayoutTemplate className="h-6 w-6 text-blue-600" />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  } />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/app/templates/${tmpl.id}/edit`)}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit Template
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                        const copy = { ...tmpl, id: Date.now().toString(), name: `${tmpl.name} (Copy)` };
                        setTemplates(prev => [...prev, copy]);
                        toast.success("Template duplicated");
                    }}>
                      <Copy className="h-4 w-4 mr-2" /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(tmpl.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{tmpl.name}</h3>
              <p className="text-sm text-slate-500 mb-4">Pre-configured settings optimized for this property type.</p>
              
              <div className="space-y-2 mt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tone</span>
                  <span className="font-medium text-slate-700">{tmpl.defaultTone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lead Gate</span>
                  <span className="font-medium text-slate-700">{tmpl.defaultGate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Languages</span>
                  <span className="font-medium text-slate-700">{tmpl.languages.join(", ")}</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
              <Link to={`/app/templates/${tmpl.id}/edit`} className="text-sm font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1.5">
                <Settings className="h-4 w-4" /> Configure
              </Link>
              <button 
                className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600"
                onClick={() => toast.info("Template set as organization default")}
              >
                Set Default
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Name your template. You can configure the details after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">Template Name</Label>
              <Input 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Modern Condos, Rural Farms"
                className="h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-500 font-bold px-8">
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
