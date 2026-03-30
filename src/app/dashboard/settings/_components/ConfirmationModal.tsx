"use client";

import {
  useEffect,
  useRef,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type ConfirmationVariant = "default" | "danger";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ConfirmationVariant;
  requireText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "default",
  requireText,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [loading, setLoading] = useState(false);

  const confirmDisabled =
    Boolean(requireText) && confirmInput.trim() !== requireText;

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab" || !modalRef.current) return;
    const focusable =
      modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setConfirmInput("");
      setLoading(false);
      return;
    }

    previousFocus.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      const first = modalRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    });

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
      trapFocus(e);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
      previousFocus.current?.focus();
    };
  }, [isOpen, onCancel, trapFocus]);

  async function handleConfirm() {
    if (confirmDisabled || loading) return;
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const buttonVariant = variant === "danger" ? "danger" : "primary";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-background">
          <h2
            id="confirmation-modal-title"
            className="text-lg font-semibold text-text-primary"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-2.5 -mr-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Close dialog"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-sm text-text-secondary">{description}</div>
          {requireText && (
            <div>
              <label
                htmlFor="confirm-phrase"
                className="block text-sm font-medium text-text-primary mb-1.5"
              >
                Type <span className="font-mono text-text-primary">{requireText}</span>{" "}
                to confirm
              </label>
              <Input
                id="confirm-phrase"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                autoComplete="off"
                placeholder={requireText}
                inputSize="md"
                className="bg-background"
                aria-invalid={confirmDisabled && confirmInput.length > 0}
              />
            </div>
          )}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={buttonVariant}
              loading={loading}
              disabled={confirmDisabled}
              onClick={() => void handleConfirm()}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
