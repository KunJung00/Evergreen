'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from '@/i18n/navigation';
import { shiftDate } from '@/lib/habits/date';

type DayNavProps = { date: string; today: string };

export function DayNav({ date, today }: DayNavProps) {
  const t = useTranslations('habits');
  const format = useFormatter();
  const router = useRouter();
  const pathname = usePathname();

  const prev = shiftDate(date, -1);
  const next = shiftDate(date, 1);
  const minDate = shiftDate(today, -7);
  const canGoPrev = prev >= minDate;
  const canGoNext = date < today;

  function go(target: string) {
    router.push(`${pathname}?date=${target}`);
  }

  const [year, month, day] = date.split('-').map(Number);
  const label =
    date === today
      ? t('today')
      : format.dateTime(new Date(Date.UTC(year, month - 1, day)), {
          day: 'numeric',
          month: 'long',
          timeZone: 'UTC',
        });

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => go(prev)}
        disabled={!canGoPrev}
        aria-label={t('day.previous')}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-28 text-center text-sm font-medium">{label}</span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => go(next)}
        disabled={!canGoNext}
        aria-label={t('day.next')}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
