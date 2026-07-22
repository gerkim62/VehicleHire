import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  Car,
  CalendarCheck,
  Timer,
  History,
  Search,
  PlusCircle,
  BarChart3,
  Users,
  Shield,
  Star,
} from "lucide-react";

export interface SidebarLink {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export function getNavLinks(role: string): SidebarLink[] {
  if (role === "client") {
    return [
      { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
      { to: "/vehicles", label: "Browse Vehicles", icon: <Search className="w-5 h-5" /> },
      { to: "/bookings", label: "My Bookings", icon: <CalendarCheck className="w-5 h-5" /> },
      { to: "/history", label: "Hire History", icon: <History className="w-5 h-5" /> },
    ];
  } else if (role === "agent") {
    return [
      { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
      { to: "/my-vehicles", label: "My Vehicles", icon: <Car className="w-5 h-5" /> },
      { to: "/add-vehicle", label: "Add Vehicle", icon: <PlusCircle className="w-5 h-5" /> },
      { to: "/agent-bookings", label: "Bookings", icon: <CalendarCheck className="w-5 h-5" /> },
      { to: "/active-sessions", label: "Active Sessions", icon: <Timer className="w-5 h-5" /> },
      { to: "/agent-reviews", label: "Reviews", icon: <Star className="w-5 h-5" /> },
      { to: "/reports", label: "Reports", icon: <BarChart3 className="w-5 h-5" /> },
    ];
  } else if (role === "admin") {
    return [
      { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
      { to: "/manage-agents", label: "Agent Approvals", icon: <Shield className="w-5 h-5" /> },
      { to: "/manage-users", label: "Users", icon: <Users className="w-5 h-5" /> },
      { to: "/all-sessions", label: "Active Sessions", icon: <Timer className="w-5 h-5" /> },
      { to: "/admin-reports", label: "Reports", icon: <BarChart3 className="w-5 h-5" /> },
    ];
  }
  return [];
}

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const links = getNavLinks(user.role);

  return (
    <>
      {/* Mobile Top Horizontal Scroll Bar (< 768px) */}
      <nav className="md:hidden w-full sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-surface-200/70 px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-2xs">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all duration-200",
                isActive
                  ? "bg-primary-600 text-white shadow-xs"
                  : "bg-surface-100 text-surface-700 hover:bg-surface-200 hover:text-surface-900"
              )}
            >
              <span className={cn("w-4 h-4 flex items-center justify-center shrink-0", isActive ? "text-white" : "text-surface-500")}>
                {link.icon}
              </span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop & Tablet Sidebar (>= 768px, including 935px) */}
      <aside className="hidden md:flex flex-col w-56 lg:w-64 min-h-[calc(100vh-4rem)] bg-white border-r border-surface-100 shrink-0">
        <div className="flex-1 py-6 px-3 lg:px-4 space-y-1">
          <p className="px-3 mb-3 text-xs font-semibold text-surface-400 uppercase tracking-wider">
            {user.role === "admin" ? "Administration" : user.role === "agent" ? "Agent Panel" : "Navigation"}
          </p>
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary-50 text-primary-700 shadow-sm font-semibold"
                    : "text-surface-600 hover:bg-surface-50 hover:text-surface-900"
                )}
              >
                <span
                  className={cn(
                    isActive ? "text-primary-600" : "text-surface-400"
                  )}
                >
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Mobile Bottom Fixed Bar (< 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-surface-200/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {links.slice(0, 5).map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-all duration-200",
                isActive
                  ? "text-primary-600 font-bold"
                  : "text-surface-500 hover:text-surface-800"
              )}
            >
              <span className={cn("w-5 h-5 flex items-center justify-center mb-0.5", isActive ? "text-primary-600 scale-110" : "text-surface-400")}>
                {link.icon}
              </span>
              <span className="truncate max-w-[64px]">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
