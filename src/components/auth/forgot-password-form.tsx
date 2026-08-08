'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/i18n/navigation';
import { requestPasswordReset } from '@/server/actions/auth.actions';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/server/validators/auth.schema';

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const te = (code: string) => t(`errors.${code}` as never);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: ForgotPasswordInput) {
    setFormError(null);
    const result = await requestPasswordReset(values);
    if (!result.success) {
      if (result.fieldErrors?.email) {
        form.setError('email', { message: result.fieldErrors.email[0] });
        return;
      }
      setFormError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('forgotPassword.sentTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('forgotPassword.sent')}</p>
        <Link href="/login" className="text-sm font-medium hover:underline">
          {t('forgotPassword.backToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('forgotPassword.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('forgotPassword.subtitle')}</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {te(formError)}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">{t('forgotPassword.emailLabel')}</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          {errors.email?.message && (
            <p className="text-sm text-destructive">{te(errors.email.message)}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {t('forgotPassword.submit')}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground hover:underline">
          {t('forgotPassword.backToLogin')}
        </Link>
      </p>
    </div>
  );
}
