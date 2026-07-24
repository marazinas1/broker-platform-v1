import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  locale: Locale;
  settings: SiteSettings;
};

/**
 * Short introduction paragraph. The body copy comes from
 * site_settings.about_body (localized) so every client tells their own
 * story — solo brokers speak in the first person, teams in the plural.
 * Falls back to the messages file only if a client has not filled it in.
 */
export function AboutBroker({ locale, settings }: Props) {
  const { t } = useTranslation();

  const body =
    settings.about_body?.[locale] ??
    settings.about_body?.[settings.default_locale] ??
    Object.values(settings.about_body ?? {})[0] ??
    t("home.about_body");

  if (!body) return null;

  return (
    <section className="mx-auto mt-40 max-w-[1400px] px-6 lg:px-10">
      <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("home.about")}
          </div>
        </div>
        <div className="md:col-span-8">
          <p className="font-heading text-3xl leading-[1.15] text-foreground md:text-5xl whitespace-pre-line">
            {body}
          </p>
        </div>
      </div>
    </section>
  );
}
