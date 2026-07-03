import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Calendar, MapPin, CheckCircle, Clock, Send, Database, ExternalLink, Loader2, Save, Sparkles, Brain, Lightbulb, Target, Briefcase, GraduationCap, ShieldCheck, Scale, Link2, Linkedin, Users } from "lucide-react";
import { getLead, Lead, sendEmail, updateLead, getListing, routeLeadToCRM, generateLeadSummary } from "@/lib/api";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ProspectInsightReport from "@/components/ProspectInsightReport";

export default function LeadDetails() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(user?.email || "");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [notes, setNotes] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  useEffect(() => {
    if (leadId) {
      loadLead(leadId);
    }
  }, [leadId]);

  useEffect(() => {
    if (user?.email && !recipientEmail) {
      setRecipientEmail(user.email);
    }
  }, [user?.email]);

  async function loadLead(id: string) {
    try {
      const data = await getLead(id);
      setLead(data);
      if (data) {
        setNotes(data.notes || "");
        setIsVerified(!!data.verified);
      }
    } catch (err) {
      console.error("Error loading lead:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveWorkspace = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      await updateLead(lead.id, { notes, verified: isVerified });
      toast.success("Lead workspace updated");
    } catch (err) {
      toast.error("Failed to update workspace");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!lead) return;
    setGeneratingSummary(true);
    try {
      // First, get listing details for deep context
      const listing = await getListing(lead.listingId).catch(() => null);
      const summaryResult = await generateLeadSummary({
        leadName: lead.name,
        leadMessage: lead.message || "",
        listingAddress: lead.listingAddress,
        listingDescription: listing?.description || "",
        talkingPoints: listing?.talkingPoints || []
      });
      
      const updatedSummary = {
        ...summaryResult,
        generatedAt: Date.now()
      };

      // Save to Firebase
      await updateLead(lead.id, {
        conversationSummary: updatedSummary
      });

      // Reload lead
      await loadLead(lead.id);
      toast.success("AI Conversation Summary Generated", {
        description: "Expressed interests, questions, and high-intent indicators are now active."
      });
    } catch (err: any) {
      toast.error("Failed to generate summary", {
        description: err.message || "An unexpected error occurred."
      });
    } finally {
      setGeneratingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">Extracting Prospect Data...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8 text-center bg-white border rounded-xl">
        <p className="text-xl text-slate-500">Lead not found</p>
        <Button variant="link" onClick={() => navigate("/app/leads")}>Back to Leads</Button>
      </div>
    );
  }

  const handleEmailInfo = () => {
    setIsEmailDialogOpen(true);
  };

  const confirmSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingEmail(true);
    
    try {
      // Build lead details email with any available summary
      let summaryHtml = "";
      if (lead.conversationSummary) {
        summaryHtml = `
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <h2 style="color: #2563eb; font-size: 18px; margin-bottom: 12px; font-family: sans-serif;">Sora Conversation Summary</h2>
          <p style="font-weight: bold; color: #475569; font-size: 14px; margin-bottom: 6px;">Professional AI Analysis:</p>
          <p style="font-style: italic; color: #334155; background-color: #f1f5f9; padding: 12px 16px; border-left: 4px solid #2563eb; border-radius: 4px; margin-top: 0; line-height: 1.5; font-size: 14px; white-space: pre-wrap;">
            "${lead.conversationSummary.formattedSummary}"
          </p>
          
          <div style="margin-top: 16px;">
            <p style="font-weight: bold; margin-bottom: 6px; color: #1e3a8a; font-size: 14px;">🎯 Expressed Interests:</p>
            <ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.4;">
              ${lead.conversationSummary.expressedInterests.map(item => `<li>${item}</li>`).join('')}
            </ul>

            <p style="font-weight: bold; margin-bottom: 6px; color: #0f766e; font-size: 14px;">❓ Anticipated / Asked Questions:</p>
            <ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.4;">
              ${lead.conversationSummary.questionsAsked.map(item => `<li>${item}</li>`).join('')}
            </ul>

            <p style="font-weight: bold; margin-bottom: 6px; color: #b45309; font-size: 14px;">⚡ High-Intent Indicators:</p>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.4;">
              ${lead.conversationSummary.highIntentIndicators.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      await sendEmail({
        to: recipientEmail,
        subject: `Prospect Insight Report: ${lead.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
            <h1 style="color: #2563eb; font-size: 24px;">Prospect Insight Report</h1>
            <p>Here is the detailed information for the lead captured via AI Open House Connect.</p>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <h2 style="margin-top: 0; font-size: 18px; color: #1e293b;">Contact Details</h2>
              <p style="margin: 6px 0;"><strong>Name:</strong> ${lead.name}</p>
              <p style="margin: 6px 0;"><strong>Email:</strong> ${lead.email || "Not provided"}</p>
              <p style="margin: 6px 0;"><strong>Phone:</strong> ${lead.phone || "Not provided"}</p>
              
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              
              <h2 style="font-size: 18px; color: #1e293b; margin-top: 0;">Interaction History</h2>
              <p style="margin: 6px 0;"><strong>Property:</strong> ${lead.listingAddress}</p>
              <p style="margin: 6px 0;"><strong>Status:</strong> ${lead.status || 'New'}</p>
              <p style="margin: 6px 0;"><strong>Captured On:</strong> ${format(lead.createdAt, "PPP")}</p>
              
              ${summaryHtml}
            </div>
            
            <div style="margin-top: 24px; text-align: center; border-radius: 8px;">
              <a href="${window.location.origin}/app/leads/${lead.id}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">→ View Lead in Agent Portal</a>
            </div>

            <p style="font-size: 11px; color: #94a3b8; margin-top: 20px; text-align: center;">
              Generated by AI Open House Connect — Guided by Sora AI. Proprietary and Confidential.
            </p>
          </div>
        `,
        text: `Prospect Insight Report for ${lead.name}\n\nProperty: ${lead.listingAddress}\nStatus: ${lead.status || 'New'}\n\nAccess the Agent Portal to view this lead: ${window.location.origin}/app/leads/${lead.id}`
      });

      setSendingEmail(false);
      setIsEmailDialogOpen(false);
      toast.success(`Contact info for ${lead.name} sent to ${recipientEmail}`, {
        description: "The report has been delivered to your inbox."
      });
    } catch (error: any) {
      setSendingEmail(false);
      toast.error("Failed to send email", {
        description: error.message || "Please check your Secrets/SMTP configuration."
      });
    }
  };

  const handlePushCRM = async () => {
    if (!lead) return;
    setPushing(true);
    try {
      const listing = await getListing(lead.listingId);
      if (listing && listing.webhookUrl) {
        await routeLeadToCRM(listing, lead);
        toast.success("Successfully Pushed to CRM Webhook", {
          description: `Lead info and Sora Prospect Summary pushed to ${listing.webhookUrl}`
        });
      } else {
        toast.error("CRM Webhook Not Configured", {
          description: "This listing does not have a CRM webhook configured. You can set one up in the Listing Edit page.",
          action: {
            label: "Go to Listings",
            onClick: () => navigate("/app/listings")
          }
        });
      }
    } catch (err: any) {
      toast.error("Failed to push to CRM", {
        description: err.message || "An unexpected error occurred."
      });
    } finally {
      setPushing(false);
    }
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
          <Button variant="outline" size="sm" onClick={handleEmailInfo} className="gap-2 font-bold shadow-sm">
            <Send className="h-4 w-4" /> Email me Info
          </Button>
          <Button variant="secondary" size="sm" onClick={handlePushCRM} disabled={pushing} className="gap-2 font-bold shadow-sm relative group">
            <Database className="h-4 w-4" /> Push to CRM
          </Button>
        </div>
      </div>

      {/* Primary Comprehensive Prospect Insight Report View */}
      <div className="bg-slate-950 p-1 md:p-4 rounded-2xl border border-white/5 shadow-xl">
        <ProspectInsightReport
          lead={lead}
          onSaveNotes={async (notesText, tagsArray) => {
            setNotes(notesText);
            setLead(prev => prev ? {
              ...prev,
              notes: notesText,
              customAnswers: {
                ...(prev.customAnswers || {}),
                tags: tagsArray
              }
            } : null);
            try {
              await updateLead(lead.id, {
                notes: notesText,
                customAnswers: {
                  ...(lead.customAnswers || {}),
                  tags: tagsArray
                }
              });
              toast.success("Progress persisted successfully.");
            } catch (err) {
              console.error("Firestore sync error:", err);
            }
          }}
        />
      </div>

{/* Shared Listing Cross-Hosting Panel */}
      {lead.isShared && (
        <div className="bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-200 rounded-xl p-6 shadow-sm text-left">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Cross-Hosted / Shared Property Assignment Details
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            This lead was captured during a Cross-Hosted Open House event. Specific permissions, ownership, and lender consent properties are listed below:
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-3 bg-white rounded-lg border border-slate-150 shadow-xs">
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Listing Owner ID</div>
              <div className="font-mono font-semibold text-slate-800 text-xs truncate" title={lead.listingOwnerAgentId}>{lead.listingOwnerAgentId || "Listing Owner"}</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-150 shadow-xs">
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Device Captured By</div>
              <div className="font-mono font-semibold text-slate-800 text-xs truncate" title={lead.capturedByAgentId}>{lead.capturedByAgentId || "Hosting Agent"}</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-150 shadow-xs">
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Lead Visibility Rule</div>
              <div className="font-semibold text-amber-700 text-xs capitalize">{lead.leadVisibility?.replace("_", " ") || "Host Receives"}</div>
            </div>
          </div>
        </div>
      )}


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
                {sendingEmail ? "Sending..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
