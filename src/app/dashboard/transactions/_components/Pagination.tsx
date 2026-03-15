import Link from "next/link";

function buildPageUrl(
  base: URLSearchParams,
  page: number,
): string {
  const params = new URLSearchParams(base);
  params.set("page", String(page));
  return `/dashboard/transactions?${params.toString()}`;
}

export function Pagination({
  page,
  totalPages,
  baseParams,
}: {
  page: number;
  totalPages: number;
  baseParams: URLSearchParams;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between px-4 py-3 border-t border-border"
    >
      <p className="text-xs text-text-muted">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={buildPageUrl(baseParams, page - 1)}
            aria-label="Previous page"
            className="h-8 px-3 text-sm rounded-lg border border-border text-text-secondary hover:bg-background transition-colors flex items-center"
          >
            ← Prev
          </Link>
        ) : (
          <span
            aria-label="Previous page, disabled"
            aria-disabled="true"
            className="h-8 px-3 text-sm rounded-lg border border-border text-text-muted opacity-40 flex items-center cursor-not-allowed"
          >
            ← Prev
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={buildPageUrl(baseParams, page + 1)}
            aria-label="Next page"
            className="h-8 px-3 text-sm rounded-lg border border-border text-text-secondary hover:bg-background transition-colors flex items-center"
          >
            Next →
          </Link>
        ) : (
          <span
            aria-label="Next page, disabled"
            aria-disabled="true"
            className="h-8 px-3 text-sm rounded-lg border border-border text-text-muted opacity-40 flex items-center cursor-not-allowed"
          >
            Next →
          </span>
        )}
      </div>
    </nav>
  );
}
