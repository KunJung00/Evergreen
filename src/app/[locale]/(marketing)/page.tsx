import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <LandingContent />;
}

function LandingContent() {
  const t = useTranslations('marketing');
  const featureKeys = ['habits', 'billing', 'i18n'] as const;

  return (
    <>
      <section className="py-24 sm:py-32">
        <Container className="flex flex-col items-center text-center">
          <span className="mb-4 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            {t('hero.badge')}
          </span>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
            {t('hero.title')}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">{t('hero.subtitle')}</p>
          <div className="mt-8 flex gap-4">
            <Button size="lg" asChild>
              <Link href="/register">{t('hero.getStarted')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">{t('hero.viewPricing')}</Link>
            </Button>
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container className="grid gap-6 sm:grid-cols-3">
          {featureKeys.map((key) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="text-xl">{t(`features.${key}.title`)}</CardTitle>
                <CardDescription>{t(`features.${key}.desc`)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </Container>
      </section>
    </>
  );
}
