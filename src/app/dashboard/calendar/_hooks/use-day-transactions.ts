import { useQuery } from "@tanstack/react-query";

interface DayTransaction {
  id: string;
  date: string;
  description: string;
  reference: string;
  amount: string;
  type: "debit" | "credit";
  balance: string;
  categorySlug?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColour?: string;
  manualCategory: boolean;
  isManual: boolean;
}

interface DayTransactionsResponse {
  transactions: DayTransaction[];
  total: number;
}

async function fetchDayTransactions(date: string): Promise<DayTransactionsResponse> {
  const res = await fetch(`/api/transactions?from=${date}&to=${date}&limit=100`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export function useDayTransactions(date: string | null) {
  return useQuery({
    queryKey: ["day-transactions", date],
    queryFn: () => fetchDayTransactions(date!),
    enabled: !!date,
  });
}

export type { DayTransaction };
