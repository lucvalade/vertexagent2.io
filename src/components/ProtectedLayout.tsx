import { Navigate, Outlet } from "react-router-dom";
import { useAuth, loginWithGoogle, logout } from "@/hooks/useAuth";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import Logo from "./Logo";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import AgentVoiceControl from "./AgentVoiceControl";
import { LogOut, Home, LayoutDashboard, List, Users, MessageSquare, Image, Mic2, Zap, Link2, BarChart2, LayoutTemplate, Building2, CreditCard, Settings, Menu, Shield, AlertTriangle, Globe, ChevronDown, Bell, FileBox, Volume2, Video, Mail } from "lucide-react";
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

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center gap-4">
        <p className="text-muted-foreground animate-pulse font-medium text-lg">Loading AI Open House Connect Dashboard...</p>
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
    { label: "Voice Lab", icon: Volume2, path: "/app/voicelab" },
    { 
      label: "Open Houses", 
      icon: Home, 
      path: "/app/openhouses",
      subLinks: [
        { label: "Scheduled", path: "/app/openhouses?tab=scheduled" },
        { label: "Completed", path: "/app/openhouses?tab=completed" },
        { label: "Events & Results", path: "/app/openhouses?tab=results" }
      ]
    },
    { label: "Marketing Flyers", icon: LayoutTemplate, path: "/app/flyers" },
    { label: "Leads", icon: Users, path: "/app/leads" },
    { label: "Lenders", icon: Link2, path: "/app/lenders" },
    { label: "Teams", icon: Building2, path: "/app/team" },
    { label: "Settings", icon: Settings, path: "/app/settings" },
  ];

  const adminLinks = [
    { label: "Landing Page", icon: Globe, path: "/?no_redirect=true", external: true },
    { label: "Dashboard", icon: Shield, path: "/app/admin" },
    { label: "Manage Agents", icon: Users, path: "/app/admin/users" },
    { label: "All Listings", icon: List, path: "/app/admin/listings" },
    { label: "Welcome Messages", icon: Volume2, path: "/app/admin/welcomes" },
    { label: "Voice Lab", icon: Volume2, path: "/app/voicelab" },
    { label: "Onboarding Emails", icon: Mail, path: "/app/admin/emails" },
    { label: "Launch Notifications FREE Plan", icon: Bell, path: "/app/admin/notifications" },
    { label: "System Logs", icon: FileBox, path: "/app/admin/logs" },
    { label: "Settings", icon: Settings, path: "/app/admin/settings" },
  ];

  const currentLinks = viewMode === 'ADMIN' ? adminLinks : navLinks;
  const activeColor = viewMode === 'ADMIN' ? 'red' : 'blue';

  const SidebarContent = () => (
    <div className="flex h-full flex-col text-white" style={{ backgroundColor: '#50a2ff' }}>
      <div className="flex flex-col h-20 items-center justify-center border-b border-white/20 px-6 relative">
        <Link 
          to="/" 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="hover:opacity-90 transition-opacity"
        >
          <Logo variant="white" iconClassName="h-8.5 w-8.5" />
        </Link>
        <div className="absolute bottom-1 left-6">
          <DropdownMenu>
            <DropdownMenuTrigger className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded border inline-flex items-center gap-1 cursor-pointer transition-colors outline-none ${
                viewMode === 'ADMIN' 
                  ? 'bg-red-900/50 text-red-100 border-red-800' 
                  : 'bg-white/20 text-white border-white/30'
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
          {currentLinks.map((link: any) => {
            const active = location.pathname.startsWith(link.path.split('?')[0]) && (link.path !== '/' || location.pathname === '/');
            const isExternal = 'external' in link && link.external;
            
            if (isExternal) {
              return (
                <a
                  key={link.label}
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-white/90 hover:text-white hover:bg-white/10 font-bold"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </a>
              );
            }

            return (
              <div key={link.label} className="flex flex-col gap-1">
                <Link
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={viewMode === 'CLIENT'
                    ? `flex items-center gap-3 rounded-lg px-3 py-2 transition-all font-bold ${
                        active ? "bg-white/15 text-white font-extrabold shadow-sm border border-white/10" : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`
                    : `flex items-center gap-3 rounded-lg px-3 py-2 transition-all font-bold ${
                        active ? "bg-red-900/40 text-white font-extrabold shadow-sm border border-red-800/30" : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`
                  }
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
                {link.subLinks && (
                  <div className="flex flex-col gap-1 pl-7 mt-1 border-l border-white/20 ml-5">
                    {link.subLinks.map((sub: any) => {
                      const searchTab = new URLSearchParams(location.search).get("tab");
                      const subActive = active && (
                        (sub.path.includes("tab=scheduled") && searchTab === "scheduled") || 
                        (sub.path.includes("tab=completed") && searchTab === "completed") ||
                        (sub.path.includes("tab=results") && searchTab === "results")
                      );
                      return (
                        <Link
                          key={sub.label}
                          to={sub.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`text-xs font-semibold py-1 px-2.5 rounded transition-all ${
                            subActive 
                              ? "bg-white/20 text-white font-bold" 
                              : "text-white/70 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-4 border-white/20">
        <div className="flex items-center justify-between">
           <div className="text-sm truncate pr-2">
             <div className="font-bold truncate text-white">{user.name}</div>
             <div className="truncate text-xs text-blue-100">{user.email}</div>
           </div>
           <Button onClick={() => logout()} title="Logout" className="flex items-center gap-2 font-bold cursor-pointer transition-colors px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white text-white hover:text-blue-600 border border-white/30 text-xs">
              <span>Logout</span>
              <LogOut className="h-4 w-4" />
           </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 overflow-x-hidden relative">
      {/* Desktop Sidebar */}
      <div className="hidden border-r border-white/10 lg:block lg:w-72 lg:fixed lg:inset-y-0 lg:left-0 z-20 shrink-0 h-screen" style={{ backgroundColor: '#50a2ff' }}>
        <SidebarContent />
      </div>
      
      {/* Mobile Topbar & Content */}
      <div className="flex flex-col flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72">
        <header className="flex h-16 items-center gap-4 border-b border-white/20 px-4 lg:hidden sticky top-0 z-30" style={{ backgroundColor: '#50a2ff' }}>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger>
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 text-sm shrink-0 lg:hidden hover:bg-white/10 transition-colors">
                <Menu className="h-5 w-5 text-white" />
                <span className="sr-only">Toggle navigation menu</span>
              </div>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 border-r border-white/15" style={{ backgroundColor: '#50a2ff' }}>
               <SidebarContent />
            </SheetContent>
          </Sheet>
          <Link 
            to="/" 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="hover:opacity-90 transition-opacity"
          >
            <Logo variant="white" iconClassName="h-7.5 w-7.5" />
          </Link>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className={`mx-auto ${location.pathname.includes('/flyers') || location.pathname.includes('/aitours') ? 'max-w-7xl lg:max-w-[1380px] w-full' : 'max-w-5xl'}`}>
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
            <AgentVoiceControl />
          </div>
        </main>
      </div>
    </div>
  );
}
