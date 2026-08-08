import { getTranslations, setRequestLocale } from 'next-intl/server';

import { HabitPreferencesForm } from '@/components/settings/habit-preferences-form';
import { ProfileForm } from '@/components/settings/profile-form';
import type { Locale } from '@/i18n/routing';
import { requireAuth } from '@/lib/auth/require-auth';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function ProfileSettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const user = await requireAuth();
  const t = await getTranslations('settings.profile');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>
      <ProfileForm email={user.email} fullName={user.full_name} avatarUrl={user.avatar_url} />

      <div className="border-t pt-6">
        <h2 className="text-lg font-medium">{t('preferencesTitle')}</h2>
        <div className="mt-4">
          <HabitPreferencesForm
            timezone={user.timezone}
            weekStart={user.week_start === 1 ? 1 : 0}
            weeklyEmailOptIn={user.weekly_email_opt_in}
          />
        </div>
      </div>
    </div>
  );
}
