"use client";

import { useEffect } from "react";
import { useCountdown } from "@/hooks/use-countdown";
import { useResendOtp } from "../_services/use-resend-otp";
import { useToast } from "@/hooks/use-toast";

interface ResendButtonProps {
  email: string;
}

const COOLDOWN_SECONDS = 45;

export function ResendButton({ email }: ResendButtonProps) {
  const { secondsLeft, isActive, start } = useCountdown(COOLDOWN_SECONDS);
  const { toast } = useToast();
  const { mutateAsync: resend, isPending } = useResendOtp();

  // Start cooldown on mount (OTP was just sent during signup)
  useEffect(() => {
    start();
  }, [start]);

  async function handleResend() {
    try {
      await resend({ email });
      toast("Verification code sent", "success");
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
