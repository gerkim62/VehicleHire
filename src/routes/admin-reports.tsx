import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { StatCard, Card, CardContent } from "../components/ui/Card";
import { Spinner } from "../components/ui/Badge";
import { Users, Car, Timer, TrendingUp, DollarSign, CalendarCheck } from "lucide-react";
import { formatCurrency } from "../lib/utils";

export const Route = createFileRoute("/admin-reports")({
  component: AdminReportsPage,
});

export function AdminReportsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const stats = useQuery(api.reports.getPlatformStats);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user || user.role !== "admin") { navigate({ to: "/login" }); return null; }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-5xl pb-20 md:pb-8">
        <h1 className="text-2xl font-bold text-surface-900 mb-1">Platform Reports</h1>
        <p className="text-surface-500 mb-6">Analytics and metrics</p>

        {!stats ? (
          <Spinner className="w-6 h-6" />
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Total Clients" value={stats.totalClients} icon={<Users className="w-5 h-5" />} color="primary" />
              <StatCard title="Total Agents" value={stats.totalAgents} icon={<Car className="w-5 h-5" />} color="success" />
              <StatCard title="Pending Agents" value={stats.pendingAgents} icon={<Timer className="w-5 h-5" />} color="warning" />
              <StatCard title="Total Vehicles" value={stats.totalVehicles} icon={<Car className="w-5 h-5" />} color="accent" />
              <StatCard title="Active Sessions" value={stats.activeSessions} icon={<TrendingUp className="w-5 h-5" />} color="danger" />
              <StatCard title="Completed Sessions" value={stats.completedSessions} icon={<CalendarCheck className="w-5 h-5" />} color="primary" />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <Card>
                <CardContent>
                  <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-accent-500" /> Revenue
                  </h3>
                  <div className="text-center py-6">
                    <p className="text-4xl font-bold text-surface-900">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-sm text-surface-400 mt-1">Total platform revenue from {stats.totalPayments} payments</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <h3 className="font-semibold text-surface-900 mb-4">Key Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-1 border-b border-surface-50">
                      <span className="text-surface-500">Available Vehicles</span>
                      <span className="font-medium">{stats.activeVehicles}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-surface-50">
                      <span className="text-surface-500">Vehicles on Hire</span>
                      <span className="font-medium">{stats.totalVehicles - stats.activeVehicles}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-surface-50">
                      <span className="text-surface-500">Avg Revenue/Payment</span>
                      <span className="font-medium">
                        {stats.totalPayments > 0
                          ? formatCurrency(Math.round(stats.totalRevenue / stats.totalPayments))
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-surface-500">Platform Users</span>
                      <span className="font-medium">{stats.totalClients + stats.totalAgents}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
