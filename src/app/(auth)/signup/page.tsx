"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "../_components/password-input";
import { useSignup } from "./_services/use-signup";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const {
    mutateAsync: signup,
    isPending: isLoading,
    error: mutationError,
  } = useSignup();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return;
    }

    try {
      await signup({ email, password });
      sessionStorage.setItem("__fn_signup_pw", password);
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch {
      // Error is stored in mutationError
    }
  }

  return (
    <>
      <div className="bg-surface rounded-2xl p-6 sm:p-8 lg:p-10 shadow-sm dark:border dark:border-border dark:shadow-none">
        {/* Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary mb-3 lg:hidden">
            <svg
              className="w-5 h-5 text-text-on-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Create your account
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Start tracking your expenses privately
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {(validationError || mutationError) && (
            <div className="bg-debit-light text-debit text-sm px-4 py-3 rounded-lg">
              {validationError ||
                (mutationError instanceof Error
                  ? mutationError.message
                  : "Something went wrong. Please try again.")}
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

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Password
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Min. 6 characters"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Confirm Password
            </label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter your password"
            />
          </div>

          <Button
            type="submit"
            loading={isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-text-secondary mt-5">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Privacy badge */}
      <div className="flex items-center justify-center gap-1.5 mt-5 text-xs text-text-muted">
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        No bank access required — your data stays private
      </div>
    </>
  );
}
