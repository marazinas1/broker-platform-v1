import { useTranslation } from "react-i18next";

type Props = {
  energy: any;
  propertyType: string;
};

/**
 * Austrian energy certificate panel per §5 EAVG: HWB, fGEE and efficiency
 * class shown together. Land and garage are exempt.
 */
export function EnergyPanel({ energy, propertyType }: Props) {
  const { t } = useTranslation();

  if (propertyType === "land" || propertyType === "garage") return null;

  const hwb = energy?.hwb;
  const eeb = energy?.eeb;
  const cls = energy?.efficiency_class;

  if (hwb == null && eeb == null && !cls) {
    return (
      <section>
        <h2 className="font-heading text-3xl md:text-4xl">
          {t("listings.detail.energy")}
        </h2>
        <p className="mt-6 text-sm text-muted-foreground">
          {t("listings.detail.energy_missing")}
        </p>
      </section>
    );
  }

  const cells: Array<{ label: string; value: string }> = [];
  if (hwb != null)
    cells.push({ label: t("listings.detail.energy_hwb"), value: `${hwb} kWh/m²·a` });
  if (eeb != null) cells.push({ label: t("listings.detail.energy_eeb"), value: String(eeb) });
  if (cls) cells.push({ label: t("listings.detail.energy_class"), value: String(cls) });

  return (
    <section>
      <h2 className="font-heading text-3xl md:text-4xl">
        {t("listings.detail.energy")}
      </h2>
      <dl className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {cells.map((c) => (
          <div key={c.label} className="border-t border-border pt-4">
            <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {c.label}
            </dt>
            <dd className="mt-3 font-heading text-3xl tabular-figures text-foreground">
              {c.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
