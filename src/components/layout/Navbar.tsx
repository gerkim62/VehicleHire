import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "../../hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Car,
  Bell,
  LogOut,
  Menu,
  X,
  User,
  CheckCheck,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Badge } from "../ui/Badge";
import { formatRelativeTime } from "../../lib/utils";
import type { Notification } from "../../lib/types";
import type { Id } from "../../../convex/_generated/dataModel";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const notifications = useQuery(
    api.notifications.getAll,
    user ? { userId: user._id } : "skip"
  );
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const unread = notifications?.filter((n: Notification) => !n.isRead) || [];
  const unreadCount = unread.length;

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/" });
  };

  const handleMarkAll = async () => {
    if (!user) return;
    await markAllRead({ userId: user._id });
  };

  const handleNotifClick = async (notifId: string) => {
    await markRead({ notificationId: notifId as Id<"notifications"> });
  };

  const notifTypeIcon: Record<string, string> = {
    booking_created: "📋",
    session_started: "🟢",
    session_completed: "🏁",
    payment_received: "💳",
    review_received: "⭐",
    agent_approved: "✅",
    agent_rejected: "❌",
  };

  return (
    <nav className="sticky top-0 z-40 glass border-b border-surface-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm group-hover:bg-primary-700 transition-colors">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-surface-900 font-serif tracking-tight">
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
                <div className="relative" ref={notifRef}>
                  <button
                    id="notification-bell"
                    onClick={() => setNotifOpen((o) => !o)}
                    className="relative p-2 rounded-xl hover:bg-surface-100 transition-colors cursor-pointer"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5 text-surface-500" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white bg-danger-500 rounded-full">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification panel */}
                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-surface-100 z-50 overflow-hidden animate-fade-in">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
                        <p className="font-semibold text-surface-900 text-sm">Notifications</p>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAll}
                            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-surface-50">
                        {!notifications || notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-surface-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 15).map((n: Notification) => (
                            <button
                              key={n._id}
                              onClick={() => handleNotifClick(n._id)}
                              className={`w-full text-left px-4 py-3 transition-colors hover:bg-surface-50 cursor-pointer ${!n.isRead ? "bg-primary-50/40" : ""}`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="text-base mt-0.5">
                                  {notifTypeIcon[n.type] ?? "🔔"}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-surface-900" : "text-surface-700"}`}>
                                    {n.title}
                                  </p>
                                  <p className="text-xs text-surface-500 mt-0.5 leading-snug line-clamp-2">
                                    {n.message}
                                  </p>
                                  <p className="text-[10px] text-surface-400 mt-1">
                                    {formatRelativeTime(n.createdAt)}
                                  </p>
                                </div>
                                {!n.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

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
                  <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center text-white text-sm font-semibold">
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
                  <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-white text-sm font-semibold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-surface-500">{user.email}</p>
                  </div>
                  {unreadCount > 0 && (
                    <Badge variant="danger" size="sm">{unreadCount} new</Badge>
                  )}
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
