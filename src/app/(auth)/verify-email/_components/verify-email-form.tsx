"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { OtpInput } from "../../_components/otp-input";
import { ResendButton } from "../../_components/resend-button";
import { useVerifyEmail } from "../_services/use-verify-email";
import { useResendOtp } from "../_services/use-resend-otp";

interface VerifyEmailFormProps {
  email: string;
  password: string | null;
}

export function VerifyEmailForm({ email, password }: VerifyEmailFormProps) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const {
    mutateAsync: verify,
    isPending,
    error: mutationError,
  } = useVerifyEmail();
  const { mutateAsync: resend, isPending: isResending } = useResendOtp();

  async function handleVerify() {
    try {
      await verify({ email, otp });

      if (password) {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          router.push("/login");
          return;
        }

        router.push("/dashboard");
        router.refresh();
      } else {
        // Password not available (page refresh) — redirect to login
        router.push("/login");
      }
    } catch {
      // Error is stored in mutationError
      setOtp("");
    }
  }

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.length === 6) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <div className="space-y-6">
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

      <Button
        onClick={handleVerify}
        loading={isPending}
        disabled={otp.length < 6}
        size="lg"
        className="w-full"
      >
        {isPending ? "Verifying..." : "Verify email"}
      </Button>

      <div className="text-center">
        <ResendButton
          email={email}
          onResend={(e) => resend({ email: e })}
          isPending={isResending}
          successMessage="Verification code sent"
        />
      </div>
    </div>
  );
}
