# Architecture Specification — PEIT v1

## System overview

**Client**: Next.js 16.3.5 App Router (React 19, TypeScript strict). All UI in a single codebase — auth screens and app screens live under the same root `src/app/`.

**SSR / SSG**: Each page that needs data is an `async` Server Component that calls `createClient()` to instantiate a Supabase client. Only interactive forms use `"use client"` / Server Actions.

**Auth**: Supabase Auth (email+password, magic link not enabled). Session stored in HttpOnly cookies (`@supabase/ssr`) and sync'd to client-side `localStorage`/`sessionStorage` for reactivity.

**State**: Most app data lives in Postgres via Supabase RPCs and views. Client state is minimal — PIN/localStorage, modal open/close, and push subscription state.

**Data model** (3NF + denormalized views for read-heavy paths):

| Table | Purpose |
|---|---|
| `public.accounts` | One row per bank/cash/wallet account per user |
| `public.categories` | Income/expense categories (system defaults + custom) |
| `public.transactions` | Every transaction ever recorded |
| `public.recurring_rules` | Auto-posting rules (SIP / EMI / chit fund) |
| `public.people` | Lending tracker participants |
| `public.lending_entry` | Money lent / borrowed per person, per entry |
| `public.push_subscriptions` | VAPID-endpoint + keys per device/browser |

**Views** (used in API routes & components):

| View | Query |
|---|---|
| `account_balances` | `accounts.id + starting_balance + sum(transactions.amount grouped by account)` — gives total balance per user |
| `category_slices` | Grouped transaction amounts per category, optional date range |
| `person_balances` | `people.id + net lending` across all entries |
| `lending_entry_outstanding` | Entries with `status != settled` + `due_date <= today` (for reminders) |

All views have RLS: `auth.uid()` = user_id row filter.

**Background jobs / cron**:

| Cron | What it runs | Trigger |
|---|---|---|
| `/api/cron/recurring` (daily 01:30 UTC) | `runDueRecurringRules()` — finds active rules with `next_run_date <= today`, inserts a transaction for each, advances `next_run_date` one month | Vercel Cron + Bearer `CRON_SECRET` |
| `/api/cron/lending-reminders` (daily 02:30 UTC) | `checkLendingDueReminders()` — outstanding entries with due date; pushes one web notification per entry to each subscribed device | Vercel Cron + Bearer `CRON_SECRET` |

The dev server also runs `runDueRecurringRules()` on every page load so rules test without needing a live cron — this is enough for development.

**PWA**:

- `next-pwa` + hand-written `worker/index.js` (Workbox)
- Manifest serves standalone mode, maskable icons 192/512
- Service worker: pages NetworkFirst (8 s timeout), assets CacheFirst 30-day expiration
- Offline fallback page at `/offline.html`

**Design tokens (Tailwind v4 custom theme)**:

| Token | Value |
|---|---|
| `--color-paper` | `#f7f5ec` (light), `#1c1d16` (dark) |
| `--color-ink` | `#24261f` (light), `#ede9d8` (dark) |
| `--color-surface` | `#ffffff` (light), `#262820` (dark) |
| `--color-border` | `#dcdac8` (light), `#3a3d2f` (dark) |
| `--color-palm` | `#8b8262` (light), `#c7be93` (dark) |
| `--color-sand` | `#cbd081` (light), `#33351f` (dark) |
| `--color-sage` | `#dcedb9` (light), `#dcedb9` (dark) |
| `--color-mist` | `#726c56` (light), `#6c7877` (dark) |
| `--color-positive` | `#5b7a3a` (light), `#9bc37a` (dark) |
| `--color-negative` | `#a6503b` (light), `#e08a72` (dark) |
| `--color-warning` | `#b98a3e` (light), `#dcb46b` (dark) |

Colors map to Tailwind `palm-*`, `sand-*`, `sage-*`, `mist-*`, `positive-*`, `negative-*`, `warning-*`.

**Key architectural decisions**

| Decision | Rationale |
|---|---|
| App Router + Server Components | Reduces bundle size; data fetching stays on the server, only interactive widgets go client-side |
| Supabase over self-hosted Postgres | Free tier covers auth + Postgres; Row-Level Security eliminates auth-boilerplate |
| Next.js PWA plugin + hand-written worker | Keeps control over push event payloads and offline routing; `next-pwa` handles precaching, custom worker handles push + offline fallback |
| LocalStorage for PIN + biometric credential ID | Zero backend storage needed for opt-in locks; pins are never sent to the server |
| Supabase Auth with cookie session + middleware protection | Standard pattern; `middleware.ts` redirects unauthenticated to `/login`, logged-in away from `/login` |
| Cron jobs as Next.js API routes | No separate worker process needed; Vercel Cron handles scheduling and authenticates via Bearer header |
| `runDueRecurringRules` runs on every page load in dev | Makes recurring rule testing frictionless — no cron setup required while developing locally |

---

## Data model (ERD summary)

```
┌─────────────     ┌─────────────     ┌─────────────
│   users       │   accounts      │   categories
│ (auth.users)   │   per user      │ per user
└─────────────   └─────────────     └─────────────
       │                   │                     │
       │                   │                     │
       ▼                   ▼                     ▼
┌─────────────     ┌─────────────     ┌─────────────
│  transactions    │  recurring_rules│  person_balances
│ per user        │ per user        │ per user
└─────────────     └─────────────     └─────────────
       │                   │                     │
       │                   │                     │
       ▼                   ▼                     ▼
┌─────────────     ┌─────────────     ┌─────────────
│  people          │  lending_entry  │  push_subscriptions
│ per user        │ per entry       │ per device
└─────────────     └─────────────     └─────────────
```

- `accounts.user_id → auth.users.id` (FK, cascade delete)
- `categories.user_id → auth.users.id`
- `transactions.user_id, transactions.account_id, transactions.category_id → FK`
- `recurring_rules.user_id, recurring_rules.account_id, recurring_rules.category_id → FK`
- `people.user_id → auth.users.id`
- `lending_entry.user_id, lending_entry.person_id → FK`
- `push_subscriptions.user_id → auth.users.id`

---

## API surface (server actions + API routes)

| Endpoint / Action | What it does |
|---|---|
| `createTransaction(formData)` | Insert a new transaction; revalidates `/transactions` |
| `runDueRecurringRules(supabase, userId)` | Main scheduler engine (recurring.ts) |
| `checkLendingDueReminders(supabase, userId)` | Find outstanding + due-date entries; send one push per entry |
| `sendPushToUser(supabase, userId, payload)` | Send web push to every subscription the user has |
| `subscribeToPush()` / `unsubscribeFromPush()` | Client-side push subscription management |
| `setPin(pin)` / `verifyPin(pin)` / `clearPin()` | PIN lock lifecycle |
| `registerBiometric(userId, userEmail)` / `verifyBiometric()` | WebAuthn lifecycle |
| `middleware.ts` | Per-route auth guard: redirect `/login` ⇄ `/dashboard` based on session |
| `/api/cron/recurring?auth=Bearer …` | Vercel cron route; checks secret, runs recurring rules per user |
| `/api/cron/lending-reminders?auth=Bearer …` | Vercel cron route; checks secret, sends push reminders per user |

---

## Development story

1. `npm install` → restores `.bin` shims (project folder has spaces, so use the `peit` junction)
2. `npm run dev` → starts at `http://localhost:3000`
3. Dev server also runs `runDueRecurringRules` on each page load — no cron setup needed locally
4. Auth works via Supabase magic link / email password; first sign-up seeds default categories via trigger `on_auth_user_created`
5. Push dev tip: use the Notifications page → "Send test notification" — it sends to the current browser even without a real subscription row (the test button bypasses the DB and just calls `webpush.sendNotification` with a dummy endpoint; if you get a notification, your VAPID keys and SW are wired correctly)

---

## Deployment checklist

- [ ] All `.env.local` values promoted to Vercel project env vars (including `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`)
- [ ] Supabase migrations `0001` → `0003` run once in the connected project
- [ ] Supabase RLS enabled on all tables (the migrations add `enable RLS` and policies)
- [ ] Push VAPID keys generated and placed in env; `web-push.setVAPIDDetails` configures correctly
- [ ] `vercel.json` cron schedules present (`/api/cron/recurring` and `/api/cron/lending-reminders`)
- [ ] `manifest.json` has correct icons (replace with project-branded assets if desired)
- [ ] Test: `localhost:3000` → Sign up → Create account → Add a transaction → Verify recurring rule appears auto-generated after a minute or after the dev-server opportunistic run
- [ ] Test: Settings → Security → Set PIN → toggle lock → reload page → PIN prompt appears
- [ ] Test: Settings → Notifications → Subscribe → Send test notification → browser asks, notification fires
- [ ] Test: Offline toggle (dev tools → Application → Service Workers → Offline) → page either loads from cache or shows `/offline.html`