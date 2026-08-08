import { AlertTriangle } from 'lucide-react';
import { getFormatter, getTranslations } from 'next-intl/server';

import type { Subscription } from '@/types';

/** Warns about a past-due payment or an upcoming cancellation. Inert while `entitlement.ts` is stubbed active. */
export async function PaymentAlertBanner({ subscription }: { subscription: Subscription | null }) {
  if (!subscription) return null;

  const t = await getTranslations('billing.alerts');
  const format = await getFormatter();

  let message: string | null = null;
  if (subscription.status === 'past_due') {
    message = t('pastDue');
  } else if (subscription.cancel_at_period_end && subscription.current_period_end) {
    message = t('canceling', {
      date: format.dateTime(new Date(subscription.current_period_end), { dateStyle: 'medium' }),
    });
  }

  if (!message) return null;

  return (
    <div className="border-b bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
      <div className="container mx-auto flex items-center gap-2">
        <AlertTriangle className="size-4 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}
