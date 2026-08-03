import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { verifyAdminAccess } from "@/lib/auth/admin-gate.functions";
import { permissionMatrixQueryOptions } from "@/lib/auth/permission-matrix.functions";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/$locale/admin")({
  // Client-only gate: the Supabase session lives in localStorage, which the
  // server cannot read, so gating during SSR would loop back to login on every
  // hard refresh. The gate confirms a real session, then verifies the profile
  // server-side (bearer token validated by requireSupabaseAuth).
  ssr: false,
  beforeLoad: async ({ params, location }) => {
    const toLogin = (reason?: string) =>
      redirect({
        to: "/$locale/auth/login",
        params: { locale: params.locale },
        search: { redirect: location.href, ...(reason ? { error: reason } : {}) },
      });

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw toLogin();

    let profile: Awaited<ReturnType<typeof verifyAdminAccess>> = null;
    try {
      profile = await verifyAdminAccess();
    } catch {
      throw toLogin("gate");
    }
    if (!profile) throw toLogin("noaccess");

    return { adminProfile: profile };
  },
  loader: async ({ context }) => {
    // Preload the authoritative role matrix so the admin shell can resolve
    // permissions synchronously via useSuspenseQuery.
    await context.queryClient.ensureQueryData(permissionMatrixQueryOptions);
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { adminProfile } = Route.useRouteContext();
  return (
    <AdminShell profile={adminProfile}>
      <Outlet />
    </AdminShell>
  );
}
