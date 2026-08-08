'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';

import { logAudit } from '@/lib/audit';
import { requireAuth } from '@/lib/auth/require-auth';
import { routing } from '@/i18n/routing';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { toFieldErrors } from '@/lib/validation';
import {
  changePasswordSchema,
  preferencesSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type PreferencesInput,
  type UpdateProfileInput,
} from '@/server/validators/profile.schema';
import type { ActionResult } from '@/types';

/** Update the caller's own name/avatar (BUILD-SPEC §5.6: role is never client-settable here). */
export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult> {
  const user = await requireAuth();

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'validation', fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: parsed.data.fullName, avatar_url: parsed.data.avatarUrl })
    .eq('id', user.id);
  if (error) {
    return { success: false, error: 'updateFailed' };
  }

  revalidatePath('/[locale]/settings/profile', 'page');
  return { success: true, data: undefined };
}

/** Update habit-tracker preferences: timezone, week start, weekly summary opt-in. */
export async function updateProfilePreferences(input: PreferencesInput): Promise<ActionResult> {
  const user = await requireAuth();

  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'validation', fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      timezone: parsed.data.timezone,
      week_start: parsed.data.weekStart,
      weekly_email_opt_in: parsed.data.weeklyEmailOptIn,
    })
    .eq('id', user.id);
  if (error) {
    return { success: false, error: 'updateFailed' };
  }

  revalidatePath('/[locale]/settings/profile', 'page');
  revalidatePath('/[locale]/dashboard', 'page');
  return { success: true, data: undefined };
}

/** Change the caller's password via their own session (no admin client needed). */
export async function changePassword(input: ChangePasswordInput): Promise<ActionResult> {
  await requireAuth();

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'validation', fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { success: false, error: 'passwordUpdateFailed' };
  }

  return { success: true, data: undefined };
}

/**
 * Permanently delete the caller's account. Cascades to `profiles` (and, once
 * built, `habits`/`habit_logs`) via `on delete cascade` from `auth.users`.
 *
 * Real Stripe subscription cancellation is intentionally skipped — billing
 * checkout/webhook aren't wired up yet this round (see docs/template-gaps.md).
 */
export async function deleteAccount(): Promise<void> {
  const user = await requireAuth();

  await logAudit({
    actorId: user.id,
    action: 'user.account_deleted',
    targetType: 'profile',
    targetId: user.id,
  });

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(user.id);

  const supabase = createClient();
  await supabase.auth.signOut();

  const locale = await getLocale();
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  redirect(`${prefix}/`);
}
