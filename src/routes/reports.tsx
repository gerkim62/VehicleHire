import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent, StatCard } from "../components/ui/Card";
import { Badge, Spinner } from "../components/ui/Badge";
import { DollarSign, CalendarCheck, TrendingUp, Car } from "lucide-react";
import { formatCurrency, formatDuration, formatDate } from "../lib/utils";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const stats = useQuery(api.reports.getAgentStats, user ? { agentId: user._id } : "skip");
  const sessions = useQuery(api.sessions.getByAgent, user ? { agentId: user._id } : "skip");
  const revenue = useQuery(api.payments.getAgentRevenue, user ? { agentId: user._id } : "skip");

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user || user.role !== "agent") { navigate({ to: "/login" }); return null; }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-surface-900 mb-1">Reports</h1>
        <p className="text-surface-500 mb-6">Revenue and session analytics</p>

        {!stats ? (
          <Spinner className="w-6 h-6" />
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={<DollarSign className="w-5 h-5" />} color="accent" />
              <StatCard title="Completed" value={stats.completedSessions} icon={<CalendarCheck className="w-5 h-5" />} color="success" />
              <StatCard title="Vehicles" value={stats.totalVehicles} icon={<Car className="w-5 h-5" />} color="primary" />
              <StatCard title="Active Now" value={stats.activeSessions} icon={<TrendingUp className="w-5 h-5" />} color="warning" />
            </div>

            {/* Revenue breakdown */}
            {revenue && revenue.payments.length > 0 && (
              <Card>
                <CardContent>
                  <h3 className="font-semibold text-surface-900 mb-4">Payment History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-100">
                          <th className="py-2 text-left text-surface-500 font-medium">Date</th>
                          <th className="py-2 text-left text-surface-500 font-medium">Amount</th>
                          <th className="py-2 text-left text-surface-500 font-medium">Reference</th>
                          <th className="py-2 text-left text-surface-500 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenue.payments.map((p: any) => (
                          <tr key={p._id} className="border-b border-surface-50">
                            <td className="py-2.5">{p.paidAt ? formatDate(p.paidAt) : "—"}</td>
                            <td className="py-2.5 font-medium">{formatCurrency(p.amount)}</td>
                            <td className="py-2.5 font-mono text-xs text-surface-400">{p.paystackReference}</td>
                            <td className="py-2.5"><Badge variant="success" size="sm">Paid</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session history */}
            {sessions && sessions.filter((s: any) => s.status === "completed").length > 0 && (
              <Card>
                <CardContent>
                  <h3 className="font-semibold text-surface-900 mb-4">Session History</h3>
                  <div className="space-y-2">
                    {sessions.filter((s: any) => s.status === "completed").slice(0, 20).map((s: any) => (
                      <div key={s._id} className="flex items-center justify-between py-2 border-b border-surface-50 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{s.vehicle?.make} {s.vehicle?.model}</p>
                          <p className="text-xs text-surface-400">{s.client?.name} · {formatDate(s.startedAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(s.totalCharge || 0)}</p>
                          <p className="text-xs text-surface-400">{s.durationMs ? formatDuration(s.durationMs) : "—"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
