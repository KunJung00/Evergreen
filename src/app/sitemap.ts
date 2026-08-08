import type { MetadataRoute } from 'next';

import { siteConfig } from '@/config/site';
import { routing } from '@/i18n/routing';

// Public marketing routes only — authenticated areas are disallowed in robots.ts.
const PUBLIC_PATHS = ['', '/pricing', '/terms', '/privacy', '/refund-policy'] as const;

/** Build a locale-aware URL respecting `localePrefix: 'as-needed'` (th is unprefixed). */
function localeUrl(locale: (typeof routing.locales)[number], path: string): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  return `${siteConfig.url}${prefix}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_PATHS.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: localeUrl(locale, path),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((alt) => [alt, localeUrl(alt, path)])),
      },
    })),
  );
}
