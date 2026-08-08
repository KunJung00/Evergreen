import type { ReactNode } from 'react';
import { Leaf, Shield } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AdminNav } from '@/components/admin/admin-nav';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { Container } from '@/components/layout/container';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { siteConfig } from '@/config/site';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { requireAdmin } from '@/lib/auth/require-admin';

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

// Admin pages read the session per-request and must never be prerendered.
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  // Authoritative guard: non-admins get a 404 (BUILD-SPEC §11 Phase 5).
  await requireAdmin();
  const t = await getTranslations('admin');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Leaf className="text-primary" />
              <span>{siteConfig.name}</span>
            </Link>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              <Shield className="size-3" />
              {t('badge')}
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
            <SignOutButton />
          </div>
        </Container>
      </header>
      <main className="flex-1">
        <Container className="space-y-6 py-8">
          <AdminNav />
          {children}
        </Container>
      </main>
    </div>
  );
}
