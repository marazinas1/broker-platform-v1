// Server-only: detect whether the incoming request carries a Supabase auth cookie.
// Used to avoid an authenticated Supabase roundtrip for anonymous visitors on public pages.
import { getRequest } from "@tanstack/react-start/server";

// Supabase JS stores session under keys like `sb-<ref>-auth-token`.
const SUPABASE_AUTH_COOKIE_RE = /(?:^|;\s*)sb-[^=;\s]+-auth-token(?:\.\d+)?=/;

export function hasSupabaseSessionCookie(): boolean {
  const request = getRequest();
  const cookieHeader = request?.headers.get("cookie");
  if (!cookieHeader) return false;
  return SUPABASE_AUTH_COOKIE_RE.test(cookieHeader);
}
