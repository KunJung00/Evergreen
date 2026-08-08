'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/i18n/navigation';
import { signUp } from '@/server/actions/auth.actions';
import { registerSchema, type RegisterInput } from '@/server/validators/auth.schema';

export function RegisterForm() {
  const t = useTranslations('auth');
  const te = (code: string) => t(`errors.${code}` as never);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    const result = await signUp(values);
    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          form.setError(field as keyof RegisterInput, { message: messages[0] });
        }
        return;
      }
      setFormError(result.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('register.verifyTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('register.verifyNotice')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('register.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('register.subtitle')}</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {te(formError)}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="fullName">{t('register.nameLabel')}</Label>
          <Input id="fullName" autoComplete="name" {...form.register('fullName')} />
          {errors.fullName?.message && (
            <p className="text-sm text-destructive">{te(errors.fullName.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t('register.emailLabel')}</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          {errors.email?.message && (
            <p className="text-sm text-destructive">{te(errors.email.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('register.passwordLabel')}</Label>
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {t('register.submit')}
        </Button>
      </form>

      <OAuthButtons />

      <p className="text-center text-sm text-muted-foreground">
        {t('register.haveAccount')}{' '}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          {t('register.signInLink')}
        </Link>
      </p>
    </div>
  );
}
