"use client";

import { useState, useRef, useEffect } from "react";
import { CategoryBadge } from "./CategoryBadge";
import { CategoryOption } from "./CategorySelect";

interface CategoryDropdownProps {
  value: string | null;
  onChange: (id: string | null) => void;
  categories: CategoryOption[];
}

export function CategoryDropdown({ value, onChange, categories }: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedCategory = categories.find((c) => c.id === value);

  return (
    <div className="relative inline-block w-full" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-border rounded-lg bg-background hover:bg-surface focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
      >
        {selectedCategory ? (
          <CategoryBadge {...selectedCategory} />
        ) : (
          <span className="text-text-muted">Uncategorized</span>
        )}
        <svg
          className="w-4 h-4 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 left-0 w-full mt-1 bg-surface border border-border shadow-lg rounded-xl overflow-hidden py-1 max-h-60 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onChange(null); setIsOpen(false); }}
            className="w-full px-3 py-2.5 min-h-[44px] text-sm text-left hover:bg-background transition-colors text-text-secondary cursor-pointer"
          >
            Uncategorized
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => { onChange(cat.id); setIsOpen(false); }}
              className="w-full px-3 py-2.5 min-h-[44px] text-left hover:bg-background transition-colors flex items-center justify-between cursor-pointer"
            >
              <CategoryBadge {...cat} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
