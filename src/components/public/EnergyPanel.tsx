import { useTranslation } from "react-i18next";

type Props = {
  energy: any;
  propertyType: string;
};

/**
 * Renders the Austrian energy certificate panel per §5 EAVG:
 * HWB, fGEE and efficiency class must be shown together. Land/garage exempt.
 */
export function EnergyPanel({ energy, propertyType }: Props) {
  const { t } = useTranslation();

  if (propertyType === "land" || propertyType === "garage") return null;

  const hwb = energy?.hwb;
  const eeb = energy?.eeb;
  const cls = energy?.efficiency_class;

  if (hwb == null && eeb == null && !cls) {
    return (
      <div className="border-t border-border pt-8">
        <h2 className="font-heading text-2xl">{t("listings.detail.energy")}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{t("listings.detail.energy_missing")}</p>
      </div>
    );
  }

  const cells: Array<{ label: string; value: string }> = [];
  if (hwb != null) cells.push({ label: t("listings.detail.energy_hwb"), value: `${hwb} kWh/m²·a` });
  if (eeb != null) cells.push({ label: t("listings.detail.energy_eeb"), value: String(eeb) });
  if (cls) cells.push({ label: t("listings.detail.energy_class"), value: String(cls) });

  return (
    <section className="border-t border-border pt-10">
      <h2 className="font-heading text-3xl">{t("listings.detail.energy")}</h2>
      <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {cells.map((c) => (
          <div key={c.label} className="border-l border-border pl-4">
            <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {c.label}
            </dt>
            <dd className="mt-1 font-heading text-2xl tabular-figures text-foreground">
              {c.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
