import { useMutation } from "@tanstack/react-query";

interface ResetPasswordVariables {
  email: string;
  otp: string;
  password: string;
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ email, otp, password }: ResetPasswordVariables) => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Password reset failed");
      }

      return data as { reset: true };
    },
  });
}
