import Link from "next/link";

export function DashboardQuickActions() {
  return (
    <div className="p-4 rounded-xl bg-surface shadow-sm dark:border dark:border-border dark:shadow-none space-y-3">
      <h3 className="text-sm font-semibold text-text-primary">Quick actions</h3>
      <ul className="space-y-2">
        <li>
          <Link
            href="/dashboard/upload"
            className="flex items-center gap-3 rounded-lg border border-border bg-background dark:bg-surface-sunken px-3 py-2.5 text-sm font-medium text-text-primary hover:border-primary/40 hover:bg-primary-light/50 dark:hover:bg-primary-light/10 transition-colors"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </span>
            <span className="min-w-0">Upload statement</span>
          </Link>
        </li>
        <li>
          <Link
            href="/dashboard/transactions"
            className="flex items-center gap-3 rounded-lg border border-border bg-background dark:bg-surface-sunken px-3 py-2.5 text-sm font-medium text-text-primary hover:border-primary/40 hover:bg-primary-light/50 dark:hover:bg-primary-light/10 transition-colors"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 6.75h12M8.25 12h12m-12 5.25h12"
                />
              </svg>
            </span>
            <span className="min-w-0">Browse transactions</span>
          </Link>
        </li>
        <li>
          <Link
            href="/dashboard/calendar"
            className="flex items-center gap-3 rounded-lg border border-border bg-background dark:bg-surface-sunken px-3 py-2.5 text-sm font-medium text-text-primary hover:border-primary/40 hover:bg-primary-light/50 dark:hover:bg-primary-light/10 transition-colors"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
            </span>
            <span className="min-w-0">Calendar view</span>
          </Link>
        </li>
        <li>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 rounded-lg border border-border bg-background dark:bg-surface-sunken px-3 py-2.5 text-sm font-medium text-text-primary hover:border-primary/40 hover:bg-primary-light/50 dark:hover:bg-primary-light/10 transition-colors"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </span>
            <span className="min-w-0">Settings</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
