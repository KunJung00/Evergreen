import 'server-only';

import { env } from '@/env';
import { resend } from '@/lib/email/resend';
import WeeklySummaryEmail, { type WeeklySummaryEmailProps } from '../../../emails/weekly-summary';

/**
 * `sendEmail()` wrapper (BUILD-SPEC §7). Only `weeklySummary` exists this
 * round — the other 5 template emails (welcome, verify-email, reset-password,
 * subscription-confirmed, payment-failed, subscription-canceled) are template
 * Phase 7 work that wasn't built (see docs/template-gaps.md).
 */
export type EmailTemplate = 'weeklySummary';

export async function sendEmail(input: {
  to: string;
  template: EmailTemplate;
  locale: 'th' | 'en';
  data: Omit<WeeklySummaryEmailProps, 'locale'>;
}): Promise<void> {
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.locale === 'th' ? 'สรุปนิสัยประจำสัปดาห์ของคุณ' : 'Your weekly habit summary',
    react: <WeeklySummaryEmail locale={input.locale} {...input.data} />,
  });
}
