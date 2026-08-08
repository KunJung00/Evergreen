-- Extensions
create extension if not exists "uuid-ossp";

-- Enums (BUILD-SPEC §5.1)
create type public.user_role as enum ('user', 'admin');
create type public.app_locale as enum ('th', 'en');
create type public.sub_status as enum (
  'trialing', 'active', 'past_due', 'canceled', 'incomplete',
  'incomplete_expired', 'unpaid', 'paused'
);
create type public.sub_interval as enum ('month', 'year');
