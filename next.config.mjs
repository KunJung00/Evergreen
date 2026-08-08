import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Security headers (BUILD-SPEC §13). The CSP uses `'unsafe-inline'` because a
 * nonce-based policy would require rewriting `src/middleware.ts` (a locked
 * structural file per FEATURE-SPEC §0). `'unsafe-eval'` is dev-only for HMR.
 * connect/frame sources are opened for Supabase, Stripe, Sentry and Vercel.
 */
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://va.vercel-scripts.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' data:`,
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://vitals.vercel-insights.com`,
  `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

const sentryOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only upload source maps when an auth token is present (CI/production).
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Strip Sentry's own debug logging from the client bundle.
  webpack: { treeshake: { removeDebugLogging: true } },
  // Route Sentry requests through the app to dodge ad-blockers.
  tunnelRoute: '/monitoring',
};

export default withSentryConfig(withNextIntl(nextConfig), sentryOptions);
