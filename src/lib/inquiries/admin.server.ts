// Server-only helpers for the admin inquiries section.
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Reading inquiries requires either global or own-scope view permission.
 * RLS narrows the rows; this assertion keeps the endpoint itself gated.
 */
export async function assertCanViewInquiries(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data: any_ } = await supabase.rpc("current_user_has_permission", {
    _key: "inquiry.view.any",
  });
  if (any_ === true) return;
  const { assertPermission } = await import("@/lib/auth/require-permission.server");
  await assertPermission(supabase, userId, "inquiry.view.own");
}

/**
 * Seller submissions live in a PRIVATE bucket. We never expose public URLs —
 * short-lived signed URLs are minted server-side after the caller has been
 * permission-checked and RLS confirmed they can read the inquiry.
 */
export async function signSellerPhotos(paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage
    .from("seller-photos")
    .createSignedUrls(paths, 60 * 10);
  if (error) {
    console.error("[inquiries] signing seller photos failed", error.message);
    return [];
  }
  return (data ?? [])
    .map((d) => d.signedUrl)
    .filter((u): u is string => typeof u === "string" && u.length > 0);
}
