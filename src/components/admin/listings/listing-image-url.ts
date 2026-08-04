// Build a public URL for a processed listing-image variant. The pipeline
// stores bucket-relative paths in listing_images.variants; the bucket
// (listing-images) is public, the originals bucket never is.
const BASE = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const BUCKET = "listing-images";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function variantUrl(variants: any, size: "thumb" | "medium" = "thumb"): string | null {
  if (!variants || typeof variants !== "object") return null;
  const order = size === "thumb" ? ["thumb", "medium", "large"] : ["medium", "large", "thumb"];
  for (const key of order) {
    const entry = variants[key];
    const path = entry?.webp?.path ?? entry?.avif?.path;
    if (typeof path === "string" && path.length > 0 && BASE) {
      return `${BASE}/storage/v1/object/public/${BUCKET}/${path}`;
    }
  }
  return null;
}

export function fileExtension(name: string, contentType: string): string {
  const fromName = name.includes(".") ? name.split(".").pop() ?? "" : "";
  if (fromName) return fromName.toLowerCase();
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("avif")) return "avif";
  return "jpg";
}
