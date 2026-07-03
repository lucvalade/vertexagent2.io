import { MessageSquare, Clock, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const DUMMY_CONVOS = [
  { id: "1", property: "888 Bel Air Rd, Los Angeles", lang: "English", duration: "4m 12s", qs: 8, date: 1746906300000 },
  { id: "2", property: "15 Central Park West, NY", lang: "Spanish", duration: "1m 45s", qs: 2, date: Date.now() - 1000 * 60 * 60 * 2 },
  { id: "3", property: "123 Open House Lane", lang: "French", duration: "6m 30s", qs: 15, date: Date.now() - 1000 * 60 * 60 * 5 },
  { id: "4", property: "888 Bel Air Rd, Los Angeles", lang: "English", duration: "2m 10s", qs: 4, date: Date.now() - 1000 * 60 * 60 * 24 },
  { id: "5", property: "15 Central Park West, NY", lang: "German", duration: "8m 55s", qs: 22, date: Date.now() - 1000 * 60 * 60 * 48 },
];

export default function Conversations() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "conversations"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (docs.length === 0) {
        setConversations(DUMMY_CONVOS);
      } else {
        setConversations(docs);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching conversations:", error);
      setConversations(DUMMY_CONVOS);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Tours & Conversations</h1>
          <p className="text-slate-500 mt-1">Review recent interactions and AI conversation transcripts.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Neural Records...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {conversations.map((convo) => (
            <div 
              key={convo.id} 
              className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
              onClick={() => navigate(`/app/conversations/${convo.id}`)}
            >
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    {convo.property}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {convo.qs || 0} Questions Prompted
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {convo.duration || "0m"}
                    </div>
                    <div className="bg-slate-100 px-2 rounded-md font-bold text-slate-700">
                      {convo.lang}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{format(new Date(convo.date), "MMM d, h:mm a")}</p>
                  <div className="text-blue-600 text-sm font-black uppercase tracking-wider mt-2 flex items-center gap-1 justify-end">
                    View Transcript <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
