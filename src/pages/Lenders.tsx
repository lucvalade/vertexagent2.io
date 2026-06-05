import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  Building2, 
  Users, 
  CreditCard, 
  Sparkles, 
  Bot, 
  Clipboard, 
  Link2, 
  CheckCircle2, 
  ShieldCheck, 
  FileCheck, 
  Share2, 
  FolderLock, 
  Download, 
  Calendar,
  Layers,
  ChevronRight,
  Database,
  ArrowUpRight,
  UserCheck,
  CheckCircle,
  HelpCircle,
  BadgeCent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { collection, query, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type SubTier = "solo" | "growth" | "enterprise";

export default function Lenders() {
  const { user } = useAuth();
  
  // Profile settings
  const [lenderName, setLenderName] = useState("Jonathan Finch");
  const [lenderCompany, setLenderCompany] = useState("Alpha Preferred Mortgages");
  const [nmlsId, setNmlsId] = useState("NMLS #8849201");
  const [lenderBio, setLenderBio] = useState("With over 15 years specializing in high-net-worth jumbo loans, bridge financing, and luxury real estate acquisitions.");
  const [licenseRegion, setLicenseRegion] = useState("California & New York State");
  
  // Billing status states
  const [subscriptionTier, setSubscriptionTier] = useState<SubTier>("growth");
  const [isSubscribed, setIsSubscribed] = useState(true);
  
  // Pairing configurations
  const [pairingLink, setPairingLink] = useState("");
  const [pairedAgents, setPairedAgents] = useState([
    { id: "agent_1", name: "Sarah Jenkins", email: "sarah@jenkinsluxury.com", activeListings: 4, joinedAt: "2026-02-14" },
    { id: "agent_2", name: "Michael Vance", email: "m.vance@primebrokerages.com", activeListings: 3, joinedAt: "2026-03-01" },
    { id: "agent_3", name: "Elena Rostova", email: "elena@rostovagroup.com", activeListings: 5, joinedAt: "2026-05-18" }
  ]);
  const [newAgentEmail, setNewAgentEmail] = useState("");

  // Leads & webhooks
  const [webhookUrl, setWebhookUrl] = useState("https://api.preferredlender.com/v1/leads/sync");
  const [leads, setLeads] = useState([
    { id: "lead_120", name: "Marcus Brody", email: "marcus.brody@museumcorp.org", phone: "+1 (310) 902-1144", listing: "888 Bel Air Road", optInTime: "2026-06-02 11:30", verified: "Yes (TCPA Logged)", status: "Sent to Webhook" },
    { id: "lead_122", name: "Victoria Sterling", email: "sterling.v@luxuryvistas.com", phone: "+1 (212) 556-9021", listing: "740 Park Avenue", optInTime: "2026-06-02 14:15", verified: "Yes (TCPA Logged)", status: "Sent to Webhook" }
  ]);

  // Office Overrides State
  const [overridePriority, setOverridePriority] = useState<"listing" | "office" | "agent" | "default">("listing");
  const [officeEnforced, setOfficeEnforced] = useState(false);

  useEffect(() => {
    // Generate static secret pairing link securely for display mockups
    if (user) {
      setPairingLink(`${window.location.origin}/register?lender_partner=${user.id || "lend_883"}`);
    }
  }, [user]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pairingLink);
    toast.success("✨ Secret lender pairing link copied to clipboard. Share with agents to enable instant inventory pairing!");
  };

  const handleInviteAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentEmail || !newAgentEmail.includes("@")) {
      toast.error("Please enter a valid agent email address.");
      return;
    }
    toast.success(`✨ Invite dispatched successfully to ${newAgentEmail}. They will be paired immediately upon accepting!`);
    setNewAgentEmail("");
  };

  const handleTriggerWebhookTest = () => {
    if (!webhookUrl) {
      toast.error("Endpoint URL is required to trigger sync simulation.");
      return;
    }
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: "Contacting webhook endpoint...",
        success: "🚀 Simulated API Response code 200 OK: Secured payload delivered successfully!",
        error: "Sync test failed."
      }
    );
  };

  const handleSaveProfile = () => {
    toast.success("✨ Lender profile compliance record configured successfully!");
  };

  // AI Actions Mockup matching specific Sora helper lines/prompts
  const handleAiGenBio = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: "Sora is drafting lender bio...",
        success: () => {
          setLenderBio(`Senior Mortgage Specialist at ${lenderCompany} with deep expertise in custom financing solutions. Specializing in bespoke jumbo, super-prime acquisitions, bridge funds, and asset-depletion qualifications tailored for high-volume broker teams.`);
          return "✨ Refined bio updated in premium luxury-tonality.";
        }
      }
    );
  };

  const handleAiOnboardingInvite = () => {
    const inviteMsg = `Hi [Agent Name], let's pair! I've activated my VertexAgent billing subscription, which enables premium co-op marketing widgets, touchless QR signage features, and direct rate calculations on your listings. Here is my secret invite link to pair instantly: ${pairingLink}`;
    navigator.clipboard.writeText(inviteMsg);
    toast.success("✨ AI Onboarding Invite message copied! Ready to paste into email or SMS.");
  };

  const handleSimulateSubscription = () => {
    setIsSubscribed(!isSubscribed);
    toast.success(isSubscribed ? "Subscription paused. Enhanced listing widgets will be hidden." : "✨ Billing reactivated! Interactive co-op modules enabled.");
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            <Building2 className="h-7 w-7 text-blue-600" />
            Lender Co-Op Partner Program
          </h1>
          <p className="text-sm text-slate-500">
            Activate subscription tiers, copy your pairing link, examine opt-in mortgage leads, and control compliance parameters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 ${
            isSubscribed ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isSubscribed ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            {isSubscribed ? "BILLING ACTIVE" : "SUBSCRIPTION OUTSTANDING"}
          </span>
          <Button 
            variant="outline" 
            onClick={handleSimulateSubscription}
            className="text-xs h-9 font-bold hover:bg-slate-50 cursor-pointer"
          >
            {isSubscribed ? "Simulate Failed Billing" : "Acquire Live Access"}
          </Button>
        </div>
      </div>

      {/* Primary Layout */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left column: Profiles and pricing */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Subscription Tiers */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4" />
                Co-Op Pricing Tiers
              </CardTitle>
              <CardDescription className="text-xs">
                Select your partnership model. Lenders must be active paid members to pair.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-left">
              {[
                { id: "solo", name: "Solo Lender", d: "1 agent pairing, listing rate support", p: "$99/mo" },
                { id: "growth", name: "Growth Lender", d: "Up to 5 agents, webhook syncing, priority leads", p: "$249/mo" },
                { id: "enterprise", name: "Enterprise Branch", d: "Unlimited agent pairing, office level overrides", p: "$499/mo" },
              ].map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => {
                    setSubscriptionTier(tier.id as SubTier);
                    setIsSubscribed(true);
                    toast.success(`Switched to ${tier.name} pricing tier!`);
                  }}
                  className={`p-3 border rounded-xl flex items-center justify-between transition-all w-full select-none cursor-pointer text-left ${
                    subscriptionTier === tier.id && isSubscribed
                      ? "border-blue-600 bg-blue-50/50 shadow-sm"
                      : "border-slate-200 hover:bg-slate-50/60"
                  }`}
                >
                  <div>
                    <p className="font-extrabold text-xs text-slate-950">{tier.name}</p>
                    <p className="text-[10px] text-slate-500 font-normal leading-normal">{tier.d}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 font-mono">{tier.p}</span>
                    {subscriptionTier === tier.id && isSubscribed && (
                      <p className="text-[8px] text-blue-600 font-bold uppercase mt-1">ACTIVE</p>
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Profile fields */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-black uppercase text-slate-900 tracking-wider">
                LENDER COMPLIANCE PROFILE
              </CardTitle>
              <CardDescription className="text-xs">
                Visible to paired buyers and agent flyer widgets.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4 text-left">
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Lender Name</Label>
                <Input value={lenderName} onChange={(e) => setLenderName(e.target.value)} className="h-9 text-xs font-semibold rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Company Name</Label>
                <Input value={lenderCompany} onChange={(e) => setLenderCompany(e.target.value)} className="h-9 text-xs rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">NMLS Identifier ID</Label>
                <Input value={nmlsId} onChange={(e) => setNmlsId(e.target.value)} className="h-9 text-xs text-slate-700 font-mono rounded-xl" />
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Lender Biography Summary</Label>
                  <button 
                    onClick={handleAiGenBio}
                    className="text-[9px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    AI Writer
                  </button>
                </div>
                <textarea 
                  value={lenderBio} 
                  onChange={(e) => setLenderBio(e.target.value)} 
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl leading-relaxed text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 h-24"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Licensed Jurisdictions</Label>
                <Input value={licenseRegion} onChange={(e) => setLicenseRegion(e.target.value)} className="h-9 text-xs rounded-xl" />
              </div>

              <Button onClick={handleSaveProfile} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold h-10 rounded-xl text-xs cursor-pointer">
                Save Compliance Records
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Right columns: Lead synchronisation logs + Pairing invitations */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Pairing Link / Invitations */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
              <CardTitle className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-600" />
                ACTIVE AGENT PAIRINGS
              </CardTitle>
              <CardDescription className="text-xs">
                Lenders can accept invitations from agents or share their pairing link to establish a co-op mapping instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              
              {/* Pairing Link Block */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex flex-col sm:flex-row items-center gap-4 text-left">
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-extrabold text-slate-950 uppercase tracking-wider flex items-center gap-1">
                    <Link2 className="h-3.5 w-3.5 text-blue-600" />
                    Your Secret Invite Link
                  </p>
                  <p className="text-[10px] text-slate-500 font-normal">
                    Agents who register or login using this link are instantly assigned to your co-op panel.
                  </p>
                  <div className="text-[10.5px] bg-white border border-slate-200 font-mono px-3 py-1 text-slate-600 select-all overflow-x-auto rounded">
                    {pairingLink}
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto self-stretch sm:self-center justify-end">
                  <Button onClick={handleCopyLink} size="sm" className="bg-white hover:bg-slate-100 text-slate-800 border text-xs font-bold rounded-xl h-10 flex-1 sm:flex-none cursor-pointer">
                    Copy Link
                  </Button>
                  <Button onClick={handleAiOnboardingInvite} size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 text-xs font-bold gap-1 p-0.5 max-w-[120px] mx-auto sm:mx-0">
                    <Sparkles className="h-3 w-3" />
                    Draft Invite
                  </Button>
                </div>
              </div>

              {/* Paired Agents Grid lists */}
              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 text-left font-mono">Paired Agents Directory</p>
                
                <div className="border rounded-2xl overflow-hidden divide-y">
                  {pairedAgents.map((agent) => (
                    <div key={agent.id} className="p-4 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                          {agent.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-900 leading-none">{agent.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1 leading-none">{agent.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-x-6 w-full sm:w-auto font-mono text-[10px]">
                        <div>
                          <span className="text-slate-400">Inventory:</span>
                          <span className="text-slate-800 font-black ml-1.5">{agent.activeListings} listings</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Paired:</span>
                          <span className="text-slate-600 ml-1.5">{agent.joinedAt}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setPairedAgents(prev => prev.filter(a => a.id !== agent.id));
                            toast.info(`Disconnected co-op relationship with agent ${agent.name}`);
                          }}
                          className="text-red-500 hover:text-red-600 hover:underline cursor-pointer font-sans text-[10px] font-extrabold uppercase leading-none"
                        >
                          Unpair
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct invitation input form */}
              <form onSubmit={handleInviteAgent} className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="flex-1 space-y-1 text-left">
                  <Input 
                    placeholder="Enter agent email address to launch invite..." 
                    value={newAgentEmail}
                    onChange={(e) => setNewAgentEmail(e.target.value)}
                    type="email"
                    className="h-10 text-xs sm:text-sm rounded-xl border-slate-200"
                  />
                </div>
                <Button type="submit" className="bg-slate-950 hover:bg-slate-800 text-white font-extrabold h-10 rounded-xl px-5 text-xs cursor-pointer">
                  Request Relationship Assignment
                </Button>
              </form>

            </CardContent>
          </Card>

          {/* Consent Leads Checkbox & Routing webhook sync */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
              <CardTitle className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                MORTGAGE LEAD INTEGRATION (CONSENT LOCKED)
              </CardTitle>
              <CardDescription className="text-xs">
                Curb Hero model compliance: Leads are strictly sent to lender partner database ONLY when they explicitly check interest on mortgage rate option checkbox guidelines.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              
              {/* Leads dashboard list log */}
              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 text-left font-mono">Consenting Buyer Leads Pipeline</p>
                
                <div className="border rounded-2xl overflow-hidden divide-y divide-slate-100 font-sans">
                  {leads.map((lead) => (
                    <div key={lead.id} className="p-4 bg-white hover:bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900 leading-none">{lead.name}</span>
                          <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                            {lead.verified}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono">
                          {lead.email} • {lead.phone}
                        </p>
                        <p className="text-[10.5px] text-slate-500">
                          Captured at open house: <strong className="text-slate-700 font-semibold">{lead.listing}</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[10px] leading-none self-stretch sm:self-center justify-between sm:justify-start">
                        <div className="text-right">
                          <p className="text-slate-400">Consent Log:</p>
                          <p className="text-slate-600 mt-1 font-semibold">{lead.optInTime}</p>
                        </div>
                        <span className="px-2 py-1 text-[8.5px] font-mono leading-none font-bold bg-blue-50 text-blue-600 rounded">
                          {lead.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Webhook Sync configuration */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 text-left space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-slate-950 uppercase tracking-wider flex items-center gap-1">
                    <Database className="h-3.5 w-3.5 text-blue-600" />
                    LENDER CRM WEBHOOK INTEGRATION
                  </p>
                  <p className="text-[10.5px] text-slate-500">
                    Instantly sync leads with consent flags straight into TotalExpert, Floify, Encompass, or custom CRM solutions.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input 
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://yourlendingcrm.com/api/v1/webhook"
                    className="flex-1 bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
                  />
                  <Button 
                    onClick={handleTriggerWebhookTest}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold h-10 px-5 text-xs rounded-xl hover:shadow-sm cursor-pointer"
                  >
                    Send Simulation Payload
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Broker/Office Override controls */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden text-left">
            <CardHeader className="bg-slate-50/50 border-b border-sidebar p-5">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <FolderLock className="h-4 w-4 text-emerald-600" />
                Office Cascading & Routing Precedence
              </CardTitle>
              <CardDescription className="text-xs">
                Configure cascading priorities representing teams or regional brokerage rules. Correct rules fallback hierarchy:
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              
              <div className="relative pl-6 border-l-2 border-blue-500/30 space-y-4">
                
                {/* 1. Listing override */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 h-4 w-4 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-[8.5px] uppercase font-mono">1</div>
                  <h4 className="text-xs font-bold text-slate-950 leading-tight">Listing-Level Specific Override</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Agents can disable partnered lenders or swap lenders individually on a given listing, hiding or showing custom rate checkboxes.</p>
                </div>

                {/* 2. Office level */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 h-4 w-4 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-[8.5px] uppercase font-mono">2</div>
                  <h4 className="text-xs font-bold text-slate-950 leading-tight">Brokerage Office/Team Preferred Selection Override</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Broker administrators can mandate global corporate lender defaults on all listings for subordinate agents automatically.</p>
                </div>

                {/* 3. Agent level */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 h-4 w-4 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-[8.5px] uppercase font-mono">3</div>
                  <h4 className="text-xs font-bold text-slate-950 leading-tight">Agent Preferred Partner Pairing</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Active relationship mappings established through agent invitations or personal QR registers.</p>
                </div>

                {/* 4. Default */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 h-4 w-4 bg-zinc-500 text-white rounded-full flex items-center justify-center font-bold text-[8.5px] uppercase font-mono">4</div>
                  <h4 className="text-xs font-bold text-slate-950 leading-tight">Regional Marketplace Default Lender</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Dynamic system assign when no listing, team, or agent preferred preferred records exist.</p>
                </div>

              </div>

              {/* Interactivity controls */}
              <div className="pt-4 border-t grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">Your Preference Level</Label>
                  <select 
                    value={overridePriority}
                    onChange={(e) => {
                      setOverridePriority(e.target.value as any);
                      toast.info(`Updated precedence rules selection schema to ${e.target.value}`);
                    }}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="listing">Listing-level Override Enabled</option>
                    <option value="office">Team/Office Default Enforced</option>
                    <option value="agent">Agent Preferred Assigned Only</option>
                    <option value="default">System Marketplace Default Assignment</option>
                  </select>
                </div>

                <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200/50 cursor-pointer select-none self-end h-10">
                  <input
                    type="checkbox"
                    checked={officeEnforced}
                    onChange={(e) => {
                      setOfficeEnforced(e.target.checked);
                      toast.success(e.target.checked ? "Enforced office override defaults across agent panels!" : "Removed brokerage default enforcement.");
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <div className="text-left leading-tight">
                    <p className="text-xs font-extrabold text-slate-800">Enforce Office Override</p>
                    <p className="text-[9px] text-slate-400">Lock subordinate agent configs.</p>
                  </div>
                </label>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
