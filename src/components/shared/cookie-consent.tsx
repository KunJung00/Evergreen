'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

const CONSENT_KEY = 'cookie-consent';

/** Minimal PDPA-style cookie notice, remembered in localStorage. */
export function CookieConsent() {
  const t = useTranslations('cookieConsent');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(CONSENT_KEY) !== 'accepted');
  }, []);

  function accept() {
    window.localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          {t('message')}{' '}
          <Link href="/privacy" className="underline hover:text-foreground">
            {t('privacyLink')}
          </Link>
        </p>
        <Button size="sm" onClick={accept} className="shrink-0">
          {t('accept')}
        </Button>
      </div>
    </div>
  );
}
