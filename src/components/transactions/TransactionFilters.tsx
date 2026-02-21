"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export function TransactionFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");

  const hasActiveFilters =
    !!searchParams.get("search") ||
    !!searchParams.get("type") ||
    !!searchParams.get("from") ||
    !!searchParams.get("to");

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (type) params.set("type", type);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    // Reset to page 1 when filters change
    router.push(`/dashboard/transactions?${params.toString()}`);
  }, [router, search, type, from, to]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setType("");
    setFrom("");
    setTo("");
    router.push("/dashboard/transactions");
  }, [router]);

  return (
    <div className="p-4 rounded-xl bg-surface border border-border space-y-4">
      {/* Row 1: Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label
            htmlFor="txn-search"
            className="block text-xs font-medium text-text-secondary mb-1"
          >
            Search description
          </label>
          <input
            id="txn-search"
            type="text"
            placeholder="e.g. UPI, NEFT, Swiggy…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
          />
        </div>

        {/* Type filter */}
        <div className="sm:w-44">
          <label
            htmlFor="txn-type"
            className="block text-xs font-medium text-text-secondary mb-1"
          >
            Type
          </label>
          <select
            id="txn-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
          >
            <option value="">All</option>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
        </div>
      </div>

      {/* Row 2: Date range */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label
            htmlFor="txn-from"
            className="block text-xs font-medium text-text-secondary mb-1"
          >
            From date
          </label>
          <input
            id="txn-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="txn-to"
            className="block text-xs font-medium text-text-secondary mb-1"
          >
            To date
          </label>
          <input
            id="txn-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
          />
        </div>
      </div>

      {/* Row 3: Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={applyFilters}
          className="h-9 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          Apply Filters
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-9 px-4 border border-border text-sm font-medium text-text-secondary hover:bg-background rounded-lg transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
