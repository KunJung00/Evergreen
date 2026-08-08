import { z } from 'zod';

/**
 * Auth input schemas (R4). Validation messages are i18n keys resolved under
 * `auth.errors.*` on the client (R8) — never user-facing sentences.
 */

const email = z.string().email({ message: 'invalidEmail' });
const password = z
  .string()
  .min(8, { message: 'passwordTooShort' })
  .max(72, { message: 'passwordTooLong' });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { message: 'passwordRequired' }),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(1, { message: 'nameRequired' }).max(120, { message: 'nameTooLong' }),
  email,
  password,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, { message: 'passwordRequired' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'passwordsMustMatch',
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
