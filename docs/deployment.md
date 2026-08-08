# Deployment

Target platform: **Vercel** + **Supabase** (hosted Postgres/Auth).

## 1. Prepare services

Follow the service guides first:

- [setup-supabase.md](./setup-supabase.md)
- [setup-stripe.md](./setup-stripe.md)
- [setup-resend.md](./setup-resend.md)

## 2. Environment variables (3 sets)

Configure the same keys as [`.env.example`](../.env.example) in each environment:

| Environment | Where | Notes |
| --- | --- | --- |
| **local** | `.env.local` | Local Supabase + Stripe test keys |
| **preview** | Vercel → Preview | Per-PR deploys; use test/staging services |
| **production** | Vercel → Production | Live keys, production Supabase project |

Never expose secrets via `NEXT_PUBLIC_`. `SUPABASE_SERVICE_ROLE_KEY`,
`STRIPE_SECRET_KEY`, `RESEND_API_KEY`, and `CRON_SECRET` are server-only.

## 3. Database migrations

Migrations live in `supabase/migrations/` (R9 — the only place schema changes happen).

- **Locally:** `pnpm db:reset` (reset + reapply) or `pnpm db:push` (to a linked project).
- **In CI:** `.github/workflows/migrate.yml` runs `supabase db push` on merges to `main`
  that touch `supabase/migrations/**`. Requires repo secrets `SUPABASE_ACCESS_TOKEN`,
  `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`.

## 4. Deploy to Vercel

1. Import the repo in Vercel; framework preset **Next.js** is auto-detected.
2. Add the env vars for Preview + Production.
3. Every PR gets a preview deploy; merging to `main` deploys production.
4. **Cron is currently disabled** (`vercel.json` is `{}`). The Vercel **Hobby** plan only
   allows once-daily crons, but `/api/cron/weekly-summary` is designed to run **hourly** so it
   can email each user at Monday 08:00 in their own timezone. To enable it on a **Pro** plan,
   add back:
   ```json
   { "crons": [{ "path": "/api/cron/weekly-summary", "schedule": "0 * * * *" }] }
   ```
   On Hobby you can instead trigger it manually (it's guarded by `CRON_SECRET`):
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/weekly-summary
   ```

## 5. Stripe webhook

Point a Stripe webhook endpoint at `https://<your-domain>/api/stripe/webhook` and set
`STRIPE_WEBHOOK_SECRET`. Locally use `pnpm stripe:listen`.
(Note: billing is currently stubbed — see [template-gaps.md](./template-gaps.md).)

## 6. CI gate

`.github/workflows/pr.yml` runs `typecheck → lint → test → build` on every PR.
Enable **branch protection** on `main` with these as required checks.

## Rollback

- **App:** promote a previous Vercel deployment (instant).
- **Database:** migrations are forward-only; ship a new corrective migration rather than
  editing history. Take a Supabase backup/point-in-time snapshot before risky migrations.
