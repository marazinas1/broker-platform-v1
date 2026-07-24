import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { PublicChrome } from "@/components/public/PublicChrome";
import { ListingCard } from "@/components/public/ListingCard";
import type { Locale } from "@/i18n/config";
import { translate } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import {
  featuredListingsQueryOptions,
  recentSoldQueryOptions,
} from "@/lib/listings/queries.functions";
import { getRequestOrigin } from "@/lib/seo/origin.functions";
import { buildHead } from "@/lib/seo/build-head";
import { pickImageUrl } from "@/lib/listings/image";

export const Route = createFileRoute("/$locale/")({
  loader: async ({ context, params }) => {
    const [settings, origin] = await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQueryOptions),
      getRequestOrigin(),
      context.queryClient.ensureQueryData(featuredListingsQueryOptions),
      context.queryClient.ensureQueryData(recentSoldQueryOptions),
    ]);
    return { settings, origin, locale: params.locale as Locale };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "…" }] };
    const { settings, origin, locale } = loaderData;
    const title = `${translate(locale, "home.title")} — ${settings.site_name}`;
    return buildHead({
      origin,
      path: `/${locale}`,
      locale,
      enabledLocales: settings.enabled_locales,
      defaultLocale: settings.default_locale,
      title,
      description: translate(locale, "home.description"),
      siteName: settings.site_name,
      ogDefaultImage: settings.og_default_image,
      ogType: "website",
    });
  },
  component: HomePage,
});

function HomePage() {
  const { locale } = Route.useParams();
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const { data: featured } = useSuspenseQuery(featuredListingsQueryOptions);
  const { data: sold } = useSuspenseQuery(recentSoldQueryOptions);
  const heroImg =
    featured.items[0] && pickImageUrl(featured.items[0].images[0]?.variants, "large");

  return (
    <PublicChrome locale={locale as Locale} settings={settings}>
      {/* Hero */}
      <section className="relative">
        <div className="relative h-[78vh] w-full overflow-hidden bg-muted md:h-[86vh]">
          {heroImg ? (
            <img
              src={heroImg}
              alt=""
              className="h-full w-full object-cover"
              fetchPriority="high"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1400px] px-6 pb-16 lg:px-10 lg:pb-24">
            <h1 className="max-w-3xl font-heading text-4xl leading-[1.05] text-white md:text-6xl lg:text-7xl">
              {t("home.hero_line")}
            </h1>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-[1400px] px-6 pt-24 lg:px-10">
        <div className="mb-12 flex items-end justify-between">
          <h2 className="font-heading text-3xl md:text-4xl">{t("home.featured")}</h2>
          <Link
            to="/$locale/immobilien"
            params={{ locale }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t("home.view_all")} →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2">
          {featured.items.map((l) => (
            <ListingCard key={l.id} listing={l} locale={locale as Locale} settings={settings} />
          ))}
        </div>
      </section>

      {/* Recent sold strip */}
      {sold.items.length > 0 ? (
        <section className="mx-auto mt-32 max-w-[1400px] px-6 lg:px-10">
          <div className="mb-10 max-w-2xl">
            <h2 className="font-heading text-3xl md:text-4xl">{t("home.recent_sales")}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{t("home.recent_sales_intro")}</p>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {sold.items.slice(0, 3).map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                locale={locale as Locale}
                settings={settings}
                size="compact"
              />
            ))}
          </div>
          <div className="mt-8">
            <Link
              to="/$locale/verkauft"
              params={{ locale }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("home.view_all_sold")} →
            </Link>
          </div>
        </section>
      ) : null}

      {/* Areas */}
      <section className="mx-auto mt-32 max-w-[1400px] px-6 lg:px-10">
        <h2 className="font-heading text-3xl md:text-4xl">{t("home.areas")}</h2>
        <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
          {(["fohnsdorf", "judenburg", "knittelfeld", "zeltweg"] as const).map((a) => (
            <Link
              key={a}
              to="/$locale/immobilien"
              params={{ locale }}
              search={{
                deal: "",
                type: "",
                city: t(`areas.${a}`),
                rooms_min: 0,
                price_min: 0,
                price_max: 0,
                area_min: 0,
                sort: "newest",
                page: 1,
                view: "grid",
              }}
              className="group border-t border-border pt-4 hover:opacity-80"
            >
              <div className="font-heading text-2xl md:text-3xl">{t(`areas.${a}`)}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* About + Contact */}
      <section className="mx-auto mt-32 grid max-w-[1400px] grid-cols-1 gap-16 px-6 pb-24 md:grid-cols-2 lg:px-10">
        <div>
          <h2 className="font-heading text-3xl md:text-4xl">{t("home.about")}</h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            {t("home.about_body")}
          </p>
        </div>
        <div>
          <h2 className="font-heading text-3xl md:text-4xl">{t("home.contact")}</h2>
          <div className="mt-6 space-y-2 text-base text-foreground">
            {settings.contact_email ? (
              <div>
                <a className="hover:opacity-80" href={`mailto:${settings.contact_email}`}>
                  {settings.contact_email}
                </a>
              </div>
            ) : null}
            {settings.contact_phone ? (
              <div className="tabular-figures">{settings.contact_phone}</div>
            ) : null}
            {settings.address_street ? (
              <div className="pt-2 text-muted-foreground">
                {settings.address_street}, {settings.address_zip} {settings.address_city}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}
