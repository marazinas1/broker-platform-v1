/**
 * Energy certificate helpers. Germany's GEG requires the efficiency class to be
 * shown in any listing advertisement, so it is part of the card, not a detail.
 * The class lives in the `energy` jsonb column (see validate_listing_energy).
 */
const CLASSES = ["A++", "A+", "A", "B", "C", "D", "E", "F", "G", "H"] as const;

export function energyClassOf(energy: unknown): string | null {
  if (!energy || typeof energy !== "object") return null;
  const value = (energy as Record<string, unknown>).efficiency_class;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return (CLASSES as readonly string[]).includes(normalized) ? normalized : null;
}

/**
 * Subtle tinting only: efficient classes lean on the sage accent, weak classes
 * on clay. Never loud — the border carries the colour, not a filled badge.
 */
export function energyClassTone(cls: string): string {
  if (["A++", "A+", "A", "B"].includes(cls)) return "border-primary/40 text-primary";
  if (["C", "D"].includes(cls)) return "border-border text-foreground";
  return "border-accent/40 text-accent";
}
