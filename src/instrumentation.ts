/**
 * Next.js instrumentation hook — loads the correct Sentry config per runtime.
 * See BUILD-SPEC §9 (Observability). No-ops without a DSN (see sentry.*.config.ts).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

// Forwards nested React Server Component errors to Sentry (called by Next when supported).
export { captureRequestError as onRequestError } from '@sentry/nextjs';
