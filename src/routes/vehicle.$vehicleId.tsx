import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, StarDisplay } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useState } from "react";
import {
  Car,
  Users as UsersIcon,
  Clock,
  MapPin,
  Star,
  ArrowLeft,
} from "lucide-react";
import { formatCurrency, formatDate, getErrorMessage } from "../lib/utils";
import type { Review } from "../lib/types";
import { useToast } from "../hooks/useToast";

type EnrichedReview = Review & { clientName: string; clientAvatar?: string };

export const Route = createFileRoute("/vehicle/$vehicleId")({
  component: VehicleDetailPage,
});

export function VehicleDetailPage() {
  const { vehicleId } = Route.useParams();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const vehicle = useQuery(api.vehicles.getByIdWithUrl, {
    vehicleId: vehicleId as Id<"vehicles">,
  });
  const reviews = useQuery(api.reviews.getByVehicle, {
    vehicleId: vehicleId as Id<"vehicles">,
  });
  const createBooking = useMutation(api.bookings.create);

  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");

  if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user) { navigate({ to: "/login" }); return null; }

  if (vehicle === undefined) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!vehicle) return <div className="p-8 text-center text-surface-500">Vehicle not found</div>;

  const handleBook = async () => {
    if (!user) return;
    setBooking(true);
    setBookingError("");
    try {
      const bookingId = await createBooking({
        clientId: user._id,
        vehicleId: vehicle._id,
        pickupDate: Date.now(),
      });
      navigate({ to: "/booking-success", search: { bookingId } });
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setBookingError(msg);
      toastError(msg);
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-4xl animate-fade-in pb-20 md:pb-8">
        <button
          onClick={() => navigate({ to: "/vehicles" })}
          className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </button>

        {/* Vehicle header */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="h-64 lg:h-80 rounded-2xl bg-surface-100 flex items-center justify-center overflow-hidden">
            {vehicle.photos.length > 0 ? (
              <img
                src={vehicle.photos[0]}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <Car className="w-16 h-16 text-surface-300" />
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-serif font-medium text-surface-900">
                {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-surface-500">{vehicle.year}</p>
            </div>

            {vehicle.totalReviews > 0 && (
              <div className="flex items-center gap-2">
                <StarDisplay rating={Math.round(vehicle.averageRating)} size="md" />
                <span className="text-sm text-surface-500">
                  {vehicle.averageRating.toFixed(1)} ({vehicle.totalReviews} review{vehicle.totalReviews > 1 ? "s" : ""})
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Badge variant="info" size="md">
                <UsersIcon className="w-3.5 h-3.5" /> {vehicle.capacity} seats
              </Badge>
              <Badge variant="default" size="md">
                <Clock className="w-3.5 h-3.5" /> Per {vehicle.rateUnit}
              </Badge>
            </div>

            <div className="p-4 rounded-xl bg-primary-50 border border-primary-100">
              <p className="text-sm text-primary-600 font-medium">Hire Rate</p>
              <p className="text-2xl font-bold text-primary-700">
                {formatCurrency(vehicle.rateAmount)} <span className="text-base font-normal">/ {vehicle.rateUnit}</span>
              </p>
            </div>

            <p className="text-sm text-surface-600 leading-relaxed">{vehicle.description}</p>

            {bookingError && (
              <div className="p-3 rounded-xl bg-danger-50 text-danger-600 text-sm">{bookingError}</div>
            )}

            {user.role === "client" && vehicle.isAvailable && (
              <Button onClick={handleBook} isLoading={booking} size="lg" className="w-full">
                <MapPin className="w-5 h-5" /> Book This Vehicle
              </Button>
            )}

            {!vehicle.isAvailable && (
              <Badge variant="warning" size="md">Currently Unavailable</Badge>
            )}
          </div>
        </div>

        {/* Reviews */}
        <Card>
          <CardContent>
            <h2 className="text-lg font-serif font-medium text-surface-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-warning-500" /> Reviews
            </h2>
            {reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: EnrichedReview) => (
                  <div key={review._id} className="p-4 rounded-xl bg-surface-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold">
                          {review.clientName?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-surface-900">{review.clientName}</p>
                          <p className="text-xs text-surface-400">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <StarDisplay rating={review.rating} />
                    </div>
                    {review.comment && (
                      <p className="text-sm text-surface-600 ml-10">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-400 text-center py-4">No reviews yet for this vehicle.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
