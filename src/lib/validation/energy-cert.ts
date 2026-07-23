import { z } from "zod";

/**
 * Per-country energy certificate validators.
 * TODO: Fill in real legal requirements per market before enabling listings for that country.
 */
const BaseEnergyCert = z.object({
  issued_at: z.string().datetime().optional(),
});

export const EnergyCertSchemas = {
  AT: BaseEnergyCert,
  DE: BaseEnergyCert,
  CH: BaseEnergyCert,
  IS: BaseEnergyCert,
  US: BaseEnergyCert.extend({}),
} as const;

export type Country = keyof typeof EnergyCertSchemas;
