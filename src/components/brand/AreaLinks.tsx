import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { SEARCH_DEFAULTS } from "@/lib/listings/search-schema";

type Props = {
  locale: Locale;
  /** Cities discovered from the actual listings dataset. */
  cities: string[];
};

/** Broker service area — town names as large-typography anchor links.
 *  Cities are derived from the live listings so a swapped dataset never
 *  leaves stale place names on the homepage. Heading switches between
 *  solo and team wording based on the `team` feature flag. */
export function AreaLinks({ locale, cities }: Props) {
  const { t } = useTranslation();
  const teamEnabled = useFeatureFlag("team");
  if (cities.length === 0) return null;

  return (
    <section className="mx-auto mt-40 max-w-[1400px] px-6 lg:px-10">
      <h2 className="max-w-3xl font-heading text-4xl md:text-6xl">
        {t(teamEnabled ? "home.areas" : "home.areas_solo")}
      </h2>

      <div className="mt-14 grid grid-cols-2 gap-x-10 gap-y-2 md:grid-cols-4">
        {cities.map((city) => (
          <Link
            key={city}
            to="/$locale/immobilien"
            params={{ locale }}
            search={{ ...SEARCH_DEFAULTS, city }}
            className="group border-t border-border py-8 transition-opacity duration-300 hover:opacity-70"
          >
            <div className="font-heading text-3xl md:text-4xl">{city}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
