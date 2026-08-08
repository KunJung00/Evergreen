'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { DataTable, type Column } from '@/components/admin/data-table';
import { RoleSelect } from '@/components/admin/role-select';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import type { Profile } from '@/types';

type UsersTableProps = {
  users: Profile[];
  /** Signed-in admin — used to lock their own role row. */
  currentUserId: string;
};

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const t = useTranslations('admin.users');
  const format = useFormatter();

  const columns = useMemo<Column<Profile>[]>(
    () => [
      {
        id: 'email',
        header: t('columns.email'),
        sortValue: (u) => u.email,
        cell: (u) => <span className="font-medium">{u.email}</span>,
      },
      {
        id: 'name',
        header: t('columns.name'),
        sortValue: (u) => u.full_name ?? '',
        cell: (u) => u.full_name ?? <span className="text-muted-foreground">—</span>,
      },
      {
        id: 'role',
        header: t('columns.role'),
        sortValue: (u) => u.role,
        cell: (u) => <RoleSelect userId={u.id} role={u.role} disabled={u.id === currentUserId} />,
      },
      {
        id: 'created_at',
        header: t('columns.joined'),
        sortValue: (u) => u.created_at,
        cell: (u) => format.dateTime(new Date(u.created_at), { dateStyle: 'medium' }),
      },
      {
        id: 'actions',
        header: t('columns.actions'),
        cell: (u) => (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/users/${u.id}`}>{t('view')}</Link>
          </Button>
        ),
      },
    ],
    [t, format, currentUserId],
  );

  return (
    <DataTable
      rows={users}
      columns={columns}
      getRowId={(u) => u.id}
      searchAccessor={(u) => `${u.email} ${u.full_name ?? ''}`}
    />
  );
}
