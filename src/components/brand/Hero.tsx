import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

import brokerPlaceholder from "@/assets/katharina-berg.jpg";
import type { Locale } from "@/i18n/config";
import type { PublicListing } from "@/lib/listings/queries.functions";
import { pickImageUrl } from "@/lib/listings/image";
import { formatArea, formatPrice, pickLocalized } from "@/lib/listings/format";
import type { HeroVariant, SiteSettings } from "@/types/site-settings";

type Props = {
  locale: Locale;
  featured: PublicListing[];
  settings: SiteSettings;
  variant?: HeroVariant;
};

/**
 * Homepage hero. Three variants, chosen by `homepage_sections[hero].variant`:
 *  - region:   full-bleed landscape image with positioning line on top.
 *  - property: the first featured listing carries the hero (title/location/price/area).
 *  - broker:   portrait alongside the positioning line.
 * All copy and imagery come from site_settings + listings — no hardcoded strings.
 */
export function Hero({ locale, featured, settings, variant = "region" }: Props) {
  if (variant === "property") return <PropertyHero locale={locale} featured={featured} settings={settings} />;
  if (variant === "broker") return <BrokerHero settings={settings} />;
  return <RegionHero settings={settings} featured={featured} />;
}

function RegionHero({
  settings,
  featured,
}: {
  settings: SiteSettings;
  featured: PublicListing[];
}) {
  const { t } = useTranslation();
  const fallback = featured[0] ? pickImageUrl(featured[0].images[0]?.variants, "large") : null;
  const heroImg = settings.og_default_image ?? fallback;

  return (
    <section className="relative">
      <div className="relative h-[86vh] w-full overflow-hidden bg-muted md:h-[92vh]">
        {heroImg ? (
          <img
            src={heroImg}
            alt=""
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1400px] px-6 pb-16 lg:px-10 lg:pb-24">
          <h1 className="max-w-5xl font-heading text-5xl leading-[0.98] text-white md:text-7xl lg:text-[7.5rem]">
            {t("home.hero_line")}
          </h1>
        </div>
      </div>
    </section>
  );
}

function PropertyHero({
  locale,
  featured,
  settings,
}: {
  locale: Locale;
  featured: PublicListing[];
  settings: SiteSettings;
}) {
  const { t } = useTranslation();
  const first = featured[0];
  if (!first) {
    return <RegionHero settings={settings} featured={featured} />;
  }
  const heroImg = pickImageUrl(first.images[0]?.variants, "large");
  const title = pickLocalized(first.title, locale) || first.slug;
  const price = formatPrice(first.price, settings.currency, locale, {
    onRequest: first.price_on_request,
    period: first.price_period,
    onRequestLabel: t("listings.on_request"),
  });
  const location =
    first.geo_precision === "hidden"
      ? [first.address_zip, first.address_city].filter(Boolean).join(" ")
      : [first.address_street, first.address_zip, first.address_city]
          .filter(Boolean)
          .join(" · ");
  const area =
    first.living_area != null
      ? formatArea(first.living_area, settings.area_unit, locale)
      : null;

  return (
    <section className="relative">
      <div className="relative h-[86vh] w-full overflow-hidden bg-muted md:h-[92vh]">
        {heroImg ? (
          <img
            src={heroImg}
            alt={title}
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1400px] px-6 pb-16 lg:px-10 lg:pb-24">
          <div className="text-[11px] uppercase tracking-[0.2em] text-white/80">
            {first.reference_code
              ? `${t("listings.detail.reference")} · ${first.reference_code}`
              : t(first.deal_type === "rent" ? "listings.for_rent" : "listings.for_sale")}
          </div>
          <h1 className="mt-4 max-w-5xl font-heading text-5xl leading-[1.02] text-white md:text-7xl lg:text-8xl">
            <Link to="/$locale/immobilien/$slug" params={{ locale, slug: first.slug }}>
              {title}
            </Link>
          </h1>
          {location ? (
            <p className="mt-4 text-sm text-white/85">{location}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap items-baseline gap-x-12 gap-y-4 border-t border-white/30 pt-6 text-white">
            <Fact label={t(first.deal_type === "rent" ? "listings.for_rent" : "listings.for_sale")} value={price} />
            {area ? <Fact label={t("listings.detail.living_area")} value={area} /> : null}
            {first.rooms != null ? (
              <Fact label={t("listings.detail.rooms")} value={String(first.rooms)} />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function BrokerHero({ settings }: { settings: SiteSettings }) {
  const { t } = useTranslation();
  const photo = settings.primary_agent_photo_url && settings.primary_agent_photo_url.trim().length > 0
    ? settings.primary_agent_photo_url
    : brokerPlaceholder;
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-32 pb-24 lg:px-10 lg:pt-40 lg:pb-32">
      <div className="grid items-end gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {settings.site_name}
          </div>
          <h1 className="mt-6 font-heading text-5xl leading-[1.02] md:text-7xl lg:text-[6.5rem]">
            {t("home.hero_line")}
          </h1>
          {settings.primary_agent_name ? (
            <p className="mt-8 text-sm text-muted-foreground">
              {settings.primary_agent_name}
              {settings.primary_agent_role ? ` · ${settings.primary_agent_role}` : ""}
            </p>
          ) : null}
        </div>
        <div className="md:col-span-5">
          <img
            src={photo}
            alt={settings.primary_agent_name ?? ""}
            className="h-[70vh] w-full object-cover"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/70">
        {label}
      </div>
      <div className="mt-1 font-heading text-3xl tabular-figures md:text-4xl">
        {value}
      </div>
    </div>
  );
}
