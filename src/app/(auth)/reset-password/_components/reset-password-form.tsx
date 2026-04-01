"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OtpInput } from "../../_components/otp-input";
import { ResendButton } from "../../_components/resend-button";
import { PasswordInput } from "../../_components/password-input";
import { useResetPassword } from "../_services/use-reset-password";
import { useResendResetOtp } from "../_services/use-resend-reset-otp";
import { useToast } from "@/hooks/use-toast";
import { maskEmail } from "@/lib/format";

interface ResetPasswordFormProps {
  email: string;
}

export function ResetPasswordForm({ email }: ResetPasswordFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const {
    mutateAsync: resetPassword,
    isPending,
    error: mutationError,
  } = useResetPassword();
  const { mutateAsync: resendOtp, isPending: isResending } =
    useResendResetOtp();

  const passwordsMatch = password === confirmPassword;
  const passwordValid = password.length >= 6;
  const canSubmit =
    otp.length === 6 && passwordValid && passwordsMatch && !isPending;

  async function handleReset() {
    if (!canSubmit) return;

    try {
      await resetPassword({ email, otp, password });
      toast("Password reset successfully", "success");
      router.push("/login");
    } catch {
      setOtp("");
    }
  }

  // Auto-submit when OTP is complete and passwords are valid
  useEffect(() => {
    if (otp.length === 6 && passwordValid && passwordsMatch) {
      handleReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary text-center">
        We sent a code to{" "}
        <span className="font-medium text-text-primary">
          {maskEmail(email)}
        </span>
      </p>

      {mutationError && (
        <div className="bg-debit-light text-debit text-sm px-4 py-3 rounded-lg">
          {mutationError instanceof Error
            ? mutationError.message
            : "Something went wrong. Please try again."}
        </div>
      )}

      <div className="flex justify-center">
        <OtpInput value={otp} onChange={setOtp} disabled={isPending} />
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            New password
          </label>
          <PasswordInput
            id="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isPending}
          />
          {password.length > 0 && !passwordValid && (
            <p className="text-xs text-debit mt-1">
              Password must be at least 6 characters
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Confirm password
          </label>
          <PasswordInput
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isPending}
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-debit mt-1">Passwords do not match</p>
          )}
        </div>
      </div>

      <Button
        onClick={handleReset}
        loading={isPending}
        disabled={!canSubmit}
        size="lg"
        className="w-full"
      >
        {isPending ? "Resetting..." : "Reset password"}
      </Button>

      <div className="text-center">
        <ResendButton
          email={email}
          onResend={(e) => resendOtp({ email: e })}
          isPending={isResending}
          successMessage="Reset code sent"
        />
      </div>
    </div>
  );
}
