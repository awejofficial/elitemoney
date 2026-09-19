-- Default categories: seeded automatically for every new signup, and
-- backfilled here for any user that already exists (e.g. your test account
-- from Module 1). Run once, after 0001_schema.sql.

create or replace function public.seed_default_categories(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, type, icon, color, is_system)
  values
    (target_user_id, 'Salary', 'income', '💼', '#16a34a', true),
    (target_user_id, 'Bonus', 'income', '🎁', '#22c55e', true),
    (target_user_id, 'Other Income', 'income', '💰', '#65a30d', true),
    (target_user_id, 'SIP', 'expense', '📈', '#0d9488', true),
    (target_user_id, 'Credit Card Bill', 'expense', '💳', '#dc2626', true),
    (target_user_id, 'Chit Fund', 'expense', '🤝', '#ca8a04', true),
    (target_user_id, 'Groceries', 'expense', '🛒', '#f97316', true),
    (target_user_id, 'Rent', 'expense', '🏠', '#7c3aed', true),
    (target_user_id, 'Transport', 'expense', '🚌', '#2563eb', true),
    (target_user_id, 'Utilities', 'expense', '💡', '#eab308', true),
    (target_user_id, 'Entertainment', 'expense', '🎬', '#db2777', true),
    (target_user_id, 'Other Expense', 'expense', '📦', '#64748b', true)
  on conflict do nothing;
end;
$$;

-- Fires once per new signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_categories(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: seed defaults for any existing user who has none yet.
do $$
declare
  u record;
begin
  for u in select id from auth.users loop
    if not exists (select 1 from public.categories where user_id = u.id) then
      perform public.seed_default_categories(u.id);
    end if;
  end loop;
end;
$$;
