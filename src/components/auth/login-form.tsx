'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useRouter } from '@/i18n/navigation';
import { signIn } from '@/server/actions/auth.actions';
import { loginSchema, type LoginInput } from '@/server/validators/auth.schema';

export function LoginForm() {
  const t = useTranslations('auth');
  const te = (code: string) => t(`errors.${code}` as never);
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    const result = await signIn(values);
    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          form.setError(field as keyof LoginInput, { message: messages[0] });
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
        <h1 className="text-2xl font-semibold tracking-tight">{t('login.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('login.subtitle')}</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {te(formError)}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">{t('login.emailLabel')}</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          {errors.email?.message && (
            <p className="text-sm text-destructive">{te(errors.email.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('login.passwordLabel')}</Label>
            <Link href="/forgot-password" className="text-sm text-muted-foreground hover:underline">
              {t('login.forgotPassword')}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...form.register('password')}
          />
          {errors.password?.message && (
            <p className="text-sm text-destructive">{te(errors.password.message)}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {t('login.submit')}
        </Button>
      </form>

      <OAuthButtons />

      <p className="text-center text-sm text-muted-foreground">
        {t('login.noAccount')}{' '}
        <Link href="/register" className="font-medium text-foreground hover:underline">
          {t('login.signUpLink')}
        </Link>
      </p>
    </div>
  );
}
