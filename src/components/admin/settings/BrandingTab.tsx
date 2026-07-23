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
import { BrandingSchema } from "@/lib/validation/site-settings";

import { SaveButton } from "./SaveButton";
import { BrandingPreview } from "./BrandingPreview";

type Values = {
  logo_url: string;
  logo_dark_url: string;
  favicon_url: string;
  og_default_image: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
};

export function BrandingTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(siteSettingsQueryOptions);

  const defaults: Values = {
    logo_url: data.logo_url ?? "",
    logo_dark_url: data.logo_dark_url ?? "",
    favicon_url: data.favicon_url ?? "",
    og_default_image: data.og_default_image ?? "",
    primary_color: data.primary_color ?? "",
    secondary_color: data.secondary_color ?? "",
    accent_color: data.accent_color ?? "",
    font_heading: data.font_heading ?? "",
    font_body: data.font_body ?? "",
  };

  const form = useForm<Values>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(BrandingSchema) as any,
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function save() {
    const ok = await form.trigger();
    if (!ok) throw new Error("validation");
    const values = form.getValues();
    await updateSiteSettings({ data: { tab: "branding", values } });
    await qc.invalidateQueries({ queryKey: siteSettingsQueryOptions.queryKey });
  }

  const w = form.watch();

  return (
    <form className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <TextField form={form} name="logo_url" label={t("admin.settings.branding.logo_url")} />
        <TextField form={form} name="logo_dark_url" label={t("admin.settings.branding.logo_dark_url")} />
        <TextField form={form} name="favicon_url" label={t("admin.settings.branding.favicon_url")} />
        <TextField form={form} name="og_default_image" label={t("admin.settings.branding.og_default_image")} />
        <ColorField form={form} name="primary_color" label={t("admin.settings.branding.primary_color")} />
        <ColorField form={form} name="secondary_color" label={t("admin.settings.branding.secondary_color")} />
        <ColorField form={form} name="accent_color" label={t("admin.settings.branding.accent_color")} />
        <TextField form={form} name="font_heading" label={t("admin.settings.branding.font_heading")} />
        <TextField form={form} name="font_body" label={t("admin.settings.branding.font_body")} />
        <SaveButton onSubmit={save} />
      </div>
      <div>
        <BrandingPreview
          primary={w.primary_color}
          secondary={w.secondary_color}
          accent={w.accent_color}
          fontHeading={w.font_heading}
          fontBody={w.font_body}
        />
      </div>
    </form>
  );
}

function TextField({
  form, name, label,
}: {
  form: ReturnType<typeof useForm<Values>>;
  name: keyof Values;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input {...form.register(name)} />
      {form.formState.errors[name]?.message && (
        <p className="text-xs text-destructive">
          {String(form.formState.errors[name]?.message)}
        </p>
      )}
    </div>
  );
}

function ColorField({
  form, name, label,
}: {
  form: ReturnType<typeof useForm<Values>>;
  name: keyof Values;
  label: string;
}) {
  const value = form.watch(name);
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#([0-9a-f]{6})$/i.test(value) ? value : "#000000"}
          onChange={(e) => form.setValue(name, e.target.value, { shouldDirty: true })}
          className="h-9 w-12 cursor-pointer rounded border border-border bg-background"
          aria-label={label}
        />
        <Input {...form.register(name)} placeholder="#000000" />
      </div>
      {form.formState.errors[name]?.message && (
        <p className="text-xs text-destructive">
          {String(form.formState.errors[name]?.message)}
        </p>
      )}
    </div>
  );
}
