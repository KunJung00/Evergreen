import 'server-only';

import { shiftDate, todayInTz } from '@/lib/habits/date';
import {
  calcCompletionRate,
  calcCurrentStreak,
  calcLongestStreak,
  type Frequency,
} from '@/lib/habits/streak';
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

export type DashboardStats = {
  /** Active habits whose target for `date` is met. */
  doneToday: number;
  /** Active habits total (the denominator for `doneToday`). */
  totalHabits: number;
  /** Best current streak across all active habits, in days/weeks. */
  bestStreak: number;
  /** Average 30-day completion rate across active habits (0-100). */
  completionRate30d: number;
  /** All-time completions logged across active habits. */
  totalDone: number;
  /** Habits meeting their target per day for the last `TREND_DAYS` days, oldest first. */
  trend: DailyProgress[];
};

export type DailyProgress = { date: string; done: number };

/** Days shown in the dashboard progress chart. */
const TREND_DAYS = 14;

/**
 * Aggregate momentum stats across every active habit, for the dashboard header
 * (progress at a glance, not per-habit). Streaks/rates are measured against the
 * real `today`, independent of the browsed `date`. Two queries total — habits
 * plus their logs — grouped in memory, same convention as the admin overview.
 */
export async function getDashboardStats(date: string): Promise<DashboardStats> {
  const supabase = createClient();
  const user = await getCurrentUser();
  const timezone = user?.timezone ?? 'Asia/Bangkok';

  const { data: habits } = await supabase
    .from('habits')
    .select('id, frequency, target_per_day')
    .is('archived_at', null)
    .limit(MAX_ROWS);

  const today = todayInTz(timezone);
  const trendDays = Array.from({ length: TREND_DAYS }, (_, i) =>
    shiftDate(today, -(TREND_DAYS - 1 - i)),
  );

  if (!habits || habits.length === 0) {
    return {
      doneToday: 0,
      totalHabits: 0,
      bestStreak: 0,
      completionRate30d: 0,
      totalDone: 0,
      trend: trendDays.map((d) => ({ date: d, done: 0 })),
    };
  }

  const { data: logs } = await supabase
    .from('habit_logs')
    .select('habit_id, logged_date, count')
    .in(
      'habit_id',
      habits.map((h) => h.id),
    )
    .limit(MAX_ROWS);

  const datesByHabit = new Map<string, string[]>();
  // Summed count per habit per date — `${habitId}|${date}` → count.
  const countByHabitDate = new Map<string, number>();
  for (const log of logs ?? []) {
    const existing = datesByHabit.get(log.habit_id);
    if (existing) existing.push(log.logged_date);
    else datesByHabit.set(log.habit_id, [log.logged_date]);
    const key = `${log.habit_id}|${log.logged_date}`;
    countByHabitDate.set(key, (countByHabitDate.get(key) ?? 0) + log.count);
  }

  const isDoneOn = (habitId: string, target: number, day: string) =>
    (countByHabitDate.get(`${habitId}|${day}`) ?? 0) >= target;

  const from = shiftDate(today, -29);

  let doneToday = 0;
  let bestStreak = 0;
  let totalDone = 0;
  let rateSum = 0;
  for (const habit of habits) {
    const dates = datesByHabit.get(habit.id) ?? [];
    const frequency = (habit.frequency ?? 'daily') as Frequency;
    if (isDoneOn(habit.id, habit.target_per_day, date)) doneToday++;
    bestStreak = Math.max(bestStreak, calcCurrentStreak(dates, today, frequency));
    totalDone += dates.length;
    rateSum += calcCompletionRate(dates, from, today);
  }

  const trend = trendDays.map((day) => ({
    date: day,
    done: habits.filter((h) => isDoneOn(h.id, h.target_per_day, day)).length,
  }));

  return {
    doneToday,
    totalHabits: habits.length,
    bestStreak,
    completionRate30d: Math.round(rateSum / habits.length),
    totalDone,
    trend,
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
