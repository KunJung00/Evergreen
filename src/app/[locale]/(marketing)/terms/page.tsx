import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { LegalPage } from '@/components/shared/legal-page';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'legal.terms' });
  return { title: t('title') };
}

const SECTION_KEYS = [
  'acceptance',
  'service',
  'billing',
  'content',
  'termination',
  'liability',
  'changes',
  'contact',
] as const;

type Props = { params: Promise<{ locale: string }> };

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <LegalPage namespace="legal.terms" sectionKeys={SECTION_KEYS} />;
}
