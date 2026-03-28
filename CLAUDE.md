# CLAUDE.md — fn-tracker (FinTrack)

## Project Overview

**FinTrack** is a privacy-first personal expense tracker. Users upload encrypted PDF bank statements, which are parsed entirely client-side (no PDF data is ever sent to the server). Extracted transactions are saved, auto-categorized, and displayed with analytics.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Auth | NextAuth v5 (credentials provider, JWT sessions) |
| Database | PostgreSQL via Prisma ORM v6 |
| Data fetching | TanStack React Query v5 |
| Validation | Zod v4 |
| PDF processing | pdfjs-dist (client-side only) |
| Charts | recharts |
| Password hashing | bcryptjs (12 rounds) |

## Commands

```bash
# Development
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run start        # Run production build
npm run lint         # ESLint

# Database
npm run db:seed      # Seed default categories (run once after first migrate)
npx prisma migrate dev           # Create and apply a new migration
npx prisma db push               # Push schema changes without migration
npx prisma studio                # Open Prisma GUI
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
AUTH_SECRET=<random-base64-string>   # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/signup/route.ts          # User registration
│   │   ├── auth/[...nextauth]/route.ts   # NextAuth handler
│   │   ├── transactions/route.ts         # GET (paginated+filtered), POST (bulk from PDF)
│   │   ├── transactions/[id]/route.ts    # PATCH (categorize)
│   │   ├── transactions/backfill/route.ts # POST (auto-categorize all uncategorized)
│   │   ├── transactions/manual/route.ts  # POST (manual transaction)
│   │   ├── transactions/manual/[id]/route.ts # PATCH / DELETE (manual transaction)
│   │   └── analytics/summary/route.ts   # 6-month analytics summary
│   ├── dashboard/
│   │   ├── page.tsx                      # Main dashboard (charts, stats)
│   │   ├── layout.tsx
│   │   ├── transactions/                 # Transaction list with filters
│   │   └── upload/                       # PDF upload and parsing flow
│   ├── login/
│   ├── signup/
│   └── layout.tsx / page.tsx / globals.css
├── components/
│   ├── layout/AppShell.tsx
│   └── providers/query-provider.tsx
├── hooks/use-toast.tsx
├── lib/
│   ├── auth.ts / auth.config.ts          # NextAuth config (split for edge compat)
│   ├── db.ts                             # Prisma singleton
│   ├── format.ts                         # Indian currency/date formatting
│   ├── analytics.ts                      # Analytics aggregation logic
│   ├── pdf/                              # Client-side PDF parsing
│   │   ├── extractor.ts                  # pdfjs text extraction
│   │   ├── parser-registry.ts            # Bank parser registry
│   │   └── banks/
│   │       ├── hdfc.ts                   # HDFC-specific parser
│   │       └── federal.ts                # Federal Bank (header/footer detect)
│   └── categorization/
│       ├── engine.ts                     # Categorization logic
│       ├── rules.ts                      # System keyword rules
│       └── merchantExtractor.ts
├── types/next-auth.d.ts
└── proxy.ts                              # Edge middleware (auth guard)
prisma/
├── schema.prisma
├── migrations/
└── seed.ts                               # Seeds default categories
```

## Database Schema

Five models: **User**, **Statement**, **Transaction**, **Category**, **UserCategoryRule**.

- **Transaction** has a `dedupHash` (SHA256 of userId+date+amount+type+balance/description) — unique per user to prevent duplicate imports.
- **Category** rows are seeded once (13 defaults: Food & Dining, Groceries, Transport, Shopping, Bills & Utilities, Health, Entertainment, Education, Transfers, EMI & Loans, Cash Withdrawal, Salary & Income, Other).
- **UserCategoryRule** stores keyword → category mappings per user for custom auto-categorization.

## Key Architecture Decisions

### Privacy-first PDF Processing
PDF files are **never uploaded to the server**. Everything happens in the browser:
1. User selects PDF → optional password decryption → pdfjs text extraction → bank-specific parser → transaction rows
2. Only the extracted transaction rows (text data) are sent to the API.

### Authentication
- NextAuth v5 with credentials provider (email + bcrypt password)
- Auth config is split into `auth.ts` (full server) and `auth.config.ts` (edge-compatible) for middleware
- Edge middleware in `proxy.ts` does cookie-based auth check for fast redirects

### Categorization (Two-tier)
1. **User rules** (highest priority) — keyword matches stored in `UserCategoryRule`
2. **System rules** — keyword patterns in `lib/categorization/rules.ts`
3. Uncategorized if no match

The `/api/transactions/backfill` endpoint re-runs categorization on all uncategorized transactions.

### File Naming Conventions
- Pages co-locate related components in `_components/`, hooks in `_hooks/`, utils in `_utils/`
- API routes use `route.ts` (Next.js App Router convention)
- Client hooks prefixed with `use-` (kebab-case files, camelCase exports)

### Locale
- Currency: Indian Rupee (₹), formatted with `en-IN` locale (lakhs/crores format)
- Date formatting: `en-IN`

## Adding a New Bank Parser

1. Create `src/lib/pdf/banks/<bankname>.ts` implementing the parser interface from `src/lib/pdf/types.ts`
2. Register it in `src/lib/pdf/parser-registry.ts`

**Supported banks today:** HDFC (savings), Federal Bank. Federal statements often use a logo instead of the bank name in extractable text — the Federal parser detects via table column headers (e.g. Particulars, Tran Type, Tran ID) and footer text such as `federalbank.co.in`.

## No Tests Currently

There is no test suite. If adding tests, prefer integration tests that hit a real (test) database over mocked ones — the deduplication and categorization logic depends heavily on DB state.

## Security Notes

- All API routes verify the authenticated user's ownership before touching data (`session.user.id` checked against DB records)
- Passwords: bcrypt with 12 rounds
- Email: normalized to lowercase before storage/lookup
- Input validation with Zod on all API endpoints and form schemas
