import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import type { PublicListing } from "@/lib/listings/queries.functions";
import { pickImageUrl } from "@/lib/listings/image";
import {
  formatArea,
  formatDate,
  formatPrice,
  pickLocalized,
} from "@/lib/listings/format";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  listing: PublicListing;
  locale: Locale;
  settings: SiteSettings;
  size?: "large" | "compact";
};

export function ListingCard({ listing, locale, settings, size = "large" }: Props) {
  const { t } = useTranslation();
  const primary = listing.images.find((i) => i.is_primary) ?? listing.images[0];
  const image =
    pickImageUrl(primary?.variants, size === "large" ? "large" : "medium") ??
    pickImageUrl(primary?.variants, "medium");
  const title = pickLocalized(listing.title, locale) || listing.slug;
  const price = formatPrice(listing.price, settings.currency, locale, {
    onRequest: listing.price_on_request,
    period: listing.price_period,
    onRequestLabel: t("listings.on_request"),
  });
  const area =
    listing.property_type === "land"
      ? formatArea(listing.plot_area, settings.area_unit, locale)
      : formatArea(listing.living_area, settings.area_unit, locale);

  const statusChip =
    listing.status === "coming_soon"
      ? t("listings.coming_soon")
      : listing.status === "sold"
      ? t("listings.sold")
      : listing.status === "rented"
      ? t("listings.rented")
      : null;

  return (
    <Link
      to="/$locale/immobilien/$slug"
      params={{ locale, slug: listing.slug }}
      className="group block"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={pickLocalized(primary?.alt_text, locale) || title}
            loading="lazy"
            className="h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-90"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
        {statusChip ? (
          <div className="absolute left-4 top-4 bg-background/95 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-foreground">
            {statusChip}
          </div>
        ) : null}
      </div>
      <div className="mt-5 flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-2xl leading-tight text-foreground">
            {title}
          </h3>
          <div className="mt-1 text-sm text-muted-foreground">
            {listing.address_city}
            {listing.status === "sold" && listing.sold_at ? (
              <span className="ml-2 text-muted-foreground/70">
                · {t("listings.sold_on").replace("{{date}}", formatDate(listing.sold_at, locale))}
              </span>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-heading text-lg tabular-figures text-foreground">{price}</div>
          <div className="mt-1 text-xs tabular-figures uppercase tracking-wider text-muted-foreground">
            {area}
          </div>
        </div>
      </div>
    </Link>
  );
}
