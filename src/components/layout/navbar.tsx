import Link from 'next/link';
import { Leaf } from 'lucide-react';

import { Container } from '@/components/layout/container';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';

// NOTE: nav labels are hardcoded pending i18n (Phase 3). Replaced with message keys then (R8).
export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Leaf className="text-primary" />
          <span>{siteConfig.name}</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pricing">Pricing</Link>
          </Button>
          <ThemeToggle />
          <Button size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </nav>
      </Container>
    </header>
  );
}
