"use client";

import { useDayTransactions } from "../_hooks/use-day-transactions";
import { DayTransactionItem } from "./day-transaction-item";
import { formatCurrency } from "@/lib/format";

interface DayTransactionListProps {
  date: string;
}

export function DayTransactionList({ date }: DayTransactionListProps) {
  const { data, isLoading } = useDayTransactions(date);

  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center py-3">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 bg-surface-sunken rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-surface-sunken rounded animate-pulse" />
            </div>
            <div className="h-4 w-16 bg-surface-sunken rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const transactions = data?.transactions ?? [];

  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-text-muted">No transactions on this day</p>
      </div>
    );
  }

  const totalDebits = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalCredits = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div>
      {/* Day summary */}
      <div className="flex items-center gap-4 pb-3 mb-1 border-b border-border">
        {totalCredits > 0 && (
          <div>
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Income</span>
            <p className="text-sm font-semibold text-credit tabular-nums">{formatCurrency(totalCredits)}</p>
          </div>
        )}
        {totalDebits > 0 && (
          <div>
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Expense</span>
            <p className="text-sm font-semibold text-debit tabular-nums">{formatCurrency(totalDebits)}</p>
          </div>
        )}
        <div className="ml-auto">
          <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Count</span>
          <p className="text-sm font-semibold text-text-primary tabular-nums">{transactions.length}</p>
        </div>
      </div>

      {/* Transaction list */}
      <div className="max-h-[50vh] overflow-y-auto">
        {transactions.map((txn) => (
          <DayTransactionItem key={txn.id} transaction={txn} />
        ))}
      </div>
    </div>
  );
}
