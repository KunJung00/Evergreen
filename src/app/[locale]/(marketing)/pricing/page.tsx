import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { PricingTable } from '@/components/billing/pricing-table';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'pricing' });
  const title = t('title');
  return {
    title,
    description: t('subtitle'),
    openGraph: { title, images: [`/api/og?title=${encodeURIComponent(title)}`] },
  };
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations('pricing');

  return (
    <Container className="flex flex-col items-center py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('title')}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{t('subtitle')}</p>
      <div className="mt-10 w-full">
        <PricingTable />
      </div>
    </Container>
  );
}
