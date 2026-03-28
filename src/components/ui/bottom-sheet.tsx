"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** "half" = max 50vh, "full" = max 85vh */
  size?: "half" | "full";
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  size = "half",
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const maxH = size === "full" ? "max-h-[85vh]" : "max-h-[50vh]";

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl shadow-xl ${maxH} flex flex-col animate-in slide-in-from-bottom duration-300`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        {/* Header */}
        {title && (
          <div className="px-5 pb-3 pt-1 flex items-center justify-between border-b border-border shrink-0">
            <h3 className="text-base font-semibold text-text-primary">{title}</h3>
            <button
              onClick={onClose}
              className="p-2.5 -mr-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-background transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 safe-area-pb">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
