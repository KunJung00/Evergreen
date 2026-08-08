import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CurrentPlanCard } from '@/components/billing/current-plan-card';
import { InvoiceList } from '@/components/billing/invoice-list';
import type { Locale } from '@/i18n/routing';
import { requireAuth } from '@/lib/auth/require-auth';
import { getSubscription } from '@/lib/stripe/entitlement';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

/**
 * UI shell only — shows whatever `entitlement.ts` currently resolves (the
 * stubbed active plan, since checkout/portal aren't wired up yet — see
 * docs/template-gaps.md). Nothing here calls Stripe.
 */
export default async function BillingSettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const user = await requireAuth();
  const t = await getTranslations('settings.billing');
  const subscription = await getSubscription(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <CurrentPlanCard subscription={subscription} />
      <InvoiceList />
    </div>
  );
}
