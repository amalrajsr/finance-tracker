"use client";

import { useState, useCallback } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { CategorySelect } from "./CategorySelect";
import { SerializedTransaction } from "../types";
import { ManualTransactionActions } from "./ManualTransactionActions";
import { useSwipe } from "@/hooks/use-swipe";

export function MobileCard({ txn }: { txn: SerializedTransaction }) {
  const isDebit = txn.type === "debit";
  const { categories } = txn;
  const [showActions, setShowActions] = useState(false);

  const onSwipeLeft = useCallback(() => {
    setShowActions(true);
  }, []);

  const onSwipeRight = useCallback(() => {
    setShowActions(false);
  }, []);

  const { offsetX, swiping, handlers } = useSwipe({
    threshold: 50,
    maxSwipe: 100,
    onSwipeLeft,
    onSwipeRight,
  });

  return (
    <li
      role="listitem"
      className="relative overflow-hidden border-b border-border last:border-0"
    >
      {/* Background actions revealed on swipe left */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3">
        {txn.isManual && (
          <ManualTransactionActions txn={txn} />
        )}
      </div>

      {/* Swipeable content */}
      <div
        {...handlers}
        className="relative bg-surface p-4 flex items-start justify-between gap-3 transition-transform"
        style={{
          transform: showActions
            ? "translateX(-80px)"
            : swiping
              ? `translateX(${offsetX}px)`
              : "translateX(0)",
          transition: swiping ? "none" : "transform 0.2s ease-out",
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {txn.description}
          </p>
          <div className="mt-1.5 mb-1.5 min-h-[24px]">
            {isDebit ? (
              <CategorySelect
                transactionId={txn.id}
                transactionDesc={txn.description}
                categories={categories}
                currentCategory={{
                  slug: txn.categorySlug,
                  name: txn.categoryName,
                  icon: txn.categoryIcon,
                  colour: txn.categoryColour,
                  isManual: txn.manualCategory,
                }}
              />
            ) : (
              <span className="text-text-muted text-xs">—</span>
            )}
          </div>
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
      </div>

      {/* Tap to dismiss swipe action area */}
      {showActions && (
        <button
          onClick={() => setShowActions(false)}
          className="absolute inset-y-0 left-0 right-20 z-10 cursor-pointer"
          aria-label="Dismiss actions"
        />
      )}
    </li>
  );
}
