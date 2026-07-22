import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Badge, Spinner, StarDisplay, EmptyState } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { useState, useMemo } from "react";
import { Car, Search, Users as UsersIcon, Clock, Sparkles, Filter, ArrowRight, ShieldCheck } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import type { Vehicle } from "../lib/types";

export const Route = createFileRoute("/vehicles")({
  component: VehiclesPage,
});

export function VehiclesPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const vehicles = useQuery(api.vehicles.getAvailableWithUrls);
  const [search, setSearch] = useState("");
  const [capacityFilter, setCapacityFilter] = useState<"all" | "4" | "5+">("all");
  const [sortBy, setSortBy] = useState<"rating" | "price_asc" | "price_desc">("rating");

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user) { navigate({ to: "/login" }); return null; }

  const filtered = useMemo(() => {
    if (!vehicles) return [];
    return vehicles
      .filter((v: Vehicle) => {
        const q = search.toLowerCase();
        const matchesQuery =
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q);
        
        if (!matchesQuery) return false;
        if (capacityFilter === "4") return v.capacity <= 4;
        if (capacityFilter === "5+") return v.capacity >= 5;
        return true;
      })
      .sort((a: Vehicle, b: Vehicle) => {
        if (sortBy === "price_asc") return a.rateAmount - b.rateAmount;
        if (sortBy === "price_desc") return b.rateAmount - a.rateAmount;
        return (b.averageRating || 0) - (a.averageRating || 0);
      });
  }, [vehicles, search, capacityFilter, sortBy]);

  const totalCount = vehicles?.length || 0;
  const avgRate = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return 0;
    return Math.round(vehicles.reduce((acc, v) => acc + v.rateAmount, 0) / vehicles.length);
  }, [vehicles]);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-surface-50">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 w-full max-w-7xl pb-20 md:pb-8">
        
        {/* Top Header & Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary-100 text-primary-800 border border-primary-200">
                Available Fleet
              </span>
              <span className="text-xs text-surface-400 font-medium">• Verified Vehicles</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-surface-900 tracking-tight">
              Browse Vehicles
            </h1>
            <p className="text-surface-500 text-sm mt-0.5">
              Explore available cars for your next hourly or daily hire
            </p>
          </div>

          {/* Quick Stats Pill Cards */}
          <div className="flex items-center gap-3 self-start lg:self-auto">
            <div className="bg-white px-4 py-2.5 rounded-2xl border border-surface-200/70 shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-surface-400 uppercase font-bold">Total Available</p>
                <p className="text-base font-bold text-surface-900 leading-none">{totalCount}</p>
              </div>
            </div>

            <div className="bg-white px-4 py-2.5 rounded-2xl border border-surface-200/70 shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-surface-400 uppercase font-bold">Avg. Rate</p>
                <p className="text-base font-bold text-surface-900 leading-none">{formatCurrency(avgRate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-3xl border border-surface-200/70 shadow-xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <Input
              placeholder="Search make, model, or features..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-2xl border-surface-200 text-sm focus:ring-primary-500"
            />
          </div>

          {/* Filters & Sort */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 bg-surface-100/80 p-1 rounded-2xl border border-surface-200/50">
              <button
                onClick={() => setCapacityFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  capacityFilter === "all" ? "bg-white text-surface-900 shadow-xs" : "text-surface-600 hover:text-surface-900"
                }`}
              >
                All Seats
              </button>
              <button
                onClick={() => setCapacityFilter("4")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  capacityFilter === "4" ? "bg-white text-surface-900 shadow-xs" : "text-surface-600 hover:text-surface-900"
                }`}
              >
                ≤ 4 Seats
              </button>
              <button
                onClick={() => setCapacityFilter("5+")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  capacityFilter === "5+" ? "bg-white text-surface-900 shadow-xs" : "text-surface-600 hover:text-surface-900"
                }`}
              >
                5+ Seats
              </button>
            </div>

            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-surface-100/80 border border-surface-200/60 rounded-2xl text-xs font-semibold text-surface-700 cursor-pointer hover:bg-surface-200/80 transition-colors focus:outline-none"
            >
              <option value="rating">Sort: Top Rated</option>
              <option value="price_asc">Sort: Price Low → High</option>
              <option value="price_desc">Sort: Price High → Low</option>
            </select>
          </div>
        </div>

        {/* Grid List */}
        {!vehicles ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 rounded-3xl bg-surface-100 animate-pulse border border-surface-200/50" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filtered.map((vehicle: Vehicle) => (
              <Link key={vehicle._id} to="/vehicle/$vehicleId" params={{ vehicleId: vehicle._id }}>
                <Card hover className="overflow-hidden h-full border border-surface-200/70 rounded-3xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  
                  {/* Photo Container */}
                  <div className="relative h-48 bg-surface-100 overflow-hidden">
                    {vehicle.photos.length > 0 ? (
                      <img
                        src={vehicle.photos[0]}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface-100 to-surface-200 text-surface-400">
                        <Car className="w-12 h-12 mb-1 opacity-60" />
                        <span className="text-xs font-medium">No Image</span>
                      </div>
                    )}

                    {/* Price Tag Pill */}
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl shadow-xs border border-white/40 font-bold text-xs text-primary-700">
                      {formatCurrency(vehicle.rateAmount)} <span className="text-[10px] font-normal text-surface-500">/ {vehicle.rateUnit}</span>
                    </div>

                    {/* Verified Badge */}
                    <div className="absolute top-3 right-3 bg-emerald-500/90 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-xs">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-base text-surface-900 group-hover:text-primary-600 transition-colors">
                          {vehicle.make} {vehicle.model}
                        </h3>
                        <p className="text-xs text-surface-400 font-medium">{vehicle.year} Model</p>
                      </div>
                      {vehicle.totalReviews > 0 ? (
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60">
                          <StarDisplay rating={Math.round(vehicle.averageRating)} />
                          <span className="text-[11px] font-bold text-amber-800">({vehicle.totalReviews})</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-surface-400 bg-surface-100 px-2 py-0.5 rounded-md">New</span>
                      )}
                    </div>

                    {/* Features row */}
                    <div className="flex items-center gap-3 text-xs text-surface-500 pt-1">
                      <span className="flex items-center gap-1 bg-surface-50 px-2.5 py-1 rounded-xl border border-surface-100 font-medium">
                        <UsersIcon className="w-3.5 h-3.5 text-surface-400" /> {vehicle.capacity} seats
                      </span>
                      <span className="flex items-center gap-1 bg-surface-50 px-2.5 py-1 rounded-xl border border-surface-100 font-medium">
                        <Clock className="w-3.5 h-3.5 text-surface-400" /> Per {vehicle.rateUnit}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-surface-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-primary-600 group-hover:underline flex items-center gap-1">
                        View Details & Book
                      </span>
                      <div className="w-7 h-7 rounded-full bg-primary-50 group-hover:bg-primary-600 text-primary-600 group-hover:text-white flex items-center justify-center transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Car className="w-10 h-10 text-surface-400" />}
            title="No Vehicles Found"
            description={search ? `No vehicles matched "${search}". Try another filter.` : "No vehicles are currently listed."}
          />
        )}
      </main>
    </div>
  );
}

