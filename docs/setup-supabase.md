# Setup: Supabase

Supabase provides Postgres, Auth, and Row Level Security for this template.

## Local development

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and Docker.
2. Start the local stack:
   ```bash
   supabase start
   ```
   This prints local `API URL`, `anon key`, and `service_role key`.
3. Put them in `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon key>"
   SUPABASE_SERVICE_ROLE_KEY="<service_role key>"
   ```
4. Apply migrations and generate types:
   ```bash
   pnpm db:reset     # applies supabase/migrations/*
   pnpm db:types     # writes src/types/database.types.ts
   ```

## Migrations (R9)

Schema changes **only** happen via files in `supabase/migrations/`. Never edit the DB
by hand. Create a new migration:

```bash
supabase migration new <name>
# edit the generated SQL, then:
pnpm db:reset
```

Every table must have **RLS enabled with policies for all four operations** (R6). The
`is_admin()` helper is a `security definer` function to avoid recursive policies on
`profiles`.

## Hosted project (staging / production)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the project URL + anon key + service_role key into your Vercel env vars.
3. Link and push migrations:
   ```bash
   supabase link --project-ref <project-ref>
   pnpm db:push
   ```
   CI does this automatically on merge to `main` (see [deployment.md](./deployment.md)).

## Auth

Auth flow (signup/login/reset/verify) lives under `src/app/auth/*` and
`src/app/[locale]/(auth)/*` — locked structural files. A DB trigger inserts a `profiles`
row automatically on signup.
