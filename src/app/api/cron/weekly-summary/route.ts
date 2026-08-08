import { NextResponse } from 'next/server';

import { env } from '@/env';
import { calcLongestStreak } from '@/lib/habits/streak';
import { shiftDate, todayInTz } from '@/lib/habits/date';
import { hasActiveSubscription } from '@/lib/stripe/entitlement';
import { sendEmail } from '@/lib/email/send';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

type HabitLogRow = { habit_id: string; logged_date: string; count: number };

/** True when it's currently 08:00 on a Monday in `tz` (FEATURE-SPEC §9). */
function isMonday8amInTz(tz: string): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date());
  const weekday = parts.find((p) => p.type === 'weekday')?.value;
  const hour = parts.find((p) => p.type === 'hour')?.value;
  return weekday === 'Mon' && Number(hour) === 8;
}

/**
 * Fires hourly (see `vercel.json`); each run only emails users whose local
 * time is currently Monday 08:00. Gated by `CRON_SECRET` so only Vercel's
 * scheduler (or an authorized caller) can trigger it.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, locale, timezone')
    .eq('weekly_email_opt_in', true)
    .limit(500);

  const eligible = (profiles ?? []).filter((p) => isMonday8amInTz(p.timezone));
  const batch = eligible.slice(0, 100);

  let sent = 0;
  for (const profile of batch) {
    if (!(await hasActiveSubscription(profile.id))) continue;

    const today = todayInTz(profile.timezone);
    const weekStart = shiftDate(today, -6);

    const { data: habits } = await supabase
      .from('habits')
      .select('id, name, frequency')
      .eq('user_id', profile.id)
      .is('archived_at', null);
    if (!habits || habits.length === 0) continue;

    const { data: logs } = await supabase
      .from('habit_logs')
      .select('habit_id, logged_date, count')
      .eq('user_id', profile.id)
      .gte('logged_date', weekStart)
      .lte('logged_date', today);
    if (!logs || logs.length === 0) continue;

    const logsByHabit = new Map<string, HabitLogRow[]>();
    for (const log of logs as HabitLogRow[]) {
      const list = logsByHabit.get(log.habit_id) ?? [];
      list.push(log);
      logsByHabit.set(log.habit_id, list);
    }

    const habitSummaries = habits.map((habit) => {
      const habitLogs = logsByHabit.get(habit.id) ?? [];
      const daysDone = new Set(habitLogs.map((l) => l.logged_date)).size;
      return { name: habit.name, percent: Math.round((daysDone / 7) * 100) };
    });

    const longestStreak = Math.max(
      0,
      ...habits.map((habit) =>
        calcLongestStreak(
          (logsByHabit.get(habit.id) ?? []).map((l) => l.logged_date),
          habit.frequency,
        ),
      ),
    );

    await sendEmail({
      to: profile.email,
      template: 'weeklySummary',
      locale: profile.locale,
      data: {
        name: profile.full_name ?? profile.email,
        weekLabel: `${weekStart} – ${today}`,
        longestStreak,
        habitSummaries,
        siteUrl: env.NEXT_PUBLIC_SITE_URL,
      },
    });
    sent++;
  }

  return NextResponse.json({ checked: eligible.length, sent });
}
