import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-surface-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-white text-surface-900",
          "placeholder:text-surface-400 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
          "hover:border-surface-300",
          error && "border-danger-500 focus:ring-danger-500/20 focus:border-danger-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-danger-500">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className,
  id,
  ...props
}: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-surface-700"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-white text-surface-900",
          "placeholder:text-surface-400 transition-all duration-200 resize-none",
          "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
          "hover:border-surface-300",
          error && "border-danger-500",
          className
        )}
        rows={4}
        {...props}
      />
      {error && <p className="text-sm text-danger-500">{error}</p>}
    </div>
  );
}

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  error,
  options,
  className,
  id,
  ...props
}: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-surface-700"
        >
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl border border-surface-200 bg-white text-surface-900",
          "transition-all duration-200 cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
          "hover:border-surface-300",
          className
        )}
        {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-danger-500">{error}</p>}
    </div>
  );
}
