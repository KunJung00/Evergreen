import { getTranslations } from 'next-intl/server';

import { Card, CardContent } from '@/components/ui/card';
import type { DashboardStats as DashboardStatsData } from '@/server/queries/habits';

export async function DashboardStats({ stats }: { stats: DashboardStatsData }) {
  const t = await getTranslations('dashboard.stats');

  const items = [
    { label: t('doneToday'), value: `${stats.doneToday}/${stats.totalHabits}` },
    { label: t('bestStreak'), value: stats.bestStreak },
    { label: t('completionRate'), value: `${stats.completionRate30d}%` },
    { label: t('totalDone'), value: stats.totalDone },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <p className="text-2xl font-bold tabular-nums">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
