-- Row Level Security (BUILD-SPEC §5.6). RLS on every table, all operations
-- either covered by a policy or intentionally closed (no policy = deny).

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_logs enable row level security;

-- profiles ----------------------------------------------------------------
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: read all admin"
  on public.profiles for select
  using (public.is_admin());

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: update admin"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- insert: via handle_new_user() trigger only.
-- delete: via cascade from auth.users only.

-- subscriptions -----------------------------------------------------------
-- Writes happen exclusively through the service_role client in the Stripe
-- webhook, which bypasses RLS. Users/admins may only read.
create policy "subs: read own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "subs: read admin"
  on public.subscriptions for select
  using (public.is_admin());

-- audit_logs --------------------------------------------------------------
-- Writes happen through the service_role client (src/lib/audit.ts). Only
-- admins may read.
create policy "logs: read admin"
  on public.audit_logs for select
  using (public.is_admin());
