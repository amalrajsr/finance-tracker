# AI Change Log: Phase 2 — Transaction Type Fix & Preview Table Enhancement

## Meta

- **Date:** 2026-02-20
- **Trigger:** user-invoked
- **Calling Agent/Skill:** frontend-root-cause-intelligence, frontend-fix-executor, frontend-fix-verifier, logger
- **Task Description:** Fix a bug where all parsed HDFC transactions were classified as "credit" regardless of actual type, and split the single "Amount" column in the preview table into separate "Debit" and "Credit" columns per PRD US-4.
- **Files Affected:** 3 (2 modified, 1 config modified by user)
- **Confidence:** HIGH — all changes verified via tool outputs and diff review

---

## Summary

Replaced the broken `determineTransactionType()` function in the HDFC parser with a balance-comparison post-processing approach that determines debit/credit by comparing consecutive closing balances. Updated `TransactionPreview.tsx` to display separate Debit and Credit columns instead of a single Amount column. Removed a debug `console.log` from the preview component. User also increased the page limit from 20 to 30 in `extractor.ts`.

---

## Changes

### Modified Files

#### `src/lib/pdf/banks/hdfc.ts` — LOGIC

**Symbols changed:** `parse` (method in `hdfcParser`), `parseTransactionLine`, `determineTransactionType` (deleted), `inferTypeFromDescription` (created)

**Before:**
`parseTransactionLine()` called `determineTransactionType()` inline for each row. `determineTransactionType()` (63 lines) used positional heuristics to guess debit/credit — checking the character index of amounts against `line.length / 2` midpoint, and falling back to keyword detection. This systematically returned "credit" for all transactions because pdf.js text extraction destroys column spacing.

**After:**
`parseTransactionLine()` returns `type: "debit"` as a placeholder. The `parse()` method now includes a post-processing loop (lines 108–120) that determines transaction type by comparing consecutive closing balances: `currBalance < prevBalance → "debit"`, else `"credit"`. The first transaction uses `inferTypeFromDescription()` (15 lines) which checks narration keywords (salary, credit, interest, refund, cashback). `determineTransactionType()` has been fully deleted.

**Reason:** The positional heuristic was fundamentally broken because pdf.js joins text items with single spaces, destroying the column layout that HDFC statements use to separate Withdrawal/Deposit/Balance columns. Balance comparison is deterministic and independent of text layout.

---

#### `src/components/upload/TransactionPreview.tsx` — UI

**Symbols changed:** `TransactionPreview` (component JSX)

**Change 1 — Column split:**

**Before:**
Single "Amount" column header. Amount cell rendered with conditional color (`text-debit` / `text-credit`) and a `−` / `+` prefix symbol based on `txn.type`.

**After:**
Two separate column headers: "Debit" and "Credit". Debit cell renders `₹{amount}` with `text-debit` class only when `txn.type === "debit"`, otherwise empty. Credit cell renders `₹{amount}` with `text-credit` class only when `txn.type === "credit"`, otherwise empty.

**Reason:** PRD US-4 specifies the preview table must have separate Withdrawal/Deposit columns. User requested "Debit" and "Credit" as header labels.

**Change 2 — Debug log removal:**

**Before:**
`console.log(transactions, "transactions")` present at line 21 inside the component body.

**After:**
Debug log removed.

**Reason:** Cleanup of temporary debug statement added by user during investigation.

---

#### `src/lib/pdf/extractor.ts` — CONFIG

**Symbols changed:** `MAX_PAGES` constant

**Before:**
`const MAX_PAGES = 20;`

**After:**
`const MAX_PAGES = 30;`

**Reason:** User-initiated change to support longer HDFC statements (up to 30 pages).

---

### Created Files

*No files were created.*

---

### Deleted Files

*No files were deleted.*

---

## Regression Risks

| Risk | File(s) | Level | Detail |
|---|---|---|---|
| First transaction in statement may be misclassified | `src/lib/pdf/banks/hdfc.ts` | LOW | `inferTypeFromDescription()` keyword fallback is used for the first row only (no previous balance). Credits with unusual narrations (e.g. "NEFT from friend") may default to debit. At most 1 row affected per statement. |
| Column count changed in preview table | `src/components/upload/TransactionPreview.tsx` | LOW | Table now has 6 columns (checkbox, date, description, debit, credit, balance) instead of 5. Any responsive styles or print layouts targeting the table may need adjustment. |
| Page limit increased | `src/lib/pdf/extractor.ts` | LOW | Increasing MAX_PAGES from 20 to 30 may increase browser memory usage for very large PDFs. Original PRD specified 20 pages. |

---

## Dependencies Affected

No dependency changes.

---

## Decisions & Tradeoffs

| Decision | Alternatives Considered | Rationale |
|---|---|---|
| Balance comparison for type detection | (A) X-coordinate extraction from pdf.js, (B) Hybrid balance + keyword | Balance comparison is simplest correct solution. X-coordinate approach requires interface changes to extractor. Hybrid adds marginal value since `balance === prevBalance` is impossible for real transactions. |
| Keyword fallback for first transaction | Use opening balance from statement header | Opening balance extraction would require additional parsing logic. Keyword fallback is acceptable for single-row edge case and defaults conservatively to "debit". |
| Column headers "Debit"/"Credit" | "Withdrawal"/"Deposit" (PRD original) | User explicitly requested "Debit" and "Credit" terminology. |

---

## Rollback Notes

1. **`src/lib/pdf/banks/hdfc.ts`**: Revert to restore `determineTransactionType()` function (lines 219–281 in original) and remove the balance-comparison loop (lines 108–120) and `inferTypeFromDescription()` function. Restore `type = determineTransactionType(line, amount)` call in `parseTransactionLine()`. Restore `let type: "debit" | "credit"` variable declaration.
2. **`src/components/upload/TransactionPreview.tsx`**: Replace the two column headers ("Debit", "Credit") with single "Amount" header. Replace the two body cells with the original single amount cell using conditional `−`/`+` prefix and `text-debit`/`text-credit` class.
3. **`src/lib/pdf/extractor.ts`**: Change `MAX_PAGES` from `30` back to `20`.

---

## Related Previous Logs

No related previous logs found.
