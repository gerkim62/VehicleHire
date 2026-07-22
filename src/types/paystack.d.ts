declare module "@paystack/inline-js" {
  interface PaystackOptions {
    key: string;
    email: string;
    amount: number;
    currency: string;
    ref: string;
    metadata?: Record<string, unknown>;
    onSuccess: (response: {
      reference: string;
      trans: string;
      status: string;
      message: string;
      transaction: string;
      trxref: string;
    }) => void;
    onCancel?: () => void;
  }

  interface PaystackPopInstance {
    newTransaction: (options: PaystackOptions) => void;
  }

  class PaystackPop implements PaystackPopInstance {
    constructor();
    newTransaction(options: PaystackOptions): void;
  }

  export default PaystackPop;
}
