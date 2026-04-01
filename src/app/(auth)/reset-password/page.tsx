"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ResetPasswordForm } from "./_components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) {
      router.replace("/forgot-password");
    }
  }, [email, router]);

  if (!email) return null;

  return (
    <>
      <div className="bg-surface rounded-2xl p-6 sm:p-8 lg:p-10 shadow-sm dark:border dark:border-border dark:shadow-none">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Reset your password
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Enter the code and your new password
          </p>
        </div>

        <ResetPasswordForm email={email} />

        <p className="text-center text-sm text-text-secondary mt-5">
          Back to{" "}
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
