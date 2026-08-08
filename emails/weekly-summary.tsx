import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export type WeeklySummaryEmailProps = {
  name: string;
  locale: 'th' | 'en';
  weekLabel: string;
  longestStreak: number;
  habitSummaries: { name: string; percent: number }[];
  siteUrl: string;
};

const COPY = {
  th: {
    preview: 'สรุปสัปดาห์ที่ผ่านมาของคุณ',
    heading: (name: string) => `สวัสดี ${name}`,
    intro: (week: string) => `นี่คือสรุปผลสัปดาห์ ${week} ของคุณ`,
    streak: (n: number) => `streak ที่ยาวที่สุดตอนนี้: ${n} วัน`,
    cta: 'ดูรายละเอียดในเว็บ',
  },
  en: {
    preview: 'Your habit summary for last week',
    heading: (name: string) => `Hi ${name}`,
    intro: (week: string) => `Here's your summary for ${week}`,
    streak: (n: number) => `Current longest streak: ${n} days`,
    cta: 'Open dashboard',
  },
} as const;

/** Weekly summary email (FEATURE-SPEC §9), sent Monday 08:00 in the user's timezone. */
export default function WeeklySummaryEmail({
  name,
  locale,
  weekLabel,
  longestStreak,
  habitSummaries,
  siteUrl,
}: WeeklySummaryEmailProps) {
  const t = COPY[locale];

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f6f6f6', padding: '24px 0' }}>
        <Container
          style={{
            backgroundColor: '#ffffff',
            padding: '32px',
            borderRadius: '8px',
            maxWidth: '480px',
          }}
        >
          <Heading as="h2">{t.heading(name)}</Heading>
          <Text>{t.intro(weekLabel)}</Text>
          <Text style={{ fontWeight: 600 }}>{t.streak(longestStreak)}</Text>
          <Section>
            {habitSummaries.map((habit) => (
              <Text key={habit.name} style={{ margin: '4px 0' }}>
                {habit.name}: {habit.percent}%
              </Text>
            ))}
          </Section>
          <Button
            href={siteUrl}
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '6px',
              display: 'inline-block',
              marginTop: '16px',
            }}
          >
            {t.cta}
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
