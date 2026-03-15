import { CategoryOption } from "./_components/CategorySelect";

export type SerializedTransaction = {
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
  categories: CategoryOption[];
};
