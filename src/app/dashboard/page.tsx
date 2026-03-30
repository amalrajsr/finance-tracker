import Link from "next/link";
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

// ---------------------------------------------------------------------------
// Stats helper
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">
          Your spending overview at a glance
        </p>
      </div>

      {/* Empty state */}
      {!hasData && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
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

      {/* Stats — only shown when user has data */}
      {hasData && (
        <div className="space-y-6">
          {/* Backfill Prompt */}
          {uncategorizedCount > 0 && <BackfillBanner />}

          {/* Top Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Total Transactions"
              value={txnCount.toLocaleString("en-IN")}
            />
            <StatCard
              label="Statements Uploaded"
              value={stmtCount.toLocaleString("en-IN")}
            />
            <StatCard
              label={`${monthName} Debits`}
              value={formatCurrency(monthlyDebit)}
              valueClass="text-debit"
            />
            <StatCard
              label={`${monthName} Credits`}
              value={formatCurrency(monthlyCredit)}
              valueClass="text-credit"
            />
          </div>

          {/* Net change card */}
          <div className="p-4 rounded-xl border border-border bg-surface flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                {monthName} Net Change
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  netChange >= 0 ? "text-credit" : "text-debit"
                }`}
              >
                {netChange >= 0 ? "+" : ""}
                {formatCurrency(netChange)}
              </p>
            </div>
            <Link
              href="/dashboard/transactions"
              className="h-9 px-4 text-sm font-medium text-primary hover:bg-primary-light rounded-lg transition-colors flex items-center"
            >
              View all →
            </Link>
          </div>
          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-border bg-surface shadow-sm">
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                Income/Expense Trend (6 Months)
              </h3>
              <MonthlyTrendChart data={analytics.monthlyTrend} />
            </div>

            <div className="p-5 rounded-xl border border-border bg-surface shadow-sm">
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                Category Breakdown
              </h3>
              <CategoryBreakdownChart data={analytics.categoryBreakdown} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-border bg-surface shadow-sm">
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                Top Spending Destinations
              </h3>
              {analytics.topMerchants.length > 0 ? (
                <ul className="divide-y divide-border">
                  {analytics.topMerchants.map((m: any, i: number) => (
                    <li
                      key={m.merchant}
                      className="py-3 flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-text-muted text-xs">
                          #{i + 1}
                        </span>
                        <span className="font-medium text-text-primary">
                          {m.merchant}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-text-primary">
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

            <div className="p-5 rounded-xl border border-border bg-surface shadow-sm">
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                Daily Spending (Last 30 Days)
              </h3>
              <DailySpendingChart data={analytics.dailyHeatmap} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card sub-component
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  valueClass = "text-text-primary",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-surface">
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wide truncate">
        {label}
      </p>
      <p className={`text-xl font-bold mt-1 truncate ${valueClass}`}>{value}</p>
    </div>
  );
}
