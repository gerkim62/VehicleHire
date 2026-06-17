import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner } from "../components/ui/Badge";
import { useTimer } from "../hooks/useTimer";
import { useGeolocation } from "../hooks/useGeolocation";
import { formatDuration, formatCurrency, calculateCharge } from "../lib/utils";
import { Timer, DollarSign, Car, MapPin } from "lucide-react";

export const Route = createFileRoute("/session/$sessionId")({
  component: SessionPage,
});

function SessionPage() {
  const { sessionId } = Route.useParams();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const session = useQuery(api.sessions.getById, {
    sessionId: sessionId as Id<"sessions">,
  });

  const elapsed = useTimer(session?.status === "in_progress" ? session.startedAt : null);

  // Stream GPS location to Convex while session is active
  useGeolocation(
    session?.status === "in_progress" && user?.role === "client"
      ? (sessionId as Id<"sessions">)
      : null
  );

  if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user) { navigate({ to: "/login" }); return null; }
  if (session === undefined) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!session) return <div className="p-8 text-center text-surface-500">Session not found</div>;

  const isActive = session.status === "in_progress";
  const currentCharge = isActive
    ? calculateCharge(elapsed, session.rateAmount, session.rateUnit)
    : session.totalCharge || 0;

  const displayDuration = isActive
    ? formatDuration(elapsed)
    : session.durationMs
      ? formatDuration(session.durationMs)
      : "—";

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-3xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={isActive ? "success" : "default"} dot size="md">
              {isActive ? "In Progress" : "Completed"}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Hire Session</h1>
          <p className="text-surface-500">
            {session.vehicle?.make} {session.vehicle?.model}
          </p>
        </div>

        {/* Big timer + charge */}
        <Card className={isActive ? "border-success-200 bg-gradient-to-br from-success-50/50 to-white" : ""}>
          <CardContent className="py-8">
            <div className="grid sm:grid-cols-2 gap-8 text-center">
              <div>
                <div className="flex items-center justify-center gap-2 text-surface-500 mb-2">
                  <Timer className="w-5 h-5" />
                  <span className="text-sm font-medium">Elapsed Time</span>
                </div>
                <p className={`text-4xl sm:text-5xl font-mono font-bold ${isActive ? "text-surface-900" : "text-surface-600"}`}>
                  {displayDuration}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 text-surface-500 mb-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {isActive ? "Running Charge" : "Total Charge"}
                  </span>
                </div>
                <p className={`text-4xl sm:text-5xl font-bold ${isActive ? "text-primary-600" : "text-surface-900"}`}>
                  {formatCurrency(currentCharge)}
                </p>
                <p className="text-sm text-surface-400 mt-1">
                  at {formatCurrency(session.rateAmount)} / {session.rateUnit}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session details */}
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <Card>
            <CardContent>
              <h3 className="text-sm font-semibold text-surface-500 mb-3 flex items-center gap-2">
                <Car className="w-4 h-4" /> Vehicle
              </h3>
              <p className="font-medium text-surface-900">
                {session.vehicle?.make} {session.vehicle?.model} ({session.vehicle?.year})
              </p>
              <p className="text-sm text-surface-500">{session.vehicle?.capacity} seats</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="text-sm font-semibold text-surface-500 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Location
              </h3>
              {session.latestLocation ? (
                <div>
                  <p className="text-sm text-surface-700 font-mono">
                    {session.latestLocation.latitude.toFixed(4)}, {session.latestLocation.longitude.toFixed(4)}
                  </p>
                  <p className="text-xs text-surface-400">
                    Accuracy: ±{Math.round(session.latestLocation.accuracy)}m
                  </p>
                </div>
              ) : (
                <p className="text-sm text-surface-400">
                  {isActive ? "Waiting for GPS signal..." : "No location data"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {isActive && (
          <div className="mt-6 p-4 rounded-2xl bg-primary-50 border border-primary-100 text-center">
            <p className="text-sm text-primary-700">
              🔴 Your GPS location is being shared with the agent for fleet tracking. The session will be ended by the agent when you return the vehicle.
            </p>
          </div>
        )}

        {!isActive && session.totalCharge && (
          <Card className="mt-6">
            <CardContent className="text-center py-6">
              <p className="text-sm text-surface-500 mb-2">Final Invoice</p>
              <p className="text-3xl font-bold text-surface-900">{formatCurrency(session.totalCharge)}</p>
              <p className="text-sm text-surface-400 mt-1">
                Duration: {session.durationMs ? formatDuration(session.durationMs) : "—"}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
