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
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-2xl mx-auto">
        {!booking ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Spinner className="w-8 h-8 mb-2" />
            <p className="text-sm text-surface-500">Loading booking status…</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in py-4">
            {/* Header Success Section */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-success-50 border border-success-100 flex items-center justify-center mx-auto text-success-600 shadow-md shadow-success-600/5">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h1 className="text-3xl font-serif font-medium text-surface-900">Booking Requested!</h1>
              <p className="text-surface-500 max-w-md mx-auto">
                Your booking request has been placed successfully and is now pending agent approval.
              </p>
            </div>

            {/* Vehicle Details Card */}
            {booking.vehicle && (
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-surface-100 flex items-center justify-center overflow-hidden shrink-0">
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
                    <p className="text-xs text-primary-600 font-semibold tracking-wider uppercase mb-0.5">
                      Selected Vehicle
                    </p>
                    <h3 className="font-medium text-surface-900 truncate">
                      {booking.vehicle.make} {booking.vehicle.model}
                    </h3>
                    <p className="text-xs text-surface-500 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5" /> Rate: {formatCurrency(booking.vehicle.rateAmount)} / {booking.vehicle.rateUnit}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Explanation Timeline */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">
                What happens next?
              </h3>

              <div className="relative border-l border-surface-200 pl-6 ml-3 space-y-8">
                {/* Step 1: Placed */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-success-600 border-4 border-success-50" />
                  <div className="space-y-1">
                    <h4 className="font-medium text-surface-900 text-sm">Booking Placed</h4>
                    <p className="text-xs text-surface-500">
                      Your request has been saved and the agent has been notified immediately.
                    </p>
                  </div>
                </div>

                {/* Step 2: Agent Review */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-warning-500 border-4 border-warning-50 animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="font-medium text-surface-900 text-sm flex items-center gap-1.5">
                      Agent Confirmation <Clock className="w-3.5 h-3.5 text-warning-600" />
                    </h4>
                    <p className="text-xs text-surface-500">
                      The agent ({booking.agent?.businessName || booking.agent?.name || "Vehicle Agent"}) is reviewing your booking request. You will receive an email and system notification as soon as they confirm it.
                    </p>
                  </div>
                </div>

                {/* Step 3: Session Commencement */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-surface-200 border-4 border-white" />
                  <div className="space-y-1">
                    <h4 className="font-medium text-surface-400 text-sm flex items-center gap-1.5">
                      Session Commences
                    </h4>
                    <p className="text-xs text-surface-400">
                      When you pick up the vehicle, the agent starts the session. This activates your GPS location stream and launches the real-time rental timer.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Information Panel */}
            <div className="p-4 rounded-2xl bg-primary-50 border border-primary-100 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-primary-950 flex items-center gap-1">
                  Notifications & Emails <Mail className="w-4 h-4" />
                </h4>
                <p className="text-xs leading-relaxed text-primary-700">
                  Please keep an eye on your inbox ({user.email}) or your header notifications panel. As soon as the session begins, you can track the vehicle live on the map.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={() => navigate({ to: "/bookings" })} className="flex-1 py-3 justify-center">
                View My Bookings <ArrowRight className="w-4 h-4" />
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
