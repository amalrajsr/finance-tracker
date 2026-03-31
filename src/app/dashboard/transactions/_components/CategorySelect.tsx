"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CategoryBadge } from "./CategoryBadge";
import type { CategoryBadgeProps } from "./CategoryBadge";
import { useToast } from "@/hooks/use-toast";
import { BottomSheet } from "@/components/ui/bottom-sheet";

export interface CategoryOption extends CategoryBadgeProps {
  id: string;
}

interface CategorySelectProps {
  transactionId: string;
  transactionDesc: string;
  currentCategory?: CategoryBadgeProps;
  categories: CategoryOption[];
}

function extractKeyword(desc: string): string {
  if (desc.startsWith("UPI-")) return desc.split("-")[1] || "";
  return desc.split(" ")[0] || "";
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    setMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return mobile;
}

export function CategorySelect({
  transactionId,
  transactionDesc,
  currentCategory,
  categories,
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [optimisticCategory, setOptimisticCategory] = useState<CategoryBadgeProps | undefined>(
    currentCategory
  );
  const [isHovered, setIsHovered] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) return;
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isMobile]);

  const saveRule = useCallback(
    async (categoryId: string) => {
      const keyword = extractKeyword(transactionDesc);
      if (!keyword.trim()) return;
      try {
        await fetch(`/api/transactions/${transactionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId,
            saveAsRule: { keyword: keyword.trim() },
          }),
        });
        toast("Rule created for future transactions", "success");
      } catch {
        toast("Failed to create rule", "error");
      }
    },
    [transactionId, transactionDesc, toast],
  );

  const handleSelectCategory = useCallback(
    async (categoryId: string, option: CategoryOption) => {
      setOptimisticCategory(option);
      setIsOpen(false);

      try {
        const res = await fetch(`/api/transactions/${transactionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId }),
        });

        if (!res.ok) throw new Error("Update failed");

        toast("Category updated", "success", {
          label: "Create Rule",
          onClick: () => saveRule(categoryId),
        });
      } catch {
        setOptimisticCategory(currentCategory);
        toast("Failed to update category", "error");
      }
    },
    [transactionId, currentCategory, toast, saveRule],
  );

  const categoryList = (
    <div className="max-h-60 sm:max-h-none overflow-y-auto">
      {categories.map((cat) => (
        <button
          key={cat.id}
          role="option"
          aria-selected={optimisticCategory?.slug === cat.slug}
          onClick={() => handleSelectCategory(cat.id, cat)}
          className="w-full px-3 py-2.5 min-h-[44px] text-left hover:bg-background transition-colors flex items-center justify-between cursor-pointer"
        >
          <CategoryBadge {...cat} />
          {optimisticCategory?.slug === cat.slug && (
            <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 focus:outline-none rounded focus-visible:ring-[3px] focus-visible:ring-focus-ring-strong hover:ring-2 hover:ring-primary/20 transition-shadow duration-150 cursor-pointer p-1"
        aria-label="Change category"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <CategoryBadge {...(optimisticCategory || {})} />
        <svg
          className={`w-3.5 h-3.5 text-text-muted transition-opacity ${
            isHovered || isOpen ? "opacity-100" : "opacity-0"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Desktop: popover */}
      {isOpen && !isMobile && (
        <div
          className="absolute z-10 left-0 mt-1 w-56 bg-surface-raised border border-border-light shadow-lg rounded-xl overflow-hidden py-1 dropdown-scroll"
          role="listbox"
          aria-label="Select category"
        >
          {categoryList}
        </div>
      )}

      {/* Mobile: bottom sheet */}
      {isMobile && (
        <BottomSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Select Category"
          size="half"
        >
          {categoryList}
        </BottomSheet>
      )}
    </div>
  );
}
