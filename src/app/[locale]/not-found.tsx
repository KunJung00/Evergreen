import { FileQuestion } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export default async function LocaleNotFound() {
  const t = await getTranslations('errors.notFound');

  return (
    <Container className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <FileQuestion className="size-10 text-muted-foreground" />
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <Button asChild>
        <Link href="/">{t('backHome')}</Link>
      </Button>
    </Container>
  );
}
