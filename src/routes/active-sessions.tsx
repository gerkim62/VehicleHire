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
import { useState, useEffect, useRef } from "react";
import { Timer, MapPin, Square } from "lucide-react";
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
      sessions.forEach((s) => {
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
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 max-w-2xl flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 rounded-full bg-warning-50 flex items-center justify-center mb-4 text-warning-600">
            <span className="text-2xl font-bold">!</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 mb-2">Approval Pending</h1>
          <p className="text-surface-500 max-w-md mb-6">
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

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-surface-900 mb-1">Active Sessions</h1>
        <p className="text-surface-500 mb-6">Monitor live sessions and fleet locations</p>

        {!sessions ? (
          <Spinner className="w-6 h-6" />
        ) : sessions.length > 0 ? (
          <div className="space-y-6 animate-fade-in">
            {/* Map */}
            <Card>
              <CardContent className="p-0">
                <div ref={mapRef} className="h-72 sm:h-96 rounded-2xl" />
              </CardContent>
            </Card>

            {/* Session list */}
            <div className="space-y-3">
              {sessions.map((s) => {
                const elapsed = now - s.startedAt;
                const charge = calculateCharge(elapsed, s.rateAmount, s.rateUnit);
                return (
                  <Card key={s._id}>
                    <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-success-500 animate-pulse" />
                        <div>
                          <p className="font-medium text-surface-900">
                            {s.vehicle?.make} {s.vehicle?.model}
                          </p>
                          <p className="text-xs text-surface-400">Client: {s.client?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-mono font-bold text-surface-900">
                            {formatDuration(elapsed)}
                          </p>
                          <p className="text-xs text-primary-600 font-medium">
                            {formatCurrency(charge)}
                          </p>
                        </div>
                        {s.latestLocation && (
                          <Badge variant="info" size="sm">
                            <MapPin className="w-3 h-3" /> GPS
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setEndConfirm(s._id)}
                          isLoading={completing === s._id}
                        >
                          <Square className="w-3.5 h-3.5" /> End
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
            icon={<Timer className="w-8 h-8" />}
            title="No Active Sessions"
            description="Active hire sessions with live tracking will appear here."
          />
        )}

        {/* End session confirmation modal */}
        <Modal
          isOpen={!!endConfirm}
          onClose={() => setEndConfirm(null)}
          title="End Session"
        >
          <div className="space-y-4">
            <p className="text-surface-700">
              End this session now? The final charge will be calculated based on elapsed time and the client will be notified.
            </p>
            <div className="flex gap-3 justify-end">
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
