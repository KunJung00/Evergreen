'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';

import { env } from '@/env';
import { routing } from '@/i18n/routing';
import { rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { toFieldErrors } from '@/lib/validation';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from '@/server/validators/auth.schema';
import type { ActionResult } from '@/types';

/** Best-effort client IP for rate-limit keys. */
function clientIp(): string {
  const forwarded = headers().get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'anonymous';
}

function callbackUrl(next?: string): string {
  const url = new URL('/auth/callback', env.NEXT_PUBLIC_SITE_URL);
  if (next) url.searchParams.set('next', next);
  return url.toString();
}

export async function signIn(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'validation', fieldErrors: toFieldErrors(parsed.error) };
  }

  const limit = await rateLimit(`signin:${clientIp()}`, { limit: 5, windowMs: 60_000 });
  if (!limit.success) return { success: false, error: 'rateLimited' };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { success: false, error: 'invalidCredentials' };

  revalidatePath('/', 'layout');
  return { success: true, data: undefined };
}

export async function signUp(
  input: RegisterInput,
): Promise<ActionResult<{ needsVerification: boolean }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'validation', fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: callbackUrl(),
    },
  });
  if (error) return { success: false, error: 'signUpFailed' };

  // No session means email confirmation is required before login.
  return { success: true, data: { needsVerification: !data.session } };
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'validation', fieldErrors: toFieldErrors(parsed.error) };
  }

  const limit = await rateLimit(`reset:${clientIp()}`, { limit: 3, windowMs: 60_000 });
  if (!limit.success) return { success: false, error: 'rateLimited' };

  const supabase = createClient();
  // Ignore the result to avoid leaking whether the account exists.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl('/reset-password'),
  });

  return { success: true, data: undefined };
}

export async function updatePassword(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'validation', fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { success: false, error: 'resetFailed' };

  revalidatePath('/', 'layout');
  return { success: true, data: undefined };
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');

  const locale = await getLocale();
  redirect(locale === routing.defaultLocale ? '/' : `/${locale}`);
}
