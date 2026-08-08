import { getTranslations } from 'next-intl/server';

import { Card, CardContent } from '@/components/ui/card';
import type { HabitStats } from '@/server/queries/habits';

export async function StatsSummary({ stats }: { stats: HabitStats }) {
  const t = await getTranslations('habits.stats');

  const items = [
    { label: t('currentStreak'), value: stats.currentStreak },
    { label: t('longestStreak'), value: stats.longestStreak },
    { label: t('totalDone'), value: stats.totalDone },
    { label: t('completionRate'), value: `${stats.completionRate30d}%` },
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
