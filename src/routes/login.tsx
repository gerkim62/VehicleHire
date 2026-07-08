import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";
import { GoogleSignInButton } from "../components/ui/GoogleSignInButton";
import { Car, Mail, Lock } from "lucide-react";
import { getErrorMessage } from "../lib/utils";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [error]);

  if (user) {
    navigate({ to: "/dashboard" });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-md shadow-primary-600/10">
            <Car className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-serif font-medium text-surface-900">Welcome Back</h1>
          <p className="text-surface-500 mt-1 font-serif italic">Sign in to your VehicleHire account</p>
        </div>

        <Card>
          <CardContent className="p-6">
            {/* Google Sign-In */}
            <GoogleSignInButton
              role="client"
              onSuccess={() => navigate({ to: "/dashboard" })}
              onError={(e) => {
                setError(e);
                toastError(e);
              }}
            />

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-surface-400">or sign in with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-danger-50 text-danger-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-[38px] w-4 h-4 text-surface-400" />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-[38px] w-4 h-4 text-surface-400" />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>

              <Button
                type="submit"
                isLoading={loading}
                className="w-full"
                size="lg"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-surface-500">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="text-primary-600 font-medium hover:text-primary-700"
              >
                Create one
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
