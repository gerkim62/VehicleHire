import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Report an incident during an active session
export const report = mutation({
  args: {
    sessionId: v.id("sessions"),
    clientId: v.id("users"),
    title: v.string(),
    description: v.string(),
    severity: v.union(
      v.literal("minor"),
      v.literal("moderate"),
      v.literal("major")
    ),
    photos: v.array(v.string()),
    location: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new ConvexError("Session not found");
    if (session.clientId !== args.clientId) {
      throw new ConvexError("Unauthorized");
    }

    const incidentId = await ctx.db.insert("incidents", {
      sessionId: args.sessionId,
      clientId: args.clientId,
      agentId: session.agentId,
      vehicleId: session.vehicleId,
      title: args.title,
      description: args.description,
      severity: args.severity,
      photos: args.photos,
      location: args.location,
      status: "reported",
      createdAt: Date.now(),
    });

    // Notify agent
    const vehicle = await ctx.db.get(session.vehicleId);
    await ctx.db.insert("notifications", {
      userId: session.agentId,
      type: "incident_reported",
      title: "Incident Reported",
      message: `A ${args.severity} incident has been reported for your ${vehicle?.make} ${vehicle?.model}.`,
      isRead: false,
      relatedId: incidentId,
      createdAt: Date.now(),
    });

    return incidentId;
  },
});

// Update incident status (agent action)
export const updateStatus = mutation({
  args: {
    incidentId: v.id("incidents"),
    agentId: v.id("users"),
    status: v.union(
      v.literal("reported"),
      v.literal("reviewing"),
      v.literal("resolved")
    ),
    resolutionNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.incidentId);
    if (!incident) throw new ConvexError("Incident not found");
    if (incident.agentId !== args.agentId) {
      throw new ConvexError("Unauthorized");
    }

    const updates: {
      status: "reported" | "reviewing" | "resolved";
      resolutionNotes?: string;
      resolvedAt?: number;
    } = {
      status: args.status,
    };

    if (args.resolutionNotes) {
      updates.resolutionNotes = args.resolutionNotes;
    }

    if (args.status === "resolved") {
      updates.resolvedAt = Date.now();
    }

    await ctx.db.patch(args.incidentId, updates);

    // Notify client of status change
    await ctx.db.insert("notifications", {
      userId: incident.clientId,
      type: "incident_reported",
      title: "Incident Update",
      message: `Your incident report status has been updated to: ${args.status}`,
      isRead: false,
      relatedId: args.incidentId,
      createdAt: Date.now(),
    });
  },
});

// Get incidents for a session
export const getBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    return await Promise.all(
      incidents.map(async (incident) => {
        const photos = await Promise.all(
          incident.photos.map(async (id) => {
            try {
              const url = await ctx.storage.getUrl(id as never);
              return url ?? id;
            } catch {
              return id;
            }
          })
        );
        return { ...incident, photos };
      })
    );
  },
});

// Get incidents for a client
export const getByClient = query({
  args: { clientId: v.id("users") },
  handler: async (ctx, args) => {
    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();

    return await Promise.all(
      incidents.map(async (incident) => {
        const vehicle = await ctx.db.get(incident.vehicleId);
        const session = await ctx.db.get(incident.sessionId);
        return { ...incident, vehicle, session };
      })
    );
  },
});

// Get incidents for an agent
export const getByAgent = query({
  args: { agentId: v.id("users") },
  handler: async (ctx, args) => {
    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .collect();

    return await Promise.all(
      incidents.map(async (incident) => {
        const vehicle = await ctx.db.get(incident.vehicleId);
        const client = await ctx.db.get(incident.clientId);
        const session = await ctx.db.get(incident.sessionId);
        return { ...incident, vehicle, client, session };
      })
    );
  },
});

// Get all incidents (admin)
export const getAll = query({
  handler: async (ctx) => {
    const incidents = await ctx.db
      .query("incidents")
      .order("desc")
      .collect();

    return await Promise.all(
      incidents.map(async (incident) => {
        const vehicle = await ctx.db.get(incident.vehicleId);
        const client = await ctx.db.get(incident.clientId);
        const agent = await ctx.db.get(incident.agentId);
        return { ...incident, vehicle, client, agent };
      })
    );
  },
});

// Get incident by ID
export const getById = query({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.incidentId);
    if (!incident) return null;

    const vehicle = await ctx.db.get(incident.vehicleId);
    const client = await ctx.db.get(incident.clientId);
    const agent = await ctx.db.get(incident.agentId);
    const session = await ctx.db.get(incident.sessionId);

    const photos = await Promise.all(
      incident.photos.map(async (id) => {
        try {
          const url = await ctx.storage.getUrl(id as never);
          return url ?? id;
        } catch {
          return id;
        }
      })
    );

    return {
      ...incident,
      photos,
      vehicle,
      client,
      agent,
      session,
    };
  },
});

// Generate upload URL for incident photos
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
