-- ===========================================================================
-- EliteMoney Complete Database & PowerSync Setup Script for Supabase
-- Run this entire script in Supabase SQL Editor (Ctrl + Enter)
-- ===========================================================================

-- 1. Create Tables
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

create table if not exists public.rates (
  id            text primary key default gen_random_uuid()::text,
  date          text not null,
  rates         jsonb not null,
  source        text,
  "updatedAt"   bigint not null
);
create unique index if not exists rates_date_source_idx on public.rates (date, coalesce(source, ''));

-- 2. Row Level Security (RLS)
alter table public.categories    enable row level security;
alter table public.wallets       enable row level security;
alter table public.trns          enable row level security;
alter table public.user_settings enable row level security;
alter table public.rates         enable row level security;

-- Drop existing policies if re-running
drop policy if exists "categories_owner" on public.categories;
drop policy if exists "wallets_owner" on public.wallets;
drop policy if exists "trns_owner" on public.trns;
drop policy if exists "user_settings_owner" on public.user_settings;
drop policy if exists "rates_read" on public.rates;

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

-- 3. Automatic User Settings on Signup Trigger
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

-- 4. PowerSync Replication Role
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

-- 5. PowerSync Publication
drop publication if exists powersync;
create publication powersync for table
  public.categories,
  public.wallets,
  public.trns,
  public.user_settings,
  public.rates;
