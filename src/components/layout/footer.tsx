import { useTranslations } from 'next-intl';

import { Container } from '@/components/layout/container';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('footer');
  return (
    <footer className="border-t py-8">
      <Container className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <p>{t('rights', { year: new Date().getFullYear() })}</p>
        <nav className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-foreground">
            {t('terms')}
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            {t('privacy')}
          </Link>
          <Link href="/refund-policy" className="hover:text-foreground">
            {t('refund')}
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
