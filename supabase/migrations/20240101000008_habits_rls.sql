-- RLS for habits + habit_logs (FEATURE-SPEC-habit-tracker.md §2.2)

alter table public.habits     enable row level security;
alter table public.habit_logs enable row level security;

-- habits: owner only, all 4 operations ---------------------------------------
create policy "habits_select_own"
  on public.habits for select
  to authenticated using (user_id = auth.uid());

create policy "habits_insert_own"
  on public.habits for insert
  to authenticated with check (user_id = auth.uid());

create policy "habits_update_own"
  on public.habits for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "habits_delete_own"
  on public.habits for delete
  to authenticated using (user_id = auth.uid());

-- habit_logs: owner only, and the parent habit must also be owned ------------
create policy "habit_logs_select_own"
  on public.habit_logs for select
  to authenticated using (user_id = auth.uid());

create policy "habit_logs_insert_own"
  on public.habit_logs for insert
  to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid())
  );

create policy "habit_logs_update_own"
  on public.habit_logs for update
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "habit_logs_delete_own"
  on public.habit_logs for delete
  to authenticated using (user_id = auth.uid());

-- admin: read-only, via the existing security-definer function (pitfall P2) --
create policy "habits_select_admin"
  on public.habits for select
  to authenticated using (public.is_admin());

create policy "habit_logs_select_admin"
  on public.habit_logs for select
  to authenticated using (public.is_admin());
