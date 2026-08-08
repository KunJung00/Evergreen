import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Browser-side Sentry (Next.js `instrumentation-client` convention).
// No-op when no DSN is configured.
Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  replaysSessionSampleRate: 0,
  debug: false,
});

// Instruments client-side navigations for tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
