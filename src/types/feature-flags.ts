export interface FeatureFlag {
  enabled: boolean;
  config: Record<string, any>;
}

export type FeatureFlags = Record<string, FeatureFlag>;
