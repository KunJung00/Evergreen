# CLAUDE.md — Agent guidance

This repo is a **SaaS Starter Template** (BUILD-SPEC) with a **Habit Tracker** feature
built on top of it as a template stress-test (FEATURE-SPEC).

## Read before writing code

1. [BUILD-SPEC.md](./BUILD-SPEC.md) — single source of truth for the template. RULES R1–R10 + CONVENTIONS.
2. [FEATURE-SPEC-habit-tracker.md](./FEATURE-SPEC-habit-tracker.md) — the feature spec (phases H1–H6).
   - Note: **R1 is waived** for the feature project (it *may* contain business logic).

> `CONTEXT.md` is referenced by the feature spec but does not exist yet — treat its
> absence as a known template gap (record decisions in `docs/template-gaps.md`).

## Hard rules (never violate)

- **R2** RSC by default; `'use client'` only for hooks/handlers.
- **R3** Mutations = Server Actions only (except the Stripe webhook route handler).
- **R4** All input passes zod validation before touching the DB.
- **R5** `SUPABASE_SERVICE_ROLE_KEY` only in `src/lib/supabase/admin.ts` (`import 'server-only'`).
- **R6** RLS on every table, all 4 operations.
- **R7** No `any`.
- **R8** No hardcoded user-facing strings — everything through next-intl.
- **R9** Schema changes only via `supabase/migrations/`.
- **R10** Every phase must pass `pnpm typecheck && pnpm lint && pnpm build` (feature also `pnpm test`).

## ⛔ Do NOT edit these structural files (FEATURE-SPEC §0)

`src/middleware.ts`, `src/lib/supabase/*`, `src/lib/stripe/*`, `src/app/auth/*`,
`src/app/api/stripe/webhook/*`

If a feature genuinely requires editing them → **stop, ask, and record the gap in
`docs/template-gaps.md`**. That gap report is the most valuable output of the test.

## Conventions

- Files/folders `kebab-case`; components `PascalCase` named exports.
- Server Actions: `*.actions.ts` (`'use server'`). Queries: `*.queries.ts`. Zod: `*.schema.ts`.
- DB `snake_case`. Imports use `@/*`.
- Server Actions return `ActionResult<T>` (`src/types/index.ts`) — do not throw to the client.
- Conventional commits (`feat:`, `fix:`, `chore:` …) — enforced by commitlint.

## Build order

Template PHASE 1 → 11 (BUILD-SPEC §11), then feature H1 → H6 (FEATURE-SPEC §11).
Do phases in order; pass each phase's Acceptance before moving on.

**Current state:** Phase 1 (Foundation) scaffolding in place — Next.js 14 + TS strict +
Tailwind + tooling (prettier, husky, commitlint, vitest, playwright) + folder skeleton.
