"use client";

import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <WifiOff className="h-16 w-16 text-text-secondary" strokeWidth={1.5} />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-text-primary">
          You&apos;re offline
        </h1>
        <p className="text-text-secondary max-w-sm">
          FinTrack needs an internet connection to load this page. Check your
          connection and try again.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
      >
        Try again
      </button>
    </div>
  );
}
