import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import { formatArea } from "@/lib/listings/format";
import { energyClassOf, energyClassTone } from "@/lib/listings/energy-class";
import { cn } from "@/lib/utils";
import type { PublicListing } from "@/lib/listings/queries.functions";
import type { SiteSettings } from "@/types/site-settings";

type Props = { listing: PublicListing; locale: Locale; settings: SiteSettings };

/** Small rounded outline pills for the key facts, incl. the GEG energy class. */
export function ListingFactPills({ listing, locale, settings }: Props) {
  const { t } = useTranslation();
  const nf = new Intl.NumberFormat(locale === "en" ? "en-US" : "de-DE", {
    maximumFractionDigits: 1,
  });

  const facts: { key: string; label: string }[] = [];
  if (listing.rooms != null)
    facts.push({ key: "rooms", label: `${nf.format(listing.rooms)} ${t("listings.facts.rooms")}` });
  if (listing.bedrooms != null)
    facts.push({ key: "beds", label: `${listing.bedrooms} ${t("listings.facts.bedrooms")}` });
  if (listing.bathrooms != null)
    facts.push({ key: "baths", label: `${listing.bathrooms} ${t("listings.facts.bathrooms")}` });

  const area =
    listing.property_type === "land"
      ? formatArea(listing.plot_area, settings.area_unit, locale)
      : formatArea(listing.living_area, settings.area_unit, locale);
  if (area !== "—") facts.push({ key: "area", label: area });

  const energy = energyClassOf(listing.energy);

  if (facts.length === 0 && !energy) return null;

  return (
    <ul className="flex flex-wrap items-center gap-2">
      {facts.map((f) => (
        <li key={f.key}>
          <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs tabular-figures text-muted-foreground">
            {f.label}
          </span>
        </li>
      ))}
      {energy ? (
        <li>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
              energyClassTone(energy),
            )}
            title={t("listings.facts.energy_class")}
          >
            <span className="text-muted-foreground">{t("listings.facts.energy_class")}</span>
            <span className="font-medium tabular-figures">{energy}</span>
          </span>
        </li>
      ) : null}
    </ul>
  );
}
