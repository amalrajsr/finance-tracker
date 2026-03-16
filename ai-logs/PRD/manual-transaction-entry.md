# Engineering PRD — Manual Transaction Entry

**Version:** 1.0  
**Date:** 2026-03-16  
**Status:** Draft  
**Feature Area:** Transactions  

---

## 1. Problem Definition

The finance tracker currently only allows users to add transactions by uploading a bank statement PDF. Users cannot record cash transactions, peer-to-peer payments, or any spending that does not appear on a bank statement. This creates gaps in the transaction ledger and reduces the utility of the app as a holistic personal finance tool.

**Context:**
- Tech Stack: Next.js 16 (App Router), React 19, TypeScript, Prisma ORM (PostgreSQL), next-auth v5, TanStack Query v5, Zod v4, Tailwind CSS v4
- The existing `Transaction` Prisma model has two constraints that affect this feature:
  1. `statementId` is currently **non-nullable** — manually added transactions have no statement source
  2. `dedupHash` is currently `@unique` — must be generated deterministically for manual entries
- Existing transaction types are limited to `debit | credit` (no `transfer` in the current enum)

---

## 2. Objectives & Success Metrics

### Objectives
- Allow authenticated users to manually create a transaction from the Transactions page
- Allow users to edit or delete any manually created transaction
- Persist manual transactions in the existing `Transaction` table with a distinguishing flag

### Success Metrics

| Metric | Target |
|---|---|
| Form submission success rate | ≥ 99% under normal network conditions |
| Time to create a transaction | ≤ 30 seconds from button click to confirmation |
| Validation error display latency | ≤ 200 ms after field blur/submit |
| API response time (p95) | ≤ 500 ms for create/update/delete |

---

## 3. User Roles

| Role | Description |
|---|---|
| Authenticated User | Logged-in user who owns transactions. Can create, edit, and delete their own manually-added transactions. |
| System | Server-side processes responsible for validation, persistence, and dedup hash generation. |

---

## 4. Functional Requirements

### 4.1 Create Transaction

| ID | Requirement |
|---|---|
| FR-01 | A "Add Transaction" button MUST be present in the header area of the Transactions list page, visible on both desktop and mobile viewports. |
| FR-02 | Clicking "Add Transaction" MUST open a modal dialog containing the transaction entry form. |
| FR-03 | The form MUST include the following fields: **Amount** (number), **Date** (date picker), **Type** (select: `debit` / `credit`), **Merchant / Description** (text), **Category** (select from predefined list). |
| FR-04 | Amount MUST be validated as a positive number greater than 0 with at most 2 decimal places. |
| FR-05 | Date MUST be validated to not be in the future (i.e., `date ≤ today`). |
| FR-06 | Amount, Date, Type, and Description are **required fields**. Category is optional. |
| FR-07 | On successful submission, the system MUST persist the transaction in the `Transaction` table with `isManual = true`. |
| FR-08 | On successful submission, the modal MUST close and show an inline confirmation (toast/banner) within the page. |
| FR-09 | On successful submission, the transactions list MUST reflect the new transaction without a full page reload (optimistic update or revalidation). |

### 4.2 Edit Transaction

| ID | Requirement |
|---|---|
| FR-10 | Each manually added transaction row/card MUST display an accessible "Edit" action (icon button or menu item). |
| FR-11 | Clicking "Edit" MUST open the same modal form pre-populated with the transaction's existing values. |
| FR-12 | All fields (Amount, Date, Type, Description, Category) MUST be editable. |
| FR-13 | On successful edit, the system MUST update the existing `Transaction` record and return the updated data. |
| FR-14 | On successful edit, the modal MUST close and show an inline confirmation. The updated transaction MUST reflect in the list. |
| FR-15 | Edit actions MUST only be available on transactions where `isManual = true`. Imported transactions are not editable via this flow. |

### 4.3 Delete Transaction

| ID | Requirement |
|---|---|
| FR-16 | Each manually added transaction row/card MUST display an accessible "Delete" action. |
| FR-17 | Clicking "Delete" MUST show a confirmation prompt before executing deletion (e.g., inline confirm or confirm dialog). |
| FR-18 | On confirmation, the system MUST permanently delete the `Transaction` record from the database. |
| FR-19 | On successful deletion, the transaction MUST be removed from the list and an inline confirmation shown. |
| FR-20 | Delete actions MUST only be available on transactions where `isManual = true`. |

### 4.4 Schema Migration

| ID | Requirement |
|---|---|
| FR-21 | The `Transaction` Prisma model MUST be migrated: `statementId` changed to **optional** (`String?`) to accommodate manual entries with no associated statement. |
| FR-22 | A new boolean field `isManual` MUST be added to the `Transaction` model (default: `false`) to flag manually created entries. |
| FR-23 | The `dedupHash` for manual transactions MUST be generated server-side as a deterministic hash of `userId + date + amount + type + description` to prevent accidental duplicates. |

> **Note:** The existing `manualCategory` boolean field serves a different purpose (whether the category was manually overridden). The new `isManual` field indicates the transaction itself was manually created.

---

## 5. System Workflows

### 5.1 Create Transaction — Success Flow

```
User clicks "Add Transaction" button (Transactions page header)
→ Modal dialog opens with empty form
→ User fills in Amount, Date, Type, Description, (optional) Category
→ User clicks "Save Transaction"
→ Client validates fields with Zod schema (FR-04, FR-05, FR-06)
  → If invalid: display field-level errors inline, abort submission
→ Client submits POST /api/transactions/manual with form payload
→ Server re-validates with Zod schema
→ Server generates dedupHash (userId + date + amount + type + description)
→ Server checks for existing transaction with same dedupHash
  → If duplicate found: return 409 Conflict
→ Server writes Transaction record (isManual=true, statementId=null)
→ Server returns 201 Created with new transaction data
→ Client closes modal
→ Client shows inline success toast
→ Transactions list refreshes / revalidates to show new entry
```

### 5.2 Create Transaction — Failure Flows

```
[Validation Error]
User submits form with invalid data
→ Client Zod validation fails
→ Field-level error messages rendered inline beneath each invalid field
→ Form remains open, no API call made

[Duplicate Transaction]
Server detects matching dedupHash
→ Server responds 409 { code: "DUPLICATE_TRANSACTION" }
→ Modal shows non-blocking error banner: "A similar transaction already exists"
→ Form remains open for user to modify

[Network / Server Error]
POST /api/transactions/manual fails (5xx / network timeout)
→ Client catches error
→ Modal shows error banner: "Failed to save. Please try again."
→ Form remains open; Submit button re-enabled
```

### 5.3 Edit Transaction — Success Flow

```
User clicks "Edit" on a manually-added transaction row/card
→ Modal opens pre-populated with transaction data
→ User modifies one or more fields
→ User clicks "Save Changes"
→ Client validates with Zod schema
  → If invalid: display errors inline
→ Client submits PATCH /api/transactions/manual/:id
→ Server validates ownership (userId must match transaction.userId)
  → If unauthorized: return 403
→ Server re-validates payload
→ Server updates Transaction record
→ Server returns 200 OK with updated transaction
→ Client closes modal, shows success toast, list updated
```

### 5.4 Delete Transaction — Success Flow

```
User clicks "Delete" on a manually-added transaction row/card
→ Inline confirmation prompt shown: "Delete this transaction? This cannot be undone."
→ User confirms deletion
→ Client submits DELETE /api/transactions/manual/:id
→ Server validates ownership
  → If unauthorized: return 403
→ Server hard-deletes Transaction record
→ Server returns 204 No Content
→ Client removes transaction from list, shows success toast
```

---

## 6. Data Contracts

### 6.1 POST /api/transactions/manual — Create

**Request Body**
```json
{
  "amount": "number (positive, 2 decimal places max)",
  "date": "string (ISO 8601 date, e.g. 2026-03-15)",
  "type": "debit | credit",
  "description": "string (1–255 chars)",
  "categoryId": "string | null (optional)"
}
```

**Response 201 Created**
```json
{
  "id": "string",
  "amount": "string",
  "date": "string (ISO 8601)",
  "type": "debit | credit",
  "description": "string",
  "categoryId": "string | null",
  "isManual": true,
  "createdAt": "string (ISO 8601)"
}
```

**Error Responses**
```json
{ "code": "VALIDATION_ERROR", "message": "string", "fields": { "field": "error message" } }
{ "code": "DUPLICATE_TRANSACTION", "message": "A similar transaction already exists." }
{ "code": "UNAUTHORIZED", "message": "Not authenticated." }
```

---

### 6.2 PATCH /api/transactions/manual/:id — Update

**Request Body**
```json
{
  "amount": "number (optional)",
  "date": "string ISO 8601 (optional)",
  "type": "debit | credit (optional)",
  "description": "string (optional)",
  "categoryId": "string | null (optional)"
}
```

**Response 200 OK** — same shape as Create response

**Error Responses**
```json
{ "code": "NOT_FOUND", "message": "Transaction not found." }
{ "code": "FORBIDDEN", "message": "You do not own this transaction." }
{ "code": "VALIDATION_ERROR", "message": "string", "fields": { "field": "error message" } }
```

---

### 6.3 DELETE /api/transactions/manual/:id — Delete

**Response:** `204 No Content`

**Error Responses**
```json
{ "code": "NOT_FOUND", "message": "Transaction not found." }
{ "code": "FORBIDDEN", "message": "You do not own this transaction." }
```

---

## 7. Integration Points

| Dependency | Purpose | Risk |
|---|---|---|
| **Prisma / PostgreSQL** | Persist, update, delete Transaction records | Schema migration of `statementId` to `String?` must not break existing uploaded transactions (all existing rows have a valid `statementId`). Migration is backward-compatible. |
| **next-auth v5** | Authenticate user identity; enforce ownership on all mutation endpoints | If session expires mid-flow, API returns 401; client must surface re-auth prompt. |
| **Zod v4** | Request validation on both client (form) and server (API route) | Schema drift between client and server validators must be avoided — share a single Zod schema in a shared location. |
| **TanStack Query v5 / Next.js Server Actions** | Client-side data revalidation after mutation | TBD — choose between `router.refresh()` (Server Component revalidation) or TanStack Query `invalidateQueries`. |
| **Predefined Category list** | Category dropdown data | Categories are fetched from the `Category` table. Stale category list in the modal is low risk (category changes are rare). |

---

## 8. Edge Cases

| ID | Scenario | Expected Behavior |
|---|---|---|
| EC-01 | User submits amount of `0` or negative | Client-side Zod error: "Amount must be greater than 0" |
| EC-02 | User submits a future date | Client-side Zod error: "Date cannot be in the future" |
| EC-03 | User submits description exceeding 255 characters | Client-side Zod error: "Description must be 255 characters or fewer" |
| EC-04 | User double-clicks "Save Transaction" rapidly | Debounce / disable submit button on first click to prevent duplicate API calls |
| EC-05 | Same transaction submitted twice (same amount, date, type, description) | Server detects duplicate via dedupHash, returns 409; modal shows error |
| EC-06 | Session expires while modal is open | API returns 401; client shows "Session expired. Please log in again" and redirects to `/login` |
| EC-07 | User edits a non-manual transaction (bypasses UI restriction via direct API call) | Server checks `isManual = true` on the record; returns 403 if false |
| EC-08 | User deletes a non-manual transaction via direct API call | Server checks `isManual = true`; returns 403 if false |
| EC-09 | Network timeout during create/update | Client shows retry error banner; form state preserved |
| EC-10 | Category list is empty (no categories seeded) | Category field renders as empty dropdown; remains optional; no blocking error |
| EC-11 | User opens edit modal and submits without changes | PATCH request proceeds normally; server updates `updatedAt`, returns 200 |
| EC-12 | Page is on a filtered view when a new transaction is added | After modal close, list revalidates; new transaction may not appear in current filter (expected behavior; no UI confusion needed beyond confirmation toast) |

---

## 9. Non-Goals

- **Transfer type:** Transactions of type `transfer` are out of scope. Only `debit` and `credit` are supported in this version.
- **Multiple accounts / wallets:** Single account only; no account selection field in this version.
- **Recurring transactions:** No support for scheduling or repeating manual transactions.
- **Receipt / attachment upload:** No file attachments for manual transactions in this version.
- **Bulk manual entry:** No CSV or batch import via the manual form; that is handled by the existing statement upload flow.
- **Editing imported transactions:** Manual edit/delete actions apply only to `isManual = true` records.
- **Audit log / history:** No change history is tracked for edits or deletions in this version.

---

## 10. Risks

| ID | Risk | Severity | Mitigation |
|---|---|---|---|
| R-01 | **Schema migration breaks existing data** — making `statementId` nullable must not corrupt the 0 existing manual rows (none exist yet) or violate FK integrity on existing statement-linked rows. | Medium | Use `ALTER COLUMN SET DEFAULT NULL`; existing rows retain their `statementId`. Run migration on a copy of production DB first. |
| R-02 | **dedupHash collision for manual entries** — two legitimately different transactions with identical amount, date, type, and description would be rejected as duplicates. | Low | Allow user to slightly vary the description (e.g., add a note) to differentiate. Document this behavior clearly in UI tooltip. |
| R-03 | **Stale transactions list** — after create/edit/delete, the Server Component list may show stale data if revalidation strategy is not correctly implemented. | Medium | Use `router.refresh()` or `revalidatePath('/dashboard/transactions')` inside the Server Action / API route handler to ensure the server re-renders the page. |
| R-04 | **Authorization bypass** — user could call `PATCH/DELETE /api/transactions/manual/:id` with another user's transaction ID. | High | Server MUST always join `userId` from the session with the transaction lookup. Never trust the client to supply `userId`. |
| R-05 | **Performance degradation** — high-frequency manual entries could bloat the transaction table over time. | Low | No pagination design changes required in this version. Existing page size of 50 and indexed queries are sufficient. |
