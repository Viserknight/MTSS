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
  Baby
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
      { to: "/teacher/lesson-plans", icon: Sparkles, label: "AI Lesson Plans" },
    ],
    parent: [
      { to: "/parent", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/parent/feed", icon: FileText, label: "School Feed" },
      { to: "/parent/report-cards", icon: ClipboardList, label: "Report Cards" },
      { to: "/parent/announcements", icon: FileText, label: "Announcements" },
    ],
    admin: [
      { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/admin/users", icon: Users, label: "Users" },
      { to: "/admin/children", icon: Baby, label: "All Children" },
      { to: "/admin/teacher-invitations", icon: Mail, label: "Teacher Invitations" },
      { to: "/admin/teacher-verification", icon: GraduationCap, label: "Teacher Verification" },
      { to: "/admin/classes", icon: Users, label: "Classes" },
      { to: "/admin/audit-logs", icon: ClipboardList, label: "Audit Logs" },
      { to: "/admin/posts", icon: FileText, label: "All Posts" },
      { to: "/admin/lesson-plans", icon: Sparkles, label: "Lesson Plans" },
    ],
  };

  const currentNav = role ? navItems[role] : [];
  const roleIcon = role === "admin" ? Shield : role === "teacher" ? GraduationCap : Users;
  const RoleIcon = roleIcon;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src={mtssLogo} alt="MTSS" className="h-10 w-auto" />
          <span className="font-heading font-bold">MTSS</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-sidebar-border">
            <Link to="/" className="flex items-center gap-3">
              <img src={mtssLogo} alt="MTSS" className="h-12 w-auto" />
              <div>
                <p className="font-heading font-bold text-sidebar-foreground">MTSS</p>
                <p className="text-xs text-sidebar-foreground/60">We Strive for Excellence</p>
              </div>
            </Link>
          </div>

          {/* Role Badge */}
          <div className="px-4 py-3 border-b border-sidebar-border">
            <div className="flex items-center gap-2 text-sm">
              <RoleIcon className="h-4 w-4 text-sidebar-primary" />
              <span className="capitalize text-sidebar-foreground/80">{role} Portal</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {currentNav.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors
                    ${isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="mb-3 text-sm">
              <p className="text-sidebar-foreground/60 truncate">{user?.email}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => navigate("/")}
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
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
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}