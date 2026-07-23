import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

import type { FeatureFlags } from "@/types/feature-flags";

export const getFeatureFlags = createServerFn({ method: "GET" }).handler(
  async (): Promise<FeatureFlags> => {
    const { createPublicSupabase } = await import("@/lib/supabase/server-public");
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from("feature_flags")
      .select("key, enabled, config");
    if (error) throw new Error(`Failed to load feature_flags: ${error.message}`);
    const flags: FeatureFlags = {};
    for (const row of (data ?? []) as Array<{
      key: string;
      enabled: boolean;
      config: Record<string, unknown>;
    }>) {
      flags[row.key] = { enabled: row.enabled, config: row.config ?? {} };
    }
    return flags;
  },
);

export const featureFlagsQueryOptions = queryOptions({
  queryKey: ["feature_flags"],
  queryFn: () => getFeatureFlags(),
  staleTime: 60_000,
});
