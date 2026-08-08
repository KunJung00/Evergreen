import { getTranslations, setRequestLocale } from 'next-intl/server';

import { HabitManageList } from '@/components/habits/habit-manage-list';
import { PLAN_LIMITS } from '@/config/plans';
import type { Locale } from '@/i18n/routing';
import { requireActiveSubscription } from '@/lib/stripe/entitlement';
import { getHabits } from '@/server/queries/habits';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export default async function ManageHabitsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const subscription = await requireActiveSubscription();
  const t = await getTranslations('habits.manage');

  const [active, all] = await Promise.all([
    getHabits({ includeArchived: false }),
    getHabits({ includeArchived: true }),
  ]);
  const archived = all.filter((h) => h.archived_at !== null);
  const limit = PLAN_LIMITS[subscription.interval].maxHabits;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>
      <HabitManageList active={active} archived={archived} limit={limit} />
    </div>
  );
}
