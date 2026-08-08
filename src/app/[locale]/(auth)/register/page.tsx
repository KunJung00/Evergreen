import { setRequestLocale } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';

import { RegisterForm } from '@/components/auth/register-form';

type Props = { params: Promise<{ locale: string }> };

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <RegisterForm />;
}
