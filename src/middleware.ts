import { createServerClient } from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';

import { env } from '@/env';
import { routing } from '@/i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';
import type { Database } from '@/types/database.types';

const intlMiddleware = createMiddleware(routing);

// Route groups keyed off the locale-stripped pathname (BUILD-SPEC §6, §8).
const PROTECTED_PREFIXES = ['/dashboard', '/settings', '/admin'];
const ADMIN_PREFIXES = ['/admin'];
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

/**
 * Lightweight role lookup for admin paths only. Reads the caller's own profile
 * row (RLS "read own"), so it never risks the `profiles` recursion (pitfall P2)
 * and adds a query solely on `/admin/*` requests.
 */
async function isAdmin(request: NextRequest, userId: string): Promise<boolean> {
  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => undefined,
      },
    },
  );
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  return data?.role === 'admin';
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

  // Admin guard: non-admins must not learn that /admin exists — rewrite to a
  // non-matching path so Next renders the 404 boundary (BUILD-SPEC §8, §11
  // Phase 5). The (admin) layout's requireAdmin() is the authoritative backstop.
  if (matchesPrefix(pathname, ADMIN_PREFIXES) && user && !(await isAdmin(request, user.id))) {
    const notFoundUrl = new URL('/_not-found', request.url);
    const rewrite = NextResponse.rewrite(notFoundUrl);
    response.cookies.getAll().forEach((cookie) => rewrite.cookies.set(cookie));
    return rewrite;
  }

  return response;
}

export const config = {
  // Skip Next internals, API routes, /auth/callback, and any file with an extension.
  matcher: ['/((?!api|_next|_vercel|auth|.*\\..*).*)'],
};
