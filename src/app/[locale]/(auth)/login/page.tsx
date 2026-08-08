import { setRequestLocale } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';

import { LoginForm } from '@/components/auth/login-form';

type Props = { params: Promise<{ locale: string }> };

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <LoginForm />;
}
