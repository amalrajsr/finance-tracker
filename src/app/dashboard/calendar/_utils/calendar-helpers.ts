import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
} from "date-fns";
import type { CalendarDayData, CalendarCellData } from "../types";

export function buildCalendarGrid(
  year: number,
  month: number,
  daysData: CalendarDayData[],
): CalendarCellData[] {
  const monthDate = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const dataMap = new Map<string, { debits: number; credits: number }>();
  daysData.forEach((d) => {
    dataMap.set(d.date, {
      debits: parseFloat(d.debits),
      credits: parseFloat(d.credits),
    });
  });

  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const data = dataMap.get(dateStr);
    return {
      date,
      dayNumber: date.getDate(),
      isCurrentMonth: isSameMonth(date, monthDate),
      isToday: isToday(date),
      debits: data?.debits ?? 0,
      credits: data?.credits ?? 0,
    };
  });
}

export function getCellClasses(debits: number, credits: number): { bg: string; amountClass: string } {
  const hasDebits = debits > 0;
  const hasCredits = credits > 0;

  if (!hasDebits && !hasCredits) {
    return { bg: "", amountClass: "" };
  }

  if (hasCredits && !hasDebits) {
    return { bg: "bg-credit/10", amountClass: "text-credit" };
  }

  if (hasDebits && !hasCredits) {
    return { bg: "bg-debit/10", amountClass: "text-debit" };
  }

  // Both: color based on net
  const net = credits - debits;
  if (net >= 0) {
    return { bg: "bg-credit/10", amountClass: "text-credit" };
  }
  return { bg: "bg-debit/10", amountClass: "text-debit" };
}

export function formatCompactCurrency(value: number): string {
  if (value === 0) return "";
  if (value >= 100000) {
    const lakhs = value / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: value % 1 === 0 ? 0 : 2 })}`;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
