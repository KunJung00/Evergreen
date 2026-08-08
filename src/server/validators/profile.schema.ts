import { z } from 'zod';

/**
 * Profile/account input schemas (R4). Validation messages are i18n keys
 * resolved under `settings.errors.*` on the client (R8).
 */

export const updateProfileSchema = z.object({
  fullName: z.string().trim().max(120, { message: 'nameTooLong' }).nullable(),
  avatarUrl: z.string().trim().max(2048, { message: 'invalidUrl' }).nullable(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

const password = z
  .string()
  .min(8, { message: 'passwordTooShort' })
  .max(72, { message: 'passwordTooLong' });

export const preferencesSchema = z.object({
  timezone: z.string().min(1, { message: 'invalidTimezone' }),
  weekStart: z.union([z.literal(0), z.literal(1)]),
  weeklyEmailOptIn: z.boolean(),
});
export type PreferencesInput = z.infer<typeof preferencesSchema>;

export const changePasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, { message: 'passwordRequired' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'passwordsMustMatch',
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
