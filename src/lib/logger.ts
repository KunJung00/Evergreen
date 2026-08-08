import 'server-only';

import * as Sentry from '@sentry/nextjs';

/**
 * Structured server-side logger (BUILD-SPEC §7, checklist "Structured logging").
 *
 * Emits one JSON line per event so logs are queryable in Vercel/any log drain,
 * and forwards `warn`/`error` to Sentry when a DSN is configured. Never import
 * this in a Client Component — it is `server-only`.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = Record<string, unknown>;

function emit(level: LogLevel, message: string, context?: LogContext): void {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...context,
  };

  // Structured single-line JSON — parseable by log drains.
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') emit('debug', message, context);
  },
  info(message: string, context?: LogContext): void {
    emit('info', message, context);
  },
  warn(message: string, context?: LogContext): void {
    emit('warn', message, context);
    Sentry.captureMessage(message, { level: 'warning', extra: context });
  },
  /**
   * Log an error. Pass the caught value as `error`; anything else goes in
   * `context`. Forwards the real Error object to Sentry for a full stack trace.
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    emit('error', message, {
      ...context,
      error: error instanceof Error ? { name: error.name, message: error.message } : error,
    });
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: { message, ...context } });
    } else {
      Sentry.captureMessage(message, { level: 'error', extra: { error, ...context } });
    }
  },
};
