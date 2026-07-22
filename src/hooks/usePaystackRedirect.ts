import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { generateReference } from "../lib/utils";

interface InitiatePaymentOptions {
  sessionId: Id<"sessions">;
  clientId: Id<"users">;
  agentId: Id<"users">;
  email: string;
  /** Amount in KES (whole units — will be converted to cents for Paystack) */
  amount: number;
  currency?: string;
}

/**
 * Hook that initiates a Paystack Standard payment by:
 * 1. Calling our Convex HTTP endpoint (which securely calls Paystack with the secret key)
 * 2. Getting back an `authorization_url`
 * 3. Redirecting the browser to that URL
 *
 * After payment, Paystack redirects back to /pay-callback?reference=...
 * which verifies the payment server-side and marks it as confirmed.
 */
export function usePaystackRedirect() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createPayment = useMutation(api.payments.create);

  const initiatePayment = useCallback(async (options: InitiatePaymentOptions) => {
    setLoading(true);
    setError(null);

    const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL as string | undefined;
    const reference = generateReference();

    // Build callback URL pointing back to /pay-callback with sessionId
    const callbackUrl = `${window.location.origin}/pay-callback?sessionId=${encodeURIComponent(options.sessionId)}`;

    try {
      let authorizationUrl: string;

      if (!convexSiteUrl) {
        // Dev fallback: no Convex HTTP site URL — simulate by creating pending record and redirecting
        console.info("[PaystackRedirect] No VITE_CONVEX_SITE_URL — running in simulation mode");
        await createPayment({
          sessionId: options.sessionId,
          clientId: options.clientId,
          agentId: options.agentId,
          amount: options.amount,
          currency: options.currency ?? "KES",
          paystackReference: reference,
        });
        authorizationUrl = `${callbackUrl}&reference=${encodeURIComponent(reference)}&trxref=${encodeURIComponent(reference)}&simulated=true`;
        window.location.href = authorizationUrl;
        return;
      }

      // Call our server-side initialize endpoint
      const res = await fetch(`${convexSiteUrl}/paystack/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: options.sessionId,
          clientId: options.clientId,
          agentId: options.agentId,
          email: options.email,
          amount: Math.round(options.amount * 100), // convert KES → cents for Paystack
          currency: options.currency ?? "KES",
          reference,
          callbackUrl,
        }),
      });

      if (!res.ok) {
        const errData = await res.json() as { error?: string };
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const data = await res.json() as { authorization_url: string; reference?: string };
      authorizationUrl = data.authorization_url;

      if (!authorizationUrl) {
        throw new Error("No authorization URL returned from server");
      }

      // Redirect to Paystack payment page
      window.location.href = authorizationUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment initiation failed";
      setError(message);
      setLoading(false);
    }
  }, [createPayment]);

  return { initiatePayment, loading, error };
}
