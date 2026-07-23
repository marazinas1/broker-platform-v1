// Server-side permission assertion. Use inside privileged createServerFn
// handlers together with requireSupabaseAuth middleware. Throws a 403 Response
// when the caller lacks the permission.
import type { SupabaseClient } from "@supabase/supabase-js";

import { hasPermission, isRole, type PermissionKey } from "./permissions";

export async function assertPermission(
  supabase: SupabaseClient,
  userId: string,
  key: PermissionKey,
): Promise<void> {
  const [{ data: profile, error: profileError }, { data: overrides, error: permsError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("permissions")
        .select("permission_key, granted")
        .eq("profile_id", userId),
    ]);

  if (profileError || permsError || !profile || !isRole(profile.role)) {
    throw new Response("Forbidden", { status: 403 });
  }

  const allowed = hasPermission(
    { role: profile.role, is_active: profile.is_active },
    overrides ?? [],
    key,
  );

  if (!allowed) throw new Response("Forbidden", { status: 403 });
}
