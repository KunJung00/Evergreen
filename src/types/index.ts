/**
 * Shared Server Action result type (BUILD-SPEC §2 CONVENTIONS).
 * Server Actions return this shape instead of throwing to the client.
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
