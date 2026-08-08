import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Locale } from '@/i18n/routing';
import { getAdminStats } from '@/server/queries/admin.queries';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations('admin.overview');
  const format = await getFormatter();
  const stats = await getAdminStats();

  const cards = [
    { key: 'totalUsers', value: stats.totalUsers },
    { key: 'admins', value: stats.adminCount },
    { key: 'activeSubscriptions', value: stats.activeSubscriptions },
    { key: 'auditLogs', value: stats.auditLogCount },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t(`cards.${card.key}` as `cards.${(typeof cards)[number]['key']}`)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{format.number(card.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
