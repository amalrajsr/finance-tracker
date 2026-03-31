import { useMutation } from "@tanstack/react-query";

interface SignupVariables {
  email: string;
  password: string;
}

interface SignupResponse {
  requiresVerification: true;
  email: string;
}

export function useSignup() {
  return useMutation({
    mutationFn: async ({ email, password }: SignupVariables): Promise<SignupResponse> => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      return { requiresVerification: true, email };
    },
  });
}
