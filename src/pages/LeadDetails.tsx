import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Calendar, MapPin, CheckCircle, Clock, Send, Database, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DUMMY_LEADS: Record<string, any> = {
  "1": { id: "1", name: "Eleanor Rigby", property: "888 Bel Air Rd, Los Angeles", phone: "+1 (555) 123-4567", email: "eleanor@example.com", date: Date.now() - 1000 * 60 * 60 * 2, status: "Hot", notes: "Very interested in the ocean views. Calling back 3pm tomorrow.", lastPushed: null },
  "2": { id: "2", name: "Jude Lawson", property: "15 Central Park West, NY", phone: "+1 (555) 987-6543", email: "jude.l@example.com", date: Date.now() - 1000 * 60 * 60 * 24, status: "Warm", notes: "Wants to know about parking.", lastPushed: Date.now() - 1000 * 60 * 60 * 48 },
  "3": { id: "3", name: "Penny Lane", property: "123 VertexAgent Lane", phone: "+1 (555) 456-7890", email: "penny@example.com", date: Date.now() - 1000 * 60 * 60 * 48, status: "Cold", notes: "Bought another property.", lastPushed: null },
  "4": { id: "4", name: "Maxwell Edison", property: "888 Bel Air Rd, Los Angeles", phone: "+1 (555) 321-0987", email: "maxwell@example.com", date: Date.now() - 1000 * 60 * 60 * 72, status: "New", notes: "Looking for investment properties.", lastPushed: Date.now() - 1000 * 60 * 10 },
};

export default function LeadDetails() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const lead = DUMMY_LEADS[leadId || "1"];
  const [pushing, setPushing] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(user?.email || "agent@example.com");
  const [sendingEmail, setSendingEmail] = useState(false);

  if (!lead) {
    return <div className="p-8">Lead not found</div>;
  }

  const handleEmailInfo = () => {
    setIsEmailDialogOpen(true);
  };

  const confirmSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setSendingEmail(true);
    
    // Simulate API call
    setTimeout(() => {
      setSendingEmail(false);
      setIsEmailDialogOpen(false);
      toast.success(`Contact info for ${lead.name} sent to ${recipientEmail}`, {
        description: "Includes contact details and interaction history."
      });
    }, 1200);
  };

  const handlePushCRM = () => {
    // Mock check for CRM integration
    // In a real app, we'd check if listing.webhookUrl or global CRM config exists
    const hasCRM = false; // Mocking "not set up" for now as per user request to show notice

    if (!hasCRM) {
      toast.error("CRM Integration Not Set Up", {
        description: "Please configure a CRM webhook in Listing Settings or Integrations page first.",
        action: {
          label: "Fix Now",
          onClick: () => navigate("/app/integrations")
        }
      });
      return;
    }

    setPushing(true);
    setTimeout(() => {
      setPushing(false);
      toast.success("Lead successfully exported to CRM");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{lead.name}</h1>
            <p className="text-slate-500 text-sm">Lead information & Prospecting data</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {lead.lastPushed && (
            <div className="hidden md:flex flex-col items-end mr-2 text-right">
              <span className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1 justify-end">
                <CheckCircle className="h-2.5 w-2.5" /> Synced to CRM
              </span>
              <span className="text-[10px] text-slate-400">Last: {format(lead.lastPushed, "MMM d, p")}</span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleEmailInfo} className="gap-2 font-bold shadow-sm">
            <Send className="h-4 w-4" /> Email me Info
          </Button>
          <Button variant="secondary" size="sm" onClick={handlePushCRM} disabled={pushing} className="gap-2 font-bold shadow-sm relative group">
            <Database className="h-4 w-4" /> Push to CRM
            {pushing && (
              <div className="absolute inset-0 bg-slate-100 flex items-center justify-center rounded-md">
                <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Contact Details</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-slate-400" />
              <div>
                <div className="text-sm text-slate-500">Phone</div>
                <a href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`} className="font-medium text-blue-600 hover:underline">{lead.phone}</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-slate-400" />
              <div>
                <div className="text-sm text-slate-500">Email</div>
                <a href={`mailto:${lead.email}`} className="font-medium text-blue-600 hover:underline">{lead.email}</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-slate-400" />
              <div>
                <div className="text-sm text-slate-500">Status</div>
                <span className={`px-2.5 py-0.5 mt-1 inline-block rounded-full text-xs font-semibold
                    ${lead.status === 'Hot' ? 'bg-red-100 text-red-700' : ''}
                    ${lead.status === 'Warm' ? 'bg-orange-100 text-orange-700' : ''}
                    ${lead.status === 'Cold' ? 'bg-blue-100 text-blue-700' : ''}
                    ${lead.status === 'New' ? 'bg-green-100 text-green-700' : ''}
                  `}>
                  {lead.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Interaction History</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-slate-400" />
              <div>
                <div className="text-sm text-slate-500">Interested Property</div>
                <div className="font-medium">{lead.property}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-slate-400" />
              <div>
                <div className="text-sm text-slate-500">Captured On</div>
                <div className="font-medium">{format(lead.date, "PPP 'at' p")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Notes</h2>
        <div className="p-4 bg-slate-50 rounded-lg text-slate-700">
          {lead.notes}
        </div>
      </div>

      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email Prospect Report</DialogTitle>
            <DialogDescription>
              Confirm or edit the email address where the detailed report for {lead.name} should be sent.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={confirmSendEmail} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-slate-700">Recipient Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={recipientEmail} 
                onChange={(e) => setRecipientEmail(e.target.value)} 
                required 
                placeholder="your@email.com"
                className="h-11"
              />
              <p className="text-[10px] text-slate-400">This will be used for this specific export only.</p>
            </div>
            <DialogFooter className="sm:justify-end gap-2 border-t pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsEmailDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={sendingEmail} className="bg-blue-600 hover:bg-blue-500 font-bold px-8">
                {sendingEmail ? "Generating..." : "Submit & Send"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
