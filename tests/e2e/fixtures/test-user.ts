import { createClient } from '@supabase/supabase-js';

import type { Database } from '../../../src/types/database.types';

/**
 * Creates a pre-confirmed test user via the service-role client, bypassing
 * the UI signup + email-confirmation flow (not automatable in CI without a
 * mailbox). Requires `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
 * to point at a real (local/test) Supabase instance — these tests are not
 * runnable in this sandboxed session; see docs/template-gaps.md.
 */
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for e2e setup.');
  }
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type TestUser = { id: string; email: string; password: string };

export async function createTestUser(prefix: string): Promise<TestUser> {
  const supabase = adminClient();
  const email = `${prefix}-${Date.now()}@example.test`;
  const password = 'Test-password-123!';

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`Could not create test user: ${error?.message}`);
  }

  return { id: data.user.id, email, password };
}

export async function deleteTestUser(userId: string): Promise<void> {
  const supabase = adminClient();
  await supabase.auth.admin.deleteUser(userId);
}

/** Inserts a habit directly (service role), bypassing the UI, for RLS tests. */
export async function createTestHabit(userId: string, name: string): Promise<string> {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      name,
      icon: '🔒',
      color: 'blue',
      frequency: 'daily',
      target_per_day: 1,
    })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(`Could not create test habit: ${error?.message}`);
  }
  return data.id;
}
