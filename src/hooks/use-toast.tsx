"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type ToastType = "success" | "error";

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("success");

  const toast = (msg: string, t: ToastType = "success") => {
    setMessage(msg);
    setType(t);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {message && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all animate-in zoom-in-95 ${
          type === "success" ? "bg-primary text-white" : "bg-red-500 text-white"
        }`}>
          {message}
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
