# AI Change Log: Phase 2 — Client-Side PDF Parsing Engine

## Meta

- **Date:** 2026-02-20
- **Trigger:** user-invoked
- **Calling Agent/Skill:** logger
- **Task Description:** Implement Phase 2 of the finance tracker — a fully client-side PDF parsing engine that decrypts and extracts transaction data from HDFC bank statement PDFs entirely within the browser. Raw PDF data and passwords never leave the device; only structured, user-confirmed transaction JSON is sent to the server.
- **Files Affected:** 9 created
- **Confidence:** HIGH — all files reviewed via tool outputs

---

## Summary

Implemented a complete client-side PDF extraction pipeline for HDFC bank statements. Created a type system (`types.ts`), a pdf.js extraction layer (`extractor.ts`), a parser registry with auto-detection (`parser-registry.ts`), an HDFC-specific parser with multi-line narration support (`banks/hdfc.ts`), four UI components (`DropZone`, `PasswordInput`, `ParsingProgress`, `TransactionPreview`), and a full upload page orchestrating the multi-step workflow (`upload/page.tsx`). Transaction type detection uses a balance-comparison algorithm. Added `pdfjs-dist ^5.4.624` as a dependency.

---

## Changes

### Created Files

#### `src/lib/pdf/types.ts` — TYPES

**Purpose:** Core TypeScript interfaces for the PDF parsing pipeline.
**Contents:**
- `ParsedTransaction` — date, description, referenceNumber, amount, type (`"debit"` | `"credit"`), balance
- `ParserResult` — success, bank, statementPeriod, accountNumber, transactions[], errors[]
- `ParserError` — line, raw, reason
- `BankParser` — interface with `bankName`, `detect()`, `parse()`
- `ParsingStage` — union type: idle | reading | decrypting | extracting | parsing | done | error
- `ParsingProgress` — stage, message, percent

---

#### `src/lib/pdf/extractor.ts` — LOGIC

**Purpose:** pdf.js wrapper that reads, decrypts, and extracts text lines from a PDF file entirely in the browser.
**Contents:**
- `extractTextFromPDF(file, password, onProgress)` — validates file size (4MB cap) and page count (30 pages cap), decrypts via `pdfjsLib.getDocument()`, groups text items into lines by Y-coordinate, returns `string[]`
- `PDFExtractionError` — custom error class with specific messages for wrong password, invalid PDF, and unsupported encryption
- Configures pdf.js WASM worker via `GlobalWorkerOptions.workerSrc`
- Reports multi-step progress (reading → decrypting → extracting) via callback

---

#### `src/lib/pdf/parser-registry.ts` — LOGIC

**Purpose:** Bank parser registry with auto-detection — tries each parser's `detect()` method against extracted text.
**Contents:**
- `parseTransactions(textLines)` — iterates registered parsers, returns `ParserResult` from the first match or an "unsupported bank" error
- `registerParser(parser)` — registers a new `BankParser` at runtime
- `getSupportedBanks()` — returns list of supported bank names
- Currently registers `hdfcParser` as the sole parser

---

#### `src/lib/pdf/banks/hdfc.ts` — LOGIC

**Purpose:** HDFC savings account statement parser that converts raw text lines into structured `ParsedTransaction[]`.
**Contents:**
- `hdfcParser` — implements `BankParser` interface with `detect()` and `parse()`
- `detect()` — checks first 30 lines for "HDFC Bank" or column header keywords
- `parse()` — finds header row, iterates subsequent lines, handles multi-line narrations via continuation-line detection, determines debit/credit via balance comparison post-processing
- Helper functions:
  - `findHeaderRow()` — locates the table header by matching column names
  - `parseTransactionLine()` — extracts date (DD/MM/YY → ISO 8601), amounts (Indian notation with commas), reference number, and description from a single line
  - `extractAmounts()` / `parseIndianNumber()` — regex-based Indian number format parsing
  - `convertToISO()` — date format conversion with 2-digit year handling
  - `inferTypeFromDescription()` — keyword fallback for first transaction (salary, credit, interest, refund, cashback)
  - `extractDescription()` / `cleanDescription()` — narration extraction and cleanup
  - `isContinuationLine()` / `isFooterLine()` / `isStatementEnd()` — line classification
  - `extractAccountNumber()` — extracts last 4 digits for privacy
  - `extractStatementPeriod()` — extracts date range from header area

---

#### `src/components/upload/DropZone.tsx` — UI

**Purpose:** Drag-and-drop / file-picker component for PDF uploads.
**Contents:**
- `DropZone` component — accepts `.pdf` files only, validates file type and 4MB size limit
- Drag-over visual feedback (border color, background, scale)
- Inline error display for invalid files
- Keyboard accessible (`Enter` to trigger file picker)
- Hidden `<input type="file" accept=".pdf">` with ref

---

#### `src/components/upload/PasswordInput.tsx` — UI

**Purpose:** PDF password input field with show/hide toggle and privacy reassurance.
**Contents:**
- `PasswordInput` component — controlled input with `value`/`onChange` props
- Show/hide toggle button with eye icon swap
- Privacy badge: "Password stays in your browser — never sent to our servers"
- Disabled state support

---

#### `src/components/upload/ParsingProgress.tsx` — UI

**Purpose:** Multi-step progress indicator showing the parsing pipeline status.
**Contents:**
- `ParsingProgress` component — renders progress bar, stage label with emoji icon, percentage, and status message
- Stage labels: 📄 Reading → 🔓 Decrypting → 📝 Extracting → 🔍 Parsing → ✅ Complete / ❌ Error
- Privacy badge: "Processing entirely in your browser — nothing leaves your device"
- Animated progress bar with CSS transition

---

#### `src/components/upload/TransactionPreview.tsx` — UI

**Purpose:** Preview table with checkboxes for reviewing and selecting extracted transactions before saving.
**Contents:**
- `TransactionPreview` component — renders summary bar (count + error count + selected count) and transaction table
- Table columns: Checkbox, Date, Description, Debit, Credit, Balance (Balance hidden on mobile)
- Debit amounts shown in `text-debit` color, Credit amounts in `text-credit` color
- Select all / deselect all via header checkbox
- Per-row checkbox to include/exclude transactions
- Deselected rows styled with reduced opacity
- "Confirm & Save" button with loading spinner state
- `formatDate()` helper converts ISO back to DD/MM/YYYY for display

---

#### `src/app/dashboard/upload/page.tsx` — UI

**Purpose:** Full upload workflow page orchestrating all components in a multi-step flow.
**Contents:**
- `UploadPage` component — manages state machine: `UploadStep` type (upload → password → parsing → preview → saving → done → error)
- Step 1: `DropZone` for file selection
- Step 2: `PasswordInput` with "Extract Transactions" button
- Step 3: `ParsingProgress` during extraction
- Step 4: `TransactionPreview` for review
- Calls `extractTextFromPDF()` then `parseTransactions()` in sequence
- Error handling with retry capability
- Success state with redirect to transactions list
- Privacy-first messaging throughout

---

### Modified Files

*No pre-existing files were modified as part of the core Phase 2 feature.*

---

### Deleted Files

*No files were deleted.*

---

## Regression Risks

| Risk | File(s) | Level | Detail |
|---|---|---|---|
| First transaction type may be misclassified | `src/lib/pdf/banks/hdfc.ts` | LOW | First row uses keyword fallback (`inferTypeFromDescription`) since there's no previous balance to compare. Credits with unusual narrations may default to "debit". |
| pdf.js WASM worker bundle size | `src/lib/pdf/extractor.ts` | LOW | `pdfjs-dist` includes a WASM worker (~2.5MB) that loads on the upload page. Does not affect other pages due to code splitting. |
| Confirm & Save endpoint not implemented | `src/app/dashboard/upload/page.tsx` | MEDIUM | The `onConfirm` handler sends structured JSON to the server, but the `/api/transactions` bulk insert endpoint is a Phase 3 stub. Saving will not persist data until Phase 3. |

---

## Dependencies Affected

| Dependency | Action | Version |
|---|---|---|
| `pdfjs-dist` | ADDED | `^5.4.624` |

---

## Decisions & Tradeoffs

| Decision | Alternatives Considered | Rationale |
|---|---|---|
| Client-side only parsing (no server involvement) | Server-side parsing with file upload | Privacy-first requirement — raw PDF and password never leave the browser |
| pdf.js for PDF text extraction | pdf-parse, pdfplumber (Python) | pdf.js is the industry standard, runs natively in browsers, handles encrypted PDFs |
| Balance comparison for debit/credit detection | Column-position heuristics, X-coordinate extraction | Balance arithmetic is deterministic and independent of text layout; column positions are unreliable after pdf.js text extraction |
| Parser registry with auto-detection | Hardcoded single-bank parser | Extensible architecture for future bank support (SBI, ICICI, Axis) |
| Y-coordinate grouping for line detection | Naive newline splitting | pdf.js text items don't preserve line breaks; Y-coordinate grouping reconstructs lines from spatial data |
| Indian number format regex | `parseFloat()` directly | HDFC uses `1,00,000.00` notation which standard `parseFloat` cannot handle |

---

## Rollback Notes

1. Delete `src/lib/pdf/` directory (removes `types.ts`, `extractor.ts`, `parser-registry.ts`, `banks/hdfc.ts`)
2. Delete `src/components/upload/` directory (removes `DropZone.tsx`, `PasswordInput.tsx`, `ParsingProgress.tsx`, `TransactionPreview.tsx`)
3. Delete `src/app/dashboard/upload/page.tsx`
4. Remove `pdfjs-dist` from `package.json` and run `npm install`
5. Remove any navigation links pointing to `/dashboard/upload`

---

## Related Previous Logs

- `2026-02-20_phase2-transaction-type-fix.md` — documents a bug fix within Phase 2 where `determineTransactionType()` was replaced with balance comparison
