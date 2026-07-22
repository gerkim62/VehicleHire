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
import { Timer, DollarSign, Car, MapPin, CreditCard, CheckCircle, Loader2, Receipt, Copy, Check, Clock, Calendar, Hash, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast(`${label} copied to clipboard`, "info");
    setTimeout(() => setCopiedField(null), 2000);
  };

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
          <Card className="mt-6 border border-surface-200/80 shadow-xs rounded-3xl overflow-hidden bg-white">
            <CardContent className="py-8 px-6 sm:px-8 text-center">
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-100 mb-3">
                <Receipt className="w-3.5 h-3.5" /> Official Invoice
              </div>

              <h2 className="text-[11px] font-bold uppercase tracking-wider text-surface-400 mb-1">
                Final Amount Due & Paid
              </h2>

              <div className="flex items-baseline justify-center gap-1.5 my-2">
                <span className="text-4xl sm:text-5xl font-black text-surface-900 tracking-tight">
                  {formatCurrency(session.totalCharge)}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-3 mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-100/80 text-surface-600 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-surface-400" />
                  Duration: <span className="font-semibold text-surface-900 font-mono">{displayDuration}</span>
                </div>
                {session.rateAmount && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-100/80 text-surface-600 text-xs font-medium">
                    Rate: <span className="font-semibold text-surface-900">{formatCurrency(session.rateAmount)}/{session.rateUnit}</span>
                  </div>
                )}
              </div>

              {/* Payment action / Receipt details */}
              <div className="mt-6">
                {isPaid && payment ? (
                  <div className="bg-gradient-to-b from-emerald-50/90 via-emerald-50/40 to-teal-50/20 border border-emerald-200/80 rounded-2xl p-5 sm:p-6 text-left max-w-lg mx-auto shadow-2xs">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-emerald-200/60">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-surface-900 text-sm sm:text-base leading-tight flex items-center gap-1.5">
                            Payment Verified & Completed
                          </h4>
                          <p className="text-[11px] text-emerald-700 font-medium">
                            Processed securely via Paystack
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                        Paid
                      </span>
                    </div>

                    {/* Transaction Metadata Grid */}
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[11px] font-semibold text-surface-500 block mb-1 flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5 text-emerald-600" /> Reference Code
                        </span>
                        <div
                          onClick={() => handleCopy(payment.paystackReference, "Reference Code")}
                          className="bg-white/90 hover:bg-white border border-emerald-200/80 hover:border-emerald-300 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer transition-all shadow-2xs group"
                        >
                          <code className="font-mono text-xs font-bold text-emerald-950 tracking-tight break-all">
                            {payment.paystackReference}
                          </code>
                          <button className="text-surface-400 group-hover:text-emerald-700 p-1 shrink-0 transition-colors" title="Copy reference">
                            {copiedField === "Reference Code" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {payment.paystackTransactionId && (
                        <div>
                          <span className="text-[11px] font-semibold text-surface-500 block mb-1 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Paystack Transaction ID
                          </span>
                          <div
                            onClick={() => handleCopy(payment.paystackTransactionId!, "Transaction ID")}
                            className="bg-white/90 hover:bg-white border border-emerald-200/80 hover:border-emerald-300 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer transition-all shadow-2xs group"
                          >
                            <code className="font-mono text-xs font-bold text-surface-800 tracking-tight">
                              {payment.paystackTransactionId}
                            </code>
                            <button className="text-surface-400 group-hover:text-emerald-700 p-1 shrink-0 transition-colors" title="Copy transaction ID">
                              {copiedField === "Transaction ID" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {payment.paidAt && (
                        <div className="pt-2 flex items-center justify-between text-xs text-surface-500 border-t border-emerald-100/80">
                          <span className="flex items-center gap-1.5 text-surface-500 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Paid At
                          </span>
                          <span className="font-semibold text-surface-800 font-mono">
                            {new Date(payment.paidAt).toLocaleString("en-KE", {
                              dateStyle: "medium",
                              timeStyle: "medium",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                  </div>
                ) : user.role === "client" ? (
                  <div className="max-w-md mx-auto bg-primary-50/50 border border-primary-100 rounded-2xl p-5 text-center">
                    <p className="text-xs text-surface-600 mb-4">
                      Complete your payment to finalize the rental session and receive your digital receipt.
                    </p>
                    <Button
                      onClick={handlePay}
                      size="lg"
                      className="w-full rounded-xl shadow-xs text-sm font-semibold"
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
                  </div>
                ) : (
                  <Badge variant="warning" size="md" className="py-2 px-4 rounded-xl font-semibold">
                    Payment Pending from Client
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

