-- audit_logs (BUILD-SPEC §5.4)
create table public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null, -- e.g. 'user.role_changed', 'subscription.canceled'
  target_type text,
  target_id   text,
  meta        jsonb not null default '{}'::jsonb,
  ip          text,
  created_at  timestamptz not null default now()
);

create index audit_logs_actor_idx on public.audit_logs (actor_id);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
