"use client";

import { useState, useCallback } from "react";
import type { ParsedTransaction } from "@/lib/pdf/types";

interface TransactionPreviewProps {
  transactions: ParsedTransaction[];
  errorCount: number;
  onConfirm: (selected: ParsedTransaction[]) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function TransactionPreview({
  transactions,
  errorCount,
  onConfirm,
  onCancel,
  isSubmitting,
}: TransactionPreviewProps) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(transactions.map((_, i) => i)),
  );

  const toggleAll = useCallback(() => {
    if (selected.size === transactions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(transactions.map((_, i) => i)));
    }
  }, [selected.size, transactions]);

  const toggleOne = useCallback((index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    const selectedTxns = transactions.filter((_, i) => selected.has(i));
    onConfirm(selectedTxns);
  }, [transactions, selected, onConfirm]);

  const allSelected = selected.size === transactions.length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-primary-light border border-primary/20">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold text-primary">
            {transactions.length} transactions found
          </span>
          {errorCount > 0 && (
            <span className="text-text-muted">
              • {errorCount} rows could not be parsed
            </span>
          )}
        </div>
        <span className="text-xs text-text-muted">
          {selected.size} selected
        </span>
      </div>

      {/* Transaction table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background border-b border-border">
              <th className="px-3 py-2.5 text-left w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-border accent-primary cursor-pointer"
                  aria-label="Select all"
                />
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-text-secondary">
                Date
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-text-secondary">
                Description
              </th>
              <th className="px-3 py-2.5 text-right font-medium text-text-secondary">
                Debit
              </th>
              <th className="px-3 py-2.5 text-right font-medium text-text-secondary">
                Credit
              </th>
              <th className="px-3 py-2.5 text-right font-medium text-text-secondary hidden sm:table-cell">
                Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn, i) => (
              <tr
                key={i}
                className={`border-b border-border last:border-0 transition-colors ${
                  selected.has(i) ? "bg-surface" : "bg-surface/50 opacity-50"
                }`}
              >
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggleOne(i)}
                    className="rounded border-border accent-primary cursor-pointer"
                    aria-label={`Select transaction ${i + 1}`}
                  />
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-text-primary font-mono text-xs">
                  {formatDate(txn.date)}
                </td>
                <td className="px-3 py-2.5 text-text-primary max-w-[200px] sm:max-w-[300px] truncate">
                  {txn.description}
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap font-mono font-medium text-debit">
                  {txn.type === "debit" &&
                    `₹${txn.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap font-mono font-medium text-credit">
                  {txn.type === "credit" &&
                    `₹${txn.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap font-mono text-xs text-text-muted hidden sm:table-cell">
                  ₹
                  {txn.balance.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-10 min-h-[44px] px-4 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-background transition-colors disabled:opacity-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={selected.size === 0 || isSubmitting}
          className="h-10 min-h-[44px] px-6 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </>
          ) : (
            <>
              Confirm & Save ({selected.size})
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}
