import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";

import { TransactionFilters } from "./_components/TransactionFilters";
import { CategorySelect, CategoryOption } from "./_components/CategorySelect";
import { CategoryBadge } from "./_components/CategoryBadge";
import { EmptyState } from "./_components/EmptyState";
import { NoFilterResults } from "./_components/NoFilterResults";
import { TableRow } from "./_components/TableRow";
import { MobileCard } from "./_components/MobileCard";
import { Pagination } from "./_components/Pagination";
import { SerializedTransaction } from "./types";

const PAGE_SIZE = 50;


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
  const categoryParam = String(params.category ?? "");

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
    ...(categoryParam 
      ? categoryParam === "uncategorized"
        ? { categoryId: null }
        : { category: { slug: categoryParam } }
      : {})
  };

  // Check if user has any transactions at all (for empty state)
  const [transactions, total, totalEver, rawCategories] = await Promise.all([
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
        manualCategory: true,
        category: {
          select: {
            slug: true,
            name: true,
            icon: true,
            colour: true,
          }
        }
      },
    }),
    db.transaction.count({ where }),
    db.transaction.count({ where: { userId } }),
    db.category.findMany({ select: { id: true, name: true, slug: true, icon: true, colour: true }, orderBy: { sortOrder: 'asc' } })
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const categoriesOption: CategoryOption[] = rawCategories;

  // Serialize Decimal fields for safe passing to client sub-components
  const serialized: SerializedTransaction[] = transactions.map((t) => ({
    id: t.id,
    date: t.date.toISOString(),
    description: t.description,
    reference: t.reference,
    amount: t.amount.toString(),
    type: t.type as "debit" | "credit",
    balance: t.balance.toString(),
    manualCategory: t.manualCategory,
    categorySlug: t.category?.slug,
    categoryName: t.category?.name,
    categoryIcon: t.category?.icon,
    categoryColour: t.category?.colour,
    categories: categoriesOption, // Used by the subcomponents
  }));

  // Build base params object for pagination links (excludes page)
  const baseParams = new URLSearchParams();
  if (search) baseParams.set("search", search);
  if (typeParam === "debit" || typeParam === "credit")
    baseParams.set("type", typeParam);
  if (from) baseParams.set("from", from);
  if (to) baseParams.set("to", to);
  if (categoryParam) baseParams.set("category", categoryParam);

  const hasFilters = !!(search || typeParam || from || to || categoryParam);

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
          <TransactionFilters categories={rawCategories} />

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
                        className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide"
                      >
                        Category
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
