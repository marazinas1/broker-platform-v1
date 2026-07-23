import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  siteSettingsQueryOptions,
  updateSiteSettings,
} from "@/lib/config/site-settings.functions";
import { AnalyticsSchema } from "@/lib/validation/site-settings";

import { SaveButton } from "./SaveButton";

type Values = {
  google_analytics_id: string;
  google_site_verification: string;
  plausible_domain: string;
};

export function AnalyticsTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(siteSettingsQueryOptions);

  const defaults: Values = {
    google_analytics_id: data.google_analytics_id ?? "",
    google_site_verification: data.google_site_verification ?? "",
    plausible_domain: data.plausible_domain ?? "",
  };

  const form = useForm<Values>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(AnalyticsSchema) as any,
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function save() {
    const ok = await form.trigger();
    if (!ok) throw new Error("validation");
    await updateSiteSettings({ data: { tab: "analytics", values: form.getValues() } });
    await qc.invalidateQueries({ queryKey: siteSettingsQueryOptions.queryKey });
  }

  return (
    <form className="space-y-4 max-w-2xl">
      <TF form={form} name="google_analytics_id" label={t("admin.settings.analytics.google_analytics_id")} />
      <TF form={form} name="google_site_verification" label={t("admin.settings.analytics.google_site_verification")} />
      <TF form={form} name="plausible_domain" label={t("admin.settings.analytics.plausible_domain")} />
      <SaveButton onSubmit={save} />
    </form>
  );
}

function TF({
  form, name, label,
}: { form: ReturnType<typeof useForm<Values>>; name: keyof Values; label: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input {...form.register(name)} />
    </div>
  );
}
