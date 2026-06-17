import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("client"), v.literal("agent"), v.literal("admin")),
    avatarUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    googleId: v.optional(v.string()),
    // Agent-specific fields
    agentStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected")
      )
    ),
    businessName: v.optional(v.string()),
    businessDescription: v.optional(v.string()),
    businessLicense: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_googleId", ["googleId"])
    .index("by_agentStatus", ["agentStatus"]),

  vehicles: defineTable({
    agentId: v.id("users"),
    make: v.string(),
    model: v.string(),
    year: v.number(),
    capacity: v.number(),
    description: v.string(),
    photos: v.array(v.string()), // Convex storage IDs
    rateAmount: v.number(), // e.g., 500
    rateUnit: v.union(v.literal("hour"), v.literal("day")),
    currency: v.string(), // "KES"
    isAvailable: v.boolean(),
    isActive: v.boolean(), // Agent can deactivate
    averageRating: v.number(),
    totalReviews: v.number(),
    createdAt: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_availability", ["isAvailable", "isActive"]),

  bookings: defineTable({
    clientId: v.id("users"),
    vehicleId: v.id("vehicles"),
    agentId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled")
    ),
    pickupDate: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_agent", ["agentId"])
    .index("by_vehicle", ["vehicleId"])
    .index("by_status", ["status"]),

  sessions: defineTable({
    bookingId: v.id("bookings"),
    clientId: v.id("users"),
    vehicleId: v.id("vehicles"),
    agentId: v.id("users"),
    status: v.union(v.literal("in_progress"), v.literal("completed")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    rateAmount: v.number(), // Snapshot of rate at session start
    rateUnit: v.union(v.literal("hour"), v.literal("day")),
    totalCharge: v.optional(v.number()),
    currency: v.string(),
  })
    .index("by_client", ["clientId"])
    .index("by_agent", ["agentId"])
    .index("by_vehicle", ["vehicleId"])
    .index("by_status", ["status"])
    .index("by_booking", ["bookingId"]),

  locationUpdates: defineTable({
    sessionId: v.id("sessions"),
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.number(),
    timestamp: v.number(),
  }).index("by_session", ["sessionId"]),

  payments: defineTable({
    sessionId: v.id("sessions"),
    clientId: v.id("users"),
    agentId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("failed")
    ),
    paystackReference: v.string(),
    paystackTransactionId: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_client", ["clientId"])
    .index("by_agent", ["agentId"])
    .index("by_reference", ["paystackReference"]),

  reviews: defineTable({
    sessionId: v.id("sessions"),
    clientId: v.id("users"),
    agentId: v.id("users"),
    vehicleId: v.id("vehicles"),
    rating: v.number(), // 1–5
    comment: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_vehicle", ["vehicleId"])
    .index("by_agent", ["agentId"])
    .index("by_session", ["sessionId"])
    .index("by_client", ["clientId"]),

  notifications: defineTable({
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
    isRead: v.boolean(),
    relatedId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"]),
});
