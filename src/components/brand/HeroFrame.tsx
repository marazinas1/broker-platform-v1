import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Fallback hero photograph: a warm, light-filled family home rather than a
 * luxury villa. Any `og_default_image` set in site_settings wins over this.
 */
export const HERO_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=2400&q=80";

/**
 * Full-bleed hero shell. Photography fills the frame; a gradient appears only
 * behind the lower text band so the type stays readable. No other gradients,
 * no shadows.
 */
export function HeroFrame({
  image,
  alt,
  children,
  className,
}: {
  image: string | null;
  alt: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative", className)}>
      <div className="relative h-[88vh] w-full overflow-hidden bg-muted md:h-[92vh]">
        {image ? (
          <img
            src={image}
            alt={alt}
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
        ) : null}
        {/* Text-protection gradient only — confined to the lower band. */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1400px] px-6 pb-14 lg:px-10 lg:pb-20">
          {children}
        </div>
      </div>
    </section>
  );
}

/** Small uppercase fact pair used under the property hero headline. */
export function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow text-white/70">{label}</div>
      <div className="mt-1.5 font-heading text-3xl tabular-figures text-white md:text-4xl">
        {value}
      </div>
    </div>
  );
}
