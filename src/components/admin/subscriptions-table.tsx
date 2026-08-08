'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { DataTable, type Column } from '@/components/admin/data-table';
import { SubscriptionStatusBadge } from '@/components/admin/subscription-status-badge';
import type { SubscriptionRow } from '@/server/queries/admin.queries';

export function SubscriptionsTable({ subscriptions }: { subscriptions: SubscriptionRow[] }) {
  const t = useTranslations('admin.subscriptions');
  const tInterval = useTranslations('billing.interval');
  const format = useFormatter();

  const columns = useMemo<Column<SubscriptionRow>[]>(
    () => [
      {
        id: 'user',
        header: t('columns.user'),
        sortValue: (s) => s.userEmail ?? '',
        cell: (s) => (
          <span className="font-medium">
            {s.userEmail ?? <span className="text-muted-foreground">—</span>}
          </span>
        ),
      },
      {
        id: 'status',
        header: t('columns.status'),
        sortValue: (s) => s.status,
        cell: (s) => <SubscriptionStatusBadge status={s.status} />,
      },
      {
        id: 'interval',
        header: t('columns.interval'),
        sortValue: (s) => s.interval,
        cell: (s) => tInterval(s.interval),
      },
      {
        id: 'renews',
        header: t('columns.renews'),
        sortValue: (s) => s.current_period_end ?? '',
        cell: (s) =>
          s.current_period_end ? (
            format.dateTime(new Date(s.current_period_end), { dateStyle: 'medium' })
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: 'cancel',
        header: t('columns.cancelAtPeriodEnd'),
        sortValue: (s) => (s.cancel_at_period_end ? 1 : 0),
        cell: (s) => (s.cancel_at_period_end ? t('yes') : t('no')),
      },
    ],
    [t, tInterval, format],
  );

  return (
    <DataTable
      rows={subscriptions}
      columns={columns}
      getRowId={(s) => s.id}
      searchAccessor={(s) => `${s.userEmail ?? ''} ${s.status} ${s.id}`}
    />
  );
}
