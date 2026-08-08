import { env } from '@/env';

/**
 * Per-plan entitlement limits (FEATURE-SPEC §3). Keyed by billing interval,
 * matching `subscriptions.interval` (`month` | `year`).
 */
export const PLAN_LIMITS = {
  month: { maxHabits: 10, historyDays: 90 },
  year: { maxHabits: 50, historyDays: 3650 },
} as const;

export type PlanInterval = keyof typeof PLAN_LIMITS;

export function getPlanLimits(interval: PlanInterval) {
  return PLAN_LIMITS[interval];
}

/**
 * Pricing display data (BUILD-SPEC §7). `priceId`s come from env so the
 * pricing page always reflects whatever Stripe price the deployment is
 * configured with — but no checkout session is ever created from this UI
 * shell (see docs/template-gaps.md).
 */
export const PLANS = [
  {
    id: 'pro',
    prices: {
      month: { priceId: env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY, amount: 299, currency: 'THB' },
      year: { priceId: env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY, amount: 2990, currency: 'THB' },
    },
    featureKeys: ['feature1', 'feature2', 'feature3', 'feature4'],
  },
] as const;

export type Plan = (typeof PLANS)[number];

export function getPlanByPriceId(priceId: string): Plan | undefined {
  return PLANS.find((p) => p.prices.month.priceId === priceId || p.prices.year.priceId === priceId);
}

/** % saved on the yearly plan vs. paying monthly for 12 months. */
export function yearlySavingsPercent(plan: Plan): number {
  const monthlyTotal = plan.prices.month.amount * 12;
  return Math.round(((monthlyTotal - plan.prices.year.amount) / monthlyTotal) * 100);
}
