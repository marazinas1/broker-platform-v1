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
 * Brand-owned listing card. Photography dominates; hairline linen border, no
 * shadow, near-square corners. Status is small uppercase type — never a badge.
 * Hover scales the image slowly and moves nothing else.
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

  const status = statusLabel(listing, t);

  return (
    <Link
      to="/$locale/immobilien/$slug"
      params={{ locale, slug: listing.slug }}
      className="group block rounded-sm border border-border/70 bg-card"
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={pickLocalized(primary?.alt_text, locale) || ""}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>

      <div className="px-5 pt-5 pb-6 md:px-6 md:pb-7">
        <div className="flex items-baseline justify-between gap-4">
          <span className={status.accent ? "eyebrow text-primary" : "eyebrow text-muted-foreground"}>
            {status.label}
          </span>
          <span className="eyebrow text-muted-foreground">{listing.address_city}</span>
        </div>

        <h3 className="mt-4 font-heading text-2xl leading-tight text-foreground md:text-[1.75rem]">
          {title}
        </h3>

        <div className="mt-5 flex items-baseline justify-between gap-6 border-t border-border/70 pt-4 text-sm">
          <span className="font-body tabular-figures text-foreground">{price}</span>
          <span className="font-body tabular-figures text-muted-foreground">{area}</span>
        </div>

        {listing.status === "sold" && listing.sold_at ? (
          <div className="mt-2 text-xs text-muted-foreground">
            {t("listings.sold_on").replace("{{date}}", formatDate(listing.sold_at, locale))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

/** Status as typography: sage only for the forward-looking state. */
function statusLabel(
  listing: PublicListing,
  t: (key: string) => string,
): { label: string; accent: boolean } {
  if (listing.status === "coming_soon") return { label: t("listings.coming_soon"), accent: true };
  if (listing.status === "sold") return { label: t("listings.sold"), accent: false };
  if (listing.status === "rented") return { label: t("listings.rented"), accent: false };
  return {
    label: t(listing.deal_type === "rent" ? "listings.for_rent" : "listings.for_sale"),
    accent: false,
  };
}
