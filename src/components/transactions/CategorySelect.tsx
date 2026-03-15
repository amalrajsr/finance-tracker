"use client";

import { useState, useRef, useEffect } from "react";
import { CategoryBadge } from "./CategoryBadge";
import type { CategoryBadgeProps } from "./CategoryBadge";

export interface CategoryOption extends CategoryBadgeProps {
  id: string;
}

interface CategorySelectProps {
  transactionId: string;
  transactionDesc: string;
  currentCategory?: CategoryBadgeProps;
  categories: CategoryOption[];
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
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [ruleKeyword, setRuleKeyword] = useState(() => {
    // Basic heuristic to prepopulate keyword (e.g., split by dash and take second part, or first word)
    if (transactionDesc.startsWith("UPI-")) return transactionDesc.split("-")[1] || "";
    return transactionDesc.split(" ")[0] || "";
  });

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowRuleForm(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelectCategory = async (categoryId: string, option: CategoryOption) => {
    setSelectedCategoryId(categoryId);
    setShowRuleForm(true);
    setOptimisticCategory(option);
  };

  const handleSave = async (withRule: boolean) => {
    if (!selectedCategoryId) return;

    setIsOpen(false);
    setShowRuleForm(false);

    try {
      const payload: any = { categoryId: selectedCategoryId };
      if (withRule && ruleKeyword.trim()) {
        payload.saveAsRule = { keyword: ruleKeyword.trim() };
      }

      const res = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update failed");

      // Success, optimistic UI remains
    } catch (err) {
      // Revert optimistic UI
      setOptimisticCategory(currentCategory);
      console.error(err);
      alert("Failed to update category.");
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 focus:outline-none rounded hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer"
        aria-label="Change category"
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

      {isOpen && !showRuleForm && (
        <div className="absolute z-10 left-0 mt-1 w-56 bg-surface border border-border shadow-lg rounded-xl overflow-hidden py-1">
          <div className="max-h-60 overflow-y-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id, cat)}
                className="w-full px-3 py-2 text-left hover:bg-background transition-colors flex items-center justify-between cursor-pointer"
              >
                <CategoryBadge {...cat} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conditional: Ask if they want to save rule */}
      {isOpen && showRuleForm && (
        <div className="absolute z-20 left-0 mt-1 w-72 bg-surface border border-border shadow-xl rounded-xl p-4">
          <h4 className="text-sm font-semibold text-text-primary mb-2">
            Change Category
          </h4>
          <p className="text-xs text-text-secondary mb-3">
            You changed this to <strong style={{ color: optimisticCategory?.colour }}>{optimisticCategory?.name}</strong>. Would you like to create a rule for future transactions?
          </p>

          <div className="mb-4">
            <label className="block text-[10px] uppercase font-bold text-text-muted mb-1">
              Match Keyword
            </label>
            <input
              type="text"
              value={ruleKeyword}
              onChange={(e) => setRuleKeyword(e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded border border-border bg-background text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g. Swiggy"
            />
            <p className="text-[10px] text-text-muted mt-1">
              Transactions containing this keyword will automatically be categorized.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleSave(true)}
              disabled={!ruleKeyword.trim()}
              className="w-full text-xs py-2 bg-primary text-white rounded font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              Save Change & Create Rule
            </button>
            <button
              onClick={() => handleSave(false)}
              className="w-full text-xs py-2 border border-border text-text-secondary hover:bg-background rounded font-medium transition-colors"
            >
              Apply Only to This Transaction
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
