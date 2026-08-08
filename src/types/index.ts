import type { Tables } from '@/types/database.types';

/**
 * Shared Server Action result type (BUILD-SPEC §2 CONVENTIONS).
 * Server Actions return this shape instead of throwing to the client.
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/** Domain row types (BUILD-SPEC §7 module contracts). */
export type Profile = Tables<'profiles'>;
export type Subscription = Tables<'subscriptions'>;
export type AuditLog = Tables<'audit_logs'>;
export type Habit = Tables<'habits'>;
export type HabitLog = Tables<'habit_logs'>;
