---
trigger: always_on
description: Code style and feature-based architecture guide for the project.
---

# Code Style & Architecture Guide

## Route-as-Feature Project Structure

Organize the codebase by treating **each route as a feature**. Instead of a separate `features/` folder, each route directory (e.g., `dashboard/`, `transactions/`) is a self-contained module with its own components, hooks, utils, services, constants, and types colocated alongside its `page.tsx`.

### Top-Level `src/` Layout

```
src/
├── app/                        # Next.js App Router — routes ARE features
│   ├── (auth)/                 # Route group for auth pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── _components/         # Components scoped to auth
│   │   ├── _hooks/              # Hooks scoped to auth
│   │   ├── _services/           # API calls for auth
│   │   ├── _utils/              # Helper functions for auth
│   │   ├── _constants/          # Constants scoped to auth
│   │   └── types.ts            # Types/interfaces for auth
│   │
│   ├── dashboard/              # ⭐ Dashboard feature
│   │   ├── _components/         # Components scoped to dashboard
│   │   ├── _hooks/              # Hooks scoped to dashboard
│   │   ├── _services/           # API calls for dashboard
│   │   ├── _utils/              # Helper functions for dashboard
│   │   ├── _constants/          # Constants scoped to dashboard
│   │   ├── types.ts            # Types/interfaces for dashboard
│   │   └── page.tsx
│   │
│   ├── transactions/           # ⭐ Transactions feature
│   │   ├── _components/
│   │   ├── _hooks/
│   │   ├── _services/
│   │   ├── _utils/
│   │   ├── _constants/
│   │   ├── types.ts
│   │   └── page.tsx
│   │
│   ├── api/                    # API routes
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/                 # 🌐 Global/shared components
│   ├── ui/                     # Generic UI primitives (Button, Input, Modal, Card)
│   ├── layout/                 # Layout shells (Sidebar, Header, PageContainer)
│   └── common/                 # Shared composed components (DataTable, EmptyState)
│
├── hooks/                      # 🌐 Global/shared hooks
│
├── services/                   # 🌐 Global services (API client setup, base fetchers)
│
├── utils/                      # 🌐 Global utility functions
│
├── constants/                  # 🌐 Global constants (app-wide config, enums)
│
├── types/                      # 🌐 Global types (shared interfaces, API response types)
│
├── lib/                        # Third-party integrations & config (auth, db, providers)
│
└── styles/                     # Global styles, theme tokens (if not using globals.css alone)
```

---

## Rules

### 1. Route = Feature

- Each route directory **is** the feature. There is no separate `features/` folder.
- Feature-specific code (components, hooks, services, utils, constants, types) lives **inside the route directory**, alongside `page.tsx`.
- For **route groups** like `(auth)`, feature-scoped folders (components, hooks, etc.) live directly under the group folder and are shared across its child routes (e.g., `login/`, `signup/`).

### 2. Feature Isolation

- A route's feature code must be **self-contained**. Everything specific to that route lives inside it.
- Routes **must not import from other routes' feature code** directly. If two routes share logic, extract it to a global folder (`components/`, `hooks/`, `utils/`, etc.).

### 3. Route Feature Folder Contents

Every route directory **can** contain (alongside `page.tsx`):

| Folder / File   | Purpose                                           |
| ---------------- | ------------------------------------------------- |
| `components/`    | UI components scoped to this route/feature        |
| `hooks/`         | Custom React hooks scoped to this route/feature   |
| `services/`      | API calls, server actions, data-fetching logic    |
| `utils/`         | Pure helper functions for this route/feature      |
| `constants/`     | Feature-specific constants and enum-like values   |
| `types.ts`       | All TypeScript types/interfaces for this feature  |

Only create folders that are needed — don't scaffold empty folders.

### 4. Global vs Route-Feature Scope

| If it's used by…             | Put it in…                              |
| ----------------------------- | --------------------------------------- |
| A single route only           | Inside that route's directory           |
| A route group (e.g., auth)    | Inside the route group folder `(auth)/` |
| Two or more unrelated routes  | Global `components/`, `hooks/`, `utils/`, etc. |
| Third-party config/setup      | `lib/`                                  |

### 5. Naming Conventions

- **Files**: `kebab-case` for filenames (e.g., `transaction-list.tsx`, `use-transactions.ts`).
- **Components**: `PascalCase` for component names (e.g., `TransactionList`).
- **Hooks**: Prefix with `use` (e.g., `useTransactions`).
- **Types file**: Always named `types.ts` at the route/feature root.
- **Services**: Descriptive names ending with the action (e.g., `fetch-transactions.ts`, `create-transaction.ts`), or grouped as `transaction.service.ts`.
- **Constants**: `UPPER_SNAKE_CASE` for constant values.

### 6. Import Rules

```
✅ route feature → global components/hooks/utils
✅ route feature → lib
✅ route page.tsx → its own feature code (components/, hooks/, etc.)
✅ route page.tsx → global components
❌ route A feature → route B feature (extract shared code to global instead)
❌ global → route feature (global must not depend on route-specific code)
```

### 7. Component Guidelines

- Keep components **small and focused** — one responsibility per component.
- Colocate a component's sub-components in the same folder if they are only used together.
- Client components should have `"use client"` at the top. Default to Server Components in `app/` routes.
- Props interfaces go in the component file unless shared, then in `types.ts`.
- utility functions should always be placed at /src/lib. components or page should only import and use those fucntions not define inside the page itself.

### 8. Type Safety

- Prefer `interface` for object shapes, `type` for unions/intersections.
- No `any` — use `unknown` and narrow, or define a proper type.
- API response types belong in the route's `types.ts` or global `types/` if reused.

### 9. App Router (`app/`) Rules

- Route `page.tsx` files should be **thin wrappers** — compose from the route's `components/` folder.
- Use route groups `(groupName)` for organizing layouts without affecting the URL.
- API routes go in `app/api/` and should call into route `services/` or `lib/`.
- Loading, error, and not-found files live alongside their route's `page.tsx`.

### 10. Services & Data Fetching

- Feature-specific API calls live in the route's `services/` folder.
- Shared API client setup (base URL, interceptors, auth headers) lives in `services/` or `lib/`.
- Use server actions or route handlers for mutations — keep them in the route's `services/` folder.

### 11. State Management

- Prefer React Server Components and URL state (search params) over client-side state.
- For client-side state, use React context or Zustand scoped to the route/feature.
- Global app-wide state (theme, auth session) lives in `lib/` or a top-level provider.

### 12. Readability
- A page should not exceed more than 200 lines. In that case break it into small meaningfull components to add readability and maintainability