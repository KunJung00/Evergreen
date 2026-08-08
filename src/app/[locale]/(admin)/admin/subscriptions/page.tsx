import { getTranslations, setRequestLocale } from 'next-intl/server';

import { SubscriptionsTable } from '@/components/admin/subscriptions-table';
import type { Locale } from '@/i18n/routing';
import { getSubscriptions } from '@/server/queries/admin.queries';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

export default async function AdminSubscriptionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations('admin.subscriptions');
  const subscriptions = await getSubscriptions();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>
      <SubscriptionsTable subscriptions={subscriptions} />
    </div>
  );
}
