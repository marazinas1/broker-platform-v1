import { z } from "zod";
import { fallback } from "@tanstack/zod-adapter";

/** URL search schema for the listings index. */
export const listingsSearchSchema = z.object({
  deal: fallback(z.string(), "").default(""),
  type: fallback(z.string(), "").default(""),
  city: fallback(z.string(), "").default(""),
  rooms_min: fallback(z.number(), 0).default(0),
  price_min: fallback(z.number(), 0).default(0),
  price_max: fallback(z.number(), 0).default(0),
  area_min: fallback(z.number(), 0).default(0),
  sort: fallback(z.string(), "newest").default("newest"),
  page: fallback(z.number(), 1).default(1),
  view: fallback(z.string(), "grid").default("grid"),
});

export type ListingsSearch = z.infer<typeof listingsSearchSchema>;

export const PAGE_SIZE = 9;
