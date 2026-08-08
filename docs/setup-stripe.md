# Setup: Stripe

> ⚠️ **Billing is currently a UI shell with a stubbed entitlement**
> (`src/lib/stripe/entitlement.ts` grants every authenticated user an active plan).
> See [template-gaps.md](./template-gaps.md). This guide describes the intended wiring
> for when billing is completed (BUILD-SPEC Phase 6).

## 1. Create products & prices

1. In the [Stripe Dashboard](https://dashboard.stripe.com) (test mode), create a product
   with **monthly** and **yearly** recurring prices (THB).
2. Copy the two price IDs into your env:
   ```bash
   NEXT_PUBLIC_STRIPE_PRICE_MONTHLY="price_..."
   NEXT_PUBLIC_STRIPE_PRICE_YEARLY="price_..."
   ```
   These are mapped in `src/config/plans.ts`.

## 2. API keys

```bash
STRIPE_SECRET_KEY="sk_test_..."
```

## 3. Webhook

The webhook route handler is `src/app/api/stripe/webhook/*` (a locked structural file;
it is the only mutation allowed outside a Server Action, per R3).

**Local:**
```bash
pnpm stripe:listen
# copy the printed "whsec_..." into STRIPE_WEBHOOK_SECRET
```

**Production:** add an endpoint at `https://<domain>/api/stripe/webhook` for the events
you handle (e.g. `checkout.session.completed`, `customer.subscription.*`,
`invoice.payment_failed`) and set `STRIPE_WEBHOOK_SECRET`.

The handler must be **idempotent** (safe to receive the same event twice) and reject
requests with an invalid signature (400).

## 4. Test the flow

With `pnpm stripe:listen` running: checkout → a row appears in `subscriptions` with
status `active`; cancel in the customer portal → `cancel_at_period_end = true`.
