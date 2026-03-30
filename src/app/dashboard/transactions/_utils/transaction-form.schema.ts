import { z } from "zod";

export const transactionFormSchema = z.object({
  amount: z.number({ error: "Amount is required" })
    .positive("Amount must be greater than 0")
    .multipleOf(0.01, "Max 2 decimal places"),
  date: z.string()
    .refine((d) => !isNaN(Date.parse(d)), "Invalid date")
    .refine((d) => {
      // Allow today, reject future. Strip time for comparison.
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date <= today;
    }, "Date cannot be in the future"),
  type: z.enum(["debit", "credit"]),
  description: z.string().min(1, "Description is required").max(255, "Maximum 255 characters allowed"),
  categoryId: z.string().nullable().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
