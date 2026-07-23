import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { stripLocale } from "@/lib/seo/hreflang";

export function LocaleSwitcher({
  currentLocale,
  enabledLocales,
}: {
  currentLocale: string;
  enabledLocales: string[];
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const subpath = stripLocale(location.pathname, enabledLocales);

  return (
    <nav aria-label={t("locale.switch")} className="flex items-center gap-2 text-sm">
      {enabledLocales.map((loc) => {
        const isActive = loc === currentLocale;
        const target = `/${loc}${subpath === "/" ? "" : subpath}`;
        return (
          <Link
            key={loc}
            to={target}
            className={
              isActive
                ? "font-semibold underline underline-offset-4"
                : "text-muted-foreground hover:text-foreground"
            }
            aria-current={isActive ? "true" : undefined}
          >
            {loc.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
