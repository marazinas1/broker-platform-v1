import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/admin/settings/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$locale/admin/settings/$tab",
      params: { locale: params.locale, tab: "general" },
    });
  },
});
