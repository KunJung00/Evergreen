import { FileClock, LayoutDashboard, Users, CreditCard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Admin section navigation (BUILD-SPEC §3). `labelKey` resolves under the
 * `admin.nav` i18n namespace (R8); `href` is locale-prefixed automatically by
 * the next-intl `<Link>`.
 */
export type NavItem = {
  href: string;
  /** Key under the `admin.nav` i18n namespace. */
  labelKey: 'overview' | 'users' | 'subscriptions' | 'logs';
  icon: LucideIcon;
};

export const adminNav: NavItem[] = [
  { href: '/admin', labelKey: 'overview', icon: LayoutDashboard },
  { href: '/admin/users', labelKey: 'users', icon: Users },
  { href: '/admin/subscriptions', labelKey: 'subscriptions', icon: CreditCard },
  { href: '/admin/logs', labelKey: 'logs', icon: FileClock },
];
