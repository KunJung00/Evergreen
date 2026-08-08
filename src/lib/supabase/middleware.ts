import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

import { env } from '@/env';
import type { Database } from '@/types/database.types';

/**
 * Refresh the Supabase session and write any rotated auth cookies onto the
 * response next-intl already produced (BUILD-SPEC §8, pitfall P1). Cookies are
 * mirrored onto both the incoming request (so the same request can read them)
 * and the outgoing response (so the browser receives them).
 *
 * The caller owns the response object — never create a fresh one here, or the
 * intl redirect/rewrite/locale cookie would be dropped.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
): Promise<{ response: NextResponse; user: User | null }> {
  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() revalidates the token with Supabase (unlike getSession()), which
  // is what makes the guard trustworthy.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
