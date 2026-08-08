import { Plus, Settings2 } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { DayNav } from '@/components/habits/day-nav';
import { HabitCard } from '@/components/habits/habit-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { requireAuth } from '@/lib/auth/require-auth';
import { isWithinBackfillWindow, todayInTz } from '@/lib/habits/date';
import { requireActiveSubscription } from '@/lib/stripe/entitlement';
import { getTodayView } from '@/server/queries/habits';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string }>;
};

// Reads the session per-request; must not be prerendered.
export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  await requireActiveSubscription();
  const user = await requireAuth();
  const t = await getTranslations('dashboard');
  const tHabits = await getTranslations('habits');

  const { date: dateParam } = await searchParams;
  const today = todayInTz(user.timezone);
  const date = dateParam && isWithinBackfillWindow(dateParam, today, 7) ? dateParam : today;

  const habits = await getTodayView(date);
  const doneCount = habits.filter((h) => h.todayCount >= h.target_per_day).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('welcome', { name: user.full_name ?? user.email })}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/habits">
            <Settings2 className="size-4" />
            {tHabits('manage.title')}
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DayNav date={date} today={today} />
        {habits.length > 0 ? (
          <span className="text-sm text-muted-foreground">
            {tHabits('todaySummary', { done: doneCount, total: habits.length })}
          </span>
        ) : null}
      </div>

      {habits.length === 0 ? (
        <EmptyState
          title={tHabits('empty.title')}
          action={
            <Button asChild>
              <Link href="/dashboard/habits">
                <Plus className="size-4" />
                {tHabits('empty.cta')}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} date={date} />
          ))}
        </div>
      )}
    </div>
  );
}
