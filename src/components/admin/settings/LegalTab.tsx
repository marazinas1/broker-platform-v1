import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  siteSettingsQueryOptions,
  updateSiteSettings,
} from "@/lib/config/site-settings.functions";

import { SaveButton } from "./SaveButton";

type Field = "legal_impressum" | "legal_privacy" | "legal_terms";
const FIELDS: Array<{ key: Field; labelKey: string }> = [
  { key: "legal_impressum", labelKey: "admin.settings.legal.impressum" },
  { key: "legal_privacy", labelKey: "admin.settings.legal.privacy" },
  { key: "legal_terms", labelKey: "admin.settings.legal.terms" },
];

export function LegalTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(siteSettingsQueryOptions);
  const locales = data.enabled_locales;

  const [state, setState] = useState<Record<Field, Record<string, string>>>(() => ({
    legal_impressum: fill(locales, data.legal_impressum),
    legal_privacy: fill(locales, data.legal_privacy),
    legal_terms: fill(locales, data.legal_terms),
  }));

  useEffect(() => {
    setState({
      legal_impressum: fill(locales, data.legal_impressum),
      legal_privacy: fill(locales, data.legal_privacy),
      legal_terms: fill(locales, data.legal_terms),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function save() {
    await updateSiteSettings({ data: { tab: "legal", values: state } });
    await qc.invalidateQueries({ queryKey: siteSettingsQueryOptions.queryKey });
  }

  return (
    <form className="space-y-8 max-w-3xl">
      {FIELDS.map((f) => (
        <div key={f.key} className="space-y-3">
          <h3 className="text-base font-semibold">{t(f.labelKey)}</h3>
          {locales.map((loc) => (
            <div key={loc} className="space-y-1.5">
              <Label>{loc.toUpperCase()}</Label>
              <Textarea
                rows={6}
                value={state[f.key][loc] ?? ""}
                placeholder={t("admin.settings.legal.locale_placeholder", { locale: loc })}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    [f.key]: { ...s[f.key], [loc]: e.target.value },
                  }))
                }
              />
            </div>
          ))}
        </div>
      ))}
      <SaveButton onSubmit={save} />
    </form>
  );
}

function fill(locales: string[], source: Record<string, string> | null | undefined) {
  const out: Record<string, string> = {};
  for (const l of locales) out[l] = source?.[l] ?? "";
  return out;
}
