'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

import { requireAdmin } from '@/lib/auth/require-admin';
import { logAudit } from '@/lib/audit';
import { createAdminClient } from '@/lib/supabase/admin';
import { toFieldErrors } from '@/lib/validation';
import { updateRoleSchema, type UpdateRoleInput } from '@/server/validators/admin.schema';
import type { ActionResult } from '@/types';

/** Best-effort client IP for audit records. */
function clientIp(): string {
  const forwarded = headers().get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

/**
 * Change a user's role and record it in `audit_logs` (BUILD-SPEC §5.6 note, §11
 * Phase 5). Guards: admin-only, zod-validated, and an admin may not change their
 * own role (prevents self lock-out and self-elevation, pitfall P7). The write
 * uses the service-role client so it does not depend on the caller's RLS scope.
 */
export async function updateUserRole(input: UpdateRoleInput): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = updateRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'validation', fieldErrors: toFieldErrors(parsed.error) };
  }
  const { userId, role } = parsed.data;

  if (userId === admin.id) {
    return { success: false, error: 'cannotChangeSelf' };
  }

  const supabase = createAdminClient();

  const { data: target, error: fetchError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single();
  if (fetchError || !target) {
    return { success: false, error: 'userNotFound' };
  }
  if (target.role === role) {
    return { success: true, data: undefined };
  }

  const { error: updateError } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (updateError) {
    return { success: false, error: 'updateFailed' };
  }

  await logAudit({
    actorId: admin.id,
    action: 'user.role_changed',
    targetType: 'profile',
    targetId: userId,
    meta: { from: target.role, to: role },
    ip: clientIp(),
  });

  revalidatePath('/admin/users', 'page');
  revalidatePath(`/admin/users/${userId}`, 'page');
  return { success: true, data: undefined };
}
