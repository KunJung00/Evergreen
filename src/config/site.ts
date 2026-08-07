export const siteConfig = {
  name: 'Evergreen',
  // Placeholder tagline — replaced by i18n message keys in Phase 3.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  locales: ['th', 'en'] as const,
  defaultLocale: 'th' as const,
} as const;

export type Locale = (typeof siteConfig.locales)[number];
