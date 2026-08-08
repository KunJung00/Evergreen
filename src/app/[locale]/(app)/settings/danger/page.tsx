import { getTranslations, setRequestLocale } from 'next-intl/server';

import { DeleteAccountButton } from '@/components/settings/delete-account-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Locale } from '@/i18n/routing';
import { requireAuth } from '@/lib/auth/require-auth';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function DangerSettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const user = await requireAuth();
  const t = await getTranslations('settings.danger');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg">{t('deleteTitle')}</CardTitle>
          <CardDescription>{t('deleteBody')}</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton email={user.email} />
        </CardContent>
      </Card>
    </div>
  );
}
