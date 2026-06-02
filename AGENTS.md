# CLAUDE.md — fn-tracker (FinTrack)

## Mandatory Rules

**Before writing or modifying any code, you MUST follow `.claude/rules/code-style-guide.md`.** Key non-negotiable rules:

- **Route = Feature**: Each route is self-contained. Auth pages live under `(auth)/` route group.
- **Page max 200 lines**: Break into components under `_components/` if exceeded.
- **Pages are thin wrappers**: Compose from `_components/`, `_hooks/`, `_services/` — no heavy inline JSX.
- **Shared code in route groups**: If two sibling routes share logic, extract to the group's `_components/` or `_hooks/`.
- **No cross-route imports**: Shared code goes to global `components/`, `hooks/`, `utils/`, or `lib/`.
- **Naming**: `kebab-case` files, `PascalCase` components, `use-` prefix hooks, `UPPER_SNAKE_CASE` constants.

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

## gstack

- For all web browsing, use the `/browse` skill from gstack.
- Never use `mcp__claude-in-chrome__*` tools.
- Available gstack skills: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/setup-gbrain`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`, `/plan-devex-review`, `/devex-review`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`.

## graphify
You have access to a Graphify knowledge graph at:
`D:\personal_projects\fn-tracker\graphify-out`

For codebase questions, architecture questions, or "where does this live?" questions:

1. First run:
   `graphify query "<user question>" --graph "D:\personal_projects\fn-tracker\graphify-out\graph.json"`
2. If the question is about a specific symbol or concept, prefer:
   `graphify explain "<symbol or concept>" --graph "D:\personal_projects\fn-tracker\graphify-out\graph.json"`
3. If the question is about how two things connect, prefer:
   `graphify path "<node A>" "<node B>" --graph "D:\personal_projects\fn-tracker\graphify-out\graph.json"`
4. Use the graph result first. Only read specific files when the graph output is insufficient or you need exact implementation detail.

Rules:
- Do not scan the whole repo before checking the graph.
- Do not load full files unless the graph points you there or the task requires exact code edits.
- Prefer graph relationships, bridge nodes, and shortest paths when explaining architecture.
- Cite the source files surfaced by graphify when possible.
- After significant code changes, refresh the graph with:
  `graphify update .`
- If documentation/images need semantic extraction, run a full `/graphify .` flow from the agent instead of relying on `graphify update .`.
