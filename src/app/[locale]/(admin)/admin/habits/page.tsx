import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';

import { HabitsTable } from '@/components/admin/habits-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Locale } from '@/i18n/routing';
import { logAudit } from '@/lib/audit';
import { requireAdmin } from '@/lib/auth/require-admin';
import { todayInTz } from '@/lib/habits/date';
import { getAdminHabitOverview, getLogsCountForDate } from '@/server/queries/habits';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

export default async function AdminHabitsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const admin = await requireAdmin();
  const t = await getTranslations('admin.habits');
  const format = await getFormatter();

  const rows = await getAdminHabitOverview();
  const logsToday = await getLogsCountForDate(todayInTz('UTC'));

  await logAudit({
    actorId: admin.id,
    action: 'admin.habits_viewed',
    targetType: 'admin_view',
  });

  const totalHabits = rows.reduce((sum, r) => sum + r.habitCount, 0);
  const cards = [
    { key: 'totalUsers', value: rows.length },
    { key: 'totalHabits', value: totalHabits },
    { key: 'logsToday', value: logsToday },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t(`cards.${card.key}` as `cards.${(typeof cards)[number]['key']}`)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{format.number(card.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <HabitsTable rows={rows} />
    </div>
  );
}
