import { getLocale, getTranslations } from 'next-intl/server';

import type { DailyProgress } from '@/server/queries/habits';

type ProgressChartProps = {
  trend: DailyProgress[];
  totalHabits: number;
};

/**
 * Daily progress over the last two weeks — how many active habits met their
 * target each day, as a share of the total. Plain CSS bars (RSC, no chart
 * library), same convention as `MonthlyBarChart`; a muted track behind each bar
 * shows the remaining habits so the height reads as a proportion.
 */
export async function ProgressChart({ trend, totalHabits }: ProgressChartProps) {
  const t = await getTranslations('dashboard.progress');
  const locale = await getLocale();
  const isThai = locale === 'th';

  const dayFormatter = new Intl.DateTimeFormat(isThai ? 'th-TH' : 'en-US', {
    day: 'numeric',
    timeZone: 'UTC',
  });
  const fullFormatter = new Intl.DateTimeFormat(isThai ? 'th-TH' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

  const denominator = Math.max(1, totalHabits);

  return (
    <div>
      <p className="mb-4 text-sm font-medium">{t('title', { days: trend.length })}</p>
      <div className="flex h-32 items-end gap-1.5">
        {trend.map((day) => {
          const heightPct = (day.done / denominator) * 100;
          const utc = new Date(`${day.date}T00:00:00Z`);
          return (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-24 w-full items-end rounded-sm bg-muted">
                <div
                  className="w-full rounded-sm bg-primary"
                  style={{ height: `${Math.max(heightPct, day.done > 0 ? 6 : 0)}%` }}
                  title={t('tooltip', {
                    date: fullFormatter.format(utc),
                    done: day.done,
                    total: totalHabits,
                  })}
                />
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {dayFormatter.format(utc)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
