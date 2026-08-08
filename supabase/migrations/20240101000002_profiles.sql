-- profiles (BUILD-SPEC §5.2)
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  email              text not null,
  full_name          text,
  avatar_url         text,
  role               public.user_role not null default 'user',
  locale             public.app_locale not null default 'th',
  stripe_customer_id text unique,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_stripe_cus_idx on public.profiles (stripe_customer_id);
