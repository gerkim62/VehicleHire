import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, StarDisplay, EmptyState } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Car, Plus, Eye, EyeOff } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import type { Vehicle } from "../lib/types";

export const Route = createFileRoute("/my-vehicles")({
  component: MyVehiclesPage,
});

function MyVehiclesPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const vehicles = useQuery(api.vehicles.getByAgentWithUrls, user ? { agentId: user._id } : "skip");
  const updateVehicle = useMutation(api.vehicles.update);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user || user.role !== "agent") { navigate({ to: "/login" }); return null; }

  const toggleActive = async (vehicleId: string, isActive: boolean) => {
    await updateVehicle({
      vehicleId: vehicleId as never,
      agentId: user._id,
      isActive: !isActive,
      isAvailable: !isActive,
    });
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-serif font-medium text-surface-900">My Vehicles</h1>
            <p className="text-surface-500 mt-1 font-serif italic">Manage your fleet</p>
          </div>
          <Link to="/add-vehicle">
            <Button><Plus className="w-4 h-4" /> Add Vehicle</Button>
          </Link>
        </div>

        {!vehicles ? (
          <Spinner className="w-6 h-6" />
        ) : vehicles.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
            {vehicles.map((v: Vehicle) => (
              <Card key={v._id} className="overflow-hidden">
                <div className="h-36 bg-surface-100 flex items-center justify-center">
                  {v.photos.length > 0 ? (
                    <img src={v.photos[0]} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover" />
                  ) : (
                    <Car className="w-10 h-10 text-surface-300" />
                  )}
                </div>
                <CardContent className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-surface-900">{v.make} {v.model}</h3>
                      <p className="text-xs text-surface-400">{v.year} · {v.capacity} seats</p>
                    </div>
                    <Badge variant={v.isActive ? (v.isAvailable ? "success" : "warning") : "danger"} dot>
                      {v.isActive ? (v.isAvailable ? "Available" : "Hired") : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-primary-600">{formatCurrency(v.rateAmount)} / {v.rateUnit}</p>
                  {v.totalReviews > 0 && (
                    <div className="flex items-center gap-1">
                      <StarDisplay rating={Math.round(v.averageRating)} />
                      <span className="text-xs text-surface-400">({v.totalReviews})</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2 border-t border-surface-100">
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(v._id, v.isActive)} className="flex-1">
                      {v.isActive ? <><EyeOff className="w-3.5 h-3.5" /> Deactivate</> : <><Eye className="w-3.5 h-3.5" /> Activate</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Car className="w-8 h-8" />}
            title="No Vehicles Listed"
            description="Add your first vehicle to start receiving bookings."
            action={<Link to="/add-vehicle"><Button size="sm"><Plus className="w-4 h-4" /> Add Vehicle</Button></Link>}
          />
        )}
      </main>
    </div>
  );
}
