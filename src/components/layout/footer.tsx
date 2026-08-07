import Link from 'next/link';

import { Container } from '@/components/layout/container';
import { siteConfig } from '@/config/site';

// NOTE: labels hardcoded pending i18n (Phase 3).
export function Footer() {
  return (
    <footer className="border-t py-8">
      <Container className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
        <nav className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/refund-policy" className="hover:text-foreground">
            Refund
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
