import type messages from '../../messages/en.json';
import type { routing } from '@/i18n/routing';

// Typed next-intl: message keys and locales are checked at compile time (BUILD-SPEC Phase 3).
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
