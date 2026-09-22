-- ===========================================================================
-- EliteMoney Complete Database & PowerSync Setup Script for Supabase
-- Run this entire script in Supabase SQL Editor (Ctrl + Enter)
-- ===========================================================================

-- 1. CORE FINANCIAL LEDGER TABLES (Synced via PowerSync SQLite)
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id                    text primary key default gen_random_uuid()::text,
  "userId"              text not null,
  name                  text not null,
  color                 text not null,
  icon                  text not null,
  "parentId"            text,
  "showInLastUsed"      boolean not null default false,
  "showInQuickSelector" boolean not null default false,
  "updatedAt"           bigint
);
create index if not exists categories_user_idx on public.categories ("userId");

create table if not exists public.wallets (
  id                   text primary key default gen_random_uuid()::text,
  "userId"             text not null,
  name                 text not null,
  color                text not null,
  currency             text not null,
  type                 text not null,
  "order"              integer not null default 0,
  "creditLimit"        double precision,
  "desc"               text,
  "isArchived"         boolean not null default false,
  "isExcludeInTotal"   boolean not null default false,
  "isWithdrawal"       boolean not null default false,
  "updatedAt"          bigint
);
create index if not exists wallets_user_idx on public.wallets ("userId");

create table if not exists public.trns (
  id                  text primary key default gen_random_uuid()::text,
  "userId"            text not null,
  type                smallint not null,
  date                bigint not null,
  "updatedAt"         bigint not null,
  "categoryId"        text,
  "desc"              text,
  amount              double precision,
  "walletId"          text,
  "expenseAmount"     double precision,
  "expenseWalletId"   text,
  "incomeAmount"      double precision,
  "incomeWalletId"    text
);
create index if not exists trns_user_idx on public.trns ("userId");
create index if not exists trns_user_date_idx on public.trns ("userId", date);

create table if not exists public.user_settings (
  id               text primary key,
  "userId"         text not null,
  "baseCurrency"   text not null default 'USD',
  locale           text
);
create index if not exists user_settings_user_idx on public.user_settings ("userId");

create table if not exists public.rates (
  id            text primary key default gen_random_uuid()::text,
  date          text not null,
  rates         jsonb not null,
  source        text,
  "updatedAt"   bigint not null
);
create unique index if not exists rates_date_source_idx on public.rates (date, coalesce(source, ''));

-- 2. EXTENDED APP TABLES (Synced via Supabase Realtime & PostgREST)
-- All id and reference columns are text strings (UUID format) without strict foreign keys
-- to prevent type incompatibilities and upload-order race conditions in offline sync.
-- ---------------------------------------------------------------------------

-- People & Lending
create table if not exists public.people (
  id          text primary key default gen_random_uuid()::text,
  user_id     text not null default auth.uid()::text,
  name        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists people_user_id_idx on public.people (user_id);

create table if not exists public.lending_entries (
  id          text primary key default gen_random_uuid()::text,
  user_id     text not null default auth.uid()::text,
  person_id   text not null,
  direction   text not null check (direction in ('lent', 'borrowed')),
  amount      numeric(14, 2) not null check (amount > 0),
  date        date not null default current_date,
  due_date    date,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists lending_entries_user_id_idx on public.lending_entries (user_id);
create index if not exists lending_entries_person_id_idx on public.lending_entries (person_id);
create index if not exists lending_entries_due_date_idx on public.lending_entries (due_date) where due_date is not null;

create table if not exists public.lending_repayments (
  id                text primary key default gen_random_uuid()::text,
  user_id           text not null default auth.uid()::text,
  lending_entry_id  text not null,
  amount            numeric(14, 2) not null check (amount > 0),
  date              date not null default current_date,
  note              text,
  created_at        timestamptz not null default now()
);
create index if not exists lending_repayments_user_id_idx on public.lending_repayments (user_id);
create index if not exists lending_repayments_entry_id_idx on public.lending_repayments (lending_entry_id);

-- Recurring Rules
create table if not exists public.recurring_rules (
  id            text primary key default gen_random_uuid()::text,
  user_id       text not null default auth.uid()::text,
  type          integer not null default 0,
  frequency     text not null default 'monthly' check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  amount        numeric(14, 2) not null check (amount > 0),
  category_id   text,
  day_of_month  integer,
  next_run_date date not null,
  active        boolean not null default true,
  note          text,
  created_at    timestamptz not null default now()
);
create index if not exists recurring_rules_user_id_idx on public.recurring_rules (user_id);
create index if not exists recurring_rules_next_run_date_idx on public.recurring_rules (next_run_date) where active;

-- Daily Tabs (Mess, Milk, Attendance, Habits)
create table if not exists public.daily_tabs (
  id                  text primary key default gen_random_uuid()::text,
  user_id             text not null default auth.uid()::text,
  name                text not null,
  category_type       text not null default 'custom',
  color               text not null default '#3b82f6',
  icon                text not null default 'lucide:calendar',
  currency            text not null default 'USD',
  unit_price          numeric(14, 2) not null default 0,
  unit_label          text not null default 'unit',
  default_wallet_id   text,
  default_category_id text,
  slots               jsonb,
  created_at          timestamptz not null default now()
);
create index if not exists daily_tabs_user_id_idx on public.daily_tabs (user_id);

create table if not exists public.daily_tab_logs (
  id          text primary key default gen_random_uuid()::text,
  user_id     text not null default auth.uid()::text,
  tab_id      text not null,
  date        text not null,
  total_units numeric(14, 2) not null default 0,
  slots       jsonb,
  note        text,
  updated_at  timestamptz not null default now()
);
create index if not exists daily_tab_logs_user_id_idx on public.daily_tab_logs (user_id);
create index if not exists daily_tab_logs_tab_date_idx on public.daily_tab_logs (tab_id, date);

create table if not exists public.daily_tab_settlements (
  id            text primary key,
  user_id       text not null default auth.uid()::text,
  tab_id        text not null,
  year_month    text not null,
  total_amount  numeric(14, 2) not null default 0,
  total_units   numeric(14, 2),
  wallet_id     text,
  category_id   text,
  trn_id        text,
  settled_at    bigint not null,
  created_at    timestamptz not null default now()
);
create index if not exists daily_tab_settlements_user_idx on public.daily_tab_settlements (user_id);
create index if not exists daily_tab_settlements_tab_idx on public.daily_tab_settlements (tab_id);

-- Push Subscriptions (Web Push / PWA)
create table if not exists public.push_subscriptions (
  id          text primary key default gen_random_uuid()::text,
  user_id     text not null default auth.uid()::text,
  endpoint    text not null,
  keys        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- 3. ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------------
alter table public.categories             enable row level security;
alter table public.wallets                enable row level security;
alter table public.trns                   enable row level security;
alter table public.user_settings          enable row level security;
alter table public.rates                  enable row level security;
alter table public.people                 enable row level security;
alter table public.lending_entries        enable row level security;
alter table public.lending_repayments     enable row level security;
alter table public.recurring_rules        enable row level security;
alter table public.daily_tabs             enable row level security;
alter table public.daily_tab_logs         enable row level security;
alter table public.daily_tab_settlements  enable row level security;
alter table public.push_subscriptions     enable row level security;

-- Drop existing policies if re-running
drop policy if exists "categories_owner" on public.categories;
drop policy if exists "wallets_owner" on public.wallets;
drop policy if exists "trns_owner" on public.trns;
drop policy if exists "user_settings_owner" on public.user_settings;
drop policy if exists "rates_read" on public.rates;
drop policy if exists "people_owner" on public.people;
drop policy if exists "lending_entries_owner" on public.lending_entries;
drop policy if exists "lending_repayments_owner" on public.lending_repayments;
drop policy if exists "recurring_rules_owner" on public.recurring_rules;
drop policy if exists "daily_tabs_owner" on public.daily_tabs;
drop policy if exists "daily_tab_logs_owner" on public.daily_tab_logs;
drop policy if exists "daily_tab_settlements_owner" on public.daily_tab_settlements;
drop policy if exists "push_subscriptions_owner" on public.push_subscriptions;

-- Core Policies
create policy "categories_owner" on public.categories for all to authenticated
  using ((select auth.uid())::text = "userId")
  with check ((select auth.uid())::text = "userId");

create policy "wallets_owner" on public.wallets for all to authenticated
  using ((select auth.uid())::text = "userId")
  with check ((select auth.uid())::text = "userId");

create policy "trns_owner" on public.trns for all to authenticated
  using ((select auth.uid())::text = "userId")
  with check ((select auth.uid())::text = "userId");

create policy "user_settings_owner" on public.user_settings for all to authenticated
  using ((select auth.uid())::text = "userId")
  with check ((select auth.uid())::text = "userId");

create policy "rates_read" on public.rates for select to authenticated
  using (true);

-- Extended Feature Policies (using ::text comparison for complete type compatibility)
create policy "people_owner" on public.people for all to authenticated
  using ((select auth.uid())::text = user_id::text)
  with check ((select auth.uid())::text = user_id::text);

create policy "lending_entries_owner" on public.lending_entries for all to authenticated
  using ((select auth.uid())::text = user_id::text)
  with check ((select auth.uid())::text = user_id::text);

create policy "lending_repayments_owner" on public.lending_repayments for all to authenticated
  using ((select auth.uid())::text = user_id::text)
  with check ((select auth.uid())::text = user_id::text);

create policy "recurring_rules_owner" on public.recurring_rules for all to authenticated
  using ((select auth.uid())::text = user_id::text)
  with check ((select auth.uid())::text = user_id::text);

create policy "daily_tabs_owner" on public.daily_tabs for all to authenticated
  using ((select auth.uid())::text = user_id::text)
  with check ((select auth.uid())::text = user_id::text);

create policy "daily_tab_logs_owner" on public.daily_tab_logs for all to authenticated
  using ((select auth.uid())::text = user_id::text)
  with check ((select auth.uid())::text = user_id::text);

create policy "daily_tab_settlements_owner" on public.daily_tab_settlements for all to authenticated
  using ((select auth.uid())::text = user_id::text)
  with check ((select auth.uid())::text = user_id::text);

create policy "push_subscriptions_owner" on public.push_subscriptions for all to authenticated
  using ((select auth.uid())::text = user_id::text)
  with check ((select auth.uid())::text = user_id::text);

-- 4. AUTOMATIC USER SETTINGS ON SIGNUP TRIGGER
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_settings (id, "userId", "baseCurrency")
  values (new.id::text, new.id::text, 'USD')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. POWERSYNC REPLICATION ROLE & PUBLICATION
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'powersync_role') then
    create role powersync_role with replication bypassrls login password 'powersync_secret_123';
  else
    alter role powersync_role with replication bypassrls login password 'powersync_secret_123';
  end if;
end
$$;

grant usage on schema public to powersync_role;
grant select on all tables in schema public to powersync_role;
alter default privileges in schema public grant select on tables to powersync_role;

drop publication if exists powersync;
create publication powersync for table
  public.categories,
  public.wallets,
  public.trns,
  public.user_settings,
  public.rates;

-- 6. SUPABASE REALTIME (Instant Live Updates Across Devices)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'people',
    'lending_entries',
    'lending_repayments',
    'recurring_rules',
    'daily_tabs',
    'daily_tab_logs',
    'daily_tab_settlements'
  ])
  loop
    if exists (select 1 from pg_tables where schemaname = 'public' and tablename = t) and
       not exists (
         select 1 from pg_publication_tables
         where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
       ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
