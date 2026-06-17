import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new vehicle listing
export const create = mutation({
  args: {
    agentId: v.id("users"),
    make: v.string(),
    model: v.string(),
    year: v.number(),
    capacity: v.number(),
    description: v.string(),
    photos: v.array(v.string()),
    rateAmount: v.number(),
    rateUnit: v.union(v.literal("hour"), v.literal("day")),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.role !== "agent" || agent.agentStatus !== "approved") {
      throw new Error("Only approved agents can list vehicles");
    }

    return await ctx.db.insert("vehicles", {
      ...args,
      currency: "KES",
      isAvailable: true,
      isActive: true,
      averageRating: 0,
      totalReviews: 0,
      createdAt: Date.now(),
    });
  },
});

// Update a vehicle listing
export const update = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    agentId: v.id("users"),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    capacity: v.optional(v.number()),
    description: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
    rateAmount: v.optional(v.number()),
    rateUnit: v.optional(v.union(v.literal("hour"), v.literal("day"))),
    isAvailable: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle || vehicle.agentId !== args.agentId) {
      throw new Error("Vehicle not found or unauthorized");
    }

    const { vehicleId, agentId, ...updates } = args;
    void agentId;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(vehicleId, cleanUpdates);
  },
});

// Get agent's vehicles
export const getByAgent = query({
  args: { agentId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vehicles")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();
  },
});

// Get all available vehicles (for clients)
export const getAvailable = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("vehicles")
      .withIndex("by_availability", (q) =>
        q.eq("isAvailable", true).eq("isActive", true)
      )
      .collect();
  },
});

// Get single vehicle by ID
export const getById = query({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.vehicleId);
  },
});

// Get all vehicles (admin)
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("vehicles").collect();
  },
});

// Generate upload URL for vehicle photos
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get storage URL from storage ID
export const getStorageUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId as never);
  },
});
