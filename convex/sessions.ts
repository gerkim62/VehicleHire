import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Start a session (agent action — transitions booking to active session)
export const start = mutation({
  args: {
    bookingId: v.id("bookings"),
    agentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new ConvexError("Booking not found");
    if (booking.agentId !== args.agentId) throw new ConvexError("Unauthorized");
    if (booking.status !== "pending" && booking.status !== "confirmed") {
      throw new ConvexError("Booking must be pending or confirmed to start session");
    }

    const vehicle = await ctx.db.get(booking.vehicleId);
    if (!vehicle) throw new ConvexError("Vehicle not found");

    // Update booking status
    await ctx.db.patch(args.bookingId, { status: "confirmed" });

    // Create session
    const sessionId = await ctx.db.insert("sessions", {
      bookingId: args.bookingId,
      clientId: booking.clientId,
      vehicleId: booking.vehicleId,
      agentId: args.agentId,
      status: "in_progress",
      startedAt: Date.now(),
      rateAmount: vehicle.rateAmount,
      rateUnit: vehicle.rateUnit,
      currency: vehicle.currency,
    });

    // Notify client
    await ctx.db.insert("notifications", {
      userId: booking.clientId,
      type: "session_started",
      title: "Session Started",
      message: `Your hire session for ${vehicle.make} ${vehicle.model} has started. The timer is now running.`,
      isRead: false,
      relatedId: sessionId,
      createdAt: Date.now(),
    });

    return sessionId;
  },
});

// Complete a session (agent action)
export const complete = mutation({
  args: {
    sessionId: v.id("sessions"),
    agentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new ConvexError("Session not found");
    if (session.agentId !== args.agentId) throw new ConvexError("Unauthorized");
    if (session.status !== "in_progress") {
      throw new ConvexError("Session is not in progress");
    }

    const now = Date.now();
    const durationMs = now - session.startedAt;

    // Calculate charge
    let totalCharge: number;
    if (session.rateUnit === "hour") {
      const hours = durationMs / (1000 * 60 * 60);
      totalCharge = Math.ceil(hours * session.rateAmount);
    } else {
      // day
      const days = durationMs / (1000 * 60 * 60 * 24);
      totalCharge = Math.ceil(days * session.rateAmount);
    }

    // Minimum charge of 1 unit
    if (totalCharge < session.rateAmount) {
      totalCharge = session.rateAmount;
    }

    await ctx.db.patch(args.sessionId, {
      status: "completed",
      completedAt: now,
      durationMs,
      totalCharge,
    });

    // Make vehicle available again
    await ctx.db.patch(session.vehicleId, { isAvailable: true });

    // Notify client
    const vehicle = await ctx.db.get(session.vehicleId);
    await ctx.db.insert("notifications", {
      userId: session.clientId,
      type: "session_completed",
      title: "Session Completed",
      message: `Your hire session for ${vehicle?.make} ${vehicle?.model} is complete. Total charge: KES ${totalCharge.toLocaleString()}.`,
      isRead: false,
      relatedId: args.sessionId,
      createdAt: Date.now(),
    });

    return { totalCharge, durationMs };
  },
});

// Update client location during active session
export const updateLocation = mutation({
  args: {
    sessionId: v.id("sessions"),
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.status !== "in_progress") {
      return; // Silently ignore if session ended
    }

    await ctx.db.insert("locationUpdates", {
      sessionId: args.sessionId,
      latitude: args.latitude,
      longitude: args.longitude,
      accuracy: args.accuracy,
      timestamp: Date.now(),
    });
  },
});

// Get session by ID with enriched data
export const getById = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const vehicle = await ctx.db.get(session.vehicleId);
    const client = await ctx.db.get(session.clientId);
    const agent = await ctx.db.get(session.agentId);
    const booking = await ctx.db.get(session.bookingId);

    // Get latest location
    const latestLocation = await ctx.db
      .query("locationUpdates")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .first();

    return {
      ...session,
      vehicle,
      client,
      agent,
      booking,
      latestLocation,
    };
  },
});

// Get active sessions for agent
export const getActiveByAgent = query({
  args: { agentId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    const activeSessions = sessions.filter((s) => s.status === "in_progress");

    return await Promise.all(
      activeSessions.map(async (session) => {
        const vehicle = await ctx.db.get(session.vehicleId);
        const client = await ctx.db.get(session.clientId);
        const latestLocation = await ctx.db
          .query("locationUpdates")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .order("desc")
          .first();

        return {
          ...session,
          vehicle,
          client,
          latestLocation,
        };
      })
    );
  },
});

// Get all sessions for agent (history)
export const getByAgent = query({
  args: { agentId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .collect();

    return await Promise.all(
      sessions.map(async (session) => {
        const vehicle = await ctx.db.get(session.vehicleId);
        const client = await ctx.db.get(session.clientId);
        return { ...session, vehicle, client };
      })
    );
  },
});

// Get client sessions
export const getByClient = query({
  args: { clientId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();

    return await Promise.all(
      sessions.map(async (session) => {
        const vehicle = await ctx.db.get(session.vehicleId);
        const agent = await ctx.db.get(session.agentId);
        return { ...session, vehicle, agent };
      })
    );
  },
});

// Get active session for client (if any)
export const getActiveByClient = query({
  args: { clientId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const active = sessions.find((s) => s.status === "in_progress");
    if (!active) return null;

    const vehicle = await ctx.db.get(active.vehicleId);
    const agent = await ctx.db.get(active.agentId);

    return { ...active, vehicle, agent };
  },
});

// Get all active sessions (admin)
export const getAllActive = query({
  handler: async (ctx) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "in_progress"))
      .collect();

    return await Promise.all(
      sessions.map(async (session) => {
        const vehicle = await ctx.db.get(session.vehicleId);
        const client = await ctx.db.get(session.clientId);
        const agent = await ctx.db.get(session.agentId);
        const latestLocation = await ctx.db
          .query("locationUpdates")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .order("desc")
          .first();

        return { ...session, vehicle, client, agent, latestLocation };
      })
    );
  },
});

// Get session by booking
export const getByBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .first();
  },
});
