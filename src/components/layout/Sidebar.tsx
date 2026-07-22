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
  Compass,
  ChevronRight,
  User,
  LogOut,
  Zap,
} from "lucide-react";
import { useRouter } from "@tanstack/react-router";

export interface SidebarLink {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export function getNavLinks(role: string): SidebarLink[] {
  if (role === "client") {
    return [
      { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { to: "/vehicles", label: "Browse Vehicles", icon: <Search className="w-4 h-4" /> },
      { to: "/bookings", label: "My Bookings", icon: <CalendarCheck className="w-4 h-4" /> },
      { to: "/history", label: "Hire History", icon: <History className="w-4 h-4" /> },
    ];
  } else if (role === "agent") {
    return [
      { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { to: "/my-vehicles", label: "My Fleet", icon: <Car className="w-4 h-4" /> },
      { to: "/add-vehicle", label: "Add Vehicle", icon: <PlusCircle className="w-4 h-4" /> },
      { to: "/agent-bookings", label: "Bookings", icon: <CalendarCheck className="w-4 h-4" /> },
      { to: "/active-sessions", label: "Active Rentals", icon: <Timer className="w-4 h-4" /> },
      { to: "/agent-reviews", label: "Reviews", icon: <Star className="w-4 h-4" /> },
      { to: "/reports", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
    ];
  } else if (role === "admin") {
    return [
      { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { to: "/manage-agents", label: "Agent Approvals", icon: <Shield className="w-4 h-4" /> },
      { to: "/manage-users", label: "User Management", icon: <Users className="w-4 h-4" /> },
      { to: "/all-sessions", label: "Active Rentals", icon: <Timer className="w-4 h-4" /> },
      { to: "/admin-reports", label: "System Reports", icon: <BarChart3 className="w-4 h-4" /> },
    ];
  }
  return [];
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const router = useRouter();

  if (!user) return null;

  const links = getNavLinks(user.role);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return { title: "Admin HQ", subtitle: "System Controller", icon: <Shield className="w-3.5 h-3.5 text-amber-600" /> };
      case "agent":
        return { title: "Partner Suite", subtitle: "Fleet Manager", icon: <Car className="w-3.5 h-3.5 text-primary-600" /> };
      default:
        return { title: "Member Hub", subtitle: "Vehicle Hire Client", icon: <Compass className="w-3.5 h-3.5 text-emerald-600" /> };
    }
  };

  const roleBadge = getRoleBadge(user.role);

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/" });
  };

  return (
    <>
      {/* Mobile Top Horizontal Scroll Pill Bar (< 768px) */}
      <nav className="md:hidden w-full sticky top-16 z-30 bg-surface-0/90 backdrop-blur-xl border-b border-surface-200/60 px-3 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-xs">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all duration-200 active:scale-95",
                isActive
                  ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-sm shadow-primary-600/20"
                  : "bg-surface-100/80 text-surface-700 hover:bg-surface-200/80 hover:text-surface-900"
              )}
            >
              <span className={cn("w-4 h-4 flex items-center justify-center shrink-0 transition-transform duration-200", isActive ? "text-white scale-110" : "text-surface-500")}>
                {link.icon}
              </span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop & Tablet Sidebar (>= 768px) */}
      <aside className="hidden md:flex flex-col w-60 lg:w-64 sticky top-16 h-[calc(100vh-4rem)] bg-white/95 backdrop-blur-md border-r border-surface-200/70 shrink-0 self-start shadow-[1px_0_10px_rgba(0,0,0,0.02)] select-none">
        
        {/* Header Pill Card */}
        <div className="pt-5 px-4 pb-2">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-br from-surface-50 to-primary-50/30 border border-surface-200/60 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-2xs text-primary-600 border border-surface-200/50">
                {roleBadge.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-surface-900 leading-tight flex items-center gap-1">
                  {roleBadge.title}
                </span>
                <span className="text-[10px] text-surface-500 font-medium">
                  {roleBadge.subtitle}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-5 pt-3 pb-1 flex items-center justify-between">
          <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-primary-500" /> Navigation
          </span>
          <span className="text-[10px] font-medium text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">
            {links.length} items
          </span>
        </div>

        {/* Nav Links */}
        <div className="flex-1 py-1 px-3 space-y-1.5 overflow-y-auto">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "group relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98]",
                  isActive
                    ? "bg-gradient-to-r from-primary-500/10 via-primary-500/5 to-transparent text-primary-900 font-semibold shadow-2xs"
                    : "text-surface-600 hover:bg-surface-100/70 hover:text-surface-900 hover:translate-x-0.5"
                )}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-gradient-to-b from-primary-500 to-primary-600 rounded-r-full shadow-xs" />
                )}

                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                      isActive
                        ? "bg-primary-600 text-white shadow-xs shadow-primary-600/30 scale-105"
                        : "bg-surface-100/80 text-surface-500 group-hover:bg-primary-50 group-hover:text-primary-600"
                    )}
                  >
                    {link.icon}
                  </div>
                  <span className="text-xs font-semibold tracking-tight">{link.label}</span>
                </div>

                <ChevronRight
                  className={cn(
                    "w-3.5 h-3.5 transition-all duration-200 opacity-0 group-hover:opacity-100",
                    isActive ? "opacity-100 text-primary-600 translate-x-0" : "text-surface-400 -translate-x-1 group-hover:translate-x-0"
                  )}
                />
              </Link>
            );
          })}
        </div>

        {/* Bottom User Profile Card */}
        <div className="p-3 m-3 rounded-2xl bg-gradient-to-b from-surface-50/90 to-surface-100/60 border border-surface-200/70 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden border border-white">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-surface-900 truncate leading-snug">
                {user.name}
              </p>
              <p className="text-[10px] text-surface-500 truncate leading-none">
                {user.email}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-surface-200/50 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-surface-500 text-[10px] tracking-wide">
              {user.role.toUpperCase()}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-[11px] font-semibold text-danger-600 hover:text-danger-700 hover:bg-danger-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3" />
              Exit
            </button>
          </div>
        </div>

      </aside>

      {/* Mobile Floating Bottom Dock Bar (< 768px) */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-30 bg-white/90 backdrop-blur-xl border border-surface-200/80 px-2 py-1.5 flex items-center justify-around rounded-3xl shadow-xl shadow-surface-950/5">
        {links.slice(0, 5).map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl text-[10px] font-semibold transition-all duration-200 active:scale-90",
                isActive
                  ? "text-primary-600"
                  : "text-surface-500 hover:text-surface-800"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-xl transition-all duration-200 mb-0.5",
                  isActive
                    ? "bg-primary-600 text-white shadow-xs shadow-primary-600/30 scale-110"
                    : "text-surface-500"
                )}
              >
                {link.icon}
              </div>
              <span className="truncate max-w-[64px] text-[10px] leading-tight">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}


