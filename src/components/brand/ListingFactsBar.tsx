import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import type { PublicListing } from "@/lib/listings/queries.functions";
import { formatArea, formatPrice } from "@/lib/listings/format";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  listing: PublicListing;
  locale: Locale;
  settings: SiteSettings;
};

type Fact = { label: string; value: string };

/**
 * The single-row headline strip that sits directly under the gallery.
 * Big sans figures with tabular numerals, small uppercase labels. Wraps
 * to two rows on narrow screens. Price honours price_on_request.
 */
export function ListingFactsBar({ listing, locale, settings }: Props) {
  const { t } = useTranslation();
  const facts: Fact[] = [];

  if (listing.living_area != null) {
    facts.push({
      label: t("listings.detail.living_area"),
      value: formatArea(listing.living_area, settings.area_unit, locale),
    });
  }
  if (listing.property_type === "land" && listing.plot_area != null) {
    facts.push({
      label: t("listings.detail.plot_area"),
      value: formatArea(listing.plot_area, settings.area_unit, locale),
    });
  }
  if (listing.floor != null) {
    facts.push({
      label: t("listings.detail.floor"),
      value: listing.total_floors
        ? `${listing.floor}/${listing.total_floors}`
        : String(listing.floor),
    });
  }
  if (listing.bedrooms != null) {
    facts.push({
      label: t("listings.detail.bedrooms"),
      value: String(listing.bedrooms),
    });
  } else if (listing.rooms != null) {
    facts.push({
      label: t("listings.detail.rooms"),
      value: String(listing.rooms),
    });
  }
  if (listing.bathrooms != null) {
    facts.push({
      label: t("listings.detail.bathrooms"),
      value: String(listing.bathrooms),
    });
  }
  if (listing.plot_area != null && listing.property_type !== "land") {
    facts.push({
      label: t("listings.detail.plot_area"),
      value: formatArea(listing.plot_area, settings.area_unit, locale),
    });
  }

  facts.push({
    label: t(listing.deal_type === "rent" ? "listings.for_rent" : "listings.for_sale"),
    value: formatPrice(listing.price, settings.currency, locale, {
      onRequest: listing.price_on_request,
      period: listing.price_period,
      onRequestLabel: t("listings.on_request"),
    }),
  });

  const cols = Math.min(facts.length, 6);

  return (
    <dl
      className="grid grid-cols-2 gap-x-6 gap-y-10 border-y border-border py-10 sm:grid-cols-3 md:gap-x-12"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } as never}
    >
      {facts.map((f) => (
        <div key={f.label} className="min-w-0">
          <dd className="font-sans text-3xl leading-none tabular-figures text-foreground md:text-4xl">
            {f.value}
          </dd>
          <dt className="mt-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {f.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
