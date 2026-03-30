"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useChangePassword } from "../_services/use-change-password";

export function ChangePasswordSection() {
  const { toast } = useToast();
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (newPassword.length < 6) {
      setValidationError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError("New passwords do not match");
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast("Password updated successfully", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Could not change password",
        "error",
      );
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-text-primary mb-1">Security</h2>
      <p className="text-sm text-text-secondary mb-6">
        Change your account password.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {validationError && (
          <div className="bg-debit-light text-debit text-sm px-4 py-3 rounded-lg">
            {validationError}
          </div>
        )}
        <div>
          <label
            htmlFor="current-password"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Current password
          </label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
            inputSize="lg"
            className="bg-background"
          />
        </div>
        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            New password
          </label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
            inputSize="lg"
            className="bg-background"
          />
        </div>
        <div>
          <label
            htmlFor="confirm-new-password"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Confirm new password
          </label>
          <Input
            id="confirm-new-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            inputSize="lg"
            className="bg-background"
          />
        </div>
        <Button type="submit" loading={changePassword.isPending}>
          Update password
        </Button>
      </form>
    </section>
  );
}
