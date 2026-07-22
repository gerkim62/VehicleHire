import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "../components/layout/Sidebar";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Textarea, Select } from "../components/ui/Input";
import { Spinner } from "../components/ui/Badge";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useToast } from "../hooks/useToast";
import { getErrorMessage } from "../lib/utils";

export const Route = createFileRoute("/add-vehicle")({
  component: AddVehiclePage,
});

export function AddVehiclePage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const createVehicle = useMutation(api.vehicles.create);
  const generateUploadUrl = useMutation(api.vehicles.generateUploadUrl);

  const { error: toastError } = useToast();
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear().toString(),
    capacity: "4",
    description: "",
    rateAmount: "",
    rateUnit: "hour" as "hour" | "day",
  });
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [error]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="w-8 h-8" /></div>;
  if (!user || user.role !== "agent") { navigate({ to: "/login" }); return null; }

  if (user.agentStatus !== "approved") {
    return (
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 max-w-2xl flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 rounded-full bg-warning-50 flex items-center justify-center mb-4 text-warning-600">
            <span className="text-2xl font-bold">!</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 mb-2">Approval Pending</h1>
          <p className="text-surface-500 max-w-md mb-6">
            Your agent registration is currently pending review or has not been approved yet. You can list vehicles once your account is approved.
          </p>
          <Button onClick={() => navigate({ to: "/dashboard" })}>Back to Dashboard</Button>
        </main>
      </div>
    );
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.make || !form.model || !form.rateAmount) {
      setError("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      // Upload photos
      const photoIds: string[] = [];
      for (const file of photoFiles) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await res.json();
        photoIds.push(storageId);
      }

      await createVehicle({
        agentId: user._id,
        make: form.make,
        model: form.model,
        year: parseInt(form.year),
        capacity: parseInt(form.capacity),
        description: form.description,
        photos: photoIds,
        rateAmount: parseFloat(form.rateAmount),
        rateUnit: form.rateUnit,
      });

      navigate({ to: "/my-vehicles" });
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 lg:p-8 w-full max-w-4xl pb-20 md:pb-8">
        <button
          onClick={() => navigate({ to: "/my-vehicles" })}
          className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Vehicles
        </button>

        <h1 className="text-2xl font-bold text-surface-900 mb-1">Add Vehicle</h1>
        <p className="text-surface-500 mb-6">List a new vehicle for hire</p>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-danger-50 text-danger-600 text-sm">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input label="Make *" value={form.make} onChange={set("make")} required placeholder="Toyota" />
                <Input label="Model *" value={form.model} onChange={set("model")} required placeholder="Land Cruiser" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Year" type="number" value={form.year} onChange={set("year")} min="2000" max="2030" />
                <Input label="Capacity (seats)" type="number" value={form.capacity} onChange={set("capacity")} min="1" max="50" />
              </div>
              <Textarea label="Description" value={form.description} onChange={set("description")} placeholder="Describe the vehicle, features, condition..." />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Hire Rate (KES) *" type="number" value={form.rateAmount} onChange={set("rateAmount")} required placeholder="500" min="1" />
                <Select
                  label="Per"
                  value={form.rateUnit}
                  onChange={set("rateUnit")}
                  options={[
                    { value: "hour", label: "Per Hour" },
                    { value: "day", label: "Per Day" },
                  ]}
                />
              </div>

              {/* Photo upload */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-surface-700">Vehicle Photos</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
                  className="w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 file:cursor-pointer cursor-pointer"
                />
                {photoFiles.length > 0 && (
                  <p className="text-xs text-surface-400">{photoFiles.length} file(s) selected</p>
                )}
              </div>

              <Button type="submit" isLoading={submitting} className="w-full" size="lg">
                Add Vehicle
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
