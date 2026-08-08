'use client';

import { useLocale, useTranslations } from 'next-intl';

import { formatDisplayDate } from '@/lib/habits/date';
import { cn } from '@/lib/utils';

const LEVEL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-muted',
  1: 'bg-emerald-200 dark:bg-emerald-950',
  2: 'bg-emerald-300 dark:bg-emerald-800',
  3: 'bg-emerald-500 dark:bg-emerald-600',
  4: 'bg-emerald-600 dark:bg-emerald-400',
};

type HabitHeatmapCellProps = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  target: number;
  inRange: boolean;
};

/** One heatmap day cell. Client-only for the locale-aware tooltip (`title`). */
export function HabitHeatmapCell({ date, count, level, target, inRange }: HabitHeatmapCellProps) {
  const t = useTranslations('habits.heatmap');
  const locale = useLocale();

  if (!inRange) {
    return <div aria-hidden className="size-[10px] rounded-[2px] sm:size-3" />;
  }

  const formatted = formatDisplayDate(date, locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      title={t('tooltip', { date: formatted, count, target })}
      className={cn('size-[10px] rounded-[2px] sm:size-3', LEVEL_CLASS[level])}
    />
  );
}
