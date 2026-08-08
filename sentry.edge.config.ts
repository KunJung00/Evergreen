import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Runs in the edge runtime (middleware, edge routes).
Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: 1,
  debug: false,
});
