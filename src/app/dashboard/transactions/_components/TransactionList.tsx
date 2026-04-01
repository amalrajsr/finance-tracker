"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTransactions } from "../_hooks/use-transactions";
import { TableRow } from "./TableRow";
import { MobileCard } from "./MobileCard";
import { NoFilterResults } from "./NoFilterResults";
import type { CategoryOption } from "./CategorySelect";
import type { SerializedTransaction } from "../types";

interface TransactionListProps {
  categories: CategoryOption[];
}

export function TransactionList({ categories }: TransactionListProps) {
  const searchParams = useSearchParams();
  const hasFilters = !!(
    searchParams.get("search") ||
    searchParams.get("type") ||
    searchParams.get("from") ||
    searchParams.get("to") ||
    searchParams.get("category")
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useTransactions();

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    const root = containerRef.current;
    if (!el || !root) return;

    const observer = new IntersectionObserver(handleIntersect, {
      root,
      rootMargin: "200px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  const transactions: SerializedTransaction[] = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) =>
      page.transactions.map((t) => ({ ...t, categories })),
    );
  }, [data, categories]);

  if (isLoading) {
    return (
      <div className="flex-1 min-h-0 rounded-xl border border-border bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-text-secondary">
            Loading transactions…
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 min-h-0 rounded-xl border border-border bg-surface flex items-center justify-center">
        <p className="text-sm text-debit">
          Failed to load transactions. Please try again.
        </p>
      </div>
    );
  }

  if (transactions.length === 0) {
    if (hasFilters) return <NoFilterResults />;
    return null;
  }

  const total = data?.pages[0]?.total ?? 0;

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 rounded-xl border border-border overflow-y-auto bg-surface"
    >
      {/* Desktop: table */}
      <div className="hidden sm:block">
        <table className="w-full text-left">
          <thead className="bg-background sticky top-0 z-1">
            <tr>
              <th
                scope="col"
                className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wide"
              >
                Description
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wide"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wide text-right"
              >
                Debit
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wide text-right"
              >
                Credit
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wide text-right"
              >
                Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <TableRow key={txn.id} txn={txn} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list */}
      <ul role="list" className="sm:hidden divide-y divide-border">
        {transactions.map((txn) => (
          <MobileCard key={txn.id} txn={txn} />
        ))}
      </ul>

      {/* Sentinel + loading indicator */}
      <div ref={sentinelRef} className="px-4 py-3 border-t border-border">
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs text-text-secondary">Loading more…</span>
          </div>
        ) : hasNextPage ? (
          <p className="text-xs text-text-muted text-center">Scroll for more</p>
        ) : (
          <p className="text-xs text-text-muted text-center">
            Showing all {total.toLocaleString("en-IN")} transactions
          </p>
        )}
      </div>
    </div>
  );
}
