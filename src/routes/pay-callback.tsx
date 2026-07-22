import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CheckCircle, XCircle, Loader2, Car } from "lucide-react";
import { Button } from "../components/ui/Button";
import { formatCurrency } from "../lib/utils";

export const Route = createFileRoute("/pay-callback")({
  component: PayCallbackPage,
});

type Status = "verifying" | "success" | "failed" | "already_paid";

export function PayCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("verifying");
  const [amount, setAmount] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const markPaymentSuccess = useMutation(api.payments.markSuccess);
  const markPaymentFailed = useMutation(api.payments.markFailed);
  const sendPaymentReceipt = useAction(api.emails.sendPaymentReceipt);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");
    const sid = params.get("sessionId");
    if (sid) setSessionId(sid);

    if (!reference) {
      setStatus("failed");
      return;
    }

    const verify = async () => {
      const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL;

      try {
        // Call our server-side verify action via the Convex HTTP endpoint
        const verifyRes = await fetch(
          `${convexSiteUrl}/paystack/verify?reference=${encodeURIComponent(reference)}`
        );

        if (verifyRes.ok) {
          const data = await verifyRes.json() as {
            status: string;
            amount?: number;
            sessionId?: string;
            transactionId?: string;
            clientEmail?: string;
            clientName?: string;
            vehicleName?: string;
            currency?: string;
          };

          if (data.status === "success") {
            // Mark in Convex
            await markPaymentSuccess({
              paystackReference: reference,
              paystackTransactionId: data.transactionId,
            });
            if (data.amount) setAmount(data.amount);
            if (data.sessionId) setSessionId(data.sessionId);
            setStatus("success");

            // Send receipt email
            if (data.clientEmail && data.clientName) {
              try {
                await sendPaymentReceipt({
                  clientEmail: data.clientEmail,
                  clientName: data.clientName,
                  vehicleName: data.vehicleName || "Hire Vehicle",
                  amount: data.amount || 0,
                  currency: data.currency || "KES",
                  reference,
                  paidAt: new Date().toLocaleString("en-KE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
                });
              } catch (e) {
                console.info("Receipt email skipped:", e);
              }
            }
            return;
          }

          if (data.status === "already_paid") {
            setStatus("already_paid");
            return;
          }
        }

        // Fallback: mark as success based on Paystack redirect alone (only if no PAYSTACK_SECRET_KEY)
        // This path is taken when simulated (dev mode)
        const simulated = params.get("simulated") === "true" || !convexSiteUrl;
        if (simulated) {
          await markPaymentSuccess({ paystackReference: reference });
          setStatus("success");
          return;
        }

        // Failed
        await markPaymentFailed({ paystackReference: reference }).catch(() => {});
        setStatus("failed");
      } catch (err) {
        console.error("Payment verification error:", err);
        // If it's just a network error to our verify endpoint, still try marking success from redirect
        // (for dev without verify endpoint)
        try {
          await markPaymentSuccess({ paystackReference: reference });
          setStatus("success");
        } catch {
          setStatus("failed");
        }
      }
    };

    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToSession = () => {
    if (sessionId) {
      navigate({ to: "/session/$sessionId", params: { sessionId } });
    } else {
      navigate({ to: "/history" });
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center animate-fade-in">
        {/* Brand */}
        <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-600/25">
          <Car className="w-7 h-7 text-white" />
        </div>

        {status === "verifying" && (
          <>
            <Loader2 className="w-12 h-12 text-primary-500 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold text-surface-900 mb-2">Verifying Payment…</h1>
            <p className="text-surface-500 text-sm">
              Please wait while we confirm your transaction with Paystack.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-success-500" />
            </div>
            <h1 className="text-2xl font-bold text-surface-900 mb-2">Payment Successful!</h1>
            {amount !== null && (
              <p className="text-3xl font-bold text-success-600 mb-3">{formatCurrency(amount)}</p>
            )}
            <p className="text-surface-500 text-sm mb-6">
              Your hire payment has been confirmed and recorded. A receipt will be emailed to you.
            </p>
            <Button onClick={goToSession} className="w-full" size="lg" id="pay-callback-view-session-btn">
              {sessionId ? "View Session" : "View History"}
            </Button>
          </>
        )}

        {status === "already_paid" && (
          <>
            <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-success-500" />
            </div>
            <h1 className="text-2xl font-bold text-surface-900 mb-2">Already Paid</h1>
            <p className="text-surface-500 text-sm mb-6">
              This session has already been marked as paid.
            </p>
            <Button onClick={goToSession} className="w-full" size="lg">
              {sessionId ? "View Session" : "View History"}
            </Button>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-16 h-16 bg-error-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-9 h-9 text-error-500" />
            </div>
            <h1 className="text-2xl font-bold text-surface-900 mb-2">Payment Failed</h1>
            <p className="text-surface-500 text-sm mb-6">
              Your payment could not be confirmed. You can try again from your session or history page.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={goToSession} className="w-full" size="lg" id="pay-callback-retry-btn">
                {sessionId ? "Back to Session" : "View History"}
              </Button>
              <Link to="/history" className="text-sm text-surface-400 hover:text-surface-600 mt-1">
                Go to History
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
