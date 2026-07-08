export function formatCurrency(amount: number, currency = "KES"): string {
  return `${currency} ${amount.toLocaleString()}`;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

export function calculateCharge(
  durationMs: number,
  rateAmount: number,
  rateUnit: "hour" | "day"
): number {
  if (rateUnit === "hour") {
    const hours = durationMs / (1000 * 60 * 60);
    return Math.ceil(hours * rateAmount);
  } else {
    const days = durationMs / (1000 * 60 * 60 * 24);
    return Math.ceil(days * rateAmount);
  }
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function generateReference(): string {
  return `VH-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// Simple password hashing (for demo purposes — in production use bcrypt on server)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/** Extracts a user-friendly error message from any error, including wrapped Convex server errors */
export function getErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    const error = err as Record<string, unknown>;
    
    if (error.data !== undefined && error.data !== null) {
      return String(error.data);
    }
    
    const message = String(error.message || "");
    const uncaughtMatch = message.match(/Uncaught Error: (.*?)(\n| at )/);
    if (uncaughtMatch) {
      return uncaughtMatch[1].trim();
    }
    
    const serverMatch = message.match(/Server Error: (.*?)(\n| at )/);
    if (serverMatch) {
      return serverMatch[1].trim();
    }
    
    if (message.startsWith("Error: ")) {
      return message.substring(7);
    }
    
    return message || "An unexpected error occurred";
  }
  return String(err);
}
