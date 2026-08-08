'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from '@/i18n/navigation';
import { updatePassword } from '@/server/actions/auth.actions';
import { resetPasswordSchema, type ResetPasswordInput } from '@/server/validators/auth.schema';

export function ResetPasswordForm() {
  const t = useTranslations('auth');
  const te = (code: string) => t(`errors.${code}` as never);
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: ResetPasswordInput) {
    setFormError(null);
    const result = await updatePassword(values);
    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          form.setError(field as keyof ResetPasswordInput, { message: messages[0] });
        }
        return;
      }
      setFormError(result.error);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('resetPassword.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('resetPassword.subtitle')}</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {te(formError)}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">{t('resetPassword.passwordLabel')}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...form.register('password')}
          />
          {errors.password?.message && (
            <p className="text-sm text-destructive">{te(errors.password.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('resetPassword.confirmLabel')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...form.register('confirmPassword')}
          />
          {errors.confirmPassword?.message && (
            <p className="text-sm text-destructive">{te(errors.confirmPassword.message)}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {t('resetPassword.submit')}
        </Button>
      </form>
    </div>
  );
}
