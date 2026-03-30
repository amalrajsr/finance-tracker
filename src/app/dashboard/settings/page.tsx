"use client";

import { ProfileSection } from "./_components/ProfileSection";
import { ChangePasswordSection } from "./_components/ChangePasswordSection";
import { DangerZone } from "./_components/DangerZone";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
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
