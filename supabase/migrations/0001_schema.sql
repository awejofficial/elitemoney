-- Expense & Income Tracker — core schema (PRD §5)
-- Run this whole file once in Supabase Dashboard → SQL Editor.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────
-- accounts
-- ─────────────────────────────────────────────────────────────────────────
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  type text not null default 'bank' check (type in ('bank', 'cash', 'wallet', 'custom')),
  starting_balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index accounts_user_id_idx on public.accounts (user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- categories
-- ─────────────────────────────────────────────────────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text not null default '💰',
  color text not null default '#0d9488',
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create index categories_user_id_idx on public.categories (user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- transactions
-- ─────────────────────────────────────────────────────────────────────────
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount > 0),
  date date not null default current_date,
  note text,
  recurring_rule_id uuid,
  created_at timestamptz not null default now()
);

create index transactions_user_id_idx on public.transactions (user_id);
create index transactions_account_id_idx on public.transactions (account_id);
create index transactions_category_id_idx on public.transactions (category_id);
create index transactions_date_idx on public.transactions (date);

-- ─────────────────────────────────────────────────────────────────────────
-- recurring_rules
-- ─────────────────────────────────────────────────────────────────────────
create table public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount > 0),
  frequency text not null default 'monthly' check (frequency in ('monthly', 'custom')),
  day_of_month int check (day_of_month between 1 and 31),
  note text,
  active boolean not null default true,
  next_run_date date not null,
  created_at timestamptz not null default now()
);

create index recurring_rules_user_id_idx on public.recurring_rules (user_id);
create index recurring_rules_next_run_date_idx on public.recurring_rules (next_run_date) where active;

alter table public.transactions
  add constraint transactions_recurring_rule_id_fkey
  foreign key (recurring_rule_id) references public.recurring_rules (id) on delete set null;

-- ─────────────────────────────────────────────────────────────────────────
-- people (lending tracker)
-- ─────────────────────────────────────────────────────────────────────────
create table public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  created_at timestamptz not null default now()
);

create index people_user_id_idx on public.people (user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- lending_entries
-- ─────────────────────────────────────────────────────────────────────────
create table public.lending_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  person_id uuid not null references public.people (id) on delete cascade,
  direction text not null check (direction in ('lent', 'borrowed')),
  amount numeric(14, 2) not null check (amount > 0),
  date date not null default current_date,
  due_date date,
  note text,
  created_at timestamptz not null default now()
);

create index lending_entries_user_id_idx on public.lending_entries (user_id);
create index lending_entries_person_id_idx on public.lending_entries (person_id);
create index lending_entries_due_date_idx on public.lending_entries (due_date) where due_date is not null;

-- ─────────────────────────────────────────────────────────────────────────
-- lending_repayments — partial/full settle-ups against a lending entry
-- ─────────────────────────────────────────────────────────────────────────
create table public.lending_repayments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  lending_entry_id uuid not null references public.lending_entries (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index lending_repayments_user_id_idx on public.lending_repayments (user_id);
create index lending_repayments_entry_id_idx on public.lending_repayments (lending_entry_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security — every table scoped to the owning user
-- ─────────────────────────────────────────────────────────────────────────
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.people enable row level security;
alter table public.lending_entries enable row level security;
alter table public.lending_repayments enable row level security;

create policy "owner full access" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner full access" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner full access" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner full access" on public.recurring_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner full access" on public.people
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner full access" on public.lending_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner full access" on public.lending_repayments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Views — computed balances (avoid storing/drifting redundant totals)
-- ─────────────────────────────────────────────────────────────────────────
create view public.account_balances
  with (security_invoker = true) as
select
  a.id as account_id,
  a.user_id,
  a.name,
  a.type,
  a.starting_balance
    + coalesce(sum(case when t.type = 'income' then t.amount else -t.amount end), 0)
    as balance
from public.accounts a
left join public.transactions t on t.account_id = a.id
group by a.id;

create view public.lending_entry_outstanding
  with (security_invoker = true) as
select
  le.id as lending_entry_id,
  le.user_id,
  le.person_id,
  le.direction,
  le.amount,
  le.amount - coalesce(sum(r.amount), 0) as outstanding_amount,
  case
    when coalesce(sum(r.amount), 0) = 0 then 'open'
    when coalesce(sum(r.amount), 0) < le.amount then 'partially_settled'
    else 'settled'
  end as status,
  le.date,
  le.due_date,
  le.note
from public.lending_entries le
left join public.lending_repayments r on r.lending_entry_id = le.id
group by le.id;

create view public.person_balances
  with (security_invoker = true) as
select
  p.id as person_id,
  p.user_id,
  p.name,
  coalesce(sum(
    case
      when leo.direction = 'lent' then leo.outstanding_amount
      when leo.direction = 'borrowed' then -leo.outstanding_amount
    end
  ), 0) as net_balance
from public.people p
left join public.lending_entry_outstanding leo on leo.person_id = p.id
group by p.id;
