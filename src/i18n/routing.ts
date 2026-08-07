import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['th', 'en'],
  defaultLocale: 'th',
  // th (default) has no prefix; en is served under /en.
  localePrefix: 'as-needed',
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365,
  },
});

export type Locale = (typeof routing.locales)[number];
