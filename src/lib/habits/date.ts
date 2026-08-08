/**
 * Timezone-aware date helpers for the Habit Tracker (FEATURE-SPEC §10, pitfalls
 * #1 and #4). `logged_date` must always be derived through `toUserDate`/`todayInTz`
 * — never `new Date().toISOString().slice(0, 10)` anywhere else in the app — and
 * days are always walked one at a time via `setUTCDate`, never raw timestamp
 * arithmetic (`date - 86400000`), which breaks around DST/leap days.
 */

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** The calendar date (`YYYY-MM-DD`) `instant` falls on in the given IANA timezone. */
export function toUserDate(instant: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

/** Today's calendar date in the given timezone. */
export function todayInTz(tz: string): string {
  return toUserDate(new Date(), tz);
}

function parseUtcDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtcDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** All calendar dates from `from` to `to` inclusive, walked one day at a time. */
export function eachDayBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  const cursor = parseUtcDate(from);
  const end = parseUtcDate(to);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(formatUtcDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

/** `date` shifted by `days` (positive or negative), walked one day at a time. */
export function shiftDate(date: string, days: number): string {
  const cursor = parseUtcDate(date);
  const step = days >= 0 ? 1 : -1;
  for (let i = 0; i < Math.abs(days); i++) {
    cursor.setUTCDate(cursor.getUTCDate() + step);
  }
  return formatUtcDate(cursor);
}

/**
 * Locale-correct display formatting (FEATURE-SPEC §8, §10 pitfall #5). `th`
 * must use the `-u-ca-buddhist` locale extension, not just `'th-TH'`, or the
 * year renders in Christian era instead of Buddhist era.
 */
export function formatDisplayDate(
  date: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const [year, month, day] = date.split('-').map(Number);
  const instant = new Date(Date.UTC(year, month - 1, day));
  const intlLocale = locale === 'th' ? 'th-TH-u-ca-buddhist' : 'en-US';
  return new Intl.DateTimeFormat(intlLocale, { ...options, timeZone: 'UTC' }).format(instant);
}

/** Whether `date` falls within `days` days before (and including) `today`, never after. */
export function isWithinBackfillWindow(date: string, today: string, days = 7): boolean {
  let cursor = today;
  for (let i = 0; i <= days; i++) {
    if (cursor === date) return true;
    cursor = shiftDate(cursor, -1);
  }
  return false;
}
