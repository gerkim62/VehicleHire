import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Spinner } from "../components/ui/Badge";
import { Car } from "lucide-react";

export const Route = createFileRoute("/oauth-success")({
  component: OAuthSuccessPage,
});

/**
 * Landing route for Google OAuth redirects.
 *
 * The Google GSI library used in this app uses a popup/prompt flow
 * (not a redirect), so this page mainly handles the case where the
 * user lands here directly (e.g., bookmarked) by checking auth state
 * and redirecting appropriately.
 */
export function OAuthSuccessPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        navigate({ to: "/dashboard" });
      } else {
        navigate({ to: "/login" });
      }
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-600/20">
          <Car className="w-8 h-8 text-white" />
        </div>
        <Spinner className="w-8 h-8 mx-auto mb-4" />
        <p className="text-surface-500 text-sm">Completing sign-in…</p>
      </div>
    </div>
  );
}
