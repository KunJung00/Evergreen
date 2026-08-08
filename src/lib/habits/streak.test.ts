import { describe, expect, it } from 'vitest';

import { calcCompletionRate, calcCurrentStreak, calcLongestStreak } from '@/lib/habits/streak';

describe('calcCurrentStreak (daily)', () => {
  it('is 0 with no logs', () => {
    expect(calcCurrentStreak([], '2026-01-15', 'daily')).toBe(0);
  });

  it('counts 5 consecutive days ending today', () => {
    const dates = ['2026-01-15', '2026-01-14', '2026-01-13', '2026-01-12', '2026-01-11'];
    expect(calcCurrentStreak(dates, '2026-01-15', 'daily')).toBe(5);
  });

  it('still counts yesterday-ending streak when today has no log yet', () => {
    const dates = ['2026-01-14', '2026-01-13', '2026-01-12'];
    expect(calcCurrentStreak(dates, '2026-01-15', 'daily')).toBe(3);
  });

  it('stops at a 1-day gap in the middle', () => {
    // today=15: 15,14,13,12 logged, gap on 11, then an older 10..6 run.
    const dates = [
      '2026-01-15',
      '2026-01-14',
      '2026-01-13',
      '2026-01-12',
      '2026-01-10',
      '2026-01-09',
      '2026-01-08',
      '2026-01-07',
      '2026-01-06',
    ];
    expect(calcCurrentStreak(dates, '2026-01-15', 'daily')).toBe(4);
  });

  it('counts across a new year boundary', () => {
    const dates = ['2026-01-02', '2026-01-01', '2025-12-31', '2025-12-30'];
    expect(calcCurrentStreak(dates, '2026-01-02', 'daily')).toBe(4);
  });

  it('counts through Feb 29 of a leap year', () => {
    const dates = ['2024-03-01', '2024-02-29', '2024-02-28', '2024-02-27'];
    expect(calcCurrentStreak(dates, '2024-03-01', 'daily')).toBe(4);
  });
});

describe('calcLongestStreak (daily)', () => {
  it('is 0 with no logs', () => {
    expect(calcLongestStreak([], 'daily')).toBe(0);
  });

  it('finds the longest run, not just the most recent one', () => {
    // recent run (today-ending): 15,14,13,12 = 4 days.
    // older run: 10,9,8,7,6 = 5 days (gap on 11 separates them).
    const dates = [
      '2026-01-15',
      '2026-01-14',
      '2026-01-13',
      '2026-01-12',
      '2026-01-10',
      '2026-01-09',
      '2026-01-08',
      '2026-01-07',
      '2026-01-06',
    ];
    expect(calcLongestStreak(dates, 'daily')).toBe(5);
  });

  it('spans Feb 29 of a leap year correctly', () => {
    const dates = ['2024-02-27', '2024-02-28', '2024-02-29', '2024-03-01'];
    expect(calcLongestStreak(dates, 'daily')).toBe(4);
  });
});

describe('weekly frequency (3 days/week habit)', () => {
  // 2024-01-01 is a Monday. Weeks: W1 Jan1-7, W2 Jan8-14, W3 Jan15-21 (gap), W4 Jan22-28.
  const dates = [
    '2024-01-01',
    '2024-01-03',
    '2024-01-05', // week 1, 3 days
    '2024-01-08',
    '2024-01-10',
    '2024-01-12', // week 2, 3 days
    // week 3: no logs
    '2024-01-24', // week 4, 1 day
  ];

  it('current streak counts consecutive weeks with at least one log, stopping at the gap week', () => {
    expect(calcCurrentStreak(dates, '2024-01-24', 'weekly')).toBe(1);
  });

  it('longest streak finds the 2-week run before the gap', () => {
    expect(calcLongestStreak(dates, 'weekly')).toBe(2);
  });
});

describe('calcCompletionRate', () => {
  it('is 0 when no dates are logged', () => {
    expect(calcCompletionRate([], '2026-01-01', '2026-01-10')).toBe(0);
  });

  it('computes a simple percentage over a 10-day range', () => {
    const dates = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05'];
    expect(calcCompletionRate(dates, '2026-01-01', '2026-01-10')).toBe(50);
  });

  it('handles a leap-year February (29 days) correctly', () => {
    const dates = ['2024-02-27', '2024-02-28', '2024-02-29'];
    expect(calcCompletionRate(dates, '2024-02-01', '2024-02-29')).toBe(Math.round((3 / 29) * 100));
  });
});
