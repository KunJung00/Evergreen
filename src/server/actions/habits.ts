'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { PLAN_LIMITS } from '@/config/plans';
import { isWithinBackfillWindow, todayInTz } from '@/lib/habits/date';
import { requireAuth } from '@/lib/auth/require-auth';
import { requireActiveSubscription } from '@/lib/stripe/entitlement';
import { createClient } from '@/lib/supabase/server';
import { toFieldErrors } from '@/lib/validation';
import {
  habitInputSchema,
  logInputSchema,
  reorderHabitsSchema,
  type HabitInput,
  type LogInput,
  type ReorderHabitsInput,
} from '@/server/validators/habits.schema';
import type { ActionResult } from '@/types';

const habitIdSchema = z.string().uuid();

/**
 * Habit CRUD + log toggle (FEATURE-SPEC §6.2). Every action: zod → auth →
 * (ownership enforced by RLS, since habits/habit_logs policies are
 * owner-only) → mutate → `revalidatePath` with the `[locale]` segment
 * (pitfall #8). `user_id` is never accepted from the client — always read
 * from the server-side session.
 */

export async function createHabit(input: HabitInput): Promise<ActionResult<{ id: string }>> {
  const subscription = await requireActiveSubscription();

  const parsed = habitInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'validation', fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = createClient();
  const { count } = await supabase
    .from('habits')
    .select('*', { count: 'exact', head: true })
    .is('archived_at', null);

  const limit = PLAN_LIMITS[subscription.interval].maxHabits;
  if ((count ?? 0) >= limit) {
    return { success: false, error: 'limitReached' };
  }

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: subscription.user_id,
      name: parsed.data.name,
      icon: parsed.data.icon,
      color: parsed.data.color,
      frequency: parsed.data.frequency,
      target_per_day: parsed.data.targetPerDay,
      days_per_week: parsed.data.daysPerWeek,
    })
    .select('id')
    .single();
  if (error || !data) {
    return { success: false, error: 'createFailed' };
  }

  revalidatePath('/[locale]/dashboard', 'page');
  revalidatePath('/[locale]/dashboard/habits', 'page');
  return { success: true, data: { id: data.id } };
}

export async function updateHabit(id: string, input: HabitInput): Promise<ActionResult> {
  await requireAuth();

  const parsedId = habitIdSchema.safeParse(id);
  const parsed = habitInputSchema.safeParse(input);
  if (!parsedId.success || !parsed.success) {
    return {
      success: false,
      error: 'validation',
      fieldErrors: parsed.success ? undefined : toFieldErrors(parsed.error),
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('habits')
    .update({
      name: parsed.data.name,
      icon: parsed.data.icon,
      color: parsed.data.color,
      frequency: parsed.data.frequency,
      target_per_day: parsed.data.targetPerDay,
      days_per_week: parsed.data.daysPerWeek,
    })
    .eq('id', parsedId.data)
    .select('id')
    .maybeSingle();
  if (error || !data) {
    return { success: false, error: 'notFound' };
  }

  revalidatePath('/[locale]/dashboard/habits', 'page');
  revalidatePath('/[locale]/dashboard', 'page');
  return { success: true, data: undefined };
}

export async function archiveHabit(id: string, archived: boolean): Promise<ActionResult> {
  await requireAuth();

  const parsedId = habitIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { success: false, error: 'validation' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('habits')
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', parsedId.data)
    .select('id')
    .maybeSingle();
  if (error || !data) {
    return { success: false, error: 'notFound' };
  }

  revalidatePath('/[locale]/dashboard/habits', 'page');
  revalidatePath('/[locale]/dashboard', 'page');
  return { success: true, data: undefined };
}

export async function deleteHabit(id: string): Promise<ActionResult> {
  await requireAuth();

  const parsedId = habitIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { success: false, error: 'validation' };
  }

  const supabase = createClient();
  const { error, count } = await supabase
    .from('habits')
    .delete({ count: 'exact' })
    .eq('id', parsedId.data);
  if (error || !count) {
    return { success: false, error: 'notFound' };
  }

  revalidatePath('/[locale]/dashboard/habits', 'page');
  revalidatePath('/[locale]/dashboard', 'page');
  return { success: true, data: undefined };
}

/** Batch reorder via a single upsert (never a loop of per-row updates). */
export async function reorderHabits(input: ReorderHabitsInput): Promise<ActionResult> {
  await requireAuth();

  const parsed = reorderHabitsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'validation', fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = createClient();
  const { data: habits, error: fetchError } = await supabase
    .from('habits')
    .select('*')
    .in('id', parsed.data.ids);
  if (fetchError || !habits || habits.length !== parsed.data.ids.length) {
    return { success: false, error: 'reorderFailed' };
  }

  const byId = new Map(habits.map((h) => [h.id, h]));
  const rows = parsed.data.ids.map((id, index) => ({ ...byId.get(id)!, sort_order: index }));

  const { error } = await supabase.from('habits').upsert(rows);
  if (error) {
    return { success: false, error: 'reorderFailed' };
  }

  revalidatePath('/[locale]/dashboard/habits', 'page');
  return { success: true, data: undefined };
}

/** `count = 0` deletes the log; `count > 0` upserts it (pitfall #2: rapid re-clicks). */
export async function toggleHabitLog(input: LogInput): Promise<ActionResult<{ count: number }>> {
  const user = await requireAuth();

  const parsed = logInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'validation', fieldErrors: toFieldErrors(parsed.error) };
  }
  const { habitId, date, count, note } = parsed.data;

  const today = todayInTz(user.timezone);
  if (!isWithinBackfillWindow(date, today, 7)) {
    return { success: false, error: 'dateOutOfRange' };
  }

  const supabase = createClient();

  if (count === 0) {
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('logged_date', date);
    if (error) return { success: false, error: 'toggleFailed' };
    revalidatePath('/[locale]/dashboard', 'page');
    return { success: true, data: { count: 0 } };
  }

  const { error } = await supabase
    .from('habit_logs')
    .upsert(
      { habit_id: habitId, user_id: user.id, logged_date: date, count, note },
      { onConflict: 'habit_id,logged_date' },
    );
  if (error) {
    return { success: false, error: 'toggleFailed' };
  }

  revalidatePath('/[locale]/dashboard', 'page');
  return { success: true, data: { count } };
}
