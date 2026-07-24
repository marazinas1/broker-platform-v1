// Backwards-compatible re-export. Real logic lives in ./energy.ts, which
// mirrors the Postgres validate_listing_energy function.
export {
  COUNTRIES,
  EFFICIENCY_CLASS_AT,
  EFFICIENCY_CLASS_DE,
  EXEMPT_PROPERTY_TYPES,
  energySchemas as EnergyCertSchemas,
  validateEnergy,
  type Country,
  type EnergyValidationResult,
} from "./energy";
