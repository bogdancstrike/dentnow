/** Effective permissions from GET /api/v1/admin/me. Backend enforcement is authoritative;
 *  the frontend mirrors these only for usability (hiding routes/actions).
 */
import { z } from 'zod';

export const MeSchema = z.object({
  subject: z.string(),
  username: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  roles: z.array(z.string()).default([]),
  capabilities: z.array(z.string()).default([]),
  clinic_scopes: z.array(z.string()).default([]),
  is_admin: z.boolean().default(false),
  is_clinic_scoped: z.boolean().default(false),
});

export type Me = z.infer<typeof MeSchema>;

export const CAP = {
  contentRead: 'content:read',
  contentWrite: 'content:write',
  preview: 'preview',
  validate: 'publication:validate',
  publish: 'publish',
  attest: 'attestation:approve',
  restore: 'workspace:restore',
  audit: 'audit:read',
  manageScopes: 'clinic_scopes:manage',
  analytics: 'analytics:read',
} as const;

export function can(me: Me | null, capability: string): boolean {
  return !!me && me.capabilities.includes(capability);
}
