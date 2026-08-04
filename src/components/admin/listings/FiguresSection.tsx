import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow, FormSection } from "./FieldRow";

type NumericKey =
  | "price"
  | "living_area"
  | "plot_area"
  | "usable_area"
  | "rooms"
  | "bedrooms"
  | "bathrooms"
  | "floor"
  | "total_floors"
  | "year_built"
  | "year_renovated";

const FIELDS: { key: NumericKey; step?: string }[] = [
  { key: "living_area", step: "0.01" },
  { key: "plot_area", step: "0.01" },
  { key: "usable_area", step: "0.01" },
  { key: "rooms", step: "0.5" },
  { key: "bedrooms" },
  { key: "bathrooms" },
  { key: "floor" },
  { key: "total_floors" },
  { key: "year_built" },
  { key: "year_renovated" },
];

export function FiguresSection({ form }: { form: ListingFormApi }) {
  const { t } = useTranslation();
  const { values } = form;

  const num = (key: NumericKey) =>
    values[key] === null || values[key] === undefined ? "" : String(values[key]);

  const onNum = (key: NumericKey) => (raw: string) =>
    form.setField(key, raw === "" ? null : Number(raw));

  return (
    <FormSection title={t("admin.listings.sections.figures")}>
      <div className="grid gap-4">
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <div>
            <div className="text-sm font-medium">
              {t("admin.listings.fields.price_on_request")}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("admin.listings.help.price_on_request")}
            </p>
          </div>
          <Switch
            checked={!!values.price_on_request}
            onCheckedChange={(checked) => form.setField("price_on_request", checked)}
          />
        </div>

        {!values.price_on_request ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label={t("admin.listings.fields.price")}>
              <Input
                type="number"
                inputMode="decimal"
                value={num("price")}
                onChange={(e) => onNum("price")(e.target.value)}
              />
            </FieldRow>
            {values.deal_type === "rent" ? (
              <FieldRow
                label={t("admin.listings.fields.price_period")}
                help={t("admin.listings.help.price_period")}
              >
                <Input
                  value={values.price_period ?? ""}
                  onChange={(e) =>
                    form.setField("price_period", e.target.value || null)
                  }
                  placeholder="month"
                />
              </FieldRow>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map(({ key, step }) => (
            <FieldRow key={key} label={t(`admin.listings.fields.${key}`)}>
              <Input
                type="number"
                inputMode="decimal"
                step={step}
                value={num(key)}
                onChange={(e) => onNum(key)(e.target.value)}
              />
            </FieldRow>
          ))}
        </div>
      </div>
    </FormSection>
  );
}
