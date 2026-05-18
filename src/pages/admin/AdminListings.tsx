import React, { useState } from 'react';
import { Search, Filter, Home, User, ExternalLink, AlertTriangle, CheckCircle, MoreVertical, Eye, Trash2, Edit, X, Calendar } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminListings() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  const [allListings, setAllListings] = useState([
    { id: '1', address: '123 Maple St', city: 'Toronto', agent: 'Luc Valade', status: 'Active', price: '$1,249,000', leads: 42, flag: false, date: '2024-05-01' },
    { id: '2', address: '456 Oak Ave', city: 'Oakville', agent: 'Sarah Jenkins', status: 'Draft', price: '$899,000', leads: 0, flag: true, date: '2024-05-05' },
    { id: '3', address: '789 Pine Rd', city: 'Mississauga', agent: 'David Miller', status: 'Active', price: '$2,100,000', leads: 15, flag: false, date: '2024-04-20' },
    { id: '4', address: '321 Birch Ln', city: 'Burlington', agent: 'Luc Valade', status: 'Sold', price: '$549,000', leads: 128, flag: false, date: '2024-05-08' },
    { id: '5', address: '555 Cedar Ct', city: 'Toronto', agent: 'Emma Watson', status: 'Active', price: '$1,150,000', leads: 8, flag: true, date: '2024-05-10' },
  ]);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isComplianceInfoOpen, setIsComplianceInfoOpen] = useState(false);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedListings = allListings
    .filter(l => 
      (l.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
       l.agent.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!startDate || l.date >= startDate) &&
      (!endDate || l.date <= endDate)
    )
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;
      const valA = (a as any)[key];
      const valB = (b as any)[key];
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleFlagStatus = (id: string, currentlyFlagged: boolean) => {
    setAllListings(prev => prev.map(l => l.id === id ? { ...l, flag: !currentlyFlagged } : l));
    toast.success(currentlyFlagged ? "Flag removed from listing" : "Listing flagged for review", {
      description: currentlyFlagged ? "Compliance hold has been lifted." : "Brokerage compliance review is required."
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
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Start Date:</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input 
                    type="date"
                    className="pl-9 pr-14 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  {startDate && (
                    <button 
                      onClick={() => setStartDate("")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[8px] font-black tracking-widest hover:bg-slate-300 transition-all shadow-sm"
                    >
                      CLEAR
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">End Date:</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input 
                    type="date"
                    className="pl-9 pr-14 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  {endDate && (
                    <button 
                      onClick={() => setEndDate("")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[8px] font-black tracking-widest hover:bg-slate-300 transition-all shadow-sm"
                    >
                      CLEAR
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsComplianceInfoOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors h-[34px]"
            >
              <AlertTriangle className="h-3.5 w-3.5 animate-pulse" /> Compliance Holds (2)
            </button>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th 
                  className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-slate-600"
                  onClick={() => handleSort('address')}
                >
                  Property {sortConfig?.key === 'address' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] cursor-pointer hover:text-slate-600 font-black decoration-blue-500 underline-offset-4"
                  onClick={() => handleSort('agent')}
                >
                  Listing Agent <span className="text-blue-600">{sortConfig?.key === 'agent' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pricing</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Engagement</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedListings.map((listing, i) => (
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

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredAndSortedListings.map((listing) => (
            <div key={listing.id} className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                    <Home className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 leading-none mb-1">{listing.address}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{listing.city}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  } />
                  <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-200 p-2">
                    <DropdownMenuItem onClick={() => navigate(`/app/listings/${listing.id}`)} className="font-bold gap-2">
                      <Eye className="h-4 w-4 text-blue-600" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFlagStatus(listing.id, listing.flag)} className="font-bold gap-2">
                      <AlertTriangle className={`h-4 w-4 ${listing.flag ? 'text-green-600' : 'text-amber-600'}`} /> Flag
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-wrap gap-2 items-center text-[10px]">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                  listing.status === 'Active' ? 'bg-green-100 text-green-700 border border-green-200' : 
                  listing.status === 'Draft' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {listing.status}
                </span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-600 font-black uppercase tracking-tighter italic">
                  {listing.price}
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-600 font-black uppercase tracking-tighter">
                  {listing.leads} Engagement
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-500 font-bold">
                  By {listing.agent}
                </div>
              </div>
              {listing.flag && (
                <div className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-[10px] font-black tracking-widest animate-pulse border border-red-100 text-center uppercase">
                  COMPLIANCE HOLD ACTIVE
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Compliance Info Dialog */}
      <Dialog open={isComplianceInfoOpen} onOpenChange={setIsComplianceInfoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black tracking-tighter text-2xl uppercase italic">
              <AlertTriangle className="h-6 w-6 text-amber-600" /> Compliance Hold
            </DialogTitle>
            <DialogDescription className="font-bold text-slate-500">
              What it is and how to fix it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-left">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h4 className="font-black text-xs uppercase tracking-widest text-slate-900 mb-2">Definition</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                A <span className="text-amber-700 font-bold">Compliance Hold</span> is triggered when an AI-powered tour is generated but is missing required brokerage disclosures, state-mandated legal text, or an authenticated agent license number.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h4 className="font-black text-xs uppercase tracking-widest text-blue-900 mb-2">How to Fix</h4>
              <ul className="text-sm text-blue-700 space-y-2 list-disc pl-4 font-medium">
                <li>Go to <span className="font-bold">Edit Listing</span> and ensure the Brokerage Name and Agent License fields are filled.</li>
                <li>Verify that the AI Talking Points don't violate fair housing guidelines.</li>
                <li>Once corrected, use the <span className="font-bold">"Clear Flag"</span> option in the listing menu to lift the hold.</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsComplianceInfoOpen(false)} className="bg-slate-900 text-white font-bold px-8">Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
