import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, EmptyState } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../components/ui/Toast";
import { useState } from "react";
import { CalendarCheck, Play, X as XIcon } from "lucide-react";
import { formatRelativeTime, formatCurrency } from "../lib/utils";

export const Route = createFileRoute("/agent-bookings")({
  component: AgentBookingsPage,
});

function AgentBookingsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const bookings = useQuery(api.bookings.getByAgent, user ? { agentId: user._id } : "skip");
  const startSession = useMutation(api.sessions.start);
  const cancelBooking = useMutation(api.bookings.cancel);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null); // bookingId to cancel

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
            Your agent registration is currently pending review. You can manage incoming client bookings once approved.
          </p>
          <Button onClick={() => navigate({ to: "/dashboard" })}>Back to Dashboard</Button>
        </main>
      </div>
    );
  }

  const handleStart = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const sessionId = await startSession({ bookingId: bookingId as never, agentId: user._id });
      toast("Session started!", "success");
      navigate({ to: `/session/${sessionId}` });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to start session", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    setCancelConfirm(null);
    setActionLoading(bookingId);
    try {
      await cancelBooking({ bookingId: bookingId as never, userId: user._id });
      toast("Booking cancelled.", "info");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to cancel", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const pending = bookings?.filter((b) => b.status === "pending" || b.status === "confirmed") || [];
  const past = bookings?.filter((b) => b.status === "cancelled") || [];
  const cancelTarget = bookings?.find((b) => b._id === cancelConfirm);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-surface-900 mb-1">Bookings</h1>
        <p className="text-surface-500 mb-6">Manage incoming hire requests</p>

        {!bookings ? (
          <Spinner className="w-6 h-6" />
        ) : pending.length > 0 ? (
          <div className="space-y-3 animate-fade-in mb-8">
            <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wider">Active Bookings</h2>
            {pending.map((b) => (
              <Card key={b._id}>
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-surface-900">
                      {b.vehicle?.make} {b.vehicle?.model}
                    </p>
                    <p className="text-xs text-surface-400">
                      Client: {b.clientName} ({b.clientEmail}) · {formatRelativeTime(b.createdAt)}
                    </p>
                    {b.vehicle && (
                      <p className="text-xs text-surface-500 mt-0.5">
                        Rate: {formatCurrency(b.vehicle.rateAmount)} / {b.vehicle.rateUnit}
                      </p>
                    )}
                    {b.notes && <p className="text-xs text-surface-400 mt-1 italic">Note: {b.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={b.status === "confirmed" ? "success" : "warning"} dot>{b.status}</Badge>
                    <Button
                      size="sm"
                      onClick={() => handleStart(b._id)}
                      isLoading={actionLoading === b._id}
                    >
                      <Play className="w-3.5 h-3.5" /> Start Session
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCancelConfirm(b._id)}
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<CalendarCheck className="w-8 h-8" />}
            title="No Active Bookings"
            description="New bookings from clients will appear here."
          />
        )}

        {past.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wider">Cancelled</h2>
            {past.map((b) => (
              <Card key={b._id} className="opacity-60">
                <CardContent className="flex items-center justify-between">
                  <p className="text-sm text-surface-500">{b.vehicle?.make} {b.vehicle?.model} — {b.clientName}</p>
                  <Badge variant="danger" dot>Cancelled</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Cancel confirmation modal */}
        <Modal
          isOpen={!!cancelConfirm}
          onClose={() => setCancelConfirm(null)}
          title="Cancel Booking"
        >
          <div className="space-y-4">
            <p className="text-surface-700">
              Are you sure you want to cancel the booking for{" "}
              <strong>{cancelTarget?.vehicle?.make} {cancelTarget?.vehicle?.model}</strong> from{" "}
              <strong>{cancelTarget?.clientName}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setCancelConfirm(null)}>Keep Booking</Button>
              <Button
                variant="danger"
                onClick={() => cancelConfirm && handleCancel(cancelConfirm)}
                isLoading={actionLoading === cancelConfirm}
              >
                Cancel Booking
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
