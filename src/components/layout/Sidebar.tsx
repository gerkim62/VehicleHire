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

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const links: SidebarLink[] = [];

  if (user.role === "client") {
    links.push(
      { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
      { to: "/vehicles", label: "Browse Vehicles", icon: <Search className="w-5 h-5" /> },
      { to: "/bookings", label: "My Bookings", icon: <CalendarCheck className="w-5 h-5" /> },
      { to: "/history", label: "Hire History", icon: <History className="w-5 h-5" /> }
    );
  } else if (user.role === "agent") {
    links.push(
      { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
      { to: "/my-vehicles", label: "My Vehicles", icon: <Car className="w-5 h-5" /> },
      { to: "/add-vehicle", label: "Add Vehicle", icon: <PlusCircle className="w-5 h-5" /> },
      { to: "/agent-bookings", label: "Bookings", icon: <CalendarCheck className="w-5 h-5" /> },
      { to: "/active-sessions", label: "Active Sessions", icon: <Timer className="w-5 h-5" /> },
      { to: "/agent-reviews", label: "Reviews", icon: <Star className="w-5 h-5" /> },
      { to: "/reports", label: "Reports", icon: <BarChart3 className="w-5 h-5" /> }
    );
  } else if (user.role === "admin") {
    links.push(
      { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
      { to: "/manage-agents", label: "Agent Approvals", icon: <Shield className="w-5 h-5" /> },
      { to: "/manage-users", label: "Users", icon: <Users className="w-5 h-5" /> },
      { to: "/all-sessions", label: "Active Sessions", icon: <Timer className="w-5 h-5" /> },
      { to: "/admin-reports", label: "Reports", icon: <BarChart3 className="w-5 h-5" /> }
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-4rem)] bg-white border-r border-surface-100">
      <div className="flex-1 py-6 px-4 space-y-1">
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
                  ? "bg-primary-50 text-primary-700 shadow-sm"
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
  );
}
