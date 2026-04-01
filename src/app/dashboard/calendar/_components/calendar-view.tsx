"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { CategoryOption } from "@/components/common/category-badge";
import { Modal } from "@/components/ui/modal";
import { TransactionForm } from "@/components/common/transaction-form";
import { useCalendarNavigation } from "../_hooks/use-calendar-navigation";
import { useCalendarData } from "../_hooks/use-calendar-data";
import { buildCalendarGrid } from "../_utils/calendar-helpers";
import { CalendarHeader } from "./calendar-header";
import { CalendarGrid } from "./calendar-grid";
import { DayTransactionSheet } from "./day-transaction-sheet";

interface CalendarViewProps {
  categories: CategoryOption[];
}

export function CalendarView({ categories }: CalendarViewProps) {
  const nav = useCalendarNavigation();
  const { data, isLoading } = useCalendarData(nav.month, nav.year);
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addDate, setAddDate] = useState<string | null>(null);

  const cells = data ? buildCalendarGrid(nav.year, nav.month, data.days) : [];

  const handleDayClick = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
    setIsSheetOpen(true);
  }, []);

  const handleSheetClose = useCallback(() => {
    setIsSheetOpen(false);
  }, []);

  const handleAddFromSheet = useCallback(() => {
    setAddDate(selectedDate);
    setIsAddModalOpen(true);
  }, [selectedDate]);

  const handleAddFromHeader = useCallback(() => {
    // Default to today or first of displayed month
    const today = new Date();
    const isCurrentMonth =
      today.getMonth() + 1 === nav.month && today.getFullYear() === nav.year;
    const defaultDate = isCurrentMonth
      ? today.toISOString().split("T")[0]
      : `${nav.year}-${String(nav.month).padStart(2, "0")}-01`;
    setAddDate(defaultDate);
    setIsAddModalOpen(true);
  }, [nav.month, nav.year]);

  const handleAddSuccess = useCallback(() => {
    setIsAddModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["calendar-daily-totals"] });
    if (selectedDate) {
      queryClient.invalidateQueries({ queryKey: ["day-transactions", selectedDate] });
    }
  }, [queryClient, selectedDate]);

  const handleAddClose = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

  return (
    <div className="space-y-4">
      <CalendarHeader
        month={nav.month}
        year={nav.year}
        isNextDisabled={nav.isNextDisabled}
        onMonthChange={nav.setMonth}
        onYearChange={nav.setYear}
        onPrev={nav.goToPrevMonth}
        onNext={nav.goToNextMonth}
        onAddClick={handleAddFromHeader}
      />

      <div className="p-3 sm:p-4 rounded-xl bg-surface shadow-sm dark:border dark:border-border dark:shadow-none">
        <CalendarGrid
          cells={cells}
          selectedDate={selectedDate}
          isLoading={isLoading}
          isSheetOpen={isSheetOpen}
          onDayClick={handleDayClick}
          onSwipeLeft={nav.goToNextMonth}
          onSwipeRight={nav.goToPrevMonth}
        />
      </div>

      <DayTransactionSheet
        date={selectedDate}
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
        onAddClick={handleAddFromSheet}
      />

      <Modal
        isOpen={isAddModalOpen}
        title="Add Transaction"
        onClose={handleAddClose}
      >
        <TransactionForm
          mode="create"
          initialValues={{ date: addDate || undefined }}
          categories={categories}
          onSuccess={handleAddSuccess}
          onCancel={handleAddClose}
        />
      </Modal>
    </div>
  );
}
