import { Leaf } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Container } from '@/components/layout/container';
import { LocaleSwitcher } from '@/components/shared/locale-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { Link } from '@/i18n/navigation';

export function Navbar() {
  const t = useTranslations('nav');
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Leaf className="text-primary" />
          <span>{siteConfig.name}</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pricing">{t('pricing')}</Link>
          </Button>
          <LocaleSwitcher />
          <ThemeToggle />
          <Button size="sm" asChild>
            <Link href="/login">{t('signIn')}</Link>
          </Button>
        </nav>
      </Container>
    </header>
  );
}
