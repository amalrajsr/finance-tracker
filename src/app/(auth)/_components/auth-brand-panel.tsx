export function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between bg-primary-light dark:bg-surface-sunken p-10 xl:p-14">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/standard/icon-96x96.png"
          alt="FinTrack logo"
          className="w-9 h-9 rounded-lg"
        />
        <span className="font-heading font-bold text-lg text-text-primary">
          FinTrack
        </span>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col justify-center max-w-md">
        <h2 className="text-3xl xl:text-4xl font-bold tracking-tight text-text-primary leading-tight">
          Your finances,
          <br />
          your privacy.
        </h2>
        <p className="text-text-secondary mt-3 text-base leading-relaxed">
          Track expenses from bank statements without ever sharing your data.
        </p>

        <div className="mt-10 space-y-6">
          {/* Feature 1: Privacy */}
          <div className="flex items-start gap-3.5">
            <div className="shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg
                className="w-4.5 h-4.5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm text-text-primary">
                Privacy First
              </p>
              <p className="text-sm text-text-secondary mt-0.5 leading-relaxed">
                PDFs are parsed in your browser. Your financial data never
                leaves your device.
              </p>
            </div>
          </div>

          {/* Feature 2: Smart Categorization */}
          <div className="flex items-start gap-3.5">
            <div className="shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg
                className="w-4.5 h-4.5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm text-text-primary">
                Smart Categorization
              </p>
              <p className="text-sm text-text-secondary mt-0.5 leading-relaxed">
                Transactions are auto-categorized using intelligent pattern
                matching.
              </p>
            </div>
          </div>

          {/* Feature 3: Visual Insights */}
          <div className="flex items-start gap-3.5">
            <div className="shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg
                className="w-4.5 h-4.5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm text-text-primary">
                Visual Insights
              </p>
              <p className="text-sm text-text-secondary mt-0.5 leading-relaxed">
                See where your money goes with clear charts and analytics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-text-muted">Privacy-first expense tracking</p>
    </div>
  );
}
