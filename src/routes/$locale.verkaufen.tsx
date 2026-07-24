import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { PublicChrome } from "@/components/public/PublicChrome";
import type { Locale } from "@/i18n/config";
import { translate } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { getRequestOrigin } from "@/lib/seo/origin.functions";
import { buildHead } from "@/lib/seo/build-head";

export const Route = createFileRoute("/$locale/verkaufen")({
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
    const title = `${translate(locale, "pages.selling.title")} — ${settings.site_name}`;
    return buildHead({
      origin,
      path: `/${locale}/verkaufen`,
      locale,
      enabledLocales: settings.enabled_locales,
      defaultLocale: settings.default_locale,
      title,
      description: translate(locale, "pages.selling.meta_description"),
      siteName: settings.site_name,
      ogDefaultImage: settings.og_default_image,
    });
  },
  component: SellingPage,
});

type Step = { title: string; body: string };

function SellingPage() {
  const { locale } = Route.useParams();
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const steps = t("pages.selling.steps", { returnObjects: true }) as Step[];

  return (
    <PublicChrome locale={locale as Locale} settings={settings}>
      <section className="mx-auto max-w-[1400px] px-6 pt-24 lg:px-10">
        <div className="max-w-3xl">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("pages.selling.kicker")}
          </div>
          <h1 className="mt-6 font-heading text-4xl leading-[1.05] md:text-6xl">
            {t("pages.selling.headline")}
          </h1>
          <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
            {t("pages.selling.intro")}
          </p>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1400px] px-6 lg:px-10">
        <ol className="border-t border-border">
          {steps.map((s, i) => (
            <li key={i} className="grid grid-cols-1 gap-6 border-b border-border py-12 md:grid-cols-12">
              <div className="md:col-span-3">
                <div className="font-sans text-4xl tabular-figures text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mt-3 font-heading text-2xl md:text-3xl">{s.title}</div>
              </div>
              <div className="md:col-span-9">
                <p className="max-w-2xl text-base leading-relaxed text-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-32 max-w-[1400px] px-6 pb-32 lg:px-10">
        <div className="border-t border-border pt-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            <div className="md:col-span-7">
              <h2 className="font-heading text-3xl leading-[1.05] md:text-5xl">
                {t("pages.selling.cta_title")}
              </h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
                {t("pages.selling.cta_body")}
              </p>
            </div>
            <div className="flex md:col-span-5 md:items-end md:justify-end">
              <Link
                to="/$locale/immobilienbewertung"
                params={{ locale }}
                className="inline-flex h-12 items-center justify-center bg-foreground px-8 text-[11px] uppercase tracking-[0.18em] text-background transition-opacity duration-300 hover:opacity-85"
              >
                {t("pages.selling.cta_button")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}
