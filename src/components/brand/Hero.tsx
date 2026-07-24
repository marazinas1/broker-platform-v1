import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import type { PublicListing } from "@/lib/listings/queries.functions";
import { pickImageUrl } from "@/lib/listings/image";
import { pickLocalized } from "@/lib/listings/format";

type Props = {
  locale: Locale;
  featured: PublicListing[];
};

/** Full-bleed hero. Headline lives on the photograph. No CTA button, no gradient wash beyond a soft floor. */
export function Hero({ locale, featured }: Props) {
  const { t } = useTranslation();
  const first = featured[0];
  const heroImg = first ? pickImageUrl(first.images[0]?.variants, "large") : null;
  const caption = first ? pickLocalized(first.title, locale) : "";

  return (
    <section className="relative">
      <div className="relative h-[86vh] w-full overflow-hidden bg-muted md:h-[92vh]">
        {heroImg ? (
          <img
            src={heroImg}
            alt=""
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1400px] px-6 pb-16 lg:px-10 lg:pb-24">
          <h1 className="max-w-5xl font-heading text-5xl leading-[0.98] text-white md:text-7xl lg:text-[7.5rem]">
            {t("home.hero_line")}
          </h1>
          {caption ? (
            <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-white/80">
              {caption}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
