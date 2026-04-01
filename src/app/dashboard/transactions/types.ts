import { CategoryOption } from "./_components/CategorySelect";

export interface SerializedTransaction {
  id: string;
  date: string;
  description: string;
  reference: string;
  amount: string;
  type: "debit" | "credit";
  balance: string;
  categorySlug?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColour?: string;
  manualCategory: boolean;
  isManual: boolean;
  categories: CategoryOption[];
}

export interface TransactionsApiResponse {
  transactions: Omit<SerializedTransaction, "categories">[];
  total: number;
  page: number;
  totalPages: number;
}
