"use client";

import { useSwipe } from "@/hooks/use-swipe";
import { WEEKDAY_LABELS } from "../_utils/calendar-helpers";
import type { CalendarCellData } from "../types";
import { CalendarDayCell } from "./calendar-day-cell";

interface CalendarGridProps {
  cells: CalendarCellData[];
  selectedDate: string | null;
  isLoading: boolean;
  isSheetOpen: boolean;
  onDayClick: (dateStr: string) => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export function CalendarGrid({
  cells,
  selectedDate,
  isLoading,
  isSheetOpen,
  onDayClick,
  onSwipeLeft,
  onSwipeRight,
}: CalendarGridProps) {
  const { handlers } = useSwipe({
    onSwipeLeft: isSheetOpen ? undefined : onSwipeLeft,
    onSwipeRight: isSheetOpen ? undefined : onSwipeRight,
    threshold: 60,
  });

  return (
    <div {...handlers} className="select-none">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-text-secondary py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[3.25rem] sm:min-h-[4.25rem] rounded-lg bg-surface-sunken/50 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const dateStr = `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, "0")}-${String(cell.date.getDate()).padStart(2, "0")}`;
            return (
              <CalendarDayCell
                key={dateStr}
                cell={cell}
                isSelected={selectedDate === dateStr}
                onClick={() => cell.isCurrentMonth && onDayClick(dateStr)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
