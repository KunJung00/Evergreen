import { setRequestLocale } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

type Props = { params: Promise<{ locale: string }> };

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <ForgotPasswordForm />;
}
