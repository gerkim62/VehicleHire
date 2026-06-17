import { query } from "./_generated/server";
import { v } from "convex/values";

// Platform-wide stats (admin)
export const getPlatformStats = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const vehicles = await ctx.db.query("vehicles").collect();
    const sessions = await ctx.db.query("sessions").collect();
    const payments = await ctx.db.query("payments").collect();

    const totalClients = users.filter((u) => u.role === "client").length;
    const totalAgents = users.filter((u) => u.role === "agent").length;
    const pendingAgents = users.filter(
      (u) => u.role === "agent" && u.agentStatus === "pending"
    ).length;
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(
      (v) => v.isActive && v.isAvailable
    ).length;
    const activeSessions = sessions.filter(
      (s) => s.status === "in_progress"
    ).length;
    const completedSessions = sessions.filter(
      (s) => s.status === "completed"
    ).length;
    const successfulPayments = payments.filter((p) => p.status === "success");
    const totalRevenue = successfulPayments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    return {
      totalClients,
      totalAgents,
      pendingAgents,
      totalVehicles,
      activeVehicles,
      activeSessions,
      completedSessions,
      totalRevenue,
      totalPayments: successfulPayments.length,
    };
  },
});

// Agent dashboard stats
export const getAgentStats = query({
  args: { agentId: v.id("users") },
  handler: async (ctx, args) => {
    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    const activeSessions = sessions.filter(
      (s) => s.status === "in_progress"
    ).length;
    const completedSessions = sessions.filter(
      (s) => s.status === "completed"
    ).length;
    const successfulPayments = payments.filter((p) => p.status === "success");
    const totalRevenue = successfulPayments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    return {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter((v) => v.isActive).length,
      activeSessions,
      completedSessions,
      totalRevenue,
    };
  },
});

// Client stats
export const getClientStats = query({
  args: { clientId: v.id("users") },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const activeSession = sessions.find((s) => s.status === "in_progress");
    const totalSpent = payments
      .filter((p) => p.status === "success")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalBookings: bookings.length,
      totalSessions: sessions.length,
      activeSession: activeSession || null,
      totalSpent,
    };
  },
});
