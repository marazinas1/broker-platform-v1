import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import brokerPlaceholder from "@/assets/broker-placeholder.jpg";
import { PublicChrome } from "@/components/public/PublicChrome";
import { CredibilityBar } from "@/components/brand/CredibilityBar";
import { TeamSection } from "@/components/brand/TeamSection";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import type { Locale } from "@/i18n/config";
import { translate } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { featureFlagsQueryOptions } from "@/lib/config/feature-flags.functions";
import { publicTeamQueryOptions } from "@/lib/team/queries.functions";
import { getRequestOrigin } from "@/lib/seo/origin.functions";
import { buildHead } from "@/lib/seo/build-head";

export const Route = createFileRoute("/$locale/ueber-mich")({
  loader: async ({ context, params }) => {
    const [settings, origin, flags] = await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQueryOptions),
      getRequestOrigin(),
      context.queryClient.ensureQueryData(featureFlagsQueryOptions),
      context.queryClient.ensureQueryData(publicTeamQueryOptions),
    ]);
    return { settings, origin, flags, locale: params.locale as Locale };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "…" }] };
    const { settings, origin, locale, flags } = loaderData;
    const teamEnabled = flags?.team?.enabled !== false;
    const navKey = teamEnabled ? "nav.about_team" : "nav.about_solo";
    const descKey = teamEnabled
      ? "pages.about.meta_description_team"
      : "pages.about.meta_description_solo";
    const title = `${translate(locale, navKey)} — ${settings.site_name}`;
    return buildHead({
      origin,
      path: `/${locale}/ueber-mich`,
      locale,
      enabledLocales: settings.enabled_locales,
      defaultLocale: settings.default_locale,
      title,
      description: translate(locale, descKey),
      siteName: settings.site_name,
      ogDefaultImage: settings.og_default_image,
    });
  },
  component: AboutPage,
});

function AboutPage() {
  const { locale } = Route.useParams();
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const { data: team } = useSuspenseQuery(publicTeamQueryOptions);
  const teamEnabled = useFeatureFlag("team");
  const l = locale as Locale;

  const scope = teamEnabled ? "pages.about.team" : "pages.about.solo";
  const paragraphs = t(`${scope}.paragraphs`, { returnObjects: true }) as string[];
  const qualifications = teamEnabled
    ? []
    : (t("pages.about.solo.qualifications", { returnObjects: true }) as string[]);

  const portrait = settings.primary_agent_photo_url ?? brokerPlaceholder;
  const showTeamGrid = teamEnabled && team.length > 0;

  return (
    <PublicChrome locale={l} settings={settings}>
      <section className="mx-auto max-w-[1400px] px-6 pt-24 lg:px-10">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="aspect-[4/5] w-full overflow-hidden bg-muted">
              <img
                src={portrait}
                alt={settings.primary_agent_name ?? settings.site_name}
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          </div>
          <div className="md:col-span-7">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("pages.about.kicker")}
            </div>
            <h1 className="mt-6 font-heading text-4xl leading-[1.05] md:text-6xl">
              {t(`${scope}.headline`)}
            </h1>
            <div className="mt-10 space-y-6 text-base leading-relaxed text-foreground">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {settings.primary_agent_name ? (
              <div className="mt-12 border-t border-border pt-6">
                <div className="font-heading text-xl">{settings.primary_agent_name}</div>
                {settings.primary_agent_role ? (
                  <div className="mt-1 text-sm text-muted-foreground">
                    {settings.primary_agent_role}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {qualifications.length > 0 ? (
        <section className="mx-auto mt-32 max-w-[1400px] px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
            <div className="md:col-span-4">
              <h2 className="font-heading text-3xl leading-[1.1] md:text-4xl">
                {t("pages.about.solo.qualifications_title")}
              </h2>
            </div>
            <div className="md:col-span-8">
              <ul className="space-y-6 border-t border-border pt-8 text-lg">
                {qualifications.map((q, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="mt-3 h-px w-8 shrink-0 bg-foreground" aria-hidden />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {showTeamGrid ? <TeamSection members={team} /> : null}

      <CredibilityBar locale={l} stats={settings.credibility_stats ?? []} settings={settings} />

      <section className="mx-auto mt-40 max-w-[1400px] px-6 pb-32 lg:px-10">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("home.contact")}
            </div>
            <h2 className="mt-6 font-heading text-3xl leading-[1.05] md:text-4xl">
              {t(teamEnabled ? "pages.about.contact_title_team" : "pages.about.contact_title_solo")}
            </h2>
          </div>
          <div className="md:col-span-8 space-y-3 text-base text-foreground">
            {settings.contact_email ? (
              <div>
                <a className="hover:opacity-70" href={`mailto:${settings.contact_email}`}>
                  {settings.contact_email}
                </a>
              </div>
            ) : null}
            {settings.contact_phone ? (
              <div className="tabular-figures">{settings.contact_phone}</div>
            ) : null}
            {settings.address_street ? (
              <div className="pt-4 text-sm text-muted-foreground">
                {settings.address_street}
                <br />
                {settings.address_zip} {settings.address_city}
                <br />
                {settings.address_country ?? ""}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}
