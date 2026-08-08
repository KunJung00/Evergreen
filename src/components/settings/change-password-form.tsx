'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { SubmitButton } from '@/components/shared/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePassword } from '@/server/actions/profile.actions';
import { changePasswordSchema, type ChangePasswordInput } from '@/server/validators/profile.schema';

export function ChangePasswordForm() {
  const t = useTranslations('settings.security');
  const tErrors = useTranslations('settings.errors');
  const te = (code: string) => tErrors(code as never);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: ChangePasswordInput) {
    setFormError(null);
    setSuccess(false);
    const result = await changePassword(values);
    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          form.setError(field as keyof ChangePasswordInput, { message: messages[0] });
        }
        return;
      }
      setFormError(result.error);
      return;
    }
    form.reset({ password: '', confirmPassword: '' });
    setSuccess(true);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>
      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {te(formError)}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">{t('newPasswordLabel')}</Label>
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
        <Label htmlFor="confirmPassword">{t('confirmLabel')}</Label>
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

      <div className="flex items-center gap-3">
        <SubmitButton type="submit" isPending={isSubmitting}>
          {t('submit')}
        </SubmitButton>
        {success ? <span className="text-sm text-muted-foreground">{t('success')}</span> : null}
      </div>
    </form>
  );
}
