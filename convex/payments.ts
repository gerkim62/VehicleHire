import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

    if (!payment) throw new Error("Payment not found");

    await ctx.db.patch(payment._id, {
      status: "success",
      paystackTransactionId: args.paystackTransactionId,
      paidAt: Date.now(),
    });

    // Notify agent
    await ctx.db.insert("notifications", {
      userId: payment.agentId,
      type: "payment_received",
      title: "Payment Received",
      message: `Payment of KES ${payment.amount.toLocaleString()} received for hire session.`,
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

    if (!payment) throw new Error("Payment not found");

    await ctx.db.patch(payment._id, { status: "failed" });
  },
});

// Get payment for a session
export const getBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

// Get client payment history
export const getByClient = query({
  args: { clientId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();
  },
});

// Get agent revenue
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

    return {
      totalRevenue,
      totalPayments: successfulPayments.length,
      payments: successfulPayments,
    };
  },
});
