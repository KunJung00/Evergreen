import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/layout/container';
import { JsonLd, organizationJsonLd, websiteJsonLd } from '@/components/shared/json-ld';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <LandingContent />
    </>
  );
}

function LandingContent() {
  const t = useTranslations('marketing');
  const featureKeys = ['habits', 'billing', 'i18n'] as const;
  const statKeys = ['habitsTracked', 'successRate', 'activeUsers'] as const;
  const faqKeys = ['q1', 'q2', 'q3', 'q4'] as const;

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

      <section className="border-t bg-muted/30 py-20">
        <Container>
          <h2 className="text-center text-lg font-medium text-muted-foreground">
            {t('socialProof.title')}
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {statKeys.map((key) => (
              <div key={key} className="text-center">
                <p className="text-4xl font-bold tracking-tight">
                  {t(`socialProof.stats.${key}.value`)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`socialProof.stats.${key}.label`)}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container className="mx-auto max-w-2xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">{t('faq.title')}</h2>
          <div className="mt-10 space-y-4">
            {faqKeys.map((key) => (
              <details
                key={key}
                className="group rounded-lg border px-4 py-3 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="cursor-pointer list-none font-medium marker:content-none">
                  {t(`faq.items.${key}.question`)}
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{t(`faq.items.${key}.answer`)}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t py-24">
        <Container className="flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('cta.title')}</h2>
          <p className="mt-4 max-w-md text-muted-foreground">{t('cta.subtitle')}</p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/register">{t('cta.button')}</Link>
          </Button>
        </Container>
      </section>
    </>
  );
}
