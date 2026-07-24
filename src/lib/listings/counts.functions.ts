import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

export type PropertyTypeCounts = Record<string, number>;

export const getPropertyTypeCounts = createServerFn({ method: "GET" }).handler(
  async (): Promise<PropertyTypeCounts> => {
    const { createPublicSupabase } = await import("@/lib/supabase/server-public");
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from("listings_public")
      .select("property_type")
      .in("status", ["active", "coming_soon"]);
    if (error) throw new Error(error.message);
    const counts: PropertyTypeCounts = {};
    for (const row of (data ?? []) as Array<{ property_type: string | null }>) {
      const k = row.property_type ?? "";
      if (!k) continue;
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return counts;
  },
);

export const propertyTypeCountsQueryOptions = queryOptions({
  queryKey: ["listings", "type-counts"],
  queryFn: () => getPropertyTypeCounts(),
  staleTime: 60_000,
});

/** Distinct cities present in currently published listings, ordered by
 *  listing count (busiest first) so the homepage never drifts from the
 *  actual dataset. */
export const getPublicCities = createServerFn({ method: "GET" }).handler(
  async (): Promise<string[]> => {
    const { createPublicSupabase } = await import("@/lib/supabase/server-public");
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from("listings_public")
      .select("address_city")
      .in("status", ["active", "coming_soon"]);
    if (error) throw new Error(error.message);
    const counts = new Map<string, number>();
    for (const row of (data ?? []) as Array<{ address_city: string | null }>) {
      const c = (row.address_city ?? "").trim();
      if (!c) continue;
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([c]) => c);
  },
);

export const publicCitiesQueryOptions = queryOptions({
  queryKey: ["listings", "cities"],
  queryFn: () => getPublicCities(),
  staleTime: 60_000,
});
