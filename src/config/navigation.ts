import {
  AlertTriangle,
  FileClock,
  Flame,
  LayoutDashboard,
  Shield,
  User,
  Users,
  CreditCard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Admin section navigation (BUILD-SPEC §3). `labelKey` resolves under the
 * `admin.nav` i18n namespace (R8); `href` is locale-prefixed automatically by
 * the next-intl `<Link>`.
 */
export type NavItem = {
  href: string;
  /** Key under the `admin.nav` i18n namespace. */
  labelKey: 'overview' | 'users' | 'subscriptions' | 'logs' | 'habits';
  icon: LucideIcon;
};

export const adminNav: NavItem[] = [
  { href: '/admin', labelKey: 'overview', icon: LayoutDashboard },
  { href: '/admin/users', labelKey: 'users', icon: Users },
  { href: '/admin/subscriptions', labelKey: 'subscriptions', icon: CreditCard },
  { href: '/admin/habits', labelKey: 'habits', icon: Flame },
  { href: '/admin/logs', labelKey: 'logs', icon: FileClock },
];

/** Settings section navigation. `labelKey` resolves under `settings.nav`. */
export type SettingsNavItem = {
  href: string;
  labelKey: 'profile' | 'billing' | 'security' | 'danger';
  icon: LucideIcon;
};

export const settingsNav: SettingsNavItem[] = [
  { href: '/settings/profile', labelKey: 'profile', icon: User },
  { href: '/settings/billing', labelKey: 'billing', icon: CreditCard },
  { href: '/settings/security', labelKey: 'security', icon: Shield },
  { href: '/settings/danger', labelKey: 'danger', icon: AlertTriangle },
];
