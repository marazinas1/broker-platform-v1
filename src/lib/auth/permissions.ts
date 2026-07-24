// Types and pure permission check. The role matrix itself lives in the
// database (public.role_permissions) as the single source of truth. Server
// code should prefer the SQL helper `current_user_has_permission(text)`;
// client code loads the matrix via getPermissionMatrix and passes it to
// hasPermission(), which stays pure and unit-testable.

export type Role = "owner" | "admin" | "agent" | "assistant" | "viewer";

export const ROLES: readonly Role[] = [
  "owner",
  "admin",
  "agent",
  "assistant",
  "viewer",
] as const;

export type PermissionKey =
  | "listing.create"
  | "listing.edit.own"
  | "listing.edit.any"
  | "listing.publish"
  | "listing.delete"
  | "listing.status.change"
  | "inquiry.view.own"
  | "inquiry.view.any"
  | "inquiry.assign"
  | "user.invite"
  | "user.manage"
  | "settings.edit"
  | "design.edit"
  | "content.edit"
  | "analytics.view.own"
  | "analytics.view.any";

export type PermissionMatrix = Record<PermissionKey, Record<Role, boolean>>;

export interface PermissionOverride {
  permission_key: string;
  granted: boolean;
}

export interface PermissionProfile {
  role: Role;
  is_active: boolean;
}

/**
 * Pure permission check. Overrides win over the role matrix.
 * Inactive users fail every check. The matrix argument is loaded from the
 * database — it is the single source of truth.
 */
export function hasPermission(
  profile: PermissionProfile | null | undefined,
  overrides: readonly PermissionOverride[],
  key: PermissionKey,
  matrix: PermissionMatrix | null | undefined,
): boolean {
  if (!profile || !profile.is_active) return false;
  const override = overrides.find((o) => o.permission_key === key);
  if (override) return override.granted;
  if (!matrix) return false;
  return matrix[key]?.[profile.role] ?? false;
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
