import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import { env } from '@/env';
import type { Database } from '@/types/database.types';

/**
 * Supabase client for RSC, Server Actions, and Route Handlers (BUILD-SPEC §7).
 * Reads/writes auth cookies through Next's cookie store.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component render, where cookies are read-only.
            // Safe to ignore: the middleware refreshes the session cookie instead.
          }
        },
      },
    },
  );
}
