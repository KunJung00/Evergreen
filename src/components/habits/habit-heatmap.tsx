import { getLocale, getTranslations } from 'next-intl/server';

import { HabitHeatmapCell } from '@/components/habits/habit-heatmap-cell';
import { HeatmapScrollContainer } from '@/components/habits/heatmap-scroll-container';
import { buildHeatmapGrid } from '@/lib/habits/heatmap';
import { cn } from '@/lib/utils';
import type { HeatmapCell } from '@/server/queries/habits';

type HabitHeatmapProps = {
  logs: HeatmapCell[];
  from: string;
  to: string;
  weekStart: 0 | 1;
  targetPerDay: number;
};

const COLUMN_WIDTH = 'w-[13px] sm:w-[15px]';

/** Full-year (or 30-day mini) heatmap. Server component — the grid is fully precomputed. */
export async function HabitHeatmap({ logs, from, to, weekStart, targetPerDay }: HabitHeatmapProps) {
  const t = await getTranslations('habits.heatmap');
  const locale = await getLocale();
  const grid = buildHeatmapGrid(logs, from, to, weekStart, targetPerDay);

  const intlLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const monthFormatter = new Intl.DateTimeFormat(intlLocale, { month: 'short', timeZone: 'UTC' });
  const weekdayFormatter = new Intl.DateTimeFormat(intlLocale, {
    weekday: 'short',
    timeZone: 'UTC',
  });
  const monthByColumn = new Map(grid.monthLabels.map((m) => [m.column, m.month]));
  const totalDone = grid.weeks.flat().filter((c) => c.inRange && c.count > 0).length;

  return (
    <div role="img" aria-label={`${t('label')}: ${totalDone}`} className="space-y-1">
      <HeatmapScrollContainer>
        <div className="flex gap-[3px] pl-6">
          {grid.weeks.map((_, col) => (
            <div
              key={col}
              className={cn('shrink-0 text-[10px] text-muted-foreground', COLUMN_WIDTH)}
            >
              {monthByColumn.has(col)
                ? monthFormatter.format(new Date(Date.UTC(2000, monthByColumn.get(col)! - 1, 1)))
                : ''}
            </div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          <div className="flex w-6 shrink-0 flex-col gap-[3px] pr-1 text-right text-[10px] text-muted-foreground">
            {Array.from({ length: 7 }).map((_, row) => {
              const dow = (weekStart + row) % 7;
              const show = dow % 2 === 1; // Mon/Wed/Fri regardless of week start
              return (
                <div key={row} className="h-[10px] leading-[10px] sm:h-3 sm:leading-3">
                  {show ? weekdayFormatter.format(new Date(Date.UTC(2000, 0, 2 + dow))) : ''}
                </div>
              );
            })}
          </div>
          {grid.weeks.map((week, col) => (
            <div key={col} className="flex shrink-0 flex-col gap-[3px]">
              {week.map((cell, row) => (
                <HabitHeatmapCell
                  key={row}
                  date={cell.date}
                  count={cell.count}
                  level={cell.level}
                  target={targetPerDay}
                  inRange={cell.inRange}
                />
              ))}
            </div>
          ))}
        </div>
      </HeatmapScrollContainer>
    </div>
  );
}
