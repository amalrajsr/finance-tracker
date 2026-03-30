import { formatCurrency, formatDate } from "@/lib/format";
import { CategorySelect } from "./CategorySelect";
import { SerializedTransaction } from "../types";
import { ManualTransactionActions } from "./ManualTransactionActions";

export function TableRow({ txn }: { txn: SerializedTransaction }) {
  const isDebit = txn.type === "debit";
  const { categories } = txn;
  return (
    <tr className="border-t border-border hover:bg-background transition-colors">
      <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
        {formatDate(txn.date)}
      </td>
      <td className="px-4 py-3 text-sm text-text-primary max-w-xs">
        <span className="line-clamp-2">{txn.description}</span>
        {txn.reference && (
          <span className="block text-xs text-text-muted mt-0.5 font-mono">
            {txn.reference}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm">
        {isDebit ? (
          <CategorySelect
            transactionId={txn.id}
            transactionDesc={txn.description}
            categories={categories}
            currentCategory={{
              slug: txn.categorySlug,
              name: txn.categoryName,
              icon: txn.categoryIcon,
              colour: txn.categoryColour,
              isManual: txn.manualCategory,
            }}
          />
        ) : (
          <span className="text-text-muted text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
        {isDebit ? (
          <span className="text-debit font-medium">
            {formatCurrency(txn.amount)}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
        {!isDebit ? (
          <span className="text-credit font-medium">
            {formatCurrency(txn.amount)}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-right text-text-secondary whitespace-nowrap group">
        <div className="flex items-center justify-end gap-3">
          <span>{formatCurrency(txn.balance)}</span>
          {txn.isManual && <ManualTransactionActions txn={txn} />}
        </div>
      </td>
    </tr>
  );
}
