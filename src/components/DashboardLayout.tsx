import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  Sparkles, 
  Users, 
  ClipboardList, 
  LogOut, 
  Menu, 
  X,
  GraduationCap,
  Shield,
  Home,
  Mail,
  Baby,
  Calendar,
  CheckSquare,
  MessageSquare
} from "lucide-react";
import mtssLogo from "@/assets/mtss-logo.png";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = {
    teacher: [
      { to: "/teacher", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/teacher/posts", icon: FileText, label: "Posts" },
      { to: "/teacher/report-cards", icon: ClipboardList, label: "Report Cards" },
      { to: "/teacher/attendance", icon: CheckSquare, label: "Attendance" },
      { to: "/teacher/messages", icon: MessageSquare, label: "Messages" },
      { to: "/teacher/lesson-plans", icon: Sparkles, label: "AI Lesson Plans" },
    ],
    parent: [
      { to: "/parent", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/parent/feed", icon: FileText, label: "School Feed" },
      { to: "/parent/timetable", icon: Calendar, label: "Timetable" },
      { to: "/parent/attendance", icon: CheckSquare, label: "Attendance" },
      { to: "/parent/report-cards", icon: ClipboardList, label: "Report Cards" },
    ],
    admin: [
      { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/admin/users", icon: Users, label: "Users" },
      { to: "/admin/children", icon: Baby, label: "All Children" },
      { to: "/admin/classes", icon: Users, label: "Classes" },
      { to: "/admin/timetables", icon: Calendar, label: "Timetables" },
      { to: "/admin/attendance", icon: CheckSquare, label: "Attendance" },
      { to: "/admin/teacher-invitations", icon: Mail, label: "Invitations" },
      { to: "/admin/teacher-verification", icon: GraduationCap, label: "Verification" },
      { to: "/admin/posts", icon: FileText, label: "All Posts" },
      { to: "/admin/lesson-plans", icon: Sparkles, label: "Lesson Plans" },
      { to: "/admin/audit-logs", icon: ClipboardList, label: "Audit Logs" },
    ],
  };

  const currentNav = role ? navItems[role] : [];
  const roleIcon = role === "admin" ? Shield : role === "teacher" ? GraduationCap : Users;
  const RoleIcon = roleIcon;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 nav-3d h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src={mtssLogo} alt="MTSS" className="h-10 w-auto drop-shadow-lg" />
          <span className="font-heading font-bold text-3d">MTSS</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground sidebar-3d
        transform transition-transform duration-300 ease-out
        lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full relative">
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          
          {/* Logo */}
          <div className="p-4 border-b border-sidebar-border relative">
            <Link to="/" className="flex items-center gap-3 group">
              <img src={mtssLogo} alt="MTSS" className="h-12 w-auto drop-shadow-lg group-hover:scale-105 transition-transform" />
              <div>
                <p className="font-heading font-bold text-sidebar-foreground text-3d">MTSS</p>
                <p className="text-xs text-sidebar-foreground/60">We Strive for Excellence</p>
              </div>
            </Link>
          </div>

          {/* Role Badge */}
          <div className="px-4 py-3 border-b border-sidebar-border relative">
            <div className="flex items-center gap-2 text-sm glass-3d rounded-lg px-3 py-2">
              <div className="icon-3d h-8 w-8 rounded-lg">
                <RoleIcon className="h-4 w-4 text-primary" />
              </div>
              <span className="capitalize text-sidebar-foreground/90 font-medium">{role} Portal</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 relative">
            {currentNav.map((item, index) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-200 hover-lift
                    ${isActive 
                      ? "bg-gradient-to-r from-primary to-primary/80 text-sidebar-primary-foreground shadow-[0_4px_12px_hsl(var(--primary)/0.4)]" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }
                  `}
                >
                  <div className={`
                    h-8 w-8 rounded-lg flex items-center justify-center
                    ${isActive ? "bg-white/20" : "bg-sidebar-accent/50"}
                  `}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-sidebar-border relative">
            <div className="mb-3 text-sm glass-3d rounded-lg p-3">
              <p className="text-sidebar-foreground/60 truncate text-xs">Logged in as</p>
              <p className="text-sidebar-foreground font-medium truncate">{user?.email}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-xl"
                onClick={() => navigate("/")}
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded-xl"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 perspective-container">
          {children}
        </div>
      </main>
    </div>
  );
}