import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Listing, createLead } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TourGateProps {
  listing: Listing | null;
  agent: any | null;
  onSuccess: () => void;
}

export default function TourGate({ listing, agent, onSuccess }: TourGateProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      const p1 = match[1] ? `(${match[1]}` : "";
      const p2 = match[2] ? `) ${match[2]}` : "";
      const p3 = match[3] ? `-${match[3]}` : "";
      return `${p1}${p2}${p3}`;
    }
    return value;
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setErrors({ form: "Please complete required fields to enter." });
      return;
    }

    if (!formData.email.includes("@")) {
      setErrors({ email: "Invalid email format." });
      return;
    }

    setSubmitting(true);
    try {
      await createLead(listing?.id || "unknown", {
        id: crypto.randomUUID(),
        listingId: listing?.id || "unknown",
        listingAddress: listing?.address || "",
        agentId: "",
        name: `${capitalize(formData.firstName)} ${capitalize(formData.lastName)}`,
        email: formData.email,
        phone: formData.phone,
        createdAt: Date.now(),
      });
      
      // Persist session
      localStorage.setItem(`checked_in_tour_${listing?.id}`, "true");
      localStorage.setItem("visitor_email", formData.email);
      localStorage.setItem("visitor_name", `${capitalize(formData.firstName)} ${capitalize(formData.lastName)}`);

      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Failed to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl animate-fade-in text-slate-100">
        <div className="text-center mb-6">
          {agent?.photoUrl && (
            <img src={agent.photoUrl} alt={agent.name} className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-blue-500" />
          )}
          <h2 className="text-xl font-bold mb-2">Welcome to {listing?.address || "this property"}</h2>
          <p className="text-sm text-slate-400">
            Please sign in to access the interactive property tour, view photos, and ask questions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="firstName">First Name <span className="text-red-500">*</span> <span className="text-[10px] text-slate-500">(mandatory)</span></Label>
              <Input id="firstName" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} onBlur={e => setFormData({...formData, firstName: capitalize(e.target.value)})} required className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span> <span className="text-[10px] text-slate-500">(mandatory)</span></Label>
              <Input id="lastName" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} onBlur={e => setFormData({...formData, lastName: capitalize(e.target.value)})} required className="bg-slate-800 border-slate-700" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email <span className="text-red-500">*</span> <span className="text-[10px] text-slate-500">(mandatory)</span></Label>
            <Input 
              id="email" 
              type="email" 
              value={formData.email} 
              onChange={e => {
                setFormData({...formData, email: e.target.value});
                if (errors.email) setErrors(prev => { const { email, ...rest } = prev; return rest; });
              }}
              onBlur={e => {
                let value = e.target.value;
                if (value && !value.includes("@")) {
                  const domains = ["gmail.com", "cogeco.ca", "sympatico.ca", "outlook.com", "hotmail.com", "yahoo.com"];
                  const foundDomain = domains.find(d => value.toLowerCase().endsWith(d));

                  if (foundDomain) {
                    value = value.slice(0, -foundDomain.length) + "@" + foundDomain;
                  } else {
                    value = value + "@";
                  }
                  setFormData(prev => ({ ...prev, email: value }));
                }

                if (!value.includes("@")) {
                  setErrors(prev => ({ ...prev, email: "Invalid email format." }));
                } else {
                  setErrors(prev => { const { email, ...rest } = prev; return rest; });
                }
              }}
              required 
              className="bg-slate-800 border-slate-700" 
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Phone <span className="text-red-500">*</span> <span className="text-[10px] text-slate-500">(mandatory)</span></Label>
            <Input id="phone" type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: formatPhoneNumber(e.target.value)})} required className="bg-slate-800 border-slate-700" />
          </div>
          
          {errors.form && <p className="text-red-400 text-sm">{errors.form}</p>}
          {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Unlock Tour"}
          </Button>
        </form>
      </div>
    </div>
  );
}
