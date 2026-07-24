import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { PublicChrome } from "@/components/public/PublicChrome";
import { Hero } from "@/components/brand/Hero";
import { CategoryGrid } from "@/components/brand/CategoryGrid";
import { FeaturedListings } from "@/components/brand/FeaturedListings";
import { SoldStrip } from "@/components/brand/SoldStrip";
import { AreaLinks } from "@/components/brand/AreaLinks";
import { AboutBroker } from "@/components/brand/AboutBroker";
import { ContactSection } from "@/components/brand/ContactSection";
import type { Locale } from "@/i18n/config";
import { translate } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import {
  featuredListingsQueryOptions,
  recentSoldQueryOptions,
} from "@/lib/listings/queries.functions";
import { propertyTypeCountsQueryOptions } from "@/lib/listings/counts.functions";
import { getRequestOrigin } from "@/lib/seo/origin.functions";
import { buildHead } from "@/lib/seo/build-head";

export const Route = createFileRoute("/$locale/")({
  loader: async ({ context, params }) => {
    const [settings, origin] = await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQueryOptions),
      getRequestOrigin(),
      context.queryClient.ensureQueryData(featuredListingsQueryOptions),
      context.queryClient.ensureQueryData(recentSoldQueryOptions),
      context.queryClient.ensureQueryData(propertyTypeCountsQueryOptions),
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
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const { data: featured } = useSuspenseQuery(featuredListingsQueryOptions);
  const { data: sold } = useSuspenseQuery(recentSoldQueryOptions);
  const { data: counts } = useSuspenseQuery(propertyTypeCountsQueryOptions);

  return (
    <PublicChrome locale={locale as Locale} settings={settings}>
      <Hero locale={locale as Locale} featured={featured.items} />
      <FeaturedListings
        locale={locale as Locale}
        items={featured.items}
        settings={settings}
      />
      <CategoryGrid locale={locale as Locale} counts={counts} />
      <SoldStrip locale={locale as Locale} items={sold.items} settings={settings} />
      <AreaLinks locale={locale as Locale} />
      <AboutBroker />
      <ContactSection settings={settings} />
    </PublicChrome>
  );
}
