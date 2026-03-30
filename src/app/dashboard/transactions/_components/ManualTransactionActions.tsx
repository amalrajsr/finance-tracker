"use client";

import { useState } from "react";
import { SerializedTransaction } from "../types";
import { TransactionModal } from "./TransactionModal";
import { TransactionForm } from "./TransactionForm";
import { useManualTransaction } from "../_hooks/use-manual-transaction";
import { useToast } from "@/hooks/use-toast";

interface ComponentProps {
  txn: SerializedTransaction;
}

export function ManualTransactionActions({ txn }: ComponentProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { remove, isLoading } = useManualTransaction();
  const { toast } = useToast();

  if (!txn.isManual) return null;

  const handleDelete = async () => {
    const res = await remove(txn.id);
    if (res.ok) {
        toast("Transaction deleted successfully", "success");
        setIsDeleting(false);
    } else {
        toast(res.error || "Failed to delete from database", "error");
        setIsDeleting(false);
    }
  }

  if (isDeleting) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <span className="text-xs text-text-muted">Delete?</span>
        <button 
          onClick={handleDelete} 
          disabled={isLoading}
          className="text-xs font-medium text-error hover:text-error/80 disabled:opacity-50 cursor-pointer p-2"
        >
          Yes
        </button>
        <button 
          onClick={() => setIsDeleting(false)} 
          disabled={isLoading}
          className="text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-50 cursor-pointer"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 justify-end  group-hover:opacity-100 transition-opacity">
      <button
        onClick={() => setIsEditOpen(true)}
        className="p-2.5 text-text-muted hover:text-primary transition-colors cursor-pointer focus:outline-none rounded-lg"
        title="Edit Transaction"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
        </svg>
      </button>

      <button
        onClick={() => setIsDeleting(true)}
        className="p-2.5 text-text-muted hover:text-error transition-colors cursor-pointer focus:outline-none rounded-lg"
        title="Delete Transaction"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      </button>

      <TransactionModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Transaction"
      >
        <TransactionForm
          mode="edit"
          categories={txn.categories}
          initialValues={{
            id: txn.id,
            amount: Number(txn.amount),
            date: txn.date.split("T")[0],
            type: txn.type,
            description: txn.description,
            categoryId: txn.categorySlug ? txn.categories.find(c => c.slug === txn.categorySlug)?.id : null
          }}
          onSuccess={() => setIsEditOpen(false)}
          onCancel={() => setIsEditOpen(false)}
        />
      </TransactionModal>
    </div>
  );
}
