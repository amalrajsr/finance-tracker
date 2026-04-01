import { useMutation } from "@tanstack/react-query";

interface ResendResetOtpVariables {
  email: string;
}

export function useResendResetOtp() {
  return useMutation({
    mutationFn: async ({ email }: ResendResetOtpVariables) => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        const error = new Error(data.error || "Failed to resend code") as Error & {
          retryAfter?: number;
        };
        if (data.retryAfter) {
          error.retryAfter = data.retryAfter;
        }
        throw error;
      }

      return data as { message: string };
    },
  });
}
