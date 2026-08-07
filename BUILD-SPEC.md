# BUILD SPEC — SaaS Starter Template

> **สำหรับ AI Agent:** เอกสารนี้คือ single source of truth ในการสร้างเทมเพลตนี้
> อ่านหมวด `RULES` และ `CONVENTIONS` ก่อนเขียนโค้ดบรรทัดแรกเสมอ
> ทำงาน **ทีละ PHASE** ตามลำดับ ห้ามข้าม และต้องผ่าน `Acceptance` ของ phase นั้นก่อนไป phase ถัดไป
> บันทึกไฟล์นี้ไว้ที่ root เป็น `AGENTS.md` หรือ `CLAUDE.md` เพื่อให้ agent อ่านอัตโนมัติ

---

## 0. RULES (ห้ามละเมิด)

| # | Rule |
|---|---|
| R1 | นี่คือ **template เปล่า** — ห้ามใส่ business logic, ห้ามสมมติชื่อสินค้า/ฟีเจอร์ของโปรเจคจริง |
| R2 | React Server Component เป็น default — ใส่ `'use client'` เฉพาะเมื่อต้องใช้ hook / event handler |
| R3 | Mutation ทุกตัวใช้ **Server Action** เท่านั้น (ยกเว้น Stripe webhook ที่ต้องเป็น Route Handler) |
| R4 | Input ทุกทางเข้าต้องผ่าน **zod validation** ก่อนแตะ database |
| R5 | `SUPABASE_SERVICE_ROLE_KEY` ใช้ได้เฉพาะใน `src/lib/supabase/admin.ts` และห้าม import จากไฟล์ที่มี `'use client'` |
| R6 | ทุกตารางต้องเปิด RLS และมี policy ครบทั้ง 4 operation |
| R7 | ห้ามใช้ `any` — ถ้าติดให้ประกาศ type ให้ชัด |
| R8 | ข้อความที่ผู้ใช้เห็นทุกตัวต้องมาจาก i18n message key — ห้าม hardcode ภาษาไทย/อังกฤษใน JSX |
| R9 | ห้ามแก้ schema ผ่าน Supabase dashboard — สร้างไฟล์ใน `supabase/migrations/` เท่านั้น |
| R10 | ทุก phase ต้อง `pnpm typecheck && pnpm lint && pnpm build` ผ่านก่อนถือว่าเสร็จ |

---

## 1. STACK

```
Next.js 14 (App Router) + TypeScript strict
├── Tailwind CSS + shadcn/ui
├── next-intl v3              (i18n: th default, en)
├── Supabase (@supabase/ssr)  (Auth + PostgreSQL)
├── Stripe                    (Subscription: monthly + yearly)
├── Resend + React Email
├── Vercel
└── GitHub Actions
```

**Package manager:** pnpm · **Node:** 20 LTS

### Product spec ที่ล็อคแล้ว
- **User model:** single user — ไม่มี organization / team / invite
- **Billing:** subscription รายเดือน + รายปี, ไม่มี free tier, ไม่มี usage-based
- **Roles:** `user` | `admin`
- **Locales:** `th` (default, ไม่มี prefix) + `en` (prefix `/en`)

---

## 2. CONVENTIONS

| หัวข้อ | กติกา |
|---|---|
| ไฟล์ / โฟลเดอร์ | `kebab-case` เช่น `pricing-table.tsx` |
| React component | `PascalCase` + named export |
| Hook | `use-*.ts` → `useThing()` |
| Server Action file | `*.actions.ts` ขึ้นต้นไฟล์ด้วย `'use server'` |
| Query file | `*.queries.ts` (อ่านอย่างเดียว, ไม่มี `'use server'`) |
| Zod schema file | `*.schema.ts` export ทั้ง schema และ inferred type |
| DB table / column | `snake_case` |
| Enum ใน DB | `snake_case` type name, ค่าเป็น lowercase |
| Import | ใช้ `@/*` เสมอ ห้าม relative เกิน 1 ระดับ |
| Server Action return | `{ success: true, data } | { success: false, error: string }` — ห้าม throw ให้ client |
| Commit | conventional commits (`feat:`, `fix:`, `chore:`) |

### Server Action Result type (ใช้ร่วมกันทั้งโปรเจค)

```ts
// src/types/index.ts
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
```

---

## 3. FOLDER STRUCTURE (สร้างตามนี้ทุกไฟล์)

```
saas-template/
├── .github/
│   ├── workflows/{pr.yml,migrate.yml}
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml
├── .husky/{pre-commit,commit-msg}
├── docs/{architecture.md,deployment.md,setup-supabase.md,setup-stripe.md,setup-resend.md}
├── public/{favicon.ico,icons/,images/,manifest.json}
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20240101000001_extensions_and_enums.sql
│   │   ├── 20240101000002_profiles.sql
│   │   ├── 20240101000003_subscriptions.sql
│   │   ├── 20240101000004_audit_logs.sql
│   │   ├── 20240101000005_functions.sql
│   │   └── 20240101000006_rls_policies.sql
│   └── seed.sql
├── emails/
│   ├── components/{email-layout.tsx,email-button.tsx,email-footer.tsx}
│   ├── welcome.tsx
│   ├── verify-email.tsx
│   ├── reset-password.tsx
│   ├── subscription-confirmed.tsx
│   ├── payment-failed.tsx
│   └── subscription-canceled.tsx
├── messages/{th.json,en.json}
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (marketing)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── pricing/page.tsx
│   │   │   │   ├── terms/page.tsx
│   │   │   │   ├── privacy/page.tsx
│   │   │   │   └── refund-policy/page.tsx
│   │   │   ├── (auth)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   ├── reset-password/page.tsx
│   │   │   │   └── verify-email/page.tsx
│   │   │   ├── (app)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/{page.tsx,loading.tsx,error.tsx}
│   │   │   │   └── settings/
│   │   │   │       ├── layout.tsx
│   │   │   │       ├── profile/page.tsx
│   │   │   │       ├── billing/page.tsx
│   │   │   │       ├── security/page.tsx
│   │   │   │       └── danger/page.tsx
│   │   │   ├── (admin)/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── admin/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── users/page.tsx
│   │   │   │       ├── users/[id]/page.tsx
│   │   │   │       ├── subscriptions/page.tsx
│   │   │   │       └── logs/page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── not-found.tsx
│   │   │   └── error.tsx
│   │   ├── api/
│   │   │   ├── stripe/webhook/route.ts
│   │   │   ├── health/route.ts
│   │   │   └── og/route.tsx
│   │   ├── auth/callback/route.ts        # ⚠️ นอก [locale]
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   ├── layout.tsx
│   │   └── global-error.tsx
│   ├── components/
│   │   ├── ui/                            # shadcn
│   │   ├── layout/{navbar,sidebar,footer,mobile-nav,user-menu}.tsx
│   │   ├── auth/{login-form,register-form,oauth-buttons,forgot-password-form,reset-password-form}.tsx
│   │   ├── billing/{pricing-table,interval-toggle,current-plan-card,payment-alert-banner,invoice-list}.tsx
│   │   ├── admin/{users-table,data-table,role-badge,subscription-status-badge}.tsx
│   │   └── shared/{theme-toggle,locale-switcher,empty-state,loading-skeleton,confirm-dialog,cookie-consent,submit-button}.tsx
│   ├── config/{site.ts,plans.ts,navigation.ts}
│   ├── i18n/{routing.ts,request.ts,navigation.ts}
│   ├── lib/
│   │   ├── supabase/{client.ts,server.ts,middleware.ts,admin.ts}
│   │   ├── stripe/{client.ts,checkout.ts,portal.ts,entitlement.ts,sync.ts}
│   │   ├── email/{resend.ts,send.ts}
│   │   ├── auth/{get-session.ts,require-auth.ts,require-admin.ts}
│   │   ├── rate-limit.ts
│   │   ├── logger.ts
│   │   ├── audit.ts
│   │   └── utils.ts
│   ├── server/
│   │   ├── actions/{auth.actions.ts,profile.actions.ts,billing.actions.ts,admin.actions.ts}
│   │   ├── queries/{profile.queries.ts,subscription.queries.ts,admin.queries.ts}
│   │   └── validators/{auth.schema.ts,profile.schema.ts,admin.schema.ts}
│   ├── hooks/{use-user.ts,use-subscription.ts,use-media-query.ts}
│   ├── types/{database.types.ts,index.ts}
│   ├── styles/globals.css
│   ├── env.ts
│   └── middleware.ts
├── tests/{unit/,e2e/,fixtures/stripe-events/}
├── scripts/{rename-project.ts,check-env.ts}
├── .env.example
├── .nvmrc
├── commitlint.config.js
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── playwright.config.ts
├── vitest.config.ts
├── components.json
├── CONTRIBUTING.md
├── AGENTS.md
└── README.md
```

---

## 4. ENVIRONMENT VARIABLES

สร้าง `src/env.ts` ด้วย `@t3-oss/env-nextjs` + zod ให้ตรงตารางนี้ และ mirror ลง `.env.example`

| Variable | Scope | Required | หมายเหตุ |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | client | ✅ | ใช้ทำ absolute URL, OG, redirect |
| `NEXT_PUBLIC_SUPABASE_URL` | client | ✅ | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | ✅ | |
| `SUPABASE_SERVICE_ROLE_KEY` | server | ✅ | ใช้เฉพาะ `lib/supabase/admin.ts` |
| `STRIPE_SECRET_KEY` | server | ✅ | |
| `STRIPE_WEBHOOK_SECRET` | server | ✅ | |
| `NEXT_PUBLIC_STRIPE_PRICE_MONTHLY` | client | ✅ | price id |
| `NEXT_PUBLIC_STRIPE_PRICE_YEARLY` | client | ✅ | price id |
| `RESEND_API_KEY` | server | ✅ | |
| `EMAIL_FROM` | server | ✅ | เช่น `"Acme <noreply@acme.com>"` |
| `UPSTASH_REDIS_REST_URL` | server | ⬜ | rate limit |
| `UPSTASH_REDIS_REST_TOKEN` | server | ⬜ | |
| `NEXT_PUBLIC_SENTRY_DSN` | client | ⬜ | |

---

## 5. DATABASE SCHEMA (เขียนตามนี้ตรงตัว)

### 5.1 Enums + extensions

```sql
create extension if not exists "uuid-ossp";

create type public.user_role   as enum ('user', 'admin');
create type public.app_locale  as enum ('th', 'en');
create type public.sub_status  as enum (
  'trialing','active','past_due','canceled','incomplete',
  'incomplete_expired','unpaid','paused'
);
create type public.sub_interval as enum ('month', 'year');
```

### 5.2 profiles

```sql
create table public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text not null,
  full_name          text,
  avatar_url         text,
  role               public.user_role  not null default 'user',
  locale             public.app_locale not null default 'th',
  stripe_customer_id text unique,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index profiles_role_idx        on public.profiles (role);
create index profiles_stripe_cus_idx  on public.profiles (stripe_customer_id);
```

### 5.3 subscriptions

```sql
create table public.subscriptions (
  id                   text primary key,                     -- Stripe subscription id
  user_id              uuid not null references public.profiles(id) on delete cascade,
  status               public.sub_status not null,
  price_id             text not null,
  interval             public.sub_interval not null,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at          timestamptz,
  trial_end            timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index subscriptions_user_idx   on public.subscriptions (user_id);
create index subscriptions_status_idx on public.subscriptions (status);
```

### 5.4 audit_logs

```sql
create table public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,          -- 'user.role_changed', 'subscription.canceled'
  target_type text,
  target_id   text,
  meta        jsonb not null default '{}'::jsonb,
  ip          text,
  created_at  timestamptz not null default now()
);

create index audit_logs_actor_idx   on public.audit_logs (actor_id);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
```

### 5.5 Functions & triggers

```sql
-- updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ⚠️ security definer: กัน RLS infinite recursion บน profiles
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public;
grant  execute on function public.is_admin() to authenticated;
```

### 5.6 RLS policies

```sql
alter table public.profiles      enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_logs    enable row level security;

-- profiles
create policy "profiles: read own"    on public.profiles for select using (auth.uid() = id);
create policy "profiles: read all admin" on public.profiles for select using (public.is_admin());
create policy "profiles: update own"  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles: update admin" on public.profiles for update using (public.is_admin());
-- insert: ทำผ่าน trigger เท่านั้น / delete: ผ่าน cascade จาก auth.users เท่านั้น

-- subscriptions (เขียนได้เฉพาะ service_role จาก webhook)
create policy "subs: read own"   on public.subscriptions for select using (auth.uid() = user_id);
create policy "subs: read admin" on public.subscriptions for select using (public.is_admin());

-- audit_logs
create policy "logs: read admin" on public.audit_logs for select using (public.is_admin());
```

> **สำคัญ:** ห้ามให้ user เปลี่ยน `role` ของตัวเองผ่าน `profiles: update own` — บังคับใน Server Action ด้วยการ pick เฉพาะ field ที่อนุญาต (`full_name`, `avatar_url`, `locale`) จาก zod schema

---

## 6. ROUTE MAP

| Path | Group | Auth | หมายเหตุ |
|---|---|---|---|
| `/` , `/en` | marketing | public | landing |
| `/pricing` | marketing | public | toggle เดือน/ปี |
| `/terms` `/privacy` `/refund-policy` | marketing | public | |
| `/login` `/register` | auth | guest only | ถ้า login แล้ว → `/dashboard` |
| `/forgot-password` `/reset-password` `/verify-email` | auth | guest | |
| `/auth/callback` | — | — | ⚠️ **นอก `[locale]`** |
| `/dashboard` | app | user | |
| `/settings/profile` | app | user | |
| `/settings/billing` | app | user | checkout / portal |
| `/settings/security` | app | user | เปลี่ยนรหัสผ่าน |
| `/settings/danger` | app | user | ลบบัญชี |
| `/admin` `/admin/users` `/admin/users/[id]` `/admin/subscriptions` `/admin/logs` | admin | admin | |
| `/api/stripe/webhook` | api | signature | ⚠️ raw body |
| `/api/health` | api | public | |

---

## 7. MODULE CONTRACTS (signature ต้องตรงตามนี้)

```ts
// src/lib/supabase/server.ts
export function createClient(): SupabaseClient<Database>;          // RSC + Server Action

// src/lib/supabase/client.ts
export function createClient(): SupabaseClient<Database>;          // browser

// src/lib/supabase/admin.ts   ⚠️ server-only, service_role
import 'server-only';
export function createAdminClient(): SupabaseClient<Database>;

// src/lib/auth/get-session.ts
export async function getSession(): Promise<Session | null>;
export async function getCurrentUser(): Promise<Profile | null>;

// src/lib/auth/require-auth.ts
export async function requireAuth(): Promise<Profile>;             // redirect('/login') ถ้าไม่มี

// src/lib/auth/require-admin.ts
export async function requireAdmin(): Promise<Profile>;            // notFound() ถ้าไม่ใช่ admin

// src/lib/stripe/entitlement.ts
export async function getSubscription(userId: string): Promise<Subscription | null>;
export async function hasActiveSubscription(userId: string): Promise<boolean>;
export async function requireActiveSubscription(): Promise<Subscription>;

// src/lib/stripe/checkout.ts
export async function createCheckoutSession(input: {
  userId: string; priceId: string; locale: 'th' | 'en';
}): Promise<{ url: string }>;

// src/lib/stripe/portal.ts
export async function createPortalSession(input: {
  customerId: string; locale: 'th' | 'en';
}): Promise<{ url: string }>;

// src/lib/stripe/sync.ts
export async function syncSubscriptionFromStripe(subscriptionId: string): Promise<void>;

// src/lib/email/send.ts
export async function sendEmail(input: {
  to: string;
  template: EmailTemplate;      // union type ของ template ทั้งหมด
  locale: 'th' | 'en';
  data: Record<string, unknown>;
}): Promise<void>;

// src/lib/audit.ts
export async function logAudit(input: {
  actorId: string | null; action: string;
  targetType?: string; targetId?: string; meta?: Record<string, unknown>;
}): Promise<void>;
```

### `src/config/plans.ts`

```ts
export const PLANS = [
  {
    id: 'pro',
    prices: {
      month: { priceId: env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY, amount: 299,  currency: 'THB' },
      year:  { priceId: env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY,  amount: 2990, currency: 'THB' },
    },
    featureKeys: ['plans.pro.feature1', 'plans.pro.feature2'],   // i18n keys เท่านั้น
  },
] as const;

export function getPlanByPriceId(priceId: string): Plan | undefined;
```

---

## 8. MIDDLEWARE (⚠️ จุดพลาดอันดับ 1)

`src/middleware.ts` ต้อง compose next-intl กับ Supabase session refresh **ในไฟล์เดียว** โดยส่ง response object ต่อกันเป็นทอด ห้ามต่างคนต่าง `return`

```ts
// pseudocode — ลำดับสำคัญ
export async function middleware(request: NextRequest) {
  // 1) ให้ next-intl จัดการ locale ก่อน (อาจ redirect / rewrite)
  const intlResponse = intlMiddleware(request);

  // 2) เอา response ของ intl มาเป็นฐาน แล้วให้ supabase เขียน cookie ทับลงไป
  const { response, user } = await updateSession(request, intlResponse);

  // 3) route guard
  const pathname = stripLocale(request.nextUrl.pathname);
  if (isProtected(pathname) && !user)   return redirectTo('/login', request);
  if (isGuestOnly(pathname) && user)    return redirectTo('/dashboard', request);
  if (isAdminPath(pathname) && user?.role !== 'admin') return rewriteTo404(request);

  return response;   // ต้องเป็น object เดียวที่ถือ cookie ครบ
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],   // ต้องยกเว้น /api และ /auth/callback
};
```

**เช็ค:** เปลี่ยนภาษาแล้ว session ต้องไม่หลุด และ `/en/dashboard` ต้อง guard เหมือน `/dashboard`

---

## 9. STRIPE WEBHOOK

`src/app/api/stripe/webhook/route.ts`

```ts
export const runtime = 'nodejs';        // ห้าม edge
const body = await req.text();          // ⚠️ raw string ก่อน parse
const event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
```

| Event | สิ่งที่ต้องทำ |
|---|---|
| `checkout.session.completed` | ผูก `stripe_customer_id` เข้า `profiles` → `syncSubscriptionFromStripe()` → ส่งอีเมล `subscription-confirmed` |
| `customer.subscription.created` | upsert `subscriptions` |
| `customer.subscription.updated` | upsert (จับ `cancel_at_period_end`, เปลี่ยนแผน, `past_due`) |
| `customer.subscription.deleted` | set `status='canceled'` → ส่งอีเมล `subscription-canceled` |
| `invoice.payment_succeeded` | sync `current_period_end` |
| `invoice.payment_failed` | set `past_due` → ส่งอีเมล `payment-failed` |

**Idempotency:** เก็บ `event.id` ที่ประมวลผลแล้ว (ตาราง `stripe_events` หรือ Redis TTL 24h) ถ้าซ้ำให้ return 200 ทันที
**Error:** ถ้าประมวลผลไม่สำเร็จให้ return 500 เพื่อให้ Stripe retry — ห้ามกลืน error แล้ว return 200

---

## 10. i18n MESSAGE STRUCTURE

`messages/th.json` และ `en.json` ต้องมี key ตรงกันทุกตัว (CI ต้อง fail ถ้าไม่ตรง)

```json
{
  "common":    { "save": "", "cancel": "", "delete": "", "loading": "", "back": "" },
  "nav":       { "dashboard": "", "settings": "", "billing": "", "admin": "", "signOut": "" },
  "auth":      { "login": {}, "register": {}, "forgotPassword": {}, "resetPassword": {}, "errors": {} },
  "marketing": { "hero": {}, "features": {}, "faq": {}, "cta": {} },
  "pricing":   { "title": "", "monthly": "", "yearly": "", "saveBadge": "", "cta": "" },
  "dashboard": {},
  "settings":  { "profile": {}, "billing": {}, "security": {}, "danger": {} },
  "admin":     { "users": {}, "subscriptions": {}, "logs": {} },
  "billing":   { "status": {}, "alerts": {} },
  "errors":    { "notFound": {}, "serverError": {}, "unauthorized": {} },
  "email":     { "welcome": {}, "verifyEmail": {}, "resetPassword": {}, "subscriptionConfirmed": {}, "paymentFailed": {}, "subscriptionCanceled": {} }
}
```

- Format วันที่/เงิน ใช้ `useFormatter()` ของ next-intl เท่านั้น
- ฟอนต์: โหลดฟอนต์ที่รองรับภาษาไทย (Noto Sans Thai / IBM Plex Sans Thai / LINE Seed) ผ่าน `next/font`

---

## 11. BUILD PHASES

> ทำเรียงตามลำดับ · แต่ละ phase จบด้วย commit เดียว · ต้องผ่าน Acceptance ก่อนไปต่อ

### PHASE 1 — Foundation
**ทำ:** scaffold Next.js 14 (TS, Tailwind, App Router, src dir, alias `@/*`) · ESLint + Prettier + prettier-plugin-tailwindcss · husky + lint-staged + commitlint · `src/env.ts` + `.env.example` · `tsconfig` strict · scripts: `dev/build/typecheck/lint/test`
**Acceptance:** `pnpm build` ผ่าน · commit ที่ผิด convention ถูก block · ลบ env ตัวจำเป็นออกแล้ว build fail พร้อมข้อความชัดเจน

### PHASE 2 — Design System
**ทำ:** `shadcn init` + ติดตั้ง primitives ที่ใช้ · design token ใน `globals.css` + `tailwind.config.ts` · ThemeProvider (no flash) · font ไทย · layout shell · shared components ทั้งหมดใน `components/shared/`
**Acceptance:** หน้า `/` แสดง navbar + footer + theme toggle · สลับ dark/light ไม่กระพริบตอน reload · responsive ที่ 375 / 768 / 1440

### PHASE 3 — i18n (⚠️ ต้องทำก่อน auth)
**ทำ:** next-intl v3 · `i18n/routing.ts` `request.ts` `navigation.ts` · ย้ายทุก route เข้า `[locale]/` · `messages/{th,en}.json` · LocaleSwitcher + เขียน cookie · typed messages · `<html lang>` + metadata ต่อ locale · hreflang
**Acceptance:** `/` เป็นไทย, `/en` เป็นอังกฤษ · สลับภาษาแล้วอยู่หน้าเดิม · key หายแล้ว typecheck fail

### PHASE 4 — Database & Auth
**ทำ:** migration ทั้ง 6 ไฟล์ตามหมวด 5 · `supabase gen types` → `database.types.ts` · client 3 ตัว + `admin.ts` · `middleware.ts` ตามหมวด 8 · auth pages + Server Actions · `/auth/callback` · rate limit login/reset · seed script
**Acceptance:** signup → มีแถวใน `profiles` อัตโนมัติ · reload แล้ว session ยังอยู่ · เปลี่ยนภาษาแล้ว session ไม่หลุด · เข้า `/dashboard` โดยไม่ login → redirect `/login` · user A query ข้อมูล user B ไม่ได้ (ทดสอบจริง)

### PHASE 5 — Roles & Admin
**ทำ:** `is_admin()` + policies · `requireAdmin()` · admin guard ใน middleware + layout · `(admin)` pages · generic DataTable (search / sort / pagination) · เปลี่ยน role + บันทึก `audit_logs` · ซ่อนเมนู admin จาก user
**Acceptance:** user ธรรมดาเข้า `/admin` ได้ 404 · query `profiles` ไม่เกิด recursion error · เปลี่ยน role แล้วมี audit log

### PHASE 6 — Billing
**ทำ:** `config/plans.ts` · pricing page + interval toggle + badge ส่วนลดรายปี · checkout + portal Server Actions · webhook ตามหมวด 9 · `entitlement.ts` · billing page (แผน, วันต่ออายุ, ใบเสร็จ) · alert banner (`past_due` / จะหมดอายุ) · gate dashboard
**Acceptance:** ผ่าน flow ด้วย Stripe CLI: checkout → `subscriptions` มีแถว status `active` · ยกเลิกใน portal → `cancel_at_period_end = true` · ยิง event ซ้ำ 2 ครั้งแล้วผลไม่เปลี่ยน · signature ผิด → 400

### PHASE 7 — Email
**ทำ:** `emails/` ทั้ง 6 template + shared components · `sendEmail()` wrapper อ่าน locale จาก `profiles.locale` · ผูกเข้ากับ auth + webhook events · preview script · เอกสาร SPF/DKIM/DMARC
**Acceptance:** preview ทุก template ได้ทั้ง 2 ภาษา · signup แล้วได้ welcome email · payment failed แล้วได้อีเมลแจ้ง

### PHASE 8 — Pages & UX States
**ทำ:** landing (hero, features, social proof, FAQ, CTA) · legal pages 3 หน้า · settings ครบ 4 หน้า · delete account (cancel sub + ลบข้อมูล) · `error.tsx` / `loading.tsx` / `not-found.tsx` ทุก group · `global-error.tsx` · pending state ทุกปุ่ม · cookie consent
**Acceptance:** ไม่มีหน้าไหนขาว/ค้างระหว่างโหลด · ลบบัญชีแล้ว subscription ถูกยกเลิกจริงใน Stripe

### PHASE 9 — SEO, Security, Observability
**ทำ:** metadata ทุกหน้า + OG + dynamic OG image · `sitemap.ts` `robots.ts` (block `/admin` `/dashboard`) · JSON-LD · security headers (CSP, HSTS, X-Frame-Options) · CSRF · Sentry + source map · analytics · `logger.ts` · `/api/health`
**Acceptance:** Lighthouse ≥ 90 ทุกหมวดบน landing · `robots.txt` block ถูกต้อง · โยน error ทดสอบแล้วเห็นใน Sentry

### PHASE 10 — Testing & CI/CD
**ทำ:** Vitest + RTL · Playwright E2E (signup → checkout → dashboard, admin guard) · unit test webhook ด้วย fixture · RLS test · `pr.yml` (typecheck → lint → test → build + cache) · `migrate.yml` · branch protection · env 3 ชุด
**Acceptance:** CI เขียวบน PR เปล่า · แก้ type ให้พังแล้ว CI แดง · merge main แล้ว migration รันจริง

### PHASE 11 — Docs & DX
**ทำ:** README (setup ใน 5 นาที) · `docs/` ครบ 5 ไฟล์ · CONTRIBUTING + PR template · scripts `db:reset` `db:types` `stripe:listen` `rename-project`
**Acceptance:** ทำตาม README บนเครื่องเปล่าแล้วรันได้ครบทุก flow

---

## 12. MASTER CHECKLIST

### 1. Foundation & Tooling
- [ ] Next.js 14 App Router + TypeScript strict mode
- [ ] `src/` dir + path alias `@/*`
- [ ] ESLint + Prettier + Tailwind class sorting plugin
- [ ] husky + lint-staged + commitlint (conventional commits)
- [ ] Env validation ด้วย zod แยก server / client
- [ ] `.env.example` ครบทุกตัว
- [ ] pnpm lockfile + `.nvmrc`
- [ ] Folder structure ตามหมวด 3

### 2. Design System & UI
- [ ] shadcn/ui init + design tokens (color, radius, spacing)
- [ ] Dark / Light mode + จำค่าไว้ (ไม่กระพริบตอนโหลด)
- [ ] Font รองรับภาษาไทย
- [ ] Layout shell: Navbar, Sidebar, Footer, Container
- [ ] Responsive ครบ (mobile nav / drawer)
- [ ] Loading skeleton / Empty state / Error state
- [ ] Toast, Dialog, Confirm dialog
- [ ] Form components + validation state (react-hook-form + zod)
- [ ] Accessibility: focus ring, aria label, keyboard nav

### 3. i18n
- [ ] next-intl + `[locale]` routing (th default, en prefix)
- [ ] `messages/th.json` + `messages/en.json` key ตรงกัน
- [ ] Typed message keys
- [ ] LocaleSwitcher + จำ locale ลง cookie และ `profiles.locale`
- [ ] Format วันที่ / เงิน / ตัวเลข ตาม locale
- [ ] Metadata + `<html lang>` เปลี่ยนตามภาษา
- [ ] hreflang tags
- [ ] Email template รองรับ 2 ภาษา

### 4. Auth & Account
- [ ] Sign up / Sign in (email + password)
- [ ] OAuth (Google)
- [ ] Email verification
- [ ] Forgot password / Reset password
- [ ] `/auth/callback` route นอก `[locale]`
- [ ] Session refresh ใน middleware
- [ ] ⚠️ Compose next-intl + Supabase middleware ในไฟล์เดียว
- [ ] Protected route guard
- [ ] Sign out (ล้าง cookie ครบ)
- [ ] Delete account (cancel subscription + ลบข้อมูล)
- [ ] Rate limit login / reset

### 5. Database & Security
- [ ] Migration ผ่าน Supabase CLI เท่านั้น
- [ ] `profiles` + trigger auto-create
- [ ] `subscriptions`
- [ ] `audit_logs`
- [ ] RLS เปิดทุกตาราง + policy ครบ
- [ ] Type generation → `database.types.ts` + script ใน CI
- [ ] Index บน FK และ column ที่ query บ่อย
- [ ] `updated_at` trigger
- [ ] Seed script สำหรับ dev

### 6. Roles & Admin Panel
- [ ] `role` column ('user' | 'admin')
- [ ] ⚠️ `is_admin()` security definer
- [ ] Route guard สำหรับ `(admin)`
- [ ] User list + search + pagination + filter
- [ ] ดู / แก้ subscription status
- [ ] Audit log viewer
- [ ] ⚠️ `service_role` ใช้ฝั่ง server เท่านั้น
- [ ] ซ่อนเมนู admin จาก user ธรรมดา (UI + API)

### 7. Billing (Stripe)
- [ ] `config/plans.ts` map price ID จาก env
- [ ] Pricing page + toggle เดือน/ปี + ส่วนลดรายปี
- [ ] Checkout session (Server Action)
- [ ] Customer Portal
- [ ] Webhook + verify signature ด้วย raw body
- [ ] Handle 6 events ตามหมวด 9
- [ ] Idempotency
- [ ] `getSubscription()` + `requireActiveSubscription()`
- [ ] Gate UI ตามสถานะ
- [ ] Banner เตือนจ่ายไม่ผ่าน / ใกล้หมดอายุ
- [ ] Billing page: แผน, วันต่ออายุ, ประวัติใบเสร็จ
- [ ] Trial period (ถ้ามี)
- [ ] Test / Live mode แยก env
- [ ] Stripe CLI สำหรับ test local

### 8. Email (Resend)
- [ ] `sendEmail()` wrapper ตัวเดียว
- [ ] Welcome
- [ ] Verify email
- [ ] Reset password
- [ ] Subscription confirmed
- [ ] Payment failed
- [ ] Subscription canceled
- [ ] Domain verification (SPF / DKIM / DMARC)
- [ ] Preview email ใน local
- [ ] Unsubscribe link สำหรับ marketing email

### 9. Pages
- [ ] Landing (hero, features, social proof, FAQ, CTA)
- [ ] Pricing
- [ ] Dashboard
- [ ] Settings → Profile / Billing / Security / Danger
- [ ] Admin
- [ ] 404 / 500 / maintenance

### 10. Legal & Compliance
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Refund Policy
- [ ] Cookie consent banner
- [ ] PDPA: export ข้อมูลตัวเอง + ลบบัญชี
- [ ] ข้อมูลผู้ประกอบการสำหรับรับชำระเงิน

### 11. Error & UX States
- [ ] `error.tsx` / `loading.tsx` / `not-found.tsx` ทุก route group
- [ ] Global error boundary
- [ ] Optimistic UI / pending state ทุกปุ่ม
- [ ] Form error message 2 ภาษา
- [ ] Offline / network error handling

### 12. SEO & Marketing
- [ ] Metadata API ทุกหน้า
- [ ] OpenGraph + Twitter card + dynamic OG image
- [ ] `sitemap.ts` + `robots.ts` (block `/admin`, `/dashboard`)
- [ ] JSON-LD structured data
- [ ] favicon set + `manifest.json`

### 13. Security
- [ ] Zod validation ทุก Server Action / Route Handler
- [ ] CSRF protection
- [ ] Security headers (CSP, HSTS, X-Frame-Options)
- [ ] Rate limiting
- [ ] ไม่มี secret หลุดผ่าน `NEXT_PUBLIC_`
- [ ] Sanitize user input ที่แสดงผล
- [ ] Dependabot / `pnpm audit`

### 14. Observability & Analytics
- [ ] Sentry (error + source map)
- [ ] Vercel Analytics / Speed Insights
- [ ] Product analytics
- [ ] Structured logging ฝั่ง server
- [ ] Health check endpoint
- [ ] Webhook failure alert

### 15. Performance
- [ ] Server Components เป็น default
- [ ] `next/image` + `next/font`
- [ ] Streaming + Suspense
- [ ] Bundle analyzer
- [ ] Cache strategy ชัดเจน
- [ ] Lighthouse ≥ 90

### 16. Testing
- [ ] Vitest + React Testing Library
- [ ] Playwright E2E: signup → checkout → dashboard
- [ ] Test webhook ด้วย mock event
- [ ] Test RLS (user A เห็นข้อมูล user B ไม่ได้)

### 17. CI/CD
- [ ] `pr.yml`: typecheck → lint → test → build + cache
- [ ] `migrate.yml`: `supabase db push` ตอน merge main
- [ ] Vercel preview deploy ทุก PR
- [ ] Branch protection + required checks
- [ ] Env แยก 3 ชุด: local / preview / production
- [ ] Rollback plan

### 18. Docs & DX
- [ ] README setup ภายใน 5 นาที
- [ ] `docs/architecture.md`
- [ ] `docs/deployment.md`
- [ ] คู่มือ setup Supabase / Stripe / Resend
- [ ] `CONTRIBUTING.md` + PR template
- [ ] Script: `db:reset`, `db:types`, `stripe:listen`
- [ ] Rename script

---

## 13. KNOWN PITFALLS (ตรวจก่อนปิด PR ทุกครั้ง)

| # | ปัญหา | วิธีเลี่ยง |
|---|---|---|
| P1 | Session หลุดตอนเปลี่ยนภาษา | compose middleware ไฟล์เดียว ส่ง response object ต่อกัน (หมวด 8) |
| P2 | `infinite recursion detected in policy for relation "profiles"` | ใช้ `is_admin()` security definer ห้าม select `profiles` ใน policy ของ `profiles` |
| P3 | Stripe signature verification failed | อ่าน `await req.text()` ก่อน parse, ตั้ง `runtime = 'nodejs'` |
| P4 | OAuth callback วนลูป / 404 | วาง `/auth/callback` นอก `[locale]` และ exclude ใน middleware matcher |
| P5 | ทำ i18n ทีหลังแล้วต้องรื้อทั้งโปรเจค | ทำ PHASE 3 ก่อน PHASE 4 เสมอ |
| P6 | Webhook ยิงซ้ำทำให้ข้อมูลเพี้ยน | เก็บ `event.id` แล้วเช็คก่อนประมวลผล |
| P7 | User แก้ `role` ตัวเองเป็น admin ได้ | zod pick เฉพาะ field ที่อนุญาตใน Server Action |
| P8 | `service_role` key หลุดไป bundle ฝั่ง client | `import 'server-only'` ใน `admin.ts` |

---

## 14. DEFINITION OF DONE

เทมเพลตถือว่าเสร็จเมื่อ:

1. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` ผ่านทั้งหมด
2. Playwright E2E flow `signup → checkout → dashboard → cancel` ผ่าน
3. RLS test ยืนยันว่า user A เข้าถึงข้อมูล user B ไม่ได้
4. Lighthouse landing page ≥ 90 ทุกหมวด
5. Clone repo เปล่า → ทำตาม README → รันได้ครบทุก flow ภายใน 5 นาที
6. ไม่มี `any`, ไม่มี hardcoded user-facing string, ไม่มี TODO ค้าง
7. Checklist หมวด 12 ติ๊กครบทุกข้อ
