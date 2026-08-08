import { getTranslations, setRequestLocale } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';

import { Link } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

export default async function VerifyEmailPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations('auth.verifyEmail');

  return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      <Link href="/login" className="text-sm font-medium hover:underline">
        {t('backToLogin')}
      </Link>
    </div>
  );
}
