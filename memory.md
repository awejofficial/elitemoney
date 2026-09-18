# Project Memory — PEIT v1

> **Purpose:** capture the environment facts, decisions, fixes, and conventions so the next session can continue without re-deriving them.

---

## Project snapshot

| Item | Value |
|---|---|
| Name | PEIT — Personal Expense & Income Tracker |
| Type | Progressive Web App (PWA) |
| Platform | Web / mobile-first (iPhone Safari Add to Home Screen) |
| Owner | Dasari Sambasiva Naidu |
| Version | v1 feature-complete (development) |
| Stack | Next.js 16.3.5 · React 19.2.8 · TypeScript strict · Tailwind CSS v4 · Supabase |
| PWA | `next-pwa` + hand-written Workbox service worker (`worker/index.js`) |
| Push | Web Push (VAPID) via `web-push` |
| Auth | Supabase Auth (email + password) |
| Hosting target | Vercel (with cron schedules in `vercel.json`) |
| Workspace | `C:\Users\awejo\VScodeProject\Personal Expense & Income Tracker App\Personal Expense & Income Tracker App` |

---

## Environment facts (current machine)

| Item | Value / Note |
|---|---|
| OS | Windows |
| Node.js | v24.15.0 |
| npm | 11.12.1 (npm 12 available) |
| Shell | PowerShell (`pwsh`) |
| Dev server | `next dev --webpack` |
| Default port | `http://localhost:3000` |
| `.env.local` | **Present** — Supabase URL/anon key, VAPID public/private keys, VAPID subject, `CRON_SECRET`, service-role key placeholder |
| `node_modules` | **Present** (restored via `npm install`) |
| Junction workaround | `C:\Users\awejo\VScodeProject\peit` → points to the nested project folder |

---

## How to run (remember this)

```bash
# From the workspace root
cd "C:\Users\awejo\VScodeProject\Personal Expense & Income Tracker App\Personal Expense & Income Tracker App"
npm install            # only needed if node_modules is missing or incomplete
npm run dev            # http://localhost:3000
```

**Path gotcha:** the project folder name contains both spaces and an ampersand (`Personal Expense & Income Tracker App`). npm's `.bin` shims break on that path. Use the junction instead:

```powershell
# One-time setup (from workspace root)
New-Item -ItemType Junction -Path "C:\Users\awejo\VScodeProject\peit" `
  -Target "C:\Users\awejo\VScodeProject\Personal Expense & Income Tracker App\Personal Expense & Income Tracker App"

# Then run from the junction
cd "C:\Users\awejo\VScodeProject\peit"
npm run dev
```

---

## Decisions log

| Decision | Why |
|---|---|
| **Keep custom UI; do NOT initialize shadcn/ui** | Existing design is intentionally bespoke (paper/palm/sand palette, Fraunces + Manrope). User explicitly chose to keep it. |
| **Supabase as the single backend** | Free tier covers auth + Postgres; Row-Level Security handles per-user data isolation. |
| **Server Components for data pages** | Keeps bundle small; only interactive forms use `"use client"` + Server Actions. |
| **Opportunistic recurring run on every page load** | Makes recurring rules testable locally without needing a live cron; cron route exists for deployment. |
| **PIN stored client-side (salted SHA-256 in localStorage)** | Zero backend storage; lock is device-local and opt-in. |
| **Biometric via WebAuthn (platform authenticator)** | Native Face ID / Touch ID / Windows Hello, no custom biometric code. |
| **Push subscriptions in Postgres** | One row per device/browser, so reminders can fan out to all of a user's devices. |
| **NetworkFirst for page navigation** | Financial data should be live; only fall back to offline page when truly disconnected. |
| **CacheFirst for images/fonts** | Assets are hashed or rarely change; 30-day expiration keeps cache bounded. |

---

## Known issues & fixes (chronological)

### 1. `next` not found at first launch
**Symptom:** `npm run dev` → `'next' is not recognized as an internal or external command`.

**Cause:** `node_modules/.bin/next.cmd` was missing from the extracted project (zip extraction doesn't always preserve npm bin shims).

**Fix:** `npm install` (with workspace-local cache to avoid the earlier AppData cache EPERM) restored the shims.

---

### 2. `spawn EPERM` on dev server start
**Symptom:** Next.js fails to spawn its worker processes: `Error: spawn EPERM`.

**Cause:** The sandbox blocks process creation for the dev server.

**Fix:** Run the dev server with full access (sandbox permission `danger-full-access`) so Next can spawn its workers. The server then starts normally.

---

### 3. Hydration mismatch on `<html>`
**Symptom:** Console error — "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties" with a diff showing `suppresshydrationwarning="true"` and `data-qb-installed="true"` on `<html>`.

**Cause:** A browser extension injected attributes into `<html>` before React hydrated (one of React's documented hydration-mismatch causes).

**Fix:** Added `suppressHydrationWarning` to `<html>` in `src/app/layout.tsx`. Verified the attribute now renders server-side and the page returns 200.

---

### 4. `head` command not found in PowerShell
**Symptom:** `head` is not recognized.

**Cause:** PowerShell has no `head` alias.

**Fix:** Use PowerShell equivalents (`Select-Object -First`, or `Get-Content -TotalCount`).

---

## Environment variable reference (names only — never commit values)

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Supabase anon (publishable) key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Client | Web Push application-server key |
| `VAPID_PRIVATE_KEY` | Server only | Web Push VAPID private key |
| `VAPID_SUBJECT` | Server only | VAPID subject (`mailto:`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (cron) | Service-role key for scheduled jobs |
| `CRON_SECRET` | Server only (cron) | Bearer token for `/api/cron/*` routes |

`.env.local.example` exists as the template. **Never** paste real secrets into docs, commits, or chat.

---

## Conventions

| Convention | Value |
|---|---|
| Dates in DB / API | ISO `YYYY-MM-DD` via `toLocaleDateString("en-CA")` |
| Currency display | `Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })` |
| TypeScript | `strict: true`, `noEmit: true` |
| Styling | Semantic Tailwind tokens (`paper`, `ink`, `palm`, `sand`, `sage`, `mist`, `positive`, `negative`, `warning`) |
| Fonts | Fraunces (display) + Manrope (body) via `next/font/google` |
| Icons | Hand-rolled SVGs in `src/components/icons.tsx` (stroke 1.75, 24px viewBox) + emoji for categories |
| Layout | `flex` + `gap-*`; **no** `space-x-*` / `space-y-*` |
| Mobile nav | BottomTabBar (mobile) + Sidebar (desktop) |
| PWA | `next-pwa` + `worker/index.js`; manifest at `public/manifest.json` |

---

## Current app state (as of this session)

- **Dev server:** running at `http://localhost:3000` (background job `pwsh-5` in the harness session)
- **Landing page (`/`):** HTTP 200, PEIT content + Sign In section present
- **`/login`:** HTTP 200
- **`/dashboard`:** unauthenticated → correctly serves the login page (middleware redirect working)
- **Hydration fix:** applied (`suppressHydrationWarning` on `<html>`)

---

## Pending / next steps

| Priority | Item | Notes |
|---|---|---|
| High | Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` | Currently only a placeholder comment — needed for the Vercel cron routes to do anything useful |
| High | Verify production build | `npm run build` has not been run yet this session; run before deploying |
| Medium | Seed / verify data | Confirm default categories trigger on signup; test a transaction → recurring rule flow |
| Medium | Test Web Push end-to-end | Subscribe on Notifications page → send test notification → confirm browser notification arrives |
| Medium | Test AppLockOverlay | Set PIN → background tab 30s → foreground → verify PIN prompt |
| Low | Consider `next-pwa` in dev | Currently disabled in development (`disable: NODE_ENV === "development"`); only enabled in production builds |
| Low | Replace placeholder screenshots/icons | Existing `public/screenshots/*.png` are from the reference design; swap in real app captures before release |

---

## File map (quick reference)

```
src/app/(app)/dashboard/page.tsx      # home: balance, recent tx, people
src/app/(app)/accounts/               # account list + NewAccountForm
src/app/(app)/categories/             # category list + NewCategoryForm
src/app/(app)/transactions/           # ledger + NewTransactionForm
src/app/(app)/recurring/              # rules + NewRuleForm
src/app/(app)/people/                 # lending + NewPersonForm / NewEntryForm
src/app/(app)/reports/                # CategoryDonut, TrendChart, MonthCalendar
src/app/(app)/notifications/          # push subscribe/unsubscribe/test
src/app/(app)/security/               # PIN + biometric enrollment
src/app/(app)/more/                   # settings hub
src/app/(auth)/login, signup/         # auth
src/app/api/cron/recurring/route.ts   # scheduled rule runner
src/app/api/cron/lending-reminders/   # scheduled push reminders
src/lib/recurring.ts                  # recurring scheduler engine
src/lib/appLock/                      # PIN + WebAuthn biometric
src/lib/push/                         # subscription + send + reminders
src/lib/supabase/                     # client/server/middleware + database.types
supabase/migrations/                  # 0001 schema, 0002 seed, 0003 push
worker/index.js                       # Workbox service worker source
public/manifest.json                  # PWA manifest
```

---

## If something breaks

1. **`next` not found** → run `npm install` in the junction directory.
2. **`spawn EPERM`** → the sandbox is blocking child processes; the dev server needs full access.
3. **Hydration warning on `<html>`** → keep `suppressHydrationWarning`; test in incognito to confirm extension interference.
4. **Cron routes return 401/500** → check `CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars.
5. **Push doesn't fire** → verify VAPID keys, service worker registration, and browser Notification permission.

---

## Related docs

- [`README.md`](./README.md) — quick start & overview
- [`product.md`](./product.md) — product spec & roadmap
- [`architecture.md`](./architecture.md) — system design & data model
- [`design.md`](./design.md) — design system & component guidelines
- [`expense-tracker-prd.md`](./expense-tracker-prd.md) — original PRD (v1.0 draft)