import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, addDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WaitlistSignup {
  id: string;
  email: string;
  name?: string;
  createdAt: any;
}

export default function WaitlistAdminPage() {
  const [signups, setSignups] = useState<WaitlistSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSignup, setSelectedSignup] = useState<WaitlistSignup | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchSignups = async () => {
    try {
      const q = query(collection(db, "waitlist_signups"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WaitlistSignup[];
      setSignups(data);
    } catch (error) {
      console.error("Error fetching waitlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignups();
  }, []);

  const seedDummyData = async () => {
    try {
      const collectionRef = collection(db, "waitlist_signups");
      await addDoc(collectionRef, { name: "John Doe", email: "john@example.com", createdAt: new Date() });
      await addDoc(collectionRef, { name: "Jane Smith", email: "jane@example.com", createdAt: new Date() });
      await fetchSignups();
    } catch (error) {
      console.error("Error seeding data:", error);
    }
  };

  const filteredSignups = signups.filter(s => {
    const matchesMonth = filterMonth
      ? s.createdAt?.toDate && format(s.createdAt.toDate(), "yyyy-MM") === filterMonth
      : true;
    const matchesSearch = searchTerm
      ? (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         s.email.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    return matchesMonth && matchesSearch;
  });

  const totalSignups = signups.length;
  const currentMonth = format(new Date(), "yyyy-MM");
  const signupsThisMonth = signups.filter(s => s.createdAt?.toDate && format(s.createdAt.toDate(), "yyyy-MM") === currentMonth).length;
  const pendingApprovals = 0; // Placeholder

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Waitlist Management</h1>
        <div className="flex gap-2">
          <Button onClick={seedDummyData} variant="outline">Seed Dummy Data</Button>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded p-2"
          />
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="border rounded p-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Total Signups</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{totalSignups}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Signups This Month</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{signupsThisMonth}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pending Approvals</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{pendingApprovals}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Signups ({filteredSignups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading signups...</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-3 bg-slate-100 font-bold p-3 border-b">
                <div>Name</div>
                <div>Email</div>
                <div>Timestamp</div>
              </div>
              {filteredSignups.map((signup) => (
                <div 
                  key={signup.id} 
                  className="grid grid-cols-3 p-3 border-b last:border-0 hover:bg-slate-50 cursor-pointer"
                  onClick={() => { setSelectedSignup(signup); setIsDetailOpen(true); }}
                >
                  <div>{signup.name || "N/A"}</div>
                  <div>{signup.email}</div>
                  <div>
                    {signup.createdAt?.toDate 
                      ? format(signup.createdAt.toDate(), "yyyy-MM-dd HH:mm:ss")
                      : "N/A"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signup Details</DialogTitle>
          </DialogHeader>
          {selectedSignup && (
            <div className="space-y-4 pt-4">
              <div><span className="font-bold">ID:</span> {selectedSignup.id}</div>
              <div><span className="font-bold">Name:</span> {selectedSignup.name || "N/A"}</div>
              <div><span className="font-bold">Email:</span> {selectedSignup.email}</div>
              <div><span className="font-bold">Created At:</span> {selectedSignup.createdAt?.toDate ? format(selectedSignup.createdAt.toDate(), "yyyy-MM-dd HH:mm:ss") : "N/A"}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
