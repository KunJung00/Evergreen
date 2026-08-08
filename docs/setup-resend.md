# Setup: Resend

Transactional email is sent via [Resend](https://resend.com) with
[react-email](https://react.email) templates.

> ⚠️ Only the **weekly-summary** template is implemented this round. The other
> template emails (welcome, verify-email, reset-password, subscription events,
> payment-failed) are Phase 7 work — see [template-gaps.md](./template-gaps.md).

## 1. Get an API key

1. Create a Resend account and an API key.
2. Add it to your env:
   ```bash
   RESEND_API_KEY="re_..."
   EMAIL_FROM="Acme <noreply@acme.com>"
   ```

## 2. Verify a sending domain

For production, verify your domain in Resend (adds SPF/DKIM DNS records) so mail isn't
marked as spam. `EMAIL_FROM` must use the verified domain. For local testing you can send
to your own address with Resend's onboarding domain.

## 3. How sending works

- `src/lib/email/send.tsx` — `sendEmail({ to, template, locale, data })` wrapper.
- `emails/*` — react-email templates (bilingual via the `locale` arg).
- The weekly summary is triggered by `GET /api/cron/weekly-summary`, which emails users whose
  local time is Monday 08:00. It is guarded by `CRON_SECRET`. The Vercel cron is **disabled by
  default** (`vercel.json` is `{}`) because it needs an hourly schedule that the Hobby plan
  doesn't allow — see [deployment.md](./deployment.md) to enable it on Pro or trigger it manually.

## 4. Preview templates

react-email ships a local preview server. With the CLI installed you can render templates
from the `emails/` directory in both `th` and `en` before shipping.
