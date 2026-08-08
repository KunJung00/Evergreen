import 'server-only';

import { shiftDate, todayInTz } from '@/lib/habits/date';
import { calcCompletionRate, calcCurrentStreak, calcLongestStreak } from '@/lib/habits/streak';
import { getCurrentUser } from '@/lib/auth/get-session';
import { createClient } from '@/lib/supabase/server';
import type { Habit } from '@/types';

/**
 * Habit read layer (FEATURE-SPEC §6.3). RLS scopes every query to the caller's
 * own rows automatically (owner-only policies, plus admin read via
 * `public.is_admin()`) — no explicit `user_id` filters needed except where a
 * cross-user admin aggregate requires it. Full datasets, capped defensively,
 * same convention as `admin.queries.ts`.
 */
const MAX_ROWS = 1000;

export async function getHabits(opts?: { includeArchived?: boolean }): Promise<Habit[]> {
  const supabase = createClient();
  let query = supabase.from('habits').select('*').order('sort_order', { ascending: true });
  if (!opts?.includeArchived) {
    query = query.is('archived_at', null);
  }
  const { data } = await query.limit(MAX_ROWS);
  return data ?? [];
}

export async function getHabitById(id: string): Promise<Habit | null> {
  const supabase = createClient();
  const { data } = await supabase.from('habits').select('*').eq('id', id).maybeSingle();
  return data ?? null;
}

export type HabitWithTodayLog = Habit & { todayCount: number };

/** Active habits plus each one's log count for `date` (toggle state for the "today" page). */
export async function getTodayView(date: string): Promise<HabitWithTodayLog[]> {
  const supabase = createClient();
  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .is('archived_at', null)
    .order('sort_order', { ascending: true })
    .limit(MAX_ROWS);
  if (!habits || habits.length === 0) return [];

  const { data: logs } = await supabase
    .from('habit_logs')
    .select('habit_id, count')
    .eq('logged_date', date)
    .in(
      'habit_id',
      habits.map((h) => h.id),
    );

  const countByHabit = new Map((logs ?? []).map((l) => [l.habit_id, l.count]));
  return habits.map((h) => ({ ...h, todayCount: countByHabit.get(h.id) ?? 0 }));
}

export type HeatmapCell = { date: string; count: number };

/** Raw per-day log counts for `habitId` in `[from, to]` — one query, no per-cell fetches (pitfall #3). */
export async function getHeatmapData(
  habitId: string,
  from: string,
  to: string,
): Promise<HeatmapCell[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('habit_logs')
    .select('logged_date, count')
    .eq('habit_id', habitId)
    .gte('logged_date', from)
    .lte('logged_date', to)
    .limit(MAX_ROWS);
  return (data ?? []).map((row) => ({ date: row.logged_date, count: row.count }));
}

export type HabitStats = {
  currentStreak: number;
  longestStreak: number;
  totalDone: number;
  completionRate30d: number;
};

export async function getHabitStats(habitId: string): Promise<HabitStats> {
  const supabase = createClient();
  const user = await getCurrentUser();
  const timezone = user?.timezone ?? 'Asia/Bangkok';

  const [{ data: habit }, { data: logs }] = await Promise.all([
    supabase.from('habits').select('frequency').eq('id', habitId).maybeSingle(),
    supabase.from('habit_logs').select('logged_date').eq('habit_id', habitId).limit(MAX_ROWS),
  ]);

  const dates = (logs ?? []).map((l) => l.logged_date);
  const today = todayInTz(timezone);
  const frequency = habit?.frequency ?? 'daily';

  return {
    currentStreak: calcCurrentStreak(dates, today, frequency),
    longestStreak: calcLongestStreak(dates, frequency),
    totalDone: dates.length,
    completionRate30d: calcCompletionRate(dates, shiftDate(today, -29), today),
  };
}

export type HabitNote = { date: string; note: string };

/** Latest logs that have a note, newest first (habit detail page). */
export async function getRecentNotes(habitId: string, limit = 10): Promise<HabitNote[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('habit_logs')
    .select('logged_date, note')
    .eq('habit_id', habitId)
    .not('note', 'is', null)
    .order('logged_date', { ascending: false })
    .limit(limit);

  return (data ?? [])
    .filter((row): row is { logged_date: string; note: string } => row.note !== null)
    .map((row) => ({ date: row.logged_date, note: row.note }));
}

/** Count of `habit_logs` rows for a given `logged_date` (admin overview stat card). */
export async function getLogsCountForDate(date: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from('habit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('logged_date', date);
  return count ?? 0;
}

export type AdminHabitRow = {
  userId: string;
  email: string | null;
  habitCount: number;
  totalLogs: number;
  logsLast7Days: number;
  lastActiveDate: string | null;
};

/** Per-user habit stats for `/admin/habits` (FEATURE-SPEC §5.5). Full dataset, client-paginated. */
export async function getAdminHabitOverview(): Promise<AdminHabitRow[]> {
  const supabase = createClient();

  const { data: habits } = await supabase.from('habits').select('id, user_id').limit(MAX_ROWS);
  if (!habits || habits.length === 0) return [];

  const userIds = Array.from(new Set(habits.map((h) => h.user_id)));
  const habitIds = habits.map((h) => h.id);

  const [{ data: profiles }, { data: logs }] = await Promise.all([
    supabase.from('profiles').select('id, email').in('id', userIds),
    supabase
      .from('habit_logs')
      .select('user_id, logged_date')
      .in('habit_id', habitIds)
      .limit(MAX_ROWS),
  ]);

  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  const habitCountById = new Map<string, number>();
  for (const h of habits) {
    habitCountById.set(h.user_id, (habitCountById.get(h.user_id) ?? 0) + 1);
  }

  const sevenDaysAgo = shiftDate(todayInTz('UTC'), -7);
  const totalLogsById = new Map<string, number>();
  const logsLast7ById = new Map<string, number>();
  const lastActiveById = new Map<string, string>();
  for (const log of logs ?? []) {
    totalLogsById.set(log.user_id, (totalLogsById.get(log.user_id) ?? 0) + 1);
    if (log.logged_date >= sevenDaysAgo) {
      logsLast7ById.set(log.user_id, (logsLast7ById.get(log.user_id) ?? 0) + 1);
    }
    const current = lastActiveById.get(log.user_id);
    if (!current || log.logged_date > current) {
      lastActiveById.set(log.user_id, log.logged_date);
    }
  }

  return userIds.map((userId) => ({
    userId,
    email: emailById.get(userId) ?? null,
    habitCount: habitCountById.get(userId) ?? 0,
    totalLogs: totalLogsById.get(userId) ?? 0,
    logsLast7Days: logsLast7ById.get(userId) ?? 0,
    lastActiveDate: lastActiveById.get(userId) ?? null,
  }));
}
