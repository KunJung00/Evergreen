'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { DataTable, type Column } from '@/components/admin/data-table';
import type { AdminHabitRow } from '@/server/queries/habits';

export function HabitsTable({ rows }: { rows: AdminHabitRow[] }) {
  const t = useTranslations('admin.habits');
  const format = useFormatter();

  const columns = useMemo<Column<AdminHabitRow>[]>(
    () => [
      {
        id: 'user',
        header: t('columns.user'),
        sortValue: (r) => r.email ?? '',
        cell: (r) => <span className="font-medium">{r.email ?? r.userId}</span>,
      },
      {
        id: 'habitCount',
        header: t('columns.habitCount'),
        sortValue: (r) => r.habitCount,
        cell: (r) => r.habitCount,
      },
      {
        id: 'totalLogs',
        header: t('columns.totalLogs'),
        sortValue: (r) => r.totalLogs,
        cell: (r) => r.totalLogs,
      },
      {
        id: 'logsLast7Days',
        header: t('columns.logsLast7Days'),
        sortValue: (r) => r.logsLast7Days,
        cell: (r) => r.logsLast7Days,
      },
      {
        id: 'lastActive',
        header: t('columns.lastActive'),
        sortValue: (r) => r.lastActiveDate ?? '',
        cell: (r) =>
          r.lastActiveDate ? (
            format.dateTime(new Date(r.lastActiveDate), { dateStyle: 'medium' })
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    [t, format],
  );

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(r) => r.userId}
      searchAccessor={(r) => r.email ?? r.userId}
    />
  );
}
