"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import {
  useSettingsProfile,
  useUpdateSettingsProfile,
  type SettingsProfile,
} from "../_services/use-profile";

function ProfileEditor({ profile }: { profile: SettingsProfile }) {
  const router = useRouter();
  const { toast } = useToast();
  const updateProfile = useUpdateSettingsProfile();
  const [name, setName] = useState(profile.name ?? "");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const payload = trimmed === "" ? null : trimmed;
    if (payload && payload.length > 50) {
      toast("Name must be at most 50 characters", "error");
      return;
    }
    try {
      await updateProfile.mutateAsync(payload);
      toast("Profile updated", "success");
      router.refresh();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Could not update profile",
        "error",
      );
    }
  }

  return (
    <section className="rounded-2xl bg-surface p-6 shadow-sm dark:border dark:border-border dark:shadow-none">
      <h2 className="text-lg font-semibold text-text-primary mb-1">Profile</h2>
      <p className="text-sm text-text-secondary mb-6">
        Your display name and account email.
      </p>
      <form onSubmit={handleSave} className="space-y-4 max-w-md">
        <div>
          <label
            htmlFor="settings-email"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Email
          </label>
          <Input
            id="settings-email"
            type="email"
            value={profile.email}
            readOnly
            disabled
            className="bg-background text-text-secondary"
            inputSize="lg"
          />
          <p className="mt-1 text-xs text-text-muted">
            Email cannot be changed.
          </p>
        </div>
        <div>
          <label
            htmlFor="settings-name"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Display name
          </label>
          <Input
            id="settings-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={50}
            inputSize="lg"
            className="bg-background"
          />
        </div>
        <p className="text-xs text-text-muted">
          Member since {formatDate(profile.createdAt)}
        </p>
        <Button type="submit" loading={updateProfile.isPending}>
          Save profile
        </Button>
      </form>
    </section>
  );
}

export function ProfileSection() {
  const { data, isLoading, isError, error } = useSettingsProfile();

  if (isLoading) {
    return (
      <section className="rounded-2xl bg-surface p-6 shadow-sm dark:border dark:border-border dark:shadow-none">
        <h2 className="text-lg font-semibold text-text-primary mb-1">Profile</h2>
        <p className="text-sm text-text-muted">Loading…</p>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="rounded-2xl bg-surface p-6 shadow-sm dark:border dark:border-border dark:shadow-none">
        <h2 className="text-lg font-semibold text-text-primary mb-1">Profile</h2>
        <p className="text-sm text-debit">
          {error instanceof Error ? error.message : "Failed to load profile"}
        </p>
      </section>
    );
  }

  return (
    <ProfileEditor
      key={`${data.name ?? ""}-${data.email}-${data.createdAt}`}
      profile={data}
    />
  );
}
