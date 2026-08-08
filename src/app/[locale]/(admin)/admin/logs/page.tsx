import { getTranslations, setRequestLocale } from 'next-intl/server';

import { LogsTable } from '@/components/admin/logs-table';
import type { Locale } from '@/i18n/routing';
import { getAuditLogs } from '@/server/queries/admin.queries';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

export default async function AdminLogsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations('admin.logs');
  const logs = await getAuditLogs();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>
      <LogsTable logs={logs} />
    </div>
  );
}
