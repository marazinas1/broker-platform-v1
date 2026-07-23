import { createFileRoute, redirect } from "@tanstack/react-router";

import { getSiteSettings } from "@/lib/config/site-settings.functions";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const settings = await getSiteSettings();
    throw redirect({ to: "/$locale", params: { locale: settings.default_locale } });
  },
  component: () => null,
});
