# Phase 4 Engineering PRD — Categorization, Personal Rules, and Analytics

## 1. Problem Definition

Users can persist and list transactions (Phase 3), but every transaction is uncategorized. There is no way to understand where money goes. The dashboard shows only raw totals (monthly debits, credits, net), which is insufficient for meaningful financial insight. Without categorization and visualizations, the app is a transaction log, not an expense tracker.

Transactions enter the system with a description (e.g. bank narration) but no category. The system must assign categories automatically where possible, surface uncategorized transactions for manual handling, allow users to correct misclassifications and optionally save those corrections as reusable rules, and provide an analytics dashboard with charts and filters.

---

## 2. Objectives & Success Metrics

| ID | Objective | Success Metric |
|----|-----------|----------------|
| O-1 | Auto-categorize transactions on upload and backfill | ≥ 70% of HDFC transactions matched by keyword rules (user + system); remainder have `categoryId` null (Uncategorized) |
| O-2 | Keep categorization fast and local | < 1ms per transaction — synchronous in-memory lookup, no external API |
| O-3 | Backfill existing data without blocking UI | ≤ 5 seconds for 2,000 uncategorized transactions (batched) |
| O-4 | Analytics page loads and renders quickly | All 5 charts rendered and interactive within 1 second of page load (server-fetched data + client hydration) |
| O-5 | Manual overrides and personal rules persist | Override takes effect immediately (optimistic UI) and persists across reloads; optional personal rule is saved and applied to future transactions and backfill |
| O-6 | No regression to Phases 1–3 | All existing features pass manual verification; Prisma migration is additive only |

---

## 3. User Roles

| Role | Description |
|------|-------------|
| Primary | Privacy-conscious individual who uploads HDFC statements monthly to track personal expenses. Needs automatic categorization, uncategorized bucket, and the ability to fix and teach the system via personal rules. |
| Secondary | User who uploads overlapping statements across multiple months. Needs time-series charts and cross-month comparisons. |

---

## 4. Functional Requirements

### Categorization engine

| ID | User / System Action | Processing | Output |
|----|----------------------|------------|--------|
| FR-01 | Transaction description is available (on insert or backfill) | Engine checks user personal rules first (by userId), then system keyword rules; match is case-insensitive, first-match wins | Category slug or null (Uncategorized) |
| FR-02 | No keyword match in user or system rules | Engine returns null | Transaction stored with `categoryId` null; displayed as "Uncategorized" |
| FR-03 | User manually assigns a category to a transaction | System updates transaction `categoryId`, sets `manualCategory` true | Transaction shows new category; override is never overwritten by backfill |

### Personal rules

| ID | User / System Action | Processing | Output |
|----|----------------------|------------|--------|
| FR-04 | User confirms or edits keyword and saves as rule when categorizing a transaction | System persists `UserCategoryRule` (userId, keyword, categoryId); keyword normalized (trim, lowercase for matching) | Future transactions whose description contains that keyword are auto-assigned that category (user rules checked before system rules) |
| FR-05 | Backfill runs for a user | Engine loads that user's personal rules and applies same logic as insert (user rules first, then system rules) | Uncategorized rows get `categoryId` where a rule matches; `manualCategory` true rows skipped |

### Upload and API

| ID | User / System Action | Processing | Output |
|----|----------------------|------------|--------|
| FR-06 | Client sends POST /api/transactions with bulk transactions | Server loads user's personal rules and categories; for each transaction runs categorize(description, userRules); resolves slug to categoryId (or null); inserts with categoryId, manualCategory false | Response { inserted, skipped, statementId }; new rows have categoryId or null |
| FR-07 | Client requests GET /api/transactions with optional category filter | Server resolves category slug to categoryId when param present; returns transactions with category fields (categoryId, categorySlug, categoryName, categoryColour, categoryIcon; null when uncategorized) | Paginated list; filter by category when requested |
| FR-08 | Client sends PATCH /api/transactions/:id with categoryId and optional saveAsRule | Server verifies ownership, validates categoryId; updates transaction; if saveAsRule.keyword provided, upserts UserCategoryRule for this user | 200 { success: true }; transaction and optional rule persisted |

### Backfill

| ID | User / System Action | Processing | Output |
|----|----------------------|------------|--------|
| FR-09 | Client or server triggers POST /api/transactions/backfill | Server finds transactions where userId = session, categoryId is null, manualCategory is false; loads user rules; batch-updates categoryId using engine (user rules then system rules) in chunks (e.g. 100) | 200 { updated: N }; toast or UI refresh to show N categorized |

### Transactions UI

| ID | User / System Action | Processing | Output |
|----|----------------------|------------|--------|
| FR-10 | User opens Transactions page | Page shows category badge per row (or "Uncategorized"); category filter dropdown (including Uncategorized) | List with category column; filter by category via URL param ?category=slug or uncategorized |
| FR-11 | User changes category via inline control | Optimistic UI update; PATCH /api/transactions/:id; optional "Save as rule" with pre-filled keyword (editable) | UI shows new category; on failure revert and show error |
| FR-12 | User filters by category | TransactionFilters include category dropdown; selection sets ?category=slug | Only transactions in that category (or uncategorized when slug chosen for that) |

### Analytics dashboard

| ID | User / System Action | Processing | Output |
|----|----------------------|------------|--------|
| FR-13 | User opens Dashboard | Server reads ?months (default 6); fetches GET /api/analytics/summary?months=N; if uncategorized count > 0, passes flag to BackfillTrigger | Analytics page with period selector and 5 charts; optional auto-backfill and toast |
| FR-14 | User selects period (3 / 6 / 12 months) | PeriodSelector updates ?months; page refetches analytics data | All charts show data for selected period |
| FR-15 | User views monthly trend | BarChart shows total debits per month for period | Tooltip on hover with month and amount |
| FR-16 | User views category breakdown | Donut chart of total debits by category; uncategorized included as "Uncategorized" | Click slice navigates to /dashboard/transactions?category=slug (or uncategorized) |
| FR-17 | User views income vs expense | Grouped bar chart: credits and debits per month; net indicated | Same period as selector |
| FR-18 | User views top merchants | Horizontal bar chart, top 10 by debit total; merchant name from extractMerchant(description) | Tooltip with total and count |
| FR-19 | User views daily heatmap | Calendar-style grid; cell = day, intensity = debit total; same period | Tooltip with date and amount; horizontal scroll on mobile |
| FR-20 | Analytics on small viewport | Charts stack vertically; ResponsiveContainer; heatmap in overflow-x auto wrapper | Usable on mobile |

---

## 5. System Workflows

### Categorization on upload (success)

```
User selects transactions and clicks "Confirm & Save"
  → Client: POST /api/transactions (body unchanged from Phase 3)
  → Input validation: bank, statementPeriod, transactions array
  → Server: auth() → get userId
  → Server: load UserCategoryRule for userId; load Category list
  → For each transaction: slug = categorize(description, userRules); categoryId = slug ? map.get(slug) : null
  → createMany with categoryId, manualCategory = false
  → State change: Statement + Transaction rows inserted
  → Response: { inserted, skipped, statementId }
  → UI: success step; redirect or link to transactions
```

### Categorization on upload (failure)

```
POST /api/transactions with invalid body or DB error
  → Validation or DB failure
  → Response: 400 or 500 with error payload
  → UI: show error; do not clear form
```

### Manual category override and optional personal rule (success)

```
User changes category in inline select (and optionally edits keyword and checks "Save as rule")
  → UI: optimistic update (show new category immediately)
  → Client: PATCH /api/transactions/:id { categoryId, saveAsRule?: { keyword } }
  → Server: auth(); fetch transaction; verify transaction.userId === session.user.id
  → Server: validate categoryId exists
  → Server: update transaction (categoryId, manualCategory = true)
  → If saveAsRule: upsert UserCategoryRule (userId, keyword normalized, categoryId)
  → Response: 200 { success: true }
  → UI: keep optimistic state (no-op)
```

### Manual category override (failure)

```
PATCH /api/transactions/:id returns 403/404/500 or invalid categoryId
  → Response: error code and message
  → UI: revert to previous category in local state; show inline error
```

### Backfill on dashboard load

```
User opens /dashboard
  → Server: count Transaction where userId = session, categoryId is null
  → Server: pass hasUncategorized = count > 0 to BackfillTrigger
  → Client (BackfillTrigger): if hasUncategorized, POST /api/transactions/backfill on mount
  → Server: find uncategorized, manualCategory = false; load user rules; batch update with engine
  → Response: { updated: N }
  → Client: toast "N transactions categorized"; router.refresh()
  → UI: charts and list reflect new categories
```

### Analytics data fetch

```
User on /dashboard (with or without backfill)
  → Server: read ?months (3|6|12, default 6); GET /api/analytics/summary?months=N (or server-side equivalent)
  → Server: auth(); aggregate by userId and date range (monthly trend, category breakdown, top merchants, daily heatmap)
  → Response: { monthlyTrend, categoryBreakdown, topMerchants, dailyHeatmap }
  → UI: pass serialized data to chart components; charts render client-side
```

---

## 6. Data Contracts

### POST /api/transactions (modified)

- **Request:** Unchanged from Phase 3.  
  `{ bank, statementPeriod?: { from, to }, transactions: [{ date, description, referenceNumber, amount, type, balance }] }`
- **Response 200:** `{ inserted: number, skipped: number, statementId: string }`
- **Error:** `{ code: 400|401|500, message?: string, issues?: array }`

Internal behavior: assign categoryId (or null) per transaction using categorization engine with user rules.

### GET /api/transactions (modified)

- **Query params:** Existing (page, limit, from, to, type, search) + `category` (optional, category slug; use special value or param for "Uncategorized").
- **Response 200:** `{ transactions: Array<{ id, date, description, reference, amount, type, balance, createdAt, categoryId?, categorySlug?, categoryName?, categoryColour?, categoryIcon? }>, total, page, totalPages }`  
  Decimal/date as strings. Null categoryId implies Uncategorized.
- **Error:** `{ code: 401, message?: string }`

### PATCH /api/transactions/[id] (new)

- **Request:** `{ categoryId: string (cuid), saveAsRule?: { keyword: string } }`
- **Response 200:** `{ success: true }`
- **Error:** `{ code: 401|403|404|400, message: string }`  
  403 if not owner; 404 if transaction not found; 400 if categoryId invalid.

### POST /api/transactions/backfill (new)

- **Request:** No body.
- **Response 200:** `{ updated: number }`
- **Error:** `{ code: 401, message?: string }`

### GET /api/analytics/summary (new)

- **Query params:** `months` — 3 | 6 | 12 (default 6).
- **Response 200:**  
  `{ monthlyTrend: [{ month: "YYYY-MM", debits: string, credits: string }], categoryBreakdown: [{ categoryId, slug, name, colour, icon, total: string, percent: number }], topMerchants: [{ merchant: string, total: string, count: number }], dailyHeatmap: [{ date: "YYYY-MM-DD", total: string }] }`  
  categoryBreakdown includes an entry for Uncategorized (slug or id representing null) when applicable. All monetary values as strings.
- **Error:** `{ code: 401, message?: string }`

---

## 7. Integration Points

| Dependency | Purpose | Risk |
|------------|---------|------|
| NextAuth | Session in all new/modified API routes and dashboard; userId for ownership and user-scoped rules | Low — existing usage |
| Prisma / PostgreSQL | Category and UserCategoryRule models; Transaction.categoryId, manualCategory; aggregates for analytics | Medium — migrations additive; Decimal handling must be consistent |
| Categorization engine (rules + engine) | Keyword matching with user rules first, then system rules; used in POST transactions and backfill | Low — pure logic, testable |
| Merchant extractor | Used only in GET /api/analytics/summary for top merchants; no persistence | Low — string-only |
| Recharts | Client-side chart rendering from server-provided data | Low — bundle size; can lazy-load if needed |

---

## 8. Edge Cases

| Case | Handling |
|------|----------|
| Invalid or missing categoryId on PATCH | Validate categoryId exists and belongs to system categories; 400 if invalid. |
| Duplicate personal rule (same user, same keyword, same or different category) | Upsert by (userId, keyword): update categoryId and use for future matching. |
| Empty keyword in saveAsRule | Reject (400) or ignore saveAsRule; do not create a rule that matches everything. |
| Permission failure (PATCH another user's transaction) | 403; do not leak existence. |
| Network timeout on PATCH | Client keeps optimistic state; retry or show error and revert. |
| Backfill with very large uncategorized set (e.g. 10k+) | Batch in chunks (e.g. 100); respond with total updated; idempotent so client can retry. |
| Empty state: no transactions | Dashboard shows empty states for all charts; transactions list shows upload CTA. |
| All transactions uncategorized | Category breakdown shows "Uncategorized" as single slice; backfill can be triggered from dashboard. |
| categoryId null in chart data | Treat as "Uncategorized"; include in categoryBreakdown and filters. |
| Pagination on transactions with category filter | Same as Phase 3; category is an additional filter. |
| Decimal aggregation (groupBy, _sum) | Use Prisma Decimal; serialize to string in API; no float math. |
| User deletes account | Cascade: UserCategoryRule and Transaction removed with user. |

---

## 9. Non-Goals

| ID | Excluded | Rationale |
|----|----------|-----------|
| NG-1 | AI/LLM categorization | Rule-based engine only; no external model or API. |
| NG-2 | User-created custom categories | Only predefined system categories; no new category CRUD. |
| NG-3 | Budgets or alerts | Out of scope for this phase. |
| NG-4 | CSV/PDF export of analytics | Deferred. |
| NG-5 | Multi-currency | INR only. |
| NG-6 | Transaction edit/delete | Still out of scope per Phase 3. |
| NG-7 | Server-side chart rendering | Charts render client-side (e.g. Recharts); data from server. |
| NG-8 | Multi-bank keyword rules | Phase 4 rules tuned for HDFC narration formats only. |

---

## 10. Risks

| ID | Risk | Mitigation |
|----|------|------------|
| R-1 | Keyword rules misclassify (e.g. "HDFC LTD" as EMI for a credit) | Refine rule order; user override and personal rule correct future behavior. |
| R-2 | Generic keyword (e.g. "upi") matches before specific (e.g. "swiggy") | Order system rules most-specific first; user rules checked first and can override. |
| R-3 | Backfill timeout on very large datasets | Batch updates (e.g. 100 per batch); idempotent; return count. |
| R-4 | Recharts increases analytics page bundle size | Accept or lazy-load with next/dynamic. |
| R-5 | Decimal aggregation wrong in analytics | Use Prisma types; serialize with .toString(); validate with tests. |
| R-6 | Null categoryId in UI or charts causes errors | Treat null as "Uncategorized" everywhere; no dereference without null check. |
| R-7 | Backfill overwrites manual overrides | Backfill excludes rows where manualCategory is true. |
| R-8 | Personal rule keyword too broad and over-matches | User controls keyword (pre-filled from description, editable); normalize and store as-is for matching; document "contains" semantics. |
| R-9 | Merchant extractor wrong on some narrations | Fallback to raw description (truncated); analytics only, not stored. |

---

## Appendix: Categorization Engine and Schema

### Engine flow

```
Transaction description (and userId for user rules)
       |
       v
User personal rules (UserCategoryRule WHERE userId = ?)
  → keyword match: description.toLowerCase().includes(keyword) or equivalent; first match wins
       |
       | No match
       v
System rules (static ordered list in rules.ts; slugs match Category seed)
  → keyword match, case-insensitive, first match wins
       |
       | No match
       v
categoryId = null (Uncategorized)
```

### Database (additive)

- **Category:** id, name, slug (unique), icon, colour, sortOrder. Seed: 12 categories (e.g. food-dining, groceries, transport, shopping, bills-utilities, health, entertainment, education, transfers, emi-loans, cash-withdrawal, salary-income). Optional 13th "Other" for manual assignment only (no system keyword).
- **UserCategoryRule:** id, userId, keyword (normalized for storage), categoryId, createdAt. Unique (userId, keyword). Used only for matching.
- **Transaction:** add categoryId (FK nullable), manualCategory (boolean, default false). Index (userId, categoryId, date desc).

### Key files (reference)

- `src/lib/categorization/rules.ts` — system keyword list per slug (ordered).
- `src/lib/categorization/engine.ts` — categorize(description, userRules?) → slug | null.
- `src/lib/categorization/merchantExtractor.ts` — extractMerchant(description) for analytics only.
- API: POST/GET transactions, PATCH transactions/[id], POST backfill, GET analytics/summary.
- UI: TransactionFilters (category dropdown), CategorySelect (inline + optional "Save as rule"), dashboard analytics components, BackfillTrigger.
