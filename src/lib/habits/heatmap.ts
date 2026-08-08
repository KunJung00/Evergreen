import { eachDayBetween } from '@/lib/habits/date';
import type { HeatmapCell } from '@/server/queries/habits';

/**
 * Turns raw per-day log rows into a display grid (FEATURE-SPEC §7). Runs
 * entirely in memory over data already fetched once — never queries per
 * cell (pitfall #3).
 */
export type HeatmapDayCell = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  /** false = padding before `from` (or before the habit's data starts). */
  inRange: boolean;
};

export type HeatmapGrid = {
  /** Each entry is one week column, 7 rows ordered starting at `weekStart`. */
  weeks: HeatmapDayCell[][];
  /** Which column a new month's label should render above, and which month (1-12). */
  monthLabels: { column: number; month: number }[];
};

function levelFor(count: number, target: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  const ratio = count / Math.max(target, 1);
  if (ratio >= 1) return 4;
  if (ratio >= 0.75) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

function dayOfWeekUTC(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sun .. 6 = Sat
}

export function buildHeatmapGrid(
  logs: HeatmapCell[],
  from: string,
  to: string,
  weekStart: 0 | 1,
  targetPerDay: number,
): HeatmapGrid {
  const countByDate = new Map(logs.map((l) => [l.date, l.count]));
  const allDates = eachDayBetween(from, to);
  if (allDates.length === 0) return { weeks: [], monthLabels: [] };

  const leadingPad = (dayOfWeekUTC(allDates[0]) - weekStart + 7) % 7;
  const padded: (string | null)[] = [
    ...Array.from({ length: leadingPad }, () => null),
    ...allDates,
  ];
  while (padded.length % 7 !== 0) padded.push(null);

  const weeks: HeatmapDayCell[][] = [];
  const monthLabels: { column: number; month: number }[] = [];
  let lastMonth = -1;

  for (let col = 0; col * 7 < padded.length; col++) {
    const week: HeatmapDayCell[] = [];
    let columnMonth: number | null = null;
    for (let row = 0; row < 7; row++) {
      const date = padded[col * 7 + row];
      if (!date) {
        week.push({ date: '', count: 0, level: 0, inRange: false });
        continue;
      }
      const count = countByDate.get(date) ?? 0;
      week.push({ date, count, level: levelFor(count, targetPerDay), inRange: true });
      // The column's month is that of its first in-range cell, so a column
      // whose top rows are leading padding still gets a label.
      if (columnMonth === null) columnMonth = Number(date.slice(5, 7));
    }
    if (columnMonth !== null && columnMonth !== lastMonth) {
      monthLabels.push({ column: col, month: columnMonth });
      lastMonth = columnMonth;
    }
    weeks.push(week);
  }

  return { weeks, monthLabels };
}
