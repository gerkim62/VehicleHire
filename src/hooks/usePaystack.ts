import { useCallback } from "react";

interface PaystackOptions {
  email: string;
  amount: number; // in the smallest currency unit (cents for KES: KES 500 -> 50000)
  currency?: string;
  reference: string;
  publicKey?: string;
  onSuccess: (response: PaystackResponse) => void;
  onClose: () => void;
  metadata?: Record<string, unknown>;
}

interface PaystackResponse {
  reference: string;
  trans: string;
  status: string;
  message: string;
  transaction: string;
  trxref: string;
}

function isPlaceholderKey(key?: string): boolean {
  if (!key) return true;
  const lower = key.trim().toLowerCase();
  return (
    lower.includes("your_key") ||
    lower.includes("xxxxxxxx") ||
    lower === "pk_test_placeholder" ||
    (!lower.startsWith("pk_test_") && !lower.startsWith("pk_live_"))
  );
}

/**
 * Hook wrapping @paystack/inline-js for type-safe popup payment.
 *
 * Usage:
 *   const { pay } = usePaystack();
 *   pay({ email, amount, reference, onSuccess, onClose });
 *
 * NOTE: amount must be in the smallest unit of the currency.
 * For KES, Paystack accepts the amount in cents (1 KES = 100 cents).
 * So KES 500 → amount: 50000
 */
export function usePaystack() {
  const pay = useCallback((options: PaystackOptions) => {
    const publicKey =
      options.publicKey ?? import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

    if (isPlaceholderKey(publicKey)) {
      console.info(
        "[Paystack Dev Mode] Placeholder or missing key detected (" +
          (publicKey || "none") +
          "). Simulating successful payment..."
      );
      // Simulate payment approval after short delay
      setTimeout(() => {
        const simTx = "sim_tx_" + Math.random().toString(36).substring(2, 10);
        options.onSuccess({
          reference: options.reference,
          trans: simTx,
          status: "success",
          message: "Approved (Simulated)",
          transaction: simTx,
          trxref: options.reference,
        });
      }, 750);
      return;
    }

    import("@paystack/inline-js")
      .then((module) => {
        // Handle export patterns across bundlers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const PaystackPopConstructor: any =
          module.default || (module as Record<string, unknown>).PaystackPop || module;

        const handler = new PaystackPopConstructor();

        handler.newTransaction({
          key: publicKey,
          email: options.email,
          amount: Math.round(options.amount), // in cents / kobo
          currency: options.currency ?? "KES",
          ref: options.reference,
          metadata: options.metadata ?? {},
          onSuccess: (response: PaystackResponse) => {
            options.onSuccess(response);
          },
          onCancel: () => {
            options.onClose();
          },
        });
      })
      .catch((error) => {
        console.error("[Paystack] Failed to load Paystack inline SDK:", error);
        options.onClose();
      });
  }, []);

  return { pay };
}

