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
} from "lucide-react";
import { formatCurrency, formatRelativeTime } from "../lib/utils";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
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
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-6xl">
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

        {user.role === "agent" && user.agentStatus === "pending" && (
          <div className="mb-6 p-4 rounded-2xl bg-warning-50 border border-warning-500/20">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-warning-600" />
              <div>
                <p className="font-semibold text-warning-700">Account Pending Approval</p>
                <p className="text-sm text-warning-600">Your agent account is awaiting administrator approval. You'll be able to list vehicles once approved.</p>
              </div>
            </div>
          </div>
        )}

        {user.role === "agent" && user.agentStatus === "rejected" && (
          <div className="mb-6 p-4 rounded-2xl bg-danger-50 border border-danger-500/20">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-danger-600" />
              <div>
                <p className="font-semibold text-danger-700">Account Rejected</p>
                <p className="text-sm text-danger-600">Your agent registration was not approved. Please contact the administrator.</p>
              </div>
            </div>
          </div>
        )}

        {user.role === "client" && <ClientDashboard />}
        {user.role === "agent" && user.agentStatus === "approved" && <AgentDashboard />}
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
            <Link to={`/session/${stats.activeSession._id}`}>
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
              {bookings.slice(0, 5).map((b) => (
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

      <div className="flex gap-4">
        <Link to="/vehicles" className="flex-1">
          <Button variant="outline" className="w-full">
            <Car className="w-4 h-4" /> Browse Vehicles
          </Button>
        </Link>
        <Link to="/history" className="flex-1">
          <Button variant="ghost" className="w-full">
            <Clock className="w-4 h-4" /> Hire History
          </Button>
        </Link>
      </div>
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
              {activeSessions.map((s) => (
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

      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/my-vehicles"><Button variant="outline" className="w-full"><Car className="w-4 h-4" /> My Vehicles</Button></Link>
        <Link to="/agent-bookings"><Button variant="outline" className="w-full"><CalendarCheck className="w-4 h-4" /> Bookings</Button></Link>
        <Link to="/active-sessions"><Button variant="outline" className="w-full"><Timer className="w-4 h-4" /> Sessions Map</Button></Link>
      </div>
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

      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/manage-agents"><Button variant="outline" className="w-full"><Shield className="w-4 h-4" /> Agent Approvals</Button></Link>
        <Link to="/manage-users"><Button variant="outline" className="w-full"><Users className="w-4 h-4" /> Users</Button></Link>
        <Link to="/all-sessions"><Button variant="outline" className="w-full"><Timer className="w-4 h-4" /> All Sessions</Button></Link>
      </div>
    </div>
  );
}
