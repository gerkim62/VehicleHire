import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, EmptyState } from "../components/ui/Badge";
import { useState, useEffect } from "react";
import { Timer, MapPin, Activity, Car } from "lucide-react";
import { formatDuration, formatCurrency, calculateCharge } from "../lib/utils";

export const Route = createFileRoute("/all-sessions")({
  component: AllSessionsPage,
});

export function AllSessionsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const sessions = useQuery(api.sessions.getAllActive);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user || user.role !== "admin") { navigate({ to: "/login" }); return null; }

  const activeCount = sessions?.length || 0;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-surface-50">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 w-full max-w-7xl pb-20 md:pb-8">
        
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 border border-amber-200">
                System Control
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-surface-900 tracking-tight">
              All Active Sessions
            </h1>
            <p className="text-surface-500 text-sm mt-0.5">
              Platform-wide telemetry and real-time active rental session monitoring
            </p>
          </div>

          <div className="bg-white px-4 py-2 rounded-2xl border border-surface-200/70 shadow-2xs flex items-center gap-3 self-start sm:self-auto">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-surface-400 uppercase font-bold">Live Sessions</p>
              <p className="text-base font-bold text-surface-900 leading-none">{activeCount}</p>
            </div>
          </div>
        </div>

        {!sessions ? (
          <div className="h-64 bg-surface-100 rounded-3xl animate-pulse" />
        ) : sessions.length > 0 ? (
          <Card className="border border-surface-200/70 rounded-3xl overflow-hidden shadow-2xs bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-200/60 bg-surface-50/80">
                      <th className="py-3.5 px-4 text-left font-bold text-surface-500 text-xs uppercase tracking-wider">Vehicle</th>
                      <th className="py-3.5 px-4 text-left font-bold text-surface-500 text-xs uppercase tracking-wider">Client</th>
                      <th className="py-3.5 px-4 text-left font-bold text-surface-500 text-xs uppercase tracking-wider">Agent</th>
                      <th className="py-3.5 px-4 text-left font-bold text-surface-500 text-xs uppercase tracking-wider">Elapsed Time</th>
                      <th className="py-3.5 px-4 text-left font-bold text-surface-500 text-xs uppercase tracking-wider">Est. Charge</th>
                      <th className="py-3.5 px-4 text-left font-bold text-surface-500 text-xs uppercase tracking-wider">Telemetry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {sessions.map((s: any) => {
                      const elapsed = now - s.startedAt;
                      const charge = calculateCharge(elapsed, s.rateAmount, s.rateUnit);
                      return (
                        <tr key={s._id} className="hover:bg-surface-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-surface-900 flex items-center gap-2">
                            <Car className="w-4 h-4 text-surface-400" />
                            {s.vehicle?.make} {s.vehicle?.model}
                          </td>
                          <td className="py-3.5 px-4 text-surface-600 font-medium">{s.client?.name}</td>
                          <td className="py-3.5 px-4 text-surface-600 font-medium">{s.agent?.name}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-xs font-bold text-surface-900 bg-surface-100 px-2 py-1 rounded-md border border-surface-200/50">
                              {formatDuration(elapsed)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-primary-600">{formatCurrency(charge)}</td>
                          <td className="py-3.5 px-4">
                            {s.latestLocation ? (
                              <Badge variant="info" size="sm"><MapPin className="w-3 h-3" /> Live GPS</Badge>
                            ) : (
                              <span className="text-surface-300 text-xs">—</span>
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
            icon={<Timer className="w-10 h-10 text-surface-400" />}
            title="No Active Sessions"
            description="There are currently no active rental sessions running across the platform."
          />
        )}
      </main>
    </div>
  );
}

