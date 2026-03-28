"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("success");
  const [visible, setVisible] = useState(false);
  const [action, setAction] = useState<ToastAction | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setMessage(""), 200);
  }, []);

  const toast = useCallback(
    (msg: string, t: ToastType = "success", act?: ToastAction) => {
      setMessage(msg);
      setType(t);
      setAction(act ?? null);
      setVisible(true);
      const timer = setTimeout(dismiss, 4000);
      return () => clearTimeout(timer);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {message && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-20 md:bottom-6 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          } ${type === "success" ? "bg-primary text-white" : "bg-error text-white"}`}
        >
          <span>{message}</span>
          {action && (
            <button
              onClick={() => {
                action.onClick();
                dismiss();
              }}
              className="underline underline-offset-2 font-semibold hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap"
            >
              {action.label}
            </button>
          )}
          <button
            onClick={dismiss}
            className="ml-1 p-1 rounded hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Dismiss notification"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
