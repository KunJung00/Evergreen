import { getTranslations, setRequestLocale } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';

import { requireAuth } from '@/lib/auth/require-auth';

type Props = { params: Promise<{ locale: string }> };

// Reads the session per-request; must not be prerendered.
export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const user = await requireAuth();
  const t = await getTranslations('dashboard');

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="text-muted-foreground">
        {t('welcome', { name: user.full_name ?? user.email })}
      </p>
    </div>
  );
}
