import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function BrokerageSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    name: "Vertex Agent Group",
    logo: "",
    themeColor: "#2563eb",
    complianceFooter: "© 2026 Vertex Agent. All rights reserved.",
  });

  useEffect(() => {
    if (!user?.brokerage) return;

    const fetchSettings = async () => {
      const docRef = doc(db, "brokerages", user.brokerage);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data() as any);
      }
      setLoading(false);
    };

    fetchSettings();
  }, [user?.brokerage]);

  const handleSave = async () => {
    if (!user?.brokerage) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "brokerages", user.brokerage), settings, { merge: true });
      toast.success("Brokerage settings updated.");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Brokerage Admin Settings</h1>
      
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div className="grid gap-2">
          <label className="font-medium text-sm">Brokerage Name</label>
          <Input value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} />
        </div>
        <div className="grid gap-2">
          <label className="font-medium text-sm">Brand Theme Color</label>
          <Input type="color" value={settings.themeColor} onChange={e => setSettings({...settings, themeColor: e.target.value})} className="h-10" />
        </div>
        <div className="grid gap-2">
          <label className="font-medium text-sm">Official Legal Footer (Cascades to all team listings)</label>
          <Input value={settings.complianceFooter} onChange={e => setSettings({...settings, complianceFooter: e.target.value})} />
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
