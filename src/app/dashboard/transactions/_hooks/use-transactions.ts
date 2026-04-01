"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import type { TransactionsApiResponse } from "../types";

const PAGE_SIZE = 50;

export function useTransactions() {
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const category = searchParams.get("category") ?? "";

  return useInfiniteQuery<TransactionsApiResponse>({
    queryKey: ["transactions", { search, type, from, to, category }],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set("page", String(pageParam));
      params.set("limit", String(PAGE_SIZE));
      if (search) params.set("search", search);
      if (type) params.set("type", type);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (category) params.set("category", category);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
}
