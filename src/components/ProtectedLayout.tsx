import { Navigate, Outlet } from "react-router-dom";
import { useAuth, loginWithGoogle, logout } from "@/hooks/useAuth";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { LogOut, Home, LayoutDashboard, List, Users, MessageSquare, Image, Mic2, Zap, Link2, BarChart2, LayoutTemplate, Building2, CreditCard, Settings, Menu, Shield, AlertTriangle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

export default function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      const checkMaintenance = async () => {
        try {
          const docRef = doc(db, "settings", "global");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setMaintenanceMode(data.maintenanceMode);
            if (data.maintenanceMode) {
              toast.warning("Maintenance Mode is currently ACTIVE.", {
                description: "The system is visible only to admins and authorized personnel.",
                duration: 10000,
              });
            } else {
              toast.info("Maintenance Mode is currently OFF.", {
                description: "The system is live to all agents and public tours.",
              });
            }
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, "settings/global");
        }
      };
      checkMaintenance();
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    console.log("ProtectedLayout State:", { user: !!user, loading });
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center gap-4">
        <p className="text-muted-foreground animate-pulse font-medium text-lg">Loading VertexAgent Dashboard...</p>
        <div className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Checking authentication state...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const navLinks = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/app/overview" },
    { label: "Listings", icon: List, path: "/app/listings" },
    { label: "Leads", icon: Users, path: "/app/leads" },
    { label: "Conversations", icon: MessageSquare, path: "/app/conversations" },
    { label: "Assets", icon: Image, path: "/app/assets" },
    { label: "Voice Lab", icon: Mic2, path: "/app/voicelab" },
    { label: "Automations", icon: Zap, path: "/app/automations" },
    { label: "CRM Integrations", icon: Link2, path: "/app/crm" },
    { label: "Analytics", icon: BarChart2, path: "/app/analytics" },
    { label: "Templates", icon: LayoutTemplate, path: "/app/templates" },
    { label: "Team", icon: Building2, path: "/app/team" },
    { label: "Billing", icon: CreditCard, path: "/app/billing" },
    { label: "Settings", icon: Settings, path: "/app/settings" },
  ];

  const adminLinks = [
    { label: "Admin Dashboard", icon: Shield, path: "/app/admin" },
    { label: "Manage Agents", icon: Users, path: "/app/admin/users" },
    { label: "All Listings", icon: List, path: "/app/admin/listings" },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex flex-col h-20 items-center justify-center border-b px-6 relative">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <div className="h-8 w-8 bg-blue-600 outline-1 outline-blue-600 rounded-md flex items-center justify-center text-white font-bold">
            V
          </div>
          <span className="text-lg tracking-tight">VertexAgent.io</span>
        </Link>
        <div className="absolute bottom-2 left-6">
          <div className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
            user?.role === 'ADMIN' 
              ? 'bg-red-50 text-red-600 border-red-100' 
              : 'bg-blue-50 text-blue-600 border-blue-100'
          }`}>
            <Shield className="h-2 w-2" />
            {user?.role === 'ADMIN' ? 'Admin Mode' : 'Agent Mode'}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-4">
          {navLinks.map((link) => {
            const active = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-blue-600 ${
                  active ? "bg-blue-50 text-blue-600 font-medium" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {user?.role === 'ADMIN' && (
          <div className="mt-8 px-4">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Admin Section</p>
            <nav className="grid gap-1">
              {adminLinks.map((link) => {
                const active = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-red-600 ${
                      active ? "bg-red-50 text-red-600 font-medium" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
           <div className="text-sm truncate pr-2">
             <div className="font-medium text-slate-900 truncate">{user.name}</div>
             <div className="text-slate-500 truncate text-xs">{user.email}</div>
           </div>
           <Button variant="ghost" onClick={() => logout()} title="Logout" className="flex items-center gap-2 text-slate-500 hover:text-slate-900">
              <span>Logout</span>
              <LogOut className="h-4 w-4" />
           </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-white md:block md:w-64 lg:w-72 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </div>
      
      {/* Mobile Topbar & Content */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex h-16 items-center gap-4 border-b bg-white px-4 md:hidden sticky top-0 z-30">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger>
              <div className="flex h-10 w-10 items-center justify-center rounded-md border text-sm shrink-0 md:hidden hover:bg-slate-100 transition-colors">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </div>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 border-r">
               <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 font-semibold">
            <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">V</div>
            <span>VertexAgent.io</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            {user?.role === 'ADMIN' && maintenanceMode && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-900 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">System in Maintenance Mode</p>
                  <p className="text-xs text-amber-700">All public tours and agent portals are restricted. Toggle this in <Link to="/app/settings" className="underline font-bold">Admin Settings</Link>.</p>
                </div>
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
