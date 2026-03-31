import { useMutation } from "@tanstack/react-query";

interface VerifyEmailVariables {
  email: string;
  otp: string;
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async ({ email, otp }: VerifyEmailVariables) => {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      return data as { verified: true };
    },
  });
}
