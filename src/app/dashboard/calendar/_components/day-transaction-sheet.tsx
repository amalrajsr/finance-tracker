"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { DayTransactionList } from "./day-transaction-list";

interface DayTransactionSheetProps {
  date: string | null;
  isOpen: boolean;
  onClose: () => void;
  onAddClick: () => void;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return mobile;
}

export function DayTransactionSheet({ date, isOpen, onClose, onAddClick }: DayTransactionSheetProps) {
  const isMobile = useIsMobile();

  if (!date || !isOpen) return null;

  const title = formatDate(date);

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <DayTransactionList date={date} />
      </div>
      <div className="pt-4 border-t border-border mt-4">
        <Button
          onClick={onAddClick}
          size="md"
          className="w-full"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          }
        >
          Add Transaction
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title={title} size="full">
        {content}
      </BottomSheet>
    );
  }

  return (
    <Modal isOpen={isOpen} title={title} onClose={onClose}>
      {content}
    </Modal>
  );
}
