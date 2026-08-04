import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/admin/listings")({
  component: () => <Outlet />,
});
