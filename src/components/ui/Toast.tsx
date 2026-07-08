import {
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { ToastContext, type ToastVariant } from "../../context/ToastContext";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-success-500" />,
  error: <XCircle className="w-4 h-4 text-danger-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-warning-500" />,
  info: <Info className="w-4 h-4 text-primary-500" />,
};

const STYLES: Record<ToastVariant, string> = {
  success: "border-success-500/20 bg-success-50",
  error: "border-danger-500/20 bg-danger-50",
  warning: "border-warning-500/20 bg-warning-50",
  info: "border-primary-500/20 bg-primary-50",
};

const TEXT_STYLES: Record<ToastVariant, string> = {
  success: "text-success-600",
  error: "text-danger-600",
  warning: "text-warning-600",
  info: "text-primary-600",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((t) => [...t, { id, message, variant }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  const success = useCallback((m: string) => toast(m, "success"), [toast]);
  const error = useCallback((m: string) => toast(m, "error"), [toast]);
  const warning = useCallback((m: string) => toast(m, "warning"), [toast]);
  const info = useCallback((m: string) => toast(m, "info"), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm animate-slide-in ${STYLES[t.variant]}`}
          >
            <span className="mt-0.5 shrink-0">{ICONS[t.variant]}</span>
            <p className={`text-sm font-medium flex-1 ${TEXT_STYLES[t.variant]}`}>
              {t.message}
            </p>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 text-surface-400 hover:text-surface-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

