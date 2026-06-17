import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "../../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Car,
  Bell,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../ui/Badge";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const notifications = useQuery(
    api.notifications.getUnread,
    user ? { userId: user._id } : "skip"
  );

  const unreadCount = notifications?.length || 0;

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/" });
  };

  return (
    <nav className="sticky top-0 z-40 glass border-b border-surface-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:shadow-lg group-hover:shadow-primary-500/30 transition-shadow">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              VehicleHire
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors shadow-md shadow-primary-600/20"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                {/* Notification bell */}
                <button className="relative p-2 rounded-xl hover:bg-surface-100 transition-colors cursor-pointer">
                  <Bell className="w-5 h-5 text-surface-500" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white bg-danger-500 rounded-full">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* User info */}
                <div className="flex items-center gap-3 pl-2 border-l border-surface-200">
                  <div className="text-right">
                    <p className="text-sm font-medium text-surface-900 leading-tight">
                      {user.name}
                    </p>
                    <Badge variant={user.role === "admin" ? "danger" : user.role === "agent" ? "info" : "default"} size="sm">
                      {user.role}
                    </Badge>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-sm font-semibold">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-9 h-9 rounded-xl object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl hover:bg-surface-100 transition-colors text-surface-400 hover:text-surface-600 cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-surface-100 transition-colors cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-surface-100 animate-fade-in">
            {!user ? (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2.5 text-sm font-medium text-surface-600 rounded-xl hover:bg-surface-100"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-sm font-semibold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-surface-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-danger-600 rounded-xl hover:bg-danger-50 text-left cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
