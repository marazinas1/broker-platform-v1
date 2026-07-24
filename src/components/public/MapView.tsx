import { useTranslation } from "react-i18next";

type Props = {
  lat: number | null;
  lng: number | null;
  precision: string | null;
};

/**
 * Placeholder for MapLibre + MapTiler. Renders a schematic marker if a
 * coordinate is present and the geo_precision permits it. When the API
 * key is wired the same public API surface can be kept.
 */
export function MapView({ lat, lng, precision }: Props) {
  const { t } = useTranslation();
  const canShow = lat != null && lng != null && precision !== "hidden";

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden border border-border bg-muted">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.4,
        }}
      />
      {canShow ? (
        <div
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-background"
          style={{ left: "50%", top: "50%" }}
        />
      ) : null}
      <div className="absolute bottom-3 left-3 bg-background/90 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {t("listings.detail.map_soon")}
      </div>
      {canShow ? (
        <div className="absolute bottom-3 right-3 bg-background/90 px-3 py-1 text-[11px] tabular-figures text-muted-foreground">
          {lat!.toFixed(3)}, {lng!.toFixed(3)}
        </div>
      ) : null}
    </div>
  );
}
