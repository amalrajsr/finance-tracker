"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { CategoryBadge } from "./category-badge";
import type { CategoryOption } from "./category-badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CategoryDropdownProps {
  value: string | null;
  onChange: (id: string | null) => void;
  categories: CategoryOption[];
}

export function CategoryDropdown({ value, onChange, categories }: CategoryDropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedCategory = categories.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-border-light rounded-lg bg-surface hover:bg-surface-raised outline-none transition-[border-color,box-shadow] duration-150 focus:border-border-strong focus:ring-1 focus:ring-border-strong/25"
      >
        {selectedCategory ? (
          <CategoryBadge {...selectedCategory} />
        ) : (
          <span className="text-text-muted">Uncategorized</span>
        )}
        <ChevronDownIcon className="size-4 text-text-muted" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-(--anchor-width) p-1 max-h-60 overflow-y-auto bg-surface dark:bg-surface-raised dropdown-scroll"
      >
        <button
          type="button"
          onClick={() => { onChange(null); setOpen(false); }}
          className="w-full px-3 py-2.5 min-h-[44px] text-sm text-left rounded-md hover:bg-accent transition-colors text-text-secondary cursor-pointer"
        >
          Uncategorized
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => { onChange(cat.id); setOpen(false); }}
            className="w-full px-3 py-2.5 min-h-[44px] text-left rounded-md hover:bg-accent transition-colors flex items-center justify-between cursor-pointer"
          >
            <CategoryBadge {...cat} />
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
