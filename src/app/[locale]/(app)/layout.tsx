import type { ReactNode } from 'react';
import { Leaf, Shield } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { Container } from '@/components/layout/container';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth/get-session';

// Authenticated pages read the session cookie per-request — never prerender them.
export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const t = await getTranslations('nav');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Leaf className="text-primary" />
            <span>{siteConfig.name}</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {user?.role === 'admin' ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin">
                  <Shield className="size-4" />
                  {t('admin')}
                </Link>
              </Button>
            ) : null}
            <LocaleSwitcher />
            <ThemeToggle />
            <SignOutButton />
          </div>
        </Container>
      </header>
      <main className="flex-1">
        <Container className="py-8">{children}</Container>
      </main>
    </div>
  );
}
