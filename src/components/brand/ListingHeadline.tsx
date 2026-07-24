import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import type { PublicListing } from "@/lib/listings/queries.functions";
import { pickLocalized } from "@/lib/listings/format";

type Props = {
  listing: PublicListing;
  locale: Locale;
};

/**
 * Headline sentence and body prose for the detail page. Headline is a full
 * sentence in the serif at large size; description flows as paragraphs.
 */
export function ListingHeadline({ listing, locale }: Props) {
  const { t } = useTranslation();
  const title = pickLocalized(listing.title, locale) || listing.slug;
  const description = pickLocalized(listing.description, locale);

  const locationLine =
    listing.geo_precision === "hidden"
      ? [listing.address_zip, listing.address_city].filter(Boolean).join(" ")
      : [listing.address_street, listing.address_zip, listing.address_city]
          .filter(Boolean)
          .join(" · ");

  const paragraphs = description
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section>
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {listing.reference_code
          ? `${t("listings.detail.reference")} · ${listing.reference_code}`
          : t(listing.deal_type === "rent" ? "listings.for_rent" : "listings.for_sale")}
      </div>
      <h1 className="mt-4 max-w-4xl font-heading text-4xl leading-[1.05] md:text-6xl lg:text-7xl">
        {title}
      </h1>
      <div className="mt-6 text-sm text-muted-foreground">
        {listing.geo_precision === "hidden"
          ? t("listings.detail.location_hidden")
          : locationLine}
      </div>

      {paragraphs.length > 0 ? (
        <div className="mt-14 max-w-2xl space-y-7 text-base leading-[1.75] text-foreground/90">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
