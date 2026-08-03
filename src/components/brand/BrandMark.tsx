import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  settings: SiteSettings;
  /** `light` inverts the mark for use over hero photography. */
  tone?: "dark" | "light";
  className?: string;
};

/**
 * Typographic logo: the client name in the heading serif with a wide-tracked
 * descriptor beneath. Both strings come from site_settings / translations, so a
 * fork only changes data, never this component.
 */
export function BrandMark({ settings, tone = "dark", className }: Props) {
  const { t } = useTranslation();
  const name = settings.site_name;
  const descriptor = t("brand.descriptor");

  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span
        className={cn(
          "font-heading text-xl md:text-2xl",
          tone === "light" ? "text-white" : "text-foreground",
        )}
      >
        {name}
      </span>
      {descriptor ? (
        <span
          className={cn(
            "eyebrow mt-1.5",
            tone === "light" ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {descriptor}
        </span>
      ) : null}
    </span>
  );
}
