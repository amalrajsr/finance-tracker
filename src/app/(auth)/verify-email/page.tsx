"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { maskEmail } from "@/lib/format";
import { VerifyEmailForm } from "./_components/verify-email-form";

const SIGNUP_PASSWORD_KEY = "__fn_signup_pw";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const password = useMemo(() => {
    if (typeof window === "undefined") return null;
    const stored = sessionStorage.getItem(SIGNUP_PASSWORD_KEY);
    if (stored) sessionStorage.removeItem(SIGNUP_PASSWORD_KEY);
    return stored;
  }, []);

  useEffect(() => {
    if (!email) {
      router.replace("/signup");
    }
  }, [email, router]);

  if (!email) return null;

  return (
    <>
      <div className="bg-surface rounded-2xl p-6 sm:p-8 lg:p-10 shadow-sm dark:border dark:border-border dark:shadow-none">
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Verify your email
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-text-primary">
              {maskEmail(email)}
            </span>
          </p>
        </div>

        <VerifyEmailForm email={email} password={password} />

        <p className="text-center text-sm text-text-secondary mt-5">
          Wrong email?{" "}
          <Link
            href="/signup"
            className="text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Sign up again
          </Link>
        </p>
      </div>

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
        Your data stays yours — privacy first
      </div>
    </>
  );
}
