// Permission matrix and pure hasPermission check.
// Client-side checks hide UI only; every mutation must re-verify server-side.

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

// Rows transcribed from the spec matrix; T=allowed, F=denied unless overridden.
export const PERMISSION_MATRIX: Record<PermissionKey, Record<Role, boolean>> = {
  "listing.create":        { owner: true,  admin: true,  agent: true,  assistant: true,  viewer: false },
  "listing.edit.own":      { owner: true,  admin: true,  agent: true,  assistant: true,  viewer: false },
  "listing.edit.any":      { owner: true,  admin: true,  agent: false, assistant: false, viewer: false },
  "listing.publish":       { owner: true,  admin: true,  agent: true,  assistant: false, viewer: false },
  "listing.delete":        { owner: true,  admin: true,  agent: false, assistant: false, viewer: false },
  "listing.status.change": { owner: true,  admin: true,  agent: true,  assistant: false, viewer: false },
  "inquiry.view.own":      { owner: true,  admin: true,  agent: true,  assistant: true,  viewer: true  },
  "inquiry.view.any":      { owner: true,  admin: true,  agent: false, assistant: true,  viewer: true  },
  "inquiry.assign":        { owner: true,  admin: true,  agent: false, assistant: true,  viewer: false },
  "user.invite":           { owner: true,  admin: true,  agent: false, assistant: false, viewer: false },
  "user.manage":           { owner: true,  admin: true,  agent: false, assistant: false, viewer: false },
  "settings.edit":         { owner: true,  admin: true,  agent: false, assistant: false, viewer: false },
  "design.edit":           { owner: true,  admin: false, agent: false, assistant: false, viewer: false },
  "content.edit":          { owner: true,  admin: true,  agent: false, assistant: true,  viewer: false },
  "analytics.view.own":    { owner: true,  admin: true,  agent: true,  assistant: false, viewer: true  },
  "analytics.view.any":    { owner: true,  admin: true,  agent: false, assistant: false, viewer: true  },
};

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
 * Inactive users fail every check.
 */
export function hasPermission(
  profile: PermissionProfile | null | undefined,
  overrides: readonly PermissionOverride[],
  key: PermissionKey,
): boolean {
  if (!profile || !profile.is_active) return false;
  const override = overrides.find((o) => o.permission_key === key);
  if (override) return override.granted;
  return PERMISSION_MATRIX[key][profile.role] ?? false;
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}
