'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { DataTable, type Column } from '@/components/admin/data-table';
import type { AuditLogRow } from '@/server/queries/admin.queries';

export function LogsTable({ logs }: { logs: AuditLogRow[] }) {
  const t = useTranslations('admin.logs');
  const format = useFormatter();

  const columns = useMemo<Column<AuditLogRow>[]>(
    () => [
      {
        id: 'created_at',
        header: t('columns.time'),
        sortValue: (l) => l.created_at,
        cell: (l) =>
          format.dateTime(new Date(l.created_at), { dateStyle: 'medium', timeStyle: 'short' }),
      },
      {
        id: 'actor',
        header: t('columns.actor'),
        sortValue: (l) => l.actorEmail ?? '',
        cell: (l) => l.actorEmail ?? <span className="text-muted-foreground">{t('system')}</span>,
      },
      {
        id: 'action',
        header: t('columns.action'),
        sortValue: (l) => l.action,
        cell: (l) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{l.action}</code>,
      },
      {
        id: 'target',
        header: t('columns.target'),
        cell: (l) =>
          l.target_id ? (
            <span className="text-muted-foreground">
              {l.target_type}:{l.target_id.slice(0, 8)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    [t, format],
  );

  return (
    <DataTable
      rows={logs}
      columns={columns}
      getRowId={(l) => l.id}
      searchAccessor={(l) => `${l.actorEmail ?? ''} ${l.action} ${l.target_id ?? ''}`}
    />
  );
}
