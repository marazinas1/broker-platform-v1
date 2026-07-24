import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import type { CredibilityStat } from "@/types/site-settings";

type Props = {
  locale: Locale;
  stats: CredibilityStat[];
};

/**
 * A row of large numerals with small labels beneath. Values come from
 * site_settings.credibility_stats so each client can state their own numbers.
 */
export function CredibilityBar({ locale, stats }: Props) {
  const { t } = useTranslation();
  if (!stats || stats.length === 0) return null;

  return (
    <section className="mx-auto mt-40 max-w-[1400px] px-6 lg:px-10">
      <div className="mb-14 max-w-2xl">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("home.credibility_kicker", { defaultValue: "Warum Rheinberger" })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-14 border-t border-border pt-14 md:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i}>
            <div className="font-sans text-5xl tabular-figures text-foreground md:text-6xl">
              {s.value}
            </div>
            <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {s.label?.[locale] ?? s.label?.de ?? Object.values(s.label ?? {})[0] ?? ""}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
