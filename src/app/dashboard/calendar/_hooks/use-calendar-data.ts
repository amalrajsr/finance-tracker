import { useQuery } from "@tanstack/react-query";
import type { DailyTotalsResponse } from "../types";

async function fetchDailyTotals(month: number, year: number): Promise<DailyTotalsResponse> {
  const res = await fetch(`/api/calendar/daily-totals?month=${month}&year=${year}`);
  if (!res.ok) throw new Error("Failed to fetch calendar data");
  return res.json();
}

export function useCalendarData(month: number, year: number) {
  return useQuery({
    queryKey: ["calendar-daily-totals", month, year],
    queryFn: () => fetchDailyTotals(month, year),
  });
}
