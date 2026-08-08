# Contributing

Thanks for contributing! This template enforces a few hard rules — please read
[BUILD-SPEC.md](./BUILD-SPEC.md) (RULES R1–R10) and [CLAUDE.md](./CLAUDE.md) before you start.

## Getting set up

See the [README](./README.md#quick-start-5-minutes) quick start. In short:

```bash
pnpm install
cp .env.example .env.local   # fill in values
supabase start && pnpm db:reset && pnpm db:types
pnpm dev
```

## Ground rules

- **R2** RSC by default; `'use client'` only for hooks/handlers.
- **R3** Mutations via Server Actions only (except the Stripe webhook route).
- **R4** All input validated with zod before touching the DB.
- **R6/R9** RLS on every table; schema changes only via `supabase/migrations/`.
- **R7** No `any`. **R8** No hardcoded user-facing strings — use next-intl.
- Do **not** edit locked structural files (FEATURE-SPEC §0): `src/middleware.ts`,
  `src/lib/supabase/*`, `src/lib/stripe/*`, `src/app/auth/*`, `src/app/api/stripe/webhook/*`.
  If a change genuinely needs one, stop and record it in [docs/template-gaps.md](./docs/template-gaps.md).

## Conventions

- Files/folders `kebab-case`; components `PascalCase` named exports.
- `*.actions.ts` (Server Actions), `*.queries.ts`, `*.schema.ts`. DB is `snake_case`.
- Keep `messages/th.json` and `messages/en.json` in **key parity** (a test enforces it).

## Commits & PRs

- **Conventional commits** (`feat:`, `fix:`, `chore:` …) — enforced by commitlint.
- Branch off `main`; open a PR using the template.
- Every PR must pass the CI gate locally first:
  ```bash
  pnpm typecheck && pnpm lint && pnpm test && pnpm build
  ```
- Keep PRs focused; update docs when behavior changes.
