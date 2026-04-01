"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { DayTransaction } from "../_hooks/use-day-transactions";

interface DayTransactionItemProps {
  transaction: DayTransaction;
}

export function DayTransactionItem({ transaction }: DayTransactionItemProps) {
  const isDebit = transaction.type === "debit";

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary truncate">
          {transaction.description}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {transaction.categoryName && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: transaction.categoryColour ? `${transaction.categoryColour}1A` : "#9CA3AF1A",
                color: transaction.categoryColour || "#6B7280",
              }}
            >
              {transaction.categoryIcon && <span>{transaction.categoryIcon}</span>}
              {transaction.categoryName}
            </span>
          )}
          {transaction.isManual && (
            <span className="text-[10px] text-text-muted">Manual</span>
          )}
        </div>
      </div>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums shrink-0",
          isDebit ? "text-debit" : "text-credit",
        )}
      >
        {isDebit ? "-" : "+"}{formatCurrency(transaction.amount)}
      </span>
    </div>
  );
}
