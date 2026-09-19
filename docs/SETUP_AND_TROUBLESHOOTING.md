# EliteMoney — System Architecture, Setup & Troubleshooting Guide

This guide documents the complete architecture, setup process, and solutions to common errors for **EliteMoney** (a local-first personal finance tracker powered by Nuxt 4, Supabase, and PowerSync).

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Application                          │
│                                                                 │
│  Nuxt 4 / Vue 3  ───  Pinia Stores  ───  WA-SQLite (In-Browser) │
│  (Tailwind v4)                                (WASM + IDB VFS)  │
└──────────────┬──────────────────────────────────┬───────────────┘
               │ Direct Writes & Auth             │ Logical Sync
               ▼                                  ▼
┌───────────────────────────────┐  Replication  ┌──────────────────────────────┐
│       Supabase Backend        │ ────────────> │      PowerSync Service       │
│  PostgreSQL + Row-Level Sec   │   (WAL Pub)   │  (Cloud or Docker Instance)  │
└───────────────────────────────┘               └──────────────────────────────┘
```

- **Frontend**: Nuxt 4 (SPA / Static mode), Vue 3 Composition API, Pinia stores, Tailwind CSS v4, Nuxt UI.
- **Local Database**: SQLite running directly in the browser via WebAssembly (`wa-sqlite`) with an IndexedDB storage driver. The app reads and writes exclusively to local SQLite for instant, 0-latency UI updates.
- **Sync Engine**: PowerSync connects to Supabase PostgreSQL via logical replication and streams delta updates down to the client's local SQLite database.
- **Backend**: Supabase handles PostgreSQL storage, Row Level Security (RLS) enforcement, and Auth.
- **Hosting**: Vercel (static CDN hosting via `nuxt generate`).

---

## 2. Ported & Enhanced Features

EliteMoney integrates all core personal finance features alongside custom modules:

### A. People & Lending Ledger (`/people`, `/people/[id]`)
- **Purpose**: Track money lent to or borrowed from contacts, peers, and family.
- **Components**:
  - `app/app/components/people/usePeopleStore.ts`: Pinia store with offline persistence.
  - `app/app/pages/people/index.vue`: Summary cards (**You Lent**, **You Borrowed**, **Net Balance**), contact cards, and Add Person modal.
  - `app/app/pages/people/[id].vue`: Ledger history, Lend/Borrow action modals, status toggling (*Pending* vs *Settled*), and **Settle All** button.

### B. Recurring Transactions Engine (`/recurring`)
- **Purpose**: Automate subscriptions, salary, rent, and utility bill tracking.
- **Components**:
  - `app/app/components/recurring/useRecurringStore.ts`: Recurrence intervals (`daily`, `weekly`, `monthly`, `yearly`), next run calculator, and monthly financial impact projections.
  - `app/app/pages/recurring.vue`: Monthly recurring expenses, monthly recurring income, net monthly recurring balance, active rule toggles, and **Record Now** execution.

### C. Security: App Lock PIN & Biometric Unlock
- **Purpose**: Protect financial data with PIN and device biometrics (Face ID, Touch ID, Windows Hello).
- **Components**:
  - `app/app/components/security/pin.ts`: SHA-256 salted PIN hash via Web Crypto API.
  - `app/app/components/security/biometric.ts`: WebAuthn platform authenticator credentials.
  - `app/app/components/security/AppLockOverlay.vue`: Global modal overlay with numpad, dot indicators, and automatic auto-lock when app stays hidden in background for >30s.
  - `app/app/pages/settings.vue`: Settings card to set/remove PIN and toggle biometric unlock.

---

## 3. Database Setup (Supabase)

All database tables, Row Level Security policies, auth triggers, and replication publications are bundled in a single idempotent script:

📁 **Location**: [`app/supabase/setup_complete.sql`](file:///c:/Users/awejo/VScodeProject/Personal%20Expense%20&%20Income%20Tracker%20App/Personal%20Expense%20&%20Income%20Tracker%20App/app/supabase/setup_complete.sql)

### How to apply:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Go to **SQL Editor** → **New Query**.
3. Paste the contents of `app/supabase/setup_complete.sql` and run it (**Ctrl + Enter**).

### What it creates:
- **Tables**: `categories`, `wallets`, `trns`, `user_settings`, `rates`.
- **Indexes**: Fast lookups by `userId` and `date`.
- **RLS Policies**: Restricts reads and writes so users can only access their own records (`auth.uid() = "userId"`).
- **Auth Trigger**: Automatically provisions default `user_settings` when a new user signs up.
- **Replication Role**: Creates `powersync_role` with replication permissions.
- **Publication**: Creates the `powersync` publication for logical replication.

---

## 4. Sync Setup (PowerSync)

PowerSync replicates Supabase PostgreSQL data into client SQLite databases in real time.

### Configuration Steps:
1. In [app.powersync.com](https://app.powersync.com):
   - **Host**: `db.<supabase-project-ref>.supabase.co`
   - **Port**: `5432` (or `6543`)
   - **User**: `powersync_role`
   - **Password**: Password configured in `setup_complete.sql` (default: `powersync_secret_123`)
   - **Database**: `postgres`
   - **Publication Name**: `powersync`
2. In **Client Authentication**:
   - Provider: **Supabase**
   - URL: `https://<supabase-project-ref>.supabase.co`
3. In **Sync Rules**, paste the streams from [`app/powersync/config/sync-config.yaml`](file:///c:/Users/awejo/VScodeProject/Personal%20Expense%20&%20Income%20Tracker%20App/Personal%20Expense%20&%20Income%20Tracker%20App/app/powersync/config/sync-config.yaml):
   ```yaml
   config:
     edition: 3

   streams:
     user_data:
       auto_subscribe: true
       queries:
         - SELECT * FROM categories WHERE "userId" = auth.user_id()
         - SELECT * FROM wallets WHERE "userId" = auth.user_id()
         - SELECT * FROM trns WHERE "userId" = auth.user_id()
         - SELECT * FROM user_settings WHERE "userId" = auth.user_id()

     rates:
       auto_subscribe: true
       queries:
         - SELECT * FROM rates
   ```
4. Deploy the sync rules. PowerSync provides your **Instance URL**:
   `https://6aae53cc8453e7cf83384914.powersync.journeyapps.com`

---

## 5. Deployment to Vercel

The repository is configured to build as a static application:

### Environment Variables:
Set these in Vercel (*Project Settings → Environment Variables*):

| Key | Example Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://hknldzgadkqcjzwwdnzy.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` |
| `VITE_POWERSYNC_URL` | `https://6aae53cc8453e7cf83384914.powersync.journeyapps.com` |

### Vercel Project Settings:
- **Root Directory**: `app` (or `./` with root `vercel.json`)
- **Build Command**: `pnpm generate`
- **Output Directory**: `.output/public`
- **Install Command**: `pnpm install`

### Deploy via CLI:
```bash
# Deploy preview
npx vercel

# Deploy to production
npx vercel --prod
```

---

## 6. Common Errors & Troubleshooting

### Issue 1: `ERROR: 42P01: relation "public.wallets" does not exist`
- **Cause**: Running `create publication powersync for table ...` before the tables were created.
- **Solution**: Run the unified script [`app/supabase/setup_complete.sql`](file:///c:/Users/awejo/VScodeProject/Personal%20Expense%20&%20Income%20Tracker%20App/Personal%20Expense%20&%20Income%20Tracker%20App/app/supabase/setup_complete.sql). It defines all tables first before creating the publication.

---

### Issue 2: `Could not load your data. Check your connection and try again.`
- **Cause**: On initial login or after clearing browser storage, local SQLite is empty. The app attempts `waitForFirstSync()` to download the user's data from PowerSync. If `VITE_POWERSYNC_URL` is missing, incorrect, or the PowerSync instance is paused, the sync call times out.
- **Solution**:
  1. Verify `VITE_POWERSYNC_URL` is set to your active instance in Vercel environment variables and `app/.env`.
  2. Click **Try Demo Mode** on the error screen to bypass remote sync and run fully offline with sample data.
  3. Click **Sign Out / Switch Account** to return to the login screen and clear an invalid session.

---

### Issue 3: `supabaseUrl is required`
- **Cause**: Initializing Supabase client before runtime configuration has loaded or when `.env` variables are missing during SSR/hydration.
- **Solution**: In `app/app/composables/useSupabase.ts` and `app/nuxt.config.ts`, fallback defaults are configured so `createClient()` never throws on empty strings.

---

### Issue 4: Supabase OAuth / Login Redirect Loop
- **Cause**: The Vercel deployment URL is not registered in Supabase allowed redirect URLs.
- **Solution**:
  1. Open [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **URL Configuration**.
  2. Add your production domain:
     - `https://your-domain.vercel.app/**`
     - `https://your-domain.vercel.app/login`
  3. Ensure **Site URL** matches your primary deployment domain.

---

### Issue 5: PowerShell `&&` Command Chaining Failure on Windows
- **Cause**: Older Windows PowerShell versions do not support `&&` syntax.
- **Solution**: Use `;` to chain commands instead:
  ```powershell
  git add . ; git commit -m "update" ; git push
  ```

---

## 7. Development & Maintenance Commands

```bash
# Start local development server (Port 3050)
corepack pnpm --dir app exec nuxt dev -p 3050 --public

# Run TypeScript typecheck across all files
corepack pnpm --dir app exec nuxi typecheck

# Build static production bundle locally for testing
corepack pnpm --dir app exec nuxt generate

# Push and deploy to Vercel production
git add . ; git commit -m "feat: updates" ; git push
npx vercel --prod
```
