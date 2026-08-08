import { setRequestLocale } from 'next-intl/server';

import type { Locale } from '@/i18n/routing';

import { ResetPasswordForm } from '@/components/auth/reset-password-form';

type Props = { params: Promise<{ locale: string }> };

export default async function ResetPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <ResetPasswordForm />;
}
