import { ConvexError, v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

// Create a payment record
export const create = mutation({
  args: {
    sessionId: v.id("sessions"),
    clientId: v.id("users"),
    agentId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    paystackReference: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if session is already paid
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    const alreadyPaid = existing.find((p) => p.status === "success");
    if (alreadyPaid) {
      throw new ConvexError("This hire session has already been paid for.");
    }

    return await ctx.db.insert("payments", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Mark payment as successful
export const markSuccess = mutation({
  args: {
    paystackReference: v.string(),
    paystackTransactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_reference", (q) =>
        q.eq("paystackReference", args.paystackReference)
      )
      .first();

    if (!payment) throw new ConvexError("Payment not found");

    if (payment.status === "success") {
      return payment; // Already processed
    }

    await ctx.db.patch(payment._id, {
      status: "success",
      paystackTransactionId: args.paystackTransactionId,
      paidAt: Date.now(),
    });

    const session = await ctx.db.get(payment.sessionId);
    const vehicle = session ? await ctx.db.get(session.vehicleId) : null;
    const vehicleName = vehicle
      ? `${vehicle.make} ${vehicle.model}`
      : "vehicle hire";

    // Notify agent
    await ctx.db.insert("notifications", {
      userId: payment.agentId,
      type: "payment_received",
      title: "Payment Received",
      message: `Payment of ${payment.currency} ${payment.amount.toLocaleString()} received for ${vehicleName}.`,
      isRead: false,
      relatedId: payment.sessionId,
      createdAt: Date.now(),
    });

    // Notify client
    await ctx.db.insert("notifications", {
      userId: payment.clientId,
      type: "payment_received",
      title: "Payment Successful",
      message: `Your payment of ${payment.currency} ${payment.amount.toLocaleString()} for ${vehicleName} was successful.`,
      isRead: false,
      relatedId: payment.sessionId,
      createdAt: Date.now(),
    });

    return payment;
  },
});

// Mark payment as failed
export const markFailed = mutation({
  args: {
    paystackReference: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_reference", (q) =>
        q.eq("paystackReference", args.paystackReference)
      )
      .first();

    if (!payment) return;

    // Only update if currently pending
    if (payment.status === "pending") {
      await ctx.db.patch(payment._id, { status: "failed" });
    }
  },
});

// Get payment for a session (prioritizes successful payment over failed/pending attempts)
export const getBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    if (payments.length === 0) return null;

    // Return successful payment if available
    const successPayment = payments.find((p) => p.status === "success");
    if (successPayment) return successPayment;

    // Otherwise return the latest payment attempt
    payments.sort((a, b) => b.createdAt - a.createdAt);
    return payments[0];
  },
});

// Get payment by Paystack reference
export const getByReference = query({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_reference", (q) => q.eq("paystackReference", args.reference))
      .first();
  },
});

// Get client payment history with vehicle details
export const getByClient = query({
  args: { clientId: v.id("users") },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();

    return await Promise.all(
      payments.map(async (payment) => {
        const session = await ctx.db.get(payment.sessionId);
        const vehicle = session ? await ctx.db.get(session.vehicleId) : null;
        const agent = await ctx.db.get(payment.agentId);
        return {
          ...payment,
          session,
          vehicle,
          agent,
        };
      })
    );
  },
});

// Get agent revenue with payment breakdown
export const getAgentRevenue = query({
  args: { agentId: v.id("users") },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    const successfulPayments = payments.filter((p) => p.status === "success");
    const totalRevenue = successfulPayments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    const enrichedPayments = await Promise.all(
      successfulPayments.map(async (p) => {
        const client = await ctx.db.get(p.clientId);
        const session = await ctx.db.get(p.sessionId);
        const vehicle = session ? await ctx.db.get(session.vehicleId) : null;
        return { ...p, client, vehicle };
      })
    );

    return {
      totalRevenue,
      totalPayments: successfulPayments.length,
      payments: enrichedPayments,
    };
  },
});

// Server-side Paystack transaction verification action
export const verifyAndConfirm = action({
  args: {
    paystackReference: v.string(),
  },
  handler: async (ctx, args): Promise<Doc<"payments">> => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (secretKey) {
      try {
        const response = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(args.paystackReference)}`,
          {
            headers: {
              Authorization: `Bearer ${secretKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        const resData = await response.json();
        if (!resData.status || resData.data?.status !== "success") {
          throw new ConvexError("Paystack transaction verification failed.");
        }
        const paymentResult: Doc<"payments"> = await ctx.runMutation(
          api.payments.markSuccess,
          {
            paystackReference: args.paystackReference,
            paystackTransactionId: String(resData.data?.id || resData.data?.reference),
          }
        );
        return paymentResult;
      } catch (err) {
        console.error("Paystack verification error:", err);
        throw err;
      }
    }

    // Fallback if no secret key is set (e.g. test environment)
    const fallbackResult: Doc<"payments"> = await ctx.runMutation(
      api.payments.markSuccess,
      {
        paystackReference: args.paystackReference,
      }
    );
    return fallbackResult;
  },
});


