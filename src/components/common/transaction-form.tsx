"use client";

import { useState } from "react";
import { useManualTransaction } from "@/hooks/use-manual-transaction";
import { transactionFormSchema, TransactionFormValues } from "@/lib/schemas/transaction-form.schema";
import type { CategoryOption } from "@/components/common/category-badge";
import { CategoryDropdown } from "@/components/common/category-dropdown";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";

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
        <div className="p-3 text-sm text-error bg-error-light border border-error/20 rounded-lg">
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="txn-amount" className="block text-xs font-medium text-text-secondary mb-1">Amount</label>
          <Input
            id="txn-amount"
            type="number"
            step="0.01"
            value={formData.amount || ""}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value ? Number(e.target.value) : undefined })}
            error={!!errors.amount}
            errorId={errors.amount ? "txn-amount-error" : undefined}
            placeholder="0.00"
            inputSize="md"
          />
          {errors.amount && <p id="txn-amount-error" className="text-xs text-error mt-1">{errors.amount[0]}</p>}
        </div>

        <div>
          <label htmlFor="txn-date" className="block text-xs font-medium text-text-secondary mb-1">Date</label>
          <DatePicker
            id="txn-date"
            value={formData.date || ""}
            onChange={(val) => setFormData({ ...formData, date: val })}
            error={!!errors.date}
          />
          {errors.date && <p id="txn-date-error" className="text-xs text-error mt-1">{errors.date[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
          <Select
            value={formData.type}
            onValueChange={(val) => setFormData({ ...formData, type: val as "debit" | "credit" })}
          >
            <SelectTrigger
              className="w-full justify-between px-3 py-2.5 h-auto text-sm border-border-light bg-surface hover:bg-surface-raised focus-visible:border-border-strong focus-visible:ring-1 focus-visible:ring-border-strong/25"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" sideOffset={4}>
              <SelectItem value="debit">Debit (Expense)</SelectItem>
              <SelectItem value="credit">Credit (Income)</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-xs text-error mt-1">{errors.type[0]}</p>}
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
        <label htmlFor="txn-desc" className="block text-xs font-medium text-text-secondary mb-1">Description / Merchant</label>
        <Input
          id="txn-desc"
          type="text"
          value={formData.description || ""}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          error={!!errors.description}
          errorId={errors.description ? "txn-desc-error" : undefined}
          placeholder="e.g. Swiggy, Salary, etc."
          inputSize="md"
        />
        {errors.description && <p id="txn-desc-error" className="text-xs text-error mt-1">{errors.description[0]}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
        <Button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          variant="ghost"
          size="md"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isLoading}
          size="md"
        >
          {mode === "create" ? "Save Transaction" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
