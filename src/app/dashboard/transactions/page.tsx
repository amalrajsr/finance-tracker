import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import { TransactionFilters } from "./_components/TransactionFilters";
import { EmptyState } from "./_components/EmptyState";
import { TransactionPageHeader } from "./_components/TransactionPageHeader";
import { TransactionList } from "./_components/TransactionList";
import type { CategoryOption } from "./_components/CategorySelect";

export default async function TransactionsPage() {
  const session = await auth();
  const userId = session!.user!.id as string;

  const [totalEver, rawCategories] = await Promise.all([
    db.transaction.count({ where: { userId } }),
    db.category.findMany({
      select: { id: true, name: true, slug: true, icon: true, colour: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const categoriesOption: CategoryOption[] = rawCategories;

  return (
    <div className="flex flex-col gap-4 h-[calc(100dvh-10.5rem)] md:h-[calc(100dvh-2.5rem)]">
      <div className="shrink-0">
        <TransactionPageHeader
          totalEver={totalEver}
          total={totalEver}
          hasFilters={false}
          categories={categoriesOption}
        />
      </div>

      {totalEver === 0 && <EmptyState />}

      {totalEver > 0 && (
        <>
          <div className="shrink-0">
            <TransactionFilters categories={rawCategories} />
          </div>
          <TransactionList categories={categoriesOption} />
        </>
      )}
    </div>
  );
}
