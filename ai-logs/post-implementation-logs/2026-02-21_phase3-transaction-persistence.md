# AI Change Log: Phase 3 — Transaction Persistence & Listing

## Meta

- **Date:** 2026-02-21
- **Trigger:** user-invoked
- **Calling Agent/Skill:** logger
- **Task Description:** Implement Phase 3 of the finance tracker — persist user-confirmed transactions to PostgreSQL with deduplication, expose bulk-insert and paginated-query API routes, wire the upload page to call the real API, and build a Transactions list page with filtering plus a stats-driven Dashboard page.
- **Files Affected:** 8 (3 modified, 5 created)
- **Confidence:** HIGH — all files reviewed via direct file reads; migration SQL verified

---

## Summary

Added `Statement` and `Transaction` Prisma models backed by PostgreSQL with a `SHA-256` dedup hash and unique constraint for race-safe duplicate prevention. Created `POST /api/transactions` (bulk insert with skip-count reporting) and `GET /api/transactions` (paginated, filterable list). Replaced the `handleConfirm` stub in the upload page with a real API call that shows insert/skip counts and auto-redirects on success. Built a server-component Transactions page with date-range, type, and description filters (URL-based state) with responsive desktop table and mobile card layouts. Converted the Dashboard page to a server component displaying aggregate stats and monthly debit/credit/net. Added a shared `format.ts` utility and a `TransactionFilters` client component.

---

## Changes

### Created Files

---

#### `prisma/migrations/20260221114713_add_statement_transaction/migration.sql` — INFRA

**Purpose:** Prisma-generated SQL migration that materialises the Phase 3 schema into PostgreSQL.
**Contents:**
- `CREATE TYPE "TransactionType" AS ENUM ('debit', 'credit')`
- `CREATE TABLE "Statement"` with columns: `id`, `userId`, `bank`, `fromDate`, `toDate`, `txnCount`, `createdAt`; primary key + `Statement_userId_createdAt_idx` composite index; FK to `User` with `ON DELETE CASCADE`
- `CREATE TABLE "Transaction"` with columns: `id`, `userId`, `statementId`, `date`, `description`, `reference`, `amount DECIMAL(12,2)`, `type`, `balance DECIMAL(12,2)`, `dedupHash`, `createdAt`; primary key + 4 indexes (`dedupHash` UNIQUE, `userId+date DESC`, `userId+type+date DESC`, `statementId`); FKs to `User` and `Statement` with `ON DELETE CASCADE`

---

#### `src/app/api/transactions/route.ts` — LOGIC

**Purpose:** Next.js App Router API route handling both `POST` (bulk insert) and `GET` (paginated query) for transactions.
**Contents:**
- `transactionInputSchema` / `postBodySchema` — Zod schemas validating incoming transaction arrays and statement metadata
- `computeDedupHash(userId, date, amount, type, balance)` — SHA-256 helper using Node.js `crypto`; produces hex strings used as unique DB constraint values
- `POST` handler — authenticates via `auth()`, validates body, computes hashes for all incoming rows, queries existing hashes for the user, filters to non-duplicate rows, runs `prisma.$transaction` to atomically create a `Statement` and `createMany` `Transaction` records (`skipDuplicates: true` as race-condition safety net), returns `{ inserted, skipped, statementId }`
- `GET` handler — authenticates, parses query params (`page`, `limit`, `from`, `to`, `type`, `search`), builds `Prisma.TransactionWhereInput`, fetches paginated rows and total count in parallel, serializes `Decimal` fields to strings, returns `{ transactions, total, page, totalPages }`

---

#### `src/app/dashboard/transactions/page.tsx` — UI

**Purpose:** Server component page at `/dashboard/transactions` — displays a paginated, filterable list of all user transactions.
**Contents:**
- `TransactionsPage` (async server component) — reads `searchParams`, builds `Prisma.TransactionWhereInput`, runs 3 parallel DB queries (`findMany`, `count` with filters, `count` without filters for empty-state detection), serializes `Decimal` fields, renders conditional UI
- `EmptyState` — shown when user has zero transactions; includes upload CTA button
- `NoFilterResults` — shown when filters produce no results; includes "Clear filters" link
- `TableRow` — desktop table row with debit/credit column split; debit amounts in `text-debit`, credit in `text-credit`
- `MobileCard` — mobile list card with `−`/`+` prefix and balance display; hidden on `sm:` and above
- `Pagination` — `Prev`/`Next` links using URL-based page state; disabled states rendered as `<span aria-disabled>` for accessibility
- `buildPageUrl` — constructs pagination URLs preserving existing filter params
- `SerializedTransaction` type — safe serialized shape with `amount` and `balance` as strings

---

#### `src/components/transactions/TransactionFilters.tsx` — UI

**Purpose:** Client component providing interactive filter controls for the Transactions page; state is lifted into URL query params on apply.
**Contents:**
- `TransactionFilters` — `"use client"` component; reads initial values from `useSearchParams()`; manages local state for `search`, `type`, `from`, `to`
- `applyFilters` — serialises non-empty filter values into `URLSearchParams` and calls `router.push()` to `/dashboard/transactions`, resetting to page 1
- `clearFilters` — resets all local state and navigates to `/dashboard/transactions` without params
- Conditionally renders a "Clear" button when `hasActiveFilters` is true
- Enter-key handler on the search input triggers `applyFilters`

---

#### `src/lib/format.ts` — LOGIC

**Purpose:** Shared formatting utilities for currency and date display used across the Dashboard and Transactions pages.
**Contents:**
- `formatCurrency(value: string | number): string` — formats a decimal string or number as Indian Rupees using `Intl.NumberFormat("en-IN")` with `INR` currency and 2 decimal places
- `formatDate(value: string | Date): string` — formats an ISO date string or `Date` as `"DD Mon YYYY"` (e.g. "21 Feb 2026") using `toLocaleDateString("en-IN")`

---

### Modified Files

---

#### `prisma/schema.prisma` — TYPES

**Symbols changed:** `TransactionType`, `Statement`, `Transaction`, `User`

**Before:**
Schema contained only the `User` model with `id`, `email`, `hashedPassword`, `createdAt`, `updatedAt`. No enums or additional models existed. No relations beyond the `User` model itself.

**After:**
Added `TransactionType` enum (`debit` | `credit`). Added `Statement` model with `userId` FK, `bank`, nullable `fromDate`/`toDate`, `txnCount`, `createdAt`, and `@@index([userId, createdAt])`. Added `Transaction` model with `userId` FK (denormalized), `statementId` FK, `date`, `description`, `reference`, `amount`/`balance` as `Decimal @db.Decimal(12,2)`, `type TransactionType`, `dedupHash @unique`, and three compound indexes. Updated `User` model to include `statements Statement[]` and `transactions Transaction[]` relation fields. Both new models declare `onDelete: Cascade` on their FKs to `User`.

**Reason:** Phase 3 requires persistent storage for parsed transactions. `Decimal(12,2)` prevents floating-point drift in financial aggregates. Denormalized `userId` on `Transaction` avoids joins in list queries. The `dedupHash` unique constraint enforces deduplication at the database level as a race-condition safety net.

---

#### `src/app/dashboard/upload/page.tsx` — UI

**Symbols changed:** `UploadPage`, `handleConfirm`, `handleReset`, state variables `isSubmitting`, `savedCount`, `skippedCount`, `UploadStep`

**Before:**
`handleConfirm` was a stub using `setTimeout` to simulate a 1-second delay before transitioning directly to the upload step. There was no `isSubmitting` state, no success feedback, no redirect, and no API call. `UploadStep` had no `"success"` variant.

**After:**
`handleConfirm` issues a real `fetch("POST /api/transactions")` call with the parsed bank name, statement period, and selected transactions serialized as JSON. On success, sets `savedCount` and `skippedCount` from the response, then transitions to a new `"success"` step. A `useEffect` on `step === "success"` auto-redirects to `/dashboard/transactions` after 2 seconds using `useRouter`. On API error, sets `error` state while preserving the preview (no data loss). `handleReset` now also resets `savedCount`. The `"success"` step renders a confirmation screen with insert/skip counts and manual navigation buttons ("Upload Another", "View Transactions").

**Reason:** Completes the upload flow from Phase 2 proof-of-concept to production-ready data persistence. Dedup skip count is surfaced to the user per US-2 and US-5 acceptance criteria.

---

#### `src/app/dashboard/page.tsx` — UI

**Symbols changed:** `DashboardPage`, `getDashboardStats`, `StatCard`

**Before:**
The dashboard page was either a placeholder or lacked server-side data fetching with real database queries. No aggregate stats, no monthly grouping, and no stat cards existed. The page was not a server component with live DB data.

**After:**
Converted to an `async` server component. Introduces `getDashboardStats(userId)` — an async helper that runs 3 parallel Prisma queries: `transaction.count`, `statement.count`, and `transaction.groupBy(["type"])` filtered to the current calendar month. Derives `monthlyDebit`, `monthlyCredit`, and `netChange` from the grouped results. Renders a conditional empty state (with upload CTA) when `txnCount === 0`. When data exists, renders a 4-column `StatCard` grid (Total Transactions, Statements Uploaded, Monthly Debits, Monthly Credits) plus a standalone "Month Net Change" card with sign-aware colour coding. Adds a `StatCard` sub-component for reusable stat tile rendering.

**Reason:** Completes US-5 — gives users a financial overview without needing to navigate to the Transactions page.

---

## Regression Risks

| Risk | File(s) | Level | Detail |
|---|---|---|---|
| Decimal serialization in API response | `src/app/api/transactions/route.ts` | MEDIUM | `Decimal` fields are serialized via `.toString()` in the GET handler. If a consumer expects a `number`, this is a silent type mismatch. The transactions page handles this correctly, but any future direct consumers of the API response must account for string amounts. |
| `Decimal` passed to `formatCurrency` as string | `src/lib/format.ts`, `src/app/dashboard/transactions/page.tsx`, `src/app/dashboard/page.tsx` | LOW | `formatCurrency` accepts `string \| number`. Passing a stringified Decimal (e.g. `"1234.50"`) is handled via `parseFloat`. Loss of precision is theoretically possible for very large values, but within the `Decimal(12,2)` range this is safe. |
| TransactionFilters wrapped in Suspense | `src/app/dashboard/transactions/page.tsx`, `src/components/transactions/TransactionFilters.tsx` | MEDIUM | `TransactionFilters` uses `useSearchParams()`, which requires a `<Suspense>` boundary in Next.js App Router. If the page does not provide one, this will throw at runtime. The current implementation renders `TransactionFilters` directly without an explicit Suspense wrapper — this may produce a Next.js build warning or require `export const dynamic = "force-dynamic"`. |
| Statement always created even when all rows are duplicates | `src/app/api/transactions/route.ts` | LOW | A `Statement` record is created unconditionally inside the `$transaction` block even if `toInsert.length === 0`. This results in orphan Statement rows with `txnCount = 0` when a fully-duplicate file is re-uploaded. |
| Dashboard `netChange` float arithmetic | `src/app/dashboard/page.tsx` | LOW | `netChange` is computed as `parseFloat(monthlyCredit) - parseFloat(monthlyDebit)` after `.toString()` on `Decimal`. For values within normal INR ranges this is fine, but it re-introduces IEEE 754 arithmetic after the Decimal aggregation. |
| User deletion cascade — unrecoverable data loss | `prisma/schema.prisma` | MEDIUM | `onDelete: Cascade` on both `Statement` and `Transaction` FK to `User` means deleting a user permanently and immediately destroys all their financial history. No soft-delete mechanism exists. |

---

## Dependencies Affected

No dependency changes.

---

## Decisions & Tradeoffs

| Decision | Alternatives Considered | Rationale |
|---|---|---|
| `SHA-256(userId:date:amount:type:balance)` as dedup key | Include `description` in hash; use composite unique index instead | Description text varies across re-exports of the same statement (whitespace, encoding). Hash without description gives stable identity. Unique DB constraint handles race conditions without application-level locking. |
| `Decimal(12,2)` for `amount` and `balance` | `Float`, `Double`, `BigInt` cents | `Float` produces rounding drift in financial aggregates. `BigInt` cents would require all display code to divide by 100. `Decimal(12,2)` stores exact values and Prisma serializes them as `Decimal` objects. |
| Denormalized `userId` on `Transaction` | Join through `Statement` to resolve `userId` | Allows direct `WHERE userId = ?` queries on the `Transaction` table without a join, which is critical for the paginated list and aggregate queries at scale. |
| URL-based filter state in `TransactionFilters` | React local state, Zustand, or server-only query params | URL state makes filters bookmarkable and shareable, and allows the server component to receive filters without a client fetch waterfall. `useRouter.push()` triggers a full server re-render with new params. |
| Server component for `TransactionsPage` and `DashboardPage` | `useEffect` + client-side fetch | Server components eliminate client-side fetch waterfalls and keep DB credentials server-only. Data is fetched at request time with zero client JS for the data layer. |
| Statement created even when `toInsert.length === 0` | Skip statement creation for all-duplicate uploads | Simplifies the transaction block — avoids conditional branching. The cost is orphan Statement rows for dedup-only uploads. Acceptable for MVP; can be revisited if Statement history UI is added. |

---

## Rollback Notes

To fully revert all Phase 3 changes:

1. **Revert `prisma/schema.prisma`** — remove the `TransactionType` enum, `Statement` model, `Transaction` model, and the `statements`/`transactions` relation fields from `User`.
2. **Delete migration folder** — remove `prisma/migrations/20260221114713_add_statement_transaction/` entirely.
3. **Roll back the database** — run `npx prisma migrate reset` (drops all data and re-runs only the initial migration) **or** manually execute `DROP TABLE "Transaction"; DROP TABLE "Statement"; DROP TYPE "TransactionType";` in PostgreSQL, then delete the migration record from `_prisma_migrations`.
4. **Revert `src/app/dashboard/upload/page.tsx`** — replace `handleConfirm` with the original `setTimeout` stub, remove `isSubmitting`/`savedCount`/`skippedCount` state, remove the `useEffect` redirect, remove the `"success"` step from `UploadStep`, and remove the success JSX block.
5. **Delete `src/app/api/transactions/route.ts`** — remove file entirely (was not present before Phase 3).
6. **Delete `src/app/dashboard/transactions/page.tsx`** — remove file entirely (was not present before Phase 3).
7. **Revert `src/app/dashboard/page.tsx`** — restore the pre-Phase-3 version (remove `getDashboardStats`, `StatCard`, all stat card JSX, and the server component `async` declaration).
8. **Delete `src/components/transactions/TransactionFilters.tsx`** — remove file entirely.
9. **Delete `src/lib/format.ts`** — remove file entirely (created in Phase 3; verify no Phase 2 components imported it before deleting).
10. **Run `npx prisma generate`** — regenerate the Prisma client against the rolled-back schema.
11. **Run `npm run build`** — confirm the build passes with all Phase 3 imports removed.

---

## Related Previous Logs

- `2026-02-20_phase2-pdf-extraction-engine.md` — Phase 2 implemented the upload page (`upload/page.tsx`) and `handleConfirm` stub that Phase 3 replaces with a real API call.
- `2026-02-20_phase2-transaction-type-fix.md` — Fixed transaction type detection logic in the HDFC parser; the `ParsedTransaction` type and `type` field produced here are the inputs consumed by the Phase 3 `POST /api/transactions` route.
