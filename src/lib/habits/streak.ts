import { eachDayBetween, shiftDate } from '@/lib/habits/date';

/**
 * Pure streak/completion math (FEATURE-SPEC §6.4). Input dates are always
 * `YYYY-MM-DD` strings, newest first. No database access, no `new Date()`
 * inside — callers pass `today` in explicitly so this stays deterministic
 * and testable.
 */
export type Frequency = 'daily' | 'weekly';

/** The Monday that starts the ISO-ish week containing `date`. */
function weekKey(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = d.getUTCDay(); // 0 = Sun .. 6 = Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  return shiftDate(date, -daysSinceMonday);
}

function previousWeekKey(week: string): string {
  return shiftDate(week, -7);
}

/** Consecutive days/weeks ending at `today` (or the prior unit, if `today` itself has no log yet). */
export function calcCurrentStreak(dates: string[], today: string, frequency: Frequency): number {
  if (frequency === 'daily') {
    const done = new Set(dates);
    let cursor = done.has(today) ? today : shiftDate(today, -1);
    let streak = 0;
    while (done.has(cursor)) {
      streak++;
      cursor = shiftDate(cursor, -1);
    }
    return streak;
  }

  const weeksDone = new Set(dates.map(weekKey));
  let cursor = weekKey(today);
  if (!weeksDone.has(cursor)) cursor = previousWeekKey(cursor);
  let streak = 0;
  while (weeksDone.has(cursor)) {
    streak++;
    cursor = previousWeekKey(cursor);
  }
  return streak;
}

/** Longest run of consecutive days/weeks anywhere in `dates`. */
export function calcLongestStreak(dates: string[], frequency: Frequency): number {
  if (dates.length === 0) return 0;

  const units =
    frequency === 'daily' ? Array.from(new Set(dates)) : Array.from(new Set(dates.map(weekKey)));
  const sorted = units.sort(); // ISO date strings sort chronologically as text

  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const expectedNext = frequency === 'daily' ? shiftDate(prev, 1) : shiftDate(prev, 7);
    if (curr === expectedNext) {
      current++;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
  }
  return longest;
}

/** Percentage (0-100) of days in `[from, to]` (inclusive) that have a log. */
export function calcCompletionRate(dates: string[], from: string, to: string): number {
  const range = eachDayBetween(from, to);
  if (range.length === 0) return 0;
  const done = new Set(dates);
  const completed = range.filter((date) => done.has(date)).length;
  return Math.round((completed / range.length) * 100);
}
