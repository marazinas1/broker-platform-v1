import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

import { hasAdminSessionCookie } from "@/lib/auth/admin-gate.functions";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/$locale/admin")({
  // SSR-safe gate: server-side check via request cookies; unauthenticated
  // visitors receive a 3xx redirect in the SSR response, not a client bounce.
  beforeLoad: async ({ params, location }) => {
    const signedIn = await hasAdminSessionCookie();
    if (!signedIn) {
      throw redirect({
        to: "/$locale/auth/login",
        params: { locale: params.locale },
        search: { redirect: location.href },
      });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
