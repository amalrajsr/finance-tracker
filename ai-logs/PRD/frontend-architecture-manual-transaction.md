# Frontend Architecture Blueprint — Manual Transaction Entry

**Source PRD:** `ai-logs/PRD/manual-transaction-entry.md`  
**Version:** 1.0  
**Date:** 2026-03-16  
**Scale:** Medium  
**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Zod v4, next-auth v5  

---

## 1. Feature Summary

Allow authenticated users to **manually create, edit, and delete transactions** from the Transactions page. Triggered via an "Add Transaction" button in the page header. A modal dialog hosts the form. Edit and Delete actions are surfaced on rows/cards flagged as `isManual = true`. After each mutation the server-rendered list is revalidated via `router.refresh()`.

---

## 2. Extracted Frontend Requirements

| FR-ID | UI Requirement | Notes |
|---|---|---|
| FR-01 | "Add Transaction" button in the transactions page header | Visible on both desktop and mobile |
| FR-02 | Modal opens on button click, contains the entry form | Accessible, focus-trapped |
| FR-03 | Form fields: Amount, Date, Type (debit/credit), Description, Category (optional) | — |
| FR-04 | Amount validated: positive number, ≤ 2 decimal places | Client-side Zod |
| FR-05 | Date validated: not in the future | Client-side Zod |
| FR-06 | Amount, Date, Type, Description are required | Category optional |
| FR-07 | On success: persist and mark `isManual = true` | Server responsibility |
| FR-08 | On success: modal closes, inline toast shown | — |
| FR-09 | List updates without full navigation | `router.refresh()` |
| FR-10 | "Edit" action visible only on `isManual = true` rows/cards | Icon button |
| FR-11 | Edit opens same modal pre-populated | Reuse form component |
| FR-12 | All form fields editable in edit mode | — |
| FR-13 / FR-14 | On edit success: update reflected in list, modal closes, toast shown | — |
| FR-15 | Edit only available on `isManual = true` rows | Conditional render |
| FR-16 | "Delete" action visible only on `isManual = true` rows/cards | — |
| FR-17 | Delete requires inline confirmation before executing | Confirm UI within row/card |
| FR-18 / FR-19 | On delete success: row removed, toast shown | — |
| FR-20 | Delete only available on `isManual = true` rows | Conditional render |

**UI States per operation:**

| State | Create | Edit | Delete |
|---|---|---|---|
| Idle | Button in header | Edit icon on row | Delete icon on row |
| Active | Modal open, form empty | Modal open, form pre-filled | Inline confirm prompt |
| Loading | Submit button disabled + spinner | Submit button disabled + spinner | Delete button disabled + spinner |
| Success | Modal closed, toast shown, list refreshed | Same | Row removed, toast shown |
| Error | Error banner inside modal | Same | Error shown inline |

**Authentication:** Session is required for all mutations. Retrieved server-side (next-auth). No realtime requirements. No SEO requirements (authenticated route).

---

## 3. Routing Strategy

No new routes are introduced. The feature is entirely **modal-based** within the existing route.

```
/dashboard/transactions          ← Existing Server Component page
  Modal (overlay, no URL change) ← Rendered as a Client Component portal
```

**Layout boundaries:** The existing `dashboard/layout.tsx` is unchanged. The modal renders as a React portal mounted to `document.body` to avoid z-index conflicts with the sidebar.

**Protected:** `ASSUMED` — session gate already exists at the dashboard layout level via next-auth.

---

## 4. Component Architecture

### Hierarchy

```
TransactionsPage (Server Component — existing)
├─ TransactionPageHeader (Client Component — NEW)
│   └─ AddTransactionButton (Presentational — NEW)
│       └─ TransactionModal (Client Component — NEW)
│           └─ TransactionForm (Client Component — NEW)
│               ├─ AmountField (Presentational — NEW)
│               ├─ DateField (Presentational — NEW)
│               ├─ TypeSelect (Presentational — NEW)
│               ├─ DescriptionField (Presentational — NEW)
│               └─ CategoryDropdown (Presentational — reuse/adapt CategorySelect)
├─ TableRow (Client Component — MODIFIED)
│   ├─ [existing cells...]
│   ├─ ManualTransactionActions (Client Component — NEW)
│   │   ├─ EditTransactionTrigger (Presentational — NEW)
│   │   └─ DeleteTransactionTrigger (Presentational — NEW)
│   └─ TransactionModal (reused, edit mode)
└─ MobileCard (Client Component — MODIFIED)
    └─ ManualTransactionActions (same component)
```

### Requirement Traceability

| FR-ID | Component |
|---|---|
| FR-01 | `TransactionPageHeader` → `AddTransactionButton` |
| FR-02 | `TransactionModal` |
| FR-03 | `TransactionForm` + sub-fields |
| FR-04 | `AmountField` + Zod schema |
| FR-05 | `DateField` + Zod schema |
| FR-06 | Zod schema (required fields) |
| FR-07, FR-08, FR-09 | `TransactionForm` → `useManualTransaction` hook |
| FR-10, FR-11, FR-15 | `ManualTransactionActions` → `EditTransactionTrigger` |
| FR-12 | `TransactionForm` (edit mode, pre-filled) |
| FR-13, FR-14 | `useManualTransaction` → `editTransaction` |
| FR-16, FR-17, FR-20 | `ManualTransactionActions` → `DeleteTransactionTrigger` |
| FR-18, FR-19 | `useManualTransaction` → `deleteTransaction` |

### Component Responsibilities

**`TransactionPageHeader`** *(Client Component)*  
- Replaces the existing inline header JSX in `page.tsx`  
- Owns the `isModalOpen` state for create flow  
- Renders `AddTransactionButton` and the total count text  
- Receives `categories` and `totalEver` as props from the Server Component  

**`TransactionModal`** *(Client Component)*  
- Renders as a React portal over `document.body`  
- Accepts `mode: "create" | "edit"` and optional `initialValues`  
- Handles open/close state via `isOpen` + `onClose` props  
- Focus trap on open; closes on Escape key or backdrop click  
- Contains `TransactionForm`  

**`TransactionForm`** *(Client Component)*  
- Manages form state with `React.useState` (no heavy form library needed for 5 fields)  
- Validates on submit using shared Zod schema (`transaction-form.schema.ts`)  
- Calls `useManualTransaction` hook for mutations  
- Displays field-level validation errors inline  
- Displays a top-of-form error banner for API errors (duplicate, network failure)  

**`ManualTransactionActions`** *(Client Component)*  
- Conditionally rendered only when `txn.isManual === true`  
- Manages `deleteConfirming: boolean` local state for the confirmation step  
- Renders Edit icon → triggers `onEditClick` callback  
- Renders Delete icon → toggles `deleteConfirming` → renders confirm/cancel  
- Calls `useManualTransaction` hook for delete  

**`CategoryDropdown`** *(Presentational — adapted from `CategorySelect`)*  
- A simplified, controlled version of the existing `CategorySelect` for use inside the form  
- Does NOT include the rule-creation sub-flow (that is for existing transactions only)  
- Props: `value: string | null`, `onChange: (id: string | null) => void`, `categories: CategoryOption[]`

---

## 5. State Strategy

| State | Type | Owner | Tool |
|---|---|---|---|
| `isCreateModalOpen` | UI state | `TransactionPageHeader` | `React.useState` |
| `isEditModalOpen` | UI state | `ManualTransactionActions` (per row) | `React.useState` |
| `deleteConfirming` | UI state | `ManualTransactionActions` (per row) | `React.useState` |
| Form field values | Form state | `TransactionForm` | `React.useState` (per field) |
| Form validation errors | Derived state | `TransactionForm` | Derived from Zod parse result |
| Submission loading | UI state | `TransactionForm` | `React.useState` |
| API error | UI state | `TransactionForm` | `React.useState` |
| Toast notification | UI state | `useToast` hook (global) | `React.useState` in context |
| Transaction list | Server state | `TransactionsPage` (RSC) | `router.refresh()` triggers re-fetch |

**Global state:** A lightweight toast context (`ToastProvider`) is needed to surface success/error messages from deeply nested client components. If a `ToastProvider` already exists globally, reuse it; otherwise create one scoped to the dashboard layout.

**No TanStack Query** is used for this feature. The transaction list is a Server Component — mutations trigger `router.refresh()` which re-runs the server fetch. This keeps the architecture simple and consistent with the existing pattern.

---

## 6. Data Fetching Strategy

### Initial Data (Existing — unchanged)

The `TransactionsPage` Server Component fetches transactions and categories via Prisma directly. `categories` are passed as props to `TransactionPageHeader` (for the create form) and already flow to `TableRow` / `MobileCard` via `SerializedTransaction.categories`.

### Mutations (New — Client-initiated)

All three mutations follow the same pattern:

```
Client Component → fetch() → /api/transactions/manual[/:id] → router.refresh()
```

| Operation | Method | Endpoint | On Success |
|---|---|---|---|
| Create | POST | `/api/transactions/manual` | `router.refresh()` + close modal + toast |
| Edit | PATCH | `/api/transactions/manual/:id` | `router.refresh()` + close modal + toast |
| Delete | DELETE | `/api/transactions/manual/:id` | `router.refresh()` + toast |

**No optimistic updates** are implemented in v1. `router.refresh()` re-renders the Server Component with fresh data from the DB. This is the correct approach given the existing pattern (Server Component list) and avoids complexity.

**Revalidation:** `router.refresh()` is called from within `useManualTransaction` hook after a confirmed successful API response.

**Authentication:** Sessions are validated server-side on each API route using `auth()` from next-auth. The client does not pass tokens manually.

---

## 7. Data Flow

### Flow 1 — Create Transaction

```
User clicks "Add Transaction"
→ TransactionPageHeader: setIsCreateModalOpen(true)
→ TransactionModal renders (mode="create", empty fields)
→ User fills form fields
→ User clicks "Save Transaction"
→ TransactionForm: run Zod validation
  → If invalid: setErrors(zodErrors), abort
→ TransactionForm: setIsSubmitting(true)
→ useManualTransaction.create(payload)
  → POST /api/transactions/manual
    → [Loading state]: submit button disabled + spinner
  → On 201:
    → router.refresh()
    → onClose() → modal closes
    → showToast("Transaction added successfully")
  → On 409 DUPLICATE:
    → setApiError("A similar transaction already exists.")
    → setIsSubmitting(false)
  → On 5xx / network error:
    → setApiError("Failed to save. Please try again.")
    → setIsSubmitting(false)
```

### Flow 2 — Edit Transaction

```
User clicks Edit icon on a manual transaction row/card
→ ManualTransactionActions: setIsEditModalOpen(true)
→ TransactionModal renders (mode="edit", initialValues=txn)
→ TransactionForm pre-populated
→ User modifies fields → clicks "Save Changes"
→ TransactionForm: Zod validation
→ useManualTransaction.edit(id, payload)
  → PATCH /api/transactions/manual/:id
    → [Loading state]: submit button disabled + spinner
  → On 200:
    → router.refresh()
    → onClose()
    → showToast("Transaction updated")
  → On 403:
    → setApiError("You don't have permission to edit this transaction.")
  → On 5xx / network:
    → setApiError("Failed to update. Please try again.")
```

### Flow 3 — Delete Transaction

```
User clicks Delete icon on a manual transaction row/card
→ ManualTransactionActions: setDeleteConfirming(true)
→ Inline confirm prompt shown: "Delete? This cannot be undone."
→ User clicks "Confirm"
→ ManualTransactionActions: setIsDeleting(true)
→ useManualTransaction.delete(id)
  → DELETE /api/transactions/manual/:id
    → [Loading state]: confirm button disabled + spinner
  → On 204:
    → router.refresh()
    → showToast("Transaction deleted")
  → On 403:
    → show inline error: "Permission denied"
    → setDeleteConfirming(false)
  → On 5xx / network:
    → show inline error: "Failed to delete. Please try again."
    → setIsDeleting(false)

User clicks "Cancel" on confirm prompt
→ setDeleteConfirming(false)
→ Returns to normal row state
```

---

## 8. Reusable Abstractions

### Existing — Reuse As-Is

| Abstraction | Location | Usage |
|---|---|---|
| `CategoryOption` type | `_components/CategorySelect.tsx` | Reused in `CategoryDropdown` props |
| `CategoryBadge` | `_components/CategoryBadge.tsx` | Reused inside `CategoryDropdown` |
| `formatCurrency`, `formatDate` | `@/lib/format` | Display in form date field default, toast messages |
| `auth()` | `@/lib/auth` | Server-side session validation in API routes |
| `db` | `@/lib/db` | Prisma client in API routes |

### New — Feature-Scoped

| Abstraction | Location | Purpose |
|---|---|---|
| `useManualTransaction` | `transactions/_hooks/use-manual-transaction.ts` | Encapsulates create/edit/delete fetch logic + `router.refresh()` |
| `transactionFormSchema` | `transactions/_utils/transaction-form.schema.ts` | Shared Zod schema (client + server) for form validation |
| `useToast` (if not global) | `hooks/use-toast.ts` | Global toast state — create only if not already present |

### `useManualTransaction` Hook Interface

```typescript
function useManualTransaction(): {
  create: (payload: CreateTransactionPayload) => Promise<{ ok: boolean; error?: string }>;
  edit: (id: string, payload: EditTransactionPayload) => Promise<{ ok: boolean; error?: string }>;
  remove: (id: string) => Promise<{ ok: boolean; error?: string }>;
  isLoading: boolean;
}
```

### `transactionFormSchema` (Zod)

```typescript
const transactionFormSchema = z.object({
  amount: z.number({ invalid_type_error: "Amount is required" })
    .positive("Amount must be greater than 0")
    .multipleOf(0.01, "Max 2 decimal places"),
  date: z.string()
    .refine(d => !isNaN(Date.parse(d)), "Invalid date")
    .refine(d => new Date(d) <= new Date(), "Date cannot be in the future"),
  type: z.enum(["debit", "credit"]),
  description: z.string().min(1, "Description is required").max(255),
  categoryId: z.string().nullable().optional(),
});
```

---

## 9. Edge Cases

| EC-ID | Scenario | Frontend Handling |
|---|---|---|
| EC-01 | Amount = 0 or negative | Zod error inline: "Amount must be greater than 0" |
| EC-02 | Future date selected | Zod error inline: "Date cannot be in the future" |
| EC-03 | Description > 255 chars | Zod error inline: "Description must be 255 characters or fewer" |
| EC-04 | Double-click "Save" | Submit button disabled + `isSubmitting` guard in hook |
| EC-05 | Duplicate transaction (409) | Error banner inside modal; form stays open |
| EC-06 | Session expired mid-flow | Fetch returns 401 → redirect to `/login` via `router.push('/login')` |
| EC-07 | Edit non-manual transaction via UI | `isManual` check in `ManualTransactionActions` prevents render |
| EC-08 | Network timeout | `try/catch` in hook → error banner in modal |
| EC-09 | Category list empty | `CategoryDropdown` renders empty state: "No categories available" |
| EC-10 | User cancels delete confirm | `setDeleteConfirming(false)` restores row to normal |
| EC-11 | Edit without changes | Proceeds normally; server updates `updatedAt`; success toast shown |
| EC-12 | New transaction outside current filter | `router.refresh()` re-renders with same filters; transaction may not appear; toast confirms creation |

---

## 10. Performance Considerations

- **No memoization** required for modal or form — they mount/unmount on open/close, so stale closures are not a concern.
- **No virtualization** — transaction list uses server-side pagination (50 per page). Client renders ≤ 50 rows.
- **`router.refresh()` cost** — triggers a full Server Component re-render for the page. This re-fetches from the DB. Acceptable for a low-frequency mutation flow. No additional optimization needed in v1.
- **Modal lazy-loading** — `ASSUMED` not needed for v1. The modal component is small (<200 lines) and is always scoped to the transactions route, so it will be part of the route chunk.
- **Debounce on Save:** The submit button is disabled on first click (EC-04 guard), which is sufficient protection against rapid double-submission without needing debounce.

---

## 11. Folder Structure

Changes are scoped to the `transactions` feature directory and shared `hooks/`. No new routes are created.

```
src/
├── app/
│   ├── dashboard/
│   │   └── transactions/
│   │       ├── _components/
│   │       │   ├── CategoryBadge.tsx          ← [EXISTING — unchanged]
│   │       │   ├── CategorySelect.tsx         ← [EXISTING — unchanged]
│   │       │   ├── CategoryDropdown.tsx       ← [NEW] Simplified category picker for the form
│   │       │   ├── EmptyState.tsx             ← [EXISTING — unchanged]
│   │       │   ├── MobileCard.tsx             ← [MODIFIED] Add ManualTransactionActions
│   │       │   ├── NoFilterResults.tsx        ← [EXISTING — unchanged]
│   │       │   ├── Pagination.tsx             ← [EXISTING — unchanged]
│   │       │   ├── TableRow.tsx               ← [MODIFIED] Add ManualTransactionActions
│   │       │   ├── TransactionPageHeader.tsx  ← [NEW] Extracts header, owns create modal trigger
│   │       │   ├── TransactionModal.tsx       ← [NEW] Modal shell (portal, focus trap)
│   │       │   ├── TransactionForm.tsx        ← [NEW] Form with fields and validation
│   │       │   ├── ManualTransactionActions.tsx ← [NEW] Edit + Delete actions for manual rows
│   │       │   └── TransactionFilters.tsx     ← [EXISTING — unchanged]
│   │       ├── _hooks/
│   │       │   └── use-manual-transaction.ts  ← [NEW] Mutation logic + router.refresh()
│   │       ├── _utils/
│   │       │   └── transaction-form.schema.ts ← [NEW] Shared Zod schema (client + server)
│   │       ├── types.ts                       ← [MODIFIED] Add isManual to SerializedTransaction
│   │       └── page.tsx                       ← [MODIFIED] Use TransactionPageHeader, pass isManual
│   │
│   └── api/
│       └── transactions/
│           └── manual/
│               ├── route.ts                   ← [NEW] POST handler (create)
│               └── [id]/
│                   └── route.ts               ← [NEW] PATCH + DELETE handlers (edit, delete)
│
└── hooks/
    └── use-toast.ts                           ← [NEW or REUSE] Global toast state
```

---

## 12. Tradeoffs

### SSR vs CSR for the Transaction List

**Decision:** Keep the list as a Server Component; use `router.refresh()` for revalidation after mutations.

| Option | Pro | Con |
|---|---|---|
| Server Component + `router.refresh()` | Consistent with existing pattern; no client state for list; simple | Full page re-render on each mutation |
| TanStack Query (client-side list) | Optimistic updates; granular invalidation | Requires converting `page.tsx` to client-fetcher; breaks existing Server Component architecture |

**Chosen:** Server Component + `router.refresh()`. The list is paginated (50 rows), so re-render cost is acceptable.

---

### Global State vs Local State for Toast

**Decision:** Lightweight React Context (`ToastProvider`) at the dashboard layout level.

| Option | Pro | Con |
|---|---|---|
| Zustand for toast | Familiar, no prop drilling | Overkill for a single toast; adds a dependency |
| React Context | Lightweight, scoped to dashboard | Slightly more boilerplate |
| Alert/console fallback | Zero setup | Poor UX; inconsistent with app design |

**Chosen:** React Context. Zustand is not already a project dependency — avoid adding it for toast alone.

---

### Form State — useState vs React Hook Form

**Decision:** Plain `React.useState` per field.

| Option | Pro | Con |
|---|---|---|
| `React.useState` | No new dependency; 5 fields is simple | Slightly more verbose |
| React Hook Form | Ergonomic for large forms | Adds dependency; overkill for 5 fields |

**Chosen:** `React.useState`. Five fields do not justify an additional library.

---

### Abstraction vs Simplicity for CategoryDropdown

**Decision:** Create a new simplified `CategoryDropdown` instead of reusing `CategorySelect`.

`CategorySelect` includes the rule-creation sub-flow which is not part of the manual entry form. Reusing it would require conditional branching and prop-threading, reducing clarity. A new focused component is cleaner.
