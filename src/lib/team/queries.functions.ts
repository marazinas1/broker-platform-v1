import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

export type PublicTeamMember = {
  id: string;
  full_name: string | null;
  public_title: string | null;
  public_photo_url: string | null;
  languages_spoken: string[] | null;
  specializations: string[] | null;
  sort_order: number;
};

export const listPublicTeam = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicTeamMember[]> => {
    const { createPublicSupabase } = await import("@/lib/supabase/server-public");
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, public_title, public_photo_url, languages_spoken, specializations, sort_order",
      )
      .eq("show_on_website", true)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(`Failed to load team: ${error.message}`);
    return (data ?? []) as PublicTeamMember[];
  },
);

export const publicTeamQueryOptions = queryOptions({
  queryKey: ["public_team"],
  queryFn: () => listPublicTeam(),
  staleTime: 60_000,
});
