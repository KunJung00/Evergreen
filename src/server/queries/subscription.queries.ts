import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Subscription } from '@/types';

/**
 * Caller's own subscription row (BUILD-SPEC §7). RLS "subs: read own" scopes
 * this to the signed-in user — no service role needed.
 */
export async function getMySubscription(userId: string): Promise<Subscription | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}
