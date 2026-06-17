import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, StarDisplay, EmptyState } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { useState } from "react";
import { Car, Search, Users as UsersIcon, Clock } from "lucide-react";
import { formatCurrency } from "../lib/utils";

export const Route = createFileRoute("/vehicles")({
  component: VehiclesPage,
});

function VehiclesPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const vehicles = useQuery(api.vehicles.getAvailable);
  const [search, setSearch] = useState("");

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user) { navigate({ to: "/login" }); return null; }

  const filtered = vehicles?.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Browse Vehicles</h1>
            <p className="text-surface-500 mt-1">Find and book your next ride</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <Input
              placeholder="Search make, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {!vehicles ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-surface-100 animate-pulse" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filtered.map((vehicle) => (
              <Link key={vehicle._id} to={`/vehicle/${vehicle._id}`}>
                <Card hover className="overflow-hidden h-full">
                  <div className="h-44 bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center">
                    {vehicle.photos.length > 0 ? (
                      <img
                        src={vehicle.photos[0]}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Car className="w-12 h-12 text-surface-300" />
                    )}
                  </div>
                  <CardContent className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-surface-900">
                          {vehicle.make} {vehicle.model}
                        </h3>
                        <p className="text-xs text-surface-400">{vehicle.year}</p>
                      </div>
                      {vehicle.totalReviews > 0 && (
                        <div className="flex items-center gap-1">
                          <StarDisplay rating={Math.round(vehicle.averageRating)} />
                          <span className="text-xs text-surface-400">({vehicle.totalReviews})</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-surface-500">
                      <span className="flex items-center gap-1"><UsersIcon className="w-3.5 h-3.5" /> {vehicle.capacity} seats</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Per {vehicle.rateUnit}</span>
                    </div>
                    <div className="pt-2 border-t border-surface-100">
                      <Badge variant="info" size="md">
                        {formatCurrency(vehicle.rateAmount)} / {vehicle.rateUnit}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Car className="w-8 h-8" />}
            title="No Vehicles Found"
            description={search ? "Try a different search term." : "No vehicles are currently available."}
          />
        )}
      </main>
    </div>
  );
}
