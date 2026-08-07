import createMiddleware from 'next-intl/middleware';

import { routing } from '@/i18n/routing';

// Phase 3: locale routing only. Phase 4 composes Supabase session refresh into this
// same file (BUILD-SPEC §8) — do not split into a second middleware.
export default createMiddleware(routing);

export const config = {
  // Skip Next internals, API routes, /auth/callback, and any file with an extension.
  matcher: ['/((?!api|_next|_vercel|auth|.*\\..*).*)'],
};
