import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Login — verify email + passwordHash, return userId or throw
export const loginUser = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) throw new Error("Invalid email or password");
    if (!user.passwordHash) throw new Error("Please use Google sign-in for this account");
    if (user.passwordHash !== args.passwordHash)
      throw new Error("Invalid email or password");

    return user._id;
  },
});

// Register a new user
export const register = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("client"), v.literal("agent")),
    passwordHash: v.string(),
    phone: v.optional(v.string()),
    // Agent-specific
    businessName: v.optional(v.string()),
    businessDescription: v.optional(v.string()),
    businessLicense: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      throw new Error("Email already registered");
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      role: args.role,
      passwordHash: args.passwordHash,
      phone: args.phone,
      agentStatus: args.role === "agent" ? "pending" : undefined,
      businessName: args.businessName,
      businessDescription: args.businessDescription,
      businessLicense: args.businessLicense,
      createdAt: Date.now(),
    });

    return userId;
  },
});

// Login by email
export const login = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    return user;
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Google OAuth login/register
export const googleAuth = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    googleId: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("client"), v.literal("agent")),
  },
  handler: async (ctx, args) => {
    // Check if user exists by googleId
    let user = await ctx.db
      .query("users")
      .withIndex("by_googleId", (q) => q.eq("googleId", args.googleId))
      .first();

    if (user) {
      return user._id;
    }

    // Check by email
    user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (user) {
      // Link Google ID to existing account
      await ctx.db.patch(user._id, {
        googleId: args.googleId,
        avatarUrl: args.avatarUrl || user.avatarUrl,
      });
      return user._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      googleId: args.googleId,
      avatarUrl: args.avatarUrl,
      role: args.role,
      agentStatus: args.role === "agent" ? "pending" : undefined,
      createdAt: Date.now(),
    });

    return userId;
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(userId, cleanUpdates);
  },
});

// Get all users (admin)
export const getAllUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Get pending agents (admin)
export const getPendingAgents = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_agentStatus", (q) => q.eq("agentStatus", "pending"))
      .collect();
  },
});

// Approve/reject agent (admin)
export const updateAgentStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "agent") {
      throw new Error("User not found or not an agent");
    }
    await ctx.db.patch(args.userId, { agentStatus: args.status });
  },
});
