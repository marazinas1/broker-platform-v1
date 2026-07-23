import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { Switch } from "@/components/ui/switch";
import {
  featureFlagsQueryOptions,
  updateFeatureFlag,
} from "@/lib/config/feature-flags.functions";
import { usePermission } from "@/lib/auth/use-permission";

const FLAG_KEYS = [
  "sales", "rentals", "valuation", "sold_archive", "team", "blog",
  "area_pages", "testimonials", "saved_search", "mortgage_calc",
  "virtual_tours", "crm_sync",
] as const;

export function ModulesTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const canEdit = usePermission("design.edit");
  const { data: flags } = useSuspenseQuery(featureFlagsQueryOptions);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!canEdit) {
    return <p className="text-sm text-destructive">{t("admin.settings.modules.denied")}</p>;
  }

  async function toggle(key: string, next: boolean) {
    setPending(key);
    setError(null);
    try {
      await updateFeatureFlag({ data: { key, enabled: next } });
      await qc.invalidateQueries({ queryKey: featureFlagsQueryOptions.queryKey });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-3 max-w-3xl">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {FLAG_KEYS.map((key) => {
        const enabled = Boolean(flags?.[key]?.enabled);
        return (
          <div
            key={key}
            className="flex items-start justify-between gap-4 rounded-md border border-border p-4"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium">
                {t(`admin.settings.modules.flags.${key}.title`)}
              </div>
              <div className="text-xs text-muted-foreground">
                {t(`admin.settings.modules.flags.${key}.description`)}
              </div>
            </div>
            <Switch
              checked={enabled}
              disabled={pending === key}
              onCheckedChange={(v) => toggle(key, v)}
              aria-label={t(`admin.settings.modules.flags.${key}.title`)}
            />
          </div>
        );
      })}
    </div>
  );
}
