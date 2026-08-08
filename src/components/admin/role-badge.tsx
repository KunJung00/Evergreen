import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import type { UserRole } from '@/server/validators/admin.schema';

/** Localized colored badge for a user's role. */
export function RoleBadge({ role }: { role: UserRole }) {
  const t = useTranslations('admin.roles');
  return <Badge variant={role === 'admin' ? 'default' : 'muted'}>{t(role)}</Badge>;
}
