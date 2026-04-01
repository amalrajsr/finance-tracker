import { useState, useCallback } from "react";
import { MONTH_NAMES } from "../_utils/calendar-helpers";

interface MonthYear {
  month: number;
  year: number;
}

export function useCalendarNavigation() {
  const now = new Date();
  const [state, setState] = useState<MonthYear>({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const goToPrevMonth = useCallback(() => {
    setState((prev) => {
      if (prev.month === 1) {
        return { month: 12, year: prev.year - 1 };
      }
      return { month: prev.month - 1, year: prev.year };
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setState((prev) => {
      const nowMonth = new Date().getMonth() + 1;
      const nowYear = new Date().getFullYear();
      const nextMonth = prev.month === 12 ? 1 : prev.month + 1;
      const nextYear = prev.month === 12 ? prev.year + 1 : prev.year;

      if (nextYear > nowYear || (nextYear === nowYear && nextMonth > nowMonth)) {
        return prev;
      }
      return { month: nextMonth, year: nextYear };
    });
  }, []);

  const setMonth = useCallback((month: number) => {
    setState((prev) => ({ ...prev, month }));
  }, []);

  const setYear = useCallback((year: number) => {
    setState((prev) => ({ ...prev, year }));
  }, []);

  const isNextDisabled = (() => {
    const nowMonth = new Date().getMonth() + 1;
    const nowYear = new Date().getFullYear();
    const nextMonth = state.month === 12 ? 1 : state.month + 1;
    const nextYear = state.month === 12 ? state.year + 1 : state.year;
    return nextYear > nowYear || (nextYear === nowYear && nextMonth > nowMonth);
  })();

  const monthLabel = `${MONTH_NAMES[state.month - 1]} ${state.year}`;

  return {
    month: state.month,
    year: state.year,
    setMonth,
    setYear,
    goToPrevMonth,
    goToNextMonth,
    isNextDisabled,
    monthLabel,
  };
}
