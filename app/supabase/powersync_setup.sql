-- PowerSync replication setup for Supabase Postgres.
--
-- Run this in your Supabase SQL Editor:
-- It creates/updates the powersync_role with REPLICATION, BYPASSRLS, and pg_read_all_stats
-- so that PowerSync can stream changes and query WAL LSN checkpoints (write-checkpoint2).

-- 1. Replication role used by the PowerSync service.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'powersync_role') then
    create role powersync_role with replication bypassrls login password 'powersync_secret_123';
  else
    alter role powersync_role with replication bypassrls login password 'powersync_secret_123';
  end if;
end
$$;

-- 2. Schema and table read permissions
grant usage on schema public to powersync_role;
grant select on all tables in schema public to powersync_role;
alter default privileges in schema public grant select on tables to powersync_role;

-- 3. Publication consumed by PowerSync. Scoped to all active app tables.
drop publication if exists powersync;
create publication powersync for table
  public.categories,
  public.wallets,
  public.trns,
  public.user_settings,
  public.rates;

