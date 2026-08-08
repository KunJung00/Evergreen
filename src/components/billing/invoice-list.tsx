import { getTranslations } from 'next-intl/server';

import { EmptyState } from '@/components/shared/empty-state';

/**
 * No real Stripe invoice data exists this round (checkout/webhook aren't
 * wired up — see docs/template-gaps.md), so this always renders empty rather
 * than fabricating fake receipts.
 */
export async function InvoiceList() {
  const t = await getTranslations('billing.invoices');

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground">{t('title')}</h3>
      <div className="mt-2">
        <EmptyState title={t('empty')} />
      </div>
    </div>
  );
}
