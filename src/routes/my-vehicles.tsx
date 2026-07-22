import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, StarDisplay, EmptyState } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useState, useMemo, useEffect } from "react";
import { Car, Plus, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import type { Vehicle } from "../lib/types";

export const Route = createFileRoute("/my-vehicles")({
  component: MyVehiclesPage,
});

export function MyVehiclesPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const vehicles = useQuery(api.vehicles.getByAgentWithUrls, user ? { agentId: user._id } : "skip");
  const updateVehicle = useMutation(api.vehicles.update);

  const [filter, setFilter] = useState<"all" | "available" | "hired" | "inactive">("all");

  const filtered = useMemo(() => {
    if (!vehicles) return [];
    if (filter === "available") return vehicles.filter((v) => v.isActive && v.isAvailable);
    if (filter === "hired") return vehicles.filter((v) => v.isActive && !v.isAvailable);
    if (filter === "inactive") return vehicles.filter((v) => !v.isActive);
    return vehicles;
  }, [vehicles, filter]);

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
            Your agent registration is currently pending administrator review. You can create and manage fleet listings once your account is approved.
          </p>
          <Button onClick={() => navigate({ to: "/dashboard" })}>Back to Dashboard</Button>
        </main>
      </div>
    );
  }

  const toggleActive = async (vehicleId: string, isActive: boolean) => {
    await updateVehicle({
      vehicleId: vehicleId as never,
      agentId: user._id,
      isActive: !isActive,
      isAvailable: !isActive,
    });
  };

  const totalCount = vehicles?.length || 0;
  const availableCount = vehicles?.filter((v) => v.isActive && v.isAvailable).length || 0;
  const hiredCount = vehicles?.filter((v) => v.isActive && !v.isAvailable).length || 0;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-surface-50">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 w-full max-w-7xl pb-20 md:pb-8">
        
        {/* Header & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary-100 text-primary-800 border border-primary-200">
                Partner Fleet
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-surface-900 tracking-tight">
              My Fleet Listings
            </h1>
            <p className="text-surface-500 text-sm mt-0.5">
              Manage your vehicles, toggle availability, and monitor performance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/add-vehicle">
              <Button className="rounded-2xl shadow-sm"><Plus className="w-4 h-4" /> Add New Vehicle</Button>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-surface-400">Total Fleet</p>
            <p className="text-2xl font-bold text-surface-900 mt-0.5">{totalCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs">
            <p className="text-[10px] font-bold uppercase text-surface-400">Available Now</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{availableCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-surface-200/70 shadow-2xs col-span-2 sm:col-span-1">
            <p className="text-[10px] font-bold uppercase text-surface-400">Currently Hired</p>
            <p className="text-2xl font-bold text-primary-600 mt-0.5">{hiredCount}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-surface-200/70 shadow-xs mb-6 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === "all" ? "bg-primary-600 text-white shadow-xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            All Vehicles ({totalCount})
          </button>
          <button
            onClick={() => setFilter("available")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === "available" ? "bg-emerald-600 text-white shadow-xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            Available ({availableCount})
          </button>
          <button
            onClick={() => setFilter("hired")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === "hired" ? "bg-amber-600 text-white shadow-xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            Hired ({hiredCount})
          </button>
          <button
            onClick={() => setFilter("inactive")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === "inactive" ? "bg-surface-800 text-white shadow-xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            Inactive
          </button>
        </div>

        {/* Vehicle Cards Grid */}
        {!vehicles ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 bg-surface-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
            {filtered.map((v: Vehicle) => (
              <Card key={v._id} className="overflow-hidden border border-surface-200/70 rounded-3xl group shadow-2xs hover:shadow-md transition-all">
                
                {/* Image Container */}
                <div className="relative h-44 bg-surface-100 overflow-hidden">
                  {v.photos.length > 0 ? (
                    <img src={v.photos[0]} alt={`${v.make} ${v.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-surface-100 text-surface-400">
                      <Car className="w-10 h-10 opacity-60" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge variant={v.isActive ? (v.isAvailable ? "success" : "warning") : "danger"} dot size="md">
                      {v.isActive ? (v.isAvailable ? "Available" : "Hired") : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-surface-900">{v.make} {v.model}</h3>
                      <p className="text-xs text-surface-400 font-medium">{v.year} · {v.capacity} seats</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-bold text-sm text-primary-600">
                      {formatCurrency(v.rateAmount)} <span className="text-[11px] font-normal text-surface-500">/ {v.rateUnit}</span>
                    </span>
                    {v.totalReviews > 0 && (
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/50">
                        <StarDisplay rating={Math.round(v.averageRating)} />
                        <span className="text-[10px] font-bold text-amber-800">({v.totalReviews})</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-surface-100">
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(v._id, v.isActive)} className="flex-1 rounded-xl text-xs">
                      {v.isActive ? <><EyeOff className="w-3.5 h-3.5" /> Deactivate</> : <><Eye className="w-3.5 h-3.5" /> Activate</>}
                    </Button>
                    <Link to="/vehicle/$vehicleId" params={{ vehicleId: v._id }}>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs">View</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Car className="w-10 h-10 text-surface-400" />}
            title="No Vehicles in this View"
            description="Adjust your filter or list your first vehicle."
            action={<Link to="/add-vehicle"><Button size="sm" className="rounded-xl"><Plus className="w-4 h-4" /> Add Vehicle</Button></Link>}
          />
        )}
      </main>
    </div>
  );
}

