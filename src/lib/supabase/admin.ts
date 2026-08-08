import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { env } from '@/env';
import type { Database } from '@/types/database.types';

/**
 * Service-role client that bypasses RLS (BUILD-SPEC §7, R5, pitfall P8).
 *
 * ⚠️ SUPABASE_SERVICE_ROLE_KEY must never reach the client bundle. `import 'server-only'`
 * makes this module a build error if imported from a Client Component. Use only from
 * trusted server code (Stripe webhook, audit logging, admin mutations).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
