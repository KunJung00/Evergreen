import type { ZodError } from 'zod';

/**
 * Flatten a ZodError into the `fieldErrors` shape used by `ActionResult`
 * (BUILD-SPEC §2). Version-stable: reads `error.issues` directly.
 */
export function toFieldErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_';
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}
