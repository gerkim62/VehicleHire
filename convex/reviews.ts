import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Submit a review
export const submit = mutation({
  args: {
    sessionId: v.id("sessions"),
    clientId: v.id("users"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.clientId !== args.clientId) throw new Error("Unauthorized");
    if (session.status !== "completed") {
      throw new Error("Can only review completed sessions");
    }

    // Check if already reviewed
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (existing) throw new Error("Session already reviewed");

    // Create review
    const reviewId = await ctx.db.insert("reviews", {
      sessionId: args.sessionId,
      clientId: args.clientId,
      agentId: session.agentId,
      vehicleId: session.vehicleId,
      rating: args.rating,
      comment: args.comment,
      createdAt: Date.now(),
    });

    // Update vehicle average rating
    const vehicle = await ctx.db.get(session.vehicleId);
    if (vehicle) {
      const newTotalReviews = vehicle.totalReviews + 1;
      const newAverageRating =
        (vehicle.averageRating * vehicle.totalReviews + args.rating) /
        newTotalReviews;

      await ctx.db.patch(session.vehicleId, {
        averageRating: Math.round(newAverageRating * 10) / 10,
        totalReviews: newTotalReviews,
      });
    }

    return reviewId;
  },
});

// Get reviews for a vehicle
export const getByVehicle = query({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_vehicle", (q) => q.eq("vehicleId", args.vehicleId))
      .order("desc")
      .collect();

    return await Promise.all(
      reviews.map(async (review) => {
        const client = await ctx.db.get(review.clientId);
        return {
          ...review,
          clientName: client?.name || "Anonymous",
          clientAvatar: client?.avatarUrl,
        };
      })
    );
  },
});

// Get reviews for an agent
export const getByAgent = query({
  args: { agentId: v.id("users") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .collect();

    return await Promise.all(
      reviews.map(async (review) => {
        const client = await ctx.db.get(review.clientId);
        const vehicle = await ctx.db.get(review.vehicleId);
        return {
          ...review,
          clientName: client?.name || "Anonymous",
          vehicleName: vehicle
            ? `${vehicle.make} ${vehicle.model}`
            : "Unknown",
        };
      })
    );
  },
});

// Check if client can review a session
export const canReview = query({
  args: {
    sessionId: v.id("sessions"),
    clientId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.clientId !== args.clientId) return false;
    if (session.status !== "completed") return false;

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    return !existing;
  },
});
