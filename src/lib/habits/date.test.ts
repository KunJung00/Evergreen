import { describe, expect, it } from 'vitest';

import { eachDayBetween, isWithinBackfillWindow, shiftDate, toUserDate } from '@/lib/habits/date';

describe('toUserDate', () => {
  it('resolves the same instant to different calendar dates by timezone', () => {
    // 2026-01-01 20:00 UTC.
    const instant = new Date('2026-01-01T20:00:00Z');
    expect(toUserDate(instant, 'UTC')).toBe('2026-01-01');
    // +07:00 → 03:00 next day.
    expect(toUserDate(instant, 'Asia/Bangkok')).toBe('2026-01-02');
    // +13:00 (NZDT in January) → 09:00 next day.
    expect(toUserDate(instant, 'Pacific/Auckland')).toBe('2026-01-02');
  });

  it('handles late-night local time rolling into the next day', () => {
    // 23:00 in Bangkok on 2026-03-15 is 16:00 UTC same day.
    const instant = new Date('2026-03-15T16:00:00Z');
    expect(toUserDate(instant, 'Asia/Bangkok')).toBe('2026-03-15');
  });
});

describe('eachDayBetween', () => {
  it('includes both endpoints and spans a leap-year February', () => {
    expect(eachDayBetween('2024-02-27', '2024-03-01')).toEqual([
      '2024-02-27',
      '2024-02-28',
      '2024-02-29',
      '2024-03-01',
    ]);
  });

  it('returns a single day when from === to', () => {
    expect(eachDayBetween('2026-01-01', '2026-01-01')).toEqual(['2026-01-01']);
  });
});

describe('shiftDate', () => {
  it('steps back across a leap day without timestamp math', () => {
    expect(shiftDate('2024-03-01', -1)).toBe('2024-02-29');
  });

  it('steps forward across a year boundary', () => {
    expect(shiftDate('2025-12-31', 1)).toBe('2026-01-01');
  });

  it('is a no-op for 0', () => {
    expect(shiftDate('2026-01-15', 0)).toBe('2026-01-15');
  });
});

describe('isWithinBackfillWindow', () => {
  const today = '2026-01-15';

  it('accepts today and the 7th day back', () => {
    expect(isWithinBackfillWindow(today, today)).toBe(true);
    expect(isWithinBackfillWindow('2026-01-08', today)).toBe(true);
  });

  it('rejects the 8th day back (spec acceptance)', () => {
    expect(isWithinBackfillWindow('2026-01-07', today)).toBe(false);
  });

  it('rejects future dates', () => {
    expect(isWithinBackfillWindow('2026-01-16', today)).toBe(false);
  });
});
