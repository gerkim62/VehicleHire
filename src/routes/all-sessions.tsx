import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, EmptyState } from "../components/ui/Badge";
import { useState, useEffect } from "react";
import { Timer, MapPin } from "lucide-react";
import { formatDuration, formatCurrency, calculateCharge } from "../lib/utils";

export const Route = createFileRoute("/all-sessions")({
  component: AllSessionsPage,
});

function AllSessionsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const sessions = useQuery(api.sessions.getAllActive);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user || user.role !== "admin") { navigate({ to: "/login" }); return null; }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-surface-900 mb-1">All Active Sessions</h1>
        <p className="text-surface-500 mb-6">Platform-wide session monitoring</p>

        {!sessions ? (
          <Spinner className="w-6 h-6" />
        ) : sessions.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100 bg-surface-50">
                      <th className="py-3 px-4 text-left font-medium text-surface-500">Vehicle</th>
                      <th className="py-3 px-4 text-left font-medium text-surface-500">Client</th>
                      <th className="py-3 px-4 text-left font-medium text-surface-500">Agent</th>
                      <th className="py-3 px-4 text-left font-medium text-surface-500">Duration</th>
                      <th className="py-3 px-4 text-left font-medium text-surface-500">Charge</th>
                      <th className="py-3 px-4 text-left font-medium text-surface-500">GPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => {
                      const elapsed = now - s.startedAt;
                      const charge = calculateCharge(elapsed, s.rateAmount, s.rateUnit);
                      return (
                        <tr key={s._id} className="border-b border-surface-50">
                          <td className="py-3 px-4 font-medium">{s.vehicle?.make} {s.vehicle?.model}</td>
                          <td className="py-3 px-4 text-surface-500">{s.client?.name}</td>
                          <td className="py-3 px-4 text-surface-500">{s.agent?.name}</td>
                          <td className="py-3 px-4 font-mono">{formatDuration(elapsed)}</td>
                          <td className="py-3 px-4 font-medium text-primary-600">{formatCurrency(charge)}</td>
                          <td className="py-3 px-4">
                            {s.latestLocation ? (
                              <Badge variant="info" size="sm"><MapPin className="w-3 h-3" /> Active</Badge>
                            ) : (
                              <span className="text-surface-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={<Timer className="w-8 h-8" />}
            title="No Active Sessions"
            description="There are no active hire sessions on the platform right now."
          />
        )}
      </main>
    </div>
  );
}
