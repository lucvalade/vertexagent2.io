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
import { toast } from "sonner";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  
  const agents = [
    { id: '1', name: 'Luc Valade', email: 'luc@vertexrealty.ca', role: 'ADMIN', status: 'Active', listings: 12 },
    { id: '2', name: 'Sarah Jenkins', email: 'sarah@vertexrealty.ca', role: 'AGENT', status: 'Active', listings: 8 },
    { id: '3', name: 'Michael Chen', email: 'mchen@vertexrealty.ca', role: 'AGENT', status: 'Pending', listings: 0 },
    { id: '4', name: 'Emma Watson', email: 'emma@vertexrealty.ca', role: 'AGENT', status: 'Inactive', listings: 5 },
    { id: '5', name: 'David Miller', email: 'dmiller@vertexrealty.ca', role: 'AGENT', status: 'Active', listings: 15 },
  ];

  const handleDelete = (name: string) => {
    toast.success(`Member removal initiated for ${name}`, {
      description: "Access will be revoked at the end of the current billing cycle."
    });
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
        <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 self-start md:self-center">
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
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
              <Filter className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
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
              {agents.map((agent, i) => (
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
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-200 p-2">
                          <DropdownMenuItem onClick={() => navigate(`/app/team/${agent.id}/edit`)} className="rounded-lg font-bold py-2 gap-2">
                            <Pencil className="h-4 w-4 text-blue-600" /> Edit Member
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.location.href = `mailto:${agent.email}`} className="rounded-lg font-bold py-2 gap-2">
                            <Mail className="h-4 w-4 text-blue-600" /> Send Message
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem onClick={() => handleChangeRole(agent.name, 'Admin')} className="rounded-lg font-bold py-2 gap-2">
                            <ShieldCheck className="h-4 w-4 text-amber-600" /> Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate('/app/leads')} className="rounded-lg font-bold py-2 gap-2">
                            <ExternalLink className="h-4 w-4 text-green-600" /> View Agent Leads
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem onClick={() => handleDelete(agent.name)} className="rounded-lg font-bold py-2 text-red-600 focus:text-red-700 focus:bg-red-50 gap-2">
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

        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Page {page} of 12 • Brokerage Audit: PASS</p>
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
               onClick={() => setPage(p => p + 1)}
               className="h-9 px-4 font-bold border-blue-600 text-blue-600 bg-white hover:bg-blue-50 shadow-sm gap-2"
             >
               Next <ChevronRight className="h-4 w-4" />
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
