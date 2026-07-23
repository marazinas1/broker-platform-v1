import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

import type { SiteSettings } from "@/types/site-settings";

export const getSiteSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteSettings> => {
    const { createPublicSupabase } = await import("@/lib/supabase/server-public");
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Failed to load site_settings: ${error.message}`);
    if (!data) throw new Error("site_settings row missing; run the initial migration.");
    return data as SiteSettings;
  },
);

export const siteSettingsQueryOptions = queryOptions({
  queryKey: ["site_settings"],
  queryFn: () => getSiteSettings(),
  staleTime: 60_000,
});
