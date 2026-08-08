import { createBrowserClient } from '@supabase/ssr';

import { env } from '@/env';
import type { Database } from '@/types/database.types';

/** Supabase client for the browser / Client Components (BUILD-SPEC §7). */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
