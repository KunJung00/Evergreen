import { z } from 'zod';

/**
 * Admin input schemas (R4). Validation messages are i18n keys resolved under
 * `admin.errors.*` on the client (R8).
 */

export const userRoleSchema = z.enum(['user', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const updateRoleSchema = z.object({
  userId: z.string().uuid({ message: 'invalidUser' }),
  role: userRoleSchema,
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
