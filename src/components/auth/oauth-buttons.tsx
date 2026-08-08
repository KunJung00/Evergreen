'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { env } from '@/env';
import { createClient } from '@/lib/supabase/client';

/** Google OAuth entry point (BUILD-SPEC §6 checklist). */
export function OAuthButtons() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [isPending, setIsPending] = useState(false);

  async function signInWithGoogle() {
    setIsPending(true);
    const supabase = createClient();
    const redirectTo = new URL('/auth/callback', env.NEXT_PUBLIC_SITE_URL);
    redirectTo.searchParams.set('next', locale === 'th' ? '/dashboard' : `/${locale}/dashboard`);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo.toString() },
    });
    if (error) setIsPending(false);
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={isPending}
      onClick={signInWithGoogle}
    >
      {t('oauth.google')}
    </Button>
  );
}
