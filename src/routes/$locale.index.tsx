import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { translate, type Locale } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { getRequestOrigin } from "@/lib/seo/origin.functions";
import { buildHead } from "@/lib/seo/build-head";

export const Route = createFileRoute("/$locale/")({
  loader: async ({ context, params }) => {
    const [settings, origin] = await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQueryOptions),
      getRequestOrigin(),
    ]);
    return { settings, origin, locale: params.locale as Locale };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "…" }] };
    const { settings, origin, locale } = loaderData;
    const title = `${translate(locale, "home.title")} — ${settings.site_name}`;
    const description = translate(locale, "home.description");
    return buildHead({
      origin,
      path: `/${locale}`,
      locale,
      enabledLocales: settings.enabled_locales,
      defaultLocale: settings.default_locale,
      title,
      description,
      siteName: settings.site_name,
      ogDefaultImage: settings.og_default_image,
      ogType: "website",
    });
  },
  component: HomePage,
  errorComponent: ({ error }) => {
    const { locale } = Route.useParams();
    return (
      <div className="p-8 text-sm text-destructive">
        {translate(locale as Locale, "errors.loadFailed").replace(
          "{{message}}",
          error.message,
        )}
      </div>
    );
  },
  notFoundComponent: () => {
    const { locale } = Route.useParams();
    return (
      <div className="p-8 text-sm">
        {translate(locale as Locale, "errors.notFound")}
      </div>
    );
  },
});

function HomePage() {
  const { locale } = Route.useParams();
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-foreground">
      <h1 className="font-heading text-3xl font-semibold">
        {t("setup.complete")}
      </h1>
      <LocaleSwitcher
        currentLocale={locale}
        enabledLocales={settings.enabled_locales}
      />
    </main>
  );
}
