import 'server-only';

import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { requireAuth } from '@/lib/auth/require-auth';
import { createClient } from '@/lib/supabase/server';
import type { Subscription } from '@/types';

/**
 * Entitlement layer (BUILD-SPEC §7 module contract). Billing checkout/portal/
 * webhook aren't built this round (see docs/template-gaps.md) — real Stripe
 * subscription rows never get created — so this is deliberately stubbed to
 * grant every authenticated user an active monthly-tier plan. That keeps the
 * shape of the contract real (still queries `subscriptions`, still gates
 * `/dashboard/*`) while letting the Habit Tracker feature and its
 * `PLAN_LIMITS` enforcement be built and tested end-to-end without live
 * Stripe. Swap `STUB_ACTIVE_SUBSCRIPTION` for a real `subscriptions` lookup
 * once checkout is wired up — no caller of these functions needs to change.
 */
const STUB_TIER_PRICE_ID = 'stub_monthly';

function stubSubscriptionFor(userId: string): Subscription {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);

  return {
    id: `stub_sub_${userId}`,
    user_id: userId,
    status: 'active',
    price_id: STUB_TIER_PRICE_ID,
    interval: 'month',
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: false,
    canceled_at: null,
    trial_end: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Real row found (e.g. seeded manually) wins; otherwise fall back to the stub.
  return data ?? stubSubscriptionFor(userId);
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getSubscription(userId);
  return subscription?.status === 'active' || subscription?.status === 'trialing';
}

/** Requires auth, then redirects to `/pricing` if the caller has no active subscription. */
export async function requireActiveSubscription(): Promise<Subscription> {
  const user = await requireAuth();
  const subscription = await getSubscription(user.id);
  if (!subscription || (subscription.status !== 'active' && subscription.status !== 'trialing')) {
    const locale = await getLocale();
    const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
    redirect(`${prefix}/pricing`);
  }
  return subscription;
}
