import { useMutation } from "@tanstack/react-query";
import { signIn } from "next-auth/react";

interface SignupVariables {
  email: string;
  password: string;
}

export function useSignup() {
  return useMutation({
    mutationFn: async ({ email, password }: SignupVariables) => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      // Auto sign-in after successful signup
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Account created but sign-in failed — please login manually.");
      }

      return result;
    },
  });
}
