/** Roles this app supports, and the helpers to branch on them. Mirrors
 * clearearth-backend's INSPECTION_ROLES / web's INSPECTION_ROLE_NAMES. */
export const INSPECTION_ROLE_NAMES = ['inspection_team', 'inspection'] as const;

export type AppRole = 'driver' | 'inspection_team' | 'inspection';

export function isInspectionRole(role?: string | null): boolean {
  return !!role && (INSPECTION_ROLE_NAMES as readonly string[]).includes(role);
}

export function isSupportedRole(role?: string | null): boolean {
  return role === 'driver' || isInspectionRole(role);
}
