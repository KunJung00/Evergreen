'use client';

import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

/** Shared body for every route group's `error.tsx` boundary. */
export function ErrorState({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors.serverError');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <Button onClick={reset}>{t('retry')}</Button>
    </div>
  );
}
