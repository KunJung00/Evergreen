import { describe, expect, it } from 'vitest';

import { buildHeatmapGrid } from '@/lib/habits/heatmap';

// 2024-01-01 is a Monday.
describe('buildHeatmapGrid', () => {
  it('aligns dates to rows with a Monday week start (no leading padding)', () => {
    const grid = buildHeatmapGrid(
      [{ date: '2024-01-03', count: 1 }],
      '2024-01-01',
      '2024-01-14',
      1,
      1,
    );

    expect(grid.weeks).toHaveLength(2);
    // Row 0 of column 0 is the Monday (2024-01-01).
    expect(grid.weeks[0][0]).toMatchObject({ date: '2024-01-01', inRange: true });
    // Wednesday 2024-01-03 is row 2, fully completed → level 4.
    expect(grid.weeks[0][2]).toMatchObject({ date: '2024-01-03', count: 1, level: 4 });
  });

  it('adds leading padding for a Sunday week start and still labels the first month', () => {
    const grid = buildHeatmapGrid([], '2024-01-01', '2024-01-14', 0, 1);

    // Sunday-start: Monday 2024-01-01 sits at row 1, row 0 is padding.
    expect(grid.weeks[0][0].inRange).toBe(false);
    expect(grid.weeks[0][1]).toMatchObject({ date: '2024-01-01', inRange: true });
    // The first month must be labeled even though the column's top row is padding.
    expect(grid.monthLabels[0]).toEqual({ column: 0, month: 1 });
  });

  it('scales the color level by count / target', () => {
    const grid = buildHeatmapGrid(
      [
        { date: '2024-01-01', count: 1 },
        { date: '2024-01-02', count: 2 },
        { date: '2024-01-03', count: 4 },
      ],
      '2024-01-01',
      '2024-01-07',
      1,
      4,
    );
    // target 4: 1/4 = 0.25 → level 1, 2/4 = 0.5 → level 2, 4/4 = 1 → level 4.
    expect(grid.weeks[0][0].level).toBe(1);
    expect(grid.weeks[0][1].level).toBe(2);
    expect(grid.weeks[0][2].level).toBe(4);
    // A day with no log is level 0.
    expect(grid.weeks[0][3].level).toBe(0);
  });

  it('labels a month change across the range', () => {
    const grid = buildHeatmapGrid([], '2024-01-29', '2024-02-11', 1, 1);
    const months = grid.monthLabels.map((m) => m.month);
    expect(months).toContain(1);
    expect(months).toContain(2);
  });
});
