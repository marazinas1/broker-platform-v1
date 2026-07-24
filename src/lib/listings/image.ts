/** Resolve the best public URL for a listing image given its variants map. */
type Variants = Record<string, { url?: string } | undefined> | null | undefined;

type Size = "thumb" | "medium" | "large" | "og";

export function pickImageUrl(
  variants: unknown,
  size: Size = "medium",
): string | null {
  if (!variants || typeof variants !== "object") return null;
  const v = variants as Variants;
  const order: Size[] =
    size === "og"
      ? ["og", "large", "medium", "thumb"]
      : size === "large"
      ? ["large", "medium", "og", "thumb"]
      : size === "medium"
      ? ["medium", "large", "thumb"]
      : ["thumb", "medium", "large"];
  for (const key of order) {
    const url = v?.[key]?.url;
    if (typeof url === "string" && url.length > 0) return url;
  }
  return null;
}
