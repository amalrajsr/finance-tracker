"use client";

import { useState } from "react";
import Link from "next/link";
import { CategoryOption } from "./CategorySelect";
import { TransactionModal } from "./TransactionModal";
import { TransactionForm } from "./TransactionForm";

interface TransactionPageHeaderProps {
  totalEver: number;
  total: number;
  hasFilters: boolean;
  categories: CategoryOption[];
}

export function TransactionPageHeader({ totalEver, total, hasFilters, categories }: TransactionPageHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Transactions
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {totalEver === 0
              ? "No transactions yet"
              : `${total.toLocaleString("en-IN")} transaction${total !== 1 ? "s" : ""}${hasFilters ? " matching filters" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="hidden sm:flex items-center gap-2 h-10 min-h-[44px] px-4 bg-background border border-border hover:bg-surface text-text-primary text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Transaction
          </button>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="sm:hidden flex items-center justify-center h-11 w-11 bg-background border border-border hover:bg-surface text-text-primary rounded-lg transition-colors cursor-pointer"
            aria-label="Add Transaction"
          >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>

          <Link
            href="/dashboard/upload"
            className="hidden sm:inline-flex items-center gap-2 h-10 min-h-[44px] px-4 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Upload
          </Link>
          <Link
             href="/dashboard/upload"
             className="sm:hidden flex items-center justify-center h-11 w-11 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
             aria-label="Upload"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </Link>
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Transaction"
      >
        <TransactionForm
          mode="create"
          categories={categories}
          onSuccess={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
        />
      </TransactionModal>
    </>
  );
}
