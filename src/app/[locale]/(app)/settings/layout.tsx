import type { ReactNode } from 'react';

import { SettingsNav } from '@/components/shared/settings-nav';
import { requireAuth } from '@/lib/auth/require-auth';

// Authenticated pages read the session cookie per-request — never prerender them.
export const dynamic = 'force-dynamic';

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  await requireAuth();

  return (
    <div className="space-y-6">
      <SettingsNav />
      {children}
    </div>
  );
}
