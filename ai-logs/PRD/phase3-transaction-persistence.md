# Phase 3 PRD — Transaction Persistence & Listing

## 1. Executive Summary

**Problem Statement**: Users can parse bank statement PDFs client-side (Phase 2), but the upload flow is a dead end — confirmed transactions are discarded (`setTimeout` stub), there is no persistence layer, and no way to view historical data. This makes the entire parsing pipeline non-functional beyond a demo.

**Proposed Solution**: Add a `Statement` and `Transaction` data model backed by PostgreSQL, expose bulk-insert and paginated-query API routes, wire the existing upload page to persist confirmed transactions, and build a Transactions list page with filtering — completing the core data pipeline from PDF → Database → UI.

**Success Criteria**:

| # | KPI | Target |
|---|---|---|
| SC-1 | Bulk insert latency | ≤ 500ms for 200 transactions (single statement upload) |
| SC-2 | Duplicate detection accuracy | 100% — zero false positives, zero false negatives against `SHA-256(userId + date + amount + type + balance)` |
| SC-3 | Transactions page load time | < 1 second for 50 rows with filters applied (server component, no client fetch waterfalls) |
| SC-4 | Data integrity | Zero data loss — every user-confirmed transaction persists with exact `Decimal` amounts; verified via `prisma studio` |
| SC-5 | Dedup user visibility | Upload response explicitly reports `"X inserted, Y skipped as duplicates"` — no silent data swallowing |

---

## 2. User Experience & Functionality

### User Personas

| Persona | Description | Relevance to Phase 3 |
|---|---|---|
| **Primary** | Privacy-conscious individual who uploads HDFC statements to track personal expenses | Needs confirmed transactions to actually persist and be queryable |
| **Secondary** | User who uploads multiple overlapping statements (e.g., monthly + quarterly) | Needs deduplication so re-uploads don't create phantom records |

### User Stories

| # | Story | Acceptance Criteria |
|---|---|---|
| US-1 | As a user, I want to confirm parsed transactions and have them saved to my account, so that my data isn't lost after parsing | ✅ "Confirm & Save" calls `POST /api/transactions` with structured JSON<br>✅ Response shows: `"42 inserted, 3 skipped as duplicates"`<br>✅ On success, redirect to `/dashboard/transactions`<br>✅ On error, error message displayed — preview state preserved (no data loss) |
| US-2 | As a user, I want to re-upload the same statement without creating duplicate transactions, so that I don't corrupt my records | ✅ Dedup hash `SHA-256(userId + date + amount + type + balance)` computed per row<br>✅ Existing hashes filtered out before insert<br>✅ DB unique constraint on `dedupHash` prevents race-condition duplicates<br>✅ Skipped count reported to user |
| US-3 | As a user, I want to view all my transactions in a paginated table, so that I can review my spending history | ✅ Table columns: Date, Description, Debit, Credit, Balance<br>✅ Default sort: newest first<br>✅ 50 rows per page with Prev/Next pagination<br>✅ URL-based state (shareable/bookmarkable filter URLs) |
| US-4 | As a user, I want to filter transactions by date range, type, and description, so that I can find specific entries | ✅ Date range picker (from/to)<br>✅ Type filter: All / Debit / Credit<br>✅ Description text search (case-insensitive `contains`)<br>✅ Filters reflected in URL query params<br>✅ Filters combinable (e.g., debits in January matching "UPI") |
| US-5 | As a user, I want to see a summary on my dashboard, so that I have a quick overview of my finances | ✅ Total transaction count and statement count<br>✅ Current month: total debits, total credits, net change<br>✅ Empty state preserved with upload CTA when no data exists |
| US-6 | As a user, I want the transactions page to work well on mobile, so that I can check expenses on my phone | ✅ Card-based layout on `< sm` breakpoints<br>✅ Filters collapsible or stacked vertically<br>✅ Touch-friendly pagination controls |

### Non-Goals (Phase 3)

| # | Excluded | Rationale |
|---|---|---|
| NG-1 | Expense categorization | Deferred to Phase 4 — categorization logic not yet designed |
| NG-2 | Charts or visualizations | Deferred to Phase 4 |
| NG-3 | Transaction editing/deleting | MVP — users can re-upload corrected statements; manual CRUD adds complexity |
| NG-4 | Multi-bank support | Only HDFC parser exists (Phase 2); schema supports `bank` field for future banks |
| NG-5 | Soft deletes | Acceptable for MVP — `deletedAt` column can be added later without breaking changes |
| NG-6 | Export (CSV/PDF) | Deferred to a later phase |
| NG-7 | Account number storage | Explicitly excluded per product privacy principles |

---

## 3. Technical Specifications

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                             │
│                                                                     │
│  Upload Page ──→ POST /api/transactions ──→ ┌──────────────────┐   │
│  (handleConfirm)      { bank, period,       │ API Route        │   │
│                         transactions[] }     │ • Validate (Zod) │   │
│                                              │ • Compute hashes │   │
│                                              │ • Filter dupes   │   │
│                                              │ • $transaction{} │   │
│                                              └────────┬─────────┘   │
│                                                       │              │
│  Transactions Page ←── GET /api/transactions          │              │
│  (server component)    ?page=&type=&search=           │              │
│                                                       ▼              │
│  Dashboard Page ←───── Direct Prisma queries   ┌──────────────┐     │
│  (server component)                            │  PostgreSQL   │     │
│                                                │  • Statement  │     │
│                                                │  • Transaction│     │
│                                                └──────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow — Upload Confirmation

```
User clicks "Confirm & Save"
  │
  ├─ 1. Client sends POST /api/transactions
  │     Body: { bank, statementPeriod, transactions[] }
  │
  ├─ 2. API route: auth() → validate session → reject if unauthenticated
  │
  ├─ 3. Zod validation on request body
  │
  ├─ 4. For each transaction:
  │     dedupHash = SHA-256(userId + date + amount + type + balance)
  │
  ├─ 5. Query existing dedupHash values for this user
  │     Filter out already-existing hashes
  │
  ├─ 6. prisma.$transaction:
  │     a. Create Statement record
  │     b. createMany Transaction records (non-duplicate only)
  │
  ├─ 7. Return { inserted, skipped, statementId }
  │
  └─ 8. Client: show result toast → redirect to /dashboard/transactions
```

### Database Schema

#### `Statement` Model

| Field | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `userId` | `String` | FK → User |
| `bank` | `String` | e.g., `"HDFC"` |
| `fromDate` | `DateTime?` | Statement period start (nullable — some parsers may not detect) |
| `toDate` | `DateTime?` | Statement period end |
| `txnCount` | `Int` | Count of transactions inserted (not total in PDF) |
| `createdAt` | `DateTime` | Auto-generated |

**Indexes**: `(userId, createdAt)` — for upload history queries.

#### `Transaction` Model

| Field | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `userId` | `String` | FK → User (denormalized for direct queries without joins) |
| `statementId` | `String` | FK → Statement |
| `date` | `DateTime` | Transaction date |
| `description` | `String` | Cleaned narration text |
| `reference` | `String` | Cheque/reference number (default `""`) |
| `amount` | `Decimal(12,2)` | Always positive; up to ₹9,99,99,99,999.99 |
| `type` | `TransactionType` | Enum: `debit` / `credit` |
| `balance` | `Decimal(12,2)` | Closing balance after this transaction |
| `dedupHash` | `String` | `SHA-256(userId + date + amount + type + balance)` — **unique constraint** |
| `createdAt` | `DateTime` | Auto-generated |

**Indexes**:

| Index | Query Pattern |
|---|---|
| `(userId, date DESC)` | Default transaction list — newest first |
| `(userId, type, date DESC)` | Filtered by debit/credit |
| `(statementId)` | Statement detail view |
| `(dedupHash) UNIQUE` | Dedup enforcement |

#### Why `Decimal`, not `Float`

IEEE 754 `Float` causes rounding errors (`0.1 + 0.2 = 0.30000000000000004`). Over hundreds of transactions, monthly aggregates can drift by ₹0.01–₹0.10. `Decimal(12,2)` uses exact decimal arithmetic — critical for financial data.

#### Why no `accountNo`

Product privacy principles explicitly prohibit storage of account numbers, IFSC codes, or address details. The `bank` field on `Statement` is sufficient for grouping. If multi-account support is needed later, a user-defined label ("Savings", "Salary") is more privacy-friendly.

### API Endpoints

#### `POST /api/transactions`

| Property | Detail |
|---|---|
| Auth | `auth()` session required (HTTP 401 if missing) |
| Rate limit | N/A for MVP (single user at a time) |
| Method | POST |

**Request Body (Zod schema)**:

```typescript
{
  bank: string,                                    // e.g., "HDFC"
  statementPeriod: { from: string, to: string } | null,
  transactions: Array<{
    date: string,              // ISO 8601
    description: string,
    referenceNumber: string,
    amount: number,            // Positive
    type: "debit" | "credit",
    balance: number
  }>
}
```

**Response** (`200 OK`):

```json
{
  "inserted": 42,
  "skipped": 3,
  "statementId": "clx1abc..."
}
```

**Error Responses**:

| Code | Condition |
|---|---|
| `401` | Not authenticated |
| `400` | Zod validation failure (malformed body) |
| `500` | Database error |

#### `GET /api/transactions`

| Property | Detail |
|---|---|
| Auth | `auth()` session required |
| Method | GET |

**Query Parameters**:

| Param | Type | Default | Constraint |
|---|---|---|---|
| `page` | `number` | `1` | ≥ 1 |
| `limit` | `number` | `50` | 1–100 |
| `from` | `string` (ISO date) | — | Optional start date |
| `to` | `string` (ISO date) | — | Optional end date |
| `type` | `"debit" \| "credit"` | — | Optional type filter |
| `search` | `string` | — | Case-insensitive `contains` on `description` |

**Response** (`200 OK`):

```json
{
  "transactions": [ ... ],
  "total": 245,
  "page": 1,
  "totalPages": 5
}
```

### Integration Points

| System | Integration | Direction |
|---|---|---|
| NextAuth | `auth()` session in API routes and server components | Read |
| Prisma + PostgreSQL | `Statement` and `Transaction` CRUD | Read/Write |
| Upload Page (Phase 2) | `handleConfirm` → `POST /api/transactions` | Write |
| Transactions Page (new) | `GET /api/transactions` (or direct Prisma in server component) | Read |
| Dashboard Page (existing) | Direct Prisma aggregate queries | Read |

### Security & Privacy

| Concern | Mitigation |
|---|---|
| Unauthorized access | All endpoints require `auth()` session; all queries scoped to `userId` |
| Cross-user data leakage | Every Prisma query includes `where: { userId }` — no global queries |
| SQL injection | Prisma parameterized queries (no raw SQL) |
| Request body abuse | Zod validation with strict schemas; `limit` capped at 100 |
| Decimal precision | `Decimal(12,2)` — no floating-point drift in financial calculations |
| Account number exposure | Not stored — per product privacy principles |
| Cascade deletion | User deletion cascades to all `Statement` and `Transaction` records |

---

## 4. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-1 | Dedup hash collision (two legitimately different transactions producing the same hash) | Very Low | Medium — one transaction silently dropped | Hash includes `userId + date + amount + type + balance`; collisions require identical amounts on the same date with the same balance — practically impossible for real banking data |
| R-2 | Race condition on concurrent uploads producing duplicate inserts | Low | Medium — duplicate records | DB unique constraint on `dedupHash` acts as a safety net; `createMany` with `skipDuplicates` can recover gracefully |
| R-3 | Large statement (500+ rows) causes slow insert | Low | Low — user perceives delay | `createMany` is batched; Prisma handles this efficiently; 500 rows ≈ < 1s on PostgreSQL |
| R-4 | `Decimal` serialization issues in JSON responses | Medium | Low — amounts display incorrectly | Serialize `Decimal` fields to `number` or `string` in API response; test rounding explicitly |
| R-5 | Migration failure on existing production data | Low | High — downtime | Run `prisma migrate dev` in staging first; migration only adds new tables/enums (no destructive changes to `User`) |
| R-6 | Search on `description` with `contains` is slow at scale (>100k rows) | Low (MVP scale) | Low | Acceptable for MVP; add PostgreSQL `pg_trgm` index or full-text search if needed post-MVP |

---

## 5. Phased Rollout

| Phase | Scope | Dependencies |
|---|---|---|
| **Phase 3a — Schema & API** | Prisma schema migration (`Statement`, `Transaction`, `TransactionType` enum); `POST /api/transactions` with dedup; `GET /api/transactions` with pagination & filters | Prisma, PostgreSQL |
| **Phase 3b — Upload Integration** | Replace `handleConfirm` stub → real API call; show insert/skip counts; redirect on success; error handling | Phase 3a API |
| **Phase 3c — Transactions Page** | Server component with date range, type, and search filters; paginated table; mobile card layout; empty state with upload CTA | Phase 3a API |
| **Phase 3d — Dashboard Update** | Convert dashboard to server component; show total txn/statement counts; current month debit/credit/net; empty state preserved | Phase 3a schema |
| **Future (Phase 4)** | Expense categorization, charts, spending trends, category breakdown | Phase 3 complete |

---

## 6. File Impact Summary

| Action | File | Category | Description |
|---|---|---|---|
| MODIFY | `prisma/schema.prisma` | Schema | Add `TransactionType` enum, `Statement` model, `Transaction` model; update `User` relations |
| NEW | `src/app/api/transactions/route.ts` | API | `POST` (bulk insert + dedup) and `GET` (paginated list + filters) handlers |
| MODIFY | `src/app/dashboard/upload/page.tsx` | UI | Replace `handleConfirm` stub with real `POST /api/transactions` call |
| NEW | `src/app/dashboard/transactions/page.tsx` | UI | Server component — transaction table with filters, pagination, mobile layout |
| MODIFY | `src/app/dashboard/page.tsx` | UI | Convert to server component; display aggregate stats |

---

## 7. Verification Plan

### Automated

| Test | Pass Criteria |
|---|---|
| `npx prisma migrate dev` | Migration applies cleanly, no errors |
| `npm run build` | Build succeeds with zero type errors |
| Bulk insert 200 rows | Completes in ≤ 500ms; all rows present in DB |
| Re-insert same 200 rows | 0 inserted, 200 skipped; no duplicates in DB |
| GET with filters | Correct filtering by date range, type, search; pagination math correct |

### Manual / Browser

| # | Scenario | Expected Result |
|---|---|---|
| V-1 | Upload HDFC statement → Confirm | Toast: "X inserted, 0 skipped" → redirect to `/dashboard/transactions` |
| V-2 | Re-upload same file → Confirm | Toast: "0 inserted, X skipped as duplicates" |
| V-3 | Navigate to `/dashboard/transactions` | Table displays all transactions, newest first |
| V-4 | Apply type filter "Debit" | Only debit rows shown; URL updates with `?type=debit` |
| V-5 | Search "UPI" in description | Only matching rows shown |
| V-6 | Navigate to page 2 | Next 50 rows displayed; pagination controls update |
| V-7 | Dashboard home | Stats card shows totals and current month summary |
| V-8 | Dashboard home (no data) | Empty state with "Upload your first statement" CTA |
| V-9 | Mobile viewport (< 640px) | Transactions render as cards, not table rows |
| V-10 | Verify in Prisma Studio | All confirmed rows exist with correct `Decimal` values and `dedupHash` |
