# FEATURE SPEC — Habit Tracker (โปรเจคทดสอบเทมเพลต)

> **สำหรับ AI Agent:** เอกสารนี้คือสเปกของ **เนื้อหาโปรเจค** ที่วางทับบน SaaS Starter Template
> ต้องอ่าน `BUILD-SPEC.md` (หมวด RULES + CONVENTIONS) ก่อนเสมอ — กฎ R1–R10 ยังบังคับใช้ทั้งหมด
> ยกเว้น **R1** ที่ถูกยกเลิกเฉพาะโปรเจคนี้ (โปรเจคนี้ *มี* business logic ได้)
> ทำงานทีละ PHASE ตามลำดับ ห้ามข้าม ต้องผ่าน `Acceptance` ก่อนไปเฟสถัดไป

---

## 0. เป้าหมายของเอกสารนี้

โปรเจคนี้ **ไม่ใช่ผลิตภัณฑ์จริง** — เป็นตัวทดสอบว่าเทมเพลตเอาไปใช้งานได้จริงหรือเปล่า

**เกณฑ์ตัดสินความสำเร็จ:** เขียนฟีเจอร์ทั้งหมดนี้จบโดย **ไม่ต้องแก้ไฟล์ในกลุ่มโครงสร้าง** ได้แก่
`middleware.ts`, `lib/supabase/*`, `lib/stripe/*`, `app/auth/*`, `app/api/stripe/webhook/*`

ถ้าต้องแก้ไฟล์เหล่านี้ → **หยุด แล้วบันทึกลง `docs/template-gaps.md`** ว่าเทมเพลตขาดอะไร นั่นคือผลลัพธ์ที่มีค่าที่สุดของการทดสอบ

---

## 1. ขอบเขต

| ✅ ทำ | ❌ ไม่ทำ |
|---|---|
| สร้าง/แก้/เก็บเข้ากรุ habit | แชร์ habit ให้คนอื่น / social feed |
| เช็คอินรายวัน (กดติ๊ก) | อัปโหลดรูป / attachment |
| Heatmap ย้อนหลัง 1 ปี | Mobile app / push notification |
| สถิติ: streak, อัตราสำเร็จ | AI แนะนำ habit |
| จำกัดจำนวน habit ตามแผน | Import/Export ไฟล์ (ทำทีหลังได้) |
| อีเมลสรุปรายสัปดาห์ | Gamification / badge / leaderboard |
| หน้าแอดมินดูสถิติรวม | Reminder รายชั่วโมง |

---

## 2. Data Model

### 2.1 Migration — `supabase/migrations/0004_habits.sql`

```sql
-- ── enum ────────────────────────────────────────────────
create type public.habit_frequency as enum ('daily', 'weekly');

-- ── habits ──────────────────────────────────────────────
create table public.habits (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null check (char_length(name) between 1 and 60),
  icon              text not null default '✅' check (char_length(icon) <= 8),
  color             text not null default 'emerald'
                    check (color in ('emerald','blue','violet','amber','rose','cyan','lime','slate')),
  frequency         public.habit_frequency not null default 'daily',
  target_per_day    smallint not null default 1 check (target_per_day between 1 and 20),
  days_per_week     smallint check (days_per_week between 1 and 7),
  sort_order        smallint not null default 0,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- frequency = 'weekly' ต้องมี days_per_week เสมอ
  constraint weekly_requires_days check (
    (frequency = 'daily'  and days_per_week is null) or
    (frequency = 'weekly' and days_per_week is not null)
  )
);

create index habits_user_active_idx
  on public.habits (user_id, sort_order) where archived_at is null;

-- ── habit_logs ──────────────────────────────────────────
create table public.habit_logs (
  id          uuid primary key default gen_random_uuid(),
  habit_id    uuid not null references public.habits(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  logged_date date not null,
  count       smallint not null default 1 check (count between 1 and 100),
  note        text check (char_length(note) <= 280),
  created_at  timestamptz not null default now(),
  unique (habit_id, logged_date)     -- ← กันกดรัวซ้ำวันเดียวกัน
);

create index habit_logs_user_date_idx  on public.habit_logs (user_id, logged_date desc);
create index habit_logs_habit_date_idx on public.habit_logs (habit_id, logged_date desc);

-- ── profiles: เพิ่ม timezone + week_start ────────────────
alter table public.profiles
  add column timezone   text     not null default 'Asia/Bangkok',
  add column week_start  smallint not null default 0 check (week_start in (0, 1)); -- 0=อาทิตย์ 1=จันทร์
```

### 2.2 RLS — `supabase/migrations/0005_habits_rls.sql`

```sql
alter table public.habits     enable row level security;
alter table public.habit_logs enable row level security;

-- habits: เจ้าของเท่านั้น ครบ 4 operation
create policy "habits_select_own" on public.habits
  for select to authenticated using (user_id = auth.uid());
create policy "habits_insert_own" on public.habits
  for insert to authenticated with check (user_id = auth.uid());
create policy "habits_update_own" on public.habits
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "habits_delete_own" on public.habits
  for delete to authenticated using (user_id = auth.uid());

-- habit_logs: ต้องเช็ค 2 ชั้น — เป็นของตัวเอง AND habit นั้นเป็นของตัวเอง
create policy "habit_logs_select_own" on public.habit_logs
  for select to authenticated using (user_id = auth.uid());
create policy "habit_logs_insert_own" on public.habit_logs
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid())
  );
create policy "habit_logs_update_own" on public.habit_logs
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "habit_logs_delete_own" on public.habit_logs
  for delete to authenticated using (user_id = auth.uid());

-- admin อ่านได้อย่างเดียว (ใช้ security definer function เดิมจาก template)
create policy "habits_select_admin" on public.habits
  for select to authenticated using (public.is_admin());
create policy "habit_logs_select_admin" on public.habit_logs
  for select to authenticated using (public.is_admin());
```

> ⚠️ **ห้าม** เขียน policy ที่ `select public.profiles` ซ้อนใน policy ของ `profiles` เอง — ใช้ `public.is_admin()` ที่เป็น security definer เท่านั้น (จุดพลาดข้อ 2 ใน CONTEXT)

---

## 3. Entitlement (ผูกกับแผนราคา)

แก้ `src/config/plans.ts` — เพิ่ม limit ต่อแผน เพื่อทดสอบว่า entitlement ทำงานได้ลึกกว่าแค่ "จ่าย/ไม่จ่าย"

```ts
export const PLAN_LIMITS = {
  monthly: { maxHabits: 10,  historyDays: 90   },
  yearly:  { maxHabits: 50,  historyDays: 3650 },
} as const;
```

**กฎ:**
- ไม่มี subscription active → เข้า `/dashboard/*` ไม่ได้ เด้งไป `/pricing` (ใช้ `requireActiveSubscription()` เดิม)
- สร้าง habit เกิน `maxHabits` → Server Action ต้อง `throw` และ UI แสดง upgrade prompt
- Heatmap ดึงข้อมูลย้อนหลังได้ไม่เกิน `historyDays`
- **เช็ค limit ฝั่งเซิร์ฟเวอร์เสมอ** — ซ่อนปุ่มฝั่ง client ไม่นับเป็นการป้องกัน

---

## 4. โครงสร้างไฟล์ที่เพิ่ม

```
src/
├── app/[locale]/(app)/
│   ├── dashboard/
│   │   ├── page.tsx                    วันนี้: รายการ habit + ปุ่มติ๊ก
│   │   ├── loading.tsx                 skeleton
│   │   └── habits/
│   │       ├── page.tsx                จัดการ habit ทั้งหมด
│   │       └── [id]/page.tsx           รายละเอียด + heatmap + สถิติ
│   └── (admin)/admin/habits/page.tsx   สถิติรวมของระบบ
│
├── components/habits/
│   ├── habit-card.tsx                  'use client' — ปุ่มติ๊ก + optimistic
│   ├── habit-form-dialog.tsx           'use client' — react-hook-form + zod
│   ├── habit-heatmap.tsx               server component (คำนวณเสร็จแล้วค่อยส่งลงมา)
│   ├── habit-heatmap-cell.tsx          'use client' — tooltip อย่างเดียว
│   ├── streak-badge.tsx
│   ├── stats-summary.tsx
│   └── empty-habits.tsx
│
├── server/
│   ├── actions/habits.ts               mutation ทั้งหมด
│   └── queries/habits.ts               read ทั้งหมด (cache ได้)
│
├── lib/habits/
│   ├── schema.ts                       zod schema ใช้ร่วม client/server
│   ├── date.ts                         ⚠️ ตัวจัดการ timezone ทั้งหมดอยู่ที่นี่
│   ├── streak.ts                       คำนวณ streak (pure function + test ได้)
│   └── heatmap.ts                      แปลง logs → grid 53×7
│
└── emails/
    └── weekly-summary.tsx              React Email 2 ภาษา
```

---

## 5. ฟังก์ชันการทำงาน (แยกตามหน้า)

### 5.1 `/dashboard` — หน้าวันนี้

| ฟังก์ชัน | รายละเอียด |
|---|---|
| แสดงรายการ habit ที่ยัง active | เรียงตาม `sort_order` |
| ปุ่มติ๊กเสร็จ | กด 1 ครั้ง = สร้าง log วันนี้, กดซ้ำ = ลบ log (toggle) |
| habit แบบนับจำนวน | `target_per_day > 1` → แสดงปุ่ม +/− และ progress ring |
| Optimistic update | ใช้ `useOptimistic` — UI เปลี่ยนทันที ไม่รอ server |
| แถบสรุปบนสุด | "วันนี้ทำแล้ว 3/5" + streak รวมของวัน |
| Mini heatmap 30 วัน | ต่อ habit แต่ละอัน แสดงในการ์ด |
| Empty state | ยังไม่มี habit → ปุ่ม CTA สร้างอันแรก |
| เปลี่ยนวันที่ | ปุ่ม ← → ย้อนดู/บันทึกย้อนหลังได้ **ไม่เกิน 7 วัน** |

### 5.2 `/dashboard/habits` — จัดการ

- สร้าง habit ผ่าน dialog: ชื่อ, ไอคอน (emoji picker แบบง่าย ~30 ตัว), สี, ความถี่, เป้าหมาย
- แก้ไข / เก็บเข้ากรุ (`archived_at`) / ลบถาวร (มี confirm dialog + พิมพ์ชื่อยืนยัน)
- ลากจัดลำดับใหม่ (`sort_order`) — batch update ครั้งเดียว
- แท็บ "เก็บเข้ากรุ" + ปุ่มกู้คืน
- แสดง `3/10 habits` ตามแผน + ปุ่ม upgrade เมื่อเต็ม

### 5.3 `/dashboard/habits/[id]` — รายละเอียด

- **Heatmap เต็มปี** 53 สัปดาห์ × 7 วัน
- สถิติ 4 ตัว: streak ปัจจุบัน / streak ยาวสุด / ทำไปแล้วกี่ครั้ง / อัตราสำเร็จ 30 วัน
- กราฟแท่งรายเดือน 12 เดือน
- รายการโน้ตล่าสุด 10 อัน
- คลิกช่องใน heatmap → แก้ log ของวันนั้น (ในขอบเขต 7 วันย้อนหลังเท่านั้น)

### 5.4 `/settings` — เพิ่มเข้าไปในหน้าเดิม

- เลือก timezone (dropdown จาก `Intl.supportedValuesOf('timeZone')`)
- เลือกวันเริ่มสัปดาห์ (อาทิตย์ / จันทร์)
- เปิด/ปิดอีเมลสรุปรายสัปดาห์

### 5.5 `/admin/habits`

- ตาราง: ผู้ใช้ / จำนวน habit / log ทั้งหมด / log 7 วันล่าสุด / active ล่าสุดเมื่อไหร่
- ตัวเลขรวมด้านบน: ผู้ใช้ทั้งหมด, habit ทั้งหมด, log วันนี้
- เรียง + ค้นหา + pagination (ใช้ component เดิมจากเทมเพลต)
- ทุกครั้งที่แอดมินเปิดดูข้อมูลผู้ใช้ → เขียน `audit_logs`

---

## 6. สัญญาฟังก์ชัน (Contracts)

### 6.1 `src/lib/habits/schema.ts`

```ts
export const habitInput = z.object({
  name:          z.string().trim().min(1).max(60),
  icon:          z.string().emoji().max(8).default('✅'),
  color:         z.enum(['emerald','blue','violet','amber','rose','cyan','lime','slate']),
  frequency:     z.enum(['daily','weekly']),
  targetPerDay:  z.number().int().min(1).max(20).default(1),
  daysPerWeek:   z.number().int().min(1).max(7).nullable(),
}).refine(
  (v) => v.frequency === 'weekly' ? v.daysPerWeek !== null : v.daysPerWeek === null,
  { path: ['daysPerWeek'] }
);

export const logInput = z.object({
  habitId: z.string().uuid(),
  date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),   // วันที่ใน timezone ของผู้ใช้
  count:   z.number().int().min(0).max(100),          // 0 = ลบ log
  note:    z.string().max(280).optional(),
});
```

### 6.2 `src/server/actions/habits.ts`

```ts
'use server';

createHabit(input: HabitInput):        Promise<{ id: string }>
  // 1. requireActiveSubscription()  2. เช็ค maxHabits ตามแผน  3. insert  4. revalidatePath

updateHabit(id: string, input: HabitInput):   Promise<void>
archiveHabit(id: string, archived: boolean):  Promise<void>
deleteHabit(id: string):                      Promise<void>
reorderHabits(ids: string[]):                 Promise<void>   // อัปเดตทีเดียวด้วย upsert

toggleHabitLog(input: LogInput): Promise<{ count: number }>
  // count = 0 → delete;  count > 0 → upsert onConflict('habit_id,logged_date')
  // ⚠️ ต้อง validate ว่า date อยู่ในช่วง [วันนี้-7, วันนี้] ตาม timezone ผู้ใช้
```

**ทุกตัวต้อง:** validate ด้วย zod → เช็ค auth → เช็ค ownership → mutate → `revalidatePath()`
**ห้าม** ส่ง `user_id` มาจาก client เด็ดขาด — อ่านจาก session ฝั่งเซิร์ฟเวอร์เท่านั้น

### 6.3 `src/server/queries/habits.ts`

```ts
getHabits(opts?: { includeArchived?: boolean }):  Promise<Habit[]>
getTodayView(date: string):                       Promise<HabitWithTodayLog[]>
getHabitById(id: string):                         Promise<Habit | null>
getHeatmapData(habitId: string, from: string, to: string): Promise<HeatmapCell[]>
getHabitStats(habitId: string):                   Promise<HabitStats>
getAdminHabitOverview(page: number, q?: string):  Promise<AdminRow[]>
```

### 6.4 `src/lib/habits/streak.ts` — pure function (ต้องมี unit test)

```ts
calcCurrentStreak(dates: string[], today: string, frequency: Frequency): number
calcLongestStreak(dates: string[], frequency: Frequency): number
calcCompletionRate(dates: string[], from: string, to: string): number
```
รับ input เป็น array ของ `YYYY-MM-DD` เรียงจากใหม่→เก่า ไม่แตะ database ไม่แตะ `new Date()` ข้างใน

---

## 7. สเปก Heatmap

| หัวข้อ | ข้อกำหนด |
|---|---|
| โครงสร้าง | CSS Grid `grid-flow-col` 7 แถว × N คอลัมน์ (1 คอลัมน์ = 1 สัปดาห์) |
| ระดับสี | 5 ระดับ: 0 = ว่าง, 1–4 ตามสัดส่วน `count / target_per_day` |
| ขนาดช่อง | desktop 12px, mobile 10px, gap 3px, `rounded-[2px]` |
| Mobile | แสดง 13 สัปดาห์ล่าสุด + scroll แนวนอน (ห้ามบีบให้ครบปีจนอ่านไม่ออก) |
| Label | ชื่อเดือนด้านบน, ชื่อวันด้านซ้าย (จ, พ, ศ / Mon, Wed, Fri) จาก i18n |
| วันเริ่มสัปดาห์ | อ่านจาก `profiles.week_start` |
| Tooltip | "15 ม.ค. 2569 · ทำแล้ว 2/3 ครั้ง" — Buddhist era เมื่อ locale = th |
| Accessibility | container `role="img"` + `aria-label` สรุปทั้งปี, ทุกช่องมี `title` |
| Performance | เตรียม grid ให้เสร็จฝั่งเซิร์ฟเวอร์ **ห้าม** ยิง query ต่อช่อง และห้ามใส่ state แยกต่อช่อง |
| วันว่าง | วันก่อนสร้าง habit แสดงเป็นสีจางกว่าระดับ 0 (แยกจาก "ไม่ได้ทำ") |

---

## 8. i18n

เพิ่ม namespace `habits` ใน `messages/th.json` และ `messages/en.json`

```
habits.title, habits.today, habits.empty.title, habits.empty.cta,
habits.form.name, habits.form.icon, habits.form.color, habits.form.frequency,
habits.frequency.daily, habits.frequency.weekly,
habits.stats.currentStreak, habits.stats.longestStreak,
habits.stats.totalDone, habits.stats.completionRate,
habits.heatmap.label, habits.heatmap.tooltip, habits.heatmap.less, habits.heatmap.more,
habits.limit.reached, habits.limit.upgrade,
habits.confirm.deleteTitle, habits.confirm.deleteBody,
habits.toast.created, habits.toast.updated, habits.toast.archived, habits.toast.deleted
```

**กฎการ format:**
- วันที่ทั้งหมดผ่าน helper กลางเท่านั้น — `th` ใช้ `'th-TH-u-ca-buddhist'`, `en` ใช้ `'en-US'`
- streak/จำนวนครั้ง ใช้ `t.rich()` หรือ ICU plural — **ห้ามต่อ string เอง**
- ชื่อวันสั้นใน heatmap ดึงจาก `Intl.DateTimeFormat(locale, { weekday: 'short' })` ไม่ hardcode

---

## 9. อีเมล

`emails/weekly-summary.tsx` — ส่งทุกวันจันทร์ 08:00 ตาม timezone ผู้ใช้

**เนื้อหา:** สรุปสัปดาห์ที่ผ่านมา (ทำได้กี่ % ต่อ habit), streak ที่ยาวที่สุดตอนนี้, ปุ่มกลับเข้าเว็บ

**Cron:** `vercel.json` → `/api/cron/weekly-summary` ยิงทุกชั่วโมง แล้ว handler เลือกเฉพาะผู้ใช้ที่ตอนนี้เป็นวันจันทร์ 08:00 ในโซนเวลาของเขา

```ts
// กันคนอื่นยิง cron endpoint
if (req.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`)
  return new Response('unauthorized', { status: 401 });
```

ส่งเฉพาะผู้ใช้ที่ **มี subscription active** + เปิดรับอีเมลไว้ + มี log อย่างน้อย 1 อันในสัปดาห์นั้น

---

## 10. จุดที่พังบ่อย (อ่านก่อนเขียนโค้ด)

| # | ปัญหา | วิธีแก้ |
|---|---|---|
| 1 | **Timezone** — server เป็น UTC ผู้ใช้ไทยกดติ๊กตอน 5 ทุ่ม กลายเป็นวันถัดไป | `logged_date` ต้องคำนวณจาก `profiles.timezone` เสมอ ผ่าน `lib/habits/date.ts` ที่เดียว **ห้ามเรียก `new Date().toISOString().slice(0,10)` ที่อื่นในโปรเจค** |
| 2 | **กดรัวซ้ำ** ทำให้ unique constraint ระเบิด | ใช้ `upsert(..., { onConflict: 'habit_id,logged_date' })` + disable ปุ่มระหว่าง pending |
| 3 | **Heatmap ยิง query 365 ครั้ง** | ดึง log ทั้งช่วงมาครั้งเดียว แล้วแปลงเป็น `Map<date, count>` ใน memory |
| 4 | **Streak ข้ามวัน DST / เดือนกุมภา** | คำนวณด้วยการเทียบ string `YYYY-MM-DD` และเดินทีละวัน ห้ามใช้ `date - 86400000` |
| 5 | **พ.ศ. ไม่ขึ้น** | ต้องใช้ locale string `'th-TH-u-ca-buddhist'` ไม่ใช่ `'th-TH'` เฉยๆ |
| 6 | **ซ่อนปุ่มแทนการเช็คสิทธิ์** | limit ต้องเช็คใน Server Action ด้วยเสมอ |
| 7 | **ลบ habit แล้ว log หาย** โดยผู้ใช้ไม่ทันตั้งตัว | default เป็น archive ไม่ใช่ delete; delete ต้องพิมพ์ชื่อยืนยัน |
| 8 | **`revalidatePath` ลืม locale** | ใช้ `revalidatePath('/[locale]/dashboard', 'page')` ไม่ใช่ `/dashboard` |

---

## 11. ลำดับเฟส + Acceptance

### Phase H1 — Schema + Query layer
**ทำ:** migration 0004 + 0005, regenerate types, `lib/habits/date.ts`, `streak.ts` + unit test, `server/queries/habits.ts`
**Acceptance:**
- [ ] `supabase db reset` ผ่าน ไม่มี error
- [ ] unit test ของ `streak.ts` ผ่านทุกเคส (รวมเคสเดือนกุมภา 29 วัน + ปีใหม่)
- [ ] เทส RLS: user A ยิง query ขอ habit ของ user B ได้ผลลัพธ์ว่าง ไม่ใช่ error
- [ ] `pnpm typecheck && pnpm lint && pnpm build` ผ่าน

### Phase H2 — Server Actions + CRUD UI
**ทำ:** `server/actions/habits.ts`, `habit-form-dialog.tsx`, หน้า `/dashboard/habits`
**Acceptance:**
- [ ] สร้าง/แก้/archive/ลบ habit ได้ครบ
- [ ] ส่ง input ผิด (ชื่อว่าง, ชื่อ 100 ตัวอักษร, สีนอกลิสต์) → ถูกปฏิเสธพร้อมข้อความภาษาที่ถูกต้อง
- [ ] สร้างเกิน `maxHabits` → error + upgrade prompt
- [ ] ยิง action ตรงๆ ด้วย habit id ของคนอื่น → ไม่สำเร็จ

### Phase H3 — หน้าวันนี้ + toggle
**ทำ:** `/dashboard/page.tsx`, `habit-card.tsx`, `toggleHabitLog`, optimistic UI
**Acceptance:**
- [ ] กดติ๊ก → UI เปลี่ยนทันทีก่อน server ตอบ
- [ ] กดรัว 10 ครั้งเร็วๆ → ข้อมูลไม่เพี้ยน ไม่มี error ใน console
- [ ] ตั้ง timezone เป็น `Pacific/Auckland` แล้วกดติ๊ก → `logged_date` ตรงกับวันในโซนนั้น
- [ ] บันทึกย้อนหลัง 8 วัน → ถูกปฏิเสธ

### Phase H4 — Heatmap + สถิติ
**ทำ:** `habit-heatmap.tsx`, `lib/habits/heatmap.ts`, หน้า `/dashboard/habits/[id]`
**Acceptance:**
- [ ] seed 400 วันแล้ว heatmap แสดงถูกต้อง ไม่เพี้ยนตอนขึ้นปีใหม่
- [ ] เปิด Network tab → query สำหรับ heatmap มีแค่ **1 ครั้ง**
- [ ] mobile 375px แสดง 13 สัปดาห์ + scroll ได้ ไม่ล้นจอ
- [ ] สลับ th/en → ชื่อเดือน/วัน และปี พ.ศ./ค.ศ. เปลี่ยนถูกต้อง **และ session ไม่หลุด**
- [ ] Keyboard tab เข้า heatmap ได้ + screen reader อ่าน aria-label รู้เรื่อง

### Phase H5 — Settings + อีเมล + Admin
**ทำ:** timezone/week_start ใน settings, `weekly-summary.tsx`, cron route, `/admin/habits`
**Acceptance:**
- [ ] เปลี่ยน timezone แล้วหน้า dashboard เปลี่ยน "วันนี้" ตาม
- [ ] ยิง cron endpoint ด้วยมือ → ได้อีเมลภาษาตรงกับ `profiles.locale`
- [ ] ยิง cron โดยไม่มี `CRON_SECRET` → 401
- [ ] แอดมินเปิดหน้า `/admin/habits` → มี record ใน `audit_logs`
- [ ] ผู้ใช้ธรรมดาเข้า `/admin/habits` → 404 หรือ redirect

### Phase H6 — E2E + สรุปผลทดสอบ
**ทำ:** Playwright: `signup → checkout → สร้าง habit → ติ๊ก → ดู heatmap`, เขียน `docs/template-gaps.md`
**Acceptance:**
- [ ] E2E ผ่านใน CI
- [ ] `docs/template-gaps.md` ระบุครบว่าระหว่างทางต้องแก้ไฟล์โครงสร้างไหนบ้าง เพราะอะไร

---

## 12. พรอมต์สำหรับสั่งงาน (copy ทีละเฟส)

### 🔹 พรอมต์เปิดงาน (ส่งครั้งเดียวตอนเริ่ม)

```
คุณกำลังต่อยอดจาก SaaS Starter Template ที่สร้างเสร็จแล้ว
(Next.js 14 App Router + TypeScript + Supabase + Stripe + Resend + next-intl)

อ่าน 3 ไฟล์นี้ก่อนเขียนโค้ดบรรทัดแรก:
- CONTEXT.md            ภาพรวมและข้อตัดสินใจของเทมเพลต
- BUILD-SPEC.md         RULES R1-R10 + CONVENTIONS (บังคับใช้ทั้งหมด ยกเว้น R1)
- FEATURE-SPEC-habit-tracker.md   สเปกของงานนี้

งาน: สร้างฟีเจอร์ Habit Tracker ทับลงบนเทมเพลต เพื่อทดสอบว่าเทมเพลตใช้งานได้จริง

ข้อบังคับเพิ่มเติมของงานนี้:
1. ห้ามแก้ middleware.ts, lib/supabase/*, lib/stripe/*, app/auth/*,
   app/api/stripe/webhook/* — ถ้าจำเป็นต้องแก้จริงๆ ให้ "หยุดถามก่อน"
   พร้อมอธิบายว่าเทมเพลตขาดอะไร
2. ทำทีละ Phase (H1 → H6) ห้ามข้าม ต้องผ่าน Acceptance ของเฟสนั้นก่อน
3. จบทุกเฟสต้องรัน pnpm typecheck && pnpm lint && pnpm test && pnpm build ให้ผ่าน
4. ตอบเป็นไฟล์พร้อม path เต็มเสมอ ไฟล์ไหนไม่เปลี่ยนไม่ต้องพิมพ์ซ้ำ
5. อ่านหมวด 10 "จุดที่พังบ่อย" ก่อนเขียนโค้ดทุกเฟส

ตอนนี้ยังไม่ต้องเขียนโค้ด — สรุปแผนของ Phase H1 ให้ดูก่อนว่าจะสร้างไฟล์อะไรบ้าง
```

### 🔹 Phase H1

```
เริ่ม Phase H1 — Schema + Query layer

สร้าง:
1. supabase/migrations/0004_habits.sql   ตามหมวด 2.1 ของสเปก
2. supabase/migrations/0005_habits_rls.sql  ตามหมวด 2.2
3. รัน db:types แล้วอัปเดต src/types/database.ts
4. src/lib/habits/date.ts
   - toUserDate(instant: Date, tz: string): string  → 'YYYY-MM-DD'
   - todayInTz(tz: string): string
   - eachDayBetween(from: string, to: string): string[]
   - isWithinBackfillWindow(date: string, today: string, days = 7): boolean
   ⚠️ ห้ามใช้เลขคณิต timestamp ในการเดินวัน ให้เดินทีละวันด้วย Date UTC + setUTCDate
5. src/lib/habits/streak.ts — pure function 3 ตัวตามหมวด 6.4
6. src/lib/habits/streak.test.ts — ครอบคลุมอย่างน้อย:
   ไม่มี log / ทำต่อเนื่อง 5 วัน / ขาด 1 วันตรงกลาง / ข้ามปีใหม่ /
   29 ก.พ. ปีอธิกสุรทิน / habit แบบ weekly ที่ทำ 3 วัน/สัปดาห์
7. src/server/queries/habits.ts ตามหมวด 6.3

ยังไม่ต้องทำ UI และยังไม่ต้องทำ Server Action
```

### 🔹 Phase H2

```
เริ่ม Phase H2 — Server Actions + CRUD UI

1. src/lib/habits/schema.ts ตามหมวด 6.1
2. src/config/plans.ts — เพิ่ม PLAN_LIMITS ตามหมวด 3
3. src/server/actions/habits.ts ตามหมวด 6.2
   ทุก action: zod → auth → requireActiveSubscription → ownership → mutate → revalidatePath
   createHabit ต้องเช็ค PLAN_LIMITS.maxHabits ฝั่งเซิร์ฟเวอร์
4. src/components/habits/habit-form-dialog.tsx  (react-hook-form + zodResolver)
   emoji picker แบบ preset 30 ตัว ไม่ต้องลง library เพิ่ม
5. src/app/[locale]/(app)/dashboard/habits/page.tsx
   ตาราง/การ์ด + สร้าง + แก้ + archive + delete(confirm พิมพ์ชื่อ) + drag reorder
6. เพิ่ม i18n keys ทั้งหมดลง messages/th.json และ en.json ให้ครบ ห้าม hardcode ข้อความ

หมายเหตุ: reorder ให้อัปเดตครั้งเดียวด้วย upsert array ไม่ใช่ loop update ทีละแถว
```

### 🔹 Phase H3

```
เริ่ม Phase H3 — หน้าวันนี้ + toggle log

1. toggleHabitLog ใน server/actions/habits.ts
   - count = 0 → delete, count > 0 → upsert onConflict 'habit_id,logged_date'
   - validate ว่า date อยู่ในหน้าต่าง 7 วันย้อนหลัง โดยอ้าง timezone จาก profiles
2. src/components/habits/habit-card.tsx ('use client')
   - useOptimistic + useTransition, disable ปุ่มระหว่าง pending
   - target_per_day > 1 → ปุ่ม +/- พร้อม progress ring
   - mini heatmap 30 วันในการ์ด
3. src/app/[locale]/(app)/dashboard/page.tsx
   - แถบสรุป "วันนี้ทำแล้ว x/y", ปุ่มเลื่อนวัน ← →, empty state
4. loading.tsx เป็น skeleton ที่หน้าตาใกล้ของจริง

ทดสอบเคสกดรัว 10 ครั้งติดกันแล้วยืนยันว่าข้อมูลไม่เพี้ยน
```

### 🔹 Phase H4

```
เริ่ม Phase H4 — Heatmap + หน้ารายละเอียด

1. src/lib/habits/heatmap.ts
   buildHeatmapGrid(logs, from, to, weekStart, targetPerDay) → { weeks, monthLabels, maxLevel }
   ดึง log ครั้งเดียวแล้วทำเป็น Map ใน memory ห้ามยิง query ต่อช่อง
2. src/components/habits/habit-heatmap.tsx — server component ตามสเปกหมวด 7
   CSS Grid, 5 ระดับสี, responsive 13 สัปดาห์บนมือถือ, role="img" + aria-label
3. habit-heatmap-cell.tsx — client เฉพาะ tooltip
   tooltip format วันที่ตาม locale (th ใช้ th-TH-u-ca-buddhist)
4. stats-summary.tsx — streak ปัจจุบัน/ยาวสุด/ทำไปแล้ว/อัตราสำเร็จ 30 วัน
5. กราฟแท่ง 12 เดือน (ใช้ recharts หรือ CSS bar ธรรมดาก็ได้ เลือกอันที่เบากว่า)
6. src/app/[locale]/(app)/dashboard/habits/[id]/page.tsx ประกอบทั้งหมด
   + จำกัดช่วงข้อมูลตาม PLAN_LIMITS.historyDays

เขียน script seed ข้อมูลสุ่ม 400 วันไว้ทดสอบด้วย (scripts/seed-habits.ts)
```

### 🔹 Phase H5

```
เริ่ม Phase H5 — Settings + Email + Admin

1. เพิ่มในหน้า settings เดิม: timezone dropdown, week_start, toggle รับอีเมลสรุป
   (server action updateProfilePreferences + zod)
2. src/emails/weekly-summary.tsx — React Email 2 ภาษา อ่าน locale จาก profiles
3. src/app/api/cron/weekly-summary/route.ts
   - เช็ค Bearer CRON_SECRET ก่อนทุกครั้ง
   - เลือกผู้ใช้ที่ตอนนี้เป็นวันจันทร์ 08:00 ในโซนเวลาของเขา
   - เฉพาะคนที่มี subscription active + เปิดรับอีเมล + มี log ในสัปดาห์นั้น
   - ส่งเป็น batch ไม่เกิน 100 คนต่อรอบ
4. vercel.json — cron ทุกชั่วโมง
5. src/app/[locale]/(admin)/admin/habits/page.tsx
   ตารางสถิติต่อผู้ใช้ + ค้นหา + pagination + เขียน audit_logs ทุกครั้งที่เปิดดู
```

### 🔹 Phase H6

```
เริ่ม Phase H6 — E2E + สรุปผลการทดสอบเทมเพลต

1. e2e/habit-flow.spec.ts (Playwright)
   signup → Stripe test checkout → สร้าง habit → ติ๊ก → เปิดหน้า detail เห็น heatmap
2. e2e/rls.spec.ts — user A ต้องไม่เห็นข้อมูล user B
3. อัปเดต .github/workflows/pr.yml ให้รัน e2e
4. สร้าง docs/template-gaps.md สรุป:
   - ไฟล์โครงสร้างที่ต้องแก้ระหว่างทาง (ถ้ามี) และเหตุผล
   - ของที่เทมเพลตควรมีแต่ไม่มี (เช่น date helper, cron wrapper, confirm dialog)
   - ของที่เทมเพลตมีแต่ไม่ได้ใช้เลย → พิจารณาตัดทิ้ง
   - เวลาที่ใช้จริงต่อเฟส เทียบกับที่คาดไว้

ไฟล์สุดท้ายนี้สำคัญที่สุด — เขียนให้ละเอียด
```

---

## 13. Definition of Done

- [ ] Phase H1–H6 ผ่าน Acceptance ครบ
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` ผ่านทั้งหมด
- [ ] ไม่มี `any` ในโค้ดใหม่ ไม่มีข้อความ hardcode ภาษา
- [ ] deploy Vercel preview แล้วใช้งานได้จริง (รวม Stripe test mode + cron)
- [ ] `docs/template-gaps.md` เขียนเสร็จ
- [ ] ตัดสินใจได้ว่าเทมเพลต **พร้อมใช้กับโปรเจคจริง** หรือ **ต้องแก้อะไรก่อน**
