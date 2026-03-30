"use client";

import { ProfileSection } from "./_components/ProfileSection";
import { ChangePasswordSection } from "./_components/ChangePasswordSection";
import { DangerZone } from "./_components/DangerZone";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Settings
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your profile, security, and account.
        </p>
      </div>
      <ProfileSection />
      <ChangePasswordSection />
      <DangerZone />
    </div>
  );
}
