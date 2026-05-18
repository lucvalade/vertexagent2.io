import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Mail, UserPlus, ShieldCheck, ShieldAlert, Trash2, Pencil, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { toast } from "sonner";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  
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

  const ITEMS_PER_PAGE = 5;

  const filteredAgents = DUMMY_AGENTS.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAgents.length / ITEMS_PER_PAGE);
  const paginatedAgents = filteredAgents.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 italic uppercase">Agent Management</h1>
          <p className="text-slate-500 font-medium">Internal directory and access governance.</p>
        </div>
        <button 
          onClick={() => navigate("/app/admin/users/invite")}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 self-start md:self-center"
        >
          <UserPlus className="h-4 w-4" /> Invite New Agent
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-left">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search directory..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
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
              {paginatedAgents.map((agent, i) => (
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
                        {agent.name.split(' ').map(n => n[0]).join('')}
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
        <div className="md:hidden divide-y divide-slate-100">
          {paginatedAgents.map((agent) => (
            <div key={agent.id} className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xs border-2 border-white shadow-md italic">
                    {agent.name.split(' ').map(n => n[0]).join('')}
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

        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Page {page} of {totalPages} • Brokerage Audit: PASS</p>
          <div className="flex gap-2">
             <Button 
               variant="outline" 
               size="sm" 
               disabled={page === 1}
               onClick={() => setPage(p => Math.max(1, p - 1))}
               className="h-9 px-4 font-bold border-slate-200 bg-white shadow-sm gap-2"
             >
               <ChevronLeft className="h-4 w-4" /> Previous
             </Button>
             <Button 
               variant="outline" 
               size="sm"
               disabled={page === totalPages}
               onClick={() => setPage(p => Math.min(totalPages, p + 1))}
               className="h-9 px-4 font-bold border-blue-600 text-blue-600 bg-white hover:bg-blue-50 shadow-sm gap-2"
             >
               Next <ChevronRight className="h-4 w-4" />
             </Button>
          </div>
        </div>
      </div>
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
                onChange={(e) => setMessageText(e.target.value)}
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
