-- subscriptions (BUILD-SPEC §5.3)
create table public.subscriptions (
  id                   text primary key, -- Stripe subscription id
  user_id              uuid not null references public.profiles (id) on delete cascade,
  status               public.sub_status not null,
  price_id             text not null,
  interval             public.sub_interval not null,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at          timestamptz,
  trial_end            timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index subscriptions_user_idx on public.subscriptions (user_id);
create index subscriptions_status_idx on public.subscriptions (status);
