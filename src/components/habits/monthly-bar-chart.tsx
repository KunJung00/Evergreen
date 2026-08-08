import { getLocale } from 'next-intl/server';

import type { HeatmapCell } from '@/server/queries/habits';

type MonthlyBarChartProps = {
  logs: HeatmapCell[];
  today: string;
};

/** Plain CSS bars for the last 12 months — lighter than pulling in a chart library. */
export async function MonthlyBarChart({ logs, today }: MonthlyBarChartProps) {
  const locale = await getLocale();
  const formatter = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    month: 'short',
    timeZone: 'UTC',
  });

  const [currentYear, currentMonth] = today.split('-').map(Number);
  const months: { key: string; month: number; year: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    let month = currentMonth - i;
    let year = currentYear;
    while (month <= 0) {
      month += 12;
      year -= 1;
    }
    months.push({ key: `${year}-${String(month).padStart(2, '0')}`, month, year });
  }

  const countByMonth = new Map<string, number>();
  for (const log of logs) {
    if (log.count <= 0) continue;
    const key = log.date.slice(0, 7);
    countByMonth.set(key, (countByMonth.get(key) ?? 0) + 1);
  }

  const max = Math.max(1, ...months.map((m) => countByMonth.get(m.key) ?? 0));

  return (
    <div className="flex h-32 items-end gap-2">
      {months.map((m) => {
        const count = countByMonth.get(m.key) ?? 0;
        const heightPct = (count / max) * 100;
        return (
          <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-24 w-full items-end">
              <div
                className="w-full rounded-t-sm bg-primary/70"
                style={{ height: `${heightPct}%` }}
                title={`${count}`}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {formatter.format(new Date(Date.UTC(m.year, m.month - 1, 1)))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
