# Architecture

## Overview

Next.js 14 App Router with React Server Components by default. Business logic lives
on the server; the client is used only for interactivity. See [BUILD-SPEC.md](../BUILD-SPEC.md)
for the authoritative rules (R1–R10).

## Layers

```
Browser ──▶ Middleware (i18n + auth/admin guard) ──▶ RSC pages / Server Actions
                                                          │
                                    ┌─────────────────────┼──────────────────────┐
                                    ▼                     ▼                      ▼
                             Supabase (RLS)          Stripe API             Resend
```

- **Routing & i18n** — `src/middleware.ts` runs next-intl locale routing (`th` default,
  `/en` prefixed) and the admin guard. It is a locked structural file.
- **Rendering** — RSC by default (R2). `'use client'` only for hooks/handlers.
- **Mutations** — Server Actions only (R3), except the Stripe webhook route handler.
  Actions return `ActionResult<T>` (`src/types/index.ts`) and never throw to the client.
- **Validation** — every input passes zod before touching the DB (R4). Schemas live in
  `*.schema.ts` / `src/server/validators/`.
- **Data access** — Supabase clients in `src/lib/supabase/` (`server`, `client`, `admin`).
  The service-role key is confined to `admin.ts` (`import 'server-only'`, R5).

## Directory map

| Path | Purpose |
| --- | --- |
| `src/app/[locale]/` | Localized routes: `(marketing)`, `(auth)`, `(app)`, `(admin)` groups |
| `src/app/api/` | Route handlers: `stripe/webhook`, `cron`, `health`, `og` |
| `src/components/` | UI — `ui/` (shadcn), feature folders, `shared/`, `layout/` |
| `src/lib/` | Cross-cutting: `supabase/`, `stripe/`, `email/`, `auth/`, `logger.ts` |
| `src/server/` | `actions/`, `queries/`, `validators/` |
| `src/config/` | `site.ts`, `plans.ts` |
| `src/i18n/` | next-intl routing/request/navigation |
| `messages/` | `th.json`, `en.json` (key parity enforced by test) |
| `supabase/migrations/` | The only place schema changes happen (R9) |

## Security model

- **RLS on every table**, all four operations (R6). `is_admin()` is a `security definer`
  function to avoid recursive policies on `profiles`.
- **Security headers** (CSP, HSTS, X-Frame-Options, …) set in `next.config.mjs`.
- **Rate limiting** via `src/lib/rate-limit.ts` (in-memory; swap for Upstash Redis in prod).
- **Secrets** never cross the `NEXT_PUBLIC_` boundary; validated in `src/env.ts`.

## Observability

- **Sentry** (`sentry.*.config.ts` + `src/instrumentation.ts`) — no-ops without a DSN.
- **Structured logging** — `src/lib/logger.ts` emits JSON lines and forwards to Sentry.
- **Health check** — `GET /api/health` pings the DB.
- **Analytics** — Vercel Analytics + Speed Insights in the root layout.
