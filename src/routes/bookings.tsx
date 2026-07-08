import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, EmptyState } from "../components/ui/Badge";
import { CalendarCheck } from "lucide-react";
import { formatCurrency, formatRelativeTime } from "../lib/utils";

export const Route = createFileRoute("/bookings")({
  component: BookingsPage,
});

export function BookingsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const bookings = useQuery(api.bookings.getByClient, user ? { clientId: user._id } : "skip");

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user) { navigate({ to: "/login" }); return null; }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-surface-900 mb-1">My Bookings</h1>
        <p className="text-surface-500 mb-6">Track your vehicle hire bookings</p>

        {!bookings ? (
          <Spinner className="w-6 h-6" />
        ) : bookings.length > 0 ? (
          <div className="space-y-3 animate-fade-in">
            {bookings.map((b) => (
              <Card key={b._id} hover>
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center">
                      <CalendarCheck className="w-5 h-5 text-surface-400" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-900">
                        {b.vehicle?.make} {b.vehicle?.model} ({b.vehicle?.year})
                      </p>
                      <p className="text-xs text-surface-400">
                        Agent: {b.agentName} · {formatRelativeTime(b.createdAt)}
                      </p>
                      {b.vehicle && (
                        <p className="text-xs text-surface-500 mt-0.5">
                          Rate: {formatCurrency(b.vehicle.rateAmount)} / {b.vehicle.rateUnit}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={b.status === "confirmed" ? "success" : b.status === "cancelled" ? "danger" : "warning"}
                      dot
                      size="md"
                    >
                      {b.status}
                    </Badge>
                    {b.status === "confirmed" && b.sessionId && (
                      <Link to="/session/$sessionId" params={{ sessionId: b.sessionId }} className="text-xs text-primary-600 hover:underline">
                        View
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<CalendarCheck className="w-8 h-8" />}
            title="No Bookings Yet"
            description="Browse vehicles to place your first booking."
            action={<Link to="/vehicles" className="text-sm text-primary-600 font-medium hover:underline">Browse Vehicles</Link>}
          />
        )}
      </main>
    </div>
  );
}
