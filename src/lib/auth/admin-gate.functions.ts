// Server-side gate used by the admin route layout. Returns true iff a Supabase
// auth cookie is present on the request; the shell then trusts the client's
// current-user query for identity/role rendering. This avoids a blank client
// render for signed-in visitors on mobile and keeps SSR on for admin routes.
import { createServerFn } from "@tanstack/react-start";

export const hasAdminSessionCookie = createServerFn({ method: "GET" }).handler(
  async (): Promise<boolean> => {
    const { hasSupabaseSessionCookie } = await import("./session-cookie.server");
    return hasSupabaseSessionCookie();
  },
);
