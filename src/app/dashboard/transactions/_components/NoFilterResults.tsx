import Link from "next/link";

export function NoFilterResults() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-text-secondary text-sm">
        No transactions match your filters.
      </p>
      <Link
        href="/dashboard/transactions"
        className="mt-3 text-sm text-primary hover:underline"
      >
        Clear filters
      </Link>
    </div>
  );
}
