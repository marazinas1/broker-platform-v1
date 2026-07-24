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
