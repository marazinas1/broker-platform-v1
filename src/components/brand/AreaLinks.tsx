import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";

type Props = {
  locale: Locale;
  areaKeys?: readonly string[];
};

const DEFAULT_AREAS = ["fohnsdorf", "judenburg", "knittelfeld", "zeltweg"] as const;

/** Broker service area — town names as large-typography anchor links. */
export function AreaLinks({ locale, areaKeys = DEFAULT_AREAS }: Props) {
  const { t } = useTranslation();

  return (
    <section className="mx-auto mt-40 max-w-[1400px] px-6 lg:px-10">
      <h2 className="max-w-3xl font-heading text-4xl md:text-6xl">{t("home.areas")}</h2>

      <div className="mt-14 grid grid-cols-2 gap-x-10 gap-y-2 md:grid-cols-4">
        {areaKeys.map((a) => (
          <Link
            key={a}
            to="/$locale/immobilien"
            params={{ locale }}
            search={{
              deal: "",
              type: "",
              city: t(`areas.${a}`),
              rooms_min: 0,
              price_min: 0,
              price_max: 0,
              area_min: 0,
              sort: "newest",
              page: 1,
              view: "grid",
            }}
            className="group border-t border-border py-8 transition-opacity duration-300 hover:opacity-70"
          >
            <div className="font-heading text-3xl md:text-4xl">{t(`areas.${a}`)}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
