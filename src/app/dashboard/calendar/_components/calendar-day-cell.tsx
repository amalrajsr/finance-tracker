"use client";

import { cn } from "@/lib/utils";
import type { CalendarCellData } from "../types";
import { getCellClasses, formatCompactCurrency } from "../_utils/calendar-helpers";

interface CalendarDayCellProps {
  cell: CalendarCellData;
  isSelected: boolean;
  onClick: () => void;
}

export function CalendarDayCell({ cell, isSelected, onClick }: CalendarDayCellProps) {
  const { dayNumber, isCurrentMonth, isToday, debits, credits } = cell;
  const hasData = debits > 0 || credits > 0;
  const { bg, amountClass } = getCellClasses(debits, credits);

  const hasBoth = debits > 0 && credits > 0;
  const dominant = credits >= debits ? credits : debits;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isCurrentMonth}
      className={cn(
        "relative flex flex-col items-center justify-start gap-0.5 rounded-lg p-1 sm:p-1.5 min-h-[3.25rem] sm:min-h-[4.25rem] transition-all duration-150 text-center",
        isCurrentMonth
          ? "cursor-pointer hover:ring-2 hover:ring-primary/20"
          : "opacity-30 cursor-default",
        hasData && isCurrentMonth && bg,
        !hasData && isCurrentMonth && "bg-surface-sunken/50",
        isToday && "ring-1 ring-primary/40",
        isSelected && "ring-2 ring-primary",
      )}
      aria-label={`${cell.date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}${hasData ? `, ₹${dominant.toLocaleString("en-IN")}` : ""}`}
    >
      <span
        className={cn(
          "text-sm sm:text-base font-semibold leading-tight",
          isToday ? "text-primary" : isCurrentMonth ? "text-text-primary" : "text-text-muted",
        )}
      >
        {dayNumber}
      </span>

      {hasData && isCurrentMonth && (
        <div className="flex flex-col items-center gap-0">
          {hasBoth ? (
            <>
              <span className="text-[10px] sm:text-xs font-medium tabular-nums text-credit leading-tight">
                {formatCompactCurrency(credits)}
              </span>
              <span className="text-[10px] sm:text-xs font-medium tabular-nums text-debit leading-tight">
                {formatCompactCurrency(debits)}
              </span>
            </>
          ) : (
            <span className={cn("text-[10px] sm:text-xs font-medium tabular-nums leading-tight", amountClass)}>
              {formatCompactCurrency(dominant)}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
