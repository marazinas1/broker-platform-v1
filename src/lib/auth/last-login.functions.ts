// Server function: update profiles.last_login_at for the authenticated user.
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const updateLastLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) {
      console.error("[last-login] update failed", error.message);
      return { ok: false as const };
    }
    return { ok: true as const };
  });
