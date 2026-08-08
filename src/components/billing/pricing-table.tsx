'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { IntervalToggle } from '@/components/billing/interval-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PLANS, PLAN_LIMITS, yearlySavingsPercent } from '@/config/plans';
import { Link } from '@/i18n/navigation';

type PricingTableProps = {
  /** The caller's current price id, if any — disables the CTA for that plan. */
  currentPriceId?: string | null;
};

/** Static pricing display — no checkout session is created (UI shell only). */
export function PricingTable({ currentPriceId }: PricingTableProps) {
  const t = useTranslations('pricing');
  const [interval, setInterval] = useState<'month' | 'year'>('month');

  const plan = PLANS[0];
  const price = plan.prices[interval];
  const limits = PLAN_LIMITS[interval];
  const isCurrent = currentPriceId === price.priceId;

  return (
    <div className="flex flex-col items-center gap-8">
      <IntervalToggle
        value={interval}
        onChange={setInterval}
        savePercent={yearlySavingsPercent(plan)}
      />

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{t(`plans.${plan.id}.name`)}</CardTitle>
          <p className="text-3xl font-bold">
            {price.amount.toLocaleString()} {price.currency}
            <span className="text-base font-normal text-muted-foreground">
              {interval === 'month' ? t('perMonth') : t('perYear')}
            </span>
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {plan.featureKeys.map((key) => (
            <div key={key} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                {t(`plans.${plan.id}.${key}`, { max: limits.maxHabits, days: limits.historyDays })}
              </span>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button className="w-full" disabled={isCurrent} asChild={!isCurrent}>
            {isCurrent ? (
              <span>{t('currentPlanCta')}</span>
            ) : (
              <Link href="/register">{t('cta')}</Link>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
