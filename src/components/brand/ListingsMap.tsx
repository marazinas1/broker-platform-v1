import { lazy, Suspense, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import { listingsToPoints } from "@/lib/maps/carto";
import { formatArea, formatPrice } from "@/lib/listings/format";
import type { PublicListing } from "@/lib/listings/queries.functions";
import type { SiteSettings } from "@/types/site-settings";

const MapCanvas = lazy(() => import("@/components/brand/MapCanvas"));

type Props = {
  items: PublicListing[];
  locale: Locale;
  settings: SiteSettings;
};

function Skeleton() {
  return <div className="aspect-[16/9] w-full rounded-media bg-muted md:aspect-[21/9]" />;
}

/**
 * Optional map view on the listings index. Plots every listing whose
 * geo_precision allows it; hidden listings carry no coordinates and are
 * therefore never plotted.
 */
export function ListingsMap({ items, locale, settings }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const points = listingsToPoints(items, locale, {
    metaFor: (l: PublicListing) =>
      [
        formatPrice(l.price, settings.currency, locale, {
          onRequest: l.price_on_request,
          period: l.price_period,
          onRequestLabel: t("listings.on_request"),
        }),
        l.living_area != null ? formatArea(l.living_area, settings.area_unit, locale) : null,
      ]
        .filter(Boolean)
        .join(" · "),

  });

  if (points.length === 0) return null;

  return (
    <div className="border-t border-border pt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="eyebrow text-muted-foreground transition-colors duration-300 hover:text-foreground"
      >
        {open ? t("listings.map.hide") : t("listings.map.show")} ({points.length})
      </button>

      {open ? (
        <div className="mt-6 overflow-hidden rounded-media border border-border">
          <ClientOnly fallback={<Skeleton />}>
            <Suspense fallback={<Skeleton />}>
              <MapCanvas
                points={points}
                interactivePopups
                className="aspect-[16/9] w-full md:aspect-[21/9]"
              />
            </Suspense>
          </ClientOnly>
        </div>
      ) : null}
    </div>
  );
}
