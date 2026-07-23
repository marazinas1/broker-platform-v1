import { useSuspenseQuery } from "@tanstack/react-query";
import { featureFlagsQueryOptions } from "@/lib/config/feature-flags.functions";

export function useFeatureFlag(key: string): boolean {
  const { data } = useSuspenseQuery(featureFlagsQueryOptions);
  return Boolean(data?.[key]?.enabled);
}

export function useFeatureFlags() {
  const { data } = useSuspenseQuery(featureFlagsQueryOptions);
  return data;
}
