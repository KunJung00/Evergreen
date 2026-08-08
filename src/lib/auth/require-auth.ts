import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';

import { getCurrentUser } from '@/lib/auth/get-session';
import { routing } from '@/i18n/routing';
import type { Profile } from '@/types';

/** Return the current profile or redirect to /login (BUILD-SPEC §7). */
export async function requireAuth(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) {
    const locale = await getLocale();
    const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
    redirect(`${prefix}/login`);
  }
  return user;
}
