import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Input, Textarea } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";
import { Car, User, Briefcase } from "lucide-react";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<"client" | "agent">("client");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    businessName: "",
    businessDescription: "",
    businessLicense: "",
  });

  if (user) {
    navigate({ to: "/dashboard" });
    return null;
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        phone: form.phone || undefined,
        businessName: role === "agent" ? form.businessName : undefined,
        businessDescription: role === "agent" ? form.businessDescription : undefined,
        businessLicense: role === "agent" ? form.businessLicense : undefined,
      });
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-md shadow-primary-600/10">
            <Car className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-serif font-medium text-surface-900">Create Account</h1>
          <p className="text-surface-500 mt-1 font-serif italic">Join VehicleHire as a client or agent</p>
        </div>

        {/* Role selector */}
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole("client")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all cursor-pointer ${
              role === "client"
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-surface-200 text-surface-500 hover:border-surface-300"
            }`}
          >
            <User className="w-5 h-5" />
            I&apos;m a Client
          </button>
          <button
            type="button"
            onClick={() => setRole("agent")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all cursor-pointer ${
              role === "agent"
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-surface-200 text-surface-500 hover:border-surface-300"
            }`}
          >
            <Briefcase className="w-5 h-5" />
            I&apos;m an Agent
          </button>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-danger-50 text-danger-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <Input label="Full Name" value={form.name} onChange={set("name")} required placeholder="John Doe" />
              <Input label="Email" type="email" value={form.email} onChange={set("email")} required placeholder="you@example.com" />
              <Input label="Password" type="password" value={form.password} onChange={set("password")} required placeholder="Min. 6 characters" />
              <Input label="Phone (optional)" type="tel" value={form.phone} onChange={set("phone")} placeholder="+254 700 000000" />

              {role === "agent" && (
                <div className="space-y-4 pt-4 border-t border-surface-100">
                  <p className="text-sm font-semibold text-surface-700">Business Details</p>
                  <Input label="Business Name" value={form.businessName} onChange={set("businessName")} required placeholder="My Car Hire Ltd" />
                  <Textarea label="Business Description" value={form.businessDescription} onChange={set("businessDescription")} placeholder="Brief description of your car hire operations..." />
                  <Input label="Business License No." value={form.businessLicense} onChange={set("businessLicense")} placeholder="License / registration number" />
                </div>
              )}

              <Button type="submit" isLoading={loading} className="w-full" size="lg">
                {role === "agent" ? "Register & Submit for Approval" : "Create Account"}
              </Button>

              {role === "agent" && (
                <p className="text-xs text-surface-400 text-center">
                  Agent accounts require admin approval before you can list vehicles.
                </p>
              )}
            </form>

            <div className="mt-6 text-center text-sm text-surface-500">
              Already have an account?{" "}
              <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
