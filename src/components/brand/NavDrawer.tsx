import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { BrandMark } from "@/components/brand/BrandMark";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import type { Locale } from "@/i18n/config";
import type { SiteSettings } from "@/types/site-settings";

type Item = { to: "/$locale/immobilien" | string; label: string };

type Props = {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  settings: SiteSettings;
  items: Item[];
};

/** Full-screen mobile menu. Calm fade + no layout jump; closes on Escape. */
export function NavDrawer({ open, onClose, locale, settings, items }: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="pointer-events-auto fixed inset-0 z-50 flex flex-col bg-background lg:hidden"
    >
      <div className="flex items-center justify-between px-6 py-6">
        <BrandMark settings={settings} />
        <button
          type="button"
          onClick={onClose}
          aria-label={t("nav.close")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 text-lg"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-6 px-6 pt-6">
        {items.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            params={{ locale }}
            onClick={onClose}
            className="font-heading text-3xl text-foreground"
          >
            {n.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center justify-between gap-4 border-t border-border/70 px-6 py-6">
        <LocaleSwitcher currentLocale={locale} enabledLocales={settings.enabled_locales} />
        <Link
          to="/$locale/kontakt"
          params={{ locale }}
          onClick={onClose}
          className="rounded-full bg-primary px-6 py-3 text-sm text-primary-foreground"
        >
          {t("nav.contact")}
        </Link>
      </div>
    </div>
  );
}
