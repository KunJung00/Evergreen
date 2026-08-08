import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Append a row to `audit_logs` (BUILD-SPEC §7). Writes go through the
 * service-role client because `audit_logs` has no INSERT policy — only admins
 * may read (RLS migration 006). Best-effort: logging must never break the
 * surrounding action, so failures are swallowed after being surfaced to stderr.
 */
export async function logAudit(input: {
  actorId: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('audit_logs').insert({
      actor_id: input.actorId,
      action: input.action,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      meta: (input.meta ?? {}) as never,
      ip: input.ip ?? null,
    });
    if (error) {
      console.error('[audit] failed to write log', { action: input.action, error: error.message });
    }
  } catch (error) {
    console.error('[audit] unexpected error', error);
  }
}
