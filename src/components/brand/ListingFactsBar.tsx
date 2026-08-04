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
 * Key figures as a calm label/value table: hairline dividers, tabular
 * figures, no boxes or shadows. Price sits above as the prominent line
 * and honours price_on_request.
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
  if (listing.plot_area != null) {
    facts.push({
      label: t("listings.detail.plot_area"),
      value: formatArea(listing.plot_area, settings.area_unit, locale),
    });
  }
  if (listing.rooms != null) {
    facts.push({ label: t("listings.detail.rooms"), value: String(listing.rooms) });
  }
  if (listing.bedrooms != null) {
    facts.push({ label: t("listings.detail.bedrooms"), value: String(listing.bedrooms) });
  }
  if (listing.bathrooms != null) {
    facts.push({
      label: t("listings.detail.bathrooms"),
      value: String(listing.bathrooms),
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
  if (listing.year_built != null) {
    facts.push({
      label: t("listings.detail.year_built"),
      value: String(listing.year_built),
    });
  }

  const price = formatPrice(listing.price, settings.currency, locale, {
    onRequest: listing.price_on_request,
    period: listing.price_period,
    onRequestLabel: t("listings.on_request"),
  });

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
      <div className="border-t border-border pt-6">
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {t(listing.deal_type === "rent" ? "listings.for_rent" : "listings.for_sale")}
        </div>
        <div className="mt-4 font-heading text-4xl leading-none tabular-figures md:text-5xl">
          {price}
        </div>
      </div>

      <dl className="border-t border-border">
        {facts.map((f) => (
          <div
            key={f.label}
            className="flex items-baseline justify-between gap-6 border-b border-border py-4"
          >
            <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {f.label}
            </dt>
            <dd className="tabular-figures text-base text-foreground">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
