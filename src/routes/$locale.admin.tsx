import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

import { verifyAdminAccess } from "@/lib/auth/admin-gate.functions";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/$locale/admin")({
  // SSR-safe gate: verifies the Supabase access token server-side and
  // confirms the caller's profile is active. Unauthenticated or deactivated
  // requests receive a 3xx redirect in the SSR response — no admin HTML is
  // rendered for fabricated cookies, and expired sessions never see an
  // empty shell.
  beforeLoad: async ({ params, location }) => {
    const profile = await verifyAdminAccess();
    if (!profile) {
      throw redirect({
        to: "/$locale/auth/login",
        params: { locale: params.locale },
        search: { redirect: location.href },
      });
    }
    return { adminProfile: profile };
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
