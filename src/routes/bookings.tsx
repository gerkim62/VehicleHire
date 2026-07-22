import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, EmptyState, StarDisplay } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../hooks/useToast";
import { useState, useMemo } from "react";
import { CalendarCheck, Car, Clock, Eye, Search, Plus, User, XCircle, ChevronRight, MessageSquare } from "lucide-react";
import { formatCurrency, formatRelativeTime, getErrorMessage } from "../lib/utils";

export const Route = createFileRoute("/bookings")({
  component: BookingsPage,
});

export function BookingsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const bookings = useQuery(api.bookings.getByClient, user ? { clientId: user._id } : "skip");
  const cancelBooking = useMutation(api.bookings.cancel);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "cancelled">("all");
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user) { navigate({ to: "/login" }); return null; }

  const totalCount = bookings?.length || 0;
  const confirmedCount = bookings?.filter((b: any) => b.status === "confirmed").length || 0;
  const pendingCount = bookings?.filter((b: any) => b.status === "pending").length || 0;
  const cancelledCount = bookings?.filter((b: any) => b.status === "cancelled").length || 0;

  const filtered = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((b: any) => {
      const q = search.toLowerCase();
      const makeModel = `${b.vehicle?.make || ""} ${b.vehicle?.model || ""}`.toLowerCase();
      const agent = (b.agentName || "").toLowerCase();
      const matchesSearch = makeModel.includes(q) || agent.includes(q);
      
      if (!matchesSearch) return false;
      if (filter === "confirmed") return b.status === "confirmed";
      if (filter === "pending") return b.status === "pending";
      if (filter === "cancelled") return b.status === "cancelled";
      return true;
    });
  }, [bookings, search, filter]);

  const handleCancelBooking = async (bookingId: string) => {
    setCancelling(true);
    try {
      await cancelBooking({ bookingId: bookingId as never, userId: user._id });
      toast("Booking cancelled successfully.", "info");
      setCancelModalId(null);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setCancelling(false);
    }
  };

  const cancelTarget = bookings?.find((b: any) => b._id === cancelModalId);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-surface-50">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 w-full max-w-7xl pb-20 md:pb-8">
        
        {/* Header & Main Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary-100/80 text-primary-800 border border-primary-200/60 mb-1.5">
              Hire Reservations
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-surface-900 tracking-tight">
              My Bookings
            </h1>
            <p className="text-surface-500 text-sm mt-0.5">
              Track active reservations, check live session status, or place new vehicle bookings
            </p>
          </div>

          <Link to="/vehicles" className="self-start lg:self-auto">
            <Button className="rounded-2xl shadow-sm"><Plus className="w-4 h-4" /> Browse & Book Cars</Button>
          </Link>
        </div>

        {/* Quick Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-surface-400">Total Reservations</p>
            <p className="text-2xl font-bold text-surface-900 mt-0.5">{totalCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-emerald-600">Confirmed</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{confirmedCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-amber-600">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600 mt-0.5">{pendingCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-rose-600">Cancelled</p>
            <p className="text-2xl font-bold text-rose-600 mt-0.5">{cancelledCount}</p>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <Input
              placeholder="Search vehicle or agent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-2xl border-surface-200 bg-white text-sm shadow-2xs focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-surface-200/70 shadow-2xs w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filter === "all" ? "bg-primary-600 text-white shadow-xs" : "text-surface-600 hover:text-surface-900"
              }`}
            >
              All ({totalCount})
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
              onClick={() => setFilter("pending")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filter === "pending" ? "bg-amber-600 text-white shadow-xs" : "text-surface-600 hover:text-surface-900"
              }`}
            >
              Pending ({pendingCount})
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
        </div>

        {/* Enhanced Bookings List */}
        {!bookings ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-surface-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3 animate-fade-in">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {filtered.map((b: any) => {
              const photo = b.vehicle?.photos?.[0];
              const isCancelled = b.status === "cancelled";
              return (
                <Card
                  key={b._id}
                  hover={!isCancelled}
                  className={`border border-surface-200/70 rounded-3xl overflow-hidden shadow-2xs group transition-all duration-200 ${
                    isCancelled ? "bg-surface-100/50 opacity-70" : "bg-white hover:border-primary-200 hover:shadow-md"
                  }`}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Left: Vehicle Photo & Information */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary-100/70 via-surface-100 to-surface-200/50 overflow-hidden shrink-0 border border-surface-200/60 shadow-2xs flex items-center justify-center relative">
                          {photo ? (
                            <img src={photo} alt={`${b.vehicle?.make} ${b.vehicle?.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-primary-700">
                              <Car className="w-7 h-7 opacity-80" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-base sm:text-lg text-surface-900 group-hover:text-primary-600 transition-colors leading-tight">
                              {b.vehicle?.make} {b.vehicle?.model}
                            </h3>
                            {b.vehicle?.year && (
                              <span className="text-[11px] font-semibold text-surface-500 bg-surface-100 px-2 py-0.5 rounded-md">
                                {b.vehicle.year}
                              </span>
                            )}
                            {b.vehicle?.totalReviews > 0 && (
                              <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50 text-[11px]">
                                <StarDisplay rating={Math.round(b.vehicle.averageRating)} />
                                <span className="font-bold text-amber-800">({b.vehicle.totalReviews})</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-500">
                            <span className="flex items-center gap-1 font-medium">
                              <User className="w-3.5 h-3.5 text-surface-400" /> Agent: <span className="font-semibold text-surface-800">{b.agentName}</span>
                            </span>
                            <span className="flex items-center gap-1 text-surface-400">
                              <Clock className="w-3.5 h-3.5" /> Booked {formatRelativeTime(b.createdAt)}
                            </span>
                          </div>

                          {b.vehicle && (
                            <div className="text-xs font-bold text-primary-700 pt-0.5">
                              Rate: {formatCurrency(b.vehicle.rateAmount)} <span className="font-normal text-surface-500">/ {b.vehicle.rateUnit}</span>
                            </div>
                          )}

                          {b.notes && (
                            <p className="text-xs text-surface-600 bg-surface-50 p-2 rounded-xl border border-surface-200/50 italic flex items-center gap-1.5 mt-1">
                              <MessageSquare className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                              <span className="truncate">"{b.notes}"</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Status & Actions */}
                      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-100">
                        <Badge
                          variant={b.status === "confirmed" ? "success" : b.status === "cancelled" ? "danger" : "warning"}
                          dot
                          size="sm"
                        >
                          {b.status === "confirmed" ? "Confirmed" : b.status === "pending" ? "Pending Review" : "Cancelled"}
                        </Badge>

                        {/* Actions depending on status */}
                        {b.status === "confirmed" && b.sessionId && (
                          <Link to="/session/$sessionId" params={{ sessionId: b.sessionId }}>
                            <Button size="sm" className="rounded-xl text-xs shadow-xs">
                              <Eye className="w-3.5 h-3.5" /> Live Session <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        )}

                        {b.status === "pending" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                              onClick={() => setCancelModalId(b._id)}
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancel
                            </Button>
                          </div>
                        )}

                        {b.status === "cancelled" && b.vehicle && (
                          <Link to="/vehicle/$vehicleId" params={{ vehicleId: b.vehicle._id }}>
                            <Button size="sm" variant="ghost" className="rounded-xl text-xs">
                              View Vehicle
                            </Button>
                          </Link>
                        )}
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<CalendarCheck className="w-10 h-10 text-surface-400" />}
            title="No Bookings Found"
            description={search ? `No bookings matched "${search}".` : "You don't have any bookings matching this view."}
            action={<Link to="/vehicles"><Button size="sm" className="rounded-xl"><Plus className="w-4 h-4" /> Browse Vehicles</Button></Link>}
          />
        )}

        {/* Cancel Confirmation Modal */}
        <Modal
          isOpen={!!cancelModalId}
          onClose={() => setCancelModalId(null)}
          title="Cancel Reservation"
        >
          <div className="space-y-4">
            <p className="text-surface-700 text-sm">
              Are you sure you want to cancel your booking for{" "}
              <strong>{cancelTarget?.vehicle?.make} {cancelTarget?.vehicle?.model}</strong>?
              The vehicle will be released for other clients.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setCancelModalId(null)}>Keep Booking</Button>
              <Button
                variant="danger"
                onClick={() => cancelModalId && handleCancelBooking(cancelModalId)}
                isLoading={cancelling}
              >
                Confirm Cancel
              </Button>
            </div>
          </div>
        </Modal>

      </main>
    </div>
  );
}


