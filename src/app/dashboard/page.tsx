import Link from "next/link";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAnalyticsSummary } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";
import { BackfillBanner } from "./_components/BackfillBanner";
import {
  MonthlyTrendChart,
  CategoryBreakdownChart,
  DailySpendingChart,
} from "./_components/Charts";
import { DashboardQuickActions } from "./_components/DashboardQuickActions";

async function getDashboardStats(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  const [txnCount, stmtCount, monthlyGrouped] = await Promise.all([
    db.transaction.count({ where: { userId } }),
    db.statement.count({ where: { userId } }),
    db.transaction.groupBy({
      by: ["type"],
      where: {
        userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    }),
  ]);

  const debitRow = monthlyGrouped.find((r) => r.type === "debit");
  const creditRow = monthlyGrouped.find((r) => r.type === "credit");
  const monthlyDebit = debitRow?._sum.amount?.toString() ?? "0";
  const monthlyCredit = creditRow?._sum.amount?.toString() ?? "0";
  const netChange = parseFloat(monthlyCredit) - parseFloat(monthlyDebit);

  return { txnCount, stmtCount, monthlyDebit, monthlyCredit, netChange };
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id as string;

  const [
    { txnCount, stmtCount, monthlyDebit, monthlyCredit, netChange },
    analytics,
    uncategorizedCount,
  ] = await Promise.all([
    getDashboardStats(userId),
    getAnalyticsSummary(userId, 6),
    db.transaction.count({
      where: { userId, categoryId: null, manualCategory: false },
    }),
  ]);

  const hasData = txnCount > 0;
  const now = new Date();
  const monthName = now.toLocaleString("en-IN", { month: "long" });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Dashboard
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Your spending overview at a glance
        </p>
      </div>

      {!hasData && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-1">
            No spending data yet
          </h2>
          <p className="text-sm text-text-secondary text-center max-w-xs mb-6">
            Upload a bank statement to see your expenses, categories, and
            spending trends.
          </p>
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 h-11 px-6 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg text-sm transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            Upload Statement
          </Link>
        </div>
      )}

      {hasData && (
        <div className="space-y-4">
          {uncategorizedCount > 0 && <BackfillBanner />}

          <div className="xl:grid xl:grid-cols-3 xl:gap-4 xl:items-start">
            <div className="space-y-4 xl:col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Total Transactions"
                  value={txnCount.toLocaleString("en-IN")}
                  hint="All time"
                  icon={<IconList />}
                />
                <StatCard
                  label="Statements"
                  value={stmtCount.toLocaleString("en-IN")}
                  hint="Uploaded"
                  icon={<IconDocument />}
                />
                <StatCard
                  label={`${monthName} debits`}
                  value={formatCurrency(monthlyDebit)}
                  valueClass="text-debit"
                  hint="Current month"
                  icon={<IconArrowDown />}
                />
                <StatCard
                  label={`${monthName} credits`}
                  value={formatCurrency(monthlyCredit)}
                  valueClass="text-credit"
                  hint="Current month"
                  icon={<IconArrowUp />}
                />
              </div>

              <div className="p-4 rounded-xl border border-border bg-surface shadow-sm dark:shadow-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    {monthName} net change
                  </p>
                  <p
                    className={`text-2xl font-bold mt-1 tabular-nums ${
                      netChange >= 0 ? "text-credit" : "text-debit"
                    }`}
                  >
                    {netChange >= 0 ? "+" : ""}
                    {formatCurrency(netChange)}
                  </p>
                  <p className="text-xs text-text-muted mt-1">Current month</p>
                </div>
                <Link
                  href="/dashboard/transactions"
                  className="h-9 px-4 text-sm font-medium text-primary hover:bg-primary-light rounded-lg transition-colors flex items-center justify-center sm:justify-end shrink-0"
                >
                  View all →
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-surface shadow-sm dark:shadow-none">
                  <h3 className="text-sm font-semibold text-text-primary mb-3">
                    Income / expense trend (6 months)
                  </h3>
                  <MonthlyTrendChart data={analytics.monthlyTrend} />
                </div>

                <div className="p-4 rounded-xl border border-border bg-surface shadow-sm dark:shadow-none">
                  <h3 className="text-sm font-semibold text-text-primary mb-3">
                    Category breakdown
                  </h3>
                  <CategoryBreakdownChart data={analytics.categoryBreakdown} />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-surface shadow-sm dark:shadow-none">
                <h3 className="text-sm font-semibold text-text-primary mb-3">
                  Daily spending (last 30 days)
                </h3>
                <DailySpendingChart data={analytics.dailyHeatmap} />
              </div>
            </div>

            <aside className="space-y-4 mt-4 xl:mt-0 xl:col-span-1">
              <div className="p-4 rounded-xl border border-border bg-surface shadow-sm dark:shadow-none">
                <h3 className="text-sm font-semibold text-text-primary mb-3">
                  Top spending destinations
                </h3>
                {analytics.topMerchants.length > 0 ? (
                  <ul className="divide-y divide-border">
                    {analytics.topMerchants.map((m: { merchant: string; total: string; count: number }, i: number) => (
                      <li
                        key={m.merchant}
                        className="py-2.5 flex items-center justify-between gap-2 text-sm first:pt-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-text-muted text-xs shrink-0">
                            #{i + 1}
                          </span>
                          <span className="font-medium text-text-primary truncate">
                            {m.merchant}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-semibold text-text-primary tabular-nums">
                            ₹{parseFloat(m.total).toLocaleString("en-IN")}
                          </span>
                          <span className="text-xs text-text-muted block">
                            {m.count} txns
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-text-muted text-center py-6">
                    No merchant data.
                  </p>
                )}
              </div>

              <DashboardQuickActions />
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass = "text-text-primary",
  icon,
  hint,
}: {
  label: string;
  value: string;
  valueClass?: string;
  icon: ReactNode;
  hint?: string;
}) {
  return (
    <div className="p-3 sm:p-4 rounded-xl border border-border bg-surface shadow-sm dark:shadow-none flex gap-3 items-start min-w-0">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider truncate">
          {label}
        </p>
        <p
          className={`text-2xl font-bold mt-0.5 tabular-nums truncate ${valueClass}`}
        >
          {value}
        </p>
        {hint ? (
          <p className="text-xs text-text-muted mt-1">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

function IconList() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function IconArrowDown() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
      />
    </svg>
  );
}

function IconArrowUp() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
      />
    </svg>
  );
}
