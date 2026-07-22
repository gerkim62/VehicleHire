import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage, parseJwt } from "../../lib/utils";

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
  /** If true, shows a button link for full Google login page redirect */
  showRedirectOption?: boolean;
}

/**
 * Initiates standard Google OAuth 2.0 full-page redirect flow.
 * Redirects the user's browser directly to accounts.google.com and returns
 * to /oauth-success with an ID token.
 */
export function initiateGoogleOAuthRedirect(role: "client" | "agent" = "client") {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to .env.local"
    );
  }

  const redirectUri = `${window.location.origin}/oauth-success`;
  const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);

  const targetUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  targetUrl.searchParams.set("client_id", clientId);
  targetUrl.searchParams.set("redirect_uri", redirectUri);
  targetUrl.searchParams.set("response_type", "id_token");
  targetUrl.searchParams.set("scope", "openid email profile");
  targetUrl.searchParams.set("nonce", nonce);
  targetUrl.searchParams.set("state", role);
  targetUrl.searchParams.set("prompt", "select_account");

  window.location.href = targetUrl.toString();
}

/**
 * Google Sign-In button component.
 *
 * Supports both Google Identity Services (OneTap / embedded renderButton) and
 * direct standard OAuth redirect to accounts.google.com.
 */
export function GoogleSignInButton({
  role,
  onSuccess,
  onError,
  showRedirectOption = true,
}: Props) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(() => !!window.google?.accounts?.id);
  const [renderFailed, setRenderFailed] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  
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

  // Check for GSI script readiness
  useEffect(() => {
    if (gsiReady) return;

    const checkInterval = setInterval(() => {
      if (window.google?.accounts?.id) {
        setGsiReady(true);
        clearInterval(checkInterval);
      }
    }, 100);

    const timeout = setTimeout(() => clearInterval(checkInterval), 10_000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [gsiReady]);

  // Render native GSI button when script is ready
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

      if (buttonContainerRef.current) {
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
      setRenderFailed(true);
    }
  }, [gsiReady, clientId, handleCredentialResponse]);

  const handleRedirectClick = () => {
    try {
      initiateGoogleOAuthRedirect(role);
    } catch (err) {
      onError?.(getErrorMessage(err));
    }
  };

  const showNativeButton = gsiReady && clientId && !renderFailed;

  return (
    <div className="google-signin-wrapper space-y-2">
      {/* Native Google-rendered button */}
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

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-surface-200 bg-white text-sm font-medium text-surface-700">
          <span className="w-5 h-5 border-2 border-surface-300 border-t-primary-600 rounded-full animate-spin" />
          Signing in…
        </div>
      )}

      {/* Fallback button if GSI is not loaded or failed */}
      {!showNativeButton && !loading && (
        <button
          type="button"
          onClick={handleRedirectClick}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50 transition-all text-sm font-medium text-surface-700 cursor-pointer"
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

      {/* Alternative full page redirect option */}
      {showRedirectOption && !loading && (
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={handleRedirectClick}
            className="text-xs text-surface-500 hover:text-primary-600 underline cursor-pointer transition-colors"
          >
            Or sign in via Google login page (Redirect)
          </button>
        </div>
      )}
    </div>
  );
}
