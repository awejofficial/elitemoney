# PEIT — Personal Expense & Income Tracker

Track income, expenses, and money owed between friends and family — all in one place.

PEIT is a **Progressive Web App (PWA)**: no app store needed. Add it to your phone's home screen straight from the browser — it runs full-screen, works offline, and can send due-date reminders via push notifications.

**Owner:** Dasari Sambasiva Naidu · **Status:** v1 feature-complete (dev)

---

## Features

| Feature | What it does |
|---|---|
| **Accounts & total balance** | Bank, cash, and wallet accounts rolled into one running total on the home screen — with each account's own balance always a tap away. |
| **Custom income & expense categories** | Salary, SIP, Chit Fund and more come built in — pick your own icon and color, or add categories of your own. |
| **Recurring transactions** | Set a SIP, EMI, or chit fund once and it logs itself every month, right on schedule — no manual re-entry. |
| **Friends & family lending tracker** | Track money lent and borrowed per person, with a running net balance and partial or full settle-up. |
| **Reports & calendar view** | Category breakdown (donut), a 6-month income vs. expense trend, and a calendar you can tap to see or add any day's activity. |
| **PIN & biometric lock** | An optional PIN or Face ID / Touch ID lock on top of your account login — off by default, on when you want it. |
| **Push reminders** | Web Push notifications for lending entries due today / overdue, plus a test button to verify delivery. |
| **Installs like a real app** | Full manifest + service worker: standalone display, offline fallback, maskable icons. |

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.3.5 (App Router, React 19, TypeScript strict) |
| Styling | Tailwind CSS v4 with a custom semantic token theme |
| Fonts | Fraunces (display) + Manrope (body) via `next/font` |
| Backend / DB | Supabase — Postgres with Row Level Security, Auth, Database Views |
| Auth | Supabase Auth (email + password), session via `@supabase/ssr` cookies |
| PWA | `next-pwa` + hand-written Workbox service worker (`worker/index.js`) |
| Push | Web Push with VAPID keys (`web-push`), subscriptions in Postgres |
| Hosting | Vercel (app + `vercel.json` cron schedules) |

## Getting started

### 1. Prerequisites
- Node.js 20+ (developed on Node 24)
- A Supabase project (free tier is enough)

### 2. Environment
Copy `.env.local.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=...        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Supabase anon (publishable) key

# Web Push — generate once with:
#   node -e "console.log(require('web-push').generateVAPIDKeys())"
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com

# Only needed for the Vercel Cron routes:
SUPABASE_SERVICE_ROLE_KEY=...       # secret, server-only
CRON_SECRET=...                     # random secret sent as Bearer token
```

### 3. Database
Run the three migrations once, in order, in Supabase Dashboard → SQL Editor:

1. `supabase/migrations/0001_schema.sql` — tables + views + RLS
2. `supabase/migrations/0002_seed_categories.sql` — default categories per signup
3. `supabase/migrations/0003_push_subscriptions.sql` — push subscription table

### 4. Install & run

```bash
npm install
npm run dev        # http://localhost:3000
```

> **Windows path note:** if the project folder path contains spaces and `&`
> (as this one does), npm's bin shims can break. A clean workaround used for
> this repo: `New-Item -ItemType Junction -Path ..\peit -Target .` and run
> commands from the junction. See `memory.md` for details.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (webpack) at `localhost:3000` — PWA features disabled in dev |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `node scripts/generate-icons.mjs` | Regenerate PWA icon PNGs from `design/icon-maskable.svg` |

## Project layout

```
src/
  app/
    (auth)/login, (auth)/signup      # auth screens (client components)
    (app)/dashboard                  # home: total balance, recent tx, people
    (app)/accounts, categories       # manage accounts & categories
    (app)/transactions               # ledger + new transaction form
    (app)/recurring                  # rules list + new rule form
    (app)/people                     # lending tracker + settle-up
    (app)/reports                    # donut, trend, calendar (searchParam month)
    (app)/notifications              # push subscribe/unsubscribe + test
    (app)/security                   # PIN & biometric enrollment
    (app)/more                       # settings hub
    api/cron/recurring               # scheduled rule runner (Bearer CRON_SECRET)
    api/cron/lending-reminders       # scheduled push reminders
    page.tsx                         # marketing landing page
  components/                        # UI: forms, rows, nav, lock, reports
  lib/
    supabase/{client,server,middleware,database.types}.ts
    recurring.ts                     # rule scheduler engine
    appLock/{pin,biometric}.ts       # WebAuthn + hashed PIN lock
    push/{client,send,lendingReminders}.ts
supabase/migrations/                 # SQL schema (3 files)
worker/index.js                      # Workbox service worker source
public/                              # manifest, icons, offline.html, screenshots
docs/                                # design directive, reference screenshots
```

## Deployment (Vercel)

1. Push to Git and import into Vercel.
2. Add all `.env.local` values to the Vercel project env vars (including `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET`).
3. `vercel.json` registers two crons:
   - `/api/cron/recurring` — daily 01:30 UTC — runs due recurring rules
   - `/api/cron/lending-reminders` — daily 02:30 UTC — pushes due-date reminders
   Vercel sends `Authorization: Bearer $CRON_SECRET` automatically.

## Documentation

- [`product.md`](./product.md) — what PEIT is, feature specs, roadmap
- [`architecture.md`](./architecture.md) — system design, data model, flows
- [`design.md`](./design.md) — design system, tokens, components, motion
- [`memory.md`](./memory.md) — environment notes, decisions, known issues
- [`expense-tracker-prd.md`](./expense-tracker-prd.md) — original PRD (v1.0 draft)
