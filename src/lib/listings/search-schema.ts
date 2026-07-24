import { z } from "zod";
import { fallback } from "@tanstack/zod-adapter";

/** Default values for every listings search param. Used both by the
 *  zod schema and by `stripSearchParams` middleware so the URL never
 *  carries redundant `?...=&...=0` noise. */
export const SEARCH_DEFAULTS = {
  deal: "",
  type: "",
  city: "",
  rooms_min: 0,
  price_min: 0,
  price_max: 0,
  area_min: 0,
  sort: "newest",
  page: 1,
  view: "grid",
} as const;

/** URL search schema for the listings index. */
export const listingsSearchSchema = z.object({
  deal: fallback(z.string(), SEARCH_DEFAULTS.deal).default(SEARCH_DEFAULTS.deal),
  type: fallback(z.string(), SEARCH_DEFAULTS.type).default(SEARCH_DEFAULTS.type),
  city: fallback(z.string(), SEARCH_DEFAULTS.city).default(SEARCH_DEFAULTS.city),
  rooms_min: fallback(z.number(), SEARCH_DEFAULTS.rooms_min).default(SEARCH_DEFAULTS.rooms_min),
  price_min: fallback(z.number(), SEARCH_DEFAULTS.price_min).default(SEARCH_DEFAULTS.price_min),
  price_max: fallback(z.number(), SEARCH_DEFAULTS.price_max).default(SEARCH_DEFAULTS.price_max),
  area_min: fallback(z.number(), SEARCH_DEFAULTS.area_min).default(SEARCH_DEFAULTS.area_min),
  sort: fallback(z.string(), SEARCH_DEFAULTS.sort).default(SEARCH_DEFAULTS.sort),
  page: fallback(z.number(), SEARCH_DEFAULTS.page).default(SEARCH_DEFAULTS.page),
  view: fallback(z.string(), SEARCH_DEFAULTS.view).default(SEARCH_DEFAULTS.view),
});

export type ListingsSearch = z.infer<typeof listingsSearchSchema>;

export const PAGE_SIZE = 9;

/** Produce the querystring for a canonical listings URL: only non-default
 *  params, keys ordered deterministically. Empty string when everything
 *  is at its default. */
export function canonicalListingsQuery(search: ListingsSearch): string {
  const parts: string[] = [];
  const keys = Object.keys(SEARCH_DEFAULTS) as Array<keyof typeof SEARCH_DEFAULTS>;
  for (const k of keys) {
    const v = search[k];
    const d = SEARCH_DEFAULTS[k];
    if (v === d || v === "" || v === 0) continue;
    parts.push(`${k}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}
