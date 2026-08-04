import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import { listingsToPoints } from "@/lib/maps/carto";
import type { PublicListing } from "@/lib/listings/queries.functions";

const MapCanvas = lazy(() => import("@/components/brand/MapCanvas"));

type Props = {
  listing: PublicListing;
  locale: Locale;
};

function Skeleton() {
  return <div className="aspect-[16/9] w-full rounded-media bg-muted" />;
}

/**
 * Location block on the detail page. Honours geo_precision: exact pins,
 * approximate areas, and no map at all for hidden listings (the public
 * view already strips their coordinates before they reach the client).
 */
export function ListingLocationMap({ listing, locale }: Props) {
  const { t } = useTranslation();
  const points = listingsToPoints([listing], locale);
  const townLine = [listing.address_zip, listing.address_city].filter(Boolean).join(" ");

  return (
    <div>
      <h2 className="font-heading text-3xl md:text-4xl">{t("listings.detail.location")}</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        {points.length === 0
          ? t("listings.detail.location_hidden")
          : points[0]!.precision === "approximate"
            ? t("listings.detail.location_approximate")
            : townLine}
      </p>

      {points.length > 0 ? (
        <div className="mt-8 overflow-hidden rounded-media border border-border">
          <ClientOnly fallback={<Skeleton />}>
            <Suspense fallback={<Skeleton />}>
              <MapCanvas
                points={points}
                zoom={points[0]!.precision === "approximate" ? 12 : 15}
                className="aspect-[16/9] w-full"
              />
            </Suspense>
          </ClientOnly>
        </div>
      ) : townLine ? (
        <div className="mt-6 text-base">{townLine}</div>
      ) : null}
    </div>
  );
}
