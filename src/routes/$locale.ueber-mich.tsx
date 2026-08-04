import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { PublicChrome } from "@/components/public/PublicChrome";
import { AgentIntro } from "@/components/brand/AgentIntro";
import { AgentListings } from "@/components/brand/AgentListings";
import { CredibilityBar } from "@/components/brand/CredibilityBar";
import { ContactSection } from "@/components/brand/ContactSection";
import { SoldStrip } from "@/components/brand/SoldStrip";
import { TeamSection } from "@/components/brand/TeamSection";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import type { Locale } from "@/i18n/config";
import { translate } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { featureFlagsQueryOptions } from "@/lib/config/feature-flags.functions";
import { publicTeamQueryOptions } from "@/lib/team/queries.functions";
import {
  activeListingsQueryOptions,
  recentSoldQueryOptions,
} from "@/lib/listings/queries.functions";
import { pickLocalized } from "@/lib/listings/format";
import { getRequestOrigin } from "@/lib/seo/origin.functions";
import { buildHead } from "@/lib/seo/build-head";

export const Route = createFileRoute("/$locale/ueber-mich")({
  loader: async ({ context, params }) => {
    const [settings, origin, flags] = await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQueryOptions),
      getRequestOrigin(),
      context.queryClient.ensureQueryData(featureFlagsQueryOptions),
      context.queryClient.ensureQueryData(publicTeamQueryOptions),
      context.queryClient.ensureQueryData(activeListingsQueryOptions),
      context.queryClient.ensureQueryData(recentSoldQueryOptions),
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
      ogDefaultImage: settings.primary_agent_photo_url ?? settings.og_default_image,
    });
  },
  component: AboutPage,
});

function AboutPage() {
  const { locale } = Route.useParams();
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const { data: team } = useSuspenseQuery(publicTeamQueryOptions);
  const { data: active } = useSuspenseQuery(activeListingsQueryOptions);
  const { data: sold } = useSuspenseQuery(recentSoldQueryOptions);
  const teamEnabled = useFeatureFlag("team");
  const l = locale as Locale;

  const scope = teamEnabled ? "pages.about.team" : "pages.about.solo";
  const paragraphs = t(`${scope}.paragraphs`, { returnObjects: true }) as string[];
  const qualifications = teamEnabled
    ? []
    : (t("pages.about.solo.qualifications", { returnObjects: true }) as string[]);

  const name =
    settings.primary_agent_name ?? settings.legal_name ?? settings.site_name;
  const bio = pickLocalized(settings.about_body, l);
  const showTeamGrid = teamEnabled && team.length > 0;

  return (
    <PublicChrome locale={l} settings={settings}>
      <AgentIntro
        locale={l}
        settings={settings}
        name={name}
        bio={bio}
        paragraphs={paragraphs}
        eyebrow={settings.primary_agent_role ?? undefined}
        showSignature={!teamEnabled}
      />

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

      <AgentListings
        locale={l}
        items={active.items}
        settings={settings}
        heading={t(teamEnabled ? "pages.about.our_properties" : "pages.about.my_properties")}
      />

      <SoldStrip locale={l} items={sold.items} settings={settings} />

      <CredibilityBar locale={l} stats={settings.credibility_stats ?? []} settings={settings} />

      <ContactSection settings={settings} />
    </PublicChrome>
  );
}
