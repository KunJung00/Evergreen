import { getTranslations, setRequestLocale } from 'next-intl/server';

import { UsersTable } from '@/components/admin/users-table';
import { requireAdmin } from '@/lib/auth/require-admin';
import type { Locale } from '@/i18n/routing';
import { getUsers } from '@/server/queries/admin.queries';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const admin = await requireAdmin();
  const t = await getTranslations('admin.users');
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>
      <UsersTable users={users} currentUserId={admin.id} />
    </div>
  );
}
