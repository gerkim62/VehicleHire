import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-surface-100 shadow-sm",
        hover && "hover:shadow-md hover:border-surface-200 transition-all duration-200 cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-4 border-b border-surface-100", className)}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  color?: "primary" | "success" | "warning" | "danger" | "accent";
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  color = "primary",
}: StatCardProps) {
  const colorMap = {
    primary: "from-primary-500 to-primary-600 shadow-primary-500/25",
    success: "from-success-500 to-success-600 shadow-success-500/25",
    warning: "from-warning-500 to-warning-600 shadow-warning-500/25",
    danger: "from-danger-500 to-danger-600 shadow-danger-500/25",
    accent: "from-accent-500 to-accent-600 shadow-accent-500/25",
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-4">
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br text-white shadow-lg",
            colorMap[color]
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-surface-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-surface-900">{value}</p>
          {trend && (
            <p className="text-xs text-success-600 font-medium">{trend}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
