import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ChangePasswordForm } from '@/components/settings/change-password-form';
import type { Locale } from '@/i18n/routing';
import { requireAuth } from '@/lib/auth/require-auth';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function SecuritySettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  await requireAuth();
  const t = await getTranslations('settings.security');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
