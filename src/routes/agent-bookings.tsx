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
import { useState, useMemo, useEffect } from "react";
import { CalendarCheck, Play, X as XIcon, Eye, ShieldAlert, Clock } from "lucide-react";
import { formatRelativeTime, formatCurrency, getErrorMessage } from "../lib/utils";

export const Route = createFileRoute("/agent-bookings")({
  component: AgentBookingsPage,
});

export function AgentBookingsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const bookings = useQuery(api.bookings.getByAgent, user ? { agentId: user._id } : "skip");
  const startSession = useMutation(api.sessions.start);
  const cancelBooking = useMutation(api.bookings.cancel);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");

  const filtered = useMemo(() => {
    if (!bookings) return [];
    if (filter === "pending") return bookings.filter((b: any) => b.status === "pending");
    if (filter === "confirmed") return bookings.filter((b: any) => b.status === "confirmed");
    if (filter === "cancelled") return bookings.filter((b: any) => b.status === "cancelled");
    return bookings;
  }, [bookings, filter]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "agent")) {
      navigate({ to: "/login" });
    }
  }, [isLoading, user, navigate]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user || user.role !== "agent") return null;

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
            Your agent registration is currently pending review. You can manage client bookings once approved.
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
      toast(getErrorMessage(err), "error");
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
      toast(getErrorMessage(err), "error");
    } finally {
      setActionLoading(null);
    }
  };

  const totalCount = bookings?.length || 0;
  const pendingCount = bookings?.filter((b: any) => b.status === "pending").length || 0;
  const confirmedCount = bookings?.filter((b: any) => b.status === "confirmed").length || 0;
  const cancelledCount = bookings?.filter((b: any) => b.status === "cancelled").length || 0;

  const cancelTarget = bookings?.find((b: any) => b._id === cancelConfirm);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-surface-50">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 w-full max-w-7xl pb-20 md:pb-8">
        
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary-100 text-primary-800 border border-primary-200">
                Incoming Hire Requests
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-surface-900 tracking-tight">
              Booking Management
            </h1>
            <p className="text-surface-500 text-sm mt-0.5">
              Review client hire requests, launch active rental sessions, and handle cancellations
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-surface-400">Total Requests</p>
            <p className="text-2xl font-bold text-surface-900 mt-0.5">{totalCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-amber-600">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600 mt-0.5">{pendingCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-emerald-600">Confirmed / Active</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{confirmedCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-rose-600">Cancelled</p>
            <p className="text-2xl font-bold text-rose-600 mt-0.5">{cancelledCount}</p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-surface-200/70 shadow-xs mb-6 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === "all" ? "bg-primary-600 text-white shadow-xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            All Requests ({totalCount})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === "pending" ? "bg-amber-600 text-white shadow-xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter("confirmed")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === "confirmed" ? "bg-emerald-600 text-white shadow-xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            Confirmed ({confirmedCount})
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === "cancelled" ? "bg-rose-600 text-white shadow-xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            Cancelled ({cancelledCount})
          </button>
        </div>

        {/* Bookings List */}
        {!bookings ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-surface-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4 animate-fade-in">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {filtered.map((b: any) => (
              <Card
                key={b._id}
                hover={!!b.sessionId}
                onClick={
                  b.sessionId
                    ? () => navigate({ to: `/session/${b.sessionId}` })
                    : undefined
                }
                className={`border border-surface-200/70 rounded-3xl overflow-hidden shadow-2xs transition-all ${
                  b.status === "cancelled" ? "opacity-60 bg-surface-100/50" : ""
                }`}
              >
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                        {b.clientName?.charAt(0) || "C"}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-surface-900 leading-tight">
                          {b.vehicle?.make} {b.vehicle?.model}
                        </h3>
                        <p className="text-xs text-surface-500">
                          Client: <span className="font-semibold text-surface-800">{b.clientName}</span> ({b.clientEmail})
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-surface-500 pt-1">
                      {b.vehicle && (
                        <span className="font-semibold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-lg border border-primary-200/50">
                          Rate: {formatCurrency(b.vehicle.rateAmount)} / {b.vehicle.rateUnit}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-surface-400">
                        <Clock className="w-3.5 h-3.5" /> Requested {formatRelativeTime(b.createdAt)}
                      </span>
                    </div>

                    {b.notes && (
                      <p className="text-xs text-surface-600 bg-surface-100/70 px-3 py-1.5 rounded-xl border border-surface-200/50 italic">
                        Note: "{b.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap self-end sm:self-center">
                    <Badge variant={b.status === "confirmed" ? "success" : b.status === "cancelled" ? "danger" : "warning"} dot size="md">
                      {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                    </Badge>

                    {b.sessionStatus === "in_progress" && (
                      <Badge variant="info" dot>Active Session</Badge>
                    )}

                    {b.sessionId && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate({ to: `/session/${b.sessionId}` });
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" /> View Session
                      </Button>
                    )}

                    {b.status !== "cancelled" && !b.sessionStatus && (
                      <Button
                        size="sm"
                        className="rounded-xl text-xs shadow-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStart(b._id);
                        }}
                        isLoading={actionLoading === b._id}
                      >
                        <Play className="w-3.5 h-3.5" /> Start Session
                      </Button>
                    )}

                    {b.status === "pending" && !b.sessionStatus && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl text-xs text-rose-600 hover:bg-rose-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCancelConfirm(b._id);
                        }}
                      >
                        <XIcon className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<CalendarCheck className="w-10 h-10 text-surface-400" />}
            title="No Bookings Found"
            description="No client booking requests match this status view."
          />
        )}

        {/* Cancel confirmation modal */}
        <Modal
          isOpen={!!cancelConfirm}
          onClose={() => setCancelConfirm(null)}
          title="Cancel Booking"
        >
          <div className="space-y-4">
            <p className="text-surface-700 text-sm">
              Are you sure you want to cancel the booking for{" "}
              <strong>{cancelTarget?.vehicle?.make} {cancelTarget?.vehicle?.model}</strong> from{" "}
              <strong>{cancelTarget?.clientName}</strong>?
            </p>
            <div className="flex gap-3 justify-end pt-2">
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

