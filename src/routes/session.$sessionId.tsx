import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useTimer } from "../hooks/useTimer";
import { useGeolocation } from "../hooks/useGeolocation";
import { usePaystackRedirect } from "../hooks/usePaystackRedirect";
import { useToast } from "../hooks/useToast";
import { formatDuration, formatCurrency, calculateCharge } from "../lib/utils";
import { Timer, DollarSign, Car, MapPin, CreditCard, CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import type L from "leaflet";

export const Route = createFileRoute("/session/$sessionId")({
  component: SessionPage,
});

export function SessionPage() {
  const { sessionId } = Route.useParams();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { initiatePayment, loading: payLoading, error: payError } = usePaystackRedirect();

  const session = useQuery(api.sessions.getById, {
    sessionId: sessionId as Id<"sessions">,
  });

  const payment = useQuery(
    api.payments.getBySession,
    session ? { sessionId: session._id } : "skip"
  );

  const elapsed = useTimer(session?.status === "in_progress" ? session.startedAt : null);

  // Stream GPS location to Convex while session is active (client only)
  useGeolocation(
    session?.status === "in_progress" && user?.role === "client"
      ? (sessionId as Id<"sessions">)
      : null
  );

  // Client-side map (shows own location during active session)
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || !session?.latestLocation) return;

    const { latitude, longitude } = session.latestLocation;

    const loadMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (!mapInstanceRef.current && mapRef.current) {
        mapInstanceRef.current = L.map(mapRef.current).setView([latitude, longitude], 14);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(mapInstanceRef.current);
      }

      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else if (mapInstanceRef.current) {
        markerRef.current = L.marker([latitude, longitude])
          .addTo(mapInstanceRef.current)
          .bindPopup("Current vehicle location");
      }

      mapInstanceRef.current?.setView([latitude, longitude], 14);
    };

    loadMap();
  }, [session?.latestLocation]);

  // Show any payment error via toast
  useEffect(() => {
    if (payError) toast("Payment initiation failed: " + payError, "error");
  }, [payError, toast]);

  const handlePay = async () => {
    if (!user || !session?.totalCharge) return;
    await initiatePayment({
      sessionId: session._id,
      clientId: user._id,
      agentId: session.agentId,
      email: user.email,
      amount: session.totalCharge, // in KES whole units
      currency: session.currency || "KES",
    });
  };

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

  const isPaid = payment?.status === "success";

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 w-full max-w-7xl pb-20 md:pb-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={isActive ? "success" : "default"} dot size="md">
              {isActive ? "In Progress" : "Completed"}
            </Badge>
            {!isActive && isPaid && (
              <Badge variant="success">
                <CheckCircle className="w-3 h-3" /> Paid
              </Badge>
            )}
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
                  {isActive ? "Waiting for GPS signal…" : "No location data"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active session GPS notice */}
        {isActive && (
          <div className="mt-6 p-4 rounded-2xl bg-primary-50 border border-primary-100 text-center animate-pulse">
            <p className="text-sm text-primary-700 font-medium">
              {user.role === "client"
                ? "🔴 Your GPS location is being shared with the agent for fleet tracking. The session will be ended by the agent when you return the vehicle."
                : "🔴 The client's GPS location is being tracked for fleet safety. You can end the session once the vehicle is returned."
              }
            </p>
          </div>
        )}

        {/* Map — shows during active session if location is available */}
        {session.latestLocation && (
          <Card className="mt-6 overflow-hidden">
            <CardContent className="p-0">
              <div ref={mapRef} className="h-56 rounded-2xl" />
            </CardContent>
          </Card>
        )}

        {/* Completed session — invoice + payment */}
        {!isActive && session.totalCharge && (
          <Card className="mt-6">
            <CardContent className="text-center py-6">
              <p className="text-sm text-surface-500 mb-2">Final Invoice</p>
              <p className="text-3xl font-bold text-surface-900">{formatCurrency(session.totalCharge)}</p>
              <p className="text-sm text-surface-400 mt-1">
                Duration: {session.durationMs ? formatDuration(session.durationMs) : "—"}
              </p>

              {/* Payment action */}
              <div className="mt-6">
                {isPaid ? (
                  <div className="bg-success-50 border border-success-200 rounded-xl p-4 max-w-md mx-auto text-left">
                    <div className="flex items-center gap-2 text-success-700 font-semibold mb-2">
                      <CheckCircle className="w-5 h-5 text-success-600" />
                      Payment Verified & Completed
                    </div>
                    <div className="space-y-1 text-xs text-surface-600 font-mono">
                      <p><span className="text-surface-400 font-sans">Reference:</span> {payment.paystackReference}</p>
                      {payment.paystackTransactionId && (
                        <p><span className="text-surface-400 font-sans">Transaction ID:</span> {payment.paystackTransactionId}</p>
                      )}
                      {payment.paidAt && (
                        <p><span className="text-surface-400 font-sans">Paid At:</span> {new Date(payment.paidAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ) : user.role === "client" ? (
                  <Button
                    onClick={handlePay}
                    size="lg"
                    className="w-full sm:w-auto"
                    isLoading={payLoading}
                    disabled={payLoading}
                    id="session-pay-btn"
                  >
                    {payLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Paystack…</>
                    ) : (
                      <><CreditCard className="w-4 h-4" /> Pay {formatCurrency(session.totalCharge)} via Paystack</>
                    )}
                  </Button>
                ) : (
                  <Badge variant="warning" size="md">Payment Pending from Client</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

