import { notFound } from 'next/navigation';

import { requireAuth } from '@/lib/auth/require-auth';
import type { Profile } from '@/types';

/** Return the current profile if admin, otherwise 404 (BUILD-SPEC §7). */
export async function requireAdmin(): Promise<Profile> {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    notFound();
  }
  return user;
}
