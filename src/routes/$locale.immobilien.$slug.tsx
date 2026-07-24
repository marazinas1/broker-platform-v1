import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { PublicChrome } from "@/components/public/PublicChrome";
import { Gallery } from "@/components/public/Gallery";
import { EnergyPanel } from "@/components/public/EnergyPanel";
import { InquiryForm } from "@/components/public/InquiryForm";
import { MapView } from "@/components/public/MapView";
import { ShareButtons } from "@/components/public/ShareButtons";
import type { Locale } from "@/i18n/config";
import { translate } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { getListingBySlug, type PublicListing } from "@/lib/listings/queries.functions";
import { pickImageUrl } from "@/lib/listings/image";
import {
  formatArea,
  formatPrice,
  formatRooms,
  pickLocalized,
} from "@/lib/listings/format";
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
          { title: translate((params.locale as Locale) ?? "de", "listings.detail.unavailable_title") },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { settings, origin, locale, listing } = loaderData;
    const localTitle = pickLocalized(listing.title, locale) || listing.slug;
    const localDesc = pickLocalized(listing.description, locale);
    const title = `${localTitle} — ${settings.site_name}`;
    const primary = listing.images.find((i) => i.is_primary) ?? listing.images[0];
    const ogImage = pickImageUrl(primary?.variants, "og") ?? pickImageUrl(primary?.variants, "large");

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
        {
          type: "application/ld+json",
          children: JSON.stringify(ldJson),
        },
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
  const price = formatPrice(l.price, settings.currency, locale as Locale, {
    onRequest: l.price_on_request,
    period: l.price_period,
    onRequestLabel: t("listings.on_request"),
  });
  const shareUrl = `${origin}/${locale}/immobilien/${l.slug}`;

  const facts: Array<[string, string]> = [];
  if (l.living_area != null)
    facts.push([t("listings.detail.living_area"), formatArea(l.living_area, settings.area_unit, locale as Locale)]);
  if (l.plot_area != null)
    facts.push([t("listings.detail.plot_area"), formatArea(l.plot_area, settings.area_unit, locale as Locale)]);
  if (l.rooms != null) facts.push([t("listings.detail.rooms"), formatRooms(l.rooms, locale as Locale)]);
  if (l.bedrooms != null) facts.push([t("listings.detail.bedrooms"), String(l.bedrooms)]);
  if (l.bathrooms != null) facts.push([t("listings.detail.bathrooms"), String(l.bathrooms)]);
  if (l.year_built != null) facts.push([t("listings.detail.year_built"), String(l.year_built)]);
  if (l.year_renovated != null)
    facts.push([t("listings.detail.year_renovated"), String(l.year_renovated)]);
  if (l.condition) facts.push([t("listings.detail.condition"), l.condition]);
  if (l.heating_type) facts.push([t("listings.detail.heating"), l.heating_type]);

  const locationLine =
    l.geo_precision === "hidden"
      ? [l.address_zip, l.address_city].filter(Boolean).join(" ")
      : [l.address_street, l.address_zip, l.address_city].filter(Boolean).join(" · ");

  return (
    <PublicChrome locale={locale as Locale} settings={settings}>
      <article>
        <section className="mx-auto max-w-[1400px] px-2 pt-6 sm:px-6 lg:px-10">
          <Gallery images={l.images} locale={locale as Locale} title={title} />
        </section>

        <section className="mx-auto max-w-[1400px] px-6 pt-12 lg:px-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {l.reference_code
                  ? `${t("listings.detail.reference")} · ${l.reference_code}`
                  : ""}
              </div>
              <h1 className="mt-2 font-heading text-4xl leading-tight md:text-6xl">
                {title}
              </h1>
              <div className="mt-3 text-sm text-muted-foreground">
                {l.geo_precision === "hidden" ? t("listings.detail.location_hidden") : locationLine}
              </div>

              <div className="mt-10 flex flex-wrap items-baseline gap-x-10 gap-y-3 border-y border-border py-6">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {t(l.deal_type === "rent" ? "listings.for_rent" : "listings.for_sale")}
                  </div>
                  <div className="font-heading text-3xl tabular-figures">{price}</div>
                </div>
                {l.living_area ? (
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {t("listings.detail.living_area")}
                    </div>
                    <div className="font-heading text-3xl tabular-figures">
                      {formatArea(l.living_area, settings.area_unit, locale as Locale)}
                    </div>
                  </div>
                ) : null}
                {l.rooms ? (
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {t("listings.detail.rooms")}
                    </div>
                    <div className="font-heading text-3xl tabular-figures">{l.rooms}</div>
                  </div>
                ) : null}
              </div>

              {description ? (
                <div className="mt-12">
                  <h2 className="font-heading text-3xl">{t("listings.detail.description")}</h2>
                  <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-foreground/90">
                    {description}
                  </p>
                </div>
              ) : null}

              <div className="mt-14">
                <h2 className="font-heading text-3xl">{t("listings.detail.key_facts")}</h2>
                <dl className="mt-6 grid grid-cols-1 gap-y-3 sm:grid-cols-2">
                  {facts.map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between border-b border-border py-3">
                      <dt className="text-sm text-muted-foreground">{k}</dt>
                      <dd className="text-sm tabular-figures text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {l.features && l.features.length > 0 ? (
                <div className="mt-14">
                  <h2 className="font-heading text-3xl">{t("listings.detail.features")}</h2>
                  <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground">
                    {l.features.map((f) => (
                      <li key={f}>· {f}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-14">
                <h2 className="font-heading text-3xl">{t("listings.detail.location")}</h2>
                <div className="mt-6">
                  <MapView lat={l.geo_lat} lng={l.geo_lng} precision={l.geo_precision} />
                </div>
              </div>

              <div className="mt-14">
                <EnergyPanel energy={l.energy} propertyType={l.property_type} />
              </div>

              <div className="mt-14">
                <h2 className="font-heading text-lg text-muted-foreground">
                  {t("listings.detail.share")}
                </h2>
                <div className="mt-3">
                  <ShareButtons url={shareUrl} title={title} />
                </div>
              </div>
            </div>

            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <InquiryForm listingId={l.id} />
            </aside>
          </div>
        </section>
      </article>
    </PublicChrome>
  );
}
