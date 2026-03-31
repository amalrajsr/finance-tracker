import { useMutation } from "@tanstack/react-query";
import { signIn } from "next-auth/react";

interface LoginVariables {
  email: string;
  password: string;
}

export function useLogin() {
  return useMutation({
    mutationFn: async ({ email, password }: LoginVariables) => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid email or password");
      }

      return result;
    },
  });
}
