import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState, type ReactNode } from "react";

import { BrandMark } from "@/components/brand/BrandMark";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";

import { useFeatureFlag } from "@/hooks/use-feature-flag";
import type { Locale } from "@/i18n/config";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  locale: Locale;
  settings: SiteSettings;
  children: ReactNode;
};

/** Site header + footer wrapper for public pages. */
export function PublicChrome({ locale, settings, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header locale={locale} settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} settings={settings} />
    </div>
  );
}

function useNavItems() {
  const { t } = useTranslation();
  const teamEnabled = useFeatureFlag("team");
  return [
    { to: "/$locale/immobilien" as const, label: t("nav.listings") },
    { to: "/$locale/verkauft" as const, label: t("nav.sold") },
    { to: "/$locale/immobilienbewertung" as const, label: t("nav.valuation") },
    { to: "/$locale/verkaufen" as const, label: t("nav.selling") },
    {
      to: "/$locale/ueber-mich" as const,
      label: t(teamEnabled ? "nav.about_team" : "nav.about_solo"),
    },
    { to: "/$locale/kontakt" as const, label: t("nav.contact") },
  ];
}

function Header({ locale, settings }: { locale: Locale; settings: SiteSettings }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const nav = useNavItems();

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 lg:px-10">
        <Link
          to="/$locale"
          params={{ locale }}
          className="transition-opacity duration-300 hover:opacity-80"
        >
          <BrandMark settings={settings} />
        </Link>


        <nav className="hidden items-center gap-8 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              params={{ locale }}
              className="text-sm text-muted-foreground transition-opacity duration-300 hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
          <LocaleSwitcher currentLocale={locale} enabledLocales={settings.enabled_locales} />
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-sm lg:hidden"
          aria-label={t("nav.menu")}
        >
          {t("nav.menu")}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border lg:hidden">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-6 py-6">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                params={{ locale }}
                onClick={() => setOpen(false)}
                className="text-base text-foreground"
              >
                {n.label}
              </Link>
            ))}
            <div className="pt-2">
              <LocaleSwitcher
                currentLocale={locale}
                enabledLocales={settings.enabled_locales}
              />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function Footer({ locale, settings }: { locale: Locale; settings: SiteSettings }) {
  const { t } = useTranslation();
  return (
    <footer className="mt-24 border-t border-border/60 bg-background">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-14 md:grid-cols-3 lg:px-10">
        <div>
          <div className="font-heading text-2xl">{settings.site_name}</div>
          {settings.address_street ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {settings.address_street}
              <br />
              {settings.address_zip} {settings.address_city}
              <br />
              {settings.address_country ?? ""}
            </p>
          ) : null}
        </div>
        <div className="text-sm text-muted-foreground">
          {settings.contact_email ? (
            <div>
              <a className="hover:text-foreground" href={`mailto:${settings.contact_email}`}>
                {settings.contact_email}
              </a>
            </div>
          ) : null}
          {settings.contact_phone ? <div className="tabular-figures">{settings.contact_phone}</div> : null}
        </div>
        <div className="text-sm text-muted-foreground md:text-right">
          <div>
            © {new Date().getFullYear()} {settings.legal_name ?? settings.site_name}.{" "}
            {t("footer.rights")}.
          </div>
          <div className="mt-2 flex gap-4 md:justify-end">
            <Link to="/$locale/admin" params={{ locale }} className="hover:text-foreground">
              {t("nav.admin")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
