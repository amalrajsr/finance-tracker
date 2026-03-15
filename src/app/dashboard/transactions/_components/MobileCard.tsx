import { formatCurrency, formatDate } from "@/lib/format";
import { CategorySelect } from "./CategorySelect";
import { SerializedTransaction } from "../types";

export function MobileCard({ txn }: { txn: SerializedTransaction }) {
  const isDebit = txn.type === "debit";
  const { categories } = txn;
  return (
    <li
      role="listitem"
      className="p-4 border-b border-border last:border-0 flex items-start justify-between gap-3"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {txn.description}
        </p>
        <div className="mt-1.5 mb-1.5 min-h-[24px]">
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
        </div>
        {txn.reference && (
          <p className="text-xs text-text-muted font-mono mt-0.5 truncate">
            {txn.reference}
          </p>
        )}
        <p className="text-xs text-text-secondary mt-1">{formatDate(txn.date)}</p>
      </div>
      <div className="text-right shrink-0">
        <p
          className={`text-sm font-semibold ${
            isDebit ? "text-debit" : "text-credit"
          }`}
        >
          {isDebit ? "−" : "+"}{formatCurrency(txn.amount)}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          Bal {formatCurrency(txn.balance)}
        </p>
      </div>
    </li>
  );
}
