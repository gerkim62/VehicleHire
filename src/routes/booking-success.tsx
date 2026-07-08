import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Badge";
import { CheckCircle2, Clock, Calendar, ArrowRight, ShieldCheck, Mail } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/booking-success")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      bookingId: (search.bookingId as string) || "",
    };
  },
  component: BookingSuccessPage,
});

export function BookingSuccessPage() {
  const { user, isLoading } = useAuth();
  const { bookingId } = Route.useSearch();
  const navigate = useNavigate();

  const booking = useQuery(api.bookings.getById, bookingId ? { bookingId: bookingId as Id<"bookings"> } : "skip");

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user) { navigate({ to: "/login" }); return null; }

  return (
    <div className="flex bg-surface-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-12 max-w-2xl mx-auto space-y-10">
        {!booking ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Spinner className="w-8 h-8 mb-3 text-primary-600" />
            <p className="text-sm text-surface-500 font-medium">Loading booking status…</p>
          </div>
        ) : (
          <div className="space-y-10 animate-fade-in py-4">
            {/* Header Success Section */}
            <div className="text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full bg-success-500/10 animate-ping" />
                <div className="relative w-16 h-16 rounded-full bg-success-50 border border-success-100 flex items-center justify-center text-success-600 shadow-sm shadow-success-600/5">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl lg:text-4xl font-serif font-medium text-surface-900 tracking-tight">Booking Requested!</h1>
                <p className="text-sm text-surface-500 max-w-md mx-auto leading-relaxed">
                  Your booking request has been placed successfully and is now pending agent approval.
                </p>
              </div>
            </div>

            {/* Vehicle Details Card */}
            {booking.vehicle && (
              <Card className="border border-surface-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-surface-100 border border-surface-200 flex items-center justify-center overflow-hidden shrink-0">
                    {booking.vehicle.photos && booking.vehicle.photos.length > 0 ? (
                      <img
                        src={booking.vehicle.photos[0]}
                        alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Calendar className="w-6 h-6 text-surface-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-primary-600 font-bold tracking-widest uppercase mb-0.5">
                      Selected Vehicle
                    </p>
                    <h3 className="font-semibold text-surface-900 text-base">
                      {booking.vehicle.make} {booking.vehicle.model}
                    </h3>
                    <p className="text-xs text-surface-500 flex items-center gap-1.5 mt-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-primary-500" /> Rate: {formatCurrency(booking.vehicle.rateAmount)} / {booking.vehicle.rateUnit}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Explanation Timeline */}
            <div className="p-6 rounded-2xl bg-white border border-surface-100 shadow-sm space-y-6">
              <h3 className="text-xs font-bold text-surface-400 uppercase tracking-widest">
                What happens next?
              </h3>

              <div className="relative border-l border-surface-100 pl-8 ml-3 space-y-8">
                {/* Step 1: Placed */}
                <div className="relative">
                  <div className="absolute -left-[42px] top-0.5 w-5 h-5 rounded-full bg-success-50 border-2 border-success-500 flex items-center justify-center text-success-600 shadow-sm" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-surface-900 text-sm">Booking Placed</h4>
                    <p className="text-xs text-surface-500 leading-relaxed">
                      Your request has been saved and the agent has been notified immediately.
                    </p>
                  </div>
                </div>

                {/* Step 2: Agent Review */}
                <div className="relative">
                  <div className="absolute -left-[42px] top-0.5 w-5 h-5 rounded-full bg-warning-50 border-2 border-warning-500 flex items-center justify-center text-warning-600 shadow-sm animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-surface-900 text-sm flex items-center gap-1.5">
                      Agent Confirmation <Clock className="w-3.5 h-3.5 text-warning-600" />
                    </h4>
                    <p className="text-xs text-surface-500 leading-relaxed">
                      The agent ({booking.agent?.businessName || booking.agent?.name || "Vehicle Agent"}) is reviewing your booking request. You will receive an email and system notification as soon as they confirm it.
                    </p>
                  </div>
                </div>

                {/* Step 3: Session Commencement */}
                <div className="relative">
                  <div className="absolute -left-[42px] top-0.5 w-5 h-5 rounded-full bg-surface-50 border-2 border-surface-200 flex items-center justify-center text-surface-400 shadow-sm" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-surface-400 text-sm flex items-center gap-1.5">
                      Session Commences
                    </h4>
                    <p className="text-xs text-surface-400 leading-relaxed">
                      When you pick up the vehicle, the agent starts the session. This activates your GPS location stream and launches the real-time rental timer.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Information Panel */}
            <div className="p-4 rounded-xl bg-primary-50/45 border border-primary-100/50 flex gap-3 shadow-sm shadow-primary-900/[0.02]">
              <ShieldCheck className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-primary-900 uppercase tracking-wider flex items-center gap-1.5">
                  Notifications & Emails <Mail className="w-3.5 h-3.5 text-primary-500" />
                </h4>
                <p className="text-xs leading-relaxed text-primary-700 font-medium">
                  Please keep an eye on your inbox ({user.email}) or your header notifications panel. As soon as the session begins, you can track the vehicle live on the map.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={() => navigate({ to: "/bookings" })} className="flex-1 py-3 justify-center shadow-sm hover:shadow transition-shadow">
                View My Bookings <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button onClick={() => navigate({ to: "/vehicles" })} variant="outline" className="flex-1 py-3 justify-center">
                Browse More Vehicles
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
