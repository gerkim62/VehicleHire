import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { Spinner } from "../components/ui/Badge";
import { Car } from "lucide-react";
import { parseJwt, getErrorMessage } from "../lib/utils";

export const Route = createFileRoute("/oauth-success")({
  component: OAuthSuccessPage,
});

/**
 * Landing route for Google OAuth redirects.
 *
 * Handles Google OAuth redirect responses (hash parameters or query params),
 * extracts the ID token, authenticates the user, and redirects to dashboard.
 */
export function OAuthSuccessPage() {
  const { user, isLoading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleRedirect() {
      // 1. Check URL hash (standard implicit flow) or search params
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);

      const idToken = hashParams.get("id_token") || searchParams.get("id_token");
      const rawState = hashParams.get("state") || searchParams.get("state");
      
      const role: "client" | "agent" = rawState === "agent" ? "agent" : "client";

      if (idToken) {
        try {
          const payload = parseJwt(idToken);
          await loginWithGoogle(
            payload.sub,
            payload.email,
            payload.name,
            payload.picture,
            role
          );
          if (isMounted) {
            // Clean URL and redirect to dashboard
            window.history.replaceState(null, "", window.location.pathname);
            navigate({ to: "/dashboard" });
          }
          return;
        } catch (err) {
          const msg = getErrorMessage(err);
          if (isMounted) {
            setErrorMsg(msg);
            toastError(`Google authentication failed: ${msg}`);
            setTimeout(() => navigate({ to: "/login" }), 2500);
          }
          return;
        }
      }

      // 2. If no token in URL, rely on current auth state once loaded
      if (!isLoading) {
        if (user) {
          navigate({ to: "/dashboard" });
        } else {
          navigate({ to: "/login" });
        }
      }
    }

    handleRedirect();

    return () => {
      isMounted = false;
    };
  }, [user, isLoading, loginWithGoogle, navigate, toastError]);

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="text-center animate-fade-in px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-600/20">
          <Car className="w-8 h-8 text-white" />
        </div>
        {errorMsg ? (
          <div className="max-w-md bg-danger-50 text-danger-700 p-4 rounded-xl text-sm font-medium">
            <p className="font-semibold mb-1">Authentication Error</p>
            <p>{errorMsg}</p>
            <p className="text-xs text-surface-500 mt-2">Redirecting to login…</p>
          </div>
        ) : (
          <>
            <Spinner className="w-8 h-8 mx-auto mb-4" />
            <p className="text-surface-600 font-medium">Completing Google sign-in…</p>
          </>
        )}
      </div>
    </div>
  );
}
