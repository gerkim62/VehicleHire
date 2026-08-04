import type { Id } from "../../convex/_generated/dataModel";

export type UserRole = "client" | "agent" | "admin";
export type AgentStatus = "pending" | "approved" | "rejected";
export type BookingStatus = "pending" | "confirmed" | "cancelled";
export type SessionStatus = "in_progress" | "completed";
export type PaymentStatus = "pending" | "success" | "failed";
export type RateUnit = "hour" | "day";
export type IncidentSeverity = "minor" | "moderate" | "major";
export type IncidentStatus = "reported" | "reviewing" | "resolved";

export interface User {
  _id: Id<"users">;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  agentStatus?: AgentStatus;
  businessName?: string;
  businessDescription?: string;
  businessLicense?: string;
  createdAt: number;
}

export interface Vehicle {
  _id: Id<"vehicles">;
  agentId: Id<"users">;
  make: string;
  model: string;
  year: number;
  capacity: number;
  description: string;
  photos: string[];
  rateAmount: number;
  rateUnit: RateUnit;
  currency: string;
  isAvailable: boolean;
  isActive: boolean;
  averageRating: number;
  totalReviews: number;
  createdAt: number;
}

export interface Booking {
  _id: Id<"bookings">;
  clientId: Id<"users">;
  vehicleId: Id<"vehicles">;
  agentId: Id<"users">;
  status: BookingStatus;
  pickupDate: number;
  notes?: string;
  createdAt: number;
}

export interface Session {
  _id: Id<"sessions">;
  bookingId: Id<"bookings">;
  clientId: Id<"users">;
  vehicleId: Id<"vehicles">;
  agentId: Id<"users">;
  status: SessionStatus;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  rateAmount: number;
  rateUnit: RateUnit;
  totalCharge?: number;
  currency: string;
}

export interface LocationUpdate {
  _id: Id<"locationUpdates">;
  sessionId: Id<"sessions">;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface Payment {
  _id: Id<"payments">;
  sessionId: Id<"sessions">;
  clientId: Id<"users">;
  agentId: Id<"users">;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paystackReference: string;
  paystackTransactionId?: string;
  paidAt?: number;
  createdAt: number;
}

export interface Review {
  _id: Id<"reviews">;
  sessionId: Id<"sessions">;
  clientId: Id<"users">;
  agentId: Id<"users">;
  vehicleId: Id<"vehicles">;
  rating: number;
  comment?: string;
  createdAt: number;
}

export interface Notification {
  _id: Id<"notifications">;
  userId: Id<"users">;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: number;
}

export interface Incident {
  _id: Id<"incidents">;
  sessionId: Id<"sessions">;
  clientId: Id<"users">;
  agentId: Id<"users">;
  vehicleId: Id<"vehicles">;
  title: string;
  description: string;
  severity: IncidentSeverity;
  photos: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  status: IncidentStatus;
  resolutionNotes?: string;
  resolvedAt?: number;
  createdAt: number;
}
