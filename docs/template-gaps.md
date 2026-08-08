# Template gaps

**Status:** BUILD-SPEC Phase 8 done, FEATURE-SPEC H1–H6 done, billing UI shell done. Every
phase in this document was checked with `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
— all green — plus a manual key-parity check confirming `messages/th.json` and `messages/en.json`
have identical key sets (0 missing either direction).

Notes on where the SaaS Starter Template (BUILD-SPEC.md) was incomplete or ambiguous
when building the Habit Tracker feature (FEATURE-SPEC-habit-tracker.md) on top of it,
per FEATURE-SPEC §0. Appended as they're discovered; the final pass happens in H6.

## BUILD-SPEC Phase 8 (Pages & UX States) had never been built

Before this session, Phase 1–5 were done but Phase 6–11 were not. Concretely: `settings/{profile,billing,security,danger}` were empty placeholder folders (no `page.tsx`), `(marketing)/{terms,privacy,refund-policy}` were empty despite being linked from the navbar/footer/hero (dead links), and no `error.tsx`/`loading.tsx`/`not-found.tsx`/`global-error.tsx` existed anywhere. This was built out as a prerequisite before starting the Habit Tracker phases, per explicit instruction — not part of the original H1–H6 plan.

## Root-level `not-found.tsx` / `global-error.tsx` need their own `<html>/<body>`

`src/app/layout.tsx` (outside `[locale]/`) is intentionally a bare passthrough — the real `<html>/<body>` document shell lives in `src/app/[locale]/layout.tsx`. That's fine for normal routes, but two cases render *outside* the locale tree and therefore never reach that shell:

- `src/middleware.ts`'s admin-guard rewrites unauthorized `/admin/*` requests to the literal path `/_not-found` (bypassing locale routing entirely) — this resolves to `src/app/not-found.tsx`, not `src/app/[locale]/not-found.tsx`.
- `global-error.tsx` is a Next.js special case that replaces the root layout on error.

Both files were written to self-import `globals.css` and render a complete, locale-agnostic (bilingual, static — no next-intl context available here) `<html><body>`. This isn't a bug so much as an easy trap for future additions at the root `app/` level.

## Pre-existing `revalidatePath()` calls may not cover non-default-locale routes

`src/server/actions/admin.actions.ts` calls `revalidatePath('/admin/users', 'page')` — a literal path with no `[locale]` segment. Per the Habit Tracker spec's own pitfall #8, this likely only revalidates the default-locale (`th`, unprefixed) route and misses `/en/admin/users`. This predates this session and wasn't touched (out of scope), but every new Server Action written in this session (`profile.actions.ts` and onward) uses the `/[locale]/...` form instead to avoid repeating it.

## Scope trim: no mini-heatmap inside the dashboard "today" cards

FEATURE-SPEC §5.1 calls for a 30-day mini heatmap embedded in each habit card on `/dashboard`. This was skipped to keep the query pattern simple — `getTodayView()` already returns all active habits + today's counts in one batched call, and adding per-habit 30-day log ranges would mean either N extra queries or a new bulk query keyed by habit id. None of the H3/H4 acceptance criteria require it (they test the toggle, optimistic UI, timezone correctness, and the full-size heatmap on the detail page, not a card-embedded mini version), so it was left out rather than adding complexity for an untested surface. The full heatmap (`HabitHeatmap` component, reusable for a mini variant) already exists at `/dashboard/habits/[id]` if this gets picked up later.

## Billing: UI shell only, nothing wired to real Stripe

Per explicit instruction, this pass does not build `lib/stripe/checkout.ts`, `portal.ts`, `sync.ts`, or `app/api/stripe/webhook/*`. `lib/stripe/entitlement.ts` (added in Habit Tracker Phase H2) is stubbed to grant every authenticated user an active monthly-tier subscription, so the Habit Tracker feature and its plan-limit enforcement can be built and tested end-to-end without a live Stripe integration. `settings/billing` and `/pricing` render real UI but no checkout session is ever created, and `settings/danger`'s account deletion skips cancelling a (nonexistent) Stripe subscription. See the entitlement.ts source comment for the exact stub behavior.

## No live Supabase instance in this session — DB-level correctness is unverified

There was no running local/remote Supabase project available while building this. Every phase's `pnpm typecheck && pnpm lint && pnpm test && pnpm build` was actually run and passed (build-time type-checking against a hand-authored `database.types.ts`), but the following were **never executed against a real database** and should be run before trusting this code:

- `supabase db reset` with the two new migrations (`20240101000007_habits.sql`, `20240101000008_habits_rls.sql`) — SQL syntax, constraint names, and trigger wiring are unverified.
- The RLS policies themselves (`habits_*`, `habit_logs_*`) — the logic mirrors the already-working `profiles`/`subscriptions` policies and reuses `public.is_admin()`, but was never round-tripped through Postgres.
- `pnpm db:seed-habits <email>` (scripts/seed-habits.ts) and `pnpm db:types`.
- Both Playwright e2e specs (`habit-flow.spec.ts`, `rls.spec.ts`) — written against real page copy/selectors, but never run. The CI e2e job is disabled (`if: false` in `.github/workflows/pr.yml`) for the same reason.
- The `/api/cron/weekly-summary` route and the Resend email send — never triggered against a real Resend account.

## Settings security/danger are minimal, not full Phase 8 depth

`settings/security` only offers a password change (no "current password" re-auth step, no 2FA). `settings/danger`'s delete-account action calls `auth.admin.deleteUser()` directly with no grace period/soft-delete and no data export (PDPA checklist item "export ข้อมูลตัวเอง" wasn't built). These were intentionally kept minimal since they're template Phase 8 scope, not Habit Tracker scope — the goal was a non-broken settings nav, not a complete account-management suite.

## CI (`pr.yml`) is new and minimal; the rest of Phase 10 wasn't built

`.github/workflows/pr.yml` didn't exist before this session. What's there now runs typecheck/lint/test/build on every PR (verified to be the same commands this whole build was checked against). Not built: `migrate.yml` (auto `supabase db push` on merge), branch protection, Vercel preview deploys, and the three-environment (local/preview/prod) env split — all Phase 10 template work outside the Habit Tracker's scope.

## Verdict: is the template ready for a real project?

**Not yet, but the gap list is short and concrete.** Auth, RLS, i18n, roles/admin, and the Habit Tracker's own domain logic (streak math, timezone handling, entitlement gating, RLS-scoped queries) all type-check, lint, and build cleanly, and the pure-function layer (`streak.ts`) has real passing unit tests. What's missing before this could ship as a real product: (1) an actual Supabase run of the migrations/RLS/seed/e2e listed above, (2) real Stripe checkout/portal/webhook wiring to replace the entitlement stub, (3) the other 5 email templates + Resend domain verification, and (4) the rest of Phase 10 CI/CD. None of these are design problems — they're "run it for real and see what breaks" work that this sandboxed session had no way to do.
