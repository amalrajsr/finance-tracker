import { useRouter } from "next/navigation";
import { useState } from "react";
import { TransactionFormValues } from "../_utils/transaction-form.schema";

export function useManualTransaction() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const create = async (payload: TransactionFormValues) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/transactions/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.message || "Failed to create transaction" };
      router.refresh();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "Network error occurred." };
    } finally {
      setIsLoading(false);
    }
  };

  const edit = async (id: string, payload: Partial<TransactionFormValues>) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/transactions/manual/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.message || "Failed to update transaction" };
      router.refresh();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "Network error occurred." };
    } finally {
      setIsLoading(false);
    }
  };

  const remove = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/transactions/manual/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        let msg = "Failed to delete transaction";
        try {
          const data = await res.json();
          msg = data.message || msg;
        } catch {}
        return { ok: false, error: msg };
      }
      router.refresh();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: "Network error occurred." };
    } finally {
      setIsLoading(false);
    }
  };

  return { create, edit, remove, isLoading };
}
