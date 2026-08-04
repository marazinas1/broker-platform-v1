import { useTranslation } from "react-i18next";

type Props = {
  title: string;
  locationLine: string;
  contactHref: string;
};

/**
 * Overlay rendered on the lower part of the detail-page hero image:
 * headline in the serif, location line, and one sage call-to-action.
 * Text sits on a soft bottom gradient so photography stays dominant.
 */
export function ListingHeroOverlay({ title, locationLine, contactHref }: Props) {
  const { t } = useTranslation();

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-6 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-6 pt-24 sm:p-10 sm:pt-32 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 text-white">
        <h1 className="max-w-3xl font-heading text-3xl leading-[1.08] md:text-5xl lg:text-6xl">
          {title}
        </h1>
        {locationLine ? (
          <div className="mt-3 text-sm text-white/80">{locationLine}</div>
        ) : null}
      </div>
      <a
        href={contactHref}
        className="pointer-events-auto inline-flex flex-none items-center justify-center rounded-full bg-primary px-6 py-3 text-sm text-primary-foreground transition-colors duration-500 ease-out hover:bg-primary/85"
      >
        {t("listings.detail.contact_agent")}
      </a>
    </div>
  );
}
