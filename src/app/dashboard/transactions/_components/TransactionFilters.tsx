"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";

export function TransactionFilters({
  categories,
}: {
  categories: { id: string; name: string; slug: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const hasActiveFilters =
    !!searchParams.get("search") ||
    !!searchParams.get("type") ||
    !!searchParams.get("from") ||
    !!searchParams.get("to") ||
    !!searchParams.get("category");

  const buildUrl = useCallback(
    (overrides: Record<string, string> = {}) => {
      const s = overrides.search ?? search;
      const t = overrides.type ?? type;
      const c = overrides.category ?? category;
      const f = overrides.from ?? from;
      const tt = overrides.to ?? to;
      const params = new URLSearchParams();
      if (s.trim()) params.set("search", s.trim());
      if (t) params.set("type", t);
      if (f) params.set("from", f);
      if (tt) params.set("to", tt);
      if (c) params.set("category", c);
      return `/dashboard/transactions?${params.toString()}`;
    },
    [search, type, from, to, category],
  );

  const pushFilters = useCallback(
    (overrides: Record<string, string> = {}) => {
      router.push(buildUrl(overrides));
    },
    [router, buildUrl],
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const currentSearch = searchParams.get("search") ?? "";
      if (search.trim() !== currentSearch) {
        pushFilters({ search });
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearFilters = useCallback(() => {
    setSearch("");
    setType("");
    setFrom("");
    setTo("");
    setCategory("");
    router.push("/dashboard/transactions");
  }, [router]);

  const removeFilter = useCallback(
    (key: string) => {
      const setters: Record<string, (v: string) => void> = {
        search: setSearch,
        type: setType,
        from: setFrom,
        to: setTo,
        category: setCategory,
      };
      setters[key]?.("");
      pushFilters({ [key]: "" });
    },
    [pushFilters],
  );

  const activeChips: { key: string; label: string }[] = [];
  if (searchParams.get("search"))
    activeChips.push({ key: "search", label: `"${searchParams.get("search")}"` });
  if (searchParams.get("type"))
    activeChips.push({ key: "type", label: searchParams.get("type") === "debit" ? "Debit" : "Credit" });
  if (searchParams.get("category")) {
    const catSlug = searchParams.get("category")!;
    const catName = catSlug === "uncategorized" ? "Uncategorized" : categories.find(c => c.slug === catSlug)?.name ?? catSlug;
    activeChips.push({ key: "category", label: catName });
  }
  if (searchParams.get("from"))
    activeChips.push({ key: "from", label: `From ${searchParams.get("from")}` });
  if (searchParams.get("to"))
    activeChips.push({ key: "to", label: `To ${searchParams.get("to")}` });

  const [mobileOpen, setMobileOpen] = useState(false);

  const filterFields = (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label
            htmlFor="txn-search"
            className="block text-xs font-medium text-text-secondary mb-1"
          >
            Search description
          </label>
          <Input
            id="txn-search"
            type="text"
            placeholder="e.g. UPI, NEFT, Swiggy…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            inputSize="md"
          />
        </div>

        <div className="sm:w-44">
          <label
            htmlFor="txn-type"
            className="block text-xs font-medium text-text-secondary mb-1"
          >
            Type
          </label>
          <Select
            id="txn-type"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              pushFilters({ type: e.target.value });
            }}
            selectSize="md"
          >
            <option value="">All</option>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </Select>
        </div>

        <div className="sm:w-48">
          <label
            htmlFor="txn-category"
            className="block text-xs font-medium text-text-secondary mb-1"
          >
            Category
          </label>
          <Select
            id="txn-category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              pushFilters({ category: e.target.value });
            }}
            selectSize="md"
          >
            <option value="">All Categories</option>
            <option value="uncategorized">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label
            htmlFor="txn-from"
            className="block text-xs font-medium text-text-secondary mb-1"
          >
            From date
          </label>
          <Input
            id="txn-from"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              pushFilters({ from: e.target.value });
            }}
            inputSize="md"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="txn-to"
            className="block text-xs font-medium text-text-secondary mb-1"
          >
            To date
          </label>
          <Input
            id="txn-to"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              pushFilters({ to: e.target.value });
            }}
            inputSize="md"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center pt-1">
          <Button onClick={() => { clearFilters(); setMobileOpen(false); }} variant="secondary" size="sm">
            Clear All Filters
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-3">
      {/* Desktop: inline filter panel */}
      <div className="hidden sm:block p-4 rounded-xl bg-surface shadow-sm dark:border dark:border-border dark:shadow-none space-y-4">
        {filterFields}
      </div>

      {/* Mobile: collapsed button + bottom sheet */}
      <div className="sm:hidden">
        <Button
          onClick={() => setMobileOpen(true)}
          variant="secondary"
          size="md"
          className="w-full"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
          }
        >
          Filters{activeChips.length > 0 ? ` (${activeChips.length})` : ""}
        </Button>

        <BottomSheet
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          title="Filters"
          size="full"
        >
          <div className="space-y-4">
            {filterFields}
          </div>
        </BottomSheet>
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-light text-primary text-xs font-medium"
            >
              {chip.label}
              <button
                onClick={() => removeFilter(chip.key)}
                className="p-0.5 rounded-full hover:bg-primary/10 transition-colors cursor-pointer"
                aria-label={`Remove ${chip.label} filter`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
