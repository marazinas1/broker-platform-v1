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

/**
 * Brand-owned listing card. Photography leads; hairline border on top only,
 * no shadow, no rounded corners. Hover triggers a slow 400ms image scale.
 * Status shown through typographic label, never a coloured pill.
 */
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

  const statusLabel =
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
            alt={pickLocalized(primary?.alt_text, locale) || ""}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>

      <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-border pt-4">
        {statusLabel ? (
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {statusLabel}
          </span>
        ) : (
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {t(listing.deal_type === "rent" ? "listings.for_rent" : "listings.for_sale")}
          </span>
        )}
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {listing.address_city}
        </span>
      </div>

      <h3 className="mt-4 font-heading text-2xl leading-tight text-foreground md:text-3xl">
        {title}
      </h3>

      <div className="mt-4 flex items-baseline justify-between gap-6 text-sm">
        <span className="font-heading text-lg tabular-figures text-foreground">
          {price}
        </span>
        <span className="tabular-figures text-muted-foreground">{area}</span>
      </div>

      {listing.status === "sold" && listing.sold_at ? (
        <div className="mt-2 text-xs text-muted-foreground/70">
          {t("listings.sold_on").replace("{{date}}", formatDate(listing.sold_at, locale))}
        </div>
      ) : null}
    </Link>
  );
}
