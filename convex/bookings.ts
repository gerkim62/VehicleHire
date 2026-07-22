import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a booking
export const create = mutation({
  args: {
    clientId: v.id("users"),
    vehicleId: v.id("vehicles"),
    pickupDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle || !vehicle.isAvailable || !vehicle.isActive) {
      throw new ConvexError("Vehicle is not available");
    }

    // Mark vehicle as unavailable
    await ctx.db.patch(args.vehicleId, { isAvailable: false });

    const bookingId = await ctx.db.insert("bookings", {
      clientId: args.clientId,
      vehicleId: args.vehicleId,
      agentId: vehicle.agentId,
      status: "pending",
      pickupDate: args.pickupDate,
      notes: args.notes,
      createdAt: Date.now(),
    });

    // Create notification for agent
    await ctx.db.insert("notifications", {
      userId: vehicle.agentId,
      type: "booking_created",
      title: "New Booking Request",
      message: `A new booking has been placed for your ${vehicle.make} ${vehicle.model}.`,
      isRead: false,
      relatedId: bookingId,
      createdAt: Date.now(),
    });

    return bookingId;
  },
});

// Confirm booking (agent action)
export const confirm = mutation({
  args: {
    bookingId: v.id("bookings"),
    agentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking || booking.agentId !== args.agentId) {
      throw new ConvexError("Booking not found or unauthorized");
    }
    if (booking.status !== "pending") {
      throw new ConvexError("Booking is not in pending status");
    }

    await ctx.db.patch(args.bookingId, { status: "confirmed" });

    // Notify client
    await ctx.db.insert("notifications", {
      userId: booking.clientId,
      type: "booking_confirmed",
      title: "Booking Confirmed",
      message: "Your vehicle booking has been confirmed by the agent.",
      isRead: false,
      relatedId: args.bookingId,
      createdAt: Date.now(),
    });
  },
});

// Cancel booking
export const cancel = mutation({
  args: {
    bookingId: v.id("bookings"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new ConvexError("Booking not found");
    if (
      booking.clientId !== args.userId &&
      booking.agentId !== args.userId
    ) {
      throw new ConvexError("Unauthorized");
    }
    if (booking.status !== "pending") {
      throw new ConvexError("Can only cancel pending bookings");
    }

    await ctx.db.patch(args.bookingId, { status: "cancelled" });

    // Make vehicle available again
    await ctx.db.patch(booking.vehicleId, { isAvailable: true });
  },
});

// Get client bookings
export const getByClient = query({
  args: { clientId: v.id("users") },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();

    // Enrich with vehicle info
    return await Promise.all(
      bookings.map(async (booking) => {
        const vehicle = await ctx.db.get(booking.vehicleId);
        const agent = await ctx.db.get(booking.agentId);
        
        const session = await ctx.db
          .query("sessions")
          .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
          .first();

        return {
          ...booking,
          vehicle,
          agentName: agent?.name || agent?.businessName || "Unknown",
          sessionId: session?._id || null,
        };
      })
    );
  },
});

// Get agent bookings
export const getByAgent = query({
  args: { agentId: v.id("users") },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .collect();

    return await Promise.all(
      bookings.map(async (booking) => {
        const vehicle = await ctx.db.get(booking.vehicleId);
        const client = await ctx.db.get(booking.clientId);
        
        const session = await ctx.db
          .query("sessions")
          .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
          .first();

        return {
          ...booking,
          vehicle,
          clientName: client?.name || "Unknown",
          clientEmail: client?.email,
          sessionId: session?._id || null,
          sessionStatus: session?.status || null,
        };
      })
    );
  },
});

// Get single booking
export const getById = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;

    const vehicle = await ctx.db.get(booking.vehicleId);
    const client = await ctx.db.get(booking.clientId);
    const agent = await ctx.db.get(booking.agentId);

    return {
      ...booking,
      vehicle,
      client,
      agent,
    };
  },
});
