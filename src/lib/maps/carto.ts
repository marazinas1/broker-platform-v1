import type { Locale } from "@/i18n/config";
import { pickLocalized } from "@/lib/listings/format";

/**
 * GDPR-friendly raster basemap: CARTO "light_all" monochrome tiles served
 * from the OSM data set. No API key, no Google, no tracking cookies.
 */
export const CARTO_LIGHT_STYLE = {
  version: 8 as const,
  sources: {
    carto: {
      type: "raster" as const,
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [{ id: "carto", type: "raster" as const, source: "carto" }],
};

/** Sage marker colour — kept in sync with the brand accent token. */
export const MARKER_COLOR = "#6B7259";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  /** "exact" renders a pin, "approximate" a soft area. */
  precision: "exact" | "approximate";
  title?: string;
  meta?: string;
  href?: string;
};

type ListingLike = {
  id: string;
  slug: string;
  geo_lat: number | null;
  geo_lng: number | null;
  geo_precision: string | null;
  title: any;
};

/**
 * Turn public listings into map points. Listings without coordinates —
 * which includes every `hidden` listing, since the public view nulls the
 * geo columns for those — are simply dropped.
 */
export function listingsToPoints(
  listings: ListingLike[],
  locale: Locale,
  opts: { metaFor?: (l: any) => string } = {},
): MapPoint[] {
  const points: MapPoint[] = [];
  for (const l of listings) {
    if (l.geo_lat == null || l.geo_lng == null) continue;
    if (l.geo_precision !== "exact" && l.geo_precision !== "approximate") continue;
    points.push({
      id: l.id,
      lat: Number(l.geo_lat),
      lng: Number(l.geo_lng),
      precision: l.geo_precision,
      title: pickLocalized(l.title, locale) || l.slug,
      meta: opts.metaFor?.(l),
      href: `/${locale}/immobilien/${l.slug}`,
    });
  }
  return points;
}
