import React, { useState } from 'react';
import { Search, Filter, Home, User, ExternalLink, AlertTriangle, CheckCircle, MoreVertical, Eye, Trash2, Edit } from 'lucide-react';
import { motion } from 'motion/react';
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

export default function AdminListings() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  const allListings = [
    { id: '1', address: '123 Maple St', city: 'Toronto', agent: 'Luc Valade', status: 'Active', price: '$1,249,000', leads: 42, flag: false },
    { id: '2', address: '456 Oak Ave', city: 'Oakville', agent: 'Sarah Jenkins', status: 'Draft', price: '$899,000', leads: 0, flag: true },
    { id: '3', address: '789 Pine Rd', city: 'Mississauga', agent: 'David Miller', status: 'Active', price: '$2,100,000', leads: 15, flag: false },
    { id: '4', address: '321 Birch Ln', city: 'Burlington', agent: 'Luc Valade', status: 'Sold', price: '$549,000', leads: 128, flag: false },
    { id: '5', address: '555 Cedar Ct', city: 'Toronto', agent: 'Emma Watson', status: 'Active', price: '$1,150,000', leads: 8, flag: true },
  ];

  const handleFlagStatus = (id: string, currentlyFlagged: boolean) => {
    toast.success(currentlyFlagged ? "Flag removed" : "Listing flagged for review", {
      description: `Status updated for listing ID: ${id}`
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h1 className="text-3xl font-black tracking-tighter text-slate-900 italic uppercase">Brokerage Inventory</h1>
        <p className="text-slate-500 font-medium">Global oversight of all property assets and agent compliance.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-left">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by address, agent, or MLS..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">
              <Filter className="h-3.5 w-3.5 text-blue-600" /> Filter
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors animate-pulse">
              <AlertTriangle className="h-3.5 w-3.5" /> Flagged (2)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Property</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Listing Agent</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pricing</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Engagement</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allListings.map((listing, i) => (
                <motion.tr 
                  key={listing.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 group-hover:bg-white transition-colors">
                        <Home className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-none mb-1.5">{listing.address}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{listing.city}</p>
                      </div>
                      {listing.flag && (
                        <div className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[8px] font-black tracking-wider animate-pulse border border-red-200">
                          COMPLIANCE HOLD
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2.5">
                       <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center italic text-[10px] font-black text-slate-500">
                        {listing.agent.split(' ').map(n => n[0]).join('')}
                       </div>
                       <span className="text-xs font-bold text-slate-700">{listing.agent}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-black text-slate-900 italic">
                    {listing.price}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900">{listing.leads}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Verified Leads</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                     <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      listing.status === 'Active' ? 'bg-green-100 text-green-700 border border-green-200 shadow-sm' : 
                      listing.status === 'Draft' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                    }`}>
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-900">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-2 shadow-xl border-slate-200">
                          <DropdownMenuItem onClick={() => navigate(`/app/listings/${listing.id}`)} className="rounded-lg font-bold gap-2">
                            <Eye className="h-4 w-4 text-blue-600" /> View Listing
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/app/listings/edit/${listing.id}`)} className="rounded-lg font-bold gap-2">
                            <Edit className="h-4 w-4 text-blue-600" /> Edit Listing
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem onClick={() => handleFlagStatus(listing.id, listing.flag)} className="rounded-lg font-bold gap-2">
                            <AlertTriangle className={`h-4 w-4 ${listing.flag ? 'text-green-600' : 'text-amber-600'}`} /> 
                            {listing.flag ? 'Clear Flag' : 'Flag Listing'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem onClick={() => toast.error("Asset teardown initiated", { description: listing.address })} className="rounded-lg font-bold text-red-600 focus:text-red-700 focus:bg-red-50 gap-2">
                            <Trash2 className="h-4 w-4" /> Force Takedown
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
      </div>
    </div>
  );
}
