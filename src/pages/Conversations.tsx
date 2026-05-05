import { MessageSquare, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const DUMMY_CONVOS = [
  { id: "1", property: "888 Bel Air Rd, Los Angeles", lang: "English", duration: "4m 12s", qs: 8, date: Date.now() - 1000 * 60 * 30 },
  { id: "2", property: "15 Central Park West, NY", lang: "Spanish", duration: "1m 45s", qs: 2, date: Date.now() - 1000 * 60 * 60 * 2 },
  { id: "3", property: "123 VertexAgent Lane", lang: "French", duration: "6m 30s", qs: 15, date: Date.now() - 1000 * 60 * 60 * 5 },
  { id: "4", property: "888 Bel Air Rd, Los Angeles", lang: "English", duration: "2m 10s", qs: 4, date: Date.now() - 1000 * 60 * 60 * 24 },
  { id: "5", property: "15 Central Park West, NY", lang: "German", duration: "8m 55s", qs: 22, date: Date.now() - 1000 * 60 * 60 * 48 },
];

export default function Conversations() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Tours & Conversations</h1>
          <p className="text-slate-500 mt-1">Review recent interactions and AI conversation transcripts.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {DUMMY_CONVOS.map((convo) => (
          <div key={convo.id} className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-colors cursor-pointer">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  {convo.property}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {convo.qs} Questions Prompted
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {convo.duration}
                  </div>
                  <div className="bg-slate-100 px-2 rounded-md font-medium text-slate-700">
                    {convo.lang}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">{format(convo.date, "MMM d, h:mm a")}</p>
                <Link to={`/app/conversations/${convo.id}`} className="text-blue-600 text-sm font-medium hover:underline mt-1 inline-block">View Transcript →</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
