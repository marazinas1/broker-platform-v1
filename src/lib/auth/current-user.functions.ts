// Server functions + query options for the current authenticated user.
// Public routes call `getCurrentUserIfSignedIn`, which short-circuits to null
// for anonymous visitors so no authenticated Supabase RPC is issued.
import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PermissionOverride, Role } from "./permissions";
import { isRole } from "./permissions";

export interface CurrentUserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
  avatar_url: string | null;
  public_photo_url: string | null;
}

export interface CurrentUser {
  profile: CurrentUserProfile;
  overrides: PermissionOverride[];
}

const PROFILE_COLUMNS =
  "id, email, full_name, role, is_active, avatar_url, public_photo_url";

/** Authenticated fast path: loads the caller's profile + permission overrides. */
export const getCurrentUserWithPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CurrentUser | null> => {
    const { supabase, userId } = context;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[current-user] profile load failed", profileError.message);
      return null;
    }
    if (!profile || !isRole(profile.role)) return null;

    const { data: overrides, error: permsError } = await supabase
      .from("permissions")
      .select("permission_key, granted")
      .eq("profile_id", userId);

    if (permsError) {
      console.error("[current-user] overrides load failed", permsError.message);
      return { profile: profile as CurrentUserProfile, overrides: [] };
    }

    return {
      profile: profile as CurrentUserProfile,
      overrides: (overrides ?? []) as PermissionOverride[],
    };
  });

/**
 * Public-route safe entry point: returns null immediately for anonymous
 * visitors (no Supabase auth cookie present), avoiding an authenticated RPC.
 */
export const getCurrentUserIfSignedIn = createServerFn({ method: "GET" }).handler(
  async (): Promise<CurrentUser | null> => {
    const { hasSupabaseSessionCookie } = await import("./session-cookie.server");
    if (!hasSupabaseSessionCookie()) return null;
    try {
      return await getCurrentUserWithPermissions();
    } catch (err) {
      // Expired/invalid session — treat as anonymous rather than surfacing an error.
      console.warn(
        "[current-user] auth attempt failed, treating as anonymous:",
        err instanceof Error ? err.message : err,
      );
      return null;
    }
  },
);

export const currentUserQueryOptions = queryOptions({
  queryKey: ["current-user"] as const,
  queryFn: () => getCurrentUserIfSignedIn(),
  staleTime: 60_000,
});
