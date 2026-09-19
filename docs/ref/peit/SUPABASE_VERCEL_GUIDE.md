# How to Change Supabase Project & Deploy to Vercel

This guide will help you switch the PEIT app to use a different Supabase project and deploy it to Vercel.

## Part 1: Create New Supabase Project

### Step 1: Create a Supabase Account (if you don't have one)
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Once logged in, click "New Project"

### Step 2: Configure Your New Project
1. Give your project a name (e.g., "peit-expense-tracker")
2. Set a database password (you'll need this for local development if connecting directly, though we use the anon key)
3. Choose a region closest to your users
4. Click "Create new project" (takes 1-2 minutes to provision)

### Step 3: Get Your Project Credentials
Once your project is ready:
1. Go to your project dashboard
2. In the left sidebar, click **Settings** → **API**
3. You'll see:
   - **Project URL** (looks like `https://your-project-ref.supabase.co`)
   - **anon public** key (the publishable key)
   - **service_role** key (secret key, for server-side operations)

**Important**: The anon public key starts with `sb_publishable_` and the service role key starts with `sb_service_role_`.

## Part 2: Run Migrations on Your New Supabase Project

You need to set up the database schema in your new Supabase project.

### Step 1: Access SQL Editor
1. In your Supabase project dashboard, click **SQL Editor** in the left sidebar
2. Click "New query"

### Step 2: Run the Migrations in Order
Run these three files **in this exact order**:

#### Migration 1: Schema Setup
```sql
-- Copy the entire contents of supabase/migrations/0001_schema.sql
-- Run it first
```

#### Migration 2: Default Categories
```sql
-- Copy the entire contents of supabase/migrations/0002_seed_categories.sql
-- Run it second (after 0001)
```

#### Migration 3: Push Subscriptions
```sql
-- Copy the entire contents of supabase/migrations/0003_push_subscriptions.sql
-- Run it third (after 0001 and 0002)
```

**Note**: Each migration file contains comments explaining what it does. Make sure to run them in order as they depend on each other.

### Step 3: Verify Tables Were Created
After running all three migrations:
1. Go to **Table Editor** in the left sidebar
2. You should see these tables:
   - `accounts`
   - `categories`
   - `transactions`
   - `recurring_rules`
   - `people`
   - `lending_entry`
   - `push_subscriptions`
   - Plus views: `account_balances`, `category_slices`, `person_balances`, `lending_entry_outstanding`

## Part 3: Update Your Local .env.local File

### Step 1: Locate .env.local
In your project root: `Personal Expense & Income Tracker App\Personal Expense & Income Tracker App\.env.local`

### Step 2: Update the Values
Replace these values with your new Supabase project's credentials:

```env
# Supabase Connection
NEXT_PUBLIC_SUPABASE_URL="https://your-new-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_your_new_anon_key_here"

# Web Push VAPID keys (you can generate new ones or keep existing)
# Generate new ones with: node -e "console.log(require('web-push').generateVAPIDKeys())"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BL..."  # your new public key
VAPID_PRIVATE_KEY="your_new_private_key"
VAPID_SUBJECT=mailto:your-email@example.com

# Cron auth secret (generate a new random string)
CRON_SECRET=$(openssl rand -hex 32)  # or use any random string

# Supabase service role key (from your new project's Settings > API)
SUPABASE_SERVICE_ROLE_KEY="sb_service_role_your_new_service_role_key_here"
```

### Step 3: Save the File
Save your changes to `.env.local`

## Part 4: Test Locally Before Deploying

### Step 1: Install Dependencies (if needed)
```bash
cd "Personal Expense & Income Tracker App\Personal Expense & Income Tracker App"
npm install
```

### Step 2: Run the Development Server
```bash
npm run dev
```
The app should now be running at `http://localhost:3000` and connected to your new Supabase project.

### Step 3: Test Basic Functionality
1. Try signing up for a new account
2. Verify you can see the dashboard
3. Try adding an account, category, or transaction
4. Check that data is being stored in your new Supabase project (you can verify in Table Editor)

## Part 5: Deploy to Vercel

### Step 1: Sign Up for Vercel (if needed)
1. Go to [https://vercel.com](https://vercel.com)
2. Sign up (you can use GitHub, GitLab, or Bitbucket for easy repo import)

### Step 2: Import Your Project
1. Click "New Project"
2. Import your Git repository (the one containing the PEIT app)
3. Vercel should automatically detect it's a Next.js project

### Step 3: Configure Environment Variables
During the import process (or after importing in Project Settings):
1. Go to **Settings** → **Environment Variables**
2. Add these variables (use the same values from your updated `.env.local`):

| Key | Value | Type |
|-----|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-new-project-ref.supabase.co` | Environment Variable |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_your_new_anon_key_here` | Environment Variable |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BL...` | Environment Variable |
| `VAPID_PRIVATE_KEY` | `your_new_private_key` | Environment Variable (marked as **Secret**) |
| `VAPID_SUBJECT` | `mailto:your-email@example.com` | Environment Variable |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_service_role_your_new_service_role_key_here` | Environment Variable (marked as **Secret**) |
| `CRON_SECRET` | `your_random_string_here` | Environment Variable (marked as **Secret**) |

**Important**: Mark the secret keys (`VAPID_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`) as **Environment Variables** in Vercel so they're not exposed in the client-side code.

### Step 4: Deploy
1. Click "Deploy"
2. Vercel will build your project and deploy it
3. Once deployment completes, you'll get a URL like `https://peit-expense-tracker.vercel.app`

### Step 5: Set Up Vercel Cron Jobs (Important!)
The PEIT app uses Vercel's cron functionality for recurring rules and lending reminders.

1. In your Vercel project dashboard, go to **"Functions"** → **"Crons"** 
2. You should see two cron jobs already defined from `vercel.json`:
   - `/api/cron/recurring` - runs daily at 01:30 UTC
   - `/api/cron/lending-reminders` - runs daily at 02:30 UTC
3. Make sure these are enabled (they should be by default if `vercel.json` is present)

### Step 6: Verify Your Deployment
1. Visit your deployed URL (e.g., `https://peit-expense-tracker.vercel.app`)
2. Try signing up and using the app
3. Check that data is being stored in your new Supabase project
4. Verify the cron jobs are working by checking the logs in Vercel

## Part 6: Troubleshooting

### Common Issues & Solutions

**Issue**: "Failed to connect to Supabase" or authentication errors
- **Solution**: Double-check your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in both `.env.local` (for local) and Vercel environment variables

**Issue**: Tables not found or migration errors
- **Solution**: Verify you ran all three migration files in order on your new Supabase project
- Check the SQL Editor history to confirm they executed successfully

**Issue**: Web Push notifications not working
- **Solution**: 
  1. Verify your VAPID keys are correctly set in both `.env.local` and Vercel
  2. Make sure you've granted notification permissions in the browser
  3. Check the service worker is registered (look for errors in console)

**Issue**: Cron jobs not running
- **Solution**:
  1. Verify your Vercel project has the cron jobs configured
  2. Check that `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` are set correctly in Vercel (as secrets)
  3. Look at the function logs in Vercel to see if the cron endpoints are being called

**Issue**: Local development works but deployed version doesn't
- **Solution**: Remember that `.env.local` is only for local development. The deployed version uses the environment variables set in Vercel's dashboard.

## Part 7: Important Notes

1. **Data Isolation**: When you switch to a new Supabase project, you'll start with a completely empty database (no existing data). If you want to migrate data from your old project, you'll need to export/import it manually.

2. **Security**: Never commit your `.env.local` file to version control. It's already in `.gitignore`, but double-check before pushing.

3. **PWA Considerations**: When you deploy to a new domain (like your Vercel URL), you'll need to re-add the app to your phone's home screen. The old installation pointing to localhost won't work.

4. **Rate Limits**: Supabase free tier has generous limits, but if you expect heavy usage, monitor your usage in the Supabase dashboard.

5. **Environment Separation**: Consider using different Supabase projects for development vs. production to avoid accidentally modifying production data during development.

## Summary of Changes Made

When you follow this guide, you will have:
1. ✅ Created a new Supabase project
2. ✅ Set up the database schema with all required tables and views
3. ✅ Updated your local `.env.local` to point to the new Supabase project
4. ✅ Configured your Vercel deployment to use the new Supabase project
5. ✅ Verified both local and deployed versions work with the new Supabase backend
6. ✅ Set up the required cron jobs for recurring transactions and lending reminders

Your PEIT app is now fully switched to use your new Supabase project and is ready for use or further development!