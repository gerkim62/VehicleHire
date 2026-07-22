import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../lib/utils";

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
          prompt: (
            momentListener?: (notification: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
              getNotDisplayedReason: () => string;
              getSkippedReason: () => string;
            }) => void
          ) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
              logo_alignment?: "left" | "center";
            }
          ) => void;
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
 * Uses Google Identity Services `renderButton()` to display a native
 * Google-branded button. This is more reliable than `prompt()` (One Tap),
 * which can be silently suppressed by the browser or by Google's cooldown
 * after a user dismisses it.
 *
 * Falls back to a styled custom button if the GSI script or client ID
 * is unavailable.
 */
export function GoogleSignInButton({ role, onSuccess, onError }: Props) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(() => !!window.google?.accounts?.id);
  const [renderFailed, setRenderFailed] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  // Use a ref to always have access to the latest role without re-initializing GSI
  const roleRef = useRef(role);
  roleRef.current = role;

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = useCallback(
    async (credential: string) => {
      setLoading(true);
      try {
        const payload = parseJwt(credential);
        await loginWithGoogle(
          payload.sub,
          payload.email,
          payload.name,
          payload.picture,
          roleRef.current
        );
        onSuccess?.();
      } catch (err) {
        onError?.(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [loginWithGoogle, onSuccess, onError]
  );

  // Wait for the GSI script to finish loading if it hasn't yet
  useEffect(() => {
    if (gsiReady) return;

    const checkInterval = setInterval(() => {
      if (window.google?.accounts?.id) {
        setGsiReady(true);
        clearInterval(checkInterval);
      }
    }, 100);

    // Give up after 10 seconds
    const timeout = setTimeout(() => clearInterval(checkInterval), 10_000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [gsiReady]);

  // Initialize GSI and render the native Google button once the script is ready
  useEffect(() => {
    if (!gsiReady || !clientId || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          handleCredentialResponse(response.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render the native Google button into our container
      if (buttonContainerRef.current) {
        // Clear any previous render
        buttonContainerRef.current.innerHTML = "";

        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: buttonContainerRef.current.offsetWidth || 400,
          logo_alignment: "left",
        });
      }
    } catch {
      // renderButton can fail in certain environments; fall back to custom button
      setRenderFailed(true);
    }
  }, [gsiReady, clientId, handleCredentialResponse]);

  // Fallback click handler — uses prompt() as a last resort
  const handleFallbackClick = () => {
    if (!clientId) {
      onError?.(
        "Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to .env.local (see SETUP.md §2b)"
      );
      return;
    }

    if (!gsiReady || !window.google?.accounts?.id) {
      onError?.(
        "Google Identity Services not loaded. Check your internet connection and try again."
      );
      return;
    }

    // Re-initialize and trigger prompt
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        handleCredentialResponse(response.credential);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        const reason = notification.getNotDisplayedReason();
        if (reason === "suppressed_by_user") {
          onError?.(
            "Google Sign-In was recently dismissed. Please wait a moment and try again, or clear your browser cookies for accounts.google.com."
          );
        } else if (reason === "opt_out_or_no_session") {
          onError?.(
            "No Google session found. Please sign in to your Google account in another tab first, then try again."
          );
        } else {
          onError?.(
            `Google Sign-In popup could not be displayed (${reason}). Please try again.`
          );
        }
      } else if (notification.isSkippedMoment()) {
        const reason = notification.getSkippedReason();
        onError?.(
          `Google Sign-In was skipped (${reason}). Please try again.`
        );
      }
    });
  };

  // If GSI is ready, client ID is set, and renderButton didn't fail,
  // show the native Google button container
  const showNativeButton = gsiReady && clientId && !renderFailed;

  return (
    <div className="google-signin-wrapper">
      {/* Native Google-rendered button (hidden if not ready or failed) */}
      <div
        ref={buttonContainerRef}
        id="google-signin-btn"
        style={{
          display: showNativeButton ? "flex" : "none",
          justifyContent: "center",
          minHeight: 44,
          alignItems: "center",
        }}
      />

      {/* Loading overlay shown while processing credentials */}
      {loading && (
        <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-surface-200 bg-white text-sm font-medium text-surface-700">
          <span className="w-5 h-5 border-2 border-surface-300 border-t-primary-600 rounded-full animate-spin" />
          Signing in…
        </div>
      )}

      {/* Fallback custom button — shown if GSI hasn't loaded, no client ID, or renderButton failed */}
      {!showNativeButton && !loading && (
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50 transition-all text-sm font-medium text-surface-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
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
          Continue with Google
        </button>
      )}
    </div>
  );
}
