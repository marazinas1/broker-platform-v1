import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { PublicChrome } from "@/components/public/PublicChrome";
import { MapView } from "@/components/public/MapView";
import { ShareButtons } from "@/components/public/ShareButtons";
import { ListingGallery } from "@/components/brand/ListingGallery";
import { ListingHero } from "@/components/brand/ListingHero";
import { ListingFacts } from "@/components/brand/ListingFacts";
import { EnergyPanel } from "@/components/brand/EnergyPanel";
import { ListingInquiryForm } from "@/components/brand/ListingInquiryForm";
import type { Locale } from "@/i18n/config";
import { translate } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { getListingBySlug, type PublicListing } from "@/lib/listings/queries.functions";
import { pickImageUrl } from "@/lib/listings/image";
import { pickLocalized } from "@/lib/listings/format";
import { getRequestOrigin } from "@/lib/seo/origin.functions";
import { buildHead } from "@/lib/seo/build-head";

function slugQueryOptions(slug: string) {
  return queryOptions({
    queryKey: ["listings", "slug", slug],
    queryFn: () => getListingBySlug({ data: { slug } }),
    staleTime: 30_000,
  });
}

export const Route = createFileRoute("/$locale/immobilien/$slug")({
  loader: async ({ context, params }) => {
    const [settings, origin, listing] = await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQueryOptions),
      getRequestOrigin(),
      context.queryClient.ensureQueryData(slugQueryOptions(params.slug)),
    ]);
    if (!listing) throw notFound();
    return { settings, origin, listing, locale: params.locale as Locale };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          {
            title: translate(
              (params.locale as Locale) ?? "de",
              "listings.detail.unavailable_title",
            ),
          },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { settings, origin, locale, listing } = loaderData;
    const localTitle = pickLocalized(listing.title, locale) || listing.slug;
    const localDesc = pickLocalized(listing.description, locale);
    const title = `${localTitle} — ${settings.site_name}`;
    const primary = listing.images.find((i) => i.is_primary) ?? listing.images[0];
    const ogImage =
      pickImageUrl(primary?.variants, "og") ?? pickImageUrl(primary?.variants, "large");

    const head = buildHead({
      origin,
      path: `/${locale}/immobilien/${listing.slug}`,
      locale,
      enabledLocales: settings.enabled_locales,
      defaultLocale: settings.default_locale,
      title,
      description: localDesc.slice(0, 160) || settings.site_name,
      siteName: settings.site_name,
      ogImage,
      ogDefaultImage: settings.og_default_image,
      ogType: "product",
    });

    const priceObj =
      listing.price != null
        ? {
            "@type": "MonetaryAmount",
            currency: settings.currency,
            value: listing.price,
          }
        : undefined;
    const ldJson = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: localTitle,
      description: localDesc,
      url: `${origin}/${locale}/immobilien/${listing.slug}`,
      ...(ogImage ? { image: ogImage } : {}),
      ...(priceObj ? { price: priceObj } : {}),
      address:
        listing.geo_precision !== "hidden"
          ? {
              "@type": "PostalAddress",
              addressLocality: listing.address_city,
              postalCode: listing.address_zip,
              addressCountry: listing.address_country,
              streetAddress: listing.address_street ?? undefined,
            }
          : undefined,
      floorSize:
        listing.living_area != null
          ? {
              "@type": "QuantitativeValue",
              value: listing.living_area,
              unitCode: settings.area_unit === "sqft" ? "FTK" : "MTK",
            }
          : undefined,
      numberOfRooms: listing.rooms ?? undefined,
    };

    return {
      ...head,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(ldJson) },
      ],
    };
  },
  component: ListingDetail,
  notFoundComponent: NotFoundBody,
});

function NotFoundBody() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-[900px] px-6 py-32 lg:px-10">
      <h1 className="font-heading text-4xl">{t("listings.detail.unavailable_title")}</h1>
      <p className="mt-4 text-muted-foreground">{t("listings.detail.unavailable_body")}</p>
    </div>
  );
}

function ListingDetail() {
  const { locale, slug } = Route.useParams();
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const { data: listing } = useSuspenseQuery(slugQueryOptions(slug));
  const { origin } = Route.useLoaderData();

  if (!listing) return null;
  const l = listing as PublicListing;
  const title = pickLocalized(l.title, locale) || l.slug;
  const description = pickLocalized(l.description, locale);
  const shareUrl = `${origin}/${locale}/immobilien/${l.slug}`;

  return (
    <PublicChrome locale={locale as Locale} settings={settings}>
      <article>
        <section className="mx-auto max-w-[1400px] px-2 pt-6 sm:px-6 lg:px-10">
          <ListingGallery images={l.images} locale={locale as Locale} title={title} />
        </section>

        <section className="mx-auto max-w-[1400px] px-6 pt-20 lg:px-10">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
            <div className="space-y-20 lg:col-span-2">
              <ListingHero
                listing={l}
                locale={locale as Locale}
                settings={settings}
              />

              {description ? (
                <section>
                  <h2 className="font-heading text-3xl md:text-4xl">
                    {t("listings.detail.description")}
                  </h2>
                  <p className="mt-6 max-w-2xl whitespace-pre-line text-base leading-relaxed text-foreground/90">
                    {description}
                  </p>
                </section>
              ) : null}

              <ListingFacts
                listing={l}
                locale={locale as Locale}
                settings={settings}
              />

              {l.features && l.features.length > 0 ? (
                <section>
                  <h2 className="font-heading text-3xl md:text-4xl">
                    {t("listings.detail.features")}
                  </h2>
                  <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-foreground">
                    {l.features.map((f) => (
                      <li key={f} className="border-b border-border pb-1">
                        {f}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section>
                <h2 className="font-heading text-3xl md:text-4xl">
                  {t("listings.detail.location")}
                </h2>
                <div className="mt-8">
                  <MapView
                    lat={l.geo_lat}
                    lng={l.geo_lng}
                    precision={l.geo_precision}
                  />
                </div>
              </section>

              <EnergyPanel energy={l.energy} propertyType={l.property_type} />

              <section>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {t("listings.detail.share")}
                </div>
                <div className="mt-4">
                  <ShareButtons url={shareUrl} title={title} />
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <ListingInquiryForm listingId={l.id} />
            </aside>
          </div>
        </section>

        <div className="pb-32" />
      </article>
    </PublicChrome>
  );
}
