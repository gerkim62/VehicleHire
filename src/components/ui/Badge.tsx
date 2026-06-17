import { cn } from "../../lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
  dot = false,
}: BadgeProps) {
  const variants = {
    default: "bg-surface-100 text-surface-700",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
    danger: "bg-danger-50 text-danger-600",
    info: "bg-primary-50 text-primary-600",
    outline: "border border-surface-200 text-surface-600",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full",
        variants[variant],
        sizes[size]
      )}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full", {
            "bg-surface-400": variant === "default",
            "bg-success-500": variant === "success",
            "bg-warning-500": variant === "warning",
            "bg-danger-500": variant === "danger",
            "bg-primary-500": variant === "info",
          })}
        />
      )}
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-6 h-6 border-2 border-surface-200 border-t-primary-600 rounded-full",
        className
      )}
      style={{ animation: "spin 0.6s linear infinite" }}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-surface-200 rounded-lg animate-pulse", className)}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-surface-100 text-surface-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-surface-900 mb-1">{title}</h3>
      <p className="text-sm text-surface-500 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

export function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn(
            sizeClass,
            star <= rating ? "text-warning-500" : "text-surface-200"
          )}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}
