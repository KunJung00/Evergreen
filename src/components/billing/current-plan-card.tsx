import { getFormatter, getTranslations } from 'next-intl/server';

import { SubscriptionStatusBadge } from '@/components/admin/subscription-status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import type { Subscription } from '@/types';

export async function CurrentPlanCard({ subscription }: { subscription: Subscription | null }) {
  const t = await getTranslations('settings.billing');
  const tColumns = await getTranslations('admin.subscriptions.columns');
  const tInterval = await getTranslations('billing.interval');
  const format = await getFormatter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('currentPlan')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription ? (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">{t('statusLabel')}</dt>
              <dd className="mt-1">
                <SubscriptionStatusBadge status={subscription.status} />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{tColumns('interval')}</dt>
              <dd className="mt-1">{tInterval(subscription.interval)}</dd>
            </div>
            {subscription.current_period_end ? (
              <div>
                <dt className="text-muted-foreground">{t('renewsLabel')}</dt>
                <dd className="mt-1">
                  {format.dateTime(new Date(subscription.current_period_end), {
                    dateStyle: 'medium',
                  })}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <EmptyState
            title={t('noPlan')}
            action={
              <Button asChild>
                <Link href="/pricing">{t('viewPlans')}</Link>
              </Button>
            }
          />
        )}
        <p className="text-xs text-muted-foreground">{t('notConnectedNotice')}</p>
      </CardContent>
    </Card>
  );
}
