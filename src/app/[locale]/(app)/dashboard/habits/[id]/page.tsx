import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { HabitFormDialog } from '@/components/habits/habit-form-dialog';
import { HabitHeatmap } from '@/components/habits/habit-heatmap';
import { MonthlyBarChart } from '@/components/habits/monthly-bar-chart';
import { StatsSummary } from '@/components/habits/stats-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PLAN_LIMITS } from '@/config/plans';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { requireAuth } from '@/lib/auth/require-auth';
import { shiftDate, todayInTz } from '@/lib/habits/date';
import { requireActiveSubscription } from '@/lib/stripe/entitlement';
import {
  getHabitById,
  getHabitStats,
  getHeatmapData,
  getRecentNotes,
} from '@/server/queries/habits';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function HabitDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const subscription = await requireActiveSubscription();
  const user = await requireAuth();
  const t = await getTranslations('habits');

  const habit = await getHabitById(id);
  if (!habit) notFound();

  const today = todayInTz(user.timezone);
  const historyDays = PLAN_LIMITS[subscription.interval].historyDays;
  const from = shiftDate(today, -Math.min(historyDays - 1, 364));

  const [logs, stats, notes] = await Promise.all([
    getHeatmapData(habit.id, from, today),
    getHabitStats(habit.id),
    getRecentNotes(habit.id),
  ]);

  const weekStart = user.week_start === 1 ? 1 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{habit.icon}</span>
          <h1 className="text-2xl font-semibold tracking-tight">{habit.name}</h1>
        </div>
        <HabitFormDialog
          habit={habit}
          trigger={<Button variant="outline">{t('manage.edit')}</Button>}
        />
      </div>

      <StatsSummary stats={stats} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('heatmap.label')}</CardTitle>
        </CardHeader>
        <CardContent>
          <HabitHeatmap
            logs={logs}
            from={from}
            to={today}
            weekStart={weekStart}
            targetPerDay={habit.target_per_day}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <MonthlyBarChart logs={logs} today={today} />
        </CardContent>
      </Card>

      {notes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('recentNotes')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notes.map((note) => (
              <p key={note.date} className="text-sm">
                <span className="text-muted-foreground">{note.date}</span> — {note.note}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Button variant="ghost" asChild>
        <Link href="/dashboard/habits">{t('manage.title')}</Link>
      </Button>
    </div>
  );
}
