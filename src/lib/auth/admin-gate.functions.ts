// Server-side gate used by the admin route layout. Performs genuine session
// verification: validates the Supabase access token, loads the caller's
// profile, and enforces is_active. Returns the verified profile so the admin
// shell can render name/role without a second lookup.
import { createServerFn } from "@tanstack/react-start";

import type { VerifiedAdminProfile } from "./admin-gate.server";

export const verifyAdminAccess = createServerFn({ method: "GET" }).handler(
  async (): Promise<VerifiedAdminProfile | null> => {
    const { verifyAdminSession } = await import("./admin-gate.server");
    return verifyAdminSession();
  },
);
