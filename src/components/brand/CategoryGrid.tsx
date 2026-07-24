import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import type { PropertyTypeCounts } from "@/lib/listings/counts.functions";
import { SEARCH_DEFAULTS } from "@/lib/listings/search-schema";

const KNOWN_TYPES = ["house", "apartment", "land", "commercial"] as const;

type Props = {
  locale: Locale;
  counts: PropertyTypeCounts;
};

/**
 * Homepage category grid. One tile per property type with a live count.
 * Zero-count types are hidden. Each tile deep-links into the filtered index.
 */
export function CategoryGrid({ locale, counts }: Props) {
  const { t } = useTranslation();
  const present = KNOWN_TYPES.filter((k) => (counts[k] ?? 0) > 0);
  if (present.length === 0) return null;

  return (
    <section className="mx-auto mt-40 max-w-[1400px] px-6 lg:px-10">
      <h2 className="max-w-3xl font-heading text-4xl md:text-6xl">
        {t("home.categories")}
      </h2>

      <div className="mt-14 grid grid-cols-1 divide-y divide-border border-t border-border sm:grid-cols-2 sm:divide-y-0 sm:border-t md:grid-cols-4">
        {present.map((k) => {
          const count = counts[k] ?? 0;
          return (
            <Link
              key={k}
              to="/$locale/immobilien"
              params={{ locale }}
              search={{ ...SEARCH_DEFAULTS, type: k }}
              className="group flex items-baseline justify-between gap-6 border-border py-8 transition-opacity duration-300 hover:opacity-70 sm:flex-col sm:items-start sm:border-t sm:py-10 sm:pr-8"
            >
              <div className="font-heading text-3xl md:text-4xl">
                {t(`listings.filters.${k}`)}
              </div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground tabular-figures">
                {count}&nbsp;{t("home.count_suffix")}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
