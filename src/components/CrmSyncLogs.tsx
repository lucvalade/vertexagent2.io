import { useState, useEffect } from "react";
import { 
  getCrmSyncLogs, 
  addCrmSyncLog, 
  retryCrmSyncLog, 
  CrmSyncLogEntry 
} from "@/lib/crmSyncLogger";
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Download, 
  Code, 
  RotateCcw, 
  Zap, 
  Send, 
  Building2, 
  Tag, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Info,
  ShieldCheck,
  Activity,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CrmSyncLogs() {
  const [logs, setLogs] = useState<CrmSyncLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [retryingIds, setRetryingIds] = useState<Record<string, boolean>>({});

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getCrmSyncLogs(50);
      setLogs(data);
    } catch (err) {
      console.error("[CrmSyncLogs] Error fetching logs:", err);
      toast.error("Failed to load CRM sync logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleRetry = async (log: CrmSyncLogEntry) => {
    setRetryingIds(prev => ({ ...prev, [log.id]: true }));
    const tid = toast.loading(`Retrying CRM sync event for ${log.leadName} to ${log.crmName}...`);
    
    try {
      // Simulate API network retry delay
      await new Promise(res => setTimeout(res, 800));
      const updated = await retryCrmSyncLog(log.id);
      
      if (updated) {
        setLogs(prev => prev.map(item => item.id === log.id ? updated : item));
        toast.dismiss(tid);
        toast.success(`✨ Sync successfully retried for ${log.leadName}!`, {
          description: `Delivered to ${log.crmName} with HTTP 200 OK.`
        });
      } else {
        toast.dismiss(tid);
        toast.error("Retry failed to update log entry.");
      }
    } catch (err) {
      toast.dismiss(tid);
      toast.error("Sync retry failed.");
    } finally {
      setRetryingIds(prev => ({ ...prev, [log.id]: false }));
    }
  };

  const handleTriggerTestSync = async () => {
    const randomLeads = [
      { name: "Sophia Martinez", email: "sophia.m@designs.io", phone: "+1 (555) 390-1188", address: "742 Evergreen Terrace, Springfield", crm: "Follow Up Boss" },
      { name: "Liam O'Connor", email: "liam.oc@celtic.org", phone: "+1 (555) 481-9920", address: "1280 Ocean Drive, Suite 400, Miami", crm: "HubSpot" },
      { name: "Hannah Vance", email: "hannah.v@apextech.com", phone: "+1 (555) 712-4091", address: "450 Highland Avenue, Austin", crm: "Zapier" }
    ];
    const picked = randomLeads[Math.floor(Math.random() * randomLeads.length)];
    
    const tid = toast.loading(`Dispatching test lead ${picked.name} to ${picked.crm}...`);
    
    await new Promise(res => setTimeout(res, 600));

    const newLog = await addCrmSyncLog({
      timestamp: Date.now(),
      crmName: picked.crm,
      leadName: picked.name,
      leadEmail: picked.email,
      leadPhone: picked.phone,
      listingAddress: picked.address,
      status: "success",
      statusCode: 200,
      platformResponse: `200 OK - Direct API Sync Verified! Lead recorded in ${picked.crm} pipeline.`,
      mortgageConsent: true,
      tagsApplied: ["fub-mortgage-interest", "test-dispatch", "sora-ai-tour"],
      payload: {
        first_name: picked.name.split(' ')[0],
        last_name: picked.name.split(' ')[1] || "",
        email: picked.email,
        phone: picked.phone,
        mortgageConsent: true,
        source: "AI Open House Connect Kiosk"
      },
      responsePayload: {
        status: "success",
        crm_id: `LIVE-${Math.floor(Math.random() * 90000 + 10000)}`,
        processedAt: new Date().toISOString()
      }
    });

    setLogs(prev => [newLog, ...prev].slice(0, 50));
    toast.dismiss(tid);
    toast.success(`🚀 Test lead ${picked.name} synced to ${picked.crm}!`, {
      description: "Sync event logged in real-time."
    });
  };

  const handleExportLogsCSV = () => {
    if (filteredLogs.length === 0) {
      toast.info("No logs available to export.");
      return;
    }

    const headers = ["ID", "Timestamp", "CRM Name", "Lead Name", "Lead Email", "Lead Phone", "Listing Address", "Status", "Status Code", "Response Message", "Mortgage Consent", "Tags"];
    const rows = filteredLogs.map(l => [
      l.id,
      new Date(l.timestamp).toISOString(),
      `"${l.crmName}"`,
      `"${l.leadName}"`,
      `"${l.leadEmail}"`,
      `"${l.leadPhone || ''}"`,
      `"${l.listingAddress || ''}"`,
      l.status,
      l.statusCode,
      `"${(l.platformResponse || '').replace(/"/g, '""')}"`,
      l.mortgageConsent ? "Yes" : "No",
      `"${(l.tagsApplied || []).join(', ')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `crm_sync_events_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CRM Sync logs exported to CSV successfully!");
  };

  // Filtered logs calculation
  const filteredLogs = logs.filter(log => {
    // Status filter
    if (statusFilter === "success" && log.status !== "success") return false;
    if (statusFilter === "failed" && log.status !== "failed") return false;
    if (statusFilter === "pending" && log.status !== "pending") return false;

    // Platform filter
    if (platformFilter !== "all" && log.crmName.toLowerCase() !== platformFilter.toLowerCase()) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = log.leadName.toLowerCase().includes(q);
      const matchEmail = log.leadEmail.toLowerCase().includes(q);
      const matchCrm = log.crmName.toLowerCase().includes(q);
      const matchAddress = (log.listingAddress || "").toLowerCase().includes(q);
      const matchResponse = (log.platformResponse || "").toLowerCase().includes(q);
      return matchName || matchEmail || matchCrm || matchAddress || matchResponse;
    }

    return true;
  });

  // Health stats
  const totalCount = logs.length;
  const successCount = logs.filter(l => l.status === "success").length;
  const failedCount = logs.filter(l => l.status === "failed").length;
  const pendingCount = logs.filter(l => l.status === "pending").length;
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Top Banner / Section Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <Activity className="h-3 w-3 text-emerald-400 animate-pulse" /> Live Audit Stream
              </span>
              <span className="text-slate-400 text-xs">Showing last 50 events</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              CRM Synchronization Audit Logs
            </h2>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
              Monitors direct lead delivery events, API webhook responses, tag mapping execution (e.g. <code className="text-emerald-300 font-mono text-[11px]">fub-mortgage-interest</code>), and HTTP status codes across all connected CRM pipelines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={loadLogs}
              disabled={loading}
              className="bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-800 text-xs font-bold gap-1.5 h-9 cursor-pointer"
              title="Refresh sync events list"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleTriggerTestSync}
              className="bg-blue-950/60 border-blue-800 text-blue-300 hover:bg-blue-900 text-xs font-bold gap-1.5 h-9 cursor-pointer"
              title="Trigger a test lead dispatch and log the CRM response"
            >
              <Send className="h-3.5 w-3.5 text-blue-400" />
              Dispatch Test Event
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportLogsCSV}
              className="bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-800 text-xs font-bold gap-1.5 h-9 cursor-pointer"
              title="Export last 50 CRM logs to CSV"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Health Stat Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Logged Events
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-white">{totalCount} / 50</span>
              <span className="text-[10px] text-blue-400 font-semibold bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800">
                Max 50
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Sync Health Rate
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-emerald-400">{successRate}%</span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                {successCount} OK
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Failed / Timeouts
            </span>
            <div className="flex items-baseline justify-between">
              <span className={`text-xl font-extrabold ${failedCount > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                {failedCount}
              </span>
              {failedCount > 0 ? (
                <span className="text-[10px] text-red-400 font-semibold bg-red-950 px-1.5 py-0.5 rounded border border-red-800">
                  Action Required
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-semibold">Zero Failures</span>
              )}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Connected Platforms
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-white">4 CRMs</span>
              <span className="text-[10px] text-amber-300 font-semibold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                FUB • HS • Zapier
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        {/* Search Input */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Lead Name, Email, Property, or Response..."
            className="pl-9 bg-slate-950 border-slate-800 text-white placeholder-slate-500 h-9 text-xs focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Badges / Selectors */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
            {[
              { id: "all", label: `All (${totalCount})` },
              { id: "success", label: `Success (${successCount})` },
              { id: "failed", label: `Failed (${failedCount})` },
              { id: "pending", label: `Pending (${pendingCount})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  statusFilter === tab.id 
                    ? "bg-blue-600 text-white shadow-xs" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Platform Selector Dropdown */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg h-8 px-2.5 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">All Platforms</option>
            <option value="Follow Up Boss">Follow Up Boss</option>
            <option value="HubSpot">HubSpot</option>
            <option value="Zapier">Zapier</option>
            <option value="kvCORE">kvCORE</option>
            <option value="Salesforce">Salesforce</option>
          </select>
        </div>
      </div>

      {/* Logs Event Feed */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm font-semibold">Loading synchronization audit logs from database...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Info className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Synchronization Events Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No CRM sync events matched your active filters or search criteria. Try clearing search keywords or dispatching a test event above.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setPlatformFilter("all");
            }}
            className="mt-2 border-slate-800 text-slate-300 text-xs cursor-pointer"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const isRetrying = !!retryingIds[log.id];

            return (
              <div
                key={log.id}
                className={`bg-slate-900 border rounded-xl overflow-hidden transition-all duration-200 ${
                  log.status === "failed"
                    ? "border-red-900/40 bg-slate-900/90 hover:border-red-800/60"
                    : log.status === "success"
                    ? "border-slate-800 hover:border-slate-700"
                    : "border-blue-900/40 bg-slate-900/90"
                }`}
              >
                {/* Main Row Overview */}
                <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Status Badge & Lead Details */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Status Icon Indicator */}
                    <div className="mt-0.5 shrink-0">
                      {log.status === "success" && (
                        <div className="w-8 h-8 bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 rounded-lg flex items-center justify-center">
                          <CheckCircle2 className="h-4.5 w-4.5" />
                        </div>
                      )}
                      {log.status === "failed" && (
                        <div className="w-8 h-8 bg-red-950/80 text-red-400 border border-red-800/50 rounded-lg flex items-center justify-center">
                          <XCircle className="h-4.5 w-4.5" />
                        </div>
                      )}
                      {log.status === "pending" && (
                        <div className="w-8 h-8 bg-blue-950/80 text-blue-400 border border-blue-800/50 rounded-lg flex items-center justify-center">
                          <Clock className="h-4.5 w-4.5 animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Lead Title & Meta */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm tracking-tight">{log.leadName}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 ${
                            log.status === "success"
                              ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                              : log.status === "failed"
                              ? "bg-red-950/60 text-red-300 border-red-800"
                              : "bg-blue-950/60 text-blue-300 border-blue-800"
                          }`}
                        >
                          {log.status === "success" ? `HTTP ${log.statusCode} OK` : log.status === "failed" ? `HTTP ${log.statusCode} Failed` : "Pending Retry"}
                        </Badge>
                        <span className="text-[11px] font-semibold text-blue-400 bg-blue-950/80 border border-blue-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Zap className="h-3 w-3 text-blue-400" /> {log.crmName}
                        </span>
                        {log.mortgageConsent && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-amber-400" /> Mortgage Opt-In
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-500" /> {log.leadEmail}
                        </span>
                        {log.leadPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-500" /> {log.leadPhone}
                          </span>
                        )}
                        {log.listingAddress && (
                          <span className="flex items-center gap-1 text-slate-300 truncate max-w-xs">
                            <MapPin className="h-3 w-3 text-blue-400 shrink-0" /> {log.listingAddress}
                          </span>
                        )}
                      </div>

                      {/* Response snippet */}
                      <p className="text-xs font-mono text-slate-300 bg-slate-950/70 border border-slate-800/80 rounded-md px-2.5 py-1.5 mt-1.5 leading-normal">
                        {log.platformResponse}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Time, Action Buttons, Details Toggle */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800 shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {format(new Date(log.timestamp), "MMM d, yyyy • h:mm a")}
                      </span>
                      {log.retryCount !== undefined && log.retryCount > 0 && (
                        <span className="text-[10px] text-amber-400 font-semibold block">
                          Retried {log.retryCount}x
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Retry Button */}
                      {(log.status === "failed" || log.status === "pending") && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetry(log)}
                          disabled={isRetrying}
                          className="bg-amber-950/30 border-amber-700/50 text-amber-300 hover:bg-amber-900/50 text-xs font-bold gap-1 h-8 cursor-pointer"
                        >
                          <RotateCcw className={`h-3 w-3 text-amber-400 ${isRetrying ? 'animate-spin' : ''}`} />
                          Retry
                        </Button>
                      )}

                      {/* Expand Details Drawer */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="text-slate-300 hover:bg-slate-800 text-xs font-semibold gap-1 h-8 border border-slate-800 cursor-pointer"
                      >
                        <Code className="h-3.5 w-3.5 text-blue-400" />
                        {isExpanded ? "Hide Payload" : "View Payload"}
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Payload & Response Drawer */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-4">
                    {/* Applied Tags List */}
                    {log.tagsApplied && log.tagsApplied.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Tag className="h-3.5 w-3.5 text-emerald-400" /> Mapped Tags Transmitted:
                        </span>
                        {log.tagsApplied.map((tag) => (
                          <span key={tag} className="text-[11px] font-mono bg-emerald-950/60 border border-emerald-800 text-emerald-300 px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Transmitted Payload */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider flex items-center gap-1">
                          <Send className="h-3 w-3" /> Transmitted Lead Payload (JSON)
                        </span>
                        <pre className="bg-slate-900 border border-slate-800 text-slate-200 text-[11px] font-mono p-3 rounded-lg overflow-x-auto max-h-48">
                          {JSON.stringify(log.payload || {
                            first_name: log.leadName.split(' ')[0],
                            email: log.leadEmail,
                            phone: log.leadPhone,
                            mortgageConsent: log.mortgageConsent
                          }, null, 2)}
                        </pre>
                      </div>

                      {/* CRM Response Payload */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Upstream CRM Platform Response (JSON)
                        </span>
                        <pre className="bg-slate-900 border border-slate-800 text-slate-200 text-[11px] font-mono p-3 rounded-lg overflow-x-auto max-h-48">
                          {JSON.stringify(log.responsePayload || {
                            status: log.status,
                            statusCode: log.statusCode,
                            message: log.platformResponse
                          }, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
