import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// No-op when no DSN is set (local/CI) — Sentry.init with enabled:false is safe.
Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: 1,
  debug: false,
});
