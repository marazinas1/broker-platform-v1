import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  siteSettingsQueryOptions,
  updateSiteSettings,
} from "@/lib/config/site-settings.functions";
import { ContactSchema } from "@/lib/validation/site-settings";

import { SaveButton } from "./SaveButton";

type Values = {
  contact_email: string;
  contact_phone: string;
  whatsapp: string;
  address_street: string;
  address_zip: string;
  address_city: string;
  address_country: string;
  geo_lat: string;
  geo_lng: string;
};

export function ContactTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(siteSettingsQueryOptions);

  const [hoursText, setHoursText] = useState(() =>
    JSON.stringify(data.opening_hours ?? {}, null, 2),
  );
  const [socialText, setSocialText] = useState(() =>
    JSON.stringify(data.social ?? {}, null, 2),
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const defaults: Values = {
    contact_email: data.contact_email ?? "",
    contact_phone: data.contact_phone ?? "",
    whatsapp: data.whatsapp ?? "",
    address_street: data.address_street ?? "",
    address_zip: data.address_zip ?? "",
    address_city: data.address_city ?? "",
    address_country: data.address_country ?? "",
    geo_lat: data.geo_lat != null ? String(data.geo_lat) : "",
    geo_lng: data.geo_lng != null ? String(data.geo_lng) : "",
  };

  const form = useForm<Values>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ContactSchema) as any,
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
    setHoursText(JSON.stringify(data.opening_hours ?? {}, null, 2));
    setSocialText(JSON.stringify(data.social ?? {}, null, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function save() {
    setJsonError(null);
    let opening_hours: Record<string, unknown> = {};
    let social: Record<string, unknown> = {};
    try {
      opening_hours = hoursText.trim() ? JSON.parse(hoursText) : {};
      social = socialText.trim() ? JSON.parse(socialText) : {};
    } catch {
      setJsonError(t("admin.settings.contact.json_invalid"));
      throw new Error("invalid json");
    }
    const ok = await form.trigger();
    if (!ok) throw new Error("validation");
    const values = { ...form.getValues(), opening_hours, social };
    await updateSiteSettings({ data: { tab: "contact", values } });
    await qc.invalidateQueries({ queryKey: siteSettingsQueryOptions.queryKey });
  }

  return (
    <form className="space-y-4 max-w-3xl">
      <Row>
        <TF form={form} name="contact_email" label={t("admin.settings.contact.contact_email")} />
        <TF form={form} name="contact_phone" label={t("admin.settings.contact.contact_phone")} />
        <TF form={form} name="whatsapp" label={t("admin.settings.contact.whatsapp")} />
      </Row>
      <Row>
        <TF form={form} name="address_street" label={t("admin.settings.contact.address_street")} />
        <TF form={form} name="address_zip" label={t("admin.settings.contact.address_zip")} />
        <TF form={form} name="address_city" label={t("admin.settings.contact.address_city")} />
        <TF form={form} name="address_country" label={t("admin.settings.contact.address_country")} />
      </Row>
      <Row>
        <TF form={form} name="geo_lat" label={t("admin.settings.contact.geo_lat")} />
        <TF form={form} name="geo_lng" label={t("admin.settings.contact.geo_lng")} />
      </Row>
      <div className="space-y-1.5">
        <Label>{t("admin.settings.contact.opening_hours")}</Label>
        <Textarea rows={5} value={hoursText} onChange={(e) => setHoursText(e.target.value)} />
        <p className="text-xs text-muted-foreground">{t("admin.settings.contact.json_help")}</p>
      </div>
      <div className="space-y-1.5">
        <Label>{t("admin.settings.contact.social")}</Label>
        <Textarea rows={5} value={socialText} onChange={(e) => setSocialText(e.target.value)} />
        <p className="text-xs text-muted-foreground">{t("admin.settings.contact.json_help")}</p>
      </div>
      {jsonError && <p className="text-sm text-destructive">{jsonError}</p>}
      <SaveButton onSubmit={save} />
    </form>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
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
