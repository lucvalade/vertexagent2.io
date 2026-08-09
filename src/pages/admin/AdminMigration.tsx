import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminMigration() {
  const [migrating, setMigrating] = useState(false);

  const runMigration = async () => {
    setMigrating(true);
    try {
      // 1. Listings
      const listingsSnap = await getDocs(collection(db, 'listings'));
      for (const docSnap of listingsSnap.docs) {
        const data = docSnap.data();
        const update: any = {};
        if (!data.assigned_agent_id) update.assigned_agent_id = data.ownerId || "";
        if (data.team_id === undefined) update.team_id = "";
        if (data.brokerage_id === undefined) update.brokerage_id = "";
        if (Object.keys(update).length > 0) await updateDoc(docSnap.ref, update);
      }
      
      // 2. Leads
      const leadsSnap = await getDocs(collection(db, 'leads'));
      for (const docSnap of leadsSnap.docs) {
        const data = docSnap.data();
        const update: any = {};
        if (!data.contact_id) update.contact_id = docSnap.id;
        if (!data.lifecycle_stage) update.lifecycle_stage = "Lead";
        
        if (data.listingId) {
            const listingDoc = await getDoc(doc(db, 'listings', data.listingId));
            if (listingDoc.exists()) {
                const listingData = listingDoc.data()!;
                if (!data.assigned_agent_id) update.assigned_agent_id = listingData.assigned_agent_id || data.agentId || "";
                if (!data.team_id) update.team_id = listingData.team_id || "";
                if (!data.brokerage_id) update.brokerage_id = listingData.brokerage_id || "";
            }
        }
        
        if (Object.keys(update).length > 0) await updateDoc(docSnap.ref, update);
      }
      toast.success("Migration complete!");
    } catch (err) {
      console.error(err);
      toast.error("Migration failed");
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Admin Migration</h1>
      <Button onClick={runMigration} disabled={migrating}>
        {migrating ? "Migrating..." : "Run Relational Migration"}
      </Button>
    </div>
  );
}
