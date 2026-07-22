import { ConvexError, v } from "convex/values";
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

    if (!user) throw new ConvexError("Invalid email or password");
    if (!user.passwordHash) throw new ConvexError("Please use Google sign-in for this account");
    if (user.passwordHash !== args.passwordHash)
      throw new ConvexError("Invalid email or password");

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
      throw new ConvexError("Email already registered");
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

    // Notify all admins when a new agent registers (needs review)
    if (args.role === "agent") {
      const admins = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "admin"))
        .collect();
      for (const admin of admins) {
        await ctx.db.insert("notifications", {
          userId: admin._id,
          type: "booking_created", // reusing closest type for new agent alert
          title: "New Agent Registration",
          message: `${args.name} has registered as a hire agent and is awaiting approval.`,
          isRead: false,
          relatedId: userId,
          createdAt: Date.now(),
        });
      }
    }

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

// Get all agents (admin)
export const getAllAgents = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.filter((u) => u.role === "agent");
  },
});

// Approve/reject/change agent status (admin)
export const updateAgentStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(v.literal("approved"), v.literal("rejected"), v.literal("pending")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "agent") {
      throw new ConvexError("User not found or not an agent");
    }
    await ctx.db.patch(args.userId, { agentStatus: args.status });

    // Notify the agent of the decision
    const isApproved = args.status === "approved";
    const isPending = args.status === "pending";
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: isApproved ? "agent_approved" : "agent_rejected",
      title: isApproved
        ? "Application Approved 🎉"
        : isPending
          ? "Status Updated to Pending ⏳"
          : "Application Status Updated",
      message: isApproved
        ? "Your hire agent account has been approved! You can now list vehicles and start receiving bookings."
        : isPending
          ? "Your agent account status has been placed back under review by the administrator."
          : "Your agent registration status has been updated to rejected. Please contact the administrator for details.",
      isRead: false,
      createdAt: Date.now(),
    });
  },
});
