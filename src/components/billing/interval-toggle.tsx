'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

type IntervalToggleProps = {
  value: 'month' | 'year';
  onChange: (value: 'month' | 'year') => void;
  savePercent: number;
};

export function IntervalToggle({ value, onChange, savePercent }: IntervalToggleProps) {
  const t = useTranslations('billing.interval');
  const tPricing = useTranslations('pricing');

  return (
    <div className="inline-flex items-center rounded-full border p-1">
      <button
        type="button"
        onClick={() => onChange('month')}
        className={cn(
          'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
          value === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
        )}
      >
        {t('month')}
      </button>
      <button
        type="button"
        onClick={() => onChange('year')}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
          value === 'year' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
        )}
      >
        {t('year')}
        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
          {tPricing('saveBadge', { percent: savePercent })}
        </span>
      </button>
    </div>
  );
}
