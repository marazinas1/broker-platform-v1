import { cn } from "@/lib/utils";

type Props = {
  /** Broker name from site_settings; nothing renders when empty. */
  name?: string | null;
  /** `on-photo` sits over hero imagery, `on-paper` over the page background. */
  tone?: "on-photo" | "on-paper";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES: Record<NonNullable<Props["size"]>, string> = {
  sm: "text-3xl",
  md: "text-4xl md:text-5xl",
  lg: "text-5xl md:text-6xl",
};

/**
 * Handwritten signature motif — the broker's own name in the script font.
 * A quiet, occasional accent standing in for a logo until a real scanned
 * signature is supplied. Never repeated more than a couple of times per page.
 */
export function Signature({ name, tone = "on-paper", size = "md", className }: Props) {
  const value = name?.trim();
  if (!value) return null;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "font-script inline-block select-none",
        SIZES[size],
        tone === "on-photo" ? "text-white/90" : "text-primary",
        className,
      )}
    >
      {value}
    </span>
  );
}
