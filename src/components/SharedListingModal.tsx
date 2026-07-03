import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getTeamMembers, sendEmail } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  Settings, 
  ShieldCheck, 
  Database, 
  Calendar, 
  FileCheck2, 
  Loader2, 
  Sparkles, 
  Clock, 
  CheckSquare, 
  Info, 
  Mail, 
  AlertTriangle 
} from "lucide-react";

interface SharedListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: any; // Listing details
}

export default function SharedListingModal({ isOpen, onClose, listing }: SharedListingModalProps) {
  const { user } = useAuth();
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Form states
  const [selectedHostId, setSelectedHostId] = useState<string>("");
  const [customHostEmail, setCustomHostEmail] = useState<string>("");
  const [customHostName, setCustomHostName] = useState<string>("");
  const [useCustomHost, setUseCustomHost] = useState<boolean>(false);

  // Host permissions
  const [permissions, setPermissions] = useState({
    canLaunchOpenHouse: true,
    canEditEventQuestions: true,
    canUseHostBranding: true,
    canAddNotes: true,
    canFollowUpWithLeads: true,
  });

  // Lead rules
  const [leadRule, setLeadRule] = useState<"host_receives" | "owner_visibility_only" | "team_admin_all">("host_receives");

  // Lender rules
  const [lenderRule, setLenderRule] = useState<"listing_lender" | "host_lender" | "team_override" | "no_lender">("listing_lender");

  // Schedule rules
  const getTodayStr = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getWeekLaterStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [scheduleType, setScheduleType] = useState<"one_event" | "date_range" | "reusable">("one_event");
  const [oneEventDate, setOneEventDate] = useState<string>(getTodayStr());
  const [rangeStartDate, setRangeStartDate] = useState<string>(getTodayStr());
  const [rangeEndDate, setRangeEndDate] = useState<string>(getWeekLaterStr());

  // Validation States
  const [customHostNameTouched, setCustomHostNameTouched] = useState(false);
  const [customHostEmailTouched, setCustomHostEmailTouched] = useState(false);
  const [oneEventDateTouched, setOneEventDateTouched] = useState(false);
  const [rangeStartDateTouched, setRangeStartDateTouched] = useState(false);
  const [rangeEndDateTouched, setRangeEndDateTouched] = useState(false);
  const [isChoosingDate, setIsChoosingDate] = useState(false);

  const getHostEmailError = (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) {
      return "Host email is required.";
    }
    if (!trimmed.includes("@")) {
      return "Host email must contain '@'.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return "Please enter a valid email address (e.g., name@domain.com).";
    }
    return "";
  };

  const getHostNameError = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return "Host name is required.";
    }
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) {
      return "Please enter both first name and last name.";
    }
    const firstWord = parts[0];
    const lastWord = parts[parts.length - 1];
    
    const startsWithUpper = (str: string) => /^[A-Z]/.test(str);
    if (!startsWithUpper(firstWord) || !startsWithUpper(lastWord)) {
      return "First letter of first name and last name must be uppercase (e.g. John Doe).";
    }
    return "";
  };

  const getOneEventDateError = (dateStr: string) => {
    const todayStr = getTodayStr();
    if (!dateStr) {
      return "Event date is required.";
    }
    if (dateStr < todayStr) {
      return "Event date cannot be in the past.";
    }
    return "";
  };

  const getRangeStartDateError = (dateStr: string) => {
    const todayStr = getTodayStr();
    if (!dateStr) {
      return "Start date is required.";
    }
    if (dateStr < todayStr) {
      return "Start date cannot be in the past.";
    }
    return "";
  };

  const getRangeEndDateError = (startStr: string, endStr: string) => {
    if (!endStr) {
      return "End date is required.";
    }
    if (startStr && endStr < startStr) {
      return "End date cannot be before start date.";
    }
    return "";
  };

  useEffect(() => {
    if (isOpen && user?.brokerage) {
      loadTeam();
    }
  }, [isOpen, user]);

  async function loadTeam() {
    if (!user?.brokerage) return;
    setLoadingMembers(true);
    try {
      const roster = await getTeamMembers(user.brokerage);
      // Filter out logged in user as they are already the owner
      const filtered = (roster || []).filter((m: any) => m.id !== user.id);
      setTeamMembers(filtered);
      if (filtered.length > 0) {
        setSelectedHostId(filtered[0].id);
      } else {
        setUseCustomHost(true);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch team roster.");
    } finally {
      setLoadingMembers(false);
    }
  }

  async function handleAssign() {
    if (!listing || !user) return;
    
    let targetHostEmail = "";
    let targetHostName = "";
    let targetHostId = "";

    if (useCustomHost) {
      setCustomHostNameTouched(true);
      setCustomHostEmailTouched(true);

      const nameErr = getHostNameError(customHostName);
      if (nameErr) {
        toast.error(nameErr);
        return;
      }

      const emailErr = getHostEmailError(customHostEmail);
      if (emailErr) {
        toast.error(emailErr);
        return;
      }

      targetHostEmail = customHostEmail.trim();
      targetHostName = customHostName.trim();
      targetHostId = `invited_${Date.now()}`;
    } else {
      const selectedMember = teamMembers.find(m => m.id === selectedHostId);
      if (!selectedMember) {
        toast.error("Please select a hosting agent from the roster first.");
        return;
      }
      targetHostEmail = selectedMember.email;
      targetHostName = selectedMember.name;
      targetHostId = selectedMember.id;
    }

    // Schedule validations
    if (scheduleType === "one_event") {
      setOneEventDateTouched(true);
      const dateErr = getOneEventDateError(oneEventDate);
      if (dateErr) {
        toast.error(dateErr);
        return;
      }
    } else if (scheduleType === "date_range") {
      setRangeStartDateTouched(true);
      setRangeEndDateTouched(true);
      const startErr = getRangeStartDateError(rangeStartDate);
      if (startErr) {
        toast.error(startErr);
        return;
      }
      const endErr = getRangeEndDateError(rangeStartDate, rangeEndDate);
      if (endErr) {
        toast.error(endErr);
        return;
      }
    }

    setSaving(true);
    try {
      const assignmentPayload = {
        id: crypto.randomUUID(),
        listingId: listing.id,
        listingAddress: listing.address,
        listingPrice: listing.price || 0,
        listingOwnerAgentId: user.id,
        listingOwnerAgentName: user.name || "Listing Agent",
        listingOwnerAgentEmail: user.email,
        hostingAgentId: targetHostId,
        hostingAgentName: targetHostName,
        hostingAgentEmail: targetHostEmail,
        permissions,
        leadRule,
        lenderRule,
        schedule: {
          type: scheduleType,
          oneEventDate: scheduleType === 'one_event' ? oneEventDate : null,
          rangeStartDate: scheduleType === 'date_range' ? rangeStartDate : null,
          rangeEndDate: scheduleType === 'date_range' ? rangeEndDate : null,
        },
        createdAt: Date.now(),
        isAccepted: true
      };

      // 1. Save to Firestore
      await addDoc(collection(db, "shared_listing_assignments"), assignmentPayload);

      // 2. Log in system audit trails
      await addDoc(collection(db, "system_logs"), {
        type: "SHARED_LISTING_ASSIGNMENT",
        message: `Listing at ${listing.address} assigned to host ${targetHostName} (${targetHostEmail}) by ${user.email}`,
        timestamp: serverTimestamp(),
        details: assignmentPayload
      });

      // 3. Send email notification to host agent
      try {
        const emailSubject = `🏠 Open House hosting assignment for: ${listing.address}`;
        const emailBody = `
          <div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; background-color: #ffffff;">
            <div style="text-align: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px;">
              <h1 style="color: #155dfc; font-size: 26px; font-weight: 800; margin: 0; text-transform: uppercase;">AI Open House Connect</h1>
              <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Cross-Hosted Open House Assignment Notification</p>
            </div>
            
            <p style="font-size: 16px; color: #334155;">Hello <strong>${targetHostName}</strong>,</p>
            <p style="font-size: 15px; color: #334155; line-height: 1.6;">
              <strong>${user.name || "The listing owner"}</strong> has assigned you to host an open house for their active property listing. Here are the core assignment properties and permissions:
            </p>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; border-b: 1px solid #f1f5f9; padding-bottom: 6px;">🏡 Property & Schedule details</h3>
              <table style="width: 100%; font-size: 14px; text-align: left; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: bold; width: 140px;">Address:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${listing.address}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Listing Owner:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${user.name} (${user.email})</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Schedule Code:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: bold; text-transform: uppercase;">
                    ${scheduleType.replace("_", " ")} ${scheduleType === 'one_event' ? `(${oneEventDate})` : scheduleType === 'date_range' ? `(${rangeStartDate} to ${rangeEndDate})` : ''}
                  </td>
                </tr>
              </table>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; border-b: 1px solid #f1f5f9; padding-bottom: 6px;">⚙️ Host Permissions & Lead Routing</h3>
              <ul style="font-size: 14px; color: #334155; padding-left: 20px; line-height: 1.6;">
                <li><strong>PermissionsGranted:</strong> ${Object.entries(permissions).filter(([_, v]) => v).map(([k]) => k.replace(/([A-Z])/g, ' $1').trim().toLowerCase()).join(", ")}</li>
                <li><strong>Lead Capture Rule:</strong> ${leadRule === 'host_receives' ? "You receive lead details immediately" : leadRule === 'owner_visibility_only' ? "Listing owner retains leads, you receive helper access" : "Team administration retains visibility"}</li>
                <li><strong>Lender Alignment Rule:</strong> ${lenderRule === 'listing_lender' ? "Use Owner's Paired Lender" : lenderRule === 'host_lender' ? "Use Your Paired Lender" : lenderRule === 'no_lender' ? "No mortgage questions" : "Global team/brokerage override pre-empts matches"}</li>
              </ul>
            </div>

            <p style="font-size: 15px; color: #334155; line-height: 1.6;">
              This shared listing will show up instantly in your dashboard so you can launch the digital welcome kiosk or register offline attendees smoothly.
            </p>

            <div style="text-align: center; margin-top: 32px;">
              <a href="${window.location.origin}/app/openhouses" style="display: inline-block; background-color: #155dfc; color: #ffffff; font-weight: bold; font-size: 15px; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 10px rgba(21, 93, 252, 0.25);">Manage & Launch Open House</a>
            </div>

            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
              You received this automated notification because your email is registered with ${user.brokerage || "AI Open House Connect Group"}.
            </p>
          </div>
        `;

        await sendEmail({
          to: targetHostEmail,
          subject: emailSubject,
          html: emailBody,
          text: `You have been assigned to host an open house at ${listing.address} by ${user.name || user.email}.`
        });
      } catch (emailErr) {
        console.error("Assignment email send exception: ", emailErr);
      }

      toast.success(`✨ Shared Listing successfully assigned to ${targetHostName}!`);
      
      // Update local storage so Listings.tsx or OpenHousesAgent.tsx can quickly reconcile it if cached
      try {
        const stored = localStorage.getItem("shared_listing_assignments");
        const assignments = stored ? JSON.parse(stored) : [];
        assignments.unshift(assignmentPayload);
        localStorage.setItem("shared_listing_assignments", JSON.stringify(assignments));
      } catch (lsErr) {}

      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(`Assignment failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 border border-slate-200">
        <DialogHeader className="border-b pb-4 mb-4">
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Shared Listing Setup Workflow
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-2">
            Assign {listing?.address || "this listing"} to another host agent. Configure schedule limits, lead-routing parameters, and active lender overrides.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 text-left">
          {/* Step 1: Host details */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Select Hosting Agent</label>
              <button 
                type="button"
                onClick={() => setUseCustomHost(!useCustomHost)}
                className="text-xs font-bold text-blue-600 hover:underline bg-transparent border-0 cursor-pointer"
              >
                {useCustomHost ? "Choose from Team Roster" : "Invite External/Guest Agent"}
              </button>
            </div>

            {useCustomHost ? (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Host Name</label>
                  <Input 
                    placeholder="E.g. Jennifer Lane" 
                    value={customHostName}
                    onChange={(e) => setCustomHostName(e.target.value)}
                    onBlur={() => setCustomHostNameTouched(true)}
                    className={`text-xs h-9 ${customHostNameTouched && !isChoosingDate && getHostNameError(customHostName) ? "border-red-500 focus-visible:ring-red-500 focus:ring-red-500 focus-visible:border-red-500 focus:border-red-500" : ""}`}
                  />
                  {customHostNameTouched && !isChoosingDate && getHostNameError(customHostName) && (
                    <p className="text-[10px] text-red-500 font-medium mt-1">{getHostNameError(customHostName)}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Host Email</label>
                  <Input 
                    type="email"
                    placeholder="jennifer@example.com"
                    value={customHostEmail}
                    onChange={(e) => setCustomHostEmail(e.target.value)}
                    onBlur={() => setCustomHostEmailTouched(true)}
                    className={`text-xs h-9 ${customHostEmailTouched && getHostEmailError(customHostEmail) ? "border-red-500 focus-visible:ring-red-500 focus:ring-red-500 focus-visible:border-red-500 focus:border-red-500" : ""}`}
                  />
                  {customHostEmailTouched && getHostEmailError(customHostEmail) && (
                    <p className="text-[10px] text-red-500 font-medium mt-1">{getHostEmailError(customHostEmail)}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                {loadingMembers ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    Querying team membership roster...
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-xs text-slate-500 py-2">
                    No other agents found in your team roster. Please use "Invite External/Guest Agent" option above.
                  </div>
                ) : (
                  <div>
                    <select 
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
                      value={selectedHostId}
                      onChange={(e) => setSelectedHostId(e.target.value)}
                    >
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Permissions */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">2. Host Event-Level Permissions</label>
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-start gap-2.5">
                <input 
                  type="checkbox" 
                  id="p-launch" 
                  checked={permissions.canLaunchOpenHouse} 
                  onChange={(e) => setPermissions(p => ({ ...p, canLaunchOpenHouse: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer mt-0.5"
                />
                <label htmlFor="p-launch" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                  Can launch kiosk screen
                </label>
              </div>

              <div className="flex items-start gap-2.5">
                <input 
                  type="checkbox" 
                  id="p-edit" 
                  checked={permissions.canEditEventQuestions} 
                  onChange={(e) => setPermissions(p => ({ ...p, canEditEventQuestions: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer mt-0.5"
                />
                <label htmlFor="p-edit" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                  Can customize Q&A questions
                </label>
              </div>

              <div className="flex items-start gap-2.5">
                <input 
                  type="checkbox" 
                  id="p-brand" 
                  checked={permissions.canUseHostBranding} 
                  onChange={(e) => setPermissions(p => ({ ...p, canUseHostBranding: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer mt-0.5"
                />
                <label htmlFor="p-brand" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                  Use host branding on kiosk
                </label>
              </div>

              <div className="flex items-start gap-2.5">
                <input 
                  type="checkbox" 
                  id="p-notes" 
                  checked={permissions.canAddNotes} 
                  onChange={(e) => setPermissions(p => ({ ...p, canAddNotes: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer mt-0.5"
                />
                <label htmlFor="p-notes" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                  Can add private agent notes
                </label>
              </div>

              <div className="flex items-start gap-2.5 col-span-2">
                <input 
                  type="checkbox" 
                  id="p-followup" 
                  checked={permissions.canFollowUpWithLeads} 
                  onChange={(e) => setPermissions(p => ({ ...p, canFollowUpWithLeads: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer mt-0.5"
                />
                <label htmlFor="p-followup" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                  Can follow up directly with incoming attendees
                </label>
              </div>
            </div>
          </div>

          {/* Grid of Lead Rules and Lender Rules */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Step 3: Lead Routing rules */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">3. Lead Ownership / Rules</label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input 
                    type="radio" 
                    name="leadRule" 
                    value="host_receives" 
                    checked={leadRule === "host_receives"}
                    onChange={() => setLeadRule("host_receives")}
                    className="text-blue-500 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Host receives lead captures</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input 
                    type="radio" 
                    name="leadRule" 
                    value="owner_visibility_only" 
                    checked={leadRule === "owner_visibility_only"}
                    onChange={() => setLeadRule("owner_visibility_only")}
                    className="text-blue-500 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Owner only, host gets view only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input 
                    type="radio" 
                    name="leadRule" 
                    value="team_admin_all" 
                    checked={leadRule === "team_admin_all"}
                    onChange={() => setLeadRule("team_admin_all")}
                    className="text-blue-500 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Team administrators see all</span>
                </label>
              </div>
            </div>

            {/* Step 4: Lender override rules */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">4. Lender Pairing Options</label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input 
                    type="radio" 
                    name="lenderRule" 
                    value="listing_lender" 
                    checked={lenderRule === "listing_lender"}
                    onChange={() => setLenderRule("listing_lender")}
                    className="text-blue-500 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Use Listing Owner's Lender</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input 
                    type="radio" 
                    name="lenderRule" 
                    value="host_lender" 
                    checked={lenderRule === "host_lender"}
                    onChange={() => setLenderRule("host_lender")}
                    className="text-blue-500 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Use Host's Preferred Lender</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input 
                    type="radio" 
                    name="lenderRule" 
                    value="team_override" 
                    checked={lenderRule === "team_override"}
                    onChange={() => setLenderRule("team_override")}
                    className="text-blue-500 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Use Team Policy Override</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input 
                    type="radio" 
                    name="lenderRule" 
                    value="no_lender" 
                    checked={lenderRule === "no_lender"}
                    onChange={() => setLenderRule("no_lender")}
                    className="text-blue-500 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>No Lender (Hides Opt-In)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Step 5: Schedule rules */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">5. Set Shared Schedule Access</label>
            <div className="p-4 bg-slate-50 border rounded-xl space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                  <input 
                    type="radio" 
                    name="sched" 
                    value="one_event" 
                    checked={scheduleType === "one_event"} 
                    onChange={() => setScheduleType("one_event")}
                    className="text-blue-500 cursor-pointer"
                  />
                  <span>One Specific Event</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                  <input 
                    type="radio" 
                    name="sched" 
                    value="date_range" 
                    checked={scheduleType === "date_range"} 
                    onChange={() => setScheduleType("date_range")}
                    className="text-blue-500 cursor-pointer"
                  />
                  <span>Fixed Date Range</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                  <input 
                    type="radio" 
                    name="sched" 
                    value="reusable" 
                    checked={scheduleType === "reusable"} 
                    onChange={() => setScheduleType("reusable")}
                    className="text-blue-500 cursor-pointer"
                  />
                  <span>Reusable Access (Always Open)</span>
                </label>
              </div>

              {scheduleType === "one_event" && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium shrink-0">Event Date:</span>
                    <Input 
                      type="date" 
                      value={oneEventDate} 
                      min={getTodayStr()}
                      onChange={(e) => setOneEventDate(e.target.value)} 
                      onFocus={() => setIsChoosingDate(true)}
                      onBlur={() => {
                        setOneEventDateTouched(true);
                        setTimeout(() => setIsChoosingDate(false), 150);
                      }}
                      className={`text-xs max-w-[160px] h-9 ${oneEventDateTouched && getOneEventDateError(oneEventDate) ? "border-red-500" : ""}`}
                    />
                  </div>
                  {oneEventDateTouched && getOneEventDateError(oneEventDate) && (
                    <p className="text-[10px] text-red-500 font-medium">{getOneEventDateError(oneEventDate)}</p>
                  )}
                </div>
              )}

              {scheduleType === "date_range" && (
                <div className="space-y-1.5">
                  <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium shrink-0">Start Date:</span>
                      <Input 
                        type="date" 
                        value={rangeStartDate} 
                        min={getTodayStr()}
                        onChange={(e) => setRangeStartDate(e.target.value)} 
                        onFocus={() => setIsChoosingDate(true)}
                        onBlur={() => {
                          setRangeStartDateTouched(true);
                          setTimeout(() => setIsChoosingDate(false), 150);
                        }}
                        className={`text-xs max-w-[140px] h-9 ${rangeStartDateTouched && getRangeStartDateError(rangeStartDate) ? "border-red-500" : ""}`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium shrink-0">End Date:</span>
                      <Input 
                        type="date" 
                        value={rangeEndDate} 
                        min={rangeStartDate || getTodayStr()}
                        onChange={(e) => setRangeEndDate(e.target.value)} 
                        onFocus={() => setIsChoosingDate(true)}
                        onBlur={() => {
                          setRangeEndDateTouched(true);
                          setTimeout(() => setIsChoosingDate(false), 150);
                        }}
                        className={`text-xs max-w-[140px] h-9 ${rangeEndDateTouched && getRangeEndDateError(rangeStartDate, rangeEndDate) ? "border-red-500" : ""}`}
                      />
                    </div>
                  </div>
                  {rangeStartDateTouched && getRangeStartDateError(rangeStartDate) && (
                    <p className="text-[10px] text-red-500 font-medium">{getRangeStartDateError(rangeStartDate)}</p>
                  )}
                  {rangeEndDateTouched && getRangeEndDateError(rangeStartDate, rangeEndDate) && (
                    <p className="text-[10px] text-red-500 font-medium">{getRangeEndDateError(rangeStartDate, rangeEndDate)}</p>
                  )}
                </div>
              )}

              {scheduleType === "reusable" && (
                <div className="text-[11px] text-emerald-700 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 flex items-center gap-1.5 font-medium">
                  <Info className="h-4 w-4 text-emerald-600 shrink-0" />
                  No expiration applied. The assigned hosting agent can run unlimited open house kiosks for this property.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal actions */}
        <div className="flex gap-3 justify-end pt-5 border-t mt-6">
          <Button variant="outline" onClick={onClose} disabled={saving} className="font-semibold text-xs h-10 px-5">
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={saving} 
            className="bg-blue-600 hover:bg-blue-700 font-bold text-xs h-10 px-5 text-white flex items-center gap-1.5 shadow-md shadow-blue-100"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assigning Listing...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Confirm & Assign Host
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
