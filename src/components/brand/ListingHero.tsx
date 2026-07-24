import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import type { PublicListing } from "@/lib/listings/queries.functions";
import { formatArea, formatPrice, pickLocalized } from "@/lib/listings/format";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  listing: PublicListing;
  locale: Locale;
  settings: SiteSettings;
};

/** Detail page hero block: reference, title, location, and the price/area/rooms strip. */
export function ListingHero({ listing, locale, settings }: Props) {
  const { t } = useTranslation();
  const title = pickLocalized(listing.title, locale) || listing.slug;
  const price = formatPrice(listing.price, settings.currency, locale, {
    onRequest: listing.price_on_request,
    period: listing.price_period,
    onRequestLabel: t("listings.on_request"),
  });

  const locationLine =
    listing.geo_precision === "hidden"
      ? [listing.address_zip, listing.address_city].filter(Boolean).join(" ")
      : [listing.address_street, listing.address_zip, listing.address_city]
          .filter(Boolean)
          .join(" · ");

  return (
    <header>
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {listing.reference_code
          ? `${t("listings.detail.reference")} · ${listing.reference_code}`
          : t(listing.deal_type === "rent" ? "listings.for_rent" : "listings.for_sale")}
      </div>
      <h1 className="mt-4 font-heading text-5xl leading-[1.02] md:text-7xl">
        {title}
      </h1>
      <div className="mt-4 text-sm text-muted-foreground">
        {listing.geo_precision === "hidden"
          ? t("listings.detail.location_hidden")
          : locationLine}
      </div>

      <div className="mt-12 flex flex-wrap items-baseline gap-x-16 gap-y-6 border-y border-border py-8">
        <Fact
          label={t(listing.deal_type === "rent" ? "listings.for_rent" : "listings.for_sale")}
          value={price}
        />
        {listing.living_area != null ? (
          <Fact
            label={t("listings.detail.living_area")}
            value={formatArea(listing.living_area, settings.area_unit, locale)}
          />
        ) : null}
        {listing.rooms != null ? (
          <Fact label={t("listings.detail.rooms")} value={String(listing.rooms)} />
        ) : null}
      </div>
    </header>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-heading text-4xl tabular-figures md:text-5xl">
        {value}
      </div>
    </div>
  );
}
