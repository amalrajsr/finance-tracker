import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";

const PAGE_SIZE = 50;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SerializedTransaction = {
  id: string;
  date: string;
  description: string;
  reference: string;
  amount: string;
  type: "debit" | "credit";
  balance: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPageUrl(
  base: URLSearchParams,
  page: number,
): string {
  const params = new URLSearchParams(base);
  params.set("page", String(page));
  return `/dashboard/transactions?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Sub-components — server-rendered, no "use client" needed
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
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
            d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-text-primary mb-1">
        No transactions yet
      </h2>
      <p className="text-sm text-text-secondary max-w-xs mb-6">
        Upload a bank statement PDF to extract and save your transactions.
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
  );
}

function NoFilterResults() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-text-secondary text-sm">
        No transactions match your filters.
      </p>
      <Link
        href="/dashboard/transactions"
        className="mt-3 text-sm text-primary hover:underline"
      >
        Clear filters
      </Link>
    </div>
  );
}

// Desktop table row
function TableRow({ txn }: { txn: SerializedTransaction }) {
  const isDebit = txn.type === "debit";
  return (
    <tr className="border-t border-border hover:bg-background transition-colors">
      <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
        {formatDate(txn.date)}
      </td>
      <td className="px-4 py-3 text-sm text-text-primary max-w-xs">
        <span className="line-clamp-2">{txn.description}</span>
        {txn.reference && (
          <span className="block text-xs text-text-muted mt-0.5 font-mono">
            {txn.reference}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
        {isDebit ? (
          <span className="text-debit font-medium">
            {formatCurrency(txn.amount)}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
        {!isDebit ? (
          <span className="text-credit font-medium">
            {formatCurrency(txn.amount)}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-right text-text-secondary whitespace-nowrap">
        {formatCurrency(txn.balance)}
      </td>
    </tr>
  );
}

// Mobile card
function MobileCard({ txn }: { txn: SerializedTransaction }) {
  const isDebit = txn.type === "debit";
  return (
    <li
      role="listitem"
      className="p-4 border-b border-border last:border-0 flex items-start justify-between gap-3"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {txn.description}
        </p>
        {txn.reference && (
          <p className="text-xs text-text-muted font-mono mt-0.5 truncate">
            {txn.reference}
          </p>
        )}
        <p className="text-xs text-text-secondary mt-1">{formatDate(txn.date)}</p>
      </div>
      <div className="text-right shrink-0">
        <p
          className={`text-sm font-semibold ${
            isDebit ? "text-debit" : "text-credit"
          }`}
        >
          {isDebit ? "−" : "+"}{formatCurrency(txn.amount)}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          Bal {formatCurrency(txn.balance)}
        </p>
      </div>
    </li>
  );
}

// Pagination controls
function Pagination({
  page,
  totalPages,
  baseParams,
}: {
  page: number;
  totalPages: number;
  baseParams: URLSearchParams;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between px-4 py-3 border-t border-border"
    >
      <p className="text-xs text-text-muted">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={buildPageUrl(baseParams, page - 1)}
            aria-label="Previous page"
            className="h-8 px-3 text-sm rounded-lg border border-border text-text-secondary hover:bg-background transition-colors flex items-center"
          >
            ← Prev
          </Link>
        ) : (
          <span
            aria-label="Previous page, disabled"
            aria-disabled="true"
            className="h-8 px-3 text-sm rounded-lg border border-border text-text-muted opacity-40 flex items-center cursor-not-allowed"
          >
            ← Prev
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={buildPageUrl(baseParams, page + 1)}
            aria-label="Next page"
            className="h-8 px-3 text-sm rounded-lg border border-border text-text-secondary hover:bg-background transition-colors flex items-center"
          >
            Next →
          </Link>
        ) : (
          <span
            aria-label="Next page, disabled"
            aria-disabled="true"
            className="h-8 px-3 text-sm rounded-lg border border-border text-text-muted opacity-40 flex items-center cursor-not-allowed"
          >
            Next →
          </span>
        )}
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const userId = session!.user!.id as string;

  const params = await searchParams;
  const page = Math.max(1, parseInt(String(params.page ?? "1"), 10) || 1);
  const typeParam = String(params.type ?? "");
  const search = String(params.search ?? "").trim();
  const from = String(params.from ?? "");
  const to = String(params.to ?? "");

  // Build Prisma where clause
  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
    ...(typeParam === "debit" || typeParam === "credit"
      ? { type: typeParam }
      : {}),
    ...(search
      ? { description: { contains: search, mode: "insensitive" } }
      : {}),
  };

  // Check if user has any transactions at all (for empty state)
  const [transactions, total, totalEver] = await Promise.all([
    db.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        date: true,
        description: true,
        reference: true,
        amount: true,
        type: true,
        balance: true,
      },
    }),
    db.transaction.count({ where }),
    db.transaction.count({ where: { userId } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Serialize Decimal fields for safe passing to client sub-components
  const serialized: SerializedTransaction[] = transactions.map((t) => ({
    id: t.id,
    date: t.date.toISOString(),
    description: t.description,
    reference: t.reference,
    amount: t.amount.toString(),
    type: t.type as "debit" | "credit",
    balance: t.balance.toString(),
  }));

  // Build base params object for pagination links (excludes page)
  const baseParams = new URLSearchParams();
  if (search) baseParams.set("search", search);
  if (typeParam === "debit" || typeParam === "credit")
    baseParams.set("type", typeParam);
  if (from) baseParams.set("from", from);
  if (to) baseParams.set("to", to);

  const hasFilters = !!(search || typeParam || from || to);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Transactions</h1>
          <p className="text-sm text-text-secondary mt-1">
            {totalEver === 0
              ? "No transactions yet"
              : `${total.toLocaleString("en-IN")} transaction${total !== 1 ? "s" : ""}${hasFilters ? " matching filters" : ""}`}
          </p>
        </div>
        <Link
          href="/dashboard/upload"
          className="hidden sm:inline-flex items-center gap-2 h-9 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
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
          Upload
        </Link>
      </div>

      {/* Empty state — no data at all */}
      {totalEver === 0 && <EmptyState />}

      {/* Filters + table — only shown when user has data */}
      {totalEver > 0 && (
        <>
          <TransactionFilters />

          {/* No results for current filter */}
          {serialized.length === 0 && hasFilters && <NoFilterResults />}

          {/* Transaction table */}
          {serialized.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden bg-surface">
              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-background">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide"
                      >
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide text-right"
                      >
                        Debit
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide text-right"
                      >
                        Credit
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide text-right"
                      >
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {serialized.map((txn) => (
                      <TableRow key={txn.id} txn={txn} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: card list */}
              <ul role="list" className="sm:hidden divide-y divide-border">
                {serialized.map((txn) => (
                  <MobileCard key={txn.id} txn={txn} />
                ))}
              </ul>

              <Pagination
                page={page}
                totalPages={totalPages}
                baseParams={baseParams}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
