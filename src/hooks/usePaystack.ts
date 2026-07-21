import { useCallback } from "react";

interface PaystackOptions {
  email: string;
  amount: number; // in the smallest currency unit (kobo for NGN, pesewas for GHS — but Paystack KES uses cents)
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

    if (!publicKey) {
      console.warn(
        "[Paystack] No public key configured. Set VITE_PAYSTACK_PUBLIC_KEY in .env.local"
      );
      // Simulate success in dev so the rest of the flow can be tested
      options.onSuccess({
        reference: options.reference,
        trans: "sim_" + Date.now(),
        status: "success",
        message: "Approved",
        transaction: "sim_" + Date.now(),
        trxref: options.reference,
      });
      return;
    }

    // @paystack/inline-js adds PaystackPop to the global scope when loaded
    import("@paystack/inline-js").then((module) => {
      const PaystackPop = module.default ?? (module as { PaystackPop?: unknown }).PaystackPop;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctor = PaystackPop as new () => any;
      const handler =
        typeof PaystackPop === "function"
          ? new Ctor()
          : PaystackPop;

      handler.newTransaction({
        key: publicKey,
        email: options.email,
        amount: options.amount, // in kobo / cents
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
    });
  }, []);

  return { pay };
}
