import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  siteSettingsQueryOptions,
  updateSiteSettings,
} from "@/lib/config/site-settings.functions";
import {
  GeneralSchema,
  type GeneralInput,
  CountrySchema,
  AreaUnitSchema,
} from "@/lib/validation/site-settings";

import { SaveButton } from "./SaveButton";

const COUNTRIES = CountrySchema.options;
const AREA_UNITS = AreaUnitSchema.options;

export function GeneralTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(siteSettingsQueryOptions);

  const form = useForm<GeneralInput>({
    resolver: zodResolver(GeneralSchema),
    defaultValues: {
      site_name: data.site_name,
      legal_name: data.legal_name ?? "",
      country: data.country,
      default_locale: data.default_locale,
      enabled_locales: data.enabled_locales,
      currency: data.currency,
      area_unit: data.area_unit,
    },
  });

  useEffect(() => {
    form.reset({
      site_name: data.site_name,
      legal_name: data.legal_name ?? "",
      country: data.country,
      default_locale: data.default_locale,
      enabled_locales: data.enabled_locales,
      currency: data.currency,
      area_unit: data.area_unit,
    });
  }, [data, form]);

  async function save() {
    const values = await form.handleSubmitAsync();
    await updateSiteSettings({ data: { tab: "general", values } });
    await qc.invalidateQueries({ queryKey: siteSettingsQueryOptions.queryKey });
  }

  return (
    <form className="space-y-4 max-w-2xl">
      <Field label={t("admin.settings.general.site_name")} error={form.formState.errors.site_name?.message}>
        <Input {...form.register("site_name")} />
      </Field>
      <Field label={t("admin.settings.general.legal_name")} error={form.formState.errors.legal_name?.message}>
        <Input {...form.register("legal_name")} />
      </Field>
      <Field label={t("admin.settings.general.country")}>
        <Select
          value={form.watch("country")}
          onValueChange={(v) => form.setValue("country", v as GeneralInput["country"], { shouldDirty: true })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label={t("admin.settings.general.default_locale")}>
        <Input {...form.register("default_locale")} />
      </Field>
      <Field
        label={t("admin.settings.general.enabled_locales")}
        help={t("admin.settings.general.enabled_locales_help")}
      >
        <Input
          value={form.watch("enabled_locales").join(", ")}
          onChange={(e) =>
            form.setValue(
              "enabled_locales",
              e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              { shouldDirty: true },
            )
          }
        />
      </Field>
      <Field label={t("admin.settings.general.currency")}>
        <Input {...form.register("currency")} />
      </Field>
      <Field label={t("admin.settings.general.area_unit")}>
        <Select
          value={form.watch("area_unit")}
          onValueChange={(v) => form.setValue("area_unit", v as GeneralInput["area_unit"], { shouldDirty: true })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {AREA_UNITS.map((u) => (
              <SelectItem key={u} value={u}>{t(`admin.settings.general.${u}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <SaveButton onSubmit={save} />
    </form>
  );
}

function Field({
  label, help, error, children,
}: { label: string; help?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Small helper: react-hook-form gives us handleSubmit, but we want a promise
// of validated values. Extend the FormReturn shape locally.
declare module "react-hook-form" {
  interface UseFormReturn<TFieldValues extends import("react-hook-form").FieldValues> {
    handleSubmitAsync(): Promise<TFieldValues>;
  }
}
