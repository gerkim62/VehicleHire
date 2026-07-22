import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// ---------------------------------------------------------------------------
// Helper: HMAC-SHA512 signature verification using Web Crypto API
// Available natively in the Convex default runtime — no "use node" required.
// fetch(), crypto.subtle, TextEncoder are all available without "use node".
// ---------------------------------------------------------------------------
async function verifyPaystackSignature(
  rawBody: string,
  signature: string,
  secretKey: string
): Promise<boolean> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secretKey),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sigBytes = await crypto.subtle.sign("HMAC", keyMaterial, enc.encode(rawBody));
  const expected = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time-ish compare (must be same length)
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * POST /paystack/initialize
 * Body: { sessionId, clientId, agentId, email, amount, currency, reference, callbackUrl }
 *
 * Calls Paystack /transaction/initialize with the secret key (server-side only),
 * creates a pending payment record in Convex, and returns the authorization_url
 * to redirect the user to.
 */
http.route({
  path: "/paystack/initialize",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const origin = req.headers.get("Origin") || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as Record<string, unknown>).email !== "string" ||
      typeof (body as Record<string, unknown>).amount !== "number" ||
      typeof (body as Record<string, unknown>).reference !== "string"
    ) {
      return new Response(JSON.stringify({ error: "Missing required fields: email, amount, reference" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const {
      sessionId,
      clientId,
      agentId,
      email,
      amount,
      currency = "KES",
      reference,
      callbackUrl,
    } = body as Record<string, unknown>;

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    // Dev mode — no secret key configured: simulate success
    if (!secretKey) {
      if (sessionId && clientId && agentId) {
        try {
          await ctx.runMutation(api.payments.create, {
            sessionId: sessionId as never,
            clientId: clientId as never,
            agentId: agentId as never,
            amount: amount as number,
            currency: currency as string,
            paystackReference: reference as string,
          });
        } catch (e) {
          console.warn("Payment record creation skipped:", e);
        }
      }
      try {
        await ctx.runMutation(api.payments.markSuccess, {
          paystackReference: reference as string,
          paystackTransactionId: "sim_" + Date.now(),
        });
      } catch {
        // ignore
      }
      const callbackTarget = callbackUrl
        ? `${callbackUrl}&reference=${encodeURIComponent(reference as string)}&trxref=${encodeURIComponent(reference as string)}`
        : `/pay-callback?reference=${encodeURIComponent(reference as string)}`;
      return new Response(
        JSON.stringify({ authorization_url: callbackTarget, reference, simulated: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create the pending payment record in Convex BEFORE calling Paystack
    if (sessionId && clientId && agentId) {
      try {
        await ctx.runMutation(api.payments.create, {
          sessionId: sessionId as never,
          clientId: clientId as never,
          agentId: agentId as never,
          amount: amount as number,
          currency: currency as string,
          paystackReference: reference as string,
        });
      } catch (e) {
        console.warn("Payment record already exists:", e);
        const msg = (e as Error)?.message || "";
        if (msg.includes("already been paid")) {
          return new Response(JSON.stringify({ error: msg }), {
            status: 409,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
    }

    // Call Paystack Initialize Transaction API
    let paystackRes: Response;
    try {
      paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount as number), // already in cents/kobo
          currency,
          reference,
          callback_url: callbackUrl,
        }),
      });
    } catch {
      return new Response(JSON.stringify({ error: "Failed to reach Paystack" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const data: unknown = await paystackRes.json();
    if (
      !paystackRes.ok ||
      typeof data !== "object" ||
      data === null ||
      !(data as Record<string, unknown>).status
    ) {
      return new Response(JSON.stringify({ error: "Paystack initialization failed", detail: data }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const paystackData = (data as Record<string, unknown>).data as Record<string, unknown>;
    return new Response(
      JSON.stringify({
        authorization_url: paystackData.authorization_url,
        access_code: paystackData.access_code,
        reference: paystackData.reference,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }),
});

http.route({
  path: "/paystack/initialize",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, req) => {
    const origin = req.headers.get("Origin") || "*";
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

/**
 * GET /paystack/verify?reference=xxx
 * Server-side verification of a completed Paystack transaction.
 * Returns enriched status for the pay-callback page to act on.
 */
http.route({
  path: "/paystack/verify",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const origin = req.headers.get("Origin") || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");
    if (!reference) {
      return new Response(JSON.stringify({ status: "error", error: "Missing reference" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Idempotency: if already paid, return immediately
    const existingPayment = await ctx.runQuery(api.payments.getByReference, { reference });
    if (existingPayment?.status === "success") {
      return new Response(
        JSON.stringify({
          status: "already_paid",
          amount: existingPayment.amount,
          sessionId: String(existingPayment.sessionId),
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      // Dev mode: trust the redirect
      return new Response(
        JSON.stringify({ status: "success", transactionId: "dev_" + Date.now() }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify with Paystack
    let verifyRes: Response;
    try {
      verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${secretKey}` } }
      );
    } catch {
      return new Response(JSON.stringify({ status: "error", error: "Could not reach Paystack" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const verifyData = await verifyRes.json() as Record<string, unknown>;
    const txData = verifyData.data as Record<string, unknown> | undefined;

    if (!verifyData.status || txData?.status !== "success") {
      return new Response(JSON.stringify({ status: "failed" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const payment = existingPayment ?? await ctx.runQuery(api.payments.getByReference, { reference });
    const sessionId = payment ? String(payment.sessionId) : undefined;
    const currency = (txData.currency as string) || "KES";
    const amountPaid = typeof txData.amount === "number" ? Math.round(txData.amount / 100) : undefined;

    return new Response(
      JSON.stringify({
        status: "success",
        amount: amountPaid,
        sessionId,
        transactionId: String(txData.id || txData.reference || ""),
        currency,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }),
});

http.route({
  path: "/paystack/verify",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, req) => {
    const origin = req.headers.get("Origin") || "*";
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

/**
 * POST /paystack/webhook
 *
 * Paystack sends server-to-server event notifications to this endpoint.
 * This is the most reliable way to confirm payments — it fires even if the
 * user closes their browser before being redirected back to /pay-callback.
 *
 * Signature verification uses Web Crypto API (crypto.subtle HMAC-SHA512)
 * which is available natively in the Convex default runtime without "use node".
 *
 * Setup: Paystack Dashboard → Settings → API Keys & Webhooks
 *        Webhook URL: https://<your-convex-site-url>/paystack/webhook
 */
http.route({
  path: "/paystack/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    // Read raw body BEFORE any JSON parsing — required for correct signature check
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // --- 1. Verify HMAC-SHA512 signature ---
    if (secretKey && signature) {
      const valid = await verifyPaystackSignature(rawBody, signature, secretKey);
      if (!valid) {
        console.warn("[Webhook] Signature mismatch — rejecting");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else if (secretKey && !signature) {
      console.warn("[Webhook] Missing x-paystack-signature header");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Dev mode (no secretKey): skip signature check

    // --- 2. Parse event ---
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const eventType = event.event as string | undefined;
    const data = event.data as Record<string, unknown> | undefined;

    console.info(`[Webhook] Received event: ${eventType}`);

    // --- 3. Handle charge.success ---
    if (eventType === "charge.success" && data) {
      const reference = data.reference as string | undefined;
      const transactionId = String(data.id ?? data.reference ?? "");
      const status = data.status as string | undefined;

      if (!reference || status !== "success") {
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Idempotency: check if already marked success
      const existing = await ctx.runQuery(api.payments.getByReference, { reference });

      if (existing?.status === "success") {
        console.info(`[Webhook] ${reference} already paid — skipping`);
        return new Response(JSON.stringify({ received: true, skipped: "already_paid" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!existing) {
        console.warn(`[Webhook] No payment record for reference: ${reference}`);
        return new Response(JSON.stringify({ received: true, skipped: "no_record" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      try {
        await ctx.runMutation(api.payments.markSuccess, {
          paystackReference: reference,
          paystackTransactionId: transactionId,
        });
        console.info(`[Webhook] Payment ${reference} marked success ✓`);
      } catch (err) {
        console.error(`[Webhook] Failed to mark ${reference} as success:`, err);
        // Return 200 anyway — don't let Paystack retry infinitely
      }
    }

    // --- 4. Always respond 200 quickly ---
    // Paystack considers anything other than 200 a failure and will retry.
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
