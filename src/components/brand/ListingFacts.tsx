import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import type { PublicListing } from "@/lib/listings/queries.functions";
import { formatArea, formatRooms } from "@/lib/listings/format";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  listing: PublicListing;
  locale: Locale;
  settings: SiteSettings;
};

/** Key figures table for the listing detail page. */
export function ListingFacts({ listing, locale, settings }: Props) {
  const { t } = useTranslation();
  const facts: Array<[string, string]> = [];

  if (listing.living_area != null)
    facts.push([
      t("listings.detail.living_area"),
      formatArea(listing.living_area, settings.area_unit, locale),
    ]);
  if (listing.plot_area != null)
    facts.push([
      t("listings.detail.plot_area"),
      formatArea(listing.plot_area, settings.area_unit, locale),
    ]);
  if (listing.rooms != null)
    facts.push([t("listings.detail.rooms"), formatRooms(listing.rooms, locale)]);
  if (listing.bedrooms != null)
    facts.push([t("listings.detail.bedrooms"), String(listing.bedrooms)]);
  if (listing.bathrooms != null)
    facts.push([t("listings.detail.bathrooms"), String(listing.bathrooms)]);
  if (listing.year_built != null)
    facts.push([t("listings.detail.year_built"), String(listing.year_built)]);
  if (listing.year_renovated != null)
    facts.push([t("listings.detail.year_renovated"), String(listing.year_renovated)]);
  if (listing.condition)
    facts.push([t("listings.detail.condition"), listing.condition]);
  if (listing.heating_type)
    facts.push([t("listings.detail.heating"), listing.heating_type]);

  if (facts.length === 0) return null;

  return (
    <section>
      <h2 className="font-heading text-3xl md:text-4xl">
        {t("listings.detail.key_facts")}
      </h2>
      <dl className="mt-8 grid grid-cols-1 gap-y-1 sm:grid-cols-2 sm:gap-x-12">
        {facts.map(([k, v]) => (
          <div
            key={k}
            className="flex items-baseline justify-between border-b border-border py-4"
          >
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className="text-sm tabular-figures text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
