import { getFormatter, getTranslations } from 'next-intl/server';

import { Container } from '@/components/layout/container';

/**
 * Shared renderer for the 3 legal pages (terms/privacy/refund-policy). Each
 * page's messages namespace has the same shape: title, intro, sections.{key}.
 */
export async function LegalPage({
  namespace,
  sectionKeys,
}: {
  namespace: 'legal.terms' | 'legal.privacy' | 'legal.refundPolicy';
  sectionKeys: readonly string[];
}) {
  const t = await getTranslations(namespace);
  const tLegal = await getTranslations('legal');
  const format = await getFormatter();
  const updated = format.dateTime(new Date(), { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Container className="max-w-2xl py-16">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{tLegal('updated', { date: updated })}</p>
      <p className="mt-6 text-muted-foreground">{t('intro')}</p>

      <div className="mt-10 space-y-8">
        {sectionKeys.map((key) => (
          <section key={key}>
            <h2 className="text-xl font-semibold tracking-tight">
              {t(`sections.${key}.title` as never)}
            </h2>
            <p className="mt-2 text-muted-foreground">{t(`sections.${key}.body` as never)}</p>
          </section>
        ))}
      </div>
    </Container>
  );
}
