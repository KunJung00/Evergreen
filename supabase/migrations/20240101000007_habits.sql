-- habits + habit_logs (FEATURE-SPEC-habit-tracker.md §2.1)

create type public.habit_frequency as enum ('daily', 'weekly');

-- habits --------------------------------------------------------------------
create table public.habits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 60),
  icon           text not null default '✅' check (char_length(icon) <= 8),
  color          text not null default 'emerald'
                 check (color in ('emerald', 'blue', 'violet', 'amber', 'rose', 'cyan', 'lime', 'slate')),
  frequency      public.habit_frequency not null default 'daily',
  target_per_day smallint not null default 1 check (target_per_day between 1 and 20),
  days_per_week  smallint check (days_per_week between 1 and 7),
  sort_order     smallint not null default 0,
  archived_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- frequency = 'weekly' must always carry days_per_week, 'daily' never does.
  constraint weekly_requires_days check (
    (frequency = 'daily' and days_per_week is null) or
    (frequency = 'weekly' and days_per_week is not null)
  )
);

create index habits_user_active_idx
  on public.habits (user_id, sort_order) where archived_at is null;

create trigger habits_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

-- habit_logs ------------------------------------------------------------------
create table public.habit_logs (
  id          uuid primary key default gen_random_uuid(),
  habit_id    uuid not null references public.habits (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  logged_date date not null,
  count       smallint not null default 1 check (count between 1 and 100),
  note        text check (char_length(note) <= 280),
  created_at  timestamptz not null default now(),
  unique (habit_id, logged_date) -- prevents duplicate same-day logs on rapid re-clicks
);

create index habit_logs_user_date_idx on public.habit_logs (user_id, logged_date desc);
create index habit_logs_habit_date_idx on public.habit_logs (habit_id, logged_date desc);

-- profiles: habit-tracker preferences -----------------------------------------
alter table public.profiles
  add column timezone           text     not null default 'Asia/Bangkok',
  add column week_start         smallint not null default 0 check (week_start in (0, 1)), -- 0=Sun 1=Mon
  add column weekly_email_opt_in boolean  not null default true;
