# Product Specification — PEIT v1

## Vision

**One place for all personal money:** salary, bills, SIPs, chit funds, cash on hand, and who owes whom. No mental math, no scattered spreadsheets, no app-store friction.

**Progressive Web App first:** install from the browser, works offline, gets push reminders. No Apple Developer account, no $99/year, no review queue.

---

## Target user

Single user (the owner) for v1. Multi-user / family sharing is out of scope for v1.

---

## Feature catalog (delivered in v1)

### 1. Accounts & total balance
- Multiple accounts: bank, cash, wallet, custom
- Each account: name, type, starting balance
- **Total balance** = sum of (starting balance + net transactions) across all accounts
- Home screen shows the total balance prominently; each account's own balance a tap away

### 2. Custom income & expense categories
- Pre-seeded system categories (income: Salary, Bonus, Other Income; expense: SIP, Credit Card Bill, Chit Fund, Groceries, Rent, Transport, Utilities, Entertainment, Other Expense)
- User can add custom categories: name, type (income/expense), **emoji icon**, **color hex**
- Categories are per-user (RLS)

### 3. Transactions (ledger)
- Fields: account, category, type (income/expense), amount (>0), date, optional note
- Grouped by date on the transactions screen, newest first
- CRUD via server actions; optimistic updates on the client via revalidation
- Search/filter: URL `?date=YYYY-MM-DD` deep-links to a specific day

### 4. Recurring rules (auto-posting)
- Once-off setup: account, category, type, amount, day-of-month (1–31)
- Frequency: monthly (only option in v1)
- Engine (`src/lib/recurring.ts`): on each run, finds all active rules whose `next_run_date <= today`, inserts a transaction for each, then advances `next_run_date` by one calendar month (clamping day-of-month for Feb)
- **Opportunistic run** on every app load (layout.tsx) so it works without crons; plus a scheduled cron target at `/api/cron/recurring` (Bearer `CRON_SECRET`)

### 5. Friends & family lending tracker
- People: name only
- Entries per person: direction (lent / borrowed), amount, optional note, optional due date
- **Net balance per person** = sum(lent) − sum(borrowed) — displayed on the People screen
- Settle-up: partial or full — creates a counter-entry with negative amount to zero out
- Outstanding view filters to non-settled entries with a due date; used by the push reminder cron

### 6. Reports & analytics
- **Category donut** (expense breakdown by category, current month)
- **6-month trend** (income vs. expense bars, last 6 calendar months including current)
- **Calendar** — grid for selected month; tap a day to see/add that day's transactions
- Month selector in URL: `?m=YYYY-MM`; defaults to current month

### 7. Security — PIN & biometric lock
- **PIN**: 4+ digits, salted SHA-256 stored in `localStorage`, verified client-side. Optional, opt-in from Security screen.
- **Biometric (WebAuthn)**: registers a platform authenticator (Face ID / Touch ID / Windows Hello) per device/browser. Credential ID stored in `localStorage`. Verification uses `navigator.credentials.get({userVerification:"required"})`. Falls back to PIN if biometric fails or unavailable.
- **Relock behavior**: after app is hidden/backgrounded for 30 s, next visible transition re-prompts. Quick tab switches (<30 s) don't relock.

### 8. Notifications (Web Push)
- VAPID keys in env; subscriptions stored in `push_subscriptions` (endpoint + p256dh + auth, per device/browser)
- Notifications page: subscribe / unsubscribe / send test
- **Lending reminders cron** (`/api/cron/lending-reminders`): daily, finds outstanding entries with `due_date <= today` for each subscribed user, pushes one notification per entry ("Due today" / "Overdue: ₹X — Person owes you" or "You owe Person")

### 9. PWA / installability
- `manifest.json`: standalone, theme `#8b8262`, background `#f7f5ec`, maskable + any icons (192/512)
- Service worker (`worker/index.js` via `next-pwa`):
  - Precaches manifest entries
  - Navigate → NetworkFirst (8 s timeout) → offline.html fallback
  - Images/fonts → CacheFirst with 30-day expiration
  - Push event handler shows notification with action button opening the app

---

## Non-goals (v1)
- Multi-user / shared ledgers
- Budgeting / spending limits per category
- Receipt OCR / photo upload
- Multi-currency (INR only via `en-IN` locale formatting)
- Export / backup (CSV, PDF)
- Dark mode auto-switch (only `prefers-color-scheme` media query — no manual toggle)

---

## Roadmap hints (post-v1)
- Family sharing via Supabase Realtime + invites
- Budgets + overspend alerts
- Multi-currency with daily FX rates
- CSV/JSON export + iCloud/Drive backup
- Year-over-year comparison in Reports
- Desktop-specific layout (sidebar permanent on wide screens)

---

## Metrics to watch (v1)
- Time-to-first-transaction after signup
- % users who enable PIN lock
- Push permission grant rate
- PWA install rate (beforeinstallprompt)
- Recurring rule creation rate
- Settle-up completion rate on lending entries