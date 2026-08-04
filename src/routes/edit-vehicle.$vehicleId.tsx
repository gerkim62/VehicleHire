import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Spinner } from "../components/ui/Badge";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Upload, X, AlertCircle } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/edit-vehicle/$vehicleId")({
  component: EditVehiclePage,
});

export function EditVehiclePage() {
  const { vehicleId } = Route.useParams();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const vehicle = useQuery(
    api.vehicles.getByIdWithUrl,
    vehicleId ? { vehicleId: vehicleId as Id<"vehicles"> } : "skip"
  );
  const updateVehicle = useMutation(api.vehicles.update);
  const generateUploadUrl = useMutation(api.vehicles.generateUploadUrl);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [rateAmount, setRateAmount] = useState("");
  const [rateUnit, setRateUnit] = useState<"hour" | "day">("hour");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Populate form when vehicle loads
  useEffect(() => {
    if (vehicle) {
      setMake(vehicle.make);
      setModel(vehicle.model);
      setYear(vehicle.year.toString());
      setCapacity(vehicle.capacity.toString());
      setDescription(vehicle.description);
      setRateAmount(vehicle.rateAmount.toString());
      setRateUnit(vehicle.rateUnit);
      setPhotos(vehicle.photos);
    }
  }, [vehicle]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "agent")) {
      navigate({ to: "/login" });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || !vehicle) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!user || user.role !== "agent" || vehicle.agentId !== user._id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-surface-900 mb-2">Unauthorized</h2>
        <p className="text-surface-500 mb-4">You don't have permission to edit this vehicle.</p>
        <Button onClick={() => navigate({ to: "/my-vehicles" })}>
          Back to My Vehicles
        </Button>
      </div>
    );
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const uploadedIds: string[] = [];

      for (const file of Array.from(files)) {
        // Get upload URL
        const uploadUrl = await generateUploadUrl();

        // Upload file
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) throw new Error("Upload failed");

        const { storageId } = await result.json();
        uploadedIds.push(storageId);
      }

      setPhotos([...photos, ...uploadedIds]);
    } catch (err) {
      setError("Failed to upload photos. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!make.trim() || !model.trim() || !description.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    const yearNum = parseInt(year);
    const capacityNum = parseInt(capacity);
    const rateNum = parseFloat(rateAmount);

    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      setError("Please enter a valid year");
      return;
    }

    if (isNaN(capacityNum) || capacityNum < 1 || capacityNum > 20) {
      setError("Please enter a valid capacity (1-20)");
      return;
    }

    if (isNaN(rateNum) || rateNum <= 0) {
      setError("Please enter a valid rate amount");
      return;
    }

    setSaving(true);

    try {
      await updateVehicle({
        vehicleId: vehicleId as Id<"vehicles">,
        agentId: user._id,
        make: make.trim(),
        model: model.trim(),
        year: yearNum,
        capacity: capacityNum,
        description: description.trim(),
        photos,
        rateAmount: rateNum,
        rateUnit,
      });

      navigate({ to: "/my-vehicles" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update vehicle");
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-surface-50">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-4xl pb-20 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/my-vehicles" })}
            className="mb-4 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Vehicles
          </Button>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-surface-900 tracking-tight">
            Edit Vehicle
          </h1>
          <p className="text-surface-500 text-sm mt-0.5">
            Update your vehicle listing details
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Card className="border border-surface-200/70 rounded-3xl shadow-xs">
          <CardContent className="p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vehicle Photos */}
              <div>
                <label className="block text-sm font-bold text-surface-900 mb-2">
                  Vehicle Photos
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={photo}
                        alt={`Vehicle ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-2xl border border-surface-200"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="block">
                  <div className="border-2 border-dashed border-surface-300 rounded-2xl p-6 text-center cursor-pointer hover:border-primary-500 transition-colors">
                    <Upload className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                    <p className="text-sm text-surface-600 font-medium">
                      {uploading ? "Uploading..." : "Click to upload photos"}
                    </p>
                    <p className="text-xs text-surface-400 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Make & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-surface-900 mb-2">
                    Make *
                  </label>
                  <Input
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="e.g., Toyota"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-surface-900 mb-2">
                    Model *
                  </label>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g., Corolla"
                    required
                  />
                </div>
              </div>

              {/* Year & Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-surface-900 mb-2">
                    Year *
                  </label>
                  <Input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2020"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-surface-900 mb-2">
                    Seating Capacity *
                  </label>
                  <Input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="5"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-surface-900 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your vehicle, its features, condition..."
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-surface-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Rate */}
              <div>
                <label className="block text-sm font-bold text-surface-900 mb-2">
                  Rental Rate *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    value={rateAmount}
                    onChange={(e) => setRateAmount(e.target.value)}
                    placeholder="500"
                    required
                  />
                  <select
                    value={rateUnit}
                    onChange={(e) => setRateUnit(e.target.value as "hour" | "day")}
                    className="px-4 py-3 border border-surface-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="hour">Per Hour</option>
                    <option value="day">Per Day</option>
                  </select>
                </div>
                <p className="text-xs text-surface-400 mt-2">
                  Amount in KES (Kenyan Shillings)
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: "/my-vehicles" })}
                  className="flex-1 rounded-2xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || uploading}
                  className="flex-1 rounded-2xl"
                >
                  {saving ? (
                    <>
                      <Spinner className="w-4 h-4" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
