import { z } from "zod";

export const CountrySchema = z.enum(["AT", "DE", "CH", "IS", "US"]);
export const AreaUnitSchema = z.enum(["sqm", "sqft"]);

export const SiteSettingsSchema = z.object({
  site_name: z.string().min(1),
  legal_name: z.string().nullable().optional(),
  country: CountrySchema,
  default_locale: z.string(),
  enabled_locales: z.array(z.string()).min(1),
  currency: z.string(),
  area_unit: AreaUnitSchema,
});
