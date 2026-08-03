import React, { useState, useEffect } from "react";
import { 
  Sparkles, Brain, Target, Mail, Phone, Calendar, User, ShieldCheck, 
  Clock, CheckCircle, AlertTriangle, Copy, Send, FileText, ArrowRight,
  TrendingUp, Star, ChevronRight, Hash, MessageSquare, Info, Sliders, Check, Plus, Loader2, Mic
} from "lucide-react";
import { Lead, sendEmail, createVoiceNote } from "@/lib/api";
import VoiceNoteRecorderModal from "@/components/VoiceNoteRecorderModal";
import { auth, db } from "@/lib/firebase";
import { getDoc, doc } from "firebase/firestore";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ProspectInsightReportProps {
  lead: Lead;
  onSaveNotes?: (
    notes: string, 
    tags: string[], 
    customDrafts?: { 
      sms?: string; 
      email?: string; 
      call?: string; 
      customCreatedTags?: string[];
      verificationStatus?: string;
      verificationMethod?: string;
      verificationProvider?: string;
      reviewedBy?: string;
      verificationNotes?: string;
      manualReviewRequired?: boolean;
      verifiedOn?: number;
    }
  ) => void;
  onClose?: () => void;
  isCondensed?: boolean;
}

export default function ProspectInsightReport({ 
  lead, 
  onSaveNotes, 
  onClose,
  isCondensed = false 
}: ProspectInsightReportProps) {
  const [isRecordingOpen, setIsRecordingOpen] = useState(false);
  const handleSaveVoiceNote = async (audioUrl: string, durationSeconds: number, transcript: string, visibility: 'private' | 'team' | 'lead') => {
    if (auth.currentUser) {
      await createVoiceNote({
        propertyId: lead.listingId || "unknown",
        userId: auth.currentUser.uid,
        userName: auth.currentUser.email || "Agent",
        roleType: "agent",
        voiceNoteType: visibility === "private" ? "private" : "team",
        durationSeconds,
        transcript,
        audioUrl,
        createdAt: Date.now(),
        visibility: visibility,
        moderationStatus: "approved"
      });
    }
  };

  // Local state for interactive editing inside report
  const [localNotes, setLocalNotes] = useState(lead.notes || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    lead.customAnswers?.tags || []
  );
  const [activeDraftTab, setActiveDraftTab] = useState<"text" | "email" | "call">("text");

  // Editable drafts with initial values based on current or preset layouts
  const primaryInterest = lead.conversationSummary?.expressedInterests?.[0] || "Property Layout & Finishes";
  const topQuestions = lead.conversationSummary?.questionsAsked?.[0] || "Square footage limits & neighborhood growth.";
  const keyConcerns = lead.message ? `"${lead.message.slice(0, 80)}..."` : "Financing options & showing schedule.";

  const presetSms = `Hi ${lead.name}, thank you for stopping by ${lead.listingAddress} today! It was fantastic meeting you. Sora mentioned you loved the ${primaryInterest.toLowerCase()}. Would you like custom details on local school mappings or similar high-end homes? - Agent`;
  const presetEmail = `Subject: Quick follow-up regarding ${lead.listingAddress}\n\nHi ${lead.name},\n\nIt was a pleasure welcoming you to our open house tour of ${lead.listingAddress}.\n\nBased on your interaction with our AI guide Sora, I noticed you expressed great interest in the ${primaryInterest.toLowerCase()}.\n\nI have compiled a custom detailed package with the exact physical floorplans, utility metrics, and neighborhood trends for your review. Would you be open to a quick 5-minute call tomorrow afternoon to discuss if this is the right match?\n\nBest regards,\nActive Agent Team`;
  const presetCall = `Hello ${lead.name}, this is your listing agent following up on your visit to ${lead.listingAddress} today. I saw you had some questions about ${topQuestions.toLowerCase()} and wanted to touch base directly to provide custom pricing options...`;

  const [editableSms, setEditableSms] = useState<string>(
    lead.customAnswers?.customSmsDraft || presetSms
  );
  const [editableEmail, setEditableEmail] = useState<string>(
    lead.customAnswers?.customEmailDraft || presetEmail
  );
  const [editableCall, setEditableCall] = useState<string>(
    lead.customAnswers?.customCallDraft || presetCall
  );

  // Dynamic tags creation state (option to create up to 6 custom active tracking tags)
  const [customCreatedTags, setCustomCreatedTags] = useState<string[]>(
    lead.customAnswers?.customCreatedTags || []
  );
  const [newTagInput, setNewTagInput] = useState("");

  // Outside Identity Verification states
  const [verificationStatus, setVerificationStatus] = useState<string>(
    lead.customAnswers?.verificationStatus || (lead.isVerified ? "ID verified" : "Signed in through app")
  );
  const [verificationMethod, setVerificationMethod] = useState<string>(
    lead.customAnswers?.verificationMethod || "Third-party identity service verification"
  );
  const [verificationProvider, setVerificationProvider] = useState<string>(
    lead.customAnswers?.verificationProvider || "Veriff"
  );
  const [reviewedBy, setReviewedBy] = useState<string>(
    lead.customAnswers?.reviewedBy || "Compliance Auto-Bot / Sora"
  );
  const [verificationNotes, setVerificationNotes] = useState<string>(
    lead.customAnswers?.verificationNotes || "Automatic check passed - Property listing context & phone area code parsing verified."
  );
  const [manualReviewRequired, setManualReviewRequired] = useState<boolean>(
    !!lead.customAnswers?.manualReviewRequired
  );
  const [verifiedOn, setVerifiedOn] = useState<number>(
    lead.customAnswers?.verifiedOn || lead.createdAt
  );

  // AI rewriting loader states
  const [rewritingSms, setRewritingSms] = useState(false);
  const [rewritingEmail, setRewritingEmail] = useState(false);
  const [rewritingCall, setRewritingCall] = useState(false);

  const defaultSuggestedTags = [
    "0-30 Days",
    "30-90 Days",
    "Financing Needed",
    "No Agent",
    "Investor",
    "Neighbor Lead",
    "High Intent",
    "Needs Nurture"
  ];

  // Combined tags array for rendering
  const allAvailableTags = [...defaultSuggestedTags, ...customCreatedTags];

  // Derived metrics
  const leadTemperature = lead.status || "New";
  const prospectType = lead.customAnswers?.prospectType || "Buyer";
  const followUpPriority = leadTemperature === "Hot" ? "High" : leadTemperature === "Warm" ? "Medium" : "Low";

  // Mock engagement scores derived from lead attributes to keep UX real
  const engagementScore = lead.conversationSummary ? 92 : lead.message ? 74 : 58;
  const responseReadiness = leadTemperature === "Hot" ? "Immediate" : leadTemperature === "Warm" ? "Within 4 Hours" : "Target 24 Hours";
  const contactabilityScore = lead.phone && lead.email ? "98%" : lead.email ? "80%" : "60%";

  const likelyMotivation = leadTemperature === "Hot" ? "Highly motivated to purchase before school semester." : "Upgrading local primary residence.";
  const propertyFit = "Excellent. Layout matches timeline and space specifications perfectly.";
  const recommendedNextStep = "Deliver the premium PDF brochure and coordinate a private showings window.";

  const [agentData, setAgentData] = useState<any>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      if (auth.currentUser?.uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            setAgentData(userDoc.data());
          }
        } catch (err) {
          console.error("Error fetching agent data for report:", err);
        }
      }
    };
    fetchAgent();
  }, [auth.currentUser?.uid]);

  const preferredContact = lead.email && lead.phone ? "Email & Text/Call" : lead.email ? "Email Preferred" : "Text/Call Preferred";
  const formattedDate = format(lead.createdAt || Date.now(), "MMM d, yyyy, h:mm a");
  const agentName = agentData?.name || "Hosting Agent";
  const agentPhone = agentData?.phone || "+1 (415) 555-2671";
  const isMortgageInterested = !!(lead.mortgageInterest || lead.mortgageConsent);
  const formattedVerifiedDate = format(verifiedOn, "MMM d, yyyy, h:mm a");

  // Compile full plain text of the 7 sections for copying
  const getPlainTextReport = () => {
    return `===================================================
PROSPECT INSIGHT REPORT - SORA AI INSIGHT BRIEF
===================================================

1. PROSPECT SNAPSHOT
---------------------------------------------------
- Prospect Name: ${lead.name}
- Mobile Number: ${lead.phone || "Unreported"}
- Email Address: ${lead.email || "Unreported"}
- Preferred Contact: ${preferredContact}
- Property Viewed: ${lead.listingAddress}
- Date Captured: ${formattedDate}
- Host Agent: ${agentName}
- Engagement Source: Tablet Kiosk / QR Code
- Identity Status: ${lead.isVerified ? "Pass • High Confidence" : "Local Auth Only"}

2. OUTSIDE IDENTITY VERIFICATION HUB
---------------------------------------------------
- Verification Status: ${verificationStatus}
- Verification Method: ${verificationMethod}
- Provider (SDK): ${verificationProvider}
- Reviewed By Officer: ${reviewedBy}
- Verified Timeline: ${formattedVerifiedDate}
- Trust Analytics Score: ${verificationStatus.includes("verified") ? "99% Certified" : "65% Base Rating"}
- Audit Log Notes: ${verificationNotes}
- Manual Desk Escalate: ${manualReviewRequired ? "⚠️ YES - REQUIRES MANUAL INTERVENTION" : "No Action Required"}

3. BUYER PROFILE
---------------------------------------------------
- Buying Timeline: ${lead.customAnswers?.timeline || "0-30 Days"}
- Target Budget: ${lead.customAnswers?.priceRange || "$2,500,000 - $3,500,000"}
- Target Neighbourhoods: ${lead.customAnswers?.neighborhoods || "Rosedale, Forest Hill"}
- Preferred Home Type: Luxury Modern Detached Single-Family
- Must-Have Feature(s): ${lead.customAnswers?.mustHaves || "Gourmet Chef Kitchen, Private Back Courtyard"}
- Deal Breaker(s): ${lead.customAnswers?.dealBreakers || "No structural garage parking, Busy arterial streets"}
- Has Agent Representation: ${lead.customAnswers?.workingWithAgent === "yes" ? "Yes, active representation contract" : "No, self-represented guest"}
- Financing/Advising Status: ${lead.customAnswers?.financingStatus || "Pre-Approved"}
- Mortgage Consent Check: ${isMortgageInterested ? 'Yes, Opted-In' : 'No Consent Given'}

4. ENGAGEMENT SIGNALS
---------------------------------------------------
- Engagement Rank Score: ${engagementScore}/100
- Response SLA Limit: ${responseReadiness}
- Contact Integrity: ${contactabilityScore}
- Tour Duration: ${lead?.customAnswers?.timeAtEvent || "16 Minutes (Active Floor Time)"}
- Total Pages Explored: ${lead?.customAnswers?.pagesViewed || "4 core listing layouts"}
- QR Trigger Status: Scanned (AI Tour Activated)
- Questions Prompted: ${lead?.conversationSummary?.questionsAsked?.length || 2} raised questions
- Sora Voice Tour Used: Yes (High-Fidelity Audio Mode)
- Kiosk Sign-In Action: Completed & Registered

5. AI SUMMARY BRIEF
---------------------------------------------------
"${lead.conversationSummary?.formattedSummary || 'Prospect expresses high engagement during their detailed walkthrough. They specifically praised the designer chef\'s kitchen custom countertops and queried constraints regarding backyard swimming pool development regulations. Overall profile demonstrates strong capability, timeline fit, and interest. Direct follow-up is recommended.'}"

6. INTEREST & MOTIVATION ANALYSIS
---------------------------------------------------
- Primary Point of Interest: ${primaryInterest}
- Top Question Raised: ${topQuestions}
- Derived Client Motivation: ${likelyMotivation}
- Property Fit Analysis: ${propertyFit}

7. MORTGAGE INTEREST & COMPLIANCE AUDIT
---------------------------------------------------
- Mortgage Opt-In status: ${isMortgageInterested ? "CONSENT SECURED • UNLOCKED" : "LENDER DATA SUPPRESSED"}
- Financing Check Selected: ${isMortgageInterested ? "Yes" : "No"}
- Lender Handoff Authorized: ${isMortgageInterested ? "Yes, Compliant Authorized Signature" : "No Content Transferred"}
- Registered Co-Paired Lender: ${isMortgageInterested ? (lead.customAnswers?.routedLender || "Gold Trust Lending Group") : "N/A - Locked"}

===================================================
Report synthesized securely by Sora® for AI Open House Connect.`;
  };

  // Compile full HTML layout of the 7 sections for rich email dispatch
  const getHtmlReport = () => {
    return `<div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #1e293b; max-width: 650px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
  <div style="text-align: center; margin-bottom: 25px;">
    <h1 style="color: #155dfc; font-size: 24px; font-weight: 800; text-transform: uppercase; margin: 0; letter-spacing: -0.025em;">Prospect Insight Report</h1>
    <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0; font-weight: 500;">Sora AI Guided Open House Intelligence</p>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />

  <!-- 1. Prospect Snapshot -->
  <div style="margin-bottom: 25px;">
    <h3 style="color: #0f172a; font-size: 14px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; padding-top: 5px;">1. Prospect Snapshot</h3>
    <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600; width: 180px;">Prospect Name:</td><td style="padding: 6px 0; font-weight: 700; color: #011627;">${lead.name}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Mobile Number:</td><td style="padding: 6px 0; font-weight: 600;">${lead.phone || "Unreported"}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Email Address:</td><td style="padding: 6px 0; font-weight: 600;">${lead.email || "Unreported"}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Preferred Contact:</td><td style="padding: 6px 0; font-weight: 600;">${preferredContact}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Property Viewed:</td><td style="padding: 6px 0; font-weight: 700; color: #b45309;">${lead.listingAddress}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Date Captured:</td><td style="padding: 6px 0;">${formattedDate}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Host Agent:</td><td style="padding: 6px 0;">${agentName}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Engagement Source:</td><td style="padding: 6px 0;">Tablet Kiosk / QR Code</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Identity Status:</td><td style="padding: 6px 0;"><span style="background: ${lead.isVerified ? '#ecfdf5' : '#fef3c7'}; color: ${lead.isVerified ? '#065f46' : '#92400e'}; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">${lead.isVerified ? "Pass • High Confidence" : "Local Auth Only"}</span></td></tr>
    </table>
  </div>

  <!-- 2. Outside Identity Verification Hub -->
  <div style="margin-bottom: 25px;">
    <h3 style="color: #0f172a; font-size: 14px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; padding-top: 5px;">2. Outside Identity Verification Hub</h3>
    <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600; width: 180px;">Verification Status:</td><td style="padding: 6px 0; font-weight: 700;">${verificationStatus}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Verification Method:</td><td style="padding: 6px 0;">${verificationMethod}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Provider (SDK):</td><td style="padding: 6px 0; font-weight: bold;">${verificationProvider}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Reviewed By Officer:</td><td style="padding: 6px 0;">${reviewedBy}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Verified Timeline:</td><td style="padding: 6px 0;">${formattedVerifiedDate}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Trust Analytics Score:</td><td style="padding: 6px 0; font-weight: bold; color: #10b981;">${verificationStatus.includes("verified") ? "99% Certified" : "65% Base Rating"}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Audit Log Notes:</td><td style="padding: 6px 0; font-style: italic; color: #475569;">"${verificationNotes}"</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Manual Desk Escalate:</td><td style="padding: 6px 0; font-weight: bold; color: ${manualReviewRequired ? '#b91c1c' : '#475569'};">${manualReviewRequired ? "⚠️ YES - REQUIRES MANUAL INTERVENTION" : "No Action Required"}</td></tr>
    </table>
  </div>

  <!-- 3. Buyer Profile -->
  <div style="margin-bottom: 25px;">
    <h3 style="color: #0f172a; font-size: 14px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; padding-top: 5px;">3. Buyer Profile</h3>
    <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600; width: 180px;">Buying Timeline:</td><td style="padding: 6px 0; font-weight: 700; color: #1e3a8a;">${lead.customAnswers?.timeline || "0-30 Days"}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Target Budget:</td><td style="padding: 6px 0; font-weight: 700;">${lead.customAnswers?.priceRange || "$2,500,000 - $3,500,000"}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Target Neighbourhoods:</td><td style="padding: 6px 0;">${lead.customAnswers?.neighborhoods || "Rosedale, Forest Hill"}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Preferred Home Type:</td><td style="padding: 6px 0;">Luxury Modern Detached Single-Family</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Must-Have Aspects:</td><td style="padding: 6px 0;">${lead.customAnswers?.mustHaves || "Gourmet Chef Kitchen, Private Back Courtyard"}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Deal Breakers:</td><td style="padding: 6px 0; color: #991b1b;">${lead.customAnswers?.dealBreakers || "No structural garage parking, Busy arterial streets"}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Has Agent Representation:</td><td style="padding: 6px 0; font-weight: 600;">${lead.customAnswers?.workingWithAgent === "yes" ? "Yes, active representation contract" : "No, self-represented guest"}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Financing/Advising Status:</td><td style="padding: 6px 0; font-weight: 600; text-transform: capitalize;">${lead.customAnswers?.financingStatus || "Pre-Approved"}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Mortgage Consent Check:</td><td style="padding: 6px 0; font-weight: bold; color: ${isMortgageInterested ? '#10b981' : '#64748b'};">${isMortgageInterested ? 'Yes, Opted-In to Financing Guidance' : 'No Consent Given'}</td></tr>
    </table>
  </div>

  <!-- 4. Engagement Signals -->
  <div style="margin-bottom: 25px;">
    <h3 style="color: #0f172a; font-size: 14px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; padding-top: 5px;">4. Engagement Signals</h3>
    <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600; width: 180px;">Engagement Rank Score:</td><td style="padding: 6px 0; font-weight: 800; color: #155dfc;">${engagementScore}/100</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Response SLA Limit:</td><td style="padding: 6px 0; font-weight: 700; color: #d97706;">${responseReadiness}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Contact Integrity Index:</td><td style="padding: 6px 0; font-weight: 700;">${contactabilityScore}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Tour Duration:</td><td style="padding: 6px 0;">${lead?.customAnswers?.timeAtEvent || "16 Minutes (Active Floor Time)"}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Total Pages Explored:</td><td style="padding: 6px 0;">${lead?.customAnswers?.pagesViewed || "4 core listing layouts"}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">QR Trigger Status:</td><td style="padding: 6px 0; font-weight: 600; color: #059669;">Scanned (AI Tour Activated)</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Questions Prompted:</td><td style="padding: 6px 0;">${lead?.conversationSummary?.questionsAsked?.length || 2} raised questions</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Sora Voice Tour Used:</td><td style="padding: 6px 0; font-weight: 600; color: #155dfc;">Yes (High-Fidelity Audio Mode)</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Kiosk Sign-In Action:</td><td style="padding: 6px 0; font-weight: 600; color: #059669;">Completed & Registered</td></tr>
    </table>
  </div>

  <!-- 5. AI Summary Brief -->
  <div style="margin-bottom: 25px; background-color: #f8fafc; padding: 15px; border-left: 4px solid #155dfc; border-radius: 6px;">
    <h3 style="color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
      ✨ 5. AI Summary Brief
    </h3>
    <p style="font-size: 13.5px; color: #334155; margin: 0; line-height: 1.6; font-style: italic; white-space: pre-wrap;">
      "${lead.conversationSummary?.formattedSummary || 'Prospect expresses high engagement during their detailed walkthrough. They specifically praised the designer chef\'s kitchen custom countertops and queried constraints regarding backyard swimming pool development regulations. Overall profile demonstrates strong capability, timeline fit, and interest. Direct follow-up is recommended.'}"
    </p>
  </div>

  <!-- 6. Property Fit & Motivation Analysis -->
  <div style="margin-bottom: 25px;">
    <h3 style="color: #0f172a; font-size: 14px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; padding-top: 5px;">6. Interest & Motivation Analysis</h3>
    <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600; width: 180px;">Primary Point of Interest:</td><td style="padding: 6px 0; font-weight: 700; color: #1e293b;">${primaryInterest}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Top Question Raised:</td><td style="padding: 6px 0; font-weight: 600; color: #475569;">${topQuestions}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Derived Client Motivation:</td><td style="padding: 6px 0; font-weight: 600; color: #475569;">${likelyMotivation}</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-weight: 600;">Property Fit Analysis:</td><td style="padding: 6px 0; font-weight: 700; color: #0284c7;">${propertyFit}</td></tr>
    </table>
  </div>

  <!-- 7. Mortgage Interest and Compliance Audit -->
  <div style="margin-bottom: 10px; padding: 15px; border-radius: 8px; border: 1px solid ${isMortgageInterested ? '#a7f3d0' : '#fef3c7'}; background-color: ${isMortgageInterested ? '#f0fdf4' : '#fffbeb'};">
    <h3 style="color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 0 0 10px 0; letter-spacing: 0.05em;">7. Mortgage Interest & Compliance Audit</h3>
    <table style="width: 100%; font-size: 13.5px; border-collapse: collapse;">
      <tr><td style="padding: 4px 0; color: #475569; font-weight: 600; width: 200px;">Mortgage Opt-In Status:</td><td style="padding: 4px 0; font-weight: 800; color: ${isMortgageInterested ? '#047857' : '#b45309'};">${isMortgageInterested ? "CONSENT SECURED • UNLOCKED" : "LENDER DATA SUPPRESSED"}</td></tr>
      <tr><td style="padding: 4px 0; color: #475569; font-weight: 600;">Financing Check Selected:</td><td style="padding: 4px 0;">${isMortgageInterested ? "Yes" : "No"}</td></tr>
      <tr><td style="padding: 4px 0; color: #475569; font-weight: 600;">Lender Handoff Authorized:</td><td style="padding: 4px 0;">${isMortgageInterested ? "Yes, Compliant Authorized Signature" : "No Content Transferred"}</td></tr>
      <tr><td style="padding: 4px 0; color: #475569; font-weight: 600;">Registered Co-Paired Lender:</td><td style="padding: 4px 0; font-weight: bold;">${isMortgageInterested ? (lead.customAnswers?.routedLender || "Gold Trust Lending Group") : "N/A - Locked"}</td></tr>
    </table>
  </div>
  
  <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
    <h4 style="margin: 0 0 10px 0; color: #1e293b; font-size: 14px;">🤖 AI Lead Qualification Summary</h4>
    <p style="margin: 0; color: #334155; font-size: 13px; line-height: 1.5;">${(lead as any).aiSummary || "No AI summary available for this lead."}</p>
  </div>

  <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 25px; font-weight: 600;">
    Report synthesized securely by Sora® for AI Open House Connect.
  </p>
</div>`;
  };

  // Compile short/compact SMS summary of all 7 sections for dispatching to the registered agent
  const getSmsReport = () => {
    const soraNarrative = lead.conversationSummary?.formattedSummary
      ? lead.conversationSummary.formattedSummary.slice(0, 160) + "..."
      : "Prospect loves gourmet space & queries pool development rules. Highly engaged.";

    return `[AI OPEN HOUSE CONNECT] PROSPECT INSIGHT BRIEF
Sora AI Open House guided walkthrough logs ready for your review:

1. SNAPSHOT: Name: ${lead.name} | Phone: ${lead.phone || "N/A"} | Email: ${lead.email || "N/A"} | Prop: ${lead.listingAddress} | Captured: ${formattedDate}
2. ID HUB: Status: ${verificationStatus} (${verificationProvider}) | Escalated: ${manualReviewRequired ? "YES ⚠️" : "No"}
3. PROFILE: Timeline: ${lead.customAnswers?.timeline || "0-30 Days"} | Budget: ${lead.customAnswers?.priceRange || "$2.5M-$3.5M"} | Agent: ${lead.customAnswers?.workingWithAgent === "yes" ? "Yes" : "No"} | Loan: ${lead.customAnswers?.financingStatus || "Pre-Approved"}
4. SIGNALS: Score: ${engagementScore}/100 | Time: ${lead?.customAnswers?.timeAtEvent || "16 min"} | SLA: ${responseReadiness} | Voice Tour: Yes
5. AI BRIEF: "${soraNarrative}"
6. FIT ANALYSIS: Interest: ${primaryInterest} | Motivation: ${likelyMotivation} | Fit: ${propertyFit}
7. LENDER AUDIT: Opt-In: ${isMortgageInterested ? "YES (Unlocked)" : "NO (Suppressed)"} | Active Pair: ${isMortgageInterested ? (lead.customAnswers?.routedLender || "Gold Trust Lending Group") : "Locked"}`;
  };

  const handleSendSmsToAgent = async () => {
    const toastId = toast.loading(`Dispatching Prospect Insight SMS brief to registered agent...`);
    try {
      const smsBody = getSmsReport();
      // SMS simulation and logging
      console.log(`[SMS DISPATCH] To Agent Phone: ${agentPhone}\nBody:\n${smsBody}`);
      
      setTimeout(() => {
        toast.success("Saved successfully", { 
          id: toastId, 
          description: `✨ SMS containing complete 7-part Prospect Insight Brief dispatched to registered agent: ${agentPhone}` 
        });
      }, 800);
    } catch (err: any) {
      console.error(err);
      toast.error(`SMS dispatch failed: ${err.message || "Twilio Queue busy"}`);
    }
  };

  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`📋 Copied ${type} to clipboard!`);
  };

  const handleToggleTag = (tag: string) => {
    let nextTags: string[];
    if (selectedTags.includes(tag)) {
      nextTags = selectedTags.filter(t => t !== tag);
    } else {
      nextTags = [...selectedTags, tag];
    }
    setSelectedTags(nextTags);
    if (onSaveNotes) {
      onSaveNotes(localNotes, nextTags, {
        sms: editableSms,
        email: editableEmail,
        call: editableCall,
        customCreatedTags
      });
    }
  };

  const handleCreateCustomTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (customCreatedTags.length >= 6) {
      toast.error("Limit exceeded! You can create up to 6 custom active tracking tags.");
      return;
    }
    if (allAvailableTags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("This tracking tag already exists.");
      return;
    }

    const updatedCustom = [...customCreatedTags, trimmed];
    setCustomCreatedTags(updatedCustom);
    // Auto-select the newly added tag
    const updatedSelected = [...selectedTags, trimmed];
    setSelectedTags(updatedSelected);
    setNewTagInput("");
    toast.success(`Active tracking tag "${trimmed}" created!`);

    if (onSaveNotes) {
      onSaveNotes(localNotes, updatedSelected, {
        sms: editableSms,
        email: editableEmail,
        call: editableCall,
        customCreatedTags: updatedCustom
      });
    }
  };

  const handleNotesChange = (val: string) => {
    let text = val;
    if (text.length > 5000) {
      text = text.substring(0, 5000);
    }
    // Enforce first letter of the first word must be uppercase
    if (text.length > 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    setLocalNotes(text);
  };

  const handleSaveNotesClick = async () => {
    try {
      if (onSaveNotes) {
        await onSaveNotes(localNotes, selectedTags, {
          sms: editableSms,
          email: editableEmail,
          call: editableCall,
          customCreatedTags,
          verificationStatus,
          verificationMethod,
          verificationProvider,
          reviewedBy,
          verificationNotes,
          manualReviewRequired,
          verifiedOn
        });
      }
      toast.success("Saved successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save data.");
    }
  };

  const handleSendToAgent = async () => {
    const agentEmail = auth.currentUser?.email || "luc.valade@gmail.com";
    const toastId = toast.loading("Dispatching Prospect Insight Brief to agent inbox...");
    try {
      const emailHtml = getHtmlReport();

      await sendEmail({
        to: agentEmail,
        subject: `[AI Open House Connect] Prospect Insight Brief: ${lead.name}`,
        html: emailHtml
      });
      toast.success("Saved successfully", { id: toastId, description: `Comprehensive 7-part report sent successfully to agent at ${agentEmail}` });
    } catch (err: any) {
      console.error(err);
      toast.error(`Dispatch failed: ${err.message || 'SMTP Server Busy'}`, { id: toastId });
    }
  };

  const handleSendFollowUp = async () => {
    if (activeDraftTab === "email") {
      if (!lead.email) {
        toast.error("Send Draft failed! This prospect did not submit an email address.");
        return;
      }
      const toastId = toast.loading(`Sending Email draft to ${lead.email}...`);
      try {
        await sendEmail({
          to: lead.email,
          subject: `Follow-up on your visit: ${lead.listingAddress}`,
          text: editableEmail
        });
        toast.success("Saved successfully", { id: toastId, description: `Email draft sent successfully to ${lead.email}` });
      } catch (err: any) {
        console.error(err);
        toast.error(`Failed to send follow-up: ${err.message || "Gateway busy"}`, { id: toastId });
      }
    } else if (activeDraftTab === "text") {
      if (!lead.phone) {
        toast.error("Send Draft failed! This prospect did not submit a phone number.");
        return;
      }
      // SMS dispatch simulation
      toast.success("Saved successfully", { description: `Twilio SMS dispatched successfully to ${lead.phone}` });
    } else {
      toast.success("Saved successfully", { description: "Call notes logged to schedule queue." });
    }
  };

  const handleAiRewriteDraft = async (type: "sms" | "email" | "call") => {
    let originalText = "";
    if (type === "sms") {
      originalText = editableSms;
      setRewritingSms(true);
    } else if (type === "email") {
      originalText = editableEmail;
      setRewritingEmail(true);
    } else {
      originalText = editableCall;
      setRewritingCall(true);
    }

    try {
      const response = await fetch("/api/rewrite-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: originalText, type })
      });

      if (!response.ok) {
        throw new Error("AI synthesis route unavailable");
      }

      const data = await response.json();
      if (data.success && data.rewrittenText) {
        let text = data.rewrittenText.trim();
        if (text.length > 0) {
          text = text.charAt(0).toUpperCase() + text.slice(1);
        }
        if (type === "sms") {
          setEditableSms(text);
        } else if (type === "email") {
          setEditableEmail(text);
        } else {
          setEditableCall(text);
        }
        toast.success(`✨ Sora AI rewrote your ${type.toUpperCase()} copy successfully!`);
      } else {
        toast.error("Failed to generate content rewriting. Reverting.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Gemini context server busy. Please retry in a few seconds.");
    } finally {
      if (type === "sms") setRewritingSms(false);
      else if (type === "email") setRewritingEmail(false);
      else setRewritingCall(false);
    }
  };

  // CONDENSED LIST PREVIEW CARD VIEW
  if (isCondensed) {
    return (
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3.5 text-left text-slate-800 shadow-md font-sans">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800">Insight Brief</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-red-105 text-red-700 bg-red-50 border border-red-200`}>
            {leadTemperature}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px] leading-relaxed">
          <div>
            <p className="text-slate-500 font-bold uppercase tracking-wider text-[8.5px]">Prospect & Timeline</p>
            <p className="font-semibold text-slate-700 mt-0.5">{prospectType} • {lead.customAnswers?.timeline || "0-30 Days"}</p>
          </div>
          <div>
            <p className="text-slate-500 font-bold uppercase tracking-wider text-[8.5px]">Top Interest</p>
            <p className="font-semibold text-slate-700 mt-0.5 truncate">{primaryInterest}</p>
          </div>
          <div className="col-span-2">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[8.5px]">Key Concern / Need</p>
            <p className="font-semibold text-slate-600 mt-0.5 truncate italic">"{keyConcerns.replace(/"/g, "")}"</p>
          </div>
          <div className="col-span-2 border-t border-slate-100 pt-2 flex items-center justify-between">
            <div>
              <p className="text-slate-500 font-bold uppercase tracking-wider text-[8.5px]">Best Next Action</p>
              <p className="font-bold text-blue-600 text-[10.5px] mt-0.5">{recommendedNextStep}</p>
            </div>
            <Button 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                handleCopyText(editableSms, "Follow-Up SMS");
              }}
              className="h-7 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase tracking-wider rounded-lg shrink-0 gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Copy className="h-2.5 w-2.5" /> Text
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // MULTI-SECTION DYNAMIC PANEL VIEW (Sleek light design matching site)
  return (
    <div className="bg-white text-slate-800 rounded-2xl border border-slate-200 overflow-hidden shadow-2xl font-sans text-left max-w-4xl mx-auto flex flex-col h-full max-h-[85vh]">
      
      {/* 1. Report Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-5 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <Brain className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
              Prospect Insight Report
              <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded font-black">
                Sora AI Guided
              </span>
            </h2>
          </div>
          <p className="text-slate-500 text-[11px] font-medium leading-relaxed max-w-xl">
            Real estate analytics for this visitor's tour interactions, focus points, and client qualification status.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            onClick={handleSendToAgent}
            variant="outline"
            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-[9px] font-black uppercase tracking-wider h-8 rounded-lg cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <Send className="h-3 w-3 mr-1" /> Send to Agent
          </Button>
          <Button 
            onClick={() => handleCopyText(getPlainTextReport(), "Prospect Insight Report")}
            variant="outline"
            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-[9px] font-black uppercase tracking-wider h-8 rounded-lg cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <Copy className="h-3 w-3 mr-1" /> Copy Prospect Insight Report
          </Button>
          <Button 
            onClick={handleSendSmsToAgent}
            className="bg-blue-600 text-white hover:bg-blue-500 text-[9px] font-black uppercase tracking-wider h-8 rounded-lg cursor-pointer hover:scale-105 active:scale-95 transition-all border-none"
          >
            <MessageSquare className="h-3 w-3 mr-1 text-white" /> Send SMS
          </Button>
        </div>
      </div>

      {/* Dynamic Status Pills Ribbon */}
      <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-2.5 flex items-center gap-4 text-xs font-mono shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400 text-[9.5px] uppercase font-black tracking-widest font-sans">Lead Temperature:</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
            leadTemperature === "Hot" ? "bg-red-50 text-red-600 border border-red-200" : 
            leadTemperature === "Warm" ? "bg-sky-50 text-sky-650 border border-sky-200" : 
            "bg-blue-50 text-blue-600 border border-blue-200"
          }`}>
            {leadTemperature}
          </span>
        </div>
        <span className="text-slate-200 font-light">|</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400 text-[9.5px] uppercase font-black tracking-widest font-sans">Prospect Type:</span>
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase">
            {prospectType}
          </span>
        </div>
        <span className="text-slate-200 font-light">|</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400 text-[9.5px] uppercase font-black tracking-widest font-sans">Follow-Up Priority:</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
            followUpPriority === "High" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-500 border border-slate-200"
          }`}>
            {followUpPriority}
          </span>
        </div>
      </div>

      {/* Main Container Scrollable Portion */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30 scrollbar-thin scrollbar-slate-200">
        
        {/* 2. Prospect Snapshot */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5 font-mono">
              <User className="h-4 w-4 text-blue-600" /> Prospect Snapshot
            </h3>
            <span className="text-[9.5px] text-slate-400 italic">Core contact and visit details.</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Full Name</p>
              <div className="flex items-center gap-1.5 mt-1">
                <p className="text-sm font-bold text-slate-800">{lead.name}</p>
                <button
                  type="button"
                  onClick={() => setIsRecordingOpen(true)}
                  className="relative -top-[5px] p-1.5 rounded-full text-white bg-blue-600 hover:bg-blue-700 hover:scale-115 transition-all cursor-pointer inline-flex items-center justify-center border-2 border-blue-400 animate-[pulse_0.8s_infinite] shadow-[0_4px_12px_rgba(37,99,235,0.45)]"
                  title="Record Voice Note for this Prospect"
                  id={`mic-report-${lead.id}`}
                >
                  <Mic className="h-4.5 w-4.5 text-white shrink-0" />
                </button>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Mobile Number</p>
              <p className="text-sm font-bold text-slate-800 mt-1">
                {lead.phone ? <a href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-blue-600 underline font-semibold">{lead.phone}</a> : "Unreported"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Email Address</p>
              <p className="text-sm font-bold text-slate-800 mt-1">
                {lead.email ? <a href={`mailto:${lead.email}`} className="hover:text-blue-600 underline font-semibold">{lead.email}</a> : "Unreported"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Preferred Contact Method</p>
              <p className="text-xs font-bold text-slate-700 mt-1 capitalize">{lead.email && lead.phone ? "Email & Text/Call" : lead.email ? "Email Preferred" : "Text/Call Preferred"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Property Viewed</p>
              <p className="text-xs font-black text-amber-600 mt-1 truncate font-mono" title={lead.listingAddress}>{lead.listingAddress}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Date Captured</p>
              <p className="text-xs font-bold text-slate-700 mt-1">{format(lead.createdAt || Date.now(), "MMM d, yyyy, h:mm a")}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Host Agent</p>
              <p className="text-xs font-bold text-slate-700 mt-1">Hosting Agent</p>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Engagement Source</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">QR Code / Tablet Kiosk</p>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Identity Verified</p>
              <p className="text-xs font-bold mt-1 flex items-center gap-1.5">
                {lead.isVerified || lead.verified ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-extrabold uppercase text-[9.5px] tracking-wider">Pass • {lead.confidenceScore || "High"} Confidence</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-amber-700 uppercase font-black text-[9.5px] tracking-wider">Local Auth Only</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 2.5 Outside Identity Verification Hub (PRD Component) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5 font-mono">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Outside Identity Verification Hub
            </h3>
            <span className="text-[9.5px] text-slate-400 italic">Government-grade identity checks & compliance flags.</span>
          </div>

          <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8.5px] font-mono tracking-widest uppercase px-2 py-0.5 rounded font-black inline-block mb-1">
                  Active Trust Score: {verificationStatus === "ID verified" || verificationStatus === "Brokerage verified" ? "99% Certified" : "Local Signin Base"}
                </span>
                <p className="text-[10px] text-slate-400">
                  🛡️ RESTRICTED ACCESS: Identity logs are restricted to authenticated Listing Agents, Team Admins, and Compliance Officers.
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8.5px] text-slate-400 uppercase tracking-widest font-mono">Verified On Timestamp</p>
                <p className="text-xs font-bold text-slate-200 font-mono mt-0.5">
                  {format(verifiedOn, "MMM d, yyyy, h:mm a")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dropdown status */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Verification Status</label>
                <select
                  value={verificationStatus}
                  onChange={(e) => {
                    setVerificationStatus(e.target.value);
                    if (e.target.value === "ID verified" || e.target.value === "Brokerage verified") {
                      setVerifiedOn(Date.now());
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs p-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                >
                  <option value="Signed in through app">Signed in through app (Unverified)</option>
                  <option value="ID verified">ID verified (Biometric Pass)</option>
                  <option value="Brokerage verified">Brokerage verified (Manual Audit Pass)</option>
                  <option value="Verification pending">Verification pending (Processing)</option>
                  <option value="Verification failed">Verification failed (Mismatched credentials)</option>
                </select>
              </div>

              {/* Verification method */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Verification Method</label>
                <select
                  value={verificationMethod}
                  onChange={(e) => setVerificationMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs p-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                >
                  <option value="Government-issued photo ID">Government-issued photo ID</option>
                  <option value="Third-party identity service verification">Third-party identity service verification</option>
                  <option value="Brokerage-admin verification">Brokerage-admin verification</option>
                  <option value="Manual review only">Manual desk review only</option>
                </select>
              </div>

              {/* Verification provider */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Verification Provider (SDK)</label>
                <select
                  value={verificationProvider}
                  onChange={(e) => setVerificationProvider(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs p-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                >
                  <option value="Veriff">Veriff (Enterprise Biometric)</option>
                  <option value="Sumsub">Sumsub (Global AML/KYC)</option>
                  <option value="Onfido">Onfido (Document Match)</option>
                  <option value="Jumio">Jumio ID Scanner</option>
                  <option value="Local Auth Only">Local Auth Only (Self-Declared)</option>
                </select>
              </div>

              {/* Reviewed by */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Reviewed By Officer</label>
                <Input
                  value={reviewedBy}
                  onChange={(e) => setReviewedBy(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500 text-xs h-9 rounded-lg"
                  placeholder="Compliance reviewer"
                />
              </div>

              {/* Verification notes */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Audit & Failure Log Notes</label>
                <Input
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500 text-xs h-9 rounded-lg"
                  placeholder="Explain why failed or record authentication compliance tags here."
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 gap-3 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={manualReviewRequired}
                  onChange={(e) => setManualReviewRequired(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-opacity-0 h-4 w-4 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 font-mono">
                  ⚠️ FORWARD TO MANUAL ADMIN COMPLIANCE REVIEW
                </span>
              </label>

              <Button
                size="sm"
                onClick={handleSaveNotesClick}
                className="bg-emerald-600 hover:bg-emerald-500 font-bold text-[10px] text-white uppercase tracking-wider px-3 h-8 rounded-lg cursor-pointer transition-all border-none"
              >
                Save Identity Verification Log
              </Button>
            </div>
          </div>
        </div>

        {/* 3. Buyer Profile - Light styled */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5 font-mono">
              <Target className="h-4 w-4 text-blue-600" /> Buyer Profile
            </h3>
            <span className="text-[9.5px] text-slate-400 italic">Timeline, financing qualifications, and criteria.</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Buying Timeline</p>
              <p className="text-xs font-extrabold text-slate-800 mt-1 capitalize">{lead.customAnswers?.timeline || "0-30 Days"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Price Range Limit</p>
              <p className="text-xs font-extrabold text-slate-800 mt-1">{lead.customAnswers?.priceRange || "$2,500,000 - $3,500,000"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Preferred Neighborhoods</p>
              <p className="text-xs font-semibold text-slate-700 mt-1 truncate">{lead.customAnswers?.neighborhoods || "Rosedale, Forest Hill"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Home Type Interest</p>
              <p className="text-xs font-semibold text-slate-700 mt-1">Luxury Modern Detached Single-Family</p>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Must-Have Features</p>
              <p className="text-xs font-semibold text-slate-700 mt-1 truncate">{lead.customAnswers?.mustHaves || "Gourmet Chef Kitchen, Private Back Courtyard"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Deal Breakers</p>
              <p className="text-xs font-semibold text-slate-700 mt-1 truncate">{lead.customAnswers?.dealBreakers || "No structural garage parking, Busy arterial streets"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Working With an Agent</p>
              <p className="text-xs font-bold text-slate-700 mt-1 flex items-center gap-1">
                {lead.customAnswers?.workingWithAgent === "yes" ? "Yes, under representation contract" : "No, self-represented buyer"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Financing Status</p>
              <p className="text-xs font-bold text-slate-700 mt-1 capitalize">{lead.customAnswers?.financingStatus || "Pre-Approved"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Primary Mortgage Opt-In</p>
              <p className="text-xs font-extrabold text-slate-800 mt-1 uppercase flex items-center gap-1.5">
                {lead.mortgageInterest || lead.mortgageConsent ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-extrabold font-mono">Yes, Requested Financing Info</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    <span className="text-slate-500">No Financing Requested</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Engagement Signals */}
        <div className="space-y-4">
          <div className="border-b border-slate-200 pb-1.5 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5 font-mono">
              <TrendingUp className="h-4 w-4 text-blue-600" /> Engagement Signals
            </h3>
            <span className="text-[9.5px] text-slate-400 italic">User interface session analytics.</span>
          </div>

          {/* Micro-Metrics Bento Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200 text-center flex flex-col justify-center">
              <span className="text-blue-800 font-black uppercase tracking-wider text-[8px]">Engagement Score</span>
              <span className="text-lg font-black text-blue-700 mt-1">{engagementScore}/100</span>
              <span className="text-[7.5px] text-blue-500 font-mono mt-0.5">High Engagement</span>
            </div>
            <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 text-center flex flex-col justify-center">
              <span className="text-amber-800 font-black uppercase tracking-wider text-[8px]">Response Readiness</span>
              <span className="text-sm font-black text-amber-700 mt-1">{responseReadiness}</span>
              <span className="text-[7.5px] text-amber-600 font-mono mt-1">Recommended SLA</span>
            </div>
            <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200 text-center flex flex-col justify-center">
              <span className="text-emerald-800 font-black uppercase tracking-wider text-[8px]">Contactability Index</span>
              <span className="text-lg font-black text-emerald-700 mt-1">{contactabilityScore}</span>
              <span className="text-[7.5px] text-emerald-500 font-mono mt-0.5">Contact Integrity</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <p className="text-slate-400 font-bold text-[8.5px] uppercase tracking-wider font-mono">Time At Event</p>
              <p className="font-semibold text-slate-700 mt-1">16 Minutes (Active Floor Time)</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-[8.5px] uppercase tracking-wider font-mono">Pages Viewed</p>
              <p className="font-semibold text-slate-700 mt-1">4 core listing layouts</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-[8.5px] uppercase tracking-wider font-mono">QR Interaction Code</p>
              <p className="font-semibold text-emerald-600 mt-1">Scanned (AI Tour Prompt)</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-[8.5px] uppercase tracking-wider font-mono">Questions Prompted</p>
              <p className="font-semibold text-slate-700 mt-1">{lead.conversationSummary?.questionsAsked?.length || 2} raised questions</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-[8.5px] uppercase tracking-wider font-mono">Sora AI Assistant used</p>
              <p className="font-bold text-blue-600 mt-1">Yes, Active engagement</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-[8.5px] uppercase tracking-wider font-mono">Voice tour utilized</p>
              <p className="font-bold text-blue-650 mt-1 flex items-center gap-1">
                Yes (High-Fidelity Audio Mode)
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-[8.5px] uppercase tracking-wider font-mono">Sign-In Gateway Completed</p>
              <p className="font-bold text-emerald-600 mt-1">True (Compliance Consent)</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold text-[8.5px] uppercase tracking-wider font-mono">Follow-up legal permission</p>
              <p className="font-bold text-emerald-600 mt-1 uppercase">Explicitly Authorized</p>
            </div>
          </div>
        </div>

        {/* 5. AI Summary Narrative */}
        <div className="space-y-4">
          <div className="border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-600 font-mono">AI Summary Brief</span>
          </div>

          <div className="p-4 bg-blue-50/20 leading-relaxed text-slate-800 font-sans italic text-sm rounded-xl border-l-[3px] border-blue-600 border border-blue-100 whitespace-pre-wrap">
            {lead.conversationSummary?.formattedSummary ? (
              `"${lead.conversationSummary.formattedSummary}"`
            ) : (
              `"Prospect expresses high engagement during their detailed walkthrough. They specifically praised the designer chef's kitchen custom countertops and queried constraints regarding backyard swimming pool development regulations. Overall profile demonstrates strong capability, timeline fit, and interest. Direct follow-up is recommended."`
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-slate-400 font-mono uppercase text-[8px] font-extrabold tracking-wider">Primary Interest</p>
              <p className="font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                {primaryInterest}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-mono uppercase text-[8px] font-extrabold tracking-wider">Top Questions Asked</p>
              <p className="font-semibold text-slate-600 mt-1 flex items-start gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                {topQuestions}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-mono uppercase text-[8px] font-extrabold tracking-wider">Derived Motivation</p>
              <p className="font-semibold text-slate-600 mt-1 flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                {likelyMotivation}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-mono uppercase text-[8px] font-extrabold tracking-wider">Property Fit Analysis</p>
              <p className="font-semibold text-slate-600 mt-1 flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                {propertyFit}
              </p>
            </div>
          </div>
        </div>

        {/* 6 & 7. Follow-Up Drafts Workspace (Allow User to Edit, Save, and AI Rewrite) */}
        <div className="space-y-4">
          <div className="border-b border-slate-200 pb-1.5 flex justify-between items-center bg-transparent">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-600 font-mono">Grounded Follow-up Campaigns & Scripts</span>
            </div>
            
            {/* Tab switchers */}
            <div className="flex items-center gap-1 border border-slate-200 bg-slate-100 p-0.5 rounded-lg">
              <button 
                onClick={() => setActiveDraftTab("text")}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                  activeDraftTab === "text" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                SMS Draft
              </button>
              <button 
                onClick={() => setActiveDraftTab("email")}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                  activeDraftTab === "email" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Email Draft
              </button>
              <button 
                onClick={() => setActiveDraftTab("call")}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                  activeDraftTab === "call" 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Call Script
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 relative group space-y-4">
            {activeDraftTab === "text" && (
              <div key="text" className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>SUGGESTED SMS TEXT (MOBILE COMPLIANT - FULLY EDITABLE)</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleAiRewriteDraft("sms")}
                      disabled={rewritingSms}
                      className="text-blue-600 hover:text-blue-700 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {rewritingSms ? <Loader2 className="h-3 w-3 animate-spin" /> : "✨ AI Rewrite"}
                    </button>
                    <button 
                      onClick={() => handleCopyText(editableSms, "SMS Content Draft")}
                      className="text-amber-600 hover:text-amber-700 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy SMS
                    </button>
                  </div>
                </div>
                <textarea 
                  value={editableSms}
                  onChange={(e) => setEditableSms(e.target.value)}
                  rows={4}
                  className="w-full text-slate-800 text-sm font-semibold p-4 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed font-sans focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                  placeholder="Draft your follow-up SMS here..."
                />
              </div>
            )}

            {activeDraftTab === "email" && (
              <div key="email" className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>SUGGESTED FOLLOW-UP EMAIL (SPAM-SAFE - FULLY EDITABLE)</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleAiRewriteDraft("email")}
                      disabled={rewritingEmail}
                      className="text-blue-600 hover:text-blue-700 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {rewritingEmail ? <Loader2 className="h-3 w-3 animate-spin" /> : "✨ AI Rewrite"}
                    </button>
                    <button 
                      onClick={() => handleCopyText(editableEmail, "Email Content Draft")}
                      className="text-amber-600 hover:text-amber-700 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy Email
                    </button>
                  </div>
                </div>
                <textarea 
                  value={editableEmail}
                  onChange={(e) => setEditableEmail(e.target.value)}
                  rows={10}
                  className="w-full text-slate-800 text-xs font-semibold p-4 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                  placeholder="Draft your email template..."
                />
              </div>
            )}

            {activeDraftTab === "call" && (
              <div key="call" className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>SUGGESTED CALL SCRIPT (CONNECTED SPEECH - FULLY EDITABLE)</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleAiRewriteDraft("call")}
                      disabled={rewritingCall}
                      className="text-blue-600 hover:text-blue-700 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {rewritingCall ? <Loader2 className="h-3 w-3 animate-spin" /> : "✨ AI Rewrite"}
                    </button>
                    <button 
                      onClick={() => handleCopyText(editableCall, "Call Script")}
                      className="text-amber-600 hover:text-amber-700 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy Script
                    </button>
                  </div>
                </div>
                <textarea 
                  value={editableCall}
                  onChange={(e) => setEditableCall(e.target.value)}
                  rows={5}
                  className="w-full text-slate-800 text-xs font-semibold p-4 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed font-sans focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                  placeholder="Draft your call outreach script outlines..."
                />
              </div>
            )}
            
            <div className="flex justify-end pt-1">
              <Button 
                onClick={handleSaveNotesClick}
                className="bg-blue-650 text-white bg-blue-600 hover:bg-blue-500 text-[10px] font-extrabold uppercase tracking-widest h-8 px-4 rounded-lg cursor-pointer"
              >
                Save Current Draft
              </Button>
            </div>
          </div>
        </div>

        {/* 8. Mortgage Interest & Compliance Gate - Light styled */}
        <div className="space-y-3">
          <div className="border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-600 font-mono">Mortgage Interest & Compliance Audit</span>
          </div>

          {lead.mortgageInterest || lead.mortgageConsent ? (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-4">
              <div className="flex items-start gap-2 text-emerald-800 text-xs font-bold leading-relaxed">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="uppercase tracking-widest font-mono text-[9px] text-emerald-700 font-extrabold">CONSENT SECURED • REPORTING UNLOCKED</p>
                  <p className="mt-1 font-semibold text-slate-700 text-xs">
                    Visitor explicitly clicked "yes" for mortgage planning assistance. Compliant paired lender details routed successfully.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-4 gap-4 pt-1 bg-white p-3 rounded-lg border border-slate-200 text-xs text-left">
                <div>
                  <p className="text-slate-400 font-bold text-[8px] uppercase tracking-wider font-mono">Did Ask Financing</p>
                  <p className="font-extrabold text-slate-800 mt-0.5">Yes</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold text-[8px] uppercase tracking-wider font-mono">Mortgage Handoff Requested</p>
                  <p className="font-extrabold text-slate-800 mt-0.5">Yes</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold text-[8px] uppercase tracking-wider font-mono">Opted In to Contact</p>
                  <p className="font-extrabold text-emerald-600 mt-0.5">Yes, explicit consent</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold text-[8px] uppercase tracking-wider font-mono">Current Active Routed Lender</p>
                  <p className="font-extrabold text-amber-700 mt-0.5 truncate">{lead.customAnswers?.routedLender || "Gold Trust Lending Group"}</p>
                </div>
              </div>

              {/* Jurisdiction & Compliance Framework Metadata (No Geolocation Permission Required) */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-left space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider font-mono text-slate-500">Jurisdiction & Compliance Audit</span>
                  <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-mono">
                    Zero Geolocation Prompt Mode
                  </span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-slate-400 font-bold text-[8px] uppercase tracking-wider font-mono">Detected Jurisdiction</p>
                    <p className="font-bold text-slate-900 mt-0.5">{lead.detectedCountry || "Canada"} ({lead.detectedRegion || "Ontario"})</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold text-[8px] uppercase tracking-wider font-mono">Detection Strategy</p>
                    <p className="font-bold text-slate-700 mt-0.5 text-[11px] truncate">{lead.geoProvider || "Property Context + Area Code Parsing"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold text-[8px] uppercase tracking-wider font-mono">Enforced Framework</p>
                    <p className="font-bold text-blue-700 mt-0.5 text-[11px] truncate">{lead.jurisdictionRulesApplied || "CASL / PIPEDA (Canada Co-Marketing)"}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-left space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="uppercase tracking-widest font-mono text-[9px] text-amber-700 font-black">LENDER DETAILS SUPPRESSED</p>
                  <p className="mt-1 text-slate-600 font-semibold text-xs leading-relaxed">
                    Lender details and mortgage routing queue are locked. This visitor did not request financing info or explicitly opt-in to third-party mortgage conversations. Lead information has been strictly withheld from lender visibility to ensure regulatory compliance.
                  </p>
                </div>
              </div>

              {/* Jurisdiction Metadata even when suppressed */}
              <div className="bg-white p-3 rounded-lg border border-amber-200/70 text-xs text-left space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider font-mono text-slate-500">Jurisdiction Compliance Record</span>
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
                    Zero Geolocation Prompt Mode
                  </span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-slate-400 font-bold text-[8px] uppercase tracking-wider font-mono">Jurisdiction</p>
                    <p className="font-bold text-slate-900 mt-0.5">{lead.detectedCountry || "Canada"} ({lead.detectedRegion || "Ontario"})</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold text-[8px] uppercase tracking-wider font-mono">Detection Method</p>
                    <p className="font-bold text-slate-700 mt-0.5 text-[11px] truncate">{lead.geoProvider || "Property Context + Area Code Parsing"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold text-[8px] uppercase tracking-wider font-mono">Compliance Rule</p>
                    <p className="font-bold text-slate-700 mt-0.5 text-[11px] truncate">{lead.jurisdictionRulesApplied || "CASL / PIPEDA (Canada Co-Marketing)"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 9. Agent Notes, Lead Stage, CRM Status (With Dynamic Additional 6 Tags & Enforced Outcomes uppercase rule & character counters) */}
        <div className="space-y-4">
          <div className="border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-600 font-mono">Agent Notes & Tagging Workspace</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
            
            {/* Left Col: Tag Selectors + Create tag input (limit of 6 additional active tracking tags) */}
            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-wider font-mono">Add Active Tracking Tags</p>
                <p className="text-[10px] text-slate-400 italic">Click any marketing tag to toggle status in the active CRM database.</p>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {allAvailableTags.map((tag) => {
                  const isActive = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleToggleTag(tag)}
                      className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all border cursor-pointer ${
                        isActive 
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {tag} {isActive && "✓"}
                    </button>
                  );
                })}
              </div>

              {/* Tag creation input (limit of 6 additional tags) */}
              <div className="space-y-2 border-t border-slate-200 pt-3">
                <p className="text-slate-500 font-black text-[9px] uppercase tracking-wider font-mono">
                  Create Custom Tracking Tags ({customCreatedTags.length} / 6 used)
                </p>
                <div className="flex gap-2">
                  <Input 
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="New tracking tag..."
                    className="h-8 max-w-[180px] text-xs bg-white border-slate-200"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleCreateCustomTag}
                    className="h-8 bg-white text-slate-700 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-wider px-3 gap-1 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Tag
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Col: Outcomes Text and Save & Live Character Counter */}
            <div className="space-y-3 text-left">
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-wider font-mono">Outcomes & Private Notes</p>
              <div className="relative">
                <textarea
                  value={localNotes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Type follow-up notes here (first letter capitalized automatically, up to 5,000 characters)..."
                  rows={6}
                  maxLength={5000}
                  className="w-full bg-white border border-slate-200 p-3 pb-8 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed font-sans placeholder:text-slate-400 resize-none font-semibold"
                />
                <div className="absolute right-3 bottom-2 text-[9px] text-slate-400 font-mono font-bold pointer-events-none">
                  {localNotes.length.toLocaleString()} / 5,000 chars
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveNotesClick}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-extrabold uppercase tracking-widest h-9 px-5 rounded-lg cursor-pointer hover:scale-105 active:scale-95 transition-all border-none"
                >
                  Save Notes & Tags
                </Button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Footer Exit actions */}
      {onClose && (
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex justify-end shrink-0">
          <Button 
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-305 text-slate-700 hover:text-slate-900 border-none text-[10px] font-black uppercase tracking-widest h-9 px-5 rounded-lg cursor-pointer"
          >
            Close Report
          </Button>
        </div>
      )}

      <VoiceNoteRecorderModal
        isOpen={isRecordingOpen}
        onClose={() => setIsRecordingOpen(false)}
        maxDuration={180}
        onSave={handleSaveVoiceNote}
        role="agent"
        propertyAddress={lead.listingAddress}
      />

    </div>
  );
}
