import type { Session } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types';

/** Current auth session, or null (BUILD-SPEC §7). */
export async function getSession(): Promise<Session | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * The signed-in user's profile row, or null (BUILD-SPEC §7). Uses getUser() to
 * verify the token with Supabase before trusting it.
 */
export async function getCurrentUser(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return data ?? null;
}
