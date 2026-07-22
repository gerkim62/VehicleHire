import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { StatCard, Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import {
  Car,
  Users,
  Timer,
  DollarSign,
  CalendarCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  Shield,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, formatRelativeTime } from "../lib/utils";
import { PendingAgentDashboard } from "../components/dashboard/PendingAgentDashboard";
import { RejectedAgentDashboard } from "../components/dashboard/RejectedAgentDashboard";
import type { Booking, Vehicle, Session, User as DBUser } from "../lib/types";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

export function DashboardPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    navigate({ to: "/login" });
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 w-full max-w-7xl pb-20 md:pb-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-surface-900">
            {user.role === "admin"
              ? "Admin Dashboard"
              : user.role === "agent"
                ? "Agent Dashboard"
                : "My Dashboard"}
          </h1>
          <p className="text-surface-500 mt-1">
            Welcome back, {user.name}
          </p>
        </div>

        {user.role === "client" && <ClientDashboard />}
        {user.role === "agent" && user.agentStatus === "approved" && <AgentDashboard />}
        {user.role === "agent" && user.agentStatus === "pending" && <PendingAgentDashboard user={user} />}
        {user.role === "agent" && user.agentStatus === "rejected" && <RejectedAgentDashboard user={user} />}
        {user.role === "admin" && <AdminDashboard />}
      </main>
    </div>
  );
}

function ClientDashboard() {
  const { user } = useAuth();
  const stats = useQuery(api.reports.getClientStats, user ? { clientId: user._id } : "skip");
  const bookings = useQuery(api.bookings.getByClient, user ? { clientId: user._id } : "skip");

  if (!stats) return <Spinner className="w-6 h-6" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Bookings" value={stats.totalBookings} icon={<CalendarCheck className="w-5 h-5" />} color="primary" />
        <StatCard title="Total Sessions" value={stats.totalSessions} icon={<Timer className="w-5 h-5" />} color="success" />
        <StatCard title="Total Spent" value={formatCurrency(stats.totalSpent)} icon={<DollarSign className="w-5 h-5" />} color="accent" />
      </div>

      {stats.activeSession && (
        <Card className="border-success-200 bg-success-50/50">
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-success-500 animate-pulse" />
              <div>
                <p className="font-semibold text-surface-900">Active Session</p>
                <p className="text-sm text-surface-500">You have an active hire session running</p>
              </div>
            </div>
            <Link to="/session/$sessionId" params={{ sessionId: stats.activeSession._id }}>
              <Button size="sm">
                View Session <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-900">Recent Bookings</h3>
            <Link to="/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          {bookings && bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.slice(0, 5).map((b: Booking & { vehicle?: Vehicle | null }) => (
                <div key={b._id} className="flex items-center justify-between py-2 border-b border-surface-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-surface-900">
                      {b.vehicle?.make} {b.vehicle?.model}
                    </p>
                    <p className="text-xs text-surface-400">{formatRelativeTime(b.createdAt)}</p>
                  </div>
                  <Badge variant={b.status === "confirmed" ? "success" : b.status === "cancelled" ? "danger" : "warning"} dot>
                    {b.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-400 py-4 text-center">No bookings yet. Browse vehicles to get started!</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3 className="font-semibold text-surface-900 mb-3">Quick Navigation</h3>
          <div className="divide-y divide-surface-100 border border-surface-100 rounded-2xl overflow-hidden bg-white">
            <Link
              to="/vehicles"
              className="flex items-center justify-between p-3.5 hover:bg-surface-50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-surface-900 text-sm">Browse Vehicles</p>
                  <p className="text-xs text-surface-500">Explore available vehicles and book your ride</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-surface-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            <Link
              to="/history"
              className="flex items-center justify-between p-3.5 hover:bg-surface-50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-surface-900 text-sm">Hire History</p>
                  <p className="text-xs text-surface-500">View completed vehicle hire sessions and receipts</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-surface-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AgentDashboard() {
  const { user } = useAuth();
  const stats = useQuery(api.reports.getAgentStats, user ? { agentId: user._id } : "skip");
  const activeSessions = useQuery(api.sessions.getActiveByAgent, user ? { agentId: user._id } : "skip");

  if (!stats) return <Spinner className="w-6 h-6" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Vehicles" value={stats.totalVehicles} icon={<Car className="w-5 h-5" />} color="primary" />
        <StatCard title="Active Sessions" value={stats.activeSessions} icon={<Timer className="w-5 h-5" />} color="success" />
        <StatCard title="Completed" value={stats.completedSessions} icon={<CalendarCheck className="w-5 h-5" />} color="warning" />
        <StatCard title="Revenue" value={formatCurrency(stats.totalRevenue)} icon={<TrendingUp className="w-5 h-5" />} color="accent" />
      </div>

      {activeSessions && activeSessions.length > 0 && (
        <Card>
          <CardContent>
            <h3 className="font-semibold text-surface-900 mb-4">Active Sessions</h3>
            <div className="space-y-3">
              {activeSessions.map((s: Session & { vehicle?: Vehicle | null; client?: DBUser | null }) => (
                <div key={s._id} className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
                  <div>
                    <p className="text-sm font-medium">{s.vehicle?.make} {s.vehicle?.model}</p>
                    <p className="text-xs text-surface-400">Client: {s.client?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" dot>In Progress</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <h3 className="font-semibold text-surface-900 mb-3">Quick Navigation</h3>
          <div className="divide-y divide-surface-100 border border-surface-100 rounded-2xl overflow-hidden bg-white">
            <Link
              to="/my-vehicles"
              className="flex items-center justify-between p-3.5 hover:bg-surface-50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-surface-900 text-sm">My Vehicles</p>
                  <p className="text-xs text-surface-500">Manage vehicle listings, pricing, and availability</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-surface-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            <Link
              to="/agent-bookings"
              className="flex items-center justify-between p-3.5 hover:bg-surface-50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors shrink-0">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-surface-900 text-sm">Bookings</p>
                  <p className="text-xs text-surface-500">Review incoming customer booking requests</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-surface-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            <Link
              to="/active-sessions"
              className="flex items-center justify-between p-3.5 hover:bg-surface-50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors shrink-0">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-surface-900 text-sm">Sessions Map</p>
                  <p className="text-xs text-surface-500">Monitor active hires and live GPS locations</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-surface-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  const stats = useQuery(api.reports.getPlatformStats);

  if (!stats) return <Spinner className="w-6 h-6" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Clients" value={stats.totalClients} icon={<Users className="w-5 h-5" />} color="primary" />
        <StatCard title="Agents" value={stats.totalAgents} icon={<Car className="w-5 h-5" />} color="success" />
        <StatCard title="Active Sessions" value={stats.activeSessions} icon={<Timer className="w-5 h-5" />} color="warning" />
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={<TrendingUp className="w-5 h-5" />} color="accent" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent>
            <h3 className="font-semibold mb-2">Platform Overview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-surface-500">Total Vehicles</span><span className="font-medium">{stats.totalVehicles}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Available Vehicles</span><span className="font-medium">{stats.activeVehicles}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Completed Sessions</span><span className="font-medium">{stats.completedSessions}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Total Payments</span><span className="font-medium">{stats.totalPayments}</span></div>
            </div>
          </CardContent>
        </Card>

        {stats.pendingAgents > 0 && (
          <Card className="border-warning-200">
            <CardContent>
              <h3 className="font-semibold mb-2 text-warning-700">Pending Approvals</h3>
              <p className="text-sm text-surface-500 mb-3">
                {stats.pendingAgents} agent{stats.pendingAgents > 1 ? "s" : ""} awaiting review.
              </p>
              <Link to="/manage-agents">
                <Button size="sm" variant="outline">
                  Review Now <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardContent>
          <h3 className="font-semibold text-surface-900 mb-3">Quick Navigation</h3>
          <div className="divide-y divide-surface-100 border border-surface-100 rounded-2xl overflow-hidden bg-white">
            <Link
              to="/manage-agents"
              className="flex items-center justify-between p-3.5 hover:bg-surface-50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-surface-900 text-sm">Agent Approvals</p>
                  <p className="text-xs text-surface-500">Review and verify new agent applications</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-surface-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            <Link
              to="/manage-users"
              className="flex items-center justify-between p-3.5 hover:bg-surface-50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-surface-900 text-sm">User Management</p>
                  <p className="text-xs text-surface-500">Manage registered clients and agents</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-surface-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            <Link
              to="/all-sessions"
              className="flex items-center justify-between p-3.5 hover:bg-surface-50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors shrink-0">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-surface-900 text-sm">All Sessions</p>
                  <p className="text-xs text-surface-500">Monitor active vehicle sessions across the platform</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-surface-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
