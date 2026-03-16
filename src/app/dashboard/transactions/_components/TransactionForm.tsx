"use client";

import { useState } from "react";
import { useManualTransaction } from "../_hooks/use-manual-transaction";
import { transactionFormSchema, TransactionFormValues } from "../_utils/transaction-form.schema";
import { CategoryOption } from "./CategorySelect";
import { CategoryDropdown } from "./CategoryDropdown";
import { useToast } from "@/hooks/use-toast";

interface TransactionFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<TransactionFormValues> & { id?: string };
  categories: CategoryOption[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionForm({ mode, initialValues, categories, onSuccess, onCancel }: TransactionFormProps) {
  const [formData, setFormData] = useState<Partial<TransactionFormValues>>({
    amount: initialValues?.amount ?? undefined,
    date: initialValues?.date ?? new Date().toISOString().split("T")[0],
    type: initialValues?.type ?? "debit",
    description: initialValues?.description ?? "",
    categoryId: initialValues?.categoryId ?? null,
  });
  
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState("");
  
  const { create, edit, isLoading } = useManualTransaction();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError("");

    // Convert amount to number if it's currently a string from the input
    const payload = {
      ...formData,
      amount: formData.amount ? Number(formData.amount) : undefined,
    };

    const parsed = transactionFormSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    let result;
    if (mode === "create") {
      result = await create(parsed.data);
    } else {
      if (!initialValues?.id) return;
      result = await edit(initialValues.id, parsed.data);
    }

    if (result.ok) {
      toast(mode === "create" ? "Transaction added successfully" : "Transaction updated successfully", "success");
      onSuccess();
    } else {
      setApiError(result.error || "An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
          {apiError}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            value={formData.amount || ""}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value ? Number(e.target.value) : undefined })}
            className={`w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-1 ${errors.amount ? "border-red-500 ring-red-500" : "border-border focus:ring-primary"}`}
            placeholder="0.00"
          />
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount[0]}</p>}
        </div>
        
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Date</label>
          <input
            type="date"
            value={formData.date || ""}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-1 ${errors.date ? "border-red-500 ring-red-500" : "border-border focus:ring-primary"}`}
          />
          {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as "debit" | "credit" })}
            className={`w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-1 ${errors.type ? "border-red-500 ring-red-500" : "border-border focus:ring-primary"}`}
          >
            <option value="debit">Debit (Expense)</option>
            <option value="credit">Credit (Income)</option>
          </select>
          {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type[0]}</p>}
        </div>
        
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Category (Optional)</label>
          <CategoryDropdown
            value={formData.categoryId || null}
            onChange={(id) => setFormData({ ...formData, categoryId: id })}
            categories={categories}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Description / Merchant</label>
        <input
          type="text"
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-1 ${errors.description ? "border-red-500 ring-red-500" : "border-border focus:ring-primary"}`}
          placeholder="e.g. Swiggy, Salary, etc."
        />
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description[0]}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 cursor-pointer focus:outline-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer focus:outline-none"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : null}
          {mode === "create" ? "Save Transaction" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
