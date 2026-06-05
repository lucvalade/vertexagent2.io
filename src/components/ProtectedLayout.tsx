import { Navigate, Outlet } from "react-router-dom";
import { useAuth, loginWithGoogle, logout } from "@/hooks/useAuth";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { LogOut, Home, LayoutDashboard, List, Users, MessageSquare, Image, Mic2, Zap, Link2, BarChart2, LayoutTemplate, Building2, CreditCard, Settings, Menu, Shield, AlertTriangle, Globe, ChevronDown, Bell, FileBox } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [viewMode, setViewMode] = useState<'ADMIN' | 'CLIENT'>(
    (user?.role === 'ADMIN' || user?.email === 'luc.valade@gmail.com') ? 'ADMIN' : 'CLIENT'
  );

  // Inactivity Logout (4 hours)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      // 4 hours = 4 * 60 * 60 * 1000
      timeoutId = setTimeout(() => {
        toast.info("Session expired", {
          description: "You have been logged out due to 4 hours of inactivity.",
        });
        logout();
      }, 4 * 60 * 60 * 1000);
    };

    // Events to track activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const activityHandler = () => resetTimer();

    events.forEach(event => {
      document.addEventListener(event, activityHandler);
    });

    // Initial set
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, activityHandler);
      });
    };
  }, [logout]);

  // Sync viewMode with path
  useEffect(() => {
    if (location.pathname.startsWith('/app/admin')) {
      setViewMode('ADMIN');
    } else if (location.pathname.startsWith('/app/')) {
      setViewMode('CLIENT');
    }
  }, [location.pathname]);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.email === 'luc.valade@gmail.com') {
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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const navLinks = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/app/overview" },
    { label: "Listings", icon: List, path: "/app/listings" },
    { label: "AI Tour", icon: Mic2, path: "/app/aitours" },
    { label: "Open Houses", icon: Home, path: "/app/openhouses" },
    { label: "Flyers", icon: LayoutTemplate, path: "/app/flyers" },
    { label: "Leads", icon: Users, path: "/app/leads" },
    { label: "Lenders", icon: CreditCard, path: "/app/lenders" },
    { label: "Teams", icon: Building2, path: "/app/team" },
    { label: "Settings", icon: Settings, path: "/app/settings" },
  ];

  const adminLinks = [
    { label: "Landing Page", icon: Globe, path: "/?no_redirect=true", external: true },
    { label: "Clean Landing Page", icon: Globe, path: "/?clean=true", external: true },
    { label: "Dashboard", icon: Shield, path: "/app/admin" },
    { label: "Manage Agents", icon: Users, path: "/app/admin/users" },
    { label: "All Listings", icon: List, path: "/app/admin/listings" },
    { label: "Launch Notifications FREE Plan", icon: Bell, path: "/app/admin/notifications" },
    { label: "System Logs", icon: FileBox, path: "/app/admin/logs" },
    { label: "Settings", icon: Settings, path: "/app/admin/settings" },
  ];

  // Check for new notifications
  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.email === 'luc.valade@gmail.com') {
      const checkNewSignups = async () => {
        const lastVisitStr = localStorage.getItem("last_admin_signup_check");
        const lastVisit = lastVisitStr ? parseInt(lastVisitStr) : (Date.now() - 24 * 60 * 60 * 1000); // Default to last 24h
        
        try {
          const q = query(
            collection(db, "launch_notifications"), 
            where("createdAt", ">", new Date(lastVisit)),
            limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            toast.success("New Leads Available!", {
              description: "You have new launch notifications from the landing page.",
              action: {
                label: "View Notifications",
                onClick: () => navigate("/app/admin/notifications")
              },
              duration: 10000,
            });
          }
          localStorage.setItem("last_admin_signup_check", Date.now().toString());
        } catch (err) {
          console.error("New signups check failed:", err);
        }
      };
      checkNewSignups();
    }
  }, [user?.id]);

  const currentLinks = viewMode === 'ADMIN' ? adminLinks : navLinks;
  const activeColor = viewMode === 'ADMIN' ? 'red' : 'blue';

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-blue-950 text-white">
      <div className="flex flex-col h-20 items-center justify-center border-b border-blue-900 px-6 relative">
        <Link to="/" className="flex items-center gap-2 font-bold text-white">
          <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center text-[#0224bb] font-bold border border-white animate-multicolor-pulse">
            A
          </div>
          <span className="text-lg tracking-tight">AI Open House Connect</span>
        </Link>
        <div className="absolute bottom-1 left-6">
          <DropdownMenu>
            <DropdownMenuTrigger className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded border inline-flex items-center gap-1 cursor-pointer transition-colors outline-none ${
                viewMode === 'ADMIN' 
                  ? 'bg-red-900/50 text-red-100 border-red-800' 
                  : 'bg-blue-900/50 text-blue-100 border-blue-800'
              }`}>
                <Shield className="h-2 w-2" />
                {viewMode === 'ADMIN' ? 'Admin Mode' : 'Client Mode'}
                <ChevronDown className="h-2 w-2 ml-1 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {(user?.role === 'ADMIN' || user?.email === 'luc.valade@gmail.com') && (
                <DropdownMenuItem onClick={() => { setViewMode('ADMIN'); navigate("/app/admin"); }} className="cursor-pointer">
                  <Shield className="h-3.5 w-3.5 mr-2 text-red-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Admin Mode</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => { setViewMode('CLIENT'); navigate("/app/overview"); }} className="cursor-pointer">
                <Home className="h-3.5 w-3.5 mr-2 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider">Client Mode</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-4">
          {currentLinks.map((link) => {
            const active = location.pathname.startsWith(link.path) && (link.path !== '/' || location.pathname === '/');
            const isExternal = 'external' in link && link.external;
            
            if (isExternal) {
              return (
                <a
                  key={link.label}
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={viewMode === 'CLIENT' 
                    ? "flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-white/90 hover:text-white hover:bg-white/10 font-bold"
                    : `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-${activeColor}-600 text-slate-600 hover:bg-slate-50`
                  }
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </a>
              );
            }

            return (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={viewMode === 'CLIENT'
                  ? `flex items-center gap-3 rounded-lg px-3 py-2 transition-all font-bold ${
                      active ? "bg-white/15 text-white font-extrabold shadow-sm border border-white/10" : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`
                  : `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-${activeColor}-600 ${
                      active ? `bg-${activeColor}-50 text-${activeColor}-600 font-medium` : "text-slate-600 hover:bg-slate-50"
                    }`
                }
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className={`border-t p-4 ${viewMode === 'CLIENT' ? 'border-blue-900' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between">
           <div className="text-sm truncate pr-2">
             <div className={`font-bold truncate ${viewMode === 'CLIENT' ? 'text-white' : 'text-slate-900'}`}>{user.name}</div>
             <div className={`truncate text-xs ${viewMode === 'CLIENT' ? 'text-blue-200' : 'text-slate-400'}`}>{user.email}</div>
           </div>
           <Button variant="ghost" onClick={() => logout()} title="Logout" className={`flex items-center gap-2 font-bold cursor-pointer transition-colors ${viewMode === 'CLIENT' ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900'}`}>
              <span>Logout</span>
              <LogOut className="h-4 w-4" />
           </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-white md:block md:w-64 lg:w-72 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </div>
      
      {/* Mobile Topbar & Content */}
      <div className="flex flex-col flex-1 min-w-0 max-w-full overflow-x-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-blue-900 bg-blue-950 px-4 md:hidden sticky top-0 z-30">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger>
              <div className="flex h-10 w-10 items-center justify-center rounded-md border text-sm shrink-0 md:hidden hover:bg-blue-900 transition-colors">
                <Menu className="h-5 w-5 text-white" />
                <span className="sr-only">Toggle navigation menu</span>
              </div>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 border-r bg-blue-950">
               <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 font-bold text-white">
            <div className="h-6 w-6 bg-white rounded-full flex items-center justify-center text-[#0224bb] font-bold border border-white text-xs text-center animate-multicolor-pulse">A</div>
            <span>AI Open House Connect</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className={`mx-auto ${location.pathname.includes('/flyers') ? 'max-w-7xl lg:max-w-[1380px] w-full' : 'max-w-5xl'}`}>
            {(user?.role === 'ADMIN' || user?.email === 'luc.valade@gmail.com') && maintenanceMode && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-900 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">System in Maintenance Mode</p>
                  <p className="text-xs text-amber-700">All public tours and agent portals are restricted. Toggle this in <Link to="/app/admin/settings" className="underline font-bold">Settings</Link>.</p>
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
