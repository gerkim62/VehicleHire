import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, EmptyState } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../hooks/useToast";
import { useState, useEffect, useRef, useMemo } from "react";
import { Timer, MapPin, Square, ShieldAlert, Car, Zap } from "lucide-react";
import { formatDuration, formatCurrency, calculateCharge, getErrorMessage } from "../lib/utils";
import type L from "leaflet";

export const Route = createFileRoute("/active-sessions")({
  component: ActiveSessionsPage,
});

export function ActiveSessionsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const sessions = useQuery(api.sessions.getActiveByAgent, user ? { agentId: user._id } : "skip");
  const completeMutation = useMutation(api.sessions.complete);

  const { toast } = useToast();
  const [completing, setCompleting] = useState<string | null>(null);
  const [endConfirm, setEndConfirm] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Tick every second for live timer
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Leaflet map
  useEffect(() => {
    if (!mapRef.current || !sessions || sessions.length === 0) return;

    const loadMap = async () => {
      const leafletModule = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (!mapInstanceRef.current && mapRef.current) {
        mapInstanceRef.current = leafletModule.map(mapRef.current).setView([-1.2921, 36.8219], 10);
        leafletModule.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(mapInstanceRef.current);
      }

      // Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // Add markers for sessions with location
      const bounds: [number, number][] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sessions.forEach((s: any) => {
        if (s.latestLocation && mapInstanceRef.current) {
          const { latitude, longitude } = s.latestLocation;
          const marker = leafletModule.marker([latitude, longitude])
            .addTo(mapInstanceRef.current!)
            .bindPopup(`
              <strong>${s.vehicle?.make} ${s.vehicle?.model}</strong><br/>
              Client: ${s.client?.name}<br/>
              Accuracy: ±${Math.round(s.latestLocation.accuracy)}m
            `);
          markersRef.current.push(marker);
          bounds.push([latitude, longitude]);
        }
      });

      if (bounds.length > 0 && mapInstanceRef.current) {
        mapInstanceRef.current.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] });
      }
    };

    loadMap();
  }, [sessions]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user || user.role !== "agent") { navigate({ to: "/login" }); return null; }

  if (user.agentStatus !== "approved") {
    return (
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-surface-50">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 max-w-2xl flex flex-col items-center justify-center min-h-[60vh] text-center pb-20 md:pb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center mb-4 text-amber-600 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900 mb-2">Agent Approval Pending</h1>
          <p className="text-surface-500 max-w-md mb-6 text-sm">
            Your agent registration is currently pending review. You can monitor active hire sessions once approved.
          </p>
          <Button onClick={() => navigate({ to: "/dashboard" })}>Back to Dashboard</Button>
        </main>
      </div>
    );
  }

  const handleComplete = async (sessionId: string) => {
    setEndConfirm(null);
    setCompleting(sessionId);
    try {
      const result = await completeMutation({ sessionId: sessionId as never, agentId: user._id });
      toast(`Session ended! Final charge: KES ${result.totalCharge.toLocaleString()}`, "success");
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setCompleting(null);
    }
  };

  const activeCount = sessions?.length || 0;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-surface-50">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 w-full max-w-7xl pb-20 md:pb-8">
        
        {/* Header & Stats Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-surface-900 tracking-tight">
              Active Rental Sessions
            </h1>
            <p className="text-surface-500 text-sm mt-0.5">
              Real-time session tracking, live duration metering, and GPS location map
            </p>
          </div>

          <div className="bg-white px-4 py-2 rounded-2xl border border-surface-200/70 shadow-2xs flex items-center gap-3 self-start sm:self-auto">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-surface-400 uppercase font-bold">Active Sessions</p>
              <p className="text-base font-bold text-emerald-600 leading-none">{activeCount}</p>
            </div>
          </div>
        </div>

        {!sessions ? (
          <div className="space-y-4">
            <div className="h-72 bg-surface-100 rounded-3xl animate-pulse" />
            <div className="h-24 bg-surface-100 rounded-3xl animate-pulse" />
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-6 animate-fade-in">
            {/* Map Card */}
            <Card className="border border-surface-200/70 rounded-3xl overflow-hidden shadow-2xs">
              <CardContent className="p-0">
                <div ref={mapRef} className="h-72 sm:h-96 w-full" />
              </CardContent>
            </Card>

            {/* Session list */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-surface-400 uppercase tracking-widest px-1">Live Rentals ({sessions.length})</h2>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {sessions.map((s: any) => {
                const elapsed = now - s.startedAt;
                const charge = calculateCharge(elapsed, s.rateAmount, s.rateUnit);
                return (
                  <Card key={s._id} className="border border-surface-200/70 rounded-3xl overflow-hidden shadow-2xs hover:shadow-xs transition-all">
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-surface-900 leading-tight">
                            {s.vehicle?.make} {s.vehicle?.model}
                          </h3>
                          <p className="text-xs text-surface-500 mt-0.5">Client: <span className="font-semibold text-surface-800">{s.client?.name}</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="text-right">
                          <p className="text-sm font-mono font-bold text-surface-900 bg-surface-100/70 px-2.5 py-0.5 rounded-lg border border-surface-200/50">
                            {formatDuration(elapsed)}
                          </p>
                          <p className="text-xs text-primary-600 font-bold mt-0.5">
                            {formatCurrency(charge)}
                          </p>
                        </div>
                        {s.latestLocation && (
                          <Badge variant="info" size="sm">
                            <MapPin className="w-3 h-3" /> GPS Active
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="danger"
                          className="rounded-xl text-xs"
                          onClick={() => setEndConfirm(s._id)}
                          isLoading={completing === s._id}
                        >
                          <Square className="w-3.5 h-3.5" /> End Session
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<Timer className="w-10 h-10 text-surface-400" />}
            title="No Active Sessions"
            description="Active hire sessions with live tracking will appear here when clients are renting."
          />
        )}

        {/* End session confirmation modal */}
        <Modal
          isOpen={!!endConfirm}
          onClose={() => setEndConfirm(null)}
          title="End Session"
        >
          <div className="space-y-4">
            <p className="text-surface-700 text-sm">
              Are you sure you want to end this rental session? The final total charge will be calculated and finalized.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setEndConfirm(null)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={() => endConfirm && handleComplete(endConfirm)}
                isLoading={completing === endConfirm}
              >
                <Square className="w-3.5 h-3.5" /> End Session
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}

