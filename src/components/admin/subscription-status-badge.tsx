import { useTranslations } from 'next-intl';

import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { Enums } from '@/types/database.types';

type SubStatus = Enums<'sub_status'>;

const VARIANT_BY_STATUS: Record<SubStatus, BadgeProps['variant']> = {
  active: 'success',
  trialing: 'success',
  past_due: 'warning',
  unpaid: 'warning',
  paused: 'warning',
  incomplete: 'muted',
  incomplete_expired: 'muted',
  canceled: 'destructive',
};

/** Localized colored badge for a subscription status (BUILD-SPEC §5.1 enum). */
export function SubscriptionStatusBadge({ status }: { status: SubStatus }) {
  const t = useTranslations('billing.status');
  return <Badge variant={VARIANT_BY_STATUS[status]}>{t(status)}</Badge>;
}
