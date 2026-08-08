import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { routing } from '@/i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

// Route groups keyed off the locale-stripped pathname (BUILD-SPEC §6, §8).
const PROTECTED_PREFIXES = ['/dashboard', '/settings', '/admin'];
const GUEST_ONLY_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

/** Remove a leading `/en` (or `/th`) segment so guards match either locale. */
function stripLocale(pathname: string): string {
  const [, maybeLocale] = pathname.split('/');
  if ((routing.locales as readonly string[]).includes(maybeLocale)) {
    const stripped = pathname.slice(maybeLocale.length + 1);
    return stripped === '' ? '/' : stripped;
  }
  return pathname;
}

/** Prefix to preserve the active locale on redirects (`th` has no prefix). */
function localePrefix(pathname: string): string {
  const [, maybeLocale] = pathname.split('/');
  return (routing.locales as readonly string[]).includes(maybeLocale) &&
    maybeLocale !== routing.defaultLocale
    ? `/${maybeLocale}`
    : '';
}

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Redirect while carrying over the auth cookies the session refresh just set. */
function redirectWithCookies(path: string, request: NextRequest, base: NextResponse): NextResponse {
  const url = new URL(`${localePrefix(request.nextUrl.pathname)}${path}`, request.url);
  const redirect = NextResponse.redirect(url);
  base.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // 1) next-intl resolves locale first (may redirect/rewrite, sets locale cookie).
  const intlResponse = intlMiddleware(request);

  // 2) Refresh the Supabase session, writing rotated cookies onto the intl response.
  const { response, user } = await updateSession(request, intlResponse);

  // 3) Route guards on the locale-stripped path.
  const pathname = stripLocale(request.nextUrl.pathname);

  if (matchesPrefix(pathname, PROTECTED_PREFIXES) && !user) {
    return redirectWithCookies('/login', request, response);
  }

  if (matchesPrefix(pathname, GUEST_ONLY_PREFIXES) && user) {
    return redirectWithCookies('/dashboard', request, response);
  }

  // Admin role-based guard (404 for non-admins) is added in Phase 5, once the
  // (admin) pages exist. Until then /admin is covered by PROTECTED_PREFIXES.

  return response;
}

export const config = {
  // Skip Next internals, API routes, /auth/callback, and any file with an extension.
  matcher: ['/((?!api|_next|_vercel|auth|.*\\..*).*)'],
};
