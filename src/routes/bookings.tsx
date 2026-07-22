import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, EmptyState } from "../components/ui/Badge";
import { useState, useMemo } from "react";
import { CalendarCheck, Car, Clock, ChevronRight, Eye } from "lucide-react";
import { formatCurrency, formatRelativeTime } from "../lib/utils";

export const Route = createFileRoute("/bookings")({
  component: BookingsPage,
});

export function BookingsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const bookings = useQuery(api.bookings.getByClient, user ? { clientId: user._id } : "skip");
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "cancelled">("all");

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user) { navigate({ to: "/login" }); return null; }

  const totalCount = bookings?.length || 0;
  const confirmedCount = bookings?.filter((b: any) => b.status === "confirmed").length || 0;
  const pendingCount = bookings?.filter((b: any) => b.status === "pending").length || 0;
  const cancelledCount = bookings?.filter((b: any) => b.status === "cancelled").length || 0;

  const filtered = useMemo(() => {
    if (!bookings) return [];
    if (filter === "confirmed") return bookings.filter((b: any) => b.status === "confirmed");
    if (filter === "pending") return bookings.filter((b: any) => b.status === "pending");
    if (filter === "cancelled") return bookings.filter((b: any) => b.status === "cancelled");
    return bookings;
  }, [bookings, filter]);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-surface-50">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 w-full max-w-7xl pb-20 md:pb-8">
        
        {/* Header & Stats Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary-100 text-primary-800 border border-primary-200">
                Hire Reservations
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-surface-900 tracking-tight">
              My Bookings
            </h1>
            <p className="text-surface-500 text-sm mt-0.5">
              Track and manage all your active and upcoming vehicle hire reservations
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
            <p className="text-[10px] font-bold uppercase text-surface-400">Confirmed</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{confirmedCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-surface-400">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600 mt-0.5">{pendingCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-surface-400">Cancelled</p>
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

        {/* Bookings List */}
        {!bookings ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-surface-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3 animate-fade-in">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {filtered.map((b: any) => (
              <Card key={b._id} hover className="border border-surface-200/70 rounded-3xl overflow-hidden shadow-2xs group transition-all">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-primary-600 shrink-0 border border-primary-200/50">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-surface-900 group-hover:text-primary-600 transition-colors">
                        {b.vehicle?.make} {b.vehicle?.model} <span className="text-xs text-surface-400 font-normal">({b.vehicle?.year})</span>
                      </h3>
                      <p className="text-xs text-surface-500 mt-0.5">
                        Agent: <span className="font-semibold text-surface-700">{b.agentName}</span> · Requested {formatRelativeTime(b.createdAt)}
                      </p>
                      {b.vehicle && (
                        <p className="text-xs font-semibold text-primary-700 mt-1">
                          Rate: {formatCurrency(b.vehicle.rateAmount)} / {b.vehicle.rateUnit}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <Badge
                      variant={b.status === "confirmed" ? "success" : b.status === "cancelled" ? "danger" : "warning"}
                      dot
                      size="md"
                    >
                      {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                    </Badge>

                    {b.status === "confirmed" && b.sessionId && (
                      <Link to="/session/$sessionId" params={{ sessionId: b.sessionId }}>
                        <div className="flex items-center gap-1 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-3.5 py-2 rounded-xl transition-colors shadow-xs">
                          <Eye className="w-3.5 h-3.5" /> View Session
                        </div>
                      </Link>
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
            description="You don't have any bookings matching this view."
            action={<Link to="/vehicles" className="text-xs font-bold text-primary-600 hover:underline">Browse Vehicles →</Link>}
          />
        )}
      </main>
    </div>
  );
}

