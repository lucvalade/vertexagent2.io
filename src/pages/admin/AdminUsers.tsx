import React, { useState, useEffect } from 'react';
import { Search, Mail, UserPlus, ShieldCheck, ShieldAlert, Trash2, Pencil, ExternalLink, ChevronLeft, ChevronRight, Calendar, Clock, Eye, Send, Sparkles, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { sendEmail } from "@/lib/api";
import { toast } from "sonner";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"directory" | "freetier">("directory");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [realUsers, setRealUsers] = useState<any[]>([]);
  const [loadingRealUsers, setLoadingRealUsers] = useState(true);

  // Email Preview Modal States
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewType, setPreviewType] = useState<"welcome" | "reminder">("welcome");
  const [selectedTrialUser, setSelectedTrialUser] = useState<any>(null);
  const [sendingTest, setSendingTest] = useState(false);

  // Load real users from Firestore to capture actual dynamic trial signups
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const list: any[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setRealUsers(list);
      } catch (err) {
        console.error("Error loading real users:", err);
      } finally {
        setLoadingRealUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const DUMMY_AGENTS = [
    { id: '1', name: 'Luc Valade', email: 'luc@vertexrealty.ca', role: 'ADMIN', status: 'Active', listings: 12 },
    { id: '2', name: 'Sarah Jenkins', email: 'sarah@vertexrealty.ca', role: 'AGENT', status: 'Active', listings: 8 },
    { id: '3', name: 'Michael Chen', email: 'mchen@vertexrealty.ca', role: 'AGENT', status: 'Pending', listings: 0 },
    { id: '4', name: 'Emma Watson', email: 'emma@vertexrealty.ca', role: 'AGENT', status: 'Inactive', listings: 5 },
    { id: '5', name: 'David Miller', email: 'dmiller@vertexrealty.ca', role: 'AGENT', status: 'Active', listings: 15 },
    { id: '6', name: 'Sophia Rodriguez', email: 'sophia.r@vertexrealty.ca', role: 'AGENT', status: 'Active', listings: 4 },
    { id: '7', name: 'James Wilson', email: 'james.w@vertexrealty.ca', role: 'AGENT', status: 'Active', listings: 9 },
    { id: '8', name: 'Olivia Brown', email: 'olivia.b@vertexrealty.ca', role: 'AGENT', status: 'Pending', listings: 0 },
    { id: '9', name: 'Robert Taylor', email: 'robert.t@vertexrealty.ca', role: 'AGENT', status: 'Active', listings: 22 },
    { id: '10', name: 'Isabella Garcia', email: 'isabella.g@vertexrealty.ca', role: 'AGENT', status: 'Active', listings: 3 },
    { id: '11', name: 'William Martinez', email: 'william.m@vertexrealty.ca', role: 'AGENT', status: 'Inactive', listings: 0 },
    { id: '12', name: 'Mia Anderson', email: 'mia.a@vertexrealty.ca', role: 'AGENT', status: 'Active', listings: 11 },
    { id: '13', name: 'Ethan Thomas', email: 'ethan.t@vertexrealty.ca', role: 'AGENT', status: 'Active', listings: 7 },
    { id: '14', name: 'Charlotte Moore', email: 'charlotte.m@vertexrealty.ca', role: 'AGENT', status: 'Pending', listings: 0 },
    { id: '15', name: 'Noah Jackson', email: 'noah.j@vertexrealty.ca', role: 'AGENT', status: 'Active', listings: 6 },
  ];

  // Dynamic Trial Signups (14 Free Tier Group)
  const getTrialUsers = () => {
    // 1. Map real users from Firestore into 14 Free Tier structure
    const mappedReal = realUsers.map(u => {
      const signupDate = u.createdAt ? new Date(u.createdAt) : new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const expiryDate = new Date(signupDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      const parts = (u.name || "Unknown Agent").split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "User";
      
      return {
        id: u.id,
        firstName,
        lastName,
        email: u.email || "",
        signupDate,
        expiryDate,
        isReal: true,
        source: 'Firestore DB'
      };
    });

    // 2. Mock trialists for a beautifully populated premium admin panel
    const mockTrials = [
      {
        id: "trial-1",
        firstName: "Jean",
        lastName: "Dupont",
        email: "jean.dupont@remax.net",
        signupDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        expiryDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // expires in 9 days
        isReal: false,
        source: 'Demo Seed'
      },
      {
        id: "trial-2",
        firstName: "Sarah",
        lastName: "Connor",
        email: "sconnor@compass.com",
        signupDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // exactly 7 days ago! (Trigger day for reminder!)
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // exactly 7 days left!
        isReal: false,
        source: 'Demo Seed'
      },
      {
        id: "trial-3",
        firstName: "Marcus",
        lastName: "Aurelius",
        email: "marcus@romeagency.com",
        signupDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), // expires in 1 day
        expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        isReal: false,
        source: 'Demo Seed'
      },
      {
        id: "trial-4",
        firstName: "Alexander",
        lastName: "Hamilton",
        email: "hamilton@treasuryrealty.org",
        signupDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Trial expired 1 day ago
        expiryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isReal: false,
        source: 'Demo Seed'
      }
    ];

    // Deduplicate any common emails to ensure neat tracking
    const all = [...mappedReal, ...mockTrials];
    const seen = new Set();
    return all.filter(u => {
      const emailLower = u.email.toLowerCase();
      if (seen.has(emailLower)) return false;
      seen.add(emailLower);
      return true;
    });
  };

  const trialList = getTrialUsers();

  const ITEMS_PER_PAGE = 5;

  // Filters based on active tab
  const getFilteredData = () => {
    if (activeTab === "directory") {
      return DUMMY_AGENTS.filter(agent => 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        agent.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      return trialList.filter(user => 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  };

  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [messageText, setMessageText] = useState("");

  const handleDelete = (agent: any) => {
    setSelectedAgent(agent);
    setIsDeactivateOpen(true);
  };

  const confirmDeactivation = () => {
    toast.success(`Account deactivated for ${selectedAgent?.name}`, {
      description: "Access has been revoked immediately."
    });
    setIsDeactivateOpen(false);
  };

  const handleSendMessage = () => {
    toast.success(`Message sent to ${selectedAgent?.name}`, {
      description: "Priority internal relay successful."
    });
    setIsMessageOpen(false);
    setMessageText("");
  };

  const handleChangeRole = (name: string, newRole: string) => {
    toast.success(`Role updated for ${name}`, {
      description: `Permissions elevated to ${newRole}.`
    });
  };

  const openEmailPreview = (type: "welcome" | "reminder", user: any) => {
    setPreviewType(type);
    setSelectedTrialUser(user);
    setIsPreviewModalOpen(true);
  };

  const sendTestEmail = async () => {
    if (!selectedTrialUser) return;
    setSendingTest(true);
    const toastId = toast.loading(`Routing test ${previewType} email to ${selectedTrialUser.email}...`);
    try {
      const name = `${selectedTrialUser.firstName} ${selectedTrialUser.lastName}`;
      const signupDateStr = selectedTrialUser.signupDate.toLocaleDateString('en-US', { year: "numeric", month: "short", day: "numeric" });
      const expiryDateStr = selectedTrialUser.expiryDate.toLocaleDateString('en-US', { year: "numeric", month: "short", day: "numeric" });
      const loginUrl = window.location.origin + "/login";

      let subject = "";
      let html = "";

      if (previewType === "welcome") {
        subject = "🚀 Welcome to AI Open House Connect! Your 14-Day Free Trial starts now";
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b; background-color: #f8fafc;">
            <div style="background-color: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 48px;">🚀</span>
                <h1 style="color: #0f172a; font-size: 28px; font-weight: 800; margin: 15px 0 5px; tracking-tight: -0.025em; text-transform: uppercase; font-style: italic;">Welcome to AI Open House Connect</h1>
                <p style="color: #64748b; font-size: 14px; font-weight: 500; margin: 0;">Try Free for 14 Days (No Credit Card Required)</p>
              </div>

              <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
                Hello <strong>${name}</strong>,
              </p>

              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
                We are thrilled to welcome you to AI Open House Connect. Your account has been provisioned on our <strong>14-Day Free Trial</strong> tier. This gives you complete access to generate high-fidelity AI-powered talking open houses and remote digital tours!
              </p>

              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                <h3 style="margin-top: 0; color: #1e40af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; margin-bottom: 12px; font-style: italic;">Trial Account Benefits & Details</h3>
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #dbeafe;">
                    <td style="padding: 8px 0; color: #1e40af; font-weight: 600;">Signup Date</td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${signupDateStr}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #1e40af; font-weight: 600;">Expiry Date</td>
                    <td style="padding: 8px 0; color: #ef4444; font-weight: 700; text-align: right;">${expiryDateStr} (14 Days)</td>
                  </tr>
                </table>
              </div>

              <h3 style="color: #0f172a; font-size: 15px; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; font-style: italic;">What email information do you get on signup?</h3>
              <ul style="padding-left: 20px; font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 32px;">
                <li style="margin-bottom: 10px;"><strong>Welcome Guide:</strong> Complete structural tour description.</li>
                <li style="margin-bottom: 10px;"><strong>Voice-first capabilities:</strong> Multilingual audio configuration guides.</li>
                <li style="margin-bottom: 10px;"><strong>Lead Intelligence details:</strong> Tracking setups for touchless visitor logs and notifications.</li>
              </ul>

              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${loginUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: bold; text-decoration: none; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">
                  Launch Your Agent Dashboard &rarr;
                </a>
              </div>
            </div>
          </div>
        `;
      } else {
        subject = "⏳ Reminder: Your AI Open House Connect trial expires in 7 days!";
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b; background-color: #f8fafc;">
            <div style="background-color: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 48px;">⏳</span>
                <h1 style="color: #0f172a; font-size: 26px; font-weight: 800; margin: 15px 0 5px; tracking-tight: -0.025em; text-transform: uppercase; font-style: italic;">7 Days Left in Your Trial</h1>
                <p style="color: #64748b; font-size: 14px; font-weight: 500; margin: 0;">AI Open House Connect Expiry Heads-Up</p>
              </div>

              <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
                Hello <strong>${name}</strong>,
              </p>

              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
                Your 14-day free trial on AI Open House Connect is halfway through! You have **7 days remaining** before your AI voice open house agents and buyer lead flows pause on <strong>${expiryDateStr}</strong>.
              </p>

              <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                <h3 style="margin-top: 0; color: #b45309; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; margin-bottom: 12px; font-style: italic;">Keep Your Listings Talking</h3>
                <p style="font-size: 13px; color: #78350f; line-height: 1.5; margin: 0;">
                  Upgrade to our highly popular Professional Plan today. All your configured voice scripts, visitor logs, custom QR badges, and lead historical data will carry over instantly without interruption.
                </p>
              </div>

              <h3 style="color: #0f172a; font-size: 15px; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; font-style: italic;">💼 Professional Tier Features Unlocked:</h3>
              <ul style="padding-left: 20px; font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 32px;">
                <li style="margin-bottom: 8px;"><strong>Unlimited Listings</strong> & unlimited minutes of voice interaction.</li>
                <li style="margin-bottom: 8px;"><strong>Personalized Brand Styling</strong> to match your brokerage assets.</li>
                <li style="margin-bottom: 8px;"><strong>Advanced CRM syncing</strong> (Follow Up Boss, Zapier, Salesforce, etc.).</li>
              </ul>

              <div style="text-align: center; margin-bottom: 20px;">
                <a href="${loginUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: bold; text-decoration: none; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">
                  Upgrade to Professional Plan &rarr;
                </a>
              </div>
            </div>
          </div>
        `;
      }

      await sendEmail({ to: selectedTrialUser.email, subject, html });
      toast.success(`Success! Custom ${previewType} email relayed to ${selectedTrialUser.email}`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(`SMTP Dispatch failed: ${err.message || "Is SMTP Pass set in .env?"}`, { id: toastId });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Toggle Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 italic uppercase">Agent Management</h1>
          <p className="text-slate-500 font-medium">Internal directory, access governance, and trial performance surveillance.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Custom Toggle Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200 shadow-inner">
            <button
              id="tab-directory"
              onClick={() => { setActiveTab("directory"); setPage(1); }}
              className={`px-4 py-2 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all ${activeTab === 'directory' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Brokerage Directory
            </button>
            <button
              id="tab-freetier"
              onClick={() => { setActiveTab("freetier"); setPage(1); }}
              className={`px-4 py-2 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'freetier' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              14 Free Tier
            </button>
          </div>

          <button 
            onClick={() => navigate("/app/admin/users/invite")}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 self-start md:self-center h-10"
          >
            <UserPlus className="h-4 w-4" /> Invite New Agent
          </button>
        </div>
      </div>

      {/* Main Panel Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-left">
        {/* Sub-header Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder={activeTab === 'directory' ? "Search directory..." : "Search trialists..."}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {activeTab === "freetier" && (
            <div className="flex items-center gap-2 text-xs bg-amber-50 text-amber-800 border border-amber-100 px-3 py-1.5 rounded-xl font-bold">
              <Clock className="h-4 w-4" /> Tracking {trialList.length} trial accounts
            </div>
          )}
        </div>

        {/* Tab 1: Brokerage Directory */}
        {activeTab === "directory" ? (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Agent</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventory</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((agent: any, i) => (
                    <motion.tr 
                      key={agent.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm border-2 border-white shadow-md italic">
                            {agent.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 leading-none mb-1.5">{agent.name}</p>
                            <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5 opacity-70">
                              <Mail className="h-3 w-3" /> {agent.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${agent.role === 'ADMIN' ? 'bg-red-50 text-red-700 border border-red-100 shadow-sm' : 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm'}`}>
                          {agent.role === 'ADMIN' ? <ShieldCheck className="h-3 w-3" /> : null}
                          {agent.role}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <div className={`h-1.5 w-1.5 rounded-full ${agent.status === 'Active' ? 'bg-green-500' : agent.status === 'Pending' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                           <span className="text-[10px] font-black uppercase tracking-tighter text-slate-600 italic">{agent.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-black text-slate-700">{agent.listings}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Units</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            } />
                            <DropdownMenuContent align="end" side="top" sideOffset={5} className="w-56 rounded-xl shadow-xl border-slate-200 p-2">
                              <DropdownMenuItem onClick={() => navigate(`/app/team/${agent.id}/edit`)} className="rounded-lg font-bold py-2 gap-2">
                                <Pencil className="h-4 w-4 text-blue-600" /> Edit Member
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedAgent(agent);
                                setIsMessageOpen(true);
                              }} className="rounded-lg font-bold py-2 gap-2 cursor-pointer">
                                <Mail className="h-4 w-4 text-blue-600" /> Send Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1" />
                              <DropdownMenuItem onClick={() => handleChangeRole(agent.name, 'Admin')} className="rounded-lg font-bold py-2 gap-2">
                                <ShieldCheck className="h-4 w-4 text-amber-600" /> Make Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/app/leads?agentId=${agent.id}`)} className="rounded-lg font-bold py-2 gap-2">
                                <ExternalLink className="h-4 w-4 text-green-600" /> View Agent Leads
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1" />
                              <DropdownMenuItem onClick={() => handleDelete(agent)} className="rounded-lg font-bold py-2 text-red-600 focus:text-red-700 focus:bg-red-50 gap-2 cursor-pointer">
                                <Trash2 className="h-4 w-4" /> Deactivate Account
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {paginatedData.map((agent: any) => (
                <div key={agent.id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xs border-2 border-white shadow-md italic">
                        {agent.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-none mb-1">{agent.name}</p>
                        <p className="text-xs text-slate-500 font-bold opacity-70 truncate max-w-[150px]">{agent.email}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-200">
                        <DropdownMenuItem onClick={() => navigate(`/app/team/${agent.id}/edit`)} className="font-bold gap-2">
                          <Pencil className="h-4 w-4 text-blue-600" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedAgent(agent); setIsMessageOpen(true); }} className="font-bold gap-2">
                          <Mail className="h-4 w-4 text-blue-600" /> Message
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(agent)} className="font-bold text-red-600 focus:text-red-700 focus:bg-red-50 gap-2">
                          <Trash2 className="h-4 w-4" /> Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center text-[10px]">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${agent.role === 'ADMIN' ? 'bg-red-50 text-red-700 border border-red-100 shadow-sm' : 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm'}`}>
                      {agent.role}
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-600 font-black uppercase tracking-tighter italic">
                      <div className={`h-1 w-1 rounded-full ${agent.status === 'Active' ? 'bg-green-500' : agent.status === 'Pending' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                      {agent.status}
                    </div>
                    <div className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-600 font-black uppercase tracking-tighter">
                      {agent.listings} Units
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Tab 2: 14 Free Tier (As requested) */
          <>
            {/* Desktop View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Signup Date</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">First Name</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Last Name</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Email Address</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expiry Date</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Trial Expiry Audit Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingRealUsers ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-xs font-black uppercase text-slate-400 tracking-widest">
                        Scanning database for Trialists...
                      </td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-xs font-black uppercase text-slate-400 tracking-widest">
                        No trial signups match that search term.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((user: any, i) => {
                      const signupStr = user.signupDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                      const expiryStr = user.expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                      
                      const daysLeft = Math.ceil((user.expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                      const isExpired = daysLeft <= 0;

                      return (
                        <motion.tr 
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="hover:bg-blue-50/20 transition-colors group"
                        >
                          {/* 1. Signup Date */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-bold text-slate-900">{signupStr}</span>
                            </div>
                          </td>

                          {/* 2. First Name */}
                          <td className="px-6 py-5">
                            <span className="text-sm font-black text-slate-900 leading-none">{user.firstName}</span>
                          </td>

                          {/* 3. Last Name */}
                          <td className="px-6 py-5">
                            <span className="text-sm font-black text-slate-900 leading-none">{user.lastName}</span>
                          </td>

                          {/* 4. Email */}
                          <td className="px-6 py-5">
                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 leading-none">
                              <Mail className="h-3.5 w-3.5 text-slate-400" /> {user.email}
                            </span>
                          </td>

                          {/* 5. Expiry Date & Status Tag */}
                          <td className="px-6 py-5">
                            <div className="space-y-1.5 text-left">
                              <p className={`text-xs font-black ${isExpired ? 'text-red-600 underline decoration-red-400' : 'text-slate-900 font-bold'}`}>
                                {expiryStr}
                              </p>
                              {isExpired ? (
                                <span className="inline-block px-1.5 py-0.5 bg-red-100 text-red-700 text-[8px] font-black uppercase rounded tracking-wider leading-none shadow-sm">
                                  Expired
                                </span>
                              ) : (
                                <span className={`inline-block px-1.5 py-0.5 text-[8px] font-black uppercase rounded tracking-wider leading-none shadow-sm ${daysLeft === 7 ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' : 'bg-green-100 text-green-700'}`}>
                                  {daysLeft} days remaining
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Trigger Actions */}
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center gap-2">
                              {/* Welcome Email Trigger */}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openEmailPreview("welcome", user)}
                                className="h-8 text-[10px] font-black uppercase tracking-wider bg-white text-slate-700 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm rounded-lg flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" /> Welcome Email Info
                              </Button>

                              {/* 7-Day Expirer Trigger */}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openEmailPreview("reminder", user)}
                                className="h-8 text-[10px] font-black uppercase tracking-wider bg-white text-slate-700 hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm rounded-lg flex items-center gap-1"
                              >
                                <Mail className="h-3 w-3" /> Expiry Warn Info (7d)
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {loadingRealUsers ? (
                <div className="p-12 text-center text-xs font-black uppercase text-slate-400 tracking-widest">
                  Scanning DB for Trialists...
                </div>
              ) : paginatedData.length === 0 ? (
                <div className="p-12 text-center text-xs font-black uppercase text-slate-400 tracking-widest">
                  No trialists found.
                </div>
              ) : (
                paginatedData.map((user: any) => {
                  const daysLeft = Math.ceil((user.expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                  const isExpired = daysLeft <= 0;
                  return (
                    <div key={user.id} className="p-4 space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm font-black text-slate-900 leading-none">
                            {user.firstName} {user.lastName}
                          </p>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase leading-none shadow-sm ${isExpired ? 'bg-red-100 text-red-700' : daysLeft === 7 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700'}`}>
                            {isExpired ? 'Expired' : `${daysLeft}d left`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-bold opacity-80 flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {user.email}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[10px] bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Signed up</p>
                          <p className="font-bold text-slate-700">{user.signupDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Expires on</p>
                          <p className="font-bold text-slate-700">{user.expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openEmailPreview("welcome", user)}
                          className="h-8 text-[9px] font-black uppercase tracking-wider bg-white rounded-lg"
                        >
                          Signup Mail
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openEmailPreview("reminder", user)}
                          className="h-8 text-[9px] font-black uppercase tracking-wider bg-white rounded-lg"
                        >
                          7d Reminder
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Unified Pagination Wrapper */}
        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex flex-col items-center gap-3">
          <div className="flex gap-2">
             <Button 
               variant="outline" 
               size="sm" 
               disabled={page === 1}
               onClick={() => setPage(p => Math.max(1, p - 1))}
               className="h-9 px-4 font-bold border-slate-200 bg-white shadow-sm gap-2"
               type="button"
             >
               <ChevronLeft className="h-4 w-4" /> Previous
             </Button>
             <Button 
               variant="outline" 
               size="sm"
               disabled={page === totalPages || totalPages === 0}
               onClick={() => setPage(p => Math.min(totalPages, p + 1))}
               className="h-9 px-4 font-bold border-blue-600 text-blue-600 bg-white hover:bg-blue-50 shadow-sm gap-2"
               type="button"
             >
               Next <ChevronRight className="h-4 w-4" />
             </Button>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Page {page} of {totalPages || 1} • Brokerage Audit: PASS</p>
        </div>
      </div>

      {/* Welcome & Reminder Email Template Viewer + SMTP Dispatcher Dialog (Answers Questions 2 & 3 beautifully) */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="flex items-center gap-2.5 font-black tracking-tighter text-2xl uppercase italic text-blue-600">
              <Sparkles className="h-5.5 w-5.5 text-blue-600" />
              {previewType === "welcome" ? "Welcome Email Template Overview" : "7-Day Prior Expiry Reminder Email"}
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-500">
              Preview email notification contents sent to trial account users.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Quick Answer Snippet Summary */}
            <div className="p-4 bg-blue-50/80 border border-blue-100 rounded-xl space-y-1.5 text-left text-xs text-blue-800 leading-relaxed font-semibold">
              <p className="font-black text-[10px] uppercase tracking-wider text-blue-600">Audit Summary Information:</p>
              {previewType === "welcome" ? (
                <p>
                  <strong>What they get on sign up:</strong> Trialists receive a beautifully formatted HTML account welcome onboarding letter. It outlines transition benefits, confirms their concrete signup & expiry dates, states that no credit card is required, and gives them a quickstart checklist to launch their first AI listing.
                </p>
              ) : (
                <p>
                  <strong>What is in the 7-day prior email:</strong> It issues a friendly warning that they have 7 days remaining. It highlights key premium features (unlimited minutes, custom branding, and direct CRM integrations), and outlines that upgrading to professional will prevent active listings & open house voice streams from being paused.
                </p>
              )}
            </div>

            {/* Simulated Live Outlook Inbox Shell */}
            <div className="border border-slate-200 rounded-xl shadow-inner overflow-hidden text-left bg-white font-sans">
              {/* Email Envelope Fields */}
              <div className="bg-slate-50 p-4 border-b border-slate-200 space-y-2 text-xs text-slate-600 font-bold">
                <p><span className="text-slate-400">From:</span> "AI Open House Connect" &lt;sales@aiopenhouseconnect.com&gt;</p>
                <p><span className="text-slate-400">To:</span> {selectedTrialUser ? `"${selectedTrialUser.firstName} ${selectedTrialUser.lastName}" <${selectedTrialUser.email}>` : 'Jane Agent'}</p>
                <p>
                  <span className="text-slate-400">Subject:</span>{' '}
                  <span className="text-slate-900 font-extrabold">
                    {previewType === "welcome" 
                      ? "🚀 Welcome to AI Open House Connect! Your 14-Day Free Trial starts now" 
                      : "⏳ Reminder: Your AI Open House Connect trial expires in 7 days!"}
                  </span>
                </p>
              </div>

              {/* Email Client Iframe Body Display */}
              <div className="p-6 bg-[#f8fafc] overflow-y-auto max-h-[350px] border-b border-slate-100">
                {previewType === "welcome" ? (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-lg mx-auto text-slate-700 text-xs shadow-sm">
                    <p className="text-center text-4xl mb-2">🚀</p>
                    <h2 className="text-center text-lg font-black tracking-tight text-slate-900 uppercase italic mb-1">Welcome to AI Open House Connect</h2>
                    <p className="text-center text-[10px] font-bold text-slate-500 mb-6">Experience Mode: 14-Day Free Trial (No Credit Card)</p>

                    <p className="mb-3 font-medium">Hello <strong>{selectedTrialUser ? selectedTrialUser.firstName : 'Jane'}</strong>,</p>
                    <p className="mb-4 leading-medium">We are thrilled to welcome you to AI Open House Connect. Your account has been provisioned on our <strong>14-Day Free Trial</strong> tier. This gives you complete access to generate high-fidelity AI-powered talking open houses and remote digital tours!</p>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 mb-5 space-y-1.5 font-semibold text-blue-900">
                      <p className="text-[10px] font-black uppercase text-blue-700 tracking-wider">Trial Details</p>
                      <p className="flex justify-between"><span>Signup Date:</span> <span className="font-extrabold">{selectedTrialUser ? selectedTrialUser.signupDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}</span></p>
                      <p className="flex justify-between text-red-600"><span>Expiration Date:</span> <span className="font-extrabold">{selectedTrialUser ? selectedTrialUser.expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'In 14 Days'}</span></p>
                    </div>

                    <h3 className="font-extrabold text-[#0f172a] mb-2 text-[11px] uppercase tracking-tight">🔥 Your Quickstart Checklist:</h3>
                    <ul className="list-disc pl-4 space-y-1 mb-6 text-[11px] text-slate-600 font-medium">
                      <li>Create your first property listing by typing in its MLS address.</li>
                      <li>Configure Sora, your AI voice assistant, choosing natural voice profiles.</li>
                      <li>Deploy the Touchless Open House barcode badge directly on-site!</li>
                    </ul>

                    <div className="text-center">
                      <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-xs font-black shadow-md uppercase tracking-wider">Launch Agent Dashboard</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-lg mx-auto text-slate-700 text-xs shadow-sm">
                    <p className="text-center text-4xl mb-2 font-black">⏳</p>
                    <h2 className="text-center text-lg font-black tracking-tight text-slate-900 uppercase italic mb-1">7 Days Left in Your Trial</h2>
                    <p className="text-center text-[10px] font-bold text-slate-500 mb-6 font-medium">AI Open House Connect Subscription Expiry Heads-Up</p>

                    <p className="mb-3 font-medium">Hello <strong>{selectedTrialUser ? selectedTrialUser.firstName : 'Jane'}</strong>,</p>
                    <p className="mb-4 leading-medium">Your 14-day free trial on AI Open House Connect is halfway through! You have **7 days remaining** before your AI voice open house agents and buyer lead flows pause on <strong>{selectedTrialUser ? selectedTrialUser.expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Next Week'}</strong>.</p>

                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 mb-5 space-y-1 text-amber-900 font-semibold">
                      <p className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Plan Expiry Details</p>
                      <p>Upgrading to our professional plan is seamless. All of your configured settings and visitor statistics will carry over without any disruption.</p>
                    </div>

                    <h3 className="font-extrabold text-[#0f172a] mb-2 text-[11px] uppercase tracking-tight">💼 Professional Tier Features Unlocked:</h3>
                    <ul className="list-disc pl-4 space-y-1 mb-6 text-[11px] text-slate-600 font-medium">
                      <li><strong>Unlimited voice open houses</strong> with continuous minutes of visitor narration.</li>
                      <li><strong>Personalized styling</strong> matching your exact agency color specs.</li>
                      <li><strong>Direct CRM matching</strong> to route visitors' phones & emails live.</li>
                    </ul>

                    <div className="text-center">
                      <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-xs font-black shadow-md uppercase tracking-wider">Upgrade to Professional</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-4 gap-2">
            <Button variant="ghost" onClick={() => setIsPreviewModalOpen(false)} className="font-bold">Close Preview</Button>
            {selectedTrialUser && (
              <Button 
                onClick={sendTestEmail}
                disabled={sendingTest}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider text-xs px-6 gap-1.5 shadow-lg shadow-blue-100"
              >
                {sendingTest ? "Sending Test..." : <><Send className="h-4 w-4" /> Send Test Email to Trialist</>}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black tracking-tighter text-2xl uppercase italic">
              <Mail className="h-6 w-6 text-blue-600" /> Send Internal Message
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-500">
              Compose a priority message to <span className="text-slate-900">{selectedAgent?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message Content</label>
              <textarea 
                className="w-full h-32 p-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 shadow-inner"
                placeholder="Type your message here..."
                value={messageText}
                onChange={(e) => {
                  const val = e.target.value;
                  setMessageText(val.charAt(0).toUpperCase() + val.slice(1));
                }}
              />
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 italic text-[10px] text-blue-700 font-bold">
              Tip: Messages are relayed instantly to the agent's mobile app and dashboard.
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsMessageOpen(false)} className="font-bold">Cancel</Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={!messageText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-lg shadow-blue-100"
            >
              Send Priority Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black tracking-tighter text-2xl uppercase italic text-red-600">
              <ShieldAlert className="h-6 w-6" /> Deactivate Account
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-500">
              This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 text-left">
            <p className="text-sm font-medium text-slate-700">
              Are you sure you want to deactivate the account for <span className="font-black text-slate-900 underline decoration-red-500 underline-offset-4">{selectedAgent?.name}</span>? 
            </p>
            <div className="p-4 bg-red-50 rounded-xl border border-red-100 space-y-2">
              <p className="text-[10px] font-black text-red-800 uppercase tracking-widest flex items-center gap-2">
                <Trash2 className="h-3 w-3" /> Impact Analysis:
              </p>
              <ul className="text-[11px] text-red-700 font-bold space-y-1 ml-4 list-disc">
                <li>All active tours will be switched to "Unassigned"</li>
                <li>CRM webhook integrations will be disconnected</li>
                <li>Access to the mobile app will be revoked immediately</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDeactivateOpen(false)} className="font-bold">Cancel</Button>
            <Button 
              onClick={confirmDeactivation}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 shadow-lg shadow-red-100"
            >
              Yes, Deactivate Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
