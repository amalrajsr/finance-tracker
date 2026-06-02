# Graph Report - fn-tracker  (2026-06-02)

## Corpus Check
- 126 files · ~32,137 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 441 nodes · 881 edges · 20 communities (14 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3c3e311e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 19|Community 19]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 35 edges
2. `CategoryOption` - 17 edges
3. `useToast()` - 17 edges
4. `Button` - 14 edges
5. `Input()` - 11 edges
6. `SerializedTransaction` - 7 edges
7. `TransactionForm()` - 7 edges
8. `generateOtp()` - 7 edges
9. `hashOtp()` - 7 edges
10. `getOtpExpiryDate()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `RootLayout()` --calls--> `cn()`  [EXTRACTED]
  src/app/layout.tsx → src/lib/utils.ts
- `ResendButton()` --calls--> `useToast()`  [EXTRACTED]
  src/app/(auth)/_components/resend-button.tsx → src/hooks/use-toast.tsx
- `GET()` --calls--> `getAnalyticsSummary()`  [EXTRACTED]
  src/app/api/analytics/summary/route.ts → src/lib/analytics.ts
- `POST()` --calls--> `verifyOtp()`  [EXTRACTED]
  src/app/api/auth/reset-password/route.ts → src/lib/otp.ts
- `POST()` --calls--> `verifyOtp()`  [EXTRACTED]
  src/app/api/auth/verify-email/route.ts → src/lib/otp.ts

## Import Cycles
- 1-file cycle: `src/app/dashboard/transactions/_hooks/use-manual-transaction.ts -> src/app/dashboard/transactions/_hooks/use-manual-transaction.ts`

## Communities (20 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (41): cleanDescription(), extractOpeningBalance(), extractStatementPeriod(), extractStatementPeriodFromAllLines(), federalParser, isContinuationLine(), isFooterLine(), isHeaderLine() (+33 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (43): CategoryDropdown(), CalendarHeaderProps, ConfirmationModal(), ConfirmationModalProps, ConfirmationVariant, cn(), LoginPage(), LoginVariables (+35 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (35): CategoryBadge(), CategoryBadgeProps, CategoryOption, CategoryDropdownProps, CalendarViewProps, CategorySelect(), CategorySelectProps, useIsMobile() (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (15): categorize(), UserRule, systemRules, { handlers, signIn, signOut, auth }, loginSchema, globalForPrisma, patchSchema, GET() (+7 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (20): extractMerchant(), titleCase(), BackfillBanner(), CategoryBreakdownChart(), CategoryBreakdownRow, ChartPalette, DailyHeatmapRow, DailySpendingChart() (+12 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (18): geist, inter, jetbrainsMono, metadata, RootLayout(), viewport, AuthThemeToggle(), AuthBrandPanel() (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (17): CalendarCellData, CalendarDayData, DailyTotalsResponse, CalendarDayCell(), CalendarDayCellProps, CalendarGrid(), CalendarGridProps, CalendarHeader() (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (16): ChangePasswordSection(), DangerModal, DangerZone(), ProfileEditor(), ProfileSection(), ToastAction, ToastContext, ToastContextType (+8 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (16): OtpInput(), OtpInputProps, ResendButton(), ResendButtonProps, VerifyEmailForm(), VerifyEmailFormProps, useCountdown(), maskEmail() (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.21
Nodes (16): forgotPasswordSchema, POST(), sendOtpEmail(), sendPasswordResetEmail(), generateOtp(), getOtpExpiryDate(), hashOtp(), verifyOtp() (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.21
Nodes (6): TransactionForm(), TransactionFormProps, useManualTransaction(), transactionFormSchema, TransactionFormValues, patchSchema

### Community 11 - "Community 11"
Cohesion: 0.29
Nodes (7): DayTransactionItem(), DayTransactionItemProps, DayTransactionList(), DayTransactionListProps, DayTransaction, DayTransactionsResponse, useDayTransactions()

## Knowledge Gaps
- **78 isolated node(s):** `OtpInputProps`, `ResendButtonProps`, `LoginVariables`, `ResendResetOtpVariables`, `SignupVariables` (+73 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button` connect `Community 1` to `Community 0`, `Community 2`, `Community 7`, `Community 8`, `Community 10`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 1` to `Community 8`, `Community 11`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `useToast()` connect `Community 2` to `Community 8`, `Community 10`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `OtpInputProps`, `ResendButtonProps`, `LoginVariables` to the rest of the system?**
  _78 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.051560379918588875 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06821787414066631 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07792207792207792 - nodes in this community are weakly interconnected._