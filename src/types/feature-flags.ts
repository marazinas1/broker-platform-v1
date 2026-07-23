export interface FeatureFlag {
  enabled: boolean;
  config: Record<string, unknown>;
}

export type FeatureFlags = Record<string, FeatureFlag>;
