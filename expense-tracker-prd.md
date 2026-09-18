# PRD: Personal Expense & Income Tracker App

**Owner:** Dasari Sambasiva Naidu
**Version:** 1.0 (Draft)
**Inspired by:** Money Manager (realbyteapps.com)

---

## 1. Overview

A mobile app to track personal salary-based income and expenses, with custom categories, multiple accounts rolled into one total balance, and a dedicated tracker for money lent to or borrowed from friends and family.

## 2. Goals

- Replace manual/mental tracking of salary, bills, SIPs, and chit fund payments.
- Give a single view of total balance across all accounts.
- Stop losing track of who owes whom, and how much.
- Keep category setup fully flexible, not locked to presets.

## 3. Target User

Single user (the owner) for v1. Multi-user/family-sharing is out of scope for v1 (see §9).

## 4. Platform & Tech Recommendation

**Delivery: Progressive Web App (PWA)** — no Apple Developer account, no App Store, no $99/year fee. Installed on iPhone via Safari → Share → "Add to Home Screen," runs full-screen with its own icon, works offline, and supports push notifications on iOS 16.4+.

| Layer | Recommendation | Why |
|---|---|---|
| Frontend | Next.js + `next-pwa` (service worker, offline, installable manifest) | React-based, wide ecosystem, easy PWA tooling. |
| Backend + DB | Supabase (Postgres + built-in Auth) | Free tier covers a single-user app entirely; relational Postgres fits the accounts/categories/transactions model and makes the reports (pie chart, trend, calendar) simple SQL queries. |
| Auth | Supabase Auth | Free, handles login/session without building your own. |
| Recurring transactions job | Vercel Cron (or Supabase Edge Function + `pg_cron`) | Free scheduled trigger to auto-add SIP/EMI/Chit Fund entries. |
| Push notifications | Web Push API via service worker | Free, native to the PWA — no separate push service needed. |
| Hosting | Vercel free tier | Pairs natively with Next.js, zero cost at personal-project scale. |

This whole stack runs at **$0/month** at personal-project scale — no Mac, no Xcode, no paid tier anywhere. Cloud sync (per your requirement) means every transaction, category, and lending entry lives in Supabase, not just on-device — the app is a client, not the source of truth.

## 5. Core Data Model (high-level)

- **User** — 1 per account (v1)
- **Account** — e.g. Bank, Cash, Wallet → each has a running balance; sum = Total Balance
- **Category** — type: `income` or `expense`; system-seeded (Salary, Bonus, SIP, Credit Card Bill, Chit Fund) + user-created custom ones (name, icon, color)
- **Transaction** — amount, date, account, category, type (income/expense), note, optional receipt-free (no attachments in v1)
- **Recurring Rule** — linked to a category/account, frequency (monthly/custom), auto-generates transactions on schedule (for SIP, EMI, Chit Fund)
- **Person** (lending tracker) — name, running net balance (positive = they owe you, negative = you owe them)
- **Lending Entry** — linked to a Person, amount, direction (lent/borrowed), date, due date (optional), status (open/partially settled/settled)

## 6. Features (v1 Scope)

### 6.1 Income & Expense Tracking
- Add transaction: amount, category, account, date, optional note.
- Income categories: Salary, Bonus, + custom.
- Expense categories: SIP, Credit Card Bill Payment, Chit Funds, + custom.
- Edit/delete any transaction.

### 6.2 Custom Categories
- Create/edit/delete custom income or expense categories.
- System-seeded categories (Salary, Bonus, SIP, Credit Card Bill, Chit Fund, etc.) ship with default icons and colors.
- User can change the icon/color of any category — default or custom — at any time.

### 6.3 Accounts & Total Balance
- Multiple accounts (Bank, Cash, Wallet, custom).
- Each transaction is tied to one account.
- Total Balance = sum of all account balances, shown on the home screen.
- Per-account balance also viewable individually.

### 6.4 Recurring Transactions
- Set up a recurring rule (e.g. SIP ₹5,000 on the 5th of every month).
- App auto-adds the transaction on schedule — no manual confirmation step.
- Recurring rules list, editable/cancelable anytime.
- Each auto-added transaction is a normal transaction afterward — editable or deletable individually (e.g. adjusting one month's SIP amount) without changing the recurring rule or future occurrences.

### 6.5 Friends & Family Lending Tracker
- Add a Person (once), then log Lending Entries against them.
- Tracks both directions: money you lent out and money you borrowed, netted into one balance per person ("Ravi owes you ₹2,000" / "You owe Priya ₹500").
- Settle-up: mark an entry as fully or partially paid back; balance updates accordingly.
- Optional due date per entry → push notification reminder as it approaches/passes.
- Person-wise history view (all entries with that person, running balance).

### 6.6 Reports & Analytics
- Category-wise pie chart (income and expense, filterable by month).
- Monthly income vs. expense trend (bar/line chart over time).
- Calendar view — tap a date to see that day's transactions, with a visual indicator (dot/color) for days with activity; also usable as a quick entry point to add a transaction for that date.

### 6.7 Security
- PIN or biometric (fingerprint/Face ID) lock on app open, in addition to account login.

## 7. Non-Functional Requirements

- Data synced to backend in near real-time; app usable with a normal 4G connection.
- All amounts in INR (₹) for v1 — no multi-currency needed.
- Optimized primarily for iPhone Safari (PWA), since that's the actual daily-use device; should still be usable on desktop Chrome for occasional web access.
- Zero-cost hosting/infra footprint (Vercel + Supabase free tiers) — no Apple Developer Program fee needed since it's not App-Store-distributed.

## 8. Out of Scope for v1

- Budget limits / spending alerts per category (explicitly deferred).
- Data export (CSV/Excel) or manual backup — cloud sync covers persistence for now.
- Multi-user/shared household accounts.
- Receipt/photo attachments on transactions.
- Multi-currency support.

## 9. Future Roadmap (post-v1 candidates)

- Budget limits with threshold alerts.
- CSV/Excel export.
- Attach photos to transactions/receipts.
- Shared accounts (e.g. with family member).
- Automated bank SMS/email parsing for transaction entry.

