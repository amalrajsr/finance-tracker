"use client";

import Link from "next/link";
import { MONTH_NAMES } from "../_utils/calendar-helpers";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

interface CalendarHeaderProps {
  month: number;
  year: number;
  isNextDisabled: boolean;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onAddClick: () => void;
}

export function CalendarHeader({
  month,
  year,
  isNextDisabled,
  onMonthChange,
  onYearChange,
  onPrev,
  onNext,
  onAddClick,
}: CalendarHeaderProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 -ml-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          aria-label="Back to dashboard"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Calendar</h1>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="flex items-center gap-1">
          <Select value={month} onValueChange={(val) => onMonthChange(val as number)}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" sideOffset={4}>
              {MONTH_NAMES.map((name, i) => (
                <SelectItem key={i} value={i + 1}>
                  {name.substring(0, 3)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={(val) => onYearChange(val as number)}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" sideOffset={4}>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next month"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onAddClick}
          className="ml-1 p-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
          aria-label="Add transaction"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
