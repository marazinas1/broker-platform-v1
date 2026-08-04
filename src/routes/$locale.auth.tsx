import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/auth")({
  component: AuthLayout,
});

/**
 * The auth subtree owns its own full-bleed layout: the sign-in screen is a
 * two-column split, the password screens centre a paper card.
 */
function AuthLayout() {
  return <Outlet />;
}
