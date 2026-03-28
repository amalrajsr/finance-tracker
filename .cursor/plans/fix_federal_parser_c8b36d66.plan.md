---
name: Fix Federal Parser
overview: "Fix the Federal Bank parser's `parseTransactionLine` to match the actual pdfjs output: 2 amounts (not 3) before Cr/Dr, and handle the split header rows."
todos:
  - id: fix-tail-regex
    content: Change tail regex from 3-amount to 2-amount pattern and remove inferAmountAndType
    status: completed
  - id: add-balance-delta
    content: Add opening balance extraction and post-processing pass to infer debit/credit from balance deltas
    status: completed
  - id: handle-split-header
    content: Add split-header fragments ('type details', '/cr') to isIgnorableRow so they don't generate errors
    status: completed
isProject: false
---

# Fix Federal Bank Parser

## Root Cause

The parser was written assuming 3 amounts per row (withdrawal, deposit, balance), but the actual pdfjs output only has **2 amounts** per row because the empty column (withdrawal or deposit) produces no text. The header is also split across 3 lines, causing the line immediately after the header to be `"Type Details /CR"` which is misidentified.

## Extracted line format (actual)

```
22-FEB-2026 22-FEB-2026 UPIOUT/... TFR S44009912 150.00 2755.21 Cr
```

- Two dates, description text (may include TFR/Tran ID), then exactly **2 decimal amounts** + `Cr`/`Dr`
- The Cr/Dr suffix is the **balance sign**, not the transaction type
- Transaction type must be inferred from consecutive balance comparison (same strategy HDFC uses)

## Changes in `[src/lib/pdf/banks/federal.ts](src/lib/pdf/banks/federal.ts)`

### 1. Fix `parseTransactionLine` tail regex (line 204-206)

Change from requiring 3 amounts to requiring **2 amounts + Cr/Dr**:

```
// Current (broken):
/\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+(Cr|Dr)\s*$/i

// Fixed:
/\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+(Cr|Dr)\s*$/i
```

The two captured amounts are: `[1]` = transaction amount, `[2]` = closing balance.

### 2. Remove `inferAmountAndType` logic, use balance-delta instead

Since we no longer know from the line alone whether it's a withdrawal or deposit, change the parser to:

- Set a placeholder type (`"debit"`) during line parsing
- After all rows are parsed, do a post-processing pass comparing consecutive balances (like HDFC does) to determine actual debit/credit:
  - `balance[i] < balance[i-1]` => debit
  - `balance[i] > balance[i-1]` => credit
  - For the first transaction, compare against `openingBalance` (extract from the `"Opening Balance 2905.21 Cr"` line)

### 3. Extract opening balance

Add a helper to capture the opening balance from lines like `"Opening Balance 2905.21 Cr"`. This is needed to correctly type the very first transaction.

### 4. Handle split header (lines after `headerIndex`)

The header splits across 3 lines. After finding the header row, skip additional non-date, non-transaction lines that are part of the header. The existing `isContinuationLine` + `isIgnorableRow` already handle `"Type Details /CR"` and `"Opening Balance..."` correctly (they'll be treated as continuation of nothing or ignorable), but we should add `"type details"` and `"/cr"` fragments to `isIgnorableRow` to be safe.

### 5. Fix `findHeaderRow` for robustness

The current `findHeaderRow` works with the extracted data, but the check for `tran type` may fail since it appears on a different line (`"Tran"` on line above, `"Type"` on line below). The middle line `"Date Value Date Particulars Tran ID Withdrawals Deposits Balance"` has `tran id` but not `tran type`. Since the current code uses `||` (`lower.includes("tran type") || lower.includes("tran id")`), this already works. No change needed.