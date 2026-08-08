import { z } from 'zod';

/**
 * Habit input schemas (R4, FEATURE-SPEC §6.1). Validation messages are i18n
 * keys resolved under `habits.errors.*` on the client (R8).
 */

export const HABIT_COLORS = [
  'emerald',
  'blue',
  'violet',
  'amber',
  'rose',
  'cyan',
  'lime',
  'slate',
] as const;
export type HabitColor = (typeof HABIT_COLORS)[number];

export const habitFrequencySchema = z.enum(['daily', 'weekly']);
export type HabitFrequency = z.infer<typeof habitFrequencySchema>;

export const habitInputSchema = z
  .object({
    name: z.string().trim().min(1, { message: 'nameRequired' }).max(60, { message: 'nameTooLong' }),
    icon: z.string().trim().min(1).max(8, { message: 'invalidIcon' }),
    color: z.enum(HABIT_COLORS),
    frequency: habitFrequencySchema,
    targetPerDay: z.number().int().min(1).max(20, { message: 'invalidTarget' }),
    daysPerWeek: z.number().int().min(1).max(7).nullable(),
  })
  .refine((v) => (v.frequency === 'weekly' ? v.daysPerWeek !== null : v.daysPerWeek === null), {
    path: ['daysPerWeek'],
    message: 'daysPerWeekRequired',
  });
export type HabitInput = z.infer<typeof habitInputSchema>;

export const logInputSchema = z.object({
  habitId: z.string().uuid({ message: 'invalidHabit' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'invalidDate' }),
  count: z.number().int().min(0).max(100, { message: 'invalidCount' }),
  note: z.string().max(280, { message: 'noteTooLong' }).optional(),
});
export type LogInput = z.infer<typeof logInputSchema>;

export const reorderHabitsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});
export type ReorderHabitsInput = z.infer<typeof reorderHabitsSchema>;
