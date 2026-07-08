import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

interface Props {
  role: "client" | "agent";
  onSuccess?: () => void;
  onError?: (err: string) => void;
}

/** Parse a Google ID token JWT (payload only — client-side, no verification) */
function parseJwt(token: string): {
  sub: string;
  email: string;
  name: string;
  picture?: string;
} {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
}

/**
 * Google Sign-In button component.
 *
 * Renders a native Google button if the GSI script is loaded and
 * VITE_GOOGLE_CLIENT_ID is set. Falls back to a styled placeholder otherwise.
 */
export function GoogleSignInButton({ role, onSuccess, onError }: Props) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = async (credential: string) => {
    setLoading(true);
    try {
      const payload = parseJwt(credential);
      await loginWithGoogle(
        payload.sub,
        payload.email,
        payload.name,
        payload.picture,
        role
      );
      onSuccess?.();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (!clientId) {
      onError?.(
        "Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to .env.local (see SETUP.md §2b)"
      );
      return;
    }

    if (!window.google?.accounts?.id) {
      onError?.(
        "Google Identity Services not loaded. Check your internet connection and try again."
      );
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        handleCredentialResponse(response.credential);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    window.google.accounts.id.prompt();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      id="google-signin-btn"
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50 transition-all text-sm font-medium text-surface-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-surface-300 border-t-primary-600 rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      )}
      {loading ? "Signing in…" : "Continue with Google"}
    </button>
  );
}
