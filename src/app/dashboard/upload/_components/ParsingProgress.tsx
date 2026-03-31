"use client";

import type { ParsingProgress as ProgressType } from "@/lib/pdf/types";

interface ParsingProgressProps {
  progress: ProgressType;
}

const stageLabels: Record<string, { label: string; icon: string }> = {
  reading: { label: "Reading file", icon: "📄" },
  decrypting: { label: "Decrypting PDF", icon: "🔓" },
  extracting: { label: "Extracting text", icon: "📝" },
  parsing: { label: "Parsing transactions", icon: "🔍" },
  done: { label: "Complete", icon: "✅" },
  error: { label: "Error", icon: "❌" },
};

export function ParsingProgress({ progress }: ParsingProgressProps) {
  const stageInfo = stageLabels[progress.stage] || {
    label: progress.stage,
    icon: "⏳",
  };

  return (
    <div className="rounded-xl bg-surface p-6 shadow-sm dark:border dark:border-border dark:shadow-none">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">
            {stageInfo.icon} {stageInfo.label}
          </span>
          <span className="text-xs font-mono text-text-muted">
            {progress.percent}%
          </span>
        </div>
        <div className="h-2 bg-background rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {/* Status message */}
      <p className="text-xs text-text-muted">{progress.message}</p>

      {/* Privacy badge */}
      {progress.stage !== "error" && (
        <div className="mt-4 flex items-center gap-1.5 text-xs text-text-muted">
          <svg
            className="w-3.5 h-3.5 shrink-0 text-credit"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
          Processing entirely in your browser — nothing leaves your device
        </div>
      )}
    </div>
  );
}
