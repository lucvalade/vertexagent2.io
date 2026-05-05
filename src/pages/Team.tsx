import { Users, Mail, Settings, ShieldAlert, Plus, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

import { useState, useEffect } from "react";

export default function Team() {
  const [team, setTeam] = useState([
    { id: "1", name: "Luc Valade", email: "luc.valade@gmail.com", role: "Broker of Record / Admin", active: true, listings: 4 },
    { id: "2", name: "Sarah Jenkins", email: "sarah.j@vertexagent.io", role: "Agent", active: true, listings: 12 },
    { id: "3", name: "Michael Chang", email: "m.chang@vertexagent.io", role: "Agent", active: true, listings: 8 },
    { id: "4", name: "Jessica Smith", email: "admin@vertexagent.io", role: "Office Manager", active: true, listings: 0 },
  ]);

  useEffect(() => {
    const savedMembers = localStorage.getItem('vertex_team_data');
    if (savedMembers) {
      setTeam(JSON.parse(savedMembers));
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-slate-500 mt-1">Manage your agents, admins, and their permissions.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Invite Member
        </button>
      </div>

      <div className="border rounded-md bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-medium">Member</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Office / Team</th>
              <th className="px-6 py-4 font-medium text-center">Active Listings</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {team.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 text-blue-700 rounded-full flex justify-center items-center font-bold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{member.name}</div>
                      <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" /> {member.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    {member.role.includes("Admin") ? <ShieldAlert className="h-4 w-4 text-rose-500" /> : <Users className="h-4 w-4 text-slate-400" />}
                    <span className="text-slate-700 font-medium">{member.role}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <div className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 inline-block uppercase tracking-wider">
                     {(member as any).office || "Main Office"}
                   </div>
                </td>
                <td className="px-6 py-4 text-center text-slate-700 font-medium">{member.listings}</td>
                <td className="px-6 py-4 text-right">
                  <div className="relative group/menu inline-block text-left">
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                    <div className="absolute right-0 w-48 mt-1 origin-top-right bg-white border border-slate-200 divide-y divide-slate-100 rounded-md shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                      <div className="py-1">
                        <Link to={`/app/team/${member.id}/edit`} className="group flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 w-full text-left">
                          Edit Member
                        </Link>
                        <button className="group flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 w-full text-left">
                          Change Role
                        </button>
                      </div>
                      <div className="py-1">
                        <button className="group flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                          Remove from Team
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
