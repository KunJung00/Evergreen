# Evergreen — SaaS Starter Template

A production-shaped Next.js 14 SaaS starter (App Router, TypeScript strict) with a
**Habit Tracker** feature built on top as a stress-test. Batteries included:
Supabase auth + RLS, Stripe billing, Resend email, next-intl (th/en), roles & admin,
and observability.

- **Stack:** Next.js 14 · TypeScript (strict) · Tailwind + shadcn/ui · Supabase · Stripe · Resend · next-intl · Sentry · Vitest + Playwright
- **Rules & conventions:** see [BUILD-SPEC.md](./BUILD-SPEC.md) and [CLAUDE.md](./CLAUDE.md)
- **Docs:** [`docs/`](./docs) — architecture, deployment, and service setup guides

> ⚠️ Some template phases are intentionally stubbed (see [docs/template-gaps.md](./docs/template-gaps.md)):
> Stripe billing is a UI shell with a stubbed entitlement, and only the weekly-summary
> email template exists. The app runs end-to-end for the Habit Tracker feature without them.

## Quick start (≈5 minutes)

**Prerequisites:** Node 20+ (`.nvmrc`), [pnpm](https://pnpm.io) 9, and the
[Supabase CLI](https://supabase.com/docs/guides/cli) (for the local database).

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Fill in the values — see "Environment variables" below and docs/setup-*.md

# 3. Start the local database + apply migrations
supabase start          # boots local Postgres/Auth (Docker required)
pnpm db:reset           # applies supabase/migrations/* and seeds
pnpm db:types           # generate src/types/database.types.ts

# 4. Run the app
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) (Thai) or
[http://localhost:3000/en](http://localhost:3000/en) (English).

## Environment variables

`src/env.ts` validates these at boot (via `@t3-oss/env-nextjs`). A missing required
var fails the build with a clear message. Mirror of the full list lives in
[`.env.example`](./.env.example).

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Absolute URLs, OG images, redirects |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-only (`src/lib/supabase/admin.ts`) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | ✅ | Billing (currently stubbed) |
| `NEXT_PUBLIC_STRIPE_PRICE_MONTHLY` / `_YEARLY` | ✅ | Price IDs |
| `RESEND_API_KEY` / `EMAIL_FROM` | ✅ | Transactional email |
| `CRON_SECRET` | ✅ | Guards `/api/cron/*` |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | ⬜ | Distributed rate limiting |
| `NEXT_PUBLIC_SENTRY_DSN` | ⬜ | Error tracking (no-op if unset) |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | ⬜ | Build-time source-map upload |

Set `SKIP_ENV_VALIDATION=1` to run structural builds without a full env (used in CI).

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` / `pnpm format` | ESLint / Prettier |
| `pnpm test` / `pnpm test:e2e` | Vitest unit / Playwright E2E |
| `pnpm db:reset` | Reset local DB + reapply migrations |
| `pnpm db:push` | Push migrations to the linked project |
| `pnpm db:types` | Regenerate `database.types.ts` |
| `pnpm stripe:listen` | Forward Stripe webhooks to localhost |
| `pnpm rename-project <NewName>` | Rebrand the template (see below) |

## Renaming the template

```bash
pnpm rename-project "Acme"
```

Replaces the `Evergreen` product name across config, messages and docs. Review the
diff before committing.

## Verify

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

This is the same gate CI runs (`.github/workflows/pr.yml`). See
[docs/deployment.md](./docs/deployment.md) to ship to Vercel.
