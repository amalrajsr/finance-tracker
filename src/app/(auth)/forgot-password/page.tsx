"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "./_services/use-forgot-password";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const {
    mutateAsync: sendResetEmail,
    isPending,
    error: mutationError,
  } = useForgotPassword();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await sendResetEmail({ email });
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch {
      // Error is stored in mutationError
    }
  }

  return (
    <>
      <div className="bg-surface rounded-2xl p-6 sm:p-8 lg:p-10 shadow-sm dark:border dark:border-border dark:shadow-none">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Forgot password?
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Enter your email and we&apos;ll send you a reset code
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mutationError && (
            <div className="bg-debit-light text-debit text-sm px-4 py-3 rounded-lg">
              {mutationError instanceof Error
                ? mutationError.message
                : "Something went wrong. Please try again."}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <Button
            type="submit"
            loading={isPending}
            size="lg"
            className="w-full"
          >
            {isPending ? "Sending..." : "Send reset code"}
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-5">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}
