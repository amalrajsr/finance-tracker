"use client";

import { useEffect } from "react";
import { useCountdown } from "@/hooks/use-countdown";
import { useToast } from "@/hooks/use-toast";

interface ResendButtonProps {
  email: string;
  onResend: (email: string) => Promise<unknown>;
  isPending: boolean;
  successMessage?: string;
}

const COOLDOWN_SECONDS = 45;

export function ResendButton({
  email,
  onResend,
  isPending,
  successMessage = "Code sent",
}: ResendButtonProps) {
  const { secondsLeft, isActive, start } = useCountdown(COOLDOWN_SECONDS);
  const { toast } = useToast();

  // Start cooldown on mount (code was just sent)
  useEffect(() => {
    start();
  }, [start]);

  async function handleResend() {
    try {
      await onResend(email);
      toast(successMessage, "success");
      start();
    } catch (err) {
      const error = err as Error & { retryAfter?: number };
      if (error.retryAfter) {
        start(error.retryAfter);
      }
      toast(error.message, "error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={isActive || isPending}
      className="text-sm font-medium text-primary hover:text-primary-hover transition-colors disabled:text-text-muted disabled:cursor-not-allowed"
    >
      {isPending
        ? "Sending..."
        : isActive
          ? `Resend code in ${secondsLeft}s`
          : "Resend code"}
    </button>
  );
}
