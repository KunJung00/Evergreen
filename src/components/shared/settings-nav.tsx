'use client';

import { useTranslations } from 'next-intl';

import { settingsNav } from '@/config/navigation';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

/** Settings section nav with active-state highlighting (locale-aware pathname). */
export function SettingsNav() {
  const t = useTranslations('settings.nav');
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1" aria-label={t('profile')}>
      {settingsNav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="size-4" />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
