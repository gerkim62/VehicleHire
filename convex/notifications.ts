import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get unread notifications for a user
export const getUnread = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .order("desc")
      .collect();
  },
});

// Get all notifications for a user
export const getAll = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

// Mark notification as read
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

// Mark all notifications as read for a user
export const markAllRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
  },
});

// Create a notification (internal use)
export const create = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("booking_created"),
      v.literal("booking_confirmed"),
      v.literal("session_started"),
      v.literal("session_completed"),
      v.literal("payment_received"),
      v.literal("agent_approved"),
      v.literal("agent_rejected")
    ),
    title: v.string(),
    message: v.string(),
    relatedId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});
